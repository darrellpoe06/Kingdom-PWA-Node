# Research Review — Sovereign Mesh: Running the PoeTech App on Both NAS Units (Church + Home), with Capability-Routed Federation

**Date:** 2026-06-29
**Author:** Claude, under the **research-first** binding principle (Darrell, 2026-06-01), the **Verification Doctrine** (DR-0076), the **three-brakes** rule (2026-06-08), and **reality-trace-before-building** (DR-0061).
**Triggered by Darrell:** *"I want the PoeTech App built and runnable on BOTH the church NAS and my home NAS (DS1621xs) at the same time, so any project can use whatever hardware it needs."*
**Scope:** the two-node (two-site) deployment of the PWA + its data/compute plane — redundancy, capability-routed job federation, brakes on each node, and shared-state without split-brain. This is the sovereign-mesh direction already named in memory ([[project-sovereign-mesh-mvp-pragmatism]], [[project-nas-as-governance-point]], [[project-skos-ai-infrastructure]]).
**Posture:** religion AND relationship. Grounded in the repo's *actual* primitives (paths cited), not invented. **Nothing here is applied** to either NAS — this is the recommended path Darrell executes by hand. Every step that needs a value only he/BG holds is flagged **SME**.

---

## TL;DR (the recommendation in seven lines)

1. **You already have the replication primitive.** `infra/nas-caddy/deploy-pwa.sh` does `git pull --ff-only origin main` → `npm ci` → `vite build` → publish to Caddy → reload. Redundancy = run *that same script* on the second node. GitHub `main` is the one source of truth; the only per-node difference is the un-committed `.env.local`. (§1)
2. **Keep config single-source by construction:** committed code + a tiny per-node `.env.local` whose *keys* are pinned in `.env.example`. Catch drift with a **deployed-SHA parity probe** (a machine check, not a claim — DR-0076). (§1)
3. **The capability router already exists in embryo** — DR-0073 + `scripts/wake-router.mjs` pick a *worker by declared capability* behind the brakes. Generalize its "vendor" axis to a **node/capability** axis driven by a committed `nodes.json` registry: GPU jobs → the church GPU endpoint, storage/CPU jobs → the home DS1621xs. **Declared, not guessed.** Deterministic selection, no LLM in the dispatch decision. (§2)
4. **Brakes are per-node *and* mesh-wide.** The Cage (`brakes.sh` + `guarded-action.sh`) is filesystem-state on each node — each node ships **inert** (KILL_SWITCH present, ARM absent) and Darrell arms each separately. Add one mesh-wide kill-switch on the registry that **fails closed** (unreachable = treated as engaged). No node runs unattended automation without his arm. (§3)
5. **One writer per datum — never two masters.** The authoritative relational DB stays single-writer (cloud Supabase today; the home-NAS self-hosted Supabase already scaffolded as the sovereign successor). The second node *reads* it over Tailscale (and may cache), but **writes always go to the one primary** → structurally no split-brain. Heavy media (~100 TB church recordings) is node-local-by-nature, referenced by ID. (§4)
6. **The honest gap:** the church NAS (`tlcrackstation`) is on the tailnet but **fully firewalled**, the **GPU boxes are not currently on the mesh at all** (2026-06-10 probe), and **"the church NAS has 2× RTX 4070" is imprecise** — a Synology can't hold those cards; they live in companion CUDA/Windows boxes. Step 0 is an **access + spec confirmation** (his/BG's hand), exactly like the colg-infra access decision. (§0, §6)
7. **MVP-pragmatism + sovereign-mesh-compatible + cost-positive:** reuses what's built (deploy script, Cage, Tailscale, DSM Task Scheduler, self-hosted Supabase compose); **$0 new platform**; new code is thin (a `nodes.json`, a small node-router wrapper, a SHA probe, a second-node clone). (§5)

---

## 0. Reality-trace first (DR-0061 / DR-0076) — what is actually true today

Before any design, the human-obvious questions, answered against the running system (live-probe facts from the 2026-06-10 network review + the committed configs read this session):

