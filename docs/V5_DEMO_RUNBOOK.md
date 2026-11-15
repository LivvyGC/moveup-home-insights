# MoveUp V5 — Final Demo Runbook

## What changed

- The no-photo homepage uses a small house mark, a direct housing-rights headline, and a button that scrolls to the renewal form.
- **Try sample** remains available for a hackathon walkthrough, but the sample notice is a small label, not a full warning panel.
- City/state rent standards appear as separate visual law cards with conditional self-reported coverage controls and expandable official qualification details.
- A single \`TenantCaseRecord\` in \`src/lib/tenantCase.ts\` generates the renewal summary, organizer packet, download, and optional submitted payload. Coverage, prior increases and Seattle notice answers stay synchronized.
- Renewal summary is reduced to three primary groups. Its provenance and legal qualifications are available in expandable details.
- The tenant-support packet can be **downloaded locally as text** or included in the browser's **Print / Save as PDF** report.

## Optional real submission — not enabled until configured

MoveUp does not currently have a receiving tenant organization or a demo inbox endpoint. For an honest live demonstration, the form **cannot send** until a founder creates and verifies a receiver.

To enable the **MoveUp demo intake** option:

1. Create a MoveUp-owned, monitored Formspree demo form at https://formspree.io/ and make sure its emails reach the intended MoveUp demo inbox. This is for synthetic hackathon cases only.
2. In the Lovable deployment environment, set \`VITE_MOVEUP_INTAKE_ENDPOINT=https://formspree.io/f/<your-own-form-id>\` and rebuild/redeploy. The endpoint is visible in the built client; **never place API secrets** in that variable.
3. Load a synthetic renter scenario, review the packet, enter a test email, check the explicit consent checkbox, and submit.
4. Confirm receipt in the actual destination inbox. A 2xx response is required before the UI says the configured demo receiver accepted it; a timeout or non-2xx response shows an error instead.
5. If you cannot verify the receiver, **leave the environment variable unset** and demo the real downloadable report. Never claim a tenant union received a packet.

**Important:** Formspree is an external processor. Do not collect or transmit real renters' sensitive data until a privacy/retention review and a recipient agreement are complete. The site currently does not upload leases, automatically file complaints, or store tenant cases in MoveUp.

## Live demo script (90 seconds)

1. Open the homepage. Point out the simple renter journey and click **Try sample**.
2. Run **Check my offer**. Explain the actual rent increase calculation and bedroom-matched Apartment List benchmark.
3. In **Your protections**, select a state coverage response, a separate city response (if available), and prior-increase history. Show that coverage is explicitly unverified.
4. In **Your renewal summary**, point out that the selected answers immediately appear.
5. Select a support concern, check one existing document, and click **Preview case packet**.
6. Click **Download case packet** or **Print / Save as PDF**; if a working demo inbox was configured and verified, submit an **explicitly synthetic** case and show receipt.

## Honest demo boundaries

- Market figures are city-level Apartment List new-lease estimates, not property valuations.
- Laws are effective-dated published standards, not certified maximum rent amounts. Eligibility, prior increases, authorized adjustments, notice rules and property jurisdiction can change outcomes.
- Coverage selections are *self-reported* and are not independent verification.
- Green/yellow market comparison does not certify legal compliance; orange signifies a potential concern, not proof of a violation.
- A form with no receiver is not a completed submission.
- No AI lease parsing, paid subscriptions, tenant union integration, or automated government filing exists.

## Development checks

\`\`\`bash
bun install --frozen-lockfile
bun run test
bun run build
\`\`\`

After merging GitHub, Lovable may need **Publish → Update**. Verify public website, mobile layout, print/PDF and (if connected) a synthetic receiver end to end.
