import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { type TenantCaseRecord, coverageLabel, increaseLabel, currency, signedCurrency } from "../lib/tenantCase";
import {
  createDemoRecord, readDemoRegistry, saveDemoRecord, clearDemoRegistry,
  type DemoRegistryRecord,
} from "../lib/demoRegistry";

export type RenterContact = { name: string; email: string; phone: string };
type DeliveryState = "idle" | "sending" | "success" | "error";

const FORM_ENDPOINT = (import.meta.env.VITE_MOVEUP_INTAKE_ENDPOINT ?? "").trim();
export const intakeEndpointConfigured = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(FORM_ENDPOINT);

/** The case packet reflects the completed MoveUp renewal summary plus renter contact details. */
export function composeTenantPacket(input: TenantCaseRecord, contact: RenterContact): string {
  return [
    "MOVEUP / RENTER SUPPORT REQUEST",
    "Renter-prepared information. Not a legal finding or a government complaint.",
    "",
    "CONTACT INFORMATION",
    "Name: "+contact.name.trim(),
    "Email: "+contact.email.trim(),
    "Phone: "+contact.phone.trim(),
    "",
    "MOVEUP / RENEWAL SUMMARY",
    "City: "+input.city+" | Unit: "+input.bedrooms,
    "Renewal effective: "+input.effectiveDate,
    "Current monthly rent: "+currency(input.currentRent),
    "Proposed monthly rent: "+currency(input.offeredRent),
    "Change per month: "+signedCurrency(input.offeredRent-input.currentRent),
    String(input.periodMonths)+"-month difference: "+signedCurrency((input.offeredRent-input.currentRent)*input.periodMonths),
    "New-lease city benchmark: "+(input.benchmark===null?"Unavailable for this bedroom count":currency(input.benchmark)+" ("+input.benchmarkMonth+")"),
    "Market difference: "+(input.marketDifference===null?"Unavailable":signedCurrency(input.marketDifference)+" ("+String(input.marketDifferencePct)+"%)"),
    "Legal screening: "+input.legalStatus+" (conditional and unverified)",
    "State rent protection: "+coverageLabel(input.stateCoverage),
    "Local rent control: "+coverageLabel(input.localCoverage),
    "Prior increases: "+increaseLabel(input.priorIncrease),
    "Written notice received: "+(input.noticeReceived||"Not entered"),
    "Published protection references:",
    ...(input.rules.length
      ? input.rules.map(r=>"  * "+r.title+": "+r.rate+"% ("+r.from+" to "+r.to+"); "+coverageLabel(r.coverage)+"; "+r.url)
      : ["  * No dated rule in stored records"]),
    "Next step: "+input.nextAction,
    "Official guidance: "+input.nextActionUrl,
    "Market data source: "+input.sourceUrl,
    "",
    "Property jurisdiction, eligibility, exceptions, notice and rental history require independent verification.",
    "Submission in the MoveUp demo does not notify any tenant organization.",
  ].join("\n");
}

