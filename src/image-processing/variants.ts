import { PreprocessResult } from "./preprocessor";

export type VariantName = "original" | "enhanced" | "grayscale" | "thresholded";

export interface Variant {
  name: VariantName;
  buffer: Buffer;
  operations: string[];
}

async function applyJimpVariant(
  buffer: Buffer,
  ops: (img: unknown) => void
): Promise<Buffer | null> {
  try {
    const mod: unknown = await import("jimp" as string).catch(() => null);
    const Jimp: unknown = (mod as { default?: unknown; Jimp?: unknown })?.default || (mod as { Jimp?: unknown })?.Jimp || mod;
    if (!Jimp || typeof (Jimp as { read?: unknown }).read !== "function") return null;
    const J = Jimp as { read: (b: Buffer) => Promise<unknown>; MIME_JPEG?: string };
    const img: unknown = await J.read(buffer);
    ops(img);
    const mime = J.MIME_JPEG || "image/jpeg";
    const out = await (img as { getBufferAsync: (m: string) => Promise<Buffer> }).getBufferAsync(mime);
    return out;
  } catch {
    return null;
  }
}

export async function generateVariants(base: Buffer): Promise<Variant[]> {
  const variants: Variant[] = [{ name: "original", buffer: base, operations: ["original"] }];

  const enhanced = await applyJimpVariant(base, (img: unknown) => {
    const im = img as {
      grayscale?: () => void;
      greyscale?: () => void;
      contrast: (n: number) => void;
      normalize: () => void;
      convolute?: (k: number[][]) => void;
      brightness?: (n: number) => void;
      resize?: (o: { w: number; h: number }) => void;
      bitmap: { width: number; height: number };
    };
    try {
      if (im.grayscale) im.grayscale();
      else if (im.greyscale) im.greyscale();
    } catch {}
    try { im.contrast(0.18); } catch {}
    try { if (im.normalize) im.normalize(); } catch {}
    try {
      if (im.convolute) im.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]);
    } catch {}
    try {
      if (im.bitmap.width < 1600) {
        const ratio = 1600 / im.bitmap.width;
        im.resize?.({ w: 1600, h: Math.round(im.bitmap.height * ratio) });
      }
    } catch {}
  });
  if (enhanced) variants.push({ name: "enhanced", buffer: enhanced, operations: ["grayscale", "contrast", "normalize", "sharpen", "resize"] });

  const grayscale = await applyJimpVariant(base, (img: unknown) => {
    const im = img as { grayscale?: () => void; greyscale?: () => void };
    try { if (im.grayscale) im.grayscale(); else if (im.greyscale) im.greyscale(); } catch {}
  });
  if (grayscale) variants.push({ name: "grayscale", buffer: grayscale, operations: ["grayscale"] });

  const thresholded = await applyJimpVariant(base, (img: unknown) => {
    const im = img as { grayscale?: () => void; greyscale?: () => void; threshold?: (o: unknown) => void };
    try { if (im.grayscale) im.grayscale(); else if (im.greyscale) im.greyscale(); } catch {}
    try { im.threshold?.({ max: 140, replace: 255, autoGreyscale: false }); } catch {}
  });
  if (thresholded) variants.push({ name: "thresholded", buffer: thresholded, operations: ["grayscale", "threshold"] });

  return variants;
}

export function pickBestVariant(
  scored: Array<{ variant: Variant; doc: import("../models/receipt").OcrDocument | null; score: number }>
): Variant | null {
  if (scored.length === 0) return null;
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  return sorted[0].variant;
}
