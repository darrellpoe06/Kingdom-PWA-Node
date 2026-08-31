-- =============================================================================
-- 0165 — Road to 150: the ACTUAL food log
-- =============================================================================
-- Darrell, 2026-08-31, looking at the shipped Plan tab: "I can't put my food in
-- here and I need to."
--
-- THE MISTAKE THIS CORRECTS. 0164 shipped the program with no food logging at
-- all, because the meal PLAN comes from a source PDF that is not in the repo and
-- inventing foods would have been worse than showing none. That reasoning was
-- right about the PLAN and wrong about the LOG. What a person actually ate is
-- their own input -- it needs no source plan, and it is the single thing the
-- brief called "extremely important". Withholding it was a scope error, not a
-- data-honesty one.
--
-- So this table is ACTUALS ONLY, and that is the whole point: `planned` figures
-- still live in frozen repo content, and nothing here can write one. When the
-- PDF lands, the planned meal renders BESIDE these rows -- "Ate as planned"
-- copies planned items INTO this table as new actual rows; it never edits a plan.
--
-- One row per FOOD ITEM (not per meal): a meal is a filter over rows sharing
-- (day, meal), so removing one item does not rewrite the others, and the meal
-- total is derived rather than stored -- no total can drift from its items.
--
-- PRIVACY: identical to 0164. Owner-only -- created_by = auth.uid() for read,
-- write and delete. What a person eats is theirs; an instance admin cannot read
-- it. No member policy, no admin policy, no anon grant.
--
-- DEPENDS ON: 0164 (health_programs), schema-v2.1-infra (instances),
--             0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS food_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  program_id    uuid REFERENCES health_programs(id) ON DELETE CASCADE,
  slug          text NOT NULL,
  day           date NOT NULL,                  -- local calendar day, set by the client
  meal          text NOT NULL,                  -- 'morning' | 'lunch' | 'snack' | 'dinner'
  name          text NOT NULL,                  -- what was eaten, in the person's words
  serving       text NOT NULL DEFAULT '',       -- free text: "6 oz", "1 cup", "18 oz glass"
  calories      numeric(7,1),                   -- NULL = not recorded, never 0-as-unknown
  protein_g     numeric(6,1),                   -- NULL = not recorded, never 0-as-unknown
  eaten_at      timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS food_entries_owner_day_idx ON food_entries(created_by, day DESC);
CREATE INDEX IF NOT EXISTS food_entries_program_idx   ON food_entries(program_id);
CREATE UNIQUE INDEX IF NOT EXISTS food_entries_slug_uniq
  ON food_entries(instance_id, created_by, slug);

DROP TRIGGER IF EXISTS food_entries_touch_updated ON food_entries;
CREATE TRIGGER food_entries_touch_updated
  BEFORE UPDATE ON food_entries
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON food_entries TO authenticated;

ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS food_entries_own ON food_entries;
CREATE POLICY food_entries_own ON food_entries
  FOR ALL TO authenticated
  USING      (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid()
              AND user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- The standing overlays, re-run for the new table (DR-0059 / DR-0241) — without
-- this a 'viewer' could WRITE a food row and the assistant scope would not
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
       AND tablename = 'food_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE food_entries;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
