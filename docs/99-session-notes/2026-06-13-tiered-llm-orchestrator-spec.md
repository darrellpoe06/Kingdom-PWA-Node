# Tiered-LLM Orchestrator — "The Perpetual Fix" — Spec

**Date:** 2026-06-13 · **Layer 4 working spec** · proposed under DR-0056.
**Posture:** propose → govern → build. This is the *propose*. It authorizes
nothing built or run (DR-0041). Every stage past v0 is a separate greenlight;
v1 is Tier C and never self-activates unattended.

> Darrell, 2026-06-13: *"The NAS n8n will need to wake up Claude and Gemini when
> it needs more LLM power or can get a better outcome than its capabilities, and
> then take over when the vendor LLMs can't create — so it's a perpetual fix —
> and I can work during Claude and Gemini hours."*

This is the engine of the 90/10: the system carries the routine, reaches for the
strongest available mind when it matters, and never fully stalls. It is the
sharpest statement of the already-ratified Sovereign Orchestrator (DR-0001 GPU
yield, DR-0029 escalate tier, DR-0037 Self-Extending Layer, DR-0040 auto-tagging,
the 2026-06-09 orchestrator architecture, DR-0053 the 4070 runner).

## 1. The escalation ladder

- **Tier 0 — LOCAL** (Ollama on the owned 4070, Qwen 2.5 14B): the default
  handler. Free, private, always-on within the GPU-yield schedule (DR-0001).
- **Tier 1 — ESCALATE UP to a vendor** (Claude and/or Gemini) when: local
  confidence is below threshold, OR the outcome-judge scores the local result
  below the acceptance bar, OR the task is tagged "needs frontier."
- **Tier 2 — FALL BACK to local** when: the vendor refuses (policy/safety), OR
  errors / times out / is unavailable, OR the task is sovereignty-tagged and
  must never leave the premises. The local model is the floor — the loop never
  fully stalls. **This is the "perpetual fix."**

## 2. The router (the net-new IP)

Per task: classify → route. Inputs: task-type tag, **sensitivity tag (DR-0040)**,
local-model confidence, outcome-judge score. Output: `local-only` /
`try-local-then-escalate` / `escalate-direct`.

**Hard sovereignty gate (binding):** any task tagged PHI / TLC / family-private
is `local-only`, NO exceptions — it can never be escalated to a vendor. The tag
is the decision; the egress guard (§5) is the enforcement; mis-tagging defaults
to the stricter (local-only) side.

## 3. The outcome judge (what makes "perpetual" terminate)

Decides "is this good enough" and "can the vendor create it." Without it the loop
escalates everything (waste) or accepts garbage. Implemented as a per-task-type
acceptance rubric (wf36 Quality Gatekeeper extended), scored by a model (local
first; a vendor only for hard judgments).

**Terminal condition on EVERY run (binding):** a run ends when (a) the judge
accepts an outcome, OR (b) the ladder is exhausted (local → vendor → local all
tried once), OR (c) a brake fires. **"Perpetual" means perpetual across tasks
over time — NEVER an infinite loop on one task.** This is the line between
Darrell's "perpetual fix" and the 2026-06-06 runaway.

## 4. The three brakes (mandatory — money AND compute on the line)

1. **BUDGET — two layers.**
   - **Hard ceiling = the prepaid vendor pool** (Darrell, 2026-06-13: "costs are
     already capped at the amount of tokens available; we increase if necessary
     or if we prove it's worth it"). The orchestrator can only ever spend what is
     loaded; the ceiling is raised deliberately, on proof.
   - **Sub-budgets underneath it:** a per-run token ceiling and a per-day vendor-
     spend ceiling — so a runaway *loop* cannot burn the whole prepaid pool in an
     hour. A run/day at its sub-ceiling stops escalating (falls to local or
     defers to the next window). The prepaid cap bounds total harm; the
     sub-budgets bound the *rate* of harm.
2. **CONCURRENCY LOCK** — single-instance per queue; a fire that finds a run in
   flight SKIPS, never stacks.
3. **KILL-SWITCH** — dead-man's-switch: on overrun, repeated failure, a missed
   heartbeat, or N escalations without an accepted outcome, the orchestrator
   PAUSES itself (`active=false`) and never auto-continues. A human clears it
   after looking.

## 5. Cage enforcement (every escalation)

- **Allowlist** — only approved task types may escalate; only approved vendors.
- **Append-only audit ledger** — every escalation logged (task, model, tokens,
  cost, outcome): the receipt AND the live spend tracker.
- **Egress guard** — vendor calls only from the allowed network path; a
  sovereignty-walled task physically cannot reach a vendor endpoint.

## 6. Scheduling — "vendor hours"

Vendor escalation runs only inside Darrell-defined windows, behind the Cage
schedule + the DR-0001 GPU yield (off-hours; never during church hours on the
shared GPU). **Event-driven by default (DR-0042):** escalation fires only when a
real task lands AND the window is open — never high-frequency polling, never a
self-re-queuing loop.

## 7. Staged ladder (earn autonomy stage by stage)

- **v0 — advisory router (no autonomous spend).** The router + judge run; when a
  task needs a vendor, the orchestrator PROPOSES it ("this needs Claude —
  approve?") and a human triggers the call. Proves the routing + judging logic
  with zero unattended spend. Buildable as soon as R4 + the judge exist.
- **v0.5 — bounded auto-escalation.** One task type, human-triggered batch, a
  tiny per-run budget, full audit. Earns trust on a small surface.
- **v1 — scheduled vendor-hours autonomy.** All three brakes + the Cage + the
  egress guard. **Tier C. Ships inactive. Never self-activates unattended, never
  while Darrell is traveling.** Turned on only with someone watching.

## 8. Requirements

- **R4** (the local runner on the 4070) standing up — gated on Darrell's infra
  values (UniFi / pfSense / mesh / VLAN IDs).
- Vendor keys + prepaid pools (`ANTHROPIC_API_KEY` exists from the Synthesizer;
  add a Gemini key).
- The **router + outcome-judge** (the net-new build) and the Cage primitives
  (audit ledger, allowlist, kill-switch, egress guard).

## 9. Constraints (honest)

- Highest-risk class on the roadmap: autonomous + self-triggering + spawns
  compute + spends real money. The 2026-06-06 runaway governs every stage.
- The sovereignty gate is absolute — the value of the local floor is that
  private work NEVER has to leave the premises to get done.
- The outcome-judge is the hard part; a weak judge makes the system either
  expensive (escalates everything) or unreliable (accepts garbage).

## 10. Acceptance test (method test)

Given a mixed queue — a routine doc task, a hard reasoning task, and a
PHI-tagged task — the orchestrator: handles the routine locally; escalates the
hard one to a vendor and accepts a judged-good outcome within budget; falls back
to local when a vendor refuses; and **never sends the PHI task off-premises** —
with every action in the audit ledger and every run hitting a terminal
condition. If that holds, the perpetual-fix engine is real and safe.
