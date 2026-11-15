import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TenantIntakeDemo, composeTenantPacket, intakeEndpointConfigured } from "../components/TenantIntakeDemo";
import { readDemoRegistry, CITY_ROUTING } from "../lib/demoRegistry";
import type { TenantCaseRecord } from "../lib/tenantCase";

afterEach(()=>{
  cleanup();vi.restoreAllMocks();window.localStorage.clear();
});
const sample:TenantCaseRecord={
  city:"Los Angeles",bedrooms:"2-bedroom",currentRent:2400,offeredRent:2650,
  effectiveDate:"2027-01-15",periodMonths:12,benchmark:2377,
  benchmarkMonth:"2026-10",marketDifference:273,marketDifferencePct:11.49,
  legalStatus:"Potential concern: check details",nextAction:"Review your increase",
  nextActionUrl:"https://oag.ca.gov/tenants",
  stateCoverage:"yes",localCoverage:"no",priorIncrease:"unknown",noticeReceived:"",
  rules:[{title:"California Tenant Protection Act",rate:8.7,from:"2026-08-01",to:"2027-07-31",coverage:"yes",url:"https://oag.ca.gov/rentcaps"}],
  sourceUrl:"https://www.apartmentlist.com/research/category/data-rent-estimates",
};
describe("renter-to-organizer inquiry",()=>{
  it("keeps assistance and organizing as separate choices in the case packet",()=>{
    const text=composeTenantPacket(sample,"negotiation",["renewal"],"Asked for new terms.",["assistance","organizing"]);
    expect(text).toContain("Assistance with my housing concern");
    expect(text).toContain("Information about tenant organizing");
    expect(text).toContain("Get help negotiating");
    expect(text).toContain("Reported covered: not independently verified");
    expect(text).toContain("Reported exempt: not independently verified");
    expect(text).toContain("$2,400.00");
    expect(text).toContain("+$250.00");
    expect(text).toContain("Asked for new terms.");
  });
  it("shows both pathways without needing a legal violation",()=>{
    render(<TenantIntakeDemo caseRecord={{...sample,legalStatus:"No specific concern"}}/>);
    expect(screen.getByRole("checkbox",{name:"I want assistance with my housing concern"})).toBeTruthy();
    expect(screen.getByRole("checkbox",{name:"I am interested in tenant organizing"})).toBeTruthy();
    expect(screen.getByText(/No legal violation is required/)).toBeTruthy();
  });
  it("does not store or claim union delivery before consent",()=>{
    render(<TenantIntakeDemo caseRecord={sample}/>);
    expect((screen.getByRole("button",{name:"Submit to database"}) as HTMLButtonElement).disabled).toBe(true);
    expect(readDemoRegistry(window.localStorage)).toHaveLength(0);
    expect(screen.getByText(/The shared network and organization delivery are not live yet/).parentElement).toBeTruthy();
    expect(CITY_ROUTING["Los Angeles"].connectedUnions).toBe(0);
  });
  it("registers a consented organizing-only inquiry under the selected city",async()=>{
    render(<TenantIntakeDemo caseRecord={sample}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"I am interested in tenant organizing"}));
    fireEvent.click(screen.getByRole("checkbox",{name:"Consent to record this demo inquiry"}));
    fireEvent.click(screen.getByRole("button",{name:"Submit to database"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("submitted to the MoveUp demo database"));
    expect(screen.getByRole("status").textContent).toContain("Success!");
    expect(screen.getByRole("status").textContent).toContain("Saved on this device only");
    expect(screen.getByRole("status").textContent).toContain("no organizations were contacted");
    const saved=readDemoRegistry(window.localStorage);
    expect(saved).toHaveLength(1);
    expect(saved[0].city).toBe("Los Angeles");
    expect(saved[0].purposes).toEqual(["organizing"]);
    expect(saved[0].packet).toContain("Information about tenant organizing");
    fireEvent.click(screen.getByText(/Hackathon demo tools: local inquiry records/));
    fireEvent.click(screen.getByRole("button",{name:/View saved demo inquiries/}));
    expect(screen.getByText(/Los Angeles: Information about tenant organizing/)).toBeTruthy();
  });
  it("records both interests, previews accurate coverage and allows clearing the demo registry",async()=>{
    render(<TenantIntakeDemo caseRecord={sample}/>);
    fireEvent.click(screen.getByRole("checkbox",{name:"I want assistance with my housing concern"}));
    fireEvent.click(screen.getByRole("checkbox",{name:"I am interested in tenant organizing"}));
    fireEvent.click(screen.getByRole("button",{name:"Preview renter inquiry"}));
    expect(screen.getByText("RENTER INQUIRY PREVIEW")).toBeTruthy();
    expect(screen.getAllByText(/Reported covered: not independently verified/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("checkbox",{name:"Consent to record this demo inquiry"}));
    fireEvent.click(screen.getByRole("button",{name:"Submit to database"}));
    await waitFor(()=>expect(readDemoRegistry(window.localStorage)).toHaveLength(1));
    expect(readDemoRegistry(window.localStorage)[0].purposes).toEqual(["assistance","organizing"]);
    fireEvent.click(screen.getByText(/Hackathon demo tools: local inquiry records/));
    fireEvent.click(screen.getByRole("button",{name:"Clear saved demo inquiries"}));
    expect(readDemoRegistry(window.localStorage)).toHaveLength(0);
  });
  it("shows three sourced Los Angeles organizations as optional discovery",()=>{
    render(<TenantIntakeDemo caseRecord={sample}/>);
    expect(screen.getByText(/Explore 3 local renter organizations/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Explore 3 local renter organizations/));
    expect(screen.getByRole("link",{name:/Visit Los Angeles Tenants Union website/})).toBeTruthy();
    expect(screen.getByText(/Independent listings, not MoveUp partners/)).toBeTruthy();
    expect(screen.queryByText(/Connected tenant unions: 0/)).toBeNull();
  });
  it("keeps remote submission disabled with no endpoint configured",()=>{
    expect(intakeEndpointConfigured).toBe(false);
    render(<TenantIntakeDemo caseRecord={sample}/>);
    expect(screen.getByText(/Prototype database:/i)).toBeTruthy();
    expect(screen.queryByLabelText("Contact email")).toBeNull();
  });
});
