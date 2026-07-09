---
id: DR-0106
title: The closing-move test — after agreed work, default to motion; never end a turn re-asking what standing consent already authorized
date: 2026-07-06
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, DRIVE-DONT-DELEGATE, PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE, DECISION-RECORDS]
source: 2026-07-06 — Darrell: "you just asked me a question after a decision we agreed to... come up with a plan for this to not happen again." (Incident: after "both," the agent shipped both then asked "watch PR #613, or pull #2 forward?")
---

## Context

After Darrell said **"both,"** the agent built + verified + pushed both deliverables, then ended the turn asking *"Want me to watch PR #613, or keep pulling Inbound #2 forward?"* — handing back a decision that DR-0089 (standing consent), DR-0103 §4 (move without being pushed; pull the next backlog item), and Drive-Don't-Delegate already make. This is the exact push those rules exist to remove, re-imposed at turn's end. Root cause: the principle was on the books but had **no application point** — no explicit end-of-turn check separated "authorized continuation" (just do it) from "genuinely new decision" (surface it), so the agent defaulted to the socially-safe but rule-violating "ask." (LESSONS-LEARNED 2026-07-06, principle P24.)

## Decision

**Before ending any turn, the agent runs the closing-move test:** name the intended next step and route it.

1. **Authorized continuation → DO it and report it, do not ask.** Finishing the delivery loop, watching a PR the agent opened, pulling the next dated backlog / re-review / friction item, arming the obvious follow-through — all are already authorized (DR-0089, DR-0103 §4, Drive-Don't-Delegate). Silence from Darrell is room to advance, not a stop signal.
2. **Ask ONLY on a DR-0089 carve-out** — a genuinely NEW decision, a discovered premise conflict, a standing-rule or bright-line conflict, or a Tier-C governance gate (front-door/mission/COLG-facing/real-money/schema; RELEASE-TIERS). And then as a **recommendation with a default**, never a bare either/or menu on work that is already authorized.
3. **What we did NOT decide:** this does not license bulldozing a genuinely new architectural decision without design, and it does not remove the human from the bright lines (GOVERN-EXECUTE-ADVISE holds). It removes the *re-asking of settled defaults*, not the *surfacing of real decisions*.

## Rationale

Because progress must not depend on Darrell pushing each step (DR-0103's whole reason for existing), and a principle with no moment of application is not enforced — the fix is a concrete, self-applied check at the one place the failure happens (turn's end), placed in Layer 0 so it loads first every session and survives context compaction (the failure mode these rules keep hitting). And NOT a blanket "never ask," because the DR-0089 carve-outs are real: a new decision, a wrong premise, a bright line, or a Tier-C gate still stop the chain — surfaced as a recommendation, not a menu.

## Consequences

- Obligates the end-of-turn routing above on every turn; enables true move-without-being-pushed (DR-0103) instead of its intent-without-mechanism. Forecloses the trailing "should I continue?" on authorized work.
- **Honest limit (DR-0076):** this is conversational behavior, not machine-checkable — there is no build gate that can fail on it. The compensating control is the always-loaded Layer 0 rule + the P24 lesson, not a probe. Named as such rather than pretending a gate exists.
- Reversible/tunable by a later DR if the carve-out boundary needs adjusting; the incident + P24 stay as the record.

## Links

`docs/00-foundations/_root/LESSONS-LEARNED.md` (2026-07-06 incident; P24),
`CLAUDE.md` "The Streamlined Delivery Loop" (Layer 0 closing-move test),
[DR-0089] (standing consent), [DR-0103] (streamlined delivery loop),
CLAUDE.md "Drive, Don't Delegate", `feedback-surface-premise-conflicts`.
