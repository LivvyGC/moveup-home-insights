// Experimental, uncalibrated prototype weighting — not a financial recommendation.
// PM-approved 0–100 scale (2026-11-15): each factor is rated 0–100 (50 = neutral),
// then weighted 45% city price trend, 35% tax cost, 20% national odds.
// Score < 40 → WAIT, 40–59 → MIXED, ≥ 60 → BUY. National odds alone cannot reach BUY.
// Policy statutes and exemptions displayed elsewhere are informational and are NOT
// treated as automatically available personal benefits.
import type { CityData, Verdict } from "./combineSignals";
export interface CityMarketRecord {
  city: string; state: string; month: string;
  typicalHomeValue: number | null;
  yearOverYearPct: number | null;
  lastThreeMonthsPct: number | null;
  forecast: null | {
    source: "Zillow Research ZHVF"; geography: "city";
    asOf: string; targetMonth: string; yearAheadPct: number;
  };
}
export interface CityMarketSnapshot {
  source: string; sourceUrl: string; updatedAt: string;
  cities: CityMarketRecord[];
}
export interface LocalAssessment {
  verdict: Verdict; score: number | null;
  /** 0–100 factor ratings; higher favors buying now. */
  local: number | null; policy: number; national: number;
  weights: {local:number;policy:number;national:number};
  reason: string; available: boolean;
}
export const WEIGHTS = { local: 0.45, policy: 0.35, national: 0.20 } as const;
export const BUY_AT = 60;
export const WAIT_BELOW = 40;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

// Rising *past* prices are read as cost-of-waiting pressure, not a forecast of gains.
// Timeline ≤ 3 months uses the 3-month change (±1.5% = extreme), otherwise 1-year (±5%).
export function localTrendRating(city: CityMarketRecord | null | undefined, timeline: number): number | null {
  if (!city) return null;
  const recent = timeline <= 3;
  const change = recent ? city.lastThreeMonthsPct : city.yearOverYearPct;
  if (change === null || !Number.isFinite(change)) return null;
  const extreme = recent ? 1.5 : 5;
  return r1(50 + 50 * clamp(change / extreme, -1, 1));
}
// Illustrative city tax rate, NOT a verified effective rate. 0.5% → 100, 2.0% → 0.
export function taxRating(city: CityData): number {
  const t = city.property_tax_rate;
  if (!Number.isFinite(t) || t < 0) throw new Error("Invalid tax assumption");
  return r1(clamp((0.02 - t) / 0.015, 0, 1) * 100);
}
// Low odds of a Fed cut / mortgage rates below 6% mean little reason to wait.
export function nationalRating(fedProbability: number, mortgageProbability: number): number {
  for (const p of [fedProbability, mortgageProbability])
    if (!Number.isFinite(p) || p < 0 || p > 100) throw new Error("Invalid probability");
  return r1(100 - (fedProbability + mortgageProbability) / 2);
}
export function verdictFor(score: number): Verdict {
  return score >= BUY_AT ? "BUY" : score < WAIT_BELOW ? "WAIT" : "MIXED";
}
export function scoreLabel(score: number): string {
  const v = verdictFor(score);
  return v === "BUY" ? "Leaning buy" : v === "WAIT" ? "Leaning wait" : "No clear edge";
}
export function assessCity(input: {
  city: CityData; market: CityMarketRecord | null | undefined;
  timeline: number; fedProbability: number; mortgageProbability: number;
}): LocalAssessment {
  const { city, market, timeline } = input;
  if (!Number.isFinite(timeline) || ![1, 3, 6].includes(timeline))
    throw new Error("Invalid timeline");
  const local = localTrendRating(market, timeline);
  const policy = taxRating(city);
  const national = nationalRating(input.fedProbability, input.mortgageProbability);
  const weights = { ...WEIGHTS };
  // Missing essential local data means no confident location-specific verdict.
  if (local === null) {
    return { verdict: "MIXED", score: null, local, policy, national, weights,
      reason: "Local historical data unavailable; no location-specific verdict generated.", available: false };
  }
  const score = Math.round(local * weights.local + policy * weights.policy + national * weights.national);
  return { verdict: verdictFor(score), score, local, policy, national, weights,
    reason: "Experimental 0–100 score from past city price trend, illustrative tax cost and national market odds; not a forecast.",
    available: true };
}
