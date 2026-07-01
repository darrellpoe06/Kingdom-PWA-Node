# Research-Review: Should the PoeTech Database Live on the NAS (DS1621xs) Instead of Supabase?

**Date:** 2026-07-01
**Author:** Claude (advisory; Darrell governs — GOVERNANCE-EXECUTION-ADVISORY)
**Type:** Layer 4 working artifact (research-first pattern, `feedback-research-first` / P7). No code changed by this doc.
**Status:** Decision-support. Reality-traced against the running repo at this commit (DR-0061 / P15). Every "today" claim cites a verified `file:line`; external claims cite sources and are flagged.
**Question (from Darrell):** Can/should the PoeTech database live on the NAS (DS1621xs) instead of Supabase — opportunities and constraints?

> **DECISION LOCKED (2026-07-01):** Darrell chose **HYBRID** — Supabase cloud as the public-facing edge/shield, the home NAS as the private sovereign canonical store (never publicly reachable). The decision, the tiered single-writer topology, the security model, backup ownership, and the phased dependency-gated plan are recorded in **[DR-0080](../decisions/DR-0080-hybrid-supabase-edge-shield-nas-sovereign-canonical.md)**. This research-review is the *before* analysis; DR-0080 is the *after* decision. §6 below (which recommended "not yet") is superseded by DR-0080's phased plan.

---

## 0. TL;DR (the recommendation, up front)

1. **Yes, it can — and the path is already half-built.** A lean self-hosted Supabase stack is *already scaffolded in this repo*, explicitly targeting "Supabase self-hosted on Synology DS1621xs" (`infra/supabase/docker-compose.yml:2`). The seven services (Postgres, GoTrue auth, PostgREST, Realtime, Studio, postgres-meta, Kong gateway) mirror the exact managed services the cloud gives us today.

2. **The migration is a config swap, not a rewrite — *because* we only ever touch Supabase through the standard SDK.** The whole app talks to one client (`app/src/lib/supabase.js`) via the ordinary `.from()` / `.rpc()` / `.auth.` / `.channel()` API. Self-hosting keeps that API byte-for-byte identical; you point `VITE_SUPABASE_URL` at the NAS and the 90 SQL files, 494 RLS policies, and 66 database functions run **unchanged**. This is the single most important fact in this report and it makes "Supabase-on-NAS" dramatically cheaper than "plain Postgres, rebuild auth."

3. **But not now, and not as the live primary for public poetech.us users.** The blocker is not the database — it's everything *around* it: home-internet public ingress (uptime, residential upload bandwidth, tunnel dependency), backups/PITR becoming our job, and the DS1621xs's real resource ceiling (it already carries n8n/ntfy/ollama/loops). Moving the sovereign store home is right; doing it on the already-loaded DS1621xs, as the sole primary, over home internet, today, is not.

4. **The dollars are not the reason.** We are on Supabase's **free tier** today ($0). The driver is **sovereignty + no vendor lock-in**, which is a values decision already ratified (DB primary comes home; `project-db-home-primary-church-nas-backup`), not a cost decision.

5. **Recommended path:** keep Supabase cloud as primary while building. Bring the *already-scaffolded* stack up on the NAS as a **shadow/replica** first (nightly cloud dump → NAS Postgres → run migrations → validate against a staging client), prove backups + restore + public ingress, then cut over **one low-stakes tenant reversibly** (flip the URL back to roll back). When the dedicated home DB hardware (the "farm," DR-0014) lands, *that* becomes primary; the DS1621xs and church NAS become replica + encrypted backup per the ratified plan and the sovereign mesh.

---

## 1. Ground truth — what we use Supabase for TODAY (verified, not remembered)

The app reaches Supabase through **one shared browser client** created in `app/src/lib/supabase.js` (`createClient`, configured from `VITE_SUPABASE_*` env). Everything below flows through that single client. This is what a migration has to preserve.

### 1.1 The dependency surface, quantified

