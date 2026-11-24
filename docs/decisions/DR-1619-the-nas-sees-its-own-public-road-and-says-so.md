# DR-1619: The NAS sees its own public road, heals it, and says so

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (a NAS loop's detection and heal, plus one read-only receiving workflow; no schema, no money)
**Type:** bug fix
**Area:** `infra/nas-loops/loops/funnel_watchdog.py`, `infra/nas-loops/test_funnel_watchdog.py`, `.github/workflows/nas-funnel-report.yml`, `.github/workflows/ci.yml`, `scripts/workflow-budget.json`
**Sent in by:** Darrell, 2026-11-24, after being handed a PowerShell paste: "Find another way!!!!! Sovereign!!!!!! Like I said!!!!!!"
**Pairs with:** DR-0268 (the watchdog's birth), DR-1617, DR-1618, DR-0108 (the order of roads), DR-1159, DR-0076

## Context

After DR-1617 and DR-1618 shipped, sign-in was still down. site-health measured 502 on every Pages Function hop to the NAS (`/sb`, `/nas-photos`, `/cams`, `/property-history`), and a direct request to the Funnel (`/announce`) could not connect, at 02:24 and 03:46 UTC. nas-health could not look inside: the runner's tailnet key answers "invalid key: API key does not exist". This session has no route, and the desktop's Remote Control folder is not offered to cloud sessions. Road 1 and the agent's own reach were closed; the next road was Darrell's hands, and he refused it, rightly.

## What was measured

- The NAS already runs `funnel_watchdog.py` on the armed services-sync clock (every 15 minutes) with a bounded heal. It never fired for this outage, for two reasons in its own code:
  - **It probed the wrong road.** It asked `https://poetech.tail5a2f35.ts.net/...` from the NAS, which MagicDNS resolves to the box's own tailnet address. The public ingress the family uses is never touched.
  - **It read a 502 as healthy.** `probe()` returned any HTTP code, and `main()` treated any truthy code as "funnel OK".
- Its restore list omitted `/sb` (sign-in), `/announce`, `/cams`, `/voice`, `/voice-lite` and `/scribe`, all of them rows in RECORDED-STATE.
- The NAS pulls this repository from GitHub over its ordinary internet link on that clock, and it already holds a GitHub token (`/volume1/PoeTech/secrets/github-token.txt`) that the lesson builder uses for `repository_dispatch`. That is a road out that needs no tailnet.

## Impact

The watchdog built to catch a dark Funnel was blind to it. Everything that rides the Funnel stayed down for hours with no heal attempted and nothing reported, and the only remaining fix was a person at a keyboard.

## Decision

1. **Judge the public road.** The watchdog probes `https://poetech.us/sb/auth/v1/health` (Cloudflare → Funnel → this box). Only a 2xx-4xx answer is up; kong's keyless 401 counts as up. A 5xx or no answer is dark. The old local probe stays as a printed diagnostic.
2. **Restore every recorded row** except the n8n root, `/sb` included.
3. **Bring Tailscale back.** If `BackendState` is `Stopped`, it runs `tailscale up`. If it is `NeedsLogin`, it runs `tailscale up --authkey` only when a key file is on the box (`/volume1/PoeTech/secrets/tailscale-authkey.txt`). No key lives in the repository, and none is ever printed or reported.
4. **Brakes.** One package restart per hour at most, so a Cloudflare-side fault cannot restart Tailscale every cycle. One dark report per 30 minutes. The registry's existing `max_calls_per_day`, timeout and `enabled` flag still bound the loop.
5. **Report out, sovereignly.** When dark, and when healed, the NAS sends its Tailscale state, the public probe codes, its actions and `funnel status` to GitHub as `repository_dispatch` `nas-funnel-report`. `nas-funnel-report.yml` prints it, read-only, so the box's state is readable without the tailnet.

It reaches the NAS by the normal lane: merge, the box's own pull, the next services-sync cycle. No hand.

## Verification

`test_funnel_watchdog.py`, 15 cases, run in ci.yml:

- A 502 and no answer are dark; kong's 401 is up; one dark probe darkens the road.
- **Proven to catch:** the old rule calls a 502 up.
- The public probe is not the box's own name.
- Every RECORDED-STATE row except the n8n root is restored, `/sb` included. The test reads the file itself.
- The restart and report spacing hold; state survives a round trip and a bad path never raises.
- NeedsLogin without a key file runs nothing. A key is used but never reported.
- The report is bounded and posts exactly one dispatch; with no token, it is not sent.

The new test file is ruff-clean, and the watchdog's own findings fell from 9 to 7.

**Not verified yet:** the box itself. If the NAS is powered and online, the first cycle after merge either heals the Funnel or reports why it can't, and that report is the next reading. If no report arrives, the box is not running its clock or not reaching GitHub, and that silence is itself the answer. `re-review: 2026-11-25`
