# MoveUp — Renewal Check

MoveUp is an educational housing-agreement review website. Renters in **Los Angeles, San Francisco, San Diego and Seattle** can compare a renewal offer with a dated city-level new-lease benchmark, screen potentially relevant tenant-protection rules, find government resources, and print a tenant-support summary.

**Mission:** Democratize housing agreements. **Potential B2B customer:** tenant unions and tenant-support organizations. Organization features are proposals, not currently deployed functionality.

## Documentation

- [Use cases: actors, inputs, processing, outputs, data and API requirements](docs/USE_CASES.md)
- [V4 product specification and release checks](docs/V4_PRODUCT_SPEC.md)
- [Data sources and provenance](docs/DATA_AUDIT.md)
- [Known limits and noncertified legal screening](docs/KNOWN_LIMITS.md)
- [Customer hypothesis](docs/CUSTOMER.md)
- [Business model tests](docs/REVENUE_HYPOTHESES.md)
- [Interview questions](docs/INTERVIEW_SCRIPT.md)
- [Partner pilot overview](docs/PARTNER_ONE_PAGER.md)

## Technology and sources

React, TypeScript, TanStack Start and CSS. The application uses a **saved October 2026 Apartment List rental snapshot** for city-level one- and two-bedroom new-lease estimates and effective-dated official government policy records. Zillow ZORI remains an independent research source, not a second competing headline rent benchmark. No runtime rental-price API, payment provider, user login, or tenant-case database is required for V4.

The application gives educational information, **not legal advice**. It does not decide whether a particular tenant's rent increase is lawful. Apartment List demo permission is founder-confirmed; broader commercial data rights require review.

## Development

```bash
bun install --frozen-lockfile
bun run dev
bun run test
bun run build
```

Live website: https://moveup-homepage.lovable.app/  
Lovable project: https://lovable.dev/projects/98dad54b-382f-47ef-bc89-8c0b04819fd5

Pushing to the Lovable-synced `main` branch updates the editor code, but public publication still needs to be verified separately.
