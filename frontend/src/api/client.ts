const BASE = "/api";
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, { headers: { "Content-Type": "application/json", "x-user-id": localStorage.getItem("userId") || "user_demo" }, ...init });
  if (!r.ok) { const e = await r.json().catch(()=>({error:{message:r.statusText}})); throw new Error(e.error?.message || r.statusText); }
  return r.json();
}
export const api = {
  uploadReceipt: (file: File) => { const fd=new FormData(); fd.append("image", file); const ocr=localStorage.getItem("ocrProvider")||"tesseract"; return fetch(BASE+"/receipts/upload",{method:"POST",headers:{"x-user-id":localStorage.getItem("userId")||"user_demo","X-OCR-Provider":ocr},body:fd}).then(async r=>{ if(!r.ok) throw new Error((await r.json()).error.message); return r.json() as Promise<{receiptId:string,status:string}>}); },
  getReceipt: (id:string) => req<ReceiptDetail>(`/receipts/${id}`),
  getReceipts: (p: Record<string,string|number>={}) => { const q=new URLSearchParams(p as Record<string,string>).toString(); return req<{data:ReceiptSummary[],pagination:{page:number,limit:number,total:number,totalPages:number}}>(`/receipts${q?"?"+q:""}`); },
  updateReceipt: (id:string, body:unknown) => req<ReceiptSummary>(`/receipts/${id}`,{method:"PATCH",body:JSON.stringify(body)}),
  getAnalytics: () => req<Analytics>(`/analytics/overview`),
  getItemHistory: (name:string) => req<ItemHistory>(`/analytics/items/${encodeURIComponent(name)}/history`),
  search: (q:string) => req<{data:ReceiptSummary[]}>(`/receipts?search=${encodeURIComponent(q)}`),
};
export type ReceiptSummary = { id:string; merchant:string|null; date:string|null; time:string|null; total:number|null; currency:string; status:string; confidence:number; items:{id:string;name:string;quantity:number;unitPrice:number|null;totalPrice:number;confidence:number}[]; createdAt:string };
export type ReceiptDetail = ReceiptSummary & { processing:unknown; ocr:{rawText:string;elements:{text:string;confidence:number}[]}|null; merchantConfidence:number; totalConfidence:number };
export type Analytics = { totalSpending:number; currency:string; receiptCount:number; averageReceiptValue:number; spendingByMerchant:{merchant:string;total:number;count:number}[]; spendingOverTime:{date:string;total:number;count:number}[] };
export type ItemHistory = { item:string; count:number; history:{receiptId:string;merchant:string|null;purchaseDate:string|null;quantity:number;unitPrice:number|null;totalPrice:number;currency:string}[] };

export const mockReceipts: ReceiptSummary[] = [
  { id:"rcpt_8f31a2", merchant:"Carrefour", date:"2026-09-02", time:"14:37", total:215, currency:"EGP", status:"completed", confidence:0.92, createdAt:"2026-09-02T14:37:00Z", items:[{id:"1",name:"Pepsi",quantity:2,unitPrice:35,totalPrice:70,confidence:0.91},{id:"2",name:"Chips",quantity:1,unitPrice:35,totalPrice:35,confidence:0.88},{id:"3",name:"Chocolate",quantity:2,unitPrice:45,totalPrice:90,confidence:0.84},{id:"4",name:"Bread",quantity:1,unitPrice:20,totalPrice:20,confidence:0.95}] },
  { id:"rcpt_9a22b1", merchant:"Metro", date:"2026-08-29", time:"18:12", total:340, currency:"EGP", status:"completed", confidence:0.89, createdAt:"2026-08-29T18:12:00Z", items:[{id:"1",name:"Milk",quantity:2,unitPrice:30,totalPrice:60,confidence:0.9},{id:"2",name:"Pepsi",quantity:1,unitPrice:35,totalPrice:35,confidence:0.92}] },
  { id:"rcpt_7c11d3", merchant:"Spinneys", date:"2026-08-24", time:"11:05", total:420, currency:"EGP", status:"needs_review", confidence:0.62, createdAt:"2026-08-24T11:05:00Z", items:[{id:"1",name:"Pepsl 330ml",quantity:2,unitPrice:35,totalPrice:70,confidence:0.55}] },
];
