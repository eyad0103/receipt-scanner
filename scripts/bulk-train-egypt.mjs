// Bulk-train: 10k Egyptian receipt examples with simulated OCR noise.
// Usage: node scripts/bulk-train-egypt.mjs [count]
// Writes data/verified.json directly (existing + new, capped 20000).
import fs from "fs";
import path from "path";

const COUNT = Math.min(50000, parseInt(process.argv[2] || "10000", 10) || 10000);
const DATA = path.join(process.cwd(), "data", "verified.json");
const all = JSON.parse(fs.readFileSync(DATA, "utf8"));

const MERCHANTS = ["Carrefour","Metro","Spinneys","Lulu","Panda","Seoudi","Kheir Zaman","Hyper One","GO.RESTAURANT","Awadallah","Fathalla","Ragab Sons","Kazyon","BIM","Al Rayan","El Madina"];
const PRODS = [
  ["Pepsi 330ml",8,12],["Pepsi 1L",18,25],["Coca Cola",8,25],["Mirinda",8,12],["Sprite",8,12],["Fayrouz",10,15],
  ["Water 600ml",4,7],["Water 1.5L",8,14],["Milk 1L",28,45],["Milk 500ml",15,25],["Yogurt",6,15],["Cheese",20,80],
  ["White Cheese",25,90],["Cheddar",30,100],["Eggs 10",35,70],["Eggs 30",90,160],["Bread Baladi",2,6],["Bread Fino",5,12],
  ["Rice 1kg",30,70],["Rice 5kg",150,300],["Pasta 400g",12,25],["Macarona",12,25],["Oil 1L",60,110],["Sunflower Oil",55,100],
  ["Ghee 500g",80,160],["Butter",30,70],["Sugar 1kg",25,45],["Tea 250g",30,60],["Liption Tea",28,55],["Coffee 100g",40,90],
  ["Turkish Coffee",35,80],["Nescafe",45,110],["Salt 500g",5,12],["Flour 1kg",20,40],["Foul 400g",12,25],["Foul Medammes",10,22],
  ["Taameya Mix",15,30],["Lentils 500g",25,50],["Beans White",30,60],["Chickpeas",35,70],["Tuna Can",25,55],["Sardines",15,30],
  ["Chicken 1kg",90,160],["Chicken Baneh",100,180],["Minced Meat",150,280],["Beef 500g",160,300],["Liver",80,150],["Fish Bolti",60,120],
  ["Filo Pastry",15,30],["Goulash",12,25],["Molokhia",10,20],["Okra Frozen",20,40],["Peas Frozen",18,35],["Tomato Paste",12,28],
  ["Ketchup",20,45],["Mayonnaise",25,55],["Mustard",18,35],["Vinegar",10,20],["Soap Bar",12,25],["Detergent 1kg",40,90],
  ["Dish Soap",15,35],["Tissues Box",25,60],["Toilet Paper 4",40,90],["Shampoo",50,120],["Toothpaste",25,60],["Biscuits",8,25],
  ["Chipsy",7,15],["Chocolate Corona",10,30],["Chocolate Galaxy",15,40],["Cake HoHos",6,15],["Croissant",8,18],["Donuts",15,35],
  ["Honey 250g",40,90],["Jam Fig",25,55],["Halawa",30,70],["Tahina",35,80],["Dates 500g",40,100],["Nuts Mix",60,150],
  ["Peanuts",25,60],["Sunflower Seeds",15,40],["Rice Pudding",10,20],["Roz Bel Laban",10,20],["Mahshi Mix",20,40],
  ["Koshary Box",25,50],["Shawerma Sandwich",40,80],["Kofta Sandwich",35,70],["Feteer",30,70],["Hawawshi",25,55],
  ["سكر",20,45],["شاي",25,60],["عيش بلدي",2,8],["لبن",25,45],["بيض",30,70],["أرز",25,70],["زيت",50,110],["مياه",4,14],
  ["بيبسي",8,25],["جبنة",20,90],["فراخ",80,170],["زبادي",5,15],["قهوة",30,90],["فول",8,25],["طعمية",5,18],["مكرونة",10,25],
  ["تونة",20,55],["بسكويت",5,25],["شيبسي",5,15],["شيكولاتة",8,40],["عسل",35,90],["مربى",20,55],["حلاوة",25,70],["طحينة",30,80],
  ["بلح",30,90],["فول سوداني",20,60],["صابون",10,25],["مسحوق غسيل",35,90],["مناديل",20,60],["شامبو",45,120],["معجون سنان",20,60],
];
const NOISE_LAT = [["0","O"],["O","0"],["1","l"],["l","1"],["5","S"],["S","5"],["8","B"],["B","8"],["6","G"],["rn","m"],["a","e"],["e","a"],["o","0"],["c","e"]];
const NOISE_AR = [["ة","ه"],["ه","ة"],["ا","أ"],["أ","ا"],["ى","ي"],["ي","ى"],["0","٠"],["1","١"],["2","٢"],["3","٣"],["5","٥"]];
const rnd = (a,b)=>a+Math.random()*(b-a);
const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
function noisify(s){
  let out = s;
  const table = /[\u0600-\u06FF]/.test(s) ? NOISE_AR : NOISE_LAT;
  const n = Math.random()<0.55 ? 1+Math.floor(Math.random()*2) : 0;
  for(let i=0;i<n;i++){
    const [a,b] = pick(table);
    const idx = out.indexOf(a);
    if(idx>=0 && Math.random()<0.7) out = out.slice(0,idx)+b+out.slice(idx+a.length);
    else if(Math.random()<0.15 && out.length>3){ const j=Math.floor(Math.random()*out.length); out = out.slice(0,j)+out.slice(j+1); }
  }
  return out;
}
const t0 = Date.now();
for(let i=0;i<COUNT;i++){
  const m = pick(MERCHANTS);
  const n = 2+Math.floor(Math.random()*4);
  const items = [];
  for(let j=0;j<n;j++){
    const [name,lo,hi] = pick(PRODS);
    const price = Math.round(rnd(lo,hi)*100)/100;
    items.push({ name, quantity: Math.random()<0.6?1:2, totalPrice: price });
  }
  const total = Math.round(items.reduce((a,b)=>a+b.totalPrice,0)*100)/100;
  const ocrLines = [noisify(m), ...items.map(it=>`${noisify(it.name)} ${noisify(it.totalPrice.toFixed(2))}`), `${noisify("TOTAL")} ${noisify(total.toFixed(2))}`];
  all.push({
    id: `egy10k_${Date.now()}_${i}`,
    ocrText: ocrLines.join("\n"),
    ocrElements: ocrLines.map(l=>({ text:l, confidence: Math.round(rnd(0.65,0.95)*100)/100 })),
    corrected: { merchant:m, items, total },
    createdAt: new Date().toISOString(),
  });
}
const trimmed = all.slice(-20000);
fs.mkdirSync(path.dirname(DATA), { recursive:true });
fs.writeFileSync(DATA, JSON.stringify(trimmed, null, 2));
console.log(`added ${COUNT} in ${((Date.now()-t0)/1000).toFixed(1)}s, total ${trimmed.length}`);
