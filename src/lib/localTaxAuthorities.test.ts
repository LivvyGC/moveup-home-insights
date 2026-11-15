import {describe,it,expect} from "vitest";
import cities from "../data/cities.json";
import {allLocalTaxAuthorities,localTaxAuthority} from "./localTaxAuthorities";
import {policiesFor} from "./policyIndicators";
describe("official jurisdiction source coverage",()=>{
 it("has exactly one locally sourced authority for every supported city",()=>{
  expect(allLocalTaxAuthorities).toHaveLength(10);
  for(const {city,state} of cities) {
   const r=localTaxAuthority(city,state);
   expect(r).not.toBeNull();
   expect(r?.officialUrl).toMatch(/^https:\/\//);
   expect(r?.jurisdiction.length).toBeGreaterThan(3);
  }
 });
 it("does not invent locations",()=>{
  expect(localTaxAuthority("Las Vegas","NV")).toBeNull();
 });
 it("has official policy source references for all six states",()=>{
  for(const state of new Set(cities.map(c=>c.state))) {
   const rules=policiesFor(state);
   expect(rules.length).toBeGreaterThan(0);
   for(const rule of rules){
    expect(rule.officialUrl).toMatch(/^https:\/\//);
    expect(rule.applicability.length).toBeGreaterThan(30);
   }
  }
 });
 it("identifies Florida's approved 2027 change separately",()=>{
  const policy=policiesFor("FL").find(p=>p.id==="fl-amendment-3-2027");
  expect(policy?.detail).toContain("2027");
  expect(policy?.applicability).toContain("January 1, 2027");
  expect(policy?.applicability).toContain("fifth year");
 });
});
