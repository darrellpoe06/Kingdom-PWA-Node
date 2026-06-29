# Research-Review: WebSockets, Supabase Realtime, and the Sovereign Realtime Path

**Date:** 2026-06-24
**Author:** Claude (advisory; Darrell governs — GOVERNANCE-EXECUTION-ADVISORY)
**Type:** Layer 4 working artifact (research-first pattern, `feedback-research-first` / P7)
**Status:** Decision-support. No code changed by this doc. Reality-traced against the running repo (DR-0061 / P15).
**Question:** Where and how should PoeTech use WebSockets for real-time, full-duplex, shared-state — versus the Supabase Realtime it already uses, versus polling — and what is the SOVEREIGN self-hosted path?

---

## 0. TL;DR (the recommendation, up front)

1. **PoeTech already runs on WebSockets today** — every live surface uses **Supabase Realtime**, whose `postgres_changes` channels are Phoenix channels over a WebSocket. We are not choosing *whether* to use WebSockets; we already do. The real questions are (a) which surfaces need a *different* WebSocket shape than the one we have, and (b) whether the socket terminates on **Supabase cloud** or on **our own NAS**.

2. **Keep Supabase Realtime as the default** for durable, RLS-gated, low-frequency shared state (the "a row changed → everyone refetches" pattern). It is working, proven, tenant-scoped, and free at our scale. Do **not** rip it out.

3. **Reach for a raw sovereign WebSocket layer only where the data is _ephemeral, high-frequency, and full-duplex_** — things that should NOT become Postgres rows at all: live-mix console state, a reactions firehose, presenter cursor/co-edit deltas, the orchestrator's live loop. These are exactly the cases `postgres_changes` serves badly (every event is a DB write + a full refetch).

4. **The sovereign path is cheaper than it looks**, because the self-hosted **Supabase Realtime container already exists in this repo** (`infra/supabase/docker-compose.yml:104-127`, Kong routes `/realtime/v1/* -> ws://realtime:4000` at `infra/supabase/volumes/kong/kong.yml:98`). Migrating *Supabase-Realtime* off the cloud is a **config change** (point the client at the NAS), not a rewrite. A *raw* WS gateway + broker (Redis/NATS) is a genuinely new build, reserved for the ephemeral surfaces above.

5. **Staged plan:** (P0) keep cloud Realtime; (P1) stand up a single sovereign **raw-WS gateway on the NAS** for ONE ephemeral surface (live reactions) as the proving ground; (P2) move Supabase Realtime itself onto the already-scaffolded NAS container behind Tailscale; (P3) add the broker backplane only when a second WS node is needed (the 1000-signup capacity goal), never before.

---

## 1. Ground truth — the app's CURRENT realtime mechanism (verified, not remembered)

**Mechanism: Supabase Realtime, `postgres_changes` only.** One shared browser client (`app/src/lib/supabase.js:41`), no custom realtime config — defaults. Every live surface follows ONE pattern, which I'll call **"change-ping → scoped refetch"**:

```
supabase.channel(`${table}-stream`)
  .on('postgres_changes',
      { event: '*', schema: 'public', table, filter: `instance_id=eq.${tenantId}` },
      () => debouncedRefetch())     // <-- payload IGNORED; we refetch all scoped rows
  .subscribe(status => { if (reconnected) resync(); })
```

The canonical implementation is the generic factory in **`app/src/lib/table-sync.js:189-230`** (debounced 400ms coalescing at `:199`, reconnect-resync at `:219-222`, tenant filter at `:215`). Every other sync lib is a copy of this shape:

| Surface | File:line | Channel | Notes |
|---|---|---|---|
| Generic table sync (projects, etc.) | `table-sync.js:209` | `${table}-stream` | The reference implementation |
| Conference (rooms/sessions/participants) | `conference-sync.js:301` | `${table}-stream` | "every leader's + attendee's device updates live" (`:7`) |
| Conference variance (check-in) | `conference-variance.js:226` | `conference_actuals-stream` | realtime optional, try/catch |
| Conference public registration | `conference-register.js:199` | `conference_public_registrations-stream` | organizer live roll |
| Choir songbook | `choir-sync.js:324` | `${table}-stream` | "choir's devices update live" |
| Song workshop | `song-workshop-sync.js:182` | `${table}-stream` | shared rendition pool |
| Video wall | `video-wall-sync.js:166` | `${table}-stream` | scoped wall config |
| Engagement (trivia + chat thread) | `engagement-sync.js:168` | `messages-${thread}` | INSERT-only, `filter: thread=eq.X` |
| Feedback (→ concerns loop) | `feedback-sync.js:211` | `feedback-stream` | INSERT-only |
| Venue rental | `venue-rental.js` | — | realtime optional |
| Discussions / workspaces | `discussions-sync.js`, `workspaces-sync.js` | — | field-preserving merge on refetch |

