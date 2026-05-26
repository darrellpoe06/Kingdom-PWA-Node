# n8n workflows — git-tracked JSON

Per the Stack B lock-in ratified 2026-05-25 (`docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md`): n8n workflow definitions live here as JSON files, committed to the repo. n8n itself runs on the DS1621xs per `infra/n8n/`.

## Why workflows are version-controlled

- A future Dispatch session (or Darrell on a new install) can re-import the entire workflow set by uploading each JSON.
- Git diffs surface workflow changes for review — even visual workflow tools need code review.
- PR notes describe in English what changed (the JSON diff is often illegible on its own).

## Naming convention

```
<NN>-<short-description>.json
```

Two-digit prefix preserves install order; rename freely as the set grows.

## Export from n8n

1. Open the workflow in n8n.
2. Menu (top-right `⋯`) → Download.
3. Save to this folder with the naming convention above.
4. Commit: `git add docs/00-foundations/n8n-workflows/NN-name.json && git commit -m "feat(workflows): NN-name — <one-line purpose>"`.

## Import on a fresh n8n

1. n8n editor → Workflows → Import from File.
2. Pick the JSON.
3. Re-bind credentials (credentials are NOT exported with workflows for security — re-add Pushover, ntfy, Postgres, etc. from Settings → Credentials).
4. Activate the workflow.

## English summary of every workflow

Each PR that adds or modifies a workflow MUST update this README's "Active workflows" list below with a one-line English purpose, the trigger, and the outputs.

## Active workflows (Stack B install · 2026-05-26)

| # | File | Trigger | Outputs | POE-bound? |
|---|------|---------|---------|------------|
| 01 | `01-supabase-cycle-item-webhook.json` | Supabase webhook on `cycle_items.insert` | Pushover (if assigned to Darrell) or ntfy `family-ops` topic | Yes |
| 02 | `02-daily-reports-cron.json` | Cron, 6:00 AM America/Chicago | Pushover digest of yesterday's `report_runs` + cycle_item dispositions | Yes |
| 03 | `03-github-event-to-phone.json` | GitHub webhook (`push` / `pull_request` / `ping`) | Pushover with the commit/PR summary | No (infra) |
| 04 | `04-poe-morning-standup.json` | Cron, 7:00 AM America/Chicago | Single Pushover with up to 5 high-priority `change_requests` where `user_priority_override IS NULL` | Yes |
| 05 | `05-end-of-day-reflection.json` | Cron, 9:00 PM America/Chicago | Pushover prompt + inserts a `cycle_items` row tagged `kind=reflection` for the next morning's report | Yes |

## POE binding (read this before editing any workflow)

Per the seed-projects commit (`3ba0d9b`, 2026-05-25) and the `01-grace-and-mercy-standard.md` foundation:

- Dispositions stay `pending` / `approved` / `deferred-next-cycle` — **never** `rejected`.
- `priority_score` is the system's math (visible in `priority_factors` jsonb). `user_priority_override` is Darrell's last word and always wins.
- Notification copy: invitations, not commands. "Ready for your prayer" / "Waiting on your word" / "Your call, not the system's." Never "URGENT" / "BLOCKED" / "OVERDUE".
- If a workflow needs new schema vocabulary, add it to `docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md` first, then ship.

## Credentials required (set up in n8n Settings → Credentials)

- **Pushover** — user key + app token (workflows 01, 02, 03, 04, 05)
- **Postgres** — Supabase project `mjjlevhdufpaplypnqrv` (workflows 02, 04, 05). Use the dedicated `n8n_runner` role per `infra/n8n/INSTALL.md §Step 7`.
- **ntfy** — none (HTTP-only, no credential object; auth via path topic + per-user grants on the ntfy server)
- **Ollama** — none (HTTP-only against the local container; reach it at `$env.OLLAMA_BASE_URL` from any n8n node)

## Ollama dual-model architecture (decision 2026-05-26)

Two models in parallel, both local, both $0/mo perpetual. Workflows that call the LLM **must** read the model tag from env vars — never hardcode. Swapping a model = `.env` edit + `docker compose up -d`, zero workflow JSON edits.

| Env var | Default value | When to use |
|---------|---------------|-------------|
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Always — every n8n HTTP Request node hitting Ollama uses this as the base URL |
| `OLLAMA_PRIMARY_MODEL` | `qwen2.5:3b-instruct-q4_K_M` | Fast/general: summary, classification, short-context routing, latency-sensitive copy |
| `OLLAMA_SECONDARY_MODEL` | `deepseek-r1:8b-llama-distill-q4_K_M` | Reasoning: chain-of-thought on `change_requests`, trade-off weighing, multi-step Scripture-grounded depth |

Pattern for an n8n HTTP Request node calling Ollama:

```
URL:    ={{ $env.OLLAMA_BASE_URL }}/api/generate
Method: POST
Body:   {
  "model": "{{ $env.OLLAMA_PRIMARY_MODEL }}",      // or OLLAMA_SECONDARY_MODEL
  "prompt": "...",
  "stream": false
}
```

**Status as of 2026-05-26:** none of the five workflows shipped in this batch (01–05) currently call Ollama — they're notification/cron/webhook plumbing. The dual-model scaffolding is in place so the *next* workflow (POE change-request reasoner, Scripture companion, summary-augmented reports, etc.) can use it without re-litigation. When a workflow does call Ollama, update the "Active workflows" table above to mark **which model** it uses, and add a `Calls LLM?` column if more than one does.

**DeepSeek-R1 chain-of-thought note:** the secondary model emits visible reasoning between `<think>...</think>` tags. Workflows that surface output to the user (notifications, app inserts) should strip the `<think>` block before delivery — a small n8n Code node with `text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()` handles it.

## Cron schedule summary (America/Chicago)

```
  hour
  06:00   workflow 02   Daily reports digest
  07:00   workflow 04   POE morning standup
  21:00   workflow 05   End-of-day reflection
```

Webhooks (01 + 03) fire on demand.

## How these tie back to the seeded projects

The "Synology n8n rollout" project (one of the 8 seeded on 2026-05-25, see `docs/00-foundations/SEED-PROJECTS-2026-05-25.md`) is dogfood for this stack: every cycle_item, change_request, and reflection that flows through these workflows IS the system tracking its own deployment. When workflow 05 inserts a reflection on install day, workflow 02 picks it up at 6 AM the next morning — that's the first end-to-end loop.
