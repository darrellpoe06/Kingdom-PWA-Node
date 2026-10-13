---
id: DR-0102
title: Orchestration reviews ride the review registry, one per reviewed working day, with freshness MEASURED in-app — consistent and perpetual, never remembered
date: 2026-07-05
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [all]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, APP-IS-PRIMARY, EXECUTION-OUTCOME-OBSERVABILITY, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS]
source: 2026-07-05 — Darrell; "Orchestration review, how should we work and what needs updated to have more efficient work look at my request today and review how we did add to our historical reviews for quality and freshness to be consistent and perpetual inside the PoeTech App."
---

## Context

The operating model exists (DR-0077) but reviews OF the work were scattered:
session notes (Layer 4), the daily-review workflow (report-only, ships
inactive), and `docs/reviews/REVIEWS.md` — which had sat 20 days without a
record (REV-0005, 2026-06-15) while ~200 merges landed. A review practice
that depends on a session remembering to review is not perpetual; the
registry aged silently, which is exactly the freshness failure it exists to
catch on other surfaces.

## Decision

1. **One registry, no parallel framework.** Orchestration (how-we-worked)
   reviews are records in the EXISTING `docs/reviews/REVIEWS.md` with
   `Type: orchestration` — same schema, same build-time parse
   (`__UIUX_REVIEWS__`), same in-app panel (Quality / Proof → Reviews,
   governor-gated).
2. **One record per reviewed working day** that merged to `main`: what was
   KEPT (with evidence) and each FRICTION carried as an action with an owner
   and a `re-review:` date (DR-0075). The full narrative stays a Layer 4
   session note the record points at.
3. **Freshness is measured, not promised.** The Reviews panel computes
   days-since-newest-record (`reviewFreshness` in `lib/quality-proof.js`) and
   flips to attention past 7 days — the registry says "stale" about itself
   in the app instead of aging silently. Proven-to-catch: stale date →
   attention; fresh → good; undated/empty or no clock → idle, never green.
4. **The review measures against the standing model** (DR-0077 lanes +
   orchestrator, DR-0076 verification, DR-0075 improvement) with real
   numbers (merge counts, PR sizes, gate results) — never vibes.

## Consequences

- First record: REV-0006 (the 2026-07-05 day — batch-size and
  merge-equals-migrate frictions carried with dates).
- The daily-review workflow remains ship-inactive (three brakes); when armed
  it can check the same freshness signal rather than a new one.
- A future stale chip is not an incident — it is the surface doing its job:
  the next working session appends the record and the chip clears.

## Links

`docs/reviews/REVIEWS.md` (REV-0006), `docs/99-session-notes/2026-07-05-orchestration-review.md`,
`app/src/lib/quality-proof.js` (`reviewFreshness`), `app/src/components/QualityProof.jsx`,
[DR-0077], [DR-0076], [DR-0075], [DR-0091], [DR-0065], [DR-0058].
