---
id: DR-0255
title: Every processing lane is watched — event-driven by Ari + a team of bots/LLMs; reflexive timers are the defect
status: accepted
date: 2026-07-30
tier: C
declared_by: Darrell
supersedes: none
amends: DR-0103 §3 (sharpens the cadence rule); grounds LESSONS P39
principles: [MACHINERY-OVER-MEMORY (DR-0250), STREAMLINED-LOOP (DR-0103), SHIP-ACTIVE-FAIL-VISIBLE (DR-0254), THREE-BRAKES (P10/P11/P12), SITE-HAS-ITS-OWN-WITNESS (DR-0125), VERIFICATION-DOCTRINE (DR-0076)]
---

## Context

Darrell, 2026-07-30, two corrections in one thread:

> "60 minutes delay??!!!!!!!! Ways and documentation review requirements are the
> sound? opportunities and constraints"

> "all the processing lanes should be watched by Ari and team of bots and or
> LLMs... etc..."

The agent had armed a **60-minute** self check-in for a PR that auto-merges in
~3 minutes — and `list_triggers` showed this was a *repeated* pattern of
~60-min check-ins. DR-0103 §3 and ORCHESTRATION §8 already say "minutes matched
to change rate, never a reflexive hour," so the **rule is sound; enforcement was
not** — it lived as agent judgment, and the generic "~1 hour" PR-watch reflex
(from the harness subscription note, meant for the long-tail) overrode our own
Way. That is a machinery-over-memory gap (DR-0250): a rule in a document loses to
a reflex in the weights.

## Decision

**Every processing lane is WATCHED, and the watch is EVENT-DRIVEN — not a
reflexive timer.**

1. **Event-driven is primary.** A lane is watched by something that wakes on an
   actual state change — the PR-activity webhook subscription, `site-health.yml`
   filing on the incident issue (DR-0125), the review-watcher, OpsBoard reading
   live lane state. When the signal is event-driven there is no cadence to guess.

2. **A timer is a FALLBACK only, and its cadence matches the work's real change
   rate.** For in-flight CI (~3 min) the fallback is ~3–5 minutes, re-armed short
   until the state resolves. **A reflexive hour for fast-changing work is a
   defect, not caution** (DR-0103 §3). A longer heartbeat is legitimate ONLY for
   a genuinely slow external wait (a deploy that self-heals, a base-branch fix),
   and it is named as such.

3. **The team watches the lanes — Ari + bots/LLMs — fail-visible.** The standing
   direction: every processing lane (CI, auto-open-pr, auto-merge,
   deploy-cloudflare-pages, db-migrate, rls-isolation, site-health, the NAS
   pipelines) has a watcher whose state renders where it can be SEEN — OpsBoard /
   the incident ledger — so a failure shows easily and never sits silent
   (DR-0254 fail-visible; DR-0076 anti-theater). Value comes from the
   deterministic signal, not from a human remembering to look.

## Constraints (stated plainly — DR-0100)

- **An LLM/bot watching a lane on a clock is the three-brakes class**
  (P10/P11/P12 — the 2026-06-06 runaway). Any such watcher ships with budget +
  single-instance lock + kill-switch proven-to-catch, and (DR-0247/0248) arms by
  merge once proven. Event-driven webhooks are cheaper and brake-light — prefer
  them over polling LLMs wherever a real event exists.
- **The cloud sandbox cannot reach poetech.us** — outside-in probes run on a
  GitHub runner or the NAS, never the sandbox (DR-0125).
- **The check-in cadence itself is not CI-gatable** (a Routine's delay is not in
  the repo). The machinery that closes it is therefore (a) event-driven waking so
  the timer matters less, and (b) the sharpened, unambiguous rule below — not a
  green check. Honest: this one is judgment mitigated by design, not a gate.

## Consequences / immediate

- This session's 60-min check-in was deleted and re-armed at ~5 min (matched to
  CI). Recorded as **LESSONS P39** (the recurring reflexive-hour defect + this
  fix).
- DR-0103 §3 and ORCHESTRATION §8 wording sharpened: event-driven primary; timer
  = short matched fallback; reflexive hour = defect.
- **Routed opportunity:** the full lane-watch fabric (a watcher per lane, on
  OpsBoard, Ari + bots) built with the three brakes designed-in and
  proven-to-catch, shipped active (DR-0254). re-review: 2026-08-06.
