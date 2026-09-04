import { OcrDocument, OcrElement } from "../models/receipt";
import { isDiscountLine, isSkipLine, isSubtotalLine, isTaxLine, isTotalLine } from "./patterns";
import { normalizePrice } from "../utils/normalize";

export interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number;
  confidence: number;
  boundingBox?: OcrElement["boundingBox"];
}

function priceFromText(text: string): number | null {
  const { amount } = normalizePrice(text);
  return amount;
}

function stripCurrencyAffix(text: string): string {
  let t = text
    .replace(/^\s*[$€£]\s*/, "")
    .replace(/\s*[$€£]\s*$/, "")
    .replace(/(\d)[A-Za-z]\s*$/, "$1")
    .replace(/\s+(EGP|L\.?E\.?|USD|SAR|AED|KWD|QAR|BHD|جنيه|ر\.?س\.?)\s*$/i, "");
  const pre = t.replace(/^(EGP|L\.?E\.?|USD|SAR|AED|جنيه)\s+/i, "");
  if (pre !== t && /[A-Za-z\u0600-\u06FF]{2,}.*\d|\d.*[A-Za-z\u0600-\u06FF]{2,}/.test(pre)) t = pre;
  return t.trim();
}

function cleanName(name: string): string {
  return name
    .replace(/\s*[-–—:]\s*$/g, "")
    .replace(/^\s*[-–—:]\s*/g, "")
    .replace(/^\s*[>•*+]\s*/, "")
    .replace(/^\d{1,2}[.)]\s+(?=[A-Za-z\u0600-\u06FF])/, "")
    .replace(/\s+/g, " ")
    .trim();
}

let cachedDict: Map<string, number> | null = null;
let cachedDictMtime = 0;
function productDict(): Map<string, number> {
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const p = path.join(process.cwd(), "data", "verified.json");
    const mt = fs.statSync(p).mtimeMs;
    if (!cachedDict || mt !== cachedDictMtime) {
      cachedDict = (require("../training/dataset") as typeof import("../training/dataset")).getProductDictionary();
      cachedDictMtime = mt;
    }
    return cachedDict;
  } catch {
    return new Map();
  }
}

function shortNameAllowed(name: string, dict: Map<string, number>): boolean {
  if (name.length >= 3) return true;
  return dict.has(name.toLowerCase().trim());
}

function parseItemLine(el: OcrElement): ParsedItem | null {
  let text = stripCurrencyAffix(el.text.trim());
  if (!text) return null;
  if (/\b(SEPP|APPR|APPROVAL|AUTH(\.|ORIZATION)?|TRACE|REF\s?NO|CARD\s?NO|ACCT|TERMINAL|MERCHANT\s?ID)\b/i.test(text)) return null;
  const dict = productDict();
  try {
    const { correctProductName } = require("../training/learner");
    if (dict.size > 5) {
      const words = text.split(/\s+/);
      const first = words[0];
      if (first && first.length >= 3 && words.length <= 2) {
        const corr = correctProductName(first, dict);
        if (corr.wasCorrected) text = text.replace(first, corr.corrected.charAt(0).toUpperCase() + corr.corrected.slice(1));
      }
    }
  } catch {}
  if (isTotalLine(text) || isSubtotalLine(text) || isTaxLine(text) || isDiscountLine(text)) return null;
  if (isSkipLine(text)) return null;

  const fullMatch = text.match(/^(.*?)\s+(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+[.,]\d{2})\s*[=]?\s*(\d+[.,]\d{2})$/i);
  if (fullMatch) {
    const name = cleanName(fullMatch[1]);
    const qty = parseFloat(fullMatch[2].replace(",", "."));
    const unit = parseFloat(fullMatch[3].replace(",", "."));
    const total = parseFloat(fullMatch[4].replace(",", "."));
    if (name.length < 2) return null;
    return { name, quantity: qty, unitPrice: unit, totalPrice: total, confidence: el.confidence * 0.92, boundingBox: el.boundingBox };
  }

  const qtyTotalMatch = text.match(/^(.*?)\s+(\d+)\s+(\d+[.,]?\d*)$/);
  if (qtyTotalMatch) {
    const name = cleanName(qtyTotalMatch[1]);
    const qty = parseInt(qtyTotalMatch[2], 10);
    const rawTotal = qtyTotalMatch[3];
    const { amount: total } = normalizePrice(rawTotal);
    const valid = name.length >= 2 && qty >= 1 && qty <= 100 && total !== null
      && /[A-Za-z\u0600-\u06FF]/.test(name)
      && !/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT)/i.test(name);
    if (valid && total !== null) {
      const unit = qty > 0 ? Math.round((total / qty) * 100) / 100 : null;
      return { name, quantity: qty, unitPrice: unit, totalPrice: total, confidence: el.confidence * 0.88, boundingBox: el.boundingBox };
    }
  }

  const leadingQtyMatch = text.match(/^(\d+)\s+(.*?)\s+(\d+[.,]?\d*)$/);
  if (leadingQtyMatch) {
    const qty = parseInt(leadingQtyMatch[1], 10);
    const name = cleanName(leadingQtyMatch[2]).replace(/\s+\d$/, "");
    const rawTotal = leadingQtyMatch[3];
    const { amount: total } = normalizePrice(rawTotal);
    if (name.length < 2 || qty < 1 || qty > 100 || total === null) return null;
    if (!/[A-Za-z\u0600-\u06FF]/.test(name)) return null;
    if (/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT)/i.test(name)) return null;
    const unit = qty > 0 ? Math.round((total / qty) * 100) / 100 : null;
    return { name, quantity: qty, unitPrice: unit, totalPrice: total, confidence: el.confidence * 0.88, boundingBox: el.boundingBox };
  }

  const dashMatch = text.match(/^(.*?)\s*[-–—:]\s*(\d+[.,]?\d*)$/);
  if (dashMatch && /[A-Za-z\u0600-\u06FF]/.test(dashMatch[1])) {
    const name = cleanName(dashMatch[1]);
    const { amount: total } = normalizePrice(dashMatch[2]);
    if (name.length >= 2 && shortNameAllowed(name, dict) && total !== null) {
      if (name.split(/\s+/).length <= 15 && total > 0 && total < 10000000) {
        if (!/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT|BILL|SIGNATURE|CASH|CHANGE)/i.test(name)) {
          return { name, quantity: 1, unitPrice: total, totalPrice: total, confidence: el.confidence * 0.85, boundingBox: el.boundingBox };
        }
      }
    }
  }

  const simpleMatch = text.match(/^(.*?)\s+(\d+[.,]?\d*)$/);
  if (simpleMatch) {
    const name = cleanName(simpleMatch[1]);
    const { amount: total } = normalizePrice(simpleMatch[2]);
    if (name.length < 2 || !shortNameAllowed(name, dict) || total === null) return null;
    if (name.split(/\s+/).length > 8) return null;
    if (total <= 0 || total > 10000000) return null;
    if (/^(TOTAL|SUBTOTAL|TAX|VAT|DISCOUNT|BILL|SIGNATURE)/i.test(name)) return null;
    return { name, quantity: 1, unitPrice: total, totalPrice: total, confidence: el.confidence * 0.82, boundingBox: el.boundingBox };
  }

  return null;
}

