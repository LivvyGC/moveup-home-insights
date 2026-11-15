# MoveUp: Judges' Live Demo and Evidence Checklist
Updated November 14, 2026

## The problem and beachhead

**Primary renter:** Someone who receives an unfamiliar renewal offer and wants to negotiate, understand local protections or connect with other renters. A suspected legal violation is not required.

**Proposed organizational buyer:** Tenant unions, renter organizing groups and staffed tenant-support organizations that handle repeated inquiries. Their potential benefit is standardized renter-prepared information and voluntary introductions. MoveUp has **not** proved time savings, acquired an organization as a customer, or built a multi-organization receiving service.

**Two-sided motion:** Free renter offer check → renter chooses a next action → renter may optionally request assistance or express organizing interest → renter controls sharing and may independently contact a public organization → future verified partners could use configurable intake software. Public directory listings do not imply a MoveUp partnership.

## What runs right now

1. A five-field renewal checker validates renter input.
2. Apartment List October 2026 city and bedroom estimates supply a sourced market comparison.
3. Official effective-dated city/state rules support conditional screening.
4. Three working options: negotiate, check protections or connect with community, regardless of apparent legality.
5. The renter can prepare a sourced packet, print or download it, and choose separate assistance and organizing interests.
6. A city-specific directory presents publicly documented tenant organizations and their own website links.
7. With consent, a demo inquiry can be saved in **the current browser**, never automatically delivered to a union. The optional MoveUp-owned external demo inbox must first be configured and verified.

## Rubric alignment (not guaranteed scoring)

| Category | Evidence we can show | Gaps we must acknowledge |
|---|---|---|
| Execution & design, 25 | Run complete intake to results to action to case packet; test desktop, mobile, keyboard and print | Lovable must be republished and browser tested separately from GitHub CI |
| Real problem, real user, 25 | A concrete renter receiving a $250 monthly increase and wanting action | User research must come from actual testers this weekend, not invented quotes |
| Path to customers, 20 | Free acquisition, separate assistance/organizing opt-ins, 12 public directory examples, potential paid customized intake | 12 examples are NOT total addressable market, customers, partners or verified buyers |
| Pitch & demo, 15 | One user, one clear decision, one completed artifact in under 90 seconds | Don't wander through every legal detail |
| Creative use of AI, 15 | Explain where AI assisted with research, architecture, implementation, test drafting and cross-source quality checks, and why financial/legal outputs are deterministic | No runtime AI document parser or legal assistant currently exists. Never imply otherwise |

## Live example

**LANDLORD:** "Your rent is increasing from $2,400 to $2,650."

**RENTER:** "That's $250 more each month. Can I negotiate or find other renters who want to organize?"

**MOVEUP:** Enter an illustrative LA 2BR offer. The offer is $273 above the saved October 2026 Apartment List 2BR city estimate of $2,377, a difference of 11.49%. The monthly renewal increase is $250, or $3,000 over a fixed 12-month comparison.

**DECISION:** Show **Negotiate** first, then **Connect with tenant support**. Select assistance, organizing or both. Open the Los Angeles directory and show how an independent tenant group can be contacted via its public website. Preview/download the packet. If saving the demo inquiry, check the explicit local-storage consent and show the truthful local receipt.

**Do not say:** "MoveUp notified three LA unions", "The landlord broke the law", "These twelve nonprofits are paying customers", or "AI automatically verified this lease."

## Human validation evidence sheet

Conduct at least two short observed usability tests with people who resemble the renter audience, and optionally one organization-staff interview if feasible. Use synthetic personal/rental data. Obtain permission before filming or quoting.

For each test, record:
- Date and tester type (e.g., renter, housing advocate), with no identifying details in public slides.
- Task: enter the example, explain the rent and market differences, choose a next action and find an organization.
- Completion without guidance: yes/no.
- Confusing terms or actions, as the tester actually expressed them.
- A change made based on that feedback, with before/after screenshot.
- Whether the participant understood that directory entries were independent organizations and no data was automatically shared.

**No observed users means do not claim real-user validation.** Present this honestly as the next step.

## Revenue and switching story

Free renter use creates a potential channel. Organizational software might later be sold as a monthly license to customize intake questions, receive permissioned inquiries and integrate with existing case systems. A price is an **experimental hypothesis** until an organization with purchasing authority agrees. The switching argument is reduced repeated intake, not buying lists of renters or replacing a tenant union's organizing model.

## Verified public organizational examples

The curated organizations in the website are listed in src/data/tenantOrganizations.ts and drawn from their own public pages. Examples include:
- Los Angeles Tenants Union: https://latenantsunion.org/locals/
- Inquilinos Unidos: https://www.inquilinosunidos.org/
- San Francisco Tenants Union: https://sftu.org/
- Housing Rights Committee of San Francisco: https://www.hrcsf.org/tenant-counseling-services
- Tenant Councils of San Diego: https://actionnetwork.org/groups/tcsd
- Legal Aid Society of San Diego: https://www.lassd.org/resource/landlord-tenant-issues/
- Puget Sound Tenants Union: https://soundtenants.org/
- Tenants Union of Washington: https://tenantsunion.org/

Other entries have source URLs stored with their records. The list is intentionally curated, not a census or proof of partnerships.

## Publish and fallback

1. Merge only after GitHub test/build checks pass.
2. Verify code sync in Lovable, then Publish → Update. GitHub merge alone is not publication.
3. Perform one manual run at desktop and 375px mobile, including clicking each action, opening directory links, printing and saving a sample inquiry.
4. Take screenshots and keep a PDF as a demo fallback.
5. If an external receiver was not configured, use the local demo receipt and explicitly say no organization received the data.
