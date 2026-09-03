import { Link } from "react-router-dom";
import { Badge, Card } from "../ui/Button";
export function ReceiptCard({ r }: { r: { id:string; merchant:string|null; date:string|null; time:string|null; total:number|null; currency:string; items:{name:string}[]; status:string; confidence:number } }) {
  const color = r.confidence < 0.7 ? "orange" as const : "green" as const;
  return (
    <Link to={`/receipts/${r.id}`} className="block group">
      <Card className="p-4 hover:shadow-card hover:-translate-y-0.5 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white">🛒</div>
          <span className="font-extrabold">{r.currency} {r.total ?? "—"}</span>
        </div>
        <h3 className="font-bold mt-3 leading-none">{r.merchant || "Unknown store"}</h3>
        <p className="text-xs text-zinc-500 mt-1">{r.date || "—"} · {r.time || ""} · {r.items.length} items {r.status==="needs_review" && <Badge color="orange">needs review</Badge>} {r.confidence<0.7 && <Badge color="orange">low confidence</Badge>}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 truncate">{r.items.map(i=>i.name).join(" · ")}</p>
        <div className="mt-3 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full ${color==="orange"?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${Math.round(r.confidence*100)}%`}}/></div>
      </Card>
    </Link>
  );
}
