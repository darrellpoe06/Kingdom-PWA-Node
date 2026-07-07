-- =============================================================================
-- 0084 — Moore Divahs sewing classes: sessions + paid-seat signups
-- =============================================================================
-- Discovery 2026-07-07 (Shay's own rules, verbatim): group classes $45 with a
-- HARD CAP of 10 ("so I can control the classroom"); one-on-one $75 for 2.5
-- hours, booked at least two weeks out; dates set ~a month ahead; machines +
-- materials provided; and PAYMENT IN ADVANCE TO BOOK THE SEAT — a signup row
-- with no paid_at holds NOTHING. Seats-left is derived from PAID signups only
-- (never a stored count — honest derivation, DR-0076). Group classes are her
-- best seller; the engine rules live in app/src/lib/moore-divahs.js.
--
-- NO PAYMENT DATA: paid_at + pay_method record that/how Shay collected
-- (Square / Venmo / Apple Pay — the owner's hand). No card/bank columns exist.
--
-- TENANT-SCOPED / NO LEAK: same posture as 0083 custom_orders. NO anon policy;
-- the future customer door signs up through a forced-safe RPC, never direct.
--
-- DEPENDS ON: schema-v2.1-infra, 0024 (grants restore), 0011/0023 (touch fn).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger,
--             guarded publication add.
-- =============================================================================

CREATE TABLE IF NOT EXISTS class_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id),
  slug         text NOT NULL,                       -- stable local id ('mc-...')
  format       text NOT NULL DEFAULT 'group' CHECK (format IN ('group','one-on-one')),
  project      text,                                -- a different project each time
  date_iso     timestamptz,                         -- the class date (set ~a month out)
  location     text,                                -- varies; Shay travels
  price_cents  integer NOT NULL DEFAULT 4500,       -- $45 group / $75 one-on-one defaults; Shay-editable
  seat_cap     integer NOT NULL DEFAULT 10,         -- structural hard cap (engine clamps to format max)
  seed         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS class_signups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                      -- stable local id ('ms-...')
  session_slug  text NOT NULL,                      -- the class_sessions.slug this seat belongs to
  student_name  text NOT NULL DEFAULT '',
  contact_value text,                               -- handle/email — contact-level only
  paid_at       timestamptz,                        -- NULL = holds NOTHING (payment books the seat)
  pay_method    text,                               -- square/venmo/apple-pay/cash/other — a record, never processing
  seed          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS class_sessions_instance_idx ON class_sessions(instance_id);
CREATE INDEX IF NOT EXISTS class_sessions_date_idx     ON class_sessions(date_iso);
CREATE UNIQUE INDEX IF NOT EXISTS class_sessions_slug_uniq ON class_sessions(instance_id, slug);

CREATE INDEX IF NOT EXISTS class_signups_instance_idx ON class_signups(instance_id);
CREATE INDEX IF NOT EXISTS class_signups_session_idx  ON class_signups(session_slug);
CREATE UNIQUE INDEX IF NOT EXISTS class_signups_slug_uniq ON class_signups(instance_id, slug);

DROP TRIGGER IF EXISTS class_sessions_touch_updated ON class_sessions;
CREATE TRIGGER class_sessions_touch_updated
  BEFORE UPDATE ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
DROP TRIGGER IF EXISTS class_signups_touch_updated ON class_signups;
CREATE TRIGGER class_signups_touch_updated
  BEFORE UPDATE ON class_signups
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- GRANTs (0024 posture): authenticated explicit; NOTHING to anon.
GRANT SELECT, INSERT, UPDATE, DELETE ON class_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON class_signups  TO authenticated;

ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_signups  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_sessions_read   ON class_sessions;
DROP POLICY IF EXISTS class_sessions_insert ON class_sessions;
DROP POLICY IF EXISTS class_sessions_update ON class_sessions;
DROP POLICY IF EXISTS class_sessions_delete ON class_sessions;
CREATE POLICY class_sessions_read ON class_sessions FOR SELECT
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY class_sessions_insert ON class_sessions FOR INSERT
  TO authenticated WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY class_sessions_update ON class_sessions FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY class_sessions_delete ON class_sessions FOR DELETE
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin'));

DROP POLICY IF EXISTS class_signups_read   ON class_signups;
DROP POLICY IF EXISTS class_signups_insert ON class_signups;
DROP POLICY IF EXISTS class_signups_update ON class_signups;
DROP POLICY IF EXISTS class_signups_delete ON class_signups;
CREATE POLICY class_signups_read ON class_signups FOR SELECT
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY class_signups_insert ON class_signups FOR INSERT
  TO authenticated WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY class_signups_update ON class_signups FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY class_signups_delete ON class_signups FOR DELETE
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- REALTIME — a seat paid at a class shows on the home laptop live.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'class_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE class_sessions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'class_signups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE class_signups;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';

-- Verify after apply (adversarial RLS probe, per the 0059/0083 pattern):
--   As anon:            GET /rest/v1/class_sessions?select=slug -> [] or 401
--   As a stranger auth: GET /rest/v1/class_signups?select=slug  -> []
--   As Shay/steward:    INSERT/SELECT succeed, scoped to the moore instance.
