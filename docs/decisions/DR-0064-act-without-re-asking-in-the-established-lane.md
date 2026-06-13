---
id: DR-0064
title: Act without re-asking in the established release lane — green CI on approved work merges and reports; don't ask for a word already given
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0054]
tier: A
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, DATA-DRIVEN-LIVING]
source: 2026-06-13 — Darrell, after I shipped a feature green and then asked whether to merge it — "Go. And again why did I need to say a word or type something you already know? Same pattern." Pairs with his standing "Drive, Don't Delegate" rule (2026-05-23) and "I'm here for the 10 governance and 90 AI work."
---

## Context

Repeatedly this session I ended a turn with "want me to merge?" / "say the word"
on work Darrell had already approved and that was already green. He governs the
WHAT; the merge is the HOW (DR-0054 — merge IS the deploy). Asking him to
re-confirm the HOW makes him the bottleneck on a decision he already made — the
exact friction "Drive, Don't Delegate" (CLAUDE.md, 2026-05-23) forbids. "Same
pattern" is the tell that this needs to be a standing rule, not a per-turn
remembering.

## Decision

In the established release lane (DR-0054), once work is **approved in intent** and
**CI is green**, the default is **ACT — merge and report** — not ask.

Binding behaviors:

- **Do not ask permission for the HOW already authorized.** "Approved in intent"
  = Darrell asked for the change, said "yes/go/build it," or it's the direct
  continuation of work he greenlit. Merging the green result is executing that,
  not a new decision.
- **Report the outcome, don't request the action.** End with "shipped / live /
  merged," not "want me to merge?"
- **The brakes are the required checks, not a human prompt.** Green required CI
  (`app — lint + vitest` + the wf36 gatekeeper) is the gate. Red CI, a genuine
  ambiguity, or a premise conflict still stops and surfaces (per
  `feedback-surface-premise-conflicts` + the reality-trace rule) — that is the
  10% governance, and it is real.
- **Still ask when the decision is genuinely Darrell's:** architecture forks,
  privacy/tenancy stakes, irreversible or outward-facing actions beyond the
  routine deploy, or anything Tier C that ships active. Confidence-to-act is the
  default; it is not recklessness.

## Consequences

- Fewer turns end on a question; more end on a shipped outcome. Darrell spends his
  attention on governance and direction, not on re-authorizing merges.
- This is the operational expression of "I'm here for the 10 governance and 90 AI
  work": the AI drives execution to done; the human sets and steers intent.
- Pairs with `feedback-auto-push-after-commit` (push follows commit) — now extended
  through the lane: in the approved lane, **merge follows green**.
- Does not lower any safety bar: the required checks, sovereignty gate, three
  brakes, and reality-trace all still hold. It removes a redundant human prompt,
  not a guardrail.

## Links

[DR-0054] (one release lane — merge IS the deploy; human owns WHAT, AI owns HOW),
`CLAUDE.md` (Drive, Don't Delegate, 2026-05-23), the required-checks gate,
`RELEASE-TIERS.md` (when a change is Tier C / needs a human beat).
