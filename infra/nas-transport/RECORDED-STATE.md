# RECORDED-STATE — the NAS public transport baseline (DR-0076 §5: characterize before you change)

**This file is the recorded truth any infra-mutating command must cite and preserve.**
Born 2026-07-30 from the incident that proved its absence: an installer ran
`tailscale serve --set-path` against an unrecorded baseline and REPLACED the
public Funnel exposure — the webhook transport went dark (probe runs
30507138138 / 30507540039: TLS resets from outside). No session may mutate the
transport without reading this file and keeping every entry true.

## The public Funnel (hostname poetech.tail5a2f35.ts.net, port 443 — PUBLIC via Tailscale Funnel, never merely `serve`)

| Path | Backend | Serves | Provenance |
|---|---|---|---|
| `/` | `http://127.0.0.1:5678` (n8n) | the ~13 LEGACY webhooks the app's same-origin transport still rides in production (photos, class-tutor, book-checkout, property-*, imported-transactions, …) until their DR-0218 migrations land | proven by every mcp-health probe 2026-07-29: n8n Express pages answered at the root (e.g. run 30461079669) |
| `/mcp` | `http://127.0.0.1:8795` (poetech-mcp.service) | the sovereign MCP server (DR-0244), read-only v1 | installed by services-sync run of 2026-07-30 (`services-sync: all services synced`, exit=0) |

## Rules bound to this file

1. **FUNNEL, never `serve`:** `tailscale serve` is tailnet-only and REPLACES the
   public exposure — the 2026-07-30 outage class. Public mounts use
   `tailscale funnel --bg --set-path <path> <backend>`; the root mapping is
   restored with `tailscale funnel --bg http://127.0.0.1:5678`.
2. **Every mutation cites this file** (`RECORDED-STATE:` comment) and updates it
   in the same merge when the intended state changes.
3. **The installer is the actuator of this baseline:** `infra/nas-mcp/install.sh`
   verifies and restores BOTH rows idempotently on every services-sync tick —
   the recorded state is self-healing, not memorial.
4. The n8n root mapping is LEGACY and shrinks only by DR-0218's order: removed
   from the pipeline first, then from this file — never the reverse.

## Verify-by (outside witness)

`mcp-health` (dispatch): `/mcp` → 401 = both rows healthy (the probe traverses
the Funnel, so a 401 proves root exposure AND the path mount);
TLS reset/000 = the Funnel itself is down — restore per rule 1 immediately
(DR-0107: a dark transport is the worst outcome).
