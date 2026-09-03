const AR = "٠١٢٣٤٥٦٧٨٩";
const AR_RANGE = "٠-٩";
const DIG = `0-9${AR_RANGE}`;

export function arabicToWestern(s: string): string {
  const map: Record<string, string> = {
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
    "٬": ",",
    "،": ",",
  };
  return s.replace(/[٠١٢٣٤٥٦٧٨٩٫٬،]/g, (ch) => map[ch] || ch);
}

export function normalizePriceString(raw: string): string {
  return arabicToWestern(raw).replace(/[٫٬،]/g, ".");
}

export const DATE_PATTERNS: RegExp[] = [
  new RegExp(`\\b([${DIG}]{2})[\\/\\-]([${DIG}]{2})[\\/\\-]([${DIG}]{4})\\b`),
  new RegExp(`\\b([${DIG}]{4})[\\/\\-]([${DIG}]{2})[\\/\\-]([${DIG}]{2})\\b`),
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
  new RegExp(`\\b([${DIG}]{1,2})[\\/\\-]([${DIG}]{1,2})[\\/\\-]([${DIG}]{2,4})\\b`),
];

export const TIME_PATTERNS: RegExp[] = [
  new RegExp(`\\b([${DIG}]{1,2}):([${DIG}]{2})(?::([${DIG}]{2}))?\\s*(AM|PM|ص|م)?\\b`, "i"),
];

export const PRICE_PATTERN = new RegExp(
  `(\\$|EGP|LE|جنيه|ر\\.س|SAR|€|£)?\\s*([${DIG}]+[.,٫٬]?[${DIG}]*\\.?[${DIG}]{0,2}|[${DIG}]+)\\s*(EGP|LE|جنيه|ر\\.س|SAR|€|£|\\$)?`,
  "i"
);

export const QUANTITY_PRICE_LINE = new RegExp(
  `^(.*?)\\s+([${DIG}]+(?:[.,٫][${DIG}]+)?)\\s*[x×*]?\\s*([${DIG}]+[.,٫][${DIG}]{2})\\s*[=]?\\s*([${DIG}]+[.,٫][${DIG}]{2})$`,
  "i"
);
export const QUANTITY_LINE = new RegExp(`^(.*?)\\s+([${DIG}]+)\\s+([${DIG}]+[.,٫][${DIG}]{2})$`);
export const SIMPLE_PRICE_LINE = new RegExp(`^(.*?)\\s+([${DIG}]+[.,٫][${DIG}]{2})$`);

export const TOTAL_KEYWORDS = /(total|grand total|amount due|balance due|net total|الإجمالي|المجموع|اجمالي)/i;
export const SUBTOTAL_KEYWORDS = /(subtotal|sub total|sub-total|المجموع الفرعي)/i;
export const TAX_KEYWORDS = /(tax|vat|value added tax|ضريبة|القيمة المضافة|\bTX\b)/i;
export const DISCOUNT_KEYWORDS = /(discount|disc\.|reduction|promo|خصم|تخفيض)/i;
export const PAYMENT_KEYWORDS = /(cash|visa|LVISA|mastercard|card|payment|mada|نقدا|نقدي|بطاقة|SA:|4535|XXX|SAPP|SIGNATURE)/i;
export const SKIP_KEYWORDS = /(address|phone|tel|tax no|vat no|receipt|invoice|thank you|welcome|store|branch|www\.|http|@|العنوان|هاتف|visa|LVISA|mastercard|SA:|4535|XXX|SAPP|SIGNATURE|VISA|MASTERCARD)/i;

export const KNOWN_MERCHANTS = ["carrefour", "metro", "spinneys", "lulu", "hyper", "panda", "bim", "kazyon", "كارفور", "بنده", "العثيم", "هايبر"];

export function isTotalLine(text: string): boolean {
  const t = arabicToWestern(text);
  return TOTAL_KEYWORDS.test(t) && !SUBTOTAL_KEYWORDS.test(t);
}
export function isSubtotalLine(text: string): boolean {
  return SUBTOTAL_KEYWORDS.test(arabicToWestern(text));
}
export function isTaxLine(text: string): boolean {
  return TAX_KEYWORDS.test(arabicToWestern(text));
}
export function isDiscountLine(text: string): boolean {
  return DISCOUNT_KEYWORDS.test(arabicToWestern(text));
}
export function isSkipLine(text: string): boolean {
  return SKIP_KEYWORDS.test(arabicToWestern(text));
}

export function extractPriceValue(text: string): number | null {
  const norm = normalizePriceString(text);
  const cleaned = norm.replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
  if (!cleaned) return null;
  const parts = cleaned.split(".");
  let numericStr: string;
  if (parts.length > 2) {
    const last = parts.pop()!;
    numericStr = parts.join("") + "." + last;
  } else {
    numericStr = cleaned;
  }
  const v = parseFloat(numericStr);
  if (isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}
