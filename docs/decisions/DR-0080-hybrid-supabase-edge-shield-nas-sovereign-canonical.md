---
id: DR-0080
title: Hybrid database — Supabase cloud is the public-facing edge/shield, the home NAS is the private sovereign canonical store
date: 2026-07-01
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [poetech, family, church]
grounds: [SOVEREIGN-FIRST, DATA-AS-EMPOWERMENT, TLC-FIREWALL, THREE-BRAKES, CAGE, VERIFICATION-DOCTRINE, DATA-DRIVEN-LIVING, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS]
source: 2026-07-01 — Darrell DECIDED hybrid after the DB-on-NAS research-review (`docs/99-session-notes/2026-07-01-database-on-nas-vs-supabase-research-review.md`). His words: "hybrid sounds good with supabase used to protect the home systems." Direction-approved; EXECUTION IS DEPENDENCY-GATED (cutover steps wait on Darrell's per-step go).
---

## Context

The research-review (2026-07-01) established the ground truth: the PWA reaches Supabase only through the standard SDK (one client, `app/src/lib/supabase.js`), so the migration surface is ~90 SQL files, 494 `CREATE POLICY` RLS statements, 66 `SECURITY DEFINER` functions, 204 `.from()` reads, 43 `.auth.` refs, 16 `.channel()` realtime subscriptions, and ~1 storage call. It flagged the real blockers to "DB on the NAS" as **not the database** but everything around it: home-internet uptime/upload bandwidth, public reachability of a home box, backups/PITR ownership, DS1621xs headroom, and the danger of exposing Postgres publicly.

Darrell's decision **resolves those blockers by inverting the exposure**: don't put the home NAS in front of the internet at all. Let Supabase cloud take the public exposure as a **shield**, and keep the family's authoritative data on the NAS **behind** it, privately.

This refines (does not contradict) `project-db-home-primary-church-nas-backup` (DB primary comes home; church NAS = encrypted sealed-blob backup) and honors the mesh rule already locked in `project-sovereign-mesh-two-nas`: **single-writer per datum, NEVER two masters; multi-master Supabase sync is the refused split-brain.**

## Decision

Adopt a **tiered hybrid** with two roles that never overlap on the same datum:

1. **Supabase cloud = the PUBLIC-FACING EDGE / SHIELD.** It takes all internet exposure, the auth surface (GoTrue), and public reachability for poetech.us users. The app keeps talking to Supabase cloud exactly as it does today — **zero app change** to stand this up. Supabase is the buffer that absorbs the attack surface and the traffic, and — critically — its own uptime means **a home outage never takes down poetech.us.**

2. **Home NAS (DS1621xs today; the "farm," DR-0014, as final primary) = the PRIVATE SOVEREIGN CANONICAL STORE.** It holds the family-owned authoritative copy, runs sovereign-only workloads, and is the backup origin. It is **reachable only over Tailscale/LAN — never a public port, never fronted by Funnel/Cloudflare for the DB.** It participates in replication as a **subscriber that dials OUT** to Supabase; it is a client, not a server, so it needs **no inbound exposure whatsoever.**

3. **Direction of sync is one-way per tier, so no datum has two writers:**
   - **Tier P (public / operational tables — the shared church/app surface):** Supabase cloud is the single **writer/edge**; changes replicate **downstream cloud → NAS** via native Postgres logical replication (Supabase publishes, NAS subscribes). NAS holds a read-only sovereign mirror + vault.
   - **Tier S (sovereign-sensitive tables — family financial/legal, TLC/PHI, per DR-0003 isolation):** the **NAS is the single writer**; these tables **stay on the NAS** and are served to the family only over the **private tailnet edge**. They are **never pushed to the public cloud** at all. (This is also why we never need the hard direction — see §Technical.)

4. **Keep working throughout, fully reversible, never block an MVP.** The ~85+ migrations, RLS, realtime, and SDK keep working at every phase. The app default target is Supabase cloud; rollback at any phase is pausing/dropping a subscription or re-pointing a URL. **No cutover step blocks a feature ship.** Execution is **dependency-gated**: each phase below waits on Darrell's explicit per-step go/no-go.

## Technical — how "Supabase-fronts-NAS" actually works

**Replication mechanism (verified viable).** Postgres **logical replication** with **Supabase as PUBLISHER** and **NAS Postgres as SUBSCRIBER**. Supabase officially supports outbound logical replication to an external Postgres ([Supabase external-replication setup](https://supabase.com/docs/guides/database/replication/external-replication-setup)). We run `CREATE PUBLICATION` on Supabase (Tier-P tables only) and `CREATE SUBSCRIPTION` on the NAS, where the NAS connects **out** to Supabase's connection string over TLS.

**Why this exactly satisfies "NAS never publicly reachable":** in logical replication the **subscriber initiates the connection**. The NAS (subscriber) dials out to Supabase (publisher). Nothing connects *into* the NAS. The DB port stays bound to `127.0.0.1` (already the case in `infra/supabase/docker-compose.yml:38`); the tailnet is the only private path in for admin.

**Why we never need the hard direction:** Supabase's managed environment does **not** grant the replication privileges to make Supabase a *subscriber* (inbound) — external → Supabase logical replication isn't a first-class path ([same docs; discussion #29977](https://github.com/orgs/supabase/discussions/29977)). That would only matter if we tried to push NAS-written data *up* to cloud. We don't: Tier-S (NAS-written) data **stays home by design** (it shouldn't be on the public edge anyway per DR-0003). So the only sync we run is the well-supported downstream one. The constraint and the security requirement point the same way.

**Topology (read-replica + failover, not multi-master):**
```
        PUBLIC INTERNET (poetech.us users)
                    │  https + GoTrue auth + RLS
                    ▼
        ┌───────────────────────────┐        Tier-P tables only
        │   SUPABASE CLOUD (EDGE)    │  ──── logical replication ────┐
        │   write-primary (Tier P)   │        (Supabase PUBLISHES)   │
        │   auth surface · shield    │                              │
        └───────────────────────────┘                              │
                                                                     ▼  (NAS dials OUT; no inbound)
        family/admin over Tailscale ONLY                 ┌──────────────────────────────┐
                    │                                     │  HOME NAS (CANONICAL, PRIVATE)│
                    ▼                                     │  • Tier-P read-only mirror     │
        ┌───────────────────────────┐   (optional        │  • Tier-S write-primary + only │
        │  NAS private edge (later)  │◄───private edge)    │  • sovereign workloads         │
        │  PostgREST/Realtime, tailnet│                    │  • backup origin (pg_dump+WAL) │
        └───────────────────────────┘                     └───────────────┬──────────────┘
                                                                           │ encrypted sealed blob
                                                                           ▼
                                                                   CHURCH NAS (offsite backup;
                                                                   stores, never reads — DR-0003)
```

**Failover semantics:**
- **NAS down →** poetech.us is **unaffected** (public users hit the cloud edge). When the NAS returns, the subscription **catches up** from the replication slot. *(Operational gotcha — a subscriber down too long makes Supabase retain WAL for the slot and can bloat/stall the primary; we monitor slot lag and set a max-retention guard, §Backups.)*
- **Supabase down →** public reads/writes pause, but the **canonical data is safe at home**; the family can keep working against the **private NAS edge** over tailnet (Tier-S always; Tier-P read-only mirror). No data loss — the sovereign copy is the durable one.

## Security model

- **Public → Supabase cloud ONLY.** TLS, GoTrue auth, RLS (494 policies), rate-limit. Supabase absorbs the internet attack surface. This is the "shield."
- **NAS → Tailscale/LAN ONLY.** No public port for Postgres/PostgREST/Realtime; the DB port stays `127.0.0.1`-bound; the NAS is a replication **client** (outbound), never a server to the internet. Admin/Studio on the NAS is tailnet-only.
- **Isolation tiers preserved (DR-0003).** Tier-S (family financial/legal, TLC/PHI) is **NAS-write-primary and never leaves the NAS to the cloud**; the strongest data never touches the public edge. Church-NAS backup is an **encrypted sealed blob** — church stores, never reads.
- **Auth surface stays on the edge** — exactly Darrell's "Supabase takes the auth surface." JWTs issued by cloud GoTrue; the NAS mirror trusts the same identities; the (later) private NAS edge validates the same `JWT_SECRET`.

## Backup + PITR ownership

We end up with **belt AND suspenders** — do not turn off the managed net:
- **Edge safety net (keep):** Supabase cloud managed daily backups + PITR (on Pro) remain in force for Tier-P ([Supabase backups](https://supabase.com/docs/guides/platform/backups)). Free insurance.
- **Sovereign backups (ours, on the NAS):** nightly `pg_dump` of the canonical copy **plus WAL archiving for PITR** on the NAS ([self-hosted PITR guide](https://www.supascale.app/blog/pointintime-recovery-for-selfhosted-supabase-a-complete-guid)). Per Verification Doctrine (DR-0076 §3) a backup is not "done" until a **restore is proven** — a restore drill is a phase exit gate, not a claim.
- **Offsite:** encrypted sealed blob → church NAS (`project-db-home-primary-church-nas-backup`).
- **Slot-health guard:** monitor replication-slot lag; alert + max-retention so a long NAS outage can't bloat/stall the Supabase primary (the one way this topology can hurt the edge).

## Phased, reversible migration plan — each phase dependency-gated on Darrell's go

Nothing removes the cloud edge. Each phase is independently reversible and ships nothing that blocks a feature.

**Phase 0 — Prep (no cutover). Owner: Darrell (decide) + NAS-driver lane (execute).**
- Max the DS1621xs RAM; **relocate Ollama to the church GPU towers** (`project-church-gpu-node`) to free NAS headroom for Postgres cache.
- Confirm the tailnet path Supabase→NAS (outbound from NAS) is reachable; confirm `wal_level=logical` obtainable on the NAS `supabase/postgres` image.
- **Go/no-go:** RAM upgraded + Ollama relocated + tailnet verified. *(No user-facing change; rollback = nothing to undo.)*

**Phase 1 — Downstream replica bring-up (no user traffic, invisible to the app). Owner: NAS-driver lane; mesh lane consulted.**
- Bring up NAS Postgres from the scaffolded `infra/supabase/docker-compose.yml` (initially just `db`, optionally `meta`/`studio` for tailnet admin — NOT rest/realtime/auth yet; the app still uses cloud).
- `CREATE PUBLICATION` on Supabase for **Tier-P tables**; `CREATE SUBSCRIPTION` on the NAS (NAS dials out). Validate the read-only mirror matches the cloud (row-count + checksum parity probe — DR-0076 machine check).
- **Go/no-go:** Tier-P mirror is live, converged, and lag-monitored; **re-prove RLS isolation** on the NAS copy with the live-probe method (`project-data-isolation-audit-live-probe`, DR-0060). *(Rollback = `DROP SUBSCRIPTION`; app never noticed.)*

**Phase 2 — Sovereign backups + operational ring (still no cutover). Owner: NAS-driver lane.**
- Nightly `pg_dump` + WAL archiving (PITR) on the canonical copy; **proven restore drill**. Encrypted sealed-blob push to church NAS. Slot-lag monitoring + health-checks + restart-on-boot (PERPETUAL-PIPELINE-HEALTH).
- **Go/no-go:** a restore from NAS backup is **demonstrated** (proven-to-catch, DR-0076). *(Rollback = keep cloud managed backups only.)*

**Phase 3 — Tier-S sovereign tables become NAS-write-primary (first real sovereignty gain). Owner: mesh lane (data model) + NAS-driver lane (edge).**
- Stand up the **private NAS edge** (PostgREST + Realtime on the NAS, tailnet-only) for Tier-S tables. Move the *chosen* sovereign-sensitive tables to NAS-write-primary; they are **excluded from the cloud publication** and served to family over tailnet. No table is ever dual-written (single-writer per datum holds).
- **Go/no-go:** per-table designation reviewed by Darrell (which data is Tier-S); isolation re-proven; family tailnet access verified. Tier C soak (RELEASE-TIERS). *(Rollback = move the table's writer back to cloud, drop the private-edge route.)*

**Phase 4 — Sovereign end-state. Owner: Darrell (governs) + both lanes.**
- When the dedicated home DB hardware (the "farm," DR-0014) lands, it becomes the canonical primary; DS1621xs and church NAS become replica + encrypted backup per `project-db-home-primary-church-nas-backup`. Cloud edge remains the public shield (or is demoted to cold-standby only if a hardened sovereign public ingress is ever proven — a separate, later decision).
- **Go/no-go:** farm hardware provisioned + proven; Darrell's ratification.

## Coordination with concurrent lanes (this session)

- **Two-site mesh lane (`local_fb38b3d3`):** owns `infra/ai-orchestrator/mesh/nodes.json` + replication/federation design. This DR's Tier-P/Tier-S single-writer split and the "NAS = subscriber, church NAS = encrypted backup replica" topology must be reflected there. **Contract:** mesh lane keeps the single-writer-per-datum invariant; this DR is the DB instantiation of it.
- **NAS-driver lane (`local_0c6134f0`):** owns the NAS runtime (Container Manager, the deterministic loop runner, backups). **Contract:** it executes Phases 0–2 (RAM/Ollama, subscription bring-up, backups+PITR+restore drill) — but only on Darrell's per-phase go; nothing arms unattended (three brakes, Cage per node).

## Rationale

Darrell's inversion is the cleanest resolution of the research-review's constraints: it removes home-internet uptime/bandwidth from the public path (the edge absorbs it), removes public exposure of the NAS entirely (NAS is an outbound subscriber), and keeps the sovereign copy at home. It honors the refused split-brain (one writer per datum, one-way sync per tier) and the isolation tiers (the most sensitive data never touches the cloud). It is reversible at every step and app-invisible until we choose otherwise. The technical direction we need is the one Supabase supports best; the direction it doesn't support is the one we deliberately never use.

## Consequences

- **Now:** zero app change; the cloud edge is unchanged and remains primary while building. Real work is Phase 0 prep (RAM, Ollama relocation) — cheap, reversible, and independently useful.
- **We own** sovereign backups + PITR + restore drills + slot-health monitoring on the NAS (in addition to, not instead of, the cloud's managed net).
- **New operational surfaces:** a replication subscription (slot lag), and later a private tailnet NAS edge — both governed by PERPETUAL-PIPELINE-HEALTH + three brakes.
- **DS1621xs headroom** remains the near-term constraint; Phase 0 (max RAM + move Ollama) is the mitigation, and the farm (DR-0014) is the durable answer.
- **Number provisional (DR-0052):** two sibling lanes are active this session; re-read `origin/main` `Next ID` at merge and renumber if `local_fb38b3d3`/`local_0c6134f0` landed a DR first.

## Links
- Research-review: `docs/99-session-notes/2026-07-01-database-on-nas-vs-supabase-research-review.md`
- Scaffolded stack: `infra/supabase/docker-compose.yml`; mesh registry: `infra/ai-orchestrator/mesh/nodes.json`
- Refines/pairs: `project-db-home-primary-church-nas-backup`, `project-sovereign-mesh-two-nas`, DR-0003 (isolation tiers), DR-0014 (farm hardware), DR-0060 (tenancy guard), DR-0076 (verification), DR-0077 (orchestrated lanes)
- Sources: [Supabase external replication](https://supabase.com/docs/guides/database/replication/external-replication-setup) · [Supabase replication guide](https://supabase.com/docs/guides/database/replication) · [inbound-subscriber limitation (discussion #29977)](https://github.com/orgs/supabase/discussions/29977) · [Supabase backups](https://supabase.com/docs/guides/platform/backups) · [self-hosted PITR](https://www.supascale.app/blog/pointintime-recovery-for-selfhosted-supabase-a-complete-guid)
