import {describe,it,expect} from "vitest";
import { CITY_ROUTING, REGISTRY_KEY, createDemoRecord, saveDemoRecord,
  readDemoRegistry, clearDemoRegistry, countDemoRecordsByCity, MAX_DEMO_RECORDS,
} from "./demoRegistry";

function fakeStore(){
  const cache=new Map<string,string>();
  return {
    getItem:(k:string)=>cache.get(k)??null,
    setItem:(k:string,v:string)=>{cache.set(k,v);},
    removeItem:(k:string)=>{cache.delete(k);},
  };
}
const make=(id:string,city:"Los Angeles"|"Seattle"="Los Angeles")=>createDemoRecord({
  id,city,createdAt:"2026-11-14T20:00:00.000Z",purposes:["assistance"],
  issue:"Rent increase",packet:"A renter-prepared example record",
  delivery:"local_demo",
});
describe("MoveUp browser demo registry",()=>{
  it("declares no connected tenant unions in any supported city",()=>{
    expect(Object.keys(CITY_ROUTING)).toHaveLength(4);
    expect(Object.values(CITY_ROUTING).every(x=>x.connectedUnions===0)).toBe(true);
  });
  it("records only when invoked, groups by submitted city, and can be cleared",()=>{
    const store=fakeStore();
    expect(readDemoRegistry(store)).toEqual([]);
    saveDemoRecord(store,make("MU-1"));
    saveDemoRecord(store,make("MU-2","Seattle"));
    const count=countDemoRecordsByCity(readDemoRegistry(store));
    expect(count["Los Angeles"]).toBe(1);
    expect(count.Seattle).toBe(1);
    expect(count["San Francisco"]).toBe(0);
    clearDemoRegistry(store);
    expect(store.getItem(REGISTRY_KEY)).toBeNull();
  });
  it("keeps only a bounded number of stored demo records",()=>{
    const store=fakeStore();
    for(let n=0;n<MAX_DEMO_RECORDS+5;n++)saveDemoRecord(store,make("MU-"+n));
    const list=readDemoRegistry(store);
    expect(list).toHaveLength(MAX_DEMO_RECORDS);
    expect(list[0].id).toBe("MU-5");
  });
  it("refuses a case with no renter-selected purpose",()=>{
    expect(()=>createDemoRecord({
      id:"MU-Z",city:"Seattle",createdAt:"2026-11-14",purposes:[],
      issue:"Test",packet:"Example",delivery:"local_demo",
    })).toThrow(/required/);
  });
  it("cannot turn malformed or corrupted local storage into records",()=>{
    const store=fakeStore();
    store.setItem(REGISTRY_KEY,"not JSON");
    expect(readDemoRegistry(store)).toEqual([]);
    store.setItem(REGISTRY_KEY,JSON.stringify([{id:"bad",city:"Unknown"}]));
    expect(readDemoRegistry(store)).toEqual([]);
  });
});
