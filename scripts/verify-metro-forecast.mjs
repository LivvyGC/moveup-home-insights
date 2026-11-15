// Verification-only: official Zillow Research metro forecast snapshot, no browsing/scraping listings.
const URL="https://files.zillowstatic.com/research/public_csvs/zhvf_growth/Metro_zhvf_growth_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
function csv(text){
 const rows=[];let row=[],value="",quote=false;
 for(let i=0;i<text.length;i++){
  let c=text[i];
  if(c==='"'){if(quote&&text[i+1]==='"'){value+='"';i++;}else quote=!quote;}
  else if(c===','&&!quote){row.push(value);value="";}
  else if((c==='\r'||c==='\n')&&!quote){
   if(c==='\r'&&text[i+1]==='\n')i++;
   row.push(value);value="";if(row.some(Boolean))rows.push(row);row=[];
  }else value+=c;
 }
 if(row.length||value){row.push(value);rows.push(row);}return rows;
}
const cities=["Los Angeles","San Francisco","San Diego","New York","Austin","Dallas","Miami","Orlando","Seattle","Denver"];
try{
 const res=await fetch(URL,{signal:AbortSignal.timeout(20000)});
 console.log("METRO_FORECAST_HTTP",res.status);
 if(!res.ok)process.exit(0);
 const text=await res.text();
 const rows=csv(text),header=rows[0]||[];
 console.log("METRO_FORECAST_COLUMNS",header.slice(0,12).join("|"));
 const nameI=header.indexOf("RegionName"),stateI=header.indexOf("State"),baseI=header.indexOf("BaseDate"),regionI=header.indexOf("RegionType");
 const forecastIndices=header.map((h,i)=>/^\d{4}-\d{2}-\d{2}$/.test(h)?i:-1).filter(i=>i>=0);
 console.log("METRO_FORECAST_ROWS",rows.length-1,"DATE_COLS",forecastIndices.length);
 if(nameI<0||baseI<0||!forecastIndices.length)process.exit(0);
 const results=[];
 for(const city of cities){
  const state={"Los Angeles":"CA","San Francisco":"CA","San Diego":"CA","New York":"NY","Austin":"TX","Dallas":"TX","Miami":"FL","Orlando":"FL","Seattle":"WA","Denver":"CO"}[city];
  const options=rows.slice(1).filter(r=>r[nameI]?.trim()===city+", "+state&&
    (regionI<0||r[regionI]==="msa"));
  const match=options.length===1?options[0]:null;
  if(!match){console.log("METRO_UNMATCHED",city,options.length);continue;}
  const base=match[baseI],last=forecastIndices.at(-1);
  const val=Number(match[last]);
  const n=(s)=>Number(s.slice(0,4))*12+Number(s.slice(5,7));
  if(!base||!Number.isFinite(val)||!match[last]||n(header[last])-n(base)!==12){console.log("METRO_BAD_HORIZON",city,base,header[last]);continue;}
  results.push({city,metroName:match[nameI],state:match[stateI]||null,baseMonth:base.slice(0,7),targetMonth:header[last].slice(0,7),yearAheadPct:val});
 }
 console.log("METRO_SNAPSHOT_JSON",JSON.stringify(results));
}catch(e){console.log("METRO_FORECAST_UNAVAILABLE",String(e));}
