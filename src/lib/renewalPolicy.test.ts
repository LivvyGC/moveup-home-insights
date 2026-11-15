import {describe,it,expect} from "vitest";
import {rentRules,activeRules,conditionalCap} from "./renewalPolicy";
describe("dated rent-cap records",()=>{
 it("four jurisdictions have dated government sources",()=>{
 for(const c of ["Los Angeles","San Francisco","San Diego","Seattle"] as const){
 expect(rentRules[c].length).toBeGreaterThan(0);
 for(const r of rentRules[c]){expect(r.source_url).toMatch(/^https:\/\//);expect(r.conditions.length).toBeGreaterThan(30);expect(r.effective_from).toMatch(/^202[67]-/)}
 }
 });
 it("Seattle limit changes by calendar year",()=>{
 expect(activeRules("Seattle","2026-12-15")[0]?.cap_pct).toBe(9.683);
 expect(activeRules("Seattle","2027-01-15")[0]?.cap_pct).toBe(10);
 expect(activeRules("Seattle","2028-01-15")).toEqual([]);
 });
 it("LA city standard adjustment remains conditional until coverage is known",()=>{
 const c=conditionalCap(2400,activeRules("Los Angeles","2027-01-15"),"unknown","unknown");
 expect(c?.capPct).toBe(3);expect(c?.conditional).toBe(true);
 });
});
