# DR-1285: The second door opens without the key — the Worker deploy gets DR-1269's other road, and the door DR-1068 decided on has never been opened

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (the deployer of the front door's transport Worker; the deploy itself is still dispatch-only and still proves itself from outside)
**Type:** verification
**Area:** `.github/workflows/cf-roads-worker.yml` (the anon-key step and its join), `app/src/__tests__/the-second-door-opens-without-the-key.test.js`
**Found by:** the agent, following a fault wm10's builder measured and correctly refused to widen its curriculum PR into.
**Pairs with:** DR-1068 (the roads have a second door — the Worker this deploys), DR-1067 (the Edge Guard on `/edge/*`, and §3's two Worker secrets), DR-1269 (the second road to the anon key, reused here), DR-0107 (a green upload is not a served road), DR-0108 / DR-1159 (the order of roads), DR-1284 (verify your join — and why this lane is a legitimate exemption), DR-0076 (§1 evidence, §3 proven-to-catch, §8 what is not measured is said so), DR-0621 (a flag is where the work starts)

## Context

Tonight's `site-health` run, dispatched by wm10's builder to prove its own deploy, measured `GET poetech.us/edge/whoami` answering **`200 text/html`** instead of the JSON `401` `edge.js` returns to an unauthenticated caller — the signature of a zone route not matching, so the request falls through to the Pages SPA. It filed the observation on the rolling incident issue **#2404** and left it, having measured that none of its seventeen files touch anything edge, worker, wrangler or zone. That was right, and the fault is older than tonight.

DR-1068 built the poetech-roads Worker as a **second same-origin door** because since 2026-10-09 no Cloudflare Pages Function on `poetech-app` is invoked: `/sb`, `/cams`, `/nas-photos`, `/taxes` and every other NAS-backed road answer the SPA shell while every deploy logs a successful Functions upload. DR-1067 put the Edge Guard on the same Worker at `/edge/*`. Both are accepted, merged, and Tier C.

## What was measured

| | |
|---|---|
| `poetech.us/edge/*` in `wrangler.toml` since | **2026-10-15**, commit `4b4198ce6` |
| `worker.js:141` | routes `/edge` and `/edge/*` to `handleEdge` — the code is correct |
| `cf-roads-worker.yml` runs since that commit | **6** — 10-16, 10-17, 10-20, 10-21, 10-27, and 2026-10-29 |
| the **deploy job** on every one of them | **`skipped`** — every dispatch took the default `deploy: no` |
| `scripts/served-anon-key.py` (DR-1269's second road) wired into this workflow | **no** — only into `deploy-cloudflare-pages.yml` |

So **the door DR-1068 decided on has never been opened.** Its `deploy: yes` — the whole substance of that record's Decision 2 — has not run once. Its own `re-review: 2026-10-23` passed with the step never taken.

And it could not have run tonight even if dispatched. DR-1067 §3 rides two Worker secrets on the deploy job, and `SB_ANON_KEY` was fetched from the NAS over the tailnet by a **single** road that `exit 1`s when the value is not a JWT. With the Tailscale key refused since 2026-10-28 that step is a hard stop — while DR-1269 built a second road to that same **public** value on that same day and wired it into the Pages deploy only.

**Not measured, and said so.** The probe run `40801041610` completed successfully, and its first step prints the zone's actual Workers routes — but this sandbox cannot fetch a job-log blob (403 through the egress proxy), so **that route list is unread.** The conclusion that the Worker is not on the zone is an **inference** from two measured facts: the live `/edge/whoami` reading, and the deploy job having been skipped on every run. It is not a direct reading of the zone, and a steward opening that run's log can confirm or correct it in one glance.

## Impact

Two shipped surfaces have most likely been dark since the day they were built: the **Edge Guard** and the **Admin visitor count**, the only readers of `/edge/*`. DR-1067's own promise — that the 930k requests get a breakdown "the first time the Traffic card opens after the Worker is deployed" — has never come due, because the Worker was never deployed.

Wider: the same unopened door is why `/sb` and the other NAS-backed roads still answer the shell, and therefore why the deploy still builds the client against the **absolute Funnel origin** — the 2026-10-09 unlock that breaks CLAUDE.md Layer 0 on purpose and carries a written hazard about the Funnel throttling under real family load.

## Decision

**The deploy job gets DR-1269's other road, reused rather than rebuilt.** The NAS is asked **first**, because only it can speak a *rotated* key; the served site — which ships that public key inside the bundle every browser downloads — is the fallback. The join above it becomes `continue-on-error`, the same shape the Pages deploy carries, which is also why this lane is a legitimate exemption from DR-1284's verify-your-join rule: a step that may fail and has another road behind it must not end the job. **The fail-loud stays:** a value neither road can produce still stops the deploy, because arming the Edge Guard's gate with a non-key would ship a road that cannot answer (DR-0107). The road taken is named in the log and the step summary, so a later reader never has to guess which answered.

**What this record does NOT do:** it does not dispatch the deploy. That is DR-1068's decision to carry out, not a new one, and it should ride the merged workflow rather than an unmerged branch — the lane, then the dispatch, then that deploy's own read-back of the custom domain, then `site-health` on the same-origin road. Sequenced here rather than left implicit.

## Verification

- `app/src/__tests__/the-second-door-opens-without-the-key.test.js` — **7 tests, 7 passed.**
- **Proven to catch — three breaks on the live workflow file, one at a time, each restored byte-identical (`cmp`):**

  | break | result |
  |---|---|
  | the second road removed — the hard stop it was an hour ago | **3 failed** |
  | the fail-loud softened to `true` — shipping a road that cannot answer | **1 failed** |
  | the NAS road's host broken so the served site answers first — a rotated key never seen | **1 failed** |

  Restored: **7 passed** after each.
- The mask is asserted to be **one** call after the selection, not one per road, because a per-road mask is how a road added later gets forgotten and prints the key.
- DR-1068's own last step — the custom-domain read-back requiring `x-poetech-road: worker` — is asserted still present, so nothing here weakens the proof that a green upload is not a served road.
- `npm run lint` and `npm run verify:gates`, each read without a pipe.
- **Not verified:** neither road has run in this job yet; the first `deploy: yes` dispatch is the measurement of record. The served-site road itself is proven on a fixture and in the Pages deploy (DR-1269's six cases), not yet in this workflow.
