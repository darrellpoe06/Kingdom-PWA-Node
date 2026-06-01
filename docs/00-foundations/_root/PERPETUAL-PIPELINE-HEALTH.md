# Perpetual Pipeline Health — Resilience Standard for Every Workflow

**Declared by Darrell, 2026-05-29 evening from vacation:** "I need you to validate access and produce the best unbreakable processes for our pipelines and workflows." Joins THE-WAY, MIND-OF-CHRIST, EXCELLENCE-STANDARD, ANXIETY-CLARITY-PRINCIPLE, AI-FOUNDATION-INTERNAL-OPERATIONS, GOVERNANCE-EXECUTION-ADVISORY, SEED-DATA-AS-ASPIRATION, and BUSINESS-PROCESS-CONNECTIONS as senior foundation. Binding for every workflow we ship from this point forward AND for every existing workflow that gets touched.

## Why this exists

The system has had real outages already. Workflow 27 (Foundation Agent) silently drops data because /data/poetech-briefing/ isn't bind-mounted. Workflow 29 (waitlist) returned 500 because `require('http')` isn't in the Node allowlist. The Tailscale Funnel doesn't auto-restart on NAS reboot. Container restarts have lost state. These failures cost Darrell time, trust, and (most importantly) the system's credibility as something the family can rely on.

**"Unbreakable" is the standard.** Not "rarely breaks." Not "we can usually fix it." When a Poe family member opens their phone in the morning, the system works. When Christina drops feedback at 11pm, the system captures it. When Christian asks @nas a question while learning, the system answers. The cost of a failure is paid by the family member who reaches for the tool and finds it dead.

This document codifies the patterns every workflow MUST follow. Quality Gatekeeper (Role 10 per AI-TEAM-DISTRIBUTION) enforces these on every PR. Non-compliant workflows are blocked from merge.

## The thirteen rules

### Rule 1 — All persistence on bind-mounted host paths

Never write to a path inside the container's writable layer. Every `/data/*` directory used by any workflow MUST be a bind mount from `/volume1/PoeTech/*` on the host. The n8n container's own database (`/home/node/.n8n`) MUST be bind-mounted so workflows, credentials, and execution history survive container recreation.

**Why:** Container deletion or recreation wipes the writable layer. State must outlive the container.

**Enforcement:** Quality Gatekeeper flags any workflow code that writes to `/data/<dir>/` unless `<dir>` is in the documented bind-mount allowlist.

**Current bind mounts (as of 2026-05-29):** `/data/bank-imports`, `/data/finance-events`, `/data/chatin`. **Missing (must add post-vacation):** `/data/poetech-briefing`, `/data/waitlist` (sovereign workflow 29 currently uses `/data/finance-events/waitlist` as workaround).

### Rule 2 — Wrap every external I/O in try-catch with graceful degradation

Every `fetch()`, every `fs.writeFileSync()`, every external module call MUST be wrapped in try-catch. If the external dependency is unavailable (ntfy down, Ollama busy, Synology Chat unreachable, http module not in allowlist), the workflow MUST degrade gracefully — capture what it can locally, log the failure, return a useful response. Workflows MUST NOT 500 because of external dependency failures.

**Why:** External dependencies fail. Networks blink. Containers restart. The workflow must survive these.

**Enforcement:** Quality Gatekeeper greps for unwrapped `await fetch(`, `fs.write`, `require('http')`, etc. in workflow JSON code blocks.

### Rule 3 — Idempotent workflow design

Running the same workflow twice with the same input MUST produce the same result. No duplicate writes. No corrupt state on retry. Use ID-based deduplication (every record has a stable ID; second write with same ID is a no-op or overwrite).

**Why:** n8n retries failed executions. Network failures cause retries. Cron + on-demand fires double-trigger.

**Enforcement:** Every workflow writing records MUST include an ID generation step + a "already exists, skip" guard.

### Rule 4 — Health check per workflow + global health endpoint

Every workflow exposes a `/webhook/<name>-health` endpoint that returns `{ ok: true, last_run_at, last_run_status, ... }`. Workflow 20 (health-check) calls each of these every 10 minutes and pushes ntfy on any failure.

