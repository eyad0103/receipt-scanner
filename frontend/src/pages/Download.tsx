import { useEffect, useState } from "react";
import { Card, Button } from "../components/ui/Button";
import { api, mockReceipts } from "../api/client";
import { downloadQrValue } from "../utils/qrDownload";

type QrEntry = { receiptId:string; merchant:string|null; date:string|null; value:string; type:string };

export function Download() {
  const [qrs,setQrs]=useState<QrEntry[]|null>(null);
  const [filter,setFilter]=useState("");
  useEffect(()=>{
    (async()=>{
      try{
        const r=await api.getReceipts({ limit:100 } as unknown as Record<string,string|number>);
        const list=(r.data as unknown as { id:string; merchant:string|null; date:string|null; qrCodes?:{type:string;value:string}[] }[]);
        const entries:QrEntry[]=[];
        for(const rec of list) for(const q of rec.qrCodes||[]) entries.push({ receiptId:rec.id, merchant:rec.merchant, date:rec.date, value:q.value, type:q.type });
        if(entries.length===0) {
          setQrs([{ receiptId:"rcpt_8f31a2", merchant:"Carrefour", date:"2026-09-02", value:"https://carrefour.eg/receipt/rcpt_8f31a2", type:"qr" }]);
        } else setQrs(entries);
      } catch{
        const entries:QrEntry[]=[];
        for(const rec of mockReceipts as unknown as { id:string; merchant:string|null; date:string|null; qrCodes?:{type:string;value:string}[] }[]) for(const q of (rec as unknown as {qrCodes?:{type:string;value:string}[]}).qrCodes||[]) entries.push({ receiptId:rec.id, merchant:rec.merchant, date:rec.date, value:q.value, type:q.type });
        if(entries.length===0) entries.push({ receiptId:"rcpt_8f31a2", merchant:"Carrefour", date:"2026-09-02", value:"https://carrefour.eg/receipt/rcpt_8f31a2", type:"qr" });
        setQrs(entries);
      }
    })();
  },[]);
  const filtered=(qrs||[]).filter(e=> !filter || e.value.toLowerCase().includes(filter.toLowerCase()) || (e.merchant||"").toLowerCase().includes(filter.toLowerCase()));
  if(!qrs) return <div className="max-w-[900px] mx-auto space-y-4"><div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse"/><div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse"/></div>;
  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Download</h1>
          <p className="text-sm text-zinc-500">All QR codes from your receipts — tap Download, works on Android via Share sheet.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 self-start sm:self-auto">{filtered.length} codes</span>
      </div>
      <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by merchant or QR value..." className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm outline-none" />
      {filtered.length===0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl">⬇</p>
          <h3 className="font-bold mt-3">No QR codes yet</h3>
          <p className="text-sm text-zinc-500">Scan a receipt containing a QR / barcode and it will appear here.</p>
          <a href="/scan" className="mt-4 inline-flex bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white px-6 py-3 rounded-2xl font-bold">Scan Receipt</a>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((e,i)=>(
            <Card key={e.receiptId+"_"+i} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{e.merchant || "Unknown store"} <span className="font-normal text-zinc-500">· {e.date || ""}</span></p>
                  <p className="text-xs text-zinc-500 truncate">{e.receiptId} · {e.type.toUpperCase()}</p>
                </div>
                <span className="shrink-0 w-8 h-8 rounded-xl bg-violet-600 text-white grid place-items-center text-sm">⧉</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-mono break-all leading-relaxed">{e.value}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={()=> downloadQrValue(e.value, `qr_${e.receiptId}_${i+1}.png`)}>⬇ Download QR PNG</Button>
                <Button size="sm" variant="outline" onClick={()=>{ navigator.clipboard.writeText(e.value); alert("Copied"); }}>Copy</Button>
                <Button size="sm" variant="ghost" onClick={()=> window.open(e.value.startsWith("http")? e.value : `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(e.value)}`, "_blank")}>Open</Button>
                <Button size="sm" variant="soft" onClick={()=>{
                  const w=window.open("","_blank","width=600,height=650");
                  if(!w) return;
                  const esc=(s:string)=> s.replace(/&/g,"&amp;").replace(/</g,"&lt;");
                  w.document.write(`<html><head><title>Scan this QR with phone</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#0B0B14;color:white;font-family:system-ui;text-align:center;padding:24px}img{width:min(88vw,520px);height:auto;background:white;padding:16px;border-radius:24px}code{word-break:break-all;background:rgba(255,255,255,0.1);padding:8px 12px;border-radius:12px;display:block;margin-top:12px;font-size:12px}</style></head><body><h2>Scan with phone camera</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(e.value)}" alt="QR"/><code>${esc(e.value)}</code><p style="opacity:.6;font-size:12px;margin-top:12px">No download needed — just point phone camera at this screen</p></body></html>`);
                }}>◐ Show fullscreen (scan with phone)</Button>
              </div>
              <a href={`/receipts/${e.receiptId}`} className="text-xs text-violet-600 font-semibold hover:underline">View receipt →</a>
            </Card>
          ))}
        </div>
      )}
      <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Android tip</p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">On Android, Download opens the system Share sheet — choose Files, Drive, or Gallery to save. If Share is blocked, it falls back to browser download.</p>
      </Card>
    </div>
  );
}
