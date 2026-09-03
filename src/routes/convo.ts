import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const FILE = path.join(process.cwd(), "data", "convo.json");

function load(): Array<{id:string; role:"assistant"|"user"; text:string; at:string}> {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; }
}
function save(all: unknown){ fs.mkdirSync(path.dirname(FILE), { recursive:true }); fs.writeFileSync(FILE, JSON.stringify(all,null,2)); }

router.get("/", (_req,res)=>{
  res.json(load());
});

router.post("/", (req,res)=>{
  const text = String(req.body?.text||"").trim().slice(0,2000);
  if(!text) return res.status(400).json({error:"empty"});
  const all = load();
  all.push({ id: `msg_${Date.now()}`, role:"user", text, at: new Date().toISOString() });
  save(all);
  console.log(`[convo] user reply: ${text.slice(0,120)}`);
  res.json({ok:true, count: all.length});
});

router.post("/assistant", (req,res)=>{
  const text = String(req.body?.text||"").trim().slice(0,4000);
  if(!text) return res.status(400).json({error:"empty"});
  const all = load();
  all.push({ id: `msg_${Date.now()}`, role:"assistant", text, at: new Date().toISOString() });
  save(all);
  res.json({ok:true});
});

export default router;
