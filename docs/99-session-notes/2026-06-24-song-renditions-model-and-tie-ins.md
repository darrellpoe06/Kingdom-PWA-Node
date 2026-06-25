# Song -> Renditions model + tie-ins (2026-06-24)

Darrell's framing: the choir's past performances + their ad-libs together are
"THE WAYS WE HAVE SUNG THESE SONGS IN THE PAST." A song is one title with MANY
renditions -- one per time it was sung -- and opening a song shows "the ways
we've sung this": rendition A (this date, this vamp/these runs), rendition B
(that date, different).

**Descriptive, never prescriptive (binding, 2026-06-24).** The record is an
EXACT, FAITHFUL record of what was actually done -- captured precisely enough
(the detail, the time span, who) to reproduce a past rendition exactly *if the
choir chooses*. It informs; it does not dictate. Copy reads "exactly how we sang
it on [date]," never "sing it this way." The choir stays free to sing it however
the Spirit leads next time; the tool preserves + clarifies what was done,
available to reproduce OR depart from. Fidelity is the priority; prescription is
never the intent. Noting a loved ad-lib onto the arrangement is a **dated
reference** ("As sung [date]: ..."), available to draw on -- not a rule.

Built on branch `feat/choir-renditions` (off `origin/main`, after the merged
Songbook cross-reference #312). This note records the model + the two cross-lane
contracts so the master-program lane and the content-engine lane can consume the
same single source without colliding.

## The model (no new entity)

A rendition IS a real `choir_songs` set-list row -- one row per
`(title, service_date, service_type)` (migration 0011). The Songbook (0041,
`lib/choir-songbook.js`) groups those rows by normalized title into a Song.
Migration **0043** adds the PER-RENDITION fields a single performance carries:

| column (choir_songs) | meaning |
|---|---|
| `ad_libs jsonb` | the highlighted variations for THAT performance (vamps, runs, soloist moments, bridge/arrangement differences) |
| `keyboardist_notes text` | the keyboardist's notes for THAT performance (distinct from the song's general `notes`, and from the song-level `choir_sme_notes`) |

Plus `choir_rendition_loves` (keyed by the row id) = rendition-level loves:
"which VERSION the body loved most," distinct from 0041's title-level
`choir_song_loves` ("I love this song").

**Archive provenance is NOT duplicated.** Migration **0042** (#320, the
archive-seeded repertoire + keyboardist SME notes) already put `source` /
`video_id` / `confidence` (text `high|med|low`) / `needs_review` on `choir_songs`.
`lib/choir-renditions.js` READS those for a rendition's source honesty
(`needsSourceReview` = `needs_review` OR an archive match rated `low`) -- it adds
no parallel source columns. The song-level keyboardist knowledge
(`choir_sme_notes`, "how to play this song" across every Sunday) and this
per-rendition `keyboardist_notes` ("how we played it THIS time") compose; they
are different granularities, not a conflict.

Everything is DERIVED from the real rows (`lib/choir-renditions.buildRenditions`)
-- nothing painted. A rendition with no ad-libs says so; a detected ad-lib is
flagged `unreviewed` (never shown as confirmed); a low-confidence archive match
flags `needsSourceReview`.

### The `ad_libs` object shape (the single consumer is `lib/choir-renditions.js`)

```json
{
  "id": "string (stable within the rendition)",
  "type": "vamp | run | soloist | bridge | key-change | tempo | arrangement | other",
  "label": "short human label, e.g. 'Extended vamp on the tag'",
  "at": 740,                 // seconds into the recording, or null
  "endAt": null,             // seconds, or null
  "soloist": "Sis. M | null",
  "description": "string | null",
  "source": "curated | detected",
  "confidence": 0.82,        // 0..1 for detected; null for curated
  "review": "confirmed | unreviewed | rejected"
}
```

`normalizeAdLib()` coerces any raw object to this shape and DROPS a typeless,
labelless entry (no fabrication). `parseAdLibs()` tolerates an array or a JSON
string and never throws.

