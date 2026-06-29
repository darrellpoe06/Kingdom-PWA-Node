-- =============================================================================
-- 0052 — recipes: the Chef's Corner recipe store (instance-scoped, family-private)
-- =============================================================================
-- Declared by Darrell 2026-06-25. Chef's Corner is the start of a recipe app the
-- family builds with Chef Mario, beginning with the Poe Family Vegan Recipes.
-- The three founding recipes ship as version-controlled CONTENT
-- (app/src/lib/chefs-corner-recipes.js) so they can never be lost; this table is
-- the durable home for every recipe ADDED afterward (the Add Recipe form + the
-- paste-import) so it opens on any device and survives a reload.
--
-- STRUCTURED + SECTIONED: a recipe carries SECTIONED ingredients and sectioned,
-- ordered steps (e.g. Burgers / House Burger Sauce / Purple Cabbage Slaw). Those
-- arrays are stored as jsonb (the same way creation_workspaces stores `meta`) so
-- the structure is preserved exactly with no schema churn as the model grows.
-- `collection` is open text so a second chef / second collection needs no
-- migration — the app owns the collection registry (lib/chefs-corner.js).
--
-- ROLE-SCOPED / NO LEAK / PRIVATE: a recipe is family-internal. RLS scopes every
-- row to the caller's instance (the same instance projects / discussions /
-- workspaces run under). There is NO anon policy — recipes are never publicly
-- readable or writable. A self-serve (non-family) user gets their own instance,
-- so their recipes are private to them. DELETE is owner/admin only.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--             publication add. Additive, family-internal — no public surface.
-- APPLY: Darrell's hand (Supabase Studio SQL editor or db-migrate), per the
--        db-migrate gap. The app runs device-local + renders the canonical three
--        until this is applied; once applied, added recipes sync cross-device.
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                          -- stable local id (e.g. 'recipe-...')
  title         text NOT NULL DEFAULT 'Untitled Recipe',
  chef          text,                                   -- attribution (e.g. 'Chef Mario')
  collection    text NOT NULL DEFAULT 'poe-family-vegan', -- app-validated; open text so new collections need no migration
  servings      text NOT NULL DEFAULT '',               -- display string (e.g. '4–6')
  servings_base integer NOT NULL DEFAULT 0,             -- numeric base for serving scaling
  prep_time     text NOT NULL DEFAULT '',
  cook_time     text NOT NULL DEFAULT '',
  ingredient_sections  jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{ title, items[] }] — sectioned ingredients
  instruction_sections jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{ title, steps[] }] — sectioned, ordered steps
  toppings      jsonb NOT NULL DEFAULT '[]'::jsonb,     -- optional toppings
  storage       text NOT NULL DEFAULT '',
  reheating     text NOT NULL DEFAULT '',
  chef_note     text NOT NULL DEFAULT '',
  tags          jsonb NOT NULL DEFAULT '["vegan"]'::jsonb,
  date_added    text,                                   -- the chef-entered "date added" (display)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS recipes_instance_idx ON recipes(instance_id);
CREATE INDEX IF NOT EXISTS recipes_created_idx  ON recipes(created_at ASC);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate a recipe.
CREATE UNIQUE INDEX IF NOT EXISTS recipes_slug_uniq ON recipes(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS recipes_touch_updated ON recipes;
CREATE TRIGGER recipes_touch_updated
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore deliberately leaves `anon` untouched. So `authenticated` needs the
-- EXPLICIT grant (without it a signed-in read/write 403s with 42501 — the Choir
-- incident). NO grant to anon: recipes are never public. RLS still gates ROWS;
-- the grant only lets the role reach the table.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes TO authenticated;

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Family/governor scope: owner/admin/member of the row's instance. No anon policy
-- exists, so a logged-out client can neither read nor write. DELETE is tightened
-- to owner/admin (the governors) — a member can add/edit but not hard-delete.
DROP POLICY IF EXISTS recipes_read   ON recipes;
DROP POLICY IF EXISTS recipes_insert ON recipes;
DROP POLICY IF EXISTS recipes_update ON recipes;
DROP POLICY IF EXISTS recipes_delete ON recipes;

CREATE POLICY recipes_read ON recipes FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY recipes_insert ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY recipes_update ON recipes FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY recipes_delete ON recipes FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a recipe added on one device shows up live on another,
-- the same way projects / discussions / creation_workspaces sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'recipes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE recipes;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
