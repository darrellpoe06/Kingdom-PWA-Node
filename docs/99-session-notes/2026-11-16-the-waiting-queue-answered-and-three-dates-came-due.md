# 2026-11-16 — The waiting queue answered for the first time, and three dates came due

The narrative behind **DR-1507** (the waiting log carries the shape of the queue)
and **DR-1510** (the pre-Way service audit's new date). The records stay short;
the measurement lives here.

## The session's shape

This session woke after about two days idle to **53 queued notifications**, every
one the same hourly stored prompt of the PRIORITY lesson-intake routine
(2026-11-13 23:04Z → 2026-11-16 21:04Z). All 53 were read and drained. Not one
carried a GitHub event, a cross-session message, or a delta — each was the full
stored prompt again.

**A Ways finding on the routine's own design, not something to paper over:** an
hourly routine firing into a sleeping session accumulates a queue that costs real
tokens to clear and yields nothing, because a tick is a whole prompt rather than
a change since the last one. Fifty-three identical copies is the measurement.

## 1. The waiting queue answered — run 43956538893

Dispatched `inbox-lessons-waiting.yml` and `site-health.yml` on main
`79388000ae8`. Both succeeded.

`site-health.yml` run **43956553068**: success, 21:05–21:06 UTC. The live site had
had no witness from this session for two days (the sandbox has no route to
poetech.us, so a runner is the only eye — DR-0125). It is up and fresh.

`inbox-lessons-waiting.yml` run **43956538893**, job `list` (133612471141):

| # | step | conclusion |
| --- | --- | --- |
| 3 | Join the tailnet (to reach the live database) | success **as a step** (21:06:01→21:09:02) |
| 4 | Verify the tailnet actually joined | success, and set `TAILNET: false` |
| 5 | List the waiting lesson rows (never a body) | **skipped** |
| 6 | When the tailnet is shut, read the house's own census | **success** |
| 7 | The NAS lesson builder's progress | skipped |
| 8 | Record the run (rolling log) | success → issue #2378, comment 6929412445 |
| 9 | A queue that was never read fails this run | success |

Step 3 is the shape DR-1284 pinned: a join that succeeds **as a step** while the
runner is not on the tailnet. Step 4 is the separate witness that catches it.

### What the census said

The second road — `served-anon-key.py` → `served-lesson-queue.py` → migration
0320's `lesson_queue_receipt()` over the public road — answered in production for
the first time. `SERVED_READ: ok`, `SERVED_COUNT: 5`, `SERVED_AGE: 6`. Its stdout:

```
### Waiting lesson rows: 5
Counted on the NAS itself 6 min ago (fresh), read over the public road.
The oldest has waited 4 d 8 h (2026-11-12T12:17:12.767416+00:00).
By road -- research-inbox: 5.
By shape -- build-failed: 3, plain: 2.
Failed because -- other: 2, transient: 1.
Not counted as waiting: awaiting-review, lesson-building, lesson-captured, not-a-lesson, withdrawn.
```

Step 9 closed `the queue was read (nas=skipped, served=ok)` — green, and green
for a reason, which is the whole point of that step existing.

### What the rolling log carried

One number. The entry read: *"**5** lesson row(s) waiting — the house's own
census, read over the public road, taken 6 min ago."* The oldest-waited, the
shapes and the stall reasons went to the **step summary**, which is exactly the
artifact DR-1186 opened this log to stop paying for: reaching it from a cloud
session costs thousands of tokens.

And those are the facts that decide the next move. A `voice-waiting-for-words`
row is waiting on Whisper and must not be built at all (DR-0611). A
`build-failed` row wants a retry or a person, and `by_stall` says which —
`transient` and `rate-limited` retry themselves, anything else is stuck. The
oldest-waited is the only measure of how overdue the lane is. `5` alone tells a
session the queue is not empty and nothing about whether any of it is actionable.

DR-1507 is the fix: the census's own lines now ride the log entry.

### What is still unknown, and why — checked rather than assumed

The five rows are **unnamed**. Only step 5 lists IDs, and both roads to widening
that are the same dead Tailscale key:

- Teaching the census to put IDs in the receipt means changing
  `infra/nas-loops/lesson-queue-census.py`, which reaches the NAS by a hand
  `git pull` over SSH. **Verified: `infra/nas-loops/registry.json` has no
  self-pull loop** (health-check, surface-audit, scribe-transcribe,
  services-sync, funnel-watchdog, transcript-backfill) — so a merge does not
  deploy it.
- A new migration exposing the IDs reaches the database the app actually reads
  via `scripts/sovereign-replay-over-tailnet.sh` (DR-0317). Also the tailnet.
- The hosted Supabase connector is a **different database** (DR-1270) and its
  tags are not trustworthy for this question.

So the count is now knowable without the key and the identities are not. The
blocker is one value only Darrell can mint: a fresh **Reusable + Ephemeral
`TS_AUTHKEY`** in the Tailscale admin console. Per the DR-1159 order of roads,
this is genuinely road (3) — not a NAS-held value a runner or ConnectBot could
fetch, but a key minted in a vendor console.

### The never-a-body check, done rather than asserted

`the-waiting-queue-has-a-witness.test.js` pinned the log step to ONE readable
file, and that single filename was the whole privacy argument. Admitting
`served-queue.txt` on the strength of a comment would have traded a check for a
claim (DR-0076 §2), so the new file's producer is pinned instead. Verified in
`scripts/served-lesson-queue.py`: it never reads a `body` field under any
spelling, and prints only the total, a stamp, the oldest row's TIMESTAMP, three
dicts whose keys are class names, and the excluded tag names. Its own comment
records why: the stall's reason text "can quote a person's words".

### A Ways finding recorded and deliberately not fixed

The tailnet join burns **three minutes a run** (21:06:01→21:09:02) on a key that
cannot work — about 72 minutes of runner time a day across 24 firings.
Shortening it means editing the shared `join-tailnet` action that **64
workflows** use, several of them deploy-adjacent, and DR-0107 forbids touching
that lane without proving the site still deploys. Not worth that blast radius
for a key restore that ends it. `re-review: 2026-11-30`.

## 2. Three dates came due while the session slept

Running the full CI guard chain surfaced three expired promises, none caused by
this session's diff, all of which would have reddened the next PR to run CI for
reasons unrelated to its own change. Main's last CI run is **10558**
(2026-11-13 22:37 UTC), green — before any of them lapsed.

| what | came due | handled |
| --- | --- | --- |
| `AUDIT_BY` in `a-service-comes-home.test.js` | 2026-11-15 | DR-1510 — new date 2026-12-15 with both whys |
| `reReview` on the Upscayl candidate, `open-source-candidates.js:235` | 2026-11-15 | re-reviewed in place, new date 2026-12-14 with the why |
| `.github/workflows` line ceiling + a stale `workflow-register.json` | on this diff | register refreshed; the added comment trimmed to fit |

**The pre-Way audit list is down to two**, and neither is forgotten work:
`supabase` lacks nothing readable and sits there only because its restart is
`compose up -d`, a compose converge that `restartOnEveryPath` cannot count — so
the open item is in the READER; `ytzero` lacks `health` alone because the app
exposes no health route and its own healthcheck is a TCP connect. Full reasoning
in DR-1510.

**Upscayl** was re-reviewed rather than re-dated blindly: it is unchanged and
still wanted, and the reason it has not moved is that its single next step is a
placement on `dev-gpu-node-1` (a Vulkan GPU the NAS does not have) reached over
the tailnet. The batch script is writable from here; the placement is not. Dated
to the key rather than to another arbitrary month.

Three separate dated promises lapsing in one weekend is itself worth noticing:
DR-0075's machinery is working exactly as designed — nothing stalled silently —
but a cluster like this is what an idle session costs.
