# n8n workflow numbering — convention + cleanup backlog

**Convention:** each workflow is `NN-short-slug.json` on disk, and its n8n `name`
field reads `NN · Human Name`. The number is a stable handle the family + docs
refer to ("wf30", "wf36"). Keep it sequential; reserve `99` for the global error
handler.

## Cleanup backlog (do as ONE coordinated batch — see process below)

Flagged 2026-06-13 (Darrell). Not urgent; batch it so the NAS re-imports happen
in a single sitting, not piecemeal.

### 1. Unnumbered workflows (3) — give them numbers
These broke the convention (status/observability surfaces added later):
- `wf-dispatch-status.json`        → propose **38**
- `wf-dispatch-status-page.json`   → propose **39**
- `wf-workflow-status.json`        → propose **40**  (the DR-0061 Stage-2 live feed)

### 2. Duplicate numbers — disambiguate
Each of these numbers is used by TWO different workflows on disk:
- `01` — `01-project-timeline-daily.json` AND `01-supabase-cycle-item-webhook.json`
- `02` — `02-daily-reports-cron.json` AND `02-workflow-failure-alert.json`
- `03` — `03-b2-backup-status.json` AND `03-github-event-to-phone.json`
- `04` — `04-poe-morning-standup.json` AND `04-pushover-smoke-test.json`

Renumber one of each pair into the free gaps: **07, 21, 22, 24, 25, 28** (then
38–40 for the unnumbered above, 41+ after that).

`_TEMPLATE-cached-system-message.json` stays unnumbered on purpose (it's a
template, not a live workflow).

## Process per workflow (why it's a batch, not piecemeal)

Renaming a workflow is three coordinated edits + a NAS step:
1. Rename the file `NN-slug.json`.
2. Update the workflow's `name` field inside the JSON to `NN · Human Name`.
3. Update any references (docs, `wfNN` mentions, the app if it hardcodes a name).
4. **Re-import the renamed workflow on the NAS** (Container/n8n) and delete the
   old copy — this is the friction, so doing all of them in one session is the
   point.

Pairs with DR-0061 (the live status feed that surfaced the gap) and the
reality-trace rule (verify the live n8n state before/after, don't assume).
