// Official local assessment authorities; informational links, not app-side scraping.
// Cities may span more than one county or taxing district. Never assume a user's parcel
// is in the listed jurisdiction without checking its address.
export interface LocalTaxAuthority {
 city:string;state:string;jurisdiction:string;authority:string;
 officialUrl:string;note:string;verifiedOn:string;
}
const verifiedOn="2026-11-14";
const records:LocalTaxAuthority[]=[
 {city:"Los Angeles",state:"CA",jurisdiction:"Los Angeles County",authority:"LA County Property Tax Portal",officialUrl:"https://www.propertytax.lacounty.gov/",note:"Parcel assessments, exemptions and local charges determine an actual bill.",verifiedOn},
 {city:"San Francisco",state:"CA",jurisdiction:"City and County of San Francisco",authority:"Assessor-Recorder",officialUrl:"https://www.sf.gov/departments--assessor-recorder--about",note:"The assessed value and voter-approved assessments determine actual property taxes.",verifiedOn},
 {city:"San Diego",state:"CA",jurisdiction:"San Diego County",authority:"Assessor/Recorder/County Clerk",officialUrl:"https://www.sdarcc.gov/",note:"Actual assessment, special assessments and parcel location affect taxes.",verifiedOn},
 {city:"New York",state:"NY",jurisdiction:"New York City",authority:"NYC Department of Finance",officialUrl:"https://www.nyc.gov/site/finance/taxes/property-tax-rates.page",note:"Four property classes use different tax rates on taxable assessed value; a city-wide percentage of purchase price is not a tax quote.",verifiedOn},
 {city:"Austin",state:"TX",jurisdiction:"Travis County (primary)",authority:"Travis Central Appraisal District",officialUrl:"https://traviscad.org/",note:"Austin also extends into other counties; appraisal districts do not set all local tax rates.",verifiedOn},
 {city:"Dallas",state:"TX",jurisdiction:"Dallas County (primary)",authority:"Dallas Central Appraisal District",officialUrl:"https://www.dallascad.org/",note:"Dallas extends into other counties; property tax depends on taxing units and exemptions.",verifiedOn},
 {city:"Miami",state:"FL",jurisdiction:"Miami-Dade County",authority:"Miami-Dade Property Appraiser",officialUrl:"https://www.miamidadepa.gov/pa/real-estate/property-search.page",note:"Taxable values and homestead eligibility are assessed at the parcel level.",verifiedOn},
 {city:"Orlando",state:"FL",jurisdiction:"Orange County (primary)",authority:"Orange County Property Appraiser",officialUrl:"https://www.ocpafl.org/",note:"Some Orlando-area properties fall outside this jurisdiction; permanent-residence eligibility matters.",verifiedOn},
 {city:"Seattle",state:"WA",jurisdiction:"King County",authority:"King County Assessor: city levy reports",officialUrl:"https://kingcounty.gov/en/dept/assessor/buildings-and-property/property-value-and-information/reports/levy-rate-reports",note:"City, school district and levy code affect tax due; published levy comparisons are available.",verifiedOn},
 {city:"Denver",state:"CO",jurisdiction:"City and County of Denver",authority:"Denver Assessment and Taxation",officialUrl:"https://www.denvergov.org/Property",note:"Residential assessment values and levy rates depend on the actual parcel and tax year.",verifiedOn},
];
export function localTaxAuthority(city:string,state:string):LocalTaxAuthority|null {
 return records.find(r=>r.city===city&&r.state===state)??null;
}
export const allLocalTaxAuthorities=records;
