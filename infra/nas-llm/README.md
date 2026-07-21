# nas-llm — the sovereign LLM path (replaces n8n LLM proxying)

DR-0218 zero-n8n / DR-0083 sovereign-Python / DR-0132 P2. The interactive LLM
calls (class-tutor, and any ask→answer feature) used to go through an n8n webhook
that proxied to the family's local Ollama. `llm_server.py` is the deterministic
replacement: a thin FastAPI wrapper around the family's OWN Ollama (`qwen2.5`) on
the NAS — no n8n, no vendor, no data leaving the box.

## Contract

```
POST /llm/chat   { model, system, messages:[{role,content}] }
  headers: Authorization: Bearer <LLM_BRIDGE_TOKEN>
  → { ok, reply, source:"local", model }        (the shape normalizeTutorReply reads)
```

The APP builds the system prompt (e.g. `class-tutor.js` `tutorSystemPrompt`,
grounded in Ari's persona + the week's authored content), so the server carries
**no curriculum copy and no doctrine** — it only relays chat to Ollama and returns
the reply. On any failure (Ollama down, model not pulled, timeout) it returns a
clean error and the app shows its **authored walkthrough** — never a fabricated
answer (DR-0076).

## Run it (NAS, SSH / ConnectBot)

```
cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-llm
pip3 install --user fastapi "uvicorn[standard]"      # once (stdlib does the Ollama call)
LLM_BRIDGE_TOKEN="<same bridge token the app uses>" \
  uvicorn llm_server:app --host 127.0.0.1 --port 8791
```

Ollama must be running with the model pulled (`ollama pull qwen2.5`). Route it
same-origin in the Caddy site block so the app reaches it at `/llm/*`:

```
handle /llm/* {
    reverse_proxy 127.0.0.1:8791
}
```

For public poetech.us, the `/llm/*` path also needs a Cloudflare Pages Function
proxy to the Funnel (mirror `app/functions/n8n/[[path]].js`); on the sovereign
NAS-Caddy instance it is same-origin already. Until the server + route are up the
tutor degrades to its authored walkthrough (a designed fallback, not a break).

## Not this server

`thought` (a relay into the agent inbox) and `llm-review` (a served static report)
are separate cutovers — a Supabase insert and a Caddy-served JSON file — not this
interactive chat proxy.
