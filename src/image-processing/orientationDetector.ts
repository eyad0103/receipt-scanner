import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "../ocr/types";
import { downscaleForOcr } from "./variants";
import { withTimeout } from "../utils/timeout";

export interface OrientationCandidate {
  angle: 0 | 90 | 180 | 270;
  score: number;
  doc: OcrDocument | null;
  metrics: {
    regions: number;
    avgConfidence: number;
    wordCount: number;
    numericTokens: number;
    spatialConsistency: number;
  };
}

function scoreDocument(doc: OcrDocument | null): number {
  if (!doc || doc.elements.length === 0) return 0;
  const regions = doc.elements.length;
  const avgConf = doc.elements.reduce((a, b) => a + b.confidence, 0) / regions;
  const wordCount = doc.elements.filter((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text)).length;
  const numericTokens = (doc.rawText.match(/\d+[.,]?\d*/g) || []).length;
  const yVals = doc.elements.map((e) => e.boundingBox.y + e.boundingBox.height / 2);
  const sorted = [...yVals].sort((a, b) => a - b);
  let gaps = 0;
  for (let i = 1; i < sorted.length; i++) gaps += sorted[i] - sorted[i - 1];
  const avgGap = gaps / Math.max(1, sorted.length - 1);
  const spatialConsistency = avgGap > 5 && avgGap < 200 ? 1 : 0.5;
  return regions * 0.3 + avgConf * 10 + wordCount * 0.5 + numericTokens * 0.7 + spatialConsistency * 2;
}

async function rotateBuffer(buffer: Buffer, angle: 0 | 90 | 180 | 270): Promise<Buffer> {
  if (angle === 0) return buffer;
  try {
    const mod: unknown = await import("jimp" as string).catch(() => null);
    const Jimp: unknown = (mod as { default?: unknown; Jimp?: unknown })?.default || (mod as { Jimp?: unknown })?.Jimp || mod;
    const J: unknown = Jimp as { read: (b: Buffer) => Promise<{ rotate: (a: number) => void; getBufferAsync: (m: string) => Promise<Buffer>; bitmap: { width: number; height: number } }> };
    if (!J || typeof (J as { read?: unknown }).read !== "function") return buffer;
    const img = await (J as { read: (b: Buffer) => Promise<{ rotate: (a: number) => void; getBufferAsync: (m: string) => Promise<Buffer> }> }).read(buffer);
    (img as { rotate: (a: number) => void }).rotate(angle);
    const mime = ((J as { MIME_JPEG?: string }).MIME_JPEG as string) || "image/jpeg";
    return await (img as { getBufferAsync: (m: string) => Promise<Buffer> }).getBufferAsync(mime);
  } catch {
    return buffer;
  }
}

export async function detectBestOrientation(
  original: Buffer,
  provider: OcrProvider,
  opts?: { languageHint?: string }
): Promise<{ angle: 0 | 90 | 180 | 270; candidates: OrientationCandidate[]; bestDoc: OcrDocument | null }> {
  const angles: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
  const candidates: OrientationCandidate[] = [];
  const small = await downscaleForOcr(original, 1200);
  for (const angle of angles) {
    const rotated = await rotateBuffer(small, angle);
    let doc: OcrDocument | null = null;
    try {
      doc = await withTimeout(provider.processImage(rotated, opts), 45000, `orientation@${angle}`);
    } catch {
      doc = null;
    }
    const metrics = doc
      ? {
          regions: doc.elements.length,
          avgConfidence: doc.elements.length ? doc.elements.reduce((a, b) => a + b.confidence, 0) / doc.elements.length : 0,
          wordCount: doc.elements.filter((e) => /[A-Za-z\u0600-\u06FF]{2,}/.test(e.text)).length,
          numericTokens: (doc.rawText.match(/\d+[.,]?\d*/g) || []).length,
          spatialConsistency: 0,
        }
      : { regions: 0, avgConfidence: 0, wordCount: 0, numericTokens: 0, spatialConsistency: 0 };
    if (doc) {
      const yVals = doc.elements.map((e) => e.boundingBox.y + e.boundingBox.height / 2);
      const sorted = [...yVals].sort((a, b) => a - b);
      let gaps = 0;
      for (let i = 1; i < sorted.length; i++) gaps += sorted[i] - sorted[i - 1];
      const avgGap = gaps / Math.max(1, sorted.length - 1);
      metrics.spatialConsistency = avgGap > 5 && avgGap < 200 ? 1 : 0.5;
    }
    const score = scoreDocument(doc);
    candidates.push({ angle, score, doc, metrics });
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (best.score < 1.5 && candidates.some((c) => c.angle === 0)) {
    const zero = candidates.find((c) => c.angle === 0)!;
    return { angle: zero.angle, candidates, bestDoc: zero.doc };
  }
  return { angle: best.angle, candidates, bestDoc: best.doc };
}

export async function correctOrientation(buffer: Buffer, angle: 0 | 90 | 180 | 270): Promise<Buffer> {
  return rotateBuffer(buffer, angle);
}
