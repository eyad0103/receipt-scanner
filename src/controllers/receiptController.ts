import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { receiptRepository } from "../repositories/receiptRepository";
import { receiptService } from "../services/receiptService";
import { usageService } from "../services/usageService";
import { validateUpload } from "../image-processing/validator";
import { jobQueue } from "../jobs/queue";
import { Errors } from "../utils/errors";
import { z } from "zod";

jobQueue.register<{ receiptId: string; buffer: Buffer; ocrProvider?: string }>("process_receipt", async ({ receiptId, buffer, ocrProvider }) => {
  await receiptService.processReceipt(receiptId, buffer, ocrProvider);
});

function toApiReceipt(r: NonNullable<ReturnType<typeof receiptRepository.getById>>) {
  return {
    id: r.id,
    merchant: r.merchantName.value,
    merchantConfidence: r.merchantName.confidence,
    date: r.purchaseDate.value,
    dateConfidence: r.purchaseDate.confidence,
    time: r.purchaseTime.value,
    timeConfidence: r.purchaseTime.confidence,
    currency: r.currency,
    subtotal: r.subtotal.value,
    subtotalConfidence: r.subtotal.confidence,
    tax: r.tax.value,
    taxConfidence: r.tax.confidence,
    discount: r.discount.value,
    discountConfidence: r.discount.confidence,
    total: r.total.value,
    totalConfidence: r.total.confidence,
    paymentMethod: r.paymentMethod.value,
    receiptNumber: r.receiptNumber.value,
    status: r.status,
    confidence: r.confidence,
    items: r.items.map((it) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      confidence: it.confidence,
    })),
    qrCodes: r.qrCodes,
    imageReference: r.imageReference,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function q(req: AuthRequest, key: string): string | undefined {
  const v = req.query[key];
  if (Array.isArray(v)) return v[0] as string;
  return v as string | undefined;
}

export async function uploadReceipt(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  usageService.checkQuota(userId);
  const file = (req as unknown as { file?: Express.Multer.File }).file;
  validateUpload(file);
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "uploads");
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  const f = file as Express.Multer.File;
  const ocrProvider = (req.headers["x-ocr-provider"] as string) || (req.headers["X-OCR-Provider"] as string) || undefined;
  const receipt = receiptRepository.createReceipt(userId, f.originalname);
  const ext = path.extname(f.originalname) || ".png";
  const savedPath = path.join(dir, `${receipt.id}${ext}`);
  try { fs.writeFileSync(savedPath, f.buffer); receipt.imageReference = savedPath; receiptRepository.updateReceipt(receipt.id, { imageReference: savedPath } as never); } catch {}
  if (ocrProvider) receiptRepository.updateReceipt(receipt.id, { ocrProvider } as never);
  try {
    const dbPath = path.join(dir, "db.json");
    const entry = { id: receipt.id, userId, originalName: f.originalname, savedPath, size: f.buffer.length, mime: f.mimetype, ocrProvider: ocrProvider||"tesseract", uploadedAt: new Date().toISOString() };
    let arr: unknown[] = [];
    try { arr = JSON.parse(fs.readFileSync(dbPath, "utf8")); } catch {}
    (arr as unknown[]).push(entry);
    fs.writeFileSync(dbPath, JSON.stringify(arr.slice(-1000), null, 2));
  } catch {}
  usageService.recordScan(userId);
  receiptRepository.setProcessingStatus(receipt.id, "processing");
  await jobQueue.add("process_receipt", { receiptId: receipt.id, buffer: (file as Express.Multer.File).buffer, ocrProvider });
  res.status(201).json({ receiptId: receipt.id, status: "processing" });
}

