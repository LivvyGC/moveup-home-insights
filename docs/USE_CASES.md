# MoveUp V4 — Use cases and IPO system documentation

**Product:** MoveUp Renewal Check  
**Reviewed against:** GitHub `main`, November 14, 2026  
**Mission:** Make housing agreements easier to understand and challenge.  
**Demo audience:** Renters in Los Angeles, San Francisco, San Diego, and Seattle; future organizational audience is tenant unions and tenant-support groups.

## Scope, terminology and architecture

- **Implemented:** Present in the V4 React/TypeScript application, even where a real-browser deployment check is still needed.
- **Conditional:** The calculation or screen runs, but cannot conclusively determine a tenant's legal status from the available inputs.
- **Proposed:** Not implemented; an implementation specification, **not** a current product claim.
- **IPO:** Inputs → Processing → Outputs. “Materials” covers source files, government pages, libraries, APIs and infrastructure.
- **Truth rule:** User inputs, attributed dated sources, and labeled assumptions are allowed. Missing values stay unavailable. A city rental benchmark is **not** a building appraisal or a legal maximum.

**Current architecture:** React 19 + TypeScript + TanStack Start/Router. The browser calculates on submitted input using `src/lib/renewalActions.ts` and `src/lib/renewalV4.ts`; the website reads a checked-in JSON market snapshot. It does not require a rent-data API call on each submission. The current flow has no account, payment or case storage. See `docs/DATA_AUDIT.md` and `docs/V4_PRODUCT_SPEC.md`.

## Existing use cases

### UC-01 — Submit a renewal offer

- **Actor / objective:** Renter wants to understand a proposed rent change.
- **Inputs:** City (LA, SF, San Diego or Seattle); bedroom category (1, 2, or other); current monthly rent; offered monthly rent; effective date. An example loader supplies **clearly labeled demonstration inputs**.
- **Processing:** Browser validates positive rent values and a valid non-past effective date; records the submitted values in React state; derives a rent change; clears prior results when primary inputs are edited. Clicking **Check My Offer** or submitting the native form invokes the same handler.
- **Outputs:** Submitted-only analysis, validated offer values, error messages for incomplete/invalid input; no empty report on first load.
- **Materials / APIs:** `src/routes/index.tsx`; React, TypeScript, browser form/date controls. **No external API**.
- **Exceptions:** Blank/invalid rent or date → validation message, no analysis. Bedrooms outside supported benchmarks still permit a renewal calculation but trigger an unavailable market benchmark.
- **Status:** **Implemented.** Browser-level manual QA remains a separate release check.

### UC-02 — Compare the offer with city new-lease rent

- **Actor / objective:** Renter wants to know whether their offer is above or below a comparable city-level rent estimate.
- **Inputs:** Submitted city, bedroom count and offered monthly rent; dated Apartment List 1BR/2BR rent benchmark.
- **Processing:** Read `src/data/rentMarket.snapshot.json`; select the exact city and bedroom category. Calculate `offer - benchmark` and `100 × (offer - benchmark) / benchmark`; place both markers on a meter. Preserve market comparison independently from legal screening. Date-age check uses the October 2026 observation and a 45-day warning threshold.
- **Outputs:** Dollar and percent difference, offer-versus-market meter, source name and data month; no market figure for unsupported categories. Offer above market **does not** establish illegality.
- **Materials / APIs:** Founder-uploaded `Apartment_List_Rent_Estimates_2026_10.csv`; local JSON snapshot; `src/lib/renewalV4.ts`; `src/lib/renewalCalculator.ts` freshness utility. Source: https://www.apartmentlist.com/research/category/data-rent-estimates . **No runtime API**. Reproducible refreshing from a new source file still needs a dedicated import pipeline.
- **Exceptions:** Studio/3+ bedrooms, missing or stale benchmark → display “Not available” or a data-age warning; do not substitute another unit size.
- **Status:** **Implemented**, constrained to 4 cities × 1BR/2BR.

### UC-03 — Calculate the cost of a renewal

- **Actor / objective:** Renter wants to see how accepting the offered rent changes their costs.
- **Inputs:** Current rent, offered rent; explicit adjustable comparison period (default 12 months).
- **Processing:** `monthlyChange = offeredRent - currentRent`; `periodChange = monthlyChange × months`. This assumes fixed monthly amounts solely to compare the two entered scenarios; it **does not forecast future market rents**.
- **Outputs:** Monthly difference, change over the chosen duration, clear increase / decrease / unchanged wording, corresponding values in printable summary.
- **Materials / APIs:** `src/routes/index.tsx`; TypeScript arithmetic; renter input. **No API**.
- **Exceptions:** Missing rents → no cost result; negative difference → savings, not “added rent”; changing the comparison period updates the total.
- **Status:** **Implemented**.

### UC-04 — Screen rent protections without certifying legality

