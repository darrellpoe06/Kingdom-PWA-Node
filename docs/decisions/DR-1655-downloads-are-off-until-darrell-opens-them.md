# DR-1655: Downloads are off until Darrell opens them

**Date:** 2026-11-25
**Status:** Accepted
**Tier:** B (closes a door; opens nothing; no schema)
**Type:** product
**Area:** `app/src/lib/lesson-download-access.js`, `app/src/components/DownloadAccess.jsx`, `app/src/components/LessonDownloads.jsx`, `app/src/__tests__/lesson-downloads-are-paid.test.jsx`, `app/src/__tests__/lesson-downloads.test.jsx`, `app/src/__tests__/lesson-share-public-route.test.jsx`
**Sent in by:** Darrell, 2026-11-25: "We actually don't want downloads unless we have a specific reason... so make that behind a control... no one can by default... asking the administration for copies of the content... however I'm not allowing it currently... but want to be able to at will."
**Pairs with:** DR-1652 (a download is PoeTech+ or the Download Pass), DR-0698 (downloads need an account), DR-1654 (the new look has no download of its own)

## Context

DR-1652 made taking a lesson away paid: PoeTech+ (or higher) or the Download Pass. Darrell now wants no one to take a lesson away by default, at any tier, until he chooses to open it, and wants a way for a person to ask the administration for a copy.

## What was measured

- Every way of taking a lesson away reads one answer, `downloadAccess`: the offline download (`LessonDownloads` Door), Copy lesson and the curriculum export / print (`DownloadGate` in `ChurchLearn.jsx`). Before this change a PoeTech+ account opened all of them.
- After it, with the switch at its shipped value, a PoeTech+ account on Paper & print sees "Downloads are closed right now" and "Ask the administration for a copy", and no "Download .md" (`lesson-share-public-route.test.jsx`).

## Decision

1. **One switch, `DOWNLOADS_OPEN`, ships `false`.** Off means `ACCESS.CLOSED` for everyone: every tier, with or without the pass, signed in or not. Anything but `true` reads as closed (fail closed).
2. **The closed door offers a copy request.** "Ask the administration for a copy" sends a request on the existing feedback pipe (`feedback` table, the space the person stands in, triaged by the stewards). The door reports only what really happened: sent, sign in first, or did not send.
3. **On, the DR-1652 rule decides unchanged** (PoeTech+ or the pass), and its tests run against the switch turned on so that rule stays proven for the day it opens.
4. **Only Darrell's word flips it.** It is one line, shipped through the lane on his say. Reading and ▶ Play stay free for everyone either way.

## Impact

- No one can download, copy the full text, or export a lesson today. Nothing else in Learn changes.
- Copy requests arrive with the stewards' feedback, labeled "Learn: copy request", with the page they came from.

## Verification after merge

- 81 of 81 pass across the six suites that touch downloads. New cases: the switch ships off; off is closed for every tier and the pass, and for a non-boolean value; the gate shows the closed panel and the copy request for PoeTech+; a copy request reports sent / sign-in / failed truthfully; Paper & print is closed for PoeTech+ by default.
- Darrell sees "Downloads are closed right now" on a lesson's download door on his phone.

## Not yet built

An in-app switch the office can flip without a deploy needs a stored setting (a schema change, Tier C). Until then the switch is the one line above. `re-review: 2026-12-09`
