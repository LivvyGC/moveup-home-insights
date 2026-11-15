import { useState, type ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import market from "@/data/rentMarket.snapshot.json";
import {activeRules, conditionalCap, type City, type RuleStatus} from "@/lib/renewalPolicy";
import {renewalScenarios, capScenario, isStale} from "@/lib/renewalCalculator";

const CITIES:City[]=["Los Angeles","San Francisco","San Diego","Seattle"];
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
const signed=(n:number)=>`${n>0?"+":""}${money(n)}`;
const pct=(n:number)=>`${n>0?"+":""}${n.toFixed(2)}%`;
const FEEDBACK_FORM_URL=""; // Founder will supply a real form URL. Never link to an example domain.
const PMMS={rate:7.11, date:"2026-11-12", url:"https://www.freddiemac.com/pmms"};
type NumKey="current"|"offer"|"alt"|"moving"|"deposit"|"price"|"down"|"rate"|"tax"|"insurance"|"other"|"closing";
const source=(label:string,href?:string)=>href?<a className="rc-source" href={href} target="_blank" rel="noopener noreferrer">{label}</a>:<span className="rc-source">{label}</span>;
const num=(s:string):number|null=>s.trim()!==""&&Number.isFinite(Number(s))&&Number(s)>=0?Number(s):null;
const asZero=(s:string)=>num(s)??0;
function Field({label,value,onChange,note,placeholder,min=0}:{
 label:string;value:string;onChange:(s:string)=>void;note:string;placeholder?:string;min?:number
}){
 return <div className="rc-field"><label>{label}<input type="number" min={min} step="any" value={value} placeholder={placeholder??"Enter amount"} onChange={e=>onChange(e.target.value)}/></label>{source(note)}</div>;
}
function SourceMoney({value,sourceText}: {value:number|null;sourceText:string}){
 return <div><strong className="rc-amount">{value===null?"Not available":money(value)}</strong>{source(sourceText)}</div>;
}
export const Route=createFileRoute("/")({
 head:()=>({meta:[{title:"MoveUp — Renewal Check"},{name:"description",content:"Compare your lease renewal, new-lease market rents, conditional rent laws, and stay/move/buy costs."}]}),
 component:RenewalPage,
});
function RenewalPage(){
 const [city,setCity]=useState<City>("Los Angeles");
 const [current,setCurrent]=useState("");
 const [offer,setOffer]=useState("");
 const [end,setEnd]=useState("");
 const [months,setMonths]=useState("12");
 const [alternative,setAlternative]=useState("");
 const [moving,setMoving]=useState("");
 const [deposit,setDeposit]=useState("");
 const [price,setPrice]=useState("");
 const [down,setDown]=useState("");
 const [rate,setRate]=useState(String(PMMS.rate));
 const [term,setTerm]=useState("30");
 const [tax,setTax]=useState("");
 const [insurance,setInsurance]=useState("");
 const [other,setOther]=useState("");
 const [closing,setClosing]=useState("");
 const [stateCovered,setStateCovered]=useState<"yes"|"no"|"unknown">("unknown");
 const [localCovered,setLocalCovered]=useState<"yes"|"no"|"unknown">("unknown");
 const [buildingYear,setBuildingYear]=useState("");
 const [example,setExample]=useState(false);
 const patch=(set:(s:string)=>void)=>(s:string)=>{set(s);setExample(false);};
 const cleared=()=>{setCurrent("");setOffer("");setEnd("");setMonths("12");setAlternative("");setMoving("");setDeposit("");setPrice("");setDown("");setRate(String(PMMS.rate));setTax("");setInsurance("");setOther("");setClosing("");setStateCovered("unknown");setLocalCovered("unknown");setBuildingYear("");setExample(false);};
 const loadExample=()=>{cleared();setCity("Los Angeles");setCurrent("2400");setOffer("2650");setMonths("12");setEnd("2027-01-15");setExample(true);};
 const currentN=num(current),offerN=num(offer),monthsN=Number(months);
 const valid= currentN!==null&&currentN>0&&offerN!==null&&offerN>0&&Number.isInteger(monthsN)&&monthsN>0;
 const costs=valid?renewalScenarios({
  currentRent:currentN,offeredRent:offerN,months:monthsN,
  alternativeRent:num(alternative),movingCost:num(moving),securityDeposit:num(deposit),
  homePrice:num(price),downPayment:num(down),aprPercent:num(rate),loanYears:Number(term),
  propertyTaxMonthly:num(tax),insuranceMonthly:num(insurance),otherMonthly:num(other),closingCost:num(closing),
 }):null;
 const row=market.cities[city];
 const [z,al]=[row.zori,row.apartmentList];
 const now=new Date();
 const staleZ=isStale(z.observationDate,now),staleAL=isStale(al.observationDate,now);
 const rules=end?activeRules(city,end):[];
 const filtered=city==="San Diego"||city==="Seattle"?[]:rules.filter(r=>r.type==="city");
 const conditional=valid&&end?conditionalCap(currentN,rules,stateCovered,localCovered):null;
 const stateRule=rules.find(r=>r.type==="statewide");
 const ceiling=valid&&conditional?capScenario(currentN,offerN,monthsN,conditional.capPct):null;
 // This is not a final legal determination: coverage is based only on self-reported inputs.
 const coverage=conditional?.conditional?"depends_on_building_or_tenant":conditional?"verified_applicable":"unknown";
 const impact=valid?(offerN-currentN)*monthsN:null;
 const withCap=ceiling?.total??null;
 const primary=valid?costs?.stay.total??null:null;
 const proposedPct=valid?100*(offerN/currentN-1):null;
 const values=[{name:"Stay · offered rent",total:costs?.stay.total??null,delta:0,upfront:null,detail:"YOUR OFFER · RENT × MONTHS"},
  {name:"Stay · conditional cap",total:withCap,delta:ceiling?ceiling.deltaVsOffer:null,upfront:null,detail:"OFFICIAL MAXIMUM · ONLY IF COVERED"},
  {name:"Move · entered rental quote",total:costs?.move?.total??null,delta:costs?.move?.differenceVsStay??null,upfront:costs?.move?.upfront??null,detail:"YOUR RENT QUOTE + MOVING COST"},
  {name:"Buy · mortgage cash outflow",total:costs?.buy?.total??null,delta:costs?.buy?.differenceVsStay??null,upfront:costs?.buy?.upfront??null,detail:"YOUR PRICE/DOWN PAYMENT + RATE"}];
 const showSource=(name:"zori"|"apartmentList")=>name==="zori"?source("ZILLOW ZORI · SEP 2026 · ASKING RENT",market.sources.zori.page):source("APARTMENT LIST · OCT 2026 · NEW LEASE",market.sources.apartmentList.url);
 return <div className="rc-page">
  <header className="rc-header"><div className="rc-wrap rc-headrow"><strong className="rc-brand">MOVEUP</strong><div className="rc-topnav"><span>RENEWAL CHECK</span><details><summary>ABOUT US</summary><div className="rc-about"><strong>THE TEAM</strong><a href="https://www.linkedin.com/in/laila-archer-21a482448/" target="_blank" rel="noopener noreferrer">Laila Archer · LinkedIn</a><a href="https://www.linkedin.com/in/olivia-cook-863b51344/" target="_blank" rel="noopener noreferrer">Olivia Cook · LinkedIn</a></div></details></div></div></header>
  <main className="rc-wrap">
   <div className="rc-title"><span className="rc-kicker">MOVEUP / RENEWAL CHECK</span><h1>Renew, move,<br/>or buy?</h1></div>
   <div className="rc-actions"><button type="button" className="rc-button" onClick={loadExample}>Load example</button><button type="button" className="rc-quiet" onClick={cleared}>Clear inputs</button><button type="button" className="rc-quiet" onClick={()=>window.print()}>Print / Save PDF</button></div>
   {example?<div className="rc-note" role="status">EXAMPLE INPUTS — not a real renter or market quote. Adjust any field.</div>:null}
   {staleZ||staleAL?<div className="rc-stale" role="status">DATA AGE: {staleZ?"Zillow ZORI":" "}{staleZ&&staleAL?" and ":""}{staleAL?"Apartment List":""} observation is over 45 days old. Verify before relying on market comparisons.</div>:null}
   <div className="rc-first">
    <section className="rc-panel rc-intake"><div className="rc-sectionhead"><span>01 / YOUR RENEWAL</span><h2>The offer</h2></div>
     <div className="rc-fields">
      <div className="rc-field"><label>City<select value={city} onChange={e=>{setCity(e.target.value as City);setStateCovered("unknown");setLocalCovered("unknown");setExample(false);}}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></label>{source("YOUR SELECTION · CITY")}</div>
      <Field label="Current rent / month" value={current} onChange={patch(setCurrent)} note="YOUR INPUT · CURRENT LEASE"/>
      <Field label="Offered rent / month" value={offer} onChange={patch(setOffer)} note="YOUR INPUT · RENEWAL OFFER"/>
      <div className="rc-field"><label>New rent takes effect<input type="date" value={end} onChange={e=>{setEnd(e.target.value);setExample(false);}}/></label>{source("YOUR INPUT · EFFECTIVE DATE")}</div>
      <div className="rc-field"><label>Compare over<select value={months} onChange={e=>{setMonths(e.target.value);setExample(false);}}>{[6,12,18,24].map(x=><option key={x} value={x}>{x} months</option>)}</select></label>{source("YOUR SELECTION · TIME HORIZON")}</div>
     </div>
    </section>
    <section className="rc-hero" aria-live="polite"><div><div className="rc-herolabel">02 / ADDED RENT IF YOU RENEW</div><div className="rc-mainnumber">{impact===null?"Not available":signed(impact)}</div>{source("YOUR RENTS × TIME HORIZON")}</div>
      <div className="rc-herofoot"><strong>{valid?signed(offerN-currentN)+" / month":"Enter your current and offered rent"}</strong><span>{proposedPct===null?"—":pct(proposedPct)+" change"}</span></div>
    </section>
   </div>
   <section className="rc-section"><div className="rc-sectionhead"><span>03 / LOCAL MARKET</span><h2>Your offer vs new-lease rents</h2></div>
    <div className="rc-grid2">
     <div className="rc-panel"><strong>Zillow ZORI</strong><div className="rc-large">{money(z.typicalRent)}</div>{showSource("zori")}<div className="rc-marketpair"><span>12-month change</span><strong>{pct(z.yoyPct)}</strong></div>{showSource("zori")}<div className="rc-marketpair"><span>Offer vs Zillow</span><strong>{valid?signed(offerN-z.typicalRent):"Not available"}</strong></div>{source("YOUR OFFER − ZORI ASKING RENT")}</div>
     <div className="rc-panel"><strong>Apartment List</strong><div className="rc-large">{money(al.typicalRent)}</div>{showSource("apartmentList")}<div className="rc-marketpair"><span>12-month change</span><strong>{pct(al.yoyPct)}</strong></div>{showSource("apartmentList")}<div className="rc-marketpair"><span>Offer vs Apartment List</span><strong>{valid?signed(offerN-al.typicalRent):"Not available"}</strong></div>{source("YOUR OFFER − APARTMENT LIST RENT")}</div>
    </div>
    <p className="rc-muted">Different methods and reporting months. These describe new-tenant markets, not your landlord's renewal decision. No averaging.</p>
   </section>
   <section className="rc-section"><div className="rc-sectionhead"><span>04 / RENT RULES</span><h2>What might be allowed?</h2></div>
    <div className="rc-panel">
     <div className="rc-statusrow"><span className={"rc-status "+(coverage==="verified_applicable"?"rc-verified":coverage==="unknown"?"rc-unknown":"rc-depends")}>{coverage==="verified_applicable"?"SELF-REPORTED COVERED":coverage==="unknown"?"UNKNOWN":"DEPENDS ON BUILDING"}</span></div>
     <div className="rc-rulegrid">
      <div className="rc-field"><label>State-law coverage<select value={stateCovered} onChange={e=>setStateCovered(e.target.value as typeof stateCovered)}><option value="unknown">Not sure</option><option value="yes">I confirmed my unit is covered</option><option value="no">I confirmed my unit is exempt</option></select></label>{source("YOUR ANSWER · NOT LEGALLY VERIFIED")}</div>
      {filtered.length>0?<div className="rc-field"><label>City rent stabilization<select value={localCovered} onChange={e=>setLocalCovered(e.target.value as typeof localCovered)}><option value="unknown">Not sure</option><option value="yes">I confirmed my unit is covered</option><option value="no">I confirmed it does not apply</option></select></label>{source("YOUR ANSWER · NOT LEGALLY VERIFIED")}</div>:null}
      <div className="rc-field"><label>Building year (optional)<input type="number" min="1800" max={now.getFullYear()} value={buildingYear} onChange={e=>setBuildingYear(e.target.value)} placeholder="From building records"/></label>{source("YOUR INPUT · HELPS CHECK EXEMPTIONS")}</div>
     </div>
     <div className="rc-ruleout">
      <div><strong>If covered, annual base ceiling</strong><div className="rc-large">{ceiling?money(ceiling.maxRent):"Not available"}</div>{conditional?source(`${conditional.rule.title.toUpperCase()} · ${conditional.rule.capPct}% · ${conditional.rule.effective_from}–${conditional.rule.effective_to}`,conditional.rule.source_url):source("ENTER RENTS + EFFECTIVE DATE · OFFICIAL APPLICABILITY")}</div>
      <div><strong>Without a verified cap</strong><div className="rc-large">{valid?money(offerN):"Not available"}</div>{source("YOUR OFFER · NO CAP ASSUMED")}</div>
     </div>
     {rules.length?rules.map(rule=><div className="rc-ruleline" key={rule.id}><strong>{rule.title}</strong><span>{rule.cap_pct}% · {rule.effective_from} to {rule.effective_to}</span><p>{rule.conditions}</p>{source("OFFICIAL GOVERNMENT RULE · VERIFIED NOV 2026",rule.source_url)}</div>):<p className="rc-muted">No verified published cap in our records for the chosen effective date. Check the official agency; do not assume unlimited increases.</p>}
     {buildingYear?<p className="rc-muted">Building year alone cannot establish all exemptions. Confirm with the official agency before treating a ceiling as your legal maximum.</p>:null}
     <p className="rc-muted">Conditional illustration only. Banked increases, authorized adjustments, notice rules, exemptions and other local laws may change the legal result. Educational information, not legal advice.</p>
    </div>
   </section>
   <section className="rc-section"><div className="rc-sectionhead"><span>05 / HOUSING COSTS</span><h2>Stay, move, or buy</h2></div>
    <div className="rc-tablewrap"><table className="rc-table"><thead><tr><th>Option</th><th>Payments + included fees</th><th>Difference vs offer</th><th>Upfront cash</th></tr></thead><tbody>{values.map(v=><tr key={v.name}><td><b>{v.name}</b>{source(v.detail)}</td><td><SourceMoney value={v.total} sourceText={v.detail}/></td><td><SourceMoney value={v.delta} sourceText={v.delta===null?"NOT AVAILABLE · NEED INPUTS":"CALCULATED · VS STAY AT OFFER"}/></td><td><SourceMoney value={v.upfront} sourceText={v.upfront===null?"NOT MODELED / NOT REQUIRED":"YOUR INPUTS · REFUNDABLE DEPOSIT SEPARATE"}/></td></tr>)}</tbody></table></div>
    {costs?.buy?<div className="rc-equity"><strong>Of mortgage payments, principal repaid: {money(costs.buy.principalRepaid)}</strong>{source("YOUR PRICE + DOWN PAYMENT + RATE · AMORTIZATION")}{costs.buy.excludedCosts.length?<p>Excluded from buy costs (not entered): {costs.buy.excludedCosts.join(", ")}.</p>:null}<p>Principal builds equity; resale value or appreciation is not estimated. Upfront cash may overlap with the payments-and-fees column.</p></div>:null}
    <div className="rc-grid2 rc-expand">
      <details><summary>Moving assumptions</summary><div className="rc-detailfields"><Field label="Alternative rent / month" value={alternative} onChange={patch(setAlternative)} note="YOUR INPUT · ALTERNATIVE QUOTE"/><Field label="Moving cost" value={moving} onChange={patch(setMoving)} note="ADJUSTABLE ASSUMPTION · BLANK EXCLUDED"/><Field label="Refundable deposit" value={deposit} onChange={patch(setDeposit)} note="YOUR INPUT · UPFRONT, NOT EXPENSE"/></div></details>
      <details><summary>Buying assumptions</summary><div className="rc-detailfields">
       <Field label="Home price" value={price} onChange={patch(setPrice)} note="YOUR INPUT · PROPERTY PRICE"/>
       <Field label="Down payment" value={down} onChange={patch(setDown)} note="YOUR INPUT · CASH UPFRONT"/>
       <Field label="Annual mortgage rate (%)" value={rate} onChange={patch(setRate)} note="EDITABLE ASSUMPTION · FREDDIE MAC NOV 12, 2026"/>
       {source("FREDDIE MAC PMMS · NOV 12 2026 · NATIONAL BENCHMARK",PMMS.url)}
       <div className="rc-field"><label>Mortgage term<select value={term} onChange={e=>setTerm(e.target.value)}><option value="30">30 years</option><option value="20">20 years</option><option value="15">15 years</option></select></label>{source("ADJUSTABLE ASSUMPTION · LOAN TERM")}</div>
       <Field label="Property tax / month (optional)" value={tax} onChange={patch(setTax)} note="ADJUSTABLE ASSUMPTION · BLANK EXCLUDED"/>
       <Field label="Insurance / month (optional)" value={insurance} onChange={patch(setInsurance)} note="ADJUSTABLE ASSUMPTION · BLANK EXCLUDED"/>
       <Field label="Other ownership / month (optional)" value={other} onChange={patch(setOther)} note="ADJUSTABLE ASSUMPTION · BLANK EXCLUDED"/>
       <Field label="Closing costs (optional)" value={closing} onChange={patch(setClosing)} note="ADJUSTABLE ASSUMPTION · BLANK EXCLUDED"/>
      </div></details>
    </div>
   </section>
   <section className="rc-section rc-printreport"><div className="rc-sectionhead"><span>06 / SUMMARY</span><h2>Renewal summary</h2></div><div className="rc-panel">
     <p><b>{city}</b> · {end||"Effective date not entered"} · {months} months</p>{source("YOUR CITY + DATE + HORIZON")}
     <p>Current {currentN===null?"Not available":money(currentN)} · Offer {offerN===null?"Not available":money(offerN)} · Added over horizon {impact===null?"Not available":signed(impact)}</p>{source("YOUR INPUTS · CALCULATED COST")}
     <p>Legal ceiling: {ceiling?money(ceiling.maxRent)+" (conditional)":"Not available"} · {conditional?.rule.title??"No applicable dated rule selected"}</p>{conditional?source("OFFICIAL POLICY · "+conditional.rule.last_verified_at,conditional.rule.source_url):source("UNVERIFIED APPLICABILITY")}
     <p>Zillow ZORI {money(z.typicalRent)} ({z.month}) · Apartment List {money(al.typicalRent)} ({al.month})</p>{source("ZILLOW ZORI + APARTMENT LIST · DIFFERENT METHODOLOGIES")}
     <p>Stay {primary===null?"Not available":money(primary)} · Move {costs?.move?money(costs.move.total):"Not available"} · Buy {costs?.buy?money(costs.buy.total):"Not available"}</p>{source("YOUR INPUTS + EDITABLE ASSUMPTIONS · SAME HORIZON")}
     <p>Adjustable assumptions: moving {moving||"excluded"}, deposit {deposit||"excluded"}, price {price||"not entered"}, down payment {down||"not entered"}, rate {rate}%, loan term {term} years, tax {tax||"excluded"}, insurance {insurance||"excluded"}, other {other||"excluded"}, closing {closing||"excluded"}.</p>{source("YOUR INPUTS / EDITABLE PMMS BENCHMARK · NOV 12 2026")}
     <p>Data freshness: ZORI {staleZ?"older than 45 days":"within 45 days"}, Apartment List {staleAL?"older than 45 days":"within 45 days"} as of {now.toISOString().slice(0,10)}.</p>{source("OBSERVATION DATE + CURRENT DATE · 45-DAY RULE")}
     <p>Educational comparison only, not legal or financial advice. No personal information is saved.</p>
     <button type="button" className="rc-printbutton" onClick={()=>window.print()}>Print / Save as PDF</button>
     {FEEDBACK_FORM_URL?<a className="rc-feedback" href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">Would you pay for this? Tell us</a>:<p className="rc-muted">Feedback form: Not available until the founder supplies a URL.</p>}
    </div></section>
   <footer className="rc-footer">MOVEUP · RENEWAL CHECK · EDUCATIONAL DEMO</footer>
  </main>
 </div>;
}
