# Parallel Frameworks Evaluation

> **Status:** DRAFT, 2026-05-25. Written by Dispatch under Darrell's standing order: "propose parallel frameworks — search the project docs first, also I'm open to opportunities also considering constraints." Search done; this doc is grounded in what already exists in the repo plus the Synology / n8n lock-ins Darrell ratified mid-session 2026-05-25.
>
> **Reader posture:** mobile-first. Short sections, plain URLs, no jargon walls. If a section runs long, skim the bold lines.
>
> **Locked-in constraints (mid-session 2026-05-25, NOT re-litigated below):**
> - **Workflow tool: n8n.** Workflow JSON storage at `docs/00-foundations/n8n-workflows/` in the repo (git-tracked). Tier A is decided.
> - **Access path: Tailscale only.** Cloudflare Tunnel is off the table for primary access; mentioned below only as a *deferred family-share fallback* if Tailscale onboarding bottlenecks family adoption.
> - **Notifications: Pushover ($5 one-time license for Darrell's phone) AND ntfy (self-hosted on the Synology for family).** Dual-channel. Tier F's notification slot is decided.
> - **RAM ceiling: 32 GB ECC (DS1621xs max).** Darrell asked "32 or 64" — 64 is not supported on this chassis. Every alternative below is scored against the realistic 32 GB pool shared with Postgres + Ollama + app + n8n + everything else.
> - **Backup default: Backblaze B2 (~$6/mo).** USB external as the budget option. Tier F backup is decided.
> - **Vacation scope: Darrell-only week 1, family added week 2.** The 6-day install window only needs to support one user; family-onboarding work happens *after* return.
> - **Cost discipline: minimize PERPETUAL cost.** One-time costs fine. Paid SaaS not recommended as default when a free self-hosted alternative does the job. Paid options allowed as "rent-then-own" if they cut vacation-week risk significantly, but the migration path to the free version must be documented. Every tier below carries a "Perpetual cost at typical family usage" line.
>
> **Honesty notes baked into this eval:**
> 1. The earlier `_future/AI-INFRASTRUCTURE-SYNOLOGY.md` workup is explicitly **UNRATIFIED / parking lot** and predates the n8n lock-in. The decisions above supersede the "thin Node.js or Python gateway" framing for the workflow surface — n8n is now the gateway for ops; a gateway *binary* is still needed only for the LLM-call edge (Anthropic / Ollama proxy with system-prompt enforcement). Two distinct things.
> 2. The schema's app-layer triggers (Continual Improvement Loop §12.5, audit_log writes, link reconciliation, disclaimer acks) still live in Postgres + the React app. n8n sits *alongside* them — for external-facing flows (renter notifications, donor tax statements, Christina's marketing pipeline) — not as a replacement for in-database integrity.
> 3. The 6-day window with Darrell-only scope is genuinely doable. The risk is not "can it be installed" — it's "can it be installed *and* the numeric-table sync from `SESSION-HANDOFF-2026-05-24.md` also ship." Stack B below resolves that tension.

---

## TL;DR

**Recommendation: Stack B — Minimal-Surface n8n.** Ship n8n + Ollama + Tailscale + pgvector + Pushover/ntfy as the vacation-week stack. Skip the agent-framework tier (do multi-step inside n8n itself), skip the separate event-bus tier (Supabase Realtime + LISTEN/NOTIFY is enough), skip a separate vector store (pgvector), skip a separate IdP (Supabase Auth handles humans, Tailscale handles admin surfaces). One workflow surface, one inference engine, one push channel per audience, one DB. Everything else is post-vacation.

**This stack is genuinely installable in 6 days for Darrell-only access** because four of the seven tiers reduce to "use what's already in the stack." The new work is: install n8n, install Ollama, install ntfy, wire Tailscale, configure Pushover. Each is ~30-90 min on the DS1621xs. Total install: ~half a day. Remaining 5+ days: numeric-table sync (the actual unblock) + first n8n workflows + first Ollama model pulled + smoke test on vacation hardware.

Stack A is the maximal-as-locked-in baseline (every tier filled with the locked-in pick + the obvious obvious-default for the others). Stack C is the post-vacation ambitious roadmap.

**Total perpetual cost at family-scale usage:**
- **Stack B:** **~$6/mo Backblaze B2 + usage-based Anthropic API (~$5-20/mo realistic for family-scale Counseling).** Pushover is $5 ONE-TIME (amortizes to ~$0/mo). Everything else self-hosted = $0/mo.
- **Stack A:** **same as B** (~$6 + Anthropic).
- **Stack C:** **same as B** (~$6 + Anthropic) IF the Headscale + Authelia + OpenObserve additions all stay self-hosted — they do in the recommended pick. **If you opt for any Cloud variant (n8n Cloud, Tailscale Business, Sentry SaaS, Better Stack, etc.), each adds $5–25/mo.** Default in this eval = $0 cloud spend.

Goal achieved: ~$0/mo perpetual outside Backblaze B2 + variable Anthropic API. Every paid option is named below with the free alternative spelled out.

---

## What's already decided (the actual baseline going into vacation week)

**Locked / written into foundations or ratified this session:**

