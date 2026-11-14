import { describe, it, expect } from "vitest";
import { pickBestMarket, yesProbability } from "./signal-parse";
const mk=(question:string,outcomes:string[],prices:string[],volume=1)=>({
  question,active:true,closed:false,volume,
  outcomes:JSON.stringify(outcomes),outcomePrices:JSON.stringify(prices),
});
describe("market parsing", () => {
  it("Yes price is looked up by name",()=>expect(yesProbability(mk("q",["No","Yes"],["0.7","0.3"]))).toBe(30));
  it("No Yes outcome",()=>expect(yesProbability(mk("q",["Up","Down"],["0.5","0.5"]))).toBeNull());
  it("Malformed prices",()=>expect(yesProbability({outcomes:"not json",outcomePrices:"[]"})).toBeNull());
  it("Highest-volume eligible match",()=>{
    const data={events:[
      {markets:[mk("Fed cut December?",["Yes","No"],["0.4","0.6"],10)]},
      {markets:[mk("Fed cut January?",["Yes","No"],["0.2","0.8"],99)]},
    ]};
    expect(pickBestMarket(data,["fed","cut"])?.probability).toBe(20);
  });
  it("Empty results",()=>{
    expect(pickBestMarket({events:[]},["fed"])).toBeNull();
    expect(pickBestMarket("garbage",["fed"])).toBeNull();
  });
});
