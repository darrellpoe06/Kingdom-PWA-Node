-- =============================================================================
-- 0037 — creation_workspaces: the in-app document / image creation space
-- =============================================================================
-- Declared by Darrell 2026-06-17. "Can we create a document view/creation space
-- — like a Word document -> an image file — a big area for working, with a click
-- drop-down for workspace type." A workspace is one composed artifact: a rich-text
-- DOCUMENT, or an IMAGE (the same composed canvas, exported as a PNG/JPG). The
-- working canvas lives in the app (Notes group, "Create" tab); this table is its
-- durable home so a document isn't lost on reload or when switching devices.
--
-- The `type` column is intentionally OPEN TEXT (not a CHECK enum) so new workspace
-- types added later in the app config (lib/creation-workspace.js WORKSPACE_TYPES)
-- persist without a schema migration — the app validates the type, the DB just
-- stores it. `content` is the editor HTML (the composed document); `meta` carries
-- per-type knobs (page size, export format default, background) as jsonb.
--
-- ROLE-SCOPED / NO LEAK / PRIVATE: a workspace is family-internal working material.
-- RLS scopes every row to the caller's instance (the same instance wall projects
-- and discussions run under). There is NO anon policy — a workspace is never
-- publicly readable or writable. A self-serve (non-family) user gets their own
-- instance, so their workspaces are private to them. DELETE is owner/admin only.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--             publication add. Additive, family-internal — no public surface.
-- =============================================================================

CREATE TABLE IF NOT EXISTS creation_workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                     -- stable local id (e.g. 'ws-...')
  type          text NOT NULL DEFAULT 'document',  -- app-validated; open text so new types need no migration
  title         text NOT NULL DEFAULT 'Untitled',
  content       text NOT NULL DEFAULT '',          -- the composed editor HTML
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb, -- per-type knobs (page size, export format, bg)
  author_persona text,                             -- who composed it (family persona key), display only
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS creation_workspaces_instance_idx ON creation_workspaces(instance_id);
CREATE INDEX IF NOT EXISTS creation_workspaces_updated_idx  ON creation_workspaces(updated_at DESC);
-- One row per (instance, slug) so an idempotent re-upload can't duplicate a record.
CREATE UNIQUE INDEX IF NOT EXISTS creation_workspaces_slug_uniq ON creation_workspaces(instance_id, slug);

-- updated_at touch (reuses the shared function defined in 0011/0023).
DROP TRIGGER IF EXISTS creation_workspaces_touch_updated ON creation_workspaces;
CREATE TRIGGER creation_workspaces_touch_updated
  BEFORE UPDATE ON creation_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. This project lost its Supabase-default per-role grants; the 0024
-- restore deliberately leaves `anon` untouched. So `authenticated` needs the
-- EXPLICIT grant (without it a signed-in read/write 403s with 42501 — the Choir
-- incident). NO grant to anon: workspaces are never public. RLS still gates
-- ROWS; the grant only lets the role reach the table.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON creation_workspaces TO authenticated;

ALTER TABLE creation_workspaces ENABLE ROW LEVEL SECURITY;

-- Family/governor scope: owner/admin/member of the row's instance. No anon policy
-- exists, so a logged-out client can neither read nor write. DELETE is tightened
-- to owner/admin (the governors) — a member can edit but not hard-delete.
DROP POLICY IF EXISTS creation_workspaces_read   ON creation_workspaces;
DROP POLICY IF EXISTS creation_workspaces_insert ON creation_workspaces;
DROP POLICY IF EXISTS creation_workspaces_update ON creation_workspaces;
DROP POLICY IF EXISTS creation_workspaces_delete ON creation_workspaces;

CREATE POLICY creation_workspaces_read ON creation_workspaces FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY creation_workspaces_insert ON creation_workspaces FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY creation_workspaces_update ON creation_workspaces FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY creation_workspaces_delete ON creation_workspaces FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a document composed on one device shows up live on
-- another, the same way projects / discussions / accounts sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'creation_workspaces'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE creation_workspaces;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
