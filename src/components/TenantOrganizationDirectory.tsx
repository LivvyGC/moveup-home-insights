import { useState } from "react";
import { type City } from "../lib/renewalPolicy";
import {
  DIRECTORY_LAST_REVIEWED, organizationsByFocus,
  organizationsForCity, totalDirectoryOrganizations,
} from "../data/tenantOrganizations";

export function TenantOrganizationDirectory({city}:{city:City}) {
  const [focus,setFocus]=useState<"all"|"organizing"|"assistance">("all");
  const listed=organizationsForCity(city);
  const displayed=organizationsByFocus(city,focus);
  return <section className="v6-directory" aria-label={"Public tenant organizations serving "+city}>
    <div className="v6-directory-intro">
      <div>
        <span className="v6-eyebrow">LOCAL RENTER COMMUNITY</span>
        <h4>Find renter organizations in {city}</h4>
        <p>Explore public groups that support tenant rights, counseling or organizing. You can connect directly, even if your increase is legal.</p>
      </div>
      <div className="v6-directory-stat">
        <strong>{listed.length}</strong>
        <span>public groups listed in {city}</span>
      </div>
    </div>
    <div className="v6-directory-filters" role="group" aria-label="Filter organizations by focus">
      <button type="button" className={focus==="all"?"active":""} aria-pressed={focus==="all"} onClick={()=>setFocus("all")}>All</button>
      <button type="button" className={focus==="organizing"?"active":""} aria-pressed={focus==="organizing"} onClick={()=>setFocus("organizing")}>Organizing</button>
      <button type="button" className={focus==="assistance"?"active":""} aria-pressed={focus==="assistance"} onClick={()=>setFocus("assistance")}>Counseling and help</button>
    </div>
    <div className="v6-directory-list">
      {displayed.map(org=><article key={org.id} className="v6-organization">
        <span className="v6-org-kind">{org.kind}</span>
        <strong>{org.name}</strong>
        <p>{org.summary}</p>
        <a href={org.url} target="_blank" rel="noopener noreferrer" aria-label={"Visit "+org.name+" website"}>Visit organization's website <span aria-hidden="true">↗</span></a>
      </article>)}
      {displayed.length===0?<p>No listings match this filter. Choose All to see the city directory.</p>:null}
    </div>
    <p className="v6-directory-disclaimer">
      {totalDirectoryOrganizations()} researched examples across four cities, not the total number of organizations in the market.
      Last checked {DIRECTORY_LAST_REVIEWED}. Independent listings, not MoveUp partners.
      Links open official organization websites. No inquiry is shared when you open a link.
    </p>
  </section>;
}