**Three things are notably ABSENT (verified by grep across the whole repo):**

- **No Supabase `broadcast` channels** (ephemeral pub/sub that never hits the DB). Everything is durable Postgres rows.
- **No Supabase `presence` channels** (who's-online / live cursors). No Figma-style co-presence anywhere.
- **No raw `WebSocket` / `socket.io`** in app code. The only `new WebSocket` references in the tree are inside the self-hosted Supabase stack's own config.

**One adjacent mechanism that is NOT network realtime — `BroadcastChannel`:** the Presenter→Audience and Program→NDI flows sync over the browser-native `BroadcastChannel` API (`teach-present.js:11` `'poe-teach-v1'`; `ndi-output.js:38` `'poetech-program-v1'`; `AudienceWindow.jsx`, `TeachMode.jsx`, `venue-cast.js`). **This is same-origin, same-browser only — two windows on ONE machine.** It does not cross devices. This is the single most important gap for the Presenter/multi-screen story below.

**Sovereign scaffolding already present:** the self-hosted Supabase `realtime` container (Phoenix, `PORT 4000`, `supabase/realtime:latest`) is already declared at `infra/supabase/docker-compose.yml:104-127`, and Kong already proxies the realtime WebSocket at `infra/supabase/volumes/kong/kong.yml:98`. **The sovereign Supabase-Realtime path is half-built and idle.**

### What "Phoenix channels = WebSockets under the hood" actually means

Supabase Realtime is an Elixir/Phoenix service. A `.subscribe()` opens **one** WebSocket from the browser to Supabase; multiple `.channel()` subscriptions multiplex over that single socket. `postgres_changes` works by Realtime tailing the Postgres **WAL** (logical replication), checking each change against your RLS policies, and pushing matching rows to subscribed sockets. So our "change-ping" is: write → WAL → Realtime → RLS check → WS frame → our handler → **we throw away the frame and refetch**. That last step is a deliberate simplification (correctness over bandwidth) and is fine at family/church scale, but it is the tell that we're using a heavyweight durable channel for jobs some of which are lightweight and ephemeral.

---

## 2. The decision frame — three transport options

| Property | **Polling** | **Supabase Realtime** (`postgres_changes`) | **Raw WebSocket** (sovereign) |
|---|---|---|---|
| Direction | client-pull | server→client push (full-duplex socket, but we only consume) | true full-duplex |
| Latency | interval-bound (1–30 s) | ~sub-second | ~10–50 ms LAN, real-time |
| Durability | reads DB each poll | every event is a **DB write** + replicated | ephemeral by default (nothing persisted unless you choose) |
| Best for | rare changes, simple, no infra | durable shared state, RLS-gated, low-frequency | high-frequency ephemeral, co-edit deltas, console state |
| Cost shape | DB read load ∝ clients × frequency | Supabase quota (concurrent peers, messages/sec) | our CPU/RAM on the NAS; stateful |
| Sovereignty | wherever the DB is | **cloud today**, NAS-capable (scaffolded) | **fully ours** by construction |
| Ops burden | ~none | ~none (managed) / low (self-host container) | **real** — stateful, backplane, heartbeats, reconnect, auth |
| Already in repo? | trivial | **yes, everywhere** | no |

**The honest asymmetry:** Supabase Realtime is *more capable than we use it* (we ignore the payload, never broadcast, never use presence) **and** already paid-for and zero-ops. Raw WebSockets are *more sovereign and lower-latency* but are **the most infra we'd have to run ourselves** — stateful processes, a message broker to coordinate multiple instances, heartbeat/timeout handling, reconnection with auth replay, and frame masking per RFC 6455. You do not take that on for a surface that a Postgres row already serves well.

---

## 3. Per-surface recommendation

Each surface scored on: does the state need to be **durable** (a real row) or **ephemeral**? **Frequency** of updates? **Full-duplex** (clients drive each other) or fan-out (one source → many screens)? **Cross-device** or same-machine?

### 3.1 Presenter ↔ Video Wall / multi-screen sync
- **Today:** `BroadcastChannel` (`ndi-output.js`, `teach-present.js`) = **same-machine only**. Cross-device wall config goes through `video-wall-sync.js` (`postgres_changes`).
- **Shape:** one source (the operator) → many passive screens. Fan-out, not full-duplex. Cue changes are frequent during a service (every few seconds) but each cue is small and *ephemeral* — "show slide 12 now" should not become a Postgres row.
- **Recommendation:** **Raw sovereign WS (church-LAN), Phase 2.** This is the strongest raw-WS candidate: it is LAN-local (latency matters for "advance on beat"), ephemeral (cue state, not records), and the church already runs sovereign LAN infra for NDI (`ndi-output.js:29`). A tiny NAS WS hub broadcasting cue frames to every screen is the right shape, and it generalizes the current same-machine `BroadcastChannel` to cross-device without inventing a new contract — the payload builders in `ndi-output.js:54+` are already serializable for exactly this.
- **Interim:** keep `BroadcastChannel` for the single-operator-machine case (works today); keep `video-wall-sync` (Realtime) for *durable* wall **configuration**. Only the live **cue stream** moves to raw WS.

### 3.2 Master Sunday program FINALIZER co-edit (Figma/Docs-style shared state)
- **Today:** order-of-service is durable rows synced via `table-sync`/`postgres_changes` (the master-program work, `project_order_of_service_master_program`). No live cursors, no presence.
- **Shape:** multi-writer shared document. Two modes:
  - **Coarse co-edit (who changed what block):** durable, low-frequency. `postgres_changes` is **already adequate** — last-write-wins per field with the field-preserving merge already implemented (`workspaces-sync.js:67`, `discussions-sync.js:81`). Keep Supabase Realtime.
  - **Live cursors / presence / character-level CRDT (true Figma feel):** ephemeral, high-frequency. This is where Supabase **`presence`/`broadcast`** (still cloud) OR a raw WS layer belongs.
- **Recommendation:** **Supabase Realtime now** (coarse, durable — ships with the master-program work). **Defer the Figma-grade live-cursor layer**; when it's wanted, do it with Supabase **`broadcast` channels first** (no new infra, ephemeral, already available on our client) and only graduate to raw sovereign WS + a CRDT (Yjs/Automerge) if presence-latency or sovereignty demands it. Document a `re-review:` when the finalizer gets real concurrent editors.

### 3.3 Live-mix AI assist (real-time QL console state + suggestions)
- **Today:** does not exist as a live loop (`sound-board-class.js` is training/spec content). GPU-gated roadmap.
- **Shape:** **the purest raw-WS case in the whole system.** Console fader/EQ state at 10–50 Hz, bidirectional (console → AI, AI suggestion → operator), ephemeral, latency-critical, LAN-local, and tied to the church RTX 4070 (`project_presenter_replaces_propresenter`). This must NOT touch Postgres.
- **Recommendation:** **Raw sovereign WS, on the NAS/GPU box, Phase 3+.** A `postgres_changes` per fader move would be absurd (a DB write per millisecond of mixing). This surface *defines* the sovereign-WS requirement — it cannot run on cloud Realtime for latency, cost, and sovereignty reasons simultaneously. Build it on the same NAS WS gateway proven in Phase 1, not on Supabase.

### 3.4 Live reactions (love/emoji → most-loved live), continuous feedback reel / Action Queue, conference rooms
- **Today:** "most-loved" and feedback are durable rows on `postgres_changes` (`feedback-sync.js:211`, the rendition-loves model). Conference rooms on `conference-sync.js:301`. The dispatch/feedback **reel** is a NAS-side append-only JSONL (`_reel.jsonl`, per CLAUDE.md Dispatch convention) read by polling, not a socket.
- **Shape, split:**
  - **The love/reaction _count_ and feedback _records_:** durable. Keep on Supabase Realtime — a ❤ is a real row, RLS matters, frequency is low. **No change.**
  - **The live reaction _burst_ (a stadium of ❤ floating up during a stream):** ephemeral, high-frequency, fan-out. This is the **ideal first raw-WS proving ground** — high enough volume to justify a socket, but zero-consequence if a frame drops (unlike a financial row).
  - **Conference rooms:** durable, low-frequency → **stay on Supabase Realtime.**
  - **Action Queue / reel:** today's JSONL-poll is fine for the dispatch fallback; if it moves in-app and needs sub-second push, it rides whichever sovereign WS hub Phase 1 stands up.
- **Recommendation:** **Reaction _records_ stay on Supabase Realtime; the live reaction _firehose_ is the Phase-1 raw-WS pilot.** Conference rooms unchanged.

### 3.5 Local-LLM orchestrator ↔ app real-time loop
- **Today:** the orchestrator writes NAS-side state (`_dispatch_state.json`, `_reel.jsonl`) that the Dispatch surface reads by fetch/poll. No socket.
- **Shape:** server↔app, bidirectional (app issues a request → orchestrator streams progress/tokens back), ephemeral streaming, latency-helpful, **must be sovereign by definition** (it's our own NAS process; routing its loop through Supabase cloud would be backwards).
- **Recommendation:** **Raw sovereign WS, on the NAS.** Token-streaming and live job progress are textbook WS (this is how the cloud LLM APIs stream). It must respect the **three brakes** (budget / single-flight lock / kill-switch — `feedback_autonomous_automation_three_brakes`) since it's autonomous compute on a clock. This is Phase 2–3, naturally co-located with 3.3.

### Per-surface summary

| Surface | Durable or ephemeral | Verdict | Phase |
|---|---|---|---|
| Presenter → multi-screen **cue stream** | ephemeral | **Raw sovereign WS (LAN)** | P2 |
| Wall **config** | durable | Keep Supabase Realtime | — |
| Program finalizer **co-edit (coarse)** | durable | Keep Supabase Realtime | now |
| Program finalizer **live cursors** | ephemeral | Supabase `broadcast` → raw WS if needed | defer |
| Live-mix AI assist | ephemeral, hi-freq | **Raw sovereign WS (NAS/GPU)** | P3+ |
| Reaction **records** / most-loved | durable | Keep Supabase Realtime | — |
| Reaction **firehose** | ephemeral | **Raw sovereign WS — Phase-1 pilot** | P1 |
| Feedback reel / Action Queue | mixed | JSONL-poll now → sovereign WS later | P2 |
| Conference rooms | durable | Keep Supabase Realtime | — |
| Orchestrator ↔ app loop | ephemeral, streaming | **Raw sovereign WS (NAS)** | P2 |

**The pattern:** durable + RLS-gated + low-frequency → **Supabase Realtime** (don't touch what works). Ephemeral + high-frequency + full-duplex + latency/sovereignty-sensitive → **raw sovereign WS**. Polling survives only for the JSONL dispatch fallback, where a file + fetch is genuinely the simplest correct thing.

---

## 4. The sovereign realtime topology (NAS-hosted WS gateway + backplane)

The key reason for this whole review: **run realtime on OUR infra, not Supabase cloud.** Two distinct sovereign moves, do not conflate them:

### Move A — Sovereign **Supabase Realtime** (the cheap win, mostly config)
The self-hosted Supabase stack already contains the Realtime container and the Kong WS route (`docker-compose.yml:104`, `kong.yml:98`). Migrating our *existing* `postgres_changes` surfaces off cloud = stand up that stack on the NAS, point `VITE_SUPABASE_URL` at the NAS (via the existing Tailscale Funnel / `poetech.tail5a2f35.ts.net`), done. **No app code changes** — the client API is identical. This inherits everything: RLS, WAL tailing, reconnect logic we already wrote (`table-sync.js:219`). Risk: we now operate Postgres + WAL replication + Realtime ourselves (backups, the `DB-home-primary` plan already anticipates this — `project_db_home_primary_church_nas_backup`).

### Move B — Sovereign **raw WS gateway** (the new build, for ephemeral surfaces)
A small, stateless-as-possible WebSocket service on the NAS:

```
                          ┌──────────────────────────────────────┐
   PWA / OBS / console     │  NAS  (Tailscale + LAN)              │
   ───── wss ────────────► │  ┌────────────┐    ┌──────────────┐ │
   (reactions, cues,       │  │  WS gateway│◄──►│  broker       │ │
    console state,         │  │  (Node/Bun │    │  Redis PubSub │ │
    orchestrator stream)   │  │   or Elixir│    │  or NATS      │ │
                           │  └─────┬──────┘    └──────┬────────┘ │
                           │        │ (durable spillover only)    │
                           │        ▼                  ▼          │
                           │   Postgres (records)   GPU box (LLM/mix) │
                           └──────────────────────────────────────┘
```

**Why a broker/backplane at all (the stateful-scaling problem):** a WebSocket is *stateful* — each client is pinned to the one process holding its socket. With a **single** WS process, no broker is needed (in-memory fan-out). The moment you run a **second** WS process (for the 1000-signup capacity goal, or for HA), a client on node A can't see a message published on node B. The broker (Redis Pub/Sub or NATS) is the **backplane** that fans every message to every node so all clients converge regardless of which node holds their socket. **Corollary: do NOT build the broker until there are two nodes.** Single-node first.

**The engineering checklist a sovereign WS layer owns (general WS knowledge, RFC 6455 — flagged as standard practice, not repo fact):**
- **C10K / concurrency:** one event-loop process (Node/Bun/Elixir) handles thousands of idle sockets; our scale (≤1000 signups, far fewer concurrent) is comfortably single-node. Elixir/Phoenix is the proven choice (it's literally what Supabase Realtime is) and would let us reuse the channel mental model; Node/Bun is lighter to operate. **Lean Bun/Node for the pilot, revisit Elixir if we self-host Supabase Realtime anyway.**
- **Heartbeats:** ping/pong every ~30 s; drop dead sockets (mobile sleeps silently break TCP).
- **Reconnection + auth:** client reconnects with backoff and **replays its Supabase JWT** on reconnect; the gateway validates the JWT (same `JWT_SECRET` as the Supabase stack) so identity/tenant is consistent with RLS. Never trust an unauthenticated socket with tenant data.
- **Masking (RFC 6455):** browser clients mask frames automatically; a compliant server library handles unmasking — only relevant if we hand-roll, which we won't (use `ws`/`Bun.serve`/Phoenix).
- **Tenant scoping:** every subscription is keyed by `instance_id` exactly like the Realtime filter (`table-sync.js:215`), so the no-leak guarantee (DR-0060) holds on the socket layer too.
- **Three brakes** on anything autonomous (orchestrator loop): budget, single-flight lock, kill-switch (`feedback_autonomous_automation_three_brakes`). A WS gateway streaming an LLM loop is exactly the runaway class from the 2026-06-06 incident.
- **Durable spillover:** ephemeral by default; when a reaction total or a finalized cue DOES need to persist, the gateway writes the *summary* to Postgres (not every frame). Best of both: socket speed, row durability where it counts.

**Access control = the network, primarily.** Per the sovereignty principle (AI-FOUNDATION-INTERNAL-OPERATIONS), NAS surfaces are Tailscale/LAN-reachable only; the church-LAN cue/mix sockets never face the public internet. Public-facing sockets (reaction firehose during a public stream) get JWT auth + rate-limit + the same `sanitize-input` discipline as our public forms (`project_public_form_security_hardening`).

---

## 5. Migration / staging plan (pragmatic, reversible, additive)

Nothing below removes Supabase Realtime until a sovereign replacement is *proven by use* (Verification Doctrine, DR-0076). Each phase ships independently and is reversible.

- **P0 — now (no work): keep cloud Supabase Realtime.** It works, it's free at our scale, it's tenant-safe. Do not migrate durable surfaces for sovereignty theater.

- **P1 — sovereign raw-WS pilot: the reaction firehose.** Stand up ONE single-node Bun/Node WS gateway on the NAS (Tailscale-only first). Wire the live-❤ burst to it. **No broker, no Postgres** — pure ephemeral fan-out. Goal: prove the gateway, JWT auth, heartbeat, reconnect, and the deploy/runbook on the lowest-stakes surface. Gate: it must demonstrably survive a dropped socket and a reconnect (proven-to-catch test, DR-0076 §3).

- **P2 — extend the proven gateway to LAN-local cross-device:** Presenter cue stream (generalize `BroadcastChannel` cross-device using the existing `ndi-output.js` serializable payloads) and the orchestrator↔app stream (with three brakes). Still single-node, still no broker.

- **P2.5 — sovereign Supabase Realtime (Move A):** bring up the already-scaffolded self-hosted Supabase (`docker-compose.yml`) on the NAS, point the client URL at it via Funnel, validate the existing `postgres_changes` surfaces against it. This is the big sovereignty win for the *durable* surfaces and is mostly ops, not code. Pairs with the DB-home-primary move.

- **P3 — broker/backplane ONLY when a second node is needed:** add Redis Pub/Sub or NATS the first time we run two WS processes (HA, or the 1000-signup concurrency ceiling forces it). Live-mix AI assist lands here (GPU box, raw WS, never cloud).

- **Re-review:** revisit P2.5/P3 sizing when concurrent live users exceed ~200 OR the Supabase free-tier Realtime quota is hit, whichever first. Until then, single-node + cloud-durable is correct. (`feedback_perpetual_improvement_default` — justified deferral, dated.)

---

## 6. Cost & cost-efficiency screen

- **Supabase Realtime (cloud, today):** free tier covers our concurrent-peer + message/sec needs at family/church scale; the "refetch on every ping" pattern spends a little **DB read** budget but near-zero realtime-message budget (we have few writers). **Cheapest possible thing that works.** The cost is *sovereignty* (cloud dependency), not dollars.
- **Polling:** cheapest infra, most wasteful at scale (reads ∝ clients × frequency). Justified only for the JSONL dispatch fallback. Do not expand it.
- **Raw sovereign WS:** **$0 marginal cloud cost** — it runs on hardware we already own (NAS, future GPU box). The cost is **operational** (a stateful service to keep alive, monitor, restart on boot — PERPETUAL-PIPELINE-HEALTH rules apply: health-check, auto-restart, bearer auth). This is real but bounded, and it's the *same* ops surface we already accept for Caddy/Funnel/n8n on the NAS.
- **Cost-efficiency verdict:** the sovereign-mesh tier is **more cost-efficient at scale** (no per-peer cloud metering) but **less cost-efficient at tiny scale** (you pay fixed ops cost for a service serving 5 people). The break-even is exactly the surfaces in §3 that cloud serves *badly* (the firehose, the mix loop) — there, sovereign WS is both cheaper AND better. For low-frequency durable state, cloud Realtime stays more cost-efficient until the DB itself comes home (P2.5). **Spend the ops budget only where the workload earns it.**

---

## 7. Honest trade-offs (the part that keeps us out of trouble)

- **Raw WebSockets are strictly more infra to run sovereignly.** Stateful processes, a backplane once you scale past one node, heartbeats, reconnection, auth replay, frame handling, monitoring, boot-restart. Supabase Realtime hands us all of that managed (or, self-hosted, in one already-written container). **Do not romanticize raw WS** — every surface that a Postgres row + `postgres_changes` already serves should STAY there.
- **Supabase Realtime is already WebSocket-based and already working** — choosing it is not "avoiding WebSockets," it's choosing a *managed, durable, RLS-integrated* WebSocket over a *hand-rolled ephemeral* one. The only thing it's missing for us is sovereignty, and that's recoverable via the scaffolded self-host (Move A) without an app rewrite.
- **Sovereignty of _location_ does not bound cost or blast radius** (the 2026-06-06 lesson). A NAS-hosted autonomous WS loop is still Tier C and still needs the three brakes. "It's on our box" is not a safety argument.
- **The pragmatic split is the whole answer:** keep Supabase Realtime where it's fine (durable, low-frequency, RLS-gated); add raw sovereign WS only where ephemeral/high-frequency/full-duplex/latency/sovereignty genuinely demand it (reactions firehose, presenter cues, live-mix, orchestrator loop); migrate Supabase Realtime itself onto the NAS as a config move when the DB comes home. Staged, additive, reversible, each phase proven by use before the next.

---

## 8. Ties to existing direction

- `project-nas-as-governance-point` / AI-FOUNDATION-INTERNAL-OPERATIONS — the WS gateway is exactly an "internal operations" surface; it belongs on the NAS, Tailscale-gated.
- Get-off-Vercel / self-host (`project_off_vercel_cloudflare_pages`, `project_sovereign_nas_pwa_deployment`) — Move A continues the same sovereignty arc to the realtime layer.
- 1000-signup capacity goal — drives the P3 broker decision (and *only* P3; single-node serves far more than 1000 *registered* when concurrency is modest).
- `project_db_home_primary_church_nas_backup` — Move A naturally co-lands with the DB coming home.
- Presenter / NDI / live-mix roadmap (`project_presenter_replaces_propresenter`, `project_ndi_program_output`, `project_colg_sanctuary_av_gpu_docs`) — the cue stream and live-mix loop are the concrete raw-WS surfaces.
- Three-brakes rule, RELEASE-TIERS (Tier C), Verification Doctrine — govern the sovereign build.

---

*Verification note (DR-0076): every "today" claim in §1 is cited to a verified `file:line` in this repo at this commit. Claims about RFC 6455, C10K, broker behavior, and Phoenix internals (§2, §4) are standard engineering knowledge, not repo facts, and are flagged as such. No code was changed by this document.*
