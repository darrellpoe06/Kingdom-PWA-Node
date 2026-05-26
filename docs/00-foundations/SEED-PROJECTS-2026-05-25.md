# Seed Projects — 2026-05-25 (Vacation Prep Cycle)

> **Status:** Seeded, 2026-05-25. The dogfood call: use the Kingdom-PWA-Node app itself to manage the setup of the app's own infrastructure. This is the §12.5 "PoeTech central runs the same loop on its own instance" pattern from `SCHEMA-V2-MULTI-DOMAIN-DRAFT.md`, applied to the Poe Family instance for the 6-day vacation-prep window.
>
> **Reader posture:** mobile-first. Plain URLs throughout. Short sections.

---

## Exec summary (one paragraph)

On 2026-05-25 we seeded the app's own `projects` / `change_requests` / `cycle_items` / `notifications` tables with the eight real projects in flight today — Synology n8n rollout, Schema v2 deployment, React rewire to `instance_id`, VerifyBalances + numeric sync (already shipped, captured for honest history), Counseling tab MVP, Resend SMTP setup, Trust ownership architecture, and the Parallel Frameworks evaluation — plus four spouse-approval `change_requests` (Pushover $5, USB 4 TB ~$50–80, conditional Synology RAM upgrade, perpetual backup-path decision) routed to Christina with transparent `priority_score` math in `priority_factors` jsonb. All work hangs off one ad-hoc `review_cycle` named "Vacation Prep" that closes 24 hours before Darrell departs. The system ranks; the human decides — `user_priority_override` stays NULL until Christina sets it; dispositions stay in non-punitive vocabulary (`pending`, `approved`, `deferred-next-cycle`); `rejected` is never seeded.

---

## What was created

Three files, one purpose: capture today's workload as real rows in the app's own tables so the dogfood loop closes.

- `infra/supabase/seed-2026-05-25-projects.sql` — idempotent INSERTs (Mode 1: ready to paste into Supabase SQL Editor the moment `schema-v2.1-infra.sql` is green).
- `infra/seed-data/2026-05-25-projects.json` — structured JSON mirror (Mode 2: future UI consumes this to let Darrell or Christina add similar items from their phone with a tap).
- `docs/00-foundations/SEED-PROJECTS-2026-05-25.md` — this doc.

### Critical sequencing

**Do NOT run the seed SQL until `schema-v2.1-infra.sql` + `schema-v2.8-ops.sql` are green.** The seed depends on the `instances` rename, the `cycle_items` / `change_requests` / `review_cycles` / `review_cadences` / `notifications` tables, and the `projects.slug` partial unique index from v1.2. The seed file's header repeats this dependency. v2.1-infra still needs Darrell to paste it via clipboard first; the seed runs after that lands.

### Idempotency

Every INSERT is guarded — `ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING` where a partial unique constraint exists (projects), `WHERE NOT EXISTS` keyed on stable titles or dedupe markers everywhere else. Re-running the seed is safe.

---

## Projects seeded (8)

| Slug | Title | Status | Domain | Owner |
|---|---|---|---|---|
| synology-n8n-rollout-2026-05-25 | Synology n8n rollout | active | family | Darrell |
| schema-v2-deployment-2026-05-25 | Schema v2 deployment | active | tech-business | Darrell |
| react-rewire-instance-id-2026-05-25 | React rewire to instance_id | active | tech-business | Darrell |
| verifybalances-numeric-sync-2026-05-24 | VerifyBalances + numeric sync | **done** | tech-business | Darrell |
| counseling-tab-mvp-2026-05-25 | Counseling tab MVP — Christina's 6 answers | planning | therapy | Christina |
| resend-smtp-setup-2026-05-25 | Resend SMTP setup | active | tech-business | Darrell |
| trust-ownership-architecture-2026-05-25 | Trust ownership architecture | active | legal | Darrell |
| parallel-frameworks-eval-2026-05-25 | Parallel frameworks evaluation | active | tech-business | Darrell |

VerifyBalances + numeric sync is seeded with `status='done'` and a corresponding cycle item already at `disposition='approved'` so the historical record is honest — work shipped on 2026-05-24 doesn't masquerade as pending.

Domain is plain `text` on `projects` in v1 (no CHECK constraint), so `tech-business` is used as a convention aligned with the `instance_domains` enum vocabulary even though projects themselves have no enum gate.

---

## Change requests routed to Christina (4)

The schema does not carry an `assigned_to` column on `change_requests`. The assignment is recorded two ways:

1. The `links` jsonb on each `change_request` includes `{"kind":"assigned_to_user","display_label":"Christina (spouse approval)", ...}`.
2. The `cycle_item` wrapping each `change_request` carries `disposition='pending'` and a note "Awaiting Christina spouse-approval" — Christina's eventual call lands in `cycle_items.disposition_by` / `disposition_at` / `disposition_notes`.

`change_requests.status` stays at `'proposed'` (the schema-side seed state); the POE-vocabulary phase `pending-spouse-approval` lives in `lifecycle.phase` (free-form jsonb).

