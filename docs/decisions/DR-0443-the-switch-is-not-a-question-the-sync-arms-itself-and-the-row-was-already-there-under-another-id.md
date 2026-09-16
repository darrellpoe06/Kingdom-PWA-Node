# DR-0443 — the switch is not a question: the sync arms itself, and the row was already there under another id

- **status:** accepted
- **date:** 2026-09-16
- **declared by:** Darrell — *"You switch it!!!!!!!!! Obviously!!!!! Why wouldn't that just happen????! Ridiculous claude!"* (in-session, 2026-09-16, on reading DR-0442's "not decided here" item about a daily armed run)
- **extends:** DR-0442 (the repoint moved the readers, not the writers), DR-0111 (do the work, do not re-ask what is decided), DR-0247 (agreed work starts itself through the lane), DR-0248 (the deterministic class carries budget and lock), DR-0076 (verification doctrine), DR-0108 (review our Ways)

## What he corrected

DR-0442 found the split, built the resolver and the carry tool, and then parked
the carry itself on a human dispatch, with a daily run written up as a decision
for him to make and a re-review date a week out. That was the DR-0111 failure in
its plainest form: the whole point of the finding is that the app's database is
missing rows the family can see are missing, and the fix was left sitting behind
a question. **He is right. Carrying the rows across is not a decision; it is the
work.** A lane that only runs when a human remembers to press it is the same
class of gap as the writer that was never repointed.

## What the first apply run measured (DR-0076 §1, receipts before claims)

Dispatched immediately on his word, `mode=apply`, run 35097143467 on
`main@1230926c`:

| table | hosted | sovereign before | copied | sovereign after | hosted-only after |
|---|---|---|---|---|---|
| church_speakers | 3 | 2 | **1** | 3 | 0 |
| choir_sermons | 911 | 902 | **9** | 911 | 0 |
| sermon_prep | 39 | 39 | 0 | 39 | 0 |
| sermon_video_stats | 0 | 0 | 0 | 0 | 0 |
| video_harvests | 0 | 0 | 0 | 0 | 0 |
| video_transcripts | — | — | — | — | **UNMEASURABLE** |

The run also proved the writer repoint on the box itself, which is the half that
could not be asserted from here: `loaders now resolve to: sovereign
http://127.0.0.1:8800`, and the sovereign REST door answered the box's own
service key with `HTTP 200`.

**So the Word has its September back.** The four services Darrell could not find
(9/2 *Equipped To Win*, 9/6 *I'll Go*, 9/9 *I'll Go!*, 9/13 *Breathe On Me*), plus
five earlier strays and the speaker row one of them points at, are now in the
database the app reads. The verdict was still NO-GO, correctly, because one
table could not be measured — the tool refused to round its own failure to zero.

## The break the run found, and the fix

`video_transcripts` died on `duplicate key value violates unique constraint
"video_transcripts_uniq", Key (instance_id, video_id)=(...)`. Both databases
already held the same transcript **under different primary keys**, because each
side's row was minted by its own insert. Planned by `id`, such a row reads as
missing for ever — a permanent NO-GO that is not a real gap — and the insert
aborted the whole table.

1. **A table with a natural unique key is planned by that key**, not by `id`
   (`NATURAL_KEYS`: `video_transcripts` and `sermon_video_stats` on
   `instance_id + video_id`). One `key_expr` renders the key for the index read,
   the row fetch and the update's `WHERE`, so those three can never disagree
   about what identifies a row. A natural key whose columns this copy cannot
   fully read falls back to `id` rather than being guessed at.
2. **Every insert is `ON CONFLICT DO NOTHING` with no target**, so a row already
   present under any unique index is skipped instead of aborting its table.
3. **`id` is never in an UPDATE's SET.** On a natural-key match the two sides
   hold different primary keys, and rewriting one would break every row that
   references it.
4. Six new selftest cases pin all of it, including the two that catch this exact
   break: an insert that names only the primary key, and a row held on both
   sides under different ids reading as missing.

## Decision

1. **The content sync is ARMED.** `sovereign-content-sync.yml` now carries a
   daily schedule (06:20 UTC) and a scheduled run **applies**; a dispatch can
   still measure first with `mode=dry-run`. It is the deterministic class of
   DR-0247/DR-0248 — no model, no spawned work, idempotent by construction — so
   it carries that class's two brakes and no more: a budget (`timeout-minutes`)
   and a single-instance lock (`concurrency`, no cancel). Its stop-paths are
   deterministic: remove the schedule block, or revert the file.
2. **The daily verdict is now the standing witness that the writers stayed
   repointed.** A GO with nothing copied means every writer is landing in the
   database the app reads. A GO with rows copied means one has not been
   repointed yet, and the per-table line names which table it came in through.
3. **`transcript-backfill.yml` can no longer write to the retired backend.** It
   writes through a direct Postgres URL, and `SUPABASE_DB_URL` names the hosted
   project — that lane is how 699 transcripts went hosted-only. It now prefers
   `SOVEREIGN_DB_URL` and **fails loud** when `REPOINT-ARMED` exists and no
   sovereign URL is set, naming the live path (the NAS transcript-trickle, whose
   loader resolves the sovereign door by itself since DR-0442) instead of
   silently filing rows nobody reads.
4. **The standing rule, stated so it is not rediscovered a fourth time:** when a
   finding names rows the app cannot see, the carry-across ships armed in the
   same change as the finding. "Shipped inactive" is for the AI-class and
   compute-spawning work the three-brakes rule governs, never for a deterministic
   repair of data the family is already looking for.

## Still open, and not parked behind a question

- ~~The non-content drift named in DR-0442 is next.~~ **CLOSED the same
  session, from the live constraint catalogue rather than a guess.** Eight of the
  remaining tables were read for their real unique keys and sorted into two
  groups. **Carried, with the natural keys the catalogue gave:** `instances`
  (`slug`), `entities` (`instance_id + slug`), `tlc_onboarding_invites`
  (`token`), `tlc_jobs`, and `person_links` (`primary_user + door_user`, a table
  with **no id column at all** — the second thing the read turned up, and the
  reason `key_cols_for` can no longer assume one). The two instances minted after
  the repoint, `tlc-therapy-solutions` and `poe-properties`, and the two Poe
  Properties entities, are in that carry. `video_transcripts` was also confirmed
  clean under its key: 872 rows, 872 distinct `(instance_id, video_id)`, no
  duplicates and no null video id, and the unique index that aborted the first
  run lives on the sovereign side, not on hosted. **NOT carried, and printed on
  every run rather than left silent:** `ops_commands` and `agent_tasks` are
  operational queues the runner acts on, whose rows belong to the stack that ran
  them, and `_sync_tokens` is a delta-read watermark — carried into a database
  with different contents it would make a delta reader SKIP rows it has never
  seen, which is worse than the gap. The index read also now takes `max(updated_at)`
  per key rather than an arbitrary row, so a key covering several rows cannot make
  the plan flap from day to day. Eight further selftests pin all of it.
- A content-parity row in `nas-health` so the witness that counts `auth.users`
  on both sides counts `choir_sermons` too.
