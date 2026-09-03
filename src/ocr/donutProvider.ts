import { OcrDocument, OcrElement } from "../models/receipt";
import { OcrProvider } from "./types";

export class DonutProvider implements OcrProvider {
  readonly name = "donut";

  async processImage(imageBuffer: Buffer, _opts?: { languageHint?: string }): Promise<OcrDocument> {
    if (!imageBuffer || imageBuffer.length === 0) throw new Error("Empty buffer");
    const mod: unknown = await import("@xenova/transformers" as string).catch(() => null);
    if (!mod || !(mod as { DonutProcessor?: unknown }).DonutProcessor) throw new Error("Donut not installed — run: npm i @xenova/transformers and download naver-clova-ix/donut-base-finetuned-cord-v2. No fallback in test mode.");
    const { DonutProcessor, DonutForConditionalGeneration } = mod as {
      DonutProcessor: { from_pretrained: (m: string) => Promise<{ (img: unknown): Promise<unknown> }> };
      DonutForConditionalGeneration: { from_pretrained: (m: string) => Promise<{ generate: (o: unknown) => Promise<unknown> }> };
    };
    const processor = await DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2");
    const model = await DonutForConditionalGeneration.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2");
    const jimpMod: unknown = await import("jimp" as string).catch(() => null);
    const Jimp: unknown = (jimpMod as { Jimp?: unknown }).Jimp || (jimpMod as { default?: unknown }).default || jimpMod;
    const img = await (Jimp as { read: (b: Buffer) => Promise<{ bitmap: { width: number; height: number } }> }).read(imageBuffer);
    const inputs = await (processor as unknown as (img: unknown) => Promise<unknown>)(img);
    const outputs = await (model as unknown as { generate: (o: unknown) => Promise<unknown> }).generate(inputs);
    const text = String(outputs || "");
    if (!text.trim()) throw new Error("Donut returned empty");
    const lines = text.split("\n").filter(Boolean);
    const elements: OcrElement[] = lines.map((line: string, idx: number) => ({
      text: line.trim(),
      confidence: 0.92,
      boundingBox: { x: 20, y: 40 + idx * 26, width: 600, height: 22 },
    }));
    return {
      elements,
      rawText: text,
      provider: this.name,
      processedAt: new Date().toISOString(),
      pageWidth: 640,
      pageHeight: 40 + lines.length * 26 + 20,
    };
  }
}
