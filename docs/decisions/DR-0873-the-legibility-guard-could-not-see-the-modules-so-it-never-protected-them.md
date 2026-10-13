# DR-0873 — The legibility guard could not see `app/src/modules`, so it never protected them

- **Status:** accepted
- **Tier:** A (gate widening + the corrections it exposed)
- **Date:** 2026-10-10
- **Type:** gate
- **Scope:** `scripts/legibility-guard.mjs` (`listPages` gains `MODULES_DIR`), `app/src/lib/theme-css.js` (8 midnight rules), `app/src/modules/properties/ReadinessTab.jsx` · `PropertiesApp.jsx` · `DoorTabs.jsx` · `DoorCameras.jsx` · `Storefront.jsx` · `SystemsTab.jsx`, `app/src/lib/legibility-health.json`, `app/src/__tests__/the-legibility-guard-can-see-every-door.test.js` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 — a gate that cannot see a surface is not protecting it), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** the guard's own header, which already records the sibling miss

## The word, as spoken

Darrell, 2026-10-10, on the Poe Properties Guest Ready panel at night:

> "Can't see in dark mode..."

## What was measured

The guard said PASS while he could not read the screen, and the cause was
neither a threshold nor a palette. `listPages()` walked `app/src/components`
and the monolith and **nothing else**. `app/src/modules` was never scanned —
so the entire Properties module, the app he was standing in, had never been
measured on a dark surface in its life.

The guard's own header already records the sibling of this miss: *"it scanned
`components/*.jsx` NON-RECURSIVELY"*. Recursion was fixed; this root was never
added.

The moment the scan widened:

| | before | after |
| --- | --- | --- |
| pages scanned | 315 | **322** |
| regressions visible | 0 | **60** |

Thirty-four were in `ReadinessTab` alone — the Guest Ready panel in his
screenshot — topped by `#1A1815` on the midnight card at **1.04:1**. Black
text on a black surface, which is precisely what he was looking at.

**Why the module was unthemeable:** it painted its palette through *inline
styles* — `style={{ color: INK }}` — and an inline style cannot be overridden
by `[data-theme]` rules, which is the mechanism every other surface relies on.
The midnight theme had no way in, however many rules it carried.

## Impact

A gate's green is a claim. This one had been making a claim about 322 pages
while measuring 315, and the seven it could not see included the module with
the most surface area in the product. Any module added under `app/src/modules`
in future inherits the protection automatically now — that is the durable part;
the 60 corrections are the backlog the blind spot accumulated.

Honest limit: widening the scan is not the same as proving every page is
legible in every theme. It proves they are now **measured**.

## The decision

1. `listPages()` walks `app/src/modules` as well.
2. 36 standalone inline colours became themeable `text-[#hex]` classes.
3. 12 conditional and compound ones (ternaries, colour beside background or
   `textDecoration`) were converted by hand, keeping the non-colour half in
   `style` where it belongs.
4. 8 midnight rules added to `theme-css.js` for the tokens the module uses and
   no other surface had needed.
5. Two missing focus rings added; two now-unused constants removed.
6. `--health` was used to regenerate the artifact, **not** `--generate` —
   `--generate` grandfathers debt into the baseline, which would have buried
   this session's own 60 findings instead of fixing them.

## Outcome

**60 → 0 regressions. 322 scanned, 309 pass, tracked debt unchanged at 13** —
the debt number not moving is the point: nothing was swept into the baseline.
119 tests green at the time of the commit; eslint clean.

`the-legibility-guard-can-see-every-door.test.js` (4 cases) pins that the
scanner reaches `app/src/modules`, so the blind spot cannot reopen silently.

Recorded after the fact: this change was committed on 2026-10-10 before its
record existed, and the decision-record guard caught the gap on the next push.
Stated rather than back-dated.
