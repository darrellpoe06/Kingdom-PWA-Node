# DR-0157 — Stay on the previous build until the new one is downloaded: the update model every real app uses

- **Status:** accepted
- **Tier:** B — a boot-path strategy change, shipped only with the full gate run + a real-browser boot-check on the deployed serve (DR-0107); the heal ladder and one-tap update remain as the brakes
- **Scope:** `app/public/sw.js` (full-build precache + cache-first in-scope navigations), `app/vite.config.js` (sw-precache-stamp: the build writes its own asset list into the worker), `app/public/watchdog.js` + `app/index.html` (the last line under the boot chain), `app/src/main.jsx` (`__PT_BOOTED`), `app/src/__tests__/sw-asset-cache.test.js` (the strategy pinned)
- **Date:** 2026-07-10
- **Principles:** QUALITY-OF-LIFE (the family's app must not go blank), PERPETUAL-PIPELINE-HEALTH, VERIFICATION-DOCTRINE, LESSONS P32, ANXIETY-CLARITY

## Directive

Darrell, 2026-07-10, after his third blank/heal screen of the day: *"I've never had an app do this — it's just on the previous build until you download it… why does ours?"* And: *"App is still down dead… needs revival."*

## The verified why (P32, condensed)

Two prior fixes combined badly: the per-build chunk stamp (DR-0139/#715) renames every file each deploy, and the network-first no-store shell (the 2026-06-03 iOS-staleness fix) walks every navigation into the newest shell — so during each deploy-propagation window (~7–12 min, twice measured on #722) devices fetched a shell whose pieces weren't reachable and got HTML where modules should be. Zero JavaScript ran; the family photographed the blank.

## Decision — two device-side layers (the serve-side third is DR-0155’s asset guard, landed by a sibling lane the same hour)

1. **The device serves its own COMPLETE build.** The worker precaches the shell AND the full hashed asset set (the build stamps its own list into `sw.js`); in-scope navigations are served cache-first from that per-build cache. Install is all-or-nothing: during a deploy window the new worker's install fails whole and the OLD worker keeps serving the OLD complete build — the window becomes invisible. Updates flow the way real apps update: the browser refetches `sw.js` per navigation (no-store headers) plus the periodic checks; the new build downloads entirely in the background; the freshness dot / "Download the latest" / SKIP_WAITING swap it whole. `/moore/` and other static doors are out of scope and untouched; the redirect guard stays.
2. **Missing assets answer 404, never HTML.** `404.html`'s presence turns off the SPA fallback for missing files — the HTML-as-module poison class dies; retry and heal paths can act on an honest 404.
2. **A watchdog that survives everything.** First visits (no worker yet) during a window used to die with zero JavaScript. `watchdog.js` — a stable, unhashed, CSP-`'self'` file — retries once with a cache-bust if the entry module never sets `__PT_BOOTED`, then says something honest instead of staying blank. (Measured note: inline scripts are CSP-blocked on production — the old inline modulepreload script never ran; cleanup routed below.)

## The trade, stated plainly (DR-0100)

The 2026-06-03 class this strategy replaces — a stale shell hiding a shipped fix — is held off by different doors now: the shell in the cache was fetched `{cache:'reload'}` at install, every prior cache is dropped on activate, update checks run per navigation and on the timer, and the one-tap update + heal ladder remain. A device that never navigates and never runs a check can sit on the old build longer than before — that is the same behavior as every installed app, and it is the behavior the Governor asked for by name.

## Opportunities and constraints (routed)

- **Opportunity:** the dead inline modulepreload script in `index.html` (CSP-blocked, measured) should be removed or hashed into the CSP — it currently does nothing. `re-review: 2026-07-17`.
- **Opportunity:** Web Push "update ready" notifications ride the DR-0152 package lane (his "push from our site" ask).
- **Constraint (held):** the full-build precache downloads the whole build per deploy in the background (~a few MB) — the cost of wholeness; unchanged hashes are HTTP-cache hits and cheap.

## Supersedes / pairs

Supersedes the network-first no-store navigation strategy (2026-06-03 / DR-0139-era `sw.js`). Pairs with DR-0155 (the sibling lane’s serve-side asset guard — missing assets answer 404, never a cacheable lie; the two compose: the serve answers honestly, and this device never has to ask mid-window), LESSONS P32, incident #722, DR-0145 (the heal ladder this mostly retires from daily duty), DR-0153 (the install door this keeps alive during deploys).