| Supabase feature | In use? | Call sites (app/src) | What it is | Migration-off difficulty |
|---|---|---|---|---|
| **PostgREST** (`.from()`) | **Heavily** | **204 across 53 files** | Auto-REST over every table — the data layer | **Low** (self-host = same PostgREST container, same API) |
| **RLS policies** | **Core** | **494 `CREATE POLICY` across 55 SQL files** | Multi-tenant isolation (DR-0060) — the security spine | **Low to move / High to re-verify** (SQL runs unchanged; must re-prove isolation on the new host) |
| **DB functions** (`.rpc()` + SECURITY DEFINER) | Yes | **23 `.rpc()` / 13 files; 66 `SECURITY DEFINER` fns / 20 files** | RPCs, tenant helpers (`user_in_instance`, `instance_id`) | **Low** (plain Postgres functions) |
| **Auth** (GoTrue) (`.auth.`) | Yes | **43 refs / 25 files, centralized in `supabase.js` (12)** | Magic-link email + OAuth popup (`oauth-popup.js`), plus PIN (`lib/pin.js`) & WebAuthn (`lib/webauthn.js`) layered on top | **Medium** (GoTrue self-hosts, but needs SMTP + Site URL config; magic-link email is the fragile part) |
| **Realtime** (`.channel()`) | Yes | **16 subscriptions / 16 files** | All `postgres_changes` (WAL tail → RLS → push); one per sync lib, all copies of `table-sync.js` | **Low** (Realtime container already in the compose; identical client API) |
| **Storage** (`.storage.from()`) | **Barely** | **1 site (`choir-sync.js`)** | Supabase file storage | **Trivial** — we don't rely on it; family/property photos already live on the **NAS bridge**, not Supabase Storage (`project-photo-sovereignty`, `project-nas-photo-bridge-state`) |
| **Edge Functions** | **No** | 0 | — | N/A |

### 1.2 The SQL corpus

`infra/supabase/` holds **~90 `.sql` files**: the `schema-v1 … schema-v2.16` series plus the `migrations-auto/0001 … 0057` series (the highest applied is `0057-project-board-tasks.sql`; note `0055`/`0057` are the family-messaging/minor-tier migrations flagged BLOCKED-on-cloud-apply in memory). These define tables, the 494 policies, 66 SECURITY-DEFINER functions, triggers, the realtime publication (`schema-v2.14-realtime-publication.sql`), and seeds. **All of it is standard Postgres + Supabase-extension SQL that runs identically on a self-hosted `supabase/postgres` image.**

### 1.3 The decisive architectural fact

We never coded to Supabase-the-company; we coded to **the Supabase SDK contract**. The migration cost of "Supabase cloud → Supabase-on-NAS" is therefore *operational* (stand up and run the stack), **not** *engineering* (rewrite the app). Contrast with "plain Postgres, no Supabase layer," where the 204 `.from()` calls, 43 `.auth.` calls, and 16 `.channel()` subscriptions would each need a new backend — that path throws away the leverage we already have.

*(A parallel inventory agent confirmed this shape independently; the counts above are my direct greps at this commit.)*

---

## 2. The sovereign case (why this is even on the table)

This is not a cost play; it's a sovereignty play, and it's already ratified in direction:

- **`project-nas-as-governance-point`** — the NAS is the 24/7 governance substrate, "always ready to work." The data it governs living on it is the logical end-state.
- **`project-db-home-primary-church-nas-backup`** (ratified by Darrell 2026-06-10, stated twice): **primary DB → sovereign home hardware; backup → church NAS as an encrypted sealed blob** (church stores, never reads — the isolation wall, DR-0003). Supabase cloud is explicitly the *interim* home "while building."
- **`project-skos-open-source-stack`** — Supabase's core is open-source; self-hosting keeps us portable and vendor-independent *at runtime*, not just in principle.
- **`project-sovereign-mesh-two-nas`** — the two-NAS mesh (home + church) is designed for exactly this: a sovereign store with replication + capability federation. A NAS-hosted DB is the mesh's reason to exist.
- **`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`** (Layer 3) — "sovereign, no vendor lock" is a *stated architectural commitment* and part of the competitive moat. The database sitting on hardware the family owns is the strongest form of that commitment.

So the question is not *whether* the DB comes home — that's decided — but **when**, **onto which box**, and **via which of four technical paths**.

---

## 3. Options surveyed (with trade-offs + citations)

