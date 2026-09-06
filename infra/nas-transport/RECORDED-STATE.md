# RECORDED-STATE — the NAS public transport baseline (DR-0076 §5: characterize before you change)

**This file is the recorded truth any infra-mutating command must cite and preserve.**
Born 2026-07-30. Honest cause history (DR-0100 — no over-claim): an installer
shipped a `tailscale serve --set-path` command (wrong: `serve` is tailnet-only
and would REPLACE the public exposure, not add to it). Probe runs 30507138138 /
30507540039 showed TLS resets from outside around that window. **Diagnostic run
30507928325 then established the CLI was never on the non-login SSH PATH, so the
`serve` command NEVER RAN** — the TLS resets' cause is therefore UNCONFIRMED and
must not be attributed to that command. What IS verified: `poetech-mcp.service`
is active and answers 401 on `127.0.0.1:8795`; the funnel root (n8n) is up; only
the public `/mcp` path mount is missing, because the CLI path was unresolved.
The rule this file exists to enforce stands regardless: no session mutates the
transport without reading this file, keeping every row true, and using `funnel`
(never `serve`).

## The public Funnel (hostname poetech.tail5a2f35.ts.net, port 443 — PUBLIC via Tailscale Funnel, never merely `serve`)

| Path | Backend | Serves | Provenance |
|---|---|---|---|
| `/` | `http://127.0.0.1:5678` (n8n) | the LAST FEW un-migrated wires (thought, practice-growth, mark-noise, the dispatch-status reel); everything family-facing — photos, money — is ALREADY sovereign | **LEGACY, being removed to ZERO (DR-0218). No code in this repo restores or heals this row; it shrinks as each wire is cut over, then the row is deleted.** |
| `/mcp` | `http://127.0.0.1:8795` (poetech-mcp.service) | the sovereign MCP server (DR-0244), read-only v1 | installed by services-sync run of 2026-07-30 (`services-sync: all services synced`, exit=0) |
| `/nas-photos` | `http://127.0.0.1:8099` (poetech-photo-server.service) | the sovereign property/family/album photo server (DR-0268) — the same-origin Pages Function `/nas-photos/*` proxies here | intended state added 2026-08-03 (DR-0268 merge); actuated idempotently by `infra/nas-property-photos/install.sh` via services-sync; watched by the funnel-watchdog loop + site-health's outside-in probe. NOTE (honest history): the app cut photo reads over to this route 2026-07-01, but the mount was never recorded here and site-health's first-ever probe of the hop (2026-08-03 22:11/22:56) found the endpoint dark — this row + its actuator + its witnesses are the close. |
| `/sb` | `http://127.0.0.1:8800` (supabase kong gateway) | the SOVEREIGN Supabase stack (DR-0306/DR-0310) — auth, REST, realtime and storage for every app; the same-origin Pages Function `/sb/*` proxies here | mounted idempotently by `infra/nas-supabase/install.sh` since the repoint. NOTE (honest history): this row was MISSING from this table until 2026-09-06 — the mount was real and correct, but rule 2 was not kept, so the single most load-bearing route in the system was undeclared. Found by `scripts/funnel-actuation-guard.mjs` on its first run, not by a human. |
| `/taxes` | `http://127.0.0.1:8790` (poetech-tax-upload.service) | the sovereign tax archive (DR-0330) -- ONE backend for all three calls the Books -> Taxes screen makes: `POST /taxes/upload`, `GET /taxes/archive.json`, `GET /taxes/files/.../*.pdf`; the same-origin Pages Function `/poetech-app/taxes/*` proxies here | intended state added 2026-09-06 (DR-0330 merge); actuated idempotently by `infra/nas-tax-ingest/install.sh` via services-sync. NOTE (honest history): the app cut tax uploads AND archive reads over to this route 2026-07-21, but the service had no installer, no manifest entry and no mount here, so for ~7 weeks the upload POST reached a backend that was never started and the archive GET fell through the root to n8n -- the screen said "Could not reach the NAS upload service" and "NO RETURNS INDEXED YET" simultaneously, reported by Darrell 2026-09-06. Exactly the `/nas-photos` failure class one row up. The reads are served by the service rather than Caddy on purpose: nothing in this repo can verify the NAS Caddyfile, and DR-0076 forbids editing a config we cannot verify. |

## UNACTUATED — same-origin routes that currently reach nothing

**These are declared gaps, not accepted ones.** Each has a Pages Function that
faithfully forwards to the Funnel, and a Funnel with nothing mounted at the other
end — so the call falls through the root to n8n and the app silently serves its
authored fallback. This is the exact shape of the 2026-09-06 tax-upload defect
(DR-0330) and of the `/nas-photos` gap before it (DR-0268): built, correct, never
actuated, invisible because every layer the repo could see was green.

This ledger exists because `scripts/funnel-actuation-guard.mjs` found all of them
in one run while the tax fix was being built. Listing them here is what turns an
invisible gap into a counted one; the guard REQUIRES a re-review date on each
line, so nothing can be parked here quietly (DR-0075). A new route may not be
added to this list to get past the gate — it is a record of what was already
broken on 2026-09-06, and it is meant to shrink to nothing.

Each needs the same three pieces the tax fix supplies: a service that answers, an
installer registered in `infra/nas-loops/services.json`, and a mount recorded in
the table above.

- `/llm` — `infra/nas-llm/llm_server.py` exists; no installer, no manifest entry, no mount. re-review: 2026-09-20
- `/scribe` — service IS installed (`infra/nas-scribe/install.sh`, port 8791) but reaches the Funnel only via a best-effort Caddy snippet that nothing can verify; needs a real mount. re-review: 2026-09-20
- `/ways` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/reviews` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/review-feed` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/review-action` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/property-history` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/automation-status` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/interest` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/wake-orchestrator` — no NAS-side provider found in the repo. re-review: 2026-09-20
- `/wake-orchestrator-control` — no NAS-side provider found in the repo. re-review: 2026-09-20

**Honest limit of this ledger (DR-0076 §8).** "No provider found in the repo" is a
statement about THIS REPOSITORY, not a measurement of the NAS. None of these were
probed from outside; a route listed here could be answered by something on the NAS
that the repo does not describe. The re-review is what settles each one — by
probing it, not by reasoning about it.

## Rules bound to this file

1. **FUNNEL, never `serve`:** `tailscale serve` is tailnet-only and REPLACES the
   public exposure. Public mounts use `tailscale funnel --bg --set-path <path>
   <backend>` with the FULL DSM binary path
   `/var/packages/Tailscale/target/bin/tailscale` (the CLI is not on the
   non-login SSH PATH — diagnostic 30507928325). **No rule here restores the
   n8n root; we do not prop up what we are removing.**
2. **Every mutation cites this file** (`RECORDED-STATE:` comment) and updates it
   in the same merge when the intended state changes.
3. **The installer actuates ONLY the sovereign `/mcp` row:** `infra/nas-mcp/install.sh`
   mounts `/mcp` idempotently and NEVER touches, depends on, or restores the
   n8n root — we do not heal what we are removing.
4. The n8n root mapping is LEGACY and shrinks only by DR-0218's order: removed
   from the pipeline first, then from this file — never the reverse.

## Verify-by (outside witness)

`mcp-health` (dispatch): `/mcp` → 401 = both rows healthy (the probe traverses
the Funnel, so a 401 proves root exposure AND the path mount);
TLS reset/000 = the Funnel itself is down — restore per rule 1 immediately
(DR-0107: a dark transport is the worst outcome).
