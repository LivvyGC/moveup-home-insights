import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import market from "../data/rentMarket.snapshot.json";
const page=readFileSync("src/routes/index.tsx","utf8");
describe("V4 content guardrails",()=>{
 it("removes obsolete score, forecasts and property-financing forms",()=>{
  expect(page).not.toMatch(/45\/35\/20|localDecision|fetchSignal|probability|confidence|\bscore\b|mortgage|home purchase price|Explore buying|Explore moving/i);
 });
 it("keeps official policy context, exactly one main rental benchmark and print",()=>{
  expect(page).toContain("assessMarketOffer");
  expect(page).toContain("evaluateRenewal");
  expect(page).toContain("Apartment List");
  expect(page).toContain("Print / Save as PDF");
  expect(page).not.toContain("Zillow ZORI");
 });
 it("has exact 1BR and 2BR values in all four cities",()=>{
  expect(Object.keys(market.cities)).toEqual(["Los Angeles","San Francisco","San Diego","Seattle"]);
  for(const row of Object.values(market.cities)){
   for(const k of ["1br","2br"] as const) expect(row.apartmentListBedrooms[k].typicalRent).toBeGreaterThan(0);
  }
 });
});
