import { useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import cities from "@/data/cities.json";
import { combineSignals, type CityData, type CombineResult, type Direction } from "@/lib/combineSignals";
import { SIGNAL_A, SIGNAL_B } from "@/lib/config";
import { fetchSignal, type SignalResult } from "@/lib/signalClient";
import { fetchCityMarketFn, type MarketResponse } from "@/lib/cityMarket.functions";
import { assessCity, type LocalAssessment } from "@/lib/localDecision";
import { policiesFor } from "@/lib/policyIndicators";

const cityList = cities as CityData[];
type Analysis = { a: SignalResult; b: SignalResult; result: CombineResult; market:MarketResponse;local:LocalAssessment };
const usd = new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"});
function Tag({ direction }: {direction:Direction}) {
  return <span className={"pill direction " + direction.toLowerCase()}>{direction}</span>;
}
function SignalCard({label,signal,direction,loading,index}:{
  label:string;signal?:SignalResult|undefined;direction?:Direction|undefined;loading:boolean;index:string;
}) {
  return <div className="signal">
    <div className="micro signal-id">{index} / "SIGNAL"</div>
    <div className="signal-label">{label}</div>
    <div className="number">{loading?"…":signal?signal.probability.toFixed(2)+"%":"—"}</div>
    <div className="signal-tags">
      {direction?<Tag direction={direction}/>:<span className="pill muted">PENDING</span>}
      {signal?<span className={"pill source "+signal.source}>{signal.source==="live"?"LIVE":"ESTIMATE"}</span>:null}
    </div>
    <div className="tiny">{loading?"Retrieving market data…":signal?signal.question:"Press Analyze to check market availability."}</div>
  </div>;
}
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MoveUp — Buy a home now or wait?" },
      { name: "description", content: "MoveUp combines live prediction-market odds on Fed cuts and mortgage rates with city cost scenarios for homebuyers." },
      { property: "og:title", content: "MoveUp — Buy a home now or wait?" },
      { property: "og:description", content: "Market-implied rate signals plus a full monthly cost scenario for your city." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

function App(){
  const [selectedCity,setSelectedCity]=useState("Los Angeles, CA");
  const [loan,setLoan]=useState("400000");
  const [timeline,setTimeline]=useState("6");
  const [loading,setLoading]=useState(false);
  const [analysis,setAnalysis]=useState<Analysis|null>(null);
  const [error,setError]=useState("");
  const requestId=useRef(0);
  const city=cityList.find(c=>c.city+", "+c.state===selectedCity)??cityList[0];
  const loanValue=Number(loan);
  const validLoan=loan.trim()!==""&&Number.isFinite(loanValue)&&loanValue>0;
  function invalidate(){
    requestId.current++;
    setLoading(false);
    setAnalysis(null);
    setError("");
  }
  async function analyze(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!validLoan){setError("Enter a valid loan amount greater than $0.");return;}
    const id=++requestId.current;
    setError("");setLoading(true);setAnalysis(null);
    const [a,b,market]=await Promise.all([
      fetchSignal(SIGNAL_A),fetchSignal(SIGNAL_B),
      fetchCityMarketFn({data:{city:city.city,state:city.state}})
        .catch(():MarketResponse=>({status:"unavailable",reason:"Local data unavailable"})),
    ]);
    if(id!==requestId.current)return;
    try{
      const result=combineSignals({
        signal_a_probability:a.probability,signal_b_probability:b.probability,
        signal_a_estimate:a.source==="estimate",signal_b_estimate:b.source==="estimate",
        timeline_months:Number(timeline),loan_amount:loanValue,city_data:city,
      });
      const history = market.status==="available" ? {
        ...market.history,
        forecast:market.forecast,
      } : null;
      const local=assessCity({
        city,market:history,timeline:Number(timeline),
        fed:result.signal_a_direction,mortgage:result.signal_b_direction,
      });
      setAnalysis({a,b,result,market,local});
    } catch {setError("Unable to calculate this scenario. Check the inputs.");}
    finally{setLoading(false);}
  }
  const r=analysis?.result;
  const local=analysis?.local;
  const policy=policiesFor(city.state);
  const market=analysis?.market;
  const historical=market?.status==="available"?market.history:null;
  const forecast=market?.status==="available"?market.forecast:null;
  const pct=(n:number|null|undefined)=>n==null?"Unavailable":(n>0?"+":"")+n.toFixed(2)+"%";

  const costs=[
    ["Mortgage now",r?.current_mortgage],
    ["Mortgage after hypothetical cut",r?.mortgage_after_cut],
    ["Monthly savings",r?.monthly_savings],
    ["Property tax / month",r?.property_tax_monthly],
    ["Insurance / month",r?.insurance_monthly],
    ["Total monthly now",r?.total_monthly_now],
  ] as const;
  const sourceNotice=analysis
    ? (analysis.a.source==="live"||analysis.b.source==="live"
      ? "Both national signals use U.S.-wide market contracts; only the city research and tax context vary by location. Verify each contract question."
      : "No verified live market was returned. Both signals use neutral 50% estimates, not actual market odds.")
    : "Analyze to request current market-implied odds. Unavailable markets display neutral estimates, never fabricated live data.";
  return <>
    <header>
      <div className="brand">MOVE<span>UP</span><sup>↗</sup></div>
      <div className="topright">INDEPENDENT MARKET STUDY / 001</div>
    </header>
    <main className="shell">
      <div className="eyebrow">MOVEUP™ / MARKET TIMING LAB</div>
      <h1>Should you buy a home <em>now or wait?</em></h1>
      <p className="lede">Explore how market expectations and mortgage costs could affect your timing. Transparent signals, clear scenarios, and no crystal ball.</p>
      <div className="layout">
        <section className="panel" aria-labelledby="scenario-heading">
          <h2 id="scenario-heading">01 / Set your scenario</h2>
          <p className="sub">Adjust your assumptions to see how market signals affect your result.</p>
          <form onSubmit={analyze}>
            <div className="field"><label htmlFor="city">City</label>
              <select id="city" value={selectedCity} onChange={e=>{invalidate();setSelectedCity(e.target.value);}}>
                {cityList.map(c=><option key={c.city} value={c.city+", "+c.state}>{c.city}, {c.state}</option>)}
              </select><div className="help">City-level tax and insurance figures are illustrative.</div></div>
            <div className="field"><label htmlFor="loan">Loan amount (USD)</label>
              <input id="loan" inputMode="decimal" type="number" min="0.01" step="any"
                value={loan} onChange={e=>{invalidate();setLoan(e.target.value);}} required/></div>
            <div className="field"><label htmlFor="timeline">Buying timeline</label>
              <select id="timeline" value={timeline} onChange={e=>{invalidate();setTimeline(e.target.value);}}>
                <option value="1">Within 1 month</option><option value="3">Within 3 months</option>
                <option value="6">Within 6 months</option>
              </select></div>
            <button className="primary" type="submit" disabled={!validLoan||loading}>
              {loading?"ANALYZING…":"ANALYZE MARKET TIMING ↗"}
            </button>
            <div className="error" role="alert">{error}</div>
          </form>
          <p className="tiny assumption">30-year fixed mortgage / 6.80% assumed APR / hypothetical 0.25 percentage-point decrease.</p>
        </section>
        <div className="results">
          <div className="notice"><strong>{loading?"REQUESTING DATA":analysis?"DATA STATUS":"MARKET DATA"}</strong> — {sourceNotice}</div>
          <div className="signalgrid">
            <SignalCard label={SIGNAL_A.name} signal={analysis?.a} direction={r?.signal_a_direction} loading={loading} index="A"/>
            <SignalCard label={SIGNAL_B.name} signal={analysis?.b} direction={r?.signal_b_direction} loading={loading} index="B"/>
          </div>
          <section className="verdict" aria-live="polite">
            <div className="verdict-body">
              <div className="micro">02 / LOCAL-FIRST MARKET CLASSIFICATION</div>
              <div className="big">{loading?"…":local?local.verdict:"—"}</div>
              <div className="desc">{loading?"Waiting for both independent signals…":local?(local.available?local.reason:"Local research could not be verified, so no city-specific BUY or WAIT verdict is shown."):"No classification until you analyze."}</div>
              <p className="micro rate-note">Fed cuts may already be priced into mortgage rates. After-cut figures are hypothetical.</p>
            </div>
            <div className="stamp">2 MARKET<br/>SIGNALS<br/><strong>{local?(local.available?"LOCAL 45%":"NO LOCAL DATA"):"PENDING"}</strong></div>
          </section>
          <section className="local-insights" aria-labelledby="local-insights-title">
            <div className="sectionhead">
              <h2 id="local-insights-title">03 / {city.city} housing outlook</h2>
              <span>Independent city research</span>
            </div>
            <p className="local-note">Unlike national rate contracts, these historical observations and policy rules change by location. Historical changes are not forecasts.</p>
            <div className="market-metrics">
              <div><span>Typical home value (ZHVI)</span><strong>{loading?"…":historical?usd.format(historical.typicalHomeValue):"Unavailable"}</strong></div>
              <div><span>1-year value change</span><strong>{loading?"…":pct(historical?.yearOverYearPct)}</strong></div>
              <div><span>3-month value change</span><strong>{loading?"…":pct(historical?.lastThreeMonthsPct)}</strong></div>
            </div>
            <p className="source-line">{historical?<>Source: <a href="https://www.zillow.com/research/data/" target="_blank" rel="noopener noreferrer">Zillow Research ZHVI</a> · {historical.month} · City-level home-value index</>:"City-level research data has not been verified for this selection."}</p>
            <div className="local-forecast">
              <strong>PUBLISHED CITY FORECAST</strong>
              <span>{loading?"Checking…":forecast?pct(forecast.yearAheadPct)+" forecast to "+forecast.targetMonth:"Not available as verified city-level data"}</span>
              {forecast?<small>Source: Zillow Research ZHVF · As of {forecast.asOf} · Forecast is not a guarantee</small>:null}
            </div>
            <div className="policy">
              <h3>04 / State and local policy context</h3>
              <p className="local-note">Official rules may affect costs or eligibility, but exemptions are <strong>not automatically applied</strong> to this scenario.</p>
              {policy.map(p=><article key={p.id} className="policy-entry">
                <strong>{p.title}</strong><p>{p.detail}</p><p>{p.applicability}</p>
                <a href={p.officialUrl} target="_blank" rel="noopener noreferrer">Government source · reviewed {p.lastReviewed}</a>
              </article>)}
            </div>
            <div className="weights">
              <strong>Experimental score / model weights</strong>
              <div><span>City historical price momentum</span><b>45%</b></div>
              <div><span>City tax-cost policy proxy (illustrative)</span><b>35%</b></div>
              <div><span>National market-implied odds</span><b>20%</b></div>
              <p>Score: {local?.score==null?"Not available":local.score.toFixed(3)}. This is an uncalibrated research heuristic, not a validated predictor or a verified policy-effect estimate. The local tax proxy uses illustrative city assumptions and does not assume exemption eligibility.</p>
            </div>
          </section>
          <section className="breakdown">
            <div className="sectionhead"><h2>05 / Monthly cost scenario</h2><span>Illustrative estimates</span></div>
            <div className="moneygrid">{costs.map(([label,value])=>
              <div className="moneyitem" key={label}>
                <div className="name">{label}</div>
                <div className="value">{r&&!loading&&value!==undefined?usd.format(value):"—"}</div>
              </div>
            )}</div>
          </section>
          <section className="summary" aria-live="polite">{!loading&&r?<>National signal context: {r.summary} {local?.available?" Local-first verdict: "+local.verdict+".":" Local verdict withheld because city-level history is unavailable."}</>:"Run an analysis to see the signal explanation."}</section>
        </div>
      </div>
      <footer><span>MOVEUP / EDUCATIONAL PROTOTYPE / NO PROPERTY LISTINGS</span>
        <span>PROBABILITIES ARE MARKET-IMPLIED, NOT FORECASTS. MODEL OUTPUT IS NOT FINANCIAL ADVICE.</span></footer>
    </main>
  </>;
}
