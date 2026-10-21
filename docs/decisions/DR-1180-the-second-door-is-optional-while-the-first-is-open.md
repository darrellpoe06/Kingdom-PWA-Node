---
id: DR-1180
title: The second door is optional while the first is open — an undeployed Worker is a parked decision, not an outage, and the token is Darrell's to mint on his own day
date: 2026-10-21
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [all]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, RUNNER-REACHES-THE-NAS, DECISION-RECORDS]
source: session_01UyvwuXazJyx2GG9zw9r67Z — Darrell, 2026-10-21, "I hate having to deal with this cloudflare issues!!!!!!!!!!!"
---

# DR-1180: The second door is optional while the first is open — an undeployed Worker is a parked decision, not an outage, and the token is Darrell's to mint on his own day

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (what the site witness calls a fault; the words the Admin surface says to a steward; no road, secret or deploy changes)
**Type:** way
**Area:**
- `.github/workflows/site-health.yml` (the `/edge/whoami` probe: an undeployed Worker beside a SIGNED Pages Function road is a note; beside an unsigned one it is still `THE WORKER ROADS ARE DARK TOO`, in the same words)
- `app/src/lib/edge-guard.js` (the `no-road` shape says the site is fine, names the six token scopes, and names the deploy as what FOLLOWS the token, not as the ask)
- `app/src/__tests__/the-witness-sees-the-worker-roads.test.js` (the harness now hands the probe what the Pages Function probe read; three new cases, one proven to catch)
- `app/src/__tests__/edge-guard.test.jsx` (the wording case)

**Grounds:** Darrell, 2026-10-21, after a morning in which the Cloudflare token for the Roads Worker was named as "still his hand" in four records and one session note: **"I hate having to deal with this cloudflare issues!!!!!!!!!!!"** DR-1159 (the same morning) made the order of roads mandatory and said a hand is the LAST road, only for a value only he can mint. This token is such a value. What the Way did not say is what the system should do while that hand is NOT offered: keep asking, or stop.
**Principles:** DR-0076 §1 and §4 (say what was measured, no more: the witness wrote "DARK" over a layer nobody was locked out by); DR-0975 and P53 (a witness that cries wolf drowns out the fault that matters); DR-1159 (a hand is the last road, offered once with the reason, never nagged); DR-0075 (a non-improvement is a recorded decision with a re-review date, not a daily note); DR-0111 (do not re-ask what is already decided — "not now" is a decision).

## Context

