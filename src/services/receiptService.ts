import { config } from "../config";
import { OcrService } from "../ocr/ocrService";
import { detectBestOrientation, correctOrientation } from "../image-processing/orientationDetector";
import { generateVariants } from "../image-processing/variants";
import { HandwritingOcrProvider } from "../ocr/handwritingProvider";
import { reconstructLines } from "../receipt-parser/lineReconstructor";
import { classifyLines } from "../receipt-parser/semanticClassifier";
import { parseReceipt } from "../receipt-parser/parser";
import { computeConfidence, needsReview, reconcileArithmetic, validateReceipt } from 
"../validation/validator";
import { validateWithPaddle } from "../validation/paddleValidator";
import { receiptRepository } from "../repositories/receiptRepository";
import { detectQrCodes } from "../utils/qrDetector";
import { withTimeout } from "../utils/timeout";
import { assessQuality } from "../image-processing/qualityGate";
import { detectReceiptBounds } from "../image-processing/boundaryCrop";
import { OcrDocument } from "../models/receipt";

export interface PipelineDebug {
  orientation: { angle: 0 | 90 | 180 | 270; candidates: unknown[] };
  variants: { name: string; operations: string[]; score: number }[];
  selectedVariant: string;
  lineCount: number;
  lines: Array<{ text: string; confidence: number; bbox: unknown; klass?: string }>;
  qrCodes: unknown[];
  rawOcrElements: number;
  handwritingFallback: boolean;
  paddleValidation?: { agreement: number; issues: string[]; adjustment: number } | null;
}

const debugStore = new Map<string, PipelineDebug>();

export function getPipelineDebug(receiptId: string): PipelineDebug | undefined {
  return debugStore.get(receiptId);
}

function isMockDoc(doc: OcrDocument | null): boolean {
  return !!doc && (doc.provider || "").toLowerCase().includes("mock");
}

function scoreDoc(doc: OcrDocument | null): number {
  if (!doc || doc.elements.length === 0 || isMockDoc(doc)) return 0;
  const avg = doc.elements.reduce((a, b) => a + b.confidence, 0) / doc.elements.length;
  const words = doc.elements.filter((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text)).length;
  const nums = (doc.rawText.match(/\d+[.,]?\d*/g) || []).length;
  return doc.elements.length * 0.4 + avg * 10 + words * 0.6 + nums * 0.8;
}

export class ReceiptService {
  private baseOcr = OcrService.create(config.ocr.provider);

