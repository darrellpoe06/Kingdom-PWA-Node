# DR-1499: A door lands you on the thing it names

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one scroll on an existing section change; no schema, no money, no new surface)
**Type:** decision
**Area:** `app/src/components/ChurchHome.jsx` (the subscriber, the mount road, the strip anchor), `app/src/lib/church-home-section.js` (a handled request is consumed), `app/src/__tests__/a-door-lands-on-what-it-names.test.jsx` (new)
**Sent in by:** Darrell, 2026-11-13, from the live Love Corner front door with two screenshots — the hero, and the player he then had to go find: *"When pushing latest message we should open to the space with it or go to the bottom where the options are... All buttons should work and go to the space it's descriptions saying."*
**Pairs with:** DR-0061 (reality-trace before building), DR-1467 (a check narrower than its name), DR-0733 (the strip), DR-0142 (a launch target may open a specific section)

## Context

The Love Corner hero's primary button reads **Watch · latest message**. Pressing it changed the section correctly and left the reader exactly where they stood.

## What was measured

- **The wiring was never broken, which is why nothing looked wrong in the code.** `open('home', 'worship')` calls `requestChurchHomeSection('worship')`; ChurchHome's subscriber runs; `setSection('worship')` fires; the Worship section opens. Traced end to end on the live component before a line was changed (DR-0061).
- **Nothing scrolled.** `open()` scrolls to top only on a *sub-tab* change; the in-place section path had no scroll at all. The strip sits below the hero, so the reader stayed at the top of the page with the player below the fold. **A button that had done its whole job looked like a button that did nothing.**
- **The existing gate passed green the entire time the defect was live.** `lovecorner-home-render.test.jsx` asserts `requestChurchHomeSection('give')` selects the Give tab — true, and never the complaint. It tests the *changing*; the defect was in the *arriving*. DR-1467's shape once more: a check whose name is wider than its reach.
- **The house already had the pattern.** The follow-along reader scrolls itself into view with `scrollIntoView({ behavior: motionBehavior(), block: 'start' })` after a 60 ms tick (`ChurchHome.jsx:196`). The section request simply never used it.
- **There were THREE roads, not one.** Auditing every door rather than only the one he pressed (DR-0219) found two more. (a) The **mount road**: a launch target does not go through the subscriber at all — the shell remounts ChurchHome with a `key` and an `initialSection` (`poe-financial-mvp-v28.jsx:4596`), which is how a class card's *"Open the Council Chamber"*, the Library's links and a testimony (`book-engine.js:31`) open a section. Identical defect, untouched by the first fix. (b) **A handled request was never consumed:** `requestChurchHomeSection` kept `pending` after the live home had already handled it, so the next mount took it again — press Watch, wander to Learn, come back, and the page opens on Worship because of a tap two screens ago. Quiet while nothing moved; a door that now scrolls would have made it a jump.
- **Every door's target exists.** All six sections the doors name (`worship`, `speak`, `prayer`, `give`, `times`, `about`) are real sections, and all ten sub-views they name (`pulpit`, `ministries`, `youth`, `program`, `learn`, `scripture`, `engagement`, `institute`, `choir`, `bus`) are mounted in the shell. Checked against the code, not assumed: no door on this page points at nothing.

## Impact

Every door that asks for a section now puts the reader on the section it named, by all three roads: the front door's own buttons (Watch, Plan a visit, the eight quick doors, the feature cards), the phone's bottom bar, and a launch target arriving from Learn, the Library or a testimony.

## Decision

1. **A requested section scrolls its strip into view**, `block: 'start'` so the strip's own tabs sit at the top of the view and the section begins right under them — the reader sees what they asked for *and* the other options beside it, which is the second half of what Darrell asked for.
2. **One frame later (60 ms), not immediately**, because the section's content mounts after the state settles — the same tick the follow-along reader already uses.
3. **A section the viewer opens by TAPPING the strip is NOT scrolled.** Their finger is already there; moving the page under it is the jump this fix exists to remove. Pinned by a proven-to-catch case, so the fix cannot quietly become the defect.
4. **Anchored to a wrapper that really holds the tablist**, asserted — anchoring to a wrapper that does not contain the sections would land on the right pixel by luck and break the first time the layout moves.
5. **The mount road arrives the same way**, and only when a section was genuinely asked for: a page opening on its own default is never scrolled, because nobody asked to be moved.
6. **A live listener IS the consumption.** `pending` exists for the home that mounts AFTER the tap, so it is kept when nothing was listening and cleared when something was. Both halves are pinned.

## Verification

- `a-door-lands-on-what-it-names.test.jsx`, **7 green**: the scroll happens; it carries `block: 'start'`; the anchor really contains the `role="tablist"`; three successive doors each arrive rather than only the first; a launch target's `initialSection` arrives on the mount road; a handled request is not replayed on the next mount; and a request made with nothing listening is still honoured by the mount that follows.
- **PROVEN TO CATCH (DR-0076 §3), each of the three mechanisms by its own cases.** Subscriber scroll reverted → 2 fail, one by name: *"the section changed but the reader was never moved to it — the button looks dead while working"*. Mount scroll reverted → the other 2 fail, *"the launch target opened the right section and left the reader at the top of the hero"*. The consumption reverted → 1 fails, *"a handled request was held and would replay on the next mount"*. In each case the rest correctly stay green, since they pin different things. All three restored, 7 of 7.
- Neighbours green: every test that touches ChurchHome or this store — `church-home-render`, `lovecorner-home-render`, `lovecorner-dock`, `subtab-sweep`, `floating-player`, `video-skip`, `live-player-prefs`, `contractors-1099-render` — **84 of 84** together with the new file. `npm run lint` 0; the full `ci.yml` guard chain run by name, every guard exit 0; `format-guard` 0 from the repo root **after committing** (it reads files added since `origin/main`, so an untracked file reads as "0 added" — DR-1467).
- **Not measured, so not claimed:** this was verified in jsdom, which has no layout, so the scroll is asserted by its call and options rather than by a pixel. The live check on the real front door is the reviewer pass (DR-0104), and `re-review: 2026-11-27` carries it if that pass has not happened.
