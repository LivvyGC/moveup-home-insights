import { createServerFn } from "@tanstack/react-start";
import { pickBestMarket } from "./signal-parse";

export interface SignalResult {
  query: string; question: string; probability: number;
  source: "live" | "estimate"; fetched_at: string;
}
const SEARCH_URL = "https://gamma-api.polymarket.com/public-search";
const TIMEOUT_MS = 8000;

type Input = { query: string; match: string[]; fallback: number };

export const fetchSignalFn = createServerFn({ method: "POST" })
  .inputValidator((v: Input): Input => {
    if (!v || typeof v.query !== "string" || !v.query.trim() || typeof v.fallback !== "number" ||
        !Number.isFinite(v.fallback) || v.fallback < 0 || v.fallback > 100) throw new Error("Invalid request");
    const match = Array.isArray(v.match) && v.match.length > 0 && v.match.every(t => typeof t === "string" && t.trim())
      ? v.match.map(t => t.trim()) : v.query.trim().split(/\s+/);
    return { query: v.query.trim(), match, fallback: v.fallback };
  })
  .handler(async ({ data }): Promise<SignalResult> => {
    const estimate: SignalResult = {
      query: data.query, question: "Estimate (no market data): " + data.query,
      probability: data.fallback, source: "estimate", fetched_at: new Date().toISOString(),
    };
    try {
      const url = SEARCH_URL + "?q=" + encodeURIComponent(data.query) + "&events_status=active";
      const up = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: "application/json" } });
      if (!up.ok) return estimate;
      const best = pickBestMarket(await up.json(), data.match);
      if (!best) return estimate;
      return { query: data.query, question: best.question, probability: best.probability,
        source: "live", fetched_at: new Date().toISOString() };
    } catch (e) {
      console.error("signal fetch failed", e);
      return estimate;
    }
  });
