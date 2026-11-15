import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { House } from "lucide-react";
import market from "@/data/rentMarket.snapshot.json";
import { officialActions } from "@/lib/renewalActions";
import { rentRules, type City } from "@/lib/renewalPolicy";
import { TENANT_ORGANIZATIONS, DIRECTORY_LAST_REVIEWED } from "@/data/tenantOrganizations";

export const Route = createFileRoute("/ai-usage")({
  head: () => ({ meta: [
    { title: "AI Usage & Sources | MoveUp" },
    { name: "description", content: "How MoveUp used AI in development and the public data, housing authorities and tenant-organization websites behind its renter tools." },
  ] }),
  component: AiUsagePage,
});

const aiWork = [
  { title: "Research", detail: "Compared renter needs, data sources and the scope of a weekend build." },
  { title: "Build", detail: "Helped create the interface, rent calculations and support intake flow." },
  { title: "Test", detail: "Helped debug forms, check edge cases and improve readability." },
] as const;

const marketSources = [
  {
    title: "Apartment List — Rent Estimates",
    label: "PRIMARY BENCHMARK IN THE APP",
    detail: "October 2026 city-level 1-bedroom and 2-bedroom new-lease median rent estimates. These numbers power the Offer vs market meter.",
    url: market.sources.apartmentList.url,
  },
  {
    title: "Zillow Research — ZORI",
    label: "ADDITIONAL RESEARCH DATA",
    detail: "A separately sourced rent index saved for research context. ZORI is not the Apartment List benchmark shown in the current meter.",
    url: market.sources.zori.page,
  },
  {
    title: "Apartment List — Rent Growth",
    label: "ADDITIONAL SAVED DATA",
    detail: "Month-over-month rental growth dataset stored with our snapshot. It is not the main figure displayed in the renewal checker.",
    url: market.sources.apartmentListMoM.url,
  },
] as const;

const officialSources = [
  { title: "California Attorney General", detail: "Statewide rent-cap protections and eligibility guidance.", url: rentRules["Los Angeles"][0].source_url },
  { title: "Los Angeles Housing Department", detail: "City Rent Stabilization Ordinance information and renter protections.", url: rentRules["Los Angeles"][1].source_url },
  { title: "LA Housing — RSO/JCO complaints", detail: "Official guidance and complaint process for suspected ordinance violations.", url: officialActions["Los Angeles"].url },
  { title: "San Francisco Rent Board", detail: "Local rental-law eligibility and tenant petition guidance.", url: officialActions["San Francisco"].eligibilityUrl },
  { title: "San Diego City Attorney", detail: "Housing Protection Unit complaint guidance.", url: officialActions["San Diego"].url },
  { title: "Washington Department of Commerce", detail: "Published annual rent-increase limits and exemptions.", url: rentRules["Seattle"][0].source_url },
  { title: "Seattle housing-cost increase guidance", detail: "Official local notice requirements and housing-cost increase rules.", url: officialActions["Seattle"].noticeUrl ?? "https://seattle.gov/construction-and-inspections/codes/common-code-questions/housing-cost-increases" },
] as const;

const cities: City[] = ["Los Angeles", "San Francisco", "San Diego", "Seattle"];

function ExternalLink({href,children}:{href:string;children:ReactNode}){
  return <a href={href} target="_blank" rel="noopener noreferrer" className="v8-source-link">
    {children} <span aria-hidden="true">↗</span>
  </a>;
}

