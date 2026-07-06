---
id: DR-0109
title: The continuous-efficiency pass — every task ends with one extra step that increases efficiency
date: 2026-07-06
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [CONTINUOUS-EFFICIENCY-PASS, WAYS-REVIEW, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: 2026-07-06 — Darrell; "keep pulling teachings and also add a new fix after just watching the process for upgrades that would make it more efficient based on the current workflows... keep that as the model or our Way of working — one extra step to make sure we are increasing efficiencies always."
---

## Context

Across one session the agent built three self-paced Learn courses and several
Generations game decks on the same shared pattern. In doing so it created three
near-identical ~100-line verse-append scripts (append-way-up-verses /
append-stewardship-verses / append-pride-verses), each `sed`-copied from the last.
The duplication was invisible from inside any single task — it only shows when you
step back and watch the WORKFLOW repeat. Darrell named the fix and the habit:
after finishing the work, take one extra step to watch the process just run and
ship the upgrade that would make the next run more efficient.

## Decision

1. **Every substantive task ends with a continuous-efficiency pass** — one extra,
   standing step after the work is verified: look at the WORKFLOW that was just
   executed (not only the product) and ask "what did I just do that the next run
   should not have to do again?" Duplication I copied, boilerplate I re-typed, a
   manual step that repeated, a slow path I took twice — that is the signal.
2. **Ship the upgrade it reveals, then and there** — a real fix in the same lane
   (tests + gates + PR), not a note for later. If the upgrade is genuinely too
   large to ship in the moment, it becomes a tracked item with a `re-review:` date
   (DR-0075) — never a silent drop. The bar is "the next run is measurably easier
   or cheaper," and the win is stated (e.g. "3 copied scripts → 1 registry entry").
3. **It is a NARROW efficiency pass, not scope creep** — it improves how the work
   is DONE (dedupe, extract a helper, parameterize, delete a dead path), inside
   the module-growth direction (DR-0103 lane, "grow modules not the monolith").
   It does not invent new product scope or new theology.
4. **Run without being re-asked, and surfaced by name** — like the reality-trace,
   the tests, and the ways-review, the efficiency pass is a named step the agent
   states as it closes a task; silence is not a skip.

## The first instance (proves the habit)

The three copied verse-append scripts were consolidated into ONE registry-driven
`scripts/append-verses.mjs`: adding a new teaching's verses is now a single
`BATCHES` entry instead of a copied ~100-line file. Proven a no-op on the existing
store (idempotent), so behavior is unchanged and only future friction drops.

## Grounds / pairings

- **WAYS-REVIEW (DR-0108)** — this is the per-task, always-on complement to the
  standing mandatory ways-review: DR-0108 is the scheduled pass over how we work;
  DR-0109 is the "one extra step" on the way out of every task.
- **PERPETUAL-IMPROVEMENT (DR-0075)** — everything gets better perpetually; this
  makes "better" include the workflow itself, not only the surface.
- **STREAMLINED-DELIVERY-LOOP (DR-0103)** — efficiency upgrades ride the same
  verified lane and keep the loop moving without being pushed.
- **VERIFICATION-DOCTRINE (DR-0076)** — the upgrade ships with evidence (a proven
  no-op, a passing suite), not a claim.
