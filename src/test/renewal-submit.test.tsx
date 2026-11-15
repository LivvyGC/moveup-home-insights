import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RenewalPage } from "../routes/index";

afterEach(cleanup);

function fillRenewal() {
  const current=screen.getByLabelText("Current rent / month");
  const offer=screen.getByLabelText("Offered rent / month");
  const date=screen.getByLabelText("New rent takes effect");
  fireEvent.change(current,{target:{value:"2000"}});
  fireEvent.change(offer,{target:{value:"2200"}});
  fireEvent.change(date,{target:{value:"2027-01-09"}});
}

describe("Renewal form launch and submission",()=>{
  it("has a real submit button inside a form",()=>{
    const {container}=render(<RenewalPage/>);
    const button=screen.getByRole("button",{name:"LAUNCH ANALYSIS"});
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.closest("form")).toBe(container.querySelector(".rc-renewal-form"));
  });
  it("launch click calculates entered rents over selected horizon",()=>{
    render(<RenewalPage/>);
    fillRenewal();
    fireEvent.click(screen.getByRole("button",{name:"LAUNCH ANALYSIS"}));
    expect(screen.getByText("+$2,400.00")).toBeTruthy();
    expect(screen.getByText("2027-01-09", {exact:false})).toBeTruthy();
  });
  it("form submission (including Enter behavior) uses the same handler",()=>{
    const {container}=render(<RenewalPage/>);
    fillRenewal();
    const form=container.querySelector("form.rc-renewal-form");
    if(!form)throw Error("Expected renewal form");
    fireEvent.submit(form);
    expect(screen.getByText("+$2,400.00")).toBeTruthy();
  });
  it("requires rent above zero and a valid future date",()=>{
    render(<RenewalPage/>);
    fireEvent.click(screen.getByRole("button",{name:"LAUNCH ANALYSIS"}));
    expect(screen.getByRole("alert").textContent).toMatch(/rent/i);
    fillRenewal();
    fireEvent.change(screen.getByLabelText("New rent takes effect"),{target:{value:"2007-01-09"}});
    fireEvent.click(screen.getByRole("button",{name:"LAUNCH ANALYSIS"}));
    expect(screen.getByRole("alert").textContent).toMatch(/effective date/i);
  });
  it("clears submitted result after changing a core input",()=>{
    render(<RenewalPage/>);
    fillRenewal();
    fireEvent.click(screen.getByRole("button",{name:"LAUNCH ANALYSIS"}));
    expect(screen.getByText("+$2,400.00")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Offered rent / month"),{target:{value:"2300"}});
    expect(screen.queryByText("+$2,400.00")).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"LAUNCH ANALYSIS"}));
    expect(screen.getByText("+$3,600.00")).toBeTruthy();
  });
});
