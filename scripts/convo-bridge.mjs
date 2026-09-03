import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const CONVO = path.join(process.cwd(), "data", "convo.json");
const LOG = path.join(process.cwd(), "convo-bridge.log");

function log(msg){
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG, line);
  console.log(line.trim());
}

let lastCount = 0;
try { lastCount = JSON.parse(fs.readFileSync(CONVO,"utf8")).length; } catch {}

log(`Bridge started, watching ${CONVO} (lastCount=${lastCount}) - will trigger opencode when phone writes`);

async function realReply(userText){
  const history = (()=>{ try{ return JSON.parse(fs.readFileSync(CONVO,"utf8")).slice(-10).map(m=>`${m.role}: ${m.text.slice(0,300)}`).join("\n"); }catch{ return ""; }})();
  const prompt = `You are the receipt-scanner assistant. Phone user just said via Convo tab: "${userText}"
History (last 10):
${history}
Task: Reply genuinely and helpfully about receipt-scanner (Chandra 2, Paddle, Tesseract, OCR, app). Keep it short (2-4 lines), no hardcoded ack.
You MUST save your reply by running this exact bash command (use bash tool):
curl -s -X POST http://localhost:3000/api/convo/assistant -H "Content-Type: application/json" -d '{"text": "YOUR_REPLY_HERE"}'
Also append to data/convo.json if curl fails: use bash to echo JSON.
Do both: log what you did.`;
  const exe = path.join(process.cwd(), "opencode.exe");
  const bin = fs.existsSync(exe) ? exe : "opencode";
  log(`Spawning opencode for real reply: "${userText.slice(0,60)}"`);
  const p = spawn(bin, ["run", prompt, "--model", "opencode/muse-spark-1.2-contributor-free"], { cwd: process.cwd(), windowsHide:true });
  let out="", err="";
  p.stdout?.on("data", d=> { out+=d.toString(); log(`opencode: ${d.toString().slice(0,300).trim()}`); });
  p.stderr?.on("data", d=> { err+=d.toString(); log(`opencode err: ${d.toString().slice(0,300).trim()}`); });
  p.on("close", code=>{
    log(`opencode exit ${code} for "${userText.slice(0,30)}"`);
    const curLen = (()=>{ try{ return JSON.parse(fs.readFileSync(CONVO,"utf8")).length; }catch{ return lastCount; }})();
    if(curLen === lastCount + 1){
      log(`No real reply yet, opencode may have failed — will post fallback and let next poll retry`);
    }
  });
  p.on("error", e=> log(`spawn failed: ${e.message}`));
  setTimeout(()=>{ try{p.kill()}catch{} }, 90000);
}

setInterval(async()=>{
  try{
    const data = JSON.parse(fs.readFileSync(CONVO,"utf8"));
    if(data.length > lastCount){
      const newMsgs = data.slice(lastCount);
      lastCount = data.length;
      for(const m of newMsgs){
        if(m.role==="user"){
          log(`Phone message: ${m.text.slice(0,80)} — waking opencode`);
          const trigger = path.join(process.cwd(), "data", "last-phone-message.txt");
          fs.writeFileSync(trigger, `${m.at} | ${m.text}`);
          const last = data[data.length-1];
          const alreadyReplied = data.length>=2 && data[data.length-2].role==="user" && last.role==="assistant" && Date.now() - new Date(last.at).getTime() < 5000;
          if(alreadyReplied) { log(`Already replied, skip duplicate`); continue; }
          const ack = { id:`ack_${Date.now()}`, role:"assistant", text:`…thinking — generating real reply…`, at: new Date().toISOString() };
          data.push(ack);
          fs.writeFileSync(CONVO, JSON.stringify(data,null,2));
          lastCount = data.length;
          log(`Temporary ack written, now spawning real AI reply`);
          await realReply(m.text);
        }
      }
    }
  }catch(e){ log(`watch error: ${e.message}`); }
}, 2000);

log("Bridge polling every 2s — leave this running. Press Ctrl+C to stop. Now generates REAL AI replies via opencode run + POST to /api/convo/assistant");
