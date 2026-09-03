import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";
import { MockOcrProvider } from "./mockProvider";
import { TesseractOcrProvider } from "./tesseractProvider";
import { PaddleOcrProvider } from "./paddleProvider";
import { DonutProvider } from "./donutProvider";
import { ChandraProvider } from "./chandraProvider";
import { config } from "../config";

export class OcrService {
  constructor(private provider: OcrProvider) {}

  get providerName(): string {
    return this.provider.name;
  }

  async processImage(imageBuffer: Buffer): Promise<OcrDocument> {
    const primary = this.provider.name;
    try {
      return await this.provider.processImage(imageBuffer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[ocrService] provider ${primary} failed: ${msg}, trying fallback`);
      if (primary !== "mock") {
        const fallback = new MockOcrProvider();
        try {
          const fb = await fallback.processImage(imageBuffer);
          return { ...fb, provider: `${primary}+mock-fallback` };
        } catch {}
      }
      throw e;
    }
  }

  static create(providerName?: string): OcrService {
    const name = providerName || (config as { ocr?: { provider?: string } }).ocr?.provider || "tesseract";
    let provider: OcrProvider;
    switch (name) {
      case "chandra":
        provider = new ChandraProvider();
        break;
      case "donut":
        provider = new DonutProvider();
        break;
      case "paddle":
        provider = new PaddleOcrProvider();
        break;
      case "tesseract":
        provider = new TesseractOcrProvider();
        break;
      case "mock":
        provider = new MockOcrProvider();
        break;
      default:
        provider = new TesseractOcrProvider();
        break;
    }
    return new OcrService(provider);
  }
}
