-- =============================================================================
-- 0023 — app_interest: consented "I want the app / I'm having trouble" capture
-- =============================================================================
-- Darrell 2026-06-16: "I have people at my church who keep trying to download
-- this app and they have been having issues. I want to know WHO those people are
-- and ... send an invite." A browser install attempt carries NO identity, so this
-- is a CONSENTED interest form (people leave their name/email to get help + an
-- invite), not silent tracking — which keeps it inside DATA-AS-EMPOWERMENT.
--
-- Boundary (Darrell 2026-06-16, "all of this before me and my wife Christina"):
-- ONLY Darrell + Christina may read/manage the list. Anyone may SUBMIT (public
-- form); no one but those two can ever read it back. Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_interest (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  name             text,
  email            text,
  phone            text,
  platform         text,        -- ios | android | desktop | other
  user_agent       text,
  referrer         text,
  issue            text,        -- optional: what went wrong / what they need
  is_minor         boolean NOT NULL DEFAULT false,
  parent_confirmed boolean NOT NULL DEFAULT false,
  source           text,        -- where the submission came from (install-prompt, link, ...)
  signed_in_email  text,        -- only if they happened to already be signed in
  status           text NOT NULL DEFAULT 'new',  -- new | invited | installed | closed
  invited_at       timestamptz,
  invited_by       text,
  notes            text
);

CREATE INDEX IF NOT EXISTS app_interest_created_idx ON app_interest (created_at DESC);

ALTER TABLE app_interest ENABLE ROW LEVEL SECURITY;

-- Anyone (even unauthenticated visitors) may SUBMIT interest. They can NEVER read
-- it back — there is no SELECT policy for anon, so RLS denies reads by default.
DROP POLICY IF EXISTS app_interest_insert ON app_interest;
CREATE POLICY app_interest_insert ON app_interest FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only Darrell + Christina may READ / UPDATE / DELETE the list (the invite list).
DROP POLICY IF EXISTS app_interest_admin_read   ON app_interest;
DROP POLICY IF EXISTS app_interest_admin_update ON app_interest;
DROP POLICY IF EXISTS app_interest_admin_delete ON app_interest;
CREATE POLICY app_interest_admin_read ON app_interest FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com'));
CREATE POLICY app_interest_admin_update ON app_interest FOR UPDATE
  TO authenticated
  USING      ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com'))
  WITH CHECK ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com'));
CREATE POLICY app_interest_admin_delete ON app_interest FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('darrellpoe06@gmail.com', 'mrspoe06@gmail.com'));

NOTIFY pgrst, 'reload schema';
