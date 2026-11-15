import { useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import market from "@/data/rentMarket.snapshot.json";
import type { City } from "@/lib/renewalPolicy";
import { evaluateRenewal, type Coverage, type IncreaseHistory } from "@/lib/renewalActions";
import { assessMarketOffer } from "@/lib/renewalV4";
import { isStale } from "@/lib/renewalCalculator";
import { buildTenantCase,coverageLabel,increaseLabel } from "@/lib/tenantCase";
import { House } from "lucide-react";
import { TenantIntakeDemo } from "@/components/TenantIntakeDemo";
import { TenantOrganizationDirectory } from "@/components/TenantOrganizationDirectory";

const CITIES: City[] = ["Los Angeles", "San Francisco", "San Diego", "Seattle"];
type Bedroom = "1br" | "2br" | "other";
const MONEY = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:2 });
const money = (v:number) => MONEY.format(v);
const signedMoney = (v:number) => (v>0?"+":"") + money(v);
const signedPct = (v:number) => (v>0?"+":"") + v.toFixed(2) + "%";
const parseMoney = (s:string) => s.trim() && Number.isFinite(Number(s)) && Number(s)>0 ? Number(s) : null;
const RESEARCH_URL = "https://www.apartmentlist.com/research/category/data-rent-estimates";
const LA_COMPLAINT_URL = "https://housing.lacity.gov/residents/file-a-rso-complaint";
const FormField = ({label,value,onChange}:{label:string;value:string;onChange:(next:string)=>void}) =>
  <label className="v4-field"><span>{label}</span><input aria-label={label} type="number" inputMode="decimal" step="0.01" min="0.01" value={value} onChange={e=>onChange(e.target.value)} placeholder="Monthly USD"/></label>;

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    {title:"MoveUp : Check Your Rent Offer"},
    {name:"description",content:"Compare your renewal offer with local rent data, screen relevant tenant protections, and prepare a sourced summary."},
  ]}),
  component: RenewalPage,
});

