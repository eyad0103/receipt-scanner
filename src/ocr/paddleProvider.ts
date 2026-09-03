import { OcrDocument } from "../models/receipt";
import { OcrProvider } from "./types";

export class PaddleOcrProvider implements OcrProvider {
  readonly name = "paddle";

  async processImage(imageBuffer: Buffer, _opts?: { languageHint?: string }): Promise<OcrDocument> {
    if (!imageBuffer || imageBuffer.length === 0) throw new Error("Empty buffer");
    const fs = await import("fs");
    const os = await import("os");
    const path = await import("path");
    const { spawn } = await import("child_process");
    const tmp = path.join(os.tmpdir(), `paddle_vl_${Date.now()}.png`);
    fs.writeFileSync(tmp, imageBuffer);
    const safeTmp = tmp.replace(/\\/g, "\\\\");
    const pyCode = `
import json, sys, warnings, os
warnings.filterwarnings("ignore")
os.environ["HF_HOME"] = r"F:\\hf-cache"
os.environ["HF_HUB_CACHE"] = r"F:\\hf-cache\\hub"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
try:
  from paddleocr import PaddleOCRVL
  vl = PaddleOCRVL(pipeline_version="v1.6")
  out = vl.predict(r"${safeTmp}")
  texts = []
  def walk(o):
    if o is None: return
    if isinstance(o, str):
      if o.strip(): texts.append(o.strip())
    elif isinstance(o, dict):
      for k in ("markdown","text","content","transcription","rec_text","rec_texts"):
        if k in o and isinstance(o[k], str) and o[k].strip(): texts.append(o[k].strip())
      for v in o.values(): walk(v)
    elif isinstance(o, (list, tuple)):
      for v in o: walk(v)
  walk(out)
  text = "\\n".join(texts) if texts else str(out)[:2000]
  sys.stdout.write(json.dumps({"text": text}))
except Exception as e:
  sys.stderr.write("PADDLE_VL_FAIL: " + str(e)[:500])
  sys.stdout.write(json.dumps({"error": str(e)[:500]}))
sys.stdout.flush()
`;
    const out: string = await new Promise((res, rej) => {
      let buf = "", err = "";
      const p = spawn("python", ["-c", pyCode], { windowsHide: true, env: { ...process.env, HF_HOME: "F:\\hf-cache", HF_HUB_CACHE: "F:\\hf-cache\\hub", PIP_CACHE_DIR: "F:\\pip-cache", PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: "True" } });
      p.stdout?.on("data", (d: Buffer) => (buf += d.toString()));
      p.stderr?.on("data", (d: Buffer) => (err += d.toString()));
      p.on("close", (code) => {
        if (code !== 0 && !buf.trim()) rej(new Error((err.match(/PADDLE_VL_FAIL:[^\n]*/)?.[0] || err).slice(0, 600) || `paddle-vl exit ${code}`));
        else res(buf);
      });
      p.on("error", (e) => rej(e));
      setTimeout(() => { try { p.kill(); } catch {} rej(new Error("PaddleOCR-VL timeout after 180s — first run downloads models")); }, 180000);
    });
    try { fs.unlinkSync(tmp); } catch {}
    const line = out.trim().split("\n").reverse().find((l) => l.trim().startsWith("{")) || "";
    const parsed = line ? JSON.parse(line) : {};
    if (parsed.error || !parsed.text?.trim()) throw new Error(parsed.error || "PaddleOCR-VL returned empty — needs paddlepaddle on Python 3.9-3.13 (you have 3.14, no cp314 wheels), install Python 3.12 or run install-paddle-vl.bat");
    const text = String(parsed.text);
    const lines = text.split("\n").filter(Boolean);
    const elements = lines.map((l, i) => ({ text: l.trim(), confidence: 0.9, boundingBox: { x: 20, y: 40 + i * 26, width: 600, height: 22 } }));
    return { elements, rawText: text, provider: this.name + "(vl-1.6-0.9b)", processedAt: new Date().toISOString(), pageWidth: 640, pageHeight: 40 + lines.length * 26 + 20 };
  }
}
