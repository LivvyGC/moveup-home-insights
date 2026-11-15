import {describe,it,expect} from "vitest";
import {evaluateRenewal} from "./renewalActions";
import {assessMarketOffer} from "./renewalV4";
const base={city:"Los Angeles" as const,currentRent:2400,offeredRent:2400,effectiveDate:"2027-01-09",stateCoverage:"no" as const,localCoverage:"no" as const,priorIncrease:"none" as const,noticeDate:""};
const finding=(offer:number,options:Partial<typeof base>={})=>evaluateRenewal({...base,offeredRent:offer,...options});
describe("V4 independent market and legal assessment",()=>{
 it("uses exact dollar and percentage differences",()=>{
  const a=assessMarketOffer(2650,2377,finding(2650),false);
  expect(a.difference).toBe(273);
  expect(a.differencePct).toBe(11.49);
  expect(a.marketPosition).toBe("above");
  expect(a.tone).toBe("yellow");
 });
 it("below-market and screened rent can be green",()=>{
  const a=assessMarketOffer(2000,2377,finding(2000),false);
  expect(a.marketPosition).toBe("below");expect(a.tone).toBe("green");
 });
 it("unknown legal coverage never silently turns green",()=>{
  const f=finding(2200,{stateCoverage:"unknown",localCoverage:"unknown"});
  const a=assessMarketOffer(2200,2377,f,false);
  expect(a.legalScreen).toBe("needs_information");expect(a.tone).toBe("neutral");
 });
 it("a possible published-standard issue is orange even when below benchmark",()=>{
  const f=finding(2700,{currentRent:2000,stateCoverage:"unknown",localCoverage:"unknown"});
  const a=assessMarketOffer(2700,4000,f,false);
  expect(a.tone).toBe("orange");expect(a.marketPosition).toBe("below");
 });
 it("unsupported bedroom data is neutral and never substitutes an observation",()=>{
  const a=assessMarketOffer(2300,null,finding(2300),false);
  expect(a.tone).toBe("neutral");
  expect(a.difference).toBeNull();
  expect(a.axisMax).toBeNull();
 });
 it("Seattle short notice takes legal priority",()=>{
  const f=evaluateRenewal({...base,city:"Seattle",currentRent:2400,offeredRent:2500,effectiveDate:"2027-03-01",noticeDate:"2027-01-15"});
  expect(assessMarketOffer(2500,2415,f,true).tone).toBe("orange");
 });
 it("meter positions use the measured max and remain within bounds",()=>{
  const a=assessMarketOffer(2650,2377,finding(2650),false);
  expect(a.offerPosition).toBeGreaterThan(a.benchmarkPosition!);
  expect(a.offerPosition).toBeLessThanOrEqual(100);
  expect(a.benchmarkPosition).toBeGreaterThan(0);
 });
});
