import { useEffect, useState } from "react";
export type OcrProviderChoice = "tesseract" | "paddle" | "donut" | "mock";
export function useSettings(){
  const [showLowConfidence, setShowLowConfidence]=useState(()=>{
    const v=localStorage.getItem("showLowConfidence");
    return v===null ? true : v==="true";
  });
  const [hideLowConfidenceItems, setHideLowConfidenceItems]=useState(()=>{
    const v=localStorage.getItem("hideLowConfidenceItems");
    return v==="true";
  });
  const [ocrProvider, setOcrProvider]=useState<OcrProviderChoice>(()=>{
    const v=localStorage.getItem("ocrProvider") as OcrProviderChoice | null;
    if(v==="chandra"){ localStorage.setItem("ocrProvider","tesseract"); return "tesseract"; }
    return v && ["tesseract","paddle","donut","mock"].includes(v) ? v : "tesseract";
  });
  useEffect(()=>{ localStorage.setItem("showLowConfidence", String(showLowConfidence)); },[showLowConfidence]);
  useEffect(()=>{ localStorage.setItem("hideLowConfidenceItems", String(hideLowConfidenceItems)); },[hideLowConfidenceItems]);
  useEffect(()=>{ localStorage.setItem("ocrProvider", ocrProvider); },[ocrProvider]);
  return { showLowConfidence, setShowLowConfidence, hideLowConfidenceItems, setHideLowConfidenceItems, ocrProvider, setOcrProvider };
}
