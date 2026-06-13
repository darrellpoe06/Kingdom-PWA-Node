# Rigorous Review — code, data flows, workflows: scalability, open loops, dead ends

**Date:** 2026-06-13 · Layer 4 findings record. Three parallel reviews (data/sync,
n8n workflows, app correctness), validated against **current `main`** (commit at
review time `7a3b6a6`). Definitions used: **open loop** = repeats with no
guaranteed terminal condition; **dead end** = a flow that starts but whose output
is never consumed (UI→nothing, write→no reader, error swallowed).

## 0. Process note (a real finding about review hygiene)

The review agents first ran against a **stale working tree** (`afb1a02`, missing
tonight's 22 merges) and reported files as "missing" that exist on main. Several
of their HIGH findings were **already fixed tonight** and are NOT current issues:
the `instance_id` filter on every read (PR #27), the realtime wholesale-replace
clobber → `unionPreservingLocal` (PR #26), and the swallowed `QuotaExceededError`
→ visible `persistIssue` banner (PR #26). **Lesson: review against current
`origin/main`, not a session-start clone** — the codebase moves faster than a
review runs. Everything below is validated against current main.

## 1. Fixed this session

- **remoteUuid backfill on add** (PR #58) — `addAccount/addTransaction/addInquiry`
  discarded `upload()`'s `remoteId`, so edits/deletes to a freshly-added row
  silently no-op in the cloud until a realtime refetch. Now stamped immediately
  (the proven incidents pattern). [was the headline DEAD END both reviewers hit]

## 2. App + data layer — real on current main (queued)

| # | Sev | Class | Finding | Fix |
|---|---|---|---|---|
| A1 | HIGH | dead end | `addProject`/`updateProject` never push to cloud (no `projectsSync.upload`/`updateRow`); debts + entities also lack add-push reducers. Projects only sync at next sign-in. **Blocked on:** `projects-sync.js` `toRow`/`fromRow` don't map `lifecycle`, so naive push → realtime replace would strip lifecycle. Needs a `lifecycle` jsonb column + mapping FIRST, then enable push. | schema + mapping, then push |
| A2 | HIGH | error/dead end | `Inbound.jsx markHandled` doesn't check `res.ok` and `submitConvert` creates the local record regardless — a failed PATCH can double-convert a voicemail or resurface a "discarded" one, silently. | check `res.ok`, `await markHandled` before convert, surface via existing `error` state |
| A3 | MED | open loop | numeric-sync effect deps `[authSession, data.numericSyncVerifiedAt]`; `authSession` is a fresh object on each hourly `TOKEN_REFRESHED`, so a full re-`initialSync` + re-subscribe storm fires ~hourly per device. | gate on `authSession?.user?.id` (stable primitive) |
| A4 | MED | open loop | realtime own-writes self-trigger a full-table refetch (no `user_id`/origin filter like feedback-sync has; no debounce). Bounded thrash, N× with N devices. | add origin filter and/or debounce the refetch |
| A5 | MED | resilience | `table-sync.subscribe()` has no `.subscribe(status)` handler — a dropped websocket silently stops all cross-device updates, no reconnect/backoff. | status callback + re-`fetchAll` on reconnect |
| A6 | MED | scalability | `fetchAll` is `SELECT *` unpaginated; no `(instance_id, created_at)` index on the high-volume tables (transactions). Tolerable at family scale, doesn't degrade gracefully. | add indexes + paginate/recency-window |
| A7 | MED | scalability | append-only tables (`transactions`, `feedback`, `audit_log`, `interactions`, `user_telemetry`) have no retention; `confessions`/`disclaimers` even declare `expires_at` with nothing enforcing it. Unbounded growth + full refetch. | pg_cron retention honoring `expires_at` |
| A8 | LOW | latent crash | `Rentals.jsx` accesses `r.mortgage.rate/.balance` without `?.` in several spots (1103, 1824, 1834-35, 1902) — a mortgage-less rental crashes the tab. Latent (rentals always have a mortgage today). | `r.mortgage?.x ?? 0` |
| A9 | LOW | fail-open | `synology-chat.postToChat` returns `{posted:true}` even on a no-cors opaque rejection; `feedback-sync` swallows upload failure with no surface. Best-effort channels, low consequence. | note only |

**Verified clean (reviewer-confirmed):** hooks ordering (no rules-of-hooks
violations; the Imported.jsx guard is correctly placed); all `setInterval`/
`setTimeout` are cleared in cleanup (no leaked timers); the security host-gates
(`isPublicHost`, the P14 importedAllowed gate, `n8nAuthHeaders`) all **fail
closed**; the n8n fetch handlers (feedback/upload/skill/match) all check `r.ok`
and surface errors; the calc engines + lib mappers are clean.

## 3. n8n workflow layer — real, but gated by "everything is inactive"

**Critical context:** only `99-error-workflow-global.json` is `active: true`;
all other 38 are `active: false`. So these are **"wrong if/when activated"**
gates, not live bugs — which is exactly why BUILD-ROADMAP **R8/R13 hold the 16
timer workflows on HOLD.** The foundation docs already know.

| # | Sev | Class | Finding | Fix |
|---|---|---|---|---|
| W1 | BLOCKER-before-activation | brakes | The 16 cron workflows have **zero of the three brakes** (no `executionTimeout`, no `$getWorkflowStaticData` lock/kill-switch). Includes wf27 (Foundation Agent, 5-min, Ollama `keep_alive:30m`, self-queues Claude work) and wf31 (reel, 288×/day) — the exact pair named in the 2026-06-06 runaway. Only wf06 (budget+rate+enabled) and the new bank-statement workflow have brakes. | port the bank-statement brakes pattern to all 16 before any activate |
| W2 | HIGH | dead end | `settings.errorWorkflow` is set on **zero** workflows, so the only active one (wf99 global error handler) is **orphaned** — every failure is silent, defeating its purpose (the exact "wf27 silently drops data" failure the health doc was written for). | set `settings.errorWorkflow=wf99` on all; add a wf36 gate that fails any workflow lacking it |
| W3 | HIGH | security/scale | **No webhook uses n8n `headerAuth`** — only wf18 does a code-level bearer check. ~22 open webhooks (incl. wf19 which WRITES state, wf23/dispatch which serve family-private data) rely on Tailscale obscurity. Committed `docker-compose.yml` has no rate-limit proxy and no `WEBHOOK_AUTH_TOKEN`. The R15 photo workflows got this right (all `headerAuth`) — back-apply the pattern. | bind `headerAuth` on every webhook + add a Caddy/nginx rate-limit sidecar |
| W4 | HIGH | data-loss risk | All `/data/*` bind mounts are added **imperatively (one script per mount)**, absent from the committed compose — a workflow whose mount script wasn't run writes to the container's ephemeral layer and loses data on recreate (the original wf27 incident). | declare ALL `/data/*` mounts in committed compose; retire per-mount scripts |
| W5 | MED | open loop/scale | append-only stores grow forever with no rotation: `_reel.jsonl`, the family-feedback dir (file per submission), error telemetry, the ai-suggestions dir (a file every 4h). Reader caps display at 50; writer never truncates. | rotation/retention sweep; codify a 14th PERPETUAL-PIPELINE-HEALTH rule |
| W6 | MED | dead end | app references `/webhook/twilio` but no twilio workflow exists in the repo (consumer without producer — unmanaged, or stale reference). | commit the workflow JSON with lifecycle state, or remove the reference |
| W7 | MED | scalability | pervasive hardcoded Poe values (family roster, ntfy topics, repo slug, Synology IP, photo paths) block per-family reuse — the explicit R13 / WORKFLOW-MODULE-LIBRARY tier-2 work, not a single-deployment blocker. | lift to env / per-family config |

**Clean:** the R15 photo workflows (`wf-photo-upload`, `wf-family-photos`,
`wf-property-photos`, `wf-property-history`, `wf-link-title`) — no loops, no dead
ends, `headerAuth`, ship inactive with lifecycle markers, read-side consumed by
`nas-photos.js`, strong write-path defense (magic-byte/size/traversal/SSRF
guards). The bank-statement workflow is the only one with all three brakes — the
reference template for W1.

## 4. Verdict — "rigorously scalable, no open loops or dead ends"?

**Honest answer: SAFE today, but NOT yet rigorously scalable, and there are real
dead ends to close.**

- **Open loops:** *no ACTIVE open loops.* App intervals are all cleanly torn
  down; the realtime self-refetch is bounded thrash, not infinite; the
  timer-workflow loops are all `active:false`. The latent ones are A3 (hourly
  re-sync), A4 (refetch thrash), and the 16 brakeless crons (W1) — none can
  run away in the current off state, but each must be closed before activation.
- **Dead ends:** *real ones exist* — projects/debts/entities write-back (A1),
  Inbound double-convert (A2), the orphaned wf99 (W2), and the `/webhook/twilio`
  consumer-without-producer (W6). A1/A2 are app-level; W2/W6 are workflow-level.
- **Scalability:** *not yet rigorous.* Multi-instance scoping is now correct
  (fixed tonight), but pagination + indexes + retention (A6/A7) and per-family
  workflow parameterization (W7) are outstanding. Family-scale today is fine;
  community/multi-family scale needs this punch-list.

**Priority order to reach the bar:** A2 (active user-facing bug) → A1 (+ the
lifecycle column) → A3/A4/A5 (sync open-loop/resilience hardening) → W1/W2/W3/W4
(the activation gates, already held by R8/R13) → A6/A7 + W5/W7 (scale). None is a
crisis; all are well-defined. The single most important framing: **the workflow
layer is safe because it is off, and the foundation docs already gate turning it
on (R8/R13) behind exactly W1–W4.**
