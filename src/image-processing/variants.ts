import { PreprocessResult } from "./preprocessor";

export type VariantName = "original" | "enhanced" | "grayscale" | "thresholded";

export interface Variant {
  name: VariantName;
  buffer: Buffer;
  operations: string[];
}

async function applyJimpVariant(
  buffer: Buffer,
  ops: (img: JimpImage) => void
): Promise<Buffer | null> {
  try {
    const J = await loadJimp();
    if (!J) return null;
    const img = await J.read(buffer);
    ops(img);
    return await encodeJimp(J, img);
  } catch {
    return null;
  }
}

interface JimpImage {
  bitmap: { width: number; height: number };
  composite: (s: unknown, x: number, y: number) => void;
  resize?: (o: { w: number; h: number }) => void;
  greyscale?: () => void;
  normalize?: () => void;
  contrast?: (n: number) => void;
  brightness?: (n: number) => void;
  getBufferAsync?: (mime: string) => Promise<Buffer>;
  getBuffer?: (mime: string) => Promise<Buffer> | void;
}

interface JimpCtor {
  read: (b: Buffer) => Promise<JimpImage>;
  MIME_JPEG?: string;
  new (o: { width: number; height: number; color: number }): JimpImage;
}

export async function loadJimp(): Promise<JimpCtor | null> {
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

export async function encodeJimp(J: JimpCtor, img: JimpImage): Promise<Buffer | null> {
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

export async function normalizeDarkImage(buffer: Buffer): Promise<{ buffer: Buffer; brightened: boolean }> {
  try {
    const J = await loadJimp();
    if (!J) return { buffer, brightened: false };
    const src = await J.read(buffer);
    const w = src.bitmap.width, h = src.bitmap.height;
    const data = (src.bitmap as unknown as { data: Uint8Array }).data;
    const step = Math.max(1, Math.floor((w * h) / 20000));
    let sum = 0, n = 0;
    for (let i = 0; i < w * h; i += step) {
      const o = i * 4;
      sum += 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
      n++;
    }
    const mean = sum / Math.max(1, n);
    if (mean >= 100) return { buffer, brightened: false };
    const amt = Math.min(0.6, (100 - mean) / 100 + 0.15);
    (src as unknown as { brightness?: (n: number) => void }).brightness?.(amt);
    const out = await encodeJimp(J, src);
    return out ? { buffer: out, brightened: true } : { buffer, brightened: false };
  } catch {
    return { buffer, brightened: false };
  }
}

export async function generateVariants(base: Buffer): Promise<Variant[]> {
  const norm = await normalizeDarkImage(base);
  const padded = await padWhiteMargin(norm.buffer);
  const src = padded || norm.buffer;
  const padOps = [...(norm.brightened ? ["auto_brighten"] : []), ...(padded ? ["white_margin"] : [])];
  const variants: Variant[] = [{ name: "original", buffer: src, operations: [...padOps, "original"] }];

  const normalized = await applyJimpVariant(src, (img) => {
    try { img.normalize?.(); } catch {}
  });
  if (normalized) variants.push({ name: "enhanced", buffer: normalized, operations: [...padOps, "normalize"] });

  const grayNorm = await applyJimpVariant(src, (img) => {
    try { img.greyscale?.(); } catch {}
    try { img.normalize?.(); } catch {}
  });
  if (grayNorm) variants.push({ name: "grayscale", buffer: grayNorm, operations: [...padOps, "greyscale", "normalize"] });

  const gentle = await applyJimpVariant(src, (img) => {
    try { img.greyscale?.(); } catch {}
    try { img.contrast?.(0.1); } catch {}
    try { img.normalize?.(); } catch {}
    try {
      if (img.bitmap.width < 800) {
        const ratio = 1200 / img.bitmap.width;
        img.resize?.({ w: 1200, h: Math.round(img.bitmap.height * ratio) });
      }
    } catch {}
  });
  if (gentle) variants.push({ name: "thresholded", buffer: gentle, operations: [...padOps, "greyscale", "contrast", "normalize", "resize-if-small"] });

  return variants;
}

export function pickBestVariant(
  scored: Array<{ variant: Variant; doc: import("../models/receipt").OcrDocument | null; score: number }>
): Variant | null {
  if (scored.length === 0) return null;
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  return sorted[0].variant;
}