The poetech-roads Worker (DR-1068) was written on 2026-10-16 as a **second door**: a zone Worker answering the same NAS roads one layer above Cloudflare Pages, because since 2026-10-09 the Pages Functions had read as dark (#2057). The Edge Guard (DR-1067) was mounted on the same Worker because it is the one place a bot can be refused before it costs anything, and it needs a Cloudflare token with zone scopes the repository's Pages-only token does not have.

The Worker was never deployed: `cf-roads-worker.yml`'s read-only probe (run 39508087503) showed the repository token sees zero zones and zero Workers scripts. On 2026-10-20 the witness learned to probe `/edge/whoami` (DR-1124) and began failing every run on the Worker's absence; DR-1158 carved the reading out of the daily ledger note until 2026-10-28, after which it would go loud again.

## What was measured

- **Site-health run 39598605116, 2026-10-21T12:19Z, on main 4f24dbb:** the ONLY failing reason is the Worker. The pages.dev shell answers 200; the backend auth road answers 200; the app's own request shape gets a 200 preflight and a 400 body from the NAS; served build = main. The Pages Function road `/automation-status` is signed. Every road the family uses is open. **The 2026-10-09 Pages fault is over, and nothing records when it ended because the witness kept failing for a different reason.**
- **#2057 comment 6315737701:** "STILL BROKEN, nothing new... the poetech-roads Worker is not deployed... needs a Cloudflare token... which only Darrell can mint." Written daily. The site it describes was up.
- **`scripts/site-health-verdict.mjs` KNOWN_OUTAGES[1]:** `until: '2026-10-28'`. Past that day the same unchanged reading returns to "A FAULT NOT ALREADY ON RECORD", four notes in eight hours, the shape DR-0975 ended.
- **`app/src/lib/edge-guard.js` line 46 (before):** "Dispatch cf-roads-worker.yml with deploy=yes." Said to the steward on every card of Admin → Bots & blocks. The dispatch cannot succeed without the token; the surface asked him for a thing that would fail.
- **What the Worker carries that nothing else does:** `/edge/*` only. Its other twenty-three roads are the Pages Functions' roads, ported line for line (README: "ONE IMPLEMENTATION, PORTED"). While Pages answers, the Worker adds nothing the family touches.
- **What the token needs regardless of where the Edge Guard lives:** Zone:Read, Analytics:Read, Firewall Services:Edit, Bot Management:Edit (edge.js), plus Workers Scripts:Edit and Workers Routes:Edit to deploy. A Pages Function could carry the Edge Guard too, but it would still need a zone-scoped token as a Pages secret, which the Pages-only token cannot set. **No road in this repository, on the NAS or on a runner can mint a Cloudflare API token; the Cloudflare dashboard is the only minter.** This is a genuine last-road value under DR-1159.
- **What the first door's health costs us to know:** nothing new. The Pages Function probe already reads the signature on `/automation-status` into `FN_ROAD` three lines above the Worker probe.

## Impact

- The site witness goes green on a site that is up, fresh and serving every road the family uses. A Worker that is not deployed beside a signed Pages road is written to the run's notes as a parked decision, naming the token and its six scopes, and never to the ledger issue.
- Both doors dark (the Pages road unsigned AND `/edge` the shell) is still `THE WORKER ROADS ARE DARK TOO`, in the same words, because then the family is locked out; nothing that was loud for a real outage went quiet.
- The DR-1158 carve-out has no cliff any more: the reading it quiets no longer fires while Pages is up. It stays in the file as a safety net for the both-doors case until its own date.
- Admin → Bots & blocks tells a steward the truth: the site is fine, bots, traffic and blocks wait on a Cloudflare token, and here are the scopes. It no longer asks him to run a deploy that would fail.
- Darrell is asked for the token ONCE, here, with the reason, and then not again: no daily note, no run going red on the 28th, no surface nagging. If he mints it, `cf-roads-worker.yml` with `deploy=yes` opens the road in one move and the witness reads the Worker alive on its next run.

## Decision

**A second door is optional while the first is open.** When the witness reads the first door signed, the second door's absence is a reading, not a fault. When the witness reads the first door unsigned, the second door's absence is the fault it always was. The verdict is taken from what the witness itself measured three lines earlier, never from a date or a carve-out.

**A hand that is not offered is a decision, not a defect.** The Cloudflare token is a value only Darrell's dashboard can mint (DR-1159 road 3). It is named once, with the scopes and the reason, in this record and in the Admin surface, and the system stops asking. The Edge Guard (bots, traffic, blocks) is parked by his choice until the token lands; the day he mints it, the one move is `cf-roads-worker.yml` → `deploy=yes`.

**`re-review: 2026-11-18`** — four weeks. If the token has not landed by then, the question is whether the Edge Guard is wanted at all (the Pages-side `functions/_lib` could carry the blocks road the same way, with the same token), or whether Cloudflare's own dashboard controls are enough for the family's site; either answer is a record, not a note.

## Verification

- **The witness, proven to catch:** the-witness-sees-the-worker-roads 12 cases (3 new). The SPA shell on `/edge` with `FN_ROAD=pages-function` fails nothing and writes the parked note with "parked decision, not a fault", "open through Pages", the scopes and "No daily note, no deadline"; with `FN_ROAD=worker` the same; with `FN_ROAD` empty the run still fails with `THE WORKER ROADS ARE DARK TOO` and no parked note. The existing cases (JSON 401 alive, no answer dark, the alive arm a bare `:`, the separate reading) are unchanged and green with the harness handing the probe an empty `FN_ROAD`, which is what the 2026-10-20 probe effectively had.
- **The surface:** edge-guard.test.jsx: the `no-road` message contains "open through Pages", "Cloudflare token", "Workers Scripts:Edit" and names the workflow as what follows, not as the ask.
- **The workflow parses** (`node -e` YAML load) and the probe's shell passes `bash -n` as extracted by the test harness.
- **Not proven from here:** the next scheduled site-health run on main after this merges is the proof that the witness reads green on the live site. The sandbox has no route to poetech.us; the run's notes are where the parked line will show.

## What this does not do

- It does not deploy the Worker, mint a token, or move the Edge Guard. The token is Darrell's hand, by DR-1159; this record is the system ceasing to ask for it daily.
- It does not touch `KNOWN_OUTAGES`: the `cf-roads-worker` entry still carves the both-doors reason until 2026-10-28, which is the only case that can still produce it.
- It does not record when the 2026-10-09 Pages fault ended. The witness did not measure that day because it was failing on the Worker; the first green run after this merge is the earliest honest "up since" the ledger can carry.
