import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  const clean = (obj: unknown): unknown => {
    if (typeof obj === "string") return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 10000);
    if (Array.isArray(obj)) return obj.map(clean);
    if (obj && typeof obj === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (k.startsWith("__") || k.includes("$")) continue;
        out[k.slice(0, 100)] = clean(v);
      }
      return out;
    }
    return obj;
  };
  if (req.body) req.body = clean(req.body) as typeof req.body;
  if (req.query && typeof req.query === "object") {
    for (const k of Object.keys(req.query as Record<string, unknown>)) {
      if (k.startsWith("__") || k.includes("$")) delete (req.query as Record<string, unknown>)[k];
      else {
        const v = (req.query as Record<string, unknown>)[k];
        if (typeof v === "string") (req.query as Record<string, unknown>)[k] = v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 200);
      }
    }
  }
  next();
}

export function noCache(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "no-store");
  next();
}

export function validateReceiptId(req: Request, _res: Response, next: NextFunction): void {
  const raw = req.params.receiptId;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (id && !/^rcpt_[a-z0-9]{6,12}$/.test(String(id))) {
    next(new AppError("NOT_FOUND", "Receipt not found", 404));
    return;
  }
  next();
}
