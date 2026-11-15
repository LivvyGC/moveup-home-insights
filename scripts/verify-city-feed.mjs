// Data-source verification only. No property listings are requested.
const cities=[["Los Angeles","CA"],["San Francisco","CA"],["San Diego","CA"],["New York","NY"],["Austin","TX"],["Dallas","TX"],["Miami","FL"],["Orlando","FL"],["Seattle","WA"],["Denver","CO"]];
const feeds=[
 ["ZHVI","https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"],
 ["ZHVF","https://files.zillowstatic.com/research/public_csvs/zhvf_growth/City_zhvf_growth_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"],
];
for(const [name,url] of feeds){
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(45000)});
  console.log(name,"HTTP",r.status,"content-length",r.headers.get("content-length"));
  if(!r.ok)continue;
  const text=await r.text();
  const lines=text.split(/\r?\n/).filter(Boolean);
  const head=lines[0]?.replace(/^\uFEFF/,"").split(",")??[];
  const cityI=head.indexOf("RegionName"),stateI=head.indexOf("State");
  const rows=lines.slice(1).map(line=>line.split(","));
  console.log(name,"fields",head.slice(0,8).join("|"),"rows",rows.length);
  if(cityI<0||stateI<0){console.log(name,"SCHEMA UNEXPECTED");continue;}
  for(const [city,state] of cities){
   const row=rows.find(r=>r[cityI]===city&&r[stateI]===state);
   console.log(name,city,state,row?"FOUND":"MISSING");
  }
 }catch(e){console.log(name,"UNAVAILABLE",String(e));}
}
