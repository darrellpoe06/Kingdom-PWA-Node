# Situational Analysis + Auto-Mutation Workflow — design

> **Workflow:** `docs/00-foundations/n8n-workflows/06-situational-analysis-and-mutation-cron.json`
> **Schema:** `infra/supabase/schema-v2.10-ai-workflow-state.sql`
> **Status:** v0 — ships as a DRY-RUN-by-default workflow. First three runs
> produce "would-have-done" reports under `docs/00-foundations/ai-suggestions/dry-run/`
> for Darrell to review. He flips `workflow_settings.dry_run = false` when
> satisfied; live runs begin on the next 4-hour tick.
>
> **Sovereignty-First binding:** the workflow is sustainable by construction
> (bounded, auditable, disable-able). Every mutation is logged with a previous
> value so it can be reversed. The disable switch is a single SQL update. The
> health check pings ntfy after every run; missed pings flag in the daily
> report.

This is Darrell's vision restated in software:

> "What we've done, what we're doing, what needs to be done for sustainable
> outcomes."

The workflow turns that triple into a 4-hour heartbeat that ACTS (safe
mutations only) AND RECOMMENDS (human-gated suggestions). It absorbs
feedback from Darrell and Christina as a first-class input, classifies it,
routes the actions to the right surfaces, and reports back through the
existing daily-digest workflow.

## High-level shape

```
  Every 4 hours (cron, America/Chicago)
       │
       ▼
  [Pre-flight gates]  ←─ workflow_settings.enabled / dry_run / budget caps /
       │                  rate limits / time-since-last-run
       ▼
  ── Gate any → exit early (status=disabled | budget-exhausted | rate-limited)
       │
       ▼
  [LOOP 1 — Auto-mutation]  (SAFE state hygiene only)
       │   - recompute priority_score on open cycle_items
       │   - roll forward past-cycle items to deferred-next-cycle
       │   - mark stale / active on projects
       │   - append learnings to current report_run
       │   - create notification rows for assigned change_requests
       │   - tag projects with keywords (Qwen extraction)
       │   - write every mutation to audit_log with actor=
       │     'n8n-situational-analyzer-v0' and prev_value in from_value
       ▼
  [FEEDBACK INGESTION]  (NEW since 2026-05-26 evening)
       │   - SELECT feedback rows since last_run_at
       │   - classify with Qwen (bug | feature-request | process-improvement |
       │     priority-change | kudo | question | clinical-note)
       │   - route each by classification (see routing table below)
       │   - weight by domain authority (Christina > Darrell on TLC/family-care,
       │     Darrell > Christina on tech/finance/architecture)
       │   - log every action with link back to the feedback row
       ▼
  [LOOP 2 — Recommendation generation]  (HUMAN-GATED)
       │   - per project: done / doing / next-for-sustainability triple
       │   - per stale change_request (>48h): nudge text + recipient
       │   - per high-priority unowned cycle_item: suggested owner
       │   - per learning-flagged report_run: one concrete next-cycle adjustment
       │   - write markdown to docs/00-foundations/ai-suggestions/YYYY-MM-DD-HHmm.md
       │     (committed via GitHub API)
       │   - mirror each suggestion as a DRAFT change_request
       │     (disposition='more-info-needed') so it shows on the project board
       ▼
  [POST-RUN]
       │   - update workflow_state: last_run_at, runs_today, cost_cents_today
       │   - ntfy health ping
       │   - daily-report companion: this run's actions get summarized into
       │     the next report_run.summary.ai_actions section
       ▼
  exit (status=ok | dry-run-ok | partial)
```

## Loop 1 — Auto-mutation (SAFE actions only)

The list is the contract: the workflow may do ONLY these things autonomously.
Anything else is either a Loop 2 suggestion (human decides) or out of scope.

### 1.1 Recompute `priority_score`

For every cycle_item where `disposition` is NULL or `'pending'`, recompute:

