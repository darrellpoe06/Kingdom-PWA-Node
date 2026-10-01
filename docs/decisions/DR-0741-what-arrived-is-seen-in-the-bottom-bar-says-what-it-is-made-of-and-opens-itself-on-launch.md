# DR-0741 — What arrived is seen in the bottom bar, says what it is made of, and opens itself on launch

- **Status:** accepted (built and proven in the suite; the presence walk guards the control)
- **Tier:** A (one button in the bottom bar and two lines in a list; no table, no money, no new door)
- **Type:** defect
- **Date:** 2026-10-01
- **Scope:** `app/src/components/ArrivalsBell.jsx` (variant `dock`; `breakdownText`, `dockLabel`, `LAUNCH_OPENED_KEY`; the breakdown line in the list), `app/src/components/ChromeDock.jsx` (mounts the dock instance), `app/src/lib/feature-registry.json` (`ftr-dock-arrivals`), `app/src/__tests__/every-arrival-counted.test.jsx`, `app/src/__tests__/feature-presence.test.jsx`, `docs/decisions/INDEX.md`.
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), REALITY-TRACE (DR-0061: observed on his phone), VERIFICATION-DOCTRINE (DR-0076), DR-0728 (every arrival is counted), DR-0716 (nothing floats over the Word; the bottom bar is where the standing controls live), DR-0726 (every user-facing control is registered), DR-0737 (a sealed message opens on every device, from the day a device joined).
- **Grounds:** Darrell, 2026-10-01, three screenshots: his launcher with the PoeTech icon reading 3, the app open on Messages with the header collapsed, and the thread with two sealed messages from the morning. *"Notifications 3... don't see anything... also didn't open to wherever they are... why?"* Then: *"I like the indicators though... just want them to be clear and show what's what..."*

## Context

**SHOULD.** DR-0728: one number on the icon and in the app for everything that arrived and has not been looked at, and a list behind it that opens each thing's screen.

## What was measured (SHOULD → ARE → GAPS, DR-0219)

**ARE (his phone, 2026-10-01).** The in-app half is `ArrivalsBell`, mounted once, in the header cluster beside Help (`poe-financial-mvp-v28.jsx:4204`). That cluster sits inside `{!headerCollapsed && (…)}` (`:4134`): with the header collapsed the whole block is not rendered, bell included. His header was collapsed ("Show header" at the top of both app screenshots), which is how a phone usually sits once the tabs are enough. So the icon said 3 and nothing on any screen said 3, what the 3 were, or where to go. Launching from the icon lands on the last view, which was Messages; two sealed messages from 08:10 and 08:11 showed, locked, and nothing else.

**GAPS.** (1) The count had no place that is always on the screen. (2) Nothing said what the number was made of. (3) A launch with something new landed nowhere in particular.

**What the 3 most likely were.** Two unread messages from Christina (sealed before 15:08 UTC, when the device road of DR-0737 deployed, so this device cannot open them; a device opens what is sent after it joined, and the thread's "Test" at 12:52 went out sealed for both devices) and one lesson arrival: L202 was published to his own rows (`lesson-published` on `d2f21ba3` and `aed9557b`, read in the 17:05 intake run), and "Your lesson is published" is counted until Your lessons is opened. The list now shows this breakdown, so it is read rather than guessed.

## Impact

The number on the icon is matched by a number on the screen whatever the header is doing, it says what it is made of, and a launch with something new lands on the list. The header bell stays; nothing is removed.

## Decision

1. **The bottom bar carries the count** (`ChromeDock.jsx`): a second `ArrivalsBell` instance, variant `dock`, first in the bar. It is a square button like its neighbours with the bell, the number in a ring and "N new" under it. It is drawn only while N > 0, so the bar keeps its room for the reader otherwise. The header instance stays.
2. **It says what's what.** Its accessible name and title read "3 new: 2 messages · 1 lesson", counted from the list itself in the list's own words (`breakdownText`), most first; a message row's unread count is what the icon counts, so it is what the breakdown says. The list carries the same line under its heading, and each row still names its kind, its time, its title and its detail, with Open.
3. **A launch with something new opens the list itself, once** (`LAUNCH_OPENED_KEY` in sessionStorage): the dock instance opens it the first time that launch learns the count is above zero; the header instance never does, so two instances never open two lists; a route change within the launch leaves it closed; a launch with nothing new opens nothing and marks nothing.
4. **Registered** (DR-0726): `ftr-dock-arrivals` on the app-footer surface; the presence walk supplies three arrivals and the launch mark before mounting the bar.

## Verification

- `every-arrival-counted.test.jsx`: the shell's collapsed block is pinned as conditional and the dock mount as present; `breakdownText` and `dockLabel` read "2 messages · 1 lesson" and "3 new: 2 messages · 1 lesson. Open the list"; nothing is drawn at zero; "3 new" with the breakdown in its name once something is new; the tap opens the list with the breakdown and the rows newest first; the launch opens the list once and marks it, a second mount in the same launch stays closed, a header instance on a fresh launch stays closed; **proven to catch:** nothing new on launch opens nothing and marks nothing.
- `feature-presence.test.jsx`: the app-footer walk finds `dock-arrivals`.
- Lint clean.

## Limits, stated

1. **The two sealed messages stay locked on this device.** DR-0737's road seals a message for every device of both people from the moment it is sent; a message sealed before this device's key existed cannot be opened here. The key-transport road for history on a new device is DR-0737's open item, `re-review: 2026-10-15`.
2. **A seen mark is per device** (DR-0728 item 6). The count on his phone and on the Windows PC can differ until each screen is opened there. Same re-review.
