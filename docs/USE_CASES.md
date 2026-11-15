# MoveUp — Use Cases (Renewal Check V4)

**Project goal:** Democratize housing agreements by helping renters understand renewal offers and prepare evidence for tenant-support organizations.

**Scope:** The current V4 React/TypeScript website. Status labels distinguish **Implemented**, **Partial/conditional**, and **Proposed** functionality. This document describes the repository as inspected November 14, 2026; it does not certify the Lovable public deployment.

**Actors:** Renter (primary); tenant union / tenant-support worker (future recipient of a renter-authorized report); research data maintainer (refreshes source files).

## System context and material inventory

| Material or system | What it supplies | Access method | Current use |
|---|---|---|---|
| Apartment List Rent Estimates, October 2026 | City-wide 1-bedroom and 2-bedroom new-lease benchmarks for Los Angeles, San Francisco, San Diego, and Seattle | Founder-uploaded CSV → checked-in `src/data/rentMarket.snapshot.json` | Primary market meter; **not an API or a live feed** |
| Apartment List monthly rent growth CSV | Month-over-month rent growth observations | Founder-uploaded CSV; metadata in snapshot | Source inventory only; no live trend chart |
| Zillow Observed Rent Index (ZORI), September 2026 | City-wide asking-rent index and 12-month change | Founder-uploaded CSV → same snapshot | Retained for research/context; intentionally **not shown as a second headline price** |
| Government rent rules | Dated statewide/local published cap standards and applicability conditions | Curated `src/lib/renewalPolicy.ts` records with official source URLs and last verification date | Conditional screening; no guaranteed lawful maximum |
| Government tenant resources | Official eligibility, petition, complaint and guidance pages | Curated `src/lib/renewalActions.ts` URLs | Contextual next-step link; no filing integration |
| Browser user input | City, bedrooms, current/offered rent, effective date; follow-up coverage, rent history, Seattle notice date | React form state | Per-session analysis; no login or case database |
| Browser print capability | Save printable summary to PDF or printer | `window.print()` and print stylesheet | User-initiated report export |
| Mortgage and Zillow home-value modules | Historical homebuyer features | Existing code, not invoked by V4 homepage | **Out of current workflow** |

**Licensing boundary:** Founder confirmed Apartment List permission for a hackathon demo. Broader commercial reproduction or resale permissions have not been independently established. The raw uploaded rent CSVs are not published in this repository. Research observations are time-stamped snapshots, not automatically refreshed data.

---

## UC-01 — Check a renewal offer

**Status:** Implemented.

**Short description:** A renter enters the facts of a proposed lease renewal to start an analysis.

- **Inputs:** One of the four supported cities; bedroom category (1, 2, or other); current rent per month; offered rent per month; new rent effective date.
- **Processing:** React validates positive numeric rents and a valid effective date that is today or later; submission freezes the inputs used for the current analysis. Editing an input clears old results. Enter key and the submit button trigger the same path.
- **Outputs:** The analyzed renewal summary, or a specific validation message. The page shows no analysis/results until successful submission.
- **Materials/dependencies:** `src/routes/index.tsx`; React and TanStack Router; browser date. **No external API.**
- **Exception:** Unsupported city cannot be selected; unsupported bedroom categories remain allowed but produce an unavailable bedroom-matched market benchmark.

## UC-02 — Calculate the financial change in the offer

**Status:** Implemented.

**Short description:** Tell a renter exactly how much more or less the offered rent would cost compared with their current rent.

- **Inputs:** Current monthly rent, offered monthly rent, adjustable comparison period (default **12 months**).
- **Processing:** Monthly difference = offered − current; period difference = monthly difference × selected months. Classify increase, no change, or decrease without forecasting future rent.
- **Outputs:** Monthly dollar change, same-period total difference, rent-change wording; clearly marked calculation based on renter inputs.
- **Materials/dependencies:** V4 page arithmetic in `src/routes/index.tsx`; browser state. **No market dataset or API.**
- **Assumption:** Both rents remain constant over the selected period; the current-rate comparison is hypothetical, not an offer to continue paying the old rate.

## UC-03 — Compare offered rent with the city market

**Status:** Implemented for 1- and 2-bedroom categories.

**Short description:** Position the renter's offer against an observed **new-lease city benchmark** without implying a unit-specific appraisal.

- **Inputs:** City, bedroom category, offered monthly rent.
- **Processing:** Look up `apartmentListBedrooms[1br | 2br].typicalRent` in the checked-in snapshot. Compute dollar difference = offered − benchmark and percentage = difference ÷ benchmark × 100. Derive both meter marker positions from the two actual values; no score or arbitrary market-risk probability. Display snapshot month and data-age warning when observation is more than 45 days old.
- **Outputs:** One offer-versus-market meter, benchmark and offered dollars, absolute and percentage difference, source month and attribution. Unsupported unit size → **Not available**, never replaced with an overall-rent estimate.
- **Materials/dependencies:** `src/data/rentMarket.snapshot.json`, `src/lib/renewalV4.ts`, `src/lib/renewalCalculator.ts` (`isStale`); original source landing page: https://www.apartmentlist.com/research/category/data-rent-estimates. **No runtime API.**
- **Limit:** Apartment List measures city new leases, not this specific unit or landlord's proposed renewal. Zillow ZORI is not averaged into the benchmark.

