import { describe, it, expect } from "vitest";
import { combineSignals, combineDirections, directionFor, mortgagePayment, type Direction } from "./combineSignals";
import cities from "../data/cities.json";
const base = { signal_a_estimate: false, signal_b_estimate: false, timeline_months: 6, loan_amount: 400000 };
describe("direction logic", () => {
  it("timeline under 3 overrides probabilities", () => {
    expect(directionFor(99, 1)).toBe("BUY");
    expect(directionFor(1, 2)).toBe("BUY");
  });
  it("supports 45 and 55 inclusive neutral thresholds", () => {
    expect(directionFor(56, 6)).toBe("WAIT");
    expect(directionFor(44, 6)).toBe("BUY");
    expect(directionFor(45, 6)).toBe("NEUTRAL");
    expect(directionFor(55, 6)).toBe("NEUTRAL");
  });
  const pairs: [Direction, Direction, string, string][] = [
    ["WAIT","WAIT","WAIT","agree"], ["BUY","BUY","BUY","agree"],
    ["WAIT","BUY","MIXED","conflict"], ["BUY","WAIT","MIXED","conflict"],
    ["NEUTRAL","WAIT","WAIT","single"], ["NEUTRAL","BUY","BUY","single"],
    ["WAIT","NEUTRAL","WAIT","single"], ["BUY","NEUTRAL","BUY","single"],
    ["NEUTRAL","NEUTRAL","MIXED","no_edge"],
  ];
  it.each(pairs)("%s + %s = %s / %s", (a,b,v,g) => {
    expect(combineDirections(a,b)).toEqual({verdict:v,agreement:g});
  });
});
describe("combineSignals and mortgage", () => {
  it("handles WAIT, conflicts and no edge", () => {
    expect(combineSignals({...base,signal_a_probability:70,signal_b_probability:70}).verdict).toBe("WAIT");
    expect(combineSignals({...base,signal_a_probability:70,signal_b_probability:20}).verdict).toBe("MIXED");
    expect(combineSignals({...base,signal_a_probability:50,signal_b_probability:50}).signal_agreement).toBe("no_edge");
  });
  it("defaults to Los Angeles", () => {
    const r = combineSignals({...base,signal_a_probability:50,signal_b_probability:50});
    expect(r.property_tax_monthly).toBe(500);
    expect(r.insurance_monthly).toBe(150);
    expect(combineSignals({...base,signal_a_probability:50,signal_b_probability:50,city_data:null})).toEqual(r);
  });
  it("calculates a $400k loan at 6.8% and 6.55%", () => {
    const r = combineSignals({...base,signal_a_probability:50,signal_b_probability:50});
    expect(r.current_mortgage).toBe(2607.70);
    expect(r.mortgage_after_cut).toBe(2541.44);
    expect(r.monthly_savings).toBe(66.26);
    expect(mortgagePayment(400000,0.068)).toBeCloseTo(2607.70075, 4);
  });
  it("labels estimated signals accurately", () => {
    const a = combineSignals({...base,signal_a_probability:50,signal_b_probability:50,signal_a_estimate:true,signal_b_estimate:true});
    const b = combineSignals({...base,signal_a_probability:50,signal_b_probability:50,signal_a_estimate:true});
    expect(a.summary).toContain("based on estimates");
    expect(b.summary).toContain("one estimated signal");
  });
  it("throws on invalid inputs", () => {
    expect(() => combineSignals({...base,signal_a_probability:101,signal_b_probability:50})).toThrow();
    expect(() => combineSignals({...base,signal_a_probability:50,signal_b_probability:50,loan_amount:0})).toThrow();
    expect(() => combineSignals({...base,signal_a_probability:NaN,signal_b_probability:50})).toThrow();
  });
});
describe("city dataset", () => {
  it("has 10 cities, LA first, with only the four approved keys", () => {
    expect(cities).toHaveLength(10);
    expect(cities[0].city).toBe("Los Angeles");
    for (const city of cities) expect(Object.keys(city).sort()).toEqual(["annual_insurance","city","property_tax_rate","state"]);
  });
});
