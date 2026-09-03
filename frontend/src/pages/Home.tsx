import { Link } from "react-router-dom";
import { Card, Badge } from "../components/ui/Button";
import { ReceiptCard } from "../components/receipt/ReceiptCard";
import { mockReceipts } from "../api/client";
import { Donut, LineChart } from "../components/charts/MiniCharts";

export function Home() {
  const greeting = new Date().getHours()<12?"Good morning": new Date().getHours()<18?"Good afternoon":"Good evening";
  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-tight leading-none">{greeting}</h1>
        <p className="text-zinc-500 mt-1">Here's what you've bought recently.</p>
      </div>

      <Card className="relative overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 opacity-90" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
        <div className="relative text-white">
          <h2 className="text-2xl font-extrabold">Scan a new receipt</h2>
          <p className="opacity-90 mt-1">Take a photo and we'll organize everything automatically.</p>
          <Link to="/scan" className="mt-4 inline-flex bg-white text-zinc-900 px-6 py-3 rounded-2xl font-bold shadow-lg">Scan Receipt →</Link>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2">
          <p className="text-xs font-semibold tracking-widest text-zinc-500">SPENDING OVERVIEW</p>
          <p className="text-sm text-zinc-500">This month</p>
          <p className="text-3xl font-extrabold mt-1">EGP 4,280 <span className="text-sm font-semibold text-emerald-600">↑ 8.4% vs last month</span></p>
          <div className="mt-4"><LineChart data={[{date:"Aug 20",total:420},{date:"Aug 24",total:180},{date:"Aug 29",total:340},{date:"Sep 2",total:215},{date:"Sep 5",total:560}]} /></div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold tracking-widest text-zinc-500">CATEGORIES</p>
          <div className="mt-4"><Donut segments={[{label:"Groceries",value:48,color:"#8B5CF6"},{label:"Food",value:27,color:"#0EA5E9"},{label:"Household",value:15,color:"#F59E0B"},{label:"Other",value:10,color:"#E5E7EB"}]} /></div>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Groceries</span><Badge color="purple">48%</Badge></div>
            <div className="flex justify-between"><span>Food</span><Badge color="blue">27%</Badge></div>
            <div className="flex justify-between"><span>Household</span><Badge color="orange">15%</Badge></div>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Recent receipts</h3><Link to="/receipts" className="text-sm text-violet-600 font-semibold">View all →</Link></div>
        <div className="grid md:grid-cols-2 gap-4 mt-3">{mockReceipts.map(r=> <ReceiptCard key={r.id} r={r} />)}</div>
      </div>

      <Card className="p-5">
        <h3 className="font-bold">Insights</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li className="flex gap-2"><span className="text-emerald-500">●</span> You spent <b>EGP 620</b> at Carrefour this month.</li>
          <li className="flex gap-2"><span className="text-sky-500">●</span> You've bought <b>Pepsi 3 times</b> this month.</li>
          <li className="flex gap-2"><span className="text-violet-500">●</span> Your average receipt is <b>EGP 243</b>.</li>
        </ul>
      </Card>
    </div>
  );
}
