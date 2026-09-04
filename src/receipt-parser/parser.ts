import { OcrDocument, ParsedReceipt } from "../models/receipt";
import { extractCurrency, extractDate, extractMerchant, extractMoneyFieldFromLines, extractPaymentMethod, extractReceiptNumber, extractTime } from "./fieldExtractor";
import { parseItemsFromLines } from "./itemParser";
import { isDiscountLine, isTaxLine, isTotalLine, isSubtotalLine } from "./patterns";
import { associateColumns, reconstructLines } from "./lineReconstructor";
import { classifyLines } from "./semanticClassifier";

export function parseReceipt(doc: OcrDocument): ParsedReceipt {
  const lines = associateColumns(reconstructLines(doc.elements));
  const classified = classifyLines(lines);

  const merchant = extractMerchant(doc);
  const date = extractDate(doc);
  const time = extractTime(doc);
  const currency = extractCurrency(doc);
  const items = parseItemsFromLines(classified, doc);

  const subtotal = extractMoneyFieldFromLines(classified, isSubtotalLine);
  let tax = extractMoneyFieldFromLines(classified, isTaxLine);
  if (tax.value !== null) {
    const taxIdx = classified.findIndex((l) => isTaxLine(l.text));
    const taxLine = taxIdx >= 0 ? classified[taxIdx].text : "";
    if (taxIdx >= 0 && (isSubtotalLine(taxLine) || (subtotal.value !== null && tax.value === subtotal.value))) {
      for (let i = taxIdx + 1; i < Math.min(classified.length, taxIdx + 4); i++) {
        const m = classified[i].text.trim().match(/^[$€£]?\s*(\d+[.,]\d{2})\s*$/);
        if (m && !isTotalLine(classified[i].text) && !isSubtotalLine(classified[i].text)) {
          const v = parseFloat(m[1].replace(",", "."));
          if (!isNaN(v) && v > 0 && v < 100000) {
            tax = { value: Math.round(v * 100) / 100, confidence: classified[i].confidence * 0.7 };
            break;
          }
        }
      }
    }
  }
  const discount = extractMoneyFieldFromLines(classified, isDiscountLine);
  let total = extractMoneyFieldFromLines(classified, isTotalLine);

  if (total.value === null && items.length > 0) {
    const bottom = [...classified].sort((a, b) => b.bbox.y - a.bbox.y).slice(0, 3);
    for (const l of bottom) {
      const m = l.text.match(/(\d+[.,]\d{2})/);
      if (m) {
        const v = parseFloat(m[1].replace(",", "."));
        if (!isNaN(v) && v > 0) {
          total = { value: v, confidence: l.confidence * 0.7 };
          break;
        }
      }
    }
  }

  const confidences: number[] = [
    merchant.confidence,
    date.confidence,
    time.confidence,
    total.confidence,
    ...items.map((i) => i.confidence),
  ].filter((c) => c > 0);

  const overallConfidence =
    confidences.length === 0 ? 0.3 : confidences.reduce((a, b) => a + b, 0) / confidences.length;

  return {
    merchant,
    date,
    time,
    currency,
    items,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod: extractPaymentMethod(doc),
    receiptNumber: extractReceiptNumber(doc),
    overallConfidence: Math.round(overallConfidence * 100) / 100,
  };
}
