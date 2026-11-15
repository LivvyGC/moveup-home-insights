# MoveUp — 12-hour hackathon demo and pitch

## One-sentence pitch

**MoveUp helps renters understand a proposed rent increase and turn that confusing experience into an organized, evidence-based case packet they can bring to a tenant-support organization.**

## Why this product now

Renters may receive a renewal offer without knowing how it compares with new-lease city benchmarks, which rent rules may be relevant, or which documents a tenant advocate needs to review. Tenant organizations may need to repeat basic intake questions. **The time-savings and willingness-to-pay claims are hypotheses, not measured business results.**

MoveUp focuses on the handoff from *renter question* to *human organizer review*. It does not replace a union's organizing activities, professional legal advice, or existing case-management tools.

## 90-second live demonstration

1. Open the app, click **Load example**. Explain these are illustrative renter inputs, not an actual person or lease.
2. Click **Check my offer**. Show the monthly financial difference, the one Apartment List 2BR market comparison, and the separately sourced conditional rent-rule screening. No legal violation is confirmed.
3. Scroll to **Renewal summary → Prepare for tenant support**. Select **Review a proposed rent increase** or the notice concern, then check documents available.
4. Click **Preview organizer packet**. Show the prefilled case facts, rent comparison, policy uncertainty, and missing-document checklist.
5. Click **Copy case packet** to demonstrate a renter-controlled handoff to a future partner; alternatively use **Print / Save as PDF** for an offline packet.
6. Explicitly say: **"No partner is connected, and we do not transmit or store tenant cases."**

**Demo checks:** Have the report and packet visible before presenting. Confirm browser clipboard permission works; if not, printing remains a functional fallback.

## 60–75-second pitch script

> Imagine receiving a notice that your rent is going up. You know the new number, but not whether it is competitive, which protections might apply, or how to present your case to someone who can help.
>
> MoveUp makes that first step understandable. A renter enters their current rent, offered rent, city, bedroom count and effective date. We compare their offer with a real, dated Apartment List city estimate, calculate the financial difference, and show conditional tenant-protection references from government sources.
>
> The key difference is what happens next. Instead of leaving the renter with another dashboard, MoveUp helps create a standardized organizer-ready case packet: the facts, missing evidence and official references, ready for human review.
>
> Our first target is tenant-support organizations with recurring renewal inquiries. We believe more complete intake could save organizers time—but that needs to be validated with actual partners. The renter tool is free; a potential future organization product would customize intake and exports to their workflow.
>
> We have a working interactive demonstration. We are not claiming AI legal determinations, automatic filings, partner integrations, or a proven revenue model.

## 5-slide deck outline

| Slide | Headline | What to show |
|---|---|---|
| 1 | **Renters get a number, not clarity** | Illustrative increase and unanswered questions |
| 2 | **MoveUp makes the offer understandable** | Actual renter intake and colored result/offer-vs-market meter |
| 3 | **From confusion to an organizer-ready packet** | Live demo of missing evidence and preview |
| 4 | **Who would pay and why** | Free renter workflow; B2B organizational intake/standardization hypothesis |
| 5 | **What exists and what's next** | Shipped demo; privacy-first export; partner pilot to test intake time savings |

## Existing code reused

- `src/routes/index.tsx`: validated renewal intake, outcomes and print-ready report.
- `src/lib/renewalV4.ts`: independently computed market assessment and legal-review visual states.
- `src/lib/renewalActions.ts` and `src/lib/renewalPolicy.ts`: conditional housing-policy rules and government action links.
- `src/data/rentMarket.snapshot.json`: October 2026 Apartment List 1BR/2BR city estimates with source metadata.
- `src/components/TenantIntakeDemo.tsx`: **new** browser-only issue category, evidence checklist, packet preview and copy helper.

## Facts vs demo claims

| Demonstrable | Not demonstrable / must not claim |
|---|---|
| User enters an offer and sees calculated changes | Automated legal compliance certification |
| One bedroom-matched Apartment List benchmark | Personalized comparable-listing appraisal |
| Dated, conditional official rent-rule references | That a particular increase is illegal |
| Evidence checklist, organizer packet preview, browser copy, print | A linked union intake endpoint or an actual submitted case |
| No account and no application case database | A compliance-certified private document-storage platform |
| Candidate B2B customer segment | Real paying customers or measured intake savings |

## Competitive and business story

Beachhead: tenant-support organizations with recurring rent-increase inquiries and an identified intake coordinator. Value hypothesis: fewer missing facts at first review and less manual information gathering. Near-term test: show synthetic packets to 1–3 organizations, ask which fields they need, compare with their current workflow, and ask who could fund a pilot. No organization has yet been integrated or committed as a paying customer.

## Constraints and safety

- **No live external AI, paid API, account, data storage or document upload** required for this demo.
- **No housing-risk probability** and no fabricated market data.
- **Official rules are conditional**, and a market difference is never proof of a rent-law violation.
- Renter controls copying and sharing; packet is a local browser text result.
- Apartment List founder-confirmed demo permission does not establish commercial redistribution rights.
- The public Lovable site may require a separate Publish → Update. GitHub merge does not by itself prove public deployment.
