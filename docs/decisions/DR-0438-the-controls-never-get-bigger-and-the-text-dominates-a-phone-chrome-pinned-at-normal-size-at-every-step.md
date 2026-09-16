# DR-0438 — The controls never get bigger, and the text dominates a phone: chrome is pinned at its Normal size at every text step

- **Status:** accepted
- **Tier:** A (a primitive constant, stylesheet rules, class marks on chrome rows, a published CSS variable, and the probe that measures them; no schema, no money)
- **Date:** 2026-09-16
- **Type:** product
- **Scope:** `app/src/lib/text-size.js` (`CHROME_SCALE_FACTOR` 0.25 → 0), `app/src/index.css` (floater offsets above the fixed comfort bar), `app/src/components/TextSizeControl.jsx` (publishes `--ts-hatch-h`; the aA hint hidden on phones), `app/src/poe-financial-mvp-v28.jsx` (the tagline + mobile build-stamp row and the Sample banner marked `.ts-chrome-region`; the header Give steps aside on a phone when the floater is present), `app/src/components/PublicWelcome.jsx` (both visitor strips marked chrome), `app/src/components/ChurchLearn.jsx` (the lesson-space bar and the lessons bar: one row on a phone, short labels), `app/src/components/ChurchGiving.jsx` (`floaterPresent`, `church-give-floater` hook class), `scripts/chrome-layout-probe.mjs` (invariants 10 and 11, selftest-proven), `app/src/__tests__/text-size.test.js`
- **Principles:** COMMUNITY-FIRST (elders and children read on phones), WCAG 1.4.4 (text resizes; the frame does not have to), VERIFICATION-DOCTRINE (DR-0076 — measured before and after in real Chromium), PERPETUAL-IMPROVEMENT (DR-0075 — the Normal-size budget is a ratchet with a dated re-review)
- **Grounds:** DR-0145 / DR-0147 (the 2× and 2.75× steps), DR-0276 (the three layout rules; rule 3 said text-size controls are chrome), DR-0410 (the frame stays a frame at Big Print), DR-0427 (the little ones grow too — its floor excludes chrome regions, which is exactly why an UNMARKED chrome row ballooned)
- **Supersedes, in part:** the 2026-06-17 scope-split choice that chrome may grow "maybe slightly larger, capped" (`CHROME_SCALE_FACTOR = 0.25`, ~1.44× at Big Print). Darrell's word today is stronger and it governs.

## The word, as spoken

Darrell, 2026-09-16, with three phone screenshots of a lesson at A++ and A+++ where the lesson-bar box, a huge `BUILD … · LATEST` line, LOG OUT, the text-size chips, the voice picker, the theme swatches, FEEDBACK, SUBSCRIBE, the back-to-top and the speaker filled the screen:

> "We need the text to dominate the screen when the screen gets smaller... the controls should never get bigger.... fix it..."
>
> "Actually they should get smaller or only have what is necessary when the screen is reduced... Flexibility with rigorous control of the system and processes."

## What was true (measured in real Chromium, the built app, Lesson 1 open in Learn, 844px tall viewport)

The probe already held every lesson-bar button under 64px at Big Print (DR-0410) and still the screen was chrome, because the *sum* of the chrome had never been measured. Union of the chrome bands that cover the first viewport (header, lesson bar, the fixed comfort bar, the floaters):

| 360px wide | Normal | A++ (Larger) | A+++ (Largest) | A44 (Big Print) |
|---|---|---|---|---|
| header height | 395 | 559 | 594 | 844 (capped to the viewport) |
| lesson-space bar | 98 (two rows) | 103 | 164 | 165 |
| comfort bar (fixed at A+++/A44) | — | — | 222 | 253 |
| mobile build-stamp font | 8px | 18px | 24px | **33px** |
| floaters on top of the comfort bar | no | no | **yes** | **yes** |
| **chrome covering the first viewport** | **443px · 52%** | 619 · 73% | **762 · 90%** | 749 · 89% |

Three causes, each found by reading and confirmed by the numbers:

