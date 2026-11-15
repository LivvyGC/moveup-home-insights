
// Experimental, uncalibrated prototype weighting — not a financial recommendation.
// 45% local momentum, 35% illustrative property-tax-cost pressure, 20% national odds.
// Policy statutes and exemptions displayed elsewhere are informational and are NOT
// treated as automatically available personal benefits.
import type { CityData, Direction, Verdict } from "./combineSignals";
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
  local: number | null; policy: number; national: number;
  weights: {local:number;policy:number;national:number};
  reason: string; available: boolean;
}
function directionScore(d: Direction): number {
  return d==="BUY"?1:d==="WAIT"?-1:0;
}
// Strong *past* local momentum is interpreted as cost-of-waiting pressure,
// not as a probability of future gains. Separate metrics have separate units.
export function localMomentum(city: CityMarketRecord | null | undefined, timeline: number): number | null {
  if (!city) return null;
  const recent = timeline <= 3;
  const change = recent ? city.lastThreeMonthsPct : city.yearOverYearPct;
  if (change===null || !Number.isFinite(change)) return null;
  const threshold=recent?0.75:2;
  if (change>threshold) return 1;
  if (change< -threshold) return -1;
  return 0;
}
export function taxCostPressure(city: CityData): number {
  // Illustrative local tax rate, NOT a verified effective tax rate for a property.
  const t=city.property_tax_rate;
  if (!Number.isFinite(t) || t<0) throw new Error("Invalid tax assumption");
  if (t<0.010) return 1;
  if (t>0.015) return -1;
  return 0;
}
export function assessCity(input: {
  city:CityData; market:CityMarketRecord|null|undefined;
  timeline:number; fed:Direction; mortgage:Direction;
}): LocalAssessment {
  const {city,market,timeline,fed,mortgage}=input;
  if (!Number.isFinite(timeline)||![1,3,6].includes(timeline))
    throw new Error("Invalid timeline");
  const local=localMomentum(market,timeline);
  const policy=taxCostPressure(city);
  const national=(directionScore(fed)+directionScore(mortgage))/2;
  const weights={local:0.45,policy:0.35,national:0.20};
  // Missing essential local data means no confident location-specific verdict.
  if (local===null) {
    return {verdict:"MIXED",score:null,local,policy,national,weights,
      reason:"Local historical data unavailable; no location-specific verdict generated.",available:false};
  }
  const score=Number((local*weights.local+policy*weights.policy+national*weights.national).toFixed(4));
  const verdict: Verdict = score>0.15?"BUY":score< -0.15?"WAIT":"MIXED";
  return {verdict,score,local,policy,national,weights,
    reason:"Experimental weighted classification based on past city momentum, illustrative local tax-cost pressure, and national prediction-market signals; not a validated forecast.",available:true};
}
