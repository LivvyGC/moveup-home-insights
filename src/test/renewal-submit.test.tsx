import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {RenewalPage} from "../routes/index";
afterEach(cleanup);
function fill({offer="2200",bedrooms="1br"}={}) {
 fireEvent.change(screen.getByLabelText("Bedrooms"),{target:{value:bedrooms}});
 fireEvent.change(screen.getByLabelText("Current rent / month"),{target:{value:"2000"}});
 fireEvent.change(screen.getByLabelText("Offered rent / month"),{target:{value:offer}});
 fireEvent.change(screen.getByLabelText("New rent takes effect"),{target:{value:"2027-01-09"}});
}
const submit=()=>fireEvent.click(screen.getByRole("button",{name:"CHECK MY OFFER"}));
describe("V4 renter flow",()=>{
 it("initially hides results, print report and legal follow-ups",()=>{
  render(<RenewalPage/>);
  expect(screen.getAllByRole("button",{name:"CHECK MY OFFER"})).toHaveLength(1);
  expect(screen.queryByRole("link",{name:/Check my offer/})).toBeNull();
  expect(screen.getAllByRole("button",{name:"Fill with example numbers"})).toHaveLength(1);
  expect(screen.getByRole("button",{name:"Clear form"})).toBeTruthy();
  expect(screen.queryByText("Your protections")).toBeNull();
  expect(screen.queryByText("Your prefilled renewal assessment")).toBeNull();
  expect(screen.queryByLabelText("Local rent control coverage")).toBeNull();
 });
 it("validates positive inputs and effective date",()=>{
  render(<RenewalPage/>);submit();
  expect(screen.getByRole("alert").textContent).toMatch(/current rent/i);
  fill();fireEvent.change(screen.getByLabelText("New rent takes effect"),{target:{value:""}});submit();
  expect(screen.getByRole("alert").textContent).toMatch(/valid rent effective date/i);
 });
 it("accepts a past effective date and still shows a result",()=>{
  render(<RenewalPage/>);fill();
  fireEvent.change(screen.getByLabelText("New rent takes effect"),{target:{value:"2026-01-09"}});
  submit();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("Offer vs. Market")).toBeTruthy();
 });
 it("submits with Enter from a rent input",()=>{
  render(<RenewalPage/>);fill();
  fireEvent.keyDown(screen.getByLabelText("Offered rent / month"),{key:"Enter",code:"Enter",charCode:13});
  expect(screen.getByText("Offer vs. Market")).toBeTruthy();
 });
 it("fills the sample only when requested and clears it again",()=>{
  render(<RenewalPage/>);
  fireEvent.click(screen.getByRole("button",{name:"Fill with example numbers"}));
  expect((screen.getByLabelText("Offered rent / month") as HTMLInputElement).value).toBe("2650");
  expect(screen.getByText(/Example: Los Angeles/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Clear form"}));
  expect((screen.getByLabelText("Offered rent / month") as HTMLInputElement).value).toBe("");
 });
 it("click and native Enter-form submit share the analysis",()=>{
  const {container}=render(<RenewalPage/>);fill();
  const form=container.querySelector("form");
  if(!form)throw Error("Missing renewal form");
  expect(screen.getByRole("button",{name:"CHECK MY OFFER"}).getAttribute("type")).toBe("submit");
  fireEvent.submit(form);
  expect(screen.getByText("Offer vs. Market")).toBeTruthy();
  expect(screen.getByText("Your protections")).toBeTruthy();
  expect(screen.getByText("Your prefilled renewal assessment")).toBeTruthy();
 });
 it("displays bedroom-matched benchmark and dated source",()=>{
  render(<RenewalPage/>);fill({offer:"2200",bedrooms:"2br"});submit();
  expect(screen.getAllByText("$2,377.00").length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Apartment List · 2026-10/).length).toBeGreaterThan(0);
  expect(screen.getByRole("img",{name:/Your offer.*benchmark/})).toBeTruthy();
 });
 it("uses the below-benchmark meter state when the renewal offer is lower",()=>{
  const {container}=render(<RenewalPage/>);fill({offer:"2200",bedrooms:"2br"});submit();
  expect(screen.getByText("Below city benchmark")).toBeTruthy();
  const meter=container.querySelector(".v4-meter") as HTMLDivElement;
  expect(meter).toBeTruthy();
  expect(parseFloat((meter.querySelector(".v4-market-line") as HTMLDivElement).style.left))
    .toBeGreaterThan(parseFloat((meter.querySelector(".v4-offer-line") as HTMLDivElement).style.left));
  expect(container.querySelector(".v7-market-chart")).toBeNull();
 });
 it("unsupported bedrooms never display a made-up benchmark",()=>{
  render(<RenewalPage/>);fill({bedrooms:"other"});submit();
  expect(screen.getByText("Market benchmark not available")).toBeTruthy();
  expect(screen.queryByRole("img",{name:/Your offer.*benchmark/})).toBeNull();
 });
 it("a possible LA standard concern takes precedence over market price",()=>{
  render(<RenewalPage/>);fill({offer:"3000"});submit();
  expect(screen.getByText("Your offer is above the city benchmark")).toBeTruthy();
  expect(screen.getByText(/A published protection may need review/i)).toBeTruthy();
 });
 it("changing core input removes stale result",()=>{
  render(<RenewalPage/>);fill();submit();
  expect(screen.getByText("Your prefilled renewal assessment")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Offered rent / month"),{target:{value:"2300"}});
  expect(screen.queryByText("Your prefilled renewal assessment")).toBeNull();
 });
 it("reflects changed protection answers in the summary that is ready for support",()=>{
  render(<RenewalPage/>);fill({offer:"3000",bedrooms:"2br"});submit();
  fireEvent.change(screen.getByLabelText("State rent protection coverage"),{target:{value:"yes"}});
  fireEvent.change(screen.getByLabelText("Local rent control coverage"),{target:{value:"no"}});
  fireEvent.change(screen.getByLabelText("Other increases in the last 12 months?"),{target:{value:"none"}});
  expect(screen.getAllByText(/Reported covered: not independently verified/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Reported exempt: not independently verified/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/No earlier increases reported/).length).toBeGreaterThan(0);
  expect(screen.getByText("Your prefilled renewal assessment")).toBeTruthy();
  expect(screen.queryByText(/READY TO INCLUDE/)).toBeNull();
  expect(screen.queryByText("RENTER INQUIRY PREVIEW")).toBeNull();
 });
 it("does not show redundant action cards or an unrelated complaint prompt",()=>{
  const {container}=render(<RenewalPage/>);fill({offer:"2010",bedrooms:"2br"});submit();
  expect(screen.queryByText("What would you like to do?")).toBeNull();
  expect(container.querySelector(".v4-action-grid")).toBeNull();
  expect(container.querySelector(".v4-negotiation-inline")).toBeNull();
  expect(screen.queryByText(/Draft a message to your landlord/)).toBeNull();
  expect(screen.queryByRole("link",{name:/Open official LA complaint page/})).toBeNull();
  expect(screen.getByText("Your protections")).toBeTruthy();
  expect(screen.getByText(/Still unhappy with your rent adjustment\? Find help now\./)).toBeTruthy();
 });
 it("shows LA Housing complaint guidance for a possible local RSO concern, without claiming to file",()=>{
  render(<RenewalPage/>);fill({offer:"3000",bedrooms:"2br"});submit();
  const link=screen.getByRole("link",{name:/Open official LA complaint page/});
  const protections=screen.getByText("Your protections").closest("section");
  const resource=link.closest(".v7-la-resource");
  expect(protections).toBeTruthy();
  expect(resource).toBeTruthy();
  expect((protections?.compareDocumentPosition(resource!)??0)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(link.getAttribute("href")).toBe("https://housing.lacity.gov/residents/file-a-rso-complaint");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(screen.getByText(/MoveUp does not submit complaints/)).toBeTruthy();
  expect(screen.getByText(/eligibility must be verified/i)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Local rent control coverage"),{target:{value:"no"}});
  expect(screen.queryByRole("link",{name:/Open official LA complaint page/})).toBeNull();
  fireEvent.change(screen.getByLabelText("Local rent control coverage"),{target:{value:"yes"}});
  expect(screen.getByRole("link",{name:/Open official LA complaint page/})).toBeTruthy();
 });
 it("never shows LA's RSO complaint form to non-LA renters",()=>{
  render(<RenewalPage/>);
  fireEvent.change(screen.getByLabelText("City"),{target:{value:"San Francisco"}});
  fill({offer:"3000",bedrooms:"2br"});submit();
  expect(screen.queryByRole("link",{name:/Open official LA complaint page/})).toBeNull();
 });
 it("shows a single benchmark meter with market and offer markers plus clear differences",()=>{
  const {container}=render(<RenewalPage/>);
  fireEvent.click(screen.getByRole("button",{name:"Fill with example numbers"}));
  submit();
  expect(screen.getByText("Above city benchmark")).toBeTruthy();
  expect(container.querySelectorAll(".v4-meter")).toHaveLength(1);
  expect(container.querySelectorAll(".v4-market-line")).toHaveLength(1);
  expect(container.querySelectorAll(".v4-offer-line")).toHaveLength(1);
  expect(screen.getByText("MARKET")).toBeTruthy();
  expect(screen.getByText("YOUR OFFER")).toBeTruthy();
  const meter=container.querySelector(".v4-meter") as HTMLDivElement;
  const position=Number.parseFloat((meter.querySelector(".v4-market-line") as HTMLDivElement).style.left);
  const offerPosition=Number.parseFloat((meter.querySelector(".v4-offer-line") as HTMLDivElement).style.left);
  expect(offerPosition).toBeGreaterThan(position);
  expect(screen.getByText("+11.49%")).toBeTruthy();
  expect(screen.getByText("+$273.00 / month")).toBeTruthy();
  expect(screen.queryByText(/Bar lengths use the same dollar scale/)).toBeNull();
 });
 it("shows city and statewide protection cards together in source order",()=>{
  const {container}=render(<RenewalPage/>);fill({offer:"3000"});submit();
  const cityCard=container.querySelector(".v4-law-card:not(.v4-law-card-secondary)");
  const stateCard=container.querySelector(".v4-law-card-secondary");
  expect(cityCard).toBeTruthy();
  expect(stateCard).toBeTruthy();
  expect((cityCard?.compareDocumentPosition(stateCard!)??0)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByLabelText("State rent protection coverage")).toBeTruthy();
 });
 it("shows city and statewide protections without requiring expansion",()=>{
  render(<RenewalPage/>);fill({offer:"3000"});submit();
  expect(screen.getByText("Your protections")).toBeTruthy();
  expect(screen.queryByRole("button",{name:"Review protections"})).toBeNull();
  expect(screen.getByLabelText("Local rent control coverage")).toBeTruthy();
  expect(screen.getByLabelText("State rent protection coverage")).toBeTruthy();
 });
 it("embeds the prefilled assessment inside the same contact submission form",()=>{
  const {container}=render(<RenewalPage/>);fill();submit();
  const support=container.querySelector("#moveup-connect");
  const summary=container.querySelector("#moveup-summary");
  const form=support?.querySelector(".v4-demo-delivery form");
  const contact=form?.querySelector(".v8-contact-fields");
  expect(support).toBeTruthy();expect(summary).toBeTruthy();expect(form).toBeTruthy();
  expect(form?.contains(summary)).toBe(true);
  expect((summary?.compareDocumentPosition(contact!)??0)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelectorAll(".v4-report")).toHaveLength(1);
  expect(container.querySelectorAll(".v8-attached-summary")).toHaveLength(0);
  expect(container.querySelectorAll(".v8-contact-fields input")).toHaveLength(3);
  expect(screen.getByText("Your prefilled renewal assessment")).toBeTruthy();
 });
 it("shows the organization directory only at the bottom next to the network story",()=>{
  const {container}=render(<RenewalPage/>);fill();submit();
  const directory=container.querySelector(".v6-directory");
  const network=container.querySelector("#moveup-network");
  const report=container.querySelector(".v4-report");
  const intake=container.querySelector("#moveup-connect");
  expect(container.querySelectorAll(".v6-directory").length).toBe(1);
  expect(network?.contains(directory)).toBe(true);
  expect(intake?.contains(directory)).toBe(false);
  expect((report?.compareDocumentPosition(network!)??0)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText("Renter organizations in Los Angeles")).toBeTruthy();
  expect(screen.queryByRole("link",{name:"Find renter organizations below"})).toBeNull();
 });
 it("the report only appears after a completed analysis",()=>{
  render(<RenewalPage/>);
  expect(screen.queryByRole("button",{name:"Print / Save as PDF"})).toBeNull();
  fill();submit();
  expect(screen.getByRole("button",{name:"Print / Save as PDF"})).toBeTruthy();
 });
});
