import { useState } from "react";
import { type City } from "../lib/renewalPolicy";
import {
  DIRECTORY_LAST_REVIEWED, organizationsByFocus,
  organizationsForCity, totalDirectoryOrganizations,
} from "../data/tenantOrganizations";

export function TenantOrganizationDirectory({city}:{city:City}) {
  const [focus,setFocus]=useState<"all"|"organizing"|"assistance">("all");
  const [showAll,setShowAll]=useState(false);
  const listed=organizationsForCity(city);
  const displayed=organizationsByFocus(city,focus);
  const visible=showAll?displayed:displayed.slice(0,2);
  return <section className="v6-directory" aria-label={"Public tenant organizations serving "+city}>
    <div className="v6-directory-intro">
      <div>
        <span className="v6-eyebrow">PUBLIC DIRECTORY</span>
        <h4>Renter organizations in {city}</h4>
        <p>Independent counseling and organizing groups you can contact directly. These are public listings, not current MoveUp partners.</p>
      </div>
      <div className="v6-directory-stat">
        <strong>{listed.length}</strong>
        <span>public groups listed in {city}</span>
      </div>
    </div>
    <div className="v6-directory-filters" role="group" aria-label="Filter organizations by focus">
      <button type="button" className={focus==="all"?"active":""} aria-pressed={focus==="all"} onClick={()=>{setFocus("all");setShowAll(false);}}>All</button>
      <button type="button" className={focus==="organizing"?"active":""} aria-pressed={focus==="organizing"} onClick={()=>{setFocus("organizing");setShowAll(false);}}>Organizing</button>
      <button type="button" className={focus==="assistance"?"active":""} aria-pressed={focus==="assistance"} onClick={()=>{setFocus("assistance");setShowAll(false);}}>Counseling and help</button>
    </div>
    <div className="v6-directory-list">
      {visible.map(org=><article key={org.id} className="v6-organization">
        <span className="v6-org-kind">{org.kind}</span>
        <strong>{org.name}</strong>
        <p>{org.summary}</p>
        <a href={org.url} target="_blank" rel="noopener noreferrer" aria-label={"Visit "+org.name+" website"}>Visit organization's website <span aria-hidden="true">↗</span></a>
      </article>)}
      {displayed.length===0?<p>No listings match this filter. Choose All to see the city directory.</p>:null}
    </div>
    {displayed.length>2?<button type="button" className="v6-directory-more" onClick={()=>setShowAll(v=>!v)}>{showAll?"Show fewer":`See all ${displayed.length} listed groups in ${city}`}</button>:null}
    <p className="v6-directory-disclaimer">
      {totalDirectoryOrganizations()} researched examples across four cities, not the total number of organizations in the market.
      Last checked {DIRECTORY_LAST_REVIEWED}. Independent listings, not MoveUp partners.
      Links open official organization websites. No inquiry is shared when you open a link.
    </p>
  </section>;
}
