# DR-1040: The bell is sovereign Python — main had a detector for a dead bell, not a bell

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (additive NAS service; no live path changes in this record)
**Type:** orchestration
**Area:**
- `infra/nas-announce/{announce_server.py, install.sh, poetech-announce.service, README.md}` (mined out of the stale #1255, two defects in it corrected)
- `infra/nas-loops/services.json` (the `announce` entry — merge installs it, DR-0268)
- `scripts/system-flow-registry.mjs` (the service's declared place in the flow graph)

**Amends:** nothing. It supplies a sovereign road DR-0218 implied and never built for this one artifact.
**Grounds:** DR-0218 (zero n8n — "historical warning only, never forward guidance"); DR-0132 (the phased migration off n8n); DR-0083 (plain Python on the NAS that just runs); DR-0268 (merge installs/repairs/starts a NAS service — ends the "pending Darrell" hand-deploy class); DR-0125 (the site has its own witness); DR-0156 (announce, do not only record, the incident); DR-0236 (nothing waits that is buildable now); DR-0621 (we never discard what does not work — we work it until it works)
**Declared by:** me, as the outcome of DR-1027's `re-review: 2026-10-17`, run two days early

## Concern

**Darrell's phone has not rung.** site-health has been filing a correct incident every hour for five days, the Actions list has been red, and the alarm reached nobody.

## Context

DR-1027 set `re-review: 2026-10-17` — *"close #1255"* — on the grounds that the PR "now holds nothing the series lacks". I ran it early, as DR-1026 and DR-1031 both did to real effect, intending to verify and close.

## What was measured

**The teachings half of DR-1027's claim is TRUE, and I verified it rather than inheriting it.** Every one of #1255's nine teachings has its distinctive markers on main: Daniel 4:33, Isaiah 14:15, "lifter up of mine head", "Professing themselves to be wise", Luke 14:11, James 4:10, Jeremiah 9:23, "glorieth, let him glory", "flesh and blood hath not revealed", Matthew 16:17, `leviathan`, `reprobate mind`, `false humility`. The single miss was the *label* "false shepherd" (0 files) — and that teaching is present three ways under its own Scripture: `hireling`/John 10:12 (3 files), Ezekiel 34 (6 files), Jeremiah 23:1 (3 files). So the series lacks no teaching from that PR.

**But the claim was about teachings, and the PR's own title names CODE:** *"the egress lockout fixes, and the verbatim gate widened to every field."* Checking that half is what found this.

**The gate half had landed.** `quotation-integrity.mjs` is on main and does read every field — `benefits`, the quiz, the facilitator's talking points.

**The bell half had not, and main's bell is the retired transport.** `scripts/ops-announce.mjs:46`:

```js
export const RELAY_URL = 'https://poetech.tail5a2f35.ts.net/webhook/ops-announce';
```

That is an **n8n webhook**, and `ops-announce.mjs` exists *only because it answers 404*. Its own line 82 is the finding, already written down and already live:

> `THE PHONE ALARM IS NOT REGISTERED — the relay answered HTTP 404 "webhook not registered", which means the n8n workflow holding POST ops-announce is not ACTIVE on the NAS.` **`Every alarm raised while this is true is recorded here and reaches nobody.`**

So main carries a **well-built detector for a dead bell, and no bell.** And it detects it on a transport DR-0218 retired as forward guidance, so re-registering that workflow would re-arm precisely what the house removed. `infra/n8n/wf-ops-announce.json` is still on disk as one of the legacy files `business-systems-guard` tolerates by allow-list.

**Confirmed live this session.** site-health run `38703318199` on `c736a58c0`: `PAGES_CODE 200`, `SERVED = MAIN = c736a58`, `BACKEND_CODE 200`, and `VERDICT: KNOWN` / `ANY_NEW: false` — day 5 of #2057. The run's own notice: *"the alarm already carried this unchanged fault within the last day — not ringing again."* The throttle is correct behaviour (DR-0975); it is not the reason the phone is silent. The 404 is.

**#1255 holds the sovereign replacement, complete.** Four files — `announce_server.py` (217 lines, stdlib only, `--selftest`), `install.sh`, `poetech-announce.service`, `README.md` — plus its own `services.json` entry. Both sibling servers its header names, `infra/nas-property-photos/photo_server.py` and `infra/nas-review-feed/review_server.py`, **are on main**; only this one is missing. The pattern is shipped and proven; this is the gap in it.

**And #1255 cannot be merged, which is why mining was the only route.** Its base is `b1e2a8e37` from 2026-08-14. Most of its diff is n8n deletions main has since done differently. Decisively, it adds `DR-0309` and `DR-0311` — and main holds **different** records at both numbers (`DR-0309-the-baseline-refreshes-by-nonce-and-rides-the-lane`, `DR-0311-one-person-two-doors-one-library`). Per DR-0644 the resolver *refuses* such a collision rather than folding, because folding silently deleted real decisions twice on 2026-10-06.

**Two defects in the mined file, both found by reading it rather than trusting it.**

1. **A false fact in its header.** It said wf-ops-announce *"was deleted with every other n8n artifact on 2026-08-16"*. Not true of main — the file is still there. Removed rather than carried through; a wrong fact in a header is how a future reader gets talked out of the thing the header explains (the correction DR-1038 records).
2. **A dead token fallback.** `TOKEN_FILE` defaulted to `/volume1/poetech/.announce-token` while `install.sh` writes `/volume1/PoeTech/secrets/announce-token.txt` — capital `PoeTech`, under `secrets/`, matching every other installer on this NAS. Two different directories on the Synology volume. It never fired, because `install.sh` bakes the token into the unit as `Environment=ANNOUNCE_TOKEN` and `load_token()` prefers env, and it failed **closed** (`''` → 401). But a fallback that can only ever fail is not a fallback.

**The installer's paths were checked against a working one, not assumed.** `POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node` is byte-identical to `nas-property-photos/install.sh:15`, and `nas-bootstrap.yml:68` clones to exactly that path. It seeds its bearer from the existing CI token when one is present, so **no new GitHub secret and no value only Darrell holds**; it generates only when nothing is there, never regenerates over a live token, and proves `/healthz` with a loud `exit 1`.

## Impact

**The bell becomes sovereign, and installs itself.** `services.json` + merge is the deploy (DR-0268) — no hand on the box, no "pending Darrell".

**This record changes no live path.** The caller still posts to the n8n relay. That is deliberate, and it is the single most important line in this record.

**It is not the timer-driven class.** This is a request handler called by a probe, not a loop that spawns compute on a clock, so DR-0247's budget/lock/kill does not apply. The caps that *are* its security model are proven instead (below).

## Decision

1. **The four files land as-is but corrected** — the false header claim removed, the token-file default pointed at the path the installer actually writes.
2. **`services.json` gains `announce`**, enabled, so the merge installs and starts it.
3. **It is placed in the flow graph** reading only its manifest entry and writing only `push:phone`, with **no `http:` resource declared** — because the caller is not cut over, and declaring a route nothing calls would paint a connection that is not live (P15).
4. **THE CALLER IS NOT CUT OVER HERE.** `ops-announce.mjs` keeps pointing at the n8n relay until a runner has proved this endpoint answers over the tailnet. Moving it first would trade a dead n8n bell for a possibly-dead sovereign one and would throw away the measured 404 classification that is currently the only honest thing in the path. Step two is: probe `/healthz` from a runner, then cut `RELAY_URL` over and keep the classifier's honesty against the new endpoint. **Until that lands, the phone still does not ring** — this record does not claim otherwise.

## Verification

- **`--selftest`: 12 PASS, 0 failures**, run offline with `python3 -I` after my edits. It proves the caps that *are* the security model: topic pinned and never caller-supplied, title newline-stripped (header forgery) and capped at 120, message capped at 900, foreign link rejected, non-TLS github rejected, **lookalike host rejected**, bad priority → 4, and a dead bell fail-soft *with its reason*.
- **Lint clean. All 20 guards PASS.** 76 passing across `services-sync-guard`, `services-sync-degraded`, `interconnect-manifest` and `push-announce`.
- **Two guards caught me, and both were right.** `interconnect-guard` refused the service for having no declared place — *"NAS service:announce has no declared place in the flow graph"* — until it was registered (now 175 nodes, 421 connections, 26 NAS riders, 0 findings). Then `decision-citation-guard` refused the build for citing DR-1040 with no record written: *"A citation promises the reasoning is written down."* This file is that refusal being satisfied.
- **Not claimed: that the bell rings.** Nothing here has been run on the NAS. This sandbox has no route to it, and `/healthz` has not been probed from a runner. What is verified is the logic offline, the paths against a working installer, the manifest shape against a live entry, and the guards.
- **Not claimed: that #2057 is affected.** The dark Pages Functions and the dead bell are two separate faults that happen to be visible in the same probe.

**Not addressed:** site-health's own flow-graph entry does not declare that it rings a bell at all (it declares `gh:incident` and `gh:deploy-heal` only). True before this change and after it. It belongs with the cut-over, which is when the edge becomes real.

**#1255 is NOT closed, and that reverses DR-1027's dated action.** Its teachings are all mined, and its bell is now mined here — but it is a 110-file PR on a two-month-old base and I read 100 of its files, not all 110. Closing it on a 100-of-110 reading would be the same unmeasured confidence this session has already had to correct twice. `re-review: 2026-10-22` — read the remaining files, then close it.
