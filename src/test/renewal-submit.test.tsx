import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {RenewalPage} from "../routes/index";
afterEach(cleanup);
function fill(){
 fireEvent.change(screen.getByLabelText("Current rent / month"),{target:{value:"2000"}});
 fireEvent.change(screen.getByLabelText("Offered rent / month"),{target:{value:"2200"}});
 fireEvent.change(screen.getByLabelText("New rent takes effect"),{target:{value:"2027-01-09"}});
}
function submit(){fireEvent.click(screen.getByRole("button",{name:"CHECK MY OFFER"}));}
describe("Renewal Check guided submission",()=>{
 it("initially shows only essential intake, not results",()=>{
  render(<RenewalPage/>);
  expect(screen.getByRole("button",{name:"CHECK MY OFFER"})).toBeTruthy();
  expect(screen.queryByText("03 / NEXT ACTION")).toBeNull();
  expect(screen.queryByText("Explore buying")).toBeNull();
 });
 it("validates rent and effective date",()=>{
  render(<RenewalPage/>);submit();
  expect(screen.getByRole("alert").textContent).toMatch(/rent/i);
  fill();fireEvent.change(screen.getByLabelText("New rent takes effect"),{target:{value:"2007-01-09"}});submit();
  expect(screen.getByRole("alert").textContent).toMatch(/date/i);
 });
 it("the button and native form submission share the same analysis",()=>{
  const {container}=render(<RenewalPage/>);fill();
  const form=container.querySelector("form");
  expect(screen.getByRole("button",{name:"CHECK MY OFFER"}).getAttribute("type")).toBe("submit");
  if(!form)throw Error("Form missing");
  fireEvent.submit(form);
  expect(screen.getByText("03 / NEXT ACTION")).toBeTruthy();
  expect(screen.getByText("04 / TENANT PROTECTIONS")).toBeTruthy();
 });
 it("shows conditional concern and correct LA route for potentially excessive increase",()=>{
  render(<RenewalPage/>);fill();
  fireEvent.change(screen.getByLabelText("Offered rent / month"),{target:{value:"3000"}});
  submit();
  expect(screen.getByText("Your increase may need a rent-law review")).toBeTruthy();
  const link=screen.getByRole("link",{name:/LA Housing — RSO complaint guidance/i});
  expect(link.getAttribute("href")).toContain("housing.lacity.gov");
  expect(screen.getAllByText(/not proof the increase is unlawful/i).length).toBeGreaterThan(0);
 });
 it("changing a primary input clears previous results",()=>{
  render(<RenewalPage/>);fill();submit();
  expect(screen.getByText("03 / NEXT ACTION")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Offered rent / month"),{target:{value:"2300"}});
  expect(screen.queryByText("03 / NEXT ACTION")).toBeNull();
 });
 it("buying inputs appear only after selecting buying",()=>{
  render(<RenewalPage/>);fill();submit();
  expect(screen.queryByLabelText("Home purchase price")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Explore buying"}));
  expect(screen.getByLabelText("Home purchase price")).toBeTruthy();
 });
});
