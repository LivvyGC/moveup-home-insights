import { activeRules, type City, type Rule, type RuleStatus } from "./renewalPolicy";

export type Coverage = "yes" | "no" | "unknown";
export type IncreaseHistory = "none" | "yes" | "unknown";
export type ActionType = "review_notice" | "check_rent_limits" | "check_coverage" | "compare_options" | "review_offer";

export interface LegalIntake {
  city: City;
  currentRent: number;
  offeredRent: number;
  effectiveDate: string;
  stateCoverage: Coverage;
  localCoverage: Coverage;
  priorIncrease: IncreaseHistory;
  noticeDate: string;
}

export interface RuleCheck {
  rule: Rule;
  coverage: Coverage;
  status: RuleStatus;
  exampleMaxRent: number | null;
  abovePublishedStandard: boolean;
  // Published standards do not establish a person's complete legal ceiling.
  canDetermineLegalCeiling: false;
}

export interface RenewalFinding {
  action: ActionType;
  heading: string;
  explanation: string;
  changePerMonth: number;
  increasePercent: number;
  checks: RuleCheck[];
  noticeDays: number | null;
  shortSeattleNotice: boolean;
  needsPriorIncreaseHistory: boolean;
  potentialStandardConcern: boolean;
  actionUrl: string;
  actionName: string;
  eligibilityUrl: string;
  eligibilityName: string;
}

