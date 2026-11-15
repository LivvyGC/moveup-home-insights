import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import market from "../data/rentMarket.snapshot.json";
const ui=readFileSync(new URL("../routes/index.tsx",import.meta.url),"utf8");
describe("Renewal Check content guardrails",()=>{
 it("excludes old model and invented probability indicators",()=>{
 expect(ui).not.toMatch(/BUY\/WAIT\/MIXED|45\/35\/20|fetchSignal|localDecision|combineSignals|probability|confidence|\bscore\b/i);
 });
 it("uses explicitly displayed source tags",()=>{
 expect(ui).toContain("rc-source");
 expect(ui).toContain("ZILLOW ZORI · SEP 2026 · ASKING RENT");
 expect(ui).toContain("APARTMENT LIST · OCT 2026 · NEW LEASE");
 expect(ui).toContain("YOUR INPUT · RENEWAL OFFER");
 });
 it("has market data for the four target cities",()=>{
 expect(Object.keys(market.cities)).toEqual(["Los Angeles","San Francisco","San Diego","Seattle"]);
 for(const city of Object.values(market.cities)){expect(city.zori.typicalRent).toBeGreaterThan(0);expect(city.apartmentList.typicalRent).toBeGreaterThan(0)}
 });
});
