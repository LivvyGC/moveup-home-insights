import { useState } from "react";

type Evidence = "renewal" | "lease" | "prior";
type Concern = "increase" | "notice" | "clarification";

export type IntakePacketProps = {
  city:string;
  bedrooms:string;
  currentRent:number;
  offeredRent:number;
  effectiveDate:string;
  benchmark:number|null;
  benchmarkMonth:string;
  legalStatus:string;
  policyNotes:string[];
  nextAction:string;
};

const evidenceNames:Record<Evidence,string> = {
  renewal:"Written renewal offer / increase notice",
  lease:"Current lease or rental agreement",
  prior:"Previous rent increase notices (if any)",
};
const concernNames:Record<Concern,string> = {
  increase:"Review a proposed rent increase",
  notice:"Question about the notice or deadline",
  clarification:"Request clarification before renewing",
};
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);

export function composeTenantPacket(input:IntakePacketProps,concern:Concern,available:Evidence[],details:string):string {
  const diff=input.offeredRent-input.currentRent;
  const missing=(Object.keys(evidenceNames) as Evidence[]).filter(key=>!available.includes(key));
  const lines=[
    "MOVEUP — TENANT SUPPORT INTAKE (RENTER-PREPARED)",
    "Draft for human review; not filed or sent to any organization.",
    "",
    "Issue: "+concernNames[concern],
    "City: "+input.city+" | Unit: "+input.bedrooms,
    "New rent effective: "+input.effectiveDate,
    "Current rent: "+money(input.currentRent),
    "Offered rent: "+money(input.offeredRent),
    "Proposed monthly change: "+(diff>0?"+":"")+money(diff),
    "Market comparison: "+(input.benchmark===null?"Unavailable for selected bedroom size":money(input.benchmark)+" (Apartment List, "+input.benchmarkMonth+", city new-lease estimate)"),
    "Legal screening: "+input.legalStatus+" (not a legal determination)",
    "Published rule references: "+(input.policyNotes.length?input.policyNotes.join("; "):"No dated rules available"),
    "Documents renter reports having: "+(available.length?available.map(k=>evidenceNames[k]).join("; "):"None confirmed"),
    "Still to gather/verify: "+(missing.length?missing.map(k=>evidenceNames[k]).join("; "):"No checklist items outstanding"),
    "Renter's notes: "+(details.trim()||"Not provided"),
    "Suggested next step: "+input.nextAction,
    "",
    "A reviewer should verify property jurisdiction, rent-control coverage, prior increases, and the actual notices.",
    "Source: https://www.apartmentlist.com/research/category/data-rent-estimates",
    "Prepared locally. The demo does not store, send or file cases.",
  ];
  return lines.join("\n");
}

export function TenantIntakeDemo(input:IntakePacketProps) {
  const [concern,setConcern]=useState<Concern>("increase");
  const [available,setAvailable]=useState<Evidence[]>([]);
  const [details,setDetails]=useState("");
  const [preview,setPreview]=useState(false);
  const [copied,setCopied]=useState(false);
  const packet=composeTenantPacket(input,concern,available,details);
  const missing=(Object.keys(evidenceNames) as Evidence[]).filter(k=>!available.includes(k));
  const toggle=(k:Evidence)=>{
    setAvailable(prev=>prev.includes(k)?prev.filter(i=>i!==k):[...prev,k]);
    setCopied(false);
  };
  return <div className="v4-intake-demo">
    <div className="v4-intake-header"><span>DEMO · ORGANIZER-READY HANDOFF</span><h3>Prepare for tenant support</h3><p>Use the renewal information already entered. Add only the details an organizer needs for an initial review.</p></div>
    <div className="v4-intake-controls">
      <label className="v4-field"><span>What help are you seeking?</span>
        <select aria-label="Reason for tenant support" value={concern} onChange={e=>{setConcern(e.target.value as Concern);setCopied(false);}}>
          {Object.entries(concernNames).map(([k,label])=><option key={k} value={k}>{label}</option>)}
        </select>
      </label>
      <fieldset className="v4-intake-checklist"><legend>What documents do you already have?</legend>
        {(Object.keys(evidenceNames) as Evidence[]).map(key=><label key={key}><input type="checkbox" checked={available.includes(key)} onChange={()=>toggle(key)}/><span>{evidenceNames[key]}</span></label>)}
      </fieldset>
      <label className="v4-intake-notes"><span>Anything else the reviewer should know? (optional)</span><textarea aria-label="Notes for tenant support" maxLength={500} rows={3} value={details} onChange={e=>{setDetails(e.target.value);setCopied(false);}} placeholder="For example: when the increase notice arrived or what you have already asked your landlord."/></label>
      <button type="button" className="v4-intake-preview-button" aria-expanded={preview} onClick={()=>setPreview(p=>!p)}>{preview?"Hide organizer packet":"Preview organizer packet"}</button>
    </div>
    <div className="v4-intake-organizer" data-open={preview}>
      <div className="v4-intake-organizer-head"><strong>ORGANIZER REVIEW COPY</strong><span>NOT SENT · NO ACCOUNT</span></div>
      <p><strong>Issue:</strong> {concernNames[concern]}</p>
      <p><strong>Renewal:</strong> {input.city}, {input.bedrooms} · {money(input.currentRent)} → {money(input.offeredRent)} · starts {input.effectiveDate}</p>
      <p><strong>Review status:</strong> {input.legalStatus}. An organizer must verify eligibility and notices.</p>
      <p><strong>Evidence outstanding:</strong> {missing.length?missing.map(k=>evidenceNames[k]).join("; "):"None from the checklist"}</p>
      {details.trim()?<p><strong>Renter note:</strong> {details.trim()}</p>:null}
      <div className="v4-intake-organizer-actions">
        <button type="button" onClick={()=>{
          if(typeof navigator!=="undefined"&&navigator.clipboard?.writeText){
            void navigator.clipboard.writeText(packet).then(()=>setCopied(true)).catch(()=>setCopied(false));
          }
        }}>Copy case packet</button>
        {copied?<span role="status">Copied locally — share only with an intended recipient.</span>:null}
      </div>
      <p className="v4-intake-disclaimer">No organization is connected. This preview is a reusable intake format, not a legal referral, case submission or automated decision.</p>
    </div>
    <div className="v4-intake-print">
      <strong>TENANT INTAKE · {concernNames[concern]}</strong>
      <p>Documents reported: {available.length?available.map(k=>evidenceNames[k]).join("; "):"None confirmed"}. Missing/unchecked: {missing.length?missing.map(k=>evidenceNames[k]).join("; "):"None"}.</p>
      {details.trim()?<p>Renter note: {details.trim()}</p>:null}
      <p>Prepared by renter for optional human review. Not sent or filed.</p>
    </div>
  </div>;
}
