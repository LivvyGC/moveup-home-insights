// Zillow Research ZHVI: aggregate historical home-value index, not listings.
export interface CityMarket {
 city:string; state:string; month:string; typicalHomeValue:number;
 yearOverYearPct:number|null; lastThreeMonthsPct:number|null;
 oneMonthPct:number|null; sixMonthPct:number|null;
 source:"Zillow Research ZHVI";
}
export function parseCSV(csv:string):string[][] {
 const rows:string[][]=[];let row:string[]=[],v="",quoted=false;
 for(let i=0;i<csv.length;i++){
  const c=csv[i];
  if(c==='"'){if(quoted&&csv[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}
  else if(c===","&&!quoted){row.push(v);v="";}
  else if((c==="\n"||c==="\r")&&!quoted){
   if(c==="\r"&&csv[i+1]==="\n")i++;
   row.push(v);v="";if(row.some(x=>x!==""))rows.push(row);row=[];
  }else v+=c;
 }
 if(row.length||v){row.push(v);rows.push(row);}return rows;
}
const round=(v:number)=>Math.round(v*100)/100;
const monthIndex=(s:string)=>Number(s.slice(0,4))*12+Number(s.slice(5,7));
export function parseCityZHVI(csv:string,city:string,state:string):CityMarket|null{
 const rows=parseCSV(csv);if(rows.length<2)return null;
 const headers:string[]=rows[0]??[],cityI=headers.indexOf("RegionName");
 const stateI=headers.indexOf("State"),typeI=headers.indexOf("RegionType");
 if(cityI<0||stateI<0)return null;
 const dateI=headers.map((h,i)=>/^\d{4}-\d{2}-\d{2}$/.test(h)?i:-1).filter(i=>i>=0);
 if(dateI.length<13)return null;
 const row=rows.slice(1).find(r=>r[cityI]?.trim().toLowerCase()===city.toLowerCase()&&r[stateI]?.trim().toUpperCase()===state.toUpperCase()&&(typeI<0||r[typeI]==="city"));
 if(!row)return null;
 const cells:string[]=row;
 const valid=dateI.filter(i=>row[i]?.trim()!==""&&Number.isFinite(Number(row[i]))&&Number(row[i])>0);
 const last=valid.at(-1);if(last===undefined)return null;
 const latestI:number=last;
 const latest=Number(row[latestI]),month=(headers[latestI]??"").slice(0,7);
 function change(months:number):number|null{
  const prevI=valid.find(i=>monthIndex(headers[i]??"")===monthIndex(headers[latestI]??"")-months);
  if(prevI===undefined)return null;
  return round((latest/Number(cells[prevI])-1)*100);
 }
 return {city,state,month,typicalHomeValue:round(latest),yearOverYearPct:change(12),lastThreeMonthsPct:change(3),oneMonthPct:change(1),sixMonthPct:change(6),source:"Zillow Research ZHVI"};
}
