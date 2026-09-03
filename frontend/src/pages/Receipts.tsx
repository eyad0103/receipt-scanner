import { useEffect, useState } from "react";
import { ReceiptCard } from "../components/receipt/ReceiptCard";
import { Card, Skeleton } from "../components/ui/Button";
import { api, mockReceipts, ReceiptSummary } from "../api/client";

export function Receipts() {
  const [data,setData]=useState<ReceiptSummary[]|null>(null);
  const [q,setQ]=useState(""); const [loading,setLoading]=useState(true);
  useEffect(()=>{ (async()=>{ try{ const r=await api.getReceipts({}); setData(r.data);}catch{ setData(mockReceipts);} setLoading(false); })(); },[]);
  const list=data||mockReceipts;
  const filtered=q? list.filter(r=> (r.merchant||"").toLowerCase().includes(q.toLowerCase()) || r.items.some(i=>i.name.toLowerCase().includes(q.toLowerCase()))): list;
  if(loading) return <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i=> <Skeleton key={i} className="h-32" />)}</div>;
  if(filtered.length===0) return <Card className="p-12 text-center"><p className="text-4xl">🧾</p><h3 className="font-bold mt-3">No receipts yet</h3><p className="text-sm text-zinc-500">Your scanned receipts will appear here.</p><a href="/scan" className="mt-4 inline-flex bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white px-6 py-3 rounded-2xl font-bold">Scan Your First Receipt</a></Card>;
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search receipts, items, merchants..." className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm outline-none" />
        <select className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 text-sm"><option>All</option><option>Completed</option><option>Needs review</option></select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">{filtered.map(r=> <ReceiptCard key={r.id} r={r} />)}</div>
      <Card className="p-4">
        <p className="text-xs font-bold tracking-widest text-zinc-500">TIMELINE</p>
        <div className="mt-3 space-y-0">
          {[
            { m:"SEPTEMBER", items:[{d:"Sep 2", t:"Carrefour", a:215}]},
            { m:"AUGUST", items:[{d:"Aug 29",t:"Metro",a:340},{d:"Aug 24",t:"Carrefour",a:180},{d:"Aug 18",t:"Spinneys",a:420}]},
          ].map(g=> <div key={g.m}><p className="text-xs font-bold text-zinc-400 mt-4">{g.m}</p>{g.items.map(it=> <div key={it.d} className="flex gap-3 py-2"><span className="w-2 h-2 mt-1.5 rounded-full bg-violet-500"/><div className="flex-1 border-l border-zinc-200 dark:border-zinc-800 pl-3"><p className="text-sm font-semibold">{it.d} — {it.t}</p><p className="text-sm text-zinc-500">EGP {it.a}</p></div></div>)}</div>)}
        </div>
      </Card>
    </div>
  );
}
export function ReceiptDetails() {
  return <Card className="p-6 max-w-[600px] mx-auto"><h2 className="text-2xl font-extrabold">Carrefour</h2><p className="text-sm text-zinc-500">September 2 · 2:37 PM · EGP 215</p><div className="mt-4 space-y-3">{[{n:"Pepsi",q:"2 × EGP 35",a:70},{n:"Chips",q:"1 × EGP 35",a:35},{n:"Chocolate",q:"2 × EGP 45",a:90}].map(it=> <div key={it.n} className="flex justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl"><div><p className="font-semibold">{it.n}</p><p className="text-xs text-zinc-500">{it.q}</p></div><span className="font-bold">EGP {it.a}</span></div>)}<a href="/purchases/Pepsi" className="block text-center text-sm text-violet-600 font-semibold mt-3">Tap an item to see its purchase history →</a></div></Card>;
}
