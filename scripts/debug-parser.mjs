import { reconstructLines } from "../dist/receipt-parser/lineReconstructor.js";
import { parseReceipt } from "../dist/receipt-parser/parser.js";

function el(text,x,y,w=80,h=14,conf=0.9){ return { text, confidence:conf, boundingBox:{x,y,width:w,height:h}}; }
const elems=[
  el("Carrefour",120,20,140,22,0.96),
  el("02/09/2026",40,70,90,14,0.94), el("14:37",360,70,60,14,0.93),
  el("------------------------",40,100,320,4,0.3),
  el("Pepsi",40,144,60,14,0.9), el("2",200,144,12,14,0.9), el("x",218,144,10,14,0.9), el("15.50",232,144,50,14,0.9), el("31.00",380,144,50,14,0.9),
  el("Chips",40,170,50,14,0.9), el("35.00",380,170,50,14,0.9),
  el("------------------------",40,200,320,4,0.3),
  el("Subtotal",40,230,70,14,0.9), el("66.00",380,230,50,14,0.91),
  el("VAT",40,250,40,14,0.88), el("9.24",380,250,50,14,0.88),
  el("TOTAL",40,270,60,16,0.96), el("75.24",380,270,60,16,0.97),
];
const doc={ elements: elems, rawText: elems.map(e=>e.text).join("\n"), provider:"test", processedAt:new Date().toISOString(), pageWidth:640, pageHeight:900 };
console.log("lines:", reconstructLines(doc.elements).map(l=>l.text));
const parsed=parseReceipt(doc);
console.log("parsed merchant", parsed.merchant);
console.log("items", parsed.items);
console.log("total", parsed.total);
