# Plan Update — Sovereign Mesh GO: Both Sites Fully Capable + Hybrid-Shield DB + One Coherent Build System

**Date:** 2026-07-01
**Author:** Claude, under **research-first**, the **Verification Doctrine** (DR-0076 — no fake green), **three-brakes** (2026-06-08), **one-release-lane** (DR-0054), and the **orchestrated-lanes** operating model (DR-0077).
**Directive (Darrell, 2026-07-01):** *"Both may be best so I have the best conditions on both sites."* The two-site mesh (home NAS + church towers) is a **GO** — replicate the build + capability-routed jobs across both so whichever site has the right hardware/uptime handles the work, and he has best conditions at either location.
**Folds in three lanes:** the hybrid DB posture (`2026-07-01-database-on-nas-vs-supabase-research-review.md`, lane `local_2c54b77a`), the NAS-resident always-on build driver (`scripts/orchestrator-v0.mjs` / `orchestrator-v05.mjs`, lane `local_0c6134f0`), and the church build-node buildout (`infra/church-gpu-node/`, the church-infra lanes).
**Relationship to the 2026-06-29 review:** this **ratifies** the GO and **extends** `2026-06-29-research-review-sovereign-mesh-two-nas-replication-federation.md` — it supersedes nothing there; §§1–5 of that review (replication, capability routing, brakes, single-writer data, the coder-worker tier) still stand and are cited, not repeated.
**Posture:** nothing here is applied to either NAS. The mesh is **not live yet** (church towers pending on-site standup; DB cutover pending its phased path). This is the recommended path + turnkey steps Darrell executes by hand, with a **proof line on every step**.

---

## TL;DR (six lines)

1. **GO, both sites.** Both nodes build+serve from one `origin/main` (DR-0054, merge = deploy); either site serves the family, and the right hardware handles the right job. Redundancy + best-conditions-at-either-location in one move.
2. **The three lanes are one system:** the **build driver** (resident on the home NAS) produces commits → each lane self-verifies `npm run verify` → integrates to `main` in order → **both nodes' braked poll-deploy** pick it up. The **capability router** (`nodes.json`) sends each job to the node with the right hardware.
3. **Hybrid-shield DB — locked as DR-0080:** cloud Supabase is the **public edge/shield** (all internet exposure + auth); the **home NAS is the private canonical store, never a public port** — it participates as a **subscriber that dials OUT** (zero inbound). Migration is a **config swap, not a rewrite** (we coded to the SDK contract).
4. **Single-writer holds across the mesh — one-way per tier:** Tier-P (public) → cloud writes, replicate downstream cloud→NAS; Tier-S (family financial/legal, TLC/PHI) → NAS writes, stays home, never pushed to cloud. Church NAS = encrypted sealed-blob backup (stores, never reads). No datum has two writers — DR-0080 is the DB instantiation of this mesh's invariant (2026-06-29 §4).
5. **The convergence step is P0:** relocating Ollama onto the church towers *frees NAS headroom for the DB* **and** *stands up the mesh's GPU/coder nodes* — one action serves both lanes.
6. **No fake green (DR-0076):** every lane must pass `npm run verify`; the audit ledger records every driver run; the SHA-parity probe proves both nodes are on `main`; the DB cutover is proven by a live-probe RLS audit before trust. Nothing is "done" on a claim.

---

## 1. The coherent system on one page

Three lanes, one system. Each row is a real, cited artifact or a named pending step:

