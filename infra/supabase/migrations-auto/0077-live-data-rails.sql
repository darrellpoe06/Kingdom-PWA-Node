-- =============================================================================
-- 0077 — live-data rails: seven device-local collections become family-synced
-- =============================================================================
-- Declared by Darrell 2026-07-05 ("ensure the current state of them are working
-- live data driven information flowing throughout the PoeTech App"). The
-- static-vs-live audit (docs/99-session-notes/2026-07-05-live-data-tabs-audit-
-- and-timeline.md) found seven collections that tabs render as if shared while
-- they lived in one device's localStorage:
--
--   game_saves           Games hub saves (resume on any family device)
--   family_subscriptions Books · Subscriptions audit (family money state)
--   skill_profiles       Dev/Ops opportunity-matcher profiles
--   prayer_requests      Church Home prayer log
--   church_voice         One Voice notes (family voice → church surfaces)
--   market_watchlist     Markets ticker watchlist (strings, one row/symbol)
--   module_interest      About module priority votes (one row/user/module)
--
-- SHAPE: the five list tables ride the jsonb-doc rail (slug + doc) — the doc
-- IS the record, so the app's shape can evolve with no column drift (the v2.2
-- phantom-column trap, LESSONS-LEARNED P13, is structurally impossible).
-- market_watchlist and module_interest are hand-shaped (a string set and a
-- keyed vote), both with idempotent unique indexes.
--
-- PRIVACY: instance-scoped, RLS on every table, NO anon policies — same
-- family/governor model as recipes (0052). DELETE on the doc tables follows
-- each surface's semantics: members add/edit; owner/admin hard-delete —
-- except game_saves and market_watchlist where a member removing their own
-- entry is the normal flow, so member DELETE is allowed there.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance),
--             0024 (restore-authenticated-grants), 0011/0023 (touch trigger fn).
-- IDEMPOTENT: IF NOT EXISTS / DROP-then-CREATE policies; safe to re-run.
-- APPLY: Darrell's hand (Supabase Studio SQL editor), per the db-migrate gap.
--        Until applied, every sync call fails soft and the app keeps working
--        from localStorage; sync self-heals the moment this lands.
-- =============================================================================

-- ---- the five jsonb-doc tables ---------------------------------------------
DO $doc_tables$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['game_saves','family_subscriptions','skill_profiles','prayer_requests','church_voice']
  LOOP
    EXECUTE format($ddl$
      CREATE TABLE IF NOT EXISTS %I (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
        created_by  uuid REFERENCES auth.users(id),
        slug        text NOT NULL,
        doc         jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz,
        updated_by  uuid REFERENCES auth.users(id)
      )
    $ddl$, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(instance_id)', t || '_instance_idx', t);
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I(instance_id, slug)', t || '_slug_uniq', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_touch_updated', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at()', t || '_touch_updated', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_read', t);
    EXECUTE format($p$CREATE POLICY %I ON %I FOR SELECT TO authenticated
      USING (user_role_in_instance(instance_id) IN ('owner','admin','member'))$p$, t || '_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_insert', t);
    EXECUTE format($p$CREATE POLICY %I ON %I FOR INSERT TO authenticated
      WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'))$p$, t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update', t);
    EXECUTE format($p$CREATE POLICY %I ON %I FOR UPDATE TO authenticated
      USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
      WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'))$p$, t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete', t);
  END LOOP;
END $doc_tables$;

-- DELETE semantics: owner/admin on the family-governed lists; any member on
-- game_saves (deleting your own finished game is the normal flow).
CREATE POLICY game_saves_delete ON game_saves FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY family_subscriptions_delete ON family_subscriptions FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY skill_profiles_delete ON skill_profiles FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY prayer_requests_delete ON prayer_requests FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_voice_delete ON church_voice FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---- market_watchlist (one row per instance+symbol) -------------------------
CREATE TABLE IF NOT EXISTS market_watchlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES auth.users(id),
  symbol      text NOT NULL,                          -- normalized Stooq symbol (lowercase)
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS market_watchlist_instance_idx ON market_watchlist(instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS market_watchlist_symbol_uniq ON market_watchlist(instance_id, symbol);
GRANT SELECT, INSERT, UPDATE, DELETE ON market_watchlist TO authenticated;
ALTER TABLE market_watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_watchlist_read ON market_watchlist;
CREATE POLICY market_watchlist_read ON market_watchlist FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
DROP POLICY IF EXISTS market_watchlist_insert ON market_watchlist;
CREATE POLICY market_watchlist_insert ON market_watchlist FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
DROP POLICY IF EXISTS market_watchlist_delete ON market_watchlist;
CREATE POLICY market_watchlist_delete ON market_watchlist FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ---- module_interest (one vote per instance+user+module) --------------------
CREATE TABLE IF NOT EXISTS module_interest (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  module_key  text NOT NULL,                          -- app-owned module slug (e.g. 'home-command')
  priority    text NOT NULL DEFAULT 'nice',           -- critical | important | nice (app-validated)
  signed_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz
);
CREATE INDEX IF NOT EXISTS module_interest_instance_idx ON module_interest(instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS module_interest_vote_uniq ON module_interest(instance_id, created_by, module_key);
DROP TRIGGER IF EXISTS module_interest_touch_updated ON module_interest;
CREATE TRIGGER module_interest_touch_updated
  BEFORE UPDATE ON module_interest
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON module_interest TO authenticated;
ALTER TABLE module_interest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS module_interest_read ON module_interest;
CREATE POLICY module_interest_read ON module_interest FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- Votes are strictly per-person: you insert/update/remove YOUR vote only.
DROP POLICY IF EXISTS module_interest_insert ON module_interest;
CREATE POLICY module_interest_insert ON module_interest FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND user_role_in_instance(instance_id) IN ('owner','admin','member'));
DROP POLICY IF EXISTS module_interest_update ON module_interest;
CREATE POLICY module_interest_update ON module_interest FOR UPDATE
  TO authenticated
  USING      (created_by = auth.uid() AND user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS module_interest_delete ON module_interest;
CREATE POLICY module_interest_delete ON module_interest FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ---- realtime — every rail streams so a change on one device lands live ----
DO $realtime$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH t IN ARRAY ARRAY['game_saves','family_subscriptions','skill_profiles','prayer_requests','church_voice','market_watchlist','module_interest']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $realtime$;

NOTIFY pgrst, 'reload schema';
