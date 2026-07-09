---
id: DR-0110
title: The deploy-freshness healer ships ACTIVE with a kill-switch (revises DR-0109's ship-inert clause) — a bounded, non-spawning deploy-healer is not the runaway class P11 gates
date: 2026-07-06
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [SURFACE-PREMISE, THREE-BRAKES, TIER-C, EXECUTION-OUTCOME-OBSERVABILITY, GOVERN-EXECUTE-ADVISE, WAYS-REVIEW, DECISION-RECORDS]
source: 2026-07-06 — Darrell "connectbot? have you reviewed our ways?" → the mandated ways-review (DR-0108) → Darrell chose option A ("a").
---

## Context

DR-0109 shipped the deploy-freshness healer INERT, gated on
`DEPLOY_FRESHNESS_ENABLED == 'true'`, citing P11 ("nothing self-activates
unattended; ship inactive, turn on with someone watching"). The mandated
ways-review (DR-0108), which Darrell triggered — *"connectbot? have you reviewed
our ways?"* — surfaced that this was an OVER-APPLICATION of the rule: the healer
is bounded, idempotent, single-flight, and spawns no Claude/compute, so it is not
the runaway class P11 was written for (the 2026-06-06 compute-spawning loops). It
is operationally identical to the `db-migrate` and `auto-merge` deploy dispatches,
which already ship ACTIVE and ungated. The inert gate created recurring friction
(the arming ask landed on Darrell repeatedly) and left poetech.us unprotected
until a human acted — during which a >30-min stale window occurred. Darrell chose
to ungate it (option A).

## Decision

1. **The healer ships ACTIVE.** The job condition changes from
   `vars.DEPLOY_FRESHNESS_ENABLED == 'true'` (opt-in) to
   `!= 'false'` (opt-out): unset ⇒ runs, so it heals `main` from its first fire
   with no activation step. This revises **DR-0109 §3** ("ships inert"); the rest
   of DR-0109 (the healer, the schedule, budget+lock brakes) stands unchanged.
2. **All three brakes remain.** BUDGET (≤1 single-flight deploy per fire) and
   LOCK (concurrency group + the deploy's own) are unchanged. The KILL-SWITCH is
   retained as an opt-out: set `DEPLOY_FRESHNESS_ENABLED='false'` (or disable the
   workflow in the Actions UI) to pause instantly.
3. **The narrow reconciliation with the three-brakes rule (recorded, not a
   blanket loosening):** shipping timer automation active is permitted ONLY for
   this bounded, non-spawning, single-flight, deterministic class (a deploy/
   migrate dispatcher). Anything that spawns Claude, compute, or more work on a
   clock STILL ships inert per THREE-BRAKES / P10–P12 — that rule is untouched for
   its actual class.
4. **What we did NOT decide:** not to weaken the three-brakes rule generally, and
   not the PAT-merge alternative. This is a scoped correction of one over-applied
   gate, logged as a ways-review (REV-0010, DR-0108).

## Rationale

Because uptime is senior to velocity (DR-0107) and a safeguard that depends on a
human arming it — or on a fragile session check-in — is not a safeguard; the
ways-review (DR-0108 / SURFACE-PREMISE) showed the "must be armed by hand" premise
was self-imposed, not required by the rule's intent. Matching the healer to how
its identical siblings (db-migrate, auto-merge dispatch) already ship removes the
inconsistency and the recurring friction that kept landing on the principal.

## Consequences

- On the next merge of this change, `deploy-freshness.yml` heals `main` every ~5
  min automatically, no arming, no session in the path. The manual session
  check-in becomes redundant and is retired.
- Reversible instantly: `DEPLOY_FRESHNESS_ENABLED='false'` or disable the workflow.
- The ways-review that produced this is logged as `REV-0010` (orchestration) per
  DR-0108; this DR is its "a way changed" record.

## Links

`.github/workflows/deploy-freshness.yml`, `docs/reviews/REVIEWS.md` (REV-0010),
[DR-0109] (the healer — this revises only its §3 arming clause),
[DR-0108] (ways-review mandate — the trigger), [DR-0107] (uptime bright line),
`CLAUDE.md` "Autonomous Automation Requires Three Brakes" (unchanged for its class).
