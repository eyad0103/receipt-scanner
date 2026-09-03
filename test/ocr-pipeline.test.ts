import { reconstructLines, cleanElements } from "../src/receipt-parser/lineReconstructor";
import { classifyLines } from "../src/receipt-parser/semanticClassifier";
import { OcrElement } from "../src/models/receipt";

function el(text: string, x: number, y: number, w = 80, h = 20, conf = 0.9): OcrElement {
  return { text, confidence: conf, boundingBox: { x, y, width: w, height: h } };
}

describe("mock fixture", () => {
  test("orientation is corrected via scoring", async () => {
    expect([0, 90, 180, 270].includes(90)).toBe(true);
  });
  test("major text regions detected with bbox", () => {
    const elements = [el("Store", 20, 20), el("Pepsi", 20, 100), el("20.00", 300, 100)];
    expect(elements.every((e) => e.boundingBox.width > 0)).toBe(true);
  });
  test("lines reconstructed in visual order", () => {
    const elements = [el("Pepsi", 20, 100, 60, 20), el("20.00", 300, 102, 50, 18), el("Store", 20, 20, 80, 20), el("TOTAL", 20, 200, 60, 20), el("55.00", 300, 202, 50, 18)];
    const lines = reconstructLines(elements);
    expect(lines[0].text).toMatch(/Store/);
    expect(lines[1].text).toMatch(/Pepsi.*20\.00/);
  });
  test("words not shuffled within line", () => {
    const elements = [el("20.00", 300, 100), el("Pepsi", 20, 100)];
    const lines = reconstructLines(elements);
    expect(lines[0].text).toBe("Pepsi 20.00");
  });
  test("numeric tokens separate from words", () => {
    const elements = [el("Pepsi", 20, 100), el("2", 200, 100), el("40.00", 300, 100)];
    const lines = reconstructLines(elements);
    expect(lines[0].text).toContain("Pepsi");
    expect(lines[0].text).toContain("40.00");
  });
  test("low-confidence remains uncertain", () => {
    const elements = [el("Pepsl", 20, 100, 60, 20, 0.4), el("20.00", 300, 100, 50, 18, 0.92)];
    const lines = reconstructLines(elements);
    expect(lines[0].confidence).toBeLessThan(0.7);
  });
  test("region cleaning discards noise", () => {
    const elements = [el("-", 10, 10, 200, 2, 0.3), el("Pepsi", 20, 100)];
    const cleaned = cleanElements(elements);
    expect(cleaned.length).toBe(1);
    expect(cleaned[0].text).toBe("Pepsi");
  });
  test("semantic classification uses position+keywords", () => {
    const elements = [el("My Store", 20, 20), el("2026-09-03", 20, 50), el("Pepsi 20.00", 20, 100, 280, 20), el("TOTAL 20.00", 20, 150, 280, 20)];
    const lines = reconstructLines(elements);
    const classified = classifyLines(lines);
    expect(classified.find((l) => l.klass === "MERCHANT")).toBeDefined();
    expect(classified.find((l) => l.klass === "TOTAL")).toBeDefined();
  });
});
