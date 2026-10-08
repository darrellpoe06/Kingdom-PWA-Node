# DR-0816 — The lesson's sticky block is chrome, and chrome never gets bigger

**Date:** 2026-10-08
**Status:** accepted
**Area:** the lesson reader's sticky block (nav row, title, progress bar)
**Principle:** DR-0438 (the controls never get bigger), DR-0076 (measure, do not claim; proven-to-catch), DR-0239 (form factor MEASURED), DR-0605 (the title keeps its two lines and its fold), DR-0749 (the chrome gives the reading its height back)

## Context

Darrell sent a photograph of lesson L218 on the television with two words:
"Fix it."

What the picture shows: the lesson's own sticky block — the nav row (ALL
COURSES / ALL LESSONS / L218 · 1 of 215 / PREV / NEXT), the two-line title, and
the STEP 1 OF 10 bar — standing over the reading, with the first line of the
lesson cut in half behind it.

DR-0438 already settled the rule that governs this, on 2026-09-16, in his own
words after three phone screenshots: **"the controls should never get bigger."**
`CHROME_SCALE_FACTOR` has been `0` ever since, so a chrome region renders at
exactly its Normal size at every text step while the words grow. The lesson
bar carries `.ts-chrome-region` and obeys it. **The title row and the progress
block never did.** They rode the full root scale — 2x at Largest, 2.75x at Big
Print 44 — and the progress block rode it twice over, because its `0.6875rem`
labels are additionally floored UP to `0.75rem` outside a chrome region
(`index.css`, DR-0427).

## What was measured

Chromium, the freshly built `dist`, lesson L218 opened in its own space, at the
shapes a television browser reports. Geometry measured on the rendered page —
jsdom cannot measure layout, which is exactly why this class of defect has
survived source review before (`chrome-layout-probe.mjs` header).

**The sticky block, 1280x720:**

| text size | block before | block after |
|---|---|---|
| Normal | 93px | **93px (identical)** |
| Largest (2x) | 157px (22% of the screen) | 99px (14%) |
| Big Print 44 (2.75x) | 194px (27%) | **87px (12%) — smaller than Normal** |

Of that, **the title row alone** was 38px at Normal, 102px at Largest and 140px
at Big Print 44; it is now **32px at every step**. The title's computed type was
14px / 28px / 38.5px across the three steps; it is **14px at all three**, and
the fold button stays **44px tall** at all three.

**The progress block, measured on its own markup in the live page, both ways:**

| text size | uncapped | capped |
|---|---|---|
| Normal | 43px | 43px |
| Largest | 86px | **43px** |
| Big Print 44 | 118px | **43px** |

**The whole stack as Darrell had it** (block + progress bar), 1280x720 at Big
Print 44: **312px before, 151px after.** On a 720-tall screen that is 43% of
the picture returned to 21%, before the bottom bar is counted.

Other shapes, Normal → Big Print 44 after the change: 960x540 → 93px → 87px
(it shrinks); 390x844 → 114px → 127px (+11%, all of it in the nav row, which
was already capped and wraps its buttons differently on a narrow phone).

## Impact

- **The words get the screen back.** At the size Darrell actually reads on the
  television, the chrome over the lesson is less than half what it was.
- **It is his own rule, finally applied everywhere.** This is not a new
  preference; it is DR-0438 reaching the two pieces of the lesson block that
  were missed. The lesson bar, the app header, the reader panel and the text
  controls have all behaved this way since September.
