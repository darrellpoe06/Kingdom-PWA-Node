# Stack Dependability Review

**Date:** 2026-06-17 · Layer 3/4 architecture record · Author: Claude (advisory), for Darrell (governs)

> **Why this exists.** Darrell asked, plainly: *"why are these the technology stacks if
> they aren't sustainable and dependable?"* — at a low-trust moment, after a month of
> finance transactions silently went missing (newest entry 05-15, a 6/15 $833.53
> eye-exam debit nowhere to be seen) and the app reported *"Workflow 18 returned 404."*
> This is the honest answer. No green-washing. It names where the **tools** are sound,
> where the **glue and operations** are fragile, and — fairly — where the **stack itself**
> deserves a second look. It ends with a target-state and a prioritized, conference-safe
> remediation sequence.

**Method.** Every claim below is grounded in a real file, config, or the verified
root-cause record. Citations are repo-relative paths. The two anchor documents are
[the wf18 root-cause](../99-session-notes/2026-06-17-wf18-stalled-imported-transactions-rootcause.md)
(today's failure, verified live on the NAS) and
[the 2026-06-13 rigorous review](../99-session-notes/2026-06-13-rigorous-review-findings.md)
(three parallel reviews against `main`). This is a research/doc artifact — **no production
code was changed to produce it.**

> **Binding frame (Darrell, 2026-06-17):** *"we still need open-source, just better
> ways."* The dependability answer stays **inside the open-source / sovereign frame.** The
> fix for fragility is **better open-source engineering — not vendor lock-in.** No verdict
> below recommends trading a self-hostable component for a proprietary managed SaaS to "buy"
> reliability. Every REPLACE/CONSOLIDATE proposes an **open-source, self-hostable, portable**
> path with no monthly vendor dependency. Where a managed service is named as an interim, it
> is explicitly a *stepping stone* with the sovereign end-state stated. This pairs with
> `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` (open-source core, sovereign, exportable, no
> data-lock-in) and the `AI-FOUNDATION-INTERNAL-OPERATIONS.md` sovereignty principle.

---

## 0. The one-paragraph truth

The **tools in this stack are mature and well-chosen** — Supabase, n8n, Postgres,
Tailscale, Vercel, Ollama, GitHub Actions are each defensible picks for a sovereign,
cost-disciplined, family-first system. **The fragility is almost entirely in the seams**:
work that is *built but not running*, hand-offs that need a human to toggle a switch,
data that lives in three different homes with nothing reconciling them, and an almost
total **absence of monitoring on the connections between components.** The wf18 outage
was not a Supabase bug or an n8n bug — it was a workflow that silently flipped inactive
on a restart, with **no alert that reached Darrell**, while the app kept rendering
month-old data as if it were current. That is a glue-and-observability failure, and it is
the dominant pattern. There are exactly **three genuine stack-level critiques** (the
cloud/NAS data split, Vercel as an uncontrolled dependency, and the orchestrator being a
built-but-never-run engine) — everything else is operations discipline we can install.

---

## 1. Component-by-component review

Enumerated from the repo. Verdict legend: **EARNS ITS PLACE** (keep) · **CONSOLIDATE**
(keep the tool, fix how it's wired/where state lives) · **REPLACE** (the choice itself is
the problem).

### 1.1 Supabase (cloud) — the app's primary backend

- **Job.** Auth, Postgres + RLS, realtime sync for all app data (accounts, transactions,
  projects, church, conference, feedback…). Project `PoeTech-Family-OS`, AWS us-east-2,
  **Free plan**, provisioned 2026-05-23 (`app/.env.local`). The browser connects with the
  publishable/anon key; RLS is the real protection. Sync lives in `app/src/lib/table-sync.js`
  and the `*-sync.js` modules.
- **Real failure modes (all glue, not the tool).**
  - New tables silently 403 until `authenticated` is GRANTed — the cloud project lost its
    default grant; bit the Choir tab 2026-06-16 (memory `project_authenticated_grants_lost_on_new_tables`).
  - Migrations only reach the DB if the `db-migrate` lane fires — and it *didn't* when
    auto-merge landed via `GITHUB_TOKEN` (§1.10), so merged SQL sat un-applied.
  - `fetchAll` is `SELECT *` unpaginated; append-only tables have no retention
    (rigorous review A6/A7). Family-scale fine; not yet rigorous at community scale.
  - **Free cloud plan** pauses a project after inactivity and caps rows/storage — a real
    dependability cliff if the *cloud* instance is ever the system of record for a
    community. The sovereign answer is to **not depend on the proprietary cloud at all**
    (see verdict).
- **Verdict: EARNS ITS PLACE — and Supabase is open-source / self-hostable, so the
  sovereign path is already in the repo.** Supabase is an open-source product (Postgres +
  GoTrue + PostgREST + Realtime + Studio + Kong), and a **self-hosted NAS deployment is
  already defined** at `infra/supabase/docker-compose.yml` (DS1621xs, fronted by Web
  Station aliases `/supabase-studio/` + `/supabase-api/`). RLS + realtime is exactly the
  right model for a multi-device family app. The dependability answer is **not** a paid
  cloud tier — it is to **finish the self-hosted Supabase stack on the NAS and make it the
  single source of truth** (§3.4), keeping the cloud project only as an optional managed
  mirror or dev convenience, never the leash. Near-term fixes are operational (grant-guard
  already shipped; pagination/retention queued). See §1.2 and the data-split critique (§2).

### 1.2 NAS Postgres 16 + pgvector — orchestrator registry (and intended n8n backend)

- **Job.** The "Master Registry" for the sovereign AI orchestrator (the Cage): an
  append-only, hash-chained, tamper-evident audit ledger, deliberately on the NAS so it
  survives an OBS-box reimage (`infra/ai-orchestrator/README.md`,
  `infra/ai-orchestrator/registry/sql/001-audit-ledger.sql`). Also the *intended* backend
  for n8n (`infra/n8n/docker-compose.yml` §Post-vacation) — **never cut over.**
- **Real failure modes.** Mostly latent — the registry isn't operationally live yet
  (the orchestrator ships inert, §1.9). The genuine issue is **architectural, not a tool
  fault**: this is a *third* Postgres-shaped data home alongside cloud Supabase (§1.1) and
  the NAS JSON finance store (§1.3). Nothing reconciles them.
- **Verdict: CONSOLIDATE.** Postgres is the right datastore; the problem is *how many
  Postgres-shaped sources of truth we run.* See the single-source-of-truth target (§3.4).

### 1.3 NAS JSON files — the sovereign finance loop's source of truth

- **Job.** `/volume1/PoeTech/finance-events/` (bind-mounted into n8n as `/data/finance-events/`)
  holds the finance pipeline's truth: Gmail-captured alerts (`gmail/christina__*.json`),
  bank rows (`bank/<inst>/*.json`), reconcile state, balances. **Not Supabase** — this
  surface is deliberately sovereign (wf18 root-cause doc, lines 28-30).
- **Real failure modes (the heart of today's outage).**
  - **It only reaches the app through wf18**, a single workflow. wf18 went inactive →
    HTTP 404 → the app could not see a month of captured data even though the data was
    on the NAS the whole time (the $833.53 eye-exam *is* captured).
  - **No schema, no constraints, no retention** — files accrete forever; correctness
    depends entirely on the producing workflow's code being right (it isn't always: every
    captured email is mis-stamped "today," wf18 doc finding 6).
- **Verdict: CONSOLIDATE.** A sovereign file-based loop is a legitimate design, but it
  being a *separate source of truth reachable only via one toggle-able webhook* is the
  fragility. Either land its data into the same Postgres the app reads, or put a health
  check + staleness badge on the seam (§3.2). This is one of the three stack-level
  critiques (§2).

### 1.4 n8n — the workflow orchestrator

- **Job.** Every automation: finance ingest (wf14/15/16/18), health (wf20), dispatch
  status, LLM health, class tutor, photo pipelines, briefings — **47 workflow JSONs**
  in `docs/00-foundations/n8n-workflows/` + `infra/n8n/`. Deployed on the DS1621xs via
  `infra/n8n/docker-compose.yml`.
- **Real failure modes — this is the fragility epicenter, and almost all of it is glue:**
  - **"Built ≠ running."** Of 47 committed workflow JSONs, **exactly one** (`99-error-workflow-global.json`)
    is `active: true` in the repo. Activation lives in n8n's own DB, not the JSON, so the
    repo is not the source of truth for what's actually running. The live NAS state and the
    committed state **drift** — wf20 is `active: false` in the repo but was running live;
    wf18's two registered copies were *both* inactive (wf18 doc, lines 40-44).
  - **Manual import + activate.** A workflow becomes live only when a human imports and
    toggles it. wf18 flipped inactive on the **2026-06-16 restart** (two workflows claiming
    one webhook path → n8n deactivates to resolve the conflict) and **stayed down** until
    noticed a day later.
  - **No brakes on the 16 cron workflows** (rigorous review W1): no `executionTimeout`,
    no concurrency lock/kill-switch — the exact 2026-06-06 runaway pair (wf27/wf31) included.
  - **`settings.errorWorkflow` set on zero workflows** (W2) — the one active error handler
    (wf99) is orphaned; every failure is silent. This is *why* wf18 could die quietly.
  - **No `headerAuth` on ~22 open webhooks** (W3) — only wf18 does a code-level bearer
    check; the rest lean on Tailscale obscurity.
  - **Bind mounts added imperatively** (W4) — `/data/*` mounts come from one-off scripts
    (`infra/n8n/scripts/add-*-mount.sh`), absent from the committed compose. A workflow
    whose mount script wasn't run writes to the ephemeral container layer and loses data
    on recreate (the original wf27 incident).
  - **Isolated SQLite backend** ("vacation week," never migrated to Postgres — compose
    lines 5, 38-40). All activation state + credentials live in one SQLite file on a bind
    mount; that file's restart behavior is what deactivated wf18.
- **Verdict: EARNS ITS PLACE (the tool) / CONSOLIDATE (how we run it).** n8n is the right
  visual-automation engine and is **fair-code / fully self-hosted** here (on the NAS, no
  vendor cloud) — squarely inside the sovereign frame. The dependability gap is *entirely*
  operational: declarative activation, error-workflow wiring, header auth, committed
  mounts, and a Postgres backend. None of these is an n8n limitation — they are settings
  and discipline we haven't installed. `scripts/workflow-conformance.mjs` already
  *detects* W1-W3 deterministically; it just doesn't yet *gate* on them. **No swap is
  warranted** — but if one ever were, it must stay open-source: Windmill (Apache-2.0,
  scriptable, lightest migration), Node-RED (flow-based), or Temporal/Airflow (heavier,
  code-first orchestration). The fix here is engineering discipline, not a different
  product.

### 1.5 Tailscale (+ Funnel) — the network reach for n8n

- **Job.** Private, encrypted reach to the NAS. The PWA hits n8n webhooks via the
  **same-origin `/n8n` rewrite** (`app/vercel.json` → `https://poetech.tail5a2f35.ts.net/...`),
  never the absolute Funnel URL cross-origin (memory `project_n8n_same_origin_rewrite`;
  cross-origin throttles to 503). n8n's network security model *is* Tailscale —
  basic auth is off, secure cookies off (compose, by design, since Tailscale encrypts).
- **Real failure modes.** **The Funnel does not auto-restart on NAS reboot**
  (`PERPETUAL-PIPELINE-HEALTH.md`, line 7) — a reboot silently severs the app→n8n path
  until someone re-establishes it. There is a setup script
  (`infra/n8n/scripts/setup-tailscale-funnel.sh`) but no boot-persistence unit.
- **Verdict: EARNS ITS PLACE.** Tailscale is the correct sovereign-network choice and the
  tool is solid. The single fix is **boot persistence** (a systemd/Synology task that
  re-arms the Funnel on boot) — pure ops.

### 1.6 Vercel — production hosting of the PWA

- **Job.** Serves the built PWA to poetech.us. Git deploy enabled for `main` only
  (`app/vercel.json` `git.deploymentEnabled`), with the CSP/security headers and the
  `/n8n` + `/poetech-app` rewrites.
- **Real failure modes (genuine stack-level critique).** **Hobby tier caps deployments at
  100/day.** Many parallel feature branches each firing a preview build blew the cap, and
  *a green merge to main stopped serving to poetech.us until the window reset*
  (`.github/workflows/deploy-cloudflare-pages.yml` header). That is an **uncontrolled
  external dependency** gating whether the family's app updates — exactly the kind of
  third-party leash the sovereignty principle exists to remove.
- **Verdict: REPLACE — sovereign end-state is self-hosted; Cloudflare Pages is an
  acceptable interim, not the destination.** The app is a static bundle (`vite build` →
  `dist/`) plus one same-origin `/n8n` proxy — both are **trivially self-hostable on the
  NAS we already own.** The sovereign end-state: serve `dist/` from **Caddy or Nginx on the
  NAS** (Caddy gives automatic HTTPS in a few config lines) with the `/n8n` reverse-proxy
  rule co-located — no third-party host in the path at all. The scaffolding for this is
  *already present*: `deploy-to-synology.ps1` builds and `scp`s `dist/` to the NAS today,
  served by Synology Web Station at `/poetech-app/`. The remaining gap is a real web server
  (Caddy/Nginx) in front for clean HTTPS + the proxy, and reachability for off-LAN family
  (Tailscale, or a Funnel/own-domain).
  **Interim:** the off-Vercel **Cloudflare Pages** pipeline is already built and committed
  (`deploy-cloudflare-pages.yml`, `app/functions/n8n/[[path]].js`, `app/public/_redirects` +
  `_headers`), gated off behind `CF_PAGES_ENABLED`, churn-controlled (push-to-main only).
  It immediately removes the Vercel 100/day cap at $0 — a fine **stepping stone** off the
  capped dependency. But it is still a proprietary host; per the binding frame it is the
  *bridge*, and **NAS-served Caddy/Nginx is the destination.** (Memory
  `project_off_vercel_cloudflare_pages`; cutover plan
  `docs/99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md`.)

### 1.7 Ollama / local LLM — sovereign inference

- **Job.** Local, no-vendor inference for reasoning/summary/classification. On the
  DS1621xs today: CPU-only, `qwen2.5:3b` (fast) + `deepseek-r1:8b` (reasoning) + a 14B +
  `nomic-embed-text`, `OLLAMA_MAX_LOADED_MODELS=4`, 24 GB cap (compose §Ollama). Consumed
  by wf17 (deeper reasoning), wf27 (foundation agent), `wf-class-tutor`, `wf-llm-health`.
  Future GPU home is Node 1 (Legion PC, RTX 4070) per the orchestrator architecture.
- **Real failure modes.** The **`keep_alive` model-pin was part of the 2026-06-06 runaway**
  (CLAUDE.md autonomous-automation rule); CPU inference on the NAS is slow (3-15 tok/sec);
  the in-app `LlmHealth` card reads live `/api/ps` via `wf-llm-health` and is **proven to
  catch** the pinned/runaway signature (memory `project_local_llm_health_surface`) — so
  this seam, unusually, *has* monitoring.
- **Verdict: EARNS ITS PLACE.** Sovereign inference is core to the mission and Ollama is
  the right runtime. The dependability story here is actually the **best in the stack**
  (it has a live health surface). The open item is hardware — heavy reasoning wants the
  GPU box, which is gated behind the orchestrator standing up (§1.9).

### 1.8 The PWA + service worker — the primary artifact

- **Job.** The app itself (Vite build, `app/`). The service worker (`app/public/sw.js`)
  gives installability, an offline shell, and **per-deploy cache busting**: `vite.config.js`
  stamps `__SW_VERSION__` from the git SHA so every deploy changes `sw.js`'s bytes and the
  old caches are deleted on activate — forward fix #4 for the 2026-06-03 stale-SW incident
  (a stale SW once masked a deployed privacy fix; `LESSONS-LEARNED.md`).
- **Real failure modes.** Largely *closed* — the SW cache-bust is a fixed past failure with
  a clear mechanism. The residual risk is the monolith file
  (`app/src/poe-financial-mvp-v28.jsx`) being a single huge module (new surfaces are built
  as their own files to avoid it — memory `project_new_surface_new_module`), and the app
  trusting upstream seams (wf18) without a staleness guard (§3.2).
- **Verdict: EARNS ITS PLACE.** This is the center of everything (CLAUDE.md: "the app is
  the primary artifact"). The SW is correct. The dependability work is *upstream* of it —
  the app should *show* when a seam it depends on is stale rather than render old data as
  current.

### 1.9 The orchestrator bundle (the Cage) — built, deliberately never run

- **Job.** The intended sovereign AI engine: two-tier Cage (`registry/` on NAS +
  `node1/` on the GPU box) plus a `portable/` skeleton. Hard governance: VLAN protection,
  allowlist-only actions, append-only audit, health-gate + 120s rollback
  (`infra/ai-orchestrator/`).
- **Real failure modes.** It **ships inert and has never been deployed/armed** — the
  kill-switch ships *engaged* (`infra/ai-orchestrator/portable/state/KILL_SWITCH` =
  `ENGAGED`), there is no ARM flag, budgets are unset, and the portable skeleton has *no
  self-drive logic at all*. This is **correct and intentional** post the 2026-06-06
  runaway (three-brakes rule, Tier C). But honestly: the "AI orchestrator engine" that
  much of the vision narrates is, operationally, **not running.** It is a well-designed,
  well-braked *plan*, not a live capability.
- **Verdict: EARNS ITS PLACE — as a held design.** The brakes and the inert default are
  exactly right (and a drift gate already keeps the portable bundle honest — memory
  `project_portable_orchestrator_keep_in_sync`). The honest framing for Darrell: **do not
  count on the orchestrator for dependability today.** Dependability must come from the
  simpler, always-on pieces (health checks, declarative deploy) — *not* from an engine
  still behind its kill-switch.

### 1.10 GitHub Actions — CI and the deployment lanes

- **Job.** The mechanical floor. `ci.yml` (lint + Vitest + the wf36 gatekeeper harness,
  required on every PR/push). `auto-open-pr.yml` + `auto-merge.yml` (push a `feat|fix|merge|docs`
  branch → PR → auto-merge on green, `hold` label opts out). `db-migrate.yml` (applies
  `migrations-auto/*.sql` to the cloud DB). `deploy-cloudflare-pages.yml` (gated off).
  `daily-review.yml` + `pm-synth.yml` (ship inactive / manual, correctly braked).
- **Real failure modes (glue).**
  - **The `GITHUB_TOKEN` push gap.** A migration auto-merged by the token does **not** fire
    `db-migrate` (GitHub suppresses push-triggered runs from the token, anti-recursion).
    This silently left migrations un-applied on 2026-06-16 and re-broke the Choir tab. The
    fix is *in the workflow now* (auto-merge dispatches db-migrate when main's tip touched a
    migration) — but it is a patch over a real seam where "merged" did not mean "applied."
  - **The repo isn't the source of truth for n8n activation** (§1.4) — CI gates code, but
    nothing in CI asserts which workflows are *running* on the NAS.
- **Verdict: EARNS ITS PLACE.** Actions is mature and the lane design is genuinely good —
  required checks, idempotent migrations, ship-inactive discipline. The gaps are seams
  it doesn't yet observe (NAS activation state) and the token-recursion patch. The
  highest-leverage addition is a **gate that fails when a workflow lacks `errorWorkflow`
  or brakes** (W2/W1) — `workflow-conformance.mjs` already computes it; promote it from
  report-only to a check.

### 1.11 ntfy / Synology Chat / Pushover — the alert channels

- **Job.** Push notifications to the family. ntfy self-hosted on the NAS (compose §ntfy,
  port 8081, topic-based); Pushover dual-path wired through n8n env (compose); Synology
  Chat via `app/src/lib/synology-chat.js`.
- **Real failure modes (this is the one that *hurt* on 2026-06-17).**
  - wf20 health-check **does** push to ntfy topic `poetech-health` on a severity
    transition, and **does** check bank-ingest freshness (`wf15_fresh`, alerts if >36h old)
    — yet the bank feed has been stale since 5/27 and **no alert reached Darrell.** So
    either wf20 wasn't actually firing, or nobody is subscribed to / watching that ntfy
    topic. The alert *path exists in code and still failed to inform the human.*
  - `synology-chat.postToChat` **fails open** — returns `{posted:true}` even on an opaque
    no-cors rejection (rigorous review A9). A "sent" alert may never have sent.
- **Verdict: CONSOLIDATE.** The tools are fine; the **alert-reaches-the-human** contract is
  broken. An alert that fires into a topic no one watches is not monitoring. The fix is to
  route critical alerts to a channel Darrell *actually sees* (his phone, confirmed
  subscribed) and to make the health check assert "a normally-active workflow is now
  inactive" — the exact signal wf20 missed (§3.2).

---

## 2. The three genuine stack-level critiques (not just ops)

Everything above is mostly "install the missing discipline." These three are real
*architecture* questions worth Darrell's decision:

1. **The data is split across three homes with nothing reconciling them.**
   Cloud Supabase (app data, §1.1), NAS JSON files (finance loop, §1.3), and NAS Postgres
   (orchestrator registry, §1.2) are three independent sources of truth. The finance loop
   is the sharpest pain: its truth lives in NAS JSON and reaches the app through **one
   toggle-able webhook (wf18)** — which is precisely how a month of data became invisible.
   *This is a design choice to resolve, not a bug to patch.* (§3.4.)

2. **Vercel is an uncontrolled external dependency on the family's app uptime.**
   A third party's free-tier deploy cap decided whether poetech.us updated. The *sovereign*
   fix is to self-host the static bundle + `/n8n` proxy on the **NAS via Caddy/Nginx** (the
   `deploy-to-synology.ps1` path already exists); Cloudflare Pages is an acceptable interim
   to escape the cap at $0, explicitly a stepping stone, not the destination. (§1.6, §3.5.)

3. **The "AI orchestrator engine" is a plan, not a running system.**
   Much of the vision leans on autonomous orchestration; operationally it is inert behind
   an engaged kill-switch (correctly, post-runaway). Dependability today must rest on the
   simple always-on pieces, not on the engine. Be honest in planning about what is *live*
   vs. *designed.* (§1.9.)

Note what is **not** on this list: n8n, Supabase, Tailscale, Ollama, Postgres, GitHub
Actions, the PWA/SW. Those tools are sound. Their failures were seams and operations.

---

## 3. Dependability target-state — what makes this same vision dependable

The vision does not need different tools, and it does not need a proprietary host or a
managed-SaaS crutch. It needs **dependable open-source**: the same self-hostable components
we already run, with the **seams instrumented and the hand-offs automated.** Every target
below is self-hostable, portable, and carries no monthly vendor dependency — dependability
bought with engineering, not with lock-in. Six targets, each tied to a real failure above.

### 3.1 Declarative deployment — "built" always means "running"
A workflow is activated **by code on deploy, never by a human toggle.** Use the n8n CLI
import with `--active`, or a deploy script that imports every JSON and activates the ones
marked live, so the **repo is the source of truth** for what runs. Then "merged" → "running"
with no manual step — closing the wf18 class (built ≠ running) and the activation drift
(§1.4). Pairs with retiring the per-mount scripts in favor of committed compose mounts (W4).

### 3.2 A health check + alert on *every* seam, pushed to a channel Darrell sees
The wf18 failure was **detectable but not surfaced.** Every seam gets a watcher:
- **Workflow-aliveness:** alert if a normally-active workflow is now inactive (the exact
  signal wf20 lacks today). `workflow-conformance.mjs` already enumerates the workflows;
  extend the live check to compare expected-active vs actual-active.
- **Import staleness:** alert if the newest doc in `/data/finance-events` (or any feed) is
  older than a threshold — and **show an in-app staleness badge** on the Tx + Imported
  surfaces so the app never renders month-old data as current (wf18 doc, "Observability
  gap to close").
- **Cockpit-disconnected:** alert if a surface that should be reading live data is getting
  404/empty.
- **Alert delivery is verified** — route to a channel Darrell is confirmed subscribed to,
  not a topic no one watches (§1.11). This is the *self-reporting system* — it ties to
  `EXECUTION-OUTCOME-OBSERVABILITY` and the data-loop watcher being built (session
  `local_8da7da13`). Per the three-brakes rule, any new watcher ships inactive, budgeted,
  single-instance, with a kill-switch.

### 3.3 Idempotent / self-healing pipelines — a missed run recovers on the next
Every ingest is idempotent and **catches up** rather than skipping: wf14b's `newer_than:1d`
window means a day the cron didn't run is data lost forever (wf18 doc, backlog section).
Widen to a catch-up window keyed on "last successful capture," so a missed run heals on the
next. The bank feed should not depend on a **manual QFX download** — enable e-statement
emails so wf21/21b auto-feed wf15 (wf18 doc, fix section). db-migrate is already idempotent
(applies all guarded SQL every run) — that is the pattern to copy everywhere.

### 3.4 A single source of truth — one self-hosted Supabase/Postgres on the NAS
The sovereign resolution to the cloud/NAS split is **self-hosted Supabase on the NAS**
(`infra/supabase/docker-compose.yml`, already defined) as the single system of record —
not leaning harder on the proprietary cloud. The cloud project, if kept at all, becomes an
optional managed mirror, never the leash. Decide, per data domain, **one** home and make
the others derived/cache:
- **Finance:** either (a) land NAS-captured events into the same Postgres the app reads
  (the app stops depending on a sovereign webhook), or (b) keep the sovereign JSON loop but
  treat wf18 as a *monitored, declaratively-activated, auth'd* read API with a staleness
  badge — never a silent single point of failure. Recommend (a) for dependability, (b) only
  if sovereignty of the raw feed is non-negotiable.
- **n8n state:** cut over from isolated SQLite to the NAS Postgres (compose §Post-vacation)
  so activation/credentials live in a real, backed-up DB — and one restart can't silently
  deactivate a webhook.
- This is the largest single dependability lever and a **governance decision** for Darrell,
  not an auto-applied change.

### 3.5 Get off Vercel — sovereign hosting on hardware we own
End-state: serve the static `dist/` bundle + the `/n8n` reverse proxy from **Caddy or
Nginx on the NAS** — open-source, self-hosted, no third-party host in the path. Caddy gives
automatic HTTPS in a handful of config lines; the `deploy-to-synology.ps1` build-and-copy
path already exists, so this is "add a real web server in front + sort off-LAN reach
(Tailscale / Funnel / own domain)." **Interim, if useful:** flip `CF_PAGES_ENABLED` + set
the secrets to land on Cloudflare Pages — it escapes the 100/day cap at $0 today (pipeline
already built, §1.6) — but treat it as the bridge to NAS-served Caddy/Nginx, not the
finish line.

### 3.6 Boot persistence on the network seam
A Synology boot task that re-arms the Tailscale Funnel on reboot (§1.5), so the app→n8n
path survives a power blip without a human.

---

## 4. Prioritized remediation sequence (low-hanging fruit first, conference-safe)

Ordered by **dependability-gain ÷ effort**, and sequenced so nothing risks the July
conference. None of step 1-4 touches the conference path; the heavier items (5-7) are
staged inactive or are deliberate governance decisions.

| # | Fix | Why first | Effort | Conference-safe? |
|---|-----|-----------|--------|------------------|
| **1** | **Restore wf18** (activate canonical copy, provision bearer, delete the stale duplicate, set `VITE_N8N_BEARER`) | The active outage — a month of finance data is invisible. Script already exists: `scripts/nas-update-wf18-bearer-guard.sh`. | Low (needs Darrell's hand for the toggle + Vercel redeploy) | Yes — isolated to finance |
| **2** | **In-app staleness badge** on Tx + Imported (show "data may be stale — last updated <date>" when newest tx > ~3 days) | Stops the app lying that old data is current — the trust fix. Pure app code, the lane already handles it. | Low | Yes — additive UI |
| **3** | **Verified alert delivery + workflow-aliveness check** (wf20 alerts on "expected-active workflow is inactive"; route critical alerts to a channel Darrell confirms he sees) | Turns the silent failure into a push he gets. ntfy/wf20 already exist; this closes the gap that let wf18 hide. Ships inactive → enable attended (3 brakes). | Low-Med | Yes — read-only/report |
| **4** | **Promote `workflow-conformance.mjs` from report-only to a CI gate** (fail on missing `errorWorkflow` (W2) / missing brakes (W1) before any workflow can be marked live) | Makes "every failure is silent" un-shippable; proven-to-catch precedent (DR-0076). Detector already written. | Low | Yes — CI only |
| **5** | **Declarative activation + committed mounts** (deploy script imports + `--active`; all `/data/*` mounts in committed compose; retire per-mount scripts) | Kills the "built ≠ running" + data-loss-on-recreate classes (W4). | Med | Yes — NAS-side, staged |
| **6** | **Get off the capped host** — interim: flip `CF_PAGES_ENABLED` (Cloudflare Pages, $0, uncapped); end-state: serve `dist/` + `/n8n` from **Caddy/Nginx on the NAS** | Removes the Vercel cap as an uptime dependency; the NAS path keeps hosting sovereign. Interim built; NAS path uses the existing `deploy-to-synology.ps1`. | Med (interim) → Med-High (NAS web server) | **DNS cutover after the conference** — broad blast radius |
| **7** | **Single source of truth = self-hosted Supabase/Postgres on the NAS** (`infra/supabase/docker-compose.yml`); land the finance loop + n8n state into it; retire the cloud-vs-NAS split | The biggest architectural lever; sovereign, open-source, no vendor leash. | High — **governance decision** | Yes — decide now, implement post-conference |

**The fast trust-restoring win is steps 1-3:** get the data flowing again, stop the app
from presenting stale data as fresh, and make the next silent failure page Darrell instead
of waiting a month to be noticed. Steps 4-5 make it stay fixed. Steps 6-7 are the
deliberate, watched, post-conference moves.

---

## 5. Trade-offs and honest caveats

- **Sovereignty vs. dependability is a false trade — the fix is engineering, not a vendor.**
  The NAS-hosted sovereign loop is more private but today more fragile (manual mounts, one
  restart deactivated a webhook). The tempting shortcut is to lean on a cloud-managed vendor
  for "free" uptime — but that re-introduces the lock-in the mission rejects
  (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`). The right answer is **make the sovereign,
  self-hosted stack itself dependable**: restart policies, committed mounts, declarative
  activation, health checks, daily backups, a real web server. That is the whole point of
  Darrell's frame — *better open-source ways*, so the family's daily experience never
  depends on either an un-monitored sovereign seam **or** a third party's free-tier whims.
- **The orchestrator being inert is a feature, not a failure** — but it means we cannot
  yet lean on autonomous self-healing. Dependability in the near term is *boring*: health
  checks, declarative deploy, staleness badges. That's fine; boring is dependable.
- **"Built" has outrun "running."** The single most important mindset shift this review
  argues for: a thing is not done when the code merges — it is done when it is *running and
  observed.* Most of this stack's pain is the gap between those two.
- **What I did not verify:** the *current* live activation state of every NAS workflow
  (only wf18/14b/15/16/20 were verified live in the wf18 root-cause); whether anyone is
  presently subscribed to the `poetech-health` ntfy topic (inferred from "no alert
  reached Darrell," not directly confirmed); and exact Supabase Free-plan limits for this
  project (general plan limits, not a dashboard read). These are flagged, not asserted.

---

*Verification posture (DR-0076): every component claim cites a real file/config or the
verified wf18 root-cause. Where a claim is inferred rather than directly observed, it is
marked. This document changes no production code; it is the map for the remediation the
sequence in §4 proposes.*
