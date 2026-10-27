# DR-1222: The SQL rides stdin, never the command line — and the rows the builder hands back say why

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (one transport line in the shared road, the same fix in its one sibling, a read-only probe on an existing witness behind a dispatch input; no gate relaxed, no lane touched; 5 cases, 1 proven to catch on the exact error)
**Type:** orchestration
**Area:**
- `scripts/live-sql.sh` (SQL_B64 and SEP_B64 are the first lines of the script `bash -s` reads from stdin, no longer an ssh argument)
- `scripts/place-doors-over-tailnet.sh` (the one other caller that put SQL on the ssh command line; same fix)
- `app/src/__tests__/live-sql-carries-any-size.test.js` (new — a 300 KB body through an `ssh` shim and a `docker` stub; the old transport line put back must die of "Argument list too long")
- `scripts/lesson-waiting-last-verdict.sql` (new — per waiting lesson row, the newest `lesson_versions` verdict: counts, codes, refs; never a body)
- `.github/workflows/lesson-builder-health.yml` (new `workflow_dispatch` input `probe_waiting`: prints that verdict and asks the primary writer once with the builder's own flags)

**Grounds:** Darrell, 2026-10-27: *"the research did not produce lessons yet did it? Fix it."* Measured on research-inbox run 40430070416 and inbox-lessons-waiting run 40402498112.
**Principles:** VERIFICATION-DOCTRINE (§3 proven to catch, §4 measure, §8 name the method's limits), HOLD-THE-HAND (a flag is where the work starts; the fix is re-measured on live data), REALITY-TRACE (the real road, the real runs, the real rows)

## Context

DR-1202 gave the Research section a road home: an item Darrell sends is answered, read, and then FILED for what it was sent for — a `lesson` row for the NAS lesson builder, or a build request. `scripts/research-create.sh` does the filing as ONE statement so it can neither half-happen nor happen twice, and that statement carries the item's full words (the transcript, base64) into the INSERT. It reaches the live database through `scripts/live-sql.sh`, the one road fourteen lanes share (DR-0618).

Until this record, `live-sql.sh` handed the SQL to the NAS as part of the ssh COMMAND LINE: `$SSH "NAS_ENV='…' SQL_B64='<the whole SQL>' SEP_B64='…' bash -s" < remote.sh`. Every monitor's query is a few hundred bytes, so this held for a month. A filed lesson is not a few hundred bytes.

Separately, DR-1219 (2026-10-26) found fifteen `lesson` rows waiting up to 102 hours while the builder's daily witness passed, and closed the readiness-is-not-production gap. It left one line open: the builder had tried each row twice, failed its gate, handed it back — and *"why is not recorded"* anywhere a cloud session could read.

## What was measured

1. **research-inbox run 40430070416, job `backlog` (121946826936), 2026-10-27T01:15:52Z.** The step "File what earlier answers were sent for" logged `scripts/live-sql.sh: line 89: /usr/bin/ssh: Argument list too long` and then `research-create: the rows could not be filed` for item `572d9578-…`. Linux caps ONE argument at 128 KiB (`MAX_ARG_STRLEN` = 131072); the base64 of the item's words alone exceeded it, so `exec` failed before ssh ever ran. The item stayed answered-and-unfiled, and the backlog step would meet it first on every run (oldest first, ten at most). The same job's reading step failed on `the road answered 503: No AI tower was answering` — the tower asleep, recorded on the item (DR-1200), a separate matter.

2. **The one other caller with SQL on argv.** Grepped `scripts/*.sh`, `.github/workflows`, `infra`: `scripts/place-doors-over-tailnet.sh` line 156 passed a day's placement UPDATEs the same way (`MODE=write SQL_B64='…' bash -s`). Every workflow INSERT goes through `live-sql.sh` on stdin; the research-inbox `put()` helper already streams files over stdin; `arm-voice-studio.yml`'s `-EncodedCommand $B64` carries a fixed script from this repo, not a body, and stays.

3. **The fifteen waiting rows (inbox-lessons-waiting run 40402498112, COUNT 15, 2026-10-26T21:13Z).** All fifteen are `from-research` rows (research-inbox filed them 2026-10-22/23 — the filing road worked for shorter items). Every one carries attempt 2 and the SAME reason tag, cut at the 200 characters `reason_tag()` keeps: `build-reason:no version passed every gate (1 written): cli-local cli-local exit 1: ailed":0,"killed":{"parent"`. Every stage line reads `writing@T … written@T+1–2s … gated … failed`: the primary writer (`cli-local`, `claude -p --output-format json --no-session-persistence --tools ""`, run as dpoe) returned exit 1 within two seconds, so no draft was ever gated — the "gate" that failed is `select_version()` finding no version to select. `lesson_builder.py --status` reported that same writer `ok … signed in` (it runs `claude auth status`, not a prompt). The rows are not failing the Word gates; the writer is not writing. The 400-byte error tail the builder keeps lives in `lesson_versions.error` on the NAS database, which no cloud surface printed.

4. **The "hourly cloud intake" DR-1219 names** is the scheduled task *Voice + in-app lesson intake (PRIORITY lane, hourly)* (`trig_01KnByrzx8yYCURwfRKUrvTq`): enabled, `4 * * * *`, bound to persistent session `session_01BZ8phCUT3wxZNWfT4GCrB6`, last fired 2026-10-27T01:04:43Z with `last_run` SUCCEEDED — which records that the wake was DELIVERED, not how the turn went. Its prompt skips a row the builder owns and would build the rest; fifteen rows waited four days through ~96 of its firings. *Gmail lesson intake* (`trig_01DAcB2dKRE5vuKAtT2NWbLw`, enabled, 11/13/15 Central) fires into the same session; *Intake auto-fix* is disabled. Not created, fired or deleted here; reported.

## Impact

- A research item whose words were longer than ~96 KB could never become a lesson, and said so only as a `::warning::` in a job that otherwise passed. "The research did not produce lessons" was literally true for the long ones.
- `place-doors-over-tailnet.sh` carried the same ceiling on a day's placements.
- Fifteen of Darrell's teachings sat four days with a reason nobody outside the NAS could read, and the reason that was readable (`cli-local exit 1`) was mistaken for a gate failure by the record that found them.

## Decision

1. **The SQL rides stdin, never the command line.** `live-sql.sh` writes `SQL_B64=…` and `SEP_B64=…` as the first two lines of the script `bash -s` reads, ahead of the quoted remote half; the ssh argument is a constant few hundred bytes. Output, separator and exit codes are unchanged (the monitors' parsing is untouched). `place-doors-over-tailnet.sh` does the same. **Proven to catch:** `live-sql-carries-any-size.test.js` runs the shipped script through an `ssh` shim that records argv length and a `docker` stub that counts the bytes psql read: a 300 KB body arrives whole with every ssh argv under 4 KB; the old transport line put back into a copy dies of `Argument list too long` with the real call never reaching ssh (pinned to Linux, where `MAX_ARG_STRLEN` is the cap CI runs under).
2. **The handed-back rows say why, on request, from a runner.** `lesson-builder-health.yml` gains `probe_waiting`: per waiting row, the newest `lesson_versions` verdict — attempts, writer, elapsed, draft or none, each gate's counts, the fault refs, repo gates failed, the error with every quoted string of 25+ characters elided, the `build-reason` tags elided the same way — and then one short question to the primary writer with the builder's exact flags, printing the exit code and the JSON's shape. Never a body, never a prompt, never a reply beyond a word (DR-1159 road 1; the output is visible to the repository).
3. **The writer's failure is the next flag**, not this record's fix: whatever the probe prints is where the work continues (HOLD-THE-HAND). If it is in `lesson_writer.py` it is fixed with a test; if it is the CLI on the NAS, that is said exactly.

## Verification

- `npx vitest run src/__tests__/live-sql-carries-any-size.test.js src/__tests__/one-road-says-what-went-wrong.test.js` — 15 passed, including PROVEN-TO-CATCH (the old line fails on the exact error).
- After merge: `research-inbox.yml` dispatched on `main`; the backlog job's filing step for `572d9578-…` must print `intents […] -> claim|lesson|build|record = 1|…` and a `lesson` row tagged `from-research` must exist (its count, never its body).
- `lesson-builder-health.yml` dispatched with `probe_waiting=true`; the printed verdict lines are the measurement this record's step 3 continues from.
- re-review: 2026-11-03 — the fifteen rows have either shipped or carry a recorded reason a cloud session can read.
