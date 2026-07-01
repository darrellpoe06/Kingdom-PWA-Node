---
id: DR-0085
title: NAS-resident build loop — the always-on, app-independent heartbeat that drives the existing merge/deploy automation 24/7
date: 2026-07-01
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [THREE-BRAKES, CAGE, SOVEREIGN-FIRST, AI-FOUNDATION-INTERNAL-OPS, DETERMINISTIC-FIRST, NAS-AS-GOVERNANCE, VERIFICATION-DOCTRINE, DECISION-RECORDS]
source: 2026-07-01 — Darrell: "my nas must listen you don't … offline/overnight hours must be prime production time." The always-on NAS must BE the listener and the driver, independent of the desktop app and of Darrell being awake.
---

## Context

Build throughput tracked Darrell's **waking activity**. The diagnosis (his, and
correct): the merge → migrate → deploy chain fires only on events *he* generates
— pushes, PR events, Dispatch/desktop-app sessions. When the desktop app is
closed and Darrell is asleep or away, green PRs sit unmerged and nothing drives
the pipeline.

Verified live (2026-07-01): the automation itself is **already built and
proven** — `auto-merge.yml` enables GitHub native auto-merge (squash) on every
eligible PR; `db-migrate.yml` applies idempotent migrations from a
`SUPABASE_DB_URL` secret held in GitHub Actions; Vercel auto-deploys on push to
`main`. All 8 open eligible PRs already had auto-merge enabled. The **only gap**
is the *trigger*: `auto-merge.yml` has no clock — it fires on Darrell's activity.

## Decision

Stand up a **deterministic (no-LLM) loop resident on the always-on NAS**
(DS1621xs, `192.168.1.26`), fired by the NAS's own `systemd` timer every 15
minutes, 24/7 — **no desktop app, no login, no Darrell**. It is the **heartbeat
that drives the existing, proven, protection-respecting automation**, not a
second merge engine.

Each bounded, idempotent cycle: pass the three brakes or exit inert; best-effort
`git fetch` the sovereign mirror; list + classify open PRs with the *same*
eligibility filter `auto-merge.yml` uses (`feat|fix|merge|docs/*`, non-draft, not
`hold`); if any eligible PR lacks auto-merge → **dispatch `auto-merge.yml`**
(one dispatch enables all); call **update-branch** on up to N cleanly-*behind*
PRs (never DIRTY ones); write an append-only reel; release the lock.

**Scope is fixed in code and cannot self-widen.** The loop never merges
directly, never force-pushes, never creates/deletes branches, never applies
migrations itself (that stays in `db-migrate.yml`, whose DB key never leaves
Actions), never moves money, never messages minors, never touches RLS, never
handles the DB/Vercel keys. It reads one GitHub token (`repo` + `workflow`) from
`/volume1/PoeTech/secrets/github-token.txt` in place — never printed or copied.

### Two deliberate refinements of the literal directive (each *shrinks* blast radius)

1. **Migrations ride the existing `db-migrate.yml`, not a Supabase key on the
   NAS.** The DB credential already lives in GitHub Actions; applying from two
   places would be double-authority and double blast-radius. The NAS never holds
   the DB key — honoring "use the NAS-resident key in place only, never
   exfiltrate keys."
2. **Merging goes through dispatching the proven `auto-merge.yml`, not a second
   merger.** One merge policy, protection-respecting, no drift. The NAS is the
   sovereign *heartbeat*; GitHub remains the single merge authority.

Both were surfaced before building (premise-conflict rule); both are the safer
design.

## The three brakes (this class is Tier C — CLAUDE.md "Three Brakes")

- **Budget** — per-day caps on the only two write actions
  (`MAX_DISPATCHES_PER_DAY=48`, `MAX_UPDATES_PER_DAY=20`), a per-cycle wall-clock
  deadline, and `TimeoutStartSec=300` as the hard systemd backstop.
- **Lock** — atomic `mkdir` single-flight; a fire that finds it held skips;
  stale locks (> 30 min) broken once, logged.
- **Kill-switch** — the `STOP` file forces immediate inert exit; **and** the
  `ARMED` file must be present to act (ships inert; armed once, attended).

## Verification (no fake green — DR-0076)

- `loop.py --selftest` — **12/12 PASS**: every brake provably catches (STOP,
  absent-ARMED, held-lock, exhausted-budget) and the eligibility filter matches
  `auto-merge.yml`.
- Inert gate — cycle with no `ARMED` exited `inert: not armed`, reeled it.
- Kill-switch — `STOP` present forced `inert: kill-switch engaged` while armed.
- Full real cycle — read token → `mirror: fetched` → listed 7–8 eligible PRs →
  classified (blocked/behind/dirty/clean) → 0 needed enable (all already
  enabled) → budget untouched → reel + `last-cycle.json` written.
- Heartbeat action — the NAS token dispatched `auto-merge.yml` (**HTTP 204**); a
  `workflow_dispatch` run appeared on GitHub, driven by the NAS with no desktop
  app involved.
- Timer — `systemctl` timer enabled and scheduled (fires every 15 min).

## Consequences

- Offline/overnight hours become production time for the deterministic
  merge/deploy lane; throughput decouples from Darrell's waking hours.
- The hourly desktop task `poetech-autonomous-build-driver` becomes the
  **fallback**, not the primary; the NAS loop is primary and app-independent.
- **Follow-ups** (perpetual improvement, DR-0075): (a) Dispatch Status can't yet
  show these runs — the n8n-owned briefing dir isn't dpoe-writable; needs a
  permission bridge (`re-review: 2026-07-15`). (b) The **local-LLM judgment
  lane** (item 2 — DIRTY/conflicting PRs, backlog advancement) is the next
  build: the church tower (`livestream-main-pc`, `100.72.5.90`, Claude Code +
  `qwen2.5-coder:14b`) is the intended runner; this loop already flags
  `dirty_prs` in its reel as that lane's inbox. Standing up the braked runner is
  its own three-brakes design, armed attended.
- Swap the bootstrap laptop token for a dedicated fine-grained PAT (repo-scoped)
  as the durable credential.

Artifacts: `infra/nas-build-loop/` (`loop.py`, `install.sh`, systemd units,
`README.md`). Refines `project-nas-deterministic-loop-runner`,
`project-sovereign-mesh-two-nas`, `project-on-church-network-runner`.
