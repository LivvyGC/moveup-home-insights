import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {
  TENANT_ORGANIZATIONS,organizationsForCity,organizationsByFocus,totalDirectoryOrganizations,
} from "../data/tenantOrganizations";
import {TenantOrganizationDirectory} from "../components/TenantOrganizationDirectory";
afterEach(cleanup);

describe("Public renter organization directory",()=>{
 it("shows twelve unique sourced examples, not partner or TAM estimates",()=>{
  expect(totalDirectoryOrganizations()).toBe(12);
  expect(new Set(TENANT_ORGANIZATIONS.map(x=>x.id)).size).toBe(12);
  for(const org of TENANT_ORGANIZATIONS){
   expect(org.url).toMatch(/^https:\/\//);
   expect(org.sourceUrl).toMatch(/^https:\/\//);
   expect(org.summary.length).toBeGreaterThan(15);
  }
 });
 it("groups sourced organizations by all four supported cities",()=>{
  expect(organizationsForCity("Los Angeles")).toHaveLength(3);
  expect(organizationsForCity("San Francisco")).toHaveLength(2);
  expect(organizationsForCity("San Diego")).toHaveLength(3);
  expect(organizationsForCity("Seattle")).toHaveLength(4);
 });
 it("keeps organizing versus counseling filters separate",()=>{
  const organizing=organizationsByFocus("San Diego","organizing");
  const counseling=organizationsByFocus("San Diego","assistance");
  expect(organizing.some(x=>x.name==="Tenant Councils of San Diego")).toBe(true);
  expect(counseling.some(x=>x.name==="Legal Aid Society of San Diego")).toBe(true);
 });
 it("shows two curated groups initially, allows expansion and has real external links",()=>{
  render(<TenantOrganizationDirectory city="Los Angeles"/>);
  expect(screen.getByText("Renter organizations in Los Angeles")).toBeTruthy();
  expect(screen.getByRole("link",{name:/Visit Los Angeles Tenants Union website/})).toBeTruthy();
  expect(screen.queryByRole("link",{name:/Visit Tenants of California website/})).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:/See all 3 listed groups/}));
  expect(screen.getByRole("link",{name:/Visit Tenants of California website/})).toBeTruthy();
  expect(screen.getByText(/Independent listings, not MoveUp partners/)).toBeTruthy();
 });
 it("does not invent organizations when filtering",()=>{
  render(<TenantOrganizationDirectory city="San Francisco"/>);
  fireEvent.click(screen.getByRole("button",{name:"Organizing"}));
  expect(screen.getByText("Housing Rights Committee of SF")).toBeTruthy();
  expect(screen.getByRole("button",{name:"Organizing"}).getAttribute("aria-pressed")).toBe("true");
 });
});