## Tie-in 1 -- Master Sunday Program (lane local_c2e9aaaa, `feat/service-order-master-program`)

The master program selects not just the SONG but WHICH RENDITION to base Sunday
on. That branch is held (Tier C) and not merged, so this lane did NOT edit it
(no collision). The seam is ready on this side:

- **Persist:** the program stores `renditionId` (the `choir_songs` row id)
  alongside its song selection. `lib/choir-renditions.renditionRef(rendition)`
  returns `{ renditionId, titleKey, title, serviceDate, label }` -- the stable
  thing to persist.
- **Resolve:** `resolveProgramRendition(renditions, renditionId)` round-trips the
  id back to the live rendition for rendering. Returns `null` if the performance
  was deleted (degrade gracefully -- fall back to the song's latest).
- **Service-program change (that lane owns it):** add an optional `rendition_id`
  to the song-selection structure in `church_service_segments` (its `song_ids`
  jsonb -> carry `{ songId, renditionId }` pairs, back-compat: a bare id = "no
  specific rendition, use latest"). The choir side already exposes the picker
  data (every rendition with its `label`), so the program's song row just needs a
  "base on this version" dropdown sourced from `buildRenditions`.

## Tie-in 2 -- Content engine / SME extraction (lane local_c119ab7a)

Same archive as the existing sermon import: the `thelovecorner` YouTube channel
(`choir-sync.importSermonsFromChannel`) + church-NAS recordings, transcribed by
the local faster-whisper SME pipeline (`infra/nas-sme-pipeline`, manual-run).

The content engine is the WRITER of detected ad-libs; this model is the consumer.
Contract for the pipeline:

1. Match a recording to a rendition (a `choir_songs` row for that song + date)
   using the 0042 provenance columns: `source='archive'`, `video_id`,
   `confidence` (`high|med|low`), `needs_review`. **A low-confidence match must
   NOT overwrite a manual rendition's source silently** -- set `needs_review` (or
   `confidence='low'`) and let `needsSourceReview` surface the flag for a human.
2. Write detected variations into `ad_libs` using the shape above with
   `source='detected'`, a real `confidence`, and `review='unreviewed'`. The
   director confirms/rejects in the UI (the panel's check / x controls).
3. Never invent an ad-lib or a match. An empty `ad_libs` is the honest default.

The pipeline should reuse the exported helpers (`normalizeAdLib`, `parseAdLibs`)
rather than fork the shape, and write via the same per-row update path as
`choir-renditions-sync.saveRenditionDetail` (the columns, not a new table).

## Music-creation: note a loved ad-lib as a dated reference

`graduateAdLib(existingArrangement, adLib, rendition)` (pure) appends a DATED
REFERENCE ("As sung [date]: ...") to the song's arrangement without clobbering it
(idempotent). Descriptive only -- no "keep/always/must" (a proven-to-catch test
guards the wording). `choir-renditions-sync.graduateAdLibToArrangement(rowIds,
arrangement)` writes it across the song's rows so the reference is available on
the song going forward (`buildReusedSong` carries `arrangement`) -- a reference
the choir CAN draw on, never a rule it MUST follow. UI: the "note as reference"
action on a loved ad-lib.

## Files

- `infra/supabase/migrations-auto/0043-choir-song-renditions.sql`
- `app/src/lib/choir-renditions.js` (pure model) + `choir-renditions-sync.js` (I/O)
- `app/src/components/ChoirRenditions.jsx` ("the ways we've sung this" panel)
- wired into `app/src/components/ChoirSongbook.jsx` (the "Ways we've sung it" toggle)
- `choir-sync.toSongShape` extended with `ad_libs` + `keyboardist_notes`
- tests: `choir-renditions.test.js` + `choir-renditions-render.test.jsx`

## Release / apply

- Tier C (COLG-facing choir surface). Apply **0043** on merge
  (`db-migrate` -- additive, idempotent, no anon; reads degrade gracefully before
  it lands, writes fail soft).
- Gates green: 1578 vitest + `npm run build` + render proof.
