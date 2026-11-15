import { describe,it,expect } from "vitest";
import { stayCost,renewalScenarios,mortgageAmortization,capScenario,isStale } from "./renewalCalculator";
import { activeRules,conditionalCap } from "./renewalPolicy";
const base={ currentRent:2400,offeredRent:2650,months:12,alternativeRent:null,movingCost:null,securityDeposit:null,homePrice:null,downPayment:null,aprPercent:null,loanYears:30,propertyTaxMonthly:null,insuranceMonthly:null,otherMonthly:null,closingCost:null };
describe("Renewal Check calculations",()=>{
 it("0% renewal increase is current monthly rent times months",()=>{expect(renewalScenarios({...base,offeredRent:2400}).stay.total).toBe(28800);expect(stayCost(2400,12)).toBe(28800)});
 it("ceiling does not exceed source cap; below-ceiling offer remains unchanged",()=>{
  const rules=activeRules("Los Angeles","2027-01-15");
  const conditional=conditionalCap(2400,rules,"unknown","unknown");
  expect(conditional?.conditional).toBe(true);
  expect(capScenario(2400,2650,12,8.7)?.maxRent).toBeCloseTo(2608.8,2);
  expect(capScenario(2400,2500,12,8.7)?.total).toBe(30000);
 });
 it("unknown coverage never establishes a legal cap",()=>{
  const rules=activeRules("San Diego","2027-01-15");
  expect(conditionalCap(2400,rules,"unknown","unknown")?.status).toBe("depends_on_building_or_tenant");
  expect(conditionalCap(2400,rules,"no","no")).toBeNull();
 });
 it("raising rent raises stay cost",()=>{
  expect(renewalScenarios({...base,offeredRent:2700}).stay.total).toBeGreaterThan(renewalScenarios(base).stay.total);
 });
 it("equity principal and interest reconcile to mortgage payments",()=>{
  const m=mortgageAmortization(400000,7.11,30,24);
  expect(m.principalRepaid+m.interestPaid).toBeCloseTo(m.totalPayments,2);
 });
 it("buy comparison responds to horizon",()=>{
  const b={...base,homePrice:420000,downPayment:84000,aprPercent:7.11};
  const a=renewalScenarios({...b,months:12}).buy;
  const c=renewalScenarios({...b,months:24}).buy;
  expect(a).not.toBeNull();expect(c?.total).toBeGreaterThan(a!.total);
 });
 it("deposit is upfront not expense; other ownership costs are excluded when blank",()=>{
  const x=renewalScenarios({...base,alternativeRent:2100,movingCost:300,securityDeposit:900,homePrice:420000,downPayment:84000,aprPercent:7.11});
  expect(x.move?.total).toBe(25500);expect(x.move?.upfront).toBe(1200);expect(x.buy?.excludedCosts).toContain("property tax");
 });
 it("45-day data age threshold",()=>{
  expect(isStale("2026-09-30",new Date("2026-11-14T00:00:00Z"))).toBe(false);
  expect(isStale("2026-09-30",new Date("2026-11-16T00:00:00Z"))).toBe(true);
 });
});