export function AiUsagePage(){
  return <div className="v4-app v8-ai-app">
    <header className="v4-header">
      <div className="v4-container v4-nav">
        <a className="v4-logo v8-logo-link" href="/"><House size={28} strokeWidth={2.5} aria-hidden="true"/> MOVEUP</a>
        <nav className="v8-nav" aria-label="Main navigation">
          <a className="v8-nav-link" href="/">RENEWAL CHECK</a>
          <a className="v8-nav-link" href="/ai-usage" aria-current="page">AI USAGE</a>
        </nav>
      </div>
    </header>
    <main className="v4-container v8-ai-main">
      <section className="v8-ai-hero">
        <p className="v8-eyebrow">BEHIND THE BUILD · MOVEUP</p>
        <h1>The people, data and tools<br/>behind MoveUp.</h1>
        <p className="v8-ai-lede">Explore the renter organizations, public sources and AI-assisted work behind our prototype.</p>
      </section>

      <section className="v8-ai-section v8-community" aria-labelledby="community-title">
        <p className="v8-eyebrow">TENANT SUPPORT</p>
        <h2 id="community-title">Explore tenant organizations</h2>
        <p>Explore public renter groups in four cities. These are independent listings, not MoveUp partners.</p>
        <details className="v8-community-list">
          <summary>View all {TENANT_ORGANIZATIONS.length} organizations</summary>
          <div className="v8-community-groups">
            {cities.map(city=><div className="v8-community-group" key={city}>
              <h3>{city}</h3>
              <ul>{TENANT_ORGANIZATIONS.filter(org=>org.city===city).map(org=><li key={org.id}>
                <ExternalLink href={org.url}>{org.name}</ExternalLink>
              </li>)}</ul>
            </div>)}
          </div>
        </details>
        <p className="v8-method-note">Directory last reviewed: {DIRECTORY_LAST_REVIEWED}. Listings are examples, not an exhaustive list or a claim of affiliation.</p>
      </section>
      <section className="v8-ai-section" aria-labelledby="sources-title">
        <div className="v8-section-intro">
          <p className="v8-eyebrow">SOURCES & REFERENCES</p>
          <h2 id="sources-title">Our data and sources</h2>
          <p>See the rent research and official guidance behind the results.</p>
        </div>
        <div className="v8-source-cards">
          {marketSources.map(source=><article className="v8-source-card" key={source.title}>
            <span className="v8-source-tag">{source.label}</span>
            <h3>{source.title}</h3>
            <p>{source.detail}</p>
            <ExternalLink href={source.url}>View research and data</ExternalLink>
          </article>)}
        </div>
        <p className="v8-method-note">The market meter uses an October 2026 Apartment List city estimate, not a property appraisal.</p>
      </section>

      <section className="v8-ai-section" aria-labelledby="official-title">
        <div className="v8-section-intro">
          <p className="v8-eyebrow">PUBLIC AUTHORITIES</p>
          <h2 id="official-title">Official housing guidance</h2>
          <p>Check published rules and eligibility with the relevant housing authority.</p>
        </div>
        <div className="v8-official-grid">
          {officialSources.map(source=><article className="v8-official-item" key={source.title}>
            <div><h3>{source.title}</h3><p>{source.detail}</p></div>
            <ExternalLink href={source.url}>Read official guidance</ExternalLink>
          </article>)}
        </div>
      </section>

      <section className="v8-ai-section" aria-labelledby="ai-work-title">
        <div className="v8-section-intro"><p className="v8-eyebrow">HOW WE BUILT IT</p><h2 id="ai-work-title">How we used AI</h2><p>AI helped us research, build and test. Our team made the decisions and checked the results.</p></div>
        <div className="v8-work-grid">
          {aiWork.map((item,index)=><article className="v8-work-card" key={item.title}>
            <span className="v8-work-number">{String(index+1).padStart(2,"0")}</span>
            <h3>{item.title}</h3><p>{item.detail}</p>
          </article>)}
        </div>
      </section>
      <section className="v8-ai-section v8-limits" aria-labelledby="ai-limits-title">
        <p className="v8-eyebrow">CLEAR LIMITS</p>
        <h2 id="ai-limits-title">What AI does not do</h2>
        <p>AI does not decide if a rent increase is legal. MoveUp uses sourced rent data, published rules and renter inputs. The tenant referral network is planned, not live.</p>
      </section>

      <div className="v8-end-cta"><strong>Ready to review a renewal?</strong><a href="/#renewal-offer">Check your offer <span aria-hidden="true">→</span></a></div>
    </main>
    <footer className="v4-container v4-footer">MOVEUP · AI-ASSISTED DEVELOPMENT, SOURCE-BASED RENTER INFORMATION</footer>
  </div>;
}
