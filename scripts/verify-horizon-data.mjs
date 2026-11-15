// One-off CI data inspection: only rows for the ten approved cities are printed.
// Do not run from the browser; source CSV is ~94 MB.
const SOURCE="https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
const cities=[["Los Angeles","CA"],["San Francisco","CA"],["San Diego","CA"],["New York","NY"],["Austin","TX"],["Dallas","TX"],["Miami","FL"],["Orlando","FL"],["Seattle","WA"],["Denver","CO"]];
const response=await fetch(SOURCE,{signal:AbortSignal.timeout(60000)});
if(!response.ok)throw new Error("ZHVI status "+response.status);
const lines=(await response.text()).split(/\r?\n/);
const head=lines[0].split(",");
const cityI=head.indexOf("RegionName"),stateI=head.indexOf("State");
if(cityI<0||stateI<0)throw new Error("Unexpected region fields");
const dates=head.map((d,i)=>/^\d{4}-\d{2}-\d{2}$/.test(d)?i:-1).filter(i=>i>=0);
const yearMonth=(str)=>Number(str.slice(0,4))*12+Number(str.slice(5,7));
const result=[];
for(const [city,state] of cities){
 const line=lines.find(l=>l.includes(","+city+",") && l.includes(","+state+","));
 if(!line)throw new Error("City missing "+city);
 const row=line.split(",");
 if(row[cityI]!==city||row[stateI]!==state)throw new Error("Ambiguous city "+city);
 const valid=dates.filter(i=>row[i]?.trim()!==""&&Number.isFinite(Number(row[i]))&&Number(row[i])>0);
 const latestI=valid.at(-1);
 if(latestI===undefined)throw new Error("No value "+city);
 const last=Number(row[latestI]);
 const change=(n)=>{
  const idx=valid.find(i=>yearMonth(head[i])===yearMonth(head[latestI])-n);
  if(idx===undefined)throw new Error("Missing "+n+"-month reference "+city);
  return Math.round((last/Number(row[idx])-1)*1e4)/100;
 };
 result.push({city,state,month:head[latestI].slice(0,7),typicalHomeValue:Math.round(last*100)/100,
   oneMonthPct:change(1),threeMonthPct:change(3),sixMonthPct:change(6),twelveMonthPct:change(12)});
}
console.log("HORIZON_JSON "+JSON.stringify(result));