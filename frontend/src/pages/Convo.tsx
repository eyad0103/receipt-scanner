import { useEffect, useState } from "react";
import { Card, Button } from "../components/ui/Button";

type Msg = { id:string; role:"assistant"|"user"; text:string; at:string };

const GENUINE_TAKE = `My genuine take — what’s actually best if we implement it properly:

For YOUR receipts (English restaurant + Arabic mixed, 90° rotated/handwritten, faint thermal):

1. **Best overall: Chandra 2 (not Tesseract)** — if we can run it. It’s the only one that does layout-aware Markdown/JSON directly, 90+ langs, handwriting, tables. On your 1660 Ti 6GB it *barely* fits in HF bfloat16 with CPU offload; VLLM would be faster but needs 8GB+.

2. **Best practical offline today: PaddleOCR PP-OCRv4** — Arabic-native (٠١٢٣), handwriting far better than Tesseract, still offline, no 3GB download.

3. **Tesseract is “good enough” for clean printed English** (your GO.RESTAURANT test) but fails on Arabic/handwritten — that’s why your Donut/Paddle looked same (they fell back to Tesseract).

4. **Donut** is cool because it *replaces* OCR entirely (image→JSON), but needs fine-tuning on receipts — out-of-the-box it’s not better than Tesseract for your case.

If I had to ship tomorrow heavy: **Chandra HF as primary, Paddle as validation (what we just wired), Tesseract as fallback**. That would feel “heavy” — you’d actually see Chandra fix the 90° rotation + handwriting where Tesseract drops to 0.55.

Right now all 3 show “tesseract-fallback-not-installed” because native models aren’t downloaded — install them and you’ll see truly different outputs in Settings → OCR Engine.

Reply below and it goes to my laptop + opencode (saved to data/convo.json).`;

export function Convo(){
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [text,setText]=useState("");
  const [sending,setSending]=useState(false);
  const [err,setErr]=useState("");

  const load=async()=>{
    try{
      const r=await fetch("/api/convo");
      if(!r.ok) throw new Error(`${r.status}`);
      const j=await r.json();
      if(Array.isArray(j) && j.length) { setMsgs(j); setErr(""); }
      else setMsgs([{id:"genuine", role:"assistant", text:GENUINE_TAKE, at:new Date().toISOString()}]);
    }catch(e){
      setErr(e instanceof Error ? e.message : "load failed");
    }
  };
  useEffect(()=>{ load(); const id=setInterval(load,2000); const onVis=()=>{ if(document.visibilityState==="visible") load(); }; document.addEventListener("visibilitychange", onVis); return ()=>{ clearInterval(id); document.removeEventListener("visibilitychange", onVis); }; },[]);

  const send=async()=>{
    const t=text.trim(); if(!t) return;
    setSending(true); setErr("");
    try{
      const r=await fetch("/api/convo", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({text:t})});
      if(!r.ok) throw new Error((await r.json().catch(()=>({error:"send failed"}))).error || r.statusText);
      setText("");
      await load();
      setTimeout(load,800);
      setTimeout(load,2000);
    }catch(e){ setErr(e instanceof Error ? e.message : "send failed"); }
    setSending(false);
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold">Convo — genuine takes <span className="text-xs font-normal text-violet-600">{msgs.length} msgs</span></h1>
      <p className="text-xs text-zinc-500">Reply and it goes to laptop + opencode (data/convo.json). Bridge now spawns real AI reply via <code>opencode run --model muse-spark-1.2</code> → POST /api/convo/assistant. Polls every 2s.</p>
      {err && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">Convo API error: {err} — is backend on :3000 running? (run.bat)</p>}
      <div className="space-y-3">
        {msgs.map(m=>(
          <Card key={m.id} className={`p-4 ${m.role==="assistant"?"border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20":"bg-white dark:bg-zinc-900"}`}>
            <p className="text-xs font-bold tracking-widest opacity-60">{m.role==="assistant"?"ME — GENUINE TAKE":"YOU"} · {new Date(m.at).toLocaleString()}</p>
            <p className="text-sm whitespace-pre-wrap mt-2 leading-relaxed">{m.text}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4 flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Reply to my take..." className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none" />
        <Button onClick={send} disabled={sending||!text.trim()}>{sending?"Sending...":"Reply"}</Button>
      </Card>
      <Card className="p-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-800 dark:text-amber-300">Heavy note: Chandra needs 5.5GB VRAM download on first run (~3GB). Your F: has 872GB free, but 1660 Ti 6GB will be tight — HF will offload to CPU and be slow (90s+). VLLM needs 8GB.</p>
      </Card>
    </div>
  );
}
