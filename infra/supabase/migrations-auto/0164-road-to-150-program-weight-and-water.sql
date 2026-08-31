-- =============================================================================
-- 0164 — Road to 150: the program enrollment, weigh-ins, and water log
-- =============================================================================
-- Declared by Darrell 2026-08-30: turn the paper/PDF "Road to 150 - Complete
-- Tracking Plan" into an interactive digital program inside the existing app.
--
-- SCOPE OF THIS MIGRATION (phases 1/2/4/5). The program spine, weight tracking
-- and water tracking — the parts fully specified today. The meal / walking /
-- strength tables land with their own phases, when the PDF that is their source
-- of truth is imported; creating them empty now would be guessing at columns.
--
-- TEMPLATE vs ENROLLMENT. The Road to 150 CONTENT (26 weekly target weights, the
-- 64 oz water goal, 202 -> 150) ships as version-controlled code in
-- app/src/lib/road-to-150-program.js — the 0052-recipes precedent, so the
-- canonical program can never be lost. `health_programs` here is one PERSON'S
-- ENROLLMENT: which template, started when, and their own start/goal figures.
-- That split is what makes the system reusable for a different person on
-- different numbers without a schema change (Darrell: "do not hard-code the
-- entire application specifically to 202 to 150").
--
-- PLANNED vs ACTUAL, IN THE SCHEMA. Planned values are NOT columns on these
-- tables — they live on the frozen template. Every row here is something the
-- USER actually did: a weigh-in, a drink of water. There is therefore no write
-- path by which an actual can overwrite a planned value, which is the rule
-- Darrell stated three times in the brief. It is structural, not conventional.
--
-- ── PRIVACY: THIS DIVERGES FROM THE 0052 FAMILY-SCOPE PATTERN, DELIBERATELY ──
-- Recipes, projects and discussions are FAMILY data: any owner/admin/member of
-- the instance may read them. A person's body weight and their daily intake are
-- NOT. These policies scope every row to ITS OWN AUTHOR — `created_by =
-- auth.uid()` — so one family member can never read another's weigh-ins, and an
-- instance admin cannot either. The instance_id is retained for tenancy and
-- cascade, not as the read key. If a future feature needs a shared view (a
-- coach, a spouse), that is an explicit, opt-in grant table and a new DR — never
-- a widening of these policies.
-- This is health data about a person; the Practice/TLC NO-PHI boundary is about
-- CLIENT protected health information and is not crossed here, but the same
-- instinct applies: least access, by default, from the first migration.
--
-- DEPENDS ON: schema-v2.1-infra (instances), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/triggers,
--             guarded publication add. Additive; no existing table is altered.
-- APPLY: rides the db-migrate lane automatically on merge to main (DR-0084) —
--        no Studio paste. The app runs device-local until it applies, then syncs.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- health_programs — one person's enrollment in a program template.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_programs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  slug              text NOT NULL,                       -- stable local id
  template_slug     text NOT NULL DEFAULT 'road-to-150', -- which repo template
  name              text NOT NULL DEFAULT 'Road to 150',
  start_date        date,                                -- week 1 day 1
  start_weight_lb   numeric(5,1) NOT NULL,
  goal_weight_lb    numeric(5,1) NOT NULL,
  weeks             integer NOT NULL,
  water_goal_oz     integer NOT NULL DEFAULT 64,
  -- The weekly roadmap AS ENROLLED, frozen at start. Kept even though the
  -- template carries it, because Darrell's brief is explicit: "Do not
  -- automatically alter historical target values... target changes must be
  -- explicit and stored separately from the original Road to 150 roadmap."
  -- A later template edit therefore cannot rewrite someone's history.
  weekly_targets    jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{week, targetWeightLb}]
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  updated_by        uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS health_programs_instance_idx ON health_programs(instance_id);
CREATE INDEX IF NOT EXISTS health_programs_owner_idx    ON health_programs(created_by);
CREATE UNIQUE INDEX IF NOT EXISTS health_programs_slug_uniq
  ON health_programs(instance_id, created_by, slug);

