# _quarantine — DO NOT APPLY

**Added 2026-06-08, post-incident.** The files in this directory are the "loaded gun"
artifacts from the **2026-06-06 autonomous-automation runaway** (full write-up:
[`../​_root/LESSONS-LEARNED.md`](../_root/LESSONS-LEARNED.md), 2026-06-06 entry; principles
P10 / P11 / P12). They were sitting uncommitted in the working tree, each one a `wget … | sudo sh`
away from re-activating the exact automation that ran away, looped, hung, and had to be shut
down by hand.

They are **moved here, not deleted** — this is a fully reversible relocation. Nothing was
removed; the files are intact and version-controlled at this path.

## The bright line

**Do NOT apply anything in this directory.** None of these may run until BOTH conditions hold:

1. **The Cage (PR #5 — sovereign AI orchestrator blueprint) is merged.** Its enforcement
   primitives (allowlist, append-only audit ledger, health-gate + 120s auto-rollback) are the
   substrate these need to run inside.
2. **Each artifact carries all three brakes** required by CLAUDE.md
   ("Autonomous Automation Requires Three Brakes") and RELEASE-TIERS.md (Tier C):
   - **a budget** — a token / turn / wall-clock ceiling per run;
   - **a concurrency lock** — single-instance; a new fire skips if a prior run is still going;
   - **a kill-switch** — a dead-man's-switch / auto-pause on overrun, missed heartbeat, or
     repeated failure (never auto-continue).

Until then, these are reference material for the rebuild, not deployable scripts.

## What's here and why each is dangerous as-is

| File | What it does | Why it is quarantined |
|------|--------------|-----------------------|
| `wf-autonomous-builder.json` | n8n workflow, ships `active: true`, 30-min `scheduleTrigger`; claims PRDs and triggers Cowork/Claude build sessions via `$COWORK_BUILD_WEBHOOK`. | Self-triggering automation that *starts more Claude work on a clock*. No budget, no lock, no kill-switch. This is the core re-arm risk. |
| `nas-update-wf-autonomous-builder.sh` | `wget … \| sudo sh` apply: edits `docker-compose.yml`, force-recreates n8n, **activates** the builder, restarts n8n. | One paste re-activates the builder live, unattended. |
| `nas-update-wf27-wf31-keepalive.sh` | Sets Ollama `keep_alive: '30m'` on wf27/wf31 and restarts n8n. | Pins a ~9 GB 14B model resident; on a GPU-less NAS that is sustained CPU + memory pressure under frequent cron triggers. |
| `42-batch-research-queue.json` | n8n workflow; 11pm cron submits an Anthropic Message Batches API call for the day's queue. | Auto-calls a paid API on a timer with no spend ceiling. |
| `nas-update-wf42-batch-research-queue.sh` | `wget … \| sudo sh` apply: bind mount, force-recreate, **activates** wf42, restarts n8n. | One paste re-activates the batch queue live. |
| `nas-update-wf27-evening-only-cron.sh` | `wget … \| sudo sh` apply for the wf27 evening-only cron. Already self-disabled (`exit 1`, marked SUPERSEDED — DO NOT RUN). | Quarantined 2026-06-08 for consistency with the bright line — it is a wf27 *cron* (timer) apply script. Defanged, but parked with the family rather than left loose in `scripts/`. |

## Not quarantined (intentionally left in place)

- **wf36 Quality Gatekeeper, wf99 global Error Workflow, the wf18 bearer guard** — these are
  *safety / defense-in-depth* surfaces, not autonomous compute loops. They stay in their normal
  locations.

  (Note: `nas-update-wf27-evening-only-cron.sh`, previously listed here as "left in place,"
  was moved INTO this quarantine on 2026-06-08 — it is a wf27 cron apply script, and parking it
  with the family is more consistent than leaving a timer script loose, even though it is already
  self-disabled. See the table above.)

## When the time comes

The rebuild path is: merge the Cage → re-author each workflow with the three brakes wired in
(budget + single-instance lock + kill-switch) → soak per Tier C (RELEASE-TIERS.md) → activate
only with a human watching. At that point the rebuilt versions land in their normal directories
and this quarantine directory shrinks to just this README and whatever has not yet been earned
back.

**Cross-refs:** `../_root/LESSONS-LEARNED.md` (2026-06-06), `../_root/RELEASE-TIERS.md` (Tier C),
`../_root/AUTONOMOUS-BUILDER-LIFECYCLE.md` (the original shipped-active design), `CLAUDE.md`
("Autonomous Automation Requires Three Brakes"), PR #5 (the Cage).
