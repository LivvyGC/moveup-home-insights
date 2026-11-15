import { createServerFn } from "@tanstack/react-start";
import snapshotJson from "@/data/cityMarket.snapshot.json";
import type { CityMarket } from "./cityMarket.parse";
import type { CityMarketSnapshot } from "./localDecision";

// Serves a versioned ten-city ZHVI snapshot (regenerate with scripts/build-city-snapshot.ts)
// instead of downloading Zillow's ~94 MB CSV per request, which a Worker cannot hold in memory.
// City-level ZHVF forecasts return HTTP 404, so forecast is always null until a verified source exists.
export interface CityForecast {
  source: "Zillow Research ZHVF"; geography: "city"; asOf: string; targetMonth: string; yearAheadPct: number;
}
export type MarketResponse =
  | { status: "available"; history: CityMarket; forecast: CityForecast | null; snapshotDate: string }
  | { status: "unavailable"; reason: string };

const snapshot = snapshotJson as CityMarketSnapshot;

export function lookupCityMarket(city: string, state: string): MarketResponse {
  const rec = snapshot.cities.find(
    (c) => c.city.toLowerCase() === city.toLowerCase() && c.state === state,
  );
  if (!rec || rec.typicalHomeValue === null || !Number.isFinite(rec.typicalHomeValue))
    return { status: "unavailable", reason: "No current city-level history in source" };
  return {
    status: "available",
    history: {
      city: rec.city, state: rec.state, month: rec.month, typicalHomeValue: rec.typicalHomeValue,
      yearOverYearPct: rec.yearOverYearPct, lastThreeMonthsPct: rec.lastThreeMonthsPct,
      oneMonthPct: rec.oneMonthPct, sixMonthPct: rec.sixMonthPct,
      source: "Zillow Research ZHVI",
    },
    forecast: rec.forecast,
    snapshotDate: snapshot.updatedAt,
  };
}

export const fetchCityMarketFn = createServerFn({ method: "GET" })
  .inputValidator((v: { city: string; state: string }) => {
    if (!v || typeof v.city !== "string" || typeof v.state !== "string" ||
      !/^[A-Za-z .'-]{2,70}$/.test(v.city) || !/^[A-Z]{2}$/.test(v.state)) throw new Error("Invalid city");
    return v;
  })
  .handler(async ({ data }): Promise<MarketResponse> => lookupCityMarket(data.city, data.state));
