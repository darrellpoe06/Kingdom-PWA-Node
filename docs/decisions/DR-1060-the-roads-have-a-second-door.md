---
id: DR-1060
title: The roads have a second door — the same-origin transport as a zone Worker, above the Pages project that stopped invoking its Functions
date: 2026-10-16
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: session_01UyvwuXazJyx2GG9zw9r67Z — Christina, 2026-10-16, on the Cloudflare dashboard: "You have access to!!!!!! You do it!!!!!"
---

# DR-1060: The roads have a second door — the same-origin transport as a zone Worker

**Date:** 2026-10-16
**Status:** accepted
**Tier:** C (the front door's transport; every signed-in road of the family app and the church door)
**Type:** way
**Area:**
- `infra/cf-roads-worker/worker.js` (new — the Pages proxy factory ported to a Workers module, with the road table)
- `infra/cf-roads-worker/wrangler.toml` (new — one zone route per road on `poetech.us` and `www.poetech.us`)
- `.github/workflows/cf-roads-worker.yml` (new — dispatch-only: a read-only probe, and the deploy on request, read back from the domain)
- `scripts/system-flow-registry.mjs` (the workflow's place in the flow graph: it writes the live site and seeds site-health)
- `app/src/__tests__/the-roads-have-a-second-door.test.js` (new — 51 cases)

**Grounds:** Christina, 2026-10-16, in the Cloudflare dashboard on her phone after I had asked her to look for the cause by hand: **"You have access to!!!!!! You do it!!!!!"** — and DR-0108 (Review Our Ways: a stated "must be by hand" is an unverified premise to challenge). The team's reach includes GitHub runners that hold the Cloudflare token.
**Principles:** DR-0076 §1 (no claim without evidence: the deploy fails unless poetech.us answers JSON), §3 (proven-to-catch), §8 (what is not measured is said so); DR-0307 (the sovereign stack rides one same-origin door); CLAUDE.md Layer 0 (the app reaches the NAS by a same-origin transport, never the absolute Funnel URL); DR-0108; DR-0111.

## Context

Since 2026-10-09 no Cloudflare Pages Function on `poetech-app` is invoked (#2057, 39 ledger comments, day 7). `/sb`, `/cams`, `/nas-photos`, `/taxes` and every other NAS-backed road answer the SPA shell — on the custom domain, on the pages.dev alias and on every per-deployment host — while every deploy logs "Compiled Worker successfully / Uploading Functions bundle / Uploading _routes.json" (read again today on run 38853115403, wrangler 3.90.0). The 2026-10-15 diagnosis read Cloudflare's own project record: deploys succeed, configuration unremarkable, Functions dark. Nothing in this repository reaches that fault, and a Cloudflare ticket is written (#2215).

The same day the Functions went dark, the deploy workflow was unlocked to build the client against the **absolute Funnel origin** (`https://poetech.tail5a2f35.ts.net/sb`, plus the camera, voice and photo roads), breaking Layer 0 on purpose so the family was not locked out, and writing its hazard down: the Funnel throttles cross-origin browser fetches, and "may begin firing under real family load." Six days later Darrell met three 15-second silences in one hour at The Love Corner (the Choir tab, My Record, the harvest ledger) and Christina photographed two more (DR-1054 corrected the witness; #2210 made the ledger say so instead of loading forever). The witness's single cross-origin sign-in POST from a datacenter answers healthily (400, 81 bytes), so the fault on phones is still unmeasured — and a probe of one request cannot see a throttle that fires under a burst.

## What was measured

- The deploy log, run 38853115403: Functions bundle uploaded, `_routes.json` uploaded, deployment complete — and the roads still serve the shell. Cloudflare's side.
- The production build's `VITE_SUPABASE_URL` is the Funnel origin (the `REPOINT-ARMED` unlock, in force since 2026-10-09). Every records call from a phone is a cross-origin request to the Funnel.
- `app/functions/_lib/funnel-proxy.js` is runtime-portable: Pages Functions and Workers share the same API, so the same code can answer above Pages.
- Cloudflare resolves a zone's Workers routes before a Pages custom domain, so a Worker on `poetech.us/sb/*` answers whether or not the Pages Function ever runs again.
- What the repository's Cloudflare token may do beyond Pages is **not yet known**; the workflow's first job measures it (zone read, Workers scripts, routes) and says, in words, what token is needed if it cannot.

## Impact

- The family's browsers get the same-origin door back: one trusted client at the Funnel instead of every phone, the shape that worked from 2026-06 until 2026-10-09.
- The 2026-10-09 unlock can be reverted to `poetech.us/sb` the moment the Worker answers a POST on the domain — the revert the unlock itself asks for.
- Nothing about Pages changes; if Cloudflare restores the Functions, both doors answer the same way and the Worker can be withdrawn by deleting its routes.
- Not carried: `functions/api/*`, `/geocode`, `/link`, `/store/apk` — they hold logic and secrets of their own and stay with Pages.

## Decision

1. `infra/cf-roads-worker/` holds the Worker: a path-prefix table of the twenty proxied roads and the forwarding and error shape of the Pages factory, line for line; unknown paths pass to the origin untouched.
2. `.github/workflows/cf-roads-worker.yml` is dispatch-only and one-at-a-time. `deploy: no` is a read-only probe of the token's reach and of the Funnel under the app's own request shape (cross-origin OPTIONS and POST to the records RPC, timed, once and in a burst of eight). `deploy: yes` runs `wrangler deploy` and then **reads the custom domain back**: two roads must answer JSON with `x-poetech-road: worker`, or the run fails.
3. The revert of the unlock (`SOVEREIGN_SB_URL` back to `https://poetech.us/sb`, and the camera, voice and photo overrides removed) is its own change, made only after the Worker has answered a POST on the domain, with the witness's cross-origin probe moved back onto the same-origin road.

## Rationale

The ledger spent six days re-measuring a symptom the repository cannot fix, while the one thing the repository can do — answer the same paths one layer up — sat unbuilt. The binding rule is the same-origin transport; this restores it without waiting on a vendor. The deploy proves itself from outside (DR-0107's lesson: a green upload is not a served road), and the probe runs first so a token that cannot deploy is a sentence naming the token to make, not a silent failure.

## Verification

- `the-roads-have-a-second-door.test.js` (51): every `makeFunnelProxy` route under `app/functions` has a row with the same upstream and the Worker has no row Pages lacks; the mapping is exact for a records call, a nested taxes path, the legacy n8n shape and the single-path roads; a longer prefix wins; look-alike paths and the app itself are never ours; unknown paths pass the original request through; a road is forwarded with Host dropped and headers kept, and answers with the Worker's header; an HTML 5xx becomes the one JSON 502; `wrangler.toml` binds each road on both hosts, exactly two patterns per road, no catch-all; the workflow has no schedule, no push trigger, deploys only behind the input, probes the records road in a burst, and exits non-zero when the domain still serves the shell.
- `interconnect-guard` OK with the workflow placed in the flow graph (writes the live site, seeds site-health); `workflow-list-order-guard` OK; `infra-transport-guard` OK; YAML parses; the Worker module loads.
- The first live reading is the probe run after merge: the token's reach and the Funnel's answer under a burst. The deploy is dispatched on a token that can; its own last step is the proof. Then the unlock revert (Decision 3) and a site-health pass on the same-origin road.
- `re-review: 2026-10-23` — withdraw the Worker's routes if Cloudflare has restored the Functions and both doors answer; otherwise it stays as the door.

## Links

#2057, #2215, #2210; DR-0307, DR-0107, DR-0108, DR-0111, DR-1054, DR-1058; `app/functions/_lib/funnel-proxy.js`; `infra/nas-transport/RECORDED-STATE.md` (the `/sb` row); `.github/workflows/deploy-cloudflare-pages.yml` (the 2026-10-09 unlock block).
