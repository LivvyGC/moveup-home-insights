# Uploaded dataset provenance

Source CSVs were provided by the founder via the ChatGPT conversation for the weekend demo. No public raw CSV distribution is included in this GitHub repository.

| File | SHA-256 | Provenance |
|---|---|---|
| `City_zori_uc_sfrcondomfr_sm_month.csv` | `7842d83fc2871717b64a3f5c3b98ddb6310b516448c9da822e3d3260aa917e73` | Zillow Research ZORI City data, September 2026 |
| `Apartment_List_Rent_Estimates_2026_10.csv` | `bc25bf0f7d354e6272c761dae3952d1be350925b1d146eab5f19891d3c0d4d25` | Apartment List city rent estimates, October 2026 |
| `Apartment_List_Rent_Growth_MoM_2026_10.csv` | `039ef34f39b1946d9714202029c52af3c6be20589fe2dfd60003fb4cab05867c` | Apartment List city monthly growth, October 2026 |

See `src/data/rentMarket.snapshot.json` for four-city normalized values, original filenames, URLs and observation months.

**Rights:** the founder confirmed demo-use permission for Apartment List. This is not independently verified as permission for unrestricted commercial redistribution. Source-level restrictions on copying whole datasets remain unresolved.

**Refreshing:** re-upload current originals, validate city/geography/bedroom definitions and recompute latest 12-month comparisons from the actual file contents. Never carry forward previous figures silently.
