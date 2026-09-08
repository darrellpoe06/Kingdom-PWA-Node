-- =============================================================================
-- 0184 -- The parishioner's OWN giving record (tithes, offerings, gifts)
-- =============================================================================
-- Darrell, 2026-09-08, from the live Love Corner door: "always have a give
-- button at the top so it's always there... so parishioners can give tithes
-- offerings and gifts... etc... also keep their history... etc..."
--
-- THE PREMISE THIS TABLE IS BUILT ON, STATED PLAINLY (DR-0076 / DR-0061 P15).
-- This app does NOT process payments and never will: the binding link-safety
-- rule in app/src/lib/giving.js says the Give surface only ever OPENS the
-- church's own published channels (Zelle, Cash App, Givelify, PayPal) and no
-- payment information touches this app. That rule is not relaxed here.
--
-- Therefore this history is NOT a processor feed and must never be dressed as
-- one. It is the GIVER'S OWN RECORD -- what they entered, in their words, about
-- a gift they made through the church's channels. That distinction is carried
-- in the column names, in the surface copy, and in this comment, because a
-- self-recorded log presented as a church-issued receipt would be a lie the
-- Verification Doctrine forbids. The church's official contribution statement
-- comes from the church office's own books; this is the member's ledger of
-- their own faithfulness, for their own memory and their own taxes.
--
-- PRIVACY -- owner-only, deliberately (SOUL.md security posture; the same shape
-- as 0165 food_entries). A person's giving is between them and Yahweh: "when
-- thou doest alms, let not thy left hand know what thy right hand doeth"
-- (Matthew 6:3). created_by = auth.uid() for read, write and delete. An
-- instance admin CANNOT read these rows. There is no member policy, no admin
-- policy, and no anon grant. If the church office ever needs an aggregate, that
-- is a separate, consented, decided surface -- never a widening of this policy.
--
-- ONE ROW PER GIFT. A year total is derived by filtering rows, never stored, so
-- no total can drift from the gifts under it. amount is NUMERIC(12,2) -- money
-- is never a float. NULL is never used as zero: every recorded gift has a real
-- amount, and CHECK (amount > 0) keeps a "0 gift" out of the ledger entirely.
--
-- DEPENDS ON: schema-v2.1-infra (instances), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS giving_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  slug          text NOT NULL,                    -- client-stable id (offline-safe upsert key)
  given_on      date NOT NULL,                    -- the day the gift was given, giver's calendar
  amount        numeric(12,2) NOT NULL CHECK (amount > 0),
  fund          text NOT NULL,                    -- 'tithe'|'offering'|'building'|'missions'|'benevolence'|'gift'|'other'
  fund_note     text NOT NULL DEFAULT '',         -- the designation in the giver's own words
  method        text NOT NULL DEFAULT 'other',    -- 'zelle'|'cashapp'|'givelify'|'paypal'|'cash'|'check'|'bank'|'other'
  reference     text NOT NULL DEFAULT '',         -- their own check no. / confirmation, if they kept one
  note          text NOT NULL DEFAULT '',         -- free note ("harvest offering", "in memory of...")
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS giving_records_owner_date_idx ON giving_records(created_by, given_on DESC);
CREATE INDEX IF NOT EXISTS giving_records_instance_idx   ON giving_records(instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS giving_records_slug_uniq
  ON giving_records(instance_id, created_by, slug);

DROP TRIGGER IF EXISTS giving_records_touch_updated ON giving_records;
CREATE TRIGGER giving_records_touch_updated
  BEFORE UPDATE ON giving_records
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON giving_records TO authenticated;

ALTER TABLE giving_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS giving_records_own ON giving_records;
CREATE POLICY giving_records_own ON giving_records
  FOR ALL TO authenticated
  USING      (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid()
              AND user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- The standing overlays, re-run for the new table (DR-0059 / DR-0241) -- without
-- this a 'viewer' could WRITE a giving row and the assistant scope would not
-- account for the table at all. The tenancy and assistant-scope gates fail the
-- build on a migration that skips it.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'giving_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE giving_records;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
