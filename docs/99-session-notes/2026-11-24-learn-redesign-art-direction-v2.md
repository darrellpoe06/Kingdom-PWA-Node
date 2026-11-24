# Learn redesign — art direction v2, the grade pass, and the prototype in the repo (2026-11-24)

Continues `2026-11-23-learn-presentation-redesign-phase-1-2.md` (the Claude Chat session "11.23.26 Redesign of the word") after PRs #2845 and #2847. Branch `ccr-525f5dae-o8wiwz`, PR #2852 (labeled `hold`: nothing merges or publishes before the owner approves the visual direction).

## 1. What was recovered (nothing regenerated that was finished)

| Item | Where it was | Recovered as |
|---|---|---|
| Pilot ledger (40 jobs: 20 titles + 20 pictures, 168¢) | Actions artifact of run 45419907117 (digest `4da21051…`) | Downloaded; every job `succeeded`; spend recomputed from `jobs.jsonl` = 168¢ |
| 20 provider pictures + composed thumbnails | same artifact | Kept; 10 of them later superseded (v1 kept on each record as `imageV1`) |
| Pipeline, compositor, integrity baseline | `main` (PRs #2845, #2847) | Unchanged in behavior except as listed below |
| LearnStudio UI component | **Never committed** (lived only in the Chat session) | Rebuilt in the repo from the approved screenshots on the committed presentation model |

## 2. Root cause of the dark thumbnails (measured, not assumed)

- `master.jpg` is the provider's bytes, untouched; mean luma raw = composed = **37.6/255** across the 20. 11 of 20 had >65% of pixels near black; 9 had letterbox bars baked in (22–240 px); LIL2 carried a baked "© LOVE CORNER" mark.
- Cause: `lib/prompts.mjs` `BRAND_LOOK` = "deep blacks, warm gold light and restrained red accents", plus "left third … dark negative space", appended to **every** picture prompt; FLUX raw mode (`LEARN_BFL_RAW=1`) added a muted, candid render.
- The compositor darkened only the share image (`og.jpg`: 78% side gradient + 55% foot gradient).

## 3. What changed and why

| File | Change | Why |
|---|---|---|
| `app/scripts/learn-thumbs/grade.mjs` (new) | Free correction pass: letterbox crop, histogram exposure, partial white balance (fades out on bright pictures), vibrance, a look per department. `GRADE_VERSION` re-grades composed pictures when the grade changes. | Fix what composition can fix before spending. Rescued 10 of 20 v1 pictures by its own measure; the owner still judged them too dark, so all 20 were re-directed. |
| `app/scripts/learn-thumbs/compose.mjs` | Derivatives come from the graded picture; share-image scrim lightened to a text-side 42% / foot 35%. | No full-frame darkening. |
| `app/scripts/learn-presentation/lib/prompts.mjs` | `BRAND_LOOK` is now premium daylight photography (natural skin tones, vivid natural color, reference composition from the owner's "Plan Your Next Season" example). `BANNED_ART_TERMS` + `bannedArtTerms()`. Department visuals rewritten. | The photograph keeps its own natural palette; red/black/white/gold stay in the interface and type. The ban list refuses the dark look before any spend: **20 of 20 pilot-1 prompts caught**. |
| `app/scripts/learn-presentation/lib/art-v2.mjs` + `art-direction-v2.json` (new) | Regenerates only what the file names (20 lessons + 6 Explore by Topic covers), samples first, charged to the shared ledger under the $5 combined cap; raw mode off; v1 kept. | Owner: change the art direction, three samples first, stay within $5. |
| `.github/workflows/learn-presentation-prepare.yml` | `only=art:samples` / `art:rest` / ids route to art-v2. Same line count (YAML ceiling is down-only). | Generation runs where the key lives (the runner); this session never holds the BFL key. |
| `app/src/components/learn-studio/*` (new) | LearnStudio home + lesson cover; Montserrat 800/900 vendored (SIL OFL). | The redesigned layout, with the author's complete original title directly under the new title. |
| `app/src/lib/learn-presentation/presentation.js` | `lite` presentation for lessons only counted or filtered. | Measured on 994 lessons: home **753 ms → 3–5 ms**, search **599 ms → 10 ms** per keystroke. |
| `app/learn-studio-preview.html`, `app/learn-studio-preview/main.jsx` (new) | Dev-only approval harness over the real catalog. Not a vite build input; assets gitignored. | A prototype the owner can judge without publishing anything. |

Bugs found and fixed on the way: an infinite render loop in LearnStudio (fresh default `[]`/`{}` props busting the memo with the `initialLesson` effect; caught by the new test hanging); pink clouds on a blue-sky picture (gray-world white balance on an already-neutral frame; now fades out by mean luma).

## 4. Spend ledger (never reset)

| Run | What | This run | Cumulative |
|---|---|---:|---:|
| 1–2 (Chat session) | 20 titles (48¢) + 20 v1 pictures ($1.20) | $1.68 | $1.68 |
| 3 | 3 samples (LIL2, BUY2, EA) | $0.18 | $1.86 |
| 4 | 7 lessons + 6 topic covers | $0.78 | $2.64 |
| 5 | re-package only (cap 0¢; cancelled once the download host was allowed) | $0.00 | $2.64 |
| 6 | the 10 lessons that kept graded v1 pictures (owner: "still too dark"; "use the paid way") | $0.60 | $3.24 |
| 7 | HIST2 + PM2 re-made under DR-1640 (cap 15¢) | dispatched | — |

Sample brightness, measured on the real files: mean luma **122 / 152 / 173** (v1 pilot average 37.6); near-black pixels 0–16% (v1 ≈ 60%).

## 5. Integrity (every run)

The integrity baseline (994 lessons, 994 original titles, 4,258 age readings) passed before and after runs 3 and 4 on the runner, and locally after every change. No lesson file is touched by any change on this branch.

## 6. Tests

`learn-art-v2.test.js` (6), `learn-studio.test.jsx` (4), `learn-presentation-pipeline.test.js` (37), `learn-integrity-baseline.test.js` (8), compositor `npm test` (8).

## 7. Not done, by decision

- **Remaining 974 lessons:** not generated. `FULL_LIBRARY_ENABLED = false` and `TOTAL_CAP_CENTS = 500` stay until the owner approves the visual direction. At 6¢: about $58.44 (owner reports ~$70 of BFL credits; not verified from here).
- **Publishing:** LearnStudio is not mounted in ChurchLearn; PR #2852 is on `hold`.
- **Free perpetual road:** the church GPU node (2× RTX 4070, `infra/gpu-scheduler`, inert) with an open-weight model through the existing `local` ComfyUI provider. Research note: `2026-11-24-free-sovereign-image-generation-research.md`. Running it on a schedule is Tier C (budget, lock, auto-pause). re-review: 2026-12-08.
