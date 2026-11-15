import type { RenewalFinding } from "./renewalActions";

export type MarketPosition = "below" | "at" | "above" | "unavailable";
export type LegalScreen = "possible_issue" | "needs_information" | "screened";
export type OfferTone = "green" | "yellow" | "orange" | "neutral";

export interface MarketAssessment {
  difference: number | null;
  differencePct: number | null;
  marketPosition: MarketPosition;
  legalScreen: LegalScreen;
  tone: OfferTone;
  headline: string;
  explanation: string;
  // Scale and marker placement are derived from real source values and the user's offer.
  axisMax: number | null;
  benchmarkPosition: number | null;
  offerPosition: number | null;
}

const rounded = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function assessMarketOffer(
  offeredRent: number,
  benchmark: number | null,
  finding: RenewalFinding,
  noticeDateEntered: boolean,
): MarketAssessment {
  if (!Number.isFinite(offeredRent) || offeredRent <= 0) {
    throw new Error("Offered rent must be positive.");
  }
  const possibleIssue = finding.potentialStandardConcern || finding.shortSeattleNotice;
  const needsInformation = finding.changePerMonth > 0 && (
    finding.checks.length === 0 ||
    finding.checks.some((c) => c.coverage === "unknown") ||
    // Written-notice checks for Seattle require a notice-received date.
    (finding.checks[0]?.rule.jurisdiction === "Washington State" && !noticeDateEntered) ||
    finding.needsPriorIncreaseHistory
  );
  const legalScreen: LegalScreen = possibleIssue
    ? "possible_issue"
    : needsInformation
      ? "needs_information"
      : "screened";

  const supported = benchmark !== null && Number.isFinite(benchmark) && benchmark > 0;
  const difference = supported ? rounded(offeredRent - benchmark) : null;
  const differencePct = supported ? rounded((100 * (offeredRent - benchmark)) / benchmark) : null;
  const marketPosition: MarketPosition = !supported ? "unavailable" : difference! > 0 ? "above" : difference! < 0 ? "below" : "at";
  const tone: OfferTone = legalScreen === "possible_issue" ? "orange"
    : legalScreen === "needs_information" || marketPosition === "unavailable" ? "neutral"
      : marketPosition === "above" ? "yellow" : "green";

  // Lead with what the user can verify. Legal screening is a separate finding.
  const headline = marketPosition === "unavailable"
    ? "Review your proposed renewal"
    : marketPosition === "above"
      ? "Your offer is above the city benchmark"
      : marketPosition === "at"
        ? "Your offer matches the city benchmark"
        : "Your offer is below the city benchmark";

  const explanation = marketPosition === "unavailable"
    ? "We do not have a bedroom-matched estimate for this unit type."
    : marketPosition === "above"
      ? "Your offer exceeds the available citywide new-lease estimate. You can still negotiate regardless of legal status."
      : "Your offer is at or below the citywide new-lease estimate. You can still ask questions, negotiate, or seek support.";

  // Add 10% headroom without a fictitious marked price/tick; the scale is explicitly
  // shown in the visual accessibility description.
  const axisMax = supported ? Math.ceil((Math.max(offeredRent,benchmark) * 1.1) / 100) * 100 : null;
  return {
    difference,differencePct,marketPosition,legalScreen,tone,headline,explanation,
    axisMax,
    benchmarkPosition: axisMax && supported ? 100 * benchmark / axisMax : null,
    offerPosition: axisMax ? 100 * offeredRent / axisMax : null,
  };
}
