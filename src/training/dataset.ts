import fs from "fs";
import path from "path";

export interface VerifiedExample {
  id: string;
  ocrText: string;
  ocrElements: Array<{ text: string; confidence: number }>;
  corrected: {
    merchant: string | null;
    items: Array<{ name: string; quantity: number; totalPrice: number }>;
    total: number | null;
  };
  createdAt: string;
}

const DATA_PATH = path.join(process.cwd(), "data", "verified.json");

function ensureDir() {
  try { fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); } catch {}
}

export function loadDataset(): VerifiedExample[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch { return []; }
}

export function saveExample(ex: VerifiedExample): void {
  ensureDir();
  const all = loadDataset();
  all.push(ex);
  fs.writeFileSync(DATA_PATH, JSON.stringify(all.slice(-500), null, 2));
}

export function getProductDictionary(): Map<string, number> {
  const all = loadDataset();
  const map = new Map<string, number>();
  for (const ex of all) {
    for (const it of ex.corrected.items) {
      const k = it.name.toLowerCase().trim();
      map.set(k, (map.get(k) || 0) + 1);
    }
  }
  return map;
}

export function getMerchantDictionary(): Map<string, number> {
  const all = loadDataset();
  const map = new Map<string, number>();
  for (const ex of all) if (ex.corrected.merchant) {
    const k = ex.corrected.merchant.toLowerCase().trim();
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}
