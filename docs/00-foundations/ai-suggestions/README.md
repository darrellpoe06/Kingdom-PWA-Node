# `ai-suggestions/` — what lands here and how to act on it

Workflow 06 (`docs/00-foundations/n8n-workflows/06-situational-analysis-and-mutation-cron.json`)
runs every 4 hours. After it finishes Loop 1 (auto-mutation, safe state hygiene) and
the feedback-ingestion pass, it generates Loop 2 — human-gated recommendations.
That output lands in one of two places under this folder:

```
ai-suggestions/
├── README.md                     ← this file
├── dry-run/                      ← would-have-done reports (workflow_settings.dry_run = true)
│   └── YYYY-MM-DD-HHmm.md
└── YYYY-MM-DD-HHmm.md            ← live runs (workflow_settings.dry_run = false)
```

## What each file contains

A single run's output is one markdown file with these sections:

1. **Per-project Done / Doing / Next-for-Sustainability triple.** One block per
   active project. "Done" lists up to 5 recently approved cycle_items, "Doing"
   lists up to 3 pending cycle_items by priority, "Next-for-sustainability" is
   the Anthropic-generated answer to "what one or two pieces of work are
   missing-but-needed for this project to remain viable long-term?" Invitation
   language, never command.

2. **Stale change_request nudges.** Per change_request older than 48 hours with
   no movement, suggested text and recipient. NEVER auto-sent.

3. **Unowned high-priority item — owner suggestions.** Per cycle_item with no
   `assigned_to` and `COALESCE(user_priority_override, priority_score) > 7`, the
   member who has touched the most related work in the last 14 days.

4. **Learning-flagged report adjustments.** One concrete next-cycle adjustment
   per project flagged in Loop 1.4 or by feedback-derived process improvements.

5. **Feedback ingestion summary** (the section visible in the daily report
   too): N pieces received in window, broken down by classification, N
   auto-acted, N draft change_requests created, N still pending classification.

## How to act on a suggestion

Three options per item:

1. **Accept** — the corresponding draft change_request (workflow 06 mirrors every
   suggestion as a `change_requests` row with `disposition='more-info-needed'`)
   can be moved to `disposition='approved'` on the project board. The next
   cycle's review picks it up.
2. **Defer** — leave the draft change_request at `more-info-needed`. It rolls
   forward to the next 4-hour run's view; nothing is lost.
3. **Reject** — POE binding: there's no `'rejected'` disposition. The right move
   is `disposition='deferred-next-cycle'` with a `disposition_notes` line
   explaining why. The workflow's audit_log keeps the trail.

Markdown files older than 30 days are eligible for archival, but the
audit_log retention is permanent — so the underlying decisions don't depend
on the markdown.

## Dry-run gate

When `workflow_settings.dry_run = true` (default for the first three runs),
the workflow writes into `ai-suggestions/dry-run/` instead of the live
folder, and Loop 1 mutations are SKIPPED in favor of "would-have-mutated"
previews. Compare a few dry-run files to the live state of the DB to
confirm the math is right. When you're comfortable:

```sql
UPDATE workflow_settings
   SET dry_run = false
 WHERE workflow_key = 'situational-analyzer-v0';
```

The next 4-hour tick is live. The dry-run folder is kept around as the
historical "first three runs" log.

## Disabling the workflow

Single SQL update from any device:

```sql
UPDATE workflow_settings
   SET enabled = false
 WHERE workflow_key = 'situational-analyzer-v0';
```

The next trigger exits at pre-flight with `last_run_status='disabled'`.
Re-enable by flipping it back to `true`.

## Related docs

- `docs/00-foundations/SITUATIONAL-ANALYSIS-DESIGN.md` — full design
- `docs/00-foundations/n8n-workflows/06-situational-analysis-and-mutation-cron.json`
  — the workflow
- `infra/supabase/schema-v2.10-ai-workflow-state.sql` — workflow_state +
  workflow_settings tables
- `docs/00-foundations/SOVEREIGNTY-FIRST-INSTALL-PATTERN.md` — why every
  guardrail in workflow 06 exists

## Revision history

- 2026-05-26 — Created (Dispatch overnight) ahead of workflow 06 going live.
