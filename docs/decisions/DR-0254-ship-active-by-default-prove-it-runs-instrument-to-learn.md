---
id: DR-0254
title: Ship ACTIVE by default — prove it runs, instrument it to learn
status: accepted
date: 2026-07-30
tier: B
declared_by: Darrell
supersedes: none
amends: DR-0247/DR-0248 (started-by-default extended from the deterministic loop class to ALL feature work); retires the "family-facing runtime ships inactive" clause this session had put in the daily-drive Routine prompt and the REV-0217 note
principles: [STARTED-BY-DEFAULT (DR-0247/0248), PERPETUAL-IMPROVEMENT (DR-0075), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), DO-THE-WORK-DONT-RE-ASK (DR-0111), NOTHING-WAITS (DR-0236), THREE-BRAKES (P10/P11/P12)]
---

## Context

Darrell, 2026-07-30, correcting the agent for shipping a family-facing runtime
change "inactive/flagged" as a self-chosen default:

> "We don't ship items inactive unless I explicitly say that... moving forward...
> default is active and giving data to understand the iterative Ways we like and
> adoption happening while we experience the systems etc..."

> "We expect it to run and make sure it does whatever it is designed to do...
> obviously..."

> "Each change should enhance our understanding of the systems etc..."

The agent had invented an **inactive-by-default** posture for "family-facing
runtime changes" — a self-imposed brake Darrell never asked for. That is the same
class of failure as a fake boundary (DR-0250): parking real, buildable, agreed
capability behind a caution the house never declared. It is also the exact stall
DR-0247/0248 already corrected for the deterministic loop class ("I always want
everything started not waiting for a human"), now stated as a general rule for
**all** feature work.

## Decision

**The default state of every shipped change is ACTIVE.** Three parts, binding:

1. **ACTIVE by default.** A change ships live and ON. It is NOT gated behind a
   flag, a soak, or an "inactive until turned on" step **unless Darrell
   explicitly says to ship it inactive.** "Family-facing," "runtime," "new
   surface," or "additive" do NOT by themselves justify shipping dark — those
   were the agent's inventions, and they are retired. When the agent thinks a
   change genuinely should ship inactive, that is a recommendation to surface,
   not a default to assume.

2. **Prove it RUNS — end-to-end, on the real system, evaluated while live data
   flows.** Shipped ≠ merged. "We expect it to run and make sure it does whatever
   it is designed to do." The agent verifies the change actually does its job on
   the live system (reality-trace, a live observation, a real result), not only
   that the unit test passed or the PR merged (DR-0076 / DR-0061 / DR-0107).
   Evaluation is CONTINUOUS — "evaluation while live data is flowing" — the
   system is judged as it runs with real data, not only at a pre-merge gate. A
   change that cannot be shown to run is not done.

3. **Instrument it to LEARN — and surface FAILURES easily.** "Each change should
   enhance our understanding of the systems." A change ships with the means to
   observe its own adoption and behavior — real usage data, a live surface, a
   measured signal — so we learn the iterative Ways we like *while experiencing
   the systems*, not by guessing. And "activated systems should show the failures
   easily": an active system fails LOUD and OBSERVABLE — its failures render
   where they can be seen (the site-health / OpsBoard pattern, DR-0125), never
   silently. A green light that hides its own breakage is a lie (DR-0076
   anti-theater). Active + instrumented + fail-visible is how the platform
   improves perpetually (DR-0075); dark, un-instrumented, or silent-on-failure
   changes teach us nothing.

## The narrow carve-outs (unchanged, and NOT a feature toggle)

Active-by-default governs FEATURE activation. Two separate classes still route to
Darrell, and neither is an excuse to ship a normal feature dark:

- **Timer-driven / compute-spawning automation** still requires its three brakes
  — budget, single-instance lock, kill-switch (P10/P11/P12, the 2026-06-06
  runaway). Per DR-0247/0248 that class STARTS ITSELF through the lane once its
  brakes are proven-to-catch; the brakes are runaway safety, not a feature
  switch. Absent/unproven brakes → it does not go active. Present + proven → it
  arms by merge like everything else.
- **Genuine governor bright lines** — real money moving, a COLG/family
  **identity** choice, a destructive/irreversible action, a new external
  publication — still come to Darrell as a recommendation with a default
  (DR-0111). These are decisions, not activation states.

Everything outside those two is active on merge.

## Consequences

- The daily-drive Routine prompt's "FAMILY-FACING RUNTIME CHANGES ship inactive"
  clause is **removed** and replaced with active-by-default + prove-it-runs +
  instrument-to-learn (the narrow carve-outs above retained).
- REV-0217's note and REV-0216's carried `decideChildAction` item are corrected:
  when that child-gate wiring is built, it ships **active and instrumented** (the
  gate's own decisions are the adoption/behavior data), not "inactive/flagged."
- Pairs with DR-0250 (a self-invented "ship inactive" is a fake boundary),
  DR-0075 (active + instrumented = the perpetual-improvement engine), DR-0107
  (prove the deploy — now prove it RUNS), DR-0225 (brakes are build requirements,
  never a stall).
