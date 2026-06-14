# n8n Workflow Runaway-Risk Classification

**Date:** 2026-06-10
**Mode:** READ-ONLY audit. No workflow was changed, enabled, committed, or applied; no NAS access.
**Source:** all workflow definitions in `docs/00-foundations/n8n-workflows/*.json` (37 files; no `_quarantine/` dir exists).
**Purpose:** classify every workflow by runaway risk so we know which are safe to re-enable on the home NAS now vs which must wait for the Cage.

## Classification rule

- **SAFE-TO-ENABLE** — trigger-based and bounded: webhook, manual, or reactive (error) trigger; no `scheduleTrigger`/cron/interval; no self-re-queue or keep-alive loop; runs only when something calls it.
- **HOLD-FOR-CAGE** — carries a `scheduleTrigger`/cron/interval, keep-alive, continuous-poll, or autonomous-builder behavior, or any self-triggering loop. These self-fire on a timer with no budget / concurrency lock / kill-switch — the exact runaway shape `feedback_autonomous_automation_three_brakes` guards against.
- **UNCLEAR** — can't determine cleanly; flag for human review.

## Full table (37 workflows)

| # / name | Trigger | Class | One-line purpose |
|---|---|---|---|
| 01 - Supabase cycle_item -> Pushover + ntfy | webhook | SAFE | Push/ntfy alert when a Supabase cycle_item row is inserted |
| 03 - GitHub event -> Pushover | webhook | SAFE | Phone notification on commit/PR GitHub webhook |
| 08 - Synology Chat inbound capture | webhook | SAFE | Captures #PoeTech-PWA chat messages to `/data/chatin` |
| 10 - Synology Chat request + ack | webhook | SAFE | Captures a chat request and posts an ack reply |
| 11 - Vercel deploy -> Chat | webhook | SAFE | Posts Vercel deploy events to #PoeTech-PWA |
| 17 - Gemini deeper-reasoning helper | webhook | SAFE | On-request bulk reasoning via Gemini (TLC firewall enforced) |
| 18 - Imported transactions API | webhook | SAFE | Serves imported bank_balances data to the PWA |
| 19 - Mark-noise API | webhook | SAFE | PWA writes back reconcile/noise state |
| 23 - Project briefing | webhook | SAFE | Read-out endpoint Claude sessions fetch for context |
| 26 - Thought inbox | webhook | SAFE | Darrell -> n8n thought capture for next Claude session |
| 29 - Waitlist intake | webhook | SAFE | PWA waitlist signup -> file + ntfy on new signup |
| 30 - Family feedback intake | webhook | SAFE | PWA "Suggest" button -> feedback file + ntfy |
| 33 - Data upload Layer 1 | webhook | SAFE | Parses a drag-dropped OFX/QFX/CSV inline, no persist |
| 34 - Skill analytics Layer 2 | webhook | SAFE | On-request Ollama stewardship profile from parsed txns |
| 35 - Matched services Layer 3 | webhook | SAFE | On-request ranked service recommendations |
| 36 - Quality Gatekeeper | webhook | SAFE | Deploy-time policy gate; 4 ethical tests -> PASS/WARN/BLOCK |
| 37 - Whisper STT voice input | webhook | SAFE | Voice memo -> transcript -> routes to @nas inbox |
| wf-dispatch-status | webhook | SAFE | Serves dispatch-status JSON (reel/tasks) same-origin |
| wf-dispatch-status-page | webhook | SAFE | Serves the self-contained dispatch-status HTML page |
| 04 - Pushover Smoke Test | manualTrigger | SAFE | Manual one-shot push test |
| 02 - Workflow Failure Alert | errorTrigger | SAFE | Reactive - fires only when another workflow errors |
| 01 - Project Timeline Daily Digest | scheduleTrigger `0 7 * * *` | HOLD | Daily 7am project-timeline digest |
| 02 - Daily reports cron | scheduleTrigger 6 AM | HOLD | 6am daily reports |
| 03 - Backblaze B2 Backup Status | scheduleTrigger Mon 6am | HOLD | Weekly backup-status check |
| 04 - POE morning standup | scheduleTrigger 7 AM | HOLD | 7am standup |
| 05 - End-of-day reflection | scheduleTrigger 9 PM | HOLD | 9pm reflection |
| 06 - Situational analysis + auto-mutation | scheduleTrigger every 4h | HOLD | Auto-mutating analysis loop (self-modifying) |
| 09 - Chat digest 30min | scheduleTrigger every 30 min | HOLD | Summarizes chatin every 30 min |
| 12 - Network health probe | scheduleTrigger every 5 min | HOLD | 5-min network probe + failure alert |
| 13 - Chat action router | scheduleTrigger every 1 min | HOLD | 1-min poll routing captured requests to channels |
| 14 - Gmail finance ingest | scheduleTrigger every 10 min | HOLD | 10-min Gmail bank/billing pull |
| 15 - Bank OFX/QFX/CSV watcher | scheduleTrigger every 2 min | HOLD | 2-min bank-file watcher |
| 16 - Cross-verify engine | scheduleTrigger hourly | HOLD | Hourly Gmail<->bank reconciliation |
| 20 - Health-check + ntfy | scheduleTrigger every 10 min | HOLD | 10-min proactive ops health check |
| 27 - Foundation Agent (autonomous) | scheduleTrigger every 5 min + webhook | HOLD | Autonomous inbox processor: self-routes to Ollama/Claude, self-queues tasks |
| 31 - Continuous standup digest | scheduleTrigger every 5 min + webhook | HOLD | 5-min incremental family-voice sweep (the "reel") |
| 32 - Daily ship summary | scheduleTrigger 9pm + webhook | HOLD | 9pm "what shipped today" summary |

