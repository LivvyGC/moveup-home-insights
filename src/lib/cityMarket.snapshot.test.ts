import { describe, it, expect } from "vitest";
import cities from "../data/cities.json";
import { lookupCityMarket } from "./cityMarket.functions";

describe("ten-city ZHVI snapshot", () => {
  it("has verified history for every supported city", () => {
    for (const { city, state } of cities) {
      const r = lookupCityMarket(city, state);
      expect(r.status).toBe("available");
      if (r.status === "available") {
        expect(r.history.typicalHomeValue).toBeGreaterThan(0);
        expect(r.history.month).toMatch(/^\d{4}-\d{2}$/);
      }
    }
  });
  it("never ships a city forecast while ZHVF city data is unverified", () => {
    for (const { city, state } of cities) {
      const r = lookupCityMarket(city, state);
      if (r.status === "available") expect(r.forecast).toBeNull();
    }
  });
  it("reports unknown cities as unavailable instead of inventing data", () => {
    expect(lookupCityMarket("Boise", "ID").status).toBe("unavailable");
  });
});