```
  priority_score
    = priority_factors.urgency        * 0.6
    + priority_factors.dollar_friction * 10 * 0.4
    + priority_factors.deadline_pressure
```

`priority_factors` is the transparent jsonb that already lives on every
cycle_item. The math stays auditable. `user_priority_override` is NEVER
touched. If `priority_factors` is empty or malformed for an item, the
workflow logs a Loop 2 suggestion ("seed factors for item X") and leaves
the row alone.

### 1.2 Roll forward past-cycle items

`UPDATE cycle_items SET disposition='deferred-next-cycle'` where:
- the parent `review_cycles.cycle_end` is in the past,
- the parent `review_cycles.status` is in `('completed','skipped')`,
- the current disposition is NULL or `'pending'`,
- a successor `review_cycles` row exists for the same cadence with
  `cycle_start > now()` (otherwise we'd be deferring into nothing).

POE language preserved: never `'rejected'`, always `'deferred-next-cycle'`.

### 1.3 Mark projects stale / active

For each `projects` row:
- If `lifecycle.last_activity_at` (or `updated_at` as a fallback) is older
  than 7 days AND `status` is `'in-progress'`, set `status='stale'`.
- If any change in the last 24 hours, set `status='active'` (overrides stale).

Stale is a UI flag — the dashboard surfaces it; nothing else changes.

### 1.4 Append to current report_run learnings

For each project that had >= 5 status changes in the last 24 hours, append
to the active `report_runs.summary.learnings`:

```
"Project X had N status changes in 24h — consider whether it's over-scoped."
```

The active report_run is the latest one with `status='in-progress'` for
the daily-digest cadence (workflow 02).

### 1.5 Create notification rows for assigned change_requests

For each `change_requests` row with `assigned_to IS NOT NULL` and no
matching notification yet sent on `kind='change_request_assigned'`,
INSERT a row into `notifications` per the assignee's
`notification_preferences`. This is the wiring that makes Christina's
seeded preference actually fire (see
`schema-v2.9-smoke-findings.sql` for that seed).

### 1.6 Tag projects with auto-extracted keywords

For each `projects` row whose `tags` (jsonb array) is empty or older than
30 days, call Qwen with the project's `name + description` and ask for 3-5
keywords. Write them back to `tags`. Cost-bounded — see "Sustainability
guards" below.

### 1.7 Audit every mutation

For every mutation in 1.1 – 1.6, INSERT one row into `audit_log` with:
- `action`: one of `ai-mutation`, `ai-priority-recompute`, `ai-stale-mark`
  (per the v2.10 widened CHECK list)
- `actor`: `'n8n-situational-analyzer-v0'`
- `entity_type` / `entity_id`: the mutated row
- `from_value`: jsonb with the previous value (so a rollback workflow can
  reverse it later)
- `to_value`: jsonb with the new value
- `note`: short English summary
- `prev_hash` / `hash`: continue the v2.1 hash chain

### Forbidden — NEVER auto-mutate

- `user_priority_override`
- `change_requests.disposition` (humans approve change requests)
- TLC clinical content (counseling sessions, sensitive narratives — v2.3)
- `legal_matters` (v2.6 — encrypted; the server has no business decrypting)
- `confessions` (audience-scoped; same reason)
- Any DELETE
- Any write that obligates spending (`transactions`, `debts`, payments)
- Any change to a row owned by `external_users` (Pattern D — they own
  their own data, the system suggests, never mutates)

## Feedback ingestion (NEW 2026-05-26 evening)

Feedback is a **first-class input** to the situational analyzer. Every
4-hour run:

### 2.1 Pull new feedback

```sql
SELECT * FROM feedback
 WHERE submitted_at > (SELECT last_run_at FROM workflow_state
                        WHERE workflow_key='situational-analyzer-v0')
   AND triage_status IN ('new','needs-info');
```

### 2.2 Classify with Qwen 2.5 3B

For each row, classify into one of:

| Type | Definition |
|------|------------|
| `bug` | Something is broken or not behaving as documented |
| `feature-request` | New capability proposal |
| `process-improvement` | Suggestion about how the team works (not the software) |
| `priority-change` | Request to reorder open work |
| `kudo` | Celebration / thank-you / "this is working" |
| `question` | Looking for an answer, not a change |
| `clinical-note` | TLC instance only — domain content Christina recorded |

The classification prompt uses Qwen primary (fast); cost is roughly $0
because Qwen runs locally. The classification result is written back to
`feedback.triage_notes` as a structured prefix
(`[ai-classified: feature-request @ 2026-05-26 14:32]`).

### 2.3 Route by classification

| Classification | Action |
|---|---|
| `bug` | DRAFT a `change_request` with `disposition='more-info-needed'`, `risk_level='medium'`, `change_type='emergency'` if the project is family-critical else `'standard'`. Link via `linked_feedback_id`. |
| `feature-request` | INSERT a `cycle_items` row in the next cycle (lookup of the next-future `review_cycles` row), `kind='feature-request'`, `priority_factors` seeded from the requester's domain authority. |
| `process-improvement` | Append a string to the active `report_runs.summary.learnings` array, prefixed with `[feedback-derived from <user>]`. |
| `priority-change` | DRAFT a suggestion in Loop 2's markdown output. NEVER auto-applied to `user_priority_override`. |
| `kudo` | INSERT into `ai_kudos` (new in v2.10). The daily report picks it up and includes it in the celebrations section. |
| `question` | Route to assignee via `notifications`: Christina if it's TLC / family-care / counseling, Darrell otherwise. Heuristic uses Qwen ("which domain does this question touch?"). |
| `clinical-note` (TLC only) | Encrypted-at-rest per the v2.4 pattern. Never routed to external channels. The workflow ensures the row is tagged `is_confidential=true` and the encryption columns are populated; if they aren't (e.g. legacy data), it flags via Loop 2 but does NOT decrypt. |

### 2.4 POE attribution

EVERY downstream action logs the source feedback row via `audit_log.note`:

```
note = 'derived from feedback id=<uuid> (submitter=<display_name>) at <timestamp>'
```

So "why did the system mark this change_request more-info-needed?" gets
back "Christina's feedback at 3:42 PM said …" by joining
`change_requests.linked_feedback_id` → `feedback.id`.

### 2.5 Domain-authority weighting (Christina vs. Darrell)

When a `priority-change` classification suggests a recompute, the
`priority_factors.urgency` increment is weighted:

```
  weight =  1.5  if (submitter is Christina) AND (project tags contain
                    'tlc' OR 'family-care' OR 'counseling')
         |  1.5  if (submitter is Darrell)   AND (project tags contain
                    'tech' OR 'finance' OR 'architecture')
         |  1.0  otherwise
```

The weight is recorded in `priority_factors` as `domain_authority_weight`
so it shows in the audit trail — no magic.

### 2.6 Disposition vocabulary

Per POE binding, feedback dispositions are: `acted`, `deferred-next-cycle`,
or `more-info-needed`. NEVER `rejected` or `wontfix`. The schema (`feedback.triage_status`)
currently has `'declined'` in its CHECK list; the workflow does not set it.
A future schema migration can drop the `'declined'` choice — out of scope here.

### 2.7 Feedback Loop section in the daily report

Workflow 02 (daily-reports-cron) gains a "FEEDBACK LOOP — last 24h" section:

- N pieces received
- N classified, broken down by type
- N auto-acted (with audit_log references)
- N draft change_requests created (with project board links)
- N still pending classification
- A `feedback_unaddressed` count that becomes a Pushover-prioritized line
  if it has been > 3 days

This is the dogfood-loop made visible: feedback in → action out → reflected
in daily report → Darrell and Christina see the system listening.

## Loop 2 — Recommendation generation (HUMAN-GATED)

After Loop 1 + feedback ingestion finish, the analyzer generates the
human-gated suggestions. Output lands in two places:

1. A markdown file at `docs/00-foundations/ai-suggestions/YYYY-MM-DD-HHmm.md`
   committed via the GitHub Contents API (commit author:
   `Dispatch <dispatch@poetech.local>`; commit message:
   `chore(ai): situational analysis YYYY-MM-DD HH:MM — N suggestions`).
2. A mirrored draft `change_request` per suggestion with
   `disposition='more-info-needed'` and body `"AI suggestion at [timestamp]
   — review and decide."`, so the suggestions appear on the project board
   (not just in a markdown file).

### 3.1 Per-project Done / Doing / Next-for-Sustainability

For every `projects` row with `status IN ('active','in-progress','stale')`:

```
  Done             = COUNT(cycle_items WHERE project_id=X AND disposition='approved')
                     Last 5 listed by approved-at desc.
  Doing            = cycle_items WHERE project_id=X AND disposition='pending'
                     ORDER BY priority_score DESC. Up to 3 listed.
  Next (sustain.)  = Anthropic API reasoning. Prompt:
                     "Given this project's name, description, last 14 days
                     of cycle_items, last 14 days of feedback, last 14 days
                     of audit_log: what one or two pieces of work are
                     missing-but-needed for the project to remain viable
                     long-term? Respect POE — invitation language, not
                     command. Do not invent work; only surface gaps that
                     the data already implies."
```

The Anthropic call is the only cost-bearing operation in the entire
workflow. Cost cap is enforced before each project's call (see
"Sustainability guards"). If the daily cap is reached, remaining projects
get a placeholder "next-for-sustainability deferred — daily budget cap
reached at $X".

