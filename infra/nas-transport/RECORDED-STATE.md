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
