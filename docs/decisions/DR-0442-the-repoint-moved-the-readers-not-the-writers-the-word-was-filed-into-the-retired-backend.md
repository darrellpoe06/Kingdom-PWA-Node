# DR-0442 — the repoint moved the readers, not the writers: the Word was filed into the retired backend

- **status:** accepted
- **date:** 2026-09-16
- **declared by:** Darrell — *"Where are the messages in September? On this tab they are on the first tab..."* (in-session, 2026-09-16, with two screenshots of The Word → Migdal reading "0 of 901 messages · September 2026")
- **extends:** DR-0310 (the repoint rides the record), DR-0317 (the repoint moved the rows, not the blobs), DR-0307 (the cutover sprint), DR-0333 (the COLG sermon intake way), DR-0076 (verification doctrine), DR-0108 (review our Ways), DR-0075 (a non-improvement carries a why + a date)

## What broke

The Word → Migdal on poetech.us showed **0 of 901 messages** for September 2026,
with the month stepper on September and the honest empty state. The Church
home tab, one tab over, listed the September livestreams, because that strip
reads the channel's own RSS through `/api/church-recent` and never touched the
library. Darrell saw the two disagree and asked.

## What was measured (DR-0076 §4, before any code)

| where | choir_sermons | newest service | September 2026 rows |
|---|---|---|---|
| the app, live (two devices) | 901 | (August) | 0 |
| the HOSTED project `mjjlevhdufpaplypnqrv` | 911 (910 non-draft) | 2026-09-13 *Breathe On Me* | 4 — 9/2 *Equipped To Win*, 9/6 *I'll Go*, 9/9 *I'll Go!*, 9/13 *Breathe On Me* |
| the public RPC `theword_public_sermons()` on hosted | 910 | 2026-09-13 | 4 |

Every candidate on the app side was ruled out by reading the code and the data:
the month window math is local on both sides (`monthKeyOf` / `monthRange`), the
display dedupe keys by `video_id` and the four videos are distinct, RLS grants
the owner every row, the public RPC has no cache, the service worker caches no
REST response, and `dedupeSermons` on the hosted set collapses nothing (911
distinct keys). The client set is simply an older set: **the app is not reading
the hosted project at all.**

It has not been since 2026-08-19. `REPOINT-ARMED` (DR-0310) builds the app
against `https://poetech.us/sb`, the sovereign stack on the NAS. The sovereign
database holds what was dumped into it that day plus what the app has written
since. The four September services were written by
`infra/church-media-golive/youtube_load.py` on the NAS (rows carry
`source: youtube`, `created_by: null`, created 9/3, 9/7, 9/10, 9/14), and that
script reads its backend from `/volume1/PoeTech/secrets/supabase.json`, whose
`url` is the hosted project. So did every sibling loader: `proclaim_load.py`,
`prep_from_transcript.py`, `choir_dates_sync.py`, `load-transcripts.py`,
`rss-ingest.py`, `ops-runner.py`, `worship-song-harvest.py`. Since the repoint,
every row they filed went into a database the app no longer opens.

The whole drift on hosted since the baseline day, by table (rows created
≥ 2026-08-19): `video_transcripts` 699 · `choir_sermons` 9 · `church_speakers` 1
(the FK target of one sermon) · `tlc_onboarding_invites` 5 · `instances` 2 ·
`entities` 2 · `agent_tasks` 2 · `ops_commands` 1 · `tlc_jobs` 1 ·
`person_links` 1 · `_sync_tokens` 1. The transcripts are the largest: the
GitHub-run `transcript-backfill.yml` writes through `SUPABASE_DB_URL`, which is
the hosted project, the same way `db-migrate.yml` did before the replay lane.

## Why this is the third instance of one class

