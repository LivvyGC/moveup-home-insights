// Curated descriptions from official government sources, reviewed 2026-11-14.
// These programs are NOT assumed applicable to every buyer and do not automatically
// reduce the estimated monthly property tax or add a BUY score.
export interface PolicyIndicator {
  id: string;
  scope: string;
  title: string;
  detail: string;
  applicability: string;
  officialUrl: string;
  lastReviewed: string;
}
const review = "2026-11-14";
// Primary-government-source factual disclosures only; no automatic benefit amounts.
const shared: Record<string, PolicyIndicator[]> = {
  CA: [{
    id:"ca-prop13",scope:"California",title:"Proposition 13 assessment limit",
    detail:"Generally limits base-year assessed value increases to 2% annually; a change of ownership can create a new base-year assessment. Local voter-approved debt charges may apply.",
    applicability:"General property-tax framework; actual new-purchase tax depends on county assessments and levies.",
    officialUrl:"https://boe.ca.gov/proptaxes/decline-in-value/",lastReviewed:review,
  }],
  NY: [{
    id:"ny-star",scope:"New York City",title:"School Tax Relief (STAR)",
    detail:"Eligible New York primary-residence owners can receive a STAR credit. The Basic STAR credit has a $500,000 income limit; the exemption is not open to new applicants.",
    applicability:"Eligibility depends on owner-occupancy, income and other criteria. No benefit deducted from this scenario.",
    officialUrl:"https://www.tax.ny.gov/pit/property/star/eligibility.htm",lastReviewed:review,
  }],
  TX: [{
    id:"tx-homestead",scope:"Texas",title:"Residence homestead school-tax exemption",
    detail:"The statewide school-district homestead exemption is $140,000 of appraised value under Texas Tax Code §11.13(b).",
    applicability:"Requires a qualifying residence homestead. School and other local levies vary; no exemption assumed in totals.",
    officialUrl:"https://tcss.legis.texas.gov/Docs/TX/htm/TX.11.htm",lastReviewed:review,
  }],
  FL: [{
    id:"fl-homestead",scope:"Florida",title:"Homestead and Save Our Homes",
    detail:"Qualifying permanent residents may receive a homestead exemption and an annual assessed-value growth cap based on the lower of 3% or CPI.",
    applicability:"Requires qualification and county property-appraiser approval. No personal savings assumed.",
    officialUrl:"https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx",lastReviewed:review,
  },{
    id:"fl-amendment-3-2027",scope:"Florida",title:"Amendment 3 — 2027 homestead assessment changes",
    detail:"Florida Department of Revenue bulletin PTO 26-21 confirms Amendment 3 was approved on November 3, 2026. For qualifying owners, the non-school-tax homestead exemption can exclude up to $150,000 of assessed value in 2027 and $250,000 in 2028. The non-homestead assessment-increase cap falls from 10% to 5%.",
    applicability:"Effective January 1, 2027 (2027 tax roll). People who were not Florida residents as of December 31, 2026 generally must wait until the fifth year of their homestead exemption to qualify for the increased exemption. The county property appraiser determines eligibility. No benefit automatically credited.",
    officialUrl:"https://floridarevenue.com/property/Documents/PTO_BUL_26-21.pdf",lastReviewed:review,
  }],
  WA: [{
    id:"wa-relief",scope:"Washington",title:"Property-tax relief for qualifying owners",
    detail:"Exemptions and deferrals are available to certain seniors, people with disabilities and veterans, subject to program rules.",
    applicability:"Income, ownership and other criteria depend on the applicant and county. Not included as an automatic tax reduction.",
    officialUrl:"https://dor.wa.gov/taxes-rates/property-tax/property-tax-exemption-seniors-people-retired-due-disability-and-veterans-disabilities",lastReviewed:review,
  }],
  CO: [{
    id:"co-senior",scope:"Colorado",title:"Senior and qualifying veteran exemption",
    detail:"Colorado separately provides a constitutional senior and qualifying veteran property-tax exemption. Senate Bill 26-116 ends the distinct qualified-senior primary residence valuation classification beginning in tax year 2027; it does not repeal the standard senior exemption.",
    applicability:"Property occupancy, age, disability and application requirements apply. No eligibility or tax reduction presumed.",
    officialUrl:"https://leg.colorado.gov/bills/sb26-116",lastReviewed:review,
  }],
};
export const policiesFor = (state: string): PolicyIndicator[] => shared[state] ?? [];
