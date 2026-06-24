# Choir repertoire + keyboardist knowledge — archive→app handoff contracts (2026-06-24)

Darrell, 2026-06-24: the choir's PAST song list is inside the church archive (the
YouTube channel + NAS recordings, the same source the content engine uses). The
Songs surface is empty; auto-populate it from the archive (what the choir actually
sang) and enrich each song with the keyboardist's (Christian) musical knowledge —
keys, arrangements, how to play it.

This note pins the **two handoff contracts** between the NAS pipeline (lane
`local_eceef6e5` / `infra/nas-sme-pipeline`) and the in-app consumer (the Songbook,
`app/src/components/ChoirSongbook.jsx`). **Reconcile, don't fork:** the app consumes
the pipeline's output as-is; the pipeline owns the extraction run.

## Reality-trace (why a pipeline at all)

A YouTube service recording has **no machine-readable per-song index**. The PWA
cannot, by itself, say "they sang Total Praise at 12:30" without fabricating. So
faithful auto-population has two honest sources, and **both flag uncertainty
rather than guessing** — a steward confirms every seeded song before it is trusted:

1. **`repertoire.json`** — the pipeline transcribes the recordings (faster-whisper)
   and extracts what was actually sung (local Ollama), with confidence + a source
   quote. This is the deep, authoritative source.
2. **Channel metadata** — song lists / chapters an author put in a video
   **description** are real song boundaries. The app reads these today via the
   YouTube Data API (`scanArchiveForSongs`); always `needs_review` (a description
   is real but not a guarantee).

If neither yields songs, the list stays empty. We do not paint a repertoire that
wasn't sung.

## Contract A — `repertoire.json` (NEW; the pipeline emits, the app imports)

Emitted per processed service recording (or a batch). Consumed by
`lib/choir-archive.js#parseRepertoireJson` → inserted into `choir_songs` (the
cross-referenced Songbook home), deduped by `(video_id, normalized title)`.

```json
{
  "source": { "channel": "thelovecorner", "kind": "service-archive" },
  "songs": [
    {
      "title": "Total Praise",
      "video_id": "abc123",
      "youtube_url": "https://www.youtube.com/watch?v=abc123",
      "start_seconds": 750,
      "service_date": "2026-05-10",
      "service_type": "sunday",
      "scripture_ref": null,
      "confidence": "high",
      "source_quote": "...and the choir sang Total Praise..."
    }
  ],
  "unclear": [ "Was the 3rd selection Goodness of God?" ]
}
```

Rules (faithful): a song with no `title` is dropped (never seed an unnamed song).
`confidence: "high"` seeds `needs_review = false`; anything else (med/low/missing)
seeds `needs_review = true`. `start_seconds` deep-links the YouTube watch URL.
Nulls stay null. `unclear[]` surfaces in the import result for the team to confirm.

## Contract B — `knowledge.json` (EXISTING; unchanged — `choir-keyboardist-to-knowledge.sh`)

Already defined by `infra/nas-sme-pipeline/choir-knowledge-json-prompt.md`. Consumed
by `lib/choir-sme-notes.js#parseKnowledgeJson` → inserted into `choir_sme_notes`
(migration 0042), status `extracted` (unconfirmed) until a steward reviews.

```json
{
  "sme": { "name": "Christian", "role": "choir keyboardist" },
  "songs": [
    { "title": "Way Maker", "key_label": "B", "arrangement": "Simple pad intro...",
      "note": "Keys: keep the intro simple... watch the bridge.",
      "confidence": "high", "source_quote": "We're doing it in B..." }
  ],
  "general_guidance": [ { "topic": "Dynamics", "guidance": "Watch my hands...", "source_quote": "..." } ],
  "unclear": [ "..." ]
}
```

A note links to a song by **normalized title** (`normalizeTitle`), so it rides the
song across every Sunday it is sung. `note` → how-to-play; `key_label` → key;
`arrangement` → arrangement. A note whose song isn't in the repertoire yet is an
**orphan** (surfaced in the import surface, not dropped).

> **Supersedes** the routing in `CHOIR-SOURCE.md` (which targeted the Song Workshop
> pool `choir_song_ideas`). Per Darrell 2026-06-24, the keyboardist knowledge now
> enriches the **song cross-reference** (the Songbook over `choir_songs`), where
> scripture/theme/sermon/most-loved already live. The Workshop stays for proposing
> NEW songs. The SME lane should update `CHOIR-SOURCE.md` to point here (left to
> that lane to avoid a cross-lane edit collision).

## In-app flow (reviewed, not autonomous)

`Church → Choir → Songbook → "📼 Source the repertoire + keyboardist knowledge"`
(director-only):

1. **Scan the church YouTube archive** — seeds songs from descriptions/chapters
   (needs_review). OR **paste `repertoire.json`** — the deeper extract.
2. **Paste `knowledge.json`** — Christian's per-song key/arrangement/how-to-play,
   imported as unconfirmed notes.
3. **Confirm** each seeded song (clears `needs_review`) and each keyboardist note
   (`extracted → reviewed`). Confirmed knowledge then rides on the song for the
   whole choir; unconfirmed shows only to the director.
4. The song now cross-references scripture/theme/sermon (0041) AND carries the
   keyboardist's key/arrangement/how-to-play (0042), and the choir reacts (♥ /
   most-loved) on it.

## Open coordination items (for the SME pipeline lane)

- Add a `repertoire.json` emitter to the service-archive path (Contract A). The
  app importer is built and waiting.
- Decide whether the pipeline pushes to cloud or the director pastes/uploads the
  JSON (today: paste/upload in-app — no NAS→cloud writer exists, sovereign-by-
  default).
- Update `CHOIR-SOURCE.md` to point the keyboardist handoff at the Songbook.