export async function getReceipt(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const receiptId = String(req.params.receiptId);
  const receipt = receiptRepository.getByIdForUser(receiptId, userId);
  if (!receipt) throw Errors.notFound("Receipt not found");
  const processing = receiptRepository.getProcessing(receiptId);
  const ocr = receiptRepository.getOcrByReceiptId(receiptId);
  res.json({
    ...toApiReceipt(receipt),
    processing: processing || null,
    ocr: ocr ? { provider: ocr.provider, rawText: ocr.rawDocument.rawText, elements: ocr.rawDocument.elements } : null,
  });
}

export async function listReceipts(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const page = parseInt(q(req, "page") || "1", 10);
  const limit = parseInt(q(req, "limit") || "20", 10);
  const result = receiptRepository.listForUser(userId, {
    page,
    limit,
    merchant: q(req, "merchant"),
    from: q(req, "from"),
    to: q(req, "to"),
    search: q(req, "search") || q(req, "q"),
    sortBy: q(req, "sortBy") as "createdAt" | "purchaseDate" | "total" | "merchant" | undefined,
    sortOrder: q(req, "sortOrder") as "asc" | "desc" | undefined,
    status: q(req, "status") as unknown as import("../models/receipt").ReceiptStatus | undefined,
  });
  res.json({
    data: result.data.map(toApiReceipt),
    pagination: result.pagination,
  });
}

const patchSchema = z.object({
  merchant: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  currency: z.string().optional(),
  subtotal: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  receiptNumber: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number().nullable().optional(),
        totalPrice: z.number(),
      })
    )
    .optional(),
  status: z.enum(["completed", "needs_review"]).optional(),
});

export async function patchReceipt(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const receiptId = String(req.params.receiptId);
  const receipt = receiptRepository.getByIdForUser(receiptId, userId);
  if (!receipt) throw Errors.notFound("Receipt not found");
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION_FAILED", message: "Invalid body", details: parsed.error.flatten() } });
    return;
  }
  const body = parsed.data;
  if (body.merchant !== undefined) receipt.merchantName = { value: body.merchant, confidence: 1 };
  if (body.date !== undefined) receipt.purchaseDate = { value: body.date, confidence: 1 };
  if (body.time !== undefined) receipt.purchaseTime = { value: body.time, confidence: 1 };
  if (body.currency !== undefined) receipt.currency = body.currency;
  if (body.subtotal !== undefined) receipt.subtotal = { value: body.subtotal, confidence: 1 };
  if (body.tax !== undefined) receipt.tax = { value: body.tax, confidence: 1 };
  if (body.discount !== undefined) receipt.discount = { value: body.discount, confidence: 1 };
  if (body.total !== undefined) receipt.total = { value: body.total, confidence: 1 };
  if (body.paymentMethod !== undefined) receipt.paymentMethod = { value: body.paymentMethod, confidence: 1 };
  if (body.receiptNumber !== undefined) receipt.receiptNumber = { value: body.receiptNumber, confidence: 1 };
  if (body.items !== undefined) {
    receiptRepository.setItems(
      receiptId,
      body.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice ?? null,
        totalPrice: it.totalPrice,
        confidence: 1,
      }))
    );
  }
  const newStatus = body.status || "completed";
  receiptRepository.setProcessingStatus(receiptId, newStatus);
  receiptRepository.updateReceipt(receiptId, { confidence: 1 });
  try {
    const { saveExample } = await import("../training/dataset");
    const ocr = receiptRepository.getOcrByReceiptId(receiptId);
    saveExample({
      id: receiptId,
      ocrText: ocr?.rawDocument.rawText || "",
      ocrElements: (ocr?.rawDocument.elements || []).map((e) => ({ text: e.text, confidence: e.confidence })),
      corrected: {
        merchant: receipt.merchantName.value,
        items: (body.items || receipt.items).map((it: { name: string; quantity: number; totalPrice: number }) => ({ name: it.name, quantity: it.quantity, totalPrice: it.totalPrice })),
        total: receipt.total.value,
      },
      createdAt: new Date().toISOString(),
    });
  } catch {}
  const updated = receiptRepository.getByIdForUser(receiptId, userId)!;
  res.json(toApiReceipt(updated));
}
