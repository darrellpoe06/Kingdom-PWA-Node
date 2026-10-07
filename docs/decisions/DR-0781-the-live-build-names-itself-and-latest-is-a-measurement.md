# DR-0781 — The live build names itself, and "Latest" is a measurement

- **Status:** accepted
- **Tier:** A (a build artefact, three cache headers, one watch in the update module; the reload is guarded by the existing loop sentinel)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/vite.config.js` (`dist/build.json`), `app/public/_headers` (`/sw.js`, `/build.json`, `/poetech-app/build.json` never cached), `app/src/lib/sw-update.js` (`fetchLiveBuild`, `compareBuild`, `watchLiveBuild`, `BUILD_BEHIND_EVENT`), `app/src/lib/freshness.js` (the dot flips on the server's verdict), `app/src/components/FreshnessDot.jsx` (a tap with no worker reloads), `app/src/main.jsx`, `app/src/__tests__/sw-update.test.js`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: measure, don't claim; DR-0125: unknown never reads as fresh), DR-0107 (the deploy is proven, now on the device too), DR-0219 (SHOULD / ARE / GAPS / CLOSE)
- **Grounds:** Darrell 2026-10-07, three screenshots and *"It doesn't work!!!"*, *"Tests are not working if you keep saying it works then doesn't when I try it!!!"*: a tablet reading "BUILD 847EC24 · LATEST" at 8:20 CDT while main's deploy 1494 (10b6419) had been live since 12:59 UTC; six deploys behind; "Snapshots every 5 s", the HLS road and the "0 s" copy all from the old code.

## Context

SHOULD: a deploy reaches every device, and the header says truthfully whether it has. ARE: the header's "Latest" meant only "no new service worker is waiting here" (a statement about the device); the worker was fetched from `/sw.js` while the no-store header covered `/poetech-app/sw.js`; nothing on the device ever asked the server which build was live. GAPS: a device could run stale code for hours and call itself latest; tests proved the code and the site served it (site-health), but nothing proved the device ran it.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| the device | build 847ec24 at 13:20 UTC | screenshot |
| the site | 10b6419 deployed 12:56 to 12:59 UTC (run 1494), 6b59aa3f at 12:38, 793cb206 at 12:19, acad3221 at 12:03 | deploy-cloudflare-pages runs |
| what "Latest" read | `updateWaiting(window)`: a waiting worker or not | `lib/freshness.js` |
| the worker's URL vs the header rule | registered `/sw.js`; rule on `/poetech-app/sw.js` | `sw-door-scope.js:105`, `_headers:48` |
| the shell's road | navigations fetched network-first with `cache: 'no-store'` | `sw.js:192` (so a reload lands on the new build even when the worker path fails) |

## Impact

Unresolved: every fix shipped today could sit undelivered on his devices while the app said otherwise. Resolved: the app fetches the deployed build's name (never cached) on load, on every visibility regain and every ten minutes, says "behind" when it is, asks the worker to update, and if no worker appears within eight seconds performs one guarded reload that lands on the new build; a reload that does not stick is said as stuck, never repeated.

## Decision

1. `vite.config.js` writes `dist/build.json` `{sha, time, sw}` beside the bundle. `_headers` forbids caching it, and forbids caching `/sw.js` at the path the browser actually fetches.
2. `watchLiveBuild` compares `build.json`'s sha with `__BUILD_SHA__`: same is "latest" (now a measurement), different fires `BUILD_BEHIND_EVENT`, calls `registration.update()`, and arms one reload after `BEHIND_RELOAD_MS` that stands down if a worker has appeared. The reload marks the same sentinel as the worker path; a page that reloaded for this verdict and is still behind marks stuck. Unreadable is unknown: nothing said, nothing done.
3. The freshness dot flips red on the server's verdict even with no waiting worker; a tap with no worker to apply reloads the shell.

## Verification

- `sw-update.test.js`: compareBuild (same / different / dev / unreadable), fetchLiveBuild (no-store, cache-busting query, sha + time, a miss is null), same sha does nothing, behind fires the event and asks the worker and reloads once with the sentinel set and never a second time, a worker appearing in time stands the reload down, a reload that did not stick says stuck, unreadable does nothing. 28 tests.
- After merge: the next deploy writes `build.json`; a device on the old build reads it on its next visibility regain and comes forward; the header on Darrell's tablet reads the new sha. Recorded on the PR when his screenshot shows it.

## Follow-ups

- The outside witness (site-health) can fetch `build.json` and compare it with main so "deployed" is read from the artefact itself, not inferred from the run. `re-review: 2026-10-14`.
