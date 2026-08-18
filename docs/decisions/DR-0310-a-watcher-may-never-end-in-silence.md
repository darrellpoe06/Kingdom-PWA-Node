---
id: DR-0310
title: A watcher may never end in silence — unknown is a third state, and it never reads as healthy
date: 2026-08-15
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, MACHINERY-OVER-MEMORY, LESSONS-LEARNED, PERPETUAL-IMPROVEMENT]
source: 2026-08-15 session — a defect in the agent's own tooling, caught by the ari-integrity-guard stop hook after the agent described the limitation instead of fixing it.
---

## Context

After pushing L79 I armed a watcher on PR #1255's CI and told Darrell I would
report when it went green. The watcher polled forty times over twenty minutes
and emitted one line: `TIMEOUT`.

CI had in fact been green the whole time.

## What actually broke

Shell access to the GitHub API is not available in this session. It answers
**403** with a specific message:

> `GitHub access is not enabled for this session. An org admin must connect the
> Claude GitHub App for this organization.`

Not a proxy denial, not an expired token — `GITHUB_TOKEN` is a proxy-injected
placeholder that GitHub rejects. The MCP tools are the only working channel.

That is the mundane cause. **The failure mode is the thing worth recording:**
the script had no path that says *"I could not observe."* Every poll returned
nothing, and nothing is exactly what the script emitted. For twenty minutes
silence and health were the same signal.

## The rule

**A green check must mean something, and so must a quiet one.**

`unknown` is a THIRD state, distinct from pass and fail. It is never permitted
to read as healthy. This is DR-0076 §8's honest-uncertainty requirement applied
to instruments rather than to prose: a watcher that cannot report its own
blindness is not a watcher, it is a decoration.

## Decision

`scripts/silent-watcher-guard.mjs` reads every shell poll loop in
`.github/workflows/` and `scripts/` that makes a network call, and requires both:

1. **A BOUND** — a deadline, a bounded counter, or a terminal `break`, so the
   loop cannot spin forever.
2. **A LOUD END** — on exhausting that bound, a non-zero exit or a failure
   written where a human reads it (stderr, `GITHUB_STEP_SUMMARY`, `::error`).

Falling out of a loop with only a progress `echo` is the defect.

## What it found on its first run

**One real defect.** `scripts/ship.sh` polled for `lint + vitest ... pass` with
a ~5-minute budget. If that budget ran out with the check reporting **neither**
pass nor fail — a slow queue, a runner outage, `gh` unable to read checks at all
— it fell straight through to `gh pr merge`. Branch protection would most likely
have refused the merge, so this is a near-miss rather than a shipped incident;
but the script's own logic treated *unobserved* as good enough to attempt a
merge, which is precisely the class. Fixed: the unknown branch now exits 1 and
says *"this is UNKNOWN, not green."*

**Two false positives, which are also recorded**, because a noisy gate gets
switched off and a switched-off gate protects nothing: `auto-merge.yml`'s
`for n in "${prs[@]}"` and `pr-janitor.yml`'s `while IFS= read` walk a finite
list and are not polls at all. The guard now recognises inherently-bounded
iteration, and both shapes are pinned in the test so the noise cannot return.

**Everything else already passed** — notably the Cloudflare propagation sentinel
(900s shared deadline, `exit 1` on overrun) and site-health's backend probe,
hardened earlier this session. The gate is cheap to add while the tree is clean;
it exists to fail the next one written in a hurry.

## Why this keeps happening

Fourth instance of one pattern in eight days:

- DR-0125 — every safeguard watched the pipeline; none watched the product.
- DR-0303 — the query pulled every column the table would ever have.
- DR-0309 — the gate's claim was wide; its reach was one field of thirteen.
- Here — the watcher could not distinguish "nothing to report" from "cannot see."

Every time: an instrument trusted for a property it never measured, and nothing
objected, because nothing was looking. The standing question when adding any
instrument is not *"does it pass?"* but **"what, exactly, does it read — and
what does it do when it can't read anything?"**

## Honest remainder

This guard reads **shell** poll loops. It does not inspect JavaScript polling,
n8n cron logic, or NAS-side loops, and it cannot prove a watcher's channel is
genuinely live — only that the code has a path for saying so. Extending it to
the JS watchers (`scripts/review-watcher.mjs` and the ari-guard hooks) is real
work and is not done. **re-review: 2026-09-15.**

The environment fact behind the incident is not fixable from here: enabling
shell GitHub API access needs an org admin to connect the Claude GitHub App
(https://claude.ai/admin-settings/claude-in-slack). Not a blocker — the MCP
channel works — but recorded so the next session does not re-diagnose it.

## Files

- `scripts/silent-watcher-guard.mjs` — the guard (`--list`, `--selftest`)
- `scripts/ship.sh` — the real defect fixed
- `app/src/__tests__/no-watcher-ends-in-silence.test.js` — 6 pins
- `.github/workflows/ci.yml` — guard + selftest run each push
