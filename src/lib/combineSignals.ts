// Prototype decision rules, not validated forecasts.
// City tax/insurance values are illustrative assumptions.
export type Direction = "BUY" | "WAIT" | "NEUTRAL";
export type Verdict = "BUY" | "WAIT" | "MIXED";
export type Agreement = "agree" | "conflict" | "single" | "no_edge";

export interface CityData {
  city: string;
  state: string;
  property_tax_rate: number;
  annual_insurance: number;
}

export interface CombineInputs {
  signal_a_probability: number;
  signal_b_probability: number;
  signal_a_estimate: boolean;
  signal_b_estimate: boolean;
  timeline_months: number;
  loan_amount: number;
  city_data?: CityData | null;
}

export interface CombineResult {
  verdict: Verdict;
  signal_agreement: Agreement;
  signal_a_direction: Direction;
  signal_b_direction: Direction;
  current_mortgage: number;
  mortgage_after_cut: number;
  monthly_savings: number;
  property_tax_monthly: number;
  insurance_monthly: number;
  total_monthly_now: number;
  summary: string;
}

export const DEFAULT_CITY: CityData = {
  city: "Los Angeles", state: "CA", property_tax_rate: 0.012, annual_insurance: 1800,
};
export const CURRENT_RATE = 0.068;
export const AFTER_CUT_RATE = 0.0655;
const TERM_MONTHS = 360;
const DOWN_PAYMENT_SHARE = 0.2;
const money = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function directionFor(probability: number, timelineMonths: number): Direction {
  if (!Number.isFinite(probability) || probability < 0 || probability > 100 ||
      !Number.isFinite(timelineMonths) || timelineMonths <= 0) throw new Error("Invalid inputs");
  if (timelineMonths < 3) return "BUY";
  if (probability > 55) return "WAIT";
  if (probability < 45) return "BUY";
  return "NEUTRAL";
}

export function combineDirections(a: Direction, b: Direction):
    { verdict: Verdict; agreement: Agreement } {
  if (a === b) return a === "NEUTRAL"
    ? { verdict: "MIXED", agreement: "no_edge" }
    : { verdict: a, agreement: "agree" };
  if (a === "NEUTRAL") return { verdict: b as Verdict, agreement: "single" };
  if (b === "NEUTRAL") return { verdict: a as Verdict, agreement: "single" };
  return { verdict: "MIXED", agreement: "conflict" };
}

export function mortgagePayment(principal: number, annualRate: number): number {
  if (!Number.isFinite(principal) || principal <= 0 ||
      !Number.isFinite(annualRate) || annualRate < 0) throw new Error("Invalid mortgage inputs");
  const r = annualRate / 12;
  return r === 0 ? principal / TERM_MONTHS
    : (principal * r) / (1 - Math.pow(1 + r, -TERM_MONTHS));
}

function describe(name: string, d: Direction): string {
  return d === "NEUTRAL" ? name + " signal shows no clear direction" : name + " signal points to " + d;
}

export function combineSignals(input: CombineInputs): CombineResult {
  const city = input.city_data ?? DEFAULT_CITY;
  const pa = input.signal_a_probability, pb = input.signal_b_probability;
  const t = input.timeline_months, loan = input.loan_amount;
  const bad = (v: number) => !Number.isFinite(v);
  if (bad(pa) || pa < 0 || pa > 100 || bad(pb) || pb < 0 || pb > 100 ||
      bad(t) || t <= 0 || bad(loan) || loan <= 0 ||
      typeof input.signal_a_estimate !== "boolean" || typeof input.signal_b_estimate !== "boolean" ||
      bad(city.property_tax_rate) || city.property_tax_rate < 0 ||
      bad(city.annual_insurance) || city.annual_insurance < 0) {
    throw new Error("Invalid inputs");
  }
  const da = directionFor(pa, t), db = directionFor(pb, t);
  const { verdict, agreement } = combineDirections(da, db);
  const now = mortgagePayment(loan, CURRENT_RATE);
  const after = mortgagePayment(loan, AFTER_CUT_RATE);
  const tax = loan / (1 - DOWN_PAYMENT_SHARE) * city.property_tax_rate / 12;
  const insurance = city.annual_insurance / 12;
  const note = input.signal_a_estimate && input.signal_b_estimate ? ", based on estimates"
    : input.signal_a_estimate || input.signal_b_estimate ? ", with one estimated signal" : "";
  return {
    verdict,
    signal_agreement: agreement,
    signal_a_direction: da,
    signal_b_direction: db,
    current_mortgage: money(now),
    mortgage_after_cut: money(after),
    monthly_savings: money(now - after),
    property_tax_monthly: money(tax),
    insurance_monthly: money(insurance),
    total_monthly_now: money(now + tax + insurance),
    summary: describe("Fed rate-cut", da) + ", while the " +
      describe("mortgage-rate-below-6%", db) + note + ".",
  };
}
