# Rental data provenance

**Audited on:** November 14, 2026 (Pacific). The founder uploaded three files and confirmed permission for the weekend demo; broader production/commercial permission is not independently established.

| Source | User-supplied input | Latest month | Supported cities | Observed missingness | Rights |
|---|---|---|---|---|---|
| Zillow ZORI | `City_zori_uc_sfrcondomfr_sm_month.csv` · https://www.zillow.com/research/data/ | 2026-09 | LA, SF, San Diego, Seattle | All four have latest and 12-month data; two older SF observations absent | Follow Zillow research terms and attribution; commercial use not independently approved |
| Apartment List rent estimates | `Apartment_List_Rent_Estimates_2026_10.csv` · https://www.apartmentlist.com/research/category/data-rent-estimates | 2026-10 | All four | All latest and 12-month comparison fields populated | Founder confirmed demo permission; commercial terms require follow-up |
| Apartment List monthly growth | `Apartment_List_Rent_Growth_MoM_2026_10.csv` · same research page | 2026-10 | All four | 12-month growth available | Same as above |
| CA rent caps | https://oag.ca.gov/rentcaps | 2026-08 to 2027-07 | LA, SF, San Diego | Missing individual tenancy/building coverage | Public official government reference |
| WA rent cap | https://www.commerce.wa.gov/housing-policy/hb1217-landlord-resource-center/ | 2026, 2027 | Seattle | Missing building and tenancy coverage | Public official government reference |
| Freddie Mac PMMS | https://www.freddiemac.com/pmms | 2026-11-12 | National | Not an individualized loan quote | Public rate benchmark with attribution |

Raw CSVs were supplied through the conversation, not checked into GitHub. Small demo snapshots are in `src/data/rentMarket.snapshot.json`. The original source download timestamp was not supplied; the observation dates are in the files. Raw-file SHA256 metadata is recorded in the JSON snapshot and `data/raw/README.md` when available.

## UI number trace

| Visible data | Origin |
|---|---|
| City, rent, offered rent, effective date, months | User inputs or explicitly labelled demo example |
| Proposed increase and horizon cash costs | Pure calculator from user inputs |
| Rent and 12-month changes by source | `src/data/rentMarket.snapshot.json` from founder's uploaded CSVs; month displayed |
| Cap percentages and conditional maximum | `src/lib/renewalPolicy.ts`; government URL and effective dates shown |
| Moving cost, deposit, alternate rent, purchase price, down payment, fees | Explicit user inputs; blanks excluded |
| Mortgage rate default | Editable benchmark from Freddie Mac PMMS, dated 2026-11-12 |
| Principal repaid and interest | `src/lib/renewalCalculator.ts` amortization |
| Staleness | Source observation dates compared against current browser date |

**Refresh age at audit:** Zillow September observation was ~45 days old; Apartment List October observation ~14 days old, using month-end dates. The UI recalculates age dynamically.
