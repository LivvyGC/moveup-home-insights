import type { Coverage, IncreaseHistory, RenewalFinding } from "./renewalActions";
import type { City } from "./renewalPolicy";
import type { MarketAssessment } from "./renewalV4";

export type CaseSource = { title: string; rate: number; from: string; to: string; url: string; coverage: Coverage };
export type TenantCaseRecord = {
  city: City;
  bedrooms: string;
  currentRent: number;
  offeredRent: number;
  effectiveDate: string;
  periodMonths: number;
  benchmark: number | null;
  benchmarkMonth: string;
  marketDifference: number | null;
  marketDifferencePct: number | null;
  legalStatus: string;
  nextAction: string;
  nextActionUrl: string;
  stateCoverage: Coverage;
  localCoverage: Coverage;
  priorIncrease: IncreaseHistory;
  noticeReceived: string;
  rules: CaseSource[];
  sourceUrl: string;
};
export const coverageLabel = (value: Coverage): string => value === "yes"
  ? "Reported covered — not independently verified"
  : value === "no"
    ? "Reported exempt — not independently verified"
    : "Not sure / unverified";
export const increaseLabel = (value: IncreaseHistory): string => value === "yes"
  ? "Yes — earlier increases reported"
  : value === "none" ? "No earlier increases reported" : "Not sure";
export const currency = (n:number) => new Intl.NumberFormat("en-US", {
  style: "currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:2,
}).format(n);
export const signedCurrency = (n:number) => (n>0?"+":"") + currency(n);

export function buildTenantCase(input: {
  city: City; bedrooms: string; currentRent: number; offeredRent: number;
  effectiveDate: string; periodMonths: number; benchmark: number|null; benchmarkMonth: string;
  assessment: MarketAssessment; finding: RenewalFinding; legalStatus: string;
  stateCoverage:Coverage; localCoverage:Coverage; priorIncrease:IncreaseHistory;
  noticeReceived:string; sourceUrl:string; supportUrl:string;
}): TenantCaseRecord {
  return {
    city:input.city,bedrooms:input.bedrooms,currentRent:input.currentRent,
    offeredRent:input.offeredRent,effectiveDate:input.effectiveDate,
    periodMonths:input.periodMonths,benchmark:input.benchmark,
    benchmarkMonth:input.benchmarkMonth,
    marketDifference:input.assessment.difference,
    marketDifferencePct:input.assessment.differencePct,
    legalStatus:input.legalStatus,nextAction:input.finding.heading,
    nextActionUrl:input.supportUrl,
    stateCoverage:input.stateCoverage,localCoverage:input.localCoverage,
    priorIncrease:input.priorIncrease,noticeReceived:input.noticeReceived,
    sourceUrl:input.sourceUrl,
    rules:input.finding.checks.map(c=>({
      title:c.rule.title, rate:c.rule.cap_pct,
      from:c.rule.effective_from,to:c.rule.effective_to,
      coverage:c.coverage,url:c.rule.source_url,
    })),
  };
}
