# Sound-engineer SME source -- live sound for the house of God

**SME:** the Church of the Living God (COLG) sound engineer.

**What this is:** the church sound engineer records videos explaining and teaching how
to run the live mixing board for worship -- the signal chain, gain staging, EQ and the
frequency ranges, taming feedback, monitors vs the house mix, mixing the worship team
and the choir, and their before/during/after service routine. These are an authorized
**knowledge source** for the COLG sound team. The local pipeline on this NAS transcribes
them and extracts (a) human-readable sound-team knowledge and (b) Learn-module-shaped
lessons that ENRICH the "Running the Board: Live Sound for the House of God" training
track in the app (`app/src/lib/sound-board-class.js`).

**This is the SECOND audio-domain SME lane**, the sibling of the choir-keyboardist lane
(`choir-keyboardist-to-knowledge.sh`). Same isolated whisper container, same local
Ollama; a sound-engineer prompt + a lessons-JSON pass instead of the choir prompts.

## Run it (when a video lands)

```
cd /volume1/PoeTech/sme-pipeline
./sound-engineer-to-lessons.sh ./intake/sound-engineer/gain-staging.mp4
# optional friendly output-folder name:
./sound-engineer-to-lessons.sh ./intake/sound-engineer/gain-staging.mp4 gain-staging
```

Output -> `output/sound-engineer/<name>-<stamp>/`:
- `transcript.txt` / `transcript.json` -- the transcript
- `knowledge.md` -- human-readable sound-team knowledge (review FIRST)
- `lessons.json` -- Learn-module-shaped lessons for the "Running the Board" track
- `source.json` -- consent + provenance (incl. the assistive-only safety note)

## Binding scope

- **Owner/sound-team only.** Extracted knowledge surfaces in the sound-team training
  track. Never public.
- **Faithful extraction only** -- the engineer's stated settings (gain, frequencies,
  channels, technique) are captured as-is; the pipeline does NOT invent values they did
  not say. Their expertise is the asset.
- **Attributed** to "the COLG sound engineer" when it surfaces, honoring the work.
- **Sovereign + local:** videos and transcripts stay on the NAS. Nothing is uploaded to
  an external cloud or used to train any third-party model (DATA-AS-EMPOWERMENT).
- **Assistive-only A.I. (binding):** this lane produces TRAINING CONTENT. The separate
  live-AI EQ/mix assistant (GPU-gated; spec at
  `docs/99-session-notes/2026-06-24-live-sound-eq-mix-ai-assist-spec.md`) only ever
  SUGGESTS -- a human operator decides and acts. Nothing auto-changes a live service mix.

## Behind the brakes

Manual-run only. **No cron, no watcher, no autonomous trigger.** A human runs it on
demand and reviews `knowledge.md` before anything touches the app. (Three-brakes rule.)