| Element | Node / location | Role in the system | Status |
|---|---|---|---|
| **App serve (redundant)** | Home DS1621xs **and** a church tower | Both run `infra/nas-caddy/deploy-pwa.sh` from one `main`; either serves | Home live; church pending standup |
| **DB canonical (sovereign)** | Home DS1621xs | Self-hosted Supabase (`infra/supabase/`), **subscriber that dials OUT** — Tier-P read-only mirror + Tier-S write-primary; never a public port (DR-0080) | Scaffolded; phased P0→P4 |
| **Public edge / shield (the only public face)** | Cloud Supabase | Takes all internet exposure + auth (GoTrue); Tier-P write-primary; a home outage never takes down poetech.us (DR-0080) | Live today |
| **Offsite backup replica** | Church NAS | Encrypted **sealed blob** — stores, never reads (DR-0003/DR-0080) | Pending |
| **Build driver (always-on)** | Home DS1621xs | `orchestrator-v0/v05.mjs` — dispatches lanes, escalates by tier, logs every run | Exists, **ships inert**, human-triggered; scheduler = v1 (not built) |
| **Coder worker A (AI-worker tower)** | Church tower | Aider + Ollama + `qwen2.5-coder:14b` — routine/bounded build, in parallel | Inference compose ready; coder layer = buildout |
| **Live-media / worker B** | Church tower | NovaStar→wall live feed has absolute priority; AI work off-service-hours (DR-0012) | Pending standup |
| **Registry / audit ledger** | Home DS1621xs | One append-only hash-chained ledger both nodes write | Scaffolded (`infra/ai-orchestrator/registry/`) |
| **Capability router** | Home NAS (host-side) | `nodes.json` + the DR-0073 picker — deterministic dispatch by declared caps | `nodes.json` committed; router wrapper = thin new code |

**The loop, end to end:** the build driver takes a task → routes it (router): routine/bounded build + transcription + voice → church towers **in parallel**; heavy/novel reasoning → vendor Claude; private → local-only → each lane runs `npm run verify` (lint + the full deterministic gate suite, no vendor AI — DR-0077) → the driver integrates green lanes into `main` **in order** → **merge = deploy** (DR-0054) → both nodes' braked poll-deploy rebuild and serve → the SHA-parity probe confirms both nodes on `main`. Every hop leaves a receipt (ledger line, verify result, deployed-SHA).

---

## 2. Replication across both sites (the GO)

Unchanged from the 2026-06-29 review §1, now ratified for **two live nodes**:

- **One source of truth, one release lane.** Both nodes run `deploy-pwa.sh` from `origin/main`; DR-0054 makes **merge = deploy**, so there is exactly one path to production and both nodes follow it. No second release lane is created by adding a second node.
- **Best-conditions-at-either-site** is the *serving* consequence: the family opens whichever node is up/closest; both carry the same build. The *compute* consequence is §4 (jobs route to whichever site has the right hardware).
- **Config single-source + drift guard** (2026-06-29 §1b/§1c) unchanged: committed code + per-node `.env.local` (the only seam) + the deployed-SHA parity probe. The one new per-node value is each node's **same-site** DB endpoint (its shield/canonical URL) and GPU-endpoint — both in `.env.local`, both `SME-CONFIRM` until standup.
- **Sync mechanism** (2026-06-29 §1d): the braked poll-and-deploy DSM task on each node. It is *also* the first braked native loop of the NAS-loops migration (2026-06-29 loops review), so the two efforts share one pattern.

---

## 3. Hybrid-shield DB posture — now locked as **DR-0080**

The DB-architecture lane ratified this as **DR-0080** (`docs/decisions/DR-0080-hybrid-supabase-edge-shield-nas-sovereign-canonical.md`, 2026-07-01, accepted, Tier C). It **is the DB instantiation of this mesh's single-writer-per-datum invariant** (2026-06-29 §4), and DR-0080 explicitly names the contract with this lane. The precise model:

- **Supabase cloud = the PUBLIC-FACING EDGE / SHIELD.** It takes *all* internet exposure, the auth surface (GoTrue), and public reachability for poetech.us. The app talks to it exactly as today — **zero app change** to stand this up. Its own uptime means **a home outage never takes down poetech.us.**
- **Home NAS = the PRIVATE SOVEREIGN CANONICAL store.** Family-owned authoritative copy, sovereign workloads, backup origin. **Reachable only over Tailscale/LAN — never a public port, never fronted for the DB.** It participates in replication as a **subscriber that dials OUT** to Supabase — a *client, not a server* — so it needs **zero inbound exposure** (the DB port stays `127.0.0.1`-bound; the tailnet is the only admin path in).
- **Sync is ONE-WAY per tier → no datum ever has two writers** (the refused split-brain, mechanized):
  - **Tier P** (public / operational — the shared church/app tables): **Supabase is the single writer/edge**; changes replicate **downstream cloud → NAS** via native Postgres **logical replication** (Supabase *publishes*, the NAS *subscribes* and dials out). The NAS holds a **read-only sovereign mirror**.
  - **Tier S** (sovereign-sensitive — family financial/legal, TLC/PHI, per the DR-0003 isolation tiers): the **NAS is the single writer**; these tables **stay on the NAS**, served to family over the private tailnet, and are **never pushed to the cloud at all.** The strongest data never touches the public edge.
