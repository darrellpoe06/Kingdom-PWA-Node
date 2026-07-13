# AUTONOMOUS-OPERATING-MODEL

**Layer 3 foundation. Added 2026-07-13, declared by Darrell; recorded as DR-0185.**

> "Moving forward — and what I keep asking for — is that Ari keeps working without
> questions from me or you… document and add to the Ways after researching
> autonomous scalable processes for business and control systems, then implement
> the best ones after review and testing." — Darrell, 2026-07-13

This is the Ways doc for **how the system runs itself**: Ari (and the agent) keep
working autonomously, escalating only the genuine exceptions, on a closed control
loop that is measured, gated, and improves itself. It is the operating model the
`ari-app-review` (DR-0175) and `ari-adjustments` gate implement, given its proper
name and its research grounding.

## The default is MOTION, not questions

The recurring correction of this project (DR-0111 do-the-work, DR-0178 inert-is-a-
staging-gate, DR-0103 streamlined-delivery, DR-0089 standing-consent) is one thing:
**the resting state of the work is running, not waiting.** Ari and the agent keep
working without asking; a question is an *exception*, raised only when a genuine
bright line is hit (real money moving, a destructive/irreversible act, a new
external publication, a new COLG/family identity choice, a value only the human
holds, or a verifiably-wrong premise). Everything else: proceed, then report.

This is not a new rule — it is the through-line of the Ways, named here as the
operating default so it is inherited, not re-litigated.

## The control loop: MAPE-K

The research grounding is **autonomic computing** (IBM) and its **MAPE-K** reference
loop — the most influential control model for self-managing systems, built on the
homeostasis analogy: a system that maintains its own desired state with minimal
human intervention, on a closed feedback loop.[^mapek] MAPE-K = **Monitor →
Analyze → Plan → Execute**, over a shared **Knowledge** store.

Our implementation maps 1:1 onto pieces already built:

| MAPE-K stage | What it does | In PoeTech |
|---|---|---|
| **Monitor** | Collect real data about the managed element | `ari-app-review.js` reads the app's own records across five dimensions |
| **Analyze** | Evaluate against the desired state | the same review ranks findings with evidence (DR-0076) |
| **Plan** | Choose the actions that reach the desired state | `ari-adjustments.js` — the gate: which fixes are safe for Ari vs which a human governs |
| **Execute** | Apply the chosen actions via effectors | gated auto-apply of safe, reversible, evidence-backed fixes; per-surface executors plug into the gate |
| **Knowledge** | The shared repository the loop learns from | the audit log (every auto-apply, reversible + attributed) + the concerns / re-review ledgers |

`ari-loop.js` composes these into one measured loop.

## Graduated autonomy + exception-based management

The research grounding for the *business* side is autonomous business-process
automation: **automation handles the volume, humans handle the judgment.**[^bpa]
The proven rollout is **graduated** — start supervised, then expand the machine's
reach as measured reliability earns it; route the high-stakes and edge cases to a
human with context (human-on-the-loop), not every item.

The gate (`ari-adjustments.js`) is exactly this, encoded as the verification
doctrine (DR-0076): **propose + gated auto-apply.** Ari applies only deterministic,
reversible, evidence-backed corrections on its own and logs each one; anything
touching **money, people/PHI, or the outward-facing world** — or anything not
provably safe — is an *exception* it proposes for a human. The default is propose;
the allowlist is conservative; the gate widens only as reliability is measured, not
by assertion.

### The control metric

The health of the loop is measured, not claimed:

- **Straight-through rate (STP)** = `auto / (auto + propose)` — the share Ari
  handles end-to-end without a human. It rises as the safe-op executors and the
  allowlist mature; it is a *measured* number, never a target painted green.
- **Every auto-apply is logged** (reversible + attributed) — so autonomy is
  auditable, and a wrong move is caught and reversed, not silent.

## The binding way

1. **Keep working without questions.** Motion is the default; a question is an
   exception for a genuine bright line only. (DR-0111, DR-0178, DR-0089.)
2. **Run the closed loop.** Monitor → Analyze → Plan → Execute → Knowledge; Ari
   reviews its own built process and adjusts it on the loop (DR-0175).
3. **Gate autonomy by verification, not by asking.** Auto-apply only the provably
   safe; propose the rest. The gate IS the safety (DR-0076); it replaces the
   question, it does not add one.
4. **Measure the loop; widen by evidence.** STP rate + the audit log are real;
   the machine's reach grows only as measured reliability earns it (graduated
   autonomy), never by assertion.
5. **Log everything the machine does.** Reversible + attributed; nothing silent.

This model is scalable by construction: it absorbs volume without proportional
human effort (the human touches exceptions, not every item), it is idempotent and
resumable at each stage, and it consolidates into the one app where the work runs
(APP-IS-PRIMARY, ONE-APP-EVERYTHING-COMES-TOGETHER).

---

**Sources (researched 2026-07-13):**

[^mapek]: IBM autonomic computing / the MAPE-K reference control loop — Monitor-Analyze-Plan-Execute over shared Knowledge; closed-loop self-management on the homeostasis analogy. (TechTarget, "What is Autonomic Computing"; IEEE/Springer on MAPE-K feedback loops for self-adaptation.)

[^bpa]: Autonomous business-process automation patterns — exception-based management, human-on-the-loop approval for high-stakes/edge cases, straight-through-processing rates, and the graduated "start supervised, expand as metrics prove reliability" rollout. (StackAI, "Human-in-the-Loop AI Agents"; enterprise BPA guides, 2026.)