**Why:** "Is X working?" must be answerable in one HTTP call. Without per-workflow health, we discover failures by symptom (family member finds something broken) instead of by monitoring.

**Enforcement:** New workflows ship with a `-health` companion endpoint OR are added to workflow 20's polling list.

### Rule 5 — Standard error envelope on every response

Every workflow response MUST follow the shape `{ ok: true|false, error?: string, data?: any, id?: string, captured_at?: ISO }`. PWA + downstream workflows can handle every response uniformly.

**Why:** Inconsistent error shapes force every consumer to write custom handling. Each consumer becomes a place where errors slip through.

**Enforcement:** Quality Gatekeeper checks for the shape in the workflow's "Respond with JSON" node.

### Rule 6 — Funnel + container auto-restart on NAS boot

Tailscale Funnel MUST auto-start on NAS boot. n8n + ntfy + ollama containers MUST be marked `restart: unless-stopped`. A NAS reboot must restore the full system without manual intervention.

**Why:** The current Tailscale Funnel does NOT persist across reboots per the vacation runbook. A power blip during vacation = silent loss until Darrell SSHs in to fix it.

**Implementation:** Synology Task Scheduler runs the Funnel restart command on startup. Docker compose has `restart: unless-stopped` on all three containers.

### Rule 7 — Bearer token auth on all Funnel endpoints

Per Phase 1 of the n8n scaling plan: every webhook endpoint MUST verify a bearer token before processing. Token stored in n8n env var `WEBHOOK_AUTH_TOKEN`; PWA sends `Authorization: Bearer <token>` from `VITE_N8N_WEBHOOK_TOKEN` (build-time env var on Vercel).

**Why:** Unauthenticated public endpoints can be spammed to exhaust the container OR enumerated for data leakage. Even today's "obscure URL" security is one leak away from open.

**Enforcement:** Quality Gatekeeper greps for `path:` in webhook node configs and requires a matching `Authorization` check in the Code node downstream.

### Rule 8 — Rate limiting at the Funnel ingress

Caddy or nginx reverse-proxy in front of the n8n container with per-IP throttling. Cap default: 30 requests/min per IP for write endpoints, 60/min for read endpoints. Burst allowance: 2x the cap.

**Why:** Even with auth, a leaked or stolen token could be used at machine speed to exhaust resources.

### Rule 9 — Tests on every workflow (Role 8 + Role 9)

Every workflow ships with a Test Author-generated test suite that exercises: happy path, missing required fields, malformed input, external dependency failure (mocked), idempotency check. CI runs these on every PR.

**Why:** Workflows fail in production because they were only tested in dev. Tests catch the failure before merge.

**Enforcement:** Role 10 (Quality Gatekeeper) refuses merge for any new workflow without a test suite.

### Rule 10 — Workflow lifecycle states tracked in version control

Each workflow JSON in `docs/00-foundations/n8n-workflows/` has a `meta.lifecycle_state` field: `draft | active | deprecated | archived`. Changes to lifecycle state flow through PR review.

**Why:** Without explicit lifecycle, "is this workflow live?" becomes tribal knowledge. Tribal knowledge breaks when the keeper is on vacation.

### Rule 11 — Daily backup of n8n database + workflow JSONs

Restic runs nightly at 3am Central, backs up `/volume1/PoeTech/n8n-data/` (the bind-mounted n8n DB per Rule 1) to `/volume1/backups/n8n/` AND mirrors workflow JSONs to GitHub via daily commit.

**Why:** A failed migration, a corrupted DB, a wrong delete — all recoverable from yesterday's backup.

### Rule 12 — Monitoring + alerting via Uptime Kuma

Uptime Kuma runs on the NAS and polls every Funnel endpoint every 5 minutes. Failures push ntfy to Darrell + log to a public-readable status page (so family members can check "is the system up?" themselves).

**Why:** Status visibility is dignity. The family shouldn't have to ask "is it broken?" — the system tells them.

### Rule 13 — Standard documentation in every workflow

