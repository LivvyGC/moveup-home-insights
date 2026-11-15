export type City = "Los Angeles" | "San Francisco" | "San Diego" | "Seattle";
export type RuleStatus = "verified_applicable" | "depends_on_building_or_tenant" | "proposed" | "historical" | "unknown";
export type Rule = {
 id:string; jurisdiction:string; type:"statewide"|"city"; title:string;
 status:RuleStatus; effective_from:string; effective_to:string;
 cap_pct:number; conditions:string; source_url:string; last_verified_at:string;
};
const verified="2026-11-14";
export const rentRules: Record<City,Rule[]> = {
 "Los Angeles":[
 {id:"ca-la",jurisdiction:"Los Angeles County, CA",type:"statewide",title:"California Tenant Protection Act",status:"depends_on_building_or_tenant",effective_from:"2026-08-01",effective_to:"2027-07-31",cap_pct:8.7,conditions:"Most covered rental housing older than 15 years. Exemptions depend on property type, ownership, statutory notices, and tenancy. A stricter local ordinance may apply.",source_url:"https://oag.ca.gov/rentcaps",last_verified_at:verified},
 {id:"la-rso",jurisdiction:"City of Los Angeles, CA",type:"city",title:"LA Rent Stabilization Ordinance (base annual adjustment)",status:"depends_on_building_or_tenant",effective_from:"2026-07-01",effective_to:"2027-06-30",cap_pct:3,conditions:"Most covered units with occupancy certificates issued before October 1, 1978. Banked increases, exemptions, and special authorized adjustments may affect an actual limit. The displayed rate is the regular annual adjustment only.",source_url:"https://housing.lacity.gov/renter-protections-2",last_verified_at:verified}
 ],
 "San Francisco":[
 {id:"ca-sf",jurisdiction:"San Francisco County, CA",type:"statewide",title:"California Tenant Protection Act",status:"depends_on_building_or_tenant",effective_from:"2026-08-01",effective_to:"2027-07-31",cap_pct:8.8,conditions:"Most covered rental housing older than 15 years; property-type and ownership exemptions apply. Local protections may be stronger.",source_url:"https://oag.ca.gov/rentcaps",last_verified_at:verified},
 {id:"sf-rso",jurisdiction:"City and County of San Francisco, CA",type:"city",title:"San Francisco rent-controlled annual adjustment",status:"depends_on_building_or_tenant",effective_from:"2026-03-01",effective_to:"2027-02-28",cap_pct:1.6,conditions:"Typically covered units with certificates of occupancy before June 13, 1979. Banked increases, passthroughs, and exemptions can affect lawful rent; this is the standard annual adjustment only.",source_url:"https://oag.ca.gov/rentcaps",last_verified_at:verified}
 ],
 "San Diego":[
 {id:"ca-sd",jurisdiction:"San Diego County, CA",type:"statewide",title:"California Tenant Protection Act",status:"depends_on_building_or_tenant",effective_from:"2026-08-01",effective_to:"2027-07-31",cap_pct:8.2,conditions:"Most covered rental housing older than 15 years; property-type and ownership exemptions apply. Check city tenant protections and lease facts separately.",source_url:"https://oag.ca.gov/rentcaps",last_verified_at:verified}
 ],
 "Seattle":[
 {id:"wa-2026",jurisdiction:"Washington State",type:"statewide",title:"Washington annual rent-increase limit (2026)",status:"depends_on_building_or_tenant",effective_from:"2026-01-01",effective_to:"2026-12-31",cap_pct:9.683,conditions:"Residential tenancies covered by RCW 59.18; exemptions include certain newly constructed properties within 12 years of occupancy, among others. Other legal rules and notice requirements remain separate.",source_url:"https://www.commerce.wa.gov/housing-policy/hb1217-landlord-resource-center/",last_verified_at:verified},
 {id:"wa-2027",jurisdiction:"Washington State",type:"statewide",title:"Washington annual rent-increase limit (2027)",status:"depends_on_building_or_tenant",effective_from:"2027-01-01",effective_to:"2027-12-31",cap_pct:10,conditions:"Residential tenancies covered by RCW 59.18; exemptions include certain newly constructed properties within 12 years of occupancy, among others. Other legal rules and notice requirements remain separate.",source_url:"https://www.commerce.wa.gov/housing-policy/hb1217-landlord-resource-center/",last_verified_at:verified}
 ]
};
export function activeRules(city: City, effectiveDate:string): Rule[] {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) return [];
 return rentRules[city].filter(r=>effectiveDate>=r.effective_from&&effectiveDate<=r.effective_to);
}
export function conditionalCap(currentRent:number, rules:Rule[], coverage:"yes"|"no"|"unknown", localCoverage:"yes"|"no"|"unknown"){
 if (!Number.isFinite(currentRent)||currentRent<=0) return null;
 if (coverage==="no" && localCoverage==="no") return null;
 const included=rules.filter(r=>r.type==="statewide" ? coverage!=="no" : localCoverage!=="no");
 if (!included.length) return null;
 const selected=included.reduce((a,b)=>a.cap_pct<=b.cap_pct?a:b);
 const independentlyConfirmed=coverage==="yes" && (localCoverage==="no" || (localCoverage==="yes"&&selected.type==="city"));
 // When local coverage is unknown, do not claim the statewide number is the final legal maximum.
 const status:RuleStatus=independentlyConfirmed ? "verified_applicable":"depends_on_building_or_tenant";
 return {capRent:Math.round(currentRent*(1+selected.cap_pct/100)*100)/100, capPct:selected.cap_pct,
   rule:selected,status, conditional:status!=="verified_applicable"};
}