export function TenantIntakeDemo({caseRecord,children}:{caseRecord:TenantCaseRecord;children?:ReactNode}) {
  const [contactName,setContactName]=useState("");
  const [contactEmail,setContactEmail]=useState("");
  const [contactPhone,setContactPhone]=useState("");
  const [consent,setConsent]=useState(false);
  const [status,setStatus]=useState<DeliveryState>("idle");
  const [statusText,setStatusText]=useState("");
  const [records,setRecords]=useState<DemoRegistryRecord[]>([]);
  const [showRegistry,setShowRegistry]=useState(false);
  const caseFingerprint=JSON.stringify(caseRecord);
  const hasLAOrdinance=caseRecord.city==="Los Angeles" && caseRecord.rules.some(rule=>
    rule.title.toLowerCase().includes("stabilization") || rule.title.toLowerCase().includes("rso")
  );

  useEffect(()=>{
    setStatus("idle");setStatusText("");setConsent(false);
  },[caseFingerprint]);
  useEffect(()=>{
    try{if(typeof window!=="undefined")setRecords(readDemoRegistry(window.localStorage));}
    catch{setRecords([]);}
  },[]);

  const resetDelivery=()=>{setStatus("idle");setStatusText("");};
  async function submitInquiry(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(status==="sending"||status==="success")return;
    const contact:RenterContact={
      name:contactName.trim(),email:contactEmail.trim(),phone:contactPhone.trim(),
    };
    const emailValid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
    const digits=contact.phone.replace(/\D/g,"");
    if(!contact.name||contact.name.length>120||!emailValid||contact.email.length>254||digits.length<7||digits.length>15){
      setStatus("error");setStatusText("Enter your name, a valid email, and a valid phone number.");return;
    }
    if(!consent){
      setStatus("error");setStatusText("Consent is required before saving or sending your contact details.");return;
    }
    const packet=composeTenantPacket(caseRecord,contact);
    setStatus("sending");setStatusText("");
    let delivery:"local_demo"|"moveup_demo_inbox"="local_demo";
    if(intakeEndpointConfigured){
      try{
        const response=await fetch(FORM_ENDPOINT,{
          method:"POST",
          headers:{"Content-Type":"application/json","Accept":"application/json"},
          body:JSON.stringify({
            email:contact.email,name:contact.name,phone:contact.phone,
            subject:"MoveUp renter support demo inquiry for "+caseRecord.city,
            city:caseRecord.city,support_purpose:"assistance",
            renter_case_packet:packet,
            recipient_type:"MoveUp demo inbox. No tenant union is connected.",
          }),
        });
        if(!response.ok)throw new Error("Receiver did not accept the record.");
        delivery="moveup_demo_inbox";
      }catch{
        setStatus("error");
        setStatusText("MoveUp's demo inbox did not confirm receipt. Nothing was sent to an organization.");return;
      }
    }
    try{
      const id="MU-"+Date.now().toString(36).toUpperCase()+"-"+Math.floor(Math.random()*100000).toString(36).toUpperCase();
      const record=createDemoRecord({
        id,createdAt:new Date().toISOString(),city:caseRecord.city,
        purposes:["assistance"],issue:"Renter support inquiry",packet,delivery,
      });
      setRecords(saveDemoRecord(window.localStorage,record));
      setStatus("success");
      setStatusText(delivery==="local_demo"
        ?"Success! Inquiry "+record.id+" saved to the MoveUp browser-only demo database. Your contact details and renewal summary were saved on this device; no organizations were contacted."
        :"Success! MoveUp's demo inbox accepted inquiry "+record.id+". A local copy was saved. No tenant organizations were contacted.");
      setShowRegistry(false);
    }catch{
      if(delivery==="moveup_demo_inbox"){
        setStatus("success");
        setStatusText("Success! MoveUp's demo inbox accepted the inquiry, but a local copy could not be saved. No tenant organization was contacted.");
      }else{
        setStatus("error");
        setStatusText("Your browser could not save the inquiry. Nothing was registered or sent. Please try again.");
      }
    }
  }
  function clearRegistry(){
    try{
      clearDemoRegistry(window.localStorage);
      setRecords([]);setShowRegistry(false);setStatus("idle");setStatusText("");setConsent(false);
    }catch{
      setStatus("error");setStatusText("This browser could not clear the demo registry.");
    }
  }
  return <section id="moveup-connect" className="v4-intake-demo v8-support" aria-label="Request tenant support">
    <div className="v4-intake-header">
      <span>RENTER SUPPORT</span>
      <h3>{hasLAOrdinance
        ?"Filed an RSO complaint? Still unhappy with your rent adjustment? Find help now."
        :"Still unhappy with your rent adjustment? Find help now."}</h3>
      <p>Your rent figures, market comparison and protection screening are already filled in. Add your contact details to submit the completed assessment.</p>
    </div>
    <div className="v4-demo-delivery">
      <h4>Your assessment and contact information</h4>
      <p>The assessment below will be included automatically. No need to re-enter your rent or protection details.</p>
      {intakeEndpointConfigured
        ?<p><strong>Demo submission:</strong> Your contact details and renewal summary are sent to a MoveUp-operated demo inbox, not a tenant organization.</p>
        :<p><strong>Prototype database:</strong> Your contact details and summary are saved in this browser only, not a shared network. No tenant organizations receive them. Use sample contact details for this hackathon demo.</p>}
      <form onSubmit={submitInquiry}>
        <div className="v8-assessment">{children}</div>
        <h4 className="v8-contact-title">Your contact details</h4>
        <div className="v8-contact-fields">
          <label className="v4-field"><span>Full name</span>
            <input aria-label="Full name" autoComplete="name" required maxLength={120} value={contactName}
              onChange={e=>{setContactName(e.target.value);resetDelivery();}} placeholder="Jane Doe"/>
          </label>
          <label className="v4-field"><span>Email address</span>
            <input aria-label="Email address" inputMode="email" type="email" autoComplete="email" required maxLength={254}
              value={contactEmail} onChange={e=>{setContactEmail(e.target.value);resetDelivery();}} placeholder="jane@example.com"/>
          </label>
          <label className="v4-field"><span>Phone number</span>
            <input aria-label="Phone number" type="tel" inputMode="tel" autoComplete="tel" required
              value={contactPhone} onChange={e=>{setContactPhone(e.target.value);resetDelivery();}} placeholder="(555) 010-1234"/>
          </label>
        </div>
        <label className="v4-consent"><input aria-label="Consent to record this demo inquiry" type="checkbox" checked={consent}
          onChange={e=>{setConsent(e.target.checked);resetDelivery();}}/>
          <span>{intakeEndpointConfigured
            ?"I consent to send my name, email, phone, and renewal summary to MoveUp's demo inbox. No tenant organization receives it."
            :"I consent to save my name, email, phone, and renewal summary on this device for the MoveUp demo. No tenant organization receives it."}</span>
        </label>
        <button type="submit" disabled={!consent||status==="sending"||status==="success"}>
          {status==="sending"?"Submitting...":intakeEndpointConfigured?"Send to MoveUp demo inbox":"Submit to database"}
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
          <p>Records are stored in this browser only (unless a MoveUp demo inbox is configured). No tenant-union intake service is connected.</p>
          {records.length===0?<p>No inquiries saved on this device.</p>:
            records.map(record=><div className="v4-registry-city" key={record.id}>
              <strong>{record.id}</strong>
              <p>{record.city}: Renter support inquiry.
                {record.delivery==="local_demo"?" Saved on this device.":" Accepted by the MoveUp demo inbox."}</p>
            </div>)}
        </div>:null}
      </details>
    </div>
  </section>;
}
