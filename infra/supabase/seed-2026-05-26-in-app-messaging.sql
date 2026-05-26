-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — seed-2026-05-26-in-app-messaging.sql
--
-- DOGFOOD seed: adds project #9 ("In-app messaging Layer 1") and binds
-- it to the existing "Vacation Prep (ad-hoc)" review_cycle as a
-- deferred-next-cycle item so the post-vacation work stays tracked.
--
-- Per §12.5: every project goes into the app. This captures the
-- discipline that "we know it's coming, we're not pretending it's done."
--
-- DEPENDS ON: schema-v1.sql + schema-v1.1-tenant-join.sql + schema-v1.2-
--             numeric-sync.sql + schema-v2.1-infra.sql + schema-v2.8-ops.sql
--             must be applied, AND seed-2026-05-25-projects.sql must have
--             already created the 'Vacation Prep (ad-hoc)' cadence + cycle.
--
-- IDEMPOTENCY: ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL
--              guards the project insert; WHERE NOT EXISTS guards the
--              cycle_item. Safe to re-run.
--
-- POE BINDING: cycle_item disposition = 'deferred-next-cycle' (non-punitive).
--              Project status = 'planning' (the v1 enum value for not-yet-
--              started work). The POE-language disposition lives on the
--              cycle_item, not on the project row.
--
-- Design doc:   docs/00-foundations/IN-APP-MESSAGING-LAYER-1-DESIGN.md
-- Future schema: infra/supabase/schema-v2.10-messaging.sql (v2.9 is taken
--                by portal-rls; messaging slots in at v2.10)
-- Implementation: post-vacation, 4 phases over weeks 1-4.
-- =====================================================================

BEGIN;

DO $seed$
DECLARE
  v_instance_id        uuid;
  v_darrell_user_id    uuid;

  v_cadence_id         uuid;
  v_cycle_id           uuid;
  v_proj_messaging     uuid;

  v_now                timestamptz := now();
  v_today              date        := current_date;
