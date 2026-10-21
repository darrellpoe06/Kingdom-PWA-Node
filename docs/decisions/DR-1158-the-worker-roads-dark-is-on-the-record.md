# DR-1158: The Worker roads' dark is on the record — a carve-out that dies the day the token is re-reviewed

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (a registry entry in the witness; the run still fails; no route, no schema, no money moves)
**Type:** orchestration (the site witness)

**Area:** `scripts/site-health-verdict.mjs` (`KNOWN_OUTAGES`, a second entry `cf-roads-worker`), `app/src/__tests__/the-witness-is-not-a-constant.test.js` (seven cases). Nothing in `.github/workflows/site-health.yml` changes.

**Principles:** DR-0975 (the witness is not a constant: a known outage is named, not repeated; every carve-out expires); DR-0125 (the site has its own witness); DR-0076 (unknown never reads as pass; the run keeps failing); DR-1124 (the witness sees the Worker roads); DR-1068 (the same-origin roads as a zone Worker); DR-0075 (a deferral carries a why and a `re-review:` date).
**Declared by:** the agent, 2026-10-21, on the ledger's own evidence (issue #2057).

---

## Context

The site witness (`site-health.yml`, DR-0125) names a known outage once and writes it to the incident ledger once a day (DR-0975), so a genuinely new fault stands out. Since #2285 taught it to look for the poetech-roads Worker, its one unchanged reading has been written as new on every run, because no carve-out knew it.

## What was measured

- **The reading.** Since #2285 (DR-1124) taught `site-health.yml` to ask `GET poetech.us/edge/whoami`, every run has reported one reason: the SPA shell (`200`, `text/html`) where the poetech-roads Worker's JSON 401 belongs. First seen by run 39507209827 at 2026-10-20T22:20Z; last by run 39551336752 at 2026-10-21T05:45Z, with `served=1798c64 main=1798c64`, `pages.dev shell 200`, `backend auth 200`, preflight 200 and the records road answering (POST 400, 81 bytes). The site is up and fresh; the Worker has never been deployed on its route.
- **Why it is unreachable from here.** `cf-roads-worker.yml`'s read-only probe (run 39508087503, 2026-10-20T22:28Z): the repository's `CLOUDFLARE_API_TOKEN` verifies `active` and lists **0 zones** and **0 Workers scripts**. It is a Pages-only token. `wrangler deploy` needs Account > Workers Scripts:Edit and Zone > Workers Routes:Edit for poetech.us, which only Darrell can mint in his Cloudflare dashboard.
- **The defect this record fixes.** The reason matched no entry in `KNOWN_OUTAGES`, so every run read `NEW` and wrote **"A FAULT NOT ALREADY ON RECORD"** to #2057: comments 6303066583 (22:20), 6303818861 (23:08), 6305786987 (01:32), 6309027619 (05:45), four in eight hours, each with a dead-bell note under it (the announce bearer answers 401; a separate hand step, the `VITE_N8N_BEARER` secret). That is the 29-comments-in-65-hours shape DR-0975 exists to end, and it buries a real new fault.

## Decision

`KNOWN_OUTAGES` carries a second entry, `cf-roads-worker`: head `THE WORKER ROADS ARE DARK TOO`, tail `the wrangler zone route or the Worker's own deploy is the place to look` (the stable ends of the add_fail; the middle interpolates the measured code and content-type), `since` 2026-10-20T22:20:24Z, `issue` 2057, **`until` 2026-10-28**. The `reach` names the hand that fixes it and the run that proved the token short.

The run **still fails** on every probe while the Worker is dark (`exit 1`, pinned by the suite). What changes: the verdict reads `KNOWN`, the ledger note is written once a day instead of once a run, the bell follows the same throttle, and a genuinely new fault still reads `NEW` beside it.

## Impact

Unresolved, the ledger on #2057 grows by one "new fault" note per run (four in eight hours) and the next real fault arrives as one more comment nobody reads; the run stays red either way. The carve-out keeps the run red and the ledger readable, and dies on its own date so it cannot quietly outlive the fault.

## What is deferred, and why

Deploying the Worker. It is a value only Darrell holds (a Cloudflare API token with the two Workers scopes), saved as the repository secret, then `cf-roads-worker.yml` dispatched with `deploy=yes`; the workflow reads the live domain back and fails if the shell is still served. Nothing here can mint the token.

`re-review: 2026-10-28` — the same day the carve-out dies. If the token has not landed, the reading goes loud again by design, and this record is either extended by a new DR with the reason or closed by the deploy.

## Verification

- `the-witness-is-not-a-constant.test.js`: the real reason (verbatim from run 39551336752) reads `KNOWN` with day 0 and the hand named; **proven to catch**: with the entry filtered out the same reading is `NEW` on all four runs and all four write (the fault), with it one note for the night; both known outages at once read `KNOWN` with the day counted from the older; SIGN-IN beside it still `NEW`; the entry is live through 2026-10-28T23:59 and loud at 2026-10-29; the head and tail are the words `site-health.yml` really writes.
- The run-still-fails, run-log-every-run, marker and verdict-order source pins are unchanged and green.
