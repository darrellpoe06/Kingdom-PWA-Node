# DR-1252: The clone clears its own lock — three teachings were tagged `build:failed` for a lock file belonging to the machine

**Date:** 2026-10-27
**Status:** Accepted
**Tier:** A (additive: one refusal arm and one heal step in the NAS lesson builder's own clone; no gate relaxed, no teaching touched)
**Pairs with:** DR-1232 (a stuck ref is healed, not handed back — this is that finding a second time through a different lock), DR-1249 (the refusal says what it received; the diagnostic that made these five causes separable), DR-0669 (the NAS lesson builder; the `lesson-captured` tag is its lock), DR-1219 (a waiting teaching is built, not watched), DR-0076 (§1 no claim without evidence, §3 proven to catch)

## Context

DR-1249 separated the twelve waiting teachings into five distinct failure causes and fixed only the diagnostic for one of them, naming the other four as deliberately unaddressed with `re-review: 2026-11-03`. This closes one of those four — the one that needs no new information to fix, because the fault is entirely inside the builder's own disposable state.

Three of the twelve rows died with:

```
could not lock config file .git/config: File exists
```

A stale `.git/config.lock` in the builder's own clone, left behind by a run that was killed before it could release it. The row was handed back tagged `build:failed`.

## What was measured

**The lock was outside both the pattern and the cure, and that is the whole finding.**

`lesson_builder.py` already carries DR-1232's rule for exactly this class — a lock in the builder's own clone is the machine's fault, not the teaching's, so it is healed and retried rather than blamed. But that rule was wired to refs only:

- `STUCK_REF` matches `unable to update local ref|cannot lock ref|unable to create '.*\.lock'|couldn't write '.*\.lock'`. The sentence git prints for a config lock is **`could not lock config file`**, which matches none of those alternatives — the third wants the literal `unable to create '`.
- `heal_refs()` walks `.git/refs/remotes/origin` for `*.lock` files. `.git/config.lock` is a **top-level** file in the git directory and is never reached by that walk.
- The failure happens in `ensure()`, at the two `git config` identity writes — a code path with no `try` at all, so the first one to fail propagated straight out and became the row's recorded reason.

So the cure existed, was correct, and simply did not cover the second kind of lock. **The teaching was blamed for a leftover file.** Measured against the record's own standard: `ensure()` re-clones the repository from nothing when `.git` is absent, which is the plainest possible statement that this clone is disposable builder state. Nothing in it can be a teaching's fault.

**Why this is the same finding twice.** DR-1232 was written because rows 52121525 and 0593ae29 had their third build die on a stuck ref and were tagged `build:failed` for it. The conclusion recorded there was general — the clone is the builder's own state, so it heals and retries — but the implementation was specific to refs. A principle written generally and implemented narrowly looks closed and is not. That is why the cure here is widened (a named set of the clone's top-level locks) rather than special-cased to `config.lock`.

## Impact — what this obligates, and the limits named rather than left

- **This does not by itself ship a lesson.** It removes one of five reasons the builder produced nothing for ~108 hours. Three rows will stop failing *for this reason*; whether they then succeed depends on the session limit and the OAuth race, which are untouched here and still named in DR-1249.
- **The remaining causes from DR-1249 are still open and still named:** the session limit (the account's own, clears on its clock), the OAuth refresh race (partially addressed by DR-1232's serialisation and recurring anyway), and the truncated reply at ~56–72 KB. `re-review: 2026-11-03`, unchanged.
- **A young lock is left alone.** `STALE_LOCK_SECONDS = 60` is the one safeguard this cure needs: a lock file younger than that may be held by a git that is still running, and removing it would be the cure causing the disease. Only one builder runs at a time (its single-instance lock), so in practice any lock found is leftover — the floor costs nothing and removes the only way this could do harm. A case pins it.
- **The two cures stay separate.** `CLONE_LOCKS` holds only top-level files in `.git`; the individual ref locks under `refs/remotes/origin` remain `heal_refs()`'s business. A case asserts no entry contains a path separator, so the sets cannot drift into each other. (`packed-refs.lock` is a top-level file despite its name, which is why the case checks for a separator rather than for the word "refs".)
- **Honest limit:** `heal_locks()` is best effort by design and its return value is for the test and the log, not for control flow. The proof that it worked is the retry succeeding, never the list it returned. A lock it could not remove (permissions) is left, and the second failure is a real failure.
- **Honest limit, and it is the same one DR-1232 has:** this is verified by unit cases against a mocked `_run`, not by driving a real killed-mid-config git on the NAS. That harness does not exist, and the sandbox has no route to the builder's clone. What IS verified is that the arm is load-bearing — see below. `re-review: 2026-11-10`.
- **Not claimed:** that a stale `config.lock` was the *only* thing wrong with those three rows. It is the reason they recorded, and it is now healed; the next run says whether anything else is behind it. DR-1249's diagnostic is what will make that answer legible.

## Decision

`STUCK_CONFIG` recognises the config-lock sentence. `ensure()` splits its two identity writes into `_identity()` and wraps them: on a config-lock failure it calls `heal_locks()` and tries once more, and only a second failure is a failure — the identical shape `fetch()` already uses for a stuck ref.

`heal_locks(now=None)` removes the clone's **stale** top-level lock files (`config.lock`, `index.lock`, `HEAD.lock`, `shallow.lock`, `packed-refs.lock`), skipping any younger than `STALE_LOCK_SECONDS`, and returns the names it removed. `heal_refs()` calls it first, because a stale top-level lock stops `gc` and `pack-refs` as surely as it stopped `config`.

Nothing else moves: no gate is relaxed, no tag semantics change, no teaching is touched, and a failure that is not a config lock is still raised at once.

## Verification

- `python3 -m unittest test_lesson_builder` — **114 tests, OK** (112 existing, 2 added).
- **Proven to catch (DR-0076 §3), by breaking the real code and not only a mock:** reverting `ensure()` to its original two unguarded `config` calls reddens the suite with the exact sentence the three rows died on — `RuntimeError: git -C repo exit 255: error: could not lock config file .git/config: File exists`. Restored, 114 green.
- **Also proven at the pattern level:** patching `STUCK_CONFIG` to a regex matching nothing makes the same failure escape `ensure()`, so the arm is load-bearing rather than decorative.
- The regression case is the **real** sentence from the measured rows, not an invented one, and it asserts the call sequence afterwards: `user.name` fails, the lock is cleared, then **both** identity writes run (`["user.name", "user.name", "user.email"]`) — so the heal resumes the work rather than merely swallowing the error.
- Three negative cases keep the arm narrow: a failure that is not a config lock (`fatal: not a git repository`) is raised at once; a lock that persists after the heal is still a failure; and a clone with no locks returns `[]` rather than erroring.
- **The race safeguard is asserted, not assumed:** a 1-second-old `index.lock` and a stale `config.lock` sit side by side, and `heal_locks()` removes only the stale one while the fresh one survives.
