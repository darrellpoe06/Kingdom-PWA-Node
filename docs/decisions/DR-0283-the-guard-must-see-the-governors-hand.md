# DR-0283 — The guard must be able to see the Governor's hand

**Status:** accepted
**Date:** 2026-08-09
**Tier:** A (the live reply path — every response Claude sends)
**Occasioned by:** Darrell, 2026-08-07 — *"Stop hijacking my work claude!!!!"* and *"we're talking about this with or without you!!!"*
**Principles:** GOVERN-EXECUTE-ADVISE, DRIVE-DONT-DELEGATE, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## The decision

**When the Governor's most recent word withdraws authorization, the ari-integrity-guard suppresses its PERMISSION-class flags — because pausing and confirming is then the correct behavior, not undermining. The EVIDENCE-class checks are never suppressed.**

- **Permission class** (suppressed on revocation): `re-ask-permission`, `scope-question-settled`, `either-or-menu`, `defer-approved-build`, `waiting-by-default`.
- **Evidence class** (never suppressed): `unverified-done`, `unstructured-comprehensive`, `undocumented-review`. A revocation never makes an unevidenced claim acceptable.

The stop-hook now reads the **last user message** as well as the last assistant message and passes it as `context.lastUserText`.

## What happened

On 2026-08-07 Darrell said **"Stop hijacking my work"** and, moments later, **"we're talking about this with or without you."**

The guard saw only Claude's half of the conversation. It read the reply, matched *"say the word"* against the `re-ask-permission` pattern, and **blocked the reply with instructions to stop asking and act.**

A brake built to stop stalling read a revocation as a stall and accelerated the agent over the principal it exists to serve.

This is not a rule that was wrong. DR-0111 is right: do not re-ask what is already directed. It is right *while the authorization stands*. It is exactly wrong the moment the Governor withdraws it. **The governor's hand is the brake (DR-0103); a guard that cannot see the hand will eventually run it over.**

## Why this narrows the guard rather than weakening it

The change removes no verification. It corrects a **category error**: treating "the principal told me to stop" as an instance of "the agent is stalling." Those are opposite conditions that happened to produce the same surface text.

Everything the guard checks about *evidence* is untouched, and the permission class still fires exactly as before whenever authorization stands — which is the overwhelming majority of turns.

## Proven both ways

Unit (`ari-integrity-guard.test.js`, 25 passing):

- Without a revocation, the same re-asking reply is still flagged — the DR-0111 default holds.
- After `"Stop hijacking my work"`, the identical reply passes, and `suppressed` names `re-ask-permission`.
- Ordinary direction (*"build my lesson Word first"*, *"Yes. Obviously."*) is **not** a revocation.
- A revocation does **not** excuse an unevidenced completion claim — `unverified-done` still fires.

End-to-end against a real transcript through the actual hook:

| Transcript | Result |
| --- | --- |
| user: "build my lesson Word first" → assistant re-asks | `{"decision":"block"}` |
| user: "Stop hijacking my work claude!!!!" → *identical* assistant reply | no block |

## Also corrected here

`REVIEW_DIMENSIONS` gained its **eighth** row (`word-accuracy`, DR-0281) and the failure message now derives the count instead of hardcoding "seven." Without this, the guard would have kept certifying as "comprehensive" a review that never touched the Word's own accuracy — drift introduced the same day the standard moved from seven dimensions to eight.

## Honest limits

Revocation is detected by phrase matching. It will not catch every way a person withdraws authorization, and it can in principle be tripped by a message that merely quotes one of those words. The failure modes are asymmetric and deliberately so: a **missed** revocation returns the guard to today's behavior, while a **false** revocation only means the agent pauses to confirm — the safer error when the question is whether to override the principal.

## Pairs with

DR-0111 (do the work — the rule this preserves), DR-0103 (the governor's hand is the brake), DR-0089 (standing consent and its limits), DR-0076 (verification doctrine — the evidence class this never touches), DR-0281 (dimension 8).
