# DR-1653: The second road out is a Cloudflare Tunnel

**Date:** 2026-11-25
**Status:** Accepted (built; not armed)
**Tier:** C (a new public road to the family's database; activation only with Darrell watching)
**Type:** infrastructure
**Area:** `infra/nas-loops/loops/cf_tunnel.py` (new), `infra/nas-loops/loops/cf-tunnel.sh` (new), `infra/nas-loops/test_cf_tunnel.py` (new), `infra/nas-loops/services.json`, `app/src/lib/sb-failover.js` (new), `app/src/lib/supabase.js`, `app/src/__tests__/sb-failover.test.js` (new), `app/src/__tests__/a-service-comes-home.test.js`, `.github/workflows/deploy-cloudflare-pages.yml`, `.github/workflows/loops-health.yml`, `scripts/system-flow-registry.mjs`, `infra/nas-transport/RECORDED-STATE.md`
**Sent in by:** Darrell, 2026-11-25: "Build the Cloudflare tunnel road"
**Pairs with:** DR-1622 (no outside system is the only door; Cloudflare Tunnel decided), DR-1624 (the box was alive the whole time), DR-1360 (NAS-initiated roads only), DR-0076 (verification), CLAUDE.md three brakes

## Context

On 2026-11-23 and again 2026-11-24/25 the NAS ran the whole time (uptime ~34 days, reporting every 15 minutes) but its Tailscale login lapsed (`backend_state NeedsLogin`). The Funnel at `poetech.tail5a2f35.ts.net` closed, and because it was the ONLY road, sign-in, The Word, photos and cameras went dark together. DR-1622 decided a second, NAS-initiated road: a Cloudflare Tunnel.

## Decision

1. **The NAS half.** A services-sync rider, `cf-tunnel`, keeps one container `poetech-cf-tunnel` running a pinned `cloudflare/cloudflared:2024.12.2` on the host network, from the token in `/volume1/PoeTech/secrets/cloudflared-token.txt`. The token goes to a 0600 env file, never a command line. A changed token replaces the container; the same token leaves it alone; a stopped one is restarted.
2. **Off until armed.** No token file means the rider writes `no-token` and does nothing. The registry `enabled` flag is the second stop path.
3. **Brakes.** Budget: each docker call 60 s, the whole pass 240 s (under the 480 s rider ceiling). Lock: `flock` in `/volume1/PoeTech/cf-tunnel`; a second fire skips. Off switch: the token file. Every pass writes `last-run.json` (and appends `ledger.jsonl`), which loops-health reads.
4. **The app half.** `sb-failover.js` wraps the Supabase client's fetch. On a network error or an edge gateway failure (502/503/504/520-530) the same request goes once to the fallback, which is then preferred for 5 minutes. A 4xx is never retried. With both down the real error surfaces. With no `VITE_SUPABASE_FALLBACK_URL` (from repo variable `SB_TUNNEL_ORIGIN`) the platform fetch is returned unchanged. Realtime websockets do not ride fetch and are not covered.
5. **The mapping lives in Darrell's Cloudflare account**: public hostname (e.g. `sb.poetech.us`) to `http://localhost:8800`, recorded in RECORDED-STATE.md.

## What was measured

- `python3 -m unittest test_cf_tunnel`: 9 of 9 pass (no-token off switch, token never on argv, 0600 env file, same token left alone, new token replaces, stopped restarted, failed start reported, bounded wait, budget stops calls, DSM docker paths).
- `sb-failover.test.js`: 12 of 12 pass. Proven to catch: with the fallback call replaced by a rethrow, 2 tests fail.
- `interconnect-guard`: 0 findings, 46 NAS riders placed; `funnel-actuation-guard` exit 0; the NAS and witness suites 125 of 125.

## Impact

- Until a token is on the box and the app knows the tunnel's address, nothing changes: the rider writes `no-token`, and the app's fetch is the platform fetch, byte for byte.
- Once armed, a lapsed Tailscale login no longer closes sign-in and data: calls that cannot reach the Funnel go to the tunnel. Realtime websockets still ride the Funnel only.
- One more container on the NAS (cloudflared, small), started and watched by the existing services-sync clock; no new timer.

## Verification after merge

Nothing has run on the NAS or against a real tunnel. The token can only be minted in Darrell's Cloudflare account. Done means DR-1622's proof: **sign-in works with the Funnel deliberately off.**

## Activation (Darrell's hand, Tier C, with him watching)

1. Cloudflare dashboard, Zero Trust, Networks, Tunnels, Create (cloudflared). Copy the token.
2. Public hostname `sb.poetech.us`, service `http://localhost:8800`.
3. Place the token at `/volume1/PoeTech/secrets/cloudflared-token.txt` (0600).
4. Set repo variable `SB_TUNNEL_ORIGIN=https://sb.poetech.us`; the next deploy carries it.
5. Turn the Funnel off for a minute; sign in on the phone.

`re-review: 2026-12-09`
