// Regenerates src/data/cityMarket.snapshot.json from the official Zillow Research ZHVI city CSV.
// Run manually (bun scripts/build-city-snapshot.ts [path-to-local-csv]) when Zillow publishes a new month.
// The app ships this small ten-city snapshot instead of downloading the ~94 MB file per request.
import { writeFileSync, readFileSync } from "node:fs";
import cities from "../src/data/cities.json";
import { parseCityZHVI } from "../src/lib/cityMarket.parse";
import type { CityMarketSnapshot } from "../src/lib/localDecision";

const SOURCE_URL = "https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
const local = process.argv[2];
const text = local ? readFileSync(local, "utf8") : await (await fetch(SOURCE_URL)).text();
const snapshot: CityMarketSnapshot = {
  source: "Zillow Research ZHVI (city, all homes, mid-tier, smoothed, seasonally adjusted)",
  sourceUrl: SOURCE_URL,
  updatedAt: new Date().toISOString().slice(0, 10),
  cities: cities.map(({ city, state }) => {
    const h = parseCityZHVI(text, city, state);
    if (!h) throw new Error(`No ZHVI row for ${city}, ${state}`);
    // City-level ZHVF forecast is unavailable (HTTP 404); never substituted.
    return { city, state, month: h.month, typicalHomeValue: h.typicalHomeValue,
      yearOverYearPct: h.yearOverYearPct, lastThreeMonthsPct: h.lastThreeMonthsPct,
      oneMonthPct: h.oneMonthPct,threeMonthPct:h.lastThreeMonthsPct,sixMonthPct:h.sixMonthPct,twelveMonthPct:h.yearOverYearPct,forecast: null };
  }),
};
writeFileSync(new URL("../src/data/cityMarket.snapshot.json", import.meta.url), JSON.stringify(snapshot, null, 2) + "\n");
console.log(snapshot.cities.map(c => `${c.city}, ${c.state} ${c.month} $${c.typicalHomeValue} YoY ${c.yearOverYearPct}% 3mo ${c.lastThreeMonthsPct}%`).join("\n"));
