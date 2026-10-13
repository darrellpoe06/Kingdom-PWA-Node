# DR-0464 — Christina's home view ships opt-in, with real records, and her three looks as density

- **Status:** accepted
- **Tier:** B (a new front-door surface — but OPT-IN, so it is not the Tier C front-door swap the same work would have been if it replaced the default)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/lib/home-view-prefs.js` (new), `app/src/lib/life-hub.js` (new), `app/src/components/LifeHub.jsx` (new), `app/src/components/BigPictureDashboard.jsx` (the `Home` switch + the way in), `app/src/poe-financial-mvp-v28.jsx` (one existing import line and one existing mount line — ZERO new lines), `app/src/__tests__/life-hub.test.jsx` (new, 33 checks, 41/41 breaks caught), `app/src/lib/legibility-health.json` (re-measured)
- **Principles:** REALITY-TRACE (2026-06-13), NO-PAINTED-NUMBERS (DR-0061), VERIFICATION-DOCTRINE (DR-0076), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), NOTHING-WAITS (DR-0236), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0078 (the monolith freeze this had to ship under), DR-0410 / DR-0438 (chrome never outgrows the words), DR-0246 (the width cap belongs to the content), DR-0351 (the TLC door is its own instance, which is why that tile carries no number), DR-0330 (a route that reaches nothing is a lie)

## Why this exists

Darrell, 2026-09-17, relaying three home-view mockups from his wife Christina — "options she would like to see as views for the app" — with three decisions given: **the Current View stays the default front door**, **yes to building real records for the two tiles that have none**, and **agreed that the phone nav folds behind More**. Measured before any code: none of the three views existed in the repo, and `git log -S` across all history returned zero commits for five distinctive strings from them, so they were net-new rather than edits. Her three mockups agree on structure — the same six tiles and sub-labels — and differ only in skin and density.

## The decision

**a. IT IS OPT-IN, WHICH IS WHY IT IS NOT A FRONT-DOOR SWAP.** The preference defaults to `current`, including when storage is blocked or throws, so a reader who does nothing sees exactly the screen they see today. The way in is one small button on the current home; the way back is in the hub's own header. Reversible from both sides, with no settings page to find.

**b. THE STRUCTURE IS BUILT ONCE, AS A MODEL OVER REAL RECORDS.** `lib/life-hub.js` returns the six tiles and their counts; the component renders what it returns and invents nothing.

**c. A TILE SHOWS A NUMBER ONLY WHERE A RECORD PRODUCES ONE — and her mockup's literal 4 on Messages is exactly what that refuses.** Doors come from `data.inflows.rentals`; open projects use the SAME active-status list the capacity layer uses, so the hub and the Action Queue can never disagree about "open" in front of the same reader; the Messages badge is the real unread count from the page's single DM watcher and draws nothing at zero. Big Picture, Learn and TLC carry NO number, each for a stated reason: Big Picture IS the overview, there is no per-person lesson-progress record anywhere in this app (measured), and the TLC door runs in its own Supabase instance (DR-0351) so this world cannot see its rows.

**d. HER THREE LOOKS ALL SHIP — AS DENSITY, NOT AS PALETTES, and that was a forced call.** `contrast-guard` reads the theme CSS as the single source of truth and a hardcoded colour cannot be remapped per theme; three private palettes would have rendered dark-on-dark in midnight for whoever picked the pastel one. So airy / photo / compact keep what her mockups actually disagree about — density, and the Quick Actions count of 4 / 8 / 6 measured from the mockups themselves — while every colour inherits the theme the reader already chose. All three survive; none is discarded.

**e. TODAY'S FOCUS AND MY GOALS ARE NOW REACHABLE, and the honest finding is that they were not.** `lib/daily-focus.js` shipped earlier as a tested lib with **no caller anywhere in the app** — the records existed in code and nothing rendered them. This view is the first surface to read and write them, and a check pins that so they cannot go unreachable again. A goal still carries no typed percentage: a number a person types about their own progress is as invented as the checklist it replaced.

**f. "PER PERSON" IS PER DEVICE, SAID IN ONE LINE RATHER THAN IMPLIED.** The preference is a module-level store over `localStorage`, the pattern `live-player-prefs.js` and `text-size.js` already use here. In this family that is per person — each reads the app on their own phone — but two people sharing a device share the choice, and a signed-in person on a new device starts on the default. The durable fix is a column on the profile row, which is a schema change. **`re-review: 2026-10-17`** — sooner if anyone reports sharing a device.

**g. THE "BOOKS" TILE OPENS LEARN, and the ambiguity is named rather than resolved in silence.** Her tile reads "Books" with the sub-label "Learn & Grow". In this app "Books" is the FINANCIAL surface while "Learn & Grow" plainly describes the Learn door, so the sub-label wins and the money books stay one tap away behind Big Picture. If she meant the money books it is one line. **FYI for Christina, not a blocker.**

**h. IT SHIPPED WITHOUT GROWING THE FROZEN SHELL BY A SINGLE LINE.** The switch is exported from `BigPictureDashboard.jsx` as `Home`, so the shell's existing import line and existing mount line change their component name and pass two more props at zero line growth — measured 5,355 before and after, and `monolith-budget-guard` confirms it holds the frozen budget. The switch is a component rather than an early return inside the dashboard, because an early return above the dashboard's own `useState` calls would change the hook count the moment somebody flipped the preference.

## Verification (DR-0076)

- **THE REALITY-TRACE CAUGHT TWO DESTINATIONS THAT WOULD HAVE OPENED NOTHING.** There is no `view === 'learn'` route in this app — Learn is the church door with `churchView === 'learn'` — so the Learn tile drives BOTH setters, and the gate checks every tile's destination against the host file itself rather than against a list copied by hand. A renamed route now fails a check instead of a family member's thumb (DR-0330).
- **THE GATE'S FIRST RUN CAUGHT A REAL RENDER DEFECT: the focus item's field is `label`, not `text`.** The view rendered `{f.text}` and would have shown an empty row for every item the family added — on the surface whose whole value is being trusted at a glance. Fixed, and the field name and the rendered text are both pinned now.
- **THE BREAK HARNESS CAUGHT FOUR CHECKS THAT WERE NOT DOING THEIR JOB, which is what it is for.** (1) The default was asserted as `HOME_VIEWS[0]` and re-asserted by a test reset that hardcoded `'current'`, so a break that flipped the real default was invisible; the default now has ONE source, used by the reader and the reset, and it is checked there. (2) "The hub has a way back" passed on the sentence in the header that also contains the words "Current View"; it now finds the BUTTON and proves the transition. (3) The reversibility check asserted only the end state, so it passed even when the setter REFUSED the change — because the view had never left `current`; it now enters the hub first. (4) The write and navigation checks rendered `LifeHub` directly and therefore could not see `Home` dropping a prop; two checks now render the real switch. **Eighth through eleventh faces of this session's recurring finding: check the property, in the place it is supposed to be doing its job.**
- **AND TWO BREAKS WERE BAD BREAKS RATHER THAN MISSES, recorded as such.** A junk-count break left the downstream `> 0` guard intact, so nothing observable changed and the property still held; it was replaced with one that removes the guard. And reordering `HOME_VIEWS` stopped mattering once the default became its own constant — the property MOVED rather than disappearing — so it was replaced by dropping `'current'` from the allowed list, which silently refuses the way back, and that one was a genuine miss until the reversibility check was fixed.
- **FOUR REPO STANDARDS CORRECTED MY FIRST DRAFT, and every one of them was right.** `text-[11px]` for chrome is a fixed-px font size that does NOT scale with the text-size control (consistency-guard hard-fails any new one, and large-print-guard and ui-standards-set agreed) — the house idiom is the smallest REM step, so chrome stays small without staying tiny at A+++. And `min-h-[32px]` is under the house 36px thumb target. Corrected in the code, and the gate now pins both as properties rather than as strings.
- **33 checks; 41 breaks applied for real, 41 caught, 0 missed, 0 no-ops.** Each break edits one of the four real files, asserts the edit landed, runs the gate, and restores.
- `legibility-health.json` re-measured: 251 pages, 238 passing (was 250 / 237) — the new surface passes rather than joining the debt list. Full verify green.

## What is still NOT proven

- **That Christina prefers this to her mockups.** It carries her structure, her sub-labels and her three densities, but the palettes are the app's themes rather than her three skins, for the contrast reason in (d). That is a real difference and hers to judge — the fastest way to close it is her looking at the three densities on her own phone.
- **Recent Activity is not built yet.** Her views carry a Recent Activity strip, and the feed exists to build it from (`finance-activity.js` + `usage-events.js` + `record-events-sync.js`). It is deliberately absent rather than painted. **`re-review: 2026-09-24`.**
- **Whether the phone nav folding behind More needs anything here.** He agreed it should fold, and two of her three views already did it; this view does not add a nav of its own, so nothing was changed for it. If the app-level nav still does not fold on a 360px phone, that is its own slice.

## Files

- `app/src/lib/home-view-prefs.js` — the opt-in preference and the three densities
- `app/src/lib/life-hub.js` — the tile and action model over real records
- `app/src/components/LifeHub.jsx` — the view
- `app/src/components/BigPictureDashboard.jsx` — the `Home` switch and the way in
- `app/src/poe-financial-mvp-v28.jsx` — one import line, one mount line, zero growth
- `app/src/__tests__/life-hub.test.jsx` — new, 33 checks
- `app/src/lib/legibility-health.json` — re-measured
- `docs/decisions/INDEX.md` — row + pointer
