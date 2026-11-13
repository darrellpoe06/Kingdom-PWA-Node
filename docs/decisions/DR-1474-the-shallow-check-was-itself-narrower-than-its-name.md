# DR-1474: The shallow check was itself narrower than its name

**Date:** 2026-11-13
**Status:** Accepted (corrects DR-1467 decision 4, which is merged)
**Tier:** B (corrects a check this house now runs in every builder brief)
**Type:** decision
**Area:** DR-1467 decision 4, the builder brief's shallow-clone step, every agent working in a `git worktree`
**Sent in by:** The pm17 builder, which hit the false reading twice mid-build (08:24 and 08:37) while its own check reported the clone healthy.
**Pairs with:** DR-1467 (the record this corrects), DR-0076 (§3 a check that cannot fail is not a check), DR-0011 (a correction is a new record, never a rewrite)

## Context

DR-1467 ended with a rule: check `test -f .git/shallow` immediately before anything that reads history, because the clone re-shallows itself. That rule went into the record and into five builder briefs. It is wrong everywhere it matters most.

## What was measured

**Demonstrated on this clone, 2026-11-13, not reasoned about:**

| | main checkout | inside a `git worktree` |
|---|---|---|
| `.git` is | a **directory** | a **file** (a gitdir pointer) |
| `test -f .git/shallow` | correct | **reads clean, always** |
| `test -f "$(git rev-parse --git-common-dir)/shallow"` | correct | **PRESENT** — the truth |

A scratch worktree was created, both checks run inside it against a genuinely shallow clone, and the worktree removed. The first check reported clean; the second reported shallow. Same repository, same instant.

**Why that is the worst possible place for it to fail: worktrees share one `.git`, which is exactly why the clone keeps re-shallowing (DR-1467), AND every builder agent works in a worktree.** So the check was correct only in the one checkout that was least likely to be re-shallowed by someone else, and silently useless in all the ones that were. The pm17 builder's clone went shallow twice mid-build while its check said otherwise, producing the false `lesson-dates:check` failure DR-1467 exists to warn about.

**It is the record's own subject, committed inside the record.** DR-1467 is titled "a check narrower than its name"; its remedy for instance three was a check narrower than its name. A guard that cannot fail where it is deployed is DR-0076 §3 exactly, and "the marker is somewhere this test cannot see" is a cheaper way to be unfailable than the two that record already named.

## Impact

Five builder briefs carried the wrong check. Any agent following it would read a healthy clone, then meet `derive-lesson-dates` reporting "this clone is shallow" and have no reason to connect the two — the failure presents as a content error, which is the whole trap.

## Decision

1. **The shallow marker is read at `$(git rev-parse --git-common-dir)/shallow`, never at `.git/shallow`.** The common dir is the real repository in both a plain checkout and a worktree; `.git` is only sometimes a directory. DR-1467 decision 4 is corrected to this and stands otherwise.
2. **The deepening is still re-checked immediately before each history-reading run**, not once per session — DR-1467's finding that it expires is unchanged, and this correction only makes the expiry visible where it was invisible.
3. **A check is verified where it will RUN, not where it was written.** This one was tested in the main checkout and deployed into worktrees. That is the general lesson and the reason this is a record rather than a one-line fix.
4. **NOT BUILT:** a shared helper every builder calls. Same reason DR-1467 parked its chain-runner — a helper is one more place for the check to pass without running, and it wants its own proven-to-catch pass. `re-review: 2026-11-20`, together with that one.

## Verification

- The table above was produced by creating a real worktree on this clone, running both tests inside it, and removing it. Both readings are from the same shallow state.
- After `git fetch --unshallow`, the correct check reports deep and the clone carries 2,975 commits.
- **Not measured, so not claimed:** whether any lesson already shipped carries a defect caused by this. Nothing points that way — every build whose dates were wrong failed loudly on `lesson-dates:check` and was repaired before push — but no sweep was run to prove it.
