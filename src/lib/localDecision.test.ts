import {describe,it,expect} from "vitest";
import {assessCity, localTrendRating, taxRating, nationalRating, verdictFor, type CityMarketRecord} from "./localDecision";
import citiesJson from "../data/cities.json";
import type { CityData } from "./combineSignals";
const cities = { at: (i: number) => citiesJson[i] as CityData };
const mk=(lastThreeMonthsPct:number|null,yearOverYearPct:number|null):CityMarketRecord=>({
  city:"Los Angeles",state:"CA",month:"2026-09",typicalHomeValue:750000,
  lastThreeMonthsPct,yearOverYearPct,forecast:null
});
const neutralCity:CityData={city:"X",state:"CA",property_tax_rate:0.0125,annual_insurance:0};
describe("0–100 local-first score",()=>{
  it("uses 45/35/20 weights on 0–100 ratings",()=>{
    const a=assessCity({city:cities.at(9),market:mk(0,5),timeline:6,fedProbability:0,mortgageProbability:0}); // Denver
    expect(a.weights).toEqual({local:0.45,policy:0.35,national:0.20});
    expect([a.local,a.policy,a.national]).toEqual([100,93.3,100]);
    expect(a.score).toBe(97); // 45 + 32.66 + 20, floored
  });
  it("bands: under 40 WAIT, 40–59 MIXED, 60+ BUY",()=>{
    expect(verdictFor(39)).toBe("WAIT");
    expect(verdictFor(40)).toBe("MIXED");
    expect(verdictFor(59)).toBe("MIXED");
    expect(verdictFor(60)).toBe("BUY");
  });
  it("national odds alone stay MIXED with neutral city and tax (today's odds)",()=>{
    const a=assessCity({city:neutralCity,market:mk(0,0),timeline:6,fedProbability:0.35,mortgageProbability:3.2});
    expect(a.score).toBe(59); // 22.5 + 17.5 + 19.64, floored
    expect(a.verdict).toBe("MIXED");
  });
  it("national odds alone cannot create BUY when local history is flat even with low tax proxy",()=>{
    const veryLowTax={...neutralCity,property_tax_rate:0.005};
    const r=assessCity({city:veryLowTax,market:mk(0,0),timeline:6,fedProbability:0,mortgageProbability:0});
    expect(r.score).toBeGreaterThanOrEqual(60);
    expect(r.verdict).toBe("MIXED");
    expect(r.reason).toMatch(/near-neutral/);
  });
  it("does not produce WAIT from national odds against strong local BUY history",()=>{
    const r=assessCity({city:{...neutralCity,property_tax_rate:0.02},
      market:mk(1.5,5),timeline:6,fedProbability:100,mortgageProbability:100});
    expect(r.local).toBe(100);
    expect(r.score).toBeLessThan(40); // score conflict
    expect(r.verdict).toBe("MIXED");
  });
  it("keeps directional verdicts when meaningful local evidence agrees",()=>{
    const r=assessCity({city:cities.at(9),market:mk(2,5),timeline:6,
      fedProbability:0,mortgageProbability:0});
    expect(r.verdict).toBe("BUY");
  });
  it("city trend: ±5% yearly (±1.5% for 3-month timelines) is the extreme",()=>{
    expect(localTrendRating(mk(0,5),6)).toBe(100);
    expect(localTrendRating(mk(0,-5),6)).toBe(0);
    expect(localTrendRating(mk(0,-2.5),6)).toBe(25);
    expect(localTrendRating(mk(1.5,0),3)).toBe(100);
    expect(localTrendRating(mk(-0.75,0),1)).toBe(25);
  });
  it("tax: 0.5% rates 100, 2.0% rates 0",()=>{
    expect(taxRating({...neutralCity,property_tax_rate:0.005})).toBe(100);
    expect(taxRating({...neutralCity,property_tax_rate:0.02})).toBe(0);
    expect(taxRating(cities.at(5))).toBe(6.7); // Dallas 1.9%
  });
  it("national: 100 minus the average of both market odds",()=>{
    expect(nationalRating(0.35,3.2)).toBe(98.2);
    expect(nationalRating(50,50)).toBe(50);
  });
  it("never invents a decision when local research is missing",()=>{
    const r=assessCity({city:cities.at(0),market:null,timeline:6,fedProbability:0,mortgageProbability:0});
    expect(r.verdict).toBe("MIXED");
    expect(r.available).toBe(false);
    expect(r.score).toBeNull();
  });
  it("falling local prices can produce WAIT even with BUY-leaning national odds",()=>{
    expect(assessCity({city:cities.at(5),market:mk(-2,-5),timeline:1,fedProbability:0,mortgageProbability:0}).verdict).toBe("WAIT");
  });
  it("validates tax, odds and timeline inputs",()=>{
    expect(()=>taxRating({...neutralCity,property_tax_rate:-1})).toThrow();
    expect(()=>nationalRating(101,0)).toThrow();
    expect(()=>assessCity({city:cities.at(0),market:mk(1,2),timeline:5,fedProbability:0,mortgageProbability:0})).toThrow();
  });
});
