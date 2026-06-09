# Sovereign AI Orchestrator — Node 1 Compute + NAS Registry

Production deployment for the PoeTech sovereign AI engine ("The Cage"). Two
tiers, one immutable audit spine, hard governance boundaries. Local-first,
Tailscale-gated, zero cloud dependency.

> Full architecture rationale: `docs/99-session-notes/2026-06-09-sovereign-ai-orchestrator-architecture.md`

## Topology (as ratified 2026-06-09)

| Node | Hardware | Role | AI compute? |
|------|----------|------|-------------|
| **Node 1** — Legion PC (Pristine AI Core / OBS) | 1x RTX 4070, 12 GB VRAM | Sovereign AI orchestrator: Ollama (GPU) + n8n + Uptime Kuma | Mon-Sat / off-hours ONLY. Never during Sun/Wed services. |
| **Node 2** — Church Production Switcher | 1x RTX 4070, 12 GB VRAM | NDI Router, Studio Monitor, Proclaim | **Forbidden** during shared active church hours. |
| **Registry** — Synology NAS | DS-class, Docker | PostgreSQL 16 + pgvector: the immutable Master Registry + backups | n/a (datastore) |

The registry (durable, append-only, backed up) lives on the NAS — **not** on
Node 1 — so the audit ledger survives an OBS-box reimage and the AI agent that
writes to the ledger cannot also rebuild the box that holds it. Compute is
ephemeral; the registry is sovereign truth.

## Layout

```
infra/ai-orchestrator/
  registry/                 # Tier 1 -> Synology NAS (Container Manager)
    docker-compose.yml      #   Postgres 16 + pgvector
    .env.example
    sql/
      001-audit-ledger.sql  #   Append-only, hash-chained, immutable ledger
  node1/                    # Tier 2 -> Legion PC (Docker Desktop / WSL2 + GPU)
    docker-compose.yml      #   Ollama (GPU) + n8n + Uptime Kuma
    .env.example
  scripts/
    guarded-action.sh       # The Cage: approval-gate + audit + health-gate + rollback
    actions/
      example-action.sh     # Action contract template (safe no-op)
```

## Deploy order

1. **Registry first** (NAS) — the ledger must exist before any guarded action can be recorded.
   See `registry/` and `sql/001-audit-ledger.sql`.
2. **Node 1 compute** — points n8n at the NAS Postgres; pulls the Architect model.
3. **The Cage** — `scripts/guarded-action.sh` wraps every pre-approved action.

Each directory's compose header carries its own step-by-step (Container Manager
and SSH paths), matching the convention in `infra/n8n/docker-compose.yml`.

## Hard governance boundaries (enforced, not aspirational)

- **VLAN protection** — `guarded-action.sh` refuses any action whose params
  reference a protected VLAN (`PROTECTED_VLANS`, e.g. tithing/financials + live
  production). The AI cannot alter routing on those VLANs. Period.
- **Allowlist only** — only scripts present in `scripts/actions/` AND listed in
  `ACTIONS_ALLOWLIST` may execute. Unknown actions are refused before any side effect.
- **Append-only audit** — every proposal/execution/rollback is INSERTed into the
  hash-chained ledger; UPDATE/DELETE are revoked at the DB role level and blocked
  by trigger. Tamper-evident by design.
- **Health gate + 120s rollback** — an action only "sticks" if Uptime Kuma reports
  healthy within 120s; otherwise the action's `rollback` runs automatically.
- **Schedule boundary** — heavy compute is operator-scheduled to off-hours; Node 2
  AI workloads are forbidden during church hours.

## Pending real-infrastructure values (held, not fabricated)

The two real network actions — `update_dns_blacklist.sh` and
`isolate_mac_address.sh` — are NOT shipped with invented controller commands.
They wire in once these are provided (see the architecture doc's open-questions
section): UniFi controller URL + auth method, Netgate/pfSense host, NetBird vs
Tailscale final choice, and the exact protected VLAN IDs.
