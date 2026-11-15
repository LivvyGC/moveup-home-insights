import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import market from "../data/rentMarket.snapshot.json";
const ui=readFileSync("src/routes/index.tsx","utf8");
describe("Renewal Check content guardrails",()=>{
 it("excludes legacy scoring and probabilities",()=>{
  expect(ui).not.toMatch(/BUY\/WAIT\/MIXED|45\/35\/20|fetchSignal|localDecision|combineSignals|probability|confidence|\bscore\b/i);
 });
 it("displays source tags and jurisdictional action",()=>{
  expect(ui).toContain("mv-source");
  expect(ui).toContain("ZORI · ");
  expect(ui).toContain("APARTMENT LIST · ");
  expect(ui).toContain("YOUR CURRENT LEASE");
  expect(ui).toContain("officialActions");
  expect(ui).toContain("CHECK MY OFFER");
 });
 it("has 1br and 2br data with no missing city",()=>{
  expect(Object.keys(market.cities)).toEqual(["Los Angeles","San Francisco","San Diego","Seattle"]);
  for(const record of Object.values(market.cities)){
   expect(record.zori.typicalRent).toBeGreaterThan(0);
   for(const size of ["1br","2br"] as const){
    expect(record.apartmentListBedrooms[size].typicalRent).toBeGreaterThan(0);
    expect(record.apartmentListBedrooms[size].month).toBe("2026-10");
   }
  }
 });
});
