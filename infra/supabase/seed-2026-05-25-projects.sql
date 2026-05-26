-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — seed-2026-05-25-projects.sql
--
-- DOGFOOD seed: populate the app's own projects + change_requests +
-- cycle_items + notifications tables with the real workload Darrell and
-- Christina are carrying on 2026-05-25.
--
-- This is the §12.5 "PoeTech central runs the same loop on its own
-- instance" pattern from SCHEMA-V2-MULTI-DOMAIN-DRAFT.md, applied to the
-- Poe Family instance for the vacation-prep cycle.
--
-- DEPENDS ON: schema-v1.sql + schema-v1.1-tenant-join.sql + schema-v1.2-
--             numeric-sync.sql + schema-v2.1-infra.sql + schema-v2.8-ops.sql
--             must all be applied to the target database before running
--             this file.
--
-- DO NOT RUN until v2.1-infra is green. The seed assumes:
--   - tenants→instances rename has occurred (v2.1)
--   - projects has a `slug` column + partial unique index (v1.2)
--   - cycle_items / change_requests / review_cycles / review_cadences
--     / notifications / notification_preferences all exist (v2.8)
--
-- IDEMPOTENCY: every INSERT is guarded — `ON CONFLICT DO NOTHING` where a
-- unique constraint exists, `WHERE NOT EXISTS` otherwise. Safe to re-run.
--
-- POE BINDING (per §2 of SCHEMA-V2-MULTI-DOMAIN-DRAFT.md):
--   The system ranks (priority_score, transparent via priority_factors);
--   the human decides (user_priority_override stays NULL until Christina
--   sets it). Dispositions stay in non-punitive vocabulary: 'pending',
--   'approved', 'deferred-next-cycle'. 'rejected' is NEVER seeded.
--
-- Companion files:
--   - infra/seed-data/2026-05-25-projects.json (UI-consumable mirror)
--   - docs/00-foundations/SEED-PROJECTS-2026-05-25.md (human-readable)
-- =====================================================================

BEGIN;

DO $seed$
DECLARE
  v_instance_id        uuid;
  v_darrell_user_id    uuid;
  v_christina_user_id  uuid;

  v_cadence_id         uuid;
  v_cycle_id           uuid;

  v_now             timestamptz := now();
  v_today           date        := current_date;
  v_vacation_depart timestamptz := (current_date + interval '6 days')::timestamptz;
  v_cycle_close     timestamptz := (current_date + interval '5 days')::timestamptz;
  v_cycle_window_start timestamptz := (current_date - interval '7 days')::timestamptz;

  -- Project IDs (resolved post-insert for cycle_item references)
  v_proj_synology       uuid;
  v_proj_schema_v2      uuid;
  v_proj_react_rewire   uuid;
  v_proj_verifybalances uuid;
  v_proj_counseling     uuid;
  v_proj_resend         uuid;
  v_proj_trust          uuid;
  v_proj_parallel       uuid;

  -- change_request IDs
  v_cr_pushover    uuid;
  v_cr_usb_drive   uuid;
  v_cr_ram_upgrade uuid;
  v_cr_backup_path uuid;

