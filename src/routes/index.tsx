import { useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import cities from "@/data/cities.json";
import { combineSignals, type CityData, type CombineResult, type Direction } from "@/lib/combineSignals";
import { SIGNAL_A, SIGNAL_B } from "@/lib/config";
import { fetchSignal, type SignalResult } from "@/lib/signalClient";

const cityList = cities as CityData[];
type Analysis = { a: SignalResult; b: SignalResult; result: CombineResult };
const usd = new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"});
const verdictText: Record<string,string> = {
  BUY: "A rules-based BUY classification; it does not predict actual mortgage rates or property prices.",
  WAIT: "A rules-based WAIT classification; future financing rates and market outcomes are uncertain.",
  MIXED: "The signals conflict or show no clear directional edge under these prototype rules.",
};
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
    const [a,b]=await Promise.all([fetchSignal(SIGNAL_A),fetchSignal(SIGNAL_B)]);
    if(id!==requestId.current)return;
    try{
      const result=combineSignals({
        signal_a_probability:a.probability,signal_b_probability:b.probability,
        signal_a_estimate:a.source==="estimate",signal_b_estimate:b.source==="estimate",
        timeline_months:Number(timeline),loan_amount:loanValue,city_data:city,
      });
      setAnalysis({a,b,result});
    } catch {setError("Unable to calculate this scenario. Check the inputs.");}
    finally{setLoading(false);}
  }
  const r=analysis?.result;
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
      ? "Market-implied odds are displayed only for matched active contracts. Check the exact question printed on each card."
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
              <div className="micro">02 / MARKET TIMING CLASSIFICATION</div>
              <div className="big">{loading?"…":r?r.verdict:"—"}</div>
              <div className="desc">{loading?"Waiting for both independent signals…":r?verdictText[r.verdict]:"No classification until you analyze."}</div>
              <p className="micro rate-note">Fed cuts may already be priced into mortgage rates. After-cut figures are hypothetical.</p>
            </div>
            <div className="stamp">2 MARKET<br/>SIGNALS<br/><strong>{r?r.signal_agreement.toUpperCase().replace("_"," "):"PENDING"}</strong></div>
          </section>
          <section className="breakdown">
            <div className="sectionhead"><h2>03 / Monthly cost scenario</h2><span>Illustrative estimates</span></div>
            <div className="moneygrid">{costs.map(([label,value])=>
              <div className="moneyitem" key={label}>
                <div className="name">{label}</div>
                <div className="value">{r&&!loading&&value!==undefined?usd.format(value):"—"}</div>
              </div>
            )}</div>
          </section>
          <section className="summary" aria-live="polite">{!loading&&r?r.summary:"Run an analysis to see the signal explanation."}</section>
        </div>
      </div>
      <footer><span>MOVEUP / EDUCATIONAL PROTOTYPE / NO PROPERTY LISTINGS</span>
        <span>PROBABILITIES ARE MARKET-IMPLIED, NOT FORECASTS. MODEL OUTPUT IS NOT FINANCIAL ADVICE.</span></footer>
    </main>
  </>;
}
