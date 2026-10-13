# DR-0740 — Your earlier feedback is easy to find: the fold says tap to open, tallies where each note stands, and every note is reachable

- **Status:** accepted (built and proven in the suite; the presence walk guards both controls)
- **Tier:** A (form copy and two controls on the Feedback form; no table, no money, no new door)
- **Type:** defect
- **Date:** 2026-10-01
- **Scope:** `app/src/components/FeedbackCenter.jsx` (the fold of earlier notes: arrow, tap to open / tap to close, the tally while closed, `aria-expanded`), `app/src/components/IntakeOutcomeList.jsx` (`tallyOutcomes`, `tallyText`, Showing N of M and Show more), `app/src/lib/feature-registry.json` (the `feedback` surface and its two controls), `app/src/__tests__/intake-outcome-render.test.jsx`, `app/src/__tests__/feature-presence.test.jsx` (the feedback walk), `docs/decisions/INDEX.md`.
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), REALITY-TRACE (DR-0061: observed on his screen), VERIFICATION-DOCTRINE (DR-0076), DR-0625 (every intake is carried to an outcome the sender can read), DR-0726 (every user-facing control is registered), DR-0075 (perpetual improvement: feel, flow, smoothness).
- **Grounds:** Darrell, 2026-10-01, with a screenshot of the Feedback form on his phone showing a box that read only "YOUR EARLIER FEEDBACK (89): WHERE EACH ONE STANDS": *"Can users see their feedback logs... can I see them?!!! Where are they and whats what?"*

## Context

**SHOULD.** DR-0625: every note a person sends comes back to them with its outcome, derived from the record, where they sent it. The sender's list is `IntakeOutcomeList` (each note's reference code, outcome, reason, change, owner, window, and Reply), shown on the receipt after a send and, under the form, for everything sent before.

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**ARE (his screen, 2026-10-01).** The list under the form sits inside a `<details>` fold whose `<summary>` is laid out with `flex`. Chrome draws no disclosure triangle on a flex summary, so the fold rendered as a bordered box holding one heading and nothing else. Tapping the heading does open it, but nothing said so. Inside, the list showed the first 8 notes (`limit = 8`) with no way to the rest; he has 89.

**GAPS.** (1) The door was there but unmarked. (2) 81 of his 89 notes were unreachable from the app. (3) While closed, the box said how many notes, not where any of them stood.

## Impact

Every note a person sent is reachable from the form, with where each stands said before the fold is opened. Stewards lose nothing; the sender gains the whole list and the tally.

## Decision

1. **The fold says what it is.** An arrow (▸ closed, ▾ open), the words "tap to open" / "tap to close", `aria-expanded`, and an `aria-label` that says the same, on a 44 px summary.
2. **Closed, it still answers "what's what".** One line under the heading tallies where every note stands, counted from the same derived outcomes the list shows ("3 fixed · 1 being worked on · 85 on the board"), so the answer is on the screen before the fold is opened.
3. **Every note is reachable.** Under the list: "Showing 8 of 89" and a Show more button that brings the next 20 each tap until all are on the screen. With eight notes or fewer nothing extra is drawn.
4. **Both controls are registered** (DR-0726): a `feedback` surface in `feature-registry.json`, `feedback-earlier-fold` and `feedback-outcomes-more`, and a presence walk that mounts the form with nine notes, looks closed, opens the fold, and looks again.

Where the notes live, for the record: the sender's own rows in the `feedback` table (`fetchMyFeedback`, by `user_id`, newest first, up to 50 live plus this device's unsent copies), merged by `mergeMine`. Stewards see every note on Projects → Feedback. The sender sees only their own, on the form and on the receipt.

## Verification

- `intake-outcome-render.test.jsx`: closed, the fold carries the arrow, "tap to open", `aria-expanded=false`, and the tally "8 on the board · 3 fixed" for eleven notes; opened, "tap to close", eight notes, "Showing 8 of 11", "Show 3 more", then all eleven and no button; **proven to catch:** eight or fewer notes draw no Show more and no count, and the tally reads only what the notes say.
- `feature-presence.test.jsx`: the `feedback` walk finds both controls; the registry's structural checks pass with the new surface.

## Limits, stated

- The live read is capped at 50 notes (`MY_FEEDBACK_LIMIT`); his 89 include this device's local copies. Raising the cap is a one-line change if a person's list ever reads short. `re-review: 2026-10-15`.
