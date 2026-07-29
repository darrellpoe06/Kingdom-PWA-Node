#!/usr/bin/env python3
"""
mcp_server.py -- the sovereign MCP server (MCP 2026-07-28 stateless shape).

Darrell 2026-07-29 (DR-0244; DR-0236 nothing-waits): the MCP 2026-07-28 spec
made the protocol core stateless -- no initialize handshake, no Mcp-Session-Id,
every request self-describing -- which means an MCP endpoint deploys exactly
like the rest of the DR-0132 FastAPI fleet: plain request/response behind
Caddy on the NAS. This is that endpoint, BUILT TODAY and shipped INACTIVE
(nothing starts it; the runbook in README.md is the activation, by the
Governor's ConnectBot hand -- DR-0225: brakes gate activation, never building).

What it serves (v1, READ-ONLY by design -- least privilege; any write tool is
a later governance gate, DR-0089): the house state the cloud sandbox can never
reach on its own -- "the sessions' hands on NAS state" (DR-0244):

  dispatch_reel    -> last N lines of the append-only event reel (_reel.jsonl)
  dispatch_state   -> the Code Task snapshot (_dispatch_state.json)
  orchestrator_brakes -> the Cage's brake files (KILL_SWITCH/ARMED/WAKE_SUMMON/
                         lock) + budget env, read-only, never flipped from here
  health           -> the server's own liveness + which state paths resolve

Protocol shape (2026-07-28): POST /mcp with the MCP-Protocol-Version and
Mcp-Method headers (Mcp-Name for tools/call); JSON-RPC 2.0 body. Implemented
methods: server/discover, tools/list (with ttlMs/cacheScope cache hints,
deterministic order), tools/call. No sessions, no SSE, no held-open streams --
any request can land on any instance. State across calls, if ever needed,
follows the spec's own guidance: explicit visible handles as tool arguments
(SWIMLANES' durable-state law), never transport-hidden state.

Security (PERPETUAL-PIPELINE-HEALTH): bearer auth (MCP_BRIDGE_TOKEN, refused
empty); read-only filesystem access limited to the named state paths; size
caps; degrades to clean JSON-RPC errors, never a fabricated payload (DR-0076).
The NAS being Tailscale/LAN-only reachable is the outer wall, same as the
dispatch-status convention.

Run on the NAS (see README.md for the ConnectBot runbook):
    MCP_BRIDGE_TOKEN=<token> uvicorn mcp_server:app --host 127.0.0.1 --port 8795
Caddy: handle /mcp { reverse_proxy 127.0.0.1:8795 }
"""
import json
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

PROTOCOL_VERSION = "2026-07-28"
SERVER_INFO = {"name": "poetech-nas-mcp", "version": "0.1.0"}

TOKEN = os.environ.get("MCP_BRIDGE_TOKEN", "")
BRIEFING_DIR = os.environ.get("MCP_BRIEFING_DIR", "/volume1/PoeTech/poetech-briefing")
CAGE_STATE_DIR = os.environ.get(
    "MCP_CAGE_STATE_DIR", "/volume1/PoeTech/ai-orchestrator/portable/state"
)
REEL_MAX = 50            # same cap the dispatch-status convention serves
MAX_BODY_BYTES = 65536   # an MCP call here is small; anything bigger is wrong
LIST_TTL_MS = 300000     # tools change only by deploy; 5 min is honest

app = FastAPI()


