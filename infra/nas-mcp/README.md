# nas-mcp — the sovereign MCP server (2026-07-28 stateless), built now, inactive until armed

**What this is (DR-0244 / DR-0236).** The first house-served MCP endpoint: a stateless
2026-07-28-shape server over the NAS state the cloud sandbox can never reach itself —
the dispatch reel, the Code Task snapshot, and a read-only view of the Cage's brakes.
Built the day the direction landed (nothing waits — DR-0236), and **self-deploying**:
this service is in the `services.json` self-deploy manifest, so merging to main IS
the deploy — the NAS mirror pulls, the armed `services-sync` loop runs `install.sh`
(idempotent: token once, venv, systemd unit, best-effort Caddy `/mcp` snippet, then
a REAL discover round-trip as the health check), and `poetech-mcp.service` starts.
No hands in the path — the same lane that deploys scribe. This is not the
three-brakes class (request-driven, read-only, spawns nothing on a clock); the
brakes that govern the *deploy loop* are the nas-loops runner's own.

**Read-only v1, on purpose.** Every tool observes; none mutates. A write tool (flip a
brake, append an event) is a separate governance gate (DR-0089) with its own audit
path — not this file, not silently later.

**Protocol.** MCP 2026-07-28: no handshake, no sessions, no SSE. `POST /mcp` with
`MCP-Protocol-Version: 2026-07-28`, `Mcp-Method` (and `Mcp-Name` on `tools/call`),
JSON-RPC 2.0 body. Implemented: `server/discover`, `tools/list` (with `ttlMs` /
`cacheScope` cache hints, deterministic order), `tools/call`. Bearer auth
(`MCP_BRIDGE_TOKEN`); an unset token refuses everything.

**Verified before shipping (DR-0076).** The full round-trip was proven live in the
build sandbox against fixture state files: discover, list, all four tools, plus the
refusal paths (bad token 401, wrong protocol version 400, `Mcp-Method`/`Mcp-Name`
header mismatch 400, unknown tool -32602). The proof transcript is in the PR that
landed this directory.

## Fallback runbook (ConnectBot) — only if the loops runner is not armed

The primary path needs no one: `services-sync` installs and starts this on the
NAS's own clock (verified in the build sandbox: the installer's exact artifacts —
venv, stamped token, the unit's ExecStart — serve discover end-to-end). If the
nas-loops fleet is not armed on the NAS, these plain steps do the same thing by
hand. Paste-ready (ASCII only, one command per line):

```
cd /volume1/PoeTech
sudo python3 -m pip install fastapi uvicorn
sudo mkdir -p /volume1/PoeTech/nas-mcp
sudo cp /volume1/PoeTech/Kingdom-PWA-Node/infra/nas-mcp/mcp_server.py /volume1/PoeTech/nas-mcp/
cd /volume1/PoeTech/nas-mcp
MCP_BRIDGE_TOKEN=CHANGE-ME-REAL-TOKEN nohup python3 -m uvicorn mcp_server:app --host 127.0.0.1 --port 8795 &
```

Then add to the Caddyfile (same pattern as `/llm/*`):

```
handle /mcp {
  reverse_proxy 127.0.0.1:8795
}
```

Smoke test from the same shell (expects the discover envelope back):

```
curl -s -X POST http://127.0.0.1:8795/mcp -H "Authorization: Bearer CHANGE-ME-REAL-TOKEN" -H "MCP-Protocol-Version: 2026-07-28" -H "Mcp-Method: server/discover" -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"server/discover\"}"
```

**Environment overrides** (defaults match the dispatch-status convention):
`MCP_BRIEFING_DIR` (default `/volume1/PoeTech/poetech-briefing`),
`MCP_CAGE_STATE_DIR` (default `/volume1/PoeTech/ai-orchestrator/portable/state`).

**The trial that promotes this (DR-0143 evidence rule).** Staged, not adopted:
adoption happens when a real agent session reaches NAS state through this endpoint
(via the Funnel/same-origin transport) and the result is measured useful. Until
then it is a built, proven, inactive capability — exactly like the rest of the
fleet before its arming word.
