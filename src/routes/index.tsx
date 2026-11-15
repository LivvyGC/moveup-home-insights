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
    <div className="signal-label">{label}</div>
    <div className="number">{loading?"…":signal?signal.probability.toFixed(2)+"%":"—"}</div>
    <div className="signal-tags">
      {direction?<Tag direction={direction}/>:<span className="pill muted">PENDING</span>}
      {signal?<span className={"pill source "+signal.source}>{signal.source==="live"?"LIVE":"ESTIMATE"}</span>:null}
    </div>
    {signal&&!loading?<div className="signal-q">{signal.question}</div>:null}
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
  const city=cityList.find(c=>c.city+", "+c.state===selectedCity)??(cityList[0] as CityData);
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
    ["After 0.25-pt cut",r?.mortgage_after_cut],
    ["Savings",r?.monthly_savings],
    ["Property tax",r?.property_tax_monthly],
    ["Insurance",r?.insurance_monthly],
    ["Total now",r?.total_monthly_now],
  ] as const;
  const anyEstimate=analysis&&(analysis.a.source==="estimate"||analysis.b.source==="estimate");
  const show=(v:string)=>loading?"…":analysis?v:"—";
  return <>
    <header>
      <div className="brand">MOVE<span>UP</span><sup>↗</sup></div>
    </header>
    <main className="shell">
      <h1>Buy a home <em>now or wait?</em></h1>
      <p className="lede">Rate-market odds, your city's price trend and your monthly cost.</p>
      <div className="layout">
        <section className="panel" aria-labelledby="scenario-heading">
          <h2 id="scenario-heading">01 / Your scenario</h2>
          <form onSubmit={analyze}>
            <div className="field"><label htmlFor="city">City</label>
              <select id="city" value={selectedCity} onChange={e=>{invalidate();setSelectedCity(e.target.value);}}>
                {cityList.map(c=><option key={c.city} value={c.city+", "+c.state}>{c.city}, {c.state}</option>)}
              </select></div>
            <div className="field"><label htmlFor="loan">Loan amount (USD)</label>
              <input id="loan" inputMode="decimal" type="number" min="0.01" step="any"
                value={loan} onChange={e=>{invalidate();setLoan(e.target.value);}} required/></div>
            <div className="field"><label htmlFor="timeline">Buying within</label>
              <select id="timeline" value={timeline} onChange={e=>{invalidate();setTimeline(e.target.value);}}>
                <option value="1">1 month</option><option value="3">3 months</option>
                <option value="6">6 months</option>
              </select></div>
            <button className="primary" type="submit" disabled={!validLoan||loading}>
              {loading?"ANALYZING…":"ANALYZE ↗"}
            </button>
            <div className="error" role="alert">{error}</div>
          </form>
        </section>
        <div className="results">
          {anyEstimate?<div className="notice"><strong>ESTIMATE</strong> — No live market matched. Shown as 50%, not real odds.</div>:null}
          <div className="signalgrid">
            <SignalCard label={SIGNAL_A.name} signal={analysis?.a} direction={r?.signal_a_direction} loading={loading} index="A"/>
            <SignalCard label={SIGNAL_B.name} signal={analysis?.b} direction={r?.signal_b_direction} loading={loading} index="B"/>
          </div>
          <section className="verdict" aria-live="polite">
            <div className="verdict-body">
              <div className="micro">02 / VERDICT</div>
              <div className="big">{loading?"…":local?local.verdict:"—"}</div>
              {local&&!loading?<div className="desc">{local.available?"Experimental score. Not a forecast.":"No city data, so no verdict."}</div>:null}
            </div>
          </section>
          <section className="local-insights" aria-labelledby="local-insights-title">
            <div className="sectionhead">
              <h2 id="local-insights-title">03 / {city.city} market</h2>
            </div>
            <div className="market-metrics">
              <div><span>Typical home value</span><strong>{show(historical?usd.format(historical.typicalHomeValue):"Unavailable")}</strong></div>
              <div><span>1-year change</span><strong>{show(pct(historical?.yearOverYearPct))}</strong></div>
              <div><span>3-month change</span><strong>{show(pct(historical?.lastThreeMonthsPct))}</strong></div>
            </div>
            {historical?<p className="source-line"><a href="https://www.zillow.com/research/data/" target="_blank" rel="noopener noreferrer">Zillow ZHVI</a> · {historical.month}</p>:null}
            <div className="local-forecast">
              <strong>CITY FORECAST</strong>
              <span>{loading?"…":forecast?pct(forecast.yearAheadPct)+" by "+forecast.targetMonth:"Not available as verified city-level data"}</span>
            </div>
            <div className="policy">
              <h3>04 / {city.state} policy</h3>
              {policy.map(p=><article key={p.id} className="policy-entry">
                <strong>{p.title}</strong><p>{p.detail}</p>
                <a href={p.officialUrl} target="_blank" rel="noopener noreferrer">Official source</a>
              </article>)}
              <p className="local-note">Eligibility varies. Not applied to your costs.</p>
            </div>
            <div className="weights">
              <div><span>City price trend</span><b>45%</b></div>
              <div><span>Tax cost</span><b>35%</b></div>
              <div><span>National odds</span><b>20%</b></div>
              <div><span>Score</span><b>{local?.score==null?"—":local.score.toFixed(2)}</b></div>
            </div>
          </section>
          <section className="breakdown">
            <div className="sectionhead"><h2>05 / Monthly cost</h2><span>30-yr fixed · 6.80% · 20% down</span></div>
            <div className="moneygrid">{costs.map(([label,value])=>
              <div className="moneyitem" key={label}>
                <div className="name">{label}</div>
                <div className="value">{r&&!loading&&value!==undefined?usd.format(value):"—"}</div>
              </div>
            )}</div>
          </section>
        </div>
      </div>
      <footer><span>EDUCATIONAL PROTOTYPE · NOT FINANCIAL ADVICE · NO LISTINGS</span></footer>
    </main>
  </>;
}
