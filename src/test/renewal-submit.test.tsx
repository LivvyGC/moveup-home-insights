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
  expect(screen.queryByText("Save your renewal summary")).toBeNull();
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
  expect(screen.getByText("Offer vs market")).toBeTruthy();
 });
 it("submits with Enter from a rent input",()=>{
  render(<RenewalPage/>);fill();
  fireEvent.keyDown(screen.getByLabelText("Offered rent / month"),{key:"Enter",code:"Enter",charCode:13});
  expect(screen.getByText("Offer vs market")).toBeTruthy();
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
  expect(screen.getByText("Offer vs market")).toBeTruthy();
  expect(screen.getByText("Your protections")).toBeTruthy();
  expect(screen.getByText("Save your renewal summary")).toBeTruthy();
 });
 it("displays bedroom-matched benchmark and dated source",()=>{
  render(<RenewalPage/>);fill({offer:"2200",bedrooms:"2br"});submit();
  expect(screen.getAllByText("$2,377.00").length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Apartment List · 2026-10/).length).toBeGreaterThan(0);
  expect(screen.getByRole("img",{name:/Your offer.*benchmark/})).toBeTruthy();
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
  expect(screen.getByText("Save your renewal summary")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Offered rent / month"),{target:{value:"2300"}});
  expect(screen.queryByText("Save your renewal summary")).toBeNull();
 });
 it("reflects changed protection answers in the report and organizer preview",()=>{
  render(<RenewalPage/>);fill({offer:"3000",bedrooms:"2br"});submit();
  fireEvent.change(screen.getByLabelText("State rent protection coverage"),{target:{value:"yes"}});
  fireEvent.change(screen.getByLabelText("Local rent control coverage"),{target:{value:"no"}});
  fireEvent.change(screen.getByLabelText("Other increases in the last 12 months?"),{target:{value:"none"}});
  expect(screen.getAllByText(/Reported covered: not independently verified/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Reported exempt: not independently verified/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button",{name:"Preview renter inquiry"}));
  expect(screen.getAllByText(/No earlier increases reported/).length).toBeGreaterThan(0);
  expect(screen.getByText("RENTER INQUIRY PREVIEW")).toBeTruthy();
 });
 it("skips redundant action cards and keeps optional negotiation accessible",()=>{
  const {container}=render(<RenewalPage/>);fill({offer:"2010",bedrooms:"2br"});submit();
  expect(screen.queryByText("What would you like to do?")).toBeNull();
  expect(container.querySelector(".v4-action-grid")).toBeNull();
  expect(screen.getByText("Your protections")).toBeTruthy();
  expect(screen.getByText("Connect with tenant support")).toBeTruthy();
  const details=container.querySelector(".v4-negotiation-inline") as HTMLDetailsElement;
  expect(details).toBeTruthy();
  expect(details.open).toBe(false);
  fireEvent.click(screen.getByText("Want to negotiate? Draft a message to your landlord"));
  expect(details.open).toBe(true);
  expect((screen.getByRole("textbox",{name:"Draft landlord request"}) as HTMLTextAreaElement).value).toContain("$2010.00");
  expect(screen.getByRole("button",{name:"Copy message"})).toBeTruthy();
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
 it("puts tenant connection before the optional summary",()=>{
  const {container}=render(<RenewalPage/>);fill();submit();
  const a=container.querySelector("#moveup-connect"),r=container.querySelector(".v4-report");
  expect(a).toBeTruthy();expect(r).toBeTruthy();
  expect((a?.compareDocumentPosition(r!)??0)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
  expect(screen.getByRole("link",{name:/Explore renter organizations below/})).toBeTruthy();
 });
 it("the report only appears after a completed analysis",()=>{
  render(<RenewalPage/>);
  expect(screen.queryByRole("button",{name:"Print / Save as PDF"})).toBeNull();
  fill();submit();
  expect(screen.getByRole("button",{name:"Print / Save as PDF"})).toBeTruthy();
 });
});
