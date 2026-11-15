import { useEffect, useState, type FormEvent } from "react";
import { TenantOrganizationDirectory } from "./TenantOrganizationDirectory";
import { type TenantCaseRecord, coverageLabel, increaseLabel, currency, signedCurrency } from "../lib/tenantCase";
import {
  CITY_ROUTING, createDemoRecord, readDemoRegistry, saveDemoRecord,
  clearDemoRegistry,
  type DemoRegistryRecord, type SupportPurpose,
} from "../lib/demoRegistry";

type Evidence = "renewal" | "lease" | "prior";
type Concern = "increase" | "notice" | "clarification" | "negotiation";
type DeliveryState = "idle" | "sending" | "success" | "error";

const evidenceNames: Record<Evidence,string> = {
  renewal:"Written renewal offer or increase notice",
  lease:"Current lease or rental agreement",
  prior:"Previous rent increase notices, if any",
};
const concernNames: Record<Concern,string> = {
  increase:"Review a proposed rent increase",
  notice:"Question about a notice or deadline",
  clarification:"Understand my renewal terms",
  negotiation:"Get help negotiating",
};
const FORM_ENDPOINT = (import.meta.env.VITE_MOVEUP_INTAKE_ENDPOINT ?? "").trim();
export const intakeEndpointConfigured = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(FORM_ENDPOINT);
const PURPOSE_NAMES:Record<SupportPurpose,string> = {
  assistance:"Assistance with my housing concern",
  organizing:"Information about tenant organizing",
};

