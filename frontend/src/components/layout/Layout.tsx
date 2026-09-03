import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useState } from "react";

const nav = [
  { to:"/", label:"Home", icon:"⌂" },
  { to:"/receipts", label:"Receipts", icon:"🧾" },
  { to:"/purchases", label:"Purchases", icon:"🛒" },
  { to:"/analytics", label:"Analytics", icon:"◈" },
  { to:"/download", label:"Download", icon:"⬇" },
  { to:"/convo", label:"Convo", icon:"✦" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const loc = useLocation();
  const nav2 = useNavigate();
  const [q,setQ]=useState("");
  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#0B0B14] text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-100 dark:border-zinc-800 supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 md:px-6 h-[56px] sm:h-[64px] flex items-center gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg sm:text-xl tracking-tight shrink-0"><span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 grid place-items-center text-white text-sm">◐</span><span className="hidden xs:inline">Receipts</span></Link>
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-6">
            <div className="flex-1 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2">
              <span className="opacity-50">⌕</span>
              <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==="Enter" && nav2(`/purchases?search=${encodeURIComponent(q)}`)} placeholder="Search Pepsi, Carrefour, August..." className="bg-transparent outline-none flex-1 text-sm min-w-0" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Unlimited · dev</span>
            <button onClick={toggle} aria-label="Toggle theme" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-sm shrink-0">{theme==="dark"?"☀":"☾"}</button>
            <Link to="/scan" className="hidden md:inline-flex bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-semibold shadow-lg shadow-violet-500/20 hover:brightness-105 transition text-sm shrink-0">+ Scan</Link>
            <Link to="/settings" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center text-white font-bold text-sm shrink-0">E</Link>
          </div>
        </div>
        <div className="md:hidden px-3 pb-2">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2">
            <span className="opacity-50 text-sm">⌕</span>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==="Enter" && nav2(`/purchases?search=${encodeURIComponent(q)}`)} placeholder="Search..." className="bg-transparent outline-none flex-1 text-sm min-w-0" />
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto flex">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[64px] h-[calc(100vh-64px)] p-6 overflow-y-auto">
          <nav className="space-y-1">
            {nav.map(n=>{
              const active=loc.pathname===n.to || loc.pathname.startsWith(n.to+"/");
              return <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition ${active?"bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg":"hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}><span>{n.icon}</span>{n.label}</Link>
            })}
            <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
              <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">⚙ Settings</Link>
            </div>
          </nav>
          <div className="mt-6 p-4 rounded-[1.25rem] bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
            <p className="font-bold text-sm">Scan faster</p><p className="text-xs opacity-80 mt-1">Align receipt, tap ◉, enhanced auto-cropped.</p>
          </div>
        </aside>
        <main className="flex-1 min-w-0 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-6 w-full">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40 safe-area-pb">
        {[
          { to:"/", label:"Home", icon:"⌂" },
          { to:"/receipts", label:"Receipts", icon:"🧾" },
          { to:"/scan", label:"Scan", icon:"◉", fab:true },
          { to:"/download", label:"Download", icon:"⬇" },
          { to:"/convo", label:"Convo", icon:"✦" },
          { to:"/settings", label:"Settings", icon:"⚙" },
        ].map(n=> n.fab ? <Link key={n.to} to={n.to} className="w-[52px] h-[52px] -mt-5 rounded-[1.1rem] bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white grid place-items-center text-[20px] shadow-lg shadow-violet-500/30 border-[3px] border-white dark:border-zinc-900 active:scale-95 transition shrink-0">{n.icon}</Link> : <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl text-[10px] font-medium min-w-[42px] ${loc.pathname===n.to || (n.to==="/settings" && loc.pathname.startsWith("/settings"))?"text-violet-600 dark:text-violet-400":"text-zinc-500"}`}><span className="text-[16px] leading-none">{n.icon}</span>{n.label}</Link>)}
      </nav>
    </div>
  );
}
