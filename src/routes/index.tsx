import { useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import market from "@/data/rentMarket.snapshot.json";
import type { City } from "@/lib/renewalPolicy";
import { evaluateRenewal, officialActions, negotiationMessage, type Coverage, type IncreaseHistory } from "@/lib/renewalActions";
import { renewalScenarios, isStale } from "@/lib/renewalCalculator";

const cities: City[] = ["Los Angeles", "San Francisco", "San Diego", "Seattle"];
const money = (n:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
const pct = (n:number) => (n > 0 ? "+" : "") + n.toFixed(2) + "%";
const n = (s:string):number|null => s.trim() !== "" && Number.isFinite(Number(s)) && Number(s) >= 0 ? Number(s) : null;
const source = (label:string,url?:string) => url
  ? <a className="mv-source" href={url} target="_blank" rel="noopener noreferrer">{label}</a>
  : <span className="mv-source">{label}</span>;
const feedbackUrl = ""; // Add only when the founder provides a working form URL.
const pmms = {rate:"7.11",date:"2026-11-12",url:"https://www.freddiemac.com/pmms"};

function RentField({label,value,onChange,required=false,note,placeholder}:{label:string;value:string;onChange:(s:string)=>void;required?:boolean;note:string;placeholder?:string}){
  return <label className="mv-field"><strong>{label}</strong><input aria-label={label} type="number" min={required?"0.01":"0"} step="any" required={required} placeholder={placeholder??"Enter amount"} value={value} onChange={e=>onChange(e.target.value)}/>{source(note)}</label>;
}

export const Route = createFileRoute("/")({
  head:()=>({meta:[{title:"MoveUp — Renewal Check"},{name:"description",content:"Check a lease renewal against local market trends, conditional rent protections and housing options."}]}),
  component:RenewalPage
});

export function RenewalPage(){
  const [city,setCity]=useState<City>("Los Angeles");
  const [current,setCurrent]=useState("");
  const [offered,setOffered]=useState("");
  const [effective,setEffective]=useState("");
  const [horizon,setHorizon]=useState("12");
  const [example,setExample]=useState(false);
  const [submitted,setSubmitted]=useState<{city:City;current:number;offered:number;effective:string}|null>(null);
  const [error,setError]=useState("");
  const resultRef=useRef<HTMLDivElement|null>(null);
  const [stateCoverage,setStateCoverage]=useState<Coverage>("unknown");
  const [localCoverage,setLocalCoverage]=useState<Coverage>("unknown");
  const [priorIncrease,setPriorIncrease]=useState<IncreaseHistory>("unknown");
  const [noticeReceived,setNoticeReceived]=useState("");
  const [bedrooms,setBedrooms]=useState<"overall"|"1br"|"2br">("overall");
  const [option,setOption]=useState<"none"|"move"|"buy">("none");
  const [alternative,setAlternative]=useState("");
  const [moving,setMoving]=useState("");
  const [deposit,setDeposit]=useState("");
  const [price,setPrice]=useState("");
  const [down,setDown]=useState("");
  const [rate,setRate]=useState(pmms.rate);
  const [tax,setTax]=useState("");
  const [insurance,setInsurance]=useState("");
  const [other,setOther]=useState("");
  const [closing,setClosing]=useState("");
  const [loanYears,setLoanYears]=useState("30");

  const resetFollowups=()=>{
    setStateCoverage("unknown");setLocalCoverage("unknown");setPriorIncrease("unknown");setNoticeReceived("");
    setBedrooms("overall");setOption("none");setAlternative("");setMoving("");setDeposit("");
    setPrice("");setDown("");setRate(pmms.rate);setTax("");setInsurance("");setOther("");setClosing("");setLoanYears("30");
  };
  const change=(set:(s:string)=>void)=>(s:string)=>{set(s);setSubmitted(null);setExample(false);setError("");resetFollowups();};
  const clear=()=>{setCity("Los Angeles");setCurrent("");setOffered("");setEffective("");setHorizon("12");setSubmitted(null);setExample(false);setError("");resetFollowups();};
  const loadExample=()=>{
    clear();setCurrent("2400");setOffered("2650");
    const date=new Date();date.setDate(date.getDate()+45);
    const local=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
    setEffective(local);setCity("Los Angeles");setExample(true);
  };
  function launch(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const base=n(current),offer=n(offered),date=new Date(effective+"T00:00:00");
    const today=new Date();today.setHours(0,0,0,0);
    if(base===null||base<=0||offer===null||offer<=0){setError("Enter two monthly rent amounts greater than $0.");setSubmitted(null);return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(effective)||!Number.isFinite(date.getTime())||date<today){
      setError("Enter the date your proposed rent takes effect (today or later).");setSubmitted(null);return;
    }
    setError("");setSubmitted({city,current:base,offered:offer,effective});
    if(typeof requestAnimationFrame!=="undefined")requestAnimationFrame(()=>resultRef.current?.scrollIntoView?.({behavior:"smooth",block:"start"}));
  }
  const valid=!!submitted;
  const sCity=submitted?.city??city;
  const sCurrent=submitted?.current??0,sOffered=submitted?.offered??0;
  const months=Number(horizon);
  const rentChange=valid?sOffered-sCurrent:0;
  const finding=submitted?evaluateRenewal({
    city:sCity,currentRent:sCurrent,offeredRent:sOffered,effectiveDate:submitted.effective,
    stateCoverage,localCoverage,priorIncrease,noticeDate:noticeReceived,
  }):null;
  const latest=market.cities[sCity];
  const z=latest.zori,al=latest.apartmentList;
  const compare=bedrooms==="overall"?al:latest.apartmentListBedrooms[bedrooms];
  const totalRent=valid?sOffered*months:null;
  const costs=valid?renewalScenarios({
    currentRent:sCurrent,offeredRent:sOffered,months,
    alternativeRent:n(alternative),movingCost:n(moving),securityDeposit:n(deposit),
    homePrice:n(price),downPayment:n(down),aprPercent:n(rate)!==null&&n(rate)!<=100?n(rate):null,loanYears:Number(loanYears),
    propertyTaxMonthly:n(tax),insuranceMonthly:n(insurance),otherMonthly:n(other),closingCost:n(closing),
  }):null;
  const info=officialActions[sCity];
  const checks=finding?.checks??[];
  const showState=checks.some(c=>c.rule.type==="statewide");
  const showLocal=checks.some(c=>c.rule.type==="city");
  const showNotice=valid&&sCity==="Seattle"&&rentChange>0;
  const concerned=!!finding&&(finding.potentialStandardConcern||finding.shortSeattleNotice);
  const daysSinceZ=isStale(z.observationDate,new Date());
  const daysSinceAL=isStale(al.observationDate,new Date());
  const moveComplete=!!costs?.move && n(moving)!==null;
  const buyMissing=costs?.buy?.excludedCosts??[];
  const buyComplete=!!costs?.buy && buyMissing.length===0;
  const lenderIncomplete=!!costs?.buy&&!buyComplete;

  return <div className="mv-app">
    <header className="mv-header"><div className="mv-container mv-nav">
      <strong className="mv-brand">MOVEUP</strong><span>RENEWAL CHECK</span>
      <details className="mv-about"><summary>ABOUT US</summary><div className="mv-about-content">
        <strong>THE TEAM</strong>
        <a href="https://www.linkedin.com/in/laila-archer-21a482448/" target="_blank" rel="noopener noreferrer">Laila Archer · LinkedIn</a>
        <a href="https://www.linkedin.com/in/olivia-cook-863b51344/" target="_blank" rel="noopener noreferrer">Olivia Cook · LinkedIn</a>
      </div></details>
    </div></header>
    <main className="mv-container">
      <div className="mv-intro"><span className="mv-eyebrow">MOVEUP / RENEWAL CHECK</span><h1>CHECK YOUR<br/>RENT OFFER.</h1><p>Understand your increase, check your protections and compare your options.</p></div>
      <div className="mv-toolbar"><button type="button" onClick={loadExample}>Load example</button><button type="button" className="mv-text-button" onClick={clear}>Clear</button></div>
      {example?<p className="mv-example" role="status">EXAMPLE INPUTS — the rent amounts and date are illustrative, not market facts.</p>:null}
      <section className="mv-card mv-intake"><div className="mv-section-header"><span>01 / YOUR OFFER</span><h2>Start here.</h2></div>
        <form onSubmit={launch} noValidate>
          <div className="mv-form-grid">
            <label className="mv-field"><strong>City</strong><select value={city} onChange={e=>{setCity(e.target.value as City);setSubmitted(null);setError("");resetFollowups();setExample(false);}}>{cities.map(c=><option key={c}>{c}</option>)}</select>{source("YOUR SELECTION")}</label>
            <RentField label="Current rent / month" value={current} onChange={change(setCurrent)} required note="YOUR CURRENT LEASE"/>
            <RentField label="Offered rent / month" value={offered} onChange={change(setOffered)} required note="YOUR RENEWAL OFFER"/>
            <label className="mv-field"><strong>New rent takes effect</strong><input aria-label="New rent takes effect" type="date" required value={effective} onChange={e=>{setEffective(e.target.value);setSubmitted(null);setError("");setExample(false);resetFollowups();}}/>{source("YOUR RENEWAL NOTICE")}</label>
          </div>
          <button className="mv-launch" type="submit">CHECK MY OFFER</button>
          {error?<p role="alert" className="mv-error">{error}</p>:null}
        </form>
      </section>

      {submitted&&finding?<div className="mv-results" ref={resultRef}>
        <section className="mv-result-hero" aria-live="polite">
          <span>02 / YOUR RENT CHANGE</span>
          <div className="mv-decision">{rentChange>0?"+":""}{money(rentChange)}<small> / month</small></div>
          <strong>{rentChange>0?"Your rent would increase":rentChange<0?"Your rent would decrease":"Your rent would stay the same"}</strong>
          <p>{rentChange>0?"+":""}{money(rentChange*months)} over {months} months · {pct(finding.increasePercent)} from current rent</p>
          {source("YOUR CURRENT RENT + OFFER · ADJUSTABLE 12-MONTH COMPARISON")}
        </section>
        <section className="mv-section mv-action">
          <div className="mv-section-header"><span>03 / NEXT ACTION</span><h2>{finding.heading}</h2></div>
          <div className="mv-card">
            <p>{finding.explanation}</p>
            {finding.potentialStandardConcern?<p className="mv-important">A published rent standard may apply. This is not proof the increase is unlawful.</p>:null}
            {finding.shortSeattleNotice?<p className="mv-important">Seattle notice may be shorter than the 180-day requirement. Confirm the date and notice type with the city.</p>:null}
            {concerned?<div className="mv-actionlinks">
              <a href={info.url} target="_blank" rel="noopener noreferrer">{info.name}</a>
              <a href={info.eligibilityUrl} target="_blank" rel="noopener noreferrer">{info.eligibilityName}</a>
              {info.noticeUrl&&finding.shortSeattleNotice?<a href={info.noticeUrl} target="_blank" rel="noopener noreferrer">Seattle housing-cost notice guidance</a>:null}
            </div>:<a href={info.eligibilityUrl} target="_blank" rel="noopener noreferrer">Review official eligibility guidance</a>}
            {concerned?<p className="mv-minor">Before contacting an agency, keep your lease, written renewal offer, prior increase notices and the date the new rent would take effect.</p>:null}
            <details className="mv-details"><summary>Draft a neutral request to your landlord</summary><textarea readOnly rows={8} value={negotiationMessage(sCity,sCurrent,sOffered)} aria-label="Draft landlord request"/>{source("TEMPLATE FROM YOUR INPUTS · NOT A LEGAL DEMAND")}</details>
          </div>
        </section>

        <section className="mv-section">
          <div className="mv-section-header"><span>04 / TENANT PROTECTIONS</span><h2>Which rules may apply?</h2></div>
          <div className="mv-card">
            {checks.length===0?<p>No dated rent-cap standard is stored for this effective date. Review official guidance.</p>:<>
              <div className="mv-rule-questions">
                {showState?<label className="mv-field"><strong>Is your unit covered by state rent limits?</strong><select value={stateCoverage} onChange={e=>setStateCoverage(e.target.value as Coverage)}>
                  <option value="unknown">I'm not sure</option><option value="yes">I've checked — likely covered</option><option value="no">I've checked — exempt</option>
                </select>{source("YOUR RESPONSE · NOT A LEGAL CERTIFICATION")}</label>:null}
                {showLocal?<label className="mv-field"><strong>Is your unit covered by local rent control?</strong><select value={localCoverage} onChange={e=>setLocalCoverage(e.target.value as Coverage)}>
                  <option value="unknown">I'm not sure</option><option value="yes">I've checked — likely covered</option><option value="no">I've checked — not covered</option>
                </select>{source("YOUR RESPONSE · OFFICIAL RECORDS REQUIRED")}</label>:null}
                {concerned?<label className="mv-field"><strong>Other rent increases in the last 12 months?</strong><select value={priorIncrease} onChange={e=>setPriorIncrease(e.target.value as IncreaseHistory)}>
                  <option value="unknown">I'm not sure</option><option value="none">None</option><option value="yes">Yes</option>
                </select>{source("YOUR RENT HISTORY · MAY CHANGE APPLICABLE LIMITS")}</label>:null}
                {showNotice?<label className="mv-field"><strong>When did you receive written notice?</strong><input aria-label="When did you receive written notice?" type="date" value={noticeReceived} onChange={e=>setNoticeReceived(e.target.value)}/>{source("YOUR INPUT · SEATTLE 180-DAY NOTICE STANDARD")}</label>:null}
              </div>
              {checks.map(check=><div className="mv-rule" key={check.rule.id}>
                <div className="mv-rule-head"><strong>{check.rule.title}</strong><span className={"mv-status "+(check.coverage==="no"?"mv-unknown":"mv-depends")}>{check.coverage==="no"?"REPORTED EXEMPT":"CONDITIONAL"}</span></div>
                <p>{check.rule.conditions}</p>
                <div className="mv-rule-math">
                  <div><span>If covered: published standard</span><strong>{check.coverage==="no"?"Not applied":pct(check.rule.cap_pct)}</strong>{source("OFFICIAL GOVERNMENT STANDARD · "+check.rule.effective_from+" TO "+check.rule.effective_to,check.rule.source_url)}</div>
                  <div><span>Illustrative monthly rent at that standard</span><strong>{check.exampleMaxRent===null?"Not applied":money(check.exampleMaxRent)}</strong>{source("YOUR CURRENT RENT × PUBLISHED STANDARD · CONDITIONAL")}</div>
                </div>
                {check.abovePublishedStandard?<p className="mv-warning">Your offer exceeds this published standard. Eligibility, prior increases, exceptions and approvals remain unverified.</p>:null}
              </div>)}
            </>}
            <p className="mv-minor">No legal ceiling is certified. Rules may depend on building type, exemption notices, prior increases, banked adjustments and other facts. Educational information, not legal advice.</p>
          </div>
        </section>

        <section className="mv-section">
          <div className="mv-section-header"><span>05 / YOUR RENTAL MARKET</span><h2>Compare new-lease rents.</h2></div>
          <div className="mv-card">
            <label className="mv-field mv-bedroom"><strong>Apartment size to compare</strong><select value={bedrooms} onChange={e=>setBedrooms(e.target.value as typeof bedrooms)}><option value="overall">All unit sizes</option><option value="1br">1 bedroom</option><option value="2br">2 bedrooms</option></select>{source("YOUR SELECTION · APARTMENT LIST CITY DATA")}</label>
            <div className="mv-marketgrid">
              <div><span>Zillow ZORI · city-wide</span><strong>{money(z.typicalRent)}</strong>{source("ZORI · "+z.month+" · ASKING RENT",market.sources.zori.page)}
                <p>12-month change: {pct(z.yoyPct)}</p>{source("ZORI · HISTORICAL INDEX")}</div>
              <div><span>Apartment List · {bedrooms==="overall"?"overall":bedrooms==="1br"?"1 bedroom":"2 bedrooms"}</span><strong>{money(compare.typicalRent)}</strong>{source("APARTMENT LIST · "+compare.month+" · NEW LEASE",market.sources.apartmentList.url)}
                <p>12-month change: {pct(compare.yoyPct)}</p>{source("APARTMENT LIST · HISTORICAL ESTIMATE")}</div>
            </div>
            {daysSinceZ||daysSinceAL?<p className="mv-dataage">Data age: {daysSinceZ?"Zillow ZORI · "+z.month+" is older than 45 days. ":""}{daysSinceAL?"Apartment List · "+al.month+" is older than 45 days.":""}</p>:null}
            <p className="mv-minor">These benchmarks use different methodologies and unit coverage; they are not an estimate of your landlord's lawful rent. Above-market rent alone does not establish a violation.</p>
          </div>
        </section>

        <section className="mv-section">
          <div className="mv-section-header"><span>06 / YOUR ALTERNATIVES</span><h2>Compare your next move.</h2></div>
          <div className="mv-card">
            <label className="mv-field mv-horizon"><strong>Compare over</strong><select value={horizon} onChange={e=>setHorizon(e.target.value)}><option value="6">6 months</option><option value="12">12 months</option><option value="18">18 months</option><option value="24">24 months</option></select>{source("YOUR CHOICE · SAME HORIZON FOR ALL OPTIONS")}</label>
            <div className="mv-choice">
              <button type="button" aria-pressed={option==="none"} onClick={()=>setOption("none")}>Stay</button>
              <button type="button" aria-pressed={option==="move"} onClick={()=>setOption("move")}>Explore moving</button>
              <button type="button" aria-pressed={option==="buy"} onClick={()=>setOption("buy")}>Explore buying</button>
            </div>
            {option==="move"?<div className="mv-extra">
              <RentField label="Alternative rent / month" value={alternative} onChange={setAlternative} note="YOUR ALTERNATIVE RENT QUOTE"/>
              <RentField label="Moving costs" value={moving} onChange={setMoving} note="YOUR ADJUSTABLE ASSUMPTION · REQUIRED FOR COMPLETE COMPARISON"/>
              <RentField label="Refundable deposit (upfront only)" value={deposit} onChange={setDeposit} note="YOUR INPUT · NOT COUNTED AS EXPENSE"/>
            </div>:null}
            {option==="buy"?<div className="mv-extra">
              <RentField label="Home purchase price" value={price} onChange={setPrice} note="YOUR PRICE ASSUMPTION"/>
              <RentField label="Down payment" value={down} onChange={setDown} note="YOUR CASH ASSUMPTION"/>
              <RentField label="Mortgage APR (%)" value={rate} onChange={setRate} note="EDITABLE · FREDDIE MAC PMMS NOV 12 2026"/>
              {source("FREDDIE MAC PMMS · "+pmms.date+" · NATIONAL AVERAGE, NOT A QUOTE",pmms.url)}
              <label className="mv-field"><strong>Mortgage term</strong><select value={loanYears} onChange={e=>setLoanYears(e.target.value)}><option value="30">30 years</option><option value="20">20 years</option><option value="15">15 years</option></select>{source("YOUR ADJUSTABLE ASSUMPTION")}</label>
              <RentField label="Property tax / month" value={tax} onChange={setTax} note="YOUR ASSUMPTION · BLANK EXCLUDED"/>
              <RentField label="Home insurance / month" value={insurance} onChange={setInsurance} note="YOUR ASSUMPTION · BLANK EXCLUDED"/>
              <RentField label="Maintenance, HOA and other / month" value={other} onChange={setOther} note="YOUR ASSUMPTION · BLANK EXCLUDED"/>
              <RentField label="Closing costs" value={closing} onChange={setClosing} note="YOUR ASSUMPTION · BLANK EXCLUDED"/>
            </div>:null}
            <div className="mv-table-wrap"><table className="mv-table">
              <thead><tr><th>Option</th><th>Included cash outflow</th><th>Difference vs offered lease</th></tr></thead>
              <tbody>
                <tr><td><strong>Stay · offered rent</strong></td><td>{money(totalRent??0)}{source("YOUR OFFER × "+months+" MONTHS")}</td><td>{money(0)}{source("BASELINE")}</td></tr>
                {option==="move"?<tr><td><strong>Move · alternative lease</strong></td><td>{costs?.move?money(costs.move.total):"Not available"}{source("YOUR RENT QUOTE + ENTERED MOVING COST")}</td><td>{costs?.move?money(costs.move.differenceVsStay):"Not available"}{source("RELATIVE TO STAYING AT OFFER")}</td></tr>:null}
                {option==="buy"?<tr><td><strong>Buy · mortgage and entered costs</strong></td><td>{costs?.buy?money(costs.buy.total):"Not available"}{source("YOUR PURCHASE INPUTS + ENTERED COSTS")}</td><td>{costs?.buy?money(costs.buy.differenceVsStay):"Not available"}{source("RELATIVE TO STAYING AT OFFER")}</td></tr>:null}
              </tbody>
            </table></div>
            {option==="move"&&costs?.move?<p className="mv-minor">{moveComplete?"Moving cost included. ":"Partial comparison: moving cost is missing. "}Upfront cash including any entered refundable deposit: {money(costs.move.upfront)}. Refundable deposit is not treated as an expense.</p>:null}
            {option==="buy"&&costs?.buy?<div className="mv-buy-detail">
              <strong>Principal repaid over {months} months: {money(costs.buy.principalRepaid)}</strong>
              {source("MORTGAGE AMORTIZATION · YOUR PRICE, DOWN PAYMENT, RATE AND TERM")}
              <p>Mortgage payments include principal and interest. Principal repayment builds equity, not spendable cash. Down payment is upfront, not a monthly expense.</p>
              {lenderIncomplete?<p className="mv-warning">Partial comparison. Missing: {buyMissing.join(", ")}. The displayed total excludes these costs; do not treat it as a complete cost of buying.</p>:<p className="mv-minor">Entered ownership costs included. Resale, taxes on transactions and appreciation are not forecast.</p>}
              <p>Upfront down payment and entered closing costs: {money(costs.buy.upfront)}.</p>
            </div>:null}
          </div>
        </section>

        <section className="mv-section mv-print">
          <div className="mv-section-header"><span>07 / SAVE YOUR FINDINGS</span><h2>Renewal summary</h2></div>
          <div className="mv-card">
            <p><strong>{sCity} · {submitted.effective}</strong> · {months} months</p>{source("YOUR LOCATION, EFFECTIVE DATE AND HORIZON")}
            <p>Current {money(sCurrent)} → Offered {money(sOffered)} · {pct(finding.increasePercent)}</p>{source("YOUR RENEWAL INPUTS")}
            <p>Monthly change: {money(finding.changePerMonth)} · Over horizon: {money(finding.changePerMonth*months)}</p>{source("YOUR INPUTS · CALCULATED")}
            <p><strong>Action: {finding.heading}</strong> — {finding.explanation}</p>{source("CONDITIONAL OFFICIAL RENT-RULE SCREEN")}
            {checks.map(c=><p key={c.rule.id}>{c.rule.title}: {c.coverage==="no"?"reported exempt":pct(c.rule.cap_pct)+" published standard, "+(c.coverage==="unknown"?"coverage unknown":"coverage self-reported")}. <a href={c.rule.source_url} target="_blank" rel="noopener noreferrer">Official source</a> ({c.rule.effective_from}–{c.rule.effective_to}).</p>)}
            <p>Zillow ZORI {money(z.typicalRent)} ({z.month}) · Apartment List {money(compare.typicalRent)} ({compare.month}; {bedrooms}).</p>{source("ZILLOW RESEARCH + APARTMENT LIST CITY OBSERVATIONS")}
            <p>Stay: {money(totalRent??0)} · {option==="move"?"Move: "+(costs?.move?money(costs.move.total):"Not available"):""} {option==="buy"?"Buy: "+(costs?.buy?money(costs.buy.total):"Not available"):""}</p>{source("USER INPUTS + OPTIONAL COST ASSUMPTIONS")}
            <p>Assumptions: {months}-month horizon; {option==="move"?"alternative rent "+alternative+", moving cost "+(moving||"missing")+", refundable deposit "+(deposit||"not entered"):""} {option==="buy"?"price "+price+", down payment "+down+", rate "+rate+"% (Freddie Mac "+pmms.date+"), tax "+(tax||"excluded")+", insurance "+(insurance||"excluded")+", other "+(other||"excluded")+", closing "+(closing||"excluded"):""}</p>{source("YOUR ENTRIES · USER-ADJUSTABLE")}
            <p>Freshness: Zillow {z.month} {daysSinceZ?"(older than 45 days)":""}; Apartment List {al.month} {daysSinceAL?"(older than 45 days)":""}. Housing and legal rules can change.</p>{source("DATA OBSERVATION DATES · BROWSER DATE")}
            <p className="mv-minor">Educational information, not legal or financial advice. No account; the application does not save your input to a server.</p>
            <button className="mv-printbutton" type="button" onClick={()=>window.print()}>Print / Save as PDF</button>
            {feedbackUrl?<a href={feedbackUrl} target="_blank" rel="noopener noreferrer">Would you pay for this? Tell us</a>:null}
          </div>
        </section>
      </div>:null}
    </main>
    <footer className="mv-container mv-footer">MOVEUP · EDUCATIONAL RENEWAL CHECK</footer>
  </div>;
}
