# MoveUp Renewal Check — Prebuild audit

**Checked:** 2026-11-15T01:57:31Z (2026-11-14 Pacific).
**Branch:** `renewal-check-demo-source-audit` based on `main`. Main and published site untouched.
**Gate:** **BLOCKED — do not port or display market benchmarks until raw datasets are retrievable and checked.**

## Existing architecture

- React 19 and TypeScript using TanStack Start and TanStack Router.
- Current homepage in `src/routes/index.tsx`; visual styles in `src/styles.css`.
- `src/lib/combineSignals.ts`: amortization-based monthly mortgage payment, insurance/tax *illustrative assumptions*, and old rate-direction signals. `CURRENT_RATE = 0.068` (6.80%) is hardcoded and **has no attached source or observation date**. `AFTER_CUT_RATE = 0.0655` is a hypothetical comparison, not verified market data. Loan term 360 months and down payment share 20% are hardcoded assumptions.
- `src/lib/localDecision.ts`: educational 0–100 score with BUY/WAIT/MIXED outcomes and 45/35/20 weights. **Must be removed** from rental page.
- City Zillow ZHVI in `src/data/cityMarket.snapshot.json` (September 2026 observations) is a **saved file**, not live city research fetches. Metro ZHVF in `src/data/metroForecast.snapshot.json` is also a saved source snapshot.
- Polymarket fetches run through `src/lib/signal.functions.ts`, sometimes returning a labeled 50% fallback; **remove from rental page**.
- `src/lib/policyIndicators.ts` contains homeowner tax notes, **not verified tenant rent-cap applicability**.
- Existing tests use Vitest; GitHub workflow runs tests and production build.

## What can be reused

- React/TanStack infrastructure, tests, routing and existing prototype HTML as the layout reference.
- Pure `mortgagePayment()` math after separating it from market predictions, using an **editable, dated/source-tagged rate assumption**.
- Source-attributed snapshot pipeline conventions.
- `src/lib/localTaxAuthorities.ts` only as links for future homeowner tax verification, **not renter protections**.

## What must be replaced

- Replace homepage with lease-renewal inputs first: city, current rent, offered rent, lease end.
- Remove score, probability, prediction signals, BUY/WAIT/MIXED, illustrative tax score and all unsourced market-rate claims.
- Introduce separately attributed Zillow ZORI and Apartment List city rent data (no averaging), legal applicability and effective-date records, pure stay/move/buy calculations, one-page printable report and clearly editable assumptions.
- Keep exact prototype palette; no shadows/icons/decorative graphs.

## Verified official policy starting facts — not yet eligibility decisions

- California Attorney General: `https://oag.ca.gov/rentcaps`; TPA 2026-08-01 through 2027-07-31: Los Angeles area 8.7%, San Francisco area 8.8%, San Diego area 8.2%. Eligibility depends on age/property type/exemptions; city ordinances may impose a **lower** cap.
- Washington Commerce: `https://www.commerce.wa.gov/housing-policy/hb1217-landlord-resource-center/`; residential cap 9.683% for 2026, 10% for 2027, subject to tenancy and property exemptions; notice and first-year restrictions exist.
- **No rent-ceiling calculation may be called legally applicable until city-local law, effective date, and building/tenant eligibility are checked against official sources.** These values have not been embedded in UI.

## Source access block: stop condition

Checked at 2026-11-15T01:57:31Z:
- Zillow ZORI: `https://files.zillowstatic.com/research/public_csvs/zori/City_zori_uc_sfrcondomfr_sm_month.csv`: direct environment HTTP request failed because the host could not resolve; web raw-file opening also failed. **No raw file obtained**.
- Zillow ZHVI: `https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`: same current-environment retrieval failure. Previously committed snapshot exists, but live file freshness is unverified in this run.
- Apartment List: `https://www.apartmentlist.com/research/category/data-rent-estimates`: page accessible via web search, published Oct. 28, 2026, but its Download Report selector does not expose a directly retrievable CSV here; direct environment request failed DNS resolution. **No raw file obtained**.
- Missing values, latest months, city coverage and row counts are therefore **not verified** for any requested raw rent data.

## License gate

Apartment List terms `https://www.apartmentlist.com/about/terms` (updated 2026-10-06) describe personal, noncommercial restrictions on Company Materials. The founder **states they have authorization to use Apartment List data for the hackathon demo**. This is recorded as founder-confirmed demo permission; commercial redistribution/display rights and precise authorization scope are **not independently verified**. Zillow research terms for downstream use require separate review.

## Tests and implementation

**Not run for the requested MVP.** No React port, market values, rate fetch, rent-ceiling engine, scenario engine or print report committed. The block was encountered before implementation by instruction. Previous codebase checks are not evidence these requested tests pass.

## Proposed unblock

The previously existing GitHub Actions runner has succeeded retrieving Zillow ZHVI; a tightly scoped GitHub Actions source-validation workflow might fetch both CSVs and write checksums/normalized city snapshots. Apartment List may need a legitimate direct CSV download supplied by the founder. **Get founder approval for that source-access method before proceeding.**