export function composeTenantPacket(
  input:TenantCaseRecord, concern:Concern, available:Evidence[],
  details:string, purposes:SupportPurpose[]=["assistance"],
):string {
  const missing=(Object.keys(evidenceNames) as Evidence[]).filter(k=>!available.includes(k));
  return [
    "MOVEUP: RENTER-PREPARED INQUIRY",
    "Not a legal finding or formal government complaint.",
    "",
    "Requested connection: "+(purposes.length?purposes.map(k=>PURPOSE_NAMES[k]).join("; "):"Not selected"),
    "Reason for support: "+concernNames[concern],
    "City: "+input.city+" | Unit: "+input.bedrooms,
    "Renewal effective: "+input.effectiveDate,
    "Current monthly rent: "+currency(input.currentRent),
    "Offered monthly rent: "+currency(input.offeredRent),
    "Monthly change: "+signedCurrency(input.offeredRent-input.currentRent),
    String(input.periodMonths)+"-month change (fixed rent comparison): "+signedCurrency((input.offeredRent-input.currentRent)*input.periodMonths),
    "Apartment List city benchmark: "+(input.benchmark===null?"Unavailable for this unit size":currency(input.benchmark)+" ("+input.benchmarkMonth+")"),
    "Offer vs benchmark: "+(input.marketDifference===null?"Unavailable":signedCurrency(input.marketDifference)+" ("+String(input.marketDifferencePct)+"%)"),
    "Rent protection screen: "+input.legalStatus+" (unverified and conditional)",
    "State coverage: "+coverageLabel(input.stateCoverage),
    "Local coverage: "+coverageLabel(input.localCoverage),
    "Prior increases: "+increaseLabel(input.priorIncrease),
    "Written notice received: "+(input.noticeReceived||"Not entered"),
    "Published protection references:",
    ...(input.rules.length?input.rules.map(r=>"  * "+r.title+": "+r.rate+"% ("+r.from+" to "+r.to+"); "+coverageLabel(r.coverage)+"; "+r.url):["  * No dated rule in stored records"]),
    "Documents reported available: "+(available.length?available.map(k=>evidenceNames[k]).join("; "):"None confirmed"),
    "Documents to verify: "+(missing.length?missing.map(k=>evidenceNames[k]).join("; "):"None from checklist"),
    "Renter notes: "+(details.trim()||"None"),
    "Suggested action: "+input.nextAction,
    "Government guidance: "+input.nextActionUrl,
    "Market source: "+input.sourceUrl,
    "",
    "A reviewer must verify property jurisdiction, coverage, exceptions, notices and past increases.",
    "This report is renter-prepared. Downloading it does not send it to a tenant organization.",
  ].join("\n");
}
export function downloadTenantPacket(value:string):void {
  const blob=new Blob([value],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="moveup-renter-intake.txt";link.click();
  URL.revokeObjectURL(url);
}

export function TenantIntakeDemo({caseRecord}:{caseRecord:TenantCaseRecord}) {
  const [concern,setConcern]=useState<Concern>("increase");
  const [available,setAvailable]=useState<Evidence[]>([]);
  const [details,setDetails]=useState("");
  const [preview,setPreview]=useState(false);
  const [assistance,setAssistance]=useState(false);
  const [organizing,setOrganizing]=useState(false);
  const [contactEmail,setContactEmail]=useState("");
  const [consent,setConsent]=useState(false);
  const [status,setStatus]=useState<DeliveryState>("idle");
  const [statusText,setStatusText]=useState("");
  const [records,setRecords]=useState<DemoRegistryRecord[]>([]);
  const [showRegistry,setShowRegistry]=useState(false);
  const caseFingerprint=JSON.stringify(caseRecord);
  useEffect(()=>{
    setStatus("idle");setStatusText("");setConsent(false);
  },[caseFingerprint]);
  useEffect(()=>{
    try{if(typeof window!=="undefined")setRecords(readDemoRegistry(window.localStorage));}
    catch{setRecords([]);}
  },[]);
  const purposes:SupportPurpose[] = [
    ...(assistance?["assistance" as const]:[]),
    ...(organizing?["organizing" as const]:[]),
  ];
  const packet=composeTenantPacket(caseRecord,concern,available,details,purposes);
  const missing=(Object.keys(evidenceNames) as Evidence[]).filter(k=>!available.includes(k));
  const routing=CITY_ROUTING[caseRecord.city];
  const resetDelivery=()=>{setStatus("idle");setStatusText("");setConsent(false);};
  const toggle=(key:Evidence)=>{
    setAvailable(prev=>prev.includes(key)?prev.filter(k=>k!==key):[...prev,key]);
    resetDelivery();
  };
  async function submitInquiry(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!purposes.length||!consent||status==="sending"||status==="success"){
      setStatus("error");
      setStatusText("Select an interest and consent before recording this demo inquiry.");
      return;
    }
    if(intakeEndpointConfigured&&(!contactEmail.trim()||!contactEmail.includes("@"))){
      setStatus("error");setStatusText("A valid contact email is required for a remote demo submission.");return;
    }
    setStatus("sending");setStatusText("");
    let delivery:"local_demo"|"moveup_demo_inbox"="local_demo";
    if(intakeEndpointConfigured){
      try{
        const response=await fetch(FORM_ENDPOINT,{
          method:"POST",
          headers:{"Content-Type":"application/json","Accept":"application/json"},
          body:JSON.stringify({
            email:contactEmail.trim(),
            subject:"MoveUp demo inquiry for "+caseRecord.city,
            city:caseRecord.city,
            support_purposes:purposes.join(", "),
            renter_case_packet:packet,
            recipient_type:"MoveUp demo inbox. No tenant union is connected.",
          }),
        });
        if(!response.ok)throw new Error("Receiver did not accept the record.");
        delivery="moveup_demo_inbox";
      }catch{
        setStatus("error");
        setStatusText("The demo inbox did not confirm receipt. Nothing was submitted. You can download the case packet.");
        return;
      }
    }
    try{
      const id="MU-"+Date.now().toString(36).toUpperCase()+"-"+Math.floor(Math.random()*100000).toString(36).toUpperCase();
      const record=createDemoRecord({
        id,createdAt:new Date().toISOString(),city:caseRecord.city,purposes,
        issue:concernNames[concern],packet,delivery,
      });
      const result=saveDemoRecord(window.localStorage,record);
      setRecords(result);
      setStatus("success");
      setStatusText(delivery==="local_demo"
        ?"Inquiry saved on this device for "+caseRecord.city+". No organizations were contacted."
        :"MoveUp demo inbox accepted the inquiry. A local copy was saved. No tenant organizations were contacted.");
      setShowRegistry(false);
    }catch{
      if(delivery==="moveup_demo_inbox"){
        setStatus("success");
        setStatusText("The MoveUp demo inbox accepted this inquiry, but a local copy was not saved. No tenant organizations were contacted.");
      }else{
        setStatus("error");
        setStatusText("This browser could not save the inquiry. Nothing was registered or sent. Download the case packet instead.");
      }
    }
  }
  function clearRegistry(){
    try{clearDemoRegistry(window.localStorage);setRecords([]);setShowRegistry(false);setStatus("idle");setStatusText("");setConsent(false);}
    catch{setStatus("error");setStatusText("This browser could not clear the demo registry.");}
  }
  return <section id="moveup-connect" className="v4-intake-demo" aria-label="Connect with tenant support">
    <div className="v4-intake-header">
      <span>OPTIONAL RENTER CONNECTION</span>
      <h3>Connect with tenant support</h3>
      <p>You can request assistance, learn about organizing, or both. No legal violation is required.</p>
    </div>
    <div className="v4-interest-choices">
      <label><input aria-label="I want assistance with my housing concern" type="checkbox" checked={assistance}
        onChange={e=>{setAssistance(e.target.checked);resetDelivery();}}/>
        <span><strong>I want help with my housing concern</strong><small>Get assistance with a renewal or negotiation question.</small></span>
      </label>
      <label><input aria-label="I am interested in tenant organizing" type="checkbox" checked={organizing}
        onChange={e=>{setOrganizing(e.target.checked);resetDelivery();}}/>
        <span><strong>I'm interested in tenant organizing</strong><small>Learn how renters can connect and organize collectively.</small></span>
      </label>
    </div>
    <TenantOrganizationDirectory city={caseRecord.city}/>
    {assistance?<div className="v4-intake-controls">
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
    </div>:null}
    {purposes.length>0?<label className="v4-intake-notes">
      <span>Anything you want to add? (optional)</span>
      <textarea aria-label="Notes for tenant support" maxLength={500} rows={3}
        value={details} onChange={e=>{setDetails(e.target.value);resetDelivery();}}
        placeholder="For example, what you have already asked your landlord."/>
    </label>:null}
    <div className="v4-intake-buttons">
      <button type="button" className="v4-intake-preview-button" aria-expanded={preview} onClick={()=>setPreview(v=>!v)}>
        {preview?"Hide inquiry preview":"Preview renter inquiry"}
      </button>
      <button type="button" onClick={()=>downloadTenantPacket(packet)}>Download case packet</button>
    </div>
    {preview?<div className="v4-intake-organizer">
      <div className="v4-intake-organizer-head"><strong>RENTER INQUIRY PREVIEW</strong><span>NOT SENT</span></div>
      <p><strong>Interest:</strong> {purposes.length?purposes.map(k=>PURPOSE_NAMES[k]).join("; "):"None selected"}</p>
      <p><strong>Renewal:</strong> {caseRecord.city}, {caseRecord.bedrooms}. {currency(caseRecord.currentRent)} to {currency(caseRecord.offeredRent)}</p>
      <p><strong>Market:</strong> {caseRecord.marketDifference===null?"Benchmark unavailable":signedCurrency(caseRecord.marketDifference)+" versus the city benchmark"}</p>
      <p><strong>Legal screening:</strong> {caseRecord.legalStatus}</p>
      {assistance?<p><strong>Reason:</strong> {concernNames[concern]}</p>:null}
      {assistance?<p><strong>Unconfirmed documents:</strong> {missing.length?missing.map(k=>evidenceNames[k]).join("; "):"Checklist complete"}</p>:null}
      <p><strong>State coverage:</strong> {coverageLabel(caseRecord.stateCoverage)}</p>
      <p><strong>Local coverage:</strong> {coverageLabel(caseRecord.localCoverage)}</p>
      {details.trim()?<p><strong>Renter note:</strong> {details.trim()}</p>:null}
      <p className="v4-intake-disclaimer">Renter-prepared information. A tenant organization has not reviewed or received this packet.</p>
    </div>:null}
    <div className="v4-demo-delivery">
      <h4>Keep a copy of your inquiry</h4>
      <p>You choose whether to contact an organization using its public website. MoveUp does not automatically send this inquiry to any of the groups listed above.</p>
      {intakeEndpointConfigured?
        <p>The configured receiver is a MoveUp demo inbox, not a tenant union. Only a confirmed response can mark it received.</p>
        :<p>For this hackathon demo, you can save the inquiry on this device. No renter information is sent to a tenant organization.</p>}
      <form onSubmit={submitInquiry}>
        {intakeEndpointConfigured?<label className="v4-field"><span>Contact email</span>
          <input aria-label="Contact email" type="email" required autoComplete="email" value={contactEmail}
            onChange={e=>{setContactEmail(e.target.value);resetDelivery();}} placeholder="you@example.com"/>
        </label>:null}
        <label className="v4-consent"><input aria-label="Consent to record this demo inquiry" type="checkbox" checked={consent}
          onChange={e=>setConsent(e.target.checked)}/>
          <span>{intakeEndpointConfigured
            ?"I consent to send my inquiry and email to MoveUp's demo inbox, not to any listed organization."
            :"I consent to save this inquiry on my device for demonstration. I understand no organization will receive it."}</span>
        </label>
        <button type="submit" disabled={!consent||purposes.length===0||status==="sending"||status==="success"}>
          {status==="sending"?"Saving inquiry...":intakeEndpointConfigured?"Send to MoveUp demo inbox":"Save demo inquiry"}
        </button>
      </form>
      {statusText?<p role="status" className={"v4-delivery-"+status}>{statusText}</p>:null}
      <details className="v6-demo-tools">
        <summary>Hackathon demo tools: local inquiry records</summary>
        <div className="v4-registry-toolbar">
          <button type="button" className="v4-view-registry" onClick={()=>setShowRegistry(v=>!v)}>
            {showRegistry?"Hide":"View"} saved demo inquiries ({records.length})
          </button>
          {records.length>0?<button type="button" className="v4-clear-registry" onClick={clearRegistry}>Clear saved demo inquiries</button>:null}
        </div>
        {showRegistry?<div className="v4-registry" aria-label="Local demo registry">
          <strong>Local demo records</strong>
          <p>These are stored only in this browser, not in a shared service or organization inbox.</p>
          {records.length===0?<p>No inquiries saved on this device.</p>:
            records.map(record=><div className="v4-registry-city" key={record.id}>
              <strong>{record.id}</strong>
              <p>{record.city}: {record.purposes.map(p=>PURPOSE_NAMES[p]).join(" and ")}.
                {record.delivery==="local_demo"?" Saved on this device.":" Accepted by the MoveUp demo inbox."}</p>
            </div>)}
        </div>:null}
      </details>
    </div>
    <div className="v4-intake-print">
      <strong>TENANT INQUIRY: {purposes.map(p=>PURPOSE_NAMES[p]).join("; ")||"No interest selected"}</strong>
      <p>City: {caseRecord.city}. State coverage: {coverageLabel(caseRecord.stateCoverage)}. Local coverage: {coverageLabel(caseRecord.localCoverage)}.</p>
      <p>Previous increases: {increaseLabel(caseRecord.priorIncrease)}. Notice received: {caseRecord.noticeReceived||"Not supplied"}.</p>
      {assistance?<p>Issue: {concernNames[concern]}. Documents to confirm: {missing.length?missing.map(k=>evidenceNames[k]).join("; "):"None"}.</p>:null}
      {details.trim()?<p>Renter note: {details.trim()}</p>:null}
      <p>Not a government filing. No tenant union delivery is confirmed.</p>
    </div>
  </section>;
}
