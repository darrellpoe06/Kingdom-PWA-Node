-- =============================================================================
-- 0166 — Road to 150: the remembered food library
-- =============================================================================
-- Darrell 2026-08-31: "keep it stored so I dont have to keep looking for it."
--
-- The second time you eat olives, the app should already know what olives were
-- last time. This table is that memory: one row per food the person has
-- CONFIRMED, holding the serving, calories and protein they accepted for it.
--
-- WHY THIS IS THE HONEST HALF OF THE LOOKUP. An online nutrition API can be
-- unreachable, wrong, or absent for a homemade food. This table needs no API at
-- all -- every value in it is one the person themselves entered and accepted, so
-- it is the most trustworthy source available and it works offline. A cited
-- online lookup can PROPOSE a value; only confirming it writes it here.
--
-- NOT A PLANNED-FOOD TABLE. Storing "olives = 25 cal" is remembering a fact
-- about a food, not planning a meal. The meal PLAN still lives in frozen repo
-- content and nothing here can write one.
--
-- `times_used` and `last_used_at` exist to ORDER suggestions by what this person
-- actually eats, so the common foods surface first without any guessing.
--
-- PRIVACY: owner-only, identical to 0164/0165 -- created_by = auth.uid() for
-- read, write and delete. What a person eats is theirs; an instance admin cannot
-- read it. No member policy, no admin policy, no anon grant.
--
-- DEPENDS ON: schema-v2.1-infra (instances), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS food_library (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  slug          text NOT NULL,
  name          text NOT NULL,                  -- as the person writes it
  name_key      text NOT NULL,                  -- normalized, for matching
  serving       text NOT NULL DEFAULT '',
  calories      numeric(7,1),                   -- NULL = never recorded, never 0-as-unknown
  protein_g     numeric(6,1),
  source        text NOT NULL DEFAULT 'entered',-- 'entered' | a cited lookup name
  times_used    integer NOT NULL DEFAULT 1,
  last_used_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS food_library_owner_idx ON food_library(created_by, last_used_at DESC);
-- One remembered row per food per person: logging olives again UPDATES the
-- memory rather than stacking a second, conflicting answer.
CREATE UNIQUE INDEX IF NOT EXISTS food_library_owner_name_uniq
  ON food_library(instance_id, created_by, name_key);
CREATE UNIQUE INDEX IF NOT EXISTS food_library_slug_uniq
  ON food_library(instance_id, created_by, slug);

DROP TRIGGER IF EXISTS food_library_touch_updated ON food_library;
CREATE TRIGGER food_library_touch_updated
  BEFORE UPDATE ON food_library
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON food_library TO authenticated;

ALTER TABLE food_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS food_library_own ON food_library;
CREATE POLICY food_library_own ON food_library
  FOR ALL TO authenticated
  USING      (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid()
              AND user_role_in_instance(instance_id) IN ('owner','admin','member'));

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
       AND tablename = 'food_library'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE food_library;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
