# Lesson-intake signal channel (DR-0312, event-driven amendment)

This branch exists to hold ONE permanently-open DRAFT pull request — the wake
channel for the Gmail-lesson-intake Way.

How the event chain works (DR-0255 — event-driven first):

1. Darrell sends/forwards an email carrying his "Lesson" marker from
   darrellpoe06@gmail.com or dpoe@illinois.edu.
2. `.github/workflows/lesson-mail-watch.yml` (scheduled every 5 minutes on
   main; dormant until the `GMAIL_WATCH_APP_PASSWORD` secret is set) checks
   the inbox over IMAP, read-only, for Lesson mail not yet labeled
   `Lesson-Captured`.
3. On a hit it comments on THIS draft PR (one comment per Message-ID, deduped).
4. The comment wakes the subscribed Claude session, which runs the DR-0312
   capture protocol immediately: fetch in full -> Word-first lesson -> verses
   pinned -> lane -> label the thread.

This PR must stay a DRAFT (the auto-merge sweep skips drafts) and must never
be merged — it is a mailbox flag, not a change.

Fallback heartbeat: the "Gmail lesson intake" Routine still ticks every 4
hours, catching anything the watcher misses (watcher dormant, Actions outage,
webhook loss). The label ledger keeps both paths idempotent.