export function parseItems(doc: OcrDocument): ParsedItem[] {
  const sorted = [...doc.elements].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
  const items: ParsedItem[] = [];
  let inItemZone = false;
  const yThreshold = doc.pageHeight ? doc.pageHeight * 0.15 : 120;
  const bottomThreshold = doc.pageHeight ? doc.pageHeight * 0.75 : 600;

  for (const el of sorted) {
    if (el.boundingBox.y < yThreshold) continue;
    if (el.boundingBox.y > bottomThreshold) {
      if (isTotalLine(el.text) || isSubtotalLine(el.text)) break;
    }
    const parsed = parseItemLine(el);
    if (parsed) {
      items.push(parsed);
      inItemZone = true;
    } else if (inItemZone && items.length > 0) {
      if (isTotalLine(el.text) || isSubtotalLine(el.text) || isTaxLine(el.text)) break;
    }
  }

  if (items.length === 0) {
    for (const el of sorted) {
      const p = parseItemLine(el);
      if (p) items.push(p);
    }
  }

  return items.filter((it) => {
    const price = it.totalPrice;
    return price > 0 && price < 10000000;
  });
}

export function parseItemsFromLines(
  lines: Array<{ text: string; confidence: number; bbox: { x: number; y: number; width: number; height: number }; klass?: string }>,
  doc: OcrDocument
): ParsedItem[] {
  const yThreshold = doc.pageHeight ? doc.pageHeight * 0.12 : 80;
  const bottomThreshold = doc.pageHeight ? doc.pageHeight * 0.78 : 700;
  const items: ParsedItem[] = [];
  let inZone = false;
  for (const l of lines) {
    const y = l.bbox.y;
    if (y < yThreshold) continue;
    if (y > bottomThreshold) {
      if (isTotalLine(l.text) || isSubtotalLine(l.text)) break;
    }
    if (l.klass === "TOTAL" || l.klass === "SUBTOTAL" || l.klass === "TAX" || l.klass === "DISCOUNT") continue;
    if (isDiscountLine(l.text) || isSkipLine(l.text)) continue;
    const fakeEl: OcrElement = { text: l.text, confidence: l.confidence, boundingBox: l.bbox };
    const parsed = parseItemLine(fakeEl);
    if (parsed) {
      items.push(parsed);
      inZone = true;
    } else if (inZone && items.length > 0) {
      if (isTotalLine(l.text) || isSubtotalLine(l.text) || isTaxLine(l.text)) break;
    }
  }
  if (items.length === 0) {
    for (const l of lines) {
      if (isTotalLine(l.text) || isSubtotalLine(l.text) || isTaxLine(l.text) || isDiscountLine(l.text)) continue;
      const p = parseItemLine({ text: l.text, confidence: l.confidence, boundingBox: l.bbox });
      if (p) items.push(p);
    }
  }
  return items.filter((it) => it.totalPrice > 0 && it.totalPrice < 10000000);
}
