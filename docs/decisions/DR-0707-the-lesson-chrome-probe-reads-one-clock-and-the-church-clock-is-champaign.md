# DR-0707 — The lesson chrome probe reads one clock, and the church's clock is Champaign's

- **Status:** accepted
- **Tier:** A (a probe made deterministic, a schedule read in the zone it is posted in, and three chrome rows made smaller on a phone; no data, no money, no schema)
- **Type:** gates + surface
- **Date:** 2026-09-30
- **Scope:** `scripts/chrome-layout-probe.mjs` (the pinned zone and Date, the live bar counted as chrome, two service-window lesson cases); `app/src/lib/church-live.js` (`liveStatus` reads the church's zone, `CHURCH_TIME_ZONE`); `app/src/components/LiveWorshipBar.jsx` (video folded while a lesson is open on a phone, slimmer strip, `data-live-bar`); `app/src/lib/live-player-prefs.js` (the show/hide choice is three-valued); `app/src/components/PublicWelcome.jsx` (one row on a phone); `app/src/components/ChurchGiving.jsx` + `app/src/index.css` (the Give pill shares the read-aloud row on a phone; the welcome line folds under the live bar); tests `church-live`, `live-worship-bar`, `live-player-prefs`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3, anti-theater), COMPREHENSIVE-REVIEW (DR-0239 dim 4), the DR-0438 ratchet (the 460px budget only moves down), HOLD-THE-HAND (DR-0621)
- **Grounds:** the required CI leg `app — chrome-layout probe` failed on every PR from 21:33 UTC 2026-09-30 (`LAYOUT FAIL lesson@360px: chrome covers 486px of the 900px first viewport — over the 460px budget`), after passing at 21:24 UTC with no chrome change on main.

## Context

The same commit measured differently by the hour. `liveStatus` read the posted service times ("Wednesday 6:00 PM") on the device's own clock, so on a UTC runner the Wednesday evening window ran 17:40 to 21:30 UTC. Inside it the pinned live-service bar opened at the top of every page; the probe did not count that bar as chrome and it pushed the header down, so the lesson passed. At 21:30 UTC the bar closed, the header came back to the top, and the lesson read 486px. The same device-zone reading put a member travelling, a relative on the coast, and the runner in three different windows, none of them Champaign's.

## What was measured

Lesson 1 at 360x900, the chrome union the probe computes (live bar, header, lesson bar, comfort bar, floaters):

| State | Before | After |
|---|---|---|
| Quiet hour, header open | 486px (fail) | 406px |
| Quiet hour, header collapsed | 372px | 282px |
| Service window, header open | 728px, the live bar alone 289px (fail) | 416px, live bar 38px |
| Service window, header collapsed | 614px (fail) | 292px |
| Big Print, header open | 448px | 376px |

A second finding: Playwright's `page.clock.install` fakes the timers too. It deferred the lesson's 140ms landing timer until after the probe's Teach tap, so the page scrolled 1469px into the lesson and read 169px. Same config, two answers. So the pin now shifts only `Date`, and the timers remain the browser's own.

## Impact

A green probe now means the same thing at every hour, and it measures the live state on purpose instead of by accident. During a service a phone reader keeps the lesson words: the video starts folded to its one-line strip while a lesson is open (one tap on ▸ brings it back, and the choice holds for the session). The live window opens by Champaign's clock for every viewer, wherever they are.

## Decision

1. The probe opens every page in `America/Chicago` at a pinned instant. It uses a quiet Tuesday morning by default, and Wednesday 6:10 PM for two lesson cases, which must see the live bar open. A quiet case that sees the bar, or a service case that does not, fails as not measured. The live bar counts as chrome.
2. `liveStatus` computes windows in `CHURCH_TIME_ZONE` (`America/Chicago`). If the runtime cannot resolve the zone, it falls back to the device clock rather than guessing.
3. The 460px budget is unchanged. On a phone, the chrome is cut instead:
   - The welcome line fits on one row.
   - The Give pill sits beside the read-aloud button.
   - The live bar's strip is slimmer, and its video starts folded while a lesson is open.
   - The welcome line folds away while the live bar names the church above it.

## Verification

- `church-live.test.js` covers these instants:
  - 22:00 UTC Wednesday is 5 PM Central and is not live.
  - The pre-roll opens at 22:40 UTC, not 22:39.
  - CST is honoured.
  - `next.at` is the real instant.
  - It passes under TZ=UTC, Asia/Tokyo and America/Los_Angeles. Proven to catch: on the pre-fix `church-live.js` under TZ=UTC, 9 of 29 tests fail.
- `live-worship-bar.test.jsx` checks the phone-lesson fold, the wide-screen and no-lesson cases, the viewer's choice winning, and `data-live-bar`.
- `chrome-layout-probe.mjs --sweep` passes with 9 of 9 lesson cases measured. The same probe against the pre-fix build fails the three states above, which is the new cases' proof. `--selftest-break` trips 28 checks.