export const officialActions: Record<City, {
  url: string; name: string; eligibilityUrl: string; eligibilityName: string;
  noticeUrl?: string;
}> = {
  "Los Angeles": {
    url: "https://housing.lacity.gov/residents/file-a-rso-complaint",
    name: "LA Housing — RSO complaint guidance",
    eligibilityUrl: "https://housing.lacity.gov/",
    eligibilityName: "Check Los Angeles RSO coverage (ZIMAS guidance)",
  },
  "San Francisco": {
    url: "https://www.sf.gov/tenant-petitions",
    name: "San Francisco Rent Board — tenant petition guidance",
    eligibilityUrl: "https://www.sf.gov/learn-about-san-francisco-rental-laws",
    eligibilityName: "Check San Francisco rent-control eligibility",
  },
  "San Diego": {
    url: "https://www.sandiego.gov/city-attorney/resources/hpu-complaint-form",
    name: "San Diego City Attorney — HPU complaint form",
    eligibilityUrl: "https://oag.ca.gov/rentcaps",
    eligibilityName: "Check California rent-cap coverage",
  },
  "Seattle": {
    url: "https://www.atg.wa.gov/landlord-tenant",
    name: "Washington Attorney General — rent stabilization and complaints",
    eligibilityUrl: "https://www.commerce.wa.gov/housing-policy/hb1217-landlord-resource-center/",
    eligibilityName: "Check Washington rent-cap exemptions",
    noticeUrl: "https://seattle.gov/construction-and-inspections/codes/common-code-questions/housing-cost-increases",
  },
};

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
function daysBetween(from: string, to: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return null;
  const start = Date.parse(from + "T00:00:00Z");
  const end = Date.parse(to + "T00:00:00Z");
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.floor((end - start) / 86400000);
}
export function evaluateRenewal(intake: LegalIntake): RenewalFinding {
  const {
    city,currentRent,offeredRent,effectiveDate,stateCoverage,localCoverage,priorIncrease,noticeDate
  } = intake;
  if (!Number.isFinite(currentRent) || currentRent <= 0 || !Number.isFinite(offeredRent) || offeredRent <= 0) {
    throw new Error("Enter positive, finite rent values.");
  }
  const changePerMonth = round(offeredRent - currentRent);
  const increasePercent = round(100 * changePerMonth / currentRent);
  const checks: RuleCheck[] = activeRules(city, effectiveDate).map(rule => {
    const coverage = rule.type === "city" ? localCoverage : stateCoverage;
    const exampleMaxRent = round(currentRent * (1 + rule.cap_pct / 100));
    return {
      rule,
      coverage,
      // A self-reported coverage answer is NOT verified legal applicability.
      status: coverage === "unknown" ? "depends_on_building_or_tenant" : "unknown",
      exampleMaxRent: coverage === "no" ? null : exampleMaxRent,
      abovePublishedStandard: coverage !== "no" && changePerMonth > 0 &&
        offeredRent > exampleMaxRent + .001,
      canDetermineLegalCeiling: false,
    };
  });
  const potentialStandardConcern = checks.some(c => c.abovePublishedStandard);
  const noticeDays = city === "Seattle" && noticeDate ? daysBetween(noticeDate, effectiveDate) : null;
  const shortSeattleNotice = changePerMonth > 0 && noticeDays !== null && noticeDays < 180;
  const needsPriorIncreaseHistory = potentialStandardConcern && priorIncrease === "unknown";
  const links = officialActions[city];
  const stateOnlyConcern = city !== "Seattle" &&
    checks.some(check => check.rule.type === "statewide" && check.abovePublishedStandard) &&
    !checks.some(check => check.rule.type === "city" && check.abovePublishedStandard);

  let action: ActionType = "review_offer";
  let heading = "Review your renewal options";
  let explanation = "Compare your offer with local asking rents, then check whether changing homes is worthwhile.";
  if (shortSeattleNotice) {
    action = "review_notice";
    heading = "The notice period may be too short";
    explanation = "Seattle requires at least 180 days' written notice for covered housing-cost increases. Confirm when you received the written notice and contact the city for guidance.";
  } else if (potentialStandardConcern) {
    action = "check_rent_limits";
    heading = "Your increase may need a rent-law review";
    explanation = "The offer exceeds at least one published standard for housing that may be covered. Building coverage, prior increases, exceptions and authorized adjustments are not confirmed. This is not a finding of illegality.";
  } else if (changePerMonth > 0 && checks.length && checks.some(c => c.coverage === "unknown")) {
    action = "check_coverage";
    heading = "Check which protections apply";
    explanation = "The published standard alone does not establish your legal maximum. Verify your unit's coverage before accepting an increase as lawful.";
  } else if (changePerMonth < 0) {
    action = "compare_options";
    heading = "Your offered rent is lower";
    explanation = "The offer reduces your monthly rent. You can still compare it with current new-lease prices.";
  } else if (changePerMonth === 0) {
    action = "compare_options";
    heading = "Your rent stays the same";
    explanation = "Compare the renewal with other housing options if you are considering moving.";
  } else {
    action = "compare_options";
    heading = "Review your costs and options";
    explanation = "No specific issue was identified from the information entered. That is not a determination that the increase is lawful.";
  }
  return {
    action,heading,explanation,changePerMonth,increasePercent,checks,
    noticeDays,shortSeattleNotice,needsPriorIncreaseHistory,potentialStandardConcern,
    actionUrl:stateOnlyConcern?"https://oag.ca.gov/tenants":links.url,
    actionName:stateOnlyConcern?"California Attorney General — statewide tenant protections":links.name,
    eligibilityUrl:links.eligibilityUrl,eligibilityName:links.eligibilityName,
  };
}

export function negotiationMessage(city: City, currentRent: number, offeredRent: number): string {
  if (!Number.isFinite(currentRent) || !Number.isFinite(offeredRent)) return "";
  return [
    "Subject: Request to review my proposed lease renewal",
    "",
    "Hello,",
    "I received the proposed renewal at $" + offeredRent.toFixed(2) +
      " per month, compared with my current rent of $" + currentRent.toFixed(2) + ".",
    "Before making a decision, could you confirm the basis for the increase and whether " +
      "any applicable rent stabilization rules, exemptions or prior increases were considered?",
    "I am reviewing my options in " + city + " and would appreciate a written response.",
    "Thank you.",
  ].join("\n");
}