| Tier | Locked-in pick | Source |
|---|---|---|
| Data layer | Supabase self-hosted (Postgres + GoTrue + PostgREST + Realtime + Storage) on DS1621xs | `_future/SYNOLOGY-DEPLOY-PLAN.md` |
| Schema | v1/v1.1 live; v2.1-infra THIS WEEK before vacation | `SCHEMA-V2-MULTI-DOMAIN-DRAFT.md` |
| Workflow / orchestration | **n8n** (workflow JSON in repo at `docs/00-foundations/n8n-workflows/`) | This session's lock-in |
| Local inference engine | Ollama preferred (vLLM later if/when GPU lands) | `_future/AI-INFRASTRUCTURE-SYNOLOGY.md` |
| Hardware | DS1621xs · Xeon D-1527 · 32 GB ECC max · no GPU | This session's RAM clarification |
| Network exposure | **Tailscale only** for primary access | This session's lock-in |
| Notifications | **Pushover ($5) + ntfy (self-hosted)** dual-channel | This session's lock-in |
| Backup | **Backblaze B2 (~$6/mo)** default; USB external budget option | This session's lock-in |
| Multi-model pattern | Specialization router (Interpretation #2) when GPU arrives | `_future/AI-INFRASTRUCTURE-SYNOLOGY.md` |
| Vacation scope | Darrell-only week 1; family added week 2 | This session's lock-in |
| POE binding | People Over Everything — no silent autonomous actions; ack required on consequential outputs | `SCHEMA-V2-MULTI-DOMAIN-DRAFT.md` §2 |

**Open / unratified going into vacation week (this eval makes recommendations on):**
- Agent framework on top of n8n / on top of an LLM gateway (Tier C)
- Vector store choice (Tier D) — pgvector vs alternatives
- Event bus separate from Supabase Realtime (Tier E)
- Observability stack beyond Pushover/ntfy alerts (Tier F's ops dashboards)
- IdP beyond Supabase Auth and Tailscale (Tier G)
- LLM-call gateway binary — Node.js or Python; or skipped entirely by routing LLM calls *through* n8n's HTTP/AI nodes

---

## Constraints we're scoring against

Non-negotiable per the foundation docs + Darrell's lock-ins:

1. **Open-source runtime, vendor-independent.** Hosted services may be opt-in backends only.
2. **Portable across Docker hosts.** No DSM-only, no btrfs-only, no single-vendor APIs in the critical path.
3. **POE — People Over Everything.** No silent autonomous actions; human approval on consequential outputs; disclaimers logged.
4. **Mobile-first for Darrell.** Whatever ops surface emerges must be glanceable on his phone via Pushover.
5. **Christina + kids usability** (week 2 onward). Non-technical operators must not see infrastructure complexity.
6. **DS1621xs · 32 GB ECC max · CPU-only.** Every running container competes for this fixed pool. n8n alone is 300-500 MB idle, 1-2 GB under load. Postgres steady-state ~2-4 GB. Each Ollama model ~5 GB resident for a 7B Q4, ~8-10 GB for 13B. Math gets tight fast.
7. **6-day window before vacation, Darrell-only.** Family adoption is week 2 work; don't optimize the install for family the first week.
8. **Supabase is already in the stack.** RLS, Realtime, Storage, Auth all live there.
9. **HIPAA-adjacent isolation for TLC.** TLC's instance is RLS-isolated; any tool touching its data respects the instance boundary.

Scoring rubric per tier candidate, 1-5:
- **S (sovereignty):** open-source, self-hostable, no required vendor account.
- **H (32 GB hardware fit):** runs in <2 GB with Postgres + 1-2 small Ollama models + n8n also resident.
- **U (usability):** Darrell week 1, family week 2 — without seeing the tool itself.
- **D (6-day Darrell-only deliverability):** installable, configured, stable by 2026-05-31.
- **P (portability):** the docker-compose lifts cleanly to a different host.

---

## Tier A — Workflow / orchestration · LOCKED: n8n

**Decision locked.** n8n (https://n8n.io) is the workflow tool. Workflow JSON files live at `docs/00-foundations/n8n-workflows/` and are git-tracked alongside the schema.

**What this gets PoeTech:**
- 400+ pre-built nodes (HTTP, Supabase, Postgres, Anthropic, OpenAI, Ollama, Pushover, ntfy, Gmail, Slack, file ops, scheduler, etc.).
- Visual workflow editor — Christina or other operators *could* see and edit workflows in week 2+ (non-coding access).
- Workflow versioning via git (because JSON files live in the repo).
- Self-hosted, Docker-native, Postgres backend (can share the existing Supabase Postgres or run isolated).
- Free for internal use under n8n's Sustainable Use License — explicitly allowed for self-hosting + non-resale.

**What n8n *can't* do and we should be honest about:**
- **n8n is not a replacement for in-database integrity.** Schema-level triggers (audit_log writes, CIL cycle creation, disclaimer enforcement) stay in Postgres triggers + app-layer code per the schema doc. n8n handles *external-facing* flows (renter notifications, donor receipts, marketing automation, weekly summaries).
- **Visual workflows can hide complexity from code review.** A git diff on a workflow JSON file is often illegible. Compensate with: in-doc workflow descriptions in `n8n-workflows/README.md`, naming discipline, and PR notes that *describe* the change in English.
- **Debugging happens in the n8n UI, not in stdout logs.** Plan for Pushover alert on workflow failure; debug in the browser.
- **License risk:** the Sustainable Use License restricts SaaS resale. If PoeTech ever sells n8n-powered automation *as a service* to customers, the license question reopens. For now (internal use + customer-self-hosted instances), it's fine.

**RAM math at 32 GB ceiling:**
- n8n idle: ~400 MB
- n8n under load (10 concurrent workflows): ~1.5 GB
- Compatible with Postgres + 1 small Ollama model resident.
- Incompatible with: two large Ollama models + heavy n8n queue simultaneously. Sequence the heavy work — don't run a marketing-pipeline batch and a Counseling-response simultaneously.

**Workflow recommendations for week 1 (Darrell-only):**
1. **Daily summary digest** — read yesterday's `feedback`, `audit_log`, `incidents` from Postgres; format markdown; push to Pushover at 7 AM.
2. **Failure alert** — any workflow that errors → Pushover.
3. **Backblaze B2 backup status** — confirm last night's backup landed; if not, Pushover alert.
4. **Optional: Counseling-route smoke** — if Phase 1 LLM gateway ships, every Counseling submission lands a workflow that calls Anthropic, runs the drift test, returns response. Skip if gateway slips past vacation.

**Workflow recommendations for week 2 (family added):**
5. **Renter maintenance request received** → Pushover to Darrell, ntfy to family-ops topic, open `maintenance_requests` row, suggest assignee per `IDENTITY-ROLES-AUDIT.md`.
6. **New donor giving recorded** → ntfy to COLG-leadership topic, queue tax-statement update.
7. **Christina TLC inquiry intake** → ntfy to Christina's topic, route to clinician per acuity.

**Perpetual cost at typical family usage: $0/mo.** n8n self-hosted is free under the Sustainable Use License for internal/non-resale use. If you ever move to n8n Cloud (https://n8n.io/pricing), Starter is ~$20/mo and Pro is ~$50/mo — not recommended; the self-hosted instance you're running covers the same workflows. **Rent-then-own path:** none needed — self-host is the default and the install is short enough that the paid Cloud isn't a useful shortcut.

---

## Tier B — Local inference

**What this tier does:** run open-weights models on the Synology so AI surfaces can answer with family data without sending it to a vendor.

**Honest framing:** **CPU-only on a Xeon D-1527 with 32 GB shared is the constraint that decides everything here.** The hardware-options doc spells out the ceiling: 7B Q4 at 3-8 tokens/sec; 13B Q4 at 1-3; 30B sub-1. Acceptable for journal-style "submit and come back." Not for chat. This is the same conclusion no matter which engine you pick.

| Engine | S | H | U | D | P | Verdict |
|---|---|---|---|---|---|---|
| **Ollama** (https://ollama.com) | 5 | 4 | 5 | 5 | 5 | **Winner. Documented pick.** Trivial install, model library, sensible defaults, native n8n node. |
| **LocalAI** (https://localai.io) | 5 | 4 | 4 | 4 | 5 | OpenAI-API-compatible drop-in; more configurable. Add later if vendor-API-compatibility for non-Anthropic callers is needed. |
| **vLLM** (https://github.com/vllm-project/vllm) | 5 | 2 | 3 | 2 | 5 | Best throughput **on GPU.** CPU mode exists but isn't its design center. Defer until a GPU box appears. |
| **llama.cpp + custom shim** (https://github.com/ggerganov/llama.cpp) | 5 | 5 | 3 | 3 | 5 | Lowest footprint; finest control. Skip unless Ollama defaults become painful. |
| **LMStudio** | 3 | 4 | 5 | 4 | 2 | Desktop UI, not a server. Wrong shape for a NAS. **Out.** |

**Pick: Ollama for vacation week.** Pull one small model (Phi-3 Mini 3.8B Q4 or Qwen 2.5 3B Q4) — ~10-15 tok/sec — for the audit/classifier role from the AI workup's specialization router (Interpretation #2). Reserves headroom for n8n + Postgres + sync work.

**What Ollama on this box CANNOT do:** real-time 70B chat. Don't promise it. The hardware-options doc names a $1,200-$3,300 GPU build that unlocks it; that purchase decision is parked behind MVP-1 stability.

**RAM math:**
- Phi-3 Mini 3.8B Q4: ~2.5 GB resident
- Qwen 2.5 3B Q4: ~2 GB resident
- Llama 3.1 8B Q4: ~5 GB resident
- Qwen 2.5 14B Q4: ~9 GB resident
- 13B-class is the practical limit on this box with Postgres + n8n also live. Stick to ≤8B for week 1.

**Perpetual cost at typical family usage: $0/mo for Ollama itself (electricity only — ~$1-3/mo at the DS1621xs's baseline draw plus modest inference duty cycle). Variable: ~$5-20/mo Anthropic API at family-scale Counseling traffic** (estimate: 5–20 prompts/day × Claude Sonnet at ~$0.003-$0.015/k output tokens × ~500 tokens/response). Document actual usage in the Dev/Ops dashboard once it ships and re-estimate at month 1. **Rent-then-own path:** Anthropic is acceptable forever as opt-in per the binding principle; Phase 3 of the AI workup moves it to local-primary + Anthropic-as-fallback, which would cut variable cost to near-zero. Timeline gated on GPU spend decision per `_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`.

---

## Tier C — Agent / multi-step reasoning frameworks

**What this tier does:** orchestrate a model across multiple steps (audit → main response → drift-test → scripture-lookup → return).

**Honest framing:** **n8n's own AI / HTTP nodes can sequence these steps natively.** A dedicated agent framework only earns its keep when the orchestration needs *runtime branching with memory* across many turns (LangGraph's sweet spot) or *role-decomposition* (CrewAI's sweet spot). Phase 1 of the AI workup is linear — n8n's built-ins are enough.

| Framework | S | H | U | D | P | Verdict |
|---|---|---|---|---|---|---|
| **None — sequence in n8n directly** | 5 | 5 | 5 | 5 | 5 | **Winner for vacation week.** Already in stack; nothing to install. |
| **LangGraph** (https://github.com/langchain-ai/langgraph) | 4 | 3 | 3 | 3 | 5 | Graph-shaped orchestration on LangChain. Useful when steps branch + loop. Adds Python + LangChain deps. Earn-its-keep gate: n8n's AI nodes plateau. |
| **CrewAI** (https://www.crewai.com) | 4 | 3 | 3 | 3 | 5 | Multi-agent "crews" model. Good for explicit role-decomposition. Heavier abstraction than this codebase needs in Phase 1. |
| **Pydantic AI** (https://ai.pydantic.dev) | 5 | 4 | 4 | 4 | 5 | Lightweight Python framework, type-safe, no LangChain dep. **Closest match to "code-first, no magic" disposition.** Pick this one if you ever pick a Python framework. |
| **AutoGen** (https://github.com/microsoft/autogen) | 4 | 3 | 2 | 2 | 5 | Microsoft's multi-agent framework. Strong research; rougher prod. Skip. |
| **BAML** (https://www.boundaryml.com) | 5 | 4 | 3 | 3 | 5 | DSL for typed LLM calls. Strong typing; learning curve. Skip for week 1. |

**Pick: nothing in vacation week.** Sequence multi-step LLM flows in n8n. Revisit Pydantic AI if/when n8n's AI nodes hit a wall (likely months out).

**Perpetual cost at typical family usage: $0/mo.** Every framework above (LangGraph, CrewAI, AutoGen, Pydantic AI, BAML) is fully self-hosted free open-source. No paid tier exists that meaningfully improves on the OSS distributions for this use case. **Rent-then-own path:** N/A — no paid version is recommended.

---

## Tier D — Vector / RAG

**What this tier does:** semantic search over family data (Council Chamber sessions touching anxiety + work, scripture verses similar to a counseling response).

**Honest framing:** **pgvector is the lowest-friction default** because Postgres is already running. Same RLS, same backup, same audit. Adding a separate vector DB doubles the surface for backup, auth, RLS-equivalent enforcement. None earns its keep until pgvector demonstrably can't keep up.

| Store | S | H | U | D | P | Verdict |
|---|---|---|---|---|---|---|
| **pgvector** (https://github.com/pgvector/pgvector) | 5 | 5 | 5 | 5 | 5 | **Winner. Zero net-new infrastructure.** Good to millions of vectors with HNSW indexes. |
| **LanceDB** (https://lancedb.com) | 5 | 4 | 3 | 4 | 5 | Embedded vector DB. Strong for local-first; weaker for multi-instance RLS. |
| **Chroma** (https://www.trychroma.com) | 5 | 4 | 4 | 4 | 5 | Easy to start; weaker durability story than pgvector at small scale. |
| **Qdrant** (https://qdrant.tech) | 5 | 3 | 4 | 3 | 5 | Excellent dedicated vector DB; adds another container + storage + backup. |
| **Weaviate** (https://weaviate.io) | 5 | 2 | 3 | 2 | 5 | Capable but heavy. Defer. |

**Pick: pgvector.** Don't even discuss alternatives until a measured pgvector ceiling. Enable the extension when the first AI-RAG workflow lands; not before.

**Perpetual cost at typical family usage: $0/mo marginal** (pgvector is a Postgres extension; the Postgres instance is already running). **If you ever pick Qdrant Cloud** (https://cloud.qdrant.io/pricing) the starter tier is ~$25/mo — not recommended; self-host. **Rent-then-own path:** N/A — pgvector is the free default.

---

## Tier E — Event bus / queue

**What this tier does:** decouple producers (app writes a row) from consumers (n8n workflow triggers, gateway sends notification).

**Honest framing:** **Supabase Realtime is already in the stack and already broadcasts Postgres changes.** n8n has a Supabase trigger node that listens to Realtime directly. That's the event bus for free. A dedicated queue is only worth it when (a) at-least-once delivery beyond Realtime's at-most-once is needed, or (b) the worker offloads serious background compute Postgres LISTEN/NOTIFY can't carry.

| Bus | S | H | U | D | P | Verdict |
|---|---|---|---|---|---|---|
| **Supabase Realtime + Postgres LISTEN/NOTIFY (n8n trigger node)** | 5 | 5 | 5 | 5 | 5 | **Winner. Already there.** |
| **Redis + BullMQ** (https://docs.bullmq.io) | 5 | 4 | 4 | 4 | 5 | Add when n8n needs background job retries + delayed scheduling beyond its built-ins. Common Node.js pattern. |
| **NATS JetStream** (https://nats.io) | 5 | 5 | 3 | 3 | 5 | Excellent durable lightweight broker. Skip until the workload outgrows Realtime + n8n's queue. |
| **RabbitMQ** | 5 | 3 | 3 | 2 | 5 | Mature but heavier than NATS. Skip. |
| **Kafka** | 5 | 1 | 1 | 1 | 5 | Overkill for a family NAS. **Out.** |

**Pick: Supabase Realtime + LISTEN/NOTIFY consumed by n8n's Supabase trigger node.** n8n's built-in queue handles its own retries.

**Perpetual cost at typical family usage: $0/mo.** Supabase Realtime is part of the self-hosted Supabase stack. Redis, NATS, RabbitMQ are all free self-hosted. **No paid cloud variant is recommended** — Redis Cloud / Upstash / Confluent Kafka all start in the $5-50/mo range and add nothing here. **Rent-then-own path:** N/A.

---

## Tier F — Observability + alerting · LOCKED notifications: Pushover + ntfy

**Notification channels are decided:** Pushover ($5 one-time, https://pushover.net) for Darrell's phone; ntfy (self-hosted, https://ntfy.sh + https://docs.ntfy.sh/install/) for family topics. n8n has native nodes for both (or use the HTTP request node — both APIs are dead simple).

**What's still open in Tier F:** the *ops dashboard / log / metric* surface. Pushover + ntfy carry alerts; they don't carry "show me the last 50 workflow runs" or "what's the 95th-percentile Ollama response time."

| Tool | S | H | U | D | P | Verdict |
|---|---|---|---|---|---|---|
| **n8n's built-in execution log + in-app Dev/Ops dashboard backed by Postgres** | 5 | 5 | 5 | 4 | 5 | **Winner for vacation week.** n8n's UI shows recent workflow runs natively. Build the in-app Dev/Ops sub-tab (per the AI workup) to surface model latency + Postgres health + last backup. Christina-readable. |
| **Uptime Kuma** (https://github.com/louislam/uptime-kuma) | 5 | 5 | 5 | 5 | 5 | Up/down monitor. Pair with the in-app dashboard for the simplest "is anything on fire" surface. Pushover + ntfy notify on transitions. |
| **OpenObserve** (https://openobserve.ai) | 5 | 4 | 3 | 4 | 5 | Single-binary, lightweight ELK/Grafana alternative. Best standalone option if in-app proves insufficient. |
| **Grafana + Prometheus + Loki** | 5 | 3 | 2 | 3 | 5 | Industry standard but **three more containers** + dashboards-as-code. Defer until the in-app surface can't carry the load. |
| **Sentry (self-hosted)** | 5 | 2 | 3 | 2 | 4 | Strong error-tracking; heavy self-host footprint. Use SaaS only if the value justifies a vendor dep. |

**Pick for vacation week: n8n built-in execution log + Uptime Kuma + Pushover/ntfy.** All four tiers (workflow log, up/down, Darrell alerts, family alerts) covered without building anything new beyond Uptime Kuma's install.

**Backup status visibility:** add an n8n workflow that polls the B2 API after each scheduled backup and pings Pushover on success / failure. Backblaze B2 (https://www.backblaze.com/cloud-storage) is the locked-in destination.

**Perpetual cost at typical family usage:**
- **Pushover: $5 ONE-TIME license** for Darrell's phone (per-platform; iOS $5, Android $5 — separate if he wants both). Amortized: ~$0/mo. Notification volume is unlimited under that license. https://pushover.net/pricing
- **ntfy self-hosted: $0/mo.** Lives on the DS1621xs.
- **Uptime Kuma self-hosted: $0/mo.**
- **Backblaze B2: ~$6/mo** at ~1 TB of backed-up data ($6/TB/mo storage + $0.01/GB egress on restore; restores are rare). The budget alternative is a USB external drive plugged into the DS1621xs ($0/mo recurring, ~$60-100 one-time hardware) — viable for the "DS1621xs is on; the house didn't burn down" failure modes, NOT for ransomware or theft. **Recommendation:** keep B2 for the off-site protection; the $6/mo is honestly bought.
- **OpenObserve self-hosted (Stack C): $0/mo.** Grafana + Prometheus self-hosted: $0/mo.
- **Sentry SaaS: $26+/mo if/when adopted** — not recommended as default; self-host or skip.
- **Better Stack: $25+/mo** — fails sovereignty + cost. Out.

**Rent-then-own path for Tier F:** none needed — every locked-in pick already costs ≤$6/mo or is one-time.

---

## Tier G — Identity / family-shareable access · LOCKED access: Tailscale

**Access path is decided:** Tailscale only (https://tailscale.com). Cloudflare Tunnel is *off the table* for primary access — mentioned below only as a *deferred fallback* if family-onboarding to Tailscale stalls in week 2 or beyond.

**What this means in practice:**
- Darrell on phone + laptop: Tailscale client → DS1621xs Tailscale IP → app + n8n + admin surfaces.
- Family week 2: Tailscale client install on each family device → magic-link email invite. If family-device install fragility becomes the bottleneck (10yo twins, multiple devices), *then* consider opt-in family-share fallback — most likely a single Tailscale Funnel URL (still Tailscale's tech, no Cloudflare needed) rather than Cloudflare Tunnel. Tailscale Funnel: https://tailscale.com/kb/1223/funnel
- Admin surfaces (DSM, Container Manager UI, n8n editor, Uptime Kuma, ntfy admin): Tailscale-only forever. Never on Funnel.

**What's still open in Tier G:** the *identity* layer for application users (separate from network access).

| Provider | S | H | U | D | P | Verdict |
|---|---|---|---|---|---|---|
| **Supabase Auth (already in stack)** | 5 | 5 | 5 | 5 | 5 | **Winner.** Magic-link, GoTrue under the hood, RLS-aware. Handles internal `instance_members` AND external `external_users` per the schema. |
| **Tailscale (network-level access — LOCKED)** | 4 | 5 | 5 | 5 | 5 | **Complement, not alternative.** Locked-in. Tailscale is a vendor; the Headscale upgrade below is the sovereignty path. |
| **Authelia** (https://www.authelia.com) | 5 | 4 | 4 | 4 | 5 | Self-hosted SSO + auth-portal. Worth it when 3+ admin surfaces share users. Lighter than Authentik. |
| **Authentik** (https://goauthentik.io) | 5 | 3 | 4 | 3 | 5 | Self-hosted SSO. Capable but heavier than Authelia. |
| **Keycloak** | 5 | 2 | 3 | 2 | 5 | Enterprise IdP; overkill for a family NAS. Out. |
| **Headscale** (https://github.com/juanfont/headscale) | 5 | 4 | 4 | 3 | 5 | Self-hosted Tailscale control plane. **The eventual sovereignty upgrade** that retires the Tailscale vendor dep without losing the WireGuard mesh. Defer to Stack C. |

**Pick for vacation week: Supabase Auth for users + Tailscale (as locked) for access.** Add Authelia only if/when 3+ admin surfaces grow auth needs. Headscale is the sovereignty endgame for Tier G — parked for Stack C.

**Perpetual cost at typical family usage:**
- **Tailscale Personal: $0/mo** — free for up to 100 devices and 3 users. Family of 5+ exceeds 3 users on the Personal plan; the upgrade to **Personal Plus is $5/mo per user** for 6 users. So family-scale Tailscale is ~$0 if you stay under 3 named users (Darrell + Christina + a shared family-devices account is doable), or ~$30/mo at full family-of-six on Personal Plus. https://tailscale.com/pricing
- **Headscale self-hosted: $0/mo** — retires the per-user Tailscale cost AND the vendor dep. Setup is real (run the control-plane container on the DS1621xs, reconfigure each device's coordination URL); recommend tackling it post-vacation if the family-user count drives Tailscale's pricing past the free tier.
- **Supabase Auth: $0/mo** (self-hosted GoTrue, already in stack).
- **Authelia / Authentik / Keycloak self-hosted: $0/mo.**

**Rent-then-own path for Tier G — IMPORTANT:** Tailscale Personal Plus is the cleanest "rent" option for vacation week if you want Christina + kids on Tailscale week 2 without bumping into the 3-user free-plan ceiling. The "own" migration is **Headscale on the DS1621xs** (https://github.com/juanfont/headscale) — same WireGuard tech, your own control plane, $0/mo. Migration steps: (1) deploy headscale container; (2) change each device's coordination URL from `controlplane.tailscale.com` to your headscale URL via Tailscale CLI; (3) re-authenticate; (4) decommission Tailscale account. Probably a half-day of work post-vacation, no app downtime.

---

## Three candidate stacks

### Stack A — As-locked-in baseline (every decision filled with the locked-in pick + obvious default)

**Components:**
- Supabase self-hosted (Postgres + GoTrue + PostgREST + Realtime + Storage) on DS1621xs
- pgvector inside Postgres (enabled when first AI-RAG workflow lands)
- **n8n** for orchestration (workflow JSON in repo)
- Ollama with one small model (Phi-3 Mini or Qwen 2.5 3B Q4) for audit/classifier
- LLM-call gateway: **a thin Node.js binary OR n8n's HTTP/AI nodes directly** (decide based on whether the system-prompt enforcement work feels like 150 lines of Node or a 4-node n8n workflow — both are honest answers)
- App-layer triggers + Postgres triggers for schema-level integrity
- **Tailscale** for access (locked)
- **Pushover ($5) + ntfy (self-hosted)** for alerts (locked)
- n8n built-in execution log + in-app Dev/Ops dashboard + Uptime Kuma for observability
- **Backblaze B2 (~$6/mo)** for off-site backup (locked)
- Supabase Auth for users; Tailscale for admin access

**Pros:**
- Every locked-in decision honored.
- Sovereignty: 100% open-source runtime, Tailscale + B2 are the only vendor deps and both are opt-in / paid-once-style.
- Mobile-first ops: Pushover gets Darrell glanceable status.

**Cons:**
- Install + configure work for vacation week: n8n container, ntfy container, Uptime Kuma container, Ollama install + first model pull, Tailscale enrollment, Pushover license + token wiring, B2 bucket + Hyper Backup config. Each is short; cumulative is real.
- **Tension with the documented next-priority sync work** (verify-balances + numeric-table sync). Ship both or ship one — but be honest about budget.

**Risk: medium.** Volume of net-new install in the same week as numeric-table sync. Mitigation: see Stack B.

**What breaks at the 32 GB ceiling:** comfortable at idle (~6-8 GB total: Postgres ~3, n8n ~0.5, Ollama-3B ~2.5, ntfy ~0.2, Uptime Kuma ~0.3). Under heavy concurrent load (n8n batch + Ollama inference + Postgres-heavy sync write) headroom shrinks to ~10-12 GB. Acceptable. Adding a 13B model later or running two Ollama models simultaneously consumes the rest.

**6-day Darrell-only deliverability:** **Yes, tight.** Sequence install: day 1 n8n + Ollama, day 2 ntfy + Pushover + Uptime Kuma, day 3 first workflows + Tailscale on vacation hardware, days 4-6 numeric-table sync parallel.

---

### Stack B — Minimal-Surface n8n (RECOMMENDED for vacation week)

**Same as Stack A, but explicit decisions to NOT install anything optional:**

**Compared to Stack A — what's IN:**
- Supabase, n8n, Ollama (one small model), Tailscale, Pushover, ntfy, Backblaze B2, Supabase Auth, pgvector (enabled lazy).

**Compared to Stack A — what's DEFERRED:**
- **No separate LLM gateway binary.** Route LLM calls through n8n's HTTP/AI nodes for now. The system-prompt enforcement work becomes 1-2 n8n workflows instead of a separate Node service. (Trade-off: harder to unit-test than code; easier to install and edit.)
- **No Uptime Kuma in week 1.** n8n's built-in execution log + a single "is the app reachable" check inside an n8n cron is enough for one user.
- **No in-app Dev/Ops dashboard build** in week 1. n8n UI carries ops. Build the in-app dashboard week 3+.

**Pros:**
- **Smallest install footprint that still satisfies every locked-in decision.** Day 1: n8n, Ollama, Tailscale. Day 2: ntfy + Pushover. Days 3-6: numeric-table sync + first workflows + smoke test on vacation hardware.
- **Maximum vacation-week budget for the work that actually unblocks Christina (numeric-table sync).** This is the explicit trade — fewer new tools, more time for the documented next-priority.
- Smallest blast radius if anything goes sideways on vacation. Three new containers (n8n, ntfy, Ollama) instead of five.

**Cons:**
- No Uptime Kuma → no separate up/down check. If n8n itself dies, no alert. Mitigation: an external uptime check from Darrell's phone (Pushover's own "missed heartbeat" feature, or a quick scheduled task on a laptop).
- LLM-in-n8n is less testable than LLM-in-a-Node-binary. Plan to migrate to a thin gateway week 3+ as Counseling traffic grows.
- No in-app Dev/Ops dashboard means Christina (week 2) doesn't get a glance surface yet — she gets ntfy alerts only.

**Risk: low.** Defers risk to post-vacation. The deferred work is documented in the open-decisions list, not lost.

**What breaks at the 32 GB ceiling:** nothing — this is the thinnest viable stack. ~5-6 GB resident at idle. ~10 GB under concurrent load. Ample headroom to add a 7B-class model for Counseling once Phase 1 gateway work resumes.

**6-day Darrell-only deliverability:** **Yes, comfortably.** This is the stack to actually ship.

---

### Stack C — Ambitious (post-vacation, after MVP-1 stabilizes)

**Components beyond Stack A:**
- **Thin Node.js LLM gateway** (the Phase 1 piece from `_future/AI-INFRASTRUCTURE-SYNOLOGY.md`) — moves system-prompt enforcement + drift tests + scripture-version lookup out of n8n into a small dedicated service. Better testability; better latency.
- **LangGraph** (https://github.com/langchain-ai/langgraph) inside the Node gateway *or* a Python sidecar when multi-step branching becomes real.
- **Ollama with two small models loaded simultaneously** (Phase 2 of the AI workup: audit/classifier on model A, main response on model B) — only viable in 32 GB if both are ≤3B Q4, or after a GPU box lands per `_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`.
- **NATS JetStream** (https://nats.io) for durable event bus when Supabase Realtime + LISTEN/NOTIFY runs out of headroom.
- **pgvector still** — no separate vector DB until pgvector hits a measured wall.
- **Authelia** (https://www.authelia.com) when 3+ admin surfaces share auth.
- **Headscale** (https://github.com/juanfont/headscale) — self-hosted Tailscale control plane — to retire the Tailscale vendor dep.
- **OpenObserve** (https://openobserve.ai) for structured logs when n8n's built-in log + in-app dashboard outgrow themselves.
- **Tailscale Funnel** (https://tailscale.com/kb/1223/funnel) as the *family-share fallback* if Tailscale-client-per-device proves friction-heavy in week 2+ — Tailscale's own tech, no Cloudflare needed.

**Pros:**
- Real visual workflow surface (n8n) plus testable LLM gateway plus retired Tailscale vendor dep — sovereignty arc complete.
- Phase 4 of the AI workup ("parallel models — specialization router") becomes real shape, not theory (with GPU box).
- Better observability story for when PoeTech grows beyond family-only operators.

**Cons:**
- Five new containers beyond Stack A. Each is a backup story, an update story, a "did this break sync?" story.
- Setup is days, not hours. **Not appropriate for the 6-day window.** Post-vacation only.
- Total memory pressure under load: Postgres + n8n + 2× Ollama + NATS + Authelia + Headscale + OpenObserve + app + gateway = **comfortably fits 32 GB at idle, tight under concurrent load with two models.** GPU box (per hardware-options doc) is the real unlock if parallel-model serving becomes essential.

**Risk: medium.** Biggest risk is ops-attention surface, not breakage. Windmill, NATS, OpenObserve, Authelia all expect attention — the family isn't an ops team. Mitigation: each one earns its keep against a measured problem, not added speculatively.

**What breaks at the 32 GB ceiling:** parallel multi-model serving on CPU. Stack C's specialization-router phase really wants more memory than the DS1621xs has. The hardware-options doc's dual-3090 build at ~$2,000 is the actual unlock. Without GPU spend, Stack C runs serial-with-fast-switch, not true parallel.

**6-day Darrell-only deliverability:** no. Post-vacation roadmap, not vacation-week install.

---

## Recommendation, one screen

| Tier | Stack A (as-locked) | Stack B (recommended) | Stack C (post-vacation) |
|---|---|---|---|
| Workflow | n8n | n8n | n8n + LangGraph (when branching) |
| LLM gateway | Thin Node OR n8n nodes | n8n nodes | Thin Node gateway extracted |
| Inference | Ollama 1× small model | Ollama 1× small model | Ollama 2× models or GPU box |
| Agents | n8n built-in | n8n built-in | LangGraph / Pydantic AI |
| Vector | pgvector (lazy) | pgvector (lazy) | pgvector (no change) |
| Event bus | Realtime + LISTEN/NOTIFY | Realtime + LISTEN/NOTIFY | + NATS JetStream when needed |
| Observability | n8n log + in-app dash + Uptime Kuma | n8n log only | + OpenObserve + in-app dash |
| Notifications | **Pushover + ntfy (LOCKED)** | **Pushover + ntfy (LOCKED)** | **Pushover + ntfy (LOCKED)** |
| Access | **Tailscale (LOCKED)** | **Tailscale (LOCKED)** | + Headscale (retire vendor); Tailscale Funnel as family-share fallback if needed |
| Identity | Supabase Auth | Supabase Auth | + Authelia for admin SSO |
| Backup | **Backblaze B2 (LOCKED)** | **Backblaze B2 (LOCKED)** | **Backblaze B2 (LOCKED)** |
| 6-day Darrell-only fit | Tight | **Comfortable** | No |
| Sovereignty | Full (2 paid opt-in vendor deps: Tailscale + B2) | Same as A | Full + vendor deps retired |
| 32 GB RAM headroom | Comfortable at idle, tight under load | **Most comfortable** | Tight under concurrent load |
| **One-time cost** | **$5 (Pushover)** | **$5 (Pushover)** | **$5 (Pushover) + optional $1,200-$3,300 GPU box** |
| **Perpetual cost (typical family usage)** | **~$6/mo B2 + ~$5-20/mo Anthropic + ~$0-30/mo Tailscale** | **~$6/mo B2 + ~$5-20/mo Anthropic + ~$0/mo Tailscale (free tier)** | **~$6/mo B2 + ~$0-5/mo Anthropic after Phase 3** |
| **Total monthly perpetual at family scale** | **~$11-56/mo** | **~$11-26/mo (target)** | **~$6-11/mo after Phase 3** |

**Pick Stack B for vacation week.** It honors every locked-in decision, ships the smallest-footprint stack that satisfies them, and leaves room to actually finish the numeric-table sync work alongside. Earn Stack C after vacation, after MVP-1 has been used by the family week 2+, and after a real workflow pain has a name.

---

## Cost discipline summary

**The honest perpetual cost at family scale, week 1 Darrell-only:**
- Backblaze B2 backup: ~$6/mo (locked-in)
- Anthropic API: ~$5-20/mo at realistic Counseling usage (variable; tracked in Dev/Ops dashboard)
- Tailscale: $0/mo on Personal plan (Darrell alone = 1 user)
- Pushover: $0/mo (one-time $5 license)
- Everything else self-hosted: $0/mo
- **Subtotal week 1: ~$11-26/mo.**

**Week 2 onward, family added:**
- Tailscale Personal Plus may be needed if family-user count exceeds 3: ~$0-30/mo depending on user-count workaround (shared family-devices account = $0; full per-user pricing = $30/mo for 6 users).
- Backblaze B2: same ~$6/mo (data volume grows slowly with family use).
- Anthropic API: scales with usage; document and re-estimate at month 1.
- **Subtotal week 2+: ~$11-56/mo** depending on Tailscale account shape and Anthropic usage.

**Headscale migration retires the Tailscale variable** — $0/mo Tier G perpetual cost. Recommended Q3-2026 if family-user count is driving cost.

**Anthropic API migration to local-primary (Phase 3 of the AI workup) retires the Anthropic variable** — cuts perpetual cost to ~$6/mo (just B2). Gated on GPU spend decision per `_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`.

**Floor cost achievable with full self-hosting + Phase 3 local-primary:** ~$6/mo (Backblaze B2 only) + electricity. That's the long-term destination.

**Rent-then-own paths summarized:**

| Tier | Paid "rent" option | Migration to "own" | When to migrate |
|---|---|---|---|
| G access (family week 2+) | Tailscale Personal Plus ~$30/mo for 6 users | Deploy Headscale on DS1621xs; switch device coordination URLs | Q3-2026, post-vacation |
| B inference (variable Anthropic cost) | Anthropic API ~$5-20/mo | Phase 3 of AI workup: local Llama/Qwen primary, Anthropic fallback | Gated on GPU spend decision |
| F observability (deferred) | Sentry SaaS $26+/mo | Self-host Sentry, or use OpenObserve + in-app dashboard | Not recommended; self-host from day one |
| A workflow (deferred) | n8n Cloud $20+/mo | Self-host n8n on DS1621xs (already the plan) | Not recommended; self-host from day one |

**Items DELIBERATELY excluded from this eval on cost grounds:**
- Better Stack ($25+/mo) — fails sovereignty + cost together.
- Zapier / Make / Pipedream — fails sovereignty regardless of cost; ruled out per Darrell's constraints.
- Cloudflare Workers / Pages production hosting — already off the table for the AI gateway; Cloudflare Tunnel is the deferred family-share fallback only.
- Datadog, New Relic, PagerDuty — all $50+/mo enterprise tooling, unnecessary at family scale.



---

## Vacation-week install order for Stack B (Darrell-only)

**Day 1 (~3 hours):**
1. Container Manager → install n8n (Postgres-backend mode pointing at the existing Supabase Postgres OR isolated SQLite for week-1 simplicity; recommend isolated SQLite for vacation week to keep blast radius small)
2. Container Manager → install Ollama; pull `qwen2.5:3b-instruct-q4_K_M` or `phi3:mini`
3. Verify n8n UI reachable on `<dsm-ip>:5678`; verify Ollama responds on `:11434`

**Day 2 (~3 hours):**
4. Container Manager → install ntfy; create topics `pushover-mirror`, `family-ops`, `darrell`, `christina`, `colg-leadership` (most empty for week 1, ready for week 2)
5. On phone: install Pushover app; purchase $5 iOS or Android license; generate user-key + create PoeTech application token
6. n8n → wire Pushover credential + ntfy HTTP node; build "test alert" workflow; fire it; confirm phone receives
7. Tailscale: enroll DS1621xs (if not already), enroll Darrell's laptop and phone, confirm WireGuard mesh up

**Day 3 (~half day):**
8. n8n → build the 4 week-1 workflows: daily summary digest, workflow-failure alert, B2 backup status, optional Counseling smoke
9. Backblaze B2: create bucket; in DSM Hyper Backup install + configure weekly backup of `/volume1/docker/` to B2
10. Quick smoke: trigger each workflow manually; confirm Pushover arrives; confirm B2 sync runs

**Days 4–6:**
11. Numeric-table sync workstream per `SESSION-HANDOFF-2026-05-24.md` (verify-balances UI + `accounts-sync.js` + `debts-sync.js` + `transactions-sync.js` + smoke test)
12. Vacation departure smoke: app loads via Tailscale on Darrell's laptop + phone from outside the house; daily digest fires from the hotel.

**Week 2 (post-return, family added):**
13. Enroll Christina + kids on Tailscale; magic-link sign-in to the app; ntfy topic subscribe per person
14. Build week-2 workflows (renter maintenance, donor giving, TLC inquiry intake)
15. Decide on dedicated thin Node LLM gateway extraction (Stack C step 1) based on Counseling traffic + week-1 observations.

---

## Open decisions for Darrell

Things this eval did NOT resolve, in order of how soon they matter:

1. **Stack B or Stack A for vacation week?** Recommendation: Stack B (defer the LLM gateway binary, defer Uptime Kuma, defer in-app Dev/Ops dashboard build until post-vacation). Yes/no?
2. **n8n backend: isolated SQLite or share Supabase Postgres?** Recommendation: isolated SQLite for vacation week (smaller blast radius if anything misconfigures). Switch to Supabase Postgres post-vacation when the schema has settled. Acceptable?
3. **LLM-call routing in week 1: n8n's HTTP/AI nodes (Stack B) or a thin Node gateway (Stack A)?** Recommendation: n8n nodes for week 1; extract to Node gateway week 3+. Acceptable?
4. **Initial Ollama model: Qwen 2.5 3B Q4 or Phi-3 Mini 3.8B Q4?** Both fit comfortably; Qwen is generally stronger on reasoning; Phi-3 is faster and tighter. Recommendation: Qwen 2.5 3B Q4. Acceptable?
5. **Counseling-sub-tab PIN-encryption boundary** (open question #5 from the AI workup). Unresolved; affects whether the eventual gateway sees plaintext journal content. Doesn't block vacation week; needs deciding before Phase 1 gateway ships.
6. **GPU spend timing.** The hardware-options doc parks the dual-3090 build at ~$2,000 behind MVP-1 stability. Do you want that recommendation hardened into a Q3-2026 purchase target, or kept indefinitely parked? Doesn't block vacation week.
7. **Headscale vs. ongoing Tailscale-as-vendor.** Tailscale stays in all three stacks. Headscale is in Stack C. Acceptable to keep Tailscale-as-vendor indefinitely, or is the migration to Headscale a goal?

---

## Sources / links

**Internal (this repo):**
- `docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md` — the schema everything sits on top of.
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-SYNOLOGY.md` — the documented Phase 0→4 gateway sketch (parked).
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` — GPU decision support (parked).
- `docs/00-foundations/_future/SYNOLOGY-DEPLOY-PLAN.md` — Synology PWA + Supabase deploy plan.
- `docs/00-foundations/_root/INFRASTRUCTURE-PIPELINE.md` — original hybrid laptop+NAS pipeline.
- `docs/SESSION-HANDOFF-2026-05-24.md` — current state + numeric-table sync as next-priority workstream.
- `docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md` — portability principle.
- `docs/00-foundations/_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` — drift tests the gateway enforces.

**Locked-in tool homepages:**
- n8n: https://n8n.io
- Ollama: https://ollama.com
- Pushover: https://pushover.net
- ntfy: https://ntfy.sh — install https://docs.ntfy.sh/install/
- Tailscale: https://tailscale.com
- Backblaze B2: https://www.backblaze.com/cloud-storage

**Alternatives evaluated (links for follow-up reading):**
- Windmill: https://www.windmill.dev
- Activepieces: https://www.activepieces.com
- Trigger.dev: https://trigger.dev
- Inngest: https://www.inngest.com
- Temporal: https://temporal.io
- LocalAI: https://localai.io
- vLLM: https://github.com/vllm-project/vllm
- llama.cpp: https://github.com/ggerganov/llama.cpp
- LangGraph: https://github.com/langchain-ai/langgraph
- CrewAI: https://www.crewai.com
- AutoGen: https://github.com/microsoft/autogen
- Pydantic AI: https://ai.pydantic.dev
- BAML: https://www.boundaryml.com
- pgvector: https://github.com/pgvector/pgvector
- LanceDB: https://lancedb.com
- Chroma: https://www.trychroma.com
- Qdrant: https://qdrant.tech
- Weaviate: https://weaviate.io
- BullMQ: https://docs.bullmq.io
- NATS: https://nats.io
- OpenObserve: https://openobserve.ai
- Uptime Kuma: https://github.com/louislam/uptime-kuma
- Authentik: https://goauthentik.io
- Authelia: https://www.authelia.com
- Headscale: https://github.com/juanfont/headscale
- Tailscale Funnel (deferred family-share fallback): https://tailscale.com/kb/1223/funnel

---

*End of document. Drafted by Dispatch under standing order from Darrell, 2026-05-25. Not ratified — this is decision support that bakes in the mid-session lock-ins on n8n, Tailscale, Pushover+ntfy, Backblaze B2, and the 32 GB hardware ceiling. The recommendation is Stack B; Stacks A and C are documented so the decision is visible.*
