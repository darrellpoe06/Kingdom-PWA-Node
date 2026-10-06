# DR-0767 — The lesson body read survives a long spoken word

**Date:** 2026-10-06
**Status:** accepted
**Area:** in-app lesson intake, the NAS road
**Principle:** DR-0076 (measure, do not claim; proven-to-catch), DR-0611 (spoken lessons), DR-0621 (hold the hand of the process), DR-0697 / P63 (the round-trip that proves the transport)

## Context

Darrell recorded two teachings into the app at 21:05 and 21:10 UTC on
2026-10-06. Whisper wrote the words of the first as transcript row
`79c29dc9`, named `Christyn's Homework`. The NAS lesson builder then tried
five times to build it and handed it back failed, so the row became the
intake's to build. The intake's first step is to read the words with
`inbox-lesson-body.yml` — and that run failed too, with no reason printed.

The step is the one careful part of the road: the words are base64-encoded in
the database, dotted every two characters so GitHub's secret masking cannot
blank a run inside them, and checked by comparing the database's own md5 of the
body against the md5 of what the runner decoded (P63). None of that ran. The
step printed the row id, printed the tags, and died.

So a teaching Darrell spoke was sitting in the database, transcribed, and
unreadable by the one tool whose whole job is to read it.

## What was measured

- **The failing run, verbatim** (`37542689782`, job `112539211497`):
  `printf: write error: Broken pipe` at the tags line, the same again at the
  md5 line, then `##[error]Process completed with exit code 1` with **no error
  annotation of its own** — none of the step's three `::error::` messages fired.
- **The row's tags did print**, which is how the intake learned what it had:
  `of:5c65e606-21a8-497b-82d9-5a50b25449f5`, `whisper:nas-cpu`,
  `speakers:marked`, `lesson-name:Christyn's Homework`, and the NAS builder's
  own verdict, `build-reason:no version passed every gate (1 written):
  cli-local structure failed`.
- **The mechanism, isolated and reproduced off the runner.** Three facts
  compose:
  1. GitHub's default shell for a `run:` block is `bash -e`, and this script
     adds `set -uo pipefail` on top of it.
  2. `encode(…,'base64')` in Postgres wraps its output every 76 characters, so
     the row is MANY lines, not one.
  3. `db_md5=$(printf '%s' "$out" | head -1 | cut -d'|' -f3)` is a **bare
     assignment**, so the pipeline's status is the command's status. `head -1`
     exits after the first line; once the rest of the row no longer fits in the
     64 KiB pipe buffer, `printf` takes SIGPIPE, the pipeline exits 141, and
     `-e` kills the step before any message can be printed.
- **Replayed, with the numbers.** A row of 204,000 body bytes (272,000 base64
  characters, wrapped to 76) run under `bash -e` with `pipefail`: the old code
  prints the tags line and **exits 141** before reaching the md5 line, which is
  the failing run's exact shape. The same words as a single-line row through the
  new code: `round-trip ok, b64 chars 272000`, exit 0.
- **Why it had always worked before.** At 38,400 base64 characters the whole
  remainder fits in the pipe buffer, `printf` finishes before `head` exits, no
  SIGPIPE, exit 0. Every shorter teaching read fine, so the road looked sound
  until a long one arrived. The earlier line survived for a different reason:
  `echo "tags: $(…)"` hides the substitution's status behind `echo`'s own, and
  `-e` only sees `echo`.

## Impact

- **A long spoken teaching can be read again.** The failure was selective in the
  worst way: short words worked, long words died silently. The longer the
  teaching, the more certain the loss — and length is not a defect in a spoken
  word, it is a fuller one.
- **A silent death becomes a stated reason.** The step had three careful error
  messages and printed none of them, because it was killed between them. The
  round-trip check now reports both md5s and the base64 length when it fails, so
  the next transport problem names itself instead of looking like a dead step.
- **The round-trip keeps its meaning.** It exists to catch a transport that
  altered the words. It cannot do that if the script dies before reaching it; it
  is now always reached.
- **Nothing about the privacy of the road changes.** The body is still never
  printed in the clear, still dotted every two characters, still only read for
  Darrell's own two accounts, and a member's row is still refused with no read
  (DR-0635 / DR-0639).

**Not fixed here:** why the NAS builder's `cli-local` gate rejected all five of
its attempts at this row (`cli-local structure failed (verdict must be lesson
…)`). That is the builder's own gate, the message is truncated in the bell, and
the words had to be readable before anything could be said about it. The intake
builds the lesson from the words meanwhile, which is what the hand-back is for.
**re-review: 2026-10-08.**

## Decision

- The query asks for the base64 as **one line** —
  `replace(encode(convert_to(coalesce(body,''),'UTF8'),'base64'), chr(10), '')`
  — so the row is a single line and no pipe is needed to take it apart.
- The step takes its fields with **bash string operations, never `head`**.
  String operations cannot raise SIGPIPE. The fields are taken from the END
  (base64 last, md5 before it), so a `|` inside a tag such as a lesson name
  cannot shift them.
- `got_md5` tolerates a failed decode (`|| true`) and the comparison reports
  **both md5s, dotted, plus the base64 length** before exiting 1. If the
  single-line query is ever regressed, the parse would take only the first 76
  characters and this check fails loudly rather than handing back a truncated
  teaching.
- The reason is written into the step as a comment, naming the run and the
  three facts that compose the failure, so the `head` is not reintroduced by
  someone tidying the script.

## Verification

- **Proven to catch (DR-0076 §3), reproduced rather than reasoned about:** on a
  204,000-byte body wrapped to 76 characters, the old pipeline under `bash -e`
  with `pipefail` prints the tags line and exits **141** before the md5 line —
  the failing run's exact shape. The new parse on the same words returns
  `round-trip ok, b64 chars 272000`, exit 0.
- **The guard rail was checked too:** feeding the new parse a multi-line row, as
  if the single-line query had been regressed, fails with
  `round-trip failed: database md5 b0.66.09…, runner md5 76.31.e7…, base64
  characters 76` and exit 1 — a stated reason, not a silent truncation.
- The changed workflow parses as YAML with its four steps intact. `actionlint` is
  NOT installed in this sandbox, so it was not run here; CI's own workflow
  checks are the gate this change passes through.
- Not verified from here: the real read of `79c29dc9` against the live database,
  because this sandbox reaches the NAS only through the workflow and the
  workflow must be on `main` to dispatch. That is the first thing done after
  this merges, and it is how Christyn's Homework gets built.
