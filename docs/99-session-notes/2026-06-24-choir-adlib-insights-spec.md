# Choir ad-lib insights — detect · highlight · learn (SPEC, 2026-06-24)

Darrell, 2026-06-24: the choir often **ad-libs** — improvises beyond the written
arrangement (vamps, runs, soloist riffs, call-and-response, Spirit-led
extensions). Can we **notice and highlight** those for **insights**?

This is a **spec**, not a shipped feature. Ad-lib detection is audio-analysis ML —
**imperfect** (assistive insight the choir leader verifies, never gospel) and
**heavy** (GPU-box work, sovereign/local on CUDA; CPU can do a rough pass). It
rides the **audio→notes / transcription pipeline** (lane `local_eceef6e5`) and the
**content-engine extraction** (lane `local_c119ab7a`) — same archive, same engine,
reconcile-don't-fork. The in-app surface is built only once the pipeline produces
real annotations (reality-trace: no surface over absent data).

## Posture (binding framing)

**Edifying insight, not clinical critique.** Christ-centered, encouraging tone:
highlight the **anointed / Spirit-led moments** that lifted the worship, surface
what to **keep / teach / reuse** — not a scorecard of "errors." Ties the
no-condemnation guardrail and the worship self-critique wellbeing guardrails: the
choir should leave the insight built up, not judged. **Owner/choir-scoped** (RLS),
never public, never used to rank or shame a singer. The leader is the final
arbiter of every label.

## 1. DETECT — find the improvised sections

Two complementary methods; run both and merge, because each catches what the
other misses.

### A. Reference-based (deviation from the arrangement)
When a base reference exists — the lead sheet / chart, a MIDI/arrangement, the
keyboardist's stated arrangement (the SME `choir_sme_notes`, 0042), or a prior
"clean" performance — align the performance to it and flag where they diverge:
- **Structural extras** — sections in the performance not in the reference
  (an added vamp, an extended bridge, a reprise).
- **Melodic departure** — the sung/played line leaves the written melody (runs,
  riffs, ornamentation) — from monophonic melody extraction (e.g. CREPE/pYIN) vs
  the reference contour.
- **Harmonic departure** — chords beyond the chart (a modulation, a passing
  reharm) — from chroma/chord estimation.

### B. Reference-free (structural novelty, when there's no chart)
Most archive performances have no machine reference, so detect improvisation from
the audio's own structure:
- **Self-similarity matrix + novelty curve** (à la Foote) over chroma/MFCC →
  segment boundaries, and **repeated blocks** = vamps / repeated tags.
- **Repetition beyond the form** — a section repeated more than the song's nominal
  structure → a vamp / "run it again."
- **Tempo & meter tracking** (beat tracker) → ritardando / double-time / breakdown
  shifts that mark a Spirit-led extension.
- **Dynamic/energy curve** (RMS / loudness) → swells and drops (a build into a
  shout, a hush before a soloist).
- **Source separation + diarization** (e.g. Demucs to isolate vocals; speaker/lead
  diarization) → **soloist breakouts** (one voice over the choir) and
  **call-and-response** (alternating leader↔choir turns).
- **Melodic density / pitch activity** on the separated lead → **runs/riffs**
  (rapid melismatic motion above the choir bed).

### Characterize each detected moment
Map the signals to a human label:
`vamp` · `run/riff` · `soloist moment` · `extended bridge` · `call-and-response`
· `modulation` · `spirit-led extension` (the catch-all for a sustained,
energy-rising, structurally-novel passage). Carry a **confidence** and the
**evidence** (which signals fired) so the leader can judge.

## 2. HIGHLIGHT — mark them on the song's timeline

