# DR-1338: What the AI cost, per task, is on the record — measured where a meter exists, said plainly where none does

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (a ledger file, a guard, one panel under Admin; no data path touched)
**Type:** ledger + gate (VERIFICATION-DOCTRINE, APP-IS-PRIMARY) · DR-1330 D8
**Area:** `app/src/lib/ai-usage-ledger.json`; `app/src/lib/ai-usage-ledger-rules.js`; `app/src/lib/ai-usage-ledger.js`; `scripts/ai-usage-ledger.mjs`; `app/src/components/AiUsageReport.jsx` (Admin → Proving our ways); `app/src/__tests__/ai-usage-ledger.test.jsx`; `.github/workflows/ci.yml` (guards leg)
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §4 measure, §8 honest uncertainty), DR-0115 (the delay ledger this sits beside), DR-0819 (Proving Our Ways, where it renders), DR-1330 (the review that measured the absence)

## Context

The Ways review (DR-1330) measured that AI spend was written per day on a runner and never per task, and that `delay-ledger.json`, built for "data-driven reasons to use this model AI or that one", held two entries. The slides closed with a project-results table: task, credits, cost, weeks without AI, time with AI. Darrell ratified the build.

## What was measured

- **One line per delivered task:** the model, the tokens and dollars where a meter exists, the wall clock measured from the previous push to the task's push (commit timestamps, never typed), and an engineer's estimate of the same work without AI, labelled an estimate. **Eight lines today**, the review and D1 to D7: 1.88 h measured against 100 h estimated.
- **What no meter gives is said, not filled.** The Claude Code session exposes no per-task tokens or price; the entries carry `tokens: null` and the panel reads "not metered". What the harness does expose is its budget counter: 15,000,000 at the session's start, 14,589,695 at the D7 push, so 410,305 tokens observed for the session, recorded as a subtraction of two readings. The validator refuses a cost with no tokens behind it and a session reading that is not that subtraction.
- **The guard:** `ai-usage-ledger.mjs --check` in the guards leg validates the file and requires every decision record numbered DR-1331 or higher to be named by a line; a record that lands without one is red. `--add` writes a line from flags, so a session records its own delivery in one command. Proven to catch in 6 unit cases.
- **In the app:** Admin → Proving our ways gains the cost panel beneath the measure of whether the ways serve the people: tiles for tasks, measured hours, estimated hours and the ratio, and the metered cost or "not metered" with the session tokens read; the empty state says what to do.

## Impact

The slides' table exists for this house and keeps itself: a build without its cost line does not merge. The estimate column is the honest half of the slide's claim, and it is named as an estimate on the page.

## Decision

The ledger and its guard are the Way for AI cost; a vendor call on a runner that reports tokens (`scripts/lib/vendors.mjs`) is ledgered with them. `re-review: 2026-12-05` — read whether the session's bill can be metered from the account side and fed here; until then the harness counter is the one reading we have.

## Verification

`ai-usage-ledger.mjs --check` OK (8 tasks, every record from DR-1331 covered); `ai-usage-ledger.test.jsx` 8 cases green; lint clean; the Admin-console suites green; `module-boundary-guard` OK; `ci.yml` parses.
