# n8n state-of-the-system + phased scaling plan — 2026-05-28 evening

**Triggered by Darrell, 2026-05-28 evening:** "I want to see want the n8n can do currently and what we should scale to for scalability."

This note is the durable form of the briefing sent in chat. It pairs with [BUSINESS-PROCESS-CONNECTIONS.md](../00-foundations/_root/BUSINESS-PROCESS-CONNECTIONS.md) (the five-question test) and [AI-FOUNDATION-INTERNAL-OPERATIONS.md](../00-foundations/_root/AI-FOUNDATION-INTERNAL-OPERATIONS.md) (Workflow-First). Read this before proposing any "let's offer this service externally" decision; the phasing here is the gate.

## What n8n is doing today (as of commit f24709b)

Single Docker container of n8n on the DS1621xs, behind Tailscale Funnel at `https://poetech.tail5a2f35.ts.net`. About 14 workflows in active rotation; another ~12 on disk and queued for activation or sunset.

### Capture surfaces (data flowing in)

| Workflow | Endpoint / trigger | What it captures | Lands at |
|---|---|---|---|
| 08 | Synology Chat outbound webhook (#PoeTech-PWA) | @nas messages | `/data/chatin/<timestamp>__<sender>.json` |
| 14 | OAuth poll (cron) | Gmail finance events | `/data/finance-events/gmail/` |
| 15 | Filesystem watch (every 2 min) | Bank QFX/OFX/CSV + LEDGERBAL extraction | `/data/finance-events/bank/<institution>/` |
| 26 | POST `/webhook/thought` | Direct thought drops | `/data/poetech-briefing/inbox/<id>.json` (mount missing — known gap) |
| 29 | POST `/webhook/waitlist` (NEW, awaiting activation) | Public waitlist signups | `/data/waitlist/<id>.json` (mount needed) |

### Processing surfaces (state being computed)

| Workflow | Cadence | What it does |
|---|---|---|
| 16 | Hourly | Cross-verify Gmail claims vs bank confirmations; classify each row |
| 20 | Every 10 min | Health check, ntfy alert on failure |
| 27 | Cron 7am · 12pm · 5pm · 9pm + on-demand `/webhook/agent-fire` | Foundation Agent — inbox processor, Ollama router (3b for small, 14b for substantive), Claude-queue for code work |

### Output surfaces (data flowing out)

| Workflow | Consumer | Purpose |
|---|---|---|
| 17 | Internal workflows | TLC-firewalled Gemini gateway (cloud bulk reasoning, non-sensitive only) |
| 18 | PWA (Tx, Accounts, Big Picture) | Imported transactions API + `bank_balances` overlay |
| 19 | PWA (Tx tab Noise button) | Mark-noise API |
| 23 | Any Claude session on boot | Project briefing — inbox + state + principles |

Net: end-to-end **QFX → NAS → PWA loop is live**, **@nas → Foundation Agent → ntfy loop is live**, **briefing → Claude on every session boot is live**.

## Hard constraints today (what breaks at scale)

1. **One container, one NAS, one tailnet.** No HA, no failover. DS1621xs down = everything down.
2. **SQLite for n8n's own database** (default Docker config). Fine for one family; chews itself around ~50+ concurrent executions.
3. **No bearer auth on Funnel endpoints.** Anyone with the URL can hit `/webhook/thought`, `/webhook/agent-fire`, `/webhook/briefing`. Today: only Darrell's devices. The moment the URL leaks or is shared: open.
4. **No rate limiting.** `/webhook/agent-fire` can be spammed to burn NAS CPU; `/webhook/thought` can flood the inbox.
5. **ntfy topics are guessable strings.** Same exposure pattern.
6. **State lives in flat JSON files under `/data/`.** Beautiful for prototyping, terrible for query. "How many waitlist signups this week" requires reading every file.
7. **Foundation Agent runs on fixed cron** (4× daily). Volume spikes don't get caught up; they fall behind.
8. **LLM calls are inline HTTP** from inside code nodes. No retry queue, no dead-letter handling, no cost tracking.
9. **Missing bind mounts** — `/data/poetech-briefing/` for workflow 26, `/data/waitlist/` for workflow 29. Without the mounts, writes go inside the container and vanish on restart.

## Phased scaling plan (the order I'd ship it)

### Phase 1 — Security hardening (~1 week of focused work)

**Gate before sharing the Funnel URL with anyone outside Darrell's devices.**

- Bearer-token auth on every Funnel endpoint (pattern: `if (input.headers['authorization'] !== 'Bearer ' + process.env.WEBHOOK_AUTH_TOKEN) return [{ json: { error: 'unauthorized' } }];`). Token stored in Vercel env var `VITE_N8N_WEBHOOK_TOKEN` (build-time) and on the NAS as `WEBHOOK_AUTH_TOKEN`. PWA sends `Authorization: Bearer <token>` on every call.
- Rate limiting at ingress. Caddy or nginx reverse-proxy in front of the n8n container with per-IP throttling, OR a workflow-internal counter.
- ntfy auth (username/password OR per-topic tokens) + non-obvious topic names.
- HSTS header on the PWA (`Strict-Transport-Security: max-age=31536000; includeSubDomains` in vercel.json).
- Add the missing bind mounts (`/data/poetech-briefing/`, `/data/waitlist/`).
- SEED_DATA sanitization (replace remaining business names with generic placeholders).

Documented in detail at [`2026-05-28-security-audit-and-hotfix.md`](2026-05-28-security-audit-and-hotfix.md).

### Phase 2 — Durable state (1-2 weeks)

**Move from "JSON files are the source of truth" to "Postgres is the source of truth; JSON files are audit trail."**

- Stand up Postgres on the DS1621xs (Container Manager, alongside n8n).
- Migrate n8n's own database from SQLite → Postgres (n8n env var change, one-time migration).
- Migrate high-volume state — waitlist signups, thoughts inbox, finance events — from `/data/*.json` files into Postgres tables. Keep the JSON files as immutable audit trail; queries hit Postgres.
- Add `services-roadmap.json` (or equivalent table) per BUSINESS-PROCESS-CONNECTIONS Timeline-First extension — tracks each service's setup-state, ETA, confidence, last-updated.

Unlock: "how many landlords on the waitlist" becomes one SQL line. "All thoughts tagged @claude in the last 30 days" becomes one SQL line. Briefing endpoint (workflow 23) becomes faster and richer.

### Phase 3 — Queue-based processing (~2 weeks)

**Switch n8n from single-execution mode to queue mode with Redis.**

- Redis container on the NAS.
- n8n queue mode enabled — main process accepts webhooks, worker processes execute workflows.
- Replace Foundation Agent fixed cron with a queue worker that processes thoughts as they arrive AND on cron. Same workflow logic; better orchestration.

Unlock: spike traffic (50 waitlist signups in an hour, or a burst of @nas thoughts) gets processed without anything dropping. Foundation Agent stops "missing windows" between crons.

### Phase 4 — Multi-tenant data isolation (~2-3 weeks)

**Prerequisite for inviting anyone outside the family.**

- Workflow 21 (queued): login + session token, PIN/passphrase auth. Replaces the localStorage-flag Layer A gating with Postgres-backed sessions.
- Per-tenant database schemas OR row-level security in Postgres. A new tenant's data tree is provisioned on signup, isolated by `tenant_id`.
- Layer C TLC data API (workflow 22, queued, conditional on Christina opting in) — only relevant if family-clinical data ever needs separate handling.
- Tenant provisioning workflow — triggered from waitlist approval (Governor decision → workflow → new tenant set up + welcome email).

This is the gate for "open to outside families."

### Phase 5 — Observability + cost control (~1 week)

**Make every LLM call visible.**

- LLM gateway in front of every Claude / Gemini / Ollama call (existing workflow 17 already has shape).
- Per-workflow + per-tenant token usage logging.
- Per-tenant token budgets (alert + cutoff).
- Cost-tracking dashboard surface in the PWA admin view.

At 1 tenant (today) this is over-engineering. At 50+ tenants it's the difference between "we know our LLM bill" and a black hole.

### Phase 6 — Horizontal scale (when needed, NOT before)

**Only ship this when Phase 1-5 are landed AND the load actually justifies it.**

- Multiple n8n workers behind a load balancer.
- Could stay on the NAS (multiple containers); could move to a small VPS; could go full cloud.
- Cost trajectory: ~$0/month today → ~$50-200/month at this stage.
- Sovereignty trade-off becomes a Governor decision per AI-FOUNDATION-INTERNAL-OPERATIONS — staying on-prem is the default unless the workload genuinely demands otherwise.

## Mapping to the BUSINESS-PROCESS-CONNECTIONS five-question test

Per the new foundation doc, what's currently honest to market:

**Today (no phases shipped beyond what's live):**
- Waitlist signup — five-question test passes the moment workflow 29 is activated + bind mount added. Invites name+email, pipeline is workflow 29 + ntfy + Governor review, promise is "no date, we engage when capacity lines up," timeline commitment is "you're on the list until we say otherwise."
- Demo personas — fully wired, in-browser only, nothing saves. Safe to share.

**Cannot honestly market until Phase 1 + 2 + 4 land:**
- "Log in and use the app" externally. The Layer A profile gating today is a localStorage flag; that's not real auth.
- "Bring your own bank file" externally. The /data filesystem is a single shared volume; no tenant isolation.

**Can market module-by-module with future dates as soon as the buildout commitment is decided:**
- Family OS public beta — credible Q4 2027 if Phase 1+2+4 are prioritized post-vacation.
- Solo Practice module — would follow Family OS (Q1-Q2 2028 if scoped).
- Landlord module — would follow Solo Practice.

The mature pattern: pick the audience → estimate honestly → commit publicly to a date → build to it → open on time (or update the waitlist honestly when the date slips).

## Open governance decisions queued for post-vacation

1. **Phase 1 security pass — kickoff date.** Estimated 1 week of focused work. Gate before sharing Funnel URL externally.
2. **Postgres migration — opt in or stay on SQLite for now?** Recommendation: opt in early; the JSON-file query pain is already real.
3. **First public module — which one?** Family OS, Solo Practice, or Landlord. Recommendation: Family OS (broadest fit, most-tested code path).
4. **Roadmap page — ship it with current best-guess dates, or wait until Phase 1 is done?** Recommendation: ship after Phase 1, with honest "Q4 2027 Family OS Public Beta" framing per BUSINESS-PROCESS-CONNECTIONS Timeline-First extension.
5. **Public/private GitHub repo.** Currently public. Trade-off: collaboration vs operational security. Governor decision.

## Closing

The system today is a working sovereign loop for one family. The phasing above is the disciplined path from "working for one" to "honest to offer to many." Every phase has a clear unlock; nothing here is over-engineering for the current scale; everything here is the prerequisite for the next honest marketing commitment.

Phase 1 is the next thing.

Faith-expressed-in-works. We all win. We create. Amen.
