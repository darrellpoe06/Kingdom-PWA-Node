#!/usr/bin/env python3
"""
llm_server.py -- the sovereign LLM path (replaces the n8n LLM proxying).

Darrell 2026-07-21 (DR-0218 zero-n8n; DR-0083 sovereign-Python; DR-0132 P2): the
interactive LLM calls (class-tutor, and any ask->answer feature) went through
/n8n/webhook/<x> -> n8n -> local Ollama. This is the deterministic replacement:
a thin FastAPI wrapper around the family's OWN local Ollama (qwen2.5) on the NAS
-- no n8n, no vendor, no data leaving the box. The APP builds the system prompt
(e.g. class-tutor's tutorSystemPrompt, grounded in Ari's persona + the week's
authored content), so this server carries NO curriculum copy and NO doctrine --
it only relays the chat to Ollama and returns the reply. Mirrors the
tax_upload_server / whisper-gpu FastAPI pattern.

  POST /llm/chat   { model, system, messages:[{role,content}] }
    headers: Authorization: Bearer <LLM_BRIDGE_TOKEN>
    -> { ok, reply, source:"local", model }   (the shape normalizeTutorReply reads)

Security (PERPETUAL-PIPELINE-HEALTH): bearer auth; PRIVATE + LOCAL-ONLY (never a
vendor -- DATA-AS-EMPOWERMENT / DR-0073 private->local-only); message-count +
size caps; a request timeout; degrades to a clean error so the app shows its
authored fallback (never a fabricated answer -- DR-0076). Deterministic-first:
this file does NOT decide routing (that is llm-router.js, the build pipeline);
it just serves local chat.

Run on the NAS:
    LLM_BRIDGE_TOKEN=<same bridge token the app uses> \
      uvicorn llm_server:app --host 127.0.0.1 --port 8791
Caddy: handle /llm/* { reverse_proxy 127.0.0.1:8791 }
"""
import os
import json
import urllib.request
import urllib.error

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

OLLAMA = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
TOKEN = os.environ.get("LLM_BRIDGE_TOKEN", "")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "qwen2.5")
MAX_MESSAGES = 40
MAX_CHARS = 24000          # total chars across system + messages
TIMEOUT_S = 90

app = FastAPI()


@app.get("/llm/health")
def health():
    return {"ok": True, "backend": OLLAMA, "model": DEFAULT_MODEL}


def _clean_messages(system, raw):
    msgs = []
    if isinstance(system, str) and system.strip():
        msgs.append({"role": "system", "content": system})
    for m in (raw or [])[:MAX_MESSAGES]:
        if not isinstance(m, dict):
            continue
        content = m.get("content")
        if not isinstance(content, str) or not content.strip():
            continue
        role = "assistant" if m.get("role") == "assistant" else "user"
        msgs.append({"role": role, "content": content})
    return msgs


@app.post("/llm/chat")
async def chat(request: Request):
    if TOKEN:
        if request.headers.get("authorization", "") != ("Bearer " + TOKEN):
            return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"ok": False, "error": "bad-json"}, status_code=400)

    model = str((body or {}).get("model") or DEFAULT_MODEL)
    messages = _clean_messages((body or {}).get("system"), (body or {}).get("messages"))
    if not messages:
        return JSONResponse({"ok": False, "error": "no-messages"}, status_code=400)
    total = sum(len(m["content"]) for m in messages)
    if total > MAX_CHARS:
        return JSONResponse({"ok": False, "error": "too-large"}, status_code=413)

    # Call the family's OWN local Ollama (stdlib only -- no extra deps). Non-stream
    # so we return one clean reply.
    payload = json.dumps({"model": model, "messages": messages, "stream": False}).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA + "/api/chat", data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError) as e:
        # Ollama down / model not pulled / timeout -> clean failure, app falls back.
        return JSONResponse({"ok": False, "error": "llm-unavailable", "detail": str(e)}, status_code=502)

    reply = ""
    if isinstance(data, dict):
        msg = data.get("message")
        if isinstance(msg, dict):
            reply = msg.get("content") or ""
        reply = reply or data.get("response") or ""
    reply = (reply or "").strip()
    if not reply:
        return JSONResponse({"ok": False, "error": "empty"}, status_code=502)
    return {"ok": True, "reply": reply, "source": "local", "model": model}
