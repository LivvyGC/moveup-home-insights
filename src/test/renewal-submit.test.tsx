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
  expect(screen.getByRole("button",{name:"CHECK MY OFFER"})).toBeTruthy();
  expect(screen.queryByText("Your protections")).toBeNull();
  expect(screen.queryByText("Save your renewal summary")).toBeNull();
  expect(screen.queryByLabelText("Local rent control coverage")).toBeNull();
 });
 it("validates positive inputs and effective date",()=>{
  render(<RenewalPage/>);submit();
  expect(screen.getByRole("alert").textContent).toMatch(/current rent/i);
  fill();fireEvent.change(screen.getByLabelText("New rent takes effect"),{target:{value:"2007-01-09"}});submit();
  expect(screen.getByRole("alert").textContent).toMatch(/future/i);
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
  fireEvent.click(screen.getByRole("button",{name:"Review protections"}));
  fireEvent.change(screen.getByLabelText("State rent protection coverage"),{target:{value:"yes"}});
  fireEvent.change(screen.getByLabelText("Local rent control coverage"),{target:{value:"no"}});
  fireEvent.change(screen.getByLabelText("Other increases in the last 12 months?"),{target:{value:"none"}});
  expect(screen.getAllByText(/Reported covered: not independently verified/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Reported exempt: not independently verified/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button",{name:"Preview renter inquiry"}));
  expect(screen.getAllByText(/No earlier increases reported/).length).toBeGreaterThan(0);
  expect(screen.getByText("RENTER INQUIRY PREVIEW")).toBeTruthy();
 });
 it("offers negotiation, protections and community options for renters regardless of legal concern",()=>{
  render(<RenewalPage/>);fill({offer:"2010",bedrooms:"2br"});submit();
  expect(screen.getByRole("button",{name:/Negotiate my renewal/})).toBeTruthy();
  expect(screen.getByRole("link",{name:/Check my protections/})).toBeTruthy();
  expect(screen.getByRole("link",{name:/Connect with tenant support/})).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:/Negotiate my renewal/}));
  expect(screen.getByText("Negotiate your renewal")).toBeTruthy();
 });
 it("puts city rent protection first and statewide protection in an expandable section",()=>{
  render(<RenewalPage/>);fill({offer:"3000"});submit();
  fireEvent.click(screen.getByRole("button",{name:"Review protections"}));
  expect(screen.getByText(/Also check statewide protections:/)).toBeTruthy();
  expect(screen.getByText("Your protections")).toBeTruthy();
 });
 it("starts with short legal summary and hides detailed rules until requested",()=>{
  render(<RenewalPage/>);fill({offer:"3000"});submit();
  expect(screen.getByText("Your protections")).toBeTruthy();
  expect(screen.getByRole("button",{name:"Review protections"})).toBeTruthy();
  expect(screen.queryByLabelText("Local rent control coverage")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Review protections"}));
  expect(screen.getByLabelText("Local rent control coverage")).toBeTruthy();
 });
 it("puts tenant connection before the optional summary",()=>{
  const {container}=render(<RenewalPage/>);fill();submit();
  const a=container.querySelector("#moveup-connect"),r=container.querySelector(".v4-report");
  expect(a).toBeTruthy();expect(r).toBeTruthy();
  expect((a?.compareDocumentPosition(r!)??0)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 });
 it("the report only appears after a completed analysis",()=>{
  render(<RenewalPage/>);
  expect(screen.queryByRole("button",{name:"Print / Save as PDF"})).toBeNull();
  fill();submit();
  expect(screen.getByRole("button",{name:"Print / Save as PDF"})).toBeTruthy();
 });
});
