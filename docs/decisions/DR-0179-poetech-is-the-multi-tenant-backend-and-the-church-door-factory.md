# DR-0179 — PoeTech is the pooled multi-tenant backend for every business AND every church (the church-door factory)

- **Status:** accepted (a Way — names + hardens what already exists; the productization lanes are Tier C per client/church)
- **Scope:** `infra/supabase/*` (the `instances`/RLS model), `scripts/tenancy-guard.mjs` (Check E), `infra/supabase/migrations-auto/0095-instance-id-index-coverage.sql`, `docs/00-foundations/_root/CLIENT-BUSINESS-FACTORY.md` (the sibling factory), `app/src/lib/church-instance.js` / `resolve-church.js` / `church-own-door.js` (the church plumbing)
- **Date:** 2026-07-12
- **Principles:** COMMUNITY-FIRST (COLG-first, then generalize), DATA-AS-EMPOWERMENT (sovereign, RLS-walled, never extracted), VERIFICATION-DOCTRINE (gates, not claims), APP-IS-PRIMARY, GOVERN-EXECUTE-ADVISE, RELEASE-TIERS

## Directive

DP 2026-07-12: "Maybe PoeTech should be the backend for all businesses we build for... research best practices and scalability models," and "We have sister and/or brother ministries — they will want a church app as well with their church nicknames or the same. How can we do this? Make this one of our Ways and document."

## Reality-trace (this is naming what already exists)

PoeTech is **already** a pooled multi-tenant backend: **one** Supabase project, **one** codebase, isolation per-organization by **Row-Level Security on `instance_id`** via the `user_in_instance()` membership function (~145 instance-scoped tables). Real tenants already run on it — the Poe family, **COLG (the church)**, Moore Divahs, TLC therapy, Poe Properties. Onboarding a new one is **config-first**: a row in the door registry rendered by one generic door (`DR-0114` client-business factory; `?biz=<slug>`), its own RLS-walled instance, its pipeline as ONE-CRM config (DR-0081). The church already has its own resolver (`join_church_instance`), per-church record (`resolve-church.js` / `default-church.js`), and branded install (`church-own-door.js`, DR-0174).

## Research (2025 multi-tenant SaaS best practice)

- Three models on a cost↔isolation spectrum: **shared-schema + tenant_id + RLS (pooled)** — cheapest, simplest, "the most resource-efficient option for early-stage products"; schema-per-tenant; DB-per-tenant. **RLS is the 2025 standard for pooled**, and PoeTech runs it.
- **Do not rely on RLS *alone*** — a 2024 Postgres CVE (CVE-2024-10976) showed RLS can leak across tenants under connection pooling; best practice is **defense-in-depth** (app/gate enforcement *plus* RLS). Our tenancy guard (DR-0060) is exactly that — the research validates the posture.
- **Index the RLS column** (instance_id leading) — the #1 pooled-scale perf killer.
- Migrating shared→DB-per-tenant after ~500 tenants is a 6–12 month re-architecture — so the model + the scaling triggers are a recorded decision, not drift.

## Decision (the Way)

1. **PoeTech IS the shared multi-tenant backend for every business and every church we build.** Default model: **pooled shared-schema + `instance_id` + RLS**. New tenants onboard as **config rows / new instances**, not forks — one codebase, one CRM, one tenancy wall (DR-0114, DR-0081).
2. **The church-door factory is the sibling of the client-business factory.** A **sister/brother ministry** gets its **own branded church app** — **its own nickname/brand or COLG's shared brand** — as a church **instance** on this backend, with the **full church feature set** (worship/live, sermons, giving, prayer, the Word, events) rendered by the same church surfaces COLG uses. COLG-first, then generalize (COMMUNITY-FIRST rail-generalize; the multi-church directory + `resolve-church` already anticipate this). Multi-site research pattern: **per-congregation branding + giving, one donor profile across sites, consolidated network reporting.**
3. **Defense-in-depth is binding, and gated.** Isolation never rests on RLS alone: the deterministic **tenancy guard** (DR-0060) is a required check, now with **Check E — every instance-scoped table must index `instance_id`** (0095 added the 34 that lacked it; 145/145). A new tenant table can't ship without RLS *and* an index.
4. **Scaling triggers (when a tenant graduates off the pool).** Stay pooled by default. A tenant moves to **its own schema or its own Supabase project / BAA infra** when it crosses a stated line: **PHI/compliance** (TLC → separate BAA infra, DR-0003 ISO-1, already the plan), a **noisy-neighbor** load that degrades others, or **regulatory/data-residency** need. Sharding a large ordinary tenant across projects is the exit if a single project hits its limit.
5. **Sovereignty + the governor's hand.** Tenant data stays sovereign, RLS-walled, exportable, never extracted (DATA-AS-EMPOWERMENT). DNS, brand assets, commercial terms, and access grants are the **governor's hand** — paste-ready runbooks, never automated (DR-0114 §3). Church-facing surfaces are **Tier C** — Bishop Gwin / the ministry's leadership opens them; the agent builds and stages.

## Consequences

- The church-door factory is the productized lane for onboarding sister/brother ministries; building it out (registry rows for churches, per-church brand/nickname, network reporting) is the next increment, each church Tier C.
- Every new instance-scoped table now carries an `instance_id` index by gate (scale-safe as the tenant count grows).
- The scaling-trigger list is the review point: revisit when a tenant approaches a trigger.

## Supersedes / pairs

Names and hardens DR-0114 (client-business factory), DR-0081 (one CRM), DR-0060 (tenancy guard — now Check E), DR-0003 (isolation tiers / TLC off-pool), DR-0174 (COLG's branded door). No supersession.