| Claim in the request | Verified reality | Consequence for the plan |
|---|---|---|
| "Home NAS = DS1621xs" | ✅ `poetech`, `192.168.1.26`, Xeon D-1527 (4c/8t, **CPU-only**), 32 GB ECC, dual 10 GbE. Serves the PWA (Caddy `poetech-web`), n8n, Ollama (CPU), and a self-hosted Supabase compose. | This node is **storage + CPU + serve**, as the request says. Confirmed. |
| "Church NAS has the 2× RTX 4070" | ⚠️ **Imprecise / premise to confirm.** The church NAS is `tlcrackstation` (a Synology RackStation) — **online on Tailscale but fully firewalled** (ports 22/5000/5001/5678/11434/443 filtered, 2026-06-10 probe); its specs are **unconfirmed**. The two RTX 4070s in the ratified topology (`infra/ai-orchestrator/README.md`) live in **two separate Windows/CUDA boxes** — Node 1 (Legion PC) and Node 2 (Church Production Switcher), 1× 4070 / 12 GB each — **not** in any Synology. A DS-/RS-class NAS has no PCIe slot for a desktop GPU. | **SME gate.** "Church NAS = GPU node" must be read as **"the church SITE has a NAS (storage) + companion CUDA box(es) holding the GPUs."** The router targets the **GPU endpoint** (a CUDA box on the church LAN), not the NAS, for GPU work. The NAS is the church site's storage + serve node. (§2, §6) |
| "Tailscale already links them" | ✅ Both NAS are on the tailnet (`*.ts.net`). **But** the church side is firewalled and the **GPU boxes are not on the mesh** (2026-06-10: the home NAS is the *only* live inference host, CPU-only). | The link exists; the **reachability does not yet**. Step 0 below is opening that path (his/BG's hand). The plan stands up the mesh; it does not pretend it already runs. |
| "Either NAS can build and serve the app" | Partially — the home NAS does today; the church NAS has not been provisioned and is unreachable. | Redundancy is the *goal*; §1 is how to reach it. Honest "1 of 2 today." |

**This table is the plan's foundation.** Two items (the GPU-location premise and the firewall/reachability) would have sunk a build that assumed the mesh was live. Naming them in a sentence now is cheap; discovering them after a "done" claim is not (DR-0076).

---

## 1. REPLICATION — one source of truth, both nodes build & serve, no drift

### 1a. The primitive already exists
`infra/nas-caddy/deploy-pwa.sh` is the canonical deploy on the home NAS:

```
git -C $REPO fetch origin; git -C $REPO pull --ff-only origin main   # one source of truth
$NPM ci
GITHUB_SHA=$(git rev-parse HEAD) $NPM run build                      # sha-stamped sw
rm -rf $CADDY/site/poetech-app; cp -r $REPO/app/dist $CADDY/site/poetech-app
sudo docker restart poetech-web                                       # reload
```

Caddy (`infra/nas-caddy/Caddyfile`) serves it at host `:8088`, base `/poetech-app/`, with the same security headers as `app/vercel.json` and the same-origin `handle_path /n8n/* → reverse_proxy 172.17.0.1:5678`.

**Replication, stated plainly: run this same script on the second node.** Both nodes pull the *same* `origin/main`, build the *same* tree, serve the *same* app. No new mechanism is invented; the existing one is simply instantiated twice. Each node ends up with an independent, self-contained copy of the running app — which *is* the redundancy: either site can serve the family even if the other is down.

### 1b. Single-source config (the one thing that can diverge)
The build is byte-identical from git. The **only** per-node difference is `.env.local` (Supabase URL/anon key, n8n base, bearer) — deliberately **not** in git and **never overwritten** by the deploy script (its header says so). That is the correct seam:

- **Code + config-shape are single-source** (git, `app/.env.example` pins the *keys*).
- **Secrets/endpoints are node-local** (each `.env.local`), so a node can point at the right same-site n8n / GPU endpoint without a code fork.

To keep the two `.env.local` files from silently diverging in *meaning*, the discipline is: **`.env.example` is the contract; any new key lands there first** (the app already fails the build on a missing named export — same spirit). A short `env-parity` check (compare each node's `.env.local` *keys* against `.env.example`; values stay secret) makes drift visible without exposing secrets.

### 1c. The drift guard (verification, not trust — DR-0076)
The build is already **SHA-stamped** (`GITHUB_SHA` into the service worker). Expose it as a tiny readable artifact per node — e.g. write `git rev-parse HEAD` to `$CADDY/site/poetech-app/_deployed_sha.txt` at the end of the deploy — and a **parity probe** compares the two nodes' SHAs against `origin/main`. Green = both nodes on the same commit as main; red = drift, named and visible. This is the machine check that replaces "both nodes are in sync, trust me." (Concrete script in §7, Step 4.)

### 1d. How each node stays in sync (the sync mechanism)
Three options, with the trade-off named:

| Mechanism | How | Pro | Con | Verdict |
|---|---|---|---|---|
| **(a) Manual `deploy-pwa.sh`** (today) | Darrell runs it per node after a merge | Zero moving parts; fully his-hand | Two manual runs; can lag | Fine as the **floor**; keep it always working |
| **(b) Braked poll-and-deploy DSM task** ← **recommended** | A DSM Task Scheduler script per node: `git fetch`, compare local vs `origin/main` SHA, **rebuild only if changed**, single-flight lock + kill-switch + a daily ceiling | Sovereign, no inbound, survives reboot, newest-first, **carries the three brakes** | A loop (so it must be braked — and it is) | **Yes** — this is exactly the braked-native-runner pattern from the 2026-06-29 NAS-loops review, reused for deploy |
| **(c) GitHub Actions → push to NAS** | CI builds, pushes dist over Tailscale Funnel webhook | Centralized | Needs inbound to the NAS; couples deploy to a cloud runner; least sovereign | **No** for the sovereign control loop; optional convenience only |

Recommended: **(b)** — a deploy *is* a timer-driven loop, so it ships braked (budget ceiling = max rebuilds/day, single-flight lock so two fires never stack, kill-switch to freeze deploys during a service), single-instance, root-owned, boot-persistent. It reuses the `state/`-dir brake pattern (`brakes.sh`) verbatim. Keep **(a)** working underneath as the always-available manual floor.

---

## 2. CAPABILITY-ROUTED FEDERATION — dispatch each job to the node with the right hardware

### 2a. Reuse the router you already have, generalized one axis
`scripts/wake-router.mjs` + DR-0073 already pick **a worker by declared capability, behind all three brakes**: today the axis is *vendor* (`local` Ollama vs `anthropic` vs `gemini`), chosen by `ORCH_MODE` (`vendor-first` while local is weak; `local-first` once a GPU makes local strong), with the invariant **private/sovereign work → local-only, always**. The federation ask is the *same selector with one more axis*: choose **which node** runs the job, by the node's declared hardware capability.

This is deliberately **deterministic-first** ([[project-deterministic-first-ai-only-necessary]]): routing is a pure capability-match table — no model in the dispatch decision. The LLM is only ever the *worker* on the chosen node, never the dispatcher.

### 2b. The node/capability registry (declared, not guessed)
A committed manifest — `infra/ai-orchestrator/mesh/nodes.json` (an example skeleton ships with this review) — declares each node once:

```jsonc
{
  "nodes": [
    { "id": "home-ds1621xs", "site": "home", "tailscale": "192.168.1.26",
      "caps": ["serve", "storage", "cpu", "postgres", "registry", "ollama-cpu"],
      "endpoints": { "ollama": "http://192.168.1.26:11434", "registry": "192.168.1.26:5432" } },
    { "id": "church-cuda", "site": "church", "tailscale": "SME-CONFIRM",
      "caps": ["gpu", "whisper", "ollama-14b", "voice-clone"],
      "endpoints": { "ollama": "http://SME-CONFIRM:11434", "whisper": "http://SME-CONFIRM:8080" } },
    { "id": "church-rs", "site": "church", "tailscale": "SME-CONFIRM",
      "caps": ["serve", "storage", "media-corpus"], "endpoints": {} }
  ]
}
```

A job declares what it **needs** (`requires: ["gpu"]` or `["storage"]`); the router selects the node whose declared `caps ⊇ requires`, **health-green**, cheapest/closest first. GPU jobs (voice clone, harvest transcription, local 14B LLM) → `church-cuda`. Storage/CPU/registry jobs → `home-ds1621xs`. **No matching healthy node → the job HOLDS** (honest, logged), it never silently runs on the wrong hardware (a CPU node grinding a GPU job for 20 minutes is the exact anti-pattern DR-0073 was written against).

### 2c. Health-aware + the sovereignty bright line
A node's caps count only if its healthcheck is green (reuse the `guarded-action.sh` health gate / Uptime Kuma already wired). Two bright lines, both from DR-0073, carried into the node axis:

- **Private/sovereign GPU work is local-only, always.** A family voice-clone or private transcription routes to the church GPU node and, if that node is down, **waits** — it never falls back to a cloud vendor. Privacy outranks speed (TLC firewall).
- **Non-private GPU work** may, under `ORCH_MODE=vendor-first` and only when armed + budgeted, fall back to a cloud vendor if the GPU node is offline — the same outage-fallback the router already implements. This is a *choice per job class*, declared in the manifest, not a silent default.

### 2d. Where this rides the existing GPU-endpoint lane (local_2afc8728)
The church GPU work targets a **passive endpoint** — the `infra/church-gpu-node/whisper-gpu/` server (`GET /health`, `POST /transcribe`) and the church Ollama — reached node-to-node over Tailscale at the declared endpoint. The endpoint stays *passive* (transcribes on demand); **the brakes live on the caller** (the router/queue), never on the endpoint. That is the same split as today (`wake-router.mjs` host-side summon vs the dependency-free supervisor) and it keeps the GPU box a dumb-fast worker while the governance stays on the orchestrating node.

---

## 3. BRAKES ON BOTH NODES — the Cage applies before any automation, per node

### 3a. The Cage is already filesystem-state, so it is already per-node
`infra/ai-orchestrator/portable/orchestrator/lib/brakes.sh` defines all three brakes as **local files under `state/`**: `KILL_SWITCH` (present → inert, **ships present**), `ARMED` (present → armed, **ships absent**), `orchestrator.lock/` (atomic single-instance), and the per-day budget accumulator. `guarded-action.sh` adds allowlist + VLAN-guard + append-only audit + a 120 s health-gate with auto-rollback. **Each node gets its own `state/` dir**, so each node's brakes are independent and authoritative — and **each node ships inert**. Darrell arms each node **separately**; arming either is **Tier C, his hand, never while traveling** (2026-06-08 rule, `RELEASE-TIERS.md`).

### 3b. Two-level kill-switch, fail-closed
Add **one mesh-wide kill-switch** on the registry (home NAS) that every node checks **in addition to** its local one. The composite gate per node becomes: *inert if (local KILL_SWITCH present) OR (mesh KILL_SWITCH present) OR (mesh switch unreachable)*. Critically — **unreachable = treated as engaged** (fail closed). A network partition can never *enable* automation; the safe default on doubt is "stopped." One `touch` on the registry halts the whole mesh; each node's local switch still pauses that node alone.

### 3c. Mesh-wide observability by construction
The audit ledger is a single append-only, hash-chained Postgres table on the home NAS (`infra/ai-orchestrator/registry/`), and **both nodes write to that one ledger over Tailscale** (the design already has node-1 n8n pointed at the NAS Postgres). So every guarded action on either node lands in one tamper-evident spine — the AI that writes the ledger does not own the box that stores it. Per-node event reels (`events.jsonl`) feed the Dispatch Status surface as today. **The router itself ships inert/plan-only** (like `wake-router.mjs`: it logs what it *would* dispatch until `--summon` + every brake GO).

---

## 4. DATA / STATE — shared persistence across two nodes without split-brain

There are **three distinct data classes**, and conflating them is how split-brain sneaks in. Keep them separate:

| Class | What | Where today | Rule |
|---|---|---|---|
| **App relational DB** | family/church/business records the PWA reads+writes | **Cloud Supabase** is the live authoritative DB (migrations are applied "to cloud" per the repo convention); a **self-hosted Supabase compose** exists in-repo (`infra/supabase/docker-compose.yml`) as the sovereign successor | **Single-writer.** One authoritative instance; both nodes' PWAs point at it. |
| **Orchestrator registry/ledger** | audit ledger + pgvector memory | **Home NAS** Postgres (single instance, Tailscale-reachable) | **Single instance**, both nodes write to it → no split-brain by construction. |
| **Media / corpus** | ~100 TB church recordings + derived transcripts | **Church NAS** (local, by nature) | **Node-local**, referenced by ID from the one DB. Not replicated (too big); optionally backed up home. |

### 4a. The trade-off, surfaced — not picked silently
The real decision is **only** about the app relational DB. Two shapes:

- **Option A — one authoritative Supabase, both nodes point at it (status quo).**
  *Pro:* zero split-brain (one writer), simplest, both nodes show the identical view, **works today**. *Con:* if that one instance is cloud, the app data plane is **not sovereign** and an internet/cloud outage takes the data plane down even when both NAS are up.
- **Option B — self-hosted Supabase on the home NAS as the one authoritative instance.**
  *Pro:* full sovereignty, LAN-fast, survives an internet outage; **the compose is already scaffolded in-repo**, so this is a *migration*, not a new build. *Con:* the home NAS becomes a hard dependency for the church node's writes (mitigated: Tailscale LAN-grade link; a read-cache at the church node for offline reads).

**The anti-pattern to avoid (named, so it is not stumbled into):** running **two writable Supabase instances** (one per site) and syncing them. Multi-master sync = conflict resolution = the split-brain you asked to avoid. Don't.

### 4b. Recommended sequencing (MVP-pragmatism)
**Hold the single-writer invariant at every stage; move *which box* is the single writer, never the *number* of writers:**

1. **Now:** keep the one cloud Supabase as the single writer (A). No split-brain, no new work. Both NAS serve the static app against it.
2. **Sovereignty step (its own Tier-C decision):** promote the home-NAS self-hosted Supabase to *the* authoritative instance (B). Still **one** writer; the church node reaches it over Tailscale; add a **read replica / cache** at the church node for read-availability and offline resilience — **reads can be replicated, writes cannot fork**.
3. **Only if** true multi-site *offline-write* is ever required do you take on logical-replication/CRDT complexity — and that is a separate, deliberate Tier-C decision with its own review, **not** today's move.

The principle is one line: **single-writer per datum; replication is for read-availability and backup, never a second master.** It mirrors the registry (one ledger, both write to the one instance). The church ~100 TB media is exempt — it is inherently local and referenced by ID, so it never participates in the relational split-brain question at all.

---

## 5. Required screens

### 5a. MVP-pragmatism + sovereign-mesh-compatibility label
**MVP-pragmatic: ✅.** The plan reuses, in order: the existing `deploy-pwa.sh` (replication), the Cage `brakes.sh`/`guarded-action.sh`/registry (brakes + ledger), `wake-router.mjs` + DR-0073 (the router to generalize), Tailscale (the link), DSM Task Scheduler (the braked sync runner — built-in), and the in-repo self-hosted Supabase compose (the sovereignty target). **New code is thin and additive:** a declarative `nodes.json`, a small node-router wrapper around the existing picker, a SHA-parity probe, an env-key parity check, and a second-node clone of the deploy. No new platform, no new service to babysit.

**Sovereign-mesh-compatible: ✅.** No cloud in the *control* loop — deploy, routing, brakes, ledger, and kill-switch are all NAS-filesystem + Tailscale + DSM, LAN/Tailscale-only, no public attack surface. The one non-sovereign piece (cloud Supabase as the live DB) is itself on a **scaffolded** path to the home NAS (§4b). Open-source throughout (Caddy, Postgres, Ollama, DSM). Portable: the deploy is plain git+npm+Caddy; the router is plain Node; the brakes are POSIX sh — all lift to any Linux host without rewrite.

### 5b. Cost-efficiency screen
- **$0 new platform spend.** Both NAS and the GPU boxes are owned hardware; the mesh uses idle capacity. No new SaaS, no failover service.
- **Redundancy without a paid HA product:** "either node can serve" is achieved by running the same free deploy twice, not by a managed failover tier.
- **Capability routing *saves* compute:** GPU jobs stop grinding for minutes on the CPU node (DR-0073's whole point), and CPU jobs stop needlessly spinning the GPU. Right-sizing each job to its node is a direct cost reduction.
- **The brakes are also the cost ceiling:** the per-day budget brake bounds vendor/GPU spend per job class — the exact control the 2026-06-06 runaway lacked. Cost-efficiency and the safety brake are the same mechanism.
- **Lowest operational tax:** the braked DSM task is built-in (nothing new to patch); the SHA probe and env-parity check are a few lines each. Net new operating burden ≈ negligible.

---

## 6. Open questions / SME gates (flagged, not fabricated)

1. **SME — church site hardware + topology.** Confirm: does the church have (a) a Synology NAS (`tlcrackstation`) **plus** separate CUDA box(es) holding the 2× RTX 4070, or (b) some other arrangement? What are the CUDA box(es)' Tailscale IPs and OS? The router's `nodes.json` needs the **GPU endpoint IP**, which is *not* the NAS IP. (§0, §2b)
2. **SME — church NAS access.** `tlcrackstation` is firewalled on the tailnet (22/5000/5001/5678/11434/443 filtered). Opening LAN/Tailscale reachability for the processing node + a read-only service account is a **credential / his-hand step** (Darrell/BG hold the creds; the pipeline never does) — the same access decision already recorded for the colg-infra lane. This is **Step 0**; the mesh cannot federate to an unreachable node.
3. **GPU boxes not currently on the mesh.** Per 2026-06-10, the home NAS is the only live inference host (CPU-only). Standing up the church GPU node (Ubuntu + NVIDIA/CUDA + Docker + Ollama + the whisper endpoint, Tailscale-joined) is its own provisioning task — the plan is *ready* for it but does not assume it.
4. **Cloud vs self-hosted Supabase — which is authoritative when sovereignty step lands?** §4b sequences it, but the *cutover* is a Tier-C decision (data migration + RLS verification + a soak). Not bundled here.
5. **n8n loop migration interplay.** The 2026-06-29 NAS-loops review recommends moving the 16 timer loops to braked DSM tasks. The deploy-sync runner (§1d-b) is the *first* such braked task — proving the pattern. Sequence the two reviews together.

---

## 7. The stand-up path (paste-ready — Darrell's hand; nothing below has been run)

Each block is self-contained from any PowerShell directory (binding rule), ASCII-only, one command per line. The home NAS IP `192.168.1.26` / user `dpoe` are filled in; church values are `SME-CONFIRM` until §6.1/6.2 are answered. **Each step ends with a proof-of-success line.**

### Step 0 — Confirm reachability + specs FIRST (the reality-trace gate)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "uname -a; nproc; free -h; df -h /volume1; docker ps --format '{{.Names}}'"
ssh dpoe@192.168.1.26 "tailscale status | grep -i rack"
```
*Proof of success:* the home NAS prints its specs and `poetech-web` + supabase + ollama containers; the church RackStation shows in `tailscale status`. (Church GPU endpoint reachability + specs = SME answers, §6.1/6.2 — do not proceed to Step 3 for the church node until those land.)

### Step 1 — Verify the home node deploy still works + emit its SHA
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "sh /volume1/PoeTech/scripts/deploy-pwa.sh"
ssh dpoe@192.168.1.26 "cat /volume1/PoeTech/caddy/site/poetech-app/_deployed_sha.txt 2>/dev/null || echo 'sha file not yet added'"
```
*Proof of success:* deploy prints `DONE — https://poetech.tail5a2f35.ts.net:8443/poetech-app/` and the URL loads. (The `_deployed_sha.txt` line is added by the one-line patch in Step 4; until then it prints the "not yet" message — expected.)

### Step 2 — Land the capability manifest + this review in-app (idempotent, his hand)
The committed artifacts (in this PR): `infra/ai-orchestrator/mesh/nodes.json` (the registry the router reads) and `infra/seed-data/2026-06-29-sovereign-mesh-two-nas.{json,sql}` (the in-app Projects/Discussions record). Apply the seed **once** in Supabase Studio against the family instance (resolves by slug; `ON CONFLICT DO NOTHING`):
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "ls -la /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/ai-orchestrator/mesh/nodes.json"
```
*Proof of success:* `nodes.json` is present after the next `git pull`; the seed renders under **Projects → Sovereign Mesh → Discussions** after you run the SQL in Studio (the seed header carries the exact apply note).

### Step 3 — Stand up the SECOND node (church) — clone the proven path *(after Step 0/§6 SME answers)*
On the church NAS (its DSM/SSH; values from §6): clone the repo to `/volume1/PoeTech/repos/Kingdom-PWA-Node`, create its own `.env.local` from `app/.env.example` pointing at the **same-site** n8n + the church GPU endpoint, drop a copy of `deploy-pwa.sh` adjusted for that node's paths, and run it once. (Church-specific paste block to be finalized once §6.1/6.2 land — it is the *same* script with the church repo path + Caddy path.)
*Proof of success:* the church node serves `/poetech-app/` on its own Caddy and `_deployed_sha.txt` matches the home node's SHA.

### Step 4 — Add the drift guard (one-line deploy patch + a parity probe)
Append to the **end** of each node's `deploy-pwa.sh` (after the dist copy):
```
git -C "$REPO" rev-parse HEAD > "$CADDY/site/poetech-app/_deployed_sha.txt"
```
Then a parity probe (run from anywhere) compares both nodes to `origin/main`:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
git ls-remote origin -h refs/heads/main
ssh dpoe@192.168.1.26 "cat /volume1/PoeTech/caddy/site/poetech-app/_deployed_sha.txt"
```
*Proof of success:* the home node's SHA equals `origin/main`'s SHA (and, once Step 3 lands, the church node's too). Mismatch = drift, named and visible — the DR-0076 machine check.

### Step 5 — Confirm the brakes ship inert on each node (proven-to-catch)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "ls /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/ai-orchestrator/portable/state/"
```
*Proof of success:* `KILL_SWITCH` is **present** and `ARMED` is **absent** on each node — the Cage ships engaged/disarmed; arming is a separate, watched, Tier-C action per node (his hand, never while traveling). The braked DSM deploy-sync task (§1d-b) is registered **disabled** and enabled only with someone watching.

---

## Verification screen on this report (DR-0076 + Phil 4:8)

**Religion check (backbone):** every architectural claim is tied to a cited file/path read this session or a dated prior probe; the three honest gaps (GPU-location premise, firewall/reachability, cloud-vs-sovereign DB) are surfaced **before** any step, not papered over; the single-writer invariant and the fail-closed kill-switch are stated as the load-bearing safety properties. What I could **not** verify in-session — the church NAS specs and the GPU-endpoint IPs — is marked **SME**, not invented (a `nodes.json` with `SME-CONFIRM` placeholders, never a fabricated IP).

**Relationship check (warmth):** the plan does not shame the current single-node reality — it *is* the right Phase-1 call and the second node simply runs the same proven script; the migration is staged so there is never a big-bang cutover; every NAS command is paste-ready from anywhere with a proof line; the human governs every arm and every cutover.

**Phil 4:8:** TRUE — claims sourced or marked SME. HONORABLE — no inflated "the mesh is live" when it is not. JUST — the split-brain anti-pattern is named and refused, not hidden. PURE — no architectural vanity; single-writer over clever multi-master. LOVELY — serves the family's redundancy and the church's sovereignty. COMMENDABLE — concrete, reuses what's built. EXCELLENT — replication + federation + brakes + data tied into one coherent path. PRAISEWORTHY — becomes the precedent the next "add a node" question inherits.

*Trace reality before you build. One source of truth. Route by declared capability, not a guess. Brake on every node, fail closed. One writer, never two. The NAS is the governance point. We all win. We create. Amen.*
