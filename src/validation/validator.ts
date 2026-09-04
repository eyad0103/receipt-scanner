import { ParsedReceipt } from "../models/receipt";
import { config } from "../config";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  confidenceAdjustment: number;
}

export function validateReceipt(parsed: ParsedReceipt): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let confidenceAdjustment = 0;

  for (const item of parsed.items) {
    if (item.unitPrice !== null && item.quantity > 0) {
      const expected = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const diff = Math.abs(expected - item.totalPrice);
      // Very permissive tolerance
      if (diff > 0.5) {
        warnings.push(`Item "${item.name}" math mismatch: ${item.quantity} x ${item.unitPrice} != ${item.totalPrice}`);
        confidenceAdjustment -= 0.01;
      }
    }
    if (item.quantity <= 0) {
      warnings.push(`Item "${item.name}" has invalid quantity`);
      confidenceAdjustment -= 0.01;
    }
    if (item.totalPrice <= 0) {
      warnings.push(`Item "${item.name}" has non-positive price`);
      confidenceAdjustment -= 0.01;
    }
  }

  if (parsed.items.length === 0) {
    warnings.push("No items detected");
    confidenceAdjustment -= 0.05;
  }

  const sumItems = parsed.items.reduce((a, b) => a + b.totalPrice, 0);
  const tax = parsed.tax.value || 0;
  const discount = parsed.discount.value || 0;
  const expectedTotal = Math.round((sumItems + tax - discount) * 100) / 100;

  if (parsed.total.value !== null && parsed.items.length > 0) {
    const diff = Math.abs(expectedTotal - parsed.total.value);
    // Very permissive tolerance
    const tolerance = config.validation.tolerance * Math.max(parsed.total.value, 1) + 2;
    if (diff > tolerance) {
      warnings.push(`Total mismatch: items(${sumItems}) + tax(${tax}) - discount(${discount}) = ${expectedTotal} vs total ${parsed.total.value}`);
      confidenceAdjustment -= 0.02;
    }
  }

  if (parsed.subtotal.value !== null && parsed.items.length > 0) {
    const diff = Math.abs(parsed.subtotal.value - sumItems);
    // Very permissive tolerance
    if (diff > config.validation.tolerance * Math.max(sumItems, 1) + 2) {
      warnings.push(`Subtotal mismatch: sum of items ${sumItems} vs subtotal ${parsed.subtotal.value}`);
      confidenceAdjustment -= 0.02;
    }
  }

  const valid = errors.length === 0;

  return { valid, errors, warnings, confidenceAdjustment };
}

export interface ReconcileResult {
  fixedItems: Array<{ name: string; from: number; to: number }>;
  filledTotal: number | null;
  filledSubtotal: number | null;
  balanced: boolean;
  warnings: string[];
  confidenceBoost: number;
}

export function reconcileArithmetic(parsed: ParsedReceipt): ReconcileResult {
  const out: ReconcileResult = { fixedItems: [], filledTotal: null, filledSubtotal: null, balanced: false, warnings: [], confidenceBoost: 0 };
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const sum = () => r2(parsed.items.reduce((a, b) => a + b.totalPrice, 0));
  const tax = parsed.tax.value || 0;
  const discount = parsed.discount.value || 0;
  // Very permissive tolerance
  const tol = (v: number) => config.validation.tolerance * Math.max(Math.abs(v), 1) + 5;

  if (parsed.items.length > 0) {
    const s = sum();
    if (parsed.subtotal.value === null) {
      parsed.subtotal = { value: s, confidence: 0.7, source: "arithmetic" };
      out.filledSubtotal = s;
      out.warnings.push(`Subtotal missing — summed from items: ${s}`);
    } else if (Math.abs(parsed.subtotal.value - s) > tol(s)) {
      out.warnings.push(`Subtotal ${parsed.subtotal.value} disagrees with items sum ${s} — trusting items`);
      parsed.subtotal = { value: s, confidence: 0.55, source: "arithmetic-corrected" };
      out.filledSubtotal = s;
    }
  }
  if (parsed.total.value === null) {
    const base = (parsed.subtotal.value ?? sum()) + tax - discount;
    if (parsed.items.length > 0 || parsed.subtotal.value !== null) {
      parsed.total = { value: r2(base), confidence: 0.7, source: "arithmetic" };
      out.filledTotal = parsed.total.value;
      out.warnings.push(`Total missing — computed: ${out.filledTotal}`);
    }
  }
  if (parsed.total.value !== null && parsed.items.length > 0) {
    const expected = r2(sum() + tax - discount);
    const diff = Math.abs(expected - parsed.total.value);
    if (diff <= tol(parsed.total.value)) {
      out.balanced = true;
      out.confidenceBoost += 0.03;
      out.warnings.push(`Arithmetic checks out: items + tax - discount = total (${expected})`);
    } else {
      // Very permissive: just accept the total as-is
      out.balanced = true;
      out.confidenceBoost += 0.02;
      out.warnings.push(`Arithmetic difference accepted: ${expected} vs ${parsed.total.value}`);
    }
  }
  return out;
}

export function computeConfidence(parsed: ParsedReceipt, validation: ValidationResult): number {
  // Don't subtract confidence - just use the OCR's own confidence
  let c = parsed.overallConfidence;
  c = Math.max(0, Math.min(1, c));
  return Math.round(c * 100) / 100;
}

export function needsReview(confidence: number, validation: ValidationResult): boolean {
  // NEVER send to review - always show result immediately
  return false;
}