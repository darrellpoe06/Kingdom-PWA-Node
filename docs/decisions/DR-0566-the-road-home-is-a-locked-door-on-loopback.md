# DR-0566 — The road home is a locked door on loopback: the voice forwarder

- **Status:** accepted
- **Tier:** B (a new public route on the Funnel in front of an unauthenticated GPU service; the lock is the bright line)
- **Type:** orchestration
- **Date:** 2026-09-22
- **Shipped in:** #1727 (forwarder, installer, client bearer), #1735 (citations, watcher, 1920 sweep)
- **Scope:** `infra/voice-studio/voice_forwarder.py`, `poetech-voice-forwarder.service`, `install.sh`; `infra/nas-loops/services.json` (`voice-transport`); `infra/nas-transport/RECORDED-STATE.md` (`/voice` row); `app/functions/voice/[[path]].js`; `app/src/lib/voice-service.js` (bearer on the sovereign road only); `.github/workflows/ci.yml` (forwarder selftest); `app/src/__tests__/voice-road-home.test.js`
- **Principles:** SOVEREIGN-FIRST (DR-0138), VERIFICATION-DOCTRINE (DR-0076 — the two premises were checked against primary sources, one of them after being shipped wrong), A-ROUTE-THAT-REACHES-NOTHING-IS-A-LIE (DR-0330), PHOTOS-PROVISION-THEMSELVES (DR-0268 — same-origin road, family bearer), NOTHING-WAITS (DR-0236), THREE-BRAKES (bounds on a public door)
- **Grounds:** Darrell 2026-09-20 on a Fire TV: *"No sounds yet for the tts... but it does click and do what it should"*; DR-0382 / DR-0401 (the System voice reaches the church's own studio); DR-0440 (asked, never assumed)

## What was decided

The app's same-origin `/voice/*` transport terminates at **`poetech-voice-forwarder.service` on the NAS, `127.0.0.1:8771`**, and nowhere else. The forwarder carries `POST /speak` across the tailnet to the XTTS studio on the 4070 and passes the studio's own `GET /health` back verbatim.

Two verified facts shaped it, and the first version of the installer had the first one backwards:

1. **Tailscale proxies only to loopback** — *"only localhost or 127.0.0.1 proxies are currently supported"* (tailscale/tailscale#8751, open since 2023-07-31). A Funnel path cannot point at the 4070. Every other sovereign row in RECORDED-STATE already has this shape (8099 photos, 8790 taxes, 8800 supabase); `/voice` now does too.
2. **The studio has no authentication of its own, on a PUBLIC route.** The forwarder requires the family bridge bearer on `/speak` — the same token the photo and tax servers require, provisioned to signed-in family devices by the 0128 RPC — and the app sends it on the sovereign road only, never to the vendor bridge. Bounds: a concurrency cap that refuses the (N+1)th synthesis at once, a body cap, an upstream timeout, loopback-only bind, refuse-to-start without a token.

The installer points the forwarder only at a studio that answered `/health` on that cycle, and mounts the Funnel only once the forwarder itself passes a 200 through. A dark studio mounts nothing and exits 0.

## Verification

- Forwarder selftest: 22 checks against a fake studio, exit 0, gated in `ci.yml`. Mutations proven-to-catch: accept-any-bearer fails at "wrong bearer -> 401"; pointing the Funnel at the 4070 fails the loopback gate; sending the bearer to every endpoint fails the vendor-leak test.
- The NAS witness (nas-health run 35759346227) shows `poetech-voice-forwarder.service loaded active running`, installed by services-sync from the mirror at `b06c99c` with no hand on it.

## Limits, stated

- **The Love Corner cannot use it yet.** `get_family_bridge_token` excludes `instance_type = 'church'` (0128:43) by design. A church member on the Firestick will 401 once the studio is up. Decision pending with Darrell; the recommended default is a **separate church bridge token** (own row, own RPC), never the family token crossing that boundary. `re-review: 2026-09-24` — carried by the review watcher.
- **The studio itself is not armed.** CI's key is refused on the 4070 (`Permission denied (publickey)`, run 35750012424); the other channel holds that step.
