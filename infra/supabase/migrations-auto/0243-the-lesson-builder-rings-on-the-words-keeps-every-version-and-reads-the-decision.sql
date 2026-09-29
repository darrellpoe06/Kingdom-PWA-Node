-- =============================================================================
-- 0243 — the lesson builder rings on the words, keeps every version, and reads
-- Darrell's decision (DR-0669)
-- =============================================================================
-- Darrell 2026-09-29: "Do we need claude? Can we build the workflows inside the
-- PoeTech App?" -> "Yes build it all in the app!!!"; "I want to be able to use
-- any LLM? To see the difference between lessons after they receive the same
-- prompts... and have both versions of the same lessons to validate against";
-- "When we have all same lessons those end in PoeTech for me to review their
-- and the decide on which one or merge 2 of them or all of them..."
--
-- What this adds (the NAS lesson builder, infra/nas-lesson-builder, is the only
-- writer of versions; the app is the only writer of decisions):
--   1. agent_inbox_lesson_notify: a row tagged `lesson`, not yet captured and not
--      held by a build, that is inserted or whose tags change rings
--      pg_notify('lesson_inbox', <row id>). The builder LISTENs; no polling.
--   2. lesson_versions: every writer's draft of one teaching, with the prompt it
--      received (text + sha256), every gate result, time and usage. published
--      marks the one that shipped. backfill rows (existing lessons re-written for
--      comparison) can NEVER be published: CHECK (NOT (backfill AND published)).
--   3. lesson_decisions: Darrell's choice -- one version, or a merge map
--      {part: version id}, plus edits -- read by the builder, which gates the
--      composite again and writes the outcome back (status, gate_result,
--      lesson_id, branch, pr_url). Inserting one rings 'decision:<id>'.
--   4. lesson_builder_settings: the one-row house setting the Governor controls
--      in the app -- writer_mode (primary | selected | all-at-once),
--      selected_writers, and a backfill request -- plus what the service last
--      saw (service_status: every writer tried and why). A backfill request
--      rings 'backfill'.
-- READ: Darrell's two accounts and the Governor (is_lesson_governor, 0237).
-- WRITE: versions and service columns by the service role only; decisions and
-- the settings' control columns by the same stewards, their own rows only.
-- Proven by infra/supabase/tests/0243-lesson-builder-smoke.sql.
-- IDEMPOTENT: IF NOT EXISTS, DROP+CREATE POLICY/TRIGGER, CREATE OR REPLACE.
-- =============================================================================

-- 0) Who may read and decide: Darrell's two sign-ins, or the Governor's doors.
CREATE OR REPLACE FUNCTION public.is_lesson_steward()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid() IN ('f13843f2-742b-4f8a-82af-7ecfbdc536ec'::uuid,
                        'c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc'::uuid)
      OR public.is_lesson_governor();
$$;
REVOKE ALL ON FUNCTION public.is_lesson_steward() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_lesson_steward() TO authenticated;

-- 1) The ring.
CREATE OR REPLACE FUNCTION public.agent_inbox_lesson_notify()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tags @> '["lesson"]'::jsonb
     AND NOT (NEW.tags ?| array['lesson-captured', 'lesson-building'])
     AND (TG_OP = 'INSERT' OR OLD.tags IS DISTINCT FROM NEW.tags) THEN
    PERFORM pg_notify('lesson_inbox', NEW.id::text);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS agent_inbox_lesson_notify ON agent_inbox;
CREATE TRIGGER agent_inbox_lesson_notify
  AFTER INSERT OR UPDATE OF tags ON agent_inbox
  FOR EACH ROW EXECUTE FUNCTION public.agent_inbox_lesson_notify();

