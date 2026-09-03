import * as React from "react";
export function Button({ variant="primary", size="md", className="", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"ghost"|"outline"|"soft", size?: "sm"|"md"|"lg" }) {
  const base="inline-flex items-center justify-center font-semibold rounded-2xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50";
  const v={ primary:"bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:brightness-105", ghost:"bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800", outline:"border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50", soft:"bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300"}[variant];
  const s={ sm:"px-3 py-1.5 text-sm", md:"px-5 py-3 text-sm", lg:"px-8 py-4 text-base rounded-[1.25rem]"}[size];
  return <button className={`${base} ${v} ${s} ${className}`} {...p} />;
}
export function Card({ className="", ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-soft border border-zinc-100 dark:border-zinc-800 ${className}`} {...p} />;
}
export function Badge({ color="zinc", ...p }: React.HTMLAttributes<HTMLSpanElement> & { color?: "green"|"blue"|"purple"|"orange"|"red"|"yellow"|"zinc" }) {
  const m={ green:"bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", blue:"bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300", purple:"bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300", orange:"bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300", red:"bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300", yellow:"bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300", zinc:"bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}[color];
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${m}`} {...p} />;
}
export function Skeleton({ className="" }: { className?: string }) { return <div className={`animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl ${className}`} />; }
