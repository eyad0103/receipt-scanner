import { QrCodeResult } from "../models/receipt";

export async function detectQrCodes(imageBuffer: Buffer): Promise<QrCodeResult[]> {
  if (!imageBuffer || imageBuffer.length < 10) return [];
  try {
    const jimpMod: any = await import("jimp" as string).catch(() => null);
    const Jimp: any = jimpMod?.default || jimpMod?.Jimp || jimpMod;
    if (!Jimp || typeof Jimp.read !== "function") return [];

    const qrMod: any = await import("qrcode-reader" as string).catch(() => null);
    const QrCode: any = qrMod?.default || qrMod;
    if (!QrCode) return [];

    const image: any = await Jimp.read(imageBuffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    try {
      if (typeof image.grayscale === "function") image.grayscale();
      else if (typeof image.greyscale === "function") image.greyscale();
    } catch {}

    const qr = new QrCode();
    const result: QrCodeResult[] = await new Promise((resolve) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve([]);
        }
      }, 3000);
      qr.callback = (err: any, value: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (err || !value || !value.result) {
          resolve([]);
          return;
        }
        const res: QrCodeResult = {
          type: "qr",
          value: String(value.result),
          confidence: 0.95,
          boundingBox: { x: 0, y: 0, width, height },
        };
        resolve([res]);
      };
      try {
        qr.decode(image.bitmap);
      } catch {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve([]);
        }
      }
    });

    return result;
  } catch {
    return [];
  }
}
