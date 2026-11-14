# MoveUp — City Cost Predictor for Homebuyers

## What it does
A buyer picks a city, enters a home budget and down payment, and gets a report: the expected home price, the monthly cost, the full cost of ownership over 5 or 10 years, and a forecast of where prices are heading.

## Pages
- **Home (/)**: city search, budget and down payment inputs, a "Generate report" button.
- **Report (/report/$city)**: 
  - City snapshot: median price, price trend, rent compared with buying.
  - Cost scenarios side by side (conservative, expected, optimistic): mortgage, property tax, insurance, HOA, maintenance and utilities.
  - A 5-year price forecast chart built from the trend data, with each assumption stated.
  - An AI summary of the scenarios in plain English.
- **Saved reports (/reports)**: optional; needs sign-in. Listed as a later phase.

## Data sources (assumed; confirm)
1. Housing and market data: a RentCast-style API for prices, rents and trends.
2. Cost-of-living and economic data: FRED for mortgage rates and inflation, which needs a free API key.
I will ask for both API keys when the build starts and store them securely. They are only used on the server.

## Design
- Editorial, data-forward style: a warm off-white background, a deep green accent, a serif display font with a clean sans-serif for body text, and charts built with Recharts.

## Technical
- TanStack server functions call both APIs and return normalized data. Results are cached through TanStack Query.
- The forecast uses linear regression on the historical price series (`src/lib/forecast.ts`). Scenarios adjust the rate and growth inputs.
- Mortgage and total-cost math live in `src/lib/costs.ts`, with vitest tests.
- The AI summary uses the Lovable AI Gateway, which requires enabling Lovable Cloud.