- **Nothing firmed up was taken away.** The title still shows two lines and
  still opens whole on its handle (DR-0605, and his 2026-10-02 correction:
  "don't take away what I've already discussed and firmed up!!!!! Just tweaks
  for better function and flow!!!!!!!"). The progress bar still spans the full
  reading width and still cannot scroll away (his 2026-09-17 ask). The 44px
  fold button is still 44px. The nav row is unchanged.
- **At Normal nothing moved at all** — `--ts-chrome-scale` is exactly 1 there,
  so the block measures 93px before and after and the title computes to the
  same 14px. The change is invisible to a reader who never leaves Normal.
- **A layout instrument now watches it.** This class — chrome that quietly
  outgrows the content it frames — is only visible to a browser. It now has a
  gate that measures the real block at the real shapes.

**Named, not fixed here:** on a narrow phone at Big Print 44 the block still
grows 11% (114px → 127px), and all of it is in the NAV row, which has been a
capped region since September — at 390px its buttons wrap onto another line
rather than growing. That is a wrap, not a scale, and it is outside this
change; the gate's 30% allowance covers it deliberately rather than silently.
Also: with the block capped, a reader at Big Print 44 reads the lesson's title
in the sticky bar at Normal size, the same as the nav labels beside it. That is the chrome rule working as designed, and the title is also
printed full-size in the lesson's own heading below, but it is a trade worth
watching on a ten-foot screen. **re-review: 2026-11-08.**

## Decision

Two changes in `app/src/components/ChurchLearn.jsx`, both of them caps, neither
of them a removal:

- **The title row takes the chrome cap piece by piece**, through the same
  variable the region uses — `capped(size) = calc(size * var(--ts-chrome-scale,
  1))` — on the three things that decide its height: the title's type
  (`STICKY_TITLE_SIZE`, on both branches, folded to two lines and opened
  whole), the fold button's glyph (`STICKY_TOGGLE_SIZE`; a 33px chevron made
  the 44px box 52px tall on its own), and the row's own vertical padding
  (`STICKY_ROW_PAD_Y`, replacing `py-1.5`). It does NOT become a
  `.ts-chrome-region`, because the region applies `zoom`, and `zoom` compounds
  onto the fixed 44px fold button and would render it at 16px — the one thing
  `index.css` says never to do. The button keeps its 44px.
- **The progress block becomes a `.ts-chrome-region`.** It holds no fixed-px
  control, so it takes the region cap itself, which also lifts it out of the
  small-text floor-up rule that was doubling its labels.

The nav row, the fold, the two-line clamp, the full-width bar and the
auto-hide (DR-0749) are untouched.

## Verification

- `app/src/__tests__/lesson-chrome-is-capped.test.js` **4/4 green** — the three
  capped sizes exist and are used (both title branches, the toggle, the row's
  padding, with no `py-*` class left to fight it); the progress block carries
  `ts-chrome-region`; the fold, the clamp, the 44px x 44px button, the nav row's
  own cap and the full-width bar are all still there, and the title row is NOT
  zoomed as a region; and the cap itself is exactly Normal size at all five text
  steps.
- `scripts/chrome-layout-probe.mjs` gains a **LESSON-CHROME pass** at 1280x720,
  960x540 and 390x844: it opens L218 twice, at Normal and at Big Print 44, and
  requires (L1) the block's height to grow no more than 30% between them and
  (L2) the title's computed font-size to be identical. Before the fix the block
  grew 109% and the type grew 14px → 38.5px, so both would have failed.
- **Proven to catch (DR-0076 §3), run here:** `--selftest-break` now also
  injects the uncapped sizes — `[data-testid="lesson-space-title"] {
  font-size: 0.875rem !important }` and `.lesson-space-sticky .ts-chrome-region
  { zoom: 1 !important }` — and the run reported both trips:
  *"the sticky block grows 93px -> 396px at Big Print 44 (326% over, cap 30%)
  — the controls got bigger (DR-0438)"* and *"the sticky title's type grows
  14px -> 38.5px at Big Print 44"*. The selftest's 396px is larger than the
  real pre-fix 194px because the break also unzooms the nav row, which was
  never broken; the honest pre-fix number is the measured 93px → 194px (109%).
  The selftest gate counts this pass separately and now requires **both** of
  its trips, so a probe that stops catching this is itself a failure.
- The numbers above are measurements from that browser, not estimates: the
  block, the title type and the progress block were each read with
  `getBoundingClientRect` / `getComputedStyle` on the rendered page.
- Not verified from here: the live build on Darrell's own Firestick. The
  sandbox has no route to poetech.us (DR-0125), so the deployed read is the
  next step and his screen is the witness.
