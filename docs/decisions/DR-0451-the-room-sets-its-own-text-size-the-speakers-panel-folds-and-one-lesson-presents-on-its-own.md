# DR-0451 — The room sets its own text size, the speaker's panel folds, and one lesson presents on its own

- **Status:** accepted
- **Tier:** A (three reported defects on the presenting surface; no schema, no money, no identity change)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/lib/slide-size.js` (new — the room's own size primitive), `app/src/components/AudienceSlide.jsx` (every font size rides `--slide-scale`), `app/src/components/Presenter.jsx` (the room-size control, the one-tap jump, `goTo`, both bars capped and folding, `.ts-safe-sticky`), `app/src/components/ChurchLearn.jsx` (the ⛶ Present door that makes the single-lesson deck reachable), `scripts/chrome-layout-probe.mjs` (the presenter is measured for the first time — 2 cases, a 160px bar budget), `app/src/__tests__/the-room-sets-its-own-size.test.jsx` (new gate, 20 tests), `app/src/__tests__/slide-is-not-a-bibliography.test.js` (the Play ban narrowed from the whole file to the two Play handlers), `app/src/lib/legibility-health.json` (regenerated; no added debt)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), PERPETUAL-IMPROVEMENT (DR-0075), SPEC-CONFORMANCE (DR-0219), DECISION-RECORDS (DR-0011)
- **Grounds:** DR-0438 (chrome never grows with the text; every chrome row is marked; on a phone, only what is necessary), DR-0410 (the frame stays a frame at Big Print), DR-0276 §2-3 (a sticky header may never exceed the viewport; big text is always reversible), DR-0427 (the small-content floor, which inline styles never received), DR-0392 §3 (`startOnScreen` — Play arrives already presenting), the 2026-09-14 law-tier correction that **Play reads the lesson and does not open the deck**, and `presentable.js:1217` (a collection is a LIBRARY: the leader picks one and presents THAT one)

## The three reports, in his words

Darrell, 2026-09-17, from the presenting view on his phone, with screenshots of the bar wrapping across the screen:

> "Need to be able to work the text sizes on the PowerPoint and the controls are taking over the screen real-estate... also... each Lesson should be able to present just the one that we want without having to scroll through the whole list to get to the one lesson that we want to understand... make sense..."

Three reports, three real mechanisms. None was a misreading of the screen.

## SHOULD → ARE → GAPS → CLOSE (DR-0219)

**SHOULD.** DR-0438 §1-2 says chrome never grows with the text and **every chrome row is marked**, and its own words are "applied everywhere the primitive already reaches." DR-0276 §2 says a sticky header may never exceed the viewport. DR-0410 says the words grow and the frame stays a frame. `presentable.js` already holds the doctrine for the third ask: *"A collection is NOT one presentation containing every message — you do not preach all 163 at once. It is a LIBRARY: the leader PICKS one message and presents THAT one."*

**ARE (traced end to end before any edit).**

1. Every size on the projected slide was `clamp(px, vw, px)` — 18 font sizes of pure viewport math in `AudienceSlide.jsx`. The reader's own control (A / A+ / A++ / A+++ / A44) could not touch one of them. And the presenting view is a fixed overlay at `zIndex: 70`, above the escape hatch at 60, so that control was not even on screen to try.
2. Both presenting bars were inline-styled `flexWrap: 'wrap'` rows of nine and ten always-present controls, every label `rem`-sized and therefore riding the raw root scale. Neither carried `.ts-chrome-region`, `.ts-safe-sticky`, or any of DR-0427's floor classes — inline styles receive none of them. The presenter was the largest chrome surface in the app that DR-0438 §2 had never reached.
3. The layout probe had never visited the presenter. No view, no selector, no budget, and `Presenter.jsx` exposed no testid for a probe to find. The one instrument that would have caught this had nothing to measure.
4. `lessonPresentable` — the single-lesson deck, timed to the lesson itself — was **unreachable dead code**. Nothing in the app ever called `setPresentLesson`; `presentLesson` was permanently null. The only door into a deck was *Play the overview*, which opens all 163 scenes at week one, where `indexLabel` reads "Week 1 of 163". The presenter's entire navigation is `←` and `→` plus tap-to-advance, with no picker, no jump, and no clickable scene list. **Reaching week 45 in front of a room meant forty-four taps of the arrow.**
5. The comment on the Play button asserted "The DECK still has its own control (Present), so nothing is lost." That was not true of the tree. The per-lesson door had been removed and never replaced.

**GAPS, named plainly.** The room's words could not be resized at all; the speaker's panel grew with the reader's text setting instead of being pinned; the sticky bar could exceed the viewport with no internal scroll; nothing measured any of it; and the deck for one lesson existed but had no door.

**CLOSE.**

- **The room's size is its own dial** (`lib/slide-size.js`): five steps from Snug to Biggest, persisted per device, published as `--slide-scale` on the presenting container only. Every font size on the slide became `calc(clamp(...) * var(--slide-scale, 1))`, which keeps the responsive floor and ceiling intact — the slide still answers the screen, then answers the room. **Deliberately not `lib/text-size.js`:** raising the reader's own size to make the room's words bigger would inflate the speaker's control panel by the same factor, which is the other half of what he reported. The two must move independently or fixing one breaks the other. Default 1, so any surface that never sets it renders byte-identically to before.
- **The control is on the presenting screen**, two taps from every step, with the current step named so a speaker never guesses.
- **Both bars are chrome now:** `.ts-chrome-region` on each, `.ts-safe-sticky` on the sticky one, and the essentials hold the first row while everything else waits behind **More**. What never folds: move, position, time, the room's size, the jump, and the way out.
- **One part is one tap away:** a `<select>` naming every scene by position and title, and a new `goTo` that lands on a scene **whole** (every point revealed, as if you had walked in), clamped and NaN-safe, with the broadcast following through the same reveal-aware path as a step. A plain select on purpose — it is the one control a phone renders as a full-height native picker with its own scrolling and type-ahead. Decks of two or fewer scenes are left alone, where the arrows suffice.
- **The single-lesson deck has its door back:** **⛶ Present** on each lesson card calls `setPresentLesson` with `startOnScreen`, which finally makes DR-0392 §3's branch live. **It is not Play and never will be** — Play reads the lesson aloud, in capitals, for the third time (2026-09-14). Two controls, two words, two jobs.
- **The presenter is measured**, for the first time: two cases at 360px (Normal and Big Print) asserting the bar is capped, safe-sticky, foldable, carries the jump, and stays under a 160px budget of the viewport.

## Verification

- **New gate `the-room-sets-its-own-size.test.jsx` — 20 tests**, covering the size primitive's steps, fallbacks, hostile storage, end-clamping and round-trip; that **every** font size on the slide rides the multiplier and none is left as raw viewport math; that the multiplier lands on the slide's container and **not** on the bar; that the panel folds while the way out never does; that the jump names every part and lands on it directly; and that Present is reachable, distinct from Play, and arrives presenting.
- **Proven to catch, each break run against the gate:**

| Break | Failures |
|---|---|
| Slide fonts back to raw viewport math (unscalable) | 2 |
| Bars leave the chrome cap | 1 |
| No jump — arrows only, as before | 3 |
| No room-size control on the presenting screen | 2 |
| The panel never folds (every control always on) | 1 |
| The Present door removed again (deck back to dead code) | 2 |

- **Measured in real Chromium at 360px**, which is the width he was holding:

| | Bar height | Viewport |
|---|---|---|
| Normal | 112px | 900px |
| Big Print | 64px | 900px |

  Big Print is *smaller* because the chrome cap pins it while the slide's words grow — DR-0438 §1 working as written.
- **The probe's own selftest proves the budget catches his report**: with the cap removed, the bar measures **224px at Normal and 900px of 900px at Big Print** — the entire viewport, the slide gone. Selftest-break now trips 16 ways.
- Full sweep green: 33/33 chrome cases, 4/4 lesson cases, 16 text-scale cases, 2/2 presenter cases.
- **Full suite: 1039 files, 15,526 passed, 1 skipped.** Lint clean.
- **Three existing gates pushed back and were right to.** The consistency guard rejected a device-font glyph on the new button (now `<UiIcon name="monitor"/>`). The legibility guard caught two inline dark-text literals I had written into the fold buttons; both now use the file's shared style helpers, and a fresh scan confirms the presenter's tracked debt is **50, exactly what it was before this change** — no contrast debt added. The `slide-is-not-a-bibliography` gate banned `setPresentAutoStart(true)` anywhere in the file; that ban was narrowed to the two **Play** handlers, which is what it was always about, and the guarantee is now asserted more precisely than before (neither Play handler presents, and the separate Present door exists).

## Limits, stated

- **Only font sizes scale, not the slide's spacing.** Padding, gaps and the QR corner keep their own clamps, so at the largest step a very long lead paragraph will fill more of the slide rather than reflowing around bigger gutters. That is the right first cut for "work the text sizes", and it keeps the layout stable; if a long lead turns out to crowd at Biggest, scaling the spacing with it is the follow-up. `re-review: 2026-10-17`.
- **The 160px bar budget is a judgement, measured once.** It sits comfortably above the 112px the bar actually takes at Normal and well under the 224px the broken form takes. If a future control earns a place on the first row, the budget is the thing to argue with. `re-review: 2026-10-17`.
- **The audience window (`?audience=1`) does not yet carry the room's size** — it renders the same `AudienceSlide`, so it is *ready* to, but nothing sets `--slide-scale` there and a second display keeps the default. A projector is exactly where a large step matters most. `re-review: 2026-10-01`.
- **`Presenter.jsx` is still all inline styles**, so DR-0427's small-content floor and DR-0438's class-keyed rules reach it only where I marked it. The rest of the presenter's own cards and notes are untouched by this record. `re-review: 2026-11-17`.
- **Measured in the browser, not yet on his own phone.** The live pass is the DR-0104 step after this deploys.
