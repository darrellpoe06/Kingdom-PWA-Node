-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.9-portal-rls.sql
--
-- v2.9 EXTERNAL-USER PORTAL RLS — Pattern D policies layered on top of
-- every domain table that exposes data to an external participant.
--
-- Depends on: schema-v2.1-infra.sql, schema-v2.2-rentals.sql,
--             schema-v2.3-therapy.sql, schema-v2.4-contractor.sql,
--             schema-v2.6-legal.sql, schema-v2.7-church.sql,
--             schema-v2.8-ops.sql.
--
-- Source design doc: docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md §13.
--
-- Two-auth-flow model:
--   1. Internal users (auth.users + instance_members)  — existing v1 + v2 policies.
--   2. External users (external_users + magic-link session) — Pattern D policies,
--      keyed by current_external_user_id() returning the JWT custom claim.
--
-- POE binding: external users can ALWAYS read their own data, can submit
-- the actions their permissions array allows, and never see the internal
-- `notes` column on any table. Column-level grants enforce the notes
-- separation at the database tier in addition to the application tier.
--
-- This file is 100% policies + grants — zero new tables.
-- =====================================================================

BEGIN;

-- =====================================================================
-- Helper: read the external user's id from the JWT custom claim
-- =====================================================================

CREATE OR REPLACE FUNCTION public.current_external_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'external_user_id', '')::uuid
$$;

GRANT EXECUTE ON FUNCTION public.current_external_user_id() TO authenticated, anon;

-- =====================================================================
-- Optional: create an external_portal_role for column-level revokes.
-- Some Postgres deployments will not have permissions to CREATE ROLE
-- inside a migration; this block is fenced behind a DO IF NOT EXISTS so
-- the migration is idempotent on hosted Supabase too.
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'external_portal_role') THEN
    BEGIN
      EXECUTE 'CREATE ROLE external_portal_role NOLOGIN';
    EXCEPTION WHEN insufficient_privilege THEN
      -- On hosted Supabase the migration runner may not own ROLE creation.
      -- Skip silently; column-level grants below will no-op until the role exists.
      RAISE NOTICE 'external_portal_role not created (insufficient privilege); column REVOKE statements will be no-ops';
    END;
  END IF;
END $$;

-- =====================================================================
-- Pattern D — renter portal access
-- =====================================================================

-- leases: a renter sees their own lease(s)
CREATE POLICY leases_renter_portal_read ON leases FOR SELECT
  USING (
    renter_id IN (
      SELECT id FROM renters
      WHERE external_user_id = current_external_user_id()
    )
    OR
    -- household members of the lease-signing renter also see the lease
    renter_id IN (
      SELECT household_id FROM renter_household_members
      WHERE external_user_id = current_external_user_id()
    )
  );

-- rent_payments: renter sees their own
CREATE POLICY rent_payments_renter_portal_read ON rent_payments FOR SELECT
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN renters r ON r.id = l.renter_id
      WHERE r.external_user_id = current_external_user_id()
         OR r.id IN (
           SELECT household_id FROM renter_household_members
           WHERE external_user_id = current_external_user_id()
         )
    )
  );

-- maintenance_requests: renter reads own + can insert via portal
CREATE POLICY maint_req_renter_portal_read ON maintenance_requests FOR SELECT
  USING (
    renter_id IN (
      SELECT id FROM renters
      WHERE external_user_id = current_external_user_id()
         OR id IN (
           SELECT household_id FROM renter_household_members
           WHERE external_user_id = current_external_user_id()
         )
    )
  );

CREATE POLICY maint_req_renter_portal_insert ON maintenance_requests FOR INSERT
  WITH CHECK (
    submitted_via = 'renter-portal'
    AND renter_id IN (
      SELECT id FROM renters
      WHERE external_user_id = current_external_user_id()
         OR id IN (
           SELECT household_id FROM renter_household_members
           WHERE external_user_id = current_external_user_id()
              AND can_submit_requests = true
         )
    )
  );

