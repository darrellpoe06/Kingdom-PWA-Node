-- =============================================================================
-- 0132 — advocacy records: the Advocacy Case Manager's data (pb-advocacy-outcomes)
-- =============================================================================
-- Declared by Darrell (2026-08-04): "a system inside PoeTech to facilitate the
-- management of the students experiences for documentation of their situations
-- so when they ask for help we will have data to support their perspectives and
-- also help keep context." The proven shape is the family's own January 2024
-- school case: dated entries at the time, the institution's words verbatim, the
-- family's witness labeled as witness, institution-held data named for records
-- requests. One flat table carries both kinds — a `case` header row and its
-- dated `entry` rows — grouped by case_slug (the 0059 board_tasks model).
--
-- FAMILY-SCOPED / NO LEAK: a case file is family-internal (parents + student
-- build it together). RLS scopes every row to the caller's instance and to
-- owner/admin/member roles. NO anon policy — a case file is never publicly
-- readable or writable. DELETE stays at member+ (the author family corrects its
-- own record; entries are the family's own documentation, not managed platform
-- data).
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger,
--             guarded publication add. Additive, family-internal — no public surface.
-- =============================================================================

CREATE TABLE IF NOT EXISTS advocacy_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                 -- stable local id ('ac-…' case / 'ae-…' entry)
  kind          text NOT NULL DEFAULT 'entry'
                  CHECK (kind IN ('case','entry')),
  case_slug     text NOT NULL,                 -- which case file this row belongs to
  title         text,                          -- case rows: the case title
  student       text,                          -- case rows: who this is for
  institution   text,                          -- case rows: school / organization
  ask           text,                          -- case rows: the specific request
  status        text
                  CHECK (status IS NULL OR status IN ('documenting','asking','escalating','resolved','unresolved')),
  ladder_step   text
                  CHECK (ladder_step IS NULL OR ladder_step IN ('direct','counselor','principal','district','records','board')),
  entry_type    text
                  CHECK (entry_type IS NULL OR entry_type IN ('incident','communication','meeting','response','document','outcome')),
  evidence_tier text
                  CHECK (evidence_tier IS NULL OR evidence_tier IN ('their-words','our-witness','their-data')),
  occurred_at   date,                          -- when the documented thing happened
  parties       text,                          -- who was involved (roles preferred)
  summary       text,                          -- what happened, in the family's words
  their_words   text,                          -- the institution's words, VERBATIM
  follow_up     text,                          -- what was promised / what comes next
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS advocacy_records_instance_idx ON advocacy_records(instance_id);
CREATE INDEX IF NOT EXISTS advocacy_records_case_idx     ON advocacy_records(case_slug);
CREATE INDEX IF NOT EXISTS advocacy_records_kind_idx     ON advocacy_records(kind);
-- One row per (instance, slug): an idempotent re-upload can't duplicate a record.
CREATE UNIQUE INDEX IF NOT EXISTS advocacy_records_slug_uniq ON advocacy_records(instance_id, slug);

-- updated_at touch (shared function from 0011/0023).
DROP TRIGGER IF EXISTS advocacy_records_touch_updated ON advocacy_records;
CREATE TRIGGER advocacy_records_touch_updated
  BEFORE UPDATE ON advocacy_records
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- Explicit authenticated grant (0024 posture: defaults were dropped; anon stays
-- untouched — a case file is never public). RLS still gates rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON advocacy_records TO authenticated;

ALTER TABLE advocacy_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS advocacy_records_read   ON advocacy_records;
DROP POLICY IF EXISTS advocacy_records_insert ON advocacy_records;
DROP POLICY IF EXISTS advocacy_records_update ON advocacy_records;
DROP POLICY IF EXISTS advocacy_records_delete ON advocacy_records;

CREATE POLICY advocacy_records_read ON advocacy_records FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY advocacy_records_insert ON advocacy_records FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY advocacy_records_update ON advocacy_records FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY advocacy_records_delete ON advocacy_records FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- REALTIME — an entry logged on the student's phone shows up live on the
-- parent's device, the same rail the other family surfaces ride.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'advocacy_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE advocacy_records;
  END IF;
END $realtime$;

-- Re-run the standing overlays so the new instance-scoped table carries the
-- viewer read-only deny (tenancy-guard Check E) and the assistant workspace
-- wall (assistant-scope-guard) — both re-runnable by design (0126 / 0130).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- Verify after apply (adversarial RLS probe, 0059 pattern):
--   As anon:            GET /rest/v1/advocacy_records?select=slug -> [] or 401 (never rows)
--   As a stranger auth: GET /rest/v1/advocacy_records?select=slug -> [] (own instance empty)
--   As a family member: INSERT/UPDATE/SELECT succeed, scoped to the family instance.
-- =============================================================================
