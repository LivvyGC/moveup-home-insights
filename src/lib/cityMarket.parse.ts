// Zillow Research ZHVI: aggregate historical home-value index, not listing data or a forecast.
export interface CityMarket {
  city: string;
  state: string;
  month: string;
  typicalHomeValue: number;
  yearOverYearPct: number | null;
  lastThreeMonthsPct: number | null;
  source: "Zillow Research ZHVI";
}
function records(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (quoted && c === '"' && csv[i + 1] === '"') {value += '"'; i++; continue;}
    if (c === '"') {quoted = !quoted; continue;}
    if (!quoted && c === ",") {row.push(value); value = ""; continue;}
    if (!quoted && (c === "\n" || c === "\r")) {
      if (c === "\r" && csv[i + 1] === "\n") i++;
      row.push(value); value = "";
      if (row.some(x => x !== "")) rows.push(row);
      row = []; continue;
    }
    value += c;
  }
  if (row.length || value) {row.push(value); rows.push(row);}
  return rows;
}
const round = (v: number) => Math.round(v * 100) / 100;
export function parseCityZHVI(csv: string, city: string, state: string): CityMarket | null {
  const rows = records(csv);
  if (rows.length < 2) return null;
  const headers = rows[0];
  const cityIndex = headers.indexOf("RegionName");
  const stateIndex = headers.indexOf("State");
  const typeIndex = headers.indexOf("RegionType");
  if (cityIndex < 0 || stateIndex < 0) return null;
  const dateIndices = headers.map((h, i) => /^\d{4}-\d{2}-\d{2}$/.test(h) ? i : -1).filter(i => i >= 0);
  if (dateIndices.length < 13) return null;
  const matching = rows.find(row =>
    row[cityIndex]?.trim().toLowerCase() === city.toLowerCase() &&
    row[stateIndex]?.trim().toUpperCase() === state.toUpperCase() &&
    (typeIndex < 0 || row[typeIndex]?.toLowerCase() === "city")
  );
  if (!matching) return null;
  const observations = dateIndices.map(i => ({month: headers[i].slice(0,7), value: Number(matching[i])}))
    .filter(o => Number.isFinite(o.value) && o.value > 0);
  const latest = observations.at(-1);
  if (!latest) return null;
  const idx = dateIndices.findIndex(i => headers[i].startsWith(latest.month));
  const previous = idx >= 12 ? Number(matching[dateIndices[idx - 12]]) : NaN;
  const threeMonths = idx >= 3 ? Number(matching[dateIndices[idx - 3]]) : NaN;
  const pct = (v: number) => Number.isFinite(v) && v > 0 ? round((latest.value / v - 1) * 100) : null;
  return {city, state, month: latest.month, typicalHomeValue: round(latest.value),
    yearOverYearPct: pct(previous), lastThreeMonthsPct: pct(threeMonths), source:"Zillow Research ZHVI"};
}