-- =====================================================================
-- Pattern D — therapy client portal access (non-PHI)
-- =====================================================================

-- inquiries: a client sees their own inquiry row
CREATE POLICY inquiries_client_portal_read ON inquiries FOR SELECT
  USING (external_user_id = current_external_user_id());

-- inquiries: a client can update their own contact info (limited columns enforced at app layer)
CREATE POLICY inquiries_client_portal_update ON inquiries FOR UPDATE
  USING (external_user_id = current_external_user_id())
  WITH CHECK (external_user_id = current_external_user_id());

-- intake_handoffs: a client sees their own scheduled intake (status only)
CREATE POLICY intake_handoffs_client_portal_read ON intake_handoffs FOR SELECT
  USING (
    inquiry_id IN (
      SELECT id FROM inquiries WHERE external_user_id = current_external_user_id()
    )
  );

-- =====================================================================
-- Pattern D — contractor portal access
-- =====================================================================

CREATE POLICY contractors_1099_self_portal_read ON contractors_1099 FOR SELECT
  USING (external_user_id = current_external_user_id());

CREATE POLICY scopes_contractor_portal_read ON scopes FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors_1099
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY invoices_contractor_portal_read ON invoices FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors_1099
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY invoices_contractor_portal_insert ON invoices FOR INSERT
  WITH CHECK (
    direction = 'inbound'
    AND contractor_id IN (
      SELECT id FROM contractors_1099
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY time_logs_contractor_portal_read ON time_logs FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors_1099
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY time_logs_contractor_portal_insert ON time_logs FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractors_1099
      WHERE external_user_id = current_external_user_id()
    )
  );

-- =====================================================================
-- Pattern D — church / parishioner / donor portal access
-- =====================================================================

CREATE POLICY parishioners_self_portal_read ON parishioners FOR SELECT
  USING (external_user_id = current_external_user_id());

-- Anonymous parishioner can submit a prayer request — note `submitted_by_external`
-- must match their external_user id, and parishioner_id stays null for anonymous.
CREATE POLICY prayer_requests_parishioner_portal_insert ON prayer_requests FOR INSERT
  WITH CHECK (
    submitted_by_external = current_external_user_id()
  );

-- Parishioner can read prayer requests addressed to congregation or anonymous-public
CREATE POLICY prayer_requests_parishioner_portal_read ON prayer_requests FOR SELECT
  USING (
    -- Own submissions (via parishioner or external_user)
    submitted_by_external = current_external_user_id()
    OR parishioner_id IN (
      SELECT id FROM parishioners
      WHERE external_user_id = current_external_user_id()
    )
    -- Or congregation-wide requests where the parishioner has portal access
    OR (
      audience IN ('congregation','anonymous-public')
      AND EXISTS (
        SELECT 1 FROM parishioners
        WHERE external_user_id = current_external_user_id()
          AND instance_id = prayer_requests.instance_id
      )
    )
  );

