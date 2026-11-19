# DR-1608: A test that runs a script waits as long as the script may

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one test file's time bound; no assertion changed)
**Type:** fix
**Area:** `app/src/__tests__/research-answered-on-the-nas.test.js`
**Pairs with:** DR-1580 / DR-1588 / DR-1590 (tests that turned unrelated PRs red), DR-1601 / DR-1605 (this lane fix)

## Context

The lane brief (2026-11-19, item 6) asked for any other test whose result depends on runner load, fixed the way DR-1580, DR-1588 and DR-1590 were. One turned up on this session's own docs-only PR.

## What was measured

PR #2822 changes only documents and ledgers. Its vitest shard 3/4 (run 44549820698) failed two cases of `research-answered-on-the-nas.test.js` with "Test timed out in 5000ms", on a shard that took 1138 s against its usual ~760 s. Each case runs the real `research-inbox-nas.sh` in a child bash with a 60 s bound, but the test kept Vitest's default 5 s. Locally each case takes ~0.4 s. With twelve busy loops pinned to the same CPU, five of the eight cases time out at 5 s, the same failure.

## Decision

The test's own bound is the script's bound: one constant, `RUN_BOUND_MS = 60000`, used for the child process and as the describe block's timeout. Nothing is skipped and no assertion moves; a script that truly hangs still fails, at 60 s, with its own timeout error.

## Impact

The other 29 test files that run a child process without a test-level timeout were run under the same contention, one file at a time: 29 files, 339 tests, all passed. CI also runs files in parallel, which loads the runner harder than that measurement did, so this narrows the class but does not prove it empty. A file that fails this way later gets the same fix.

## Verification

Under the same contention, the file now passes 8 of 8 (it failed 5 of 8 before), and 8 of 8 unloaded. The CI shard on #2822 is the proof on a runner.

re-review: 2026-12-03 (search a week of CI failures for "Test timed out in 5000ms").