### Option A — Supabase-OSS self-hosted on the NAS ("Supabase-on-NAS") ✅ recommended path
Run the full Supabase stack in Container Manager: Postgres + GoTrue + PostgREST + Realtime + Storage + Studio + Kong. The upstream project ships this as Docker Compose; the community stack is 11 services (adds Supavisor pooler, imgproxy, Edge Functions, Analytics/Logflare) ([Supabase self-hosting docs](https://supabase.com/docs/guides/self-hosting/docker); [supabase/docker compose](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml)). **Our repo already has a lean 7-service subset** (`infra/supabase/docker-compose.yml`) — no Storage/Supavisor/imgproxy/EdgeFn/Analytics, which is correct given §1.1 (we barely use Storage, don't use Edge Functions).

- **Pros:** closest possible migration — keeps our SQL, 494 RLS policies, SDK, and realtime API unchanged (§1.3). GoTrue self-hosts magic-link auth. Realtime container already declared (`docker-compose.yml:107`). Postgres port bound to `127.0.0.1` only (`:38`) — no accidental public DB exposure.
- **Cons / honest facts:** self-hosted Supabase is **one project, no branching, no managed backups, no PITR, no managed upgrades** — all of that becomes ours ([Supabase self-hosting](https://supabase.com/docs/guides/self-hosting); [QueryGlow limitations table, 2026](https://queryglow.com/blog/supabase-self-hosted)). Realtime **requires `wal_level=logical`** and the `wal2json` plugin — the `supabase/postgres` image sets this, but it's a hard requirement, not a default of vanilla Postgres ([Supabase discussion #18247](https://github.com/orgs/supabase/discussions/18247); [Realtime architecture](https://supabase.com/docs/guides/realtime/architecture)). Eleven-ish containers is real RAM (see §4 headroom).

### Option B — Plain Postgres on the NAS, rebuild auth/realtime ❌ not recommended
Run bare Postgres (or the Synology Postgres package) and rebuild the surrounding services ourselves.

- **Pros:** lightest footprint (one container); fewest moving parts to *run*.
- **Cons:** throws away the §1.3 leverage. We'd have to replace **PostgREST** (204 call sites expect its REST shape), **GoTrue** (43 auth refs, magic-link/JWT), and **Realtime** (16 subscriptions) — either rewrite the client to a new API or reimplement those services. This is the *most engineering* for the *least* benefit over Option A. Rejected.

### Option C — Keep Supabase cloud as-is (status quo)
- **Pros:** $0 today (free tier), zero ops, managed backups + PITR (on Pro), managed upgrades, hardened public ingress + SLA, someone else on call ([Supabase backups](https://supabase.com/docs/guides/platform/backups)).
- **Cons:** vendor dependency; contradicts the ratified sovereignty end-state; per-project limits; a future Pro cost ($25/mo, [verified pricing](https://queryglow.com/blog/supabase-self-hosted)) once we outgrow free.
- **Role:** the correct **interim primary and the rollback target.** Not the end-state, but not wrong today.

### Option D — Hybrid: NAS Postgres canonical + cloud as edge/cache/failover
- **Pros:** sovereignty of the canonical store + cloud's reach/uptime for public users.
- **Cons:** **highest complexity** — bidirectional sync/CDC, conflict resolution, two RLS surfaces to keep identical, doubled ops. Violates MVP-pragmatism (`project-sovereign-mesh-mvp-pragmatism`). Reasonable as a *far-future* topology (home primary + church-NAS read replica is a mild, one-directional version of this and is already the mesh plan), but not as the first move.

---

## 4. Hard constraints — named honestly

1. **Home internet is the real ceiling, not the database.**
   - *Uptime:* residential power + ISP outages take the whole app down for **all** users; cloud has redundancy + SLA. Single-point-of-failure risk is concentrated on one box in one house.
   - *Upstream bandwidth:* residential **upload** is the bottleneck — every public user's PostgREST query and WebSocket rides our uplink. Fine for family/tailnet; a real constraint for public poetech.us at the 1000-signup goal.
   - *Dynamic IP / tunnel dependency:* public reachability depends on **Tailscale Funnel** or a **Cloudflare Tunnel**. Funnel is known to **throttle cross-origin** (`project-n8n-same-origin-rewrite`), which is exactly what a public API endpoint is. Cloudflare Tunnel (already the planned Vercel-replacement path, `project-off-vercel-cloudflare-pages`) is the better public ingress and should front the DB stack, not Funnel.

2. **Backups + PITR become our job.** Cloud gives daily backups + point-in-time recovery on Pro. Self-hosted has **none of this by default** — the standard answer is `pg_dump` snapshots (RPO = time since last dump) plus **WAL archiving** for second-granularity PITR, which we build and, per Verification Doctrine (DR-0076), must **prove restores** (a backup unproven-to-restore is theater) ([supascale PITR guide](https://www.supascale.app/blog/pointintime-recovery-for-selfhosted-supabase-a-complete-guid); [self-hosted backup/restore guide](https://www.supascale.app/blog/supabase-self-hosted-backup-restore-guide)). Ties PERPETUAL-PIPELINE-HEALTH rule 11 (daily backups) and the encrypted-sealed-blob backup target already named for the church NAS.

3. **TLS/cert + security posture become our job.** Caddy/Funnel already do TLS on the NAS, so this is incremental. But **exposing Postgres/PostgREST/Kong publicly is a real attack surface** the cloud hardens for us. Discipline: never expose the DB port (the compose already binds `127.0.0.1:54322`, `:38`); everything public goes through Kong → Cloudflare Tunnel + WAF + rate-limit; the 494 RLS policies are the last line, but a misconfigured `anon` role or an unpatched Postgres CVE is now *our* patch responsibility, not Supabase's.

4. **DS1621xs+ resource headroom is tight.** Xeon D-1527 quad-core, ships 8 GB ECC, **32 GB official max** (64 GB unofficial), **no GPU** ([Synology datasheet](https://www.synology.com/en-global/products/DS1621xs+); [NAS Compares memory guide](https://nascompares.com/2021/04/02/32gb-64gb-unofficial-memory-guide-for-the-synology-ds1621xs-nas/)). It **already runs n8n + ntfy + ollama + the loops**. Adding ~7 containers — Postgres (wants RAM for cache), Realtime (Elixir/BEAM, RAM-hungry), Kong, Studio, PostgREST, GoTrue, meta — on top of **Ollama** (the heaviest tenant) will contend hard on 32 GB. **Mitigations:** max the RAM; **move Ollama to the church GPU towers** (already planned — `project-church-gpu-node`) so the NAS Postgres gets cache headroom; treat the DS1621xs as the *first self-host / replica*, not necessarily the *final primary* (the ratified primary is dedicated home hardware — the "farm," DR-0014).

5. **Single point of failure.** One home box = one failure domain. The sovereign-mesh answer (`project-sovereign-mesh-two-nas`) is the church NAS as a **read replica / failover + encrypted backup**, which is the ratified topology — but that's a *second* build, not free, and doesn't come with the first cutover.

---

## 5. Cost screen + sovereign-mesh-compatibility tier

Per our review format:

- **Growth justification:** sovereignty + no vendor lock-in (ratified direction), not user-driven demand. There is no user *feature* blocked by staying on cloud today.
- **Unit cost:** Supabase cloud = **$0 today** (free tier), ~$25/mo when we outgrow free. NAS self-host = **$0 marginal** (owned hardware) + **~$100–200 one-time** RAM upgrade (32→64 GB unofficial) + **ongoing operational time** (backups, patching, monitoring, restart-on-boot) — the real recurring cost.
- **Lean alternative:** stay on cloud (Option C) until the sovereignty end-state hardware and public-ingress hardening are ready. Costs nothing, loses nothing but sovereignty-of-location.
- **Break-even:** the *dollar* break-even is far off (~$25/mo saved vs. our ops time, which is worth more than $25/mo). There is **no dollar case**; the case is values (sovereignty) + moat (`DATA-AS-EMPOWERMENT`). Be honest about that.
- **Evolution trigger:** move when (a) the dedicated home DB hardware (farm, DR-0014) lands, **or** (b) Supabase free-tier limits bind, **or** (c) a sovereignty/compliance requirement forces it — whichever first. Not before.
- **Sovereign-mesh-compatibility: Tier 4 (fully mesh-native).** This *is* the mesh's core purpose; the scaffolded compose + two-NAS plan are built for it.
- **MVP-pragmatism check:** **passes only for Option A as a staged/shadow move.** Option B (rebuild auth) and Option D (hybrid CDC) fail pragmatism now. Doing Option A *as the live primary today* fails pragmatism (unhardened ingress/backups). Option A *as a proven-first shadow → reversible cutover* passes.

---

## 6. Recommendation + phased, reversible migration sketch

**Single most-optimal path: Option A (Supabase-OSS on the NAS), staged as shadow-first and reversible, but NOT yet as the live public primary. Keep Supabase cloud as interim primary and rollback target.**

Why A over the others: it preserves 100% of our SQL/RLS/SDK/realtime (§1.3), it's already scaffolded for this exact box (§0.1), and it matches the ratified end-state (§2) without the complexity of B or D.

Phased sketch (each phase reversible; nothing removes cloud until a NAS replacement is *proven by use*, DR-0076):

- **P0 — now (prep, no cutover):** Keep cloud primary. Max the DS1621xs RAM. **Relocate Ollama to the church GPU towers** to free NAS headroom. Decide the *final* primary box (DS1621xs interim vs. the farm hardware, DR-0014) — recommend the farm as final primary, DS1621xs as first proving ground/replica.
- **P1 — shadow bring-up (no user traffic):** Start the scaffolded compose on the NAS (Container Manager). Restore a nightly **cloud `pg_dump` → NAS Postgres**, run all ~90 migrations, confirm `wal_level=logical` + realtime publication. Validate against a **staging client** (a Vercel preview with `VITE_SUPABASE_URL` pointed at the NAS via Cloudflare Tunnel). **Re-prove the 494 RLS policies** with the live-probe method already used (`project-data-isolation-audit-live-probe`) — isolation must hold on the new host before anything real moves.
- **P2 — harden the operational ring (still no cutover):** Nightly `pg_dump` + **WAL archiving for PITR**, with a **proven restore drill** (DR-0076 §3, proven-to-catch). Monitoring + health-checks + restart-on-boot (PERPETUAL-PIPELINE-HEALTH). Public ingress via **Cloudflare Tunnel** (not Funnel — cross-origin throttling). TLS + rate-limit + WAF in front of Kong.
- **P3 — reversible cutover of ONE low-stakes tenant (Tier C soak):** Point a single non-critical instance (a test tenant / one church surface) at the NAS. Soak per RELEASE-TIERS Tier C (architectural change → ~1 week + family/Gatekeeper sign-off). **Rollback = flip `VITE_SUPABASE_URL` back to cloud** (the whole reason A is reversible). Widen only after the soak is clean.
- **P4 — sovereign end-state:** When the farm hardware (DR-0014) lands, it becomes **primary**; the **church NAS becomes read-replica/failover + encrypted sealed-blob backup** (`project-db-home-primary-church-nas-backup`, `project-sovereign-mesh-two-nas`). Cloud demoted to cold-standby or retired. This is the ratified destination; P1–P3 are the proving road to it.

**Do NOT:** cut public poetech.us users to a single home box over Funnel before backups+restore are proven and public ingress is hardened; rebuild auth from scratch (Option B); or build the hybrid CDC topology (Option D) as a first move.

---

## 7. Ties to existing direction

- `project-db-home-primary-church-nas-backup` (ratified) — this report is the technical *how* + *when* for that decision; note the reconciliation that the **final primary is the farm, DS1621xs is the proving ground/replica**.
- `project-sovereign-mesh-two-nas` / `project-church-gpu-node` — P4 topology and the Ollama-relocation that frees NAS headroom.
- `2026-06-24-websockets-realtime-sovereign-path-research-review.md` — the realtime half of this same migration ("Move A" there = Supabase-Realtime-on-NAS, identical mechanism).
- `project-off-vercel-cloudflare-pages` — Cloudflare Tunnel is the shared public-ingress answer for both the front-end and this DB stack.
- `project-data-isolation-audit-live-probe` (DR-0060) — the re-prove-RLS-on-new-host gate in P1.
- RELEASE-TIERS (Tier C), Verification Doctrine (DR-0076), PERPETUAL-PIPELINE-HEALTH — govern the cutover, the proven-restore drill, and the operational ring.

---

*Verification note (DR-0076): repo counts (204 `.from()`, 494 `CREATE POLICY`, 66 `SECURITY DEFINER`, 23 `.rpc()`, 16 `.channel()`, 1 `.storage.from()`, ~90 `.sql` files) are direct greps at this commit. The scaffolded compose is quoted from `infra/supabase/docker-compose.yml`. External claims (Supabase self-host limitations, wal_level requirement, DS1621xs specs, pricing) cite sources inline and are standard vendor/community facts, not repo facts. No code was changed by this document.*

## Sources
- [Self-Hosting with Docker | Supabase Docs](https://supabase.com/docs/guides/self-hosting/docker)
- [Self-Hosting | Supabase Docs](https://supabase.com/docs/guides/self-hosting)
- [supabase/docker/docker-compose.yml (master)](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml)
- [Supabase Self-Hosted in 2026 — limitations table | QueryGlow](https://queryglow.com/blog/supabase-self-hosted)
- [Database Backups | Supabase Docs](https://supabase.com/docs/guides/platform/backups)
- [Point-in-Time Recovery for Self-Hosted Supabase | supascale](https://www.supascale.app/blog/pointintime-recovery-for-selfhosted-supabase-a-complete-guid)
- [Self-Hosted Supabase Backup & Restore Guide | supascale](https://www.supascale.app/blog/supabase-self-hosted-backup-restore-guide)
- [Realtime Architecture | Supabase Docs](https://supabase.com/docs/guides/realtime/architecture)
- [logical decoding requires wal_level >= logical | Supabase Discussion #18247](https://github.com/orgs/supabase/discussions/18247)
- [Synology DS1621xs+ product page + datasheet](https://www.synology.com/en-global/products/DS1621xs+)
- [32GB & 64GB Memory Guide for DS1621xs+ | NAS Compares](https://nascompares.com/2021/04/02/32gb-64gb-unofficial-memory-guide-for-the-synology-ds1621xs-nas/)
