// Noise-robustness harness: OCR uploads clean vs noised, report recall.
// Usage: node scripts/noise-test.mjs [maxImages]
import fs from "fs";
import path from "path";

const MAXIMG = parseInt(process.argv[2] || "4", 10) || 4;
const upDir = path.join(process.cwd(), "uploads");
const imgs = fs.readdirSync(upDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .map((f) => ({ f, t: fs.statSync(path.join(upDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t).slice(0, MAXIMG).map((x) => x.f);

const Jmod = await import("jimp").catch(() => ({}));
const J = Jmod?.Jimp || Jmod?.default || Jmod;
async function variant(buf, name) {
  try {
    const img = await J.read(buf);
    if (name === "rotate3") img.rotate(3);
    else if (name === "rotatem3") img.rotate(-3);
    else if (name === "small") img.resize({ w: Math.round(img.bitmap.width * 0.7), h: Math.round(img.bitmap.height * 0.7) });
    else if (name === "dark") img.brightness(-0.25);
    else if (name === "bright") img.brightness(0.25);
    else if (name === "blur") { if (img.blur) img.blur(1); else if (img.gaussian) img.gaussian(1); }
    else if (name === "contrast") img.contrast(0.4);
    else if (name === "jpeg") img.quality(40);
    return await img.getBuffer("image/jpeg");
  } catch (e) { return null; }
}

const { OcrService } = await import("../dist/ocr/ocrService.js");
const toks = (s) => s.toLowerCase().split(/[^a-z0-9\u0600-\u06ff]+/).filter((t) => t.length > 1);
for (const f of imgs) {
  const buf = fs.readFileSync(path.join(upDir, f));
  let base = null;
  try { base = new Set(toks((await OcrService.create("tesseract").processImage(buf)).rawText)); }
  catch (e) { console.log(`${f}: clean OCR failed (${e.message.slice(0, 60)}), skip`); continue; }
  console.log(`\n== ${f} (${buf.length}B, ${base.size} clean tokens) ==`);
  for (const v of ["rotate3", "rotatem3", "small", "dark", "bright", "blur", "contrast", "jpeg"]) {
    const vb = await variant(buf, v);
    if (!vb) { console.log(`  ${v}: variant failed`); continue; }
    try {
      const r = await OcrService.create("tesseract").processImage(vb);
      const ts = new Set(toks(r.rawText));
      let hit = 0; for (const t of base) if (ts.has(t)) hit++;
      console.log(`  ${v}: recall ${base.size ? Math.round((hit / base.size) * 100) : 0}% (${hit}/${base.size})`);
    } catch (e) { console.log(`  ${v}: OCR failed`); }
  }
}
