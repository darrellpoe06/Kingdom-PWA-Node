# DR-0424 — The reading highlight is themed: the sentence wash was a smudge on Midnight

- **Status:** accepted
- **Tier:** A (a paint rule and its probe; no schema, no money, no identity)
- **Date:** 2026-09-15
- **Type:** product
- **Scope:** `app/src/index.css` (Midnight rules for `::highlight(poe-read-seg)` and `::highlight(poe-read-word)`), `scripts/read-highlight-probe.mjs` (themed rules bundled; a Midnight magnitude check, proven-to-catch against the previous CSS)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: measure, don't claim; proven-to-catch), SURFACE-SAYS-TRUTH, COLOR-THEOLOGY (DR-0099: never true red), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0264 (highlight-as-it-reads), DR-0265, the 2026-08-06 probe (the paint itself is the assertion)

## The report

Darrell, 2026-09-15, from his phone on the Midnight (OLED black) theme, mid-lesson: *"The reader does not have the highlighter of the sentence anymore... fix it..."* Three screenshots: two on Midnight, one on the light theme, all with the reader running ("Reading… · keeps going") and no sentence visibly lit.

## What was actually true (measured, not guessed)

- The highlight **was** painting. An end-to-end run of the built app in real Chromium (a fake speech engine, L152 opened from the resume banner, the reader started from its own control) registered `poe-read-seg` and `poe-read-word` ranges on the right sentences and words. The follow map, the alignment, and the paint calls were all sound.
- The one wash was designed on cream. `rgba(184,88,56,0.22)` on `#000` blends to about `rgb(61,38,29)` behind `#E5E5E5` text. Measured by mean absolute pixel change over the paragraph in real Chromium: **3.95 on Midnight against 6.05 on the light page** — and the light figure is a plainly visible wash. On an OLED phone that is a smudge no eye reads as a highlight.
- The word (karaoke) wash was strong enough at 85%, but most phone engines never fire word boundaries, so on his phone the sentence wash **is** the highlight. Hence "the highlighter of the sentence."

## The decision

1. **The highlight is themed.** Midnight paints the sentence in the theme's own rust (`#FB923C`, the mapping the theme already uses for the house rust) at 42%, white text; the word in solid `#FB923C` with near-black text. Measured after: **13.26 on Midnight** (3.4× before), word 5.21. Never true red (DR-0099).
2. **The probe holds the dark theme to no fainter than the light one.** `read-highlight-probe.mjs` now bundles the themed rules (its regex previously kept only the bare `::highlight` rules, so a themed defect was invisible to it), renders the same paragraph on a Midnight page, and requires the Midnight mean pixel change to be ≥ 0.9 × the light page's. **Proven-to-catch:** against the previous CSS the check fails (3.95 < 5.45); under `--selftest-break` it fails with the rest of the paint checks. Runs in CI before and after every merge, as before.

## Boundaries

- The other four light themes (white, slate, sapphire, rose) keep the cream wash; their backgrounds are light and the measured change on the light page stands for them. A theme added later with a dark background needs its own rule, and the probe will not know unless it is given that theme's page — carried below.
- Nothing changed in the follow map, the alignment, or the engine; the third screenshot (light theme) showed no lit sentence in the visible region, which the e2e run could not reproduce — the light path paints — so it is read as the current sentence being off-screen at the moment of capture. If Darrell sees it again on a light theme, that is a separate report.

## Re-review

- **re-review: 2026-09-29** — ask Darrell whether the sentence is visible on his phone on Midnight; and extend the probe to iterate every `[data-theme]` the app ships rather than the one dark theme named here.
