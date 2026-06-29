# Choir repertoire — where the song library actually comes from

**The problem this lane solves:** the Choir > Songbook was empty because nothing
ever produced its data. The app has a *consumer* (the in-app "Import
repertoire.json" panel → `importRepertoireJson` → `parseRepertoireJson` →
`choir_songs`), but there was no *producer*. `service-to-repertoire.sh` is that
producer.

## Why the YouTube channel alone can't fill it

The choir's songs are **not in the channel's titles or descriptions.** Verified
2026-06-25 against the live `@thelovecorner` channel RSS feed
(`https://www.youtube.com/feeds/videos.xml?channel_id=UC821pJh7YR5llBNnWUJj-ZA`):
every recent upload is a **sermon or Wednesday Bible Study** (title = date +
Bishop Gwin), and the descriptions are **empty or hashtags only** — no chapter
markers, no "Songs:" lists.

So the in-app **"Scan the church YouTube archive"** button (`scanArchiveForSongs`,
which reads song lists / chapters out of video *descriptions*) returns **zero**
against this channel even when a `VITE_YOUTUBE_API_KEY` is configured — there is
no per-song metadata to read. The choir's song identity lives only in the
**audio** of the service recordings.

**Therefore the faithful source is transcription**, not metadata scraping. That
is exactly what the sermon importer does NOT need (sermon titles are in the video
title) and what the choir repertoire DOES need.

## The pipeline (sovereign, local, manual-run)

```
service recording ──▶ faster-whisper (INT8, NAS, isolated container)
                         │  transcript.txt
                         ▼
                   local Ollama (qwen2.5:14b)  +  repertoire-json-prompt.md
                         │
                         ▼
                   repertoire.json   ◀── the EXACT contract the app imports
                   source.json       (consent + provenance)
```

Run it (overnight for long services — CPU transcription is ~1–3× media length):

```bash
cd /volume1/PoeTech/sme-pipeline      # or wherever infra/nas-sme-pipeline lives
./service-to-repertoire.sh ./intake/services/2026-05-10-sunday.mp4 5-10-svc 2026-05-10 sunday
```

Then in the PWA: **Church → Choir → Songbook → "Source the repertoire +
keyboardist knowledge" → Import repertoire.json** (paste the file). Every seeded
song lands flagged **needs review** until a steward (Christina / the director)
confirms it. Nothing is auto-trusted; nothing is invented.

This shares the **same** isolated Whisper container + local Ollama as
`sound-engineer-to-lessons.sh` (reconcile, don't fork). It is **behind the
brakes**: manual-run only, no cron, no watcher, reviewed before import.

## The HISTORICAL sweep — one source, two harvests (reuse, don't re-fetch)

The target is the choir's **full historical library** — every song sung over time,
modeled as **Song → Renditions** (the ways we've sung it, by service/date). The
efficient way to build it (Darrell 2026-06-25): the **same service recordings
already ingested for sermons** (`choir_sermons`) contain the choir songs. So we do
**not** pull a new video list — we drive off the corpus we already have and
harvest the songs from each service, **reusing** that service's video link + date.

```
choir_sermons (services we already hold)  ──▶  corpus-to-repertoire.sh
   │  export a manifest:  <video_id>\t<date>\t<type>\t<audio_path>
   ▼
for each service:  service-to-repertoire.sh  ──▶  per-service songs (tagged video_id)
   ▼
repertoire-historical.json   (import once)        scope.json (swept N of M — honest partial)
```

```bash
./corpus-to-repertoire.sh ./services.tsv     # services.tsv exported from choir_sermons + NAS audio paths
```

On import, `importRepertoireJson` → `attributeToCorpus` matches each song to its
service (by `video_id`, else by date) and **inherits the existing service's video
URL + date/type** — so the song lands as a **rendition of that real, historical
service**, not a re-fetched copy. The Songbook's "Source the repertoire" panel
shows an **honest sweep readout** computed from real data: *N service videos in the
archive · songs harvested from X · P still to sweep.* A partial sweep reads as
partial — never painted as complete.

**Corpus depth.** The harvest denominator is how many services are ingested.
`importSermonsFromChannel` now **pages** the upload history (bounded by
`maxPages`, default 12 ≈ 600 services) and returns `more:true` when the channel
has further history — so the corpus (and thus the song history) can be
comprehensive, not capped at the most-recent 50.

## Deploy / operational steps that are NOT code (a human's hands)

1. **Apply the schema.** The archive columns the import writes
   (`source`, `video_id`, `confidence`, `needs_review` on `choir_songs`) live in
   `infra/supabase/migrations-auto/0042-choir-sme-notes.sql`. That file's number
   **collides** with `0042-service-program.sql`; confirm the choir-sme one is
   actually applied to the cloud DB (Supabase project `mjjlevhdufpaplypnqrv`),
   or every archive insert fails with `insert-error` and the list stays empty.
   The repo guards the file is correct (`choir-songs-persist-guard.test.js`);
   applying it to the cloud is the human step.
2. **Run the pipeline** on real service recordings to produce `repertoire.json`,
   then import it in-app (above). Until then the Songbook is **honestly empty**
   (it shows the real reason, not a painted/seeded list).
3. *(Optional, limited.)* Setting `VITE_YOUTUBE_API_KEY` enables the description
   scan — but per the verification above it recovers little for this channel.
   The transcription pipeline is the real source.
4. **Instance render:** seeded rows are instance-scoped to the COLG instance.
   If the colg instance needs the one-time Studio apply for these to render,
   that apply is the deploy step (separate from this code).
