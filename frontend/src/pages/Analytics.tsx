import { useState } from "react";
import { Card, Badge } from "../components/ui/Button";
import { LineChart, Donut } from "../components/charts/MiniCharts";
const periods=["Week","Month","3 Months","Year"] as const;
export function Analytics() {
  const [p,setP]=useState<typeof periods[number]>("Month");
  return (
    <div className="space-y-4 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-bold tracking-widest text-zinc-500">SPENDING</p><h1 className="text-3xl font-extrabold">EGP 4,280 <span className="text-sm font-semibold text-zinc-500">This month</span></h1></div>
        <div className="hidden md:flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1">{periods.map(x=> <button key={x} onClick={()=>setP(x)} className={`px-4 py-1.5 rounded-xl text-sm font-semibold ${p===x?"bg-white dark:bg-zinc-900 shadow":"text-zinc-500"}`}>{x}</button>)}</div>
      </div>
      <div className="flex md:hidden bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 w-fit">{periods.map(x=> <button key={x} onClick={()=>setP(x)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${p===x?"bg-white dark:bg-zinc-900 shadow":"text-zinc-500"}`}>{x}</button>)}</div>

      <Card className="p-5">
        <h3 className="font-bold">Spending over time</h3>
        <LineChart data={[{date:"W1",total:420},{date:"W2",total:680},{date:"W3",total:540},{date:"W4",total:820}]} />
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold">Categories</h3>
          <div className="mt-3"><Donut segments={[{label:"Groceries",value:48,color:"#8B5CF6"},{label:"Food",value:27,color:"#0EA5E9"},{label:"Household",value:15,color:"#F59E0B"},{label:"Other",value:10,color:"#E5E7EB"}]} /></div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold">Stores</h3>
          <div className="space-y-3 mt-3">
            {[{n:"Carrefour",a:3240,c:12},{n:"Metro",a:1820,c:7},{n:"Spinneys",a:940,c:3}].map(s=> <div key={s.n} className="flex items-center gap-3"><div className="flex-1"><p className="font-semibold text-sm">{s.n} <Badge color="purple">{s.c} receipts</Badge></p><div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1"><div className="h-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full" style={{width:`${s.a/3240*100}%`}}/></div></div><span className="font-bold">EGP {s.a}</span></div>)}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold">Frequently purchased</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {["Pepsi","Bread","Milk","Chocolate"].map(n=> <div key={n} className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-3 text-center"><p className="font-bold text-sm">{n}</p><p className="text-xs text-zinc-500">7 times</p></div>)}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold">Carrefour</h3>
        <p className="text-sm text-zinc-500">12 receipts · EGP 3,240 spent · Avg EGP 270</p>
        <div className="mt-3 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"><div className="h-2 bg-violet-600 rounded-full w-[68%]" /></div>
      </Card>
    </div>
  );
}