export function RenewalPage(){
  const [city,setCity] = useState<City>("Los Angeles");
  const [bedrooms,setBedrooms] = useState<Bedroom>("1br");
  const [current,setCurrent] = useState("");
  const [offer,setOffer] = useState("");
  const [effective,setEffective] = useState("");
  const [example,setExample] = useState(false);
  const [error,setError] = useState("");
  const [submitted,setSubmitted] = useState<{city:City;bedrooms:Bedroom;current:number;offer:number;effective:string}|null>(null);
  const [stateCoverage,setStateCoverage] = useState<Coverage>("unknown");
  const [localCoverage,setLocalCoverage] = useState<Coverage>("unknown");
  const [priorIncrease,setPriorIncrease] = useState<IncreaseHistory>("unknown");
  const [noticeReceived,setNoticeReceived] = useState("");
  const [period,setPeriod] = useState("12");
  const output = useRef<HTMLDivElement|null>(null);

  const resetReview=()=>{
    setStateCoverage("unknown");setLocalCoverage("unknown");setPriorIncrease("unknown");
    setNoticeReceived("");setPeriod("12");
  };
  const resetOnEdit=()=>{setSubmitted(null);setError("");setExample(false);resetReview();};
  const clear=()=>{
    setCity("Los Angeles");setBedrooms("1br");setCurrent("");setOffer("");setEffective("");
    setSubmitted(null);setError("");setExample(false);resetReview();
  };
  const loadExample=()=>{
    clear();
    const d=new Date(); d.setDate(d.getDate()+45);
    setEffective(new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10));
    setCity("Los Angeles");setBedrooms("2br");setCurrent("2400");setOffer("2650");setExample(true);
  };
  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const base=parseMoney(current), asked=parseMoney(offer);
    const d=new Date(effective+"T00:00:00");
    const isValidDate=/^\d{4}-\d{2}-\d{2}$/.test(effective) && Number.isFinite(d.getTime()) &&
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`===effective;
    if(base===null||asked===null){setError("Enter your current rent and the offered rent.");setSubmitted(null);return;}
    if(!isValidDate){
      setError("Enter a valid rent effective date. Past dates are allowed.");setSubmitted(null);return;
    }
    setError("");resetReview();
    setSubmitted({city,bedrooms,current:base,offer:asked,effective});
    if(typeof requestAnimationFrame==="function"){
      requestAnimationFrame(()=>output.current?.scrollIntoView?.({behavior:"smooth",block:"start"}));
    }
  }

  const row=market.cities[submitted?.city??city];
  const benchmark=submitted&&submitted.bedrooms!=="other"?row.apartmentListBedrooms[submitted.bedrooms].typicalRent:null;
  const finding=submitted?evaluateRenewal({
    city:submitted.city,currentRent:submitted.current,offeredRent:submitted.offer,
    effectiveDate:submitted.effective,stateCoverage,localCoverage,priorIncrease,noticeDate:noticeReceived,
  }):null;
  const assessment=submitted&&finding?assessMarketOffer(
    submitted.offer,benchmark,finding,noticeReceived!==""
  ):null;
  const rules=finding?.checks??[];
  const amountChange=submitted?submitted.offer-submitted.current:0;
  const months=Number(period);
  const marketLabel=submitted?.bedrooms==="1br"?"1-bedroom":submitted?.bedrooms==="2br"?"2-bedroom":"unsupported size";
  const benchmarkMonth=row.apartmentList.month;
  const stale=isStale(row.apartmentList.observationDate,new Date());
  const statusLabel=assessment?.legalScreen==="possible_issue"?"Potential concern: check details":
    assessment?.legalScreen==="needs_information"?"Coverage not confirmed":"No specific concern from entered facts";
  const hasLocalRule=rules.some(check=>check.rule.type==="city");
  const showLAComplaint = submitted?.city==="Los Angeles" && rules.some(check =>
    check.rule.id==="la-rso" && (check.abovePublishedStandard || localCoverage==="yes")
  );
  const caseRecord=submitted&&finding&&assessment?buildTenantCase({
    city:submitted.city,bedrooms:marketLabel,currentRent:submitted.current,offeredRent:submitted.offer,
    effectiveDate:submitted.effective,periodMonths:months,benchmark,benchmarkMonth,
    assessment,finding,legalStatus:statusLabel,stateCoverage,localCoverage,priorIncrease,noticeReceived,
    sourceUrl:RESEARCH_URL,supportUrl:finding.eligibilityUrl,
  }):null;

  return <div className="v4-app">
    <header className="v4-header">
      <div className="v4-container v4-nav">
        <strong className="v4-logo"><House size={28} strokeWidth={2.5} aria-hidden="true"/> MOVEUP</strong>
        <span>RENEWAL CHECK</span>
        <details className="v4-about"><summary>ABOUT US</summary><div className="v4-about-panel">
          <strong>MOVEUP TEAM</strong>
          <a href="https://www.linkedin.com/in/laila-archer-21a482448/" target="_blank" rel="noopener noreferrer">Laila Archer</a>
          <a href="https://www.linkedin.com/in/olivia-cook-863b51344/" target="_blank" rel="noopener noreferrer">Olivia Cook</a>
        </div></details>
      </div>
    </header>
    <main className="v4-container">
      <div className="v4-intro">
        <p className="v4-kicker">MOVEUP · RENEWAL CHECK</p>
        <h1>YOUR HOME.<br/>YOUR RENT.<br/>YOUR RIGHTS.</h1>
        <p>Understand your renewal, compare local rents, and prepare for tenant support.</p>
      </div>
      <section className="v4-card v4-intake" id="renewal-offer">
        <h2>Your offer</h2>
        <form noValidate onSubmit={submit} onKeyDown={e=>{
          if(e.key==="Enter" && !e.shiftKey && !e.nativeEvent.isComposing &&
            e.target instanceof HTMLInputElement && ["number","date"].includes(e.target.type)){
            e.preventDefault();
            e.currentTarget.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
          }
        }}>
          <div className="v4-fields">
            <label className="v4-field"><span>City</span><select aria-label="City" value={city} onChange={e=>{setCity(e.target.value as City);resetOnEdit();}}>
              {CITIES.map(c=><option key={c}>{c}</option>)}</select></label>
            <label className="v4-field"><span>Bedrooms</span><select aria-label="Bedrooms" value={bedrooms} onChange={e=>{setBedrooms(e.target.value as Bedroom);resetOnEdit();}}>
              <option value="1br">1 bedroom</option><option value="2br">2 bedrooms</option><option value="other">Other / studio / 3+ bedrooms</option>
            </select></label>
            <FormField label="Current rent / month" value={current} onChange={v=>{setCurrent(v);resetOnEdit();}}/>
            <FormField label="Offered rent / month" value={offer} onChange={v=>{setOffer(v);resetOnEdit();}}/>
            <label className="v4-field"><span>New rent takes effect</span><input aria-label="New rent takes effect" type="date" value={effective} onChange={e=>{setEffective(e.target.value);resetOnEdit();}}/><small className="v4-date-note">Past dates are okay too.</small></label>
          </div>
          <button type="submit" className="v4-launch">CHECK MY OFFER</button>
          <div className="v4-form-tools">
            <button type="button" className="v4-fill-example" onClick={loadExample}>Fill with example numbers</button>
            <button type="button" className="v4-clear-form" onClick={clear}>Clear form</button>
          </div>
          {example?<p className="v4-sample-badge">Example: Los Angeles, 2-bedroom, $2,400 to $2,650. Change any field to use your own information.</p>:null}
          {error?<p className="v4-form-error" role="alert">{error}</p>:null}
        </form>
      </section>
      {submitted&&finding&&assessment?<div className="v4-results" ref={output}>
        <section className={"v4-result v4-"+assessment.tone}>
          <span className="v4-result-eyebrow">YOUR RENEWAL</span>
          <h2>{assessment.headline}</h2>
          <div className="v4-result-main">{signedMoney(amountChange)} <small>/month vs current rent</small></div>
          <p>{amountChange===0?"No monthly rent change":signedMoney(amountChange*months)+" over "+months+" months at the offered rate"}</p>
          <p className="v4-result-explanation">{assessment.explanation}</p>
          {assessment.legalScreen==="possible_issue"?<p className="v4-small-legal-flag">A published protection may need review. This does not establish a violation.</p>:null}
        </section>
        <section className="v4-section v4-market" aria-label="Offer versus market benchmark">
          <div className="v4-heading"><h2>Offer vs market</h2><span>{submitted.city} · {marketLabel}</span></div>
          {benchmark===null?
            <div className="v4-card"><strong>Market benchmark not available</strong><p>Apartment List data in this demo only covers one- and two-bedroom estimates. We won't substitute a different unit size.</p></div>:
            <div className="v4-card v7-market-card">
              <div className="v7-market-header">
                <span className={"v7-market-status v7-market-status-"+assessment.marketPosition}>
                  {assessment.marketPosition==="above"?"Above city benchmark":assessment.marketPosition==="below"?"Below city benchmark":"At city benchmark"}
                </span>
                <span className="v7-market-dated">Apartment List · {benchmarkMonth}</span>
              </div>
              <div className="v4-market-stats">
                <div><span>Your offered monthly rent</span><strong>{money(submitted.offer)}</strong></div>
                <div><span>City {marketLabel} new-lease estimate</span><strong>{money(benchmark)}</strong></div>
              </div>
              <div className="v7-market-meter-panel">
                <div className={"v4-meter v4-meter-"+assessment.tone} role="img" aria-label={"Your offer "+money(submitted.offer)+"; "+marketLabel+" city benchmark "+money(benchmark)+"; difference "+signedMoney(assessment.difference??0)}>
                  <div className="v4-track">
                    <span className="v4-market-below" style={{width:(assessment.benchmarkPosition??0)+"%"}}/>
                    <span className="v4-market-above" style={{left:(assessment.benchmarkPosition??0)+"%"}}/>
                  </div>
                  <div className="v4-market-line" style={{left:(assessment.benchmarkPosition??0)+"%"}}><span>MARKET</span></div>
                  <div className="v4-offer-line" style={{left:(assessment.offerPosition??0)+"%"}}><span>YOUR OFFER</span></div>
                </div>
                <p className="v7-meter-explainer">The markers show where your renewal offer sits relative to the city's new-lease benchmark.</p>
              </div>
              <div className="v7-market-takeaway">
                <div><span>{assessment.marketPosition==="above"?"More than city benchmark each month":assessment.marketPosition==="below"?"Less than city benchmark each month":"Difference from city benchmark"}</span><strong>{signedMoney(assessment.difference??0)} / month</strong></div>
                <div className="v7-market-percent"><strong>{signedPct(assessment.differencePct??0)}</strong><span>vs city benchmark</span></div>
              </div>
              <p className="v7-market-summary">
                {assessment.marketPosition==="above"
                  ?"Your offered rent is higher than the citywide new-lease estimate for this bedroom count."
                  :assessment.marketPosition==="below"
                    ?"Your offered rent is lower than the citywide new-lease estimate for this bedroom count."
                    :"Your offered rent matches the available citywide new-lease estimate."}
              </p>
              <p className="v4-source">Apartment List · {benchmarkMonth} · City {marketLabel} new-lease estimate · <a href={RESEARCH_URL} target="_blank" rel="noopener noreferrer">Source</a></p>
              {stale?<p className="v4-stale">Market observation is older than 45 days. Confirm current availability before making a decision.</p>:null}
              <p className="v4-muted">City estimate, not a property appraisal. Price relative to market does not establish whether a renewal is lawful.</p>
            </div>}
        </section>
        {showLAComplaint?<aside className="v7-la-resource" aria-label="Official Los Angeles complaint resource">
          <div className="v7-la-resource-copy">
            <span className="v7-resource-kicker">OFFICIAL CITY OF LOS ANGELES RESOURCE</span>
            <h3>Concerned about an RSO violation?</h3>
            <p>The LA Housing Department explains how to file a complaint about a suspected Rent Stabilization Ordinance violation, including a possibly unlawful increase. Eligibility must be verified.</p>
            <p className="v7-resource-caution">This applies to housing in the City of Los Angeles. A market price difference does not prove a violation. MoveUp does not submit complaints.</p>
          </div>
          <a className="v7-resource-link" href={LA_COMPLAINT_URL} target="_blank" rel="noopener noreferrer">Open official LA complaint page <span aria-hidden="true">↗</span></a>
        </aside>:null}
        <section id="moveup-protections" className="v4-section v4-protections">
          <div className="v4-heading"><h2>Your protections</h2><span className="v4-legal-status">{statusLabel}</span></div>
          <p className="v4-section-intro">Explore published rent protections that may apply in {submitted.city}. Your building and rental history determine eligibility, so these are guides rather than a legal decision.</p>
          <div className="v6-protection-expanded">
          <p className="v4-section-intro">The rules below depend on your home and rental history. Choose what you know.</p>
          <div className="v4-law-grid">
            {rules.length===0?<div className="v4-card">No dated rule in our stored records for this date. Check official guidance.</div>:
              [...rules].sort((left,right)=>Number(right.rule.type==="city")-Number(left.rule.type==="city")).map(check=>{
                const selected=check.rule.type==="city"?localCoverage:stateCoverage;
                const change=finding.increasePercent;
                const isSecondary=hasLocalRule&&check.rule.type==="statewide";
                const card=<article className={"v4-law-card"+(isSecondary?" v4-law-card-secondary":"")} key={check.rule.id}>
                  <div className="v4-law-top"><span>{check.rule.type==="city"?"CITY PROTECTION":"STATE PROTECTION"}</span><span className="v4-law-shield" aria-hidden="true">✦</span></div>
                  <h3>{check.rule.id==="la-rso"?"Los Angeles rent stabilization":check.rule.id==="sf-rso"?"San Francisco rent control":check.rule.title}</h3>
                  <div className="v4-law-value"><strong>{check.rule.cap_pct}%</strong><span>published {check.rule.type==="city"?"standard adjustment":"rent limit"}</span></div>
                  <p>{check.abovePublishedStandard
                    ?"Your "+change.toFixed(2)+"% proposed increase exceeds this published standard if the rule applies."
                    :"Your "+change.toFixed(2)+"% proposed change is compared with this published standard; coverage and exceptions still matter."}</p>
                  <label className="v4-field"><span>{check.rule.type==="city"?"Does local rent control cover your home?":"Do state rent limits cover your home?"}</span>
                    <select aria-label={check.rule.type==="city"?"Local rent control coverage":"State rent protection coverage"} value={selected} onChange={e=>
                      check.rule.type==="city"?setLocalCoverage(e.target.value as Coverage):setStateCoverage(e.target.value as Coverage)}>
                      <option value="unknown">I'm not sure</option>
                      <option value="yes">I believe it's covered</option>
                      <option value="no">I believe it's exempt</option>
                    </select>
                  </label>
                  <details className="v4-law-details"><summary>Who qualifies and what are the exceptions?</summary>
                    <p>{check.rule.conditions}</p>
                    <p>Published for {check.rule.effective_from} to {check.rule.effective_to}. Prior increases and authorized adjustments may change the outcome.</p>
                  </details>
                  <a href={check.rule.source_url} target="_blank" rel="noopener noreferrer">Read official law guidance</a>
                </article>;
                return card;
              })}
          </div>
          {submitted.city==="Seattle"&&amountChange>0?<div className="v4-card v4-notice-card">
            <h3>Seattle · Written notice</h3>
            <p>Seattle generally requires at least 180 days' written notice for housing-cost increases. Exceptions and rules may vary.</p>
            <label className="v4-field"><span>When did you receive notice?</span><input aria-label="When did you receive written notice?" type="date" value={noticeReceived} onChange={e=>setNoticeReceived(e.target.value)}/></label>
            <a href="https://seattle.gov/construction-and-inspections/codes/common-code-questions/housing-cost-increases" target="_blank" rel="noopener noreferrer">Official Seattle notice guidance</a>
          </div>:null}
          {amountChange>0&&rules.length>0?<div className="v4-history-row">
            <label className="v4-field"><span>Other rent increases in the last 12 months?</span>
              <select aria-label="Other increases in the last 12 months?" value={priorIncrease} onChange={e=>setPriorIncrease(e.target.value as IncreaseHistory)}>
                <option value="unknown">I'm not sure</option><option value="none">No</option><option value="yes">Yes</option>
              </select></label>
            <p>Earlier increases may affect which rent limits apply.</p>
          </div>:null}
          <p className="v4-muted">Coverage and exceptions must be checked before any legal conclusion.</p>
          </div>
        </section>
        {caseRecord?<TenantIntakeDemo key={submitted.city+"-"+submitted.effective+"-"+submitted.offer} caseRecord={caseRecord}/>:null}
        <section className="v4-section v4-report" aria-label="Tenant support summary">
          <div className="v4-heading"><h2>Save your renewal summary</h2></div>
          <div className="v4-card">
            <div className="v4-report-title"><strong>MOVEUP / CASE SUMMARY</strong><span>{submitted.city} · {marketLabel} · starts {submitted.effective}</span></div>
            <div className="v4-summary-groups">
              <div className="v4-summary-group">
                <h3>Your offer</h3>
                <dl className="v4-report-grid">
                  <div><dt>Current monthly rent</dt><dd>{money(submitted.current)}</dd></div>
                  <div><dt>Proposed monthly rent</dt><dd>{money(submitted.offer)}</dd></div>
                  <div><dt>Change per month</dt><dd>{signedMoney(amountChange)}</dd></div>
                  <div><dt>{months}-month difference</dt><dd>{signedMoney(amountChange*months)}</dd></div>
                </dl>
              </div>
              <div className="v4-summary-group">
                <h3>Your assessment</h3>
                <dl className="v4-summary-list">
                  <div><dt>Market difference</dt><dd>{benchmark===null?"Unavailable":signedMoney(assessment.difference??0)+" ("+signedPct(assessment.differencePct??0)+")"}</dd></div>
                  <div><dt>Legal screening</dt><dd>{statusLabel}</dd></div>
                  {rules.some(r=>r.rule.type==="statewide")?<div><dt>State rent protection</dt><dd>{coverageLabel(stateCoverage)}</dd></div>:null}
                  {rules.some(r=>r.rule.type==="city")?<div><dt>Local rent control</dt><dd>{coverageLabel(localCoverage)}</dd></div>:null}
                  {amountChange>0?<div><dt>Prior increases</dt><dd>{increaseLabel(priorIncrease)}</dd></div>:null}
                  {submitted.city==="Seattle"&&amountChange>0?<div><dt>Notice received</dt><dd>{noticeReceived||"Not entered"}</dd></div>:null}
                </dl>
              </div>
              <div className="v4-summary-group">
                <h3>Next step</h3>
                <p>Choose negotiation, protection review or tenant support based on what you need. No violation is required to take action.</p>
              </div>
            </div>
            <details className="v4-report-details"><summary>Data, sources and legal qualifications</summary>
              <p>Apartment List · {benchmarkMonth} · city {marketLabel} new-lease benchmark: <a href={RESEARCH_URL} target="_blank" rel="noopener noreferrer">data source</a>. {stale?"Dataset is older than 45 days.":"Dataset is within 45 days."}</p>
              {rules.map(c=><p key={c.rule.id}>{c.rule.title}: {c.rule.cap_pct}% standard, {coverageLabel(c.coverage)}. <a href={c.rule.source_url} target="_blank" rel="noopener noreferrer">Official government source</a>.</p>)}
              <p>Eligibility is not independently verified.</p>
            </details>
            <p className="v4-muted">This summary is renter-prepared, not legal advice. Rent rules and eligibility still need verification.</p>
            <button type="button" className="v4-print-button" onClick={()=>{if(typeof window!=="undefined")window.print();}}>Print / Save as PDF</button>
          </div>
        </section>
      </div>:null}
      <section className="v6-network" id="moveup-network" aria-label="MoveUp renter support network">
        <div className="v6-network-intro">
          <span className="v6-eyebrow">RENTER SUPPORT AND COMMUNITY</span>
          <h2>Find support. Build connections.</h2>
          <p>Find independent organizations serving your city, then choose whether to contact them. MoveUp is building toward an opt-in network that can help renters connect with trusted support.</p>
        </div>
        <TenantOrganizationDirectory city={submitted?.city??city}/>
        <section className="v6-partner-story" aria-label="MoveUp for tenant organizations">
          <div className="v6-partner-copy">
            <span className="v6-eyebrow">FOR TENANT ORGANIZATIONS</span>
            <h2>Reach renters before a crisis.</h2>
            <p>Everyday rent questions can become opportunities for counseling, negotiation and collective action. MoveUp helps renters prepare those conversations instead of starting with a blank form.</p>
          </div>
          <div className="v6-partner-model">
            <div><strong>Free for renters</strong><span>Offer comparison, renter protections and practical next steps.</span></div>
            <div><strong>Designed for organizers</strong><span>Voluntary interest, structured case packets and future customizable intake.</span></div>
            <p>12 researched public organization examples in 4 launch cities. This is a curated sample, not a full market count, partnership claim or paying customer total.</p>
          </div>
        </section>
      </section>
    </main>
    <footer className="v4-container v4-footer">MOVEUP · EDUCATIONAL RENTAL AGREEMENT REVIEW</footer>
  </div>;
}
