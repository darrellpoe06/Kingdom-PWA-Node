# DR-0393 — The base can move while you verify, and a successful push can be the failure

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (the delivery lane itself — the path every change takes)
- **Type:** orchestration

## The report

No report. Found by the agent while recovering from it for the second time in one evening — which is the finding, because nothing in the system said a word either time.

## What happened, measured from the run records

`npm run verify` takes about four minutes (971 files, 14,595 tests). The delivery lane (DR-0103) squash-merges an agent PR the instant its gates pass, with no human in the path — which is the point of it, and is right. Twice those two facts collided:

```
23:38  verify starts on a branch based on main@ce533569
23:42  the lane squash-merges #1566 -> main@2066e992
23:58  verify finishes green; the commit is pushed
```

A squash merge creates a **new** commit that does not contain the branch's own commits as ancestors. So at 23:58 the branch's earlier commits were still sitting there as distinct objects whose *content* was already in `main` under a different sha, and the freshly-verified commit landed on history `main` no longer had.

**The push SUCCEEDED, both times.** That is what made it expensive. Nothing failed, nothing was printed, and the damage only surfaced later as a pull request carrying already-merged commits and an `INDEX.md` conflict. Two full recovery cycles: #1565 stranded `fcdc9253`, #1566 stranded `60f627a7`.

## The root cause

Every safeguard in this repo runs either **before** the push (verify, the fifteen gates) or **after** it (CI, the lane, site-health, deploy-freshness). The four minutes between *"verify went green"* and *"git push"* is the one interval nothing watches — and it happens to be exactly as long as the window the lane needs to move the base. **The faster the lane got, the more likely this became.** Velocity created the hazard, which is not a reason to slow the lane down; it is a reason to instrument the gap.

## The decisions

1. **THE SIGNAL IS TIME, NOT SHAPE.** The failure is not a property of the branch's commit graph. It is a property of *when*. So the guard **stamps `origin/main` when verification starts** and **re-reads it before the push**. If the base moved in between, the green just earned was earned against a tree that no longer exists. Because it never inspects commits, it is squash-proof, merge-proof and rebase-proof.

2. **IT DELIBERATELY DOES NOT FIRE ON "THE BRANCH IS BEHIND MAIN."** Being behind is the normal, harmless state of nearly every feature branch nearly all the time. A guard that cries on the normal case is ignored within a day, and an ignored guard is worse than none because it looks like coverage (P52, learned the hard way the day before). It fires only on drift *during the verify window*.

3. **IT IS NOT A CI GATE, AND CANNOT BE.** CI runs after the push; by the time CI has an opinion the stranded push already happened. This belongs in the seconds between green and push, which is what **`npm run ship`** is for: `stamp → verify → check → push`, one invocation. That narrows the race from four minutes to the length of one `git fetch`. It is deliberately absent from `verify:gates` for the same reason.

4. **UNKNOWN NEVER READS AS GREEN (DR-0076 §8).** No stamp, no origin, no network, or a stamp taken against a different upstream all exit 2 with *"the base was NOT verified — do not read this as safe to push"*, rather than a reassuring line.

## The rejected design, recorded on purpose

The first version used `git cherry origin/main HEAD`, on the sound-sounding theory that a commit whose change is already upstream is marked `-`. **Run against the real 2026-09-14 shape** — branch at `60f627a7`, main at `2066e992` — **it printed six `+` and not a single `-`.** It cannot work by construction: `git cherry` matches by patch-id, one commit to one commit, and a squash folds many commits into a single new patch that matches none of them. It would have passed silently on the exact accident it was written for.

It was deleted rather than shipped, and the rejection is written into the guard's own header so the idea is not re-invented by the next person who has it. **This is DR-0076 §3 sharpened: proven-to-catch means proven against the specific incident, not against a synthetic case chosen because it passes.**

## Proof

- **Against the real shas.** Stamp `ce533569` / now `2066e992` → fires, naming both and the remedy. Stamp `2066e992` / now `2066e992` → silent.
- **Proven-to-catch in both directions**, because this guard can fail two opposite ways: disable drift detection → 3 tests fail; make a missing stamp read green → 3 tests fail. Both mutations were run and both failed as required.
- 12 tests in `app/src/__tests__/push-stranding-guard.test.js`, including the "does not treat *behind* as a failure" case, which is the half that keeps the guard usable.
- `npm run verify` green.

## Limits stated

- **It protects `npm run ship`, not `git push`.** Someone who pushes by hand gets no stamp and therefore the UNKNOWN exit rather than silence — honest, but not prevention. A real pre-push hook would close that, and hooks are not currently installed in this repo (`core.hooksPath` unset, no `.husky`). `re-review: 2026-10-14`.
- **It detects the drift; it does not repair it.** Restarting a branch is the user's call, so the remedy is printed rather than performed. That is deliberate for now and worth revisiting once the shape has been used a few times. Same `re-review`.
