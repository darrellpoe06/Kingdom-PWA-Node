---
id: DR-0622
title: Every intake is carried to an outcome the ecosystem communicates — each note is categorized by rule (low-hanging fruit, already decided, real work, needs one thing), the sender reads the outcome with its reason, record or measured window, and small fixes go through the gated lane by themselves
status: accepted
date: 2026-09-24
tier: C carried with its proof (an AI-class auto-fix path; the deterministic gate suite is the review, DR-0225)
type: build
declared_by: Darrell
scope:
  - app/src/lib/intake-outcome.js (the categorizer, the sender's outcome, the measured window)
  - scripts/lib/intake-ledger.mjs, scripts/intake-census.mjs (the same categorizer over the live rows, on the runner)
  - scripts/sovereign-read-over-tailnet.sh + .github/workflows/sovereign-read.yml (the `intake` census mode)
principles: [HOLD-THE-HAND (DR-0621), VERIFICATION-DOCTRINE (DR-0076), THREE-BRAKES, STARTED-BY-DEFAULT (DR-0247), BRAKES-ARE-BUILD-REQUIREMENTS (DR-0225), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0621 item 3a and its Limits item 3 — "every intake is carried to an outcome the ecosystem communicates", built next, same day
  - DR-0616 — the triage states and the receipt this builds on
source: 2026-09-24 — Darrell, spoken (quoted in Context)
---

## Context

Darrell, 2026-09-24: "when we have failures from feedbacks that come from users or from me directly or from anything, any direction you get it from intake, however it comes, it should go through our workflow system and be categorized in a way where if it's low hanging fruit, then we fix it. The system fixes it automatically ... but if it's something that we already we've already done we've already looked at we've already ascertained and said we're not doing then there's an explanation and then there's a reason why that is there ... i don't need to communicate and i don't want humans to have to communicate that i want the PoeTech whole ecosystem to do the work ... actions speak louder than words."

## Decision

1. **Every intake is categorized by rule, with its basis kept.** `app/src/lib/intake-outcome.js` `categorizeIntake` puts each note in one of four categories: low-hanging fruit, already decided, real work, or needs one thing. Two more are said plainly rather than forced into those four: praise, and machine telemetry. The categorizer is deterministic: no model, no clock, and the same answer on the sender's phone, the steward's board and the runner. Each category carries a `basis` naming the rule, the record or the earlier note it stands on. A note no rule recognizes is real work with the basis "No rule matched; a person reads it." It is never guessed.
2. **"Already decided" cites the record and its reason.** Two sources are checked. The first is a steward's earlier decline of the same thing, with the steward's own reason. The second is the decision ledger: only accepted records are used, matched on rare shared words including at least two from the title. The first sentence of the record's Decision is given as the reason. Where records are close, the newer one wins, because the ledger is append-only and a newer record governs the one it amends (the real ledger: DR-0248 over DR-0110). A bug report, data loss, sign-in or privacy note is never answered this way.
3. **Low-hanging fruit is an allowlist, not a feeling.** It covers wording and spelling, a label that says the wrong thing, and text too small or hard to read, each with a scope (copy or style). Some subjects are never auto-fixed, however small the change looks: money and giving, sign-in, accounts, privacy and security, data, schema, the Word's own text, and the names of the Godhead.
4. **The window is measured, never invented.** The first choice is intake-to-outcome time from notes that reached an outcome. If there are too few of those, the lane's own open-to-merge time is used, measured from merged pull requests and named as lane time. With fewer than five samples, no window is given, and the receipt says so.
5. **The live rows are counted by the same module.** `sovereign-read` gains an `intake` mode. On the runner it categorizes every non-confidential row of the database the app reads. It prints counts per category and per basis. The only text it prints is a short masked snippet for each low-hanging and already-decided row, so their precision can be audited. The raw rows never reach the log.

## Verification

- `app/src/__tests__/intake-outcome.test.js`: every rule and every receipt state, proven to catch and proven quiet. This includes the defect it caught: the form's own "Not working:" label made every note read as a bug.

## Limits, stated

This record is extended as each increment lands on `claude/every-intake-carried-to-an-outcome`.
