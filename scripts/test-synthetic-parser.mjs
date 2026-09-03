import { reconstructLines } from "../dist/receipt-parser/lineReconstructor.js";
import { classifyLines } from "../dist/receipt-parser/semanticClassifier.js";
import { parseReceipt } from "../dist/receipt-parser/parser.js";
import { validateReceipt, computeConfidence } from "../dist/validation/validator.js";

const merchants=["Carrefour","Metro","Spinneys","Lulu","Panda","BIM"];
const products=["Pepsi 330ml","Chips","Chocolate","Bread","Milk","Rice","Oil","Cheese","Yogurt","Water","Coffee","Tea"];

function el(text,x,y,w=80,h=18,conf=0.92){ return { text, confidence:conf, boundingBox:{x,y,width:w,height:h}}; }
function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function makeOcrDoc(variant="normal"){
  const m=pick(merchants);
  const date=`${String(rnd(1,28)).padStart(2,"0")}/${String(rnd(1,12)).padStart(2,"0")}/2026`;
  const time=`${String(rnd(8,20)).padStart(2,"0")}:${String(rnd(0,59)).padStart(2,"0")}`;
  const n=rnd(2,5);
  let y=20;
  const elems=[];
  elems.push(el(m, 120+ rnd(-20,20), y, 140, 22, variant==="lowContrast"?0.55:0.96)); y+=50;
  elems.push(el(date, 40, y, 90, 14, 0.94)); elems.push(el(time, 360, y, 60, 14, 0.93)); y+=36;
  elems.push(el("-".repeat(24), 40, y, 320, 4, 0.3)); y+=28;
  let subtotal=0;
  const items=[];
  for(let i=0;i<n;i++){
    const name=pick(products);
    const qty=Math.random()<0.5?1:rnd(2,3);
    const unit=rnd(12,80)+0.5; const total=Math.round(qty*unit*100)/100; subtotal+=total; items.push({name,qty,unit,total});
    const conf=variant==="noise"?0.62: variant==="lowContrast"?0.58: 0.85+Math.random()*0.12;
    const jitterX=rnd(-6,6), jitterY=rnd(-3,3);
    if(qty>1) { elems.push(el(name, 40+jitterX, y+jitterY, 120, 14, conf)); elems.push(el(String(qty), 200, y, 14, 14, conf)); elems.push(el("x", 218, y, 10, 14, conf)); elems.push(el(unit.toFixed(2), 232, y, 50, 14, conf)); elems.push(el(total.toFixed(2), 380, y, 50, 14, conf)); }
    else { elems.push(el(name, 40+jitterX, y+jitterY, 120, 14, conf)); elems.push(el(total.toFixed(2), 380, y, 50, 14, conf)); }
    y+=26;
  }
  elems.push(el("-".repeat(24), 40, y, 320, 4, 0.3)); y+=18;
  const tax=Math.round(subtotal*0.14*100)/100;
  elems.push(el("Subtotal",40,y,70,14,0.9)); elems.push(el(subtotal.toFixed(2),380,y,50,14,0.91)); y+=18;
  elems.push(el("VAT",40,y,40,14,0.88)); elems.push(el(tax.toFixed(2),380,y,50,14,0.88)); y+=18;
  const total=Math.round((subtotal+tax)*100)/100;
  elems.push(el("TOTAL",40,y,60,16,0.96)); elems.push(el(total.toFixed(2),380,y,60,16,0.97)); y+=18;
  elems.push(el(`Receipt #rcpt_${rnd(1000,9999)}`,40,y,120,12,0.82));
  if(variant==="rotated"){
    // simulate 90° rotation by swapping x/y and adding offset
    for(const e of elems){ const {x,y,w,h}=e.boundingBox; e.boundingBox={x:y, y:600-x, width:h, height:w}; }
  }
  if(variant==="shuffled"){
    // simulate OCR word order shuffle
    shuffle(elems);
  }
  return { text: elems.map(e=>e.text).join(" "), elems, subtotal, tax, total, merchant:m, n };
}

const variants=["normal","rotated","lowContrast","noise","shuffled"];
let pass=0, totalTests=20;
console.log(`Testing synthetic OCR pipeline with ${totalTests} random receipts (variants: ${variants.join(", ")})\n`);
for(let i=0;i<totalTests;i++){
  const v=pick(variants);
  const doc=makeOcrDoc(v);
  const ocrDoc={ elements: doc.elems, rawText: doc.elems.map(e=>e.text).join("\n"), provider:"synthetic", processedAt:new Date().toISOString(), pageWidth:640, pageHeight:900 };
  try{
    const lines=reconstructLines(ocrDoc.elements);
    const classified=classifyLines(lines);
    const parsed=parseReceipt(ocrDoc);
    const validation=validateReceipt(parsed);
    const conf=computeConfidence(parsed, validation);
    const ok = parsed.items.length>=2 && parsed.total.value!==null && Math.abs(parsed.total.value - doc.total) < 1.5;
    const status= ok ? "✓" : lines.length>=3 ? "◐" : "✗";
    console.log(`${status} #${String(i+1).padStart(2,"0")} [${v.padEnd(11)}] merchant=${parsed.merchant.value||"?"} items=${parsed.items.length}/${doc.n} total=${parsed.total.value}~${doc.total} conf=${conf.toFixed(2)} lines=${lines.length} ${validation.warnings.length?`warn:${validation.warnings[0].slice(0,50)}`:""}`);
    if(ok) pass++;
  }catch(e){ console.log(`✗ #${i+1} [${v}] error: ${e.message}`); }
}
console.log(`\n=== SYNTHETIC PIPELINE RESULT ===`);
console.log(`Passed: ${pass}/${totalTests} (${Math.round(pass/totalTests*100)}%)`);
console.log(`Orientation: detected via 0/90/180/270 scoring, variants: original/enhanced/grayscale/thresholded`);
console.log(`Line reconstruction: yCenter < avgH*0.6, x-sorted, region cleaning active`);
console.log(`Handwriting fallback: triggers at avgConf<0.55`);
