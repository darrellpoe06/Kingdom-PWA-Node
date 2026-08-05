# DR-0276 — Big text HOLDS the layout, and big text is ALWAYS reversible

- **Status:** accepted
- **Tier:** A (layout-safety CSS + chrome caps + a measured CI dimension; exact no-ops at Normal text size, no data or privilege change)
- **Scope:** every surface at the large-print steps (Largest 2x, Big Print 44 2.75x) — the TLC door, the Moore door, the main app's Practice tab, and the standing rules for all future surfaces
- **Date:** 2026-08-05
- **Principles:** VERIFICATION-DOCTRINE, COMPREHENSIVE-REVIEW, COMMUNITY-FIRST, PERPETUAL-IMPROVEMENT, MACHINERY-OVER-MEMORY, WAYS-REVIEW

## Directive

Darrell, 2026-08-05, with two live Big Print screenshots of the TLC Therapy Solutions app: *"Big Text UIUX review... horrible condition currently... Comprehensive review of our Ways and documentation and procedures."* And the sharpest finding, in his own words mid-review: *"cant get out of big text mode once in it."* Scope widened by him in the same session: *"check on All apps."*

## What the screenshots proved (ARE)

1. **The reader was TRAPPED in big text on the TLC door.** The door's sticky header capped only its H1 as chrome; the blurb, theme dots, size buttons, and CTA row all scaled at the full 2.75x. The header outgrew the phone viewport, and a sticky header's below-the-fold content is unreachable — the size controls (the only way back to Normal) were off-screen. The Moore door had the same trap in a second shape: its comfort row could not wrap, so the ballooned theme dots pushed every size button past the clipped right edge.
2. **Card grids shattered.** At 2x+ a two-column card grid's min-content (photo + longest name + a nowrap VIEW → chip) exceeds its track; the grid blew past the viewport and neighboring cards painted over the spilled text — clipped names ("Caroly…", "Wama…"), a "VIEW" chip cut at the screen edge.
3. **The Ways were stale.** `lib/text-size.js` still claimed *"flex-wrap layouts absorb the 1.5x at Largest, so nothing shatters"* — written when Largest WAS 1.5x, never re-verified after DR-0145 doubled Largest to 2x and DR-0147 added Big Print 44 at 2.75x. The claim was believed instead of measured — the exact class DR-0076 exists to end.

## Decision (SHOULD, now carried by machinery)

Three standing layout rules, each an exact no-op at Normal:

1. **`.ts-grid-collapse`** (index.css): a multi-column card grid drops to ONE readable column at Largest/Big Print. One big column IS the large-print layout; two clipped ones are not. Applied to the TLC door team+services grids, the main app Practice tab grids, and the Moore door team grid.
2. **`.ts-safe-sticky`** (index.css): a sticky header may never exceed the viewport — at the big steps it caps to `100dvh` and scrolls within itself, so every control it holds stays reachable. Applied to the TLC door header.
3. **Text-size controls are CHROME and never compound with their own setting** — the rule `TextSizeControl` already embodied (fixed-px labels) now governs the doors too: both doors' comfort rows ride `.ts-chrome-region` (with rem min-sizes so the cap grows, never shrinks, the 36px touch targets), and the Moore comfort row wraps. Big text is ALWAYS reversible.

**The gate (dimension 4, measured not assumed):** `scripts/chrome-layout-probe.mjs` gains a text-scale pass riding `--sweep` — church, library, the TLC door, and the Moore door load at Big Print 44 (localStorage-seeded pre-boot, the returning reader's real path) at 360/768px and must show (a) no horizontal overflow and (b) a text-size control fully on screen. `--selftest-break` now must trip BOTH passes (the chrome collapse AND the trap + blowout) or the probe exits as theater. No ci.yml change — the pass rides the existing steps.

## The gate's first catch — the MAIN APP was trapped too (same session)

The Big Print pass's first CI run (PR #1208) caught what no source-level review had: the main shell itself failed the escape-hatch invariant on church and library at both widths. Measured with the local instrument (stub `VITE_SUPABASE_*` env so the app boots): the LiveWorshipBar ballooned to a 502px fixed overlay, the disclaimer strip to 239px, the header to 1,249px — the text-size buttons (whose rem padding scaled to 88px boxes despite their fixed-px labels) sat 1,147px below the fold. Closed in the same PR: the LiveWorshipBar, the disclaimer strip, the HelpWalkthrough sheet, and the header controls row are chrome (`.ts-chrome-region`); the main header rides `.ts-safe-sticky`; `TextSizeControl`'s header-variant labels divide by `--ts-chrome-scale` so the cap cancels exactly (labels render at their designed px inside any capped region, and grow only with the bounded chrome multiplier outside one). Re-measured: the hatch sits at y≈199 (church@360) and y≈113 (library@768) — on screen; all 8 text-scale scenarios green locally.

## Consequences

- A future surface that ships a multi-column grid or sticky header without these classes fails the probe the first time the sweep meets it — memory is not the carrier, the instrument is.
- The stale text-size claim is corrected at its source (`lib/text-size.js` header) and the three rules are documented there, where the next builder reads them.
- Pairs with: DR-0145/DR-0147 (the steps this makes safe), DR-0239 (the review standard that ran), DR-0104 (the live-push review that fed the screenshots), COMMUNITY-FIRST-MISSION (the elders these steps exist for).