DR-0310 moved the **readers** (the app's build). DR-0317 found the **blobs**
had not moved. The sovereign-replay lane found the **migrations** had not
moved. This record finds the **writers** had not moved. Each time the surface
that failed was one the family actually meets (Shay's gallery, Darrell's
Properties tab, the church's Word), each time CI was green throughout, and each
time the fix was the same shape: measure both sides independently, carry the
difference, and make the lane follow the record so it cannot reopen.

**The principle, stated once so it stops being rediscovered:** a repoint is
complete only when **readers, writers, blobs, migrations and lanes** all follow
the same record. An arming record that moves one of the five has not repointed
the system; it has split it.

## Decision

1. **The writers follow the record, the way the deploy does.**
   `infra/nas-supabase/sovereign_target.py` is one resolver every NAS loader
   now calls: explicit env (`SUPABASE_URL` + `SUPABASE_SERVICE_KEY`) → the
   sovereign door when `REPOINT-ARMED` exists beside it **and** the box's own
   `/volume1/docker/supabase/.env` yields `SERVICE_ROLE_KEY` (kong loopback
   `http://127.0.0.1:8800`) → the secrets file as before. The second branch is
   true only on the NAS with the record merged; a tower or a laptop has no local
   sovereign `.env` and keeps its file, so nothing can be pointed at a loopback
   it cannot reach. Every loader prints which backend it resolved to, on stderr,
   once per run. Eight scripts changed in one place each; their existing tests
   still pass; the resolver has its own proven-to-catch selftest in CI.
2. **The rows already filed on hosted are carried across, and the carrying is
   measured.** `infra/nas-supabase/content_sync.py` reads both databases
   independently (the `cutover_sync.py` shape: hosted via `AGENT_DB_URL`,
   sovereign via the box's own password on `127.0.0.1:5433`), plans the
   difference by primary key for an explicit list of content tables
   (`church_speakers`, `choir_sermons`, `video_transcripts`, `sermon_prep`,
   `sermon_video_stats`, `video_harvests`, in FK order), inserts what hosted
   has and sovereign lacks (`ON CONFLICT (id) DO NOTHING`), updates only where
   hosted's `updated_at` is newer, never touches a sovereign-only row (those
   are the app's own writes since the repoint), intersects columns by name so
   drift cannot invent a value, re-counts after writing, and reads **GO only
   when nothing hosted-only remains**. Dry-run by default. Selftest in CI.
3. **The lane is the team's hands (DR-0108).** `sovereign-content-sync.yml`
   (dispatch-only, the DR-0317 shape) joins the tailnet and runs
   `scripts/content-sync-over-tailnet.sh` on the NAS: `mode=dry-run` is the
   witness and goes red when any hosted-only row remains; `mode=apply` carries
   the difference and goes red unless it reaches GO. Each run also prints which
   backend the loaders now resolve to on the box and the HTTP code the
   sovereign REST door returns for the box's own service key, so the repoint
   of the writers is proven on the box, not asserted from here.
4. **No app change.** The Migdal surface told the truth: the database it reads
   had no September rows. Its auto-period landed on the newest month it had,
   and the stepper to September showed an honest zero. A surface that lies
   would have been the worse outcome; this one did its job and Darrell caught
   the split in one look.

## Not decided here (surfaced, with recommendations)

- **A daily armed run of the content sync** (the DR-0247/DR-0248 deterministic
  class: budget + lock, starts by merge) would carry any writer that has not
  yet been repointed — the GitHub-run transcript backfill among them. It is
  written into the workflow's own header as the next decision rather than
  shipped in this push; recommended **yes** once the first `apply` run reads
  GO and the loaders are seen resolving to `sovereign` on the box.
  **re-review: 2026-09-23.**
- **`transcript-backfill.yml` still writes to hosted** through
  `SUPABASE_DB_URL`. Recommended: route it over the tailnet the way
  `db-migrate.yml` now does (one script, both lanes). Until then the content
  sync carries its rows. **re-review: 2026-09-23.**
- **The non-content drift** (`instances`, `entities`, `tlc_*`, `agent_tasks`,
  `ops_commands`, `person_links`, `_sync_tokens`) is named here and not
  carried by this tool: those rows were written by migrations, seeds or lanes
  that need their own reading before a copy is safe (the TLC and Poe Properties
  instances were minted after the repoint — whether the sovereign side already
  holds them by replay is the first question). **re-review: 2026-09-23.**
- **A parity row for content tables in `nas-health`** so the witness that
  already counts `auth.users` on both sides counts `choir_sermons` too.
  Recommended yes; small. **re-review: 2026-09-23.**

## What Darrell does (nothing, unless he wants to watch)

The first two runs go through the lane: a `dry-run` dispatch to measure, then
an `apply` dispatch to carry. Both print their per-table lines in the run
summary. Then The Word → Migdal, stepped to September 2026, shows the four
services. If he wants to see the box himself:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase; python3 content_sync.py"
```

That is the dry-run: it reads both databases and writes nothing. Add
`--commit` to the same line to carry the rows across.
