"""Import CORD receipt line items (bluecopa reconciled, HF) into data/verified.json.
Tag map (inferred from viewer): 0=other, 1/2=item name, 3=qty, 4=qty-x, 5=unitprice, 7=price.
Usage: python scripts/import-cord.py [max_receipts]"""
import json, os, re, sys
from datasets import load_dataset

MAXR = int(sys.argv[1]) if len(sys.argv) > 1 else 100000
STOP = {"subtotal","total","grand","cash","change","tendered","card","debit","credit","tunai","kembali",
        "kembalian","bayar","gratis","free","discount","disc","tax","pajak","service","charge","payment",
        "terima","kasih","thank","you","pcs","items","item","qty","amount","due","balance","rounding",
        "sub","ttl","subttl","svttl","pb1","ppn","vat","rp","idr","tl","cg","tl.","x","tl","tl,","tl."}

def parse_price(s):
    t = re.sub(r"[^\d.,]", "", s or "")
    if not t: return None
    if "," in t and "." in t:
        t = t.replace(",", "") if t.rfind(".") > t.rfind(",") else t.replace(".", "").replace(",", ".")
    elif "," in t:
        parts = t.split(",")
        t = t.replace(",", "") if len(parts[-1]) == 3 else t.replace(",", ".")
    elif "." in t:
        parts = t.split(".")
        if len(parts) > 2 or (len(parts) == 2 and len(parts[-1]) == 3 and len(parts[0]) > 3):
            t = t.replace(".", "")
    try: return round(float(t), 2)
    except: return None

def extract(words, tags):
    items, cur = [], {"name": [], "qty": 1, "price": None}
    def flush():
        name = " ".join(cur["name"]).strip()
        if name and name.lower() not in STOP and len(name) >= 2 and cur["price"]:
            items.append((name, cur["qty"], cur["price"]))
    for w, t in zip(words, tags):
        if t in (1, 2):
            if cur["price"] is not None: flush(); cur = {"name": [], "qty": 1, "price": None}
            cur["name"].append(w)
        elif t == 3:
            if cur["name"] or cur["price"] is not None: flush(); cur = {"name": [], "qty": 1, "price": None}
            try: cur["qty"] = int(re.sub(r"\D", "", w) or "1")
            except: cur["qty"] = 1
        elif t == 7:
            p = parse_price(w)
            if p: cur["price"] = p
            flush(); cur = {"name": [], "qty": 1, "price": None}
    return items

DATA = os.path.join(os.getcwd(), "data", "verified.json")
allx = json.load(open(DATA, encoding="utf-8"))
have = len(allx)
added, seen_names = 0, set()
for split in ("train", "validation", "test"):
    ds = load_dataset("bluecopa/receipt-ser-cord-plus-coru-reconciled-v1", split=split)
    for r in ds:
        if added >= MAXR: break
        words, tags = r["words"], r["ner_tags"]
        if not words: continue
        items = extract(words, tags)
        if not items: continue
        total = round(sum(p for _, _, p in items), 2)
        allx.append({
            "id": f"cord_{split}_{r['id']}",
            "ocrText": "\n".join(f"{q} x {n} {p}" if q > 1 else f"{n} {p}" for n, q, p in items),
            "ocrElements": [{"text": n, "confidence": 0.95} for n, _, _ in items],
            "corrected": {
                "merchant": None,
                "items": [{"name": n, "quantity": q, "totalPrice": p} for n, q, p in items],
                "total": total,
            },
            "createdAt": "2026-09-03T00:00:00.000Z",
        })
        added += 1
        for n, _, _ in items: seen_names.add(n.lower())
allx = allx[-20000:]
json.dump(allx, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"receipts added: {added}, total examples: {len(allx)} (was {have}), unique CORD names: {len(seen_names)}")
