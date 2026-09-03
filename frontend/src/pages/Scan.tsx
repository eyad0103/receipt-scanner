import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../components/ui/Button";
import { api } from "../api/client";
import { downloadQrValue } from "../utils/qrDownload";
import { useSettings } from "../hooks/useSettings";

type Step = "camera"|"review"|"processing"|"result"|"confirm"|"error";
const steps = ["Receipt detected","Reading text","Finding products","Checking prices","Organizing purchase"];
type Item = { name:string; quantity:number; unitPrice:number|null; totalPrice:number; confidence:number };
type ReceiptState = { id:string; merchant:string; date:string; time:string; currency:string; items:Item[]; subtotal:number|null; tax:number|null; total:number|null; status:string; qrCodes?:{type:string;value:string;confidence:number}[] };

function enhanceCanvasSafe(src: HTMLCanvasElement): HTMLCanvasElement {
  try{
    const c=document.createElement("canvas"); c.width=src.width; c.height=src.height;
    const ctx=c.getContext("2d"); if(!ctx) return src; ctx.drawImage(src,0,0);
    try{
      const img=ctx.getImageData(0,0,c.width,c.height); const d=img.data;
      for(let i=0;i<d.length;i+=4){ const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; let v=(g-128)*1.35+128+10; v=Math.max(0,Math.min(255,v)); d[i]=d[i+1]=d[i+2]=v; }
      ctx.putImageData(img,0,0);
    }catch{}
    try{
      const tmp=document.createElement("canvas"); tmp.width=c.width; tmp.height=c.height; const tctx=tmp.getContext("2d"); if(!tctx) return c; tctx.drawImage(c,0,0);
      const k=[0,-1,0,-1,5,-1,0,-1,0]; const srcData=tctx.getImageData(0,0,c.width,c.height); const out=ctx.getImageData(0,0,c.width,c.height); const w=c.width,h=c.height;
      for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){ let r=0; for(let ky=-1;ky<=1;ky++) for(let kx=-1;kx<=1;kx++){ const idx=((y+ky)*w+(x+kx))*4; r+=srcData.data[idx]*k[(ky+1)*3+(kx+1)]; } const idx=(y*w+x)*4; const v=Math.max(0,Math.min(255,r)); out.data[idx]=out.data[idx+1]=out.data[idx+2]=v; }
      ctx.putImageData(out,0,0);
    }catch{}
    return c;
  }catch{ return src; }
}

