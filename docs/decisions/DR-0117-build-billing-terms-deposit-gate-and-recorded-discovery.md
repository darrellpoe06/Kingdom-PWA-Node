# DR-0117 — Build billing terms: $2,000 minimum, 90 days same as cash behind a structural deposit gate; $150/mo Feedback-portal support; discovery rides recordings

- **Status:** accepted
- **Tier:** B (commercial terms + the price-out copy on a client-facing door; the terms are the governor's own declaration — real money COLLECTION mechanics remain his hand)
- **Scope:** every client-business build engagement (small no-overhead segment); the door price-out; the discovery intake lane
- **Date:** 2026-07-07
- **Principles:** GOVERN-EXECUTE-ADVISE, VERIFICATION-DOCTRINE, COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, APP-IS-PRIMARY, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, filling the `cf-pricing` slot (DR-0114 kept build pricing the governor's hand — until now it was "custom quote," no numbers): *"We should have a minimum for getting the initial MVP and the balance after or all upfront or we don't even start work."* Then the numbers: *"90 days same as cash. $2000 dollars minimum. $500 deposit and $500 at completion then the MVP then the remaining over the rest of the 90 days. Then $150 month for perpetual support through the feedback portal; more than that, come back through the front door for $2000 dollars."* Segment: *"For small no overhead business."* And the intake: *"We can get recordings from customers and use that as the requirements to build the MVP… all without me needing to talk to customers — just imported voice notes or a full conversation with our LLMs or vendor LLM."*

## Decision

1. **The terms (small no-overhead business segment).** Build: **$2,000 minimum**, on **90 days same as cash** — $500 deposit to start, $500 at MVP delivery, the remaining balance over the rest of the 90 days (a payment plan, **no interest ever** — deliberately NOT consumer financing), or **paid in full up front**. Support: **$150/mo perpetual, scoped to the Feedback portal**; work beyond portal scope is a NEW engagement back through the front door at the $2,000 minimum. Larger/complex builds (custom domain tables, integrations — the Moore-class build) quote UP from the minimum; the quote number is always the governor's hand (DR-0114 unchanged).
2. **The gate is structural.** `client-engagements.js` `canStartBuild()` is the sentence "or we don't even start work" as code: false with no quote, false below the minimum, false until the $500 deposit is a recorded payment. Stages derive from real fields (quote, payments, MVP delivered/accepted, the 90-day clock from the first payment) — never stored, never painted (DR-0076). Payments are **recorded, never processed** — money moves by the owner's hand (the Moore §7 posture); no card/bank fields exist in the shape.
3. **Discovery rides recordings.** Requirements come from the client's imported voice notes or an LLM-guided conversation — transcribed on the existing NAS SME-pipeline rails, extracted per `infra/nas-sme-pipeline/client-discovery-json-prompt.md`, imported by `parseDiscoveryJson()` with a `source_quote` on every item, `status='extracted'` until a **steward reviews** (nothing extracted is built from unreviewed). The MVP is built from reviewed requirements; post-delivery revisions ride the Feedback tab; a live conversation happens only when that isn't enough.
4. **One source of truth for the figures.** The door's price-out (`moore-door.js` → every registry door after it) renders the terms FROM `client-engagements.js` constants — the "custom quote" placeholder upgrades to the declared figures, never re-typed per surface.

## Defaults set (governor can veto with a word)

- **Non-payment at day 90:** no interest, no late fee (avoids the retail-financing posture); the balance simply remains due, `past-due` is visible on the engagement, and the $150/mo support does not begin until paid in full. **Their data stays exportable regardless** — DATA-AS-EMPOWERMENT is never a collection lever.
- **$150/mo includes the client's platform seat** for their branded door + tenant (it supersedes the $249 Business tier for build clients — positioned as the build-client deal). Flagged for reconciliation with the tier ladder before store submission (the known $9/$19/$49/$99-vs-$39/$89/$149/$249 schema/UI mismatch rides the same pass).
- **MVP delivered** = the door/system live behind the lane + offered for the client's review (DR-0104 style), making the $500 milestone objective.

## Consequences

- `cf-pricing` (board-client-factory) flips: the numbers exist, the calculator upgraded from "custom quote" to figures.
- The recorded-discovery lane gets its machinery seam (parser + prompt contract shipped; the NAS transcription ride + in-app review surface are the next increments, tracked on the board).
- Cash-flow shape per engagement: $500 to start, $1,000 by MVP, $2,000 by day 90, then $150/mo recurring — the factory's registry machinery (DR-0114) is what makes the $2,000 profitable; a build that can't ride the registry quotes up.
