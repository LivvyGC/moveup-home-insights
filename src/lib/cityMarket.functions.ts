import {createServerFn} from "@tanstack/react-start";
import {parseCityZHVI,parseCSV,type CityMarket} from "./cityMarket.parse";
export interface CityForecast{
 source:"Zillow Research ZHVF";geography:"city";asOf:string;targetMonth:string;yearAheadPct:number;
}
export type MarketResponse= {status:"available";history:CityMarket;forecast:CityForecast|null}
 | {status:"unavailable";reason:string};
const HISTORY_URL="https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
const FORECAST_URL="https://files.zillowstatic.com/research/public_csvs/zhvf_growth/City_zhvf_growth_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
let historyCache:{text:string;until:number}|undefined;
let forecastCache:{text:string|null;until:number}|undefined;
const oneDay=86400000;
async function csv(url:string,cache:{text:string|null;until:number}|undefined,optional=false):Promise<string|null>{
 if(cache&&cache.until>Date.now())return cache.text;
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{Accept:"text/csv"}});
  if(!r.ok)throw new Error("Source unavailable");
  const text=await r.text();
  if(!text.includes("RegionName")||text.length<100)throw new Error("Invalid CSV");
  return text;
 }catch{if(optional)return null;throw new Error("Historical city market feed unavailable");}
}
function forecastFor(text:string,city:string,state:string):CityForecast|null{
 const rows=parseCSV(text),h=rows[0];if(!h)return null;
 const cityI=h.indexOf("RegionName"),stateI=h.indexOf("State"),typeI=h.indexOf("RegionType"),baseI=h.indexOf("BaseDate");
 if(cityI<0||stateI<0||baseI<0)return null;
 const row=rows.slice(1).find(r=>r[cityI]?.trim().toLowerCase()===city.toLowerCase()&&r[stateI]?.trim().toUpperCase()===state.toUpperCase()&&(typeI<0||r[typeI]==="city"));
 if(!row||!/^\d{4}-\d{2}/.test(row[baseI]??""))return null;
 const base=row[baseI].slice(0,7);
 const index=(s:string)=>Number(s.slice(0,4))*12+Number(s.slice(5,7));
 const dateI=h.findIndex(s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&index(s)-index(base)===12);
 if(dateI<0||row[dateI]?.trim()==="")return null;
 const value=Number(row[dateI]);if(!Number.isFinite(value)||Math.abs(value)>100)return null;
 return {source:"Zillow Research ZHVF",geography:"city",asOf:base,targetMonth:h[dateI].slice(0,7),yearAheadPct:Math.round(value*100)/100};
}
export const fetchCityMarketFn=createServerFn({method:"GET"})
.inputValidator((v:{city:string;state:string})=>{
 if(!v||typeof v.city!=="string"||typeof v.state!=="string"||
  !/^[A-Za-z .'-]{2,70}$/.test(v.city)||!/^[A-Z]{2}$/.test(v.state))throw new Error("Invalid city");
 return v;
})
.handler(async({data}):Promise<MarketResponse>=>{
 try{
  const t=await csv(HISTORY_URL,historyCache);
  if(!t)return {status:"unavailable",reason:"Historical data unavailable"};
  historyCache={text:t,until:Date.now()+oneDay};
  const history=parseCityZHVI(t,data.city,data.state);
  if(!history)return {status:"unavailable",reason:"No current city-level history in source"};
  const f=await csv(FORECAST_URL,forecastCache,true);
  forecastCache={text:f,until:Date.now()+oneDay};
  return {status:"available",history,forecast:f?forecastFor(f,data.city,data.state):null};
 }catch{return {status:"unavailable",reason:"City research feed unavailable; no location-specific result generated"};}
});
