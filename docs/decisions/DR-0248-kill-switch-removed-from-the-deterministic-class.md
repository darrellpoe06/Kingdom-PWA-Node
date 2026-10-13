# DR-0248 — The manual kill-switch is removed from the deterministic loop class

- **date:** 2026-07-29
- **status:** accepted
- **tier:** C carried with its proof (a brake-set change; the deterministic gate suite is the review)
- **decides:** the deterministic nas-loops class runs with budget + lock only; the manual kill-switch override is removed
- **amends:** brake 3 of the three-brakes convention as applied to the DETERMINISTIC class; NAS-LOOP-RUNNER-PATTERN.md updated in the same merge
- **pairs-with:** DR-0247 (started by default — same day, same word), DR-0080 (deterministic-first), DR-0076

## The trigger (the Governor's words)

Darrell 2026-07-29: *"Get rid of the kill switch... we will rebuild it after... I don't trust claude to remove it properly... we have over 6000 checks that are armed with cautions."* And: *"they are all switching deterministic logic... Too many in the code for a human to know when to turn them on or off."*

## The decision

1. **Removed, completely, from the deterministic class:** `decideRun()` no longer consults a kill-switch (a stray `killSwitch` input is IGNORED by design — pinned); the runner harness no longer reads `state/KILL_SWITCH` or `KILL_SWITCH_FILE`; the `--list` readout, the reel line, and every living doc say so plainly. "Removed properly" is proven by test, not asserted: the suite now FAILS if a kill-switch consultation returns to this gate.
2. **The protection is what the Governor named:** the deterministic gate suite (6,700+ checks at last full run), the per-loop budget caps and wall-clock timeouts, and the single-flight locks — all deterministic logic, all still pinned.
3. **The stop-paths are the lane's own deterministic logic:** registry `enabled:false` (a PR through the gates), deleting `ARMED-BY-RECORD` (a PR), or the per-loop DSM Task Scheduler toggle. No hidden manual override a human has to know to flip.
4. **Scope, stated honestly:** this removes the switch from the DETERMINISTIC dispatcher only. The AI-class gates (cap-resume/wake-router/the Cage — vendor spend, the 2026-06-06 runaway class) keep their full brake set until their own rebuild decision; extending this removal there is a separate DR when the Governor speaks it.
5. **The rebuild:** *"we will rebuild it after"* — if a fleet-wide stop is wanted again, it returns as deterministic, lane-governed logic (e.g. a committed STOP record symmetric to ARMED-BY-RECORD), never as an untracked local file. `re-review: 2026-08-25`.

## Verification

`nas-loops.test.js` — the old "kill-switch blocks" pin is REPLACED by "a killSwitch input is ignored" (proven both ways: armed+stray-switch → GO; cap/lock still HOLD); `started-by-record.test.js` pins the removal, the surviving brakes, and the stop-path documentation; `sh -n` + `--list` run clean; full suite + lint on the PR.