export function Scan(){
  const { showLowConfidence, hideLowConfidenceItems } = useSettings();
  const [step,setStep]=useState<Step>("camera");
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState<string|null>(null);
  const [enhancedPreview,setEnhancedPreview]=useState<string|null>(null);
  const [useEnhanced,setUseEnhanced]=useState(true);
  const [prog,setProg]=useState(0);
  const [resultId,setResultId]=useState<string|null>(null);
  const [receipt,setReceipt]=useState<ReceiptState|null>(null);
  const [flash,setFlash]=useState(false);
  const [err,setErr]=useState<string|null>(null);
  const [camActive,setCamActive]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const nav=useNavigate();

  const genName=()=>{ const d=new Date(); const p=(n:number)=>String(n).padStart(2,"0"); return `receipt_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`; };

  const stopStream=()=>{ try{ streamRef.current?.getTracks().forEach(t=>t.stop()); }catch{} streamRef.current=null; setCamActive(false); };
  const startCamera=async()=>{
    stopStream();
    if(!navigator.mediaDevices?.getUserMedia) return;
    const tryGet=async(constraints:MediaStreamConstraints)=>{
      try{ const s=await navigator.mediaDevices.getUserMedia(constraints); return s; }catch{ return null; }
    };
    let s=await tryGet({ video:{ facingMode:{ ideal:"environment" }, width:{ ideal:1920 }, height:{ ideal:1080 } } });
    if(!s) s=await tryGet({ video:{ facingMode:{ ideal:"user" } } });
    if(!s) s=await tryGet({ video:true });
    if(!s) return;
    streamRef.current=s;
    const v=videoRef.current;
    if(v){ try{ v.srcObject=s; await v.play().catch(()=>{}); setCamActive(true); }catch{ setCamActive(!!s.getVideoTracks().length); } }
  };

  useEffect(()=>{ if(step!=="camera") { stopStream(); return; } startCamera(); return ()=> stopStream(); },[step]);

  const triggerNativeCamera=()=>{
    try{
      const inp=document.createElement("input"); inp.type="file"; inp.accept="image/*"; inp.setAttribute("capture","environment");
      inp.onchange=()=>{ const f=(inp.files&&inp.files[0])||null; if(f) handlePickedFile(f); inp.remove(); };
      inp.click();
    }catch{ document.getElementById("fallback-camera")?.click(); }
  };
  const triggerGallery=()=>{
    try{
      const inp=document.createElement("input"); inp.type="file"; inp.accept="image/jpeg,image/png,image/webp,image/*";
      inp.onchange=()=>{ const f=(inp.files&&inp.files[0])||null; if(f) handlePickedFile(f); inp.remove(); };
      inp.click();
    }catch{ document.getElementById("fallback-gallery")?.click(); }
  };

  const handlePickedFile=async(f:File)=>{
    try{
      if(f.size>15*1024*1024){ setErr("Image too large (max 15MB) — try a smaller photo."); return; }
      const name=genName();
      const url=URL.createObjectURL(f);
      const img=new Image();
      const loaded=await new Promise<HTMLImageElement>((res,rej)=>{ img.onload=()=>res(img); img.onerror=()=>rej(new Error("Invalid image")); img.src=url; setTimeout(()=>rej(new Error("Image load timeout")),5000); });
      const c=document.createElement("canvas"); c.width=loaded.width; c.height=loaded.height;
      const ctx=c.getContext("2d"); if(!ctx){ URL.revokeObjectURL(url); setErr("Canvas not supported"); return; }
      ctx.drawImage(loaded,0,0);
      let target=c;
      try{ const enh=enhanceCanvasSafe(c); if(useEnhanced) target=enh; setEnhancedPreview(enh.toDataURL("image/png")); }catch{ setEnhancedPreview(c.toDataURL("image/png")); }
      setPreview(c.toDataURL("image/png"));
      let outBlob:Blob|null=null;
      try{ outBlob=await new Promise<Blob|null>(res=> target.toBlob(b=>res(b),"image/png",0.92)); }catch{}
      if(!outBlob){ try{ outBlob=new Blob([await (await fetch(target.toDataURL("image/png"))).arrayBuffer()],{type:"image/png"}); }catch{ outBlob=f; } }
      const newFile=outBlob? new File([outBlob],name,{type:"image/png"}): new File([f],name,{type: f.type||"image/png"});
      setFile(newFile);
      URL.revokeObjectURL(url);
      setStep("review");
      setErr(null);
    }catch(e){ setErr(e instanceof Error? e.message : "Failed to process image — try Gallery again."); }
  };

  const captureFromVideo=async()=>{
    const v=videoRef.current;
    if(!camActive || !v || v.videoWidth===0 || v.videoHeight===0){ triggerNativeCamera(); return; }
    try{
      const W=v.videoWidth, H=v.videoHeight;
      const full=document.createElement("canvas"); full.width=W; full.height=H;
      const ctx=full.getContext("2d"); if(!ctx) { triggerNativeCamera(); return; }
      if(flash) try{ ctx.filter="brightness(1.4) contrast(1.2)"; }catch{}
      ctx.drawImage(v,0,0,W,H);
      const frameW=Math.round(W*0.78), frameH=Math.round(H*0.68), fx=Math.round((W-frameW)/2), fy=Math.round((H-frameH)/2);
      const crop=document.createElement("canvas"); crop.width=frameW; crop.height=frameH;
      const cctx=crop.getContext("2d"); if(!cctx){ triggerNativeCamera(); return; }
      cctx.drawImage(full, fx,fy,frameW,frameH,0,0,frameW,frameH);
      const enhanced=enhanceCanvasSafe(crop);
      const target=useEnhanced? enhanced : crop;
      const name=genName();
      const blob:Blob|null=await new Promise(res=> target.toBlob(b=>res(b),"image/png",0.92));
      const f=blob? new File([blob],name,{type:"image/png"}) : new File([],name);
      setFile(f); setPreview(crop.toDataURL("image/png")); setEnhancedPreview(enhanced.toDataURL("image/png"));
      setStep("review");
    }catch{ triggerNativeCamera(); }
  };

  const doUpload=async()=>{
    if(!file){ setErr("No image selected"); return; }
    setErr(null); setStep("processing"); setProg(0);
    let id:number=0 as unknown as number; let done=false;
    const tick=()=>{ if(!done) setProg(p=> Math.min(p+1, steps.length)); };
    id=window.setInterval(tick,500);
    try{
      const r=await api.uploadReceipt(file);
      setResultId(r.receiptId);
      let tries=0;
      const poll=window.setInterval(async()=>{
        tries++;
        try{
          const d=await api.getReceipt(r.receiptId) as unknown as { id:string; merchant:string|null; date:string|null; time:string|null; currency:string; total:number|null; subtotal:number|null; tax:number|null; status:string; confidence:number; items:Item[]; qrCodes?:{type:string;value:string;confidence:number}[]; processing:{processingStatus:string; errorMessage?:string} };
          if(d.processing?.processingStatus==="processing" && tries<25) return;
          window.clearInterval(poll); window.clearInterval(id); done=true; setProg(steps.length);
          if(d.processing?.processingStatus==="failed" || (d.items?.length===0 && !d.merchant)){
            setReceipt({ id:d.id, merchant:d.merchant||"", date:d.date||"", time:d.time||"", currency:d.currency||"EGP", items:d.items?.length? d.items : [{name:"",quantity:1,unitPrice:null,totalPrice:0,confidence:0}], subtotal:d.subtotal??null, tax:d.tax??null, total:d.total??null, status:"needs_review", qrCodes:d.qrCodes||[] });
            if(showLowConfidence) setErr(d.processing?.errorMessage || "We couldn't confidently read this — please correct below.");
            else setErr(null);
          } else {
            setReceipt({ id:d.id, merchant:d.merchant||"", date:d.date||"", time:d.time||"", currency:d.currency||"EGP", items:d.items?.length? d.items : [{name:"",quantity:1,unitPrice:null,totalPrice:0,confidence:0.5}], subtotal:d.subtotal??null, tax:d.tax??null, total:d.total??null, status:d.status, qrCodes:d.qrCodes||[] });
            if(showLowConfidence && ((d.confidence??1)<0.7 || d.status==="needs_review")) setErr("Low confidence — please review highlighted fields.");
            else setErr(null);
          }
          setStep("result");
        }catch{
          if(tries>12){ window.clearInterval(poll); window.clearInterval(id); done=true; setStep("error"); setErr("We couldn't read this receipt. Try better lighting, whole receipt visible, less blur."); }
        }
      },800);
    }catch(e){ window.clearInterval(id); done=true; setStep("error"); setErr(e instanceof Error? e.message:"Upload failed — check connection and try again."); }
  };

  const saveEdit=async()=>{
    if(!receipt||!resultId) return;
    const cleaned={ merchant:receipt.merchant, date:receipt.date, time:receipt.time, currency:receipt.currency, subtotal:receipt.subtotal, tax:receipt.tax, total:receipt.total, items:receipt.items.filter(it=>it.name.trim()), status:"completed" as const };
    try{ await api.updateReceipt(resultId, cleaned); setReceipt({...receipt, status:"completed"}); setStep("confirm"); }catch(e){ setErr(e instanceof Error? e.message:"Save failed"); }
  };

  if(step==="camera") return (
    <div className="max-w-[480px] mx-auto">
      <Card className="overflow-hidden">
        <div className="p-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800">
          <button onClick={()=>nav(-1)} className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 grid place-items-center">←</button>
          <h2 className="font-bold">Scan</h2>
          <label className="ml-auto flex items-center gap-1 text-xs cursor-pointer select-none"><input type="checkbox" checked={useEnhanced} onChange={e=>setUseEnhanced(e.target.checked)} /> Enhance</label>
          <button onClick={()=>setFlash(v=>!v)} className={`text-xs px-3 py-1 rounded-full border ${flash?"bg-amber-400 text-zinc-900 border-amber-400":"bg-zinc-100 dark:bg-zinc-800 border-transparent"}`}>⚡</button>
        </div>
        <div className="relative bg-zinc-950 aspect-[3/4] grid place-items-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted onError={()=>setCamActive(false)} className={`absolute inset-0 w-full h-full object-cover ${camActive?"opacity-70":"opacity-0"}`} />
          <div className="relative w-[78%] h-[68%] border-2 border-white/80 rounded-[1.25rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none">
            <div className="absolute -top-1 -left-1 w-5 h-5 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" /><div className="absolute -top-1 -right-1 w-5 h-5 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" /><div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" /><div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />
          </div>
          <button onClick={captureFromVideo} className={`absolute bottom-5 left-1/2 -translate-x-1/2 w-[64px] h-[64px] rounded-full grid place-items-center text-[26px] shadow-xl ring-4 ring-white/20 active:scale-95 transition ${camActive?"bg-white text-zinc-900":"bg-white/90 text-zinc-900"}`}>◉</button>
        </div>
        <div className="p-3 grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={triggerGallery}>Gallery</Button>
          <Button onClick={triggerNativeCamera} className="!bg-gradient-to-br from-violet-600 to-fuchsia-500">📷 Camera</Button>
          <Button variant="outline" onClick={captureFromVideo}>Live</Button>
        </div>
      </Card>
      <input id="fallback-gallery" type="file" accept="image/jpeg,image/png,image/webp,image/*" style={{position:"fixed",left:"-9999px",opacity:0,pointerEvents:"none"}} tabIndex={-1} onChange={e=>{ const f=e.target.files?.[0]; if(f) handlePickedFile(f); e.currentTarget.value=""; }} />
      <input id="fallback-camera" type="file" accept="image/*" capture="environment" style={{position:"fixed",left:"-9999px",opacity:0,pointerEvents:"none"}} tabIndex={-1} onChange={e=>{ const f=e.target.files?.[0]; if(f) handlePickedFile(f); e.currentTarget.value=""; }} />
    </div>
  );

  if(step==="review") return (
    <div className="max-w-[520px] mx-auto space-y-4">
      <h2 className="text-xl font-extrabold">Review</h2>
      <p className="text-xs text-emerald-600 font-medium">✓ Saved {file?.name}</p>
      {preview && (
        <Card className="overflow-hidden p-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-xs text-zinc-500 text-center">Original</p><img src={preview} alt="original" className="w-full rounded-xl max-h-[40vh] object-contain bg-zinc-100 dark:bg-zinc-800" /></div>
            <div><p className="text-xs text-emerald-600 text-center">Enhanced</p><img src={enhancedPreview||preview} alt="enhanced" className="w-full rounded-xl max-h-[40vh] object-contain bg-zinc-100 dark:bg-zinc-800" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm justify-center"><input type="checkbox" checked={useEnhanced} onChange={e=>setUseEnhanced(e.target.checked)} /> Use enhanced</label>
        </Card>
      )}
      {err && <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm">⚠ {err}</div>}
      <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={()=>setStep("camera")}>Retake</Button><Button className="flex-1" onClick={doUpload}>Scan Receipt</Button></div>
      <Button variant="soft" size="sm" onClick={()=>{ const url=useEnhanced&&enhancedPreview? enhancedPreview:preview; if(!url) return; const a=document.createElement("a"); a.href=url; a.download=file?.name||genName(); a.click(); }}>⬇ Save again</Button>
    </div>
  );

  if(step==="processing") return (
    <div className="max-w-[520px] mx-auto"><Card className="p-8 text-center"><div className="w-12 h-12 mx-auto rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" /><h2 className="font-extrabold text-xl mt-4">Analyzing…</h2><div className="mt-6 space-y-3 text-left">{steps.map((s,i)=>{ const done=i<prog-1,active=i===prog-1; return <div key={s} className={`flex items-center gap-3 p-3 rounded-xl ${active?"bg-violet-50 dark:bg-violet-950":""} ${done?"opacity-100":"opacity-60"}`}><span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${done?"bg-emerald-500 text-white":active?"bg-violet-600 text-white animate-pulse":"bg-zinc-200 dark:bg-zinc-800"}`}>{done?"✓":"●"}</span><span className="text-sm font-medium">{s}</span></div>; })}</div></Card></div>
  );
  if(step==="error") return (
    <div className="max-w-[520px] mx-auto"><Card className="p-8 text-center"><div className="w-16 h-16 mx-auto rounded-full bg-amber-100 grid place-items-center text-2xl">⚠</div><h2 className="font-extrabold text-xl mt-3">Couldn't read</h2><p className="text-sm text-zinc-500 mt-2">{err}</p><div className="flex gap-3 mt-6"><Button variant="outline" className="flex-1" onClick={()=>setStep("camera")}>Retake</Button><Button className="flex-1" onClick={()=>setStep("review")}>Try Again</Button></div></Card></div>
  );
  if(step==="result" && receipt) {
    const displayItems = hideLowConfidenceItems ? receipt.items.filter(it=> it.confidence>=0.7) : receipt.items;
    return (
    <div className="max-w-[560px] mx-auto space-y-4">
      {showLowConfidence && err && <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm">⚠ {err}</div>}
      <Card className="p-6 space-y-4">
        <div className="text-center border-b border-dashed border-zinc-200 dark:border-zinc-700 pb-4">
          <label className="text-xs font-bold tracking-widest text-zinc-500">MERCHANT</label>
          <input value={receipt.merchant} onChange={e=>setReceipt({...receipt, merchant:e.target.value})} placeholder="Store name" className="mt-1 w-full text-center text-2xl font-extrabold bg-transparent border-b border-dashed border-zinc-300 dark:border-zinc-700 outline-none focus:border-violet-500" />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input value={receipt.date} onChange={e=>setReceipt({...receipt, date:e.target.value})} placeholder="YYYY-MM-DD" className="text-sm bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 border" />
            <input value={receipt.time} onChange={e=>setReceipt({...receipt, time:e.target.value})} placeholder="14:37" className="text-sm bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 border" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between"><p className="text-xs font-bold tracking-widest text-zinc-500">ITEMS</p><Button size="sm" variant="soft" onClick={()=>setReceipt({...receipt, items:[...receipt.items, {name:"",quantity:1,unitPrice:null,totalPrice:0,confidence:1}]})}>+ Add</Button></div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 mt-2">
            {displayItems.length===0 && hideLowConfidenceItems && <p className="text-xs text-zinc-500 py-2">All items hidden by confidence filter — disable in Settings to show.</p>}
            {(hideLowConfidenceItems ? displayItems : receipt.items).map((it,i)=>{
              const origIdx = receipt.items.indexOf(it);
              return (
              <div key={origIdx} className={`py-3 grid gap-2 ${showLowConfidence && it.confidence<0.7?"bg-amber-50 dark:bg-amber-950/40 -mx-2 px-2 rounded-xl border border-amber-200 dark:border-amber-800":""}`}>
                <div className="flex gap-2">
                  <input value={it.name} onChange={e=>{ const c=[...receipt.items]; c[origIdx]={...c[origIdx], name:e.target.value}; setReceipt({...receipt, items:c}); }} placeholder="Item name" className="flex-1 font-semibold bg-white dark:bg-zinc-900 rounded-xl px-3 py-2 border" />
                  <button onClick={()=>{ const c=receipt.items.filter((_,idx)=>idx!==origIdx); setReceipt({...receipt, items:c}); }} className="px-2 text-zinc-400 hover:text-red-500">✕</button>
                </div>
                {showLowConfidence && it.confidence<0.7 && <p className="text-xs text-amber-700 dark:text-amber-300">⚠ Low confidence</p>}
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs">Qty<input type="number" value={it.quantity} onChange={e=>{ const c=[...receipt.items]; c[origIdx]={...c[origIdx], quantity:parseFloat(e.target.value)||0}; setReceipt({...receipt, items:c}); }} className="w-full mt-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-2 py-2 border" /></label>
                  <label className="text-xs">Unit<input type="number" step="0.01" value={it.unitPrice??""} onChange={e=>{ const c=[...receipt.items]; c[origIdx]={...c[origIdx], unitPrice:e.target.value===""?null:parseFloat(e.target.value)}; setReceipt({...receipt, items:c}); }} className="w-full mt-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-2 py-2 border" /></label>
                  <label className="text-xs">Total<input type="number" step="0.01" value={it.totalPrice} onChange={e=>{ const c=[...receipt.items]; c[origIdx]={...c[origIdx], totalPrice:parseFloat(e.target.value)||0}; setReceipt({...receipt, items:c}); }} className="w-full mt-1 bg-white dark:bg-zinc-900 rounded-xl px-2 py-2 border-2 border-violet-200 font-bold" /></label>
                </div>
              </div>
              );
            })}
           </div>
        </div>
        <div className="space-y-2 text-sm border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <label className="flex justify-between items-center">Subtotal <input type="number" step="0.01" value={receipt.subtotal??""} onChange={e=>setReceipt({...receipt, subtotal:e.target.value===""?null:parseFloat(e.target.value)})} className="w-28 text-right bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 border" /></label>
          <label className="flex justify-between items-center">Tax <input type="number" step="0.01" value={receipt.tax??""} onChange={e=>setReceipt({...receipt, tax:e.target.value===""?null:parseFloat(e.target.value)})} className="w-28 text-right bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 border" /></label>
          <label className="flex justify-between items-center font-extrabold">TOTAL <input type="number" step="0.01" value={receipt.total??""} onChange={e=>setReceipt({...receipt, total:e.target.value===""?null:parseFloat(e.target.value)})} className="w-28 text-right bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl px-3 py-2 border-2 border-emerald-300 font-extrabold placeholder:text-zinc-400" /></label>
        </div>
        {receipt.qrCodes && receipt.qrCodes.length>0 && (
          <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 p-4">
            <p className="text-xs font-bold tracking-widest text-violet-700 dark:text-violet-300">QR CODE</p>
            {receipt.qrCodes.map((qr,i)=>(
              <div key={i} className="mt-3 flex flex-col gap-2">
                <p className="text-xs font-mono break-all bg-white dark:bg-zinc-900 rounded-xl p-2 border">{qr.value}</p>
                <div className="flex flex-wrap gap-2"><Button size="sm" onClick={async()=>{ await downloadQrValue(qr.value, `qr_${receipt.id}_${i+1}.png`); }}>⬇ Download</Button><Button size="sm" variant="outline" onClick={()=>{ navigator.clipboard.writeText(qr.value); alert("Copied"); }}>Copy</Button></div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={()=>setStep("camera")}>Retake</Button><Button className="flex-1" onClick={saveEdit}>Confirm & Save</Button></div>
    </div>
  );
  }
  return <div className="max-w-[520px] mx-auto text-center"><Card className="p-8"><div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 grid place-items-center text-2xl">✓</div><h2 className="font-extrabold text-xl mt-3">Saved</h2><p className="text-zinc-500 text-sm mt-1">{receipt?.items.length||0} items saved.</p><div className="flex gap-3 mt-6"><Button variant="outline" className="flex-1" onClick={()=>nav(`/receipts/${resultId||""}`)}>View</Button><Button className="flex-1" onClick={()=>{ setReceipt(null); setResultId(null); setStep("camera"); }}>Scan Again</Button></div></Card></div>;
}
