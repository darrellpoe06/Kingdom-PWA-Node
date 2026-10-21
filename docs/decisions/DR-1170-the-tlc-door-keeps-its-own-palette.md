# DR-1170: The TLC door keeps its own palette — a device's family choice does not dress the practice

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (the practice's identity on its own door; amends how DR-1156's finish reaches a device)
**Type:** word
**Area:**
- `app/src/lib/theme-css.js` (`setThemeScope` / `getThemeScope`; the preference reads and writes a scoped key while a door scope is set, with the door's own default)
- `app/src/lib/tlc-door.js` (`enterTlcDoorContext` — the same answer as `isTlcDoorContext`, plus the scope, once, before the shell's first read)
- `app/src/poe-financial-mvp-v28.jsx` (one call renamed on its existing line; the shell did not grow)
- `app/src/__tests__/the-tlc-door-wears-its-own-green.test.js` (5 new cases, one of them the bug as shipped)

**Grounds:** Darrell, 2026-10-21, with DR-1156 merged and deployed and the TLC door open on his phone: **"Nothing changed. Why does it still look the same."** Then: **"When will it be done. It's been 7 hours."**
**Principles:** `feedback_believe_firsthand_device_reports` (his report is ground truth); DR-0076 §6 (reality-trace on the real device, not the sandbox); DR-0524 (a device that chose keeps its choice — re-scoped here, not overturned); DR-0878 (one choice, every surface); DR-1060 (a door opens in its own colors); DR-1156

## Context

DR-1156 shipped a measured ivory & forest finish and opened the TLC door in it **by a fallback**: `useThemePref(TLC_DEFAULT_THEME)`. A fallback is consulted only when the device's ONE shared preference key (`poe-theme-pref`) is empty. Darrell's phone chose a palette in the family app months ago, as any device that has used the app has. So the door opened in that palette, and the one person who asked for the redesign never saw it. The sandbox review (a fresh browser, no saved key) could not have shown this; his phone did.

Under Heritage the shape changes (pills, rounded cards, round portraits) are near-invisible too, because Heritage already rounds and shadows. "Nothing changed" was an accurate description of his screen.

The church door has the same gap by construction (DR-1060 wrote "a device that chose keeps its choice" as the rule); it is noted below, not changed here.

## What was measured

- `lib/theme-css.js` before this change: one key, `poe-theme-pref`, read by `readThemePref(fallback)` for every shell; the fallback used only when the key is empty or holds an unknown palette.
- DR-1156's door: `useThemePref(TLC_DEFAULT_THEME)` in both the door and the shell — a fallback on both lines, so a saved key wins on both.
- Darrell's phone: a palette chosen in the family app (DR-0524 keeps it), so the key was not empty; the door opened in that palette. The sandbox review ran in a fresh browser with an empty key and showed `tlc` — a true measurement of the wrong device.
- The order of hooks in the shell: the door-context `useState` initializer at the `tlcDoorOnly` line runs before the theme hook's first read in the same render, so a scope set there is in force for that read.

## Impact

- A client opening the TLC app on any phone sees TLC's finish, not whatever that phone's family app chose. The practice's door looks like the practice.
- A choice made inside the door (Midnight at night) stays in the door; the family app is untouched, and the family's choice no longer dresses the practice.
- The operator tab inside the family app and every other shell read the same key they always did; nothing moves for them.
- Shell line count unchanged (5192).

## Decision

**A door may declare a theme SCOPE.** While a scope is set, the preference is read from and written to the door's own key (`poe-theme-pref:<scope>`), with the door's own default when nothing was chosen there. The family app's key is untouched in both directions.

- The TLC door enters its scope **at boot, before the shell's first read** — `enterTlcDoorContext()` in the shell's door-context initializer, which sits above the theme hook. It returns exactly what `isTlcDoorContext()` returned; the only addition is the scope write when the answer is yes. The operator tab (`?view=tlc`) and the family app never enter it.
- Every picker inside the door (the comfort row, the reader panel) reads and writes through the store, so DR-0878's one-choice-every-surface holds **within the door**, which is the surface a client is standing in. Choosing Midnight in the TLC door at night dresses the TLC door; the family app stays Heritage; and the family's Heritage never dresses a therapy practice's clients.
- DR-0524 is re-scoped, not overturned: a device that chose keeps its choice **per door**.
- The shell did not grow: one identifier renamed on its own line, the import on its own line. Budget 5192 → 5192.

## Verification

- 5 new cases on a faked storage: **the bug as shipped, proven to catch** (no scope, a saved `heritage` wins over the door's fallback); entering the door yields `tlc` whatever the family chose and whatever fallback a picker passes; a choice inside the door lands on the door's key and the family's key is untouched; the operator tab and the family app never enter the scope; the shell enters through the scoping call and declares it above the theme hook.
- 8 theme / door suites: 105 green. Lint 0. Monolith budget held.
- **Not proven on his phone from here** — the sandbox has no route to poetech.us. The proof is the next open of the installed TLC app after the deploy for this commit is green; if it still shows the old finish, the installed app is holding the previous build and a close-and-reopen (or Chrome → site settings → poetech.us → clear) is the device-side step. That is the only step his hand holds.

## What this does not do

- **The Love Corner door** still opens in the church's red only by fallback, so a device that chose a palette in the family app sees that palette on the church door. The same scope mechanism closes it in one line; it is the church's call whether the church door should ignore the family choice. **`re-review: 2026-10-28`.**
- **The TLC tab inside the family PoeTech app** stays in the family's palette by design; the office panels there carry the shared shape only. A `data-theme="tlc"` wrapper on that view is possible but nested theme scopes broke color inheritance once before (the shell's own comment at the door branch); not done blind.