  async processReceipt(receiptId: string, imageBuffer: Buffer, forcedProvider?: string): Promise<void> {
    const ocrForThis = forcedProvider ? OcrService.create(forcedProvider) : this.baseOcr;
    receiptRepository.setProcessingStatus(receiptId, "processing", ocrForThis.providerName);
    const debug: PipelineDebug = {
      orientation: { angle: 0, candidates: [] },
      variants: [],
      selectedVariant: "original",
      lineCount: 0,
      lines: [],
      qrCodes: [],
      rawOcrElements: 0,
      handwritingFallback: false,
      paddleValidation: null,
    };
    try {
      const quality = await assessQuality(imageBuffer);
      debugStore.set(receiptId + ":quality", quality as unknown as PipelineDebug);
      const fatal = quality.issues.filter((i) => i.fatal);
      if (!quality.passed) {
        throw new Error(
          "Photo quality too low: " + fatal.map((i) => `${i.message} — ${i.advice}`).join(" ")
        );
      }
      (debug as { qualityScore?: number }).qualityScore = quality.score;
      const qualityWarnings = quality.issues.map((i) => `[Photo] ${i.message} ${i.advice}`);
      const bounds = await detectReceiptBounds(imageBuffer);
      (debug as { receiptBounds?: unknown }).receiptBounds = bounds.bounds;
      const framed = bounds.bounds.cropped ? bounds.buffer : imageBuffer;
      const baseForOrientation = forcedProvider ? OcrService.create(forcedProvider) : OcrService.create(config.ocr.provider);
      const orientation = await detectBestOrientation(framed, baseForOrientation as unknown as import("../ocr/types").OcrProvider);
      debug.orientation = { angle: orientation.angle, candidates: orientation.candidates.map((c) => ({ angle: c.angle, score: c.score, metrics: c.metrics })) };
      const oriented = await correctOrientation(framed, orientation.angle);

      const variants = await generateVariants(oriented);
      const scored: Array<{ variant: (typeof variants)[number]; doc: OcrDocument | null; score: number }> = [];
      const lightProvider = (forcedProvider ? OcrService.create(forcedProvider) : OcrService.create(config.ocr.provider)) as unknown as import("../ocr/types").OcrProvider;
      for (const v of variants) {
        let doc: OcrDocument | null = null;
        try {
          doc = await withTimeout(
            (lightProvider as { processImage: (b: Buffer) => Promise<OcrDocument> }).processImage(v.buffer),
            90000,
            `variant:${v.name}`
          );
        } catch {
          doc = null;
        }
        const s = scoreDoc(doc);
        scored.push({ variant: v, doc, score: s });
        debug.variants.push({ name: v.name, operations: v.operations, score: s });
      }
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      debug.selectedVariant = best?.variant.name || "original";
      let ocrDoc: OcrDocument | null = best?.doc || null;
      let bufferToOcr = best?.variant.buffer || oriented;

      if (!ocrDoc || ocrDoc.elements.length === 0 || isMockDoc(ocrDoc)) {
        ocrDoc = isMockDoc(orientation.bestDoc) ? null : orientation.bestDoc;
        bufferToOcr = oriented;
      }
      if (!ocrDoc) throw new Error("OCR produced no text");

      debug.rawOcrElements = ocrDoc.elements.length;

      const cleanedLines = reconstructLines(ocrDoc.elements);
      const classified = classifyLines(cleanedLines);
      debug.lineCount = classified.length;
      debug.lines = classified.map((l) => ({ text: l.text, confidence: l.confidence, bbox: l.bbox, klass: l.klass }));

      const avgConf = ocrDoc.elements.reduce((a, b) => a + b.confidence, 0) / Math.max(1, ocrDoc.elements.length);
      let finalDoc = ocrDoc;
      if (avgConf < 0.55 || ocrDoc.elements.length < 2) {
        const hw = new HandwritingOcrProvider(this.baseOcr as unknown as import("../ocr/types").OcrProvider);
        const hwDoc = await withTimeout(hw.processImage(bufferToOcr), 90000, "handwriting-fallback");
        const hwAvg = hwDoc.elements.reduce((a, b) => a + b.confidence, 0) / Math.max(1, hwDoc.elements.length);
        if (hwAvg > avgConf) {
          finalDoc = hwDoc;
          debug.handwritingFallback = true;
          const hwLines = reconstructLines(hwDoc.elements);
          const hwClass = classifyLines(hwLines);
          debug.lines = hwClass.map((l) => ({ text: l.text, confidence: l.confidence, bbox: l.bbox, klass: l.klass }));
          debug.rawOcrElements = hwDoc.elements.length;
          debug.lineCount = hwClass.length;
        }
      }

      receiptRepository.saveOcrResult(receiptId, finalDoc);

      const qrCodes = await detectQrCodes(bufferToOcr).catch(() => detectQrCodes(imageBuffer)).catch(() => []);
      debug.qrCodes = qrCodes;

      const parsed = parseReceipt(finalDoc);
      const validation = validateReceipt(parsed);
      validation.warnings.push(...qualityWarnings);
      const recon = reconcileArithmetic(parsed);
      validation.warnings.push(...recon.warnings.map((w) => `[Math] ${w}`));
      validation.confidenceAdjustment += recon.confidenceBoost;
      let paddleValidation: Awaited<ReturnType<typeof validateWithPaddle>> | null = null;
      try {
        paddleValidation = await validateWithPaddle(finalDoc, parsed, bufferToOcr);
        if (paddleValidation) {
          debug.paddleValidation = { agreement: paddleValidation.agreement, issues: paddleValidation.issues, adjustment: paddleValidation.confidenceAdjustment };
          validation.warnings.push(...paddleValidation.issues.map((i) => `[Paddle] ${i}`));
          validation.confidenceAdjustment += paddleValidation.confidenceAdjustment;
        }
      } catch {}
      const confidence = computeConfidence(parsed, validation);
      const review = needsReview(confidence, validation);

      const receipt = receiptRepository.getById(receiptId);
      if (!receipt) throw new Error("Receipt not found during processing");

      receipt.merchantName = parsed.merchant;
      receipt.purchaseDate = parsed.date;
      receipt.purchaseTime = parsed.time;
      receipt.currency = parsed.currency;
      receipt.subtotal = parsed.subtotal;
      receipt.tax = parsed.tax;
      receipt.discount = parsed.discount;
      receipt.total = parsed.total;
      receipt.paymentMethod = parsed.paymentMethod;
      receipt.receiptNumber = parsed.receiptNumber;
      receipt.confidence = confidence;
      receipt.processedImageReference = `processed_${receiptId}_o${orientation.angle}_${debug.selectedVariant}`;

      receiptRepository.setItems(
        receiptId,
        parsed.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          confidence: it.confidence,
          boundingBox: it.boundingBox,
        }))
      );
      receiptRepository.setQrCodes(receiptId, qrCodes);

      const finalStatus = review || validation.errors.length > 0 ? "needs_review" : "completed";
      receiptRepository.setProcessingStatus(receiptId, finalStatus, `${ocrForThis.providerName}+o${orientation.angle}/${debug.selectedVariant}${debug.handwritingFallback ? "+hw" : ""}`);
      receiptRepository.updateReceipt(receiptId, { confidence, status: finalStatus });
      debugStore.set(receiptId, debug);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const code = msg.includes("OCR") ? "OCR_FAILED" : "PARSER_FAILED";
      receiptRepository.setProcessingStatus(receiptId, "failed", ocrForThis.providerName, { code, message: msg });
      debugStore.set(receiptId, debug);
    }
  }
}

export const receiptService = new ReceiptService();
