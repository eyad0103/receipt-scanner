import { Router } from "express";
import { loadDataset, getProductDictionary } from "../training/dataset";
import { trainFromSynthetic } from "../training/learner";

const router = Router();

router.get("/stats", (_req, res) => {
  const all = loadDataset();
  const dict = getProductDictionary();
  res.json({ verifiedCount: all.length, uniqueProducts: dict.size, topProducts: [...dict.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10) });
});

router.post("/seed", (req, res) => {
  const n = Math.min(100, parseInt((req.query.n as string)||"30",10)||30);
  trainFromSynthetic(n);
  res.json({ seeded: n, total: loadDataset().length });
});

router.get("/dataset", (_req,res)=>{
  res.json(loadDataset().slice(-20));
});

export default router;