-- 2) Every version, kept.
CREATE TABLE IF NOT EXISTS lesson_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id        uuid NOT NULL,
  teaching_row_id uuid,
  instance_id     uuid REFERENCES instances(id) ON DELETE CASCADE,
  lesson_id       text,
  writer          text NOT NULL,
  family          text,
  model_label     text,
  prompt_sha256   text NOT NULL,
  prompt_text     text NOT NULL,
  body            jsonb,
  gate_results    jsonb NOT NULL DEFAULT '{}'::jsonb,
  elapsed_ms      integer,
  usage           jsonb NOT NULL DEFAULT '{}'::jsonb,
  error           text,
  published       boolean NOT NULL DEFAULT false,
  backfill        boolean NOT NULL DEFAULT false,
  source_ref      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_versions_backfill_never_published CHECK (NOT (backfill AND published))
);
-- The tower parity loop's 0240 (DR-0671) runs BEFORE this file and, where
-- this table did not exist yet, created a narrower lesson_versions of its own.
-- This migration OWNS the table: every column the builder writes is ensured
-- here whichever file ran first, and the builder's NOT NULLs and the
-- never-publish-a-backfill CHECK are laid on once no row would break them.
ALTER TABLE lesson_versions
  ADD COLUMN IF NOT EXISTS build_id        uuid,
  ADD COLUMN IF NOT EXISTS teaching_row_id uuid,
  ADD COLUMN IF NOT EXISTS instance_id     uuid REFERENCES instances(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS lesson_id       text,
  ADD COLUMN IF NOT EXISTS family          text,
  ADD COLUMN IF NOT EXISTS model_label     text,
  ADD COLUMN IF NOT EXISTS prompt_sha256   text,
  ADD COLUMN IF NOT EXISTS prompt_text     text,
  ADD COLUMN IF NOT EXISTS body            jsonb,
  ADD COLUMN IF NOT EXISTS gate_results    jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS elapsed_ms      integer,
  ADD COLUMN IF NOT EXISTS usage           jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS error           text,
  ADD COLUMN IF NOT EXISTS published       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS backfill        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_ref      text,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now();
ALTER TABLE lesson_versions ALTER COLUMN gate_results SET DEFAULT '{}'::jsonb;
UPDATE lesson_versions SET gate_results = '{}'::jsonb WHERE gate_results IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM lesson_versions WHERE build_id IS NULL) THEN
    ALTER TABLE lesson_versions ALTER COLUMN build_id SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lesson_versions WHERE prompt_sha256 IS NULL OR prompt_text IS NULL) THEN
    ALTER TABLE lesson_versions ALTER COLUMN prompt_sha256 SET NOT NULL;
    ALTER TABLE lesson_versions ALTER COLUMN prompt_text SET NOT NULL;
  END IF;
  ALTER TABLE lesson_versions ALTER COLUMN gate_results SET NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_versions_backfill_never_published'
                  AND conrelid = 'public.lesson_versions'::regclass) THEN
    ALTER TABLE lesson_versions ADD CONSTRAINT lesson_versions_backfill_never_published
      CHECK (NOT (backfill AND published));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lesson_versions_build_idx ON lesson_versions(build_id);
CREATE INDEX IF NOT EXISTS lesson_versions_teaching_idx ON lesson_versions(teaching_row_id);
CREATE INDEX IF NOT EXISTS lesson_versions_lesson_idx ON lesson_versions(lesson_id);

ALTER TABLE lesson_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_versions_read ON lesson_versions;
CREATE POLICY lesson_versions_read ON lesson_versions FOR SELECT
  USING (public.is_lesson_steward());
-- No INSERT/UPDATE/DELETE policy: only the service role (the NAS builder) writes.