BEGIN
  -- -------------------------------------------------------------------
  -- Resolve principals
  -- -------------------------------------------------------------------
  SELECT id INTO v_instance_id FROM instances WHERE slug = 'poe-family';
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'seed-2026-05-26-in-app-messaging: poe-family instance not found; run schema-v1.sql first';
  END IF;

  SELECT id INTO v_darrell_user_id
    FROM auth.users
   WHERE lower(email) = 'darrellpoe06@gmail.com'
   LIMIT 1;
  IF v_darrell_user_id IS NULL THEN
    RAISE EXCEPTION 'seed-2026-05-26-in-app-messaging: darrellpoe06@gmail.com not in auth.users; sign in once at the app before seeding';
  END IF;

  -- Resolve the Vacation Prep cadence + cycle from seed-2026-05-25-projects.sql.
  -- Soft-tolerate: if cycle isn't found, project still seeds, only the
  -- cycle_item binding is skipped (with a NOTICE so it's visible).
  SELECT id INTO v_cadence_id
    FROM review_cadences
   WHERE instance_id = v_instance_id
     AND cadence_name = 'Vacation Prep (ad-hoc)'
   LIMIT 1;

  IF v_cadence_id IS NOT NULL THEN
    SELECT id INTO v_cycle_id
      FROM review_cycles
     WHERE cadence_id = v_cadence_id
       AND agenda_notes LIKE '[seed:2026-05-25-vacation-prep]%'
     LIMIT 1;
  END IF;

  RAISE NOTICE 'seed-2026-05-26-in-app-messaging: instance=%, darrell=%, cadence=%, cycle=%',
    v_instance_id, v_darrell_user_id, v_cadence_id, v_cycle_id;

  -- -------------------------------------------------------------------
  -- PROJECT #9: In-app messaging Layer 1
  -- -------------------------------------------------------------------
  INSERT INTO projects (instance_id, created_by, title, slug, status, domain,
                        description, start_date, end_date)
  VALUES (
    v_instance_id, v_darrell_user_id,
    'In-app messaging Layer 1',
    'in-app-messaging-layer-1-2026-05-26',
    'planning', 'tech-business',
    E'Sovereign text-like messaging inside the PWA. Schema additions for ' ||
    E'conversations + conversation_members + messages + message_attachments + ' ||
    E'message_reactions + RLS. Push fan-out via n8n to Pushover (Darrell) + ' ||
    E'ntfy (family) + Resend email digest (Layer 3). TLC instance gets ' ||
    E'HIPAA-adjacent encryption-at-rest reusing the v2.6 legal client-side ' ||
    E'AES-GCM pattern, with hash-chained audit_log on every read and PIN ' ||
    E'unlock from the Council Chamber pattern.\n\n' ||
    E'Design doc: docs/00-foundations/IN-APP-MESSAGING-LAYER-1-DESIGN.md\n' ||
    E'Future schema: infra/supabase/schema-v2.10-messaging.sql ' ||
    E'(v2.9 is taken by portal-rls; messaging slots in at v2.10)\n' ||
    E'Companion (future) n8n workflow: infra/n8n/workflows/messaging-fanout.json\n\n' ||
    E'Surface lives as a "Messages" SECTION inside the existing Incoming ' ||
    E'tab of the PWA shell (decided 2026-05-26 — Incoming is the ' ||
    E'"things waiting for me" surface; conversations belong there).\n\n' ||
    E'Layer map:\n' ||
    E'  Layer 1 (THIS PROJECT): In-app PWA messaging — design complete, ' ||
    E'implementation deferred post-vacation.\n' ||
    E'  Layer 2: SMS opt-in via Twilio — per-user, budget-capped, future.\n' ||
    E'  Layer 3: Email digest via Resend — in flight; repurpose as ' ||
    E'missed-messages digest.\n' ||
    E'  Layer 4: Matrix self-hosted on Synology — Phase 2 sovereignty ' ||
    E'maximalist, no calendar commit.\n\n' ||
    E'Implementation phasing (post-vacation):\n' ||
    E'  Phase 1A (week 1): Schema + RLS + CRUD RPCs (~2 days)\n' ||
    E'  Phase 1B (week 2): PWA UI under Incoming → Messages (~3 days)\n' ||
    E'  Phase 1C (week 3): n8n messaging-fanout workflow (~1 day)\n' ||
    E'  Phase 1D (week 4): TLC encryption + audit + family onboarding + ' ||
    E'APNs shim spike (build-or-issue per sustainability gate) (~3 days + 1 day spike)\n\n' ||
    E'All 11 open design decisions resolved 2026-05-26 — see §10 of ' ||
    E'the design doc.',
    v_today + interval '6 days',  -- start: day Darrell returns
    NULL                          -- end: open (multi-week project)
  )
  ON CONFLICT (instance_id, slug) WHERE slug IS NOT NULL DO NOTHING;

  SELECT id INTO v_proj_messaging
    FROM projects
   WHERE instance_id = v_instance_id
     AND slug = 'in-app-messaging-layer-1-2026-05-26'
   LIMIT 1;

  -- -------------------------------------------------------------------
  -- CYCLE ITEM: bind to Vacation Prep with disposition='deferred-next-cycle'
  -- -------------------------------------------------------------------
  -- Captures the discipline: we know this work is coming. It is NOT
  -- pretending to be done. The cycle_item exists so the Vacation Prep
  -- board surfaces it as deferred-next-cycle rather than ghosting it.
  -- -------------------------------------------------------------------
  IF v_cycle_id IS NOT NULL AND v_proj_messaging IS NOT NULL THEN
    INSERT INTO cycle_items (
      instance_id, created_by, cycle_id, item_kind, item_id,
      priority_score, priority_factors, disposition, disposition_notes
    )
    SELECT v_instance_id, v_darrell_user_id, v_cycle_id, 'project', v_proj_messaging,
           6.0,
           jsonb_build_object(
             'urgency_score', 4, 'urgency_basis', 'post-vacation work; design complete, implementation not on the critical path for departure',
             'dollar_friction', 1.0, 'dollar_basis', 'no incremental spend — uses existing Supabase + Synology n8n + ntfy + Pushover stack',
             'formula', 'urgency * 0.6 + dollar_friction * 10 * 0.4',
             'computed_at', v_now,
             'design_status', 'complete',
             'decisions_resolved', 11,
             'phasing', jsonb_build_array('1A','1B','1C','1D'),
             'phase_estimate_days', 10
           ),
           'deferred-next-cycle',
           E'Design complete 2026-05-26 (docs/00-foundations/IN-APP-MESSAGING-LAYER-1-DESIGN.md). ' ||
           E'Implementation deferred to post-vacation weeks 1-4 (~10 working days total). ' ||
           E'Picks up active status when post-vacation Phase 1A begins.'
    WHERE NOT EXISTS (
      SELECT 1 FROM cycle_items
       WHERE cycle_id = v_cycle_id
         AND item_kind = 'project'
         AND item_id = v_proj_messaging
    );
  ELSE
    RAISE NOTICE 'seed-2026-05-26-in-app-messaging: cycle_item skipped (cycle_id=% project_id=%); project still seeded.',
      v_cycle_id, v_proj_messaging;
  END IF;

  RAISE NOTICE 'seed-2026-05-26-in-app-messaging: COMPLETE. project_id=%', v_proj_messaging;

END;
$seed$;

COMMIT;

-- ---------------------------------------------------------------------
-- VERIFY (read-only — uncomment to inspect after paste-and-run)
-- ---------------------------------------------------------------------
-- SELECT id, title, slug, status, domain, start_date, end_date
--   FROM projects
--  WHERE slug = 'in-app-messaging-layer-1-2026-05-26';
--
-- SELECT rc.cycle_start, p.title AS project, ci.disposition, ci.priority_score, ci.disposition_notes
--   FROM cycle_items ci
--   JOIN review_cycles rc ON rc.id = ci.cycle_id
--   JOIN projects p ON p.id = ci.item_id AND ci.item_kind = 'project'
--  WHERE p.slug = 'in-app-messaging-layer-1-2026-05-26';
-- =====================================================================
-- End of seed.
-- =====================================================================
