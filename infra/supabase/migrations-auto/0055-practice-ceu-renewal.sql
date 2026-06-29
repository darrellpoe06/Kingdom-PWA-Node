-- =============================================================================
-- 0055 — practice_ceu_entries: the POST-LICENSE continuing-education (CE/CEU) ledger
-- =============================================================================
-- Declared by Darrell 2026-06-29: "Illinois continuing education units (CEUs) for
-- MSW based on laws — and eventually other states based on their laws."
--
-- DISTINCT FROM the pre-licensure supervised-hours ledger (that lives device-local in
-- the Practice Learn surface). A practice_ceu_entry is one logged CONTINUING-EDUCATION
-- activity a LICENSED social worker completes toward RENEWING the license each cycle:
-- a date, hours, the topic/category, the course title, and the CE sponsor + approval
-- number (provider metadata). The state CE RULESET (required hours, cycle, mandated
-- topics) lives in app code (lib/ceu-tracker.js) as configurable data — NOT in the DB;
-- this table only stores the licensee's own logged activities. Progress is DERIVED.
--
-- NO PHI, BY DESIGN. CE activities are professional-development records — no client
-- data, no clinical content. The note field is for the course, never a client.
--
-- ROLE-SCOPED / NO LEAK: family/practice-internal records, mirroring practice_leads
-- (0045). RLS scopes every row to the caller's instance + owner/admin/member roles.
-- There is NO anon policy. DELETE is tightened to owner/admin.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--             publication add. Additive, internal — no public surface.
-- =============================================================================

CREATE TABLE IF NOT EXISTS practice_ceu_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id),
  slug            text NOT NULL,                       -- stable local id (e.g. 'ce-...')
  learner_email   text NOT NULL DEFAULT '',            -- whose CE record (multi-learner ledger)
  state           text NOT NULL DEFAULT 'IL',          -- state ruleset the hours apply to
  credential      text NOT NULL DEFAULT '',            -- LSW / LCSW
  ce_date         date,                                -- date the CE was completed
  hours           numeric NOT NULL DEFAULT 0 CHECK (hours >= 0 AND hours <= 1000),
  topic           text NOT NULL DEFAULT 'general',     -- 'general' or a mandated-topic key
  title           text NOT NULL DEFAULT '',            -- course / activity title
  provider        text NOT NULL DEFAULT '',            -- CE sponsor name (metadata)
  approval_number text NOT NULL DEFAULT '',            -- sponsor approval # e.g. 159.xxxxxx (metadata)
  note            text NOT NULL DEFAULT '',            -- course note (NO client detail)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS practice_ceu_instance_idx ON practice_ceu_entries(instance_id);
CREATE INDEX IF NOT EXISTS practice_ceu_learner_idx  ON practice_ceu_entries(learner_email);
CREATE INDEX IF NOT EXISTS practice_ceu_date_idx     ON practice_ceu_entries(ce_date DESC);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate an entry.
CREATE UNIQUE INDEX IF NOT EXISTS practice_ceu_slug_uniq ON practice_ceu_entries(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS practice_ceu_touch_updated ON practice_ceu_entries;
CREATE TRIGGER practice_ceu_touch_updated
  BEFORE UPDATE ON practice_ceu_entries
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. authenticated needs the EXPLICIT grant (the 0024 restore leaves anon
-- untouched). NO grant to anon: CE records are never public. RLS still gates ROWS.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON practice_ceu_entries TO authenticated;

ALTER TABLE practice_ceu_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS practice_ceu_read   ON practice_ceu_entries;
DROP POLICY IF EXISTS practice_ceu_insert ON practice_ceu_entries;
DROP POLICY IF EXISTS practice_ceu_update ON practice_ceu_entries;
DROP POLICY IF EXISTS practice_ceu_delete ON practice_ceu_entries;

CREATE POLICY practice_ceu_read ON practice_ceu_entries FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY practice_ceu_insert ON practice_ceu_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY practice_ceu_update ON practice_ceu_entries FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY practice_ceu_delete ON practice_ceu_entries FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a CE activity logged on one device shows up live on another.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'practice_ceu_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE practice_ceu_entries;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFY (read-only — run after applying):
--   SELECT count(*) FROM practice_ceu_entries;                          -- expect 0 on fresh apply
--   SELECT polname FROM pg_policies WHERE tablename='practice_ceu_entries'; -- expect the 4 policies
--   -- A signed-OUT client SELECT must 403 (no anon policy). A signed-in member of
--   -- the instance can read/insert/update; only owner/admin can delete.
-- =============================================================================
