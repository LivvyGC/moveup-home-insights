export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
export function parseArr(v: unknown): unknown[] {
  try {
    const p: unknown = typeof v === "string" ? JSON.parse(v) : v;
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
export function yesProbability(m: Record<string, unknown>): number | null {
  const outcomes = parseArr(m.outcomes).map(String);
  const prices = parseArr(m.outcomePrices).map(Number);
  const i = outcomes.findIndex(o => o.trim().toLowerCase() === "yes");
  if (i < 0 || i >= prices.length) return null;
  const p = prices[i];
  return Number.isFinite(p) && p >= 0 && p <= 1 ? p * 100 : null;
}
export function matchesAll(question: string, tokens: string[]): boolean {
  const q = question.toLowerCase();
  return tokens.every(t => q.includes(t.toLowerCase()));
}
export interface Pick { question: string; probability: number; volume: number; }
export function pickBestMarket(data: unknown, tokens: string[]): Pick | null {
  const events = isRecord(data) && Array.isArray(data.events) ? data.events : [];
  const found: Pick[] = [];
  for (const e of events) {
    if (!isRecord(e) || !Array.isArray(e.markets)) continue;
    for (const m of e.markets) {
      if (!isRecord(m) || m.active !== true || m.closed === true) continue;
      if (typeof m.question !== "string" || !matchesAll(m.question,tokens)) continue;
      const probability = yesProbability(m);
      if (probability === null) continue;
      found.push({question:m.question,probability,volume:Number(m.volume)||0});
    }
  }
  found.sort((a,b)=>b.volume-a.volume);
  return found[0] ?? null;
}
