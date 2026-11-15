import {describe,it,expect} from "vitest";
import {parseCityZHVI,parseCSV} from "./cityMarket.parse";
const months=Array.from({length:16},(_,i)=>new Date(Date.UTC(2025,i,1)).toISOString().slice(0,7)+"-01");
const h=["RegionID","RegionName","RegionType","State",...months].join(",");
const row=(city:string,state:string,start:number)=>["1",city,"city",state,...months.map((_,i)=>start+i*1000)].join(",");
describe("city research CSV",()=>{
 it("distinguishes cities",()=>{
  const c=[h,row("Los Angeles","CA",100000),row("New York","NY",200000)].join("\n");
  expect(parseCityZHVI(c,"Los Angeles","CA")?.typicalHomeValue).toBe(115000);
  expect(parseCityZHVI(c,"New York","NY")?.typicalHomeValue).toBe(215000);
  expect(parseCityZHVI(c,"Los Angeles","CA")?.yearOverYearPct).toBeCloseTo(11.65,1);
 });
 it("rejects unknown or insufficient data",()=>{
  expect(parseCityZHVI(h+"\n"+row("Austin","TX",100000),"Miami","FL")).toBeNull();
  expect(parseCityZHVI("RegionName,State,2026-10-01\nAustin,TX,100","Austin","TX")).toBeNull();
 });
 it("does not mistake a blank as zero",()=>{
  const data=[h,["1","Denver","city","CO",...months.map((_,i)=>i===3?"":100000+i*1000)].join(",")].join("\n");
  expect(parseCityZHVI(data,"Denver","CO")?.typicalHomeValue).toBe(115000);
 });
 it("parses quotes in a CSV",()=>{
  expect(parseCSV('RegionName,State\n"Washington, DC",DC\n')[1][0]).toBe("Washington, DC");
 });
});
