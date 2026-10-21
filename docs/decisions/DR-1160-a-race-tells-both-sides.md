# DR-1160: A race tells both sides — the contested warning reaches a person, not a step summary

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (one comment on a PR; the check's pass/fail behaviour is unchanged)
**Type:** way

**Area:** `.github/workflows/dr-number-claim.yml`, `app/src/__tests__/a-number-claimed-twice-is-caught-before-the-merge.test.js`.

**Principles:** DR-1147 (the check that classifies rather than merely detects; a race reports and never fails); DR-1136 (merge order is the only tiebreak both sides agree on; the record that took an occupied number moves); DR-1021 (the renumber is a tool, and the convention change that would truly prevent a collision is a Governor's call); DR-0076 (say what was measured); DR-0236 (nothing buildable waits).

## Context

**DR-1147 got the classification right and the delivery wrong.** It decided that `contested-with-open-pr` **reports and never fails**, which is correct: two open PRs wanting one number is a race nobody has lost, merge order has not happened yet, and failing both would be a gate picking a winner it has no standing to pick. It then printed that report into a **step summary**, which nobody opens.

So the session that merged second learned about the collision the same way it always had: **main went red.** And paid the same price — a rename, a citation pass read by hand, a gate run, a full re-verify, and on two occasions a redo because main moved mid-repair.

DR-1147 dated the open question `re-review: 2026-11-03`: *did the contested-warning prove enough, or is a claim-time reservation worth its weight?* The answer arrived thirteen days early.

## What was measured

Measured 2026-10-21, on the live repository:

| | |
|---|---|
| collisions landed on main in eleven hours | **9** |
| DR numbers taken by other sessions in one hour (04:30–05:30) | **5** — 1153, 1154, 1155, 1156, 1157 |
| open PRs racing at 05:30 | **3**, on **2** numbers |

The three-way race, by name: **#2338** and **#2340** both introduce `DR-1158`; **#2339** and **#2340** both introduce `DR-1159`. Every one of those checks had already run and classified the race correctly — **and not one side had been told.** One of those PRs is this author's, and one is a lesson whose number I had assigned an hour earlier and had to correct mid-build when another session took it.

## Decision

**The contested verdict is detected from the reader's own output** — `grep` for `CONTESTED WITH AN OPEN PR` in the text the script already printed. Not a second computation: a flag derived independently could disagree with the verdict it is reporting.

**A contested PR gets one comment**, created once and updated thereafter, which says in words: *nobody has lost this race*, the check does not fail on it, **whichever merges second has to move** (DR-1136), and if the other PR landed first, renumber **on a clean tree** — because mid-merge two records hold the number and every bare citation becomes ambiguous.

**Each racing PR runs this check itself**, so one comment per PR reaches every side. There is no cross-posting to a rival PR and no central notifier to keep alive.

**What is deliberately unchanged:** the only thing that may fail this check is still `taken-on-main`. A race still cannot block a PR — that split is what let DR-1147 ship while three lesson branches were in flight, and it is not weakened here.

## Impact

**The repair moves from after the merge to before it**, which is where it is cheap: renaming a record on a clean tree before pushing costs one command, and the tool rewrites every citing file for you. The same rename discovered after a second merge costs a red main, an aborted merge, bare citations read one at a time, and a re-verify.

**This does not prevent a collision and does not claim to.** Two PRs opened minutes apart can still both claim a free number; this only ensures both of them know. Prevention needs a **claim-time reservation** — a number taken by writing to a shared registry *before* the record is written — which alters how every session authors a record and which all 1,059 existing records depend on. DR-1021 recorded that as a Governor's decision rather than a tooling change, and it stays one. **The evidence for it is now in this record rather than in an argument:** nine collisions in eleven hours, five numbers gone in one, and a three-way race running while this was written. **`re-review: 2026-10-28`** — count the week's collisions again; if the rate holds with both sides now warned, the reservation is the next conversation and this record is its evidence.

**A live proof is available for free:** this PR is itself a fourth claim in the same neighbourhood, so if anything claims DR-1160 before it merges, its own check will post the comment this record adds.

## Verification

**22 cases** in the file (5 new), and three are **proven to catch by breaking the workflow**:

| what was broken | what went red |
| --- | --- |
| the contested comment made to call `setFailed` — a race failing the build | **1** — *"not to match /setFailed\|exit 1/"* |
| a new comment on every push instead of one updated | **1** — *"to match /updateComment/"* |
| the contested flag computed from something other than the reader's output (`[ -s /tmp/claims-prs.json ]`) | **1** — *"to match /grep -q 'CONTESTED WITH AN OPEN P…"* |

Restored each time: **22 passed**. A fourth case pins that `taken-on-main` still fails with `exit 1`, so the one behaviour that may block a PR is not touched.

The workflow's YAML parses, all four shell steps pass `bash -n`, and the new `github-script` body passes `node --check`. `npm run lint` exit **0** · `npm run verify:gates` exit **0**, read without a pipe.