Each detected moment is a marker on the performance video/audio timeline:
- `start_seconds` / `end_seconds` (deep-link the YouTube watch URL to the moment),
- `kind` (the characterization above), `confidence`, a short `description`,
- `status`: `detected` (from the pipeline, unverified) → `confirmed` /
  `dismissed` (the leader's call). Only confirmed moments are "taught."

Surfaced on the song's Songbook card and on a per-performance timeline strip:
"🔥 3 anointed moments — 1:12 vamp · 4:30 soloist run · 6:05 extended bridge,"
each a tap-to-watch deep link.

## 3. INSIGHTS — surface for the choir + leaders

- **Which ad-libs landed** — join confirmed moments to the engagement signal:
  the **most-loved hearts** (0041) and the worship self-critique. A moment on a
  most-loved performance, or one the team reacted to, is flagged "this one moved
  people."
- **Recurring patterns** — across the archive, which improvisations recur (a
  signature vamp on a given song, a soloist's habitual run) → the choir's
  "vocabulary."
- **Keep / teach / reuse** — a confirmed ad-lib that worked becomes teachable: it
  can seed a **keyboardist SME note** (`choir_sme_notes`: "the bridge vamp we do
  on Total Praise") and feed the **music-creation process** — an ad-lib that
  landed can be written into the arrangement (the Songbook's `arrangement` /
  `how_to_play`). The improvisation graduates into the canon.

## 4. TECH — honest about the cost + accuracy

- **Pipeline:** extends the sovereign local audio pipeline (faster-whisper for
  transcription is already there; add source separation + MIR analysis). Emits an
  **`adlib.json`** per performance (contract below) the app imports — same
  reviewed-handoff pattern as `repertoire.json` / `knowledge.json`.
- **GPU-gated:** source separation (Demucs) and dense pitch/melody extraction are
  **heavy** — real-time-plus on CPU, fast on the **CUDA box** when it lands. CPU
  now does a **rough pass** (novelty + energy + tempo, no separation); the full
  pass (soloist isolation, runs) waits for GPU. Phase it: ship the cheap
  structural pass first, deepen on GPU.
- **Imperfect → assistive:** every moment is a **suggestion the leader verifies**.
  Confidence is shown; nothing auto-publishes; a detected moment is never asserted
  as fact. False positives cost a dismiss, not a wrong teaching.
- **Three brakes** (per the autonomous-automation rule) on any batch processing:
  a per-run budget, a single-instance lock, a kill-switch. Manual-run, no cron.

## 5. Data contract (for when it's built — no migration yet)

`adlib.json` (pipeline → app), and the table it lands in:

```json
{
  "performance": { "video_id": "abc123", "title_key": "total praise", "service_date": "2026-05-10" },
  "moments": [
    { "start_seconds": 72, "end_seconds": 96, "kind": "vamp",
      "confidence": "med", "description": "Repeated tag, energy rising",
      "evidence": ["repetition", "energy+"] },
    { "start_seconds": 270, "end_seconds": 310, "kind": "soloist moment",
      "confidence": "low", "description": "Lead breaks out over the choir",
      "evidence": ["diarization", "melodic-density"] }
  ]
}
```

```
choir_adlib_moments (proposed; choir-scoped RLS, owner/admin write, choir read)
  id, instance_id, title_key, video_id, start_seconds, end_seconds,
  kind, confidence ('high'|'med'|'low'), description, evidence text[],
  status ('detected'|'confirmed'|'dismissed'), reviewed_by, reviewed_at,
  source_run, created_by, created_at, updated_at
```

Keyed by `title_key` (like loves + SME notes) so insights aggregate per song
across performances. A confirmed moment can be promoted into a `choir_sme_notes`
arrangement note (the "keep/teach/reuse" loop).

## 6. Phasing / gating

1. **Now (CPU rough pass):** novelty + repetition + tempo + energy → `vamp` /
   `extended bridge` / `spirit-led extension` candidates. Low recall on
   soloist/runs; honest about it.
2. **GPU box:** add Demucs separation + diarization + dense melody → `soloist
   moment` / `run-riff` / `call-and-response`.
3. **In-app surface** (`choir_adlib_moments` + a "Worship Moments" view on the
   Songbook): built when the first real `adlib.json` exists. Leader verifies;
   confirmed moments tie to most-loved and can graduate into the arrangement.

## Coordination

- Lane `local_eceef6e5` (audio→notes / transcription): add the MIR analysis stage
  + `adlib.json` emitter.
- Lane `local_c119ab7a` (content engine): same archive + extraction; the ad-lib
  pass is one more extractor over the service audio.
- Ties: `choir_sme_notes` (0042, keyboardist), most-loved (0041), the worship
  self-critique + no-condemnation guardrails.
