-- =============================================================================
-- 0035 — discussions: first-class directives / decisions / reflections / handoffs
-- =============================================================================
-- Declared by Darrell 2026-06-17. "I want to start managing projects from inside
-- the PoeTech app, and the discussions." A discussion is the discuss-then-document
-- record that DRIVES a project: a directive ("do this"), a decision ("we chose
-- this, here's why"), a reflection (the Word/Study-grounded thinking behind it),
-- or a braked hand-off ("feed this to a lane"). Each links to the project(s) it
-- drives, so a project shows its driving discussions inline.
--
-- This is the in-app half of the discuss-then-document loop. It ties into:
--   * Darrell's Study (the Yahweh/Word discussions source) via links.study_ref
--   * the decisions ledger (docs/decisions/) via links.dr_ref
--   * the projects table via project_slugs (the project's local slug ids)
--
-- ROLE-SCOPED / NO LEAK: family-internal management data. RLS scopes every row to
-- the caller's instance and to owner/admin/member roles (the same family/governor
-- scope the Projects surface runs under). There is NO anon policy — a discussion
-- is never publicly readable or writable. Per-user PRIVATE visibility (a personal
-- reflection only its author + an owner should see) is enforced in the app on top
-- of this boundary (lib/discussions.js visibleDiscussions, proven-to-catch test);
-- the DB boundary is the instance+role wall, the app filter is the private wall.
--
-- BRAKES (handoff kind): a 'handoff' discussion RECORDS the intent to feed a lane
-- and stores the Cage brake verdict (budget + concurrency lock + kill-switch) that
-- was true at creation time, in meta. It NEVER dispatches by itself — there is no
-- outbound call from this surface. Autonomous drive stays behind the Cage (the
-- three-brakes rule); this migration only persists the read/decide record.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--             publication add. Additive, family-internal — no public surface.
-- =============================================================================

CREATE TABLE IF NOT EXISTS discussions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                 -- stable local id (e.g. 'dc-...')
  kind          text NOT NULL DEFAULT 'directive'
                  CHECK (kind IN ('directive','decision','reflection','handoff')),
  title         text NOT NULL,
  body          text,
  project_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,  -- the project local slugs this drives
  visibility    text NOT NULL DEFAULT 'shared'
                  CHECK (visibility IN ('shared','private')),
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','resolved','archived')),
  links         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { study_ref, dr_ref, ... } cross-links
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,  -- handoff lane + brake verdict + dispatch_state
  author_persona text,                          -- who said it (family persona key), display only
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS discussions_instance_idx ON discussions(instance_id);
CREATE INDEX IF NOT EXISTS discussions_kind_idx     ON discussions(kind);
CREATE INDEX IF NOT EXISTS discussions_created_idx  ON discussions(created_at DESC);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate a record.
CREATE UNIQUE INDEX IF NOT EXISTS discussions_slug_uniq ON discussions(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS discussions_touch_updated ON discussions;
CREATE TRIGGER discussions_touch_updated
  BEFORE UPDATE ON discussions
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore deliberately leaves `anon` untouched. So `authenticated` needs the
-- EXPLICIT grant (without it a signed-in read/write 403s with 42501 — the Choir
-- incident). NO grant to anon: discussions are never public. RLS still gates
-- ROWS; the grant only lets the role reach the table.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON discussions TO authenticated;

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Family/governor scope: owner/admin/member of the row's instance. No anon policy
-- exists, so a logged-out client can neither read nor write. DELETE is tightened
-- to owner/admin (the governors) — a member can archive but not hard-delete.
DROP POLICY IF EXISTS discussions_read   ON discussions;
DROP POLICY IF EXISTS discussions_insert ON discussions;
DROP POLICY IF EXISTS discussions_update ON discussions;
DROP POLICY IF EXISTS discussions_delete ON discussions;

CREATE POLICY discussions_read ON discussions FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY discussions_insert ON discussions FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY discussions_update ON discussions FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY discussions_delete ON discussions FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a discussion captured on one device (and the project it
-- drives) shows up live on another, the same way projects/accounts sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'discussions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE discussions;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
