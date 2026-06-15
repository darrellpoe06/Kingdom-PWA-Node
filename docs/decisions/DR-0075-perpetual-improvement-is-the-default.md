---
id: DR-0075
title: Perpetual improvement is the default — a non-improvement is a justified, recorded decision with a re-review date; otherwise the steady state is feel/flow/smoothness micro-upgrades
date: 2026-06-15
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [DATA-DRIVEN-LIVING, QUALITY-OF-LIFE, GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, EXECUTION-OUTCOME-OBSERVABILITY, DECISION-RECORDS]
source: 2026-06-15 — Darrell: "everything must get better perpetually; if not, why — and if the why makes sense it's a decision and a re-review date that makes sense for the issue; or minor benefitable micro upgrades to feel, flow and smoothness." Declared after reviewing whether GUI quality is perpetually enforced or just "better than before."
---

## Context

The system already gates DATA isolation (DR-0060), WORKFLOWS
(`workflow-conformance`), and MISSION/ethics (wf36) — but the **direction** of
everything else (GUI, flows, copy, performance) was held only by discipline and
review-by-use. Discipline drifts; "better than before" is not the same as
"always getting better, and never silently stalling." Darrell named the missing
rule: improvement is not optional, and *not* improving something is itself a
decision that must be justified and revisited — never a silent default.

## Decision

**Perpetual improvement is the default state of every surface, flow, workflow,
and system.** The standing question for anything we touch — and anything we
*choose not to* touch — is "is this getting better?"

1. **Default = improve.** Every pass over a surface leaves it better than found.
   The always-on steady state, requiring no decision, is **minor beneficial
   micro-upgrades to feel, flow, and smoothness** — the small polish that
   compounds (tap response, spacing, motion, copy clarity, latency, a11y).
   These ship in the established lane (DR-0064); they are the normal flow, not
   events.

2. **Not improving requires a WHY.** Leaving something as-is — declining an
   upgrade, parking a known rough edge, choosing "good enough" — is allowed
   ONLY with a stated reason (cost now, lower priority, blocked dependency,
   risk, waiting on a person). "We'll leave it" without a why is not permitted.

3. **If the why holds, it is a recorded decision WITH a re-review date.** A
   justified non-improvement becomes a Decision Record (or a tracked queue
   entry for small ones) carrying a **`re-review:` date sized to the issue** —
   days for a hot rough edge, weeks/months for a deliberate deferral, tied to
   the unblocking event where one exists. Nothing parked is parked forever; the
   date is the promise that it is revisited. On the re-review date the item is
   re-decided: improve now, or re-justify with a new date.

4. **Nothing stagnates silently.** The absence of a why+date means the thing is
   still expected to improve. Silence is not consent to stall.

### The `re-review:` convention (the teeth)

A parked decision carries `re-review: YYYY-MM-DD` in its frontmatter (or its
queue row). Re-review dates are surfaced so they actually fire — via the
decision queue / the in-app Governor Review tab (DR-0061/0065) and, where a
hard date exists, a scheduled reminder. A passed re-review date with no action
is itself a flag.

## Consequences

- Every "leave it for now" in a session ends in one of two states: an
  improvement shipped, OR a one-line why + a `re-review:` date. The agent
  offers the second rather than letting an item drop.
- This is the posture behind the GUI-quality-gate question that prompted it:
  either build the perpetual GUI gate (the improvement) or park it with a why +
  re-review date — not leave it undecided. Same for any rough edge surfaced.
- It composes with the existing review cadence (DR-0058), the fruit loop
  (DR-0057), and QUALITY-OF-LIFE as the merge gate: those are the *engines* of
  improvement; this DR makes improvement the *default* and non-improvement the
  *exception that must be logged and dated*.
- Recorded in `CLAUDE.md` (Layer 0, loaded first every session) so the posture
  is held before the agent is asked — not only when this DR is consulted.

## Links

`CLAUDE.md` (Layer 0 entry), [DR-0058] (recurring review cadence — the engine),
[DR-0057] (continuous fruit loop), [DR-0064] (act-without-re-asking in lane —
micro-upgrades ride this), [DR-0061]/[DR-0065] (in-app surfaces — where
re-review dates are shown), QUALITY-OF-LIFE-AS-NORTH-STAR,
PERPETUAL-PIPELINE-HEALTH, EXCELLENCE-STANDARD (`docs/00-foundations/_root/`).
