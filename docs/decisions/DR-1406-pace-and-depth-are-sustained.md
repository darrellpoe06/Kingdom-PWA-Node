# DR-1406: Pace and depth are sustained until you change them — they belong to the person on the device, not to the household snapshot

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (which keys the household snapshot carries; no schema, no money)
**Type:** bug fix
**Area:** `app/src/lib/snapshot-sync.js`, the app shell's snapshot pull, Learn → Pace & depth
**Sent in by:** Darrell, 2026-11-10, with a screenshot of Pace & depth back on Adult / Auto: "Pace and depth should be sustained unless it is changed..."

## Context

Pace (the age band) and depth (the depth override) are chosen once on the Pace & depth tab, and every course reads them. He found them reset to the defaults without having changed them.

## What was measured

Both settings live in the app's data object as `learnAgeBand` and `learnLevel`.

That whole object rides the household snapshot (`snapshot-sync.js`). The snapshot is one row per instance: last write wins, it is pushed on save, and it is pulled at sign-in. The pull merges it into this device's data with `{ ...d, ...snapData }`.

So a band chosen by another person, or on another device, in the same household overwrote his at his next sign-in. Nothing in the snapshot's exclude lists held them back.

## Impact

Pace and depth now stay exactly as he set them on his device, until he changes them there. A child choosing the child band on a tablet no longer changes an adult’s reading on a phone.

## Decision

`DEVICE_PREF_KEYS` (`learnAgeBand`, `learnLevel`) are excluded from every snapshot push.

On the pull, `withoutDevicePrefs` strips them from the incoming row before the merge. That covers older rows that still carry them, and it keeps this device’s own values.

Choosing a band, or reading a particular version from the record, still changes the band. Those are his own taps, so the setting is changed only when he changes it.

## Verification

`pace-and-depth-are-sustained.test.js` has 4 cases:

- The payload never carries the two keys.
- An incoming row that does carry them leaves this device’s values in place, while other data still updates.
- **Proven to catch:** the naive merge, the bug itself, is shown to reset the band.
- The shell applies the snapshot through the strip.

The existing `snapshot-sync`, `snapshot-slim` and `device-snapshot-rescue` suites stay green (43 tests in total with these).
