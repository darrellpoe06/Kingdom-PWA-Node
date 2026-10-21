# DR-1171: The TLC door takes the reference's shape — a home, a bottom bar, a welcome card; not only its colors

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (the practice's own door, every client's first screen)
**Type:** word
**Area:**
- `app/src/components/TlcHome.jsx` (new — the welcome card, the greeting, the verse card, the quick-action tiles, the schedule row)
- `app/src/components/TlcDoorDock.jsx` (new — the phone's bottom bar with a More sheet; publishes `--chrome-dock-h` so the floaters stand above it)
- `app/src/components/TlcPublicDoor.jsx` (the first section carries the home; the strip hides below `sm`; the swatches and sizes fold behind one Appearance toggle; the tiles and bar are built from the person's own sections)
- `app/src/components/SectionTabs.jsx` (`stripClassName`, a wrapper class for the strip — the tablist stays in the DOM)

**Grounds:** Darrell, 2026-10-21, with DR-1156 and DR-1170 live on his phone, the reference beside it: **"It's better but it does not look like this at all."**
**Principles:** `feedback_believe_firsthand_device_reports`; DR-0076 §6 (observe the running app); DR-0061 (a surface is a live view of real state — every tile opens a real section); DR-1156 (the palette); DR-1170 (the door's own palette key); the brief's own rule (no new features)

## Context

DR-1156 shipped the reference's **palette** onto the door's existing **layout**: a brand bar, a hideaway holding eleven swatches and five sizes, a pill tab strip, then the providers. The reference is a different shape: a welcome screen with the brand and two big buttons; a personal greeting; a quote card; a 2×2 of quick actions; a "need to schedule?" row; a five-item bottom bar. With the colors right and the shape wrong, the phone still read as the old door, and he said so.

## What was measured

- The reference's screens, feature by feature, against the door's sections: Home → the door's first section; Appointments → Book (Acuity); Resources → Mental skills / Training; the therapist profile → Match a Preferred Provider; Messages, Progress, Account → not features of this app (the brief: "wherever those features already exist... do not introduce new features").
- The door's first live screenshot of the reshape at 390px: the read-aloud control and the text-size hatch sat **on** the More button and swallowed its tap (`locator.click` timed out on `tlc-dock-more`). `index.css` lifts both floaters by `--chrome-dock-h`, the variable the family app's bar publishes; the TLC bar published nothing. Fixed by publishing it from the bar on phone widths; the second run captured all four screens with zero page errors.
- The tests that pin the door's shape and were kept green by design: the first tab's label `Find your therapist` (five suites), the tablist roles (SectionTabs), the hideaway contract (tagline, blurb and the `Comfort controls` group leave when tucked), every anchor `target=_blank` (the "Continue without an account" link became a button for that reason).

## Impact

- A phone opens on the reference's first screen: the forest welcome card with **Sign in** and **Create an account** (both open the door's existing entry) and "Continue without an account", a verse card (the KJV line the Learn space already carries, verbatim), quick-action tiles for the sections this person has, a schedule row to Acuity, then the providers. Signed in, the card becomes the greeting with the person's own name.
- The bottom bar holds the first four sections and More (the rest, Book, Share · QR, Sign in). The desktop keeps the tab strip; both drive one active id.
- The hideaway now reads as a hero: tagline, blurb, Book, Learn more, Share · QR, and one small **Appearance** toggle holding the swatches and sizes — every surface stays re-themeable and resizable, without a control panel at the top of the door.
- No feature added or removed; no route, gate or test contract moved. Shell untouched (5192).

## Decision

1. **The first section is the home.** `TlcHome` renders above `ClientDoor` inside the `find` section, so every deep link, every test and every tab that lands on `find` still lands on the providers, and the dock labels it Home.
2. **A bottom bar on phones, the strip on desktop**, one active id. The bar publishes `--chrome-dock-h` while mounted so the floaters stand above it, exactly as the family app's bar does.
3. **Appearance folds.** The comfort controls keep their group, their name and their place in the hideaway, behind one toggle.
4. **Not built:** appointments, messages, progress, account — not features of this app. Each is its own decision if Christina wants it.

## Verification

- 7 door and tabs suites: 79 green; the new `tlc-public-door-render` run found one right failure (an internal anchor without `target`), fixed by making it a button.
- Lint 0; ui-standards 0 regressions (every new button carries its ring); contrast and legibility PASS; monolith budget held at 5192.
- **Observed on the built door in a real browser at 390px**, four screens: home with the hero, home with the header tucked, the More sheet open, the Mental skills tab — zero page errors; the floaters clear of the bar after the `--chrome-dock-h` fix.
- Not observed from here: the signed-in home (no account in the sandbox); the proof is Darrell's phone after the deploy.

## What this does not do

- **The More sheet and the floaters share the lower-right corner**; the sheet's last row can sit under the text-size hatch at Big Print. A sheet that opens upward from the left edge, or a hatch that steps aside while a sheet is open, is the next pass. **`re-review: 2026-10-28`.**
- **No photography.** The reference's hero and resource thumbnails are stock photos; the app ships none and the sandbox cannot fetch any. The hero is the forest card. Christina's own photos are the right source. **`re-review: 2026-11-04`.**
- The family app's TLC tab stays the family's shape (DR-1156, unchanged).