BEGIN
  -- -------------------------------------------------------------------
  -- Resolve principals
  -- -------------------------------------------------------------------

  SELECT id INTO v_instance_id FROM instances WHERE slug = 'poe-family';
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'seed-2026-05-25-projects: poe-family instance not seeded; run schema-v1.sql first';
  END IF;

  SELECT id INTO v_darrell_user_id
    FROM auth.users
   WHERE lower(email) = 'darrellpoe06@gmail.com'
   LIMIT 1;
  IF v_darrell_user_id IS NULL THEN
    RAISE EXCEPTION 'seed-2026-05-25-projects: darrellpoe06@gmail.com not in auth.users; sign in once at the app before seeding';
  END IF;

  -- Christina: robust lookup. Title containing 'Co-Founder' is the canonical
  -- marker; fall back to display_name starting with 'Christina'; fall back to
  -- any non-Darrell owner/admin in the instance. May still be NULL if she
  -- hasn't signed up yet — rows that need her user_id are skipped, not
  -- forced.
  SELECT user_id INTO v_christina_user_id
    FROM instance_members
   WHERE instance_id = v_instance_id
     AND user_id <> v_darrell_user_id
     AND (
       title ILIKE '%co-founder%'
       OR title ILIKE '%spouse%'
       OR display_name ILIKE 'christina%'
     )
   ORDER BY joined_at ASC
   LIMIT 1;

  IF v_christina_user_id IS NULL THEN
    SELECT user_id INTO v_christina_user_id
      FROM instance_members
     WHERE instance_id = v_instance_id
       AND user_id <> v_darrell_user_id
       AND role IN ('owner','admin')
     ORDER BY joined_at ASC
     LIMIT 1;
  END IF;

  RAISE NOTICE 'seed: instance=%, darrell=%, christina=% (NULL is OK if Christina has not signed up yet)',
    v_instance_id, v_darrell_user_id, v_christina_user_id;

  -- -------------------------------------------------------------------
  -- PROJECTS
  -- -------------------------------------------------------------------
  -- All eight projects live in the Poe Family instance. projects.domain
  -- is plain text (no CHECK constraint in v1), so 'family' is used for
  -- domestic-affecting work and 'tech-business' for PoeTech-central work
  -- consistent with the instance_domains enum vocabulary.
  -- -------------------------------------------------------------------

  -- 1. Synology n8n rollout
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date, hours_per_week)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'Synology n8n rollout', 'synology-n8n-rollout-2026-05-25',
    'active', 'family',
    E'Self-host the PWA + Supabase + n8n + Ollama on the DS1621xs so ' ||
    E'Christina and the kids can install one PWA per device and feedback ' ||
    E'collects in one shared place.\n\n' ||
    E'Plan: docs/00-foundations/_future/SYNOLOGY-DEPLOY-PLAN.md\n' ||
    E'Frameworks eval: docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md\n\n' ||
    E'Vacation deadline: Darrell departs in 6 days; installable for ' ||
    E'Darrell-only access by then; family onboarding lands on return.',
    v_today, v_today + interval '5 days', 10
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_synology FROM projects
    WHERE instance_id = v_instance_id AND slug = 'synology-n8n-rollout-2026-05-25';

  -- 2. Schema v2 deployment
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'Schema v2 deployment', 'schema-v2-deployment-2026-05-25',
    'active', 'tech-business',
    E'Apply schema-v2.x migrations in order: v2.1-infra → v2.2-rentals → ' ||
    E'v2.3-therapy → v2.4-contractor → v2.6-legal → v2.7-church → v2.8-ops ' ||
    E'→ v2.9-portal-rls.\n\n' ||
    E'Files live in infra/supabase/. v2.1-infra is the foundation; the ' ||
    E'rest light up domain modules incrementally. v1 surfaces keep working ' ||
    E'throughout (additive migration per §4.0 of the design doc).',
    v_today, v_today + interval '5 days'
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_schema_v2 FROM projects
    WHERE instance_id = v_instance_id AND slug = 'schema-v2-deployment-2026-05-25';

  -- 3. React rewire to instance_id
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'React rewire to instance_id', 'react-rewire-instance-id-2026-05-25',
    'active', 'tech-business',
    E'Application-layer rename: tenant_id → instance_id across React ' ||
    E'sources and Supabase client calls. Work is done in repo but ' ||
    E'uncommitted; one cycle item remains to commit + push.\n\n' ||
    E'Files affected (per `git status` 2026-05-25): app/src/components/' ||
    E'InputCenter.jsx, app/src/lib/{accounts,debts,entities,feedback,' ||
    E'projects,table,transactions}-sync.js, app/src/poe-financial-mvp-v28' ||
    E'.jsx.',
    v_today, v_today + interval '1 day'
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_react_rewire FROM projects
    WHERE instance_id = v_instance_id AND slug = 'react-rewire-instance-id-2026-05-25';

  -- 4. VerifyBalances + numeric sync (historical — already shipped)
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'VerifyBalances + numeric sync', 'verifybalances-numeric-sync-2026-05-24',
    'done', 'tech-business',
    E'v1.2 numeric-table sync (accounts, debts, transactions, projects) + ' ||
    E'VerifyBalances gate.\n\n' ||
    E'Status: SHIPPED. Captured here for honest history per §12.5. The ' ||
    E'restore-from-head batch + v1.2 SQL apply were the unblocks; both ' ||
    E'are complete (see SESSION-HANDOFF-2026-05-24.md).',
    v_today - interval '1 day', v_today
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_verifybalances FROM projects
    WHERE instance_id = v_instance_id AND slug = 'verifybalances-numeric-sync-2026-05-24';

  -- 5. Counseling tab MVP — Christina's 6 answers
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    E'Counseling tab MVP — Christina''s 6 answers', 'counseling-tab-mvp-2026-05-25',
    'planning', 'therapy',
    E'Counseling tab cannot ship until Christina answers six product-shape ' ||
    E'questions:\n' ||
    E'  Q2 — voice/tone\n' ||
    E'  Q3 — scripture posture\n' ||
    E'  Q4 — model + system prompt\n' ||
    E'  Q5 — triage / crisis routing\n' ||
    E'  Q6 — disclaimer pattern\n' ||
    E'  Q9 — counseling vocabulary\n\n' ||
    E'Owner: Christina. Status: waiting on answers (non-blocking for ' ||
    E'vacation week — counseling tab is post-vacation work).',
    v_today, NULL
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_counseling FROM projects
    WHERE instance_id = v_instance_id AND slug = 'counseling-tab-mvp-2026-05-25';

  -- 6. Resend SMTP setup
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'Resend SMTP setup', 'resend-smtp-setup-2026-05-25',
    'active', 'tech-business',
    E'Sign up at https://resend.com with darrellpoe06@gmail.com (60-sec ' ||
    E'signup), get the SMTP credentials, wire into Supabase Auth so ' ||
    E'magic-link emails actually deliver. The Resend session continues ' ||
    E'after Darrell completes signup.',
    v_today, v_today + interval '1 day'
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_resend FROM projects
    WHERE instance_id = v_instance_id AND slug = 'resend-smtp-setup-2026-05-25';

  -- 7. Trust ownership architecture
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'Trust ownership architecture', 'trust-ownership-architecture-2026-05-25',
    'active', 'legal',
    E'Q1 + Q2 v2-schema answer: TLC, Poe Properties, and PoeTech all carry ' ||
    E'parent_instance_id = trust.id. Trust is an instance of ' ||
    E'instance_type=''trust''; operating companies hang under it via ' ||
    E'parent_instance_id. legal_structure_notes jsonb holds the ' ||
    E'non-privileged admin shape (trustees, successor trustee, EIN last 4, ' ||
    E'state of formation, registered agent).\n\n' ||
    E'Privileged legal content lives encrypted in the Legal domain (v2.6).',
    v_today, NULL
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_trust FROM projects
    WHERE instance_id = v_instance_id AND slug = 'trust-ownership-architecture-2026-05-25';

  -- 8. Parallel frameworks evaluation
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'Parallel frameworks evaluation', 'parallel-frameworks-eval-2026-05-25',
    'active', 'tech-business',
    E'Stack A / B / C evaluation of n8n + Ollama + Tailscale + ntfy + ' ||
    E'Pushover + Backblaze B2 against the DS1621xs 32 GB RAM ceiling and ' ||
    E'the 6-day vacation deadline.\n\n' ||
    E'Doc: docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md\n' ||
    E'TL;DR: Stack B (minimal-surface n8n) is the vacation-week answer.',
    v_today, v_today + interval '1 day'
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_parallel FROM projects
    WHERE instance_id = v_instance_id AND slug = 'parallel-frameworks-eval-2026-05-25';

  -- -------------------------------------------------------------------
  -- REVIEW CADENCE + REVIEW CYCLE
  -- -------------------------------------------------------------------
  -- One ad-hoc cadence "Vacation Prep" + one cycle "2026-05-25 Vacation
  -- Prep". Idempotent by matching cadence_name within the instance.
  -- -------------------------------------------------------------------

  INSERT INTO review_cadences (
    instance_id, created_by, cadence_name, cadence_frequency,
    facilitator_user_id, auto_cluster, auto_priority, enabled
  )
  SELECT v_instance_id, v_darrell_user_id, 'Vacation Prep (ad-hoc)', 'ad-hoc',
         v_darrell_user_id, true, true, true
  WHERE NOT EXISTS (
    SELECT 1 FROM review_cadences
    WHERE instance_id = v_instance_id
      AND cadence_name = 'Vacation Prep (ad-hoc)'
  );

  SELECT id INTO v_cadence_id FROM review_cadences
   WHERE instance_id = v_instance_id
     AND cadence_name = 'Vacation Prep (ad-hoc)'
   LIMIT 1;

  INSERT INTO review_cycles (
    instance_id, created_by, cadence_id,
    cycle_start, cycle_end, window_start, window_end,
    agenda_notes, status
  )
  SELECT v_instance_id, v_darrell_user_id, v_cadence_id,
         v_now, v_cycle_close, v_cycle_window_start, v_cycle_close,
         E'[seed:2026-05-25-vacation-prep] Items in flight before Darrell departs. ' ||
         E'Close 24h before departure so nothing untriaged carries over.',
         'in-progress'
  WHERE NOT EXISTS (
    SELECT 1 FROM review_cycles
    WHERE cadence_id = v_cadence_id
      AND agenda_notes LIKE '[seed:2026-05-25-vacation-prep]%'
  );

  SELECT id INTO v_cycle_id FROM review_cycles
   WHERE cadence_id = v_cadence_id
     AND agenda_notes LIKE '[seed:2026-05-25-vacation-prep]%'
   LIMIT 1;

  -- -------------------------------------------------------------------
  -- CHANGE REQUESTS (routed to Christina for approval)
  -- -------------------------------------------------------------------
  -- The schema doesn't carry an `assigned_to` column on change_requests.
  -- The assignment is recorded two ways:
  --   1. links jsonb gets `{"kind":"assigned_to_user", ...}`
  --   2. The cycle_item that wraps the change_request below carries the
  --      POE-language disposition='pending' (waiting on her call).
  -- change_requests.status stays 'proposed' (the schema-side seed state);
  -- the lifecycle.phase carries the POE label 'pending-spouse-approval'.
  -- -------------------------------------------------------------------

  -- Pushover license ($5 one-time, urgency HIGH)
  INSERT INTO change_requests (
    instance_id, created_by, title, description, change_type, risk_level,
    proposed_by_user_id, lifecycle, links, status
  )
  SELECT
    v_instance_id, v_darrell_user_id,
    'Approve Pushover license ($5 one-time)',
    E'Purchase Pushover license at https://pushover.net for Darrell''s ' ||
    E'phone notifications during vacation week. $5 one-time per platform ' ||
    E'(iOS/Android, one-time). Best reliability for time-sensitive alerts ' ||
    E'(rent due, incident escalation, family emergencies).\n\n' ||
    E'Parallel-frameworks eval: locked-in (Tier F notifications, ' ||
    E'Pushover + ntfy dual-channel).',
    'standard', 'low',
    v_darrell_user_id,
    jsonb_build_object(
      'phase', 'pending-spouse-approval',
      'log', jsonb_build_array(jsonb_build_object(
        'at', v_now, 'by', v_darrell_user_id::text,
        'note', 'Routed to Christina for household financial approval'
      ))
    ),
    jsonb_build_array(jsonb_build_object(
      'kind', 'assigned_to_user',
      'user_id', COALESCE(v_christina_user_id::text, ''),
      'display_label', 'Christina (spouse approval)',
      'project_id', v_proj_synology::text
    )),
    'proposed'
  WHERE NOT EXISTS (
    SELECT 1 FROM change_requests
    WHERE instance_id = v_instance_id
      AND title = 'Approve Pushover license ($5 one-time)'
  );

  SELECT id INTO v_cr_pushover FROM change_requests
   WHERE instance_id = v_instance_id
     AND title = 'Approve Pushover license ($5 one-time)'
   LIMIT 1;

  -- USB external 4 TB ($50-80, urgency MEDIUM)
  INSERT INTO change_requests (
    instance_id, created_by, title, description, change_type, risk_level,
    proposed_by_user_id, lifecycle, links, status
  )
  SELECT
    v_instance_id, v_darrell_user_id,
    'Approve USB external 4 TB drive ($50-80 one-time)',
    E'4 TB USB external drive for offsite backup rotation (carry to ' ||
    E'parents'' house monthly). Hardware redundancy for the Synology RAID. ' ||
    E'$50-80 one-time depending on model.\n\n' ||
    E'Parallel-frameworks eval: Tier F backup, budget alternative to ' ||
    E'Backblaze B2.',
    'standard', 'low',
    v_darrell_user_id,
    jsonb_build_object(
      'phase', 'pending-spouse-approval',
      'log', jsonb_build_array(jsonb_build_object(
        'at', v_now, 'by', v_darrell_user_id::text,
        'note', 'Routed to Christina for household financial approval'
      ))
    ),
    jsonb_build_array(jsonb_build_object(
      'kind', 'assigned_to_user',
      'user_id', COALESCE(v_christina_user_id::text, ''),
      'display_label', 'Christina (spouse approval)',
      'project_id', v_proj_synology::text
    )),
    'proposed'
  WHERE NOT EXISTS (
    SELECT 1 FROM change_requests
    WHERE instance_id = v_instance_id
      AND title = 'Approve USB external 4 TB drive ($50-80 one-time)'
  );

  SELECT id INTO v_cr_usb_drive FROM change_requests
   WHERE instance_id = v_instance_id
     AND title = 'Approve USB external 4 TB drive ($50-80 one-time)'
   LIMIT 1;

  -- Synology RAM upgrade (CONDITIONAL — if current < 32 GB)
  INSERT INTO change_requests (
    instance_id, created_by, title, description, change_type, risk_level,
    proposed_by_user_id, lifecycle, links, status
  )
  SELECT
    v_instance_id, v_darrell_user_id,
    'Approve Synology RAM upgrade to 32 GB ECC (CONDITIONAL — $80-150 one-time)',
    E'IF currently installed RAM is < 32 GB ECC on the DS1621xs, upgrade ' ||
    E'to the 32 GB max so Postgres + Ollama + n8n + the app + everything ' ||
    E'else can share the pool without paging. Darrell to confirm current ' ||
    E'install before approving spend.\n\n' ||
    E'Conditional: change_request can be closed ''approved-no-cost'' if ' ||
    E'current RAM is already 32 GB.',
    'standard', 'low',
    v_darrell_user_id,
    jsonb_build_object(
      'phase', 'pending-darrell-verify-current-ram',
      'log', jsonb_build_array(jsonb_build_object(
        'at', v_now, 'by', v_darrell_user_id::text,
        'note', 'Conditional on current install size; Darrell verifies before routing to Christina'
      ))
    ),
    jsonb_build_array(jsonb_build_object(
      'kind', 'assigned_to_user',
      'user_id', v_darrell_user_id::text,
      'display_label', 'Darrell (verify current RAM)',
      'next_assignee_after_verify', COALESCE(v_christina_user_id::text, ''),
      'project_id', v_proj_synology::text
    )),
    'proposed'
  WHERE NOT EXISTS (
    SELECT 1 FROM change_requests
    WHERE instance_id = v_instance_id
      AND title = 'Approve Synology RAM upgrade to 32 GB ECC (CONDITIONAL — $80-150 one-time)'
  );

  SELECT id INTO v_cr_ram_upgrade FROM change_requests
   WHERE instance_id = v_instance_id
     AND title = 'Approve Synology RAM upgrade to 32 GB ECC (CONDITIONAL — $80-150 one-time)'
   LIMIT 1;

  -- Backup path decision (perpetual cost)
  INSERT INTO change_requests (
    instance_id, created_by, title, description, change_type, risk_level,
    proposed_by_user_id, lifecycle, links, status
  )
  SELECT
    v_instance_id, v_darrell_user_id,
    'Choose offsite backup path: $0 self-hosted OR paid object storage',
    E'Pick the perpetual-cost path for offsite backup:\n' ||
    E'  Option A — $0/mo: USB drive rotation only (Tier F budget option).\n' ||
    E'  Option B — ~$6/mo: Backblaze B2 (default in PARALLEL-FRAMEWORKS-EVAL).\n' ||
    E'  Option C — ~$5/mo: Cloudflare R2 (no egress fees, lock-in moderate).\n' ||
    E'  Option D — €3.20/mo: Hetzner Storage Box (EU jurisdiction).\n\n' ||
    E'Default lean: Option A (USB only) to minimize perpetual cost per ' ||
    E'Darrell''s standing rule. Christina to approve the chosen path.',
    'standard', 'low',
    v_darrell_user_id,
    jsonb_build_object(
      'phase', 'pending-spouse-approval',
      'log', jsonb_build_array(jsonb_build_object(
        'at', v_now, 'by', v_darrell_user_id::text,
        'note', 'Routed to Christina; default lean is $0/mo USB-only path'
      ))
    ),
    jsonb_build_array(jsonb_build_object(
      'kind', 'assigned_to_user',
      'user_id', COALESCE(v_christina_user_id::text, ''),
      'display_label', 'Christina (spouse approval)',
      'project_id', v_proj_synology::text
    )),
    'proposed'
  WHERE NOT EXISTS (
    SELECT 1 FROM change_requests
    WHERE instance_id = v_instance_id
      AND title = 'Choose offsite backup path: $0 self-hosted OR paid object storage'
  );

  SELECT id INTO v_cr_backup_path FROM change_requests
   WHERE instance_id = v_instance_id
     AND title = 'Choose offsite backup path: $0 self-hosted OR paid object storage'
   LIMIT 1;

  -- -------------------------------------------------------------------
  -- CYCLE ITEMS
  -- -------------------------------------------------------------------
  -- Bind every project's outstanding work + every change_request as
  -- cycle_items in the Vacation Prep cycle. priority_score + priority_factors
  -- jsonb show the math transparently. Done work is also seeded with
  -- disposition='approved' so the honest history is captured.
  --
  -- Priority formula (transparent in priority_factors):
  --   urgency_score   [0..10]  — vacation deadline pressure
  --   dollar_friction [0..1]   — 1 - (cost/cap), lower cost = higher score
  --   formula         = urgency * 0.6 + dollar_friction * 10 * 0.4
  -- -------------------------------------------------------------------

  -- Cycle items for change_requests
  IF v_cr_pushover IS NOT NULL THEN
    INSERT INTO cycle_items (
      instance_id, created_by, cycle_id, item_kind, item_id,
      priority_score, priority_factors, disposition, disposition_notes
    )
    SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'change_request', v_cr_pushover,
           9.4,
           jsonb_build_object(
             'urgency_score', 9, 'urgency_basis', 'vacation departure in 6 days; need reliable phone alerts',
             'dollar_friction', 1.0, 'dollar_basis', '$5 one-time = trivial friction',
             'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
             'computed_at', v_now
           ),
           'pending',
           'Awaiting Christina spouse-approval; Darrell flagged urgency=HIGH due to vacation deadline'
    WHERE NOT EXISTS (
      SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'change_request' AND item_id = v_cr_pushover
    );
  END IF;

  IF v_cr_usb_drive IS NOT NULL THEN
    INSERT INTO cycle_items (
      instance_id, created_by, cycle_id, item_kind, item_id,
      priority_score, priority_factors, disposition, disposition_notes
    )
    SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'change_request', v_cr_usb_drive,
           7.0,
           jsonb_build_object(
             'urgency_score', 7, 'urgency_basis', 'nice before vacation but RAID gives some redundancy already',
             'dollar_friction', 0.7, 'dollar_basis', '$50-80 modest friction at household tier',
             'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
             'computed_at', v_now
           ),
           'pending',
           'Awaiting Christina spouse-approval'
    WHERE NOT EXISTS (
      SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'change_request' AND item_id = v_cr_usb_drive
    );
  END IF;

  IF v_cr_ram_upgrade IS NOT NULL THEN
    INSERT INTO cycle_items (
      instance_id, created_by, cycle_id, item_kind, item_id,
      priority_score, priority_factors, disposition, disposition_notes
    )
    SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'change_request', v_cr_ram_upgrade,
           5.4,
           jsonb_build_object(
             'urgency_score', 6, 'urgency_basis', 'depends on current RAM; only urgent if currently <32 GB',
             'dollar_friction', 0.45, 'dollar_basis', '$80-150 mid-tier friction',
             'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
             'conditional', true, 'condition', 'current installed RAM < 32 GB',
             'computed_at', v_now
           ),
           'more-info-needed',
           'Awaiting Darrell verify current RAM install before Christina routing'
    WHERE NOT EXISTS (
      SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'change_request' AND item_id = v_cr_ram_upgrade
    );
  END IF;

  IF v_cr_backup_path IS NOT NULL THEN
    INSERT INTO cycle_items (
      instance_id, created_by, cycle_id, item_kind, item_id,
      priority_score, priority_factors, disposition, disposition_notes
    )
    SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'change_request', v_cr_backup_path,
           6.6,
           jsonb_build_object(
             'urgency_score', 6, 'urgency_basis', 'good to settle before vacation but USB rotation works as interim',
             'dollar_friction', 0.85, 'dollar_basis', '$0-6/mo perpetual; default-lean Option A = $0',
             'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
             'computed_at', v_now
           ),
           'pending',
           'Awaiting Christina spouse-approval; default lean = Option A ($0/mo USB-only)'
    WHERE NOT EXISTS (
      SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'change_request' AND item_id = v_cr_backup_path
    );
  END IF;

  -- Cycle items for projects (outstanding work + honest history)

  -- Synology n8n rollout — outstanding
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_synology,
         9.0,
         jsonb_build_object(
           'urgency_score', 9, 'urgency_basis', 'core vacation-week deliverable',
           'dollar_friction', 1.0, 'dollar_basis', 'time-only, no perpetual cost in chosen Stack B',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'computed_at', v_now
         ),
         'approved',
         'Plan ratified; Stack B chosen; execution underway'
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_synology
  );

  -- Schema v2 deployment — in-progress
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_schema_v2,
         9.5,
         jsonb_build_object(
           'urgency_score', 10, 'urgency_basis', 'blocks every v2 capability incl this very seed file',
           'dollar_friction', 1.0, 'dollar_basis', 'no cost; time-only',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'computed_at', v_now
         ),
         'approved',
         'v2.1-infra is the critical path; v2.2-v2.9 light up incrementally'
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_schema_v2
  );

  -- React rewire to instance_id — outstanding commit
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_react_rewire,
         8.6,
         jsonb_build_object(
           'urgency_score', 8, 'urgency_basis', 'work is done; commit+push is small but needed before vacation',
           'dollar_friction', 1.0, 'dollar_basis', 'no cost',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'task', 'commit + push uncommitted React rename (Darrell owner)',
           'computed_at', v_now
         ),
         'pending',
         'Darrell to commit + push the staged React rename batch'
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_react_rewire
  );

  -- VerifyBalances + numeric sync — DONE history
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes,
    disposition_at, disposition_by
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_verifybalances,
         10.0,
         jsonb_build_object(
           'urgency_score', 10, 'urgency_basis', 'was blocking everything until shipped',
           'dollar_friction', 1.0, 'dollar_basis', 'no cost',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'status_at_seed', 'SHIPPED',
           'historical_artifact', '_restore-from-head-2026-05-25.bat + schema-v1.2-numeric-sync.sql applied',
           'computed_at', v_now
         ),
         'approved',
         'SHIPPED — seeded as closed for honest history capture',
         v_now, v_darrell_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_verifybalances
  );

  -- Counseling tab MVP — waiting on Christina's 6 answers
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_counseling,
         5.0,
         jsonb_build_object(
           'urgency_score', 4, 'urgency_basis', 'post-vacation work; Q-answers gating',
           'dollar_friction', 1.0, 'dollar_basis', 'no cost yet',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'blocked_by', '6 product-shape answers from Christina (Q2,Q3,Q4,Q5,Q6,Q9)',
           'computed_at', v_now
         ),
         'deferred-next-cycle',
         'Non-blocking for vacation week; carried into post-vacation cycle'
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_counseling
  );

  -- Resend SMTP setup
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_resend,
         8.0,
         jsonb_build_object(
           'urgency_score', 8, 'urgency_basis', 'magic-link auth needs working SMTP',
           'dollar_friction', 1.0, 'dollar_basis', 'Resend free tier covers vacation-week volume',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'task', 'Darrell 60-sec signup at https://resend.com with darrellpoe06@gmail.com',
           'computed_at', v_now
         ),
         'pending',
         'Darrell to complete signup; Resend session continues after'
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_resend
  );

  -- Trust ownership architecture — needs lawyer verify
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_trust,
         6.0,
         jsonb_build_object(
           'urgency_score', 5, 'urgency_basis', 'post-vacation; lawyer verify needed before legal_structure_notes go live',
           'dollar_friction', 1.0, 'dollar_basis', 'no cost yet',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'task', 'user/lawyer verify legal structure notes per disclaimer pattern',
           'computed_at', v_now
         ),
         'deferred-next-cycle',
         'Architecture captured; lawyer verify is post-vacation work'
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_trust
  );

  -- Parallel frameworks eval — in flight
  INSERT INTO cycle_items (
    instance_id, created_by, cycle_id, item_kind, item_id,
    priority_score, priority_factors, disposition, disposition_notes
  )
  SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_parallel,
         8.4,
         jsonb_build_object(
           'urgency_score', 9, 'urgency_basis', 'unblocks Stack B build sequence',
           'dollar_friction', 1.0, 'dollar_basis', 'doc work; no cost',
           'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
           'doc', 'docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md',
           'computed_at', v_now
         ),
         'approved',
         'Stack B is the chosen vacation-week path'
  WHERE NOT EXISTS (
    SELECT 1 FROM cycle_items WHERE cycle_id = v_cycle_id AND item_kind = 'project' AND item_id = v_proj_parallel
  );

  -- -------------------------------------------------------------------
  -- NOTIFICATION PREFERENCES + NOTIFICATIONS
  -- -------------------------------------------------------------------
  -- Christina: in-app immediate alert on any change_request she owns.
  -- Darrell: in-app immediate alert on cycle-board updates; push channel
  --   stub for Pushover wired post-approval.
  -- Notifications: one per pending change_request, targeted at Christina.
  -- -------------------------------------------------------------------

  IF v_christina_user_id IS NOT NULL THEN
    INSERT INTO notification_preferences (
      instance_id, created_by, target_user_id, kind, channel, lead_times, enabled
    )
    SELECT v_instance_id, v_darrell_user_id, v_christina_user_id,
           'cycle-board-ready', 'in-app',
           ARRAY['00:00:00'::interval], true
    WHERE NOT EXISTS (
      SELECT 1 FROM notification_preferences
      WHERE target_user_id = v_christina_user_id AND kind = 'cycle-board-ready' AND channel = 'in-app'
    );

    -- One queued notification per pending change_request assigned to Christina
    INSERT INTO notifications (
      instance_id, created_by, target_user_id, kind, channel, deliver_at,
      title, body, action_label, action_uri, priority, dedupe_key, status,
      linked_entity_kind, linked_entity_id
    )
    SELECT v_instance_id, v_darrell_user_id, v_christina_user_id,
           'cycle-board-ready', 'in-app', v_now,
           'Family project board: 3 items awaiting your approval',
           E'Three change_requests are routed to you for spouse-approval as part of the ' ||
           E'2026-05-25 Vacation Prep cycle:\n' ||
           E'  • Pushover license ($5 one-time)\n' ||
           E'  • USB external 4 TB drive ($50-80 one-time)\n' ||
           E'  • Offsite backup path decision (default-lean $0/mo)\n\n' ||
           E'Synology RAM upgrade is conditional and waiting on Darrell to verify current RAM.',
           'Open family project board',
           '/projects?cycle=vacation-prep-2026-05-25',
           'high',
           'seed-2026-05-25-vacation-prep-christina-digest',
           'queued',
           'review_cycle', v_cycle_id
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications WHERE dedupe_key = 'seed-2026-05-25-vacation-prep-christina-digest'
    );
  END IF;

  -- Darrell: in-app preference + push stub (Pushover topic ID is a placeholder;
  -- replaced once Pushover is licensed and the user-key + app-token are wired).
  INSERT INTO notification_preferences (
    instance_id, created_by, target_user_id, kind, channel, lead_times, enabled
  )
  SELECT v_instance_id, v_darrell_user_id, v_darrell_user_id,
         'change-due-soon', 'in-app',
         ARRAY['00:00:00'::interval, '01:00:00'::interval, '24:00:00'::interval], true
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE target_user_id = v_darrell_user_id AND kind = 'change-due-soon' AND channel = 'in-app'
  );

  INSERT INTO notification_channels (
    instance_id, created_by, target_user_id, channel, address, preferred, status
  )
  SELECT v_instance_id, v_darrell_user_id, v_darrell_user_id,
         'push',
         'pushover://PLACEHOLDER-user-key-replace-after-license',
         true,
         'paused'
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_channels
    WHERE target_user_id = v_darrell_user_id AND channel = 'push'
      AND address LIKE 'pushover://%'
  );

  RAISE NOTICE 'seed-2026-05-25-projects: complete. instance=%, cycle=%, projects=8, change_requests=4', v_instance_id, v_cycle_id;
END
$seed$;

COMMIT;

-- =====================================================================
-- End of seed-2026-05-25-projects.sql
-- =====================================================================
