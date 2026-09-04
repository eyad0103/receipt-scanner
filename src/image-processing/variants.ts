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

interface JimpImage {
  bitmap: { width: number; height: number };
  composite: (s: unknown, x: number, y: number) => void;
  resize?: (o: { w: number; h: number }) => void;
  getBufferAsync?: (mime: string) => Promise<Buffer>;
  getBuffer?: (mime: string) => Promise<Buffer> | void;
}

interface JimpCtor {
  read: (b: Buffer) => Promise<JimpImage>;
  MIME_JPEG?: string;
  new (o: { width: number; height: number; color: number }): JimpImage;
}

async function loadJimp(): Promise<JimpCtor | null> {
  try {
    const mod: unknown = await import("jimp" as string).catch(() => null);
    const mm = mod as { default?: unknown; Jimp?: unknown };
    const ctor = (mm?.Jimp || mm?.default || mod) as JimpCtor;
    if (typeof ctor !== "function" || typeof ctor.read !== "function") return null;
    return ctor;
  } catch {
    return null;
  }
}

async function encodeJimp(J: JimpCtor, img: JimpImage): Promise<Buffer | null> {
  try {
    const mime = J.MIME_JPEG || "image/jpeg";
    if (typeof img.getBufferAsync === "function") return await img.getBufferAsync(mime);
    if (typeof img.getBuffer === "function") {
      const out = (await img.getBuffer(mime)) as unknown;
      if (out && typeof (out as Promise<Buffer>).then === "function") return (await out) as Buffer;
      if (Buffer.isBuffer(out)) return out as Buffer;
    }
    return null;
  } catch {
    return null;
  }
}

export async function downscaleForOcr(buffer: Buffer, maxDim = 1400): Promise<Buffer> {
  try {
    const J = await loadJimp();
    if (!J) return buffer;
    const src = await J.read(buffer);
    const w = src.bitmap.width, h = src.bitmap.height;
    const m = Math.max(w, h);
    if (!m || m <= maxDim) return buffer;
    const ratio = maxDim / m;
    src.resize?.({ w: Math.round(w * ratio), h: Math.round(h * ratio) });
    return (await encodeJimp(J, src)) || buffer;
  } catch {
    return buffer;
  }
}

export async function padWhiteMargin(buffer: Buffer, ratio = 0.06): Promise<Buffer | null> {
  try {
    const J = await loadJimp();
    if (!J) return null;
    const src = await J.read(buffer);
    const w = src.bitmap.width, h = src.bitmap.height;
    if (!w || !h) return null;
    const m = Math.max(20, Math.round(Math.min(w, h) * ratio));
    const canvas = new J({ width: w + 2 * m, height: h + 2 * m, color: 0xffffffff });
    canvas.composite(src, m, m);
    return await encodeJimp(J, canvas);
  } catch {
    return null;
  }
}

export async function generateVariants(base: Buffer): Promise<Variant[]> {
  const padded = await padWhiteMargin(base);
  const src = padded || base;
  const padOps = padded ? ["white_margin"] : [];
  const variants: Variant[] = [{ name: "original", buffer: src, operations: [...padOps, "original"] }];

  const enhanced = await applyJimpVariant(src, (img: unknown) => {
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

  const grayscale = await applyJimpVariant(src, (img: unknown) => {
    const im = img as { grayscale?: () => void; greyscale?: () => void };
    try { if (im.grayscale) im.grayscale(); else if (im.greyscale) im.greyscale(); } catch {}
  });
  if (grayscale) variants.push({ name: "grayscale", buffer: grayscale, operations: ["grayscale"] });

  const thresholded = await applyJimpVariant(src, (img: unknown) => {
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
