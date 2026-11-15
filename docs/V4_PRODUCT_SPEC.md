# Renewal Check V4 — Approved product and release checks

**Approved pivot:** democratize housing agreements. A renter checks a renewal offer against a real bedroom-matched city benchmark, screens potential rent-rule concerns, and prints a source-linked report suitable for a tenant organization.

## Intentional boundaries

- Primary market source: Apartment List **city 1-bedroom and 2-bedroom new-lease rent estimates**, founder-uploaded October 2026 data in \`src/data/rentMarket.snapshot.json\`.
- Do **not** substitute a studio, 3+ bedroom, neighborhood, or property-specific benchmark. Use "Not available" if the selected category is unsupported.
- Zillow ZORI is retained in the source snapshot for research provenance but is **not** shown as a second competing offer benchmark.
- The offer-minus-benchmark amount and percentage are arithmetic only. No arbitrary rent-risk thresholds, forecasts, predictions or scores.
- Result color is driven by two independent screens: market relative position and potential legal concern. Orange means a potential official-rule concern (not proof of violation), yellow means above the market estimate with no specific issue detected from available screening, green means at/below benchmark with no specific issue detected, neutral means eligibility is unknown or market estimate missing. **Never label the result legally approved.**
- Published policy values are conditional and require official coverage/notice verification; no automated dispute submission and no claim of an individualized lawful cap.
- Default assessment horizon for the printed cost difference is the explicit adjustable 12-month duration. This is a comparison of two stationary rent amounts, not a future rent forecast.
- Do not ask for mortgage, moving, payment, accounts, user addresses or PDFs for this MVP. The PDF is printable from the browser and is not stored.
- Source attribution appears once per grouped market result, and official law source links appear beside individual published rules.

## Data availability and license

October 2026 Apartment List rows (LA/SF/SD/Seattle × 1BR/2BR) from the founder-supplied CSV are checked in as small JSON snapshot values. The historical raw files are **not stored in GitHub**. Snapshot metadata includes original filenames and SHA-256 digests. The founder confirms Apartment List **demo** permission; wider commercial rights still need independent verification.

## Required release QA

- Unit-tested market arithmetic and color precedence
- Unsupported unit type returns unavailable
- Intro shows no blank results or reports
- Submission works by button and native form Enter
- Official source and data observation month visible
- Legal screens stay conditional for unknown coverage
- 375px and desktop overflow, accessible keyboard controls, and letter-size print visually inspected **before any claim of full validation**
- Check Lovable sync and public publish separately from GitHub merge
