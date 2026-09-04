// Filter/PSM study: which ops help tesseract, which hurt. Scores recall vs clean baseline.
// Usage: node scripts/filter-study.mjs
import fs from "fs";
import path from "path";

const Jmod = await import("jimp").catch(() => ({}));
const J = Jmod?.Jimp || Jmod?.default || Jmod;
const { createWorker } = await import("tesseract.js").catch(() => ({}));

const upDir = path.join(process.cwd(), "uploads");
const imgs = fs.readdirSync(upDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .map((f) => ({ f, t: fs.statSync(path.join(upDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);
const picks = [];
for (const s of ["1696489f", "f95afe54", "e4073e48", "d86346ae"]) {
  const hit = imgs.find((x) => x.f.includes(s));
  if (hit && !picks.includes(hit.f)) picks.push(hit.f);
}
while (picks.length < 4 && picks.length < imgs.length) { const c = imgs[picks.length].f; if (!picks.includes(c)) picks.push(c); }

const FILTERS = {
  none: async (img) => img,
  gray: async (img) => img.grayscale(),
  contrast02: async (img) => img.contrast(0.2),
  contrast04: async (img) => img.contrast(0.4),
  normalize: async (img) => img.normalize(),
  sharpen: async (img) => img.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]),
  blur1: async (img) => (img.blur ? img.blur(1) : img),
  thresh140: async (img) => { img.grayscale(); img.threshold({ max: 140, replace: 255, autoGreyscale: false }); },
  invert: async (img) => img.invert(),
  scale15: async (img) => img.resize({ w: Math.round(img.bitmap.width * 1.5), h: Math.round(img.bitmap.height * 1.5) }),
  gray_contrast_norm_sharp: async (img) => { img.grayscale(); img.contrast(0.18); img.normalize(); img.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]); },
  bright_norm: async (img) => { img.brightness(0.15); img.normalize(); },
};
const PSMS = [3, 4, 6, 11, 12];
const toks = (s) => s.toLowerCase().split(/[^a-z0-9\u0600-\u06ff]+/).filter((t) => t.length > 1);

async function ocr(buf, psm) {
  const worker = await createWorker("eng+ara");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: String(psm), preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(buf);
    return data.text || "";
  } finally { try { await worker.terminate(); } catch {} }
}

for (const f of picks) {
  const buf = fs.readFileSync(path.join(upDir, f));
  const baseText = await ocr(buf, 6).catch(() => "");
  const base = new Set(toks(baseText));
  console.log(`\n== ${f} (baseline ${base.size} tokens, PSM6-none) ==`);
  const fres = {};
  for (const [name, fn] of Object.entries(FILTERS)) {
    try {
      const img = await J.read(buf);
      await fn(img);
      const out = await img.getBuffer("image/png");
      const text = await ocr(out, 6);
      const ts = new Set(toks(text));
      let hit = 0; for (const t of base) if (ts.has(t)) hit++;
      fres[name] = base.size ? Math.round((hit / base.size) * 100) : 0;
    } catch { fres[name] = "ERR"; }
  }
  console.log("filters:", JSON.stringify(fres));
  const pres = {};
  for (const psm of PSMS) {
    try {
      const text = await ocr(buf, psm);
      const ts = new Set(toks(text));
      let hit = 0; for (const t of base) if (ts.has(t)) hit++;
      pres["psm" + psm] = (base.size ? Math.round((hit / base.size) * 100) : 0) + `|${toks(text).length}tok`;
    } catch { pres["psm" + psm] = "ERR"; }
  }
  console.log("psms:", JSON.stringify(pres));
}