## UC-04 — Screen potentially applicable rent rules

**Status:** Partial/conditional — screening is implemented, legal eligibility is **not** established.

**Short description:** Identify whether a proposed increase may warrant an official rent-law review.

- **Inputs:** City, effective date, current and offered rent, self-reported state/local coverage; previous increases (if a concern arises); Seattle written notice receipt date (when applicable).
- **Processing:** Select policy records effective on the entered date; compare the proposed increase with **each published standard independently**. Check conditional coverage and, for Seattle, compare notice and effective dates against the published notice period. Never certify legal applicability or combine state/local rates into a guaranteed legal ceiling.
- **Outputs:** Individual policy standards, conditional applicability, possible rule/notice concern or unknown status, government URLs, and plainly stated uncertainty.
- **Materials/dependencies:** `src/lib/renewalPolicy.ts`, `src/lib/renewalActions.ts`, official California AG (https://oag.ca.gov/rentcaps), Washington Commerce (https://www.commerce.wa.gov/housing-policy/hb1217-landlord-resource-center/), plus linked city agencies. **Curated government web pages; no government API.**
- **Limit:** City selection does not verify municipal jurisdiction; building type, age, exemptions, past increases, authorized adjustments, and notice facts may be missing. **Not legal advice or a legality verdict.**

## UC-05 — Explain the result using market and legal context

**Status:** Implemented with conservative states.

**Short description:** Provide one understandable result without reducing legal or financial risk to an invented score.

- **Inputs:** UC-03 market comparison (or missing benchmark), UC-04 legal screening, renter's monthly rent change.
- **Processing:** Combine two **separate** findings for presentation. Potential rule/notice issue → orange. Missing legal facts or missing benchmark → neutral. Otherwise above city benchmark → yellow; at/below benchmark → green. A price below market does **not** imply the agreement is legal; market position alone cannot trigger legal enforcement.
- **Outputs:** Plain-language headline, semantic result color, brief explanation, single decisive rent-change amount.
- **Materials/dependencies:** `src/lib/renewalV4.ts` and `src/styles.css`; results from UC-03/UC-04. **No model, AI confidence, or API.**
- **Limit:** Color communicates screening state, not a certified judgment of fairness, legality, or property value.

## UC-06 — Give the renter an official next step

**Status:** Implemented as guidance links; no external submission.

**Short description:** Direct the renter toward an official resource matching the possible issue and selected jurisdiction.

- **Inputs:** Legal screening/action type, city, potential notice concern and self-reported eligibility facts.
- **Processing:** The action router chooses official government guidance, eligibility resources or complaint/petition information. A rent offer merely above the market benchmark must **not** trigger a legal complaint.
- **Outputs:** One contextual official link, an explanation of what to verify, and a reminder to keep lease and notice evidence when relevant.
- **Materials/dependencies:** `src/lib/renewalActions.ts`; LA Housing Department, SF Rent Board, San Diego City Attorney, Washington Attorney General and Seattle housing rules. **Standard outbound HTTPS links; no agency API.**
- **Limit:** The site does not submit complaints, guarantee eligibility, verify addresses, or replace professional advice. Official URLs and procedures require periodic rechecking.

## UC-07 — Prepare a neutral landlord inquiry

**Status:** Implemented.

**Short description:** Help a renter request written clarification without falsely claiming a violation.

- **Inputs:** City, current rent, offered rent.
- **Processing:** Insert validated input amounts into a fixed neutral message template. The user can inspect and copy the text; no AI generation, automatic email or contact with a landlord.
- **Outputs:** Read-only draft asking the landlord to explain the basis of the increase and relevant protections.
- **Materials/dependencies:** `negotiationMessage()` in `src/lib/renewalActions.ts`; browser Clipboard API when available. **No email/SMS integration.**
- **Limit:** The draft is not a statutory notice, legal demand or proof of dispute.

## UC-08 — Export a tenant-support summary

**Status:** Implemented as browser print/save-to-PDF.

**Short description:** Give a renter a concise record to share voluntarily with a tenant union, counselor or legal-aid organization.

- **Inputs:** Confirmed renter inputs; computed changes; available market benchmark; the legal screening status and official source links; adjustable period.
- **Processing:** Format the results, source dates, eligibility uncertainty and next action in the printable page section. The browser's print function handles PDF saving.
- **Outputs:** Print-ready renewal summary, including incomplete/unknown conditions; no account, payment or case submission.
- **Materials/dependencies:** `src/routes/index.tsx`, print rules in `src/styles.css`, browser `window.print()`. **No PDF-rendering API, external storage or union integration.**
- **Limit:** Manual sharing is the renter's choice; the report does not certify the legal findings. Print layout requires visual QA on target browsers.

## UC-09 — Maintain market evidence and source freshness

**Status:** Partial — dated snapshots and warnings are implemented; automatic refresh is **not**.

**Short description:** Keep rent figures traceable and make old observations visible.

- **Inputs:** Authorized Apartment List source CSVs and date/month metadata; source URL and digest; optional separate Zillow ZORI research CSV.
- **Processing:** Validate city and unit-type coverage, normalize raw data to the small city snapshot, retain source dates, and recompute the 45-day freshness flag. **A repeatable Apartment List refresh/import pipeline is still to be implemented**; existing ZHVI scripts are not a substitute for one.
- **Outputs:** Updated attributed JSON dataset, missing-data alerts, freshness information, provenance audit.
- **Materials/dependencies:** `src/data/rentMarket.snapshot.json`, `docs/DATA_AUDIT.md`, `data/raw/README.md`, Apartment List research downloads; Zillow Research (https://www.zillow.com/research/data/) remains a secondary source. **Downloadable CSV files, not assumed APIs.**
- **Limit:** Snapshot month may lag real time; historical raw rows are not in the repository. Permission for the hackathon demo does not establish unrestricted commercial use.

---

## Proposed tenant-union use cases — **not implemented**

These are commercialization hypotheses, not current product claims.

### UC-10 — Renter-authorized union case handoff

- **Short description:** Let a renter voluntarily send a structured renewal review to a chosen tenant-support organization.
- **Inputs:** Renter-approved UC-08 report, contact preference, selected organization, explicit consent, optional redacted documents.
- **Processing:** Show the exact information to be shared, capture meaningful consent, transmit securely, and confirm receipt. Avoid storing personal agreements or identifying building information without a retention/privacy design.
- **Outputs:** A reviewable case-intake packet and receipt/status confirmation.
- **Required materials:** Verified partner process and endpoint; privacy/retention policy; secure authenticated upload or partner-owned form; access controls; legal/security review. **No partner API or connector is presently integrated.**
- **Implementation gate:** Pilot partner agreement and approved consent/data-handling requirements.

### UC-11 — Tenant-union intake triage

- **Short description:** Give a partner organization a consistent summary of new renewal concerns without deciding cases automatically.
- **Inputs:** Explicitly consented UC-10 packets, key dates, reported issue type, supporting source links.
- **Processing:** Normalize fields, flag missing documents, route to the organization's existing process, require human review before any case decision.
- **Outputs:** Standardized intake record and checklist for staff or organizers.
- **Required materials:** Organization workflow, agreed schema, secure case-storage integration, role permissions, audit logs, retention and deletion policies. **No case-management service or API is implemented.**
- **Implementation gate:** An actual organization confirms the workflow saves time and approves data-handling terms.

## End-to-end scenario (demo)

1. A Los Angeles renter selects **2 bedrooms**, enters current rent **$2,400** and renewal offer **$2,650**, and chooses a future effective date. **These dollar amounts are labeled example inputs**.
2. MoveUp calculates **+$250/month** or **+$3,000 over 12 months** if the rent remains fixed.
3. The app compares the offer against the **Apartment List October 2026 Los Angeles 2-bedroom estimate of $2,377**, reporting **+$273/month** above that city benchmark (approximately **+11.49%**). It does not imply the new rent is automatically unlawful.
4. Conditional California and local published standards appear separately. Since building eligibility and other legal facts are not established, the result requires verification rather than claiming a lawful maximum.
5. The renter can view official government guidance, copy a neutral clarification request, and print a case summary for a tenant organization.

## Acceptance criteria for current use cases

- Every displayed monetary value is from validated renter inputs, a dated recorded source, or visible arithmetic.
- Market comparisons use exactly the matching available city and 1BR/2BR category; unsupported categories show **Not available**.
- Green/yellow/orange/neutral states are deterministic and never claim legal certification.
- Missing tenancy/building coverage is clearly unknown; a market-price difference alone never becomes a complaint.
- Editable inputs invalidate old results; both Enter and the action button submit the same form.
- No report appears until a valid submission; print includes source URLs and uncertainty.
- No claims of live APIs, automatic legal enforcement, case tracking, renter data storage, or paid SaaS unless those capabilities are actually built.

## Implementation map

| Module | Supports use cases |
|---|---|
| `src/routes/index.tsx` | UC-01, UC-02, UC-03, UC-05, UC-07, UC-08 |
| `src/lib/renewalV4.ts` | UC-03, UC-05 |
| `src/lib/renewalPolicy.ts` | UC-04 |
| `src/lib/renewalActions.ts` | UC-04, UC-06, UC-07 |
| `src/lib/renewalCalculator.ts` | UC-03/UC-09 data freshness |
| `src/data/rentMarket.snapshot.json` | UC-03, UC-09 |
| `src/styles.css` | UC-05, UC-08 |
| Future consent and partner case integration | UC-10, UC-11 (**not present**) |
