-- =============================================================================
-- 0039 — concerns: the in-app Concerns & Solutions board
-- =============================================================================
-- (Numbered 0039 to avoid colliding with the held PR #249's 0038 migration.)
-- Declared by Darrell (re-run 2026-06-18). The feedback loop must return INSIDE
-- the app, not in a doc Darrell has to route by hand. A concern is a real,
-- dated problem with the system or the build, paired with the SOLUTION we
-- intend, a TARGET DATE we hold ourselves to, and an honest STATUS
-- (open / in-progress / done). It is the build-transparency board's sibling:
-- BuildBoard shows what we're building; the Concerns board shows what's wrong
-- or worried-about and what we're doing about it — in the open, with dates.
--
-- TWO FEEDS surface on the board (the app composes them; only ONE is persisted
-- here):
--   1. AUTO — every row of the existing `feedback` table renders as a concern
--      automatically (read-through, incl. its screenshot thumbnail), so a
--      submitted piece of feedback returns in-app without anyone routing it.
--      Those are NOT copied into this table; they stay feedback rows.
--   2. SEEDED / MANUAL — the dated concerns the family/Governor curate here.
--      THIS table persists only feed #2.
--
-- ROLE-SCOPED / NO LEAK: family-internal management data, same scope as the
-- Projects + Discussions surfaces (0035). RLS scopes every row to the caller's
-- instance and to owner/admin/member roles. There is NO anon policy — a concern
-- is never publicly readable or writable.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger,
--             guarded publication add. Additive, family-internal — no public surface.
-- =============================================================================

CREATE TABLE IF NOT EXISTS concerns (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id),
  slug         text NOT NULL,                  -- stable local id (e.g. 'cn-...')
  concern      text NOT NULL,                  -- the problem / worry, stated plainly
  solution     text,                           -- the fix / approach we intend
  target_date  date,                           -- the date we hold ourselves to (nullable)
  when_note    text,                            -- prose condition when there's no fixed date
  status       text NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','in-progress','done')),
  area         text,                            -- which surface/area it touches (display)
  source       text NOT NULL DEFAULT 'manual'
                 CHECK (source IN ('manual','feedback')),
  sort_rank    integer,                         -- optional hand-set ordering (lower = higher)
  links        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { dr_ref, project_slug, feedback_id, ... }
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS concerns_instance_idx ON concerns(instance_id);
CREATE INDEX IF NOT EXISTS concerns_status_idx   ON concerns(status);
CREATE INDEX IF NOT EXISTS concerns_created_idx  ON concerns(created_at DESC);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate a record.
CREATE UNIQUE INDEX IF NOT EXISTS concerns_slug_uniq ON concerns(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS concerns_touch_updated ON concerns;
CREATE TRIGGER concerns_touch_updated
  BEFORE UPDATE ON concerns
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore deliberately leaves `anon` untouched. So `authenticated` needs the
-- EXPLICIT grant (without it a signed-in read/write 403s with 42501 — the Choir
-- incident). NO grant to anon: concerns are never public. RLS still gates ROWS;
-- the grant only lets the role reach the table.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON concerns TO authenticated;

ALTER TABLE concerns ENABLE ROW LEVEL SECURITY;

-- Family/governor scope: owner/admin/member of the row's instance. No anon
-- policy exists, so a logged-out client can neither read nor write. DELETE is
-- tightened to owner/admin (the governors) — a member can mark done but not
-- hard-delete the record.
DROP POLICY IF EXISTS concerns_read   ON concerns;
DROP POLICY IF EXISTS concerns_insert ON concerns;
DROP POLICY IF EXISTS concerns_update ON concerns;
DROP POLICY IF EXISTS concerns_delete ON concerns;

CREATE POLICY concerns_read ON concerns FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY concerns_insert ON concerns FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY concerns_update ON concerns FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY concerns_delete ON concerns FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a concern captured on one device shows up live on
-- another, the same way projects/discussions sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'concerns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE concerns;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
