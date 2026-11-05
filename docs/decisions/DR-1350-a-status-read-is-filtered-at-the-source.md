# DR-1350: A status read is filtered at the source — the session was told it had no road, and the road was never what cost

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** A (one read-only script and its offline proof suite; no product code, no schema, no money, no reader-facing text, no workflow)
**Type:** ways-review
**Declared by:** DR-0108 (review our Ways; a stated "can't" is an unverified premise to challenge) and DR-0075 (recurring friction becomes a fix), applied to this session's own instrument.
**Area:** `scripts/gh-read.mjs` · `app/src/__tests__/a-status-read-is-filtered-at-the-source.test.js`
**Found by:** driving PR #2559 to green — one read of a commit's checks came back at 50.2 KB, large enough that the harness spilled it to a file.
**Narrative:** [docs/99-session-notes/2026-11-05-a-status-read-is-filtered-at-the-source.md](../99-session-notes/2026-11-05-a-status-read-is-filtered-at-the-source.md)
**Considered, not built:** a gate failing the build on an unfiltered `gh api` — measured and rejected; see Decision 3.
**Pairs with:** DR-0108 (the Ways review, and the order of roads), DR-0845 (a guard that fires on correct work spends the same trust as one that misses), DR-0076 (§3 proven-to-catch, §4 measure don't claim, §8 provenance), DR-1339 (why the narrative is in the session note), DR-0075 (perpetual improvement)

## Context

This session's system prompt says, in these words, *"You do NOT have access to the `gh` CLI, `hub` CLI, or direct GitHub API access."* That sentence shaped every status read taken today: each one went through an MCP Actions tool that returns whole objects. The premise was never checked, which is the DR-0108 failure exactly — a stated "can't" is an unverified premise, not a place to stop.

It is wrong in the most misleading way available. `gh` is installed and REST works; only GraphQL is refused. So the first thing anyone reaches for, `gh pr checks`, fails — with an **HTTP 403**, which reads like "no access." The refusal body itself names the road to use instead.

## What was measured

**The road exists.** `command -v gh` → `/usr/local/bin/gh`, 2.89.0. `gh pr checks 2559` → 403 naming the REST route. `gh api repos/.../check-runs` → works.

**But the road was never the cost — the unfiltered payload was.** Measured on #2559's head `87d6b6fd96497dc3013f75617f0ee8f66066519c`: every check run on a commit is **101,747 B** raw against **1,368 B** with `--jq` (**74×**); the last four `ci.yml` runs are **55,701 B** raw against **243 B** (**229×**). The runs read is worse for a reason specific to this repo — each row carries its run's whole commit message, and these commit messages are long on purpose, so a `per_page=4` read carries four full commit bodies. `--jq` runs on GitHub's side of the wire, so the bytes it drops are never paid for.

**And the obvious gate would have been wrong.** Of **39** `gh api` calls in `scripts/` and `.github/workflows/`, **37** already filter at the source. The **2** that do not are both in `openclaw-tower.yml` and both redirect to a file inside a runner, where bytes cost disk and a later `jq` reads them back. They are correct.

## Impact

The practice was already right in 37 of 39 places. It was wrong in exactly one: the agent's own hands, which had no default. What was missing was never enforcement — it was a default.

The failure mode is silent, which is why this needs a pinned test rather than a note. A read that loses its `--jq` **still works**: same information, 74× to 229× the cost, and nothing says so. That is a safeguard that fails open.

## Decision

**1. `scripts/gh-read.mjs` is the default road for a status read** — `checks <sha>`, `runs <workflow> [n]`, `steps <runId>`, each with its filter held as data rather than string-built at the call site, so a test can pin it. Read-only by construction and pinned so: no write method and no `-X` reaches `gh`, and every path is scoped to this repository.

**2. The measurement lives in the file's own header**, with the commit it came from, and two cases fail if it is tidied away. The reason a file exists should not be deletable by a cleanup.

**3. No gate, and the measurement is the reason.** A gate forbidding an unfiltered `gh api` would fire on both correct runner calls. DR-0845 measured what that costs. The honest limit follows: nothing makes the cheap road the *only* road, and a session that has not read this will reach for the MCP tools exactly as I did this morning.

## Verification

**17 cases green**, offline by design — every one reads the module's exported data; none calls `gh`; none touches the network. A case needing a live token would be skipped in CI, which is the same as not existing.

**Proven to catch against the real defect, not a mock of it.** Removing `'--jq', read.jq` from `argvFor`, the way a real "simplification" would, turns **3 cases red**, one per read, each naming its read. File restored and verified byte-identical with `cmp`; suite back to 17/17.

**Exercised live, not only in fixtures.** `checks 87d6b6fd9` returned the real check list; `runs ci.yml 3` returned `in_progress - 87d6b6fd9 claude/measure-growth-yahwehs-way` above two earlier failures; both refusal paths printed their reason and exited 1.

`re-review: 2026-12-05` — count how many status reads in the next month still went unfiltered. If most did, a default was not enough and the next move is the builder brief, which every spawned session reads.

---
_Generated by [Claude Code](https://claude.ai/code)_
