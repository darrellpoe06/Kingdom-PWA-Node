# DR-1607: No road leaves its mount, and the /n8n road is closed

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (the Pages roads; no NAS change, no schema). The NAS-side retirement of the n8n container is Tier C and is NOT done here.
**Type:** security fix
**Area:** `app/functions/_lib/funnel-proxy.js`, `app/functions/n8n/[[path]].js`, new `app/src/__tests__/no-road-leaves-its-mount.test.js`
**Supersedes in part:** DR-0617 (its hold on the /n8n road only)
**Pairs with:** DR-0617 (n8n is gone), DR-0218 (the n8n root shrinks to zero), DR-1092 (every road signs itself), DR-0076, DR-0219
**Research:** `docs/99-session-notes/2026-11-19-installer-class-exposure-review.md`

## Context

On 2026-11-18 Drupal published SA-CORE-2026-017: the leftover `core/install.php` lets an unauthenticated visitor attempt a reinstall and take over the site. Darrell asked for our apps to be checked for that class. We run no PHP or Drupal. The same class was present in two other places:

1. `/n8n/*` stripped its prefix and forwarded ANY path to the Funnel root, which is the legacy n8n. That made n8n's editor, REST API, first-run `/setup` and `/form/*` reachable from poetech.us. No app code calls this route.
2. Every road joins its path segments onto the Funnel origin, and fetch's URL parser collapses dot segments, encoded ones included. `/sb/%2e%2e/rest/owner/setup` was fetched as `FUNNEL/rest/owner/setup`, which is the n8n root.

## Decision

- `/n8n/*` answers a signed `410 Gone` and fetches nothing. The file stays so the route does not fall through to the SPA. It is deleted together with the NAS n8n container.
- The shared proxy factory refuses (signed `400 mount-escape`, nothing fetched) any segment that is `.` or `..` in any `%2e` spelling, contains `/`, `\`, `%2f` or `%5c`, or does not decode.

## Supersedes in part: DR-0617's hold on `app/functions/n8n/[[path]].js`

DR-0617 held this file "until the n8n container is stopped", because traffic from outside the current bundle (older installed native shells, cached builds) could not be measured. This record closes it earlier, while the container still runs. Darrell's direction on 2026-11-19 was "We should not be using n8n!!!", and the road was the public door onto n8n's setup and REST surfaces. Known effect: any old build that still calls `/n8n/webhook/*` now gets a clear 410 instead of reaching n8n. Today's bundle has zero such callers. `native-shell.js:44` only rewrites the prefix. Outside-bundle traffic remains unmeasured. The rest of DR-0617's HELD list is unchanged.

## What was measured

| what | measured |
| --- | --- |
| `new URL(FUNNEL+'/sb/%2e%2e/rest/owner/setup').pathname` | `/rest/owner/setup` |
| app callers of `/n8n/webhook/*` (`app/src`, tests excluded) | 0 |
| new test with the guard disabled | 8 of 17 fail (each escape spelling) |
| new test with the guard, plus 8 road suites | 99 of 99 pass |

## Not done

The Funnel root still serves the whole n8n app on `poetech.tail5a2f35.ts.net` (unpinned `latest` image, secure cookies off). Closing it means stopping a running NAS service and changing the public transport, so it is sequenced in the research note §3: measure from a runner, stop n8n, drop the `/` handler, delete the rows. `re-review: 2026-11-26`
