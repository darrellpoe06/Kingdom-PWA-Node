# DR-0950 — A slow road is not a dead one

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/modules/properties/PropertiesApp.jsx` (`boot`)
**Gate:** `app/src/__tests__/a-slow-road-is-not-a-dead-one.test.jsx`

## Context

Darrell, 2026-10-11 00:20: **"Properties tab in PoeTech App is frozen!!!"**
Then, minutes later and with nothing done to it: **"It's back...."**

## What was measured

His card showed all four spine reads `not-reached`. In the same minute
`site-health` measured `PAGES_CODE 200` and `BACKEND_CODE 200` from a GitHub
runner, and a read of the live database counted all 67 of his photographs.

His **phone** could not finish four round trips inside the 6s ceiling. With
Pages Functions dark (#2057) the app runs on the absolute Funnel URL, which
throttles cross-origin, and he had just pushed forty photographs through it in
ten minutes. The road was throttled for him specifically — which is exactly
why a runner saw 200 at the same moment.

## Impact

A page that dies on a slow road and waits for a human to tap TRY AGAIN is a
page that could have healed itself; his "It's back" is the proof that waiting
was all it needed. The honest card did its job — nothing was invented — but
the recovery was manual.

## Decision

On **all four** spine reads failing — which is about the ROAD, where one or
two failing is about DATA and must be shown honestly — read again once, with
twice the room. `boundedRead` never cancels the request ("a late answer is
simply ignored"), so this asks again for something probably already in flight.

**The first version of this was wrong and a gate caught it.** Awaiting the
retry inline turned a 6-second wait into an 18-second one, and
`properties-never-hangs` exists precisely to stop this surface sitting on
"Opening your properties…". A fix that lengthens the freeze is not a fix. The
page now resolves on time and says the honest thing; the retry runs after, in
the background, and replaces the answer if the road was merely slow.

## Verification

Proven to catch: retry removed → "the spine was not asked a second time:
expected 4 to be 8"; a healthy road asks exactly 4 times and never retries;
and `properties-never-hangs` passes **with** this change, which is what makes
it a fix. 1051 green.

**Not fixed here:** Pages Functions, dark since 2026-10-09, is the actual
cause and needs a hand in the Cloudflare dashboard. This makes the symptom
survivable, not absent. **re-review: 2026-10-17.**
