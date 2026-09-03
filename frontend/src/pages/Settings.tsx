import { Card } from "../components/ui/Button";
import { useSettings, OcrProviderChoice } from "../hooks/useSettings";
export function Settings() {
  const { showLowConfidence, setShowLowConfidence, hideLowConfidenceItems, setHideLowConfidenceItems, ocrProvider, setOcrProvider } = useSettings();
  const opts: Array<{id:OcrProviderChoice; name:string; desc:string; badge?:string}> = [
    { id:"tesseract", name:"Normal OCR (Tesseract)", desc:"Fast, offline, best for printed English" },
    { id:"paddle", name:"PaddleOCR-VL 1.6 (0.9B)", desc:"First choice — 109 langs, skew/warp, handwriting + Arabic, Markdown/JSON", badge:"SOTA" },
    { id:"donut", name:"Donut (OCR-free)", desc:"End-to-end transformer, no OCR", badge:"experimental" },
    { id:"mock", name:"Mock", desc:"Fake data for UI testing" },
  ];
  return (
    <div className="max-w-[640px] space-y-4">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <Card className="p-5"><h3 className="font-bold">Profile</h3><p className="text-sm text-zinc-500">Eyad · user_demo</p></Card>
      <Card className="p-5"><h3 className="font-bold">Usage</h3><p className="text-sm">Unlimited (dev) — 44 verified in training set</p><div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2"><div className="h-2 bg-violet-600 rounded-full w-[15%]" /></div></Card>
      <Card className="p-5 space-y-3">
        <h3 className="font-bold">OCR Engine — test each individually</h3>
        <p className="text-xs text-zinc-500">Choose which engine runs when you scan. Paddle is currently validation-only; Donut replaces OCR entirely. More engines will appear here as we add them.</p>
        <div className="grid gap-2">
          {opts.map(o=>{
            const active=ocrProvider===o.id;
            return <button key={o.id} onClick={()=>setOcrProvider(o.id)} className={`text-left p-3 rounded-xl border flex items-center gap-3 ${active?"border-violet-500 bg-violet-50 dark:bg-violet-950/30":"border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"}`}>
              <span className={`w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${active?"border-violet-600":"border-zinc-300"}`}>{active && <span className="w-2 h-2 rounded-full bg-violet-600"/>}</span>
              <div className="flex-1 min-w-0"><p className="font-semibold text-sm flex items-center gap-2">{o.name}{o.badge && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700">{o.badge}</span>}</p><p className="text-xs text-zinc-500">{o.desc}</p></div>
              {active && <span className="text-xs font-bold text-violet-600">Active</span>}
            </button>;
          })}
        </div>
        <p className="text-xs text-zinc-500">Selected: <b>{ocrProvider}</b> — sent as <span className="font-mono">X-OCR-Provider</span> header on next scan.</p>
      </Card>
      <Card className="p-5 space-y-4">
        <h3 className="font-bold">Confidence</h3>
        <p className="text-xs text-zinc-500">App previously hid low-confidence items (even when correct). Toggle off to always show everything.</p>
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
          <div><p className="font-semibold text-sm">Show low-confidence warnings</p><p className="text-xs text-zinc-500">Amber highlight + “please correct” banner</p></div>
          <input type="checkbox" checked={showLowConfidence} onChange={e=>setShowLowConfidence(e.target.checked)} className="w-10 h-6 accent-violet-600" />
        </label>
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
          <div><p className="font-semibold text-sm">Hide low-confidence items</p><p className="text-xs text-zinc-500">When on, items &lt;70% are filtered from lists</p></div>
          <input type="checkbox" checked={hideLowConfidenceItems} onChange={e=>setHideLowConfidenceItems(e.target.checked)} className="w-10 h-6 accent-violet-600" />
        </label>
        {!showLowConfidence && !hideLowConfidenceItems && <p className="text-xs text-emerald-600 font-medium">✓ All items will be listed regardless of confidence — no filtering.</p>}
      </Card>
      <Card className="p-5"><h3 className="font-bold">API</h3><p className="text-xs text-zinc-500 break-all">Base: /api · Pipeline: orientation → variants → OCR bbox → line reconstruction → semantic → validation (Paddle) → confidence</p></Card>
    </div>
  );
}
