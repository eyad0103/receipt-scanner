import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";

export class HandwritingOcrProvider implements OcrProvider {
  readonly name = "handwriting-fallback";
  constructor(private primary: OcrProvider) {}

  async processImage(imageBuffer: Buffer, opts?: { languageHint?: string }): Promise<OcrDocument> {
    const base = await this.primary.processImage(imageBuffer, opts);
    const avgConf = base.elements.length ? base.elements.reduce((a, b) => a + b.confidence, 0) / base.elements.length : 0;
    const hasWords = base.elements.some((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text));
    if (avgConf >= 0.55 && hasWords && base.elements.length >= 2) return base;

    try {
      const mod: unknown = await import("tesseract.js" as string).catch(() => null);
      const J: unknown = (mod as { createWorker?: unknown })?.createWorker || (mod as { default?: unknown });
      const createWorker = (mod as { createWorker?: unknown })?.createWorker || (J as { createWorker?: unknown })?.createWorker;
      if (typeof createWorker !== "function") return base;
      const worker: unknown = await (createWorker as (l: string) => Promise<unknown>)("eng");
      try {
        const w = worker as {
          setParameters?: (p: Record<string, string>) => Promise<void>;
          recognize: (b: Buffer) => Promise<{ data: { text: string; words?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }> } }>;
          terminate: () => Promise<void>;
        };
        if (w.setParameters) {
          try {
            await w.setParameters({ tessedit_pageseg_mode: "1", tessedit_ocr_engine_mode: "1" } as Record<string, string>);
          } catch {}
        }
        const res = await w.recognize(imageBuffer);
        const words = (res.data.words || []) as Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }>;
        if (words.length === 0) return base;
        const elements = words
          .filter((w) => w.text.trim())
          .map((w) => ({
            text: w.text.trim(),
            confidence: Math.max(0, Math.min(1, (w.confidence || 60) / 100)) * 0.9,
            boundingBox: { x: w.bbox.x0, y: w.bbox.y0, width: w.bbox.x1 - w.bbox.x0, height: w.bbox.y1 - w.bbox.y0 },
          }));
        const avgNew = elements.reduce((a, b) => a + b.confidence, 0) / Math.max(1, elements.length);
        if (avgNew > avgConf) {
          return {
            elements,
            rawText: res.data.text,
            provider: this.name,
            processedAt: new Date().toISOString(),
            pageWidth: Math.max(...elements.map((e) => e.boundingBox.x + e.boundingBox.width), 0) + 20,
            pageHeight: Math.max(...elements.map((e) => e.boundingBox.y + e.boundingBox.height), 0) + 20,
          };
        }
        return base;
      } finally {
        try { await (worker as { terminate: () => Promise<void> }).terminate(); } catch {}
      }
    } catch {
      return base;
    }
  }
}
