import { OcrElement } from "../models/receipt";

export interface ReconstructedLine {
  id: string;
  elements: OcrElement[];
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  yCenter: number;
  height: number;
}

function verticalCenter(e: OcrElement): number {
  return e.boundingBox.y + e.boundingBox.height / 2;
}

function avgHeight(elements: OcrElement[]): number {
  if (elements.length === 0) return 20;
  return elements.reduce((a, b) => a + b.boundingBox.height, 0) / elements.length;
}

export function cleanElements(elements: OcrElement[]): OcrElement[] {
  return elements.filter((e) => {
    const t = e.text.trim();
    if (!t) return false;
    if (t.length === 1 && /[-—_|\\/]/.test(t) && e.confidence < 0.6) return false;
    const area = e.boundingBox.width * e.boundingBox.height;
    if (area < 80 && e.confidence < 0.5) return false;
    const aspect = e.boundingBox.width / Math.max(1, e.boundingBox.height);
    if (aspect > 25 && t.length < 3) return false;
    if (e.boundingBox.width < 4 || e.boundingBox.height < 6) return false;
    return true;
  });
}

export function reconstructLines(elements: OcrElement[], opts?: { threshold?: number }): ReconstructedLine[] {
  const cleaned = cleanElements(elements);
  if (cleaned.length === 0) return [];
  const sorted = [...cleaned].sort((a, b) => verticalCenter(a) - verticalCenter(b));
  const threshold = opts?.threshold ?? 0.6;
  const lines: OcrElement[][] = [];
  let current: OcrElement[] = [sorted[0]];
  let curAvgH = sorted[0].boundingBox.height;

  for (let i = 1; i < sorted.length; i++) {
    const el = sorted[i];
    const curCenter = current.reduce((a, b) => a + verticalCenter(b), 0) / current.length;
    const elCenter = verticalCenter(el);
    const avgH = (curAvgH + el.boundingBox.height) / 2;
    const diff = Math.abs(elCenter - curCenter);
    if (diff < avgH * threshold) {
      current.push(el);
      curAvgH = avgHeight(current);
    } else {
      lines.push(current);
      current = [el];
      curAvgH = el.boundingBox.height;
    }
  }
  lines.push(current);

  return lines.map((els, idx) => {
    const sortedEls = [...els].sort((a, b) => a.boundingBox.x - b.boundingBox.x);
    const text = sortedEls.map((e) => e.text).join(" ");
    const confidence = sortedEls.reduce((a, b) => a + b.confidence, 0) / sortedEls.length;
    const minX = Math.min(...sortedEls.map((e) => e.boundingBox.x));
    const minY = Math.min(...sortedEls.map((e) => e.boundingBox.y));
    const maxX = Math.max(...sortedEls.map((e) => e.boundingBox.x + e.boundingBox.width));
    const maxY = Math.max(...sortedEls.map((e) => e.boundingBox.y + e.boundingBox.height));
    return {
      id: `line_${idx}`,
      elements: sortedEls,
      text,
      confidence,
      bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      yCenter: sortedEls.reduce((a, b) => a + verticalCenter(b), 0) / sortedEls.length,
      height: avgHeight(sortedEls),
    };
  }).sort((a, b) => a.yCenter - b.yCenter);
}
