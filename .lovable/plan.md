# MoveUp: Port the Developers' Code and Make It Work

Your developers' prototype is the source of truth. It combines two prediction-market signals (the chance of a Fed rate cut and the chance that mortgage rates fall below 6%) with a cost calculator for each city. The result is a BUY, WAIT or MIXED verdict, plus the monthly cost now and after a rate cut.

## What gets built
- **Home page (/)**: the MoveUp editorial interface. It includes:
  - a city picker covering the 10 cities in the developers' data
  - inputs for loan amount and timeline
  - two signal cards, each labeled LIVE or ESTIMATE
  - the verdict, with a breakdown of mortgage, tax, insurance and total monthly cost
- Live market odds come from the Polymarket Gamma API (the "two signals"). This API needs no key. If no exact market match is found, the card shows ESTIMATE at 50%, and the app never fabricates a value.
- Disclaimers stay in place: this is educational, not financial advice, and there are no property listings.

## Rules kept from the developers' AGENTS.md
- Never call a fallback value "live." Never invent probabilities.
- No logins, payments or database for this version.
- Keep the 45/55 neutral thresholds, the rule that a timeline under 3 months means BUY, and the rates of 6.80% now and 6.55% after a cut, with 20% down.

## Technical
- `combineSignals.ts`, `config.ts`, `cities.json` and their tests are copied unchanged into `src/lib` and `src/data`. The vitest suite runs and passes.
- The Supabase edge function (`signal/index.ts` + `parse.ts`) is replaced by a TanStack `createServerFn` that calls Gamma. Its timeout, matching and estimate fallback stay the same, and `parse.test.ts` is kept. No Cloud is needed.
- The `App.tsx` UI and `index.css` brand styles are ported into `src/routes/index.tsx` and `src/styles.css` as tokens, and the page gets proper head metadata.
- Live checks: one real Gamma call, to confirm whether the configured market queries currently match active markets. The developers' README flags this as unverified.