- **Actor / objective:** Renter wants to know whether an official rent-limit standard or notice requirement may be relevant.
- **Inputs:** City, effective date, current and offered rents. **When relevant:** renter-reported state/local coverage; prior increases in the last 12 months; written-notice received date for Seattle.
- **Processing:** `activeRules()` selects effective-dated records; `evaluateRenewal()` compares the offer against published **conditional standards**, keeps state/local rules separate, and checks Seattle notice timing when entered. `assessMarketOffer()` keeps an independently derived legal-screen state; possible legal concern takes priority in the visual state. Do **not** assume coverage or certify a complete lawful ceiling.
- **Outputs:** Applicable-date published standards, unresolved eligibility questions, potential-review/unknown/no-specific-issue wording, official source links; explicit educational/not-legal-advice limitation.
- **Materials / APIs:** `src/lib/renewalPolicy.ts`, `src/lib/renewalActions.ts`, `src/lib/renewalV4.ts`. California AG: https://oag.ca.gov/rentcaps ; Washington Commerce: https://www.commerce.wa.gov/housing-policy/hb1217-landlord-resource-center/ ; city-specific official rent-board/rent-control sources. **No legal API; curated, dated government pages must be periodically reverified**.
- **Exceptions:** Unknown coverage, property jurisdiction, building exemptions, banked/authorized increases or missing historical rent notices → **do not label legally compliant, unlawful or verified applicable**. City selection alone is not confirmation of the property’s municipal jurisdiction.
- **Status:** **Implemented, conditional**; not legal advice or a legal determination.

### UC-05 — Identify a safe next step

