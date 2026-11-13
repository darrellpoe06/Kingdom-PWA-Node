# DR-1499: A door lands you on the thing it names

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one scroll on an existing section change; no schema, no money, no new surface)
**Type:** decision
**Area:** `app/src/components/ChurchHome.jsx` (the section subscriber and the strip anchor), `app/src/__tests__/a-door-lands-on-what-it-names.test.jsx` (new)
**Sent in by:** Darrell, 2026-11-13, from the live Love Corner front door with two screenshots — the hero, and the player he then had to go find: *"When pushing latest message we should open to the space with it or go to the bottom where the options are... All buttons should work and go to the space it's descriptions saying."*
**Pairs with:** DR-0061 (reality-trace before building), DR-1467 (a check narrower than its name), DR-0733 (the strip), DR-0142 (a launch target may open a specific section)

## Context

The Love Corner hero's primary button reads **Watch · latest message**. Pressing it changed the section correctly and left the reader exactly where they stood.

## What was measured

- **The wiring was never broken, which is why nothing looked wrong in the code.** `open('home', 'worship')` calls `requestChurchHomeSection('worship')`; ChurchHome's subscriber runs; `setSection('worship')` fires; the Worship section opens. Traced end to end on the live component before a line was changed (DR-0061).
- **Nothing scrolled.** `open()` scrolls to top only on a *sub-tab* change; the in-place section path had no scroll at all. The strip sits below the hero, so the reader stayed at the top of the page with the player below the fold. **A button that had done its whole job looked like a button that did nothing.**
- **The existing gate passed green the entire time the defect was live.** `lovecorner-home-render.test.jsx` asserts `requestChurchHomeSection('give')` selects the Give tab — true, and never the complaint. It tests the *changing*; the defect was in the *arriving*. DR-1467's shape once more: a check whose name is wider than its reach.
- **The house already had the pattern.** The follow-along reader scrolls itself into view with `scrollIntoView({ behavior: motionBehavior(), block: 'start' })` after a 60 ms tick (`ChurchHome.jsx:196`). The section request simply never used it.

## Impact

Every door that asks for a section — Watch, Plan a visit, the quick doors, the phone's bottom bar, and anything else calling `requestChurchHomeSection` — now puts the reader on the section it named. One change serves all of them, because they all pass through the one subscriber.

## Decision

1. **A requested section scrolls its strip into view**, `block: 'start'` so the strip's own tabs sit at the top of the view and the section begins right under them — the reader sees what they asked for *and* the other options beside it, which is the second half of what Darrell asked for.
2. **One frame later (60 ms), not immediately**, because the section's content mounts after the state settles — the same tick the follow-along reader already uses.
3. **A section the viewer opens by TAPPING the strip is NOT scrolled.** Their finger is already there; moving the page under it is the jump this fix exists to remove. Pinned by a proven-to-catch case, so the fix cannot quietly become the defect.
4. **Anchored to a wrapper that really holds the tablist**, asserted — anchoring to a wrapper that does not contain the sections would land on the right pixel by luck and break the first time the layout moves.

## Verification

- `a-door-lands-on-what-it-names.test.jsx`, **4 green**: the scroll happens, it carries `block: 'start'`, the anchor really contains the `role="tablist"`, and three successive doors each arrive rather than only the first.
- **PROVEN TO CATCH (DR-0076 §3):** with the scroll reverted and nothing else changed, 2 of the 4 fail by name — *"the section changed but the reader was never moved to it — the button looks dead while working"* — and the other two correctly stay green, since they pin different things. The fix restored, 4 of 4.
- Neighbours green: `lovecorner-home-render` and `church-home-render`, **29 of 29** together with the new file. `npm run lint` 0; `format-guard` 0 from the repo root **after committing** (it reads files added since `origin/main`, so an untracked file reads as "0 added" — DR-1467).
- **Not measured, so not claimed:** this was verified in jsdom, which has no layout, so the scroll is asserted by its call and options rather than by a pixel. The live check on the real front door is the reviewer pass (DR-0104), and `re-review: 2026-11-27` carries it if that pass has not happened.
