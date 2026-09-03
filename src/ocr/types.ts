import { BoundingBox, OcrDocument } from "../models/receipt";

export interface OcrProvider {
  readonly name: string;
  processImage(imageBuffer: Buffer, opts?: { languageHint?: string }): Promise<OcrDocument>;
}

export interface OcrProviderExtended extends OcrProvider {
  detectText?(buffer: Buffer): Promise<Array<{ text: string; confidence: number; bbox: BoundingBox }>>;
  getConfidence?(doc: OcrDocument): number;
}

export function createBoundingBox(x: number, y: number, width: number, height: number): BoundingBox {
  return { x, y, width, height };
}

export function avgConfidence(doc: OcrDocument): number {
  if (doc.elements.length === 0) return 0;
  return doc.elements.reduce((a, b) => a + b.confidence, 0) / doc.elements.length;
}
