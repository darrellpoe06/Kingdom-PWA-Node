# DR-0175 — Ari's Comprehensive, Cloud-Runnable App Review

- **Status:** accepted
- **Date:** 2026-07-11
- **Tier:** A (additive advisory read composed from real records; no gate, no money, no schema; deterministic tests cover it)
- **Governs:** how Ari reviews the whole PoeTech app — one comprehensive, dimensional health read the family can run any time
- **Grounds:** VERIFICATION-DOCTRINE, NO-STATIC-DATA, APP-IS-PRIMARY, GOVERN-EXECUTE-ADVISE, PERPETUAL-IMPROVEMENT, WAYS-REVIEW
- **Pairs with:** DR-0154 (Ari as PM), DR-0121 (no static data), DR-0072/DR-0108 (review feeds / ways-review), DR-0170 (undated items don't reach the timeline), DR-0099 (Color Theology — no true red in the severity palette)

## Declared by Darrell, 2026-07-11 (two Projects screenshots)

> "We need Ari to have better comprehensive reviews of the PoeTech App."

The screenshots showed the Projects hub surfacing pieces — App Firm-Up 28%, "11 open items undated", "10 items the build record marks shipped still read 'Not started'" — but no ONE review that reads the whole app at once.

## The finding (reality-trace, DR-0061)

The house already had review PIECES, each real but partial: the **Perpetual Report** (history, not assessment), the **LLM Review** (a NAS-bound diff review — needs the NAS and a branch), the **Concerns board**, **App Firm-Up** (one %), the **board/build sync**. There was no single, cloud-runnable review that ASSESSES the whole app across dimensions with evidence per finding. That gap is exactly what the screenshots point at.

## The decision

Ship **Ari Review** — a comprehensive, deterministic, cloud-runnable review that SYNTHESIZES the app's own real records into a ranked, dimensional health read, surfaced as a Projects sub-tab. Five dimensions, each computed from a real signal producer the house already tests:

1. **Delivery integrity** — the board vs the build record: items the build record marks shipped that still read "Not started" (the exact screenshot drift), and specced items not loaded onto a board in use. (`board.js` staleSeedStatuses / missingSeedTasks)
2. **Plan health** — open items with no target date (can't reach the timeline, DR-0170) and open items past their committed date. (`completion.js` projectedFinish)
3. **Review freshness** — dated re-reviews parsed from REVIEWS.md and the DR ledger that are overdue or due soon. (`re-reviews.js` extractReReviews)
4. **Concern & feedback backlog** — open / in-progress concerns and open feedback. (the real concern + feedback rows)
5. **Data integrity** — self-contradictions the app can detect in the family's real financial records. (`derive-concerns.js` deriveDataConcerns)

## What makes it trustworthy (gates, not claims — DR-0076)

- **Evidence, not claims.** Every finding carries the real COUNT and the SOURCE it was computed from, and an action that points at the existing fix. A clean dimension reads "clear" — never a painted score.
- **No noise for a new user.** A board with no tasks is a fresh instance, not a drift finding — the delivery dimension only reviews boards actually in use.
- **Cloud-runnable.** It composes tested pure functions; it needs no NAS and no diff, so a comprehensive review is always one tap away (unlike the NAS LLM review).
- **Deterministic + proven-to-catch.** `ari-app-review.test.js` fires each dimension on a real contradiction (the drift fixture is pinned against the real seed spec) and confirms silence when clean; `ari-review-render.test.jsx` proves the surface renders the five dimensions and a real prop-driven finding.
- **Advisory, not a gate.** The deterministic CI gates remain the merge brake; this is Ari's read for the family (GOVERN-EXECUTE-ADVISE).
- **Color Theology (DR-0099).** Severities use the app's established tokens (brick / terracotta / olive / muted); true red is reserved for the Blood and never used here.

## Encoded

`app/src/lib/ari-app-review.js` (the engine), `app/src/components/AriReview.jsx` (the surface), mounted as the "Ari Review" sub-tab in `Projects.jsx`. New Ari standing duty `comprehensive-review` (ari-notes.js). Tests: `ari-app-review.test.js` + `ari-review-render.test.jsx`. REV-0066.
