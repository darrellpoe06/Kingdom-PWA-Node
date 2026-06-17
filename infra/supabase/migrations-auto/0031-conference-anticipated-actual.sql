-- =============================================================================
-- 0031 — Conference ANTICIPATED vs ACTUAL: event-day check-in + served/used actuals
-- =============================================================================
-- The conference engine already holds the ANTICIPATED side (the projection): open
-- congregation sign-ups (conference_public_registrations, 0027 — headcount +
-- meal_type/dietary + party_size) and the internal organizer roll with per-session
-- capacity (event_participants / event_sessions / event_center_resources, 0023).
-- What was missing is the ACTUAL side — who really WALKED IN, how many meals were
-- really SERVED, how full each room really GOT — and the side-by-side VARIANCE so
-- the kitchen, room capacity, and staffing aren't guessing. This migration adds
-- exactly that, additively, with zero change to the existing projection tables'
-- shapes or RLS.
--
-- TWO additions:
--   1. CHECK-IN on the public registration roll — checked_in_at + checked_in_heads
--      columns on conference_public_registrations. A registration is the ANTICIPATED
--      record; setting checked_in_at (with how many of the party actually came) is
--      the ACTUAL arrival. NULL checked_in_at = not arrived yet / a no-show. This is
--      the data behind the no-show rate. The existing owner/admin UPDATE policy +
--      GRANT (0027) already cover these new columns — no policy change.
--   2. conference_actuals — a small, instance-scoped log of ACTUAL counts that are
--      NOT derivable from check-in: meals actually SERVED (per meal type) and rooms
--      actually USED (peak/observed occupancy). One row per (conference, scope, key).
--      The live variance view reads it beside the registration projection. Persisted
--      so projection-accuracy can be reviewed AFTER the event (feeds the learning
--      loop once re-armed) — and useful NOW for the kitchen + capacity + staffing.
--
-- ACCESS: conference_actuals mirrors event_sessions (0023) exactly — read = any
-- instance member (user_in_instance); manage = owner/admin (user_role_in_instance).
-- Instance-scoped, no cross-instance leak (proven by conference-rls-guard, which
-- this file is added to). RLS stays ENABLED; the table GRANT only lets the role
-- REACH the table, never bypass a policy (the 0024/grant-guard lesson).
--
-- DEPENDS ON: 0023 (conferences, the shared engine + engagement_touch_updated_at),
--             0027 (conference_public_registrations).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, CREATE ... IF NOT EXISTS, CREATE OR
--             REPLACE, DROP-then-CREATE policies/trigger, guarded publication add.
--             Safe to re-run. Tier C (conference-critical; touches registration
--             data) — ship reviewed, gates green.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CHECK-IN columns on the public registration roll (the ACTUAL arrival).
--    checked_in_at NULL = not arrived (a no-show once the event passes).
--    checked_in_heads = how many of the party actually came (defaults to the
--    party_size on check-in; a greeter can record fewer if some didn't show).
-- ---------------------------------------------------------------------------
ALTER TABLE conference_public_registrations
  ADD COLUMN IF NOT EXISTS checked_in_at    timestamptz;
ALTER TABLE conference_public_registrations
  ADD COLUMN IF NOT EXISTS checked_in_heads integer;
-- Fast "who's already checked in" filter on the check-in surface.
CREATE INDEX IF NOT EXISTS conference_public_registrations_checkedin_idx
  ON conference_public_registrations(checked_in_at);

-- ---------------------------------------------------------------------------
-- 2. conference_actuals — ACTUAL counts not derivable from check-in.
--    scope:  'event'   — whole-event actual headcount (optional snapshot)
--            'meal'    — meals actually SERVED;  ref_key = meal type ('Regular'…)
--            'room'    — room peak/observed USE; ref_key = room id (uuid text)
--            'session' — session actual headcount; ref_key = session id (uuid text)
--    ref_key is ALWAYS populated (the meal type, the id, or 'event') so a single
--    row exists per (conference, scope, ref_key) — see the unique index below.
--    anticipated carries the projection captured at record time (historical truth,
--    so a later review compares like-for-like even if registrations changed after).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conference_actuals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  conference_id uuid REFERENCES conferences(id) ON DELETE CASCADE,
  scope         text NOT NULL CHECK (scope IN ('event','meal','room','session')),
  ref_key       text NOT NULL DEFAULT 'event',   -- meal type / room id / session id / 'event'
  label         text,                            -- display label snapshot (e.g. room name)
  anticipated   integer,                         -- projection snapshot at record time
  actual        integer NOT NULL DEFAULT 0,      -- the real count served / used / arrived
  notes         text,
  recorded_by   uuid REFERENCES auth.users(id),
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS conference_actuals_instance_idx
  ON conference_actuals(instance_id);
CREATE INDEX IF NOT EXISTS conference_actuals_conference_idx
  ON conference_actuals(instance_id, conference_id);
-- One actual per (conference, scope, ref_key): a re-record UPDATES rather than
-- piling up duplicate rows. ref_key NOT NULL makes this unique index total.
CREATE UNIQUE INDEX IF NOT EXISTS conference_actuals_unique_scope
  ON conference_actuals(conference_id, scope, ref_key);

-- ---------------------------------------------------------------------------
-- 3. GRANTs — authenticated must REACH the table (the 0024 / grant-guard lesson;
--    this project lost the Supabase-default per-role grants). RLS still gates ROWS.
--    No anon grant: actuals are organizer-internal, never a public surface.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON conference_actuals TO authenticated;

ALTER TABLE conference_actuals ENABLE ROW LEVEL SECURITY;

-- RLS — mirrors event_sessions (0023): members read; owner/admin manage.
DROP POLICY IF EXISTS conference_actuals_read   ON conference_actuals;
DROP POLICY IF EXISTS conference_actuals_write  ON conference_actuals;
DROP POLICY IF EXISTS conference_actuals_update ON conference_actuals;
DROP POLICY IF EXISTS conference_actuals_delete ON conference_actuals;
CREATE POLICY conference_actuals_read   ON conference_actuals FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY conference_actuals_write  ON conference_actuals FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY conference_actuals_update ON conference_actuals FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY conference_actuals_delete ON conference_actuals FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- updated_at touch (reuses the shared function from 0011/0023).
DROP TRIGGER IF EXISTS conference_actuals_touch_updated ON conference_actuals;
CREATE TRIGGER conference_actuals_touch_updated
  BEFORE UPDATE ON conference_actuals
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. REALTIME — stream conference_actuals so the variance view updates live as
--    staff record served/used numbers during the event.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'conference_actuals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conference_actuals;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