### 3.2 Stale change_request nudge

For every `change_requests` row with `created_at < now() - interval '48 hours'`
and no status change in 48h, suggest a Pushover nudge:

```
text = "[recipient name], change_request '<title>' has been waiting on
        you since [timestamp]. Your call — ready, deferred, or more info
        needed?"
```

The suggestion goes to the markdown + the draft change_request, NEVER auto-sent.

### 3.3 Unowned high-priority item — owner suggestion

For every `cycle_items` row with `assigned_to IS NULL` and
`COALESCE(user_priority_override, priority_score) > 7`, look at the
project's `instance_members` and recent `audit_log` activity. Suggest
the member who's touched the most related work in the last 14 days.

### 3.4 Learning-flagged report adjustment

For every learning string appended in Loop 1.4 or feedback-derived
process-improvement entries, suggest ONE concrete adjustment for the next
review cycle (e.g. "add a 'scope check' agenda item to the next cycle
because three projects flagged over-scoping").

## Sustainability guards

These are the constraints that keep the workflow from getting expensive,
chatty, or stuck. All are configurable via `workflow_settings`.

### 4.1 Daily budget cap

`workflow_settings.daily_budget_cents` (default $5.00, i.e. 500).
Tracked in `workflow_state.cost_cents_today`. Reset when `current_day_utc`
changes between runs. If a run hits the cap mid-execution, finish the
current item then exit with `status='budget-exhausted'`.

### 4.2 Per-run budget cap

`workflow_settings.per_run_budget_cents` (default $0.50, i.e. 50). Tracked
in a local counter; never exceeds the daily cap.

### 4.3 Rate limit

`max_runs_per_day` (default 6) AND `min_minutes_between_runs` (default 240,
i.e. 4 hours). Enforced at pre-flight; over-limit → exit with
`status='rate-limited'`.

### 4.4 Easy disable

`workflow_settings.enabled = false`. The workflow exits at pre-flight on
the next trigger with `status='disabled'`. Darrell can flip it from his
phone via the SQL editor:

```sql
UPDATE workflow_settings
   SET enabled = false
 WHERE workflow_key = 'situational-analyzer-v0';
```

A future UI toggle (Project Board → "AI helper" gear icon) flips the
same row.

### 4.5 Audit visibility

Every mutation is in `audit_log` with `actor='n8n-situational-analyzer-v0'`.
The daily-report workflow gains a "what the AI did" section that pulls:

```sql
SELECT action, entity_type, entity_id, note
  FROM audit_log
 WHERE actor = 'n8n-situational-analyzer-v0'
   AND at > now() - interval '24 hours'
 ORDER BY at DESC;
```

So Darrell sees the trail. Nothing is silent.

### 4.6 Rollback path

Every mutation logs `from_value` AND `to_value`. A future rollback
workflow can read the last N audit_log rows for an `actor` and reverse
them by writing the `from_value` back. Window is configurable (default
24h). This is intentionally a separate workflow — out of scope for this
batch — but the schema already supports it.

### 4.7 Health check

After every successful run, the workflow POSTs to `ntfy.sh/family-ops`:

```
"situational-analyzer alive at <ts> · runs_today=N · status=<status>"
```

`workflow_state.last_ntfy_ping_at` is updated. The daily-report workflow
flags the workflow as unhealthy if `last_ntfy_ping_at` is > 8 hours old.

## Dry-run gate (first-run validation)

Darrell asked specifically about "off to a good start." The first three
runs are DRY runs by design:

- `workflow_settings.dry_run = true` (seeded on schema apply).
- Loop 1 mutations are SKIPPED. Instead each "would-have-mutated"
  decision is written to `docs/00-foundations/ai-suggestions/dry-run/YYYY-MM-DD-HHmm.md`
  with the proposed `from_value → to_value`. Darrell can compare to the
  current state and decide if the math is right.
- Loop 2 markdown still lands (it's already human-gated; nothing changes).
- Draft change_requests are NOT created during dry-run; they're listed in
  the dry-run report instead.
- The audit_log row is written with `note` prefixed `[DRY-RUN]` so the
  daily report can label them.

After three runs of comfortable review:

```sql
UPDATE workflow_settings
   SET dry_run = false
 WHERE workflow_key = 'situational-analyzer-v0';
```

The next 4-hour tick is live.

## What's still v0 — explicitly named limits

- The Anthropic call in Loop 2.1 (per-project next-for-sustainability) is
  the only cost. Everything else is local Ollama or pure SQL. If the budget
  is exhausted, Loop 2 falls back to a heuristic (look at recent activity
  patterns) and notes the fallback in the markdown.
- The classification in Feedback Ingestion uses Qwen 2.5 3B for cost
  reasons. False positives are caught by the dry-run gate; once live, by
  the audit_log review.
- There's no automated rollback workflow yet. Manual rollback is one
  UPDATE per audit_log row using its `from_value`. A scripted rollback
  is a follow-up project.
- The Funnel-vs-Cloudflare-Tunnel question for Supabase webhooks (see
  `SUPABASE-WEBHOOK-WIRING.md`) doesn't affect this workflow — it's a cron,
  not a webhook.

## Cross-references

- `docs/00-foundations/SOVEREIGNTY-FIRST-INSTALL-PATTERN.md` — autonomy
  gates before convenience; this workflow respects every gate before going
  live
- `docs/00-foundations/SEED-PROJECTS-2026-05-25.md` — the seeded projects
  this workflow analyzes
- `docs/00-foundations/n8n-workflows/README.md` — workflow inventory; this
  becomes workflow 06
- `infra/supabase/schema-v2.10-ai-workflow-state.sql` — the state +
  settings tables
- `docs/00-foundations/n8n-workflows/06-situational-analysis-and-mutation-cron.json`
  — the workflow definition
- `docs/00-foundations/ai-suggestions/README.md` — what lands in that
  folder and how to act on it
- `docs/00-foundations/01-grace-and-mercy-standard.md` — the invitation
  language POE binding this workflow honors

## Revision history

- 2026-05-26 — Initial design (Dispatch overnight). Dry-run gate from the
  start. Feedback ingestion as a first-class input (sharpened by Darrell
  later the same evening).