- **Actor / objective:** Renter wants to request clarification, negotiate, or find relevant official help.
- **Inputs:** Output of UC-04, user's rent values, city; optional Seattle notice date.
- **Processing:** `evaluateRenewal()` routes potentially relevant cap/notice issues to official government guidance; `negotiationMessage()` generates a neutral text template from the renter's amounts. Above-market pricing alone **does not** route to a legal complaint.
- **Outputs:** One primary next-action link, optional official agency page, copyable landlord inquiry; guidance to preserve written notice/lease evidence where needed.
- **Materials / APIs:** `src/lib/renewalActions.ts`; official routes such as LA Housing (https://housing.lacity.gov/residents/file-a-rso-complaint), SF Rent Board (https://www.sf.gov/tenant-petitions), San Diego City Attorney (https://www.sandiego.gov/city-attorney/resources/hpu-complaint-form), Washington AG (https://www.atg.wa.gov/landlord-tenant), Seattle notice guidance (https://seattle.gov/construction-and-inspections/codes/common-code-questions/housing-cost-increases). Browser clipboard support for copying. **No external form submission API**.
- **Exceptions:** Rules/agency links may change; verify the specific property’s jurisdiction. No automated enforcement filing, legal demand, or guaranteed outcome.
- **Status:** **Implemented, informational**.

### UC-06 — Print a tenant-support summary

- **Actor / objective:** Renter wants a concise record to keep or share with a tenant organization.
- **Inputs:** Submitted renewal values, selected bedroom benchmark, source month, cost change, conditional legal findings, and next-action links.
- **Processing:** The React report uses the same values as the displayed assessment; CSS print rules format the content; the browser invokes `window.print()`.
- **Outputs:** Print preview / locally saved PDF, including user-input amounts, market comparison, source dates, conditional rule references and a nonlegal-certification warning.
- **Materials / APIs:** `src/routes/index.tsx`, `src/styles.css`, browser Print/Save PDF; local snapshot and government URLs. **No account, PDF-generation service, payment API, file upload or server case storage**.
- **Exceptions:** The renter chooses whether to print, save or share. The browser controls PDF output; one-page layout and mobile/print screenshots still require visual acceptance tests.
- **Status:** **Implemented**.

## Proposed use cases — NOT implemented

### UC-07 — Review an uploaded lease/renewal agreement

- **Actor / objective:** Renter wants help finding the financial and notice terms in a document.
- **Inputs:** User-selected PDF/image/document; explicit consent; optional manually corrected extracted terms.
- **Processing:** Validate file type/size; extract text locally if feasible or through a separately approved processor; identify rent, fees, dates and notice clauses; display a field-by-field review screen; require renter confirmation before use in the current deterministic calculators. **Do not infer legality from AI extraction.**
- **Outputs:** Confirmed structured agreement fields, highlighted missing terms, optional downloadable evidence checklist.
- **Materials / APIs needed:** PDF/text parser, secure client-side processing where possible; **optional** document extraction/OCR provider only if local extraction fails and its privacy/data-handling terms are approved. No provider chosen. Encryption and deletion/retention rules required before any server upload.
- **Exceptions:** Illegible scans, sensitive personal details, handwritten edits, unsupported formats → manual entry or “unreadable,” never fabricated values.
- **Status:** **Proposed. Requires privacy and technical validation.**

### UC-08 — Hand off a case to a tenant union with consent

- **Actor / objective:** Renter wants to share an organized renewal concern with a tenant-support organization.
- **Inputs:** Reviewed UC-06 report; optional verified UC-07 fields; renter-selected recipient; explicit consent and chosen contact details.
- **Processing:** Generate a minimal, redacted case packet; show the exact content and recipient; obtain consent; either download a local file for the renter to deliver or use an approved organization intake endpoint. Do not silently transmit documents.
- **Outputs:** Shareable case packet, acknowledged handoff **only if a receiver confirms delivery**, or clear download instructions.
- **Materials / APIs needed:** Existing printable report; PDF/JSON export; partner-provided secure intake form, email integration or API **only after partner agreement**. No partner integration is currently connected.
- **Exceptions:** No partner or consent → local export only; delivery failure → show failure, not success. Avoid sharing identifiable cases or tenancy information without express permission.
- **Status:** **Proposed; not an existing send/submit feature.**

### UC-09 — Help a tenant organization triage repeated renter cases (B2B SaaS)

- **Actor / objective:** Organizer wants less repetitive intake and a consistent way to review renter evidence.
- **Inputs:** Only tenant-consented UC-08 case packets; organization-defined intake fields, staff roles and review states.
- **Processing:** Validate packet completeness, assign staff review, classify the *type of issue* without declaring law violations, and support manual case follow-up; enforce member access controls and documented retention/deletion policy. Aggregate only with privacy safeguards.
- **Outputs:** Intake queue, missing-document prompts, standardized case summary, staff review status; no AI enforcement or automatic landlord complaints.
- **Materials / APIs needed:** **Future** authenticated backend/database, role-based permissions, consent logs, encryption, retention/deletion controls, audit logging and an agreed organization workflow. None exist in the current MVP. Pricing/customer interest remain untested.
- **Exceptions:** No consent, missing documents or uncertain jurisdiction → hold case for staff review. Never expose other tenants’ information.
- **Status:** **Proposed B2B SaaS**, contingent on real tenant-organization pilot feedback.

## Use-case dependency flow

```text
RENTER
  UC-01 Enter offer
    ├─ UC-02 Compare to Apartment List benchmark
    ├─ UC-03 Calculate monthly/period difference
    └─ UC-04 Screen conditional rent protections
          ↓
        UC-05 Official next steps / landlord inquiry
          ↓
        UC-06 Print tenant-support summary
          ↓ Optional future products, NOT in current app
        UC-07 Document review
        UC-08 Consented organization handoff
        UC-09 Organization case management
```

## Materials inventory and API answer

| Resource | Used for | Integration today | Notes |
|---|---|---|---|
| Renter-entered renewal data | UC-01, UC-03–06 | Browser form | No user database |
| Apartment List city rent estimates (October 2026) | UC-02, UC-06 | Checked-in JSON snapshot derived from founder CSV | 4 cities, 1BR/2BR; founder confirmed **demo** permission; unrestricted commercial redistribution **not** independently established |
| Zillow ZORI (September 2026) | Source provenance / independent research | In snapshot, **not a second headline benchmark in V4** | No runtime API needed; research/copyright terms still relevant |
| Official state and municipal housing resources | UC-04–06 | Curated dated rules + outbound links | Website pages, **not a live legal API**; reverify rules/links |
| React, TypeScript, TanStack Start | UC-01–06 | Already in repo | No extra paid service required |
| Browser print and clipboard | UC-05–06 | Browser capabilities | No PDF SaaS or mail service |
| PDF parsing/OCR | UC-07 | Not installed as a feature | Select only after document/privacy pilot |
| Tenant-union receiving system | UC-08 | Not connected | Partner-specific integration must be agreed |
| Auth, database, role permissions | UC-09 | Not present for renter cases | Only build after organizational demand is established |

## Acceptance checks and truthful limitations

1. **UC-01:** All required inputs validate; button and Enter run the same submission; no results before submission.
2. **UC-02:** 1BR/2BR benchmarks match the exact city; other bedroom sizes show unavailable; market differences are deterministic and sourced.
3. **UC-03:** Rent decrease shows savings; changing the comparison period changes the period total, not the actual monthly difference.
4. **UC-04:** Legal concerns can override favorable market price; missing coverage is not declared lawful; local and statewide standards are not silently combined.
5. **UC-05:** Above-market alone never triggers a complaint; only relevant government links are offered.
6. **UC-06:** Report contains accurate user inputs, observation month, sources, uncertainty and next-action link. Print layout must be checked in an actual browser.
7. **UC-07–09:** **No completion claim** until the corresponding functionality and privacy controls actually exist.

Existing automated tests are in `src/lib/renewalV4.test.ts`, `src/lib/renewalActions.test.ts`, and `src/test/renewal-submit.test.tsx`. Passing unit tests does not prove the public Lovable deployment, government links, mobile display, accessibility or print output is currently correct.

## Suggested hackathon demonstration

A renter enters an illustrative Los Angeles two-bedroom renewal, sees the Apartment List October 2026 benchmark, reviews conditional protection questions, and prints a case summary. The presenter then explains that **tenant unions are the proposed B2B customer**, because consistent intake can reduce repeated questioning. Do not demo document uploads, case transmission, accounts, AI prediction or payment as if implemented.
