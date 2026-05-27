# Smoke-test findings — resolution batch 2026-05-26

> **Status:** migration file written and committed; awaiting Darrell's
> paste-and-run against the live Supabase project. No live-DB execution
> happened in this batch. Additive only — zero data-loss risk.
>
> **Migration file:** `infra/supabase/schema-v2.9-smoke-findings.sql`
> **Apply target:** Supabase project `mjjlevhdufpaplypnqrv` → SQL Editor

## What the smoke test found

The 2026-05-26 production smoke test compared the live Supabase project to
the documented v2 schema set (`infra/supabase/schema-v2.1-infra.sql` through
`infra/supabase/schema-v2.9-portal-rls.sql`) and the multi-domain draft
(`docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md`). Three gaps surfaced.

### Gap 1 — Legal cut (v2.6) tables not present in live DB

The full v2.6 Legal cut (eight tables) is defined in
`infra/supabase/schema-v2.6-legal.sql` but had never been applied to the live
project. Without it the Legal scope of the app has nowhere to write:

- `legal_matters` (encrypted; the parent matter record)
- `matter_parties` (encrypted party names + contacts)
- `matter_counsel` (encrypted firm + attorney info)
- `matter_key_dates` (encrypted labels, plain `date_at` for the upcoming index)
- `matter_documents` (encrypted filenames, storage_path in plain so the
  storage RLS can join)
- `matter_journal` (append-only, encrypted body)
- `matter_financial_links` (joins to v1 `transactions`)
- `conflict_checks` (clear / conflict / waivable / blocked)

All eight enforce the v2.6 client-side AES-GCM 256 + PBKDF2 250k boundary —
the server stores ciphertext only. RLS still gates instance scoping; the
server cannot decrypt content. Delete is forbidden on the primary tables
(matters can be `status='closed'`, never removed).

### Gap 2 — Church giving reconciliation (v2.7 §11.5 Q6 lock-in) not present

The two tables that close Darrell's accuracy bar — "making sure what was
given is what was given, cash money and online" — were defined in
`schema-v2.7-church.sql` but missing from the live DB:

- `service_offerings` — one row per service, capturing cash total + check
  total + check count + check numbers + online total. The counter (cash and
  online) is recorded so the audit trail is complete.
- `giving_reconciliations` — links named-giving claims to anonymous
  `service_offerings` rows so the annual tax statement aggregates correctly
  (identified `donor_giving` + residual anonymous = total).

Per-service invariant (application-enforced, reported by Books):
`cash_total + check_total + online_total` should match the Books transaction(s)
for that service AND should match the sum of identified `donor_giving` rows
for that date plus the residual anonymous amount. The daily Books reconciliation
report surfaces any drift > $1.

### Gap 3 — `change_requests.assigned_to` first-class field + Christina's notification preference

The current `change_requests` table stores assignment **implicitly** via
`lifecycle.assignee` or via `links[].next_assignee_after_verify` (per
`seed-2026-05-25-projects.sql`). That means n8n workflow 04 (POE morning
standup) has to dig through jsonb to know who owns the change. Phone-facing
notifications can't surface "you have N change_requests waiting on you"
cheaply.

Resolution: add a first-class `assigned_to uuid REFERENCES auth.users(id)`
column to `change_requests`. The seed and any existing logic that uses
`lifecycle.assignee` keeps working unchanged; new logic reads from the
column directly.

Also: seed a `notification_preferences` row for Christina
(`target_user_id = 737f5d3b-...` if she's been provisioned with that
stable UUID, otherwise discovered by email lookup) for
`kind = 'change_request_assigned'` on both `pushover` and `ntfy` channels.
This lights up the seeded change_requests routed to her in workflow 01 the
moment she's assigned to one.

## How to apply

The migration is idempotent. Every CREATE uses `IF NOT EXISTS`. Every column
add uses a `DO $$ ... ADD COLUMN IF NOT EXISTS ... EXCEPTION WHEN
duplicate_column ...` block. Every seed uses `ON CONFLICT DO NOTHING`. You
may run it against a DB that already has some of these objects without harm.

**One-paste apply path** (recommended):

1. Open Supabase Dashboard for project `mjjlevhdufpaplypnqrv`.
2. Sidebar → SQL Editor → New query.
3. Paste the entire contents of `infra/supabase/schema-v2.9-smoke-findings.sql`.
4. Run. Expected runtime: under 5 seconds.
5. Run the verification queries from the bottom of the migration file
   (commented block at the end). Every table should return `count(*) = 0`
   (they're new and empty). The `change_requests` column query should return
   a single row showing `assigned_to`.

If anything errors:

- "relation `instances` does not exist" — apply `schema-v2.1-infra.sql` first.
- "relation `donor_giving` does not exist" — apply `schema-v2.7-church.sql`
  first (the smoke-findings migration references `donor_giving` in the
  `giving_reconciliations` FK).
- "relation `transactions` does not exist" — apply the v1 schema (the
  `matter_financial_links` FK references it).
- Anything else — leave the live DB unchanged and ping Dispatch with the
  error message; the migration is additive, so a partial state is safe to
  re-run after the precondition is fixed.

## What this migration intentionally does NOT do

- It does not change any policy on any existing table. The `change_requests`
  policies in v2.8 already cover `assigned_to` (the column is just a
  member-readable / member-updatable field like every other one on the row).
- It does not seed any rows in the new Legal or service_offerings tables.
  Those are domain entries Darrell or Christina create when needed.
- It does not back-fill `assigned_to` from `lifecycle.assignee`. The existing
  jsonb path keeps working; new writes use the column. If a back-fill is
  desired later, it's a one-line UPDATE that the next batch can carry.
- It does not change anything related to the v2.6 encryption posture. Legal
  is still client-side encrypted; server can't decrypt; PIN loss is data
  loss. The migration just creates the empty containers.

## Cross-references

- `infra/supabase/schema-v2.6-legal.sql` — full v2.6 Legal cut definition
- `infra/supabase/schema-v2.7-church.sql` — full v2.7 Church definition
  (sections for service_offerings + giving_reconciliations)
- `infra/supabase/schema-v2.8-ops.sql` — change_requests + notification_preferences
- `infra/supabase/seed-2026-05-25-projects.sql` — the seed that motivated
  Gap 3 (the script's own comment: "The schema doesn't carry an
  `assigned_to` column on change_requests.")
- `docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md` §11.5 — Q6 lock-in
  rationale for service_offerings + giving_reconciliations
- `docs/00-foundations/SOVEREIGNTY-FIRST-INSTALL-PATTERN.md` — why these gaps
  get a migration file (paste-when-ready) instead of a live-DB execution
  while Darrell is asleep

## Revision history

- 2026-05-26 — Migration authored after the production smoke test. No
  live-DB execution. Awaiting Darrell's paste-and-run.
