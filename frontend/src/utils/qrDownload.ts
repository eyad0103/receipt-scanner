// @ts-ignore
import QRCode from "qrcode";

export async function downloadQrValue(value: string, filename = "qr.png"): Promise<void> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, value, { width: 600, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0F172A", light: "#FFFFFF" } } as unknown as Record<string, unknown>);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png", 0.95));
  if (!blob) {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    return;
  }
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as unknown as { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[] }) => Promise<void> };
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid && nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file] } as unknown as { files: File[]; title?: string }); return; } catch {}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  if (isAndroid) {
    setTimeout(() => {
      if (!a.isConnected) return;
      window.open(url, "_blank");
    }, 300);
  }
}

export async function downloadQrCanvasDirect(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
  if (!blob) return;
  const file = new File([blob], filename, { type: "image/png" });
  const nav2 = navigator as unknown as { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[] }) => Promise<void> };
  if (/Android/i.test(navigator.userAgent) && nav2.canShare?.({ files: [file] })) {
    try { await nav2.share?.({ files: [file] } as unknown as { files: File[]; title?: string }); return; } catch {}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
