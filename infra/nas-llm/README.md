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
the reply. The same generic `/llm/chat` contract now serves every interactive
ask→answer feature — **class-tutor**, **talk-about** (the spoken "explain this
screen"), and **thought-finalize** (the 4th-dimensional framework pass) — each
sending its own `system` + `messages`. On any failure (Ollama down, model not pulled, timeout) it returns a
clean error and the app shows its **authored walkthrough** — never a fabricated
answer (DR-0076).

## How it runs (no hand step)

`install.sh` is on the services-sync clock (`infra/nas-loops/services.json`,
`llm`; DR-1649). Each cycle it reads the existing family bridge key, builds the
venv once, keeps `poetech-llm.service` on `127.0.0.1:8804` following the repo's
code, proves the door answers on loopback, and only then mounts `/llm` on the
public Funnel. The app reaches it same-origin through the Pages Function
`app/functions/llm/[[path]].js`. The Funnel strips the mount path, so each
route answers with and without the `/llm` prefix.

Ollama must be running with the model pulled (`ollama pull qwen2.5`). When it
is not, `/llm/health` answers 502 with the reason in words and the app shows
its authored walkthrough. With no family key set, the door refuses every chat.

## Also served here: GET /llm/health

`GET /llm/health` is the sovereign replacement for the `wf-llm-health` n8n Code
node (DR-0218). It reads Ollama's own `/api/version` + `/api/ps` + `/api/tags`
and composes the exact envelope the **LlmHealth** Build-board card reads —
loaded/installed models, VRAM, and the **pinned** (2026-06-06 keep_alive runaway)
signal computed server-side (it has the clock). The composition is the pure,
stdlib-only `ollama_health.build_health`, unit-tested in CI
(`test_ollama_health.py`) alongside the JS `normalizeLlmHealth` parser it feeds.
Honest offline: box unreachable → `{ ok:false }` → the card says "not connected"
rather than painting health.

## Not this server

`thought` (a relay into the agent inbox) and `llm-review` (a served static report)
are separate cutovers — a Supabase insert and a Caddy-served JSON file — not this
interactive chat proxy.