def _rpc_error(req_id, code, message, status=200):
    return JSONResponse(
        {"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}},
        status_code=status,
    )


def _rpc_result(req_id, result):
    return JSONResponse({"jsonrpc": "2.0", "id": req_id, "result": result})


# Deterministic order (SEP-2549: cacheable lists need a stable order).
TOOLS = [
    {
        "name": "dispatch_reel",
        "description": "Last N events from the append-only dispatch reel "
                       "(_reel.jsonl), newest first. Read-only.",
        "inputSchema": {
            "type": "object",
            "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": REEL_MAX}},
        },
    },
    {
        "name": "dispatch_state",
        "description": "The Code Task snapshot (_dispatch_state.json). A null or "
                       "stale snapshot_at means the orchestrator is offline -- "
                       "reported as-is, never freshened (DR-0076). Read-only.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "health",
        "description": "This server's liveness and which state paths resolve.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "orchestrator_brakes",
        "description": "The Cage's brake state, read-only: KILL_SWITCH / ARMED / "
                       "WAKE_SUMMON file presence and the lock dir. This tool can "
                       "NEVER flip a brake -- observation only.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


def _tail_jsonl(path, limit):
    """Last `limit` parsed lines of a JSONL file, newest first. Missing file or
    bad lines degrade to what is honestly readable -- never an invented event."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            lines = fh.readlines()
    except OSError:
        return {"ok": False, "events": [], "note": "reel file not readable at " + path}
    events = []
    for line in lines[-limit:]:
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except ValueError:
            events.append({"unparsed": line[:500]})
    events.reverse()
    return {"ok": True, "events": events}


def _read_json(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return {"ok": True, "data": data}
    except OSError:
        return {"ok": False, "data": None, "note": "not readable at " + path}
    except ValueError:
        return {"ok": False, "data": None, "note": "not valid JSON at " + path}


def _brake_state():
    def present(name):
        return os.path.exists(os.path.join(CAGE_STATE_DIR, name))
    return {
        "ok": os.path.isdir(CAGE_STATE_DIR),
        "stateDir": CAGE_STATE_DIR,
        "killSwitchEngaged": present("KILL_SWITCH"),
        "armed": present("ARMED"),
        "wakeSummonConsented": present("WAKE_SUMMON"),
        "lockHeld": present("orchestrator.lock"),
        "note": "observation only; brakes are flipped by their own audited "
                "surfaces, never by this tool",
    }


def _call_tool(name, args):
    if name == "dispatch_reel":
        limit = args.get("limit", REEL_MAX)
        if not isinstance(limit, int) or not (1 <= limit <= REEL_MAX):
            limit = REEL_MAX
        return _tail_jsonl(os.path.join(BRIEFING_DIR, "_reel.jsonl"), limit)
    if name == "dispatch_state":
        return _read_json(os.path.join(BRIEFING_DIR, "_dispatch_state.json"))
    if name == "orchestrator_brakes":
        return _brake_state()
    if name == "health":
        return {
            "ok": True,
            "protocolVersion": PROTOCOL_VERSION,
            "briefingDirResolves": os.path.isdir(BRIEFING_DIR),
            "cageStateDirResolves": os.path.isdir(CAGE_STATE_DIR),
        }
    return None


@app.post("/mcp")
async def mcp(request: Request):
    # Bearer auth first; an unset token refuses everything (a missing brake is
    # a missing brake -- the portable bundle's own rule).
    auth = request.headers.get("authorization", "")
    if not TOKEN or auth != "Bearer " + TOKEN:
        return _rpc_error(None, -32001, "unauthorized", status=401)

    if request.headers.get("mcp-protocol-version") != PROTOCOL_VERSION:
        return _rpc_error(None, -32600,
                          "MCP-Protocol-Version header must be " + PROTOCOL_VERSION,
                          status=400)

    body = await request.body()
    if len(body) > MAX_BODY_BYTES:
        return _rpc_error(None, -32600, "request too large", status=413)
    try:
        rpc = json.loads(body.decode("utf-8"))
    except ValueError:
        return _rpc_error(None, -32700, "parse error", status=400)

    req_id = rpc.get("id")
    method = rpc.get("method", "")

    # Header-based routing (SEP-2243): Mcp-Method must match the body.
    header_method = request.headers.get("mcp-method", "")
    if header_method != method:
        return _rpc_error(req_id, -32600, "Mcp-Method header must match body method",
                          status=400)

    if method == "server/discover":
        return _rpc_result(req_id, {
            "protocolVersion": PROTOCOL_VERSION,
            "serverInfo": SERVER_INFO,
            "capabilities": {"tools": {}},
        })

    if method == "tools/list":
        return _rpc_result(req_id, {
            "tools": TOOLS,
            "_meta": {"ttlMs": LIST_TTL_MS, "cacheScope": "public"},
        })

    if method == "tools/call":
        params = rpc.get("params", {}) or {}
        name = params.get("name", "")
        if request.headers.get("mcp-name", "") != name:
            return _rpc_error(req_id, -32600, "Mcp-Name header must match tool name",
                              status=400)
        result = _call_tool(name, params.get("arguments", {}) or {})
        if result is None:
            return _rpc_error(req_id, -32602, "unknown tool: " + name)
        return _rpc_result(req_id, {
            "content": [{"type": "text", "text": json.dumps(result)}],
            "isError": not result.get("ok", True),
        })

    return _rpc_error(req_id, -32601, "method not implemented: " + method)