## Summary lists

**SAFE-TO-ENABLE now (21):** `01-supabase`, `03-github`, `08-synology-inbound`, `10-synology-ack`, `11-vercel-deploy`, `17-gemini`, `18-imported-tx`, `19-mark-noise`, `23-project-briefing`, `26-thought-inbox`, `29-waitlist`, `30-family-feedback`, `33-data-upload`, `34-skill-analytics`, `35-matched-services`, `36-quality-gatekeeper`, `37-whisper`, `wf-dispatch-status`, `wf-dispatch-status-page`, `04-pushover-smoke-test` (manual), `02-workflow-failure-alert` (error/reactive).

**HOLD-FOR-CAGE (16):** `01-project-timeline`, `02-daily-reports`, `03-b2-backup`, `04-poe-morning-standup`, `05-end-of-day`, `06-situational-auto-mutation`, `09-chat-digest`, `12-network-health`, `13-chat-action-router`, `14-gmail-finance`, `15-bank-ofx`, `16-cross-verify`, `20-health-check`, `27-foundation-agent`, `31-daily-standup-digest`, `32-daily-ship-summary`.

**UNCLEAR: none.** All 37 classified cleanly off their trigger nodes.

## Notes for human judgment (not reclassifications)

- **Three dual-trigger workflows (27, 31, 32)** each have *both* a cron `scheduleTrigger` and a webhook fire path. They're HOLD as-shipped because the cron auto-fires; if only the on-demand path were wanted, the webhook node alone would be SAFE - but that's a Cage-time edit, not a flip-active decision.
- **wf06 (situational analysis + auto-mutation)** and **wf27 (Foundation Agent)** are the two genuinely *autonomous* ones - wf06 self-mutates every 4h; wf27 self-routes to Ollama/Claude and self-queues tasks every 5 min ("runs whether or not Darrell is at the keyboard," tagged `sovereign-loop`). Treat these as last-to-leave-the-Cage even within the schedule group.
- **Three SAFE webhooks call an LLM per request** (`17-gemini`, `34-skill-analytics` -> Ollama, `35-matched-services`). Still SAFE by the runaway criterion (one bounded call per inbound request, no self-loop), but they incur model cost when hit - worth knowing before opening them.

## Pairs with

- `feedback_autonomous_automation_three_brakes` - no timer-driven/self-triggering automation ships active without budget + concurrency lock + kill-switch; Tier C never Tier A.
- `RELEASE-TIERS.md` - the schedule/autonomous set is Tier C by nature.
- `PERPETUAL-PIPELINE-HEALTH.md` - the resilience standard the Cage exists to enforce.