| Title | One-time | Perpetual | Risk | Cycle-item priority |
|---|---|---|---|---|
| Pushover license | $5 | $0 | low | 9.7 (countdown-bound, deadline **2026-06-25**) |
| USB external 4 TB drive | $50–80 | $0 | low | 7.0 |
| Synology RAM upgrade to 32 GB ECC (RESOLVED) | $0 | $0 | low | n/a (Darrell's unit has **62 GB physical** confirmed 2026-05-26 — disposition `deferred-next-cycle` with note "already populated past 32 GB target") |
| Choose offsite backup path | $0 | $0–6/mo | low | 6.6 (default lean: $0/mo USB-only) |

> **Pushover license countdown (added 2026-05-26):** Pushover account `darrellpoe06@gmail.com` created 2026-05-26 on a 30-day free trial. The $5 lifetime license must be purchased at https://pushover.net by **2026-06-25** or pushes cap out. Workflow 04 (POE morning standup) surfaces this `change_request` daily once `user_priority_override IS NULL` and `priority_score >= 0.6`; priority is bumped from 9.4 → 9.7 so it stays in the top-5 morning digest as the deadline approaches. This row needs an `UPDATE` against the live Supabase `change_requests` table during Phase 4 — the seed file is the source of truth for documentation, the live DB carries the running value.
>
> **Synology RAM update:** the `Synology RAM upgrade to 32 GB ECC (CONDITIONAL)` change_request is resolved as `deferred-next-cycle` — Darrell's unit reports 62 GB physical via `free -h`, well past the original 32 GB target. The seed entry stays in the doc as a historical record of the conditional; the live row should be dispositioned `deferred-next-cycle` during Phase 4 with note `already populated past 32 GB target — verified 2026-05-26`.

### Priority math (transparent in `priority_factors` jsonb)

```
priority_score = urgency_score * 0.6 + dollar_friction * 10 * 0.4

  urgency_score   [0..10]  — vacation deadline pressure
  dollar_friction [0..1]   — 1 - (cost / cap), lower cost = higher friction-free score
```

Each cycle_item carries the computation in `priority_factors` so any user can see exactly why the system ranked an item the way it did. `user_priority_override` is NULL at seed time — Christina sets it if she disagrees with the system's rank. POE binding: the system ranks, the human decides.

---

## Items that don't need approval (cycle_items only)

`ntfy` self-hosted and Tailscale personal plan are zero-cost and need no spouse-approval. They appear in the JSON seed as `cycle_items_only` and would land as plain cycle items pointing at the Synology rollout project.

---

## Review cycle

- **Cadence:** "Vacation Prep (ad-hoc)" — `cadence_frequency='ad-hoc'`, facilitator = Darrell, auto_cluster + auto_priority on.
- **Cycle:** "2026-05-25 — Vacation Prep" — closes 24 hours before Darrell departs (T+5 days). `agenda_notes` opens with the marker `[seed:2026-05-25-vacation-prep]` for idempotency.

All eight projects and all four change_requests are bound to this cycle as `cycle_items`.

---

## Notifications

- **Christina** — `notification_preferences` row at `kind='cycle-board-ready'`, `channel='in-app'`, `lead_times={immediate}`. One queued `notification` (`status='queued'`, `priority='high'`) summarizes the three items awaiting her call.
- **Darrell** — `notification_preferences` row at `kind='change-due-soon'`, `channel='in-app'`, `lead_times={immediate,1h,24h}`. A `notification_channels` row stages a `push` channel with address `pushover://PLACEHOLDER-user-key-replace-after-license` and `status='paused'` — **as of 2026-05-26 the real user-key is `upan72gdukpvmo49uet2jfyjgrrf3v` (Path A, awaiting app token) plus email gateway `ikzf7xijr4@pomail.net` (Path B, works the moment SMTP lands). See `infra/n8n/INSTALL.md §Step 6` for the dual-path setup.** The `notification_channels` row should be updated during Phase 4 (Phase 4: change `status` to `active` once at least one path is verified end-to-end).

Christina's notification rows only insert if her `user_id` is resolvable in `instance_members` (title containing `co-founder` or `spouse`, or display_name starting with `Christina`, or any non-Darrell owner/admin). If she hasn't signed up yet, those rows are skipped without error and the seed completes.

---

## Files

- Seed SQL: `infra/supabase/seed-2026-05-25-projects.sql`
- Seed JSON: `infra/seed-data/2026-05-25-projects.json`
- Vacation-prep plan: `docs/00-foundations/_future/SYNOLOGY-DEPLOY-PLAN.md`
- Stack choice rationale: `docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md`
- Schema design: `docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md`
- Schema source: `infra/supabase/schema-v2.1-infra.sql`, `infra/supabase/schema-v2.8-ops.sql`

## Run order (Supabase SQL Editor, after v2 schema is green)

1. Paste `infra/supabase/schema-v2.1-infra.sql` — confirm green.
2. Paste `infra/supabase/schema-v2.8-ops.sql` — confirm green.
3. Paste `infra/supabase/seed-2026-05-25-projects.sql` — confirm `NOTICE: seed-2026-05-25-projects: complete` appears in the output.
4. Open the app, navigate to the projects tab, confirm the 8 projects and the Vacation Prep cycle render.

---

## What this enables next

Once the seed runs, every other Dispatch / Claude session in this window can read the live cycle board to know what's outstanding, what's done, what's waiting on Christina, and where the priority math lives — instead of reconstructing that state from chat scrollback. The app's own state becomes the source of truth for "what's on Darrell's plate today." That is the §12.5 loop closing on its own instance.
