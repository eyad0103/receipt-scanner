const UNIT_MAP: Record<string, string> = {
  ml: "ml",
  "ml.": "ml",
  l: "l",
  lt: "l",
  g: "g",
  kg: "kg",
  pcs: "pcs",
  pc: "pcs",
};

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "٫": ".",
  "٬": "",
  "،": "",
};

function toWesternDigits(s: string): string {
  return s.replace(/[٠١٢٣٤٥٦٧٨٩٫٬،]/g, (c) => ARABIC_DIGITS[c] ?? c);
}

export function normalizeProductName(name: string): string {
  let n = name.toLowerCase().trim();
  n = n.replace(/[^\p{L}\p{N}\s./-]/gu, " ");
  n = n.replace(/\s+/g, " ").trim();
  n = n.replace(/(\d+)\s*(ml|l|g|kg|pcs|pc)\b/gi, (_, num: string, unit: string) => {
    const u = UNIT_MAP[unit.toLowerCase()] || unit.toLowerCase();
    return `${num}${u}`;
  });
  return n;
}

export function productMatchKey(name: string): string {
  return normalizeProductName(name);
}

export function areProductsSimilar(a: string, b: string): boolean {
  const na = productMatchKey(a);
  const nb = productMatchKey(b);
  if (na === nb) return true;
  const tokensA = new Set(na.split(" "));
  const tokensB = new Set(nb.split(" "));
  let inter = 0;
  for (const t of tokensA) if (tokensB.has(t)) inter++;
  const union = tokensA.size + tokensB.size - inter;
  const jaccard = union === 0 ? 0 : inter / union;
  return jaccard >= 0.7;
}

export function normalizePrice(raw: string): { amount: number | null; currency: string | null } {
  const western = toWesternDigits(raw);
  const trimmed = western.trim();
  const currencyMatch = trimmed.match(/(EGP|LE|USD|\$|SAR|€|£|جنيه|ر\.س)/i);
  let currency: string | null = null;
  if (currencyMatch) {
    const m = currencyMatch[1].toUpperCase();
    if (m === "$") currency = "USD";
    else if (m === "LE" || m.includes("جنيه")) currency = "EGP";
    else if (m.includes("ر")) currency = "SAR";
    else currency = m.replace("$", "USD").replace("LE", "EGP");
  }
  let cleaned = trimmed.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return { amount: null, currency };
  if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) cleaned = cleaned.replace(/,/g, "");
  else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) cleaned = cleaned.replace(/\./g, "");
  else cleaned = cleaned.replace(/,/g, ".");
  const parts = cleaned.split(".");
  let numericStr: string;
  if (parts.length > 2) {
    const last = parts.pop()!;
    numericStr = parts.join("") + "." + last;
  } else {
    numericStr = cleaned;
  }
  let amount = parseFloat(numericStr);
  if (isNaN(amount)) return { amount: null, currency };
  const hasDecimal = /[.,]/.test(trimmed);
  if (!hasDecimal && /^\d{3,5}$/.test(cleaned) && amount >= 100) {
    if (amount >= 10000 && amount < 100000) {
      amount = Math.round((amount / 100) * 100) / 100;
    } else if (amount >= 1000 && amount < 10000) {
      const maybeCents = amount / 100;
      const maybeTens = amount / 10;
      if (maybeCents >= 5 && maybeCents <= 500) {
        amount = Math.round(maybeCents * 100) / 100;
      }
    } else if (amount >= 100 && amount < 1000) {
      amount = Math.round((amount / 100) * 100) / 100;
    }
  }
  return { amount: Math.round(amount * 100) / 100, currency };
}

export function parseQuantityToken(token: string): number | null {
  const western = toWesternDigits(token);
  const m = western.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|\*|×)?$/i);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  return isNaN(v) ? null : v;
}

export function correctOcrText(text: string): string {
  return toWesternDigits(text).trim();
}
