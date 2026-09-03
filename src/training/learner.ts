import { getProductDictionary, getMerchantDictionary } from "./dataset";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function closestMatch(input: string, dict: Map<string, number>, maxDist = 2): string | null {
  const low = input.toLowerCase().trim();
  if (dict.has(low)) return low;
  let best: string | null = null;
  let bestDist = Infinity;
  let bestFreq = 0;
  for (const [k, freq] of dict) {
    if (freq < 2) continue;
    if (k.length < 3 || low.length < 3) continue;
    const d = levenshtein(low, k);
    if (d <= maxDist && (d < bestDist || (d === bestDist && freq > bestFreq))) {
      bestDist = d; bestFreq = freq; best = k;
    }
  }
  return best;
}

export function correctProductName(raw: string, dict = getProductDictionary()): { corrected: string; wasCorrected: boolean; confidenceBoost: number } {
  if (!raw || raw.length < 2) return { corrected: raw, wasCorrected: false, confidenceBoost: 0 };
  const match = closestMatch(raw, dict, 2);
  if (match && match !== raw.toLowerCase().trim()) {
    const freq = dict.get(match) || 1;
    const boost = Math.min(0.15, 0.05 + Math.log10(freq) * 0.02);
    return { corrected: match, wasCorrected: true, confidenceBoost: boost };
  }
  return { corrected: raw, wasCorrected: false, confidenceBoost: 0 };
}

export function correctMerchant(raw: string | null, dict = getMerchantDictionary()): string | null {
  if (!raw) return raw;
  const match = closestMatch(raw, dict, 2);
  return match ? match : raw;
}

export function trainFromSynthetic(count = 30): void {
  const { saveExample } = require("./dataset");
  const merchants = ["Carrefour","Metro","Spinneys","Lulu","Panda"];
  const products = ["Pepsi 330ml","Chips","Chocolate","Bread","Milk","Rice","Oil","Cheese","Yogurt","Water","Coffee"];
  for (let i = 0; i < count; i++) {
    const m = merchants[Math.floor(Math.random()*merchants.length)];
    const n = 2+Math.floor(Math.random()*3);
    const items: Array<{name:string;quantity:number;totalPrice:number}> = [];
    for (let j=0;j<n;j++) items.push({ name: products[Math.floor(Math.random()*products.length)], quantity: Math.random()<0.5?1:2, totalPrice: 12+Math.floor(Math.random()*60) });
    saveExample({
      id: `syn_${Date.now()}_${i}`,
      ocrText: [m, ...items.map(it=>`${it.name} ${it.totalPrice.toFixed(2)}`), `TOTAL ${items.reduce((a,b)=>a+b.totalPrice,0).toFixed(2)}`].join("\n"),
      ocrElements: [],
      corrected: { merchant: m, items, total: items.reduce((a,b)=>a+b.totalPrice,0) },
      createdAt: new Date().toISOString(),
    });
  }
}
