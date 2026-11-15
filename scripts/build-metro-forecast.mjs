/**
 * Rebuild a *small* dated metro forecast snapshot from the public official Zillow ZHVF CSV.
 * This tool runs during data maintenance, not on every user request.
 * Run: node scripts/build-metro-forecast.mjs
 * A missing/duplicate region fails rather than silently relabeling a forecast.
 */
import {writeFileSync} from "node:fs";
const URL="https://files.zillowstatic.com/research/public_csvs/zhvf_growth/Metro_zhvf_growth_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
const cities=[["Los Angeles","CA"],["San Francisco","CA"],["San Diego","CA"],["New York","NY"],["Austin","TX"],["Dallas","TX"],["Miami","FL"],["Orlando","FL"],["Seattle","WA"],["Denver","CO"]];
function rows(csv){
 let output=[],row=[],value="",quote=false;
 for(let i=0;i<csv.length;i++){
  let c=csv[i];
  if(c==='"'){if(quote&&csv[i+1]==='"'){value+='"';i++;}else quote=!quote;}
  else if(!quote&&c===','){row.push(value);value="";}
  else if(!quote&&(c==='\n'||c==='\r')){
   if(c==='\r'&&csv[i+1]==='\n')i++;
   row.push(value);value="";if(row.some(Boolean))output.push(row);row=[];
  }else value+=c;
 }
 if(row.length||value){row.push(value);output.push(row);}
 return output;
}
const response=await fetch(URL,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error("Official ZHVF unavailable (HTTP "+response.status+")");
const [head,...data]=rows(await response.text());
const regionI=head.indexOf("RegionName"),baseI=head.indexOf("BaseDate"),typeI=head.indexOf("RegionType");
if(regionI<0||baseI<0)throw Error("Unexpected forecast schema");
const dateCols=head.map((x,i)=>/^\d{4}-\d{2}-\d{2}$/.test(x)?i:-1).filter(i=>i>=0);
const index=d=>Number(d.slice(0,4))*12+Number(d.slice(5,7));
const result=cities.map(([city,state])=>{
 const expected=city+", "+state;
 const matches=data.filter(row=>row[regionI]?.trim()===expected&&(typeI<0||row[typeI]==="msa"));
 if(matches.length!==1)throw new Error("Not uniquely matched: "+expected+" ("+matches.length+")");
 const row=matches[0],base=row[baseI];
 const oneYear=dateCols.find(i=>index(head[i])-index(base)===12);
 if(oneYear==null||row[oneYear]?.trim()==="")throw Error("Missing 12-month forecast for "+expected);
 const yearAheadPct=Number(row[oneYear]);
 if(!Number.isFinite(yearAheadPct)||Math.abs(yearAheadPct)>100)throw Error("Invalid forecast for "+expected);
 return {city,state,metroName:expected,geography:"metro",baseMonth:base.slice(0,7),targetMonth:head[oneYear].slice(0,7),yearAheadPct};
});
const snapshot={source:"Zillow Research ZHVF, Metro",sourceUrl:URL,updatedAt:new Date().toISOString().slice(0,10),metros:result};
writeFileSync(new URL("../src/data/metroForecast.snapshot.json",import.meta.url),JSON.stringify(snapshot,null,2)+"\n");
console.log(JSON.stringify(snapshot,null,2));
