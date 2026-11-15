import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {TenantIntakeDemo,composeTenantPacket} from "../components/TenantIntakeDemo";

afterEach(cleanup);
const sample={
 city:"Los Angeles",bedrooms:"2-bedroom",currentRent:2400,offeredRent:2650,
 effectiveDate:"2027-01-15",benchmark:2377,benchmarkMonth:"2026-10",
 legalStatus:"Eligibility unknown",
 policyNotes:["California Tenant Protection Act: 8.7% published standard; https://oag.ca.gov/rentcaps"],
 nextAction:"Check your protections before deciding",
};
describe("tenant union intake demo",()=>{
 it("produces a structured, explicitly unsubmitted packet",()=>{
  const packet=composeTenantPacket(sample,"increase",["renewal"],"Asked the landlord for details.");
  expect(packet).toContain("not filed or sent");
  expect(packet).toContain("$2,400.00");
  expect(packet).toContain("$2,650.00");
  expect(packet).toContain("$250.00");
  expect(packet).toContain("$2,377.00");
  expect(packet).toContain("Asked the landlord for details.");
  expect(packet).toContain("Previous rent increase notices");
  expect(packet).toContain("https://oag.ca.gov/rentcaps");
 });
 it("shows missing documents and reveals organizer-ready preview only on request",()=>{
  render(<TenantIntakeDemo {...sample}/>);
  expect(screen.getByText("Prepare for tenant support")).toBeTruthy();
  expect(screen.queryByText("ORGANIZER REVIEW COPY")).toBeTruthy();
  const btn=screen.getByRole("button",{name:"Preview organizer packet"});
  const group=screen.getByText("ORGANIZER REVIEW COPY").closest(".v4-intake-organizer");
  expect(group?.getAttribute("data-open")).toBe("false");
  fireEvent.click(btn);
  expect(group?.getAttribute("data-open")).toBe("true");
  expect(screen.getByText(/Evidence outstanding:/)).toBeTruthy();
 });
 it("marks existing records as available and excludes them from missing packet",()=>{
  render(<TenantIntakeDemo {...sample}/>);
  fireEvent.click(screen.getByRole("checkbox",{name:"Current lease or rental agreement"}));
  fireEvent.click(screen.getByRole("button",{name:"Preview organizer packet"}));
  const text=screen.getByText(/Evidence outstanding:/).parentElement?.textContent??"";
  expect(text).not.toContain("Current lease or rental agreement");
 });
 it("supports alternative concerns without needing a backend",()=>{
  const p=composeTenantPacket(sample,"notice",[],"");
  expect(p).toContain("Question about the notice or deadline");
  expect(p).toContain("None confirmed");
  expect(p).toContain("not filed or sent");
 });
});
