import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AiUsagePage } from "../routes/ai-usage";
import { RenewalPage } from "../routes/index";
import { TENANT_ORGANIZATIONS } from "../data/tenantOrganizations";
import market from "../data/rentMarket.snapshot.json";

afterEach(cleanup);

describe("AI Usage and source transparency",()=>{
  it("links from the renter homepage and marks the AI page as current",()=>{
    render(<RenewalPage/>);
    expect(screen.getByRole("link",{name:"AI USAGE"}).getAttribute("href")).toBe("/ai-usage");
    cleanup();
    render(<AiUsagePage/>);
    expect(screen.getByRole("link",{name:"AI USAGE"}).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link",{name:"RENEWAL CHECK"}).getAttribute("href")).toBe("/");
  });

  it("states the real development role and AI limitations",()=>{
    const {container}=render(<AiUsagePage/>);
    expect(screen.getByRole("heading",{name:/Built with AI/})).toBeTruthy();
    expect(screen.getByRole("heading",{name:"How we used AI"})).toBeTruthy();
    expect(screen.getByRole("heading",{name:"What AI doesn't do"})).toBeTruthy();
    expect(container.querySelector(".v8-limits")?.textContent).toMatch(/does not run a live AI legal adviser/i);
    expect(screen.getByText(/does not automatically notify tenant unions/i)).toBeTruthy();
  });

  it("includes exact primary rent-data URL and marks research context as supplemental",()=>{
    render(<AiUsagePage/>);
    const links=screen.getAllByRole("link",{name:/View research and data/});
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute("href")).toBe(market.sources.apartmentList.url);
    expect(links[1].getAttribute("href")).toBe(market.sources.zori.page);
    expect(links[2].getAttribute("href")).toBe(market.sources.apartmentListMoM.url);
    expect(screen.getByText(/not the Apartment List benchmark shown in the current meter/)).toBeTruthy();
    expect(screen.getByText(/October 2026 Apartment List city-level new-lease snapshot/)).toBeTruthy();
  });

  it("offers real external official sources without claiming legal certification",()=>{
    render(<AiUsagePage/>);
    const links=screen.getAllByRole("link",{name:/Read official guidance/});
    expect(links).toHaveLength(7);
    for(const link of links){
      expect(link.getAttribute("href")).toMatch(/^https:\/\//);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
    expect(links.some(link=>link.getAttribute("href")==="https://housing.lacity.gov/residents/file-a-rso-complaint")).toBe(true);
    expect(screen.getByText(/applicability depends on the home/)).toBeTruthy();
  });

  it("provides clickable independent links to every curated renter organization",()=>{
    const {container}=render(<AiUsagePage/>);
    const links=container.querySelectorAll(".v8-community-groups a");
    expect(links).toHaveLength(TENANT_ORGANIZATIONS.length);
    for(const org of TENANT_ORGANIZATIONS){
      expect([...links].some(link=>link.getAttribute("href")===org.url)).toBe(true);
    }
    expect(container.querySelector(".v8-community")?.textContent).toMatch(/not MoveUp partners or paying customers/i);
  });
});
