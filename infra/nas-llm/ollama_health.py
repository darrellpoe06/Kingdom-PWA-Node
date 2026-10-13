#!/usr/bin/env python3
"""
ollama_health.py -- pure, stdlib-only builder for the local-LLM health envelope.

DR-0218 zero-n8n / DR-0083 sovereign-Python: the LlmHealth card (app/src/
components/LlmHealth.jsx) used to read GET /n8n/webhook/llm-health, an n8n Code
node that transformed Ollama's /api/ps + /api/tags + /api/version into a single
envelope and computed `pinned` (the 2026-06-06 runaway signature) SERVER-SIDE
because it had the clock. This module is the deterministic replacement for that
Code node -- pure functions, no fastapi, no network -- so it is unit-testable in
CI (test_ollama_health.py) exactly like the JS normalizeLlmHealth parser it
feeds. llm_server.py's /llm/health endpoint does the three Ollama fetches and
calls build_health() here; NOTHING about the shape changes, so the app-side
parser and its proven-to-catch tests are untouched.

The envelope shape (what normalizeLlmHealth reads):
  { ok, version, loaded:[{name,size_vram,expires_at,pinned}],
    installed:[{name,size}], loaded_count, installed_count, any_pinned,
    generated_at }
"""
from datetime import datetime, timezone, timedelta

# A loaded model whose expiry is more than this far out is "pinned" -- the
# keep_alive=-1 / never-unload signature that ran away on 2026-06-06. Normal
# keep_alive is minutes; a real session never legitimately holds a model a full
# day, so a day-plus expiry is the honest attention line (not a magic sentinel
# year, which a future Ollama could change).
PINNED_THRESHOLD = timedelta(days=1)


def _parse_iso(ts):
    """Best-effort RFC3339 -> aware datetime; None if unparseable/absent."""
    if not ts or not isinstance(ts, str):
        return None
    s = ts.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        # Ollama may emit more precision / a far-future sentinel that fromisoformat
        # on old Python can't parse; fall back to the leading date.
        try:
            dt = datetime.fromisoformat(s[:19])
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_pinned(expires_at, now):
    """Is this loaded model effectively never going to unload? True when its
    expiry is absent or more than PINNED_THRESHOLD beyond `now`."""
    dt = _parse_iso(expires_at)
    if dt is None:
        # Present-and-loaded but no readable expiry -> treat as pinned (worst case,
        # surfaced for a look; honest over a painted "fine").
        return bool(expires_at)
    return (dt - now) > PINNED_THRESHOLD


def build_health(ps_json, tags_json, version, now=None):
    """Compose the health envelope from the three Ollama responses. Pure: pass
    `now` for deterministic tests; defaults to real UTC time on the NAS."""
    if now is None:
        now = datetime.now(timezone.utc)

    ps_models = (ps_json or {}).get("models") or []
    tag_models = (tags_json or {}).get("models") or []

    loaded = []
    for m in ps_models:
        if not isinstance(m, dict):
            continue
        expires_at = m.get("expires_at")
        loaded.append({
            "name": str(m.get("name") or "(unnamed)"),
            "size_vram": m.get("size_vram") if isinstance(m.get("size_vram"), int) else None,
            "expires_at": expires_at,
            "pinned": is_pinned(expires_at, now),
        })

    installed = []
    for m in tag_models:
        if not isinstance(m, dict):
            continue
        installed.append({
            "name": str(m.get("name") or "(unnamed)"),
            "size": m.get("size") if isinstance(m.get("size"), int) else None,
        })

    any_pinned = any(m["pinned"] for m in loaded)
    return {
        "ok": True,
        "version": str(version) if version else None,
        "loaded": loaded,
        "installed": installed,
        "loaded_count": len(loaded),
        "installed_count": len(installed),
        "any_pinned": any_pinned,
        "generated_at": now.isoformat().replace("+00:00", "Z"),
    }
