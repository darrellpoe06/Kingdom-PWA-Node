# Video Harvest Coverage Ledger — one source, many harvests; no video lost

**Date:** 2026-06-25
**Branch:** `feat/video-harvest-coverage-ledger` (off `main` f48ea87)
**Binding principle (Darrell, 2026-06-25):**
> "No video should be lost to that Sunday or Wednesday — we need each video to give us new content and context to something."

## The miss this closes

Service recordings were ingested **once, for the sermon only**. `importSermonsFromChannel`
(choir-sync.js) pulls @thelovecorner uploads, parses the title, and writes ONE
`choir_sermons` row per video. Everything else a recording contains — the worship
songs, the lessons, the Scripture cited, the world-issue context, the testimonies,
the trivia, the events — was left on the cutting-room floor. There was **no record
of what a video had been mined into**, so "is this Sunday fully used?" had no answer
and under-harvested videos were invisible.

## The model: one-source-many-harvests

Each ingested recording is ONE source that fans out into MANY harvests, all derived
from the **already-ingested corpus** (the Whisper transcript) — never a re-fetch:

| Harvest | Surface it feeds | Evidence today |
|---|---|---|
| `transcript` | SME pipeline | foundation — all others derive from it |
| `sermon` | The Word | the `choir_sermons` row (real) |
| `scripture` | Scripture library | `choir_sermons.scripture_ref` (real) |
| `songs` | Choir library | `choir_songs.source_video_id` link (real) |
| `lessons` | Learn | recorded (SME pipeline output) |
| `discernment` | Discernment track | recorded |
| `testimony` | Study / Sermon Stories | recorded |
| `trivia` | Engagement | recorded |
| `events` | Institutional memory | recorded |

Registry + math: `app/src/lib/video-harvest.js` (pure, dependency-free, 29 tests).

## The coverage ledger (the measurable core of "no video lost")

`video_harvests` (migration `0050`): one row per source video per instance, with a
`harvests` jsonb map of `{ <type>: { status, count, refs, note, harvested_at,
harvested_by } }`. Idempotent upsert by `(instance_id, video_id)`.

Coverage is **derived, never painted** (DR-0076). `buildLedger()` joins the REAL
corpus (`choir_sermons` + `choir_songs`) OVER the ledger:

- **Every ingested sermon video MUST appear.** A video with no ledger row / no
  harvests is an **orphan** — "lost to that Sunday/Wednesday" — surfaced first.
- Real downstream rows (`scripture_ref`, linked songs) are merged in as **evidenced**
  signals that can only confirm/strengthen a recorded status, never fake one.
- `noVideoLost = orphans === 0`. The surface shows the count and refuses to read green
  while any recording is un-mined.

Honest states throughout: empty corpus → "nothing ingested yet"; started-but-incomplete
→ partial with the exact harvests still owed; a steward can mark a type `na` (a Bible
study with no choir song) so it stops reading as a gap.

## Surface

`Church → 🌾 Harvest` (staff-gated; `components/HarvestLedger.jsx`). Top banner =
no-video-lost verdict; four stats; per-type corpus coverage; the video list sorted
**under-harvested first** with per-type chips (✓ complete / ◐ partial / · gap / —
n/a; ✦ = verified against real data). Stewards (owner/admin) record a harvest per
type inline. Read = whole choir; write = owner/admin (RLS, 0050). Registered in the
feedback-area gate (`church-harvest`).

## Coordination with the sibling lanes (consume, don't duplicate)

- **Choir lane** (`fix/choir-song-library-source`, worktree `kpn-wt-choir-songs`):
  `choir_songs.source_video_id` (added in 0050) is the link a harvested song carries
  back to its source recording. The choir importer should set it when a song is mined
  from a service video, so the song library **consumes from the shared harvest** and the
  ledger can evidence the `songs` type. `choir_song_ideas.source_video_id` is added too,
  guarded (that table is migration 0036, not yet on main).
- **Discernment lane** (`feat/world-issues-discernment-track`, worktree
  `kpn-wt-world-issues`): when its table lands, it links by the same `video_id` and the
  `discernment` harvest type is recorded against the source video — one transcript, both
  the sermon and the world-issue context, no second pull.
- **SME pipeline** (`infra/nas-sme-pipeline/`): the transcript is the single corpus;
  the per-harvest extraction prompts (songs / lessons / discernment / testimony / trivia /
  events) run against that one transcript. Extending the prompt set + writing harvest
  records back is a **NAS-side, Darrell's-hand deploy** (manual-run, behind the brakes).

## Verification (DR-0076)

- 29 pure-model tests (`__tests__/video-harvest.test.js`): registry, coverage, na
  exclusion, real-state signals, orphan detection, no-downgrade merge, the corpus
  roll-up, honest empty state. All green.
- `npm run build` green (component imports/exports resolve). Lint clean. Full suite
  536/536 green. Feedback-area coverage gate green (`church-harvest` registered).
- **Not yet verified:** the live authed UI on the cloud instance (verified-by-use by
  Darrell) and the NAS-side multi-harvest extraction (manual deploy).

## On merge

Apply migration `0050` to the cloud Supabase DB (`mjjlevhdufpaplypnqrv`). Until then the
surface degrades honestly: `fetchLedger` errors → `[]`, so the ledger still lists every
sermon video as an orphan (correct), and recording fails soft. No breakage.