1. **The cap let chrome grow.** `--ts-chrome-scale` netted ~1.25× at A+++ and ~1.44× at A44 on every `.ts-chrome-region`, the reading pill, the Feedback and Give pills. On a 360px phone a 1.44× comfort row wraps to five rows.
2. **Two chrome rows were never marked chrome.** The wordmark's tagline row (which carries the phone build stamp at `text-[0.5rem]`) and the visitor strip sat outside any `.ts-chrome-region`, so DR-0427's floor — correct for content — lifted them to the prose size: 33px capitals reading `BUILD DEV · LATEST`.
3. **The floaters did not know about the comfort bar.** At A+++/A44 the comfort row becomes a fixed bottom bar (DR-0276's escape hatch) and the reading pill, back-to-top, Feedback and Give pills kept their own `bottom` offsets — on top of it.

## The decision

1. **Chrome never grows with the text size.** `CHROME_SCALE_FACTOR = 0`: every chrome region renders at exactly its Normal size at every step. The words grow; the frame does not move. This is the general rule Darrell stated, applied everywhere the primitive already reaches — header rows, both lesson bars, the nav, the reading pill and panel, the Feedback and Give pills, the back-to-top.
2. **Every chrome row is marked.** The tagline + build-stamp row, the Sample banner and both visitor strips carry `.ts-chrome-region`, so DR-0427's floor leaves them alone and the zoom pins them.
3. **The floaters step above the fixed comfort bar.** `TextSizeControl` publishes the bar's real height as `--ts-hatch-h` (0px when the row is in the flow; re-published on each size step and on resize); the floaters' `bottom` adds it (divided by the zoom for the floaters that are themselves chrome regions, since a zoomed element's offsets are zoomed with it).
4. **Smaller, or only what is necessary, on a phone.** Below `sm` (640px): the lesson-space bar and the lessons bar are one row with short words (`← All · 1 / 163 · ← · →`); the aA hint beside the text-size chips is hidden; the header Give steps aside on the Church tab where the Give floater is already on the same screen. Nothing a phone reader needs is removed — Log in / Log out stays where Darrell put it (2026-07-14), the text-size chips stay, the voice and theme stay.

## Proof

Measured after, same instrument, same viewport:

| 360px wide | Normal | A++ | A+++ | A44 |
|---|---|---|---|---|
| header height | 395 | 384 | 231 | 238 |
| lesson-space bar | **50** | 47 | 47 | 47 |
| comfort bar (fixed at A+++/A44) | — | — | 110 | 108 |
| floaters on the comfort bar | no | no | **no** | **no** |
| **chrome covering the first viewport** | 443 · 52% | 440 · 52% | **405 · 48%** | **422 · 50%** |

At 390px: Normal 421 · 50%; A+++ 405 · 48%; A44 422 · 50%. Horizontal overflow: none at any width or step.

- **The gate** (`scripts/chrome-layout-probe.mjs`, lesson pass, rides CI's `--sweep`): at 360px the chrome covering the first viewport is ≤ 460px at Normal (today's 443, a ratchet) and at Big Print is no larger than at Normal (+12px rounding allowance, after waiting for `document.fonts.ready` and a settle — the first CI run on the same commit read 442 vs 456 on one runner and 442 vs 450 on its sibling, a web-font-metrics race, not a control that grew); no floater intersects the fixed comfort bar at Big Print. **Selftest-proven:** `--selftest-break` restores the raw root scale on every chrome region and un-publishes the bar height; both new invariants trip (the selftest now requires seven lesson trips, up from five).
- `text-size.test.js` pins `CHROME_SCALE_FACTOR === 0` and `chromeMultFor(step) === 1` for every step; the old factor fails it.
- The affected suites (text size, escape hatch, header hideaway, the reading panel's chrome cap, lesson space, lesson 127 standard, the little ones grow too, public welcome, church give) pass; lint clean.

## What is NOT changed, and the decision that waits on Darrell

At **Normal** on a 360px phone the header is still 395px — 47% of the first viewport before the lesson even starts. Of that, the comfort row (Give · Log in · Subscribe · Install app · ? · text size · voice · five swatches) is 160px in four rows; the top block is 250px. Nothing here scales with text size, so "the controls never get bigger" holds; but "only what is necessary" on a phone at Normal is a **front-door choice** (RELEASE-TIERS Tier B; it touches the 2026-07-14 rule that the Log in / Log out box is obvious on every app and the revenue door Subscribe):

- **Recommended default:** on a phone the comfort row keeps Log in / Log out, the text-size chips and the voice picker, and folds Subscribe · Install app · ? · theme swatches behind one `More ▾` disclosure, remembered per device. Estimated header at Normal on 360px: ~300px (−95). The existing header hideaway (the chevron) stays as the reader's own "give me the room" control.
- Not chosen silently because it changes what a first-time phone visitor sees at the door; the estimate above is a layout arithmetic, not yet a measurement.

## Re-review

- **re-review: 2026-09-23** — Darrell's word on the phone comfort row (the recommended default above). On his yes it ships the same day with the probe's Normal budget ratcheted down to the measured result; on his no, the reason is recorded here and the 460px budget stands as the ceiling.
- **re-review: 2026-09-29** — walk one lesson at A44 on Darrell's phone with the header expanded and collapsed; confirm the floaters clear the comfort bar on his device's real viewport.
