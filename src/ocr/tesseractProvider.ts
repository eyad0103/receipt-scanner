import { OcrDocument, OcrElement } from "../models/receipt";
import { OcrProvider } from "./types";
import { MockOcrProvider } from "./mockProvider";

type TesseractWord = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

type TesseractData = {
  text: string;
  words?: TesseractWord[];
  lines?: unknown;
  confidence?: number;
};

function mapWordsToElements(words: TesseractWord[]): OcrElement[] {
  return words
    .filter((w) => w.text && w.text.trim().length > 0)
    .map((w) => ({
      text: w.text.trim(),
      confidence: Math.max(0, Math.min(1, (w.confidence ?? 80) / 100)),
      boundingBox: {
        x: w.bbox.x0,
        y: w.bbox.y0,
        width: Math.max(1, w.bbox.x1 - w.bbox.x0),
        height: Math.max(1, w.bbox.y1 - w.bbox.y0),
      },
    }));
}

function fallbackToLines(text: string): OcrElement[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line, idx) => ({
    text: line,
    confidence: 0.85,
    boundingBox: { x: 20, y: 40 + idx * 32, width: 600, height: 28 },
  }));
}

export class TesseractOcrProvider implements OcrProvider {
  readonly name = "tesseract";
  private fallback = new MockOcrProvider();

  async processImage(imageBuffer: Buffer, opts?: { languageHint?: string }): Promise<OcrDocument> {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Empty image buffer");
    }
    const langs = opts?.languageHint || "eng+ara";
    try {
      const mod: any = await import("tesseract.js" as string).catch(() => null);
      if (!mod) {
        // eslint-disable-next-line no-console
        console.warn("[tesseract] tesseract.js not installed, falling back to mock");
        return this.fallback.processImage(imageBuffer, opts);
      }
      const createWorker: any =
        mod.createWorker || mod.default?.createWorker || mod.default;
      if (typeof createWorker !== "function") {
        console.warn("[tesseract] createWorker not found, falling back to mock");
        return this.fallback.processImage(imageBuffer, opts);
      }

      let worker: any = null;
      try {
        try {
          worker = await createWorker(langs);
        } catch {
          worker = await createWorker("eng+ara");
        }

        if (worker.load && worker.loadLanguage && worker.initialize) {
          await worker.load();
          await worker.loadLanguage(langs);
          await worker.initialize(langs);
        } else if (worker.loadLanguage && worker.initialize) {
          await worker.loadLanguage(langs);
          await worker.initialize(langs);
        }

        if (worker.setParameters) {
          try {
            await worker.setParameters({
              tessedit_pageseg_mode: "6",
              preserve_interword_spaces: "1",
              tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-: EGP$€£",
            });
          } catch {}
        }

        const result = await worker.recognize(imageBuffer);
        const data: TesseractData = result?.data || result || {};

        let elements: OcrElement[] = [];
        if (Array.isArray(data.words) && data.words.length > 0) {
          elements = mapWordsToElements(data.words as TesseractWord[]);
        } else if (data.text) {
          elements = fallbackToLines(String(data.text));
        }

        if (elements.length === 0 && data.text) {
          elements = fallbackToLines(String(data.text));
        }

        if (elements.length === 0) {
          console.warn("[tesseract] no elements detected, falling back to mock");
          return this.fallback.processImage(imageBuffer, opts);
        }

        const rawText: string = typeof data.text === "string" ? data.text : elements.map((e) => e.text).join("\n");

        let pageWidth: number | undefined;
        let pageHeight: number | undefined;
        if (elements.length > 0) {
          const maxX = Math.max(...elements.map((e) => e.boundingBox.x + e.boundingBox.width));
          const maxY = Math.max(...elements.map((e) => e.boundingBox.y + e.boundingBox.height));
          pageWidth = maxX + 20;
          pageHeight = maxY + 20;
        }

        return {
          elements,
          rawText,
          provider: this.name,
          processedAt: new Date().toISOString(),
          pageWidth,
          pageHeight,
        };
      } finally {
        if (worker) {
          try {
            await worker.terminate();
          } catch {}
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[tesseract] OCR failed (${msg}), falling back to mock`);
      return this.fallback.processImage(imageBuffer, opts);
    }
  }
}
