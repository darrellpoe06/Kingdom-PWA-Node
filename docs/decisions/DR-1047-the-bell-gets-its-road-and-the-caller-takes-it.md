# DR-1047: The bell gets its road and the caller takes it — `active` on loopback is not reachable

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (completes DR-1040; the caller moves off a transport that has answered 404 for five weeks)
**Type:** orchestration
**Area:**
- `infra/nas-announce/install.sh` (the Funnel mount for `/announce`, after `/healthz` passes)
- `infra/nas-transport/RECORDED-STATE.md` (the `/announce` row — rule 2)
- `scripts/ops-announce.mjs` (`RELAY_URL` off the n8n root; the bare-404 reason now names the mount)
- `app/src/__tests__/a-dead-bell-says-so.test.js` (the cut-over pinned, the 404 branches pinned both ways)
- `app/src/__tests__/n8n-is-gone.test.js` (the HELD entry released on the condition it set itself)

**Amends:** DR-1040, which shipped the bell and deliberately did not move the caller.
**Grounds:** DR-1040's own stated condition — *"ops-announce.mjs keeps pointing at the n8n relay until a runner has proved this endpoint answers over the tailnet"*; `infra/nas-transport/RECORDED-STATE.md` rules 1 and 2; DR-0218 (zero n8n as forward guidance); DR-0268 (merge installs it); DR-0076 §5 (characterize before you change) and §6 (reality-trace); DR-0310 (unknown is a third state and is reported)
**Declared by:** me, after tracing the caller's actual reach instead of assuming it

## Concern

DR-1040 proved `poetech-announce.service` **`active`** on the NAS and I was one step from pointing the alarm at it. Tracing the road first found that the bell was **running and unreachable**.

## Context

DR-1040 mined the sovereign bell out of a stale PR, shipped it, and the NAS installed it by itself. `nas-health` run `38726513614` printed `poetech-announce.service   active`. DR-1040's recorded condition for moving the caller was a runner proving the endpoint answers — so the next step looked like a one-line URL change.

## What was measured

**The server binds loopback on purpose.** `poetech-announce.service` runs `--host 127.0.0.1 --port 8796`. Nothing off the box can reach that, tailnet peers included.

**And the caller is not on the box, or on the tailnet.** `scripts/ops-announce.mjs` runs on a GitHub runner, and `site-health.yml` **does not join the tailnet** — its own comment says the checkout exists *"ONLY for scripts/ops-announce.mjs"*. So:

| road | reaches the bell? |
| --- | --- |
| `tailscale serve` (tailnet-only) | **no** — the caller is not on the tailnet |
| bind `0.0.0.0` | would expose it on the house LAN, and still not to a runner |
| public Funnel path | **yes** — and it is what the eight rows above it already use |

**So the Funnel is not a preference here, it is the only road that reaches the caller.** And rule 1 of the recorded state forbids `serve` for a mechanical reason rather than a stylistic one: *"`tailscale serve` is tailnet-only and REPLACES the public exposure"* — running it would tear down every route the app depends on.

**My installer had no mount at all.** It did the token, the unit, and the `/healthz` probe. Compared against the proven sibling, `infra/nas-property-photos/install.sh:64` carries the block mine was missing:

```sh
$TSC funnel --bg --set-path /nas-photos http://127.0.0.1:8099
```

**This is a named, repeated, expensive failure class — and I had just reproduced it.** The recorded state exists because `scripts/funnel-actuation-guard.mjs` found three of them: `/nas-photos` dark **7 weeks**, `/taxes` dark **7 weeks** (the screen said *"Could not reach the NAS upload service"* and *"NO RETURNS INDEXED YET"* at the same time), `/scribe` unactuated **18 days**. Its words for the shape: *"a Pages Function that faithfully forwards to the Funnel, and a Funnel with nothing mounted at the other end."*

**The guard could not have caught mine, and that is worth stating precisely.** It starts from Pages Functions and compares them to mounts. My caller is a Node script on a runner, not the app — a NAS service whose consumer is CI is outside its premise. I verified it is wired before concluding anything: it runs through `app/src/__tests__/funnel-actuation-guard.test.js`, which imports it, so it is in the vitest suite and therefore in CI. It is healthy; its reach does not cover this shape.

**Public exposure does not grow — it narrows.** The bell was already public: `/webhook/ops-announce` on the same Funnel hostname, served by the n8n root. This moves it from that root to one dedicated path whose server pins the ntfy topic, so a leaked bearer can only ever ring the family's own bell.

**The n8n HELD entry named its own release condition.** `n8n-is-gone.test.js` held `scripts/ops-announce.mjs#webhook-path` with: *"Held until a sovereign bell replaces it end to end."* That is this change, and the test enforced the release rather than letting a stale hold sit — it failed with `scripts/ops-announce.mjs#webhook-path no longer present — drop it from HELD`.

## Impact

