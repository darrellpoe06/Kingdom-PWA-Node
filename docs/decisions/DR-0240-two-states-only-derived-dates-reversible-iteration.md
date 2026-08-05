---
id: DR-0240
title: Two states only — DONE with evidence, or CARRIED by a working system; dates derive from the measured delivery record, never invented; every iterative change is reversible with tests before and after
date: 2026-07-28
status: accepted
supersedes: []
superseded-by: null
tier: A
entities: [all]
grounds: [DO-THE-WORK, PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE, WAYS-REVIEW, THREE-BRAKES]
source: 2026-07-28 — Darrell, sharpening DR-0239 as it shipped; "I hate dating things we need done without the timelines being based on what we have accomplished in whatever timelines we already have done builds in... instead of fake never doing it timelines... iterative changes by Ari and to make sure it can just be rolled back testing before changes and after" and "Everything should be done or the systems should be working no other state... perpetually..."
---

## Context

The house's own measurements convict the old dating habit: REV-0206 found
168/260 dated re-review commitments past due — invented dates measure into
never. Meanwhile the real delivery record is FAST and known: push-to-squash-
merge runs ~4 minutes on green (REV-0207, measured on #1067), docs merges
~27 minutes, the review-watcher drives the dated queue daily, and this very
day shipped a research pass, a header fix, a sovereign mail archive, the
messaging roster repair, and a review standard — all same-session. A date not
derived from that record is fiction.

## Decision

1. **Two states only.** Every commitment, finding, or requirement exists in
   exactly one of two lawful states: **DONE** (evidence attached — a passing
   gate, a merge SHA, a measured number), or **CARRIED by a named working
   system** (the auto-merge lane in flight, a CI gate, the daily
   review-watcher, an armed Routine, a NAS loop). "Parked," "later," and a
   date with no carrier are unlawful states. Perpetually: if it is not done,
   a system must be working it.
2. **Dates derive from the measured record.** When a date is lawful at all
   (a named blocker: a value only Darrell holds, a physical step, an
   undecided bright line), it is computed from what the house has actually
   accomplished in like work — same-session is the default for buildable
   work (DR-0236); the watcher's daily cadence carries queue items; longer
   horizons cite the measured cycle they're based on. An invented date is a
   DR-0100 violation: an under-claim of the house's real speed.
3. **The iterative-change contract (Ari's lane).** Every iterative change —
   including the perpetual micro-upgrades of DR-0075 — ships with:
   (a) **tests before** — the full gate suite green on the change
   (~6,700+ tests, lint, guards, the layout probe); (b) **verification
   after** — the deploy proven (DR-0107), the site probed (DR-0125), the
   live user-view available (DR-0104); (c) **one-step rollback** — a squash
   merge reverts with a single `git revert`, runtime behavior carries a
   kill-switch or flag where it acts autonomously (THREE-BRAKES), and
   database migrations stay additive so a code revert never strands data.
   A change without a named rollback path does not ship.
4. **NOT decided:** no new scheduler or automation is spawned by this DR —
   the carriers named above already exist and run; this binds how they are
   used, not new compute.

## Consequences

- Every `re-review:` line written from today names its carrier and its
  derivation; the watcher's daily report is the enforcement surface for
  dates already on file (the 168-item backlog drains through it, oldest
  first, per REV-0236's discipline (renumbered from a double-minted REV-0175, 2026-08-05)).
- DR-0239's standard (dimension 6) is amended to carry this two-state law.
- **re-review: 2026-08-25** (carried by the review-watcher, derived from the
  DR-0239 first-month window it already shares): are any items in an
  unlawful third state; did any date lack a carrier?

## Links

[DR-0239] (the standard this sharpens), [DR-0236] (nothing waits),
[DR-0075] (why + date, now with derivation + carrier), [DR-0076] (evidence),
[DR-0103]/[DR-0107]/[DR-0104]/[DR-0125] (the before/after machinery),
REV-0206 (the 168/260 measurement), REV-0207 (the ~4-minute measured lane).
