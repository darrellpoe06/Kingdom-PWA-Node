# Choir keyboardist (Christian) -- SME knowledge source

A choir-scoped variant of the SME video->knowledge pipeline. Christian, the COLG
choir keyboardist, records videos explaining the choir section; this turns them into
structured choir knowledge that enriches the choir songs in the app. Fully local on
the NAS -- nothing leaves the box.

```
  Christian's video  ->  faster-whisper (local)  ->  transcript
                     ->  local Ollama (qwen2.5:14b)  ->  knowledge.md + knowledge.json
                     ->  reviewed -> Choir > Song Workshop (per-song key/arrangement/note)
```

## Where Darrell drops the videos

From his desktop (Windows File Explorer):

    \\192.168.1.26\PoeTech\sme-pipeline\intake\choir-keyboardist\

On the NAS: `/volume1/PoeTech/sme-pipeline/intake/choir-keyboardist/`

His hand places the files (they're too large for chat); the local pipeline reads from
there. `DROP-VIDEOS-HERE.txt` and `CONSENT.md` sit in that folder.

## Run it (manual only -- no cron, no watcher)

    cd /volume1/PoeTech/sme-pipeline
    ./choir-keyboardist-to-knowledge.sh ./intake/choir-keyboardist/<video>

Output -> `output/choir-keyboardist/<name>-<timestamp>/`:

| File | What it is |
|---|---|
| `transcript.txt` / `.json` | what Christian said (+ timestamps) |
| `knowledge.md` | human-readable choir knowledge -- **review this first** |
| `knowledge.json` | per-song `{title, key_label, arrangement, note, confidence, source_quote}` + `general_guidance` + `unclear` |
| `source.json` | consent + provenance (SME, scope, faithfulness) |

## How the knowledge flows into the Choir section

The structured `knowledge.json` is shaped to the **Choir Song Workshop** data model
(`choir_song_ideas`, migration `0036`; lane local_93003caa). Each song object maps
field-for-field:

| knowledge.json | choir_song_ideas | Song Workshop UI |
|---|---|---|
| `title` | `title` | match an existing song idea by title |
| `key_label` | `key_label` (<=40) | the song's key on the card |
| `arrangement` | `arrangement` (<=120) | the arrangement line |
| `note` | `note` (<=2000) | keys technique + choir/vocal guidance |
| `source_quote` | (a sourced comment) | "From Christian (keyboardist): ..." |

**The flow (reviewed, not autonomous):**
1. Run the script on a dropped video -> `knowledge.md` + `knowledge.json`.
2. The director (or Darrell) reads `knowledge.md` and confirms it's faithful to what
   Christian taught.
3. Apply into Choir > Song Workshop via the existing app writes
   (`app/src/lib/song-workshop-sync.js` -> `addSongIdea` / `setIdeaStatus` /
   `addSongComment`): set `key_label` / `arrangement` / `note` on the matching song,
   or post Christian's guidance as a sourced comment on the song card.
4. The keyboardist's expertise now rides on each song the choir works on -- the key
   they sing it in, how it's arranged, what to watch for.

A small in-app "import keyboardist knowledge" review surface (owner/choir-gated) is the
natural next build to make step 3 one-tap -- **not built yet** (no real videos exist on
the NAS; we don't build a surface over data that isn't there -- reality-trace). When
Christian's videos land and the first `knowledge.json` is real, that importer is the
follow-up. Until then the existing Song Workshop writes carry it.

## Consent + scope

Christian is the consented SME (see `intake/choir-keyboardist/CONSENT.md`). Output is
owner/choir-scoped (choir RLS), attributed to him, faithful (no invented musical
detail), and sovereign/local. Darrell to confirm exact consent wording.

## CPU now / GPU later

Same as the base pipeline: transcription on this CPU-only NAS runs ~1-3x media length;
batch long videos overnight. A GPU box makes it fast without changing the flow.
