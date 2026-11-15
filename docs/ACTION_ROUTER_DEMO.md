# MoveUp: Action-First Renter Acquisition Demo

## Business model

MoveUp gives renters a free, sourced renewal check. They can negotiate, review protections or voluntarily express interest in housing assistance and tenant organizing, regardless of whether a law violation is detected.

The proposed paying customer is a tenant-support organization using customized intake workflows, not a buyer of renter identity lists. An assistance inquiry, organizing contact, and union membership are distinct outcomes.

## Shipped renter flow

1. Enter city, bedrooms, current and offered rent, and effective date.
2. Compare against a real, dated Apartment List city benchmark.
3. Choose independently: Negotiate, Check protections, or Connect.
4. Tenant connection offers separate Assistance and Organizing opt-ins. Either or both can be selected.
5. Assistance asks only for issue type, evidence on hand and optional notes.
6. Preview or download the inquiry packet; submitting requires a selected interest and explicit consent.

## Working demo registry

With explicit consent, the Submit demo inquiry button saves the case packet in **this browser's localStorage**. It groups records by city, generates a local receipt ID, displays city counts, limits records to 25, and provides a Clear demo registry option.

**This is not a shared database.** Records are visible only on the same browser/device. No tenant union has access to them remotely. The code contains **zero verified connected tenant unions** in every city and does not simulate successful delivery to real organizations.

Packets can contain user notes. Demo with synthetic details and clear saved data after judging.

## Optional real MoveUp inbox

The existing build-time variable VITE_MOVEUP_INTAKE_ENDPOINT may point to a MoveUp-owned Formspree endpoint. When configured, the page asks for a contact email and explicit consent and only claims inbox acceptance after a successful HTTP response. It never claims tenant-union delivery. Failures, including HTTP 429, do not generate a false success.

A real tenant-union distribution workflow requires partner agreements, verified recipient destinations, consent per recipient, secure server-side storage, authenticated staff access, retention/deletion, and actual delivery receipts. No such organizations or multi-tenant backend are connected in this demo.

## Demo script

1. Use Try sample and Check my offer.
2. Show the financial change and sourced market meter.
3. Show all three independent actions. Open the landlord negotiation message.
4. Connect with tenant support. Choose assistance, organizing or both. Preview the packet.
5. Consent and submit the synthetic example. Show local-registry receipt and Los Angeles city grouping.
6. State explicitly that the record is stored in the browser and **no tenant union was notified**.

If a MoveUp-owned external receiver is configured and tested, show its inbox acceptance separately.

## Release criteria

- The three action paths work even for a below-market or legally ambiguous offer.
- Selecting local exemption does not imply state exemption.
- All self-reported answers stay synchronized with the summary and packet.
- No submission occurs without opt-in and consent.
- Local registry saves successfully or shows an honest error.
- Zero connected unions is not misrepresented.
- The GitHub production build and automated tests pass.
- Verify actual Lovable publish, desktop/mobile, print and optional real receiver before demo.

## Acquisition hypothesis

Some renters with everyday lease concerns will voluntarily seek negotiation or community support. Structured, consented intake might reduce time for organizers. These are hypotheses until validated by real renters and organizations. No partner, membership, lead conversion or paid adoption is claimed.
