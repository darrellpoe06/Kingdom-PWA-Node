# DR-0614 — The NAS jobs follow the database the app reads, and lesson rows are mirrored to where the cloud reader can see them

- **Status:** accepted
- **Tier:** A (no schema; two NAS jobs change which database they address, one mirror of rows the app already writes)
- **Type:** fix
- **Date:** 2026-09-24
- **Scope:** `infra/nas-lesson-voice/lesson_voice_transcribe.py` (the resolver; the mirror), `test_lesson_voice.py` (+5), `install.sh` (runs with only the NAS database's credential); `infra/nas-bridge-publish/publish_family_key.py` (the resolver), `test_publish_family_key.py` (+1)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: the claim "Sent" traced to the row), DR-0442 (the one resolver every NAS writer uses), DR-0306 / DR-0310 (the sovereign stack and the repoint), REALITY-TRACE (DR-0061)
- **Grounds:** Darrell, 2026-09-24, a screenshot of Notes → Thinking Space with 📖 Lesson chosen and "Sent. Whisper on our own machines writes the words…": *"Just tried it!!!"*

## Context — the question

The spoken lesson was recorded and the surface said "Sent". The hosted project (`mjjlevhdufpaplypnqrv`) had no row in `agent_inbox` and no object in `lesson-audio`.

## What was measured

| what | measured |
| --- | --- |
| which database the live site writes to | the deploy run 36019276980 (head `db750f70` = main) ran "Join the tailnet (repoint armed only)" and "Fetch the sovereign anon key from the NAS"; `.github/workflows/deploy-cloudflare-pages.yml:123` builds with `SOVEREIGN_SB_URL` (`https://poetech.us/sb`) when armed. **The live app reads and writes the NAS's own Supabase.** |
| the hosted project after the send | `agent_inbox` 0 rows; `lesson-audio` 0 objects |
| the NAS jobs built today | read `/volume1/PoeTech/secrets/supabase.json`, which names the **hosted** project (the exact class DR-0442 found for the ingest loaders on 2026-09-16) |
| the lesson reader | queries the hosted project; it cannot reach the NAS's database |

## Impact

Unresolved: the send was saved in the NAS database, the Whisper job looked in the hosted one and found nothing, and the reader could never see a lesson sent from the app. Resolved: the Whisper job and the family-key publisher address the database the app reads, through the same resolver every NAS writer uses (`infra/nas-supabase/sovereign_target.py`); every lesson row the reader must see is copied to the hosted project under the same id.

## Decision

1. **Both NAS jobs use `resolve_target`:** explicit env first; then, with `REPOINT-ARMED` merged and the NAS's own stack present, the NAS database on the loopback; else the secrets file. The target is printed on every run.
2. **The mirror.** When the live database is the NAS's, each run copies to the hosted `agent_inbox` every row tagged `lesson` that the reader must see (a typed lesson, a `voice-transcript`, a `voice-failed`), under the same id, with its author, instance, body, tags and time; the original is tagged `mirrored`. A raw `voice` row is not copied; its words arrive as the transcript row. A copy that fails is not tagged and is retried next cycle. At most 20 per run.
3. **Correction to DR-0612's live numbers.** Its before-and-after table was measured on the hosted project. The app has read the NAS's database since the repoint, so those counts describe the hosted copy, not necessarily the rows on screen. The derivation and its tests stand; the numbers are re-measured on the live database by the board itself once Phase 1 ships (the daily record in `decision_readouts` is written to the database the app reads). `re-review: 2026-10-01`.

## Verification

- `test_lesson_voice.py` 21 (the mirror copies typed lessons and transcripts, not raw audio rows; same id; tags the original only after a good copy; a failed list never raises; the job imports the resolver and mirrors only when the target is the NAS's database). `test_publish_family_key.py` 8. `sovereign_target.py --selftest` 6/6.
- After merge (services-sync, within 15 minutes of the mirror pull): the NAS job's log line names `target: sovereign`; his spoken lesson's transcript row appears in the NAS database and its mirror in the hosted `agent_inbox`; the lesson reader picks it up on its next 4-hourly tick.

## Limits, stated

1. **The mirror needs the hosted project to hold the same instance and user ids** (the repoint copied the data across). A row whose instance or author is missing there is refused, reported in the run's JSON, and retried; it does not reach the reader until that holds.
2. **The reader still reads the hosted project.** When a cloud path to the NAS database exists for the reader, the mirror retires. `re-review: 2026-10-07`.