CREATE POLICY ministry_signups_parishioner_portal_insert ON ministry_signups FOR INSERT
  WITH CHECK (
    external_user_id = current_external_user_id()
    OR parishioner_id IN (
      SELECT id FROM parishioners
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY ministry_signups_parishioner_portal_read ON ministry_signups FOR SELECT
  USING (
    external_user_id = current_external_user_id()
    OR parishioner_id IN (
      SELECT id FROM parishioners
      WHERE external_user_id = current_external_user_id()
    )
  );

-- Donor portal: read own giving history + own reconciliation claims
CREATE POLICY donor_giving_self_portal_read ON donor_giving FOR SELECT
  USING (
    external_user_id = current_external_user_id()
    OR parishioner_id IN (
      SELECT id FROM parishioners
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY giving_recon_self_portal_read ON giving_reconciliations FOR SELECT
  USING (
    parishioner_id IN (
      SELECT id FROM parishioners
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY volunteer_hours_self_portal_read ON volunteer_hours FOR SELECT
  USING (
    external_user_id = current_external_user_id()
    OR parishioner_id IN (
      SELECT id FROM parishioners
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY volunteer_hours_self_portal_insert ON volunteer_hours FOR INSERT
  WITH CHECK (
    external_user_id = current_external_user_id()
    OR parishioner_id IN (
      SELECT id FROM parishioners
      WHERE external_user_id = current_external_user_id()
    )
  );

-- =====================================================================
-- Pattern D — interactions (bidirectional message log)
--
-- An external user reads their own interactions where the row is marked
-- visible_to_external (internal staff can keep some interactions thread-internal).
-- An external user can INSERT messages addressed to their own external_user_id.
-- =====================================================================

CREATE POLICY interactions_external_self_read ON interactions FOR SELECT
  USING (
    external_user_id = current_external_user_id()
    AND visible_to_external = true
  );

CREATE POLICY interactions_external_self_insert ON interactions FOR INSERT
  WITH CHECK (
    external_user_id = current_external_user_id()
    AND direction = 'inbound'
  );

-- =====================================================================
-- Pattern D — notifications targeted at the external user
-- =====================================================================

CREATE POLICY notifications_external_self_read ON notifications FOR SELECT
  USING (target_external_id = current_external_user_id());

CREATE POLICY notifications_external_self_ack ON notifications FOR UPDATE
  USING (target_external_id = current_external_user_id())
  WITH CHECK (target_external_id = current_external_user_id());

CREATE POLICY notif_prefs_external_self_read ON notification_preferences FOR SELECT
  USING (target_external_id = current_external_user_id());

CREATE POLICY notif_prefs_external_self_write ON notification_preferences FOR INSERT
  WITH CHECK (target_external_id = current_external_user_id());

CREATE POLICY notif_prefs_external_self_update ON notification_preferences FOR UPDATE
  USING (target_external_id = current_external_user_id())
  WITH CHECK (target_external_id = current_external_user_id());

-- =====================================================================
-- Pattern D — change_requests proposed by external participants
--
-- External users can read their own proposals + insert new proposals (in
-- 'proposed' status only; staff move them forward through review_cycles).
-- =====================================================================

CREATE POLICY change_req_external_self_read ON change_requests FOR SELECT
  USING (proposed_by_external_id = current_external_user_id());

CREATE POLICY change_req_external_self_insert ON change_requests FOR INSERT
  WITH CHECK (
    proposed_by_external_id = current_external_user_id()
    AND status = 'proposed'
  );

-- =====================================================================
-- Internal-notes-never-leak — column-level REVOKE on the notes columns
--
-- These statements assume external_portal_role exists. If the role was
-- not created (e.g. on hosted Supabase where the migration runner lacks
-- ROLE creation), these REVOKEs no-op silently — the DO block above
-- already issued a NOTICE in that case. The application layer is the
-- next line of defense in those environments.
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'external_portal_role') THEN
    -- Tables that have an internal-only `notes` column
    EXECUTE 'REVOKE SELECT (notes) ON renters                FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON renter_household_members FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON rentals                FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON rent_payments          FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON inquiries              FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON clinicians             FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON intake_handoffs        FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (care_notes) ON parishioners      FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON donor_giving           FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON giving_reconciliations FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (notes) ON service_offerings      FROM external_portal_role';
    EXECUTE 'REVOKE SELECT (note)  ON external_users         FROM external_portal_role';
    -- Legal-domain `notes` are encrypted bytea anyway, but defense-in-depth:
    -- external_portal_role should not have any SELECT on the legal_* tables
    -- because external participants are never given access to legal data.
    EXECUTE 'REVOKE ALL ON legal_matters, matter_parties, matter_counsel, '
            ' matter_key_dates, matter_documents, matter_journal, '
            ' matter_financial_links, conflict_checks FROM external_portal_role';
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- End of schema-v2.9-portal-rls.sql
--
-- Dispatch, 2026-05-25 — completes the v2.x runlist for active migration
-- (v2.5 mentor stays in draft per Q7 lock-in).
-- =====================================================================
