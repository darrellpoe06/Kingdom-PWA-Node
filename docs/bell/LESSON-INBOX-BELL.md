# The lesson inbox bell

This branch (`bell/lesson-inbox`) and its pull request exist only to be rung.
They never merge: the PR carries the `hold` label, and `bell/*` sits outside
every lane pattern in `auto-open-pr.yml`, `auto-merge.yml` and
`keep-prs-current.yml`.

Darrell, 2026-09-30: *"I don't like timers... they cost more than we need...
don't we have a better solution/s?"*

## How it rings

1. A lesson row is written to `agent_inbox` on the NAS database the app reads
   (typed in the app, a Whisper transcript, a Governor's approval).
2. Migration 0243's trigger calls `pg_notify('lesson_inbox', <row id>)`.
3. The NAS lesson builder, already LISTENing, sends one
   `repository_dispatch` of type `lesson-saved` (no row words, no ids).
4. `.github/workflows/lesson-inbox-bell.yml` reads which lesson rows wait
   (ids, created_by, tags; never a body) and comments here only when that set
   changed since its last comment.
5. The intake session subscribed to this PR wakes on the comment. No lesson
   waiting means no comment and no AI turn.

A daily scheduled run is the safety net for a ring that never arrived.

## Stop it

Set the repository variable `LESSON_BELL` to `off`, or delete the workflow.
