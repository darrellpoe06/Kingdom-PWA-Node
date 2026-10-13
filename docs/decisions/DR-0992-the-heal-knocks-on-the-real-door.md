---
id: DR-0992
title: The heal knocks on the real door — the sign-in recovery tool verified against a port nothing in the system uses
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0991]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, HOLD-THE-HAND-OF-THE-PROCESS, PERPETUAL-IMPROVEMENT]
source: 2026-10-13 — the first genuine drain under DR-0991's four-question rule (PR #2059)
---

## Context

`nas-signin-heal.yml` exists because of one day. On 2026-10-09 Darrell was
locked out of his own app: a POST to `poetech.us/sb/auth/v1/token` returned an
**empty body**, the browser called `.json()` on nothing and died with
*"Unexpected end of JSON input"*, on both the email-link and phone-PIN paths. A
GET to `/sb/auth/v1/health` answered 200 the whole time, which is why every
probe read green. The sandbox has no route to the NAS, so all the agent could do
was hand him commands to paste. His answer, in that workflow's own header:

> *"You do it!!!!!!"*

So the heal is the hand. It joins the tailnet, SSHes to the NAS and restarts the
sovereign Supabase containers — and then it is supposed to **measure** whether
the restart worked, so a heal that did not heal fails the run.

**It measured the wrong port.** PR #2059 (2026-10-09, *"the sign-in heal was
knocking on a door that was never there"*) is the fix, and it sat unmerged for
four days.

## What was measured

**The defect, verified without the NAS** — which matters, because the sandbox
cannot reach it:

| | |
|---|---|
| what `main`'s heal probed | `http://127.0.0.1:8000/auth/v1/token` |
| where `127.0.0.1:8000` appears in the repository | **only that one line** |
| what every other probe uses | `127.0.0.1:8800` — `nas-health.yml`, `site-health.yml` |
| what the app's transport uses | `app/functions/sb/[[path]].js`, the `/sb` path |
| the real door | `127.0.0.1:8800/sb/auth/v1/token` |

So the recovery tool for a sign-in lockout restarted the services and then
verified against a port **nothing in the system listens on**. During the exact
outage it exists for, its verdict was meaningless — and it would have reported
"STILL DOWN on the box" no matter what the restart did.

**Two bugs reading as one outage**, in the PR's own words: `:8000` is
kong-internal and never answered; the door the app rides is `:8800` with `/sb`.

**The PR is a sibling of main's version, not a child** — it *adds* the file, so
at its merge-base the file did not exist; main's 159-line version landed the
same day in `9191c2c68`. That ruled out assuming the PR is a superset, so the
diff was read in **both** directions:

| | |
|---|---|
| lines only in the PR's version | 609 |
| lines only in `main`'s version | **11** |
| what those 11 are | the `:8000` probe and the text about it — nothing else |

So the PR loses nothing. Beyond the port fix it adds what the 2026-10-09 outage
showed was missing: a `netstat/ss` listing of which ports actually listen, a
pre-check that asks whether the box already answers before restarting anything,
a CORS-services restart, cams/voice preflight probes, and separate edge and
Funnel POST verification so a stack that healed while the *road* drops bodies is
named as such rather than blamed on the stack.

**Its registry change was already on `main`, byte for byte** — the same
`wf('nas-signin-heal.yml', {...})` entry at `system-flow-registry.mjs:954`. That
part was dropped; only the workflow lands.

## Impact

The one tool that can recover a sign-in lockout without a person at a keyboard
could not tell whether it had worked. That is the DR-0975 failure in the place
it costs most: not a check that nobody reads, but a check that reads the wrong
thing during an emergency, while sounding authoritative about it.

Reversible: one workflow file, `workflow_dispatch` only, no schedule, nothing on
the merge path.

## Decision

1. **The heal probes the door the app actually rides** — `127.0.0.1:8800/sb/...`
   on the loopback, and `poetech.us/sb` from outside — and PR #2059's version
   lands whole, since reading the diff both ways showed `main`'s only unique
   lines are the broken probe itself.
2. **`:8000` stays in the file, twice, on purpose**: once in a comment
   explaining the bug for the next reader, and once as a deliberate probe
   labelled *"kong :8000 direct (expected closed)"* — so the next person who
   wonders about that port gets an answer from the run instead of a guess.
3. **The registry change is dropped**, being already on `main` verbatim. Taking
   it would have duplicated the entry.
4. **NOT changed: the brakes.** It stays `workflow_dispatch` only — no schedule,
   a human arms each run — so CLAUDE.md's three-brakes rule for timer-driven
   automation does not bite, and nothing here makes it self-firing.
5. **NOT verified, and this is the real limit: that the heal heals.** The
   sandbox has no route to the NAS, so no step of this workflow was executed.
   What *is* verified is the premise it rests on, from the repository itself.
   The proof is the next real dispatch. `re-review: 2026-10-20`.

## Verification

- **The central claim is independently verified, not taken from the PR**:
  `git grep` over `main` shows `127.0.0.1:8800` in `nas-health.yml`,
  `site-health.yml` and the `/sb` transport function, and `127.0.0.1:8000` in
  exactly one place — the line being fixed.
- **The diff was read in BOTH directions** because the two versions are
  siblings: 609 lines unique to the PR, 11 unique to `main`, and all 11 are the
  broken probe. Had any of the 11 been real, this would have been a merge rather
  than a replacement.
- **The redundant registry change was caught by reading `main`** at
  `system-flow-registry.mjs:954`, not by trusting the diff.
- YAML parses: one `heal` job, 8 steps, `workflow_dispatch` only.
- `verify:gates` green, including `workflow-list-order-guard` (*"every run check
  asks by exact identity"*), `interconnect-guard` (13/13 live loops),
  `infra-transport-guard` and `his-hand-guard`.
- **Two process failures of mine, recorded because the cause is the same one
  four times tonight.** A `git worktree add … | tail -1` makes the pipeline's
  exit status `tail`'s, so a FAILED `worktree add` let the `&&` chain continue
  twice: once writing into `/tmp/wt-heal`, a pre-existing worktree on PR #2059's
  own branch (no damage — the content I wrote was byte-identical to what was
  committed there, confirmed with `diff -q` and a clean `git status`), and once
  writing the workflow into the **main repository's working tree** on
  `claude/a-dead-bell-says-so` (reverted with `git checkout --`; the tree had
  exactly one modified file and is back to 0). Both verified clean afterwards.
  The lesson is the one already recorded against `$?`-after-a-pipe: never let a
  piped command gate a chain that writes.
- **Not verified:** the 609 added lines' behaviour on the NAS — see decision 5.
  Every one of them is shell that runs over SSH on a box this session cannot
  reach, so they are reviewed as text and proven only by a dispatch.

## Links

[DR-0991] (the four-question rule — this is the first PR it passed, and the flag
it raised resolved the *opposite* way from #789: here `main` was behind, not
ahead), [DR-0990] (the corrected selection rule), [DR-0986] (why the backlog is
being worked), [DR-0975] (a check that reads the wrong thing is worse than one
nobody reads), [DR-0108] (the whole team's capabilities — Darrell's *"You do
it!!!!!!"* is why the heal exists at all).