**The alarm now posts to `/announce/ops-announce`**, and the n8n hop is out of the live path. The HELD ledger shrinks by one, which is measurable progress on DR-0218 rather than a claim about it.

**A bare 404 now names its cause.** It used to say *"the webhook path is wrong or no longer served"*. On the sovereign road a bare 404 means one specific thing — nothing is mounted at `/announce` — so the reason says that, says the service may be `active` and unreachable anyway, and prints the single command that fixes it. The n8n branch stays, because its body shape is exact and the history is real.

**The mount only happens after the bell answers.** `install.sh` exits 1 if `/healthz` fails, so the mount block cannot run in front of a dead server — the discipline voice-lite and cams already use.

## Decision

1. **`install.sh` mounts `/announce` → `127.0.0.1:8796`** on the public Funnel, with the proven guarded idiom: full DSM binary path, only when not already mounted, never touching the n8n root, loud by-hand instructions when the binary is absent.
2. **`RECORDED-STATE.md` gains the `/announce` row** (rule 2), including the honest history that the service was `active` with no mount and no row for the hours between DR-1040 and this record.
3. **`RELAY_URL` moves to the sovereign road**, spelled in full because tailscale strips the mount point and the server matches by suffix, so both spellings arrive.
4. **The classifier's bare-404 branch names the mount**, and the n8n branch is kept for n8n's own words.
5. **The HELD entry is released**, on the condition it set for itself.

## Verification

- **Measured 2026-10-20 (announce-health runs 39489289287 and 39490048742, `ring: true`, the family bell rung from a GitHub runner through the Funnel):** a lone ring with the bearer read on the box was accepted (HTTP 200). Rung as site-health rings, two faults showed at once. (1) The repository's `VITE_N8N_BEARER` is refused by the relay (HTTP 401): site-health and the deploy ring with a bearer the box does not hold, so every alarm they raised reached nobody; the secret must be set to the box's `announce-token.txt`, a value only Darrell's hand can carry into the repository. (2) The relay speaks HTTP/1.1 and answered a refused call without reading its body, so on the kept connection the next ring was parsed starting at the previous body and answered with Python's own 400 page (`<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"`) — the exact 400 site-health recorded, whose probe POSTs keyless just before its ring. Fixed in the relay (`read_body` before any answer; a wrong path or bearer leaves the connection clean); the self-test rings twice over one kept connection and the old code fails it (proven-to-catch). The relay's reason now carries what it said (`ops-announce.mjs`).

- **30 passing** across `a-dead-bell-says-so` (18), `n8n-is-gone` and `funnel-actuation-guard`. Lint clean. All 20 guards PASS.
- **`announce_server.py --selftest`: 12 PASS / 0 failures**, unchanged — this record does not touch the server.
- **`install.sh` is POSIX `sh -n` clean.** The remote shell is `sh`, not bash.
- **PROVEN TO CATCH, on the live tree, in the order that proves it.** Before removing the HELD entry the suite failed with the ledger's own words — `scripts/ops-announce.mjs#webhook-path no longer present — drop it from HELD` — so the release is forced by the shrink-only rule rather than asserted by me. After: green.
- **The 404 branches are pinned BOTH ways.** n8n's wording takes the n8n reason and never the mount reason; any other body takes the mount reason and never the n8n one. If those ever cross, one cause is being reported as the other.
- **The cut-over itself is pinned:** `RELAY_URL` is the exact sovereign URL and matches no `/webhook/`.
- **Not claimed: that the phone has rung.** Nothing here has run on the NAS. The mount happens on the next services-sync cycle after merge, and the honest proof is a later `nas-health` verdict plus a real `/announce/healthz` answer from outside. If the mount fails, the classifier now says so in one line with the fix — which is the whole point of the wording change.
- **Not claimed: that this touches #2057.** The dark Pages Functions are a separate fault.

**Not addressed:** `funnel-actuation-guard`'s blind spot — a NAS service whose caller is CI rather than a Pages Function has no declared route for it to check, which is why nothing caught this. Teaching it to read `services.json` against the recorded table would close the class rather than this instance. `re-review: 2026-10-22`, with the #1255 close and the container-tail cap.
- **Live on main, 2026-10-20 21:05Z (announce-health run 39497544985, `ring: true`, after #2309 merged at 20:40Z and services-sync installed the relay):** the box runs the repository's `announce_server.py` (installed sha = repo sha, unit active, `/healthz` ok, ntfy healthy, one Funnel mount). The ring with the repository's `VITE_N8N_BEARER` was refused **HTTP 401**; the ring with the bearer read on the box, sent next on the same kept connection, was **accepted, HTTP 200**, where run 39490048742 got Python's 400 page. The poisoned-connection fault is closed live. The one fault left is the repository secret, which only Darrell's hand sets; until then site-health's and the deploy's alarms reach nobody and `announce-health` keeps the `Announce road is dark` ledger open with exactly that sentence.
