# DR-1427: A new service fills its month the day it posts, and the NAS carries it home itself

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** B (a NAS rider on the armed clock, a retired workflow schedule, The Word's month list)
**Type:** bug fix
**Area:**
- `app/src/lib/the-word-channel-rows.js` and `components/Pulpit.jsx`, the message library
- `infra/nas-supabase/content_sync_install.sh` and `infra/nas-loops/services.json`
- `.github/workflows/sovereign-content-sync.yml` and `loops-health.yml`

**Sent in by:** Darrell, 2026-11-11, with a screenshot of The Word → Migdal. The stepper sat on October 2026, and five November services sat in a "Just posted · joins the archive shortly" strip above it. His words: "the months are not populating in the next month!!!! Fix it for all months... this was an issue before".

**Pairs with:** DR-0442 (the same failure, 2026-09-16), DR-1360 (the NAS starts the road itself), DR-1119 (the path every new service follows), DR-0248 (loop brakes), DR-0076

## Context

The library reads the sovereign database. New services are filed on the hosted project and carried across by `content_sync.py`. Only a GitHub runner ran that carry, over the tailnet.

## What was measured

- **The lane failed.** `sovereign-content-sync.yml` failed on all eight scheduled runs from 2026-11-04 to 2026-11-11. The tailnet join was refused with "backend error: invalid key: API key does not exist". The same expired key is why about ten NAS health witnesses are red tonight.
- **The rows were waiting.** The hosted database holds November services that never reached the archive, for example `iVmQ0ioX6Bc` (filed 2026-11-10) and `7aCAdw5W-Nc` (2026-11-05).
- **The page already had them.** The channel feed showed these services, but in a strip outside the month list, so "This month" read empty.

## Impact

Every month fills the day a service is posted, whether or not the carry has run. The NAS also carries the rows to the archive itself, every six hours, with no runner key.

## Decision

- **Every month, in the app.** `withChannelRows` adds each channel video the archive doesn't hold yet as a row in the same list.
  - The row's date comes from the title, or else from the YouTube publish day.
  - It is marked "New · from the channel" and is read-only.
  - It gives way to the archive row when that row arrives.
  - An archived row with no date takes the same video's channel date.
  - The separate strip is gone.
- **The NAS carries the rows itself (DR-1360).** The `content-sync` rider runs on the already-armed services-sync clock.
  - It runs `content_sync.py --commit` once every 6 hours, 4 times a day at most.
  - Each run stops after 420 seconds, under the 480-second limit per rider.
  - It is idempotent.
  - To stop it, set `enabled: false`.
  - It is registered in the system flow map.
  - Its witness is `loops-health.yml`, which checks its install path, its `content-sync:` log lines, the heartbeat receipt and its own output file.
- **The runner road is retired.** `sovereign-content-sync.yml` loses its schedule and stays as a hand-run measurement.

## Verification

- **`the-word-months-fill-from-the-channel.test.js`, 8 cases, built from the screenshot's own titles.** November appears beside October with all four services, and no row is doubled. A dateless title takes its publish day. A service posted after midnight on New Year's lands in January.
  - **Proven to catch:** the archive alone, which is what Darrell saw, has no November.
- **Suites.** The 30 suites that read the changed registries pass (599 tests), and so do the 11 `Pulpit` suites (138 tests). The services-sync, nas-loops and a-service-comes-home gates now include `content-sync`.
- **Guards.** The interconnect, workflow-register (at its 22,854-line ceiling), contrast, legibility and file-budget guards pass.

**Not verified here:** the first NAS run, which the sandbox cannot reach. The witness is loops-health and the month list itself. **His hand:** a fresh tailnet auth key restores the witnesses that still use the runner road.
