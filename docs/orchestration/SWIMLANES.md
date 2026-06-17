# Swimlanes — the standing orchestration engine

**Declared by Darrell, 2026-06-16 ("yes always" — this is the permanent operating
model, not a one-off).** Parallel work is good IF it is orderly and prioritized so
it doesn't collide. This file is the durable contract for how work is lane'd,
prioritized, partitioned, landed, and re-attached-to after a session goes offline.

State lives in **durable, non-ephemeral** places — **PR labels** (`lane:N-*`),
this file, the conflict-map, `ground.sh`, the master fix list, and the Events
spine — **never** inside a single Claude session's memory. A session is a worker
that attaches to the lanes; it is not where the state lives.

---

## 1. The lanes (priority-ordered — lower number lands first)

| Lane | Label | What's in it | Priority note |
|---|---|---|---|
| **1 — Conference** | `lane:1-conference` | The 77th National Assembly: EventCenter, venues, attendees, schedule, serving, the conference-setup surfaces. | **DROP-EVERYTHING.** The app is set up + managed in-app **weeks before** the July event, so "usable for conference setup" is **NOW**, not July. Everything else drains behind this. |
| **2 — Church** | `lane:2-church` | COLG / Body surfaces: The Word·Migdal, Choir, Pulpit, Learn/Teach, video wall, broadcast. | Serves the named first community. |
| **3 — Personal** | `lane:3-personal` | Family / personal surfaces: studies, thinking space, finances, rentals. | |
| **4 — Infra** | `lane:4-infra` | Auth/login, **serving (off-Vercel)**, orchestration cockpit, the merge/CI machinery, the DB lane. | Serving is conference-critical right now — see §6. |
| **5 — Research** | `lane:5-research` | Specs, research-reviews, decision records, evals. | Informs build; rarely blocks it. |
| **6 — Hardening** | `lane:6-hardening` | Cleanup, dead-code removal, test/gate additions, refactors. | Continuous; never blocks a feature lane. |

A PR with no `lane:*` label is **UNFILED** — file it (label it) before it lands.
New Dispatch asks **file into a lane** (open a PR + label it), they do not spawn
loose sessions.

## 2. Partition rule (how lanes run in parallel without colliding)

- **Disjoint files → parallel.** Work that touches different files runs concurrently **across all lanes** — many PRs land at once.
- **Shared-core files → serialize within reach.** Two branches that both edit a shared file (above all the monolith `app/src/poe-financial-mvp-v28.jsx`, or the migration sequence) land **one at a time**; the next rebases onto main after the prior merges. This is **mechanical ordering, NOT a hold and NOT a person gate.**
- **`scripts/orchestration/conflict-map.sh`** computes this every cycle: `PARALLEL-SAFE` vs `MUST-SERIALIZE`, the file overlaps, and the land order. `--gate` refuses 2+ shared-file branches in flight at once.
- **NEW SURFACE = NEW MODULE** (binding, 2026-06-16): build new surfaces as their own files (`components/Foo.jsx` + `lib/foo.js`), never as a new block in the monolith — so future work is disjoint = parallel-safe and the serialize lane shrinks. Decompose the monolith into modules AFTER the current monolith queue drains.

## 3. Land order

1. **Lane priority first** (conference → church → personal → infra → research → hardening), EXCEPT serving/infra items that are *conference-blocking* ride at the front with conference (see §6).
2. **Within a lane:** incident (`fix/`) > governance (`docs/`) > feature (`feat/`), then least-conflict / least-behind first.
3. **Parallel-safe items never wait** on the serialized lane — they land as soon as they're gates-green.

Everything lands **gates-green only** — the required CI suite (lint + vitest incl. RLS no-leak, no-lockout auth, contrast a11y; wf36 gatekeeper) is the safety floor. The ONLY thing that holds a change is an **unmet, named safety gate** (data-leak/RLS, lockout/auth, failing tests, broken a11y) — never a person. No fake greens; a gate ships only after it's proven to catch the break (DR-0076).

## 4. Re-attach-on-return (the canonical "Claude comes back after offline" step)

A returning or new session **RE-ATTACHES to the lanes from durable state** — it does not spawn blind. Run, in order:

1. `scripts/orchestration/ground.sh` — git HEAD + CI verdict + branches ahead of main (always-now truth, never memory).
2. `scripts/orchestration/lanes.sh` — the lane model + the re-attach checklist (this file in brief) + invokes the conflict map.
3. `scripts/orchestration/conflict-map.sh` — collision map + land order for the in-flight set.
4. `gh pr list --state open --json number,labels` (or the in-app **OpsBoard**) — which PR is in which lane (the labels are the source of truth).
5. The master fix list + the Events spine — outstanding work + outcomes.

Then pick up the **highest-priority lane with gates-green, unblocked work** and continue. The session attaches to the lane; the lane's state was never in the session.

## 5. Sovereign-resume bridge

This engine is built so the **local orchestrator** (when the LLM hardware lands) drives the lanes directly: it reads lane state (PR labels + Events + this file), picks the next lane/task by priority, and **wakes + instructs a vendor model** with the Charter + the specific lane/task per the orchestrator-as-boss design. **Until that hardware lands, the current orchestration + guardrail scripts (`ground.sh` / `lanes.sh` / `conflict-map.sh` / `auto-merge.yml` / `auto-open-pr.yml`) ARE the bridge** — same lane state, same priority order, driven by whichever session is attached.

## 6. Conference critical path (as of 2026-06-16)

The conference EventCenter + stack is **already on `main`** (merged #192). What's missing is **serving** — production deploys are blocked by Vercel's Hobby daily build cap, so merged conference code is **not reaching poetech.us**. The fix — **off-Vercel → Cloudflare Pages** — is **built, proven, and merged** (#210, gated by `vars.CF_PAGES_ENABLED`), with the `/n8n` proxy moved to a Pages Function (`app/functions/n8n/[[path]].js`, proven HTTP 200).

**The one remaining step is Darrell's DNS flip** (his bright-line credential action) — fully paste-ready in [`../99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md`](../99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md), with rollback (Vercel stays warm as the parachute). **Conference-usable = the moment that flip lands.** Until then, conference + serving sit at the front of the queue and everything else drains behind.

---

*Pairs with: `project_auto_merge_lane_and_hold_gate`, `project_new_surface_new_module`, the conflict-map/ground/lanes scripts, and the in-app OpsBoard (where lanes are surfaced, observable, no-fake).*