-- ---------------------------------------------------------------------------
-- weight_entries — ACTUAL weigh-ins. One per day per person (re-weighing the
-- same day corrects that day rather than stacking a second reading).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weight_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  program_id    uuid REFERENCES health_programs(id) ON DELETE CASCADE,
  slug          text NOT NULL,
  day           date NOT NULL,                 -- the calendar day weighed
  weight_lb     numeric(5,1) NOT NULL,         -- NOT NULL: a row means a real reading
  note          text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS weight_entries_owner_day_idx ON weight_entries(created_by, day DESC);
CREATE INDEX IF NOT EXISTS weight_entries_program_idx   ON weight_entries(program_id);
CREATE UNIQUE INDEX IF NOT EXISTS weight_entries_slug_uniq
  ON weight_entries(instance_id, created_by, slug);

-- ---------------------------------------------------------------------------
-- water_entries — ACTUAL water, timestamped and editable. The daily total is
-- DERIVED by filtering on `day`; nothing is ever cleared at midnight, so
-- "resets each day" and "preserves historical entries" are the same mechanism.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS water_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  program_id    uuid REFERENCES health_programs(id) ON DELETE CASCADE,
  slug          text NOT NULL,
  day           date NOT NULL,                 -- local calendar day, set by the client
  oz            numeric(6,1) NOT NULL,
  drank_at      timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS water_entries_owner_day_idx ON water_entries(created_by, day DESC);
CREATE INDEX IF NOT EXISTS water_entries_program_idx   ON water_entries(program_id);
CREATE UNIQUE INDEX IF NOT EXISTS water_entries_slug_uniq
  ON water_entries(instance_id, created_by, slug);

-- ---------------------------------------------------------------------------
-- updated_at touch (shared function from 0011/0023).
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS health_programs_touch_updated ON health_programs;
CREATE TRIGGER health_programs_touch_updated
  BEFORE UPDATE ON health_programs
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DROP TRIGGER IF EXISTS weight_entries_touch_updated ON weight_entries;
CREATE TRIGGER weight_entries_touch_updated
  BEFORE UPDATE ON weight_entries
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DROP TRIGGER IF EXISTS water_entries_touch_updated ON water_entries;
CREATE TRIGGER water_entries_touch_updated
  BEFORE UPDATE ON water_entries
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants (the Choir
-- 42501 incident); `authenticated` needs the EXPLICIT grant. NOTHING to anon —
-- health data is never publicly readable. RLS gates the ROWS below.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON health_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON weight_entries  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON water_entries   TO authenticated;

ALTER TABLE health_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_entries   ENABLE ROW LEVEL SECURITY;

-- OWNER-ONLY. Read, write and delete are all `created_by = auth.uid()`, AND the
-- row must belong to an instance the caller is actually in (so a stolen
-- instance_id cannot be written into someone else's tenancy). No member policy,
-- no admin policy, no anon policy — see the privacy note in the header.
DROP POLICY IF EXISTS health_programs_own ON health_programs;
CREATE POLICY health_programs_own ON health_programs
  FOR ALL TO authenticated
  USING      (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid()
              AND user_role_in_instance(instance_id) IN ('owner','admin','member'));

DROP POLICY IF EXISTS weight_entries_own ON weight_entries;
CREATE POLICY weight_entries_own ON weight_entries
  FOR ALL TO authenticated
  USING      (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid()
              AND user_role_in_instance(instance_id) IN ('owner','admin','member'));

DROP POLICY IF EXISTS water_entries_own ON water_entries;
CREATE POLICY water_entries_own ON water_entries
  FOR ALL TO authenticated
  USING      (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid()
              AND user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ---------------------------------------------------------------------------
-- THE STANDING OVERLAYS, re-run for the three new tables (DR-0059 / DR-0241).
-- A new instance-scoped table is not covered by the viewer read-only overlay or
-- the assistant scope overlay until they are re-applied over it; without this a
-- 'viewer' could WRITE a weigh-in and the office assistant's scope would not
-- account for these tables at all. The tenancy-guard and assistant-scope gates
-- fail the build on a migration that skips this — they caught this file.
-- Belt and braces with the owner-only policies above, not a substitute for them.
-- ---------------------------------------------------------------------------
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- REALTIME — a weigh-in entered on the phone shows on the tablet. Personal
-- rows only; RLS still applies to the stream.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'health_programs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE health_programs;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'weight_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE weight_entries;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'water_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE water_entries;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
