-- =============================================================================
-- 0027 — conference_public_registrations: OPEN, no-login congregation sign-up
-- =============================================================================
-- Declared by Darrell 2026-06-16 (conference is THIS July; registration must open
-- AHEAD to the whole congregation): the synced Event Center (0023/0024) lets only
-- the ~4 allowlisted leaders, or people BG invites by email (join_church_instance,
-- 0014), register — everyone ELSE's RSVP fell to a device-only store and silently
-- never reached organizers. That is the named ship-gate failure. This opens a
-- PUBLIC, no-account registration path for the congregation.
--
-- PATTERN: this is the PROVEN app_interest model (0025 / the ?join link) applied to
-- conference sign-up — ANYONE may INSERT (the public ?register=1 form + the in-app
-- front door); only the church's OWNER/ADMIN (Darrell / Christina / BG) may READ /
-- manage the list. A registrant can NEVER read the roll back (no anon SELECT) — no
-- new logged-out exposure beyond their own submission.
--
-- WHY A SEPARATE TABLE (not event_participants): event_participants is the lean
-- internal organizer roll (per-session capacity, choir-linked services) and its
-- INSERT policy requires auth.uid(). A public registration carries richer intake
-- (email/phone/days/party) and NO identity. Keeping it separate means zero change
-- to the internal RLS and zero new anon reach to any church-internal table. The
-- organizer view reads BOTH (headcount/meals here; capacity there).
--
-- NO LEAK: instance_id is FORCED to the COLG instance by a BEFORE-INSERT trigger
-- (SECURITY DEFINER) so an anon client cannot misroute a row to another church;
-- READ is gated by user_role_in_instance(instance_id) IN ('owner','admin') — the
-- exact instance-scoped pattern proven on 0023 + conference-rls-noleak. RLS stays
-- ENABLED; a table GRANT only lets a role REACH the table, never bypass a policy.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_in_instance,
--             user_role_in_instance), 0012 (the 'colg' instance).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP-then-CREATE
--             policies/trigger, guarded publication add. Tier C (anon-write
--             surface) — ship reviewed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS conference_public_registrations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  conference_name  text,                              -- denormalized label shown on the form
  name             text NOT NULL,
  email            text,
  phone            text,
  meal_type        text NOT NULL DEFAULT 'Regular',
  dietary          text,                              -- allergy / specific need (always offered)
  days             text,                              -- which days attending (free text / csv)
  party_size       integer NOT NULL DEFAULT 1,
  source           text,                              -- 'public-link' | 'in-app' | ...
  status           text NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','confirmed','cancelled')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  updated_by       uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS conference_public_registrations_instance_idx
  ON conference_public_registrations(instance_id);
CREATE INDEX IF NOT EXISTS conference_public_registrations_created_idx
  ON conference_public_registrations(created_at DESC);

-- ---------------------------------------------------------------------------
-- Force instance_id to the COLG instance on insert, regardless of what an anon
-- client sends (so a public row can never be misrouted to another church). Runs
-- BEFORE the NOT NULL check. SECURITY DEFINER so its SELECT on instances is not
-- blocked by instances RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.conf_pub_reg_force_instance()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  NEW.instance_id := (SELECT id FROM instances WHERE slug = 'colg');
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS conf_pub_reg_force_instance_t ON conference_public_registrations;
CREATE TRIGGER conf_pub_reg_force_instance_t
  BEFORE INSERT ON conference_public_registrations
  FOR EACH ROW EXECUTE FUNCTION public.conf_pub_reg_force_instance();

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS conf_pub_reg_touch_updated ON conference_public_registrations;
CREATE TRIGGER conf_pub_reg_touch_updated
  BEFORE UPDATE ON conference_public_registrations
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore deliberately leaves `anon` untouched. So anon needs an EXPLICIT INSERT
-- grant (without it the public form 403s with 42501 — the Choir incident). RLS
-- still gates ROWS; the grant only lets the role reach the table. Self-contained.
-- ---------------------------------------------------------------------------
GRANT INSERT ON conference_public_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON conference_public_registrations TO authenticated;

ALTER TABLE conference_public_registrations ENABLE ROW LEVEL SECURITY;

-- INSERT: anyone (logged-out congregant included) may register. The trigger sets
-- instance_id; the client cannot influence routing.
DROP POLICY IF EXISTS conf_pub_reg_insert       ON conference_public_registrations;
-- READ / manage: ONLY the church owner/admin (Darrell / Christina / BG). No anon
-- SELECT policy exists, so a registrant can never read the roll back.
DROP POLICY IF EXISTS conf_pub_reg_admin_read    ON conference_public_registrations;
DROP POLICY IF EXISTS conf_pub_reg_admin_update  ON conference_public_registrations;
DROP POLICY IF EXISTS conf_pub_reg_admin_delete  ON conference_public_registrations;

CREATE POLICY conf_pub_reg_insert ON conference_public_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY conf_pub_reg_admin_read ON conference_public_registrations FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY conf_pub_reg_admin_update ON conference_public_registrations FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY conf_pub_reg_admin_delete ON conference_public_registrations FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so the organizer's registration list + meal counts update
-- live as the congregation signs up.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'conference_public_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conference_public_registrations;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
