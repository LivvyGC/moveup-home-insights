import { useState, type FormEvent } from "react";
import {
  type TenantCaseRecord, coverageLabel, increaseLabel,
  currency, signedCurrency,
} from "../lib/tenantCase";

type Evidence = "renewal" | "lease" | "prior";
type Concern = "increase" | "notice" | "clarification";
type DeliveryState = "idle" | "sending" | "success" | "error";

const evidenceNames: Record<Evidence,string> = {
  renewal:"Written renewal offer / increase notice",
  lease:"Current lease or rental agreement",
  prior:"Previous rent increase notices (if any)",
};
const concernNames: Record<Concern,string> = {
  increase:"Review a proposed rent increase",
  notice:"Question about a notice or deadline",
  clarification:"Ask for help understanding the offer",
};
const FORM_ENDPOINT = (import.meta.env.VITE_MOVEUP_INTAKE_ENDPOINT ?? "").trim();
export const intakeEndpointConfigured = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(FORM_ENDPOINT);

export function composeTenantPacket(
  input:TenantCaseRecord, concern:Concern, available:Evidence[], details:string,
):string {
  const missing=(Object.keys(evidenceNames) as Evidence[]).filter(k=>!available.includes(k));
  return [
    "MOVEUP — RENTER-PREPARED TENANT INTAKE",
    "Not a legal finding; not a formal complaint.",
    "",
    "Reason for support: "+concernNames[concern],
    "City: "+input.city+" | Unit: "+input.bedrooms,
    "Renewal effective: "+input.effectiveDate,
    "Current monthly rent: "+currency(input.currentRent),
    "Offered monthly rent: "+currency(input.offeredRent),
    "Monthly change: "+signedCurrency(input.offeredRent-input.currentRent),
    String(input.periodMonths)+"-month change (fixed-rent comparison): "+signedCurrency((input.offeredRent-input.currentRent)*input.periodMonths),
    "Apartment List city benchmark: "+(input.benchmark===null?"Unavailable for this unit size":currency(input.benchmark)+" ("+input.benchmarkMonth+")"),
    "Offer vs benchmark: "+(input.marketDifference===null?"Unavailable":signedCurrency(input.marketDifference)+" ("+String(input.marketDifferencePct)+"%)"),
    "Rent protection screen: "+input.legalStatus+" — unverified and conditional",
    "State coverage: "+coverageLabel(input.stateCoverage),
    "Local coverage: "+coverageLabel(input.localCoverage),
    "Prior increases: "+increaseLabel(input.priorIncrease),
    "Written notice received: "+(input.noticeReceived||"Not entered"),
    "Published protection references:",
    ...(input.rules.length?input.rules.map(r=>"  - "+r.title+": "+r.rate+"% ("+r.from+" to "+r.to+"); "+coverageLabel(r.coverage)+"; "+r.url):["  - No dated rule in stored records"]),
    "Documents reported available: "+(available.length?available.map(k=>evidenceNames[k]).join("; "):"None confirmed"),
    "Documents not yet confirmed: "+(missing.length?missing.map(k=>evidenceNames[k]).join("; "):"None"),
    "Renter's notes: "+(details.trim()||"None"),
    "Suggested next step: "+input.nextAction,
    "Government guidance: "+input.nextActionUrl,
    "Market source: "+input.sourceUrl,
    "",
    "An organizer must independently verify property jurisdiction, coverage, exemptions, notices and past adjustments.",
    "Prepared locally. Downloading this text does not send it to an organization.",
  ].join("\n");
}
export function downloadTenantPacket(text:string):void {
  const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="moveup-tenant-support-packet.txt";
  a.click();
  URL.revokeObjectURL(url);
}
export function TenantIntakeDemo({caseRecord}: {caseRecord:TenantCaseRecord}) {
  const [concern,setConcern]=useState<Concern>("increase");
  const [available,setAvailable]=useState<Evidence[]>([]);
  const [details,setDetails]=useState("");
  const [preview,setPreview]=useState(false);
  const [contactEmail,setContactEmail]=useState("");
  const [consent,setConsent]=useState(false);
  const [status,setStatus]=useState<DeliveryState>("idle");
  const [statusText,setStatusText]=useState("");
  const packet=composeTenantPacket(caseRecord,concern,available,details);
  const missing=(Object.keys(evidenceNames) as Evidence[]).filter(k=>!available.includes(k));
  const resetDelivery=()=>{setStatus("idle");setStatusText("");setConsent(false);};
  const toggle=(key:Evidence)=>{
    setAvailable(prev=>prev.includes(key)?prev.filter(k=>k!==key):[...prev,key]);
    resetDelivery();
  };
  async function submitToDemo(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!intakeEndpointConfigured||!consent||!contactEmail.trim()||status==="sending"){
      setStatus("error");setStatusText("Enter a contact email and consent to send to the configured MoveUp demo inbox.");return;
    }
    setStatus("sending");setStatusText("");
    try{
      const response=await fetch(FORM_ENDPOINT,{
        method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({
          email:contactEmail.trim(),
          subject:"MoveUp demo intake — "+caseRecord.city,
          renter_case_packet:packet,
          recipient_type:"MoveUp demo intake — no tenant union connected",
        }),
      });
      if(!response.ok) throw new Error("Receiver did not accept the submission.");
      setStatus("success");setStatusText("Received by the configured MoveUp demo inbox. This is not a tenant-union or government filing.");
    }catch{
      setStatus("error");setStatusText("Submission was not confirmed. Nothing is marked received. Download the packet instead.");
    }
  }
  return <section className="v4-intake-demo" aria-label="Prepare for tenant support">
    <div className="v4-intake-header">
      <span>RENTER → ORGANIZER</span>
      <h3>Prepare for tenant support</h3>
      <p>Turn your renewal details into an organized packet. Nothing is sent without your consent.</p>
    </div>
    <div className="v4-intake-controls">
      <label className="v4-field"><span>What do you need help with?</span>
        <select aria-label="Reason for tenant support" value={concern} onChange={e=>{setConcern(e.target.value as Concern);resetDelivery();}}>
          {Object.entries(concernNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <fieldset className="v4-intake-checklist"><legend>Documents you have</legend>
        {(Object.keys(evidenceNames) as Evidence[]).map(key=><label key={key}>
          <input type="checkbox" checked={available.includes(key)} onChange={()=>toggle(key)}/>
          <span>{evidenceNames[key]}</span>
        </label>)}
      </fieldset>
      <label className="v4-intake-notes">
        <span>Additional context (optional)</span>
        <textarea aria-label="Notes for tenant support" maxLength={500} rows={3}
          value={details} onChange={e=>{setDetails(e.target.value);resetDelivery();}}
          placeholder="For example, when you received the notice."/>
      </label>
      <div className="v4-intake-buttons">
        <button type="button" className="v4-intake-preview-button" aria-expanded={preview} onClick={()=>setPreview(v=>!v)}>
          {preview?"Hide case preview":"Preview case packet"}
        </button>
        <button type="button" onClick={()=>downloadTenantPacket(packet)}>Download case packet</button>
      </div>
    </div>
    {preview?<div className="v4-intake-organizer">
      <div className="v4-intake-organizer-head"><strong>ORGANIZER REVIEW COPY</strong><span>UNSENT</span></div>
      <p><strong>Concern:</strong> {concernNames[concern]}</p>
      <p><strong>Renewal:</strong> {caseRecord.city}, {caseRecord.bedrooms} · {currency(caseRecord.currentRent)} → {currency(caseRecord.offeredRent)}</p>
      <p><strong>Legal screening:</strong> {caseRecord.legalStatus}</p>
      <p><strong>State protection:</strong> {coverageLabel(caseRecord.stateCoverage)}</p>
      <p><strong>Local protection:</strong> {coverageLabel(caseRecord.localCoverage)}</p>
      <p><strong>Prior increases:</strong> {increaseLabel(caseRecord.priorIncrease)}</p>
      <p><strong>Notice received:</strong> {caseRecord.noticeReceived||"Not supplied"}</p>
      <p><strong>Documents to confirm:</strong> {missing.length?missing.map(k=>evidenceNames[k]).join("; "):"Checklist complete"}</p>
      {details.trim()?<p><strong>Renter's note:</strong> {details.trim()}</p>:null}
      <p className="v4-intake-disclaimer">This is a renter-prepared summary, not a verified legal assessment.</p>
    </div>:null}
    <div className="v4-demo-delivery">
      <h4>Send to MoveUp demo intake</h4>
      {intakeEndpointConfigured?
        <form onSubmit={submitToDemo}>
          <p>This sends the displayed case packet and your email to the configured MoveUp demo inbox, not a tenant union or government office.</p>
          <label className="v4-field"><span>Contact email</span><input aria-label="Contact email" type="email" autoComplete="email" required value={contactEmail} onChange={e=>{setContactEmail(e.target.value);resetDelivery();}} placeholder="you@example.com"/></label>
          <label className="v4-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I understand this is a demonstration, and I consent to sending this case packet and email to the MoveUp demo inbox.</span></label>
          <button type="submit" disabled={!consent||!contactEmail.trim()||status==="sending"}>{status==="sending"?"Sending…":"Submit demo case"}</button>
        </form>
        :<p className="v4-demo-unavailable">Live demo intake has not been connected. Download the packet to share it yourself. No submission has occurred.</p>}
      {statusText?<p role="status" className={"v4-delivery-"+status}>{statusText}</p>:null}
    </div>
    <div className="v4-intake-print">
      <strong>TENANT SUPPORT REQUEST · {concernNames[concern]}</strong>
      <p>State coverage: {coverageLabel(caseRecord.stateCoverage)}. Local coverage: {coverageLabel(caseRecord.localCoverage)}.</p>
      <p>Prior increases: {increaseLabel(caseRecord.priorIncrease)}. Notice received: {caseRecord.noticeReceived||"Not supplied"}.</p>
      <p>Documents available: {available.length?available.map(k=>evidenceNames[k]).join("; "):"None confirmed"}.</p>
      <p>Documents still to confirm: {missing.length?missing.map(k=>evidenceNames[k]).join("; "):"None"}.</p>
      {details.trim()?<p>Renter notes: {details.trim()}</p>:null}
      <p>Renter-prepared for review; not submitted to a tenant organization.</p>
    </div>
  </section>;
}
