# Ops announce — the incident bell, sovereign (DR-0156, DR-0218)

When `site-health.yml` or the deploy's `verify-boot` files an incident on the
GitHub ledger, the runner ALSO posts here and this pushes to the family's phones
through the sovereign ntfy container (topic `darrell`). The GitHub issue stays
the record; the push is the announcement.

```
GitHub runner ──POST /announce/ops-announce (Bearer)──> Tailscale Funnel
                 ──> announce_server.py (127.0.0.1:8796) ──> ntfy ──> phones
```

## Why it was rebuilt

This replaces the n8n workflow `wf-ops-announce`, deleted 2026-08-16 with every
other n8n artifact (DR-0218 zero-n8n). On 2026-08-16 `site-health.yml` measured
Supabase at HTTP 402, filed the incident correctly, and the push returned:

```
{"code":404,"message":"The requested webhook \"POST ops-announce\" is not registered."}
```

**The bell had not rung for the whole outage.** Re-registering the workflow
would have re-armed a transport the house had just removed, so the relay is now
plain Python on the NAS — the DR-0083 lane, self-deployed by services-sync.

## Security model

The **topic is pinned server-side** (`darrell`). A caller supplies only
`title` / `message` / `url` / `priority`; a leaked bearer can never spray other
topics. `title` has newlines stripped (header injection) and is capped at 120;
`message` at 900; `url` is accepted ONLY when it matches `https://github.com/`
or `https://poetech.us/` (an unvalidated tap-through is a phishing link on a
lock screen) and is capped at 500; `priority` must be 1..5 or falls back to 4.
Auth is a constant-time bearer compare and **fails closed** — no token
configured means nobody gets in.

Fail-soft on BOTH sides: a dead bell returns `ok:true, delivered:false` with the
reason, so it never turns a passing probe red — and never hides why it was dead
(DR-0310: unknown is a third state, reported, not swallowed).

## Deploy

No hand on the box. It is registered in `infra/nas-loops/services.json`, so
services-sync installs, enables, starts, and proves it on the NAS's own clock —
merge to main IS the deploy (DR-0236). The installer reuses the bearer CI
already holds (`VITE_N8N_BEARER`), so no new GitHub secret is needed, and it
exits non-zero if `/healthz` does not answer.

## The one route line

The relay listens on `127.0.0.1:8796`. The fronting proxy needs `/announce/*`
mapped to it — the same shape as `/nas-photos`, `/scribe` and `/mcp`. The
installer does not blind-write a Caddyfile it cannot verify (DR-0076); if the
route is missing the service is still up locally and the runner's POST is
fail-soft, so nothing breaks — the bell just stays quiet until the route lands.

## Verify

```
python3 infra/nas-announce/announce_server.py --selftest
curl -sS http://127.0.0.1:8796/healthz
```
