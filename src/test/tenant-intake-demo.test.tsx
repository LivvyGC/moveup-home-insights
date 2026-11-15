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
  rules:[
    {title:"LA Rent Stabilization Ordinance",rate:3,from:"2026-07-01",to:"2027-06-30",coverage:"no",url:"https://housing.lacity.gov/renter-protections-2"},
    {title:"California Tenant Protection Act",rate:8.7,from:"2026-08-01",to:"2027-07-31",coverage:"yes",url:"https://oag.ca.gov/rentcaps"},
  ],
  sourceUrl:"https://www.apartmentlist.com/research/category/data-rent-estimates",
};
function fillContact(){
  fireEvent.change(screen.getByRole("textbox",{name:"Full name"}),{target:{value:"Jane Doe"}});
  fireEvent.change(screen.getByRole("textbox",{name:"Email address"}),{target:{value:"jane@example.com"}});
  fireEvent.change(screen.getByRole("textbox",{name:"Phone number"}),{target:{value:"(555) 010-1234"}});
}
describe("simplified renter support handoff",()=>{
  it("builds the packet from the completed summary and only adds the three contact fields",()=>{
    const text=composeTenantPacket(sample,{name:"Jane Doe",email:"jane@example.com",phone:"555-010-1234"});
    expect(text).toContain("MOVEUP / RENEWAL SUMMARY");
    expect(text).toContain("Name: Jane Doe");
    expect(text).toContain("Email: jane@example.com");
    expect(text).toContain("Phone: 555-010-1234");
    expect(text).toContain("$2,400.00");
    expect(text).toContain("$2,650.00");
    expect(text).toContain("+$250.00");
    expect(text).toContain("+$273.00 (11.49%)");
    expect(text).toContain("Reported covered: not independently verified");
    expect(text).toContain("Reported exempt: not independently verified");
    expect(text).toContain("LA Rent Stabilization Ordinance");
    expect(text).toContain("Not a legal finding");
    expect(text).toContain("does not notify any tenant organization");
  });
  it("shows renter support after RSO using a short contact-only form",()=>{
    const {container}=render(<TenantIntakeDemo caseRecord={sample}/>);
    expect(screen.getByText(/Filed an RSO complaint\? Still unhappy with your rent adjustment\?/)).toBeTruthy();
    expect(screen.getByRole("link",{name:"View your summary"}).getAttribute("href")).toBe("#moveup-summary");
    expect(screen.getByText(/Your MoveUp renewal summary above is ready/)).toBeTruthy();
    expect(screen.getByRole("textbox",{name:"Full name"})).toBeTruthy();
    expect(screen.getByRole("textbox",{name:"Email address"})).toBeTruthy();
    expect(screen.getByRole("textbox",{name:"Phone number"})).toBeTruthy();
    expect(container.querySelectorAll(".v8-contact-fields input")).toHaveLength(3);
    expect(screen.queryByRole("button",{name:"Preview renter inquiry"})).toBeNull();
    expect(screen.queryByText("Documents you have")).toBeNull();
    expect(screen.queryByRole("checkbox",{name:"I am interested in tenant organizing"})).toBeNull();
    expect(screen.queryByRole("textbox",{name:"Notes for tenant support"})).toBeNull();
  });
  it("uses city-neutral support language outside of LA",()=>{
    render(<TenantIntakeDemo caseRecord={{...sample,city:"Seattle",rules:[]}}/>);
    expect(screen.getByText("Still unhappy with your rent adjustment? Find help now.")).toBeTruthy();
    expect(screen.queryByText(/Filed an RSO complaint/)).toBeNull();
  });
  it("requires contact details and consent before local storage or demo inbox delivery",()=>{
    const {container}=render(<TenantIntakeDemo caseRecord={sample}/>);
    const button=screen.getByRole("button",{name:"Submit to database"}) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(readDemoRegistry(window.localStorage)).toHaveLength(0);
    expect(screen.getByText(/No tenant organizations receive them/)).toBeTruthy();
    expect(CITY_ROUTING["Los Angeles"].connectedUnions).toBe(0);
    fireEvent.click(screen.getByRole("checkbox",{name:"Consent to record this demo inquiry"}));
    fireEvent.submit(container.querySelector(".v4-demo-delivery form")!);
    expect(screen.getByRole("status").textContent).toMatch(/valid email.*valid phone/i);
    expect(readDemoRegistry(window.localStorage)).toHaveLength(0);
  });
  it("registers consented contact and automatic renewal summary under the selected city",async()=>{
    render(<TenantIntakeDemo caseRecord={sample}/>);
    fillContact();
    fireEvent.click(screen.getByRole("checkbox",{name:"Consent to record this demo inquiry"}));
    fireEvent.click(screen.getByRole("button",{name:"Submit to database"}));
    await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("Success!"));
    expect(screen.getByRole("status").textContent).toContain("browser-only demo database");
    expect(screen.getByRole("status").textContent).toContain("no organizations were contacted");
    const records=readDemoRegistry(window.localStorage);
    expect(records).toHaveLength(1);
    expect(records[0].city).toBe("Los Angeles");
    expect(records[0].purposes).toEqual(["assistance"]);
    expect(records[0].issue).toBe("Renter support inquiry");
    expect(records[0].packet).toContain("Name: Jane Doe");
    expect(records[0].packet).toContain("Email: jane@example.com");
    expect(records[0].packet).toContain("Phone: (555) 010-1234");
    expect(records[0].packet).toContain("Legal screening: Potential concern: check details");
    expect(records[0].packet).toContain("Market difference: +$273.00 (11.49%)");
    expect((screen.getByRole("button",{name:"Submit to database"}) as HTMLButtonElement).disabled).toBe(true);
  });
  it("can clear saved records and keeps organization discovery at the bottom",async()=>{
    render(<TenantIntakeDemo caseRecord={sample}/>);
    fillContact();
    fireEvent.click(screen.getByRole("checkbox",{name:"Consent to record this demo inquiry"}));
    fireEvent.click(screen.getByRole("button",{name:"Submit to database"}));
    await waitFor(()=>expect(readDemoRegistry(window.localStorage)).toHaveLength(1));
    fireEvent.click(screen.getByText(/Hackathon demo tools: local inquiry records/));
    fireEvent.click(screen.getByRole("button",{name:"View saved demo inquiries (1)"}));
    expect(screen.getByText(/Los Angeles: Renter support inquiry/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Clear saved demo inquiries"}));
    expect(readDemoRegistry(window.localStorage)).toHaveLength(0);
    const link=screen.getByRole("link",{name:"Find renter organizations below"});
    expect(link.getAttribute("href")).toBe("#moveup-network");
  });
  it("does not pretend a remote provider is connected in the test environment",()=>{
    expect(intakeEndpointConfigured).toBe(false);
    render(<TenantIntakeDemo caseRecord={sample}/>);
    expect(screen.getByText(/Prototype database:/)).toBeTruthy();
    expect(screen.queryByText(/demo inbox accepted/)).toBeNull();
  });
});
