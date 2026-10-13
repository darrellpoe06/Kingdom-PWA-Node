# DR-0275 — The reviewer lens rides every face, the review registry keys on unique ids, and dev controls are steward/demo-only

- **Status:** accepted
- **Tier:** A (strictly privilege-narrowing UI gating + registry integrity + a strip mount; RLS and the tier data model unchanged)
- **Scope:** reviewer mode on every shell return path (app shell + the TLC `?tlc=1` door takeover); the `docs/reviews/REVIEWS.md` id/order convention; the TierSwitcher / UpgradePrompt dev-row / Reset-to-seed visibility
- **Date:** 2026-08-05
- **Principles:** REVIEW-LIVE-PUSH, VERIFICATION-DOCTRINE, REALITY-TRACE, MACHINERY-OVER-MEMORY, SPEC-CONFORMANCE, COMPREHENSIVE-REVIEW, DECISION-RECORDS

## Directive

Darrell, 2026-08-05: *"How do we use reviewer mode for the TLC Therapy Solutions App? Comprehensive review of our Ways and documentation and procedures."* Christina, same session, from her own device in reviewer mode (mrspoe06): *"this is what it's showing when my assistant logs in"* and *"I want to be able to define anyone in the app as an assistant."* Her screenshots are the journey walk that surfaced three of the four defects below.

## Decision

Three corrections, each now carried by machinery, all found by running the DR-0239 seven-dimension review on reviewer mode itself (full record: `docs/99-session-notes/2026-08-05-tlc-reviewer-mode-comprehensive-ways-review.md`; registry record: REV-0239):

1. **The reviewer strip rides EVERY shell return path.** The TLC client door (`?tlc=1`) returns early, before the app shell's `ReviewerModeBanner` mount — so a steward who navigated to `/tlc/` with the lens on lost the only Exit affordance (the Admin tab is hidden in this mode by design). The banner now mounts inside the door's early return as well; `reviewer-mode.test.js` pins BOTH sites by count. The law is unchanged: an exit affordance is never hidable (DR-0104). For users the flag is off and the door is byte-identical.

2. **The review registry keys on unique ids, and display order comes from `Date`, never file position.** `REVIEWS.md` had grown two append conventions — a newest-first run prepended atop the older oldest-first body. Consequences, both real: (a) sessions minting "next id" from the visually-nearest neighbor double-minted EIGHT ids (REV-0088/0089/0159/0160/0174/0175/0176/0218 — renumbered to REV-0231–0238, external references updated in the same commit); (b) ReviewsPeek's "tail is the newest" assumption meant the DR-0104 reviewer strip — built so the written review is one tap away — never surfaced REV-0219–0230. Now: ids are unique and mint as `max(all) + 1` (declared in the registry header; gated proven-to-catch by `reviews-registry-guard.test.js`), and ReviewsPeek sorts by each record's own `Date` (proven-to-catch fixture in `reviews-peek.test.jsx`).

3. **Dev controls are steward/demo-only.** Christina's reviewer-mode pass showed the user-identical view carrying the header TierSwitcher, the UpgradePrompt "Dev preview — switch tier" row, and the footer "Reset to seed data." One tap on the switcher hopped the real tier wall the pricing page charges for (DR-0263 subscription readiness; the operative $39/$89/$149/$249 ladder), and the reset offered to overwrite a signed-in user's books with sample data. All three now render only for stewards (`isFamilyMember`) or demo-persona exploration (`isAnyDemoMode` — a sales affordance for prospects browsing the sample), source-pinned in `reviewer-mode.test.js`. This is what DR-0104 exists to catch: the owner's privileged view hid the defect; the user's view exposed it.

## What reviewer mode IS and IS NOT for TLC (the answer of record)

- It mimics a **generic signed-in non-family user**: right for reviewing the outside-user experience and for confirming operator surfaces (the TLC tab, Admin) correctly VANISH.
- It is **not needed for the `/tlc/` client door** — the door is public and identical for everyone; review it signed-out.
- It is **not an assistant-view lens**: a real granted assistant is force-routed to the Assistant workspace with nav filtered to Assistant/Messages/About. Christina holds DB role `admin` (verified live over the DR-0260 Supabase read channel), so the Team access control (DR-0271: grant ANY email → they claim → she confirms → revocable any time) is already hers — her "define anyone as an assistant" ask is the shipped flow, reachable once the lens is exited. A dedicated "view as my assistant" preview lens is CARRIED — `re-review: 2026-08-12` (REV-0239).

## Consequences

- The per-device lens flag on shared devices stays watch-listed (an assistant signing in on a lensed device meets the narrowed world until Exit is tapped; the always-visible banner is the affordance) — auto-exit-on-account-change only if it recurs, `re-review: 2026-08-12`.
- The double-mint class cannot recur silently: the registry guard fails CI on any duplicate id, malformed id, or unparseable date.
- Pairs with DR-0104 (the mechanism), DR-0239 (the review standard that ran), DR-0259 (this review lands as Ways + documentation + gates, same delivery), DR-0271 (assistant rights), DR-0261 (the TLC face this review walked).