-- 3) Darrell's decision.
CREATE TABLE IF NOT EXISTS lesson_decisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id        uuid NOT NULL,
  teaching_row_id uuid,
  instance_id     uuid REFERENCES instances(id) ON DELETE CASCADE,
  version_id      uuid REFERENCES lesson_versions(id) ON DELETE SET NULL,
  merge_map       jsonb,
  edits           jsonb NOT NULL DEFAULT '{}'::jsonb,
  decided_by      uuid NOT NULL DEFAULT auth.uid(),
  decided_at      timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'decided'
                  CHECK (status IN ('decided', 'building', 'shipped', 'gate-failed', 'failed')),
  gate_result     jsonb,
  lesson_id       text,
  branch          text,
  pr_url          text,
  processed_at    timestamptz,
  CONSTRAINT lesson_decisions_names_a_version CHECK (version_id IS NOT NULL OR merge_map IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS lesson_decisions_build_idx ON lesson_decisions(build_id);

ALTER TABLE lesson_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_decisions_read   ON lesson_decisions;
DROP POLICY IF EXISTS lesson_decisions_insert ON lesson_decisions;
CREATE POLICY lesson_decisions_read ON lesson_decisions FOR SELECT
  USING (public.is_lesson_steward());
-- A steward writes a NEW decision (append-only); the outcome columns are the
-- builder's, so a decision is born 'decided' and carries no outcome.
CREATE POLICY lesson_decisions_insert ON lesson_decisions FOR INSERT
  WITH CHECK (public.is_lesson_steward() AND decided_by = auth.uid() AND status = 'decided'
              AND gate_result IS NULL AND lesson_id IS NULL AND pr_url IS NULL);

CREATE OR REPLACE FUNCTION public.lesson_decision_notify()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'decided' THEN
    PERFORM pg_notify('lesson_inbox', 'decision:' || NEW.id::text);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS lesson_decision_notify ON lesson_decisions;
CREATE TRIGGER lesson_decision_notify
  AFTER INSERT ON lesson_decisions
  FOR EACH ROW EXECUTE FUNCTION public.lesson_decision_notify();

-- 4) The Governor's control, and what the service sees.
CREATE TABLE IF NOT EXISTS lesson_builder_settings (
  id                    smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  writer_mode           text NOT NULL DEFAULT 'all-at-once'
                        CHECK (writer_mode IN ('primary', 'selected', 'all-at-once')),
  selected_writers      text[] NOT NULL DEFAULT '{}',
  backfill_requested_at timestamptz,
  backfill_scope        text NOT NULL DEFAULT 'all',
  backfill_done_at      timestamptz,
  backfill_summary      jsonb,
  service_status        jsonb,
  service_status_at     timestamptz,
  updated_by            uuid,
  updated_at            timestamptz
);
INSERT INTO lesson_builder_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE lesson_builder_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_builder_settings_read   ON lesson_builder_settings;
DROP POLICY IF EXISTS lesson_builder_settings_update ON lesson_builder_settings;
CREATE POLICY lesson_builder_settings_read ON lesson_builder_settings FOR SELECT
  USING (public.is_lesson_steward());
CREATE POLICY lesson_builder_settings_update ON lesson_builder_settings FOR UPDATE
  USING (public.is_lesson_steward())
  WITH CHECK (public.is_lesson_steward() AND updated_by = auth.uid());
-- The control columns only: a steward cannot forge what the service saw.
REVOKE INSERT, UPDATE, DELETE ON lesson_builder_settings FROM authenticated, anon;
GRANT SELECT ON lesson_builder_settings TO authenticated;
GRANT UPDATE (writer_mode, selected_writers, backfill_requested_at, backfill_scope, updated_by, updated_at)
  ON lesson_builder_settings TO authenticated;

CREATE OR REPLACE FUNCTION public.lesson_builder_settings_notify()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.backfill_requested_at IS DISTINCT FROM OLD.backfill_requested_at
     AND NEW.backfill_requested_at IS NOT NULL THEN
    PERFORM pg_notify('lesson_inbox', 'backfill');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS lesson_builder_settings_notify ON lesson_builder_settings;
CREATE TRIGGER lesson_builder_settings_notify
  AFTER UPDATE ON lesson_builder_settings
  FOR EACH ROW EXECUTE FUNCTION public.lesson_builder_settings_notify();

-- The assistant scope overlay (0130) and the viewer overlay (DR-0243) cover the two new instance-scoped tables, in 0232's order.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