Every workflow JSON's Code node begins with a header comment block stating: purpose, POST body shape, return shape, bind-mount dependencies, env vars used, related foundation principles, lifecycle state. New Claude sessions read this to understand the workflow without reading n8n's UI.

**Why:** Self-documenting workflows are auditable. Auditable workflows are maintainable. Maintainable workflows are unbreakable.

## Recovery procedures (when something does break)

### Procedure A — Funnel unreachable

```
ssh dpoe@192.168.1.26 "sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --https=443 http://localhost:5678"
```

Verify with:

```
curl.exe -sS "https://poetech.tail5a2f35.ts.net/webhook/imported-transactions?limit=1"
```

### Procedure B — n8n container hung

```
ssh dpoe@192.168.1.26 "sudo /usr/local/bin/docker restart n8n"
```

Wait 30 seconds. Workflows resume from where they were.

### Procedure C — Workflow returning empty or 500

1. SSH into NAS.
2. `sudo /usr/local/bin/docker logs n8n --tail=200` — read recent log lines for the failing workflow.
3. Identify root cause (bind mount missing? Env var unset? Allowlist module needed?).
4. Fix in the workflow JSON in repo, push, then re-import to n8n via Container Manager terminal or web UI.

### Procedure D — Data corruption suspected

1. Stop n8n container.
2. Restore latest backup from `/volume1/backups/n8n/` (Restic restore).
3. Start n8n container.
4. Verify workflow + execution history present.

### Procedure E — Total NAS failure (worst case)

1. VACATION-BUDDY laptop (24/7 Tailscale node) stays online — minimum surface available via that path.
2. Restore from Restic backup to a spare device or fresh Synology.
3. Re-establish Tailscale + Funnel.
4. Total recovery time: ~4 hours with backup. Without backup: weeks.

## How this applies to the current state (2026-05-29)

**Workflow 27 (Foundation Agent)** — broken because of Rule 1 violation. Fix: add `/data/poetech-briefing/` bind mount. Then ALL its outputs persist. Then the autonomous response loop works.

**Workflow 29 (Waitlist)** — was broken (Rule 2 violation: `require('http')` not in allowlist). Fixed 2026-05-29 by switching to global `fetch`. Per Rule 1, persistence path moved to existing `/data/finance-events/waitlist/` mount.

**The Funnel** — currently violating Rule 6 (no auto-restart on boot). Fix queued for Phase 1 security pass.

**No workflow today violates Rule 5 cleanly** — but the standard isn't documented anywhere, so future drift is likely without this doc.

**No tests exist on any workflow** — Rule 9 violation across the board. Roles 8/9/10 are the path. Week 2 post-vacation.

**No per-workflow health endpoint** — Rule 4 partially met by workflow 20 generally; needs per-workflow expansion.

## Connection to other foundations

- **AI-FOUNDATION-INTERNAL-OPERATIONS** — perpetual health IS the foundation operating itself. Every recovery procedure runs without Darrell when possible.
- **GOVERNANCE-EXECUTION-ADVISORY** — Quality Gatekeeper (Role 10) enforces these rules at the merge gate. Foundation executes; Claude advises; Darrell governs which rule is loosened for what reason if ever.
- **BUSINESS-PROCESS-CONNECTIONS** — every visible surface promises something. The health rules above are what makes the promises keepable.
- **ANXIETY-CLARITY-PRINCIPLE** — a broken system is the worst clarity failure. The user expected the answer and got silence.
- **EXCELLENCE-STANDARD** — religion AND relationship. The religion is the thirteen rules (backbone). The relationship is the recovery procedures that name how we honor the family when things break anyway.
- **THE-WAY** — stewardship of the tool means the tool is reliable for the family it serves.

## Closing

Unbreakable is the standard. Every rule above has a reason and a recovery. Workflows that don't follow these rules are draft work, not production work, regardless of whether they're toggled active. The Quality Gatekeeper enforces; Darrell decides exceptions; the family experiences a system that holds.

Wire before you write. Test before you ship. Mount before you persist. Auth before you expose. Health-check before you trust. We all win. We create. Amen.
