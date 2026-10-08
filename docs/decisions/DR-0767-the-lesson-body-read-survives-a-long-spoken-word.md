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
     exits as soon as it has the first line, which on a wrapped row is after
     about 1,500 of 34,530 bytes; `printf` then races to finish writing into a
     pipe whose reader is leaving. When it loses, it takes SIGPIPE, the pipeline
     exits 141, and `-e` kills the step before any message can be printed.
- **It is a race, not a size threshold, and the real row was NOT reproduced
  here.** Darrell's row is 24,467 body bytes, 32,624 base64 characters wrapped
  into 430 lines, 34,530 bytes in all. Rebuilt to that exact shape and run under
  `bash -e` with `pipefail` on this four-CPU sandbox, the old code **exits 0
  twelve times out of twelve** — it wins the race here, while the runner lost
  it. So the honest statement is that `printf` and `head` race, the outcome
  depends on scheduling, and a bigger row loses more often: at 272,000 base64
  characters the old code exits **141** here every time, before the md5 line,
  which is the failing run's exact shape and is how the kill path was confirmed
  end to end.
- **Why it had always worked before.** Shorter teachings won the same race, so
  the road looked sound until a long one arrived on a runner that lost it. The
  earlier line survived for a different reason entirely: `echo "tags: $(…)"`
  hides the substitution's status behind `echo`'s own, and `-e` only sees
  `echo`. That is why the log shows a broken pipe at the tags line AND at the
  md5 line, but died only at the second.

## Impact

- **A long spoken teaching can be read again.** The failure was selective in the
  worst way: short words worked, long words died silently, and because it is a
  race the same row could read fine once and die the next time. The longer the
  teaching the likelier the loss — and length is not a defect in a spoken word,
  it is a fuller one. Removing the pipe removes the race rather than winning it.
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

- **The real read now works, which is the strongest evidence and it is not
  synthetic.** `inbox-lesson-body.yml` re-dispatched on `main` after this merged
  (run `37544218320`) read row `79c29dc9` end to end: `round-trip: the runner's
  decode matches the database`, `bytes: 24467`, and the words printed. Decoding
  that output independently here gives 24,467 bytes with md5
  `8e228fdecdc97037f2609a32e5af0824`, matching the database's own md5 that the
  run printed dotted. The teaching is readable.
- **Proven to catch (DR-0076 §3), on an analogous row, NOT on Darrell's:** at
  272,000 base64 characters the old pipeline under `bash -e` with `pipefail`
  prints the tags line and exits **141** before the md5 line — the failing run's
  exact shape. Rebuilt to Darrell's real shape (34,530 bytes, 430 lines) the old
  code exits 0 twelve times out of twelve on this box, so the specific failing
  run was **not** reproduced locally; the runner lost a race this sandbox wins.
  The kill path is nevertheless established directly from the run's own log: its
  shell line reads `/usr/bin/bash -e {0}`, the broken pipe is reported at the
  tags line and again at the md5 line, and the step ends `exit code 1` with none
  of its three `::error::` messages fired.
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

## Correction (2026-10-06, hours after this record was accepted)

As first written, the **What was measured** and **Verification** sections said
the step died "once the rest of the row no longer fits in the 64 KiB pipe
buffer", and presented a 204,000-byte replay as the failing run's reproduction.
Both overstated what had been measured.

Rebuilding Darrell's row to its real shape — 24,467 body bytes, 32,624 base64
characters, 430 lines, 34,530 bytes in all — the old code exits 0 twelve times
out of twelve here. There is no 64 KiB threshold: `printf` and `head` race, and
the outcome depends on scheduling. The large replay demonstrates the kill path,
not this row's failure.

The sections above now say that. The decision does not change: removing the pipe
removes the race instead of relying on winning it, and the real read of
`79c29dc9` on `main` afterwards is the proof that matters.

## Re-review 2026-10-08 — what the five refusals actually were

Read the gate rather than guessing from the truncated bell line.
`infra/nas-lesson-builder/lesson_writer.py:304-312`:

```
verdict = obj.get("verdict")
if verdict not in ("lesson", "test-only", "not-a-lesson"):
    p.append("verdict must be lesson | test-only | not-a-lesson")
if verdict != "lesson":
    return p
```

**The gate was right, and it was not refusing a correct judgment.** It
*accepts* `not-a-lesson` — and when the verdict is anything other than
`lesson` it returns immediately, complaining about nothing else. So the five
`cli-local structure failed (verdict must be lesson …)` attempts mean the
writer returned an object whose `verdict` was **absent, or not one of the
three** — not that it judged the row correctly and was turned away. That is
worth saying plainly, because the opposite reading is the natural one from
the truncated message, and it is wrong.

Two things follow, and they are different sizes:

- **This row class cannot recur.** A reading now declares itself at record
  time and never reaches the builder at all (DR-0810), and a human verdict
  has had a home since DR-0768. Nothing will hand the writer a child's
  homework reading again.
- **Still open, and bigger than this record:** a writer that omits `verdict`
  burns its whole attempt budget on *any* row, silently, because the bell
  shows only the first fragment of the gate's complaint and never the
  writer's own output. Two separate things to fix — the omission, and the
  truncation that hid it. Neither is this record's subject and neither should
  be guessed at from here; the writer's raw output lives on the NAS.
  **re-review: 2026-10-15** — read one failing attempt's full writer output
  through the NAS road, then decide whether the fix is the prompt, the JSON
  extraction, or the bell's budget.
