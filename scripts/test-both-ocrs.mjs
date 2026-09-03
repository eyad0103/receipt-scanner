import fs from "fs";
import path from "path";

const files = fs.readdirSync("uploads").filter(f=>f.endsWith(".png"));
console.log(`Testing ${files.length} uploaded PNGs with Tesseract / Paddle / Donut\n`);

for(const file of files){
  const buf = fs.readFileSync(path.join("uploads", file));
  console.log(`\n=== ${file} (${buf.length} bytes) ===`);
  for(const provider of ["tesseract","paddle","donut"]){
    try{
      const { OcrService } = await import("../dist/ocr/ocrService.js");
      const svc = OcrService.create(provider);
      const t0=Date.now();
      const doc = await svc.processImage(buf);
      const dt=Date.now()-t0;
      const avg = doc.elements.length? (doc.elements.reduce((a,b)=>a+b.confidence,0)/doc.elements.length).toFixed(2) : "0";
      console.log(`  [${provider.padEnd(9)}] ${doc.provider} | ${doc.elements.length} elems | avgConf ${avg} | ${dt}ms`);
      console.log(`    raw: ${doc.rawText.slice(0,120).replace(/\n/g," | ")}${doc.rawText.length>120?"...":""}`);
      // also parse
      const { parseReceipt } = await import("../dist/receipt-parser/parser.js");
      const parsed = parseReceipt(doc);
      console.log(`    parsed: merchant=${parsed.merchant.value||"?"} items=${parsed.items.length} total=${parsed.total.value} conf=${parsed.overallConfidence}`);
      if(parsed.items.length) console.log(`      items: ${parsed.items.slice(0,3).map(i=>`${i.name} ${i.totalPrice}`).join(" | ")}`);
    }catch(e){ console.log(`  [${provider}] error: ${e.message}`); }
  }
}