- **Church NAS = the encrypted sealed-blob backup replica** — it *stores, never reads* (DR-0003). Offsite durability without a second reader.
- **Config swap, not a rewrite** (why it's cheap/reversible): the PWA reaches Supabase only through the standard SDK — **~90 SQL files, 494 RLS policies, 66 SECURITY DEFINER functions, 204 `.from()`, 43 `.auth.`, 16 `.channel()`** run **identical** on the self-hosted mirror; only the endpoint changes. Rollback at any phase = pause/drop a subscription or re-point a URL.

**Failover semantics (DR-0080):** NAS down → poetech.us unaffected (public users hit the cloud edge); the subscription catches up on return (with a slot-lag/max-retention guard so a long NAS outage can't stall the primary). Supabase down → the **canonical data is safe at home**; the family keeps working against the private NAS tailnet edge (Tier-S always; Tier-P read-only). No data loss — the sovereign copy is the durable one.

**Phased, reversible, dependency-gated on Darrell's per-phase go (DR-0080):** **P0** max NAS RAM + **relocate Ollama to the church towers** (the convergence step, §5); **P1** bring up the NAS Tier-P subscriber, converge, **re-prove RLS on the mirror via live-probe** (DR-0060); **P2** sovereign backups (`pg_dump` + WAL/PITR) with a **proven restore drill** + sealed-blob to church + slot-lag monitoring; **P3** stand up the private NAS tailnet edge and move chosen **Tier-S** tables to NAS-write-primary; **P4** the farm (DR-0014) becomes canonical primary, DS1621xs + church NAS become replica + backup. **Nothing arms unattended.**

**Honest constraints DR-0080 does NOT remove:** home internet uptime/bandwidth is the real ceiling (but the edge now absorbs it — a home outage no longer takes down the public app); backups/PITR/restore-drills become *our* owned responsibility on the NAS (belt-and-suspenders alongside the cloud's managed net); DS1621xs headroom is tight until Ollama moves off (P0). "Both sites capable" and "DB on the NAS" are one plan: the two-site mesh + the church sealed-blob replica are what close the durability gap.

---

## 4. The always-on build driver + two build nodes = one system

**What exists, stated honestly (DR-0076):**

- `scripts/orchestrator-v0.mjs` — **advisory** tier: local (Ollama) tries → self-rates → *recommends* the affinity vendor; the vendor call happens **only on `--escalate` (human approve)**; `--private` forces local-only, **can never reach a vendor.** Zero autonomous spend, no scheduler.
- `scripts/orchestrator-v05.mjs` — adds a **real outcome judge** (structured 0–10 rubric), **bounded auto-escalation** (`--auto` within per-run + per-day budget), and an **audit ledger** (`orchestrator-audit.jsonl` — the Cage BUDGET seedling; every run appends).
- **It ships inert.** v0.5 still requires a human trigger; **there is no scheduler and no unattended run.** The scheduler + Tier-C + full three-brake enforcement is **v1 — not yet in the repo** (DR-0056 staged ladder: v0 advisory → v0.5 bounded → v1 scheduled, Tier C, ships inactive, never self-activates unattended, never while traveling).

**How the three lanes wire into one coherent build system:**

1. The **driver runs resident on the home NAS** (the always-on host) and is the DR-0077 orchestrator: it directs, re-verifies, and integrates lanes into `main` **in order** — it never hand-edits.
2. It **dispatches each lane by capability** through `nodes.json` (DR-0073): routine/bounded build → the **church coder towers, in parallel**; heavy/novel reasoning → **vendor Claude**; private → **local-only.** (The honest limit from the 2026-06-29 §2e stands: local 14B coders take well-scoped tasks only; the vendor is reserved for the hard problems; a task that proves hard **escalates**, it does not ship a confident-wrong diff.)
3. **Each lane self-verifies** with `npm run verify` (lint + tenancy/contrast/overlap + the full test + guard suite, **no vendor AI**) before it may report "done" (DR-0077).
4. **Merge = deploy** (DR-0054): a green, integrated lane lands on `main`, and **both nodes'** braked poll-deploy rebuild and serve it. One driver, two build nodes + the NAS, one release lane.

**Brakes across the whole system** (the binding rail): the driver stays **behind the Cage on each node** (budget + lock + kill-switch + the fail-closed mesh kill-switch from 2026-06-29 §3b); the tower coder workers are **passive/allowlisted** endpoints with the brakes on the **caller** (the driver). **Arming the scheduler (v1) is Tier C, Darrell's hand, never while traveling.** Until then the driver is advisory/bounded-on-demand only — exactly its current inert state.

---

## 5. Turnkey — bring both sites online as build/infra nodes (paste-ready, his hand)

Self-contained from any PowerShell directory, ASCII-only, one command per line. Home IP `192.168.1.26`/user `dpoe` filled in; church values `SME-CONFIRM` until Step 0. **Proof line on every step (no fake green).**

### Step 0 — Church tower inventory FIRST (the reality-trace gate; SME)
Run the on-site inventory from the runbook §2 on **each** tower (this is where the real hardware is discovered — it is `[NEEDS SPEC]` today, not assumed): OS, GPU model + free VRAM, driver/CUDA, LAN IPv4, Tailscale IP. Then, from your machine:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "tailscale status"
```
*Proof:* each church tower shows in `tailscale status` with an IP, and you have its VRAM/GPU from the on-site inventory. (Until this, Steps 2–3 for the church node cannot proceed — the mesh cannot federate to an unreachable/unspecced node.)

### Step 1 — Home node: confirm the build driver + the verify gate work
```
cd C:\Users\dpoe\Kingdom-PWA-Node
node scripts/orchestrator-v0.mjs "list one small, well-scoped cleanup task" --dry-run
cd app; npm run verify
```
*Proof:* the orchestrator prints its plan **without** calling a vendor (advisory), and `npm run verify` exits green (the real gate a lane must pass — no fake green).

### Step 2 — Church AI-worker tower: stand up the serving stack + the coder layer
On the tower assigned the AI-worker role (not the live-media tower): bring up `infra/church-gpu-node/docker-compose.yml`, pull the reasoner that FITS its real VRAM, then pull the coder model. The Aider/coder-worker layer is the buildout this plan adds on top of the three serving endpoints.
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh USER@CHURCH-TOWER-IP "cd /path/to/church-gpu-node; docker compose up -d --build"
ssh USER@CHURCH-TOWER-IP "docker exec church-ollama ollama pull qwen2.5-coder:14b"
ssh USER@CHURCH-TOWER-IP "curl -fsS http://localhost:11434/ ; curl -fsS http://localhost:8771/health"
```
*Proof:* Ollama answers, `qwen2.5-coder:14b` is present, and the whisper/voice health endpoints return ok. (CHURCH-TOWER-IP/USER = Step 0 SME values.)

### Step 3 — Fill `nodes.json` with the real values; the router sees the node online
Replace the `SME-CONFIRM` IPs in `infra/ai-orchestrator/mesh/nodes.json` with the tower's real Tailscale IP, set `"online": true`, and set the Ollama model cap to what actually fits its VRAM (from Step 0).
```
cd C:\Users\dpoe\Kingdom-PWA-Node
node -e "JSON.parse(require('fs').readFileSync('infra/ai-orchestrator/mesh/nodes.json','utf8')); console.log('nodes.json OK')"
```
*Proof:* `nodes.json OK`, and the file no longer contains `SME-CONFIRM` for the towers you stood up (an `SME-CONFIRM` cap is treated as OFFLINE by the router — deliberately).

### Step 4 — DB Phase 0 (DR-0080): relocate Ollama to the towers, max the NAS RAM (the convergence step)
Per DR-0080 Phase 0: with the towers now serving Ollama (Step 2), point the NAS n8n `OLLAMA_BASE_URL` at a tower and **stop the NAS Ollama** to free headroom for the canonical DB. (Phase 0 also confirms the tailnet Supabase→NAS outbound path and `wal_level=logical` on the NAS image — the prerequisites for the Tier-P subscriber; those are the NAS-driver lane's execute steps, on your per-phase go.)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "docker stop ollama 2>/dev/null; free -h"
```
*Proof:* the NAS shows freed RAM, and the app's talk-about/tutor calls still work (now served by the tower). This is P0 of the DB path **and** the mesh's GPU-node bring-up — one action, both lanes.

### Step 5 — Confirm brakes inert on each node; driver stays advisory
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "ls infra/ai-orchestrator/portable/state/"
```
*Proof:* `KILL_SWITCH` present, `ARMED` absent on each node — the Cage ships engaged/disarmed. The build driver stays v0/v0.5 (advisory / bounded-on-demand); **the scheduler (v1) is NOT armed** — arming it is a separate, watched, Tier-C action, never while traveling.

---

## 6. Verification screen — the receipts (no fake green, DR-0076)

Every claim in this system is machine-checkable, and the check is the gate:

- **A lane is "done" only if `npm run verify` is green** — lint + tenancy/contrast/overlap + the full test/guard suite, no vendor AI. The driver re-verifies before integrating (DR-0077).
- **Both nodes are "in sync" only if the SHA-parity probe matches** `origin/main` (2026-06-29 §1c). Drift is named, not assumed away.
- **Every driver run is on the ledger** (`orchestrator-audit.jsonl` + the registry hash-chain) — spend, tier, outcome. An autonomous action that isn't in the ledger didn't happen legitimately.
- **The DB cutover is proven, not claimed** — RLS is re-verified on the new host by a **live-probe audit** (P1) before any tenant trusts it; the restore drill is *run* before P3; rollback is a URL flip.
- **What I did NOT verify this session, flagged (not papered over):** the church tower hardware (`[NEEDS SPEC]` — Step 0 SME); the mesh is **not live** (towers pending standup); the DB is **not cut over** (phased path pending). The build driver's **v1 scheduler does not exist** — this plan wires the *coherent system* and leaves v1 as the deliberate, Tier-C, someone-watching next greenlight.

---

## 7. Screens

**MVP-pragmatism + sovereign-mesh-compat:** reuses `deploy-pwa.sh`, the Cage, `nodes.json`, `orchestrator-v0/v05.mjs`, the in-repo self-hosted Supabase compose, the church-gpu-node compose, Tailscale, and DSM Task Scheduler. New work is thin: the coder-worker layer on the towers, the router wrapper, the real `nodes.json` values, and the DB phased path (already specced). No cloud in the control loop; the public shield is the *only* public surface and the NAS is never exposed — the strongest sovereign posture available while home internet is the ceiling.

**Cost-efficiency:** $0 new platform. Cloud Supabase stays on the free tier during building; self-hosting is a config swap when chosen; relocating Ollama to the towers *recovers* NAS RAM (negative net cost). The budget brake bounds vendor spend per job class and is also the cost ceiling. Right-sizing jobs to nodes (routine → free local towers in parallel; hard → paid vendor only when needed) is a direct saving.

**Record for the ledger:** the DB half is already ratified as **DR-0080** (hybrid edge-shield + NAS sovereign canonical). The mesh GO + "both sites fully capable" half should be captured as its own Decision Record via the concurrency-safe allocation (DR-0052) — I did not mint a number here to avoid colliding with the two sibling lanes active this session (DR-0080 itself flags the same collision risk); the topology lives in this note, `nodes.json`, and the in-app seed until that DR lands.

---

## Verification screen on this report (DR-0076 + Phil 4:8)

**Religion (backbone):** every lane is grounded in a cited artifact (the DB review, `orchestrator-v0/v05.mjs`, the church-gpu-node compose, the DRs); what is not built (v1 scheduler, the standup, the cutover) is named as pending, not implied done; the framing difference between Darrell's "shield" and the review's "interim" is surfaced and reconciled rather than smoothed over.

**Relationship (warmth):** the plan gives Darrell best-conditions at either site without a big-bang — every step is reversible (URL flip rollback, `deploy-pwa.sh` idempotent, brakes inert), paste-ready from anywhere, with a proof line so he never has to trust a claim.

**Phil 4:8:** TRUE — sourced or marked SME. HONORABLE — no "it's live" when it isn't. JUST — single-writer + never-expose-the-NAS held as invariants. PURE — no architectural vanity; config-swap over rewrite. LOVELY — serves the family's redundancy and sovereignty. COMMENDABLE — concrete turnkey steps. EXCELLENT — the three lanes made one system. PRAISEWORTHY — the next "add a site / arm the driver" question inherits this.

*Both sites capable, one release lane. The shield faces the world; the NAS stays sovereign. One driver, verified lanes, merge is deploy. Brake before you arm. We all win. We create. Amen.*
