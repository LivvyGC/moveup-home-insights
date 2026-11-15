import {describe,it,expect} from "vitest";
import {evaluateRenewal,officialActions} from "./renewalActions";
const base={city:"Los Angeles" as const,currentRent:2000,offeredRent:2200,effectiveDate:"2027-01-09",stateCoverage:"unknown" as const,localCoverage:"unknown" as const,priorIncrease:"unknown" as const,noticeDate:""};
describe("Tenant action routing",()=>{
 it("never certifies coverage or a final legal ceiling",()=>{
  const r=evaluateRenewal(base);
  expect(r.checks.length).toBeGreaterThan(0);
  for(const x of r.checks){expect(x.canDetermineLegalCeiling).toBe(false);expect(x.status).not.toBe("verified_applicable")}
 });
 it("does not route above-market rent alone to a legal complaint",()=>{
  const r=evaluateRenewal({...base,offeredRent:2050,stateCoverage:"no",localCoverage:"no"});
  expect(r.action).toBe("compare_options");
 });
 it("flags potentially excessive local increase as a review, not confirmed violation",()=>{
  const r=evaluateRenewal({...base,offeredRent:2500});
  expect(r.action).toBe("check_rent_limits");expect(r.potentialStandardConcern).toBe(true);
  expect(r.explanation).toMatch(/not a finding of illegality/i);
 });
 it("never claims a standard applies if user reports both exempt",()=>{
  const r=evaluateRenewal({...base,offeredRent:2500,stateCoverage:"no",localCoverage:"no"});
  expect(r.checks.every(c=>c.exampleMaxRent===null)).toBe(true);
  expect(r.potentialStandardConcern).toBe(false);
 });
 it("handles decreasing or unchanged offers without filing language",()=>{
  expect(evaluateRenewal({...base,offeredRent:1900}).action).toBe("compare_options");
  expect(evaluateRenewal({...base,offeredRent:2000}).action).toBe("compare_options");
 });
 it("Seattle short notice is independent of the rent-cap percentage",()=>{
  const r=evaluateRenewal({...base,city:"Seattle",effectiveDate:"2027-02-01",noticeDate:"2026-12-15",offeredRent:2200});
  expect(r.shortSeattleNotice).toBe(true);
  expect(r.noticeDays).toBeLessThan(180);
  expect(r.action).toBe("review_notice");
 });
 it("routes statewide-only California concerns to California tenant guidance",()=>{
  const r=evaluateRenewal({...base,city:"San Diego",offeredRent:2400,stateCoverage:"unknown",localCoverage:"no"});
  expect(r.action).toBe("check_rent_limits");
  expect(r.actionUrl).toBe("https://oag.ca.gov/tenants");
  expect(r.actionName).toMatch(/California Attorney General/);
 });
 it("provides official jurisdiction routes",()=>{
  for(const entry of Object.values(officialActions)){
   expect(entry.url).toMatch(/^https:\/\//);
   expect(entry.eligibilityUrl).toMatch(/^https:\/\//);
  }
 });
});
