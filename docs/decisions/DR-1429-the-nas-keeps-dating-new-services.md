# DR-1429: The NAS keeps dating new services, so no month loses one

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** B (a NAS rider's rest rule; The Word's feed window)
**Type:** bug fix
**Area:** `infra/church-media-golive/choir_dates_install.sh`, `app/src/components/Pulpit.jsx`
**Sent in by:** Darrell, 2026-11-11, with a screenshot of November 2026 now filled (5 messages, 929 in all), asking: "Is it fixed for all months?"
**Pairs with:** DR-1427 (months fill from the channel), DR-0248 (loop brakes), DR-0076

## Context

DR-1427 lets an archived row with no date borrow its video's date from the channel feed. That covers only the videos still in the feed. A Sunday title with no date in it, such as `iVmQ0ioX6Bc` "I Can Do All Things…" from 2026-11-09, is stored with no service date.

## What was measured

- **The dater stops for good.** The NAS dater, the `choir-dates` rider, writes a `choir-dates.DONE` marker once its backlog is empty. After that, `choir_dates_install.sh` exited at its first check on every cycle and never looked again. New dateless services from the channel stayed dateless.
- **The feed window is short.** The app read only the newest 8 videos from a feed that carries 15. Once a dateless service aged past them, it would fall out of every month.

## Impact

Every month keeps every service. A dateless one is dated on the NAS within about 6 hours of arriving, and until then it borrows its date from a feed window nearly twice as long.

## Decision

- **DONE rests the rider instead of stopping it.**
  - While the marker is under 6 hours old, the rider does no work.
  - After 6 hours it clears the marker, makes one cheap read for dateless rows, and dates any it finds within its existing chunk and time budget.
  - `choir_dates_sync.py` writes the marker again when nothing dateless remains.
  - Once the backlog is empty, that is at most 4 checks a day.
- **The library reads the whole feed:** `parseYoutubeFeed(xml, 15)`.

## Verification

`the-word-months-fill-from-the-channel.test.js` gains 3 cases, 11 in all:
- The marker block runs in a real shell. A fresh marker rests the rider and keeps the marker.
- **Proven to catch the old forever-DONE:** a 7-hour-old marker is cleared and the dater runs again.
- The library reads 15 videos from the feed.

`services-sync-guard` and `a-service-comes-home` pass (62 tests with the above).

**Not verified here:** the NAS's next run, which the sandbox cannot reach. Its witness is loops-health's `choir` lines and the month list itself.
