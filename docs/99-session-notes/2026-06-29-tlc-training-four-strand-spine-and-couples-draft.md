# TLC therapist training — four-strand spine, Couples draft, multi-track hours (2026-06-29)

Layer 4 working note. Extends the TLC clinician training course library (PR #429) with
the binding additions Darrell declared 2026-06-29. Same lane / branch
`feat/tlc-therapist-training-library`; no new lane.

## What landed

1. **Four-strand course design spine (binding, every course)** — `lib/tlc-course-strands.js`.
   Each course braids FOUR strands with **Yahweh's perspective & Will at the CENTRE**:
   (1) Yahweh's perspective + Will (Scripture-grounded, the anchor), (2) clinical skill,
   (3) neuroplasticity + scientific rigor (real cited science), (4) societal & understanding
   (even-handed, dignity). The clinical/scientific/societal strands show how His design is
   **lived out** — they do not replace it. Authored strands for all 23 existing courses
   (the new Couples course carries strands inline). Yahweh strand cites Scripture **by
   reference only** (no fabricated translation wording) + carries `smeDoctrine` (Darrell /
   Christina / Bishop, non-denominational, Word-first). A gate test fails if any course
   lacks four strands.

2. **Couples & Family draft from the first source video** — Rivah TV's engagement of the
   Devale & Khadeen Ellis public marriage conversation (`youtu.be/UNTcnf7cRNY`). Built from
   the **substance Darrell supplied** (captions not fetched in-env; the ingest path remains
   for future videos). Taught **even-handedly**: the video's gendered generalization
   ("women push monogamy but treat intimacy as a chore") is named and **rejected**; the
   lesson is the documented clinical reality — **desire discrepancy** (common, multi-causal,
   not gender-blame), with the science (Basson's responsive desire, the dual-control model,
   attachment/EFT, neuroplasticity) and Yahweh's covenant design (Gen 2:24; Eph 5; 1 Cor 13;
   1 Cor 7:3-5; John 13:34-35) at the centre. Attributed, transform-not-reproduce, ≤ one
   short quote. validated:false; Christina approves clinical + faith framing.

3. **Sourcing theology** — `attributionLine` now credits the human teacher AND names Yahweh
   as the Source the teacher conduits ("sources Him well"), never elevated above the Word;
   the teaching is tested against Scripture. `SOURCE_THEOLOGY_NOTE`. High-profile sources:
   reach captured as an **asset** (`sourceReach`) — qualitative when no exact count is
   verified, never fabricated.

4. **Multi-track grounded hours over 24 months** — `lib/tlc-training-tracks.js`. ONE backbone,
   four audiences/tracks: MSW-field (CSWE 900h), post-MSW LCSW supervised (IL 3000h / 24-mo
   min), licensed CE (IL 30h/cycle), 1099 contractor (onboarding + training). Figures cited
   (CSWE EPAS; 225 ILCS 20 / IDFPR) and **`confirmed:false` / SME-confirm flagged** — Christina
   ratifies; exact face-to-face supervision hours flagged open. Honest curriculum role:
   *supplies* CE/onboarding hours, *complements* (didactic) the client-facing clinical hours
   the ledger logs.

5. **UIUC pipeline** (business positioning) — Champaign-Urbana / UIUC School of Social Work
   as the recruiting stream; Christiana Poe (BSW→MSW accelerated, fall 2026) as both an
   embedded connection and a future hours-track student. Captured in `UIUC_PIPELINE`.

6. **Surface** — `PracticeLearn.jsx`: the four-strand spine note + per-course **braid** block
   (Yahweh centre), source reach line, and a **Tracks & hours** panel with grounded
   requirements + SME-confirm honesty + the UIUC/Christiana positioning.

## Verification
Lint clean, `npm run build` green, full vitest green (new: strands gate, tracks grounded +
SME-flag + 24-mo, Couples even-handedness/attribution, ingest theology + reach, render).

## SME-pending (flagged, not fabricated)
- Christina (LCSW): exact IL LCSW hour count + face-to-face supervision minimum; CSWE
  program-specific field hours; the faith framing per course.
- Bishop / Christina / Darrell: doctrine on every Yahweh strand.
- Scripture wording set from the chosen translation on review (refs only in code).
