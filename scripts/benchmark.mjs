// Real-data benchmark: replay data/verified.json through parseReceipt, score vs corrections.
// Usage: node scripts/benchmark.mjs [maxN]
import fs from "fs";
import path from "path";

const MAXN = parseInt(process.argv[2] || "2000", 10) || 2000;
const all = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "verified.json"), "utf8"));
const { parseReceipt } = await import("../dist/receipt-parser/parser.js");
const { areProductsSimilar } = await import("../dist/utils/normalize.js");

const sample = all.slice(-MAXN);
let mT = 0, mH = 0, iT = 0, iH = 0, pH = 0, tT = 0, tH = 0, qH = 0;
for (const ex of sample) {
  const lines = (ex.ocrText || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const els = lines
    .map((t, i) => ({ text: t, confidence: 0.85, boundingBox: { x: 20, y: 40 + i * 30, width: 600, height: 24 } }));
  const doc = { elements: els, rawText: lines.join("\n"), provider: "bench", processedAt: new Date().toISOString(), pageWidth: 640, pageHeight: 40 + els.length * 30 + 20 };
  let parsed;
  try { parsed = parseReceipt(doc); } catch { continue; }
  const c = ex.corrected || {};
  if (c.merchant) {
    mT++;
    const pm = (parsed.merchant?.value || "").toLowerCase().trim();
    if (pm === c.merchant.toLowerCase().trim()) mH++;
  }
  const gtItems = c.items || [];
  const lev = (a, b) => {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  };
  for (const g of gtItems) {
    iT++;
    const hit = (parsed.items || []).find((p) => areProductsSimilar(p.name, g.name) || lev(p.name.toLowerCase(), g.name.toLowerCase()) <= 2);
    if (hit) {
      iH++;
      if (Math.abs(hit.totalPrice - g.totalPrice) < 0.015 + 0.02 * Math.abs(g.totalPrice)) pH++;
      if (hit.quantity === g.quantity) qH++;
    }
  }
  if (c.total !== null && c.total !== undefined) {
    tT++;
    const pt = parsed.total?.value;
    if (pt !== null && pt !== undefined && Math.abs(pt - c.total) < 0.015 + 0.02 * Math.abs(c.total)) tH++;
  }
}
const pct = (h, t) => (t ? Math.round((h / t) * 1000) / 10 + `% (${h}/${t})` : "n/a");
console.log(`n=${sample.length}`);
console.log("Merchant  ", pct(mH, mT));
console.log("Items     ", pct(iH, iT));
console.log("Quantities", pct(qH, iT));
console.log("Prices    ", pct(pH, iT));
console.log("Total     ", pct(tH, tT));
