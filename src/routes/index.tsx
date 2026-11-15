import { useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import market from "@/data/rentMarket.snapshot.json";
import type { City } from "@/lib/renewalPolicy";
import { evaluateRenewal, negotiationMessage, type Coverage, type IncreaseHistory } from "@/lib/renewalActions";
import { assessMarketOffer } from "@/lib/renewalV4";
import { isStale } from "@/lib/renewalCalculator";

const CITIES: City[] = ["Los Angeles", "San Francisco", "San Diego", "Seattle"];
type Bedroom = "1br" | "2br" | "other";
const MONEY = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:2 });
const money = (v:number) => MONEY.format(v);
const signedMoney = (v:number) => (v>0?"+":"") + money(v);
const signedPct = (v:number) => (v>0?"+":"") + v.toFixed(2) + "%";
const parseMoney = (s:string) => s.trim() && Number.isFinite(Number(s)) && Number(s)>0 ? Number(s) : null;
const RESEARCH_URL = "https://www.apartmentlist.com/research/category/data-rent-estimates";
const FormField = ({label,value,onChange}:{label:string;value:string;onChange:(next:string)=>void}) =>
  <label className="v4-field"><span>{label}</span><input aria-label={label} type="number" inputMode="decimal" step="0.01" min="0.01" value={value} onChange={e=>onChange(e.target.value)} placeholder="Monthly USD"/></label>;

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    {title:"MoveUp — Check Your Rent Offer"},
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
  const [showRequest,setShowRequest] = useState(false);
  const output = useRef<HTMLDivElement|null>(null);

  const resetReview=()=>{
    setStateCoverage("unknown");setLocalCoverage("unknown");setPriorIncrease("unknown");
    setNoticeReceived("");setPeriod("12");setShowRequest(false);
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
    const today=new Date();today.setHours(0,0,0,0);
    if(base===null||asked===null){setError("Enter your current rent and the offered rent.");setSubmitted(null);return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(effective)||!Number.isFinite(d.getTime())||d<today){
      setError("Enter a valid future effective date.");setSubmitted(null);return;
    }
    setError("");resetReview();
    setSubmitted({city,bedrooms,current:base,offer:asked,effective});
    if(typeof requestAnimationFrame==="function"){
      requestAnimationFrame(()=>output.current?.scrollIntoView?.({behavior:"smooth",block:"start"}));
    }
  }

  const row=market.cities[submitted?.city??city];
  const benchmark=submitted?.bedrooms==="other"?null:
    submitted?row.apartmentListBedrooms[submitted.bedrooms].typicalRent:null;
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
  const statusLabel=assessment?.legalScreen==="possible_issue"?"Potential issue — verify":
    assessment?.legalScreen==="needs_information"?"Eligibility unknown":"No specific issue identified";
  const followUp=rules.length>0||submitted?.city==="Seattle";
  const supportAction=finding?.action==="check_rent_limits"||finding?.action==="review_notice";
  const legalLink= finding?.actionUrl??"";
  const legalLabel= finding?.actionName??"";

  return <div className="v4-app">
    <header className="v4-header">
      <div className="v4-container v4-nav">
        <strong className="v4-logo">MOVEUP</strong>
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
        <p className="v4-kicker">RENEWAL CHECK</p>
        <h1>CHECK YOUR<br/>RENT OFFER.</h1>
        <p>Compare your renewal with local rents. Check your protections. Know what to do next.</p>
      </div>
      <div className="v4-toolbar">
        <button type="button" onClick={loadExample}>Load example</button>
        <button type="button" className="v4-text-button" onClick={clear}>Clear</button>
      </div>
      {example?<div className="v4-example">EXAMPLE INPUTS — For demonstration, not a real renewal.</div>:null}
      <section className="v4-card v4-intake">
        <h2>Your offer</h2>
        <form noValidate onSubmit={submit}>
          <div className="v4-fields">
            <label className="v4-field"><span>City</span><select aria-label="City" value={city} onChange={e=>{setCity(e.target.value as City);resetOnEdit();}}>
              {CITIES.map(c=><option key={c}>{c}</option>)}</select></label>
            <label className="v4-field"><span>Bedrooms</span><select aria-label="Bedrooms" value={bedrooms} onChange={e=>{setBedrooms(e.target.value as Bedroom);resetOnEdit();}}>
              <option value="1br">1 bedroom</option><option value="2br">2 bedrooms</option><option value="other">Other / studio / 3+ bedrooms</option>
            </select></label>
            <FormField label="Current rent / month" value={current} onChange={v=>{setCurrent(v);resetOnEdit();}}/>
            <FormField label="Offered rent / month" value={offer} onChange={v=>{setOffer(v);resetOnEdit();}}/>
            <label className="v4-field"><span>New rent takes effect</span><input aria-label="New rent takes effect" type="date" value={effective} onChange={e=>{setEffective(e.target.value);resetOnEdit();}}/></label>
          </div>
          <button type="submit" className="v4-launch">CHECK MY OFFER</button>
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
        </section>
        <section className="v4-section v4-market" aria-label="Offer versus market benchmark">
          <div className="v4-heading"><h2>Offer vs market</h2><span>{submitted.city} · {marketLabel}</span></div>
          {benchmark===null?
            <div className="v4-card"><strong>Market benchmark not available</strong><p>Apartment List data in this demo only covers one- and two-bedroom estimates. We won't substitute a different unit size.</p></div>:
            <div className="v4-card">
              <div className="v4-market-stats">
                <div><span>Your offer</span><strong>{money(submitted.offer)}</strong></div>
                <div><span>New-lease benchmark</span><strong>{money(benchmark)}</strong></div>
              </div>
              <div className="v4-meter" role="img" aria-label={"Your offer "+money(submitted.offer)+"; "+marketLabel+" city benchmark "+money(benchmark)+"; difference "+signedMoney(assessment.difference??0)}>
                <div className="v4-track"></div>
                <div className="v4-market-line" style={{left:(assessment.benchmarkPosition??0)+"%"}}><span>MARKET</span></div>
                <div className="v4-offer-line" style={{left:(assessment.offerPosition??0)+"%"}}><span>YOUR OFFER</span></div>
              </div>
              <div className="v4-comparison"><strong>{signedMoney(assessment.difference??0)} / month</strong><span>{signedPct(assessment.differencePct??0)} vs market benchmark</span></div>
              <p className="v4-source">Apartment List · {benchmarkMonth} · City {marketLabel} new-lease estimate · <a href={RESEARCH_URL} target="_blank" rel="noopener noreferrer">Source</a></p>
              {stale?<p className="v4-stale">Market observation is older than 45 days. Confirm current availability before making a decision.</p>:null}
              <p className="v4-muted">City estimate, not a property appraisal. Price relative to market does not establish whether a renewal is lawful.</p>
            </div>}
        </section>
        <section className="v4-section">
          <div className="v4-heading"><h2>Your protections</h2><span className="v4-legal-status">{statusLabel}</span></div>
          <div className="v4-card">
            {rules.length===0?<p>No effective rent-limit record is available for this date. Check current official guidance.</p>:
              <div className="v4-rule-list">
                {rules.map(c=><div className="v4-rule" key={c.rule.id}>
                  <div className="v4-rule-title"><strong>{c.rule.title}</strong><span>{c.coverage==="no"?"Reported exempt":c.coverage==="yes"?"Reported covered":"Coverage unknown"}</span></div>
                  <p>Published standard: {c.rule.cap_pct}% · {c.rule.effective_from}–{c.rule.effective_to}</p>
                  {c.abovePublishedStandard?<p className="v4-rule-alert">Your offer exceeds this published standard if the rule applies. This is not a finding of illegality.</p>:null}
                  <a href={c.rule.source_url} target="_blank" rel="noopener noreferrer">Official policy source</a>
                </div>)}
              </div>}
            {followUp&&<div className="v4-followups">
              <p className="v4-followup-title">Check the details that may change your result</p>
              {rules.some(c=>c.rule.type==="statewide")&&<label className="v4-field"><span>State rent protection coverage</span><select aria-label="State rent protection coverage" value={stateCoverage} onChange={e=>setStateCoverage(e.target.value as Coverage)}>
                <option value="unknown">Not sure</option><option value="yes">Likely covered — I checked</option><option value="no">Reported exempt — I checked</option>
              </select></label>}
              {rules.some(c=>c.rule.type==="city")&&<label className="v4-field"><span>Local rent control coverage</span><select aria-label="Local rent control coverage" value={localCoverage} onChange={e=>setLocalCoverage(e.target.value as Coverage)}>
                <option value="unknown">Not sure</option><option value="yes">Likely covered — I checked</option><option value="no">Reported not covered — I checked</option>
              </select></label>}
              {finding.potentialStandardConcern&&<label className="v4-field"><span>Other increases in the last 12 months?</span><select aria-label="Other increases in the last 12 months?" value={priorIncrease} onChange={e=>setPriorIncrease(e.target.value as IncreaseHistory)}>
                <option value="unknown">Not sure</option><option value="none">No</option><option value="yes">Yes</option>
              </select></label>}
              {submitted.city==="Seattle"&&amountChange>0&&<label className="v4-field"><span>When did you receive written notice?</span><input aria-label="When did you receive written notice?" type="date" value={noticeReceived} onChange={e=>setNoticeReceived(e.target.value)}/></label>}
            </div>}
            <p className="v4-muted">Coverage, prior increases, exemptions and authorized adjustments can change legal outcomes. This screening is educational information, not legal advice.</p>
          </div>
        </section>
        <section className="v4-section">
          <div className="v4-heading"><h2>Your next step</h2></div>
          <div className="v4-card v4-action">
            <strong>{finding.heading}</strong>
            <p>{finding.explanation}</p>
            {supportAction?<p className="v4-alert">A potential rule concern needs verification. High rent alone is not a legal violation.</p>:null}
            <a className="v4-primary-link" href={supportAction?legalLink:finding.eligibilityUrl} target="_blank" rel="noopener noreferrer">
              {supportAction?legalLabel:"Check official eligibility information"}
            </a>
            <details className="v4-request" open={showRequest} onToggle={e=>setShowRequest(e.currentTarget.open)}>
              <summary>Prepare a request to your landlord</summary>
              <textarea aria-label="Draft landlord request" readOnly rows={8} value={negotiationMessage(submitted.city,submitted.current,submitted.offer)} />
              <button type="button" onClick={()=>{if(typeof navigator!=="undefined"&&navigator.clipboard?.writeText) void navigator.clipboard.writeText(negotiationMessage(submitted.city,submitted.current,submitted.offer));}}>Copy request</button>
            </details>
          </div>
        </section>
        <section className="v4-section v4-report" aria-label="Tenant support summary">
          <div className="v4-heading"><h2>Renewal summary</h2></div>
          <div className="v4-card">
            <h3>MOVEUP / TENANT SUPPORT SUMMARY</h3>
            <p><strong>{submitted.city} · {marketLabel}</strong> · New rate effective {submitted.effective}</p>
            <dl className="v4-report-grid">
              <div><dt>Current rent</dt><dd>{money(submitted.current)}</dd></div>
              <div><dt>Renewal offer</dt><dd>{money(submitted.offer)}</dd></div>
              <div><dt>Monthly change</dt><dd>{signedMoney(amountChange)}</dd></div>
              <div><dt>{months}-month change</dt><dd>{signedMoney(amountChange*months)}</dd></div>
              <div><dt>Market comparison</dt><dd>{benchmark===null?"Not available":signedMoney(assessment.difference??0)+" ("+signedPct(assessment.differencePct??0)+")"}</dd></div>
              <div><dt>Legal screening</dt><dd>{statusLabel}</dd></div>
            </dl>
            <p className="v4-report-provenance">Market: Apartment List, {benchmarkMonth}, {marketLabel}; <a href={RESEARCH_URL}>source</a>. Data age {stale?"over 45 days":"within 45 days"} as of {new Date().toISOString().slice(0,10)}.</p>
            {rules.map(c=><p key={c.rule.id} className="v4-report-provenance">{c.rule.title}: {c.rule.cap_pct}% standard ({c.coverage==="unknown"?"coverage unknown":c.coverage==="yes"?"self-reported covered":"self-reported exempt"}). <a href={c.rule.source_url}>Official source</a>, verified {c.rule.last_verified_at}.</p>)}
            <p><strong>Next action:</strong> {finding.heading}. <a href={supportAction?legalLink:finding.eligibilityUrl}>Official guidance</a>.</p>
            <p className="v4-muted">No rent-law outcome is certified. No lease document has been reviewed. This summary is educational and can be taken to a tenant support organization. No account or payment required.</p>
            <button type="button" className="v4-print-button" onClick={()=>{if(typeof window!=="undefined")window.print();}}>Print / Save as PDF</button>
          </div>
        </section>
      </div>:null}
    </main>
    <footer className="v4-container v4-footer">MOVEUP · EDUCATIONAL RENTAL AGREEMENT REVIEW</footer>
  </div>;
}
