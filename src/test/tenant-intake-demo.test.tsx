import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TenantIntakeDemo, composeTenantPacket, intakeEndpointConfigured } from "../components/TenantIntakeDemo";
import type { TenantCaseRecord } from "../lib/tenantCase";

afterEach(()=>{cleanup();vi.restoreAllMocks();});
const sample:TenantCaseRecord={
 city:"Los Angeles",bedrooms:"2-bedroom",currentRent:2400,offeredRent:2650,
 effectiveDate:"2027-01-15",periodMonths:12,benchmark:2377,
 benchmarkMonth:"2026-10",marketDifference:273,marketDifferencePct:11.49,
 legalStatus:"Potential concern — check details",nextAction:"Your increase may need a rent-law review",
 nextActionUrl:"https://oag.ca.gov/tenants",
 stateCoverage:"yes",localCoverage:"no",priorIncrease:"unknown",noticeReceived:"",
 rules:[{title:"California Tenant Protection Act",rate:8.7,from:"2026-08-01",to:"2027-07-31",coverage:"yes",url:"https://oag.ca.gov/rentcaps"}],
 sourceUrl:"https://www.apartmentlist.com/research/category/data-rent-estimates",
};
describe("tenant support intake handoff",()=>{
 it("includes verified data and self-reported state/local/legal answers",()=>{
   const packet=composeTenantPacket(sample,"increase",["renewal"],"Asked the landlord for details.");
   expect(packet).toContain("$2,400.00");
   expect(packet).toContain("$2,650.00");
   expect(packet).toContain("+$250.00");
   expect(packet).toContain("Reported covered — not independently verified");
   expect(packet).toContain("Reported exempt — not independently verified");
   expect(packet).toContain("Not sure");
   expect(packet).toContain("2026-10");
   expect(packet).toContain("Asked the landlord for details.");
   expect(packet).toContain("Current lease or rental agreement");
 });
 it("reveals organizer packet on demand and shows coverage answers",()=>{
   render(<TenantIntakeDemo caseRecord={sample}/>);
   const button=screen.getByRole("button",{name:"Preview case packet"});
   expect(screen.queryByText("ORGANIZER REVIEW COPY")).toBeNull();
   fireEvent.click(button);
   expect(screen.getByText("ORGANIZER REVIEW COPY")).toBeTruthy();
   expect(screen.getAllByText(/Reported covered — not independently verified/).length).toBeGreaterThan(0);
   expect(screen.getByText(/Documents to confirm:/)).toBeTruthy();
 });
 it("updates missing documents after checking a record",()=>{
   render(<TenantIntakeDemo caseRecord={sample}/>);
   fireEvent.click(screen.getByRole("checkbox",{name:"Current lease or rental agreement"}));
   fireEvent.click(screen.getByRole("button",{name:"Preview case packet"}));
   const para=screen.getByText(/Documents to confirm:/);
   expect(para.textContent).not.toContain("Current lease or rental agreement");
 });
 it("supports alternative reasons",()=>{
   const packet=composeTenantPacket(sample,"notice",[],"");
   expect(packet).toContain("Question about a notice or deadline");
   expect(packet).toContain("Prior increases: Not sure");
 });
 it("does not imply submission when receiver not configured",()=>{
   expect(intakeEndpointConfigured).toBe(false);
   render(<TenantIntakeDemo caseRecord={sample}/>);
   expect(screen.getByText(/Live demo intake has not been connected/i)).toBeTruthy();
   expect(screen.queryByRole("button",{name:"Submit demo case"})).toBeNull();
   expect(screen.getByRole("button",{name:"Download case packet"})).toBeTruthy();
 });
});
