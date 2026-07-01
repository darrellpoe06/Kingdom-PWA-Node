-- =============================================================================
-- 0062 — per-unit property management: landlord-private notes, PM as a third
--        participant, and assignable service requests
-- =============================================================================
-- Declared by Darrell 2026-07-01. The Real Estate module must be the actual
-- MANAGEMENT tool, not a viewer. 0055 already shipped the landlord<->tenant
-- backbone (rental_tenancies, tenant_maintenance_requests, tenant_messages,
-- tenant_notices, rent_records). This migration closes the three gaps that
-- stopped it being a real per-unit management surface:
--
--   1. property_notes — the landlord's OWN records per unit ("Landlords should
--      have records of their own to pull up for any necessary situation" —
--      room-memory decision 2026-06-11). PROPERTY MEMORY: instance-scoped
--      (owner/admin/member), NEVER tenant-visible, keyed to a unit door
--      (rental_ref) so a note attaches to the specific apartment and persists.
--
--   2. tenant_messages / tenant_maintenance_requests gain the PROPERTY MANAGER
--      as a first-class participant. Today a tenant text ("Adrianna Johnson,
--      apartment 3, porch smoking") lives only in Christina's phone and the PM
--      helps only when asked. The thread + the request must carry a 'manager'
--      role so the exchange is captured, recorded, and searchable per unit.
--      The PM is an instance member (or scoped specialist) — the existing
--      member RLS already lets them read/insert; this only widens the role
--      vocabulary for attribution.
--
--   3. tenant_maintenance_requests gain assigned_to / assigned_to_label so a
--      request is ASSIGNABLE to the PM (open -> in-progress -> done, run by the
--      person accountable), turning the app into the management workflow, not a
--      display of it.
--
-- NO MONEY MOVES (unchanged from 0055). Inbound tenant text is DATA; SENDING an
-- outbound message stays a human-approved action in the app layer, never here.
--
-- DEPENDS ON: 0055 (rental_tenancies, tenant_messages, tenant_maintenance_requests,
--             user_is_tenant, user_role_in_instance), 0024 (authenticated grants),
--             0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, guarded constraint swap (DROP then ADD by
--             the postgres default name), ADD COLUMN IF NOT EXISTS, DROP-then-CREATE
--             policies, guarded publication add. Additive; family-internal +
--             tenant-scoped, no anon. Governed by DR-0084 (self-applying lane).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. property_notes — landlord-private per-unit memory. Instance-scoped only;
--    a tenant is NOT granted read (this is the landlord's own record, distinct
--    from tenant_notices which the tenant reads). rental_ref keys the note to a
--    specific door so per-unit notes attach and persist across tenant turnover.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  rental_ref    text NOT NULL,                         -- the unit/door local id (rentals[].id)
  unit_label    text,                                  -- denormalized for display (e.g. 'Apt 3')
  body          text NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 8000),
  kind          text NOT NULL DEFAULT 'general'
                  CHECK (kind IN ('general','maintenance','tenant','financial','inspection','follow-up')),
  pinned        boolean NOT NULL DEFAULT false,
  note_date     date,                                  -- the date the note is ABOUT (RecordsLog axis)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);
CREATE INDEX IF NOT EXISTS property_notes_instance_idx ON property_notes(instance_id);
CREATE INDEX IF NOT EXISTS property_notes_rental_idx ON property_notes(instance_id, rental_ref);

DROP TRIGGER IF EXISTS property_notes_touch_updated ON property_notes;
CREATE TRIGGER property_notes_touch_updated
  BEFORE UPDATE ON property_notes
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON property_notes TO authenticated;
ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_notes_read   ON property_notes;
DROP POLICY IF EXISTS property_notes_insert ON property_notes;
DROP POLICY IF EXISTS property_notes_update ON property_notes;
DROP POLICY IF EXISTS property_notes_delete ON property_notes;
-- Landlord side only. A tenant is deliberately NOT granted read: this is the
-- landlord's private record. (Tenant-facing posts are tenant_notices, 0055.)
CREATE POLICY property_notes_read ON property_notes FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY property_notes_insert ON property_notes FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY property_notes_update ON property_notes FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY property_notes_delete ON property_notes FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 2. Add 'manager' (property manager) to the role vocabularies so a PM's
--    messages + the requests they file are attributed correctly. The PM's READ/
--    WRITE access is already covered by the existing 'member' RLS in 0055 (a PM
--    is an instance member or scoped specialist); this only widens the CHECK so
--    from_role/created_by_role can record who acted. Postgres named the inline
--    0055 CHECKs <table>_<column>_check; swap them by that name.
-- ---------------------------------------------------------------------------
ALTER TABLE tenant_messages DROP CONSTRAINT IF EXISTS tenant_messages_from_role_check;
ALTER TABLE tenant_messages ADD CONSTRAINT tenant_messages_from_role_check
  CHECK (from_role IN ('tenant','landlord','manager'));

ALTER TABLE tenant_maintenance_requests DROP CONSTRAINT IF EXISTS tenant_maintenance_requests_created_by_role_check;
ALTER TABLE tenant_maintenance_requests ADD CONSTRAINT tenant_maintenance_requests_created_by_role_check
  CHECK (created_by_role IN ('tenant','landlord','manager'));

-- ---------------------------------------------------------------------------
-- 3. Make a service request ASSIGNABLE. assigned_to is the account made
--    accountable (typically the PM); assigned_to_label is denormalized so the
--    board reads even before the PM has an account linked.
-- ---------------------------------------------------------------------------
ALTER TABLE tenant_maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
ALTER TABLE tenant_maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to_label text;
CREATE INDEX IF NOT EXISTS tenant_maintenance_requests_assigned_idx
  ON tenant_maintenance_requests(instance_id, assigned_to);

-- ---------------------------------------------------------------------------
-- Realtime: add property_notes to the publication (guarded).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE property_notes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
