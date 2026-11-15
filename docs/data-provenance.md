# MoveUp data provenance and accuracy policy

**Data status reviewed: November 14, 2026.**

## Historical city data
- Source: [Zillow Research ZHVI](https://www.zillow.com/research/data/)
- Geography: **city**, not metro or individual property
- Current bundled snapshot: September 2026 (see `src/data/cityMarket.snapshot.json`)
- Ten cities: Los Angeles, San Francisco, San Diego, New York, Austin, Dallas, Miami, Orlando, Seattle, Denver
- Refresh: `bun scripts/build-city-snapshot.ts` when Zillow releases a newer month; review output and commit the small snapshot.
- ZHVI is a seasonally adjusted home value index; it is **not a home price quote or a forecast**.

## State and local policy context
- `src/lib/policyIndicators.ts` stores curated rules with links to primary government authorities.
- `src/lib/localTaxAuthorities.ts` maps each city to its primary assessing/tax authority; many cities cross jurisdictional boundaries.
- Current Florida policy update: [PTO 26-21](https://floridarevenue.com/property/Documents/PTO_BUL_26-21.pdf), approved November 3, 2026, effective January 1, 2027. New residents after December 31, 2026 are subject to a different waiting rule.
- Texas Tax Code §11.13, New York STAR, Washington property-tax relief, California Proposition 13, and Colorado SB26-116 require separate eligibility and effective-date review.
- **No personalized eligibility or exemption amount is inferred**.
- City tax and insurance numbers in `src/data/cities.json` are **illustrative assumptions**, not sourced actual effective rates.

## Current score limitation — do not misrepresent
The experimental 45%/35%/20% model currently uses:
- 45% historical city price momentum,
- 35% a **proxy from illustrative city tax rate**, NOT a modeled state-policy effect,
- 20% two national prediction-market directional indicators.

It is **not trained or backtested**. The national component can still swing a borderline score; national contract direction may have correlations and expiration-date mismatches. Avoid claiming it predicts whether a person should buy. Do not silently update the verdict thresholds until a reviewed model and tests are approved.

A future genuine policy engine should model effective dates, applicability, income/occupancy constraints, assessed value, jurisdiction-specific levy rules, scenario costs and explicit uncertainty. Once eligible dollar impacts are calculated, do not add them a second time as a separate directional score.

## Forecasts
City-level Zillow ZHVF was unavailable at the previously tested URL (404); do not fabricate or substitute a metro forecast as city data. Present `Unavailable` until a source with explicit geography, reference date and horizon is verified.

## QA to release
- Each policy link manually checked for currency.
- For each city, an authority, current historical observation date, and source visible.
- No tax savings displayed without eligibility.
- No unverified rates framed as actual property tax.
- All tests and production build green.
- Manual published-site checks after Lovable release.
