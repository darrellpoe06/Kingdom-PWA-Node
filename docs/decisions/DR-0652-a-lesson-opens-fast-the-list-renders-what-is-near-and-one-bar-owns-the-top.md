# DR-0652 — A lesson opens fast: the list renders what is near the reader, the print copy exists only while printing, and one bar owns the top of an open lesson

- **Status:** accepted
- **Tier:** A (rendering and layout; no schema, no money, no identity change)
- **Type:** performance / defect
- **Date:** 2026-09-24
- **Scope:** `app/src/components/ChurchLearn.jsx` (light cards in the lesson list; the print copy behind `usePrinting`; `data-lesson-space`; Learn answers `learn-open` requests), `app/src/lib/use-printing.js` (new), `app/src/lib/learn-open.js` (new), `app/src/index.css` (the header flows with the page while a lesson is open), tests below
- **Principles:** HOLD-THE-HAND-OF-THE-PROCESS (DR-0621), VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0631 (continuing a lesson; it carried both findings forward with a re-review date), DR-0262 / DR-0264 (a lesson opens in its own space, the whole screen for the one lesson), DR-0438 and DR-0410 (the lesson bar's size), DR-0439 (the escape hatch at Big Print)

## Context — the concern

DR-0631 recorded two findings while making Continue land on the reader's sentence, and dated them rather than dropping them:

1. **Opening a lesson was heavy.** Under the machine's load in that session, a Continue tap took 13–20 s.
2. **The app's tab strip sat over the lesson** on a phone with the header collapsed.

The orchestrator directed both be worked until they work (DR-0621), measured first, with a before and after in Chromium on the same 390×844 phone screen.

## What was measured — before

Real Chromium, 390×844, production build of the branch #1793 carried, signed out. Probes: `lesson-perf/perf-probe.mjs` (element counts, Chrome's own script and layout time, wall time from tap to the landing), `lesson-perf/overlap-probe.mjs` (every pinned element over a lesson scrolled into its reading), `lesson-perf/card-heights.mjs`.

**Where the elements were** (Learn top, 34,022 elements):

| part | elements |
|---|---|
| every lesson's full card in the course list (191 cards) | 19,023 |
| a hidden print-only copy of the whole curriculum (`hidden print:block`) | 9,919 |
| the browse-all panel | 3,021 |
| the lesson-by-title list | 1,541 |

With a lesson open the page held 10,405 elements, and **9,919 of them were the hidden print copy**; the lesson itself was under 500. The "67,500" first reported was Chrome's raw node count, which also counts text nodes; the element counts above are the honest measure of what was built.

A full card at 390 px measured a median 2,876 px tall (min 1,419, max 20,830), so the list alone was about 550,000 px of page nobody had scrolled to.

**The tap** (median of interleaved runs at load average 5–14): Continue 1.6–2.0 s, of which 1.4–1.75 s was script, mostly tearing the 19,000-element list down.

**The top of an open lesson, scrolled into the reading:**

| case | pinned at the top | first readable line | screen left for reading |
|---|---|---|---|
| 390, header collapsed | lesson bar 0–89 **and** app header 0–219 | 219 px | 74% |
| 360, header collapsed | the same | 219 px | 74% |
| 390, header open | lesson bar 0–89 and app header 0–343 | 343 px | 59% |
| 390, Big Print, collapsed | lesson bar 0–190 and header 0–146 | 190 px | 77% |

Both were `sticky` at the top. The lesson bar painted over the header's upper rows and the header's lower rows (the Love Corner band and the Church tab row, "Learn" at y = 184) showed beneath it over the lesson (`before-overlap-390-collapsed-normal.png`).

## Impact

Unresolved: every Continue, reload and lesson switch paid for 191 full cards and a print copy nobody could see, and a phone reader lost a quarter to two fifths of the screen to two stacked bars. Resolved: a lesson opens in about a third of a second, and one bar holds the top.

## Decision

1. **The lesson list renders what is near the reader.** The first 6 cards render in full; the rest render as a light card: the same `id="learn-lesson-…"`, the same title row, and 180rem reserved (the measured median, so the page does not jump). A card fills in when an IntersectionObserver sees it within 1,600 px of view, and stays filled. The card the reader just left is filled before the list scrolls back to it. **Where IntersectionObserver does not exist (the test DOM, an old browser), every card renders in full, exactly as before.**
2. **The print-only curriculum exists only while printing.** `usePrinting()` mounts it on `beforeprint` (committed synchronously with `flushSync`, so the paper is never printed from an empty page) or when the `print` media query matches, and removes it on `afterprint`. Our own Print button, the browser's menu and the share sheet all fire `beforeprint`.
3. **One bar owns the top of an open lesson.** While a lesson's own space is open, ChurchLearn sets `data-lesson-space="open"` on the root, and the app header (`header.ts-safe-sticky`) flows with the page instead of pinning. It is one flick up, and the lesson bar already carries All courses and All lessons. The bottom text-size bar (the Big Print escape hatch) is unaffected.
4. **Also shipped here, for the read-aloud's "Show the text":** `lib/learn-open.js`. `requestOpenLesson({ lessonId, sentence, sentenceKey, courseKey? })` writes the sentence into that lesson's own place and posts a request that Learn answers through its own Continue path (DR-0631), on mount or at once. It returns false and posts nothing for an id with no course and no place on this device (a Bible chapter, a presenter), so another opener can try. It never switches the app's view and never touches audio; the reader (#1797) switches to Learn itself.

## Verification

**After, same probes, same screen, final branch build** (`after-*.png`, `after-perf.json`, `after-overlap.json`):

| | before | after |
|---|---|---|
| Learn top, elements | 34,022 | 5,994 |
| lesson open, elements | 10,405 | 485 |
| Continue tap, to the landing | 1.59 s (script 1,399 ms) | 0.36 s (script 69 ms) |
| next lesson from the bar | 423 ms (script 342 ms) | 83 ms (script 10 ms) |
| load until Continue is ready | 5.0 s | 2.5 s |

An earlier interleaved pair at higher load gave the same shape: Continue 2.0 → 0.37 s and 1.7 → 0.36 s.

| case (scrolled into the reading) | first readable line, before → after | reading share |
|---|---|---|
| 390, header collapsed | 219 → 89 px | 74% → 89% |
| 360, header collapsed | 219 → 89 px | 74% → 89% |
| 390, header open | 343 → 89 px | 59% → 89% |
| 390, Big Print | 190 → 190 px | 77% (the lesson bar already covered the header there) |

In the browser: scrolling the list, no light card was ever on screen (they fill ahead of the eye); opening lesson L120 far down the list and pressing All lessons landed on its full card; `beforeprint` mounted all 9,919 print elements and a 5.8 MB PDF printed; `afterprint` removed them; emulating the print medium mounted them too.

**The repo's layout probe** (`scripts/chrome-layout-probe.mjs --sweep`, as CI runs it) on the final build: coverage 44/44 chrome cases, 7/7 lesson cases, 16 text-scale cases, all ok, including "mid-lesson: size and theme controls on screen" at Big Print with the header collapsed.

**Tests:** `lesson-opens-fast.test.jsx` (4): the first 6 cards full and the rest light, with their id and title; a light card fills when near and stays; without IntersectionObserver every card is full; the print copy is absent on screen, mounted for `beforeprint` with every lesson, and gone after `afterprint`. `learn-open.test.jsx` (8). **Proven-to-catch:** over the ChurchLearn before this change, 3 of the 4 `lesson-opens-fast` tests fail (every card full; the print copy always mounted); the no-observer test passes on both, as it should.

**Full suite and lint on this branch** (with #1793 and main merged in): `npm run lint` clean; `npx vitest run` — 1,205 files, **20,219 tests, all passing**; `npm run verify:gates`, the consistency, UI-standards and legibility guards all pass.

**Number.** The orchestrator named DR-0636 for this record; that id was already taken on a concurrent branch (a spoken lesson really records), and DR-0637 then turned out to be taken too (every workflow seeds the next); it was next filed as DR-0652, which the orchestrator had already given the Henrie lesson, so it is DR-0652, above every id allocated to an open branch (DR-0639 through DR-0651).

## Honest remainder

- Find-in-page (the browser's own search) finds text only in cards that have filled in. The lesson finder above the list searches every lesson and is unaffected. **re-review: 2026-10-08.**
- The browse-all panel (3,021 elements) and the by-title list (1,541) still render in full; they are scroll boxes a reader uses directly. **re-review: 2026-10-08.**
- The overlap fix makes the app header scroll away inside a lesson on every width, not only phones: a lesson's own bar is the navigation there by DR-0264's design. If Darrell wants the header pinned on a wide screen, it is one CSS rule scoped to a width.
