---
id: DR-0753
title: The Love Corner wears its own face in the shade and on the lock screen — every door's notification and reading card carry that door's icon and name, never PoeTech's "P" for all
status: accepted
date: 2026-10-02
tier: A
type: fix
declared_by: Darrell
scope:
  - app/src/lib/app-doors.js (each door names its icon + icon512, the same files its manifest installs; doorArtwork(pathname, search))
  - app/public/sw.js (DOOR_ICONS + DOOR_LABELS in step with DOORS; registrationDoor() reads the registration's scope; notifyIcon() / notifyTitle() replace the one icon and the one fallback title)
  - app/src/lib/background-audio.js (cardIdentity(win): the lock-screen / car card's artist and artwork come from the door the page booted as)
  - app/src/__tests__/sw-push-handler.test.js, app-doors.test.js, background-audio.test.js (door cases, the in-step derivations, proven-to-catch)
principles: [VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), SPEAK-ESTABLISHED-FACT (DR-0100)]
grounds:
  - DR-0174 / DR-0258 — the church installs under its own name and its own scope, with the church's own emblem (PR #793)
  - DR-0584 — the worker is registered once per door, at the door's scope, so the phone credits the app
  - DR-0444 — a notification lands in the door it belongs to
  - DR-0632 / DR-0718 — the reading holds a media session and the card names what is playing
---

## Context — the concern

Darrell, 2026-10-02, from the Love Corner app: *"Why does it show up as PoeTech App instead of the Love Corner App logo... why doesn't it have the correct logo?"*

The church's install identity was settled in July (DR-0174): poetech.us/lovecorner installs "The Love Corner" with the Church of the Living God emblem, under its own scope (DR-0258). So the question was where PoeTech's mark was still being painted on the church's app.

## What was measured

Every place the app shows its own face was traced on `origin/main` (966fff7d) before a line changed:

| Surface | What it showed for the Love Corner | Source |
|---|---|---|
| Install icon (home screen, splash) | The church emblem. `manifest-lovecorner.webmanifest` lists `/lovecorner-icon-*.png`; the file is the round CGLG seal (md5 differs from `icon-192.png`); `app/lovecorner/app/index.html` links the church manifest, icons and apple-touch icon | correct |
| Sign-in gate | The church emblem (`LOVE_CORNER_BRAND.logo` into PasswordAuth) | correct |
| Header lockup | Text only ("The Love Corner" / "The Church of the Living God"), no logo in either app | correct |
| **The notification in the shade** | **PoeTech's "P"**: `public/sw.js` had ONE `NOTIFY_DEFAULTS.icon = '/poetech-app/icon.svg'` for every registration, and a push with no title said "The Love Corner" under every door, the family's included | wrong, both ways |
| **The lock-screen / car card while a lesson is read aloud** | **PoeTech's "P" and the name "PoeTech"**: `background-audio.js` `describe()` defaulted `artist = 'PoeTech'` and `DEFAULT_ARTWORK = icon-192/512.png` for every door | wrong |

Which of the two Darrell saw is not known from his words; both are the same defect (one face hard-coded for five doors) and both are fixed here. The pre-existing tests pinned the wrong behaviour: `sw-push-handler.test.js` asserted the "P" icon and "The Love Corner" fallback for the scope-less worker; `background-audio.test.js` asserted artist "PoeTech" with no door.

## Impact

A member of The Love Corner sees the church's own emblem on every notification the church app shows and on the card the phone paints while a lesson reads, and a push with no title is shown under the church's name. The family app keeps PoeTech's face; Moore Divahs, TLC and Poe Properties each get their own, from the same list. Nothing about where a tap lands (DR-0444) or which registration shows a notification (DR-0584) changes.

## Decision

1. **A door carries its own face.** `DOORS` in `app-doors.js` gains `icon` and `icon512` per door: the same files each door's manifest installs with. `doorArtwork(pathname, search)` returns the two as media-session artwork for the door the page booted as (path first, then the printed-QR launch param, the DR-0731 rule).
2. **The worker reads the door it serves from its registration's scope.** `sw.js` carries `DOOR_ICONS` and `DOOR_LABELS` beside `DOOR_PATHS` (one list, derived in the test from `app-doors.js`); `registrationDoor()` maps `self.registration.scope` to a door; `notifyIcon()` is that door's icon, `notifyTitle()` that door's name. The legacy root registration (no door) falls back to PoeTech's icon and name. A scope that cannot be read never throws — the push still shows.
3. **The reading card says who made it.** `cardIdentity(win)` returns the door's label and artwork; `describe()` uses them unless the caller names its own.

## Verification

- `sw-push-handler.test.js` (36): the Love Corner worker shows `/lovecorner-icon-192.png` and the title "The Love Corner"; the PoeTech worker shows `/icon-192.png` and "PoeTech" (proven to catch); all five doors; a bare-path scope; an unreadable scope still notifies; `DOOR_ICONS` and `DOOR_LABELS` derived from `app-doors.js` and compared.
- `app-doors.test.js` (32): every door's two icon files exist in `app/public`; the church icon is not PoeTech's; `doorArtwork` on the church page, the family page and the printed-QR param.
- `background-audio.test.js` (17): a reading at `/lovecorner/app/` is credited to The Love Corner with the church artwork; the family page to PoeTech (proven to catch); a caller's own artist and artwork are kept; the no-location window is PoeTech.
- Also run green: `sw-door-scope`, `sw-scope-shell`, `sw-asset-cache`, `presenter-read-aloud` (129 tests across the seven files); eslint on the changed files.
- Not verified here (the sandbox has no route to a phone): the shade and lock screen on Darrell's own device after the deploy. That is the reviewer pass (DR-0104).

## Re-review

- **2026-10-16** — Darrell's phone: a Love Corner notification and a read-aloud card both wearing the emblem. If either still shows the "P", the remaining surface is named and fixed the same day.
