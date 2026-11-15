// Experimental, uncalibrated prototype weighting — not a financial recommendation.
// PM-approved 0–100 scale (2026-11-15): each factor is rated 0–100 (50 = neutral),
// then weighted 45% city price trend, 35% tax cost, 20% national odds.
// Scores: <40 WAIT, 40–59 MIXED, >=60 BUY, subject to local-evidence guardrails.
// Policy statutes and exemptions displayed elsewhere are informational and are NOT
// treated as automatically available personal benefits.
import type { CityData, Verdict } from "./combineSignals";
export interface CityMarketRecord {
  city: string; state: string; month: string;
  typicalHomeValue: number | null;
  yearOverYearPct: number | null;
  lastThreeMonthsPct: number | null;
  oneMonthPct?: number | null;
  sixMonthPct?: number | null;
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
// Matched historical windows: 1m (±0.75%), 3m (±1.5%), 6m (±3%).
// These thresholds are experimental, not trained on observed future outcomes.
export function localTrendRating(city: CityMarketRecord | null | undefined, timeline: number): number | null {
  if (!city) return null;
  // Buying horizon uses the corresponding *past* price-change window, not a future forecast.
  // Do not substitute a 12-month trend when a 6-month window is missing.
  const change = timeline === 1 ? city.oneMonthPct : timeline === 3 ? city.lastThreeMonthsPct : city.sixMonthPct;
  if (change == null || !Number.isFinite(change)) return null;
  const extreme = timeline === 1 ? 0.75 : timeline === 3 ? 1.5 : 3;
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
  // Floor keeps the shown whole number consistent with the bands (59.6 shows 59, MIXED).
  const score = Math.floor(local * weights.local + policy * weights.policy + national * weights.national + 1e-9);
  const rawVerdict = verdictFor(score);
  // Local-evidence guardrail: two national odds cannot create a directional result
  // when the *city's own* price trend is neutral. Strong local evidence must not
  // be contradicted by the combined score. The tax factor remains illustrative.
  const localNeutral = local >= 40 && local <= 60;
  const contradictsLocal = (local < 40 && rawVerdict === "BUY") ||
    (local > 60 && rawVerdict === "WAIT");
  const verdict: Verdict = localNeutral || contradictsLocal ? "MIXED" : rawVerdict;
  const reason = localNeutral
    ? "Local price history is near-neutral; national odds and illustrative tax estimates cannot independently determine BUY or WAIT."
    : contradictsLocal
      ? "The weighted score conflicts with strong local price history, so the result is MIXED."
      : "Experimental 0–100 score from past city price trend, illustrative tax cost and national market odds; not a forecast.";
  return { verdict, score, local, policy, national, weights, reason, available: true };
}
