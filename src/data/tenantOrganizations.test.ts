import {describe,it,expect} from "vitest";
import {
  TENANT_ORGANIZATIONS, organizationsForCity, organizationsByFocus,
  totalDirectoryOrganizations, DIRECTORY_LAST_REVIEWED,
} from "./tenantOrganizations";
describe("verified public tenant organization directory",()=>{
 it("is a curated set, not a market size claim",()=>{
  expect(totalDirectoryOrganizations()).toBe(12);
  expect(DIRECTORY_LAST_REVIEWED).toBe("2026-11-14");
  expect(new Set(TENANT_ORGANIZATIONS.map(x=>x.id)).size).toBe(12);
 });
 it("has a clear public source and website for every item",()=>{
  for(const item of TENANT_ORGANIZATIONS){
   expect(item.url).toMatch(/^https:\/\//);
   expect(item.sourceUrl).toMatch(/^https:\/\//);
   expect(item.summary.length).toBeGreaterThan(25);
   expect(["Tenant union","Tenant organizing","Tenant counseling","Legal support"]).toContain(item.kind);
  }
 });
 it("shows 3 in LA, 2 in SF, 3 in SD and 4 in Seattle",()=>{
  expect(organizationsForCity("Los Angeles")).toHaveLength(3);
  expect(organizationsForCity("San Francisco")).toHaveLength(2);
  expect(organizationsForCity("San Diego")).toHaveLength(3);
  expect(organizationsForCity("Seattle")).toHaveLength(4);
 });
 it("filters by assistance or organizing but does not hide multi-purpose organizations",()=>{
  expect(organizationsByFocus("Los Angeles","organizing")).toHaveLength(3);
  expect(organizationsByFocus("San Diego","assistance").some(x=>x.id==="sd-lassd")).toBe(true);
  expect(organizationsByFocus("Seattle","organizing").some(x=>x.id==="sea-pstu")).toBe(true);
 });
});
