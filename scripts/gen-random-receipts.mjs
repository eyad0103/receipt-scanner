import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../tmp-receipts");
fs.mkdirSync(outDir, { recursive: true });

const merchants = ["Carrefour", "Metro", "Spinneys", "Lulu", "Panda", "BIM", "Kazyon"];
const products = ["Pepsi 330ml", "Chips", "Chocolate", "Bread", "Milk 1L", "Rice 1kg", "Oil 800ml", "Cheese", "Yogurt", "Water 1.5L", "Coffee", "Tea", "Sugar", "Pasta", "Tomatoes"];
const currencies = ["EGP"];

function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randomDate(){
  const d=new Date(2026, rnd(0,8), rnd(1,28), rnd(8,20), rnd(0,59));
  const pad=n=>String(n).padStart(2,"0");
  const fmt = Math.random()<0.5 ? `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}` : `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date:fmt, time, iso:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` };
}
function makeReceiptText(id){
  const m=pick(merchants);
  const {date,time,iso}=randomDate();
  const nItems=rnd(2,6);
  let lines=[];
  lines.push(m);
  lines.push(`${date}   ${time}`);
  lines.push("".padEnd(32,"-"));
  let subtotal=0;
  const items=[];
  for(let i=0;i<nItems;i++){
    const name=pick(products);
    const qty= Math.random()<0.6?1:rnd(2,4);
    const unit=rnd(10,80)+ (Math.random()<0.5?0:0.5);
    const total=Math.round(qty*unit*100)/100;
    subtotal+=total;
    items.push({name, qty, unit, total});
    if(qty>1) lines.push(`${name}  ${qty} x ${unit.toFixed(2)}  ${total.toFixed(2)}`);
    else lines.push(`${name.padEnd(18)} ${total.toFixed(2)}`);
  }
  lines.push("".padEnd(32,"-"));
  const tax = Math.round(subtotal*0.14*100)/100;
  const discount = Math.random()<0.3? rnd(5,20):0;
  const total = Math.round((subtotal+tax-discount)*100)/100;
  lines.push(`Subtotal ${subtotal.toFixed(2)}`);
  if(tax) lines.push(`VAT ${tax.toFixed(2)}`);
  if(discount) lines.push(`Discount -${discount.toFixed(2)}`);
  lines.push(`TOTAL ${total.toFixed(2)} EGP`);
  lines.push(`Receipt #${id}`);
  if(Math.random()<0.5) lines.push("Thank you!");
  return { text: lines.join("\n"), merchant:m, iso, total, subtotal, tax, discount, items };
}

async function renderImage(text, outPath, opts={}){
  const pad=20, lineH=22, W=640, H=pad*2+ text.split("\n").length*lineH + 20;
  let JimpMod=null;
  try{ JimpMod=await import("jimp"); }catch{}
  const Jimp = JimpMod?.Jimp || JimpMod?.default || null;
  if(!Jimp || !Jimp.loadFont){
    fs.writeFileSync(outPath.replace(/\.png$/,".txt.png"), text);
    fs.writeFileSync(outPath, Buffer.from(text));
    return;
  }
  try{
    const img = new Jimp({ width: W, height: H, color: 0xffffffff });
    const font = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
    const fontBold = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    text.split("\n").forEach((line,i)=>{
      const y=pad+i*lineH;
      const f = i===0 || line.startsWith("TOTAL") ? fontBold : font;
      img.print({ font: f, x: pad, y, maxWidth: W-pad*2, maxHeight: lineH }, line);
    });
    if(opts.rotate) img.rotate(opts.rotate);
    if(opts.noise){ try{ img.gaussian(1); }catch{} }
    if(opts.lowContrast){ try{ img.contrast(-0.2); }catch{} }
    await img.write(outPath);
  }catch(e){
    fs.writeFileSync(outPath, Buffer.from(text));
  }
}

const N=12;
console.log(`Generating ${N} random receipts...`);
for(let i=0;i<N;i++){
  const id=`rcpt_${String(i+1).padStart(3,"0")}`;
  const {text, merchant, total} = makeReceiptText(id);
  const variant = pick(["normal","rotated","rotated","lowContrast","noise"]);
  const opts={};
  if(variant==="rotated") opts.rotate=90;
  if(variant==="lowContrast") opts.lowContrast=true;
  if(variant==="noise") opts.noise=true;
  const pngPath=path.join(outDir, `${id}_${merchant}_${variant}.png`);
  const txtPath=path.join(outDir, `${id}.txt`);
  await renderImage(text, pngPath, opts);
  fs.writeFileSync(txtPath, text);
  console.log(`  ${path.basename(pngPath)}  TOTAL ${total.toFixed(2)}  [${variant}]`);
}
console.log(`\nDone -> ${outDir}`);
console.log(`Text ground truth in *.txt, images in *.png`);
