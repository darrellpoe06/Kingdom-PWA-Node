---
id: DR-0962
title: The stamp is asked of git, so a lane can ship from its own worktree
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, ORCHESTRATION-LANES, PERPETUAL-IMPROVEMENT]
source: 2026-10-11 — found by the agent while shipping DR-0961 from an isolated worktree
---

## Context

No report. Found while running `npm run ship` from an isolated git worktree —
which is not an improvisation but the lane shape this house's own operating
model prescribes (`ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md` §2: a
lane is a unit of work in an isolated worktree). The sanctioned way to *run*
work and the sanctioned way to *ship* it could not both be followed.

## What was measured

The entire output of the run:

```
> node ../scripts/push-stranding-guard.mjs --stamp && npm run verify && ... && git push -u origin HEAD
From https://github.com/darrellpoe06/Kingdom-PWA-Node
 * branch              main       -> FETCH_HEAD
push-stranding-guard: COULD NOT STAMP — EEXIST: file already exists, mkdir '/tmp/wt-pics/.git'
```

- `scripts/push-stranding-guard.mjs:69` computed `STAMP_PATH` as
  `join(HERE, '..', '.git', 'push-stranding-stamp.json')` and `writeStamp`
  called `mkdirSync(dirname(path), {recursive: true})` on it.
- In an ordinary clone that is correct. **In a worktree `.git` is a FILE**
  holding `gitdir: /…/.git/worktrees/<name>`, so the mkdir can never succeed.
- Confirmed by resolution after the fix: main checkout →
  `/home/user/Kingdom-PWA-Node/.git/push-stranding-stamp.json`; worktree →
  `/home/user/Kingdom-PWA-Node/.git/worktrees/wt-pics/push-stranding-stamp.json`.

**The guard was not wrong; it was right in a way that was useless here.** It
exited 2 exactly as DR-0393 decision 4 requires — *unknown never reads as
green* — and because `--stamp` is the FIRST link of `ship`'s `&&` chain,
`verify`, the fifteen gates and the push all silently did not run. Nothing was
stranded. The rule held perfectly and the lane was unusable, and both of those
are true at once.

A second, honest note on how this was nearly mis-measured: the first reading of
the exit code said `0`, which looked like the guard failing to fail. It was not
— the command had been piped to `tail`, so the pipeline reported *tail's* exit
status. The guard's own exit was 2. The shell construction was mine.

## Impact

Any lane that follows §2 cannot ship through the sanctioned command, which
pushes the shipper toward a bare `git push` — and a bare `git push` is exactly
the unprotected path DR-0393 was written to close (its own stated limit: *"it
protects `npm run ship`, not `git push`"*). An unusable safe path manufactures
the unsafe one.

Reversible: one exported function and one constant. No behaviour of the drift
check itself changes.

## Decision

1. **`resolveGitDir(cwd)` asks `git rev-parse --absolute-git-dir`** instead of
   assuming `../.git`. That answers correctly in a clone, a worktree and a
   submodule alike. If git cannot be run at all it falls back to the old path —
   a wrong stamp location still ends in the honest UNKNOWN exit, never silence.
2. **Each worktree stamps its own base.** A per-lane gitdir means two lanes
   verifying against different bases cannot overwrite each other's stamp, which
   a single shared file would have allowed. This is a correctness property of
   the fix, not a side effect, and it is pinned.
3. **The DR-0393 `re-review: 2026-10-14` stands and is NOT discharged here.**
   Its two open items — a real pre-push hook so a hand `git push` is also
   covered, and repair rather than only detection — are untouched by this. This
   record only makes the existing protection reachable from a lane.

## Verification

- `app/src/__tests__/push-stranding-guard.test.js` — 14 tests green.
- **Proven-to-catch, and the first attempt was NOT.** The first version of this
  test asserted only against the repository the suite runs in, where
  `<root>/.git` and the true gitdir are the same path — so restoring the broken
  line passed all fourteen tests. That is theatre (DR-0076 §3; P46), and it was
  caught by running the mutation rather than reasoning about it. The test now
  **creates a real worktree** (`git worktree add --no-checkout --detach`),
  asserts its `.git` is a FILE — otherwise the case cannot prove the bug —
  resolves against it, and requires a per-worktree gitdir. With
  `resolveGitDir` reverted to the naive join it fails:
  *"the resolved gitdir is not a directory"*. Restored: 14 pass.
- Live proof: this record and DR-0961 are themselves pushed by `npm run ship`
  **from the worktree that could not ship before**, which is the end-to-end
  demonstration. Run id recorded on the PR.

## Links

[DR-0393] (the base can move while you verify — the guard this repairs, and
whose `re-review: 2026-10-14` is untouched), [DR-0961] (the change being
shipped when this surfaced), [DR-0103] (the delivery lane),
`ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md` §2 (a lane is a worktree),
[DR-0076] §3 (proven-to-catch).
