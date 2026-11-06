# The lesson lock has a road — the narrative behind DR-1354

**Date:** 2026-11-06
**Record:** [DR-1354](../decisions/DR-1354-the-lesson-lock-has-a-road-a-runner-can-walk.md)

Narrative held here per `record-length-guard` (DR-1339): the record stays inside 60 lines
and its INDEX row inside 700 characters, and the guard's own message is the instruction —
put the narrative in the session note the record cites.

## It looked like an oversight for weeks

Every report of mine that touched the Gmail lane carried the same line: the label has never
been set on any built thread. I wrote it as a backlog item. It was not one. It was a road
that did not exist, and I only found that by trying to walk it twice in one session and
getting `MCP tool call requires approval` both times.

The connector's label write is gated on a human approval, every call. The lane that is
supposed to perform the step runs hourly, unattended, at 11 AM, 1 PM and 3 PM Central and
through the night. Those two facts cannot both be satisfied. The step was unreachable by
its own performer.

## What was actually protecting us

`lesson-row-shipped-sweep.mjs`, alone. Measured today: of the 28 threads the intake query
returns as unlabelled, **7 are already-shipped lessons** — their decision records name them.
The lock was documented as the brake; the ledger sweep was the brake.

**The seven, with their records** — these ids live here and NOT in the decision record, deliberately.
`one-thread-one-record-guard` reads a thread id inside a record as that record *owning* the thread,
and each of these is owned by its own lesson's record. Naming them in DR-1354 made eight threads
read as claimed twice and failed the guard; it was right to.

| thread | shipped as |
| :--- | :--- |
| `1a18262cf26c9f77` | DR-1295 |
| `1a164afce3d5ed0b` | DR-1332 |
| `1a163d3dfa9641dc` | DR-1338 |
| `1a163d000aaa1023` | DR-1325 |
| `1a163a78c1d14d84` | DR-1322 / DR-1325 / DR-1332 |
| `1a15f24a9e2291c3` | DR-1193 |
| `1a15f615725825be` | DR-1192 |

The eighth was pm14's own thread, `1a163d58a4d068b6` (DR-1349), which the record also named while
describing what the first live run would label.

That is the part worth remembering. A safeguard that cannot be reached by the process it
guards is not a safeguard, it is a note — and while it sits in the documentation looking
load-bearing, the thing actually carrying the weight looks like redundancy.

## The road was already there

`lesson-mail-watch.yml` has read this mailbox over IMAP every five minutes since DR-0312,
with `GMAIL_WATCH_APP_PASSWORD`, and its header says in plain words: *"The watcher NEVER
mutates mail (peek only); labeling is the capture session's job."* That sentence assigned
the write to a session that had no way to do it.

In Gmail's IMAP a label is a folder, and `UID STORE … +X-GM-LABELS (Lesson-Captured)` adds
one. The credential that reads could always have written the lock. DR-0108's order of roads
asks for exactly this: a GitHub runner first, a paste into Darrell's hands last.

## The trap in the middle

A Gmail API thread id is hex. IMAP's `X-GM-THRID` is the same number in decimal:

    1a163d58a4d068b6  ->  1879757345405298870

That is past `Number.MAX_SAFE_INTEGER`. `parseInt('1a163d58a4d068b6', 16)` rounds it, and a
rounded thread id matches no message and raises no error. The search returns empty, the run
exits clean, and nothing is ever labelled. It would have read as "already done" forever —
the same shape as the bug it was built to fix. So the conversion uses `BigInt`, and the test
that pins it is the one proven-to-catch case that matters: swapping in `parseInt` turns four
cases red.

## Two faults in my own checks

Both are in the test file, with their reasons, because they are the more useful half.

**A check that could not run.** My first draft built `new RegExp("uid('COPY")` and threw
*Invalid regular expression: Unterminated group*. It would have reported a pass the moment
someone wrapped it in a try.

**A check that read prose as code.** The second draft scanned the workflow for `trash` and
matched this workflow's own comment promising it never trashes anything. That is the exact
false positive I had removed from the DR-0719 teacher registry a few hours earlier, where a
comment *forbidding* Bishop Gwin's credit was read as evidence he taught the lesson. Twice
in one day, the same lesson: a scanner that reads comments will always find the thing the
comment promises not to do. It now strips comment lines first.

**And a number I pinned without measuring.** I asserted `X-GM-LABELS` appears 4 times; it
appears 3. Removed rather than corrected: a count that moves whenever a comment is edited is
a check that cries wolf, and the form assertions beside it carry the real meaning.

## What is not done

`workflow_dispatch` needs the workflow on the default branch, so this has not touched the
live mailbox yet. The first real run is after merge, on the three threads that are merged
and deploy-proved: pm14 `1a163d58a4d068b6`, sov69 `1a16401bf7c5898d`, ll283
`1a164aff48fa13de`. `re-review: 2026-11-13` — confirm all three carry the lock and the
unlabelled count fell by three.
