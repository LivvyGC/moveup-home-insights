import {describe,it,expect} from "vitest";
import {assessCity, localMomentum, taxCostPressure, type CityMarketRecord} from "./localDecision";
import citiesJson from "../data/cities.json";
import type { CityData } from "./combineSignals";
const cities = { at: (i: number) => citiesJson[i] as CityData };
const mk=(lastThreeMonthsPct:number|null,yearOverYearPct:number|null):CityMarketRecord=>({
  city:"Los Angeles",state:"CA",month:"2026-09",typicalHomeValue:750000,
  lastThreeMonthsPct,yearOverYearPct,forecast:null
});
describe("local-first experimental model",()=>{
  it("uses 45/35/20 weights",()=>{
    const a=assessCity({city:cities.at(0),market:mk(1,3),timeline:6,fed:"BUY",mortgage:"BUY"});
    expect(a.weights).toEqual({local:0.45,policy:0.35,national:0.20});
    expect(a.score).toBe(0.65);
    expect(a.verdict).toBe("BUY");
  });
  it("responds to local historical trends",()=>{
    const base={city:cities.at(0),timeline:6,fed:"BUY" as const,mortgage:"BUY" as const};
    expect(assessCity({...base,market:mk(-3,-5)}).verdict).toBe("WAIT");
    expect(assessCity({...base,market:mk(3,5)}).verdict).toBe("BUY");
  });
  it("changes with regional policy tax-cost assumption",()=>{
    expect(taxCostPressure(cities.at(5))).toBe(-1); // Dallas
    expect(taxCostPressure(cities.at(9))).toBe(1); // Denver
  });
  it("never invents a decision when local research is missing",()=>{
    const r=assessCity({city:cities.at(0),market:null,timeline:6,fed:"BUY",mortgage:"BUY"});
    expect(r.verdict).toBe("MIXED");
    expect(r.available).toBe(false);
    expect(r.score).toBeNull();
  });
  it("removes automatic BUY for a one-month timeline",()=>{
    expect(assessCity({city:cities.at(0),market:mk(-2,-5),timeline:1,fed:"BUY",mortgage:"BUY"}).verdict).toBe("WAIT");
  });
  it("keeps a published 12mo forecast separate from short-term score",()=>{
    const market={...mk(1,3),forecast:{
      source:"Zillow Research ZHVF" as const,geography:"city" as const,
      asOf:"2026-09",targetMonth:"2027-09",yearAheadPct:-15,
    }};
    expect(localMomentum(market,6)).toBe(1);
  });
  it("validates tax and timeline inputs",()=>{
    expect(()=>taxCostPressure({...cities.at(0),property_tax_rate:-1})).toThrow();
    expect(()=>assessCity({city:cities.at(0),market:mk(1,2),timeline:5,fed:"BUY",mortgage:"BUY"})).toThrow();
  });
});
