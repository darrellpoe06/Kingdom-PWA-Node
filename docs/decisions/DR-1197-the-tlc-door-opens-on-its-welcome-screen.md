# DR-1197: The TLC door opens on its welcome screen — the brand alone, Sign in, Create an account; the door waits behind it

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (the practice's own door, every client's first screen)
**Type:** word
**Area:**
- `app/src/lib/tlc-welcome.js` (new, pure — when the welcome stands in front; the session memory; the phone-first hideaway default)
- `app/src/components/TlcWelcome.jsx` (new — the screen: the mark, TLC, the tagline, the blurb, Sign in, Create an account, Continue without an account)
- `app/src/components/TlcHome.jsx` (the welcome card leaves the home; the quote card goes on the dark field with the leaf; the quick actions sit two across; the greeting wears the person's own picture)
- `app/src/components/TlcDoorDock.jsx` (the bar has as many columns as it has items; the More sheet is the reference's account list; the open sheet rises above the floaters)
- `app/src/components/TlcPublicDoor.jsx` (mounts the welcome; the top space starts tucked on a phone; passes the picture)
- `app/src/lib/chrome-dock.js` (`isPhoneWidth`, one synchronous read beside the hook)
- `app/src/__tests__/the-tlc-door-opens-on-its-welcome.test.jsx` (new); `header-hideaway.test.js` (re-pinned to the per-width default)

**Grounds:** Darrell, 2026-10-21, with DR-1171 live on his phone and the reference beside it: **"Still does not look like this."**
**Principles:** `feedback_believe_firsthand_device_reports`; DR-0076 §6 (observe the running app — this time the phone-width screenshot of main was taken BEFORE deciding what was wrong); DR-0061 (every control opens a real section); DR-1171 (the shape); the brief's own rule (no feature added or removed)

## Context

DR-1171 drew the reference's welcome as a **card inside the page**: under the sticky bar (brand, Book, Sign in, chevron), under the open hideaway (the tagline, the blurb, an Appearance toggle, Book / Learn more / Share · QR), with the read-aloud control and the text-size hatch sitting on its last line. The reference's first screen is a **screen**: the brand alone on the field, two buttons, a way past, nothing above it and nothing under it. With the card right and everything around it unchanged, the phone still opened on the old door, and he said so.

## What was measured

- **Main at 390px, rendered before touching anything** (`?tlc=1`, Chromium, the dev server on the merged head): the first viewport was the bar, "Real Solutions for Real Life." twice (hideaway and card), the blurb twice, the Appearance toggle, three pill buttons, then the forest card with the floaters over "Continue without an account", then the bar. Zero page errors; the wrong shape.
- The tests that pin the door's first render and were kept green by design: the signed-out mount contains "Match a Preferred Provider" and every clinician, every anchor is `target=_blank`, the header carries the h1, the chevron, the tagline, the blurb and the `Comfort controls` group when open, and Sign in in the bar opens the entry. A welcome that REPLACED the door would have broken four suites; a welcome that stands IN FRONT of a fully mounted door breaks none.
- `header-hideaway.test.js` pinned the door's first-run default to "open" by source string. It now pins the per-width default by source string; PropertiesDoor is untouched.
- `chrome-layout-probe` loads `?tlc=1` at 360 and 768px at Big Print in both header states and requires a text-size control on screen; it measures rects, not occlusion, and the welcome is `position: fixed` with no overflow, so the probe's invariants hold with the screen in front.
- The one dated corner from DR-1171 (the More sheet under the floaters, `re-review: 2026-10-28`) is closed here: the open sheet rises to z-85, above the z-80 floaters, and drops back when closed.

## Impact

- A guest on a fresh open meets **the welcome screen**: the mark, TLC, Therapy Solutions, the gold rule, the tagline, the blurb, a forest **Sign in**, an outlined **Create an account**, and **Continue without an account**. Sign in and Create an account open the door's own entry (PasswordAuth, in the bar, on the right mode); Continue lowers the screen. The choice is remembered for the browser session, so an installed app shows the welcome at each launch, the way the reference does, and a reload mid-visit does not.
- The welcome never stands in front of a signed-in person, nor of anyone a link already lands somewhere (a lesson, the careers page, an onboarding invite).
- Past it, the **home**: the greeting with the person's picture (the profile's thumb) or the mark, the quote card on the forest field with the leaf, the quick actions two across, the schedule row, then the providers. On a phone the top space starts tucked (the slim bar: brand, Book, Sign in, chevron; the platform's own "Show header" row with the text size), the chevron brings the tagline, Appearance and share back, and the choice persists.
- The bar fills edge to edge with the sections this person has plus More; More is a list of rows with an icon well and a chevron.
- No feature added or removed; no route, gate or test contract moved. Shell untouched (5192).

## Decision

1. **The welcome is a screen in front of the door, not a card in it.** The door is mounted whole beneath; the screen is `fixed`, `role=dialog`, above the floaters, and `tlc-welcome.js` alone says when it stands there.
2. **A session remembers going past it.** `sessionStorage`, fail-soft; blocked storage shows the welcome again and breaks nothing.
3. **The top space starts tucked on a phone** (`firstHeaderCollapsed(isPhoneWidth())`); a saved choice always wins.
4. **Not built, still:** appointments, messages, progress, account — not features of this app (DR-1171 §4 stands).

## Verification

- `the-tlc-door-opens-on-its-welcome` 10 green; 11 door, hideaway, theme and role suites 148 green (the one right failure, the hideaway pin, re-pinned to the new promise, PropertiesDoor's pin untouched).
- Proven to catch: `welcomeShows` returning true for a signed-in person → red; the welcome rendered without `onContinue` lowering it → red (both restored).
- Lint 0; the gates green (decision-citation needed this record, which is how it should be).
- **Observed on the built door in a real browser at 390px**, five states: the welcome; the home after Continue; the More sheet; Mental skills; a reload inside the session opening on the home with no welcome. Zero page errors.
- Not observed from here: the signed-in home with a real picture (no account in the sandbox); the proof is Darrell's phone after the deploy.

## What this does not do

- **No photography** (DR-1171): the reference's welcome is a photograph behind the brand; this is the ivory field. Christina's own photos are the right source. **`re-review: 2026-11-04`.**
- The platform's "Show header" row under the tucked bar is the family shell's own escape hatch and stays; a slimmer form of it on the business doors is a shell decision. **`re-review: 2026-11-04`.**
- The family app's TLC tab stays the family's shape (DR-1156, unchanged).
