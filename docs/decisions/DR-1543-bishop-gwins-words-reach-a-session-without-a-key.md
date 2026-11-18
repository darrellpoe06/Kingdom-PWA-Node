# DR-1543: Bishop Gwin's words reach a session without a key, so his lessons wait on nobody

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (one step added to an existing NAS rider; no schema, no new road, no money)
**Type:** NAS rider
**Area:** `infra/nas-loops/bg-message-lessons.py` and its test
**Pairs with:** DR-1433 (every message Bishop Gwin preaches becomes a lesson), DR-1360 (the NAS initiates every road), DR-1537 (the builder's failures read only by a hand)

## Context

Darrell, 2026-11-18: build the Bishop Gwin lessons now, and do not wait on the session that is repairing the NAS lesson builder. His messages of 2026-11-04 (I AM SOMEBODY!), 2026-11-08 and 2026-11-11 (I Can Do All Things Through Christ) have no lesson. Their words live only on the NAS. A cloud session cannot read them: the sovereign database is reached over the tailnet, whose key has been dead since 2026-11-04; YouTube refuses the sandbox; and `video_transcripts` has no anonymous read (migration 0058).

## What was measured

- Hosted `choir_sermons` lists all three messages with Bishop Lloyd E. Gwin as the speaker. Hosted `video_transcripts` holds none of their words.
- The rider already reads every one of his messages and their transcripts each services-sync cycle. The NAS already holds the hosted project's key in `supabase.json` (`sovereign_target.resolve_target`).
- The hosted `video_transcripts` table allows five `source` values (a CHECK constraint), so a copy must keep the original's source.

## Impact

Each cycle, the rider copies to the hosted project any of his transcripts it lacks, at most six per cycle. Any session can then read his own words and build the lesson, with no tailnet, no hand, and no repaired builder. The NAS lesson road is unchanged; this only adds a second reader of the same words.

## Decision

1. `mirror_rows` (pure) picks his transcripts that have words, no error, and are missing from the hosted project, at most `MIRROR_PER_CYCLE`, keeping the original source.
2. `mirror_to_hosted` reads the hosted target from the secrets file, does nothing when the main target is already the hosted project, and inserts with merge-duplicates on `(instance_id, video_id)`. A failure is written to the ledger (`mirrored_to_hosted`) and never stops the lesson road.
3. Transcripts are read for every one of his messages without a built lesson, sent or not, so a row the failing builder holds still reaches a session.
4. The lessons built from these words add their video ids to `bg-message-lessons.json` `done`, so the NAS never builds them twice.

## Verification

- `test_bg_message_lessons.py` (12): only missing transcripts with words are copied, nothing is copied twice, the cap holds, an unknown source becomes an allowed one, and the secrets file is read or refused. Proven to catch: with the already-have check removed, two cases fail.
- Counts as working when hosted `video_transcripts` shows his 2026-11 messages, read with the hosted project's own query after the next services-sync cycle.
