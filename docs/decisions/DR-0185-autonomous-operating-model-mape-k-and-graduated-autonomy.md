---
id: DR-0185
title: The autonomous operating model — MAPE-K + graduated autonomy, documented and implemented
status: accepted
date: 2026-07-13
tier: A/B
declared_by: Darrell
supersedes: none
amends: none (grounds + names an operating model that DR-0175 + the ari-adjustments gate already implement)
principles: [WAYS-REVIEW (DR-0108), DO-THE-WORK-DONT-RE-ASK (DR-0111), VERIFICATION-DOCTRINE (DR-0076), STREAMLINED-DELIVERY (DR-0103), PERPETUAL-IMPROVEMENT (DR-0075), APP-IS-PRIMARY (DR-0065)]
---

## Context

Darrell, 2026-07-13:

> "Moving forward — and what I keep asking for — is that Ari keeps working without
> questions from me or you… document and add to the Ways after researching
> autonomous scalable processes for business and control systems, then implement
> the best ones after review and testing."

The recurring correction of the project — DR-0111 (do the work, don't re-ask),
DR-0178 (inert is a staging gate, not the resting state), DR-0103 (motion is the
default), DR-0089 (standing consent) — is one thing said many ways: **the resting
state of the work is running, not waiting.** This DR researches the established
patterns for autonomous, scalable operation, names the model, documents it as the
Ways, and implements the measured control loop.

## Research (2026-07-13)

- **Control systems — MAPE-K / autonomic computing (IBM).** The most influential
  reference loop for self-managing systems: **Monitor → Analyze → Plan → Execute**
  over a shared **Knowledge** store, on the homeostasis analogy — a system that
  holds its own desired state with minimal human intervention, on a closed loop.
- **Business — autonomous process automation.** Exception-based management (the
  machine handles the volume; humans handle the judgment/exceptions), human-on-the-
  loop approval for high-stakes/edge cases, a measured straight-through-processing
  (STP) rate, and a **graduated** rollout — start supervised, widen the machine's
  reach as measured reliability earns it.

Both validate the architecture already built and give it the canonical vocabulary.

## Decision

Adopt the **autonomous operating model** (foundation doc
`AUTONOMOUS-OPERATING-MODEL.md`) as the Ways:

1. **Keep working without questions.** Motion is the default; a question is an
   *exception* raised only for a genuine bright line (real money, destructive/
   irreversible act, new external publication, new COLG/family identity, a value
   only the human holds, or a verifiably-wrong premise). Everything else: proceed,
   then report. (Names the DR-0111 / DR-0178 through-line as the operating default.)
2. **Run the closed MAPE-K loop.** Monitor+Analyze = `ari-app-review.js`; Plan =
   the `ari-adjustments.js` gate; Execute = gated auto-apply + the human exception
   path; Knowledge = the audit log + the concern/re-review ledgers. Composed and
   **measured** in `ari-loop.js`.
3. **Gate autonomy by verification, not by asking.** Ari auto-applies only
   deterministic, reversible, evidence-backed fixes and logs each one; anything
   touching money, people/PHI, or the outward-facing world it proposes. The gate IS
   the safety (DR-0076) — it replaces the question, it does not add one.
4. **Measure the loop; widen by evidence.** STP rate (`auto / (auto + propose)`) +
   the audit log are real, measured numbers; the machine's reach grows only as
   reliability is measured (graduated autonomy), never by assertion or a painted
   target.

## Implementation (this DR)

- `docs/00-foundations/_root/AUTONOMOUS-OPERATING-MODEL.md` — the Ways doc.
- `app/src/lib/ari-loop.js` — the MAPE-K loop composing the review + the gate into
  one measured loop (STP rate, the graduated-autonomy stage, the MAPE-K stages);
  proven-to-catch in `ari-loop.test.js` (the payment finding is never auto-executed;
  the STP rate is the real split; a clean review yields an honest empty loop, not a
  fake 100%).
- Surfaced in **Ari Review** (Projects sub-tab): the control-loop headline + the
  live STP rate, above the auto/propose split.

Advisory — the CI gates stay the merge brake; this is how Ari operates *within*
them, on top of them.

## Consequences

- The autonomous default is now a named, documented, implemented Ways model, not a
  correction the agent must be told again. Recorded in memory as
  `feedback_autonomous_operating_model_mape_k`.
- New Ari standing capability `control-loop` (MAPE-K), building on `comprehensive-
  review` (DR-0175) and the `ari-adjustments` gate.
- Next increment (its own delivery, not this DR): the per-surface safe-op
  executors that let the Execute stage actually perform each gated fix; each raises
  the measured STP rate.
- A **REV** (orchestration ways-review) entry accompanies this per DR-0108.
