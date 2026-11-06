# DR-1359: The in-flight view has an age, and a number can be held twice

**Date:** 2026-11-06
**Status:** Accepted
**Tier:** A (one read-only tool and its cases; no product code, no schema, no money, no reader-facing text)
**Type:** correction
**Declared by:** DR-0076 §8 (provenance, and honest uncertainty) against `claim-decision-number.mjs`, after it under-reported a live collision twice in one hour.
**Area:** `scripts/claim-decision-number.mjs` · `app/src/__tests__/claim-decision-number.test.js`
**Found by:** asking the tool for a free number while three branches held DR-1355, and comparing its answer against the GitHub API.
**Narrative:** [docs/99-session-notes/2026-11-06-the-in-flight-view-has-an-age.md](../99-session-notes/2026-11-06-the-in-flight-view-has-an-age.md)
**Considered, not built:** refusing outright when the fetch fails, as `onBase` refuses an unreadable base — rejected; see Decision 1.
**Pairs with:** **DR-1076** (the tool), DR-1247 (the stale tree), DR-1249 (the unreadable base), DR-1021 (the renumber by hand), DR-0644 (the resolver refuses rather than folds), DR-0125 (unknown freshness never reads as fresh)

## Context

`claimedInFlight()` is the half of this tool that was supposed to end the collisions: it walks `refs/remotes/origin/` and reports the numbers unlanded branches already hold. But `refs/remotes/` is a LOCAL CACHE. It is exactly as fresh as the last `git fetch` and not one second fresher, and nothing in the output said so.

## What was measured

**It missed a branch that had already pushed.** Asked from a tree that had not fetched, the tool printed `in flight: 55 number(s) ... 2 of them at or above DR-1355` and named two branches. A third, `claude/integrity-lesson-n55fvt` (#2565), had `DR-1355-...md` pushed and readable through `gh api repos/.../pulls/2565/files` at that same moment. One targeted `git fetch` of that ref and the same scan saw it.

**And when it did see both, it reported one.** `held` was a `Map` keyed by number whose value was the FIRST holder, so a number held twice reported as held once. A session on the unnamed branch could read the output and never learn its number was contested.

So for the second time the tool written to prevent a renumber was recommending one. DR-1247 was the stale TREE; DR-1249 the unreadable BASE; this is the stale remote-tracking VIEW. Same failure, third door — and the tool's own header already carried that sentence about the first case.

## Impact

Three PRs collided on DR-1355 today and two of them were one session's. The structural cause is still the lowest-free convention (`re-review: 2026-11-13`, on #2566) and this does not change it. What it changes is that the tool no longer answers half the question silently.

## Decision

**1. The view is refreshed before it is read, and its age is always printed.** `fetchPlan()` is pinned as data — an explicit `+refs/heads/*:refs/remotes/origin/*` because every `actions/checkout` sets a single-branch refspec that would fetch main alone, and `--prune` so a merged-and-deleted branch stops holding a number. A fetch that could not run prints `in-flight view: UNVERIFIED`, names the reason, and states the risk in words. Refusing outright was considered and rejected: the base read still works offline and in CI, and a landed-numbers answer beats no answer — but it buys no silence, and `--no-fetch` buys none either.

**2. Every holder is named, not the first.** `claimedInFlight()` returns `number -> branch[]`, and a number held more than once prints `HELD BY N BRANCHES, one of them must move`. A number held twice is not a tie to break quietly; it is the collision itself.

## Verification

**26 cases green**, every one network-free: the runner is injected, because earlier this same session a case that called real git against a nonexistent branch ran deepen rounds for minutes before it was killed.

**MY FIRST THREE CASES WERE WRONG, AND CI CAUGHT IT.** They passed locally and went red on #2569 with `REFUSING — no base ref could be read`, because an `actions/checkout` has no `origin/main` remote-tracking ref — DR-1249's own condition. They were assertions about the ENVIRONMENT, not about the freshness line they exist to pin. The base read is now injected too, and a new case simulates that exact CI condition. A case that only passes where it was written is not the case I meant to write.

**The refusal path carries the freshness line as well**, because the refusal's own advice is "fetch main", so whether a fetch just ran is the first thing its reader needs. The refusal is otherwise unchanged and still prints no number.

**Proven to catch.** Deleting both freshness lines from `main()` turns **4 cases red**; file restored and verified byte-identical with `cmp`.

**Verified on the live ledger, not only fixtures.** The real run now prints `DR-1355 — origin/claude/integrity-lesson-n55fvt, origin/claude/a-dormant-road-is-not-a-road — HELD BY 2 BRANCHES, one of them must move`, which is today's actual contested number with both real holders.

**Not claimed:** that this prevents a collision. It does not. It makes the collision visible before a number is taken, which is all a read-only tool can do.

---
_Generated by [Claude Code](https://claude.ai/code)_
