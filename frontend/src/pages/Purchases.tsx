import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Badge } from "../components/ui/Button";

const items=[
  { name:"Pepsi", last:"today", price:35, count:7, cat:"Drinks" },
  { name:"Chocolate", last:"today", price:45, count:5, cat:"Food" },
  { name:"Bread", last:"today", price:20, count:12, cat:"Food" },
  { name:"Milk", last:"yesterday", price:30, count:9, cat:"Groceries" },
];
const cats=["All","Food","Drinks","Household","Personal","Other"] as const;

export function Purchases() {
  const [cat,setCat]=useState("All"); const [q,setQ]=useState(""); const [sort,setSort]=useState("recent");
  let list=items.filter(i=> (cat==="All"||i.cat===cat) && i.name.toLowerCase().includes(q.toLowerCase()));
  if(sort==="most") list=[...list].sort((a,b)=>b.count-a.count);
  if(sort==="high") list=[...list].sort((a,b)=>b.price-a.price);
  return (
    <div className="space-y-4 max-w-[900px]">
      <h1 className="text-2xl font-extrabold">Your Purchases</h1>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search purchases..." className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm outline-none" />
      <div className="flex gap-2 overflow-x-auto pb-1">{cats.map(c=> <button key={c} onClick={()=>setCat(c)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${cat===c?"bg-zinc-900 text-white dark:bg-white dark:text-zinc-900":"bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"}`}>{c}</button>)}</div>
      <div className="flex gap-2 text-sm">
        <select value={sort} onChange={e=>setSort(e.target.value)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"><option value="recent">Recently purchased</option><option value="most">Most purchased</option><option value="high">Highest spending</option><option value="low">Lowest spending</option></select>
      </div>
      <p className="text-xs font-bold tracking-widest text-zinc-500">RECENTLY BOUGHT</p>
      <div className="grid gap-3">{list.map(it=> <Link key={it.name} to={`/purchases/${encodeURIComponent(it.name)}`} className="block"><Card className="p-4 flex items-center gap-4 hover:shadow-card transition"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 grid place-items-center text-white font-bold">{it.name[0]}</div><div className="flex-1"><p className="font-bold">{it.name}</p><p className="text-xs text-zinc-500">Last bought {it.last} · {it.count} times</p></div><div className="text-right"><p className="font-extrabold">EGP {it.price}</p><Badge color="blue">{it.cat}</Badge></div></Card></Link>)}</div>
    </div>
  );
}
export function ItemDetails() {
  return (
    <div className="max-w-[640px] mx-auto space-y-4">
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-extrabold">Pepsi 330ml</h1>
        <p className="text-zinc-500">You've bought this <b>7 times</b>.</p>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-2xl p-3"><p className="text-xs text-zinc-500">Total spent</p><p className="font-extrabold text-emerald-600">EGP 227</p></div>
          <div className="bg-sky-50 dark:bg-sky-950 rounded-2xl p-3"><p className="text-xs text-zinc-500">Times purchased</p><p className="font-extrabold text-sky-600">7</p></div>
          <div className="bg-violet-50 dark:bg-violet-950 rounded-2xl p-3"><p className="text-xs text-zinc-500">Most common</p><p className="font-bold">Carrefour</p></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-bold">Price history</h3>
        <svg viewBox="0 0 320 120" className="w-full h-28 mt-3">
          {(() => { const pts=[35,32,30,30,28,35,35]; const max=40; return <><polyline fill="none" stroke="#0EA5E9" strokeWidth="3" points={pts.map((v,i)=> `${20+i*45},${100 - v/max*80}`).join(" ")} />{pts.map((v,i)=> <circle key={i} cx={20+i*45} cy={100 - v/max*80} r="4" fill="#0EA5E9" />)}</>; })()}
        </svg>
        <div className="space-y-2 mt-2 text-sm">{[["EGP 35","Sep 2"],["EGP 32","Aug 21"],["EGP 30","Aug 4"],["EGP 30","Jul 18"]].map(([p,d])=> <div key={d} className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 py-2"><span>{p}</span><span className="text-zinc-500">{d}</span></div>)}</div>
      </Card>
    </div>
  );
}
