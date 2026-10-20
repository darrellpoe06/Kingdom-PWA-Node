# DR-1117: One road says what actually went wrong — the rescued error stops shouting, and a half-written answer stops being an answer

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (one shared script; no surface, no schema, no money; a gate ships with it)
**Type:** way

**Area:** `scripts/live-sql.sh` — the single path from a GitHub runner to the database the app actually reads (tailnet → ssh → `docker exec psql` inside `supabase-db`), shared by 14 workflows.

**Grounds:** the 21:04 UTC hourly lesson-intake tick of 2026-10-19, run 39325597249. Its log carried `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock` twice, on a run that succeeded and correctly reported `waiting lesson rows: 0`.
**Principles:** DR-0618 (one road to the live database); DR-0076 §3 (proven-to-catch) and §4 (measure, don't claim); DR-1041 / DR-1042 (the measurement was sound and the presentation defeated the reader); DR-0075 (the default is improve); DR-0621 (a flag is where the work starts).

## Context

The hourly intake read zero waiting rows, which was the right answer. Establishing
that it was the right answer cost a reader — me — four tool calls and a full read of
`live-sql.sh`, because the log said `permission denied` twice and said nothing at all
about having recovered.

It had recovered. Docker on DSM answers the unprivileged call that way, the script
retries once under `sudo`, and the retry worked. The script's own header documents
this: *"Docker on DSM can need root; retry once with sudo before calling it a
failure."* The behavior was correct and the log described a broken run.

That is exactly the shape DR-1041 and DR-1042 recorded two days apart: the
measurement was sound and the presentation defeated the reader. Both of those were
about output a reader could not reach. This one is the inverse — output a reader
could reach and should not have been shown, which is worse, because unreachable
output merely withholds an answer while a false alarm supplies a wrong one. On a
road 14 lanes share, every lane inherits it.

Reading it to settle that question turned up a second thing nobody had hit yet.

## What was measured

**The false alarm, on the real run.** Run 39325597249, step *List the waiting lesson
rows*: two `permission denied ... docker.sock` lines, step conclusion `success`,
`waiting lesson rows: 0`. The zero was trustworthy for reasons that are in the code
and not in the log — `ON_ERROR_STOP=1`, psql's exit code propagated, and the calling
step's `|| { echo "::error::could not read the live database"; exit 1; }`. A reader
has to go find all three.

**The doubled answer, measured on main's own script.** `main`'s form is:

```sh
run "$DOCKER" && exit 0
rc=$?
if [ "$rc" -eq 1 ] && ! "$DOCKER" ps >/dev/null 2>&1; then
  run sudo -n "$DOCKER"
  exit $?
fi
```

The first `run` streams psql's stdout straight to the caller. A docker that writes
part of a result set and *then* dies has already emitted those rows; the `sudo`
retry then emits the whole set again, and the script exits 0. The caller gets a
doubled answer with a success code, and the monitors parse this output positionally
with a field separator — a doubled row set is not detectably wrong to any of them.

This is not a reading of the code; it was run. Lifting the quoted heredoc out and
running it against a stub docker that writes one row and dies with the real DSM
message gives, on `main`:

```
stdout: row-a\nrow-a\nrow-b\n      exit 0      stderr: permission denied ...
```

and when both attempts fail, `main` emits `row-a` on stdout — a half-written answer
presented as data.

**Scope.** 14 workflow files reach the database through this script
(`feedback-fixed`, `church-video-witness`, `inbox-lessons-waiting`,
`inbox-lesson-body`, `inbox-lesson-tag`, `lesson-inbox-bell`, `apt2-photos-probe`,
`ops-queue-health`, `public-shelf-witness`, `system-flow-proof`, `harvest-health`,
`voice-intake-health`, `video-stats`, and the status script), plus five `.mjs`
callers. One change reaches all of them.

## Decision

**Both attempts are buffered. Only a losing attempt's stderr is released, and rows
are released only by the attempt that finished them.**

- stderr from the first attempt is held. If the `sudo` retry succeeds, it is
  discarded — nothing failed, so nothing is reported. If both fail, it is released
  verbatim with psql's own exit code.
- stdout is held per attempt. A partial write from a dying docker is never emitted,
  so it can neither be doubled by the retry nor mistaken for an answer when both
  attempts fail.
- `ON_ERROR_STOP=1` and the exit-code contract in the header are unchanged. The one
  property the monitors depend on — *an empty answer never reads as "the database
  holds none"* — is untouched, and a case pins it.
- `mktemp` is **not assumed** on the Synology. The fallback is a pid-suffixed path
  under `TMPDIR`. I could not verify `mktemp` on DSM from this sandbox, which has no
  route to the NAS — only runners join the tailnet — so the fallback is the honest
  answer rather than a guess that happens to hold. On a road 14 lanes share, a
  missing binary must not take all of them down.

## Impact

**What this buys.** A `permission denied` line in any of those 14 logs now means a
run that actually failed. That is the whole point: the line was previously free, so
it carried no information, and a reader had to read the script to learn that. And a
truncated result set can no longer reach a monitor wearing a success code.

**What this does not do.** It does not instrument how often the sudo retry is
needed, so there is still no number for how many DSM calls take the privileged path
— the first attempt's failure is now silent by design, and counting it would mean
emitting the thing this record removes. If that count is ever wanted it belongs in a
step summary, not in stderr. It does not touch the five `.mjs` callers, which read
this script's stdout and are unaffected by construction. It does not change the
`docker ps` probe that decides whether to retry — that probe is still a second
unprivileged call, which is cheap and correct but means a docker broken in some
*other* way than permissions gets one attempt, not two. Leaving that alone is
deliberate: widening the retry to all failures would mask real breakage, which is
the defect this record is closing, pointed the other way.
**`re-review: 2026-11-16`** — whether the sudo path should be counted in the step
summary, once there is a month of logs that no longer cry wolf to read it from.

## Verification

`app/src/__tests__/one-road-says-what-went-wrong.test.js`, 10 cases. The remote half
of `live-sql.sh` lives inside a **quoted** heredoc — what is written there is exactly
what the NAS runs — so the test lifts it out and runs it against stub `docker` and
`sudo` binaries. No NAS, no tailnet, no network, and a case asserts the heredoc is
still quoted so the lift stays honest.

Measured on the shipped script: the rescued run exits 0, hands back `row-a\nrow-b\n`
with `row-a` appearing **exactly once**, and writes **nothing** to stderr. When both
attempts fail, the error is released with psql's exit code 2 and stdout is empty.

**Proven-to-catch, two ways.** (1) A case reconstructs the streaming form through the
same stubs and asserts it doubles the rows, exits 0, and leaks the rescued error —
so the stubs are shown to be capable of catching the thing, not merely of passing.
(2) The fix was reverted to `main`'s version and the suite re-run: **6 of 10 cases
go red**, among them *a failed run does not emit the partial rows as if they were an
answer*. The hazard is therefore confirmed present on `main` today rather than
reasoned about, and the gate is not theater.

**Number.** DR-1117, not 1115. Computed across every tree rather than taken from
`claim-decision-number.mjs`, which reads only the local branch: `origin/main` holds
up to DR-1114, the account-backup branch holds DR-1104–1109. DR-1115 and DR-1116 are
**already assigned** to two lesson builds that stopped on a weekly rate limit before
writing their records; taking 1115 here would collide with work that is parked, not
abandoned.
