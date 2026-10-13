-- =============================================================================
-- 0099 — Ministry Ops (Projects): the internal weekly-operations workspace, with
--        a member-visible flag that becomes the $39.99 subscriber's content
-- =============================================================================
-- Declared by Darrell 2026-07-13: "a projects tab for the internal TLC staff and
-- team members to work on projects and our weekly operation of the ministries…
-- then move those projects under their own tab under projects so users who pay
-- $39.99 can have some place and content context… motivate subscriptions."
--
-- ONE real source, two audiences:
--   * STAFF (owner/admin) run the weekly operation of the ministries here — real
--     ops items (which ministry, what, status, which week), managed privately.
--   * Any item a steward marks `member_visible` becomes the CURATED content the
--     paid ($39.99 = poetech-plus) subscriber sees — "here's what the ministries
--     are building." The tier gate that exposes it to subscribers is a client
--     concern (Phase 2); this migration ships the real data + the visibility flag.
--
-- TLC-FIREWALL (ISO-1): this lives in the CHURCH instance and holds MINISTRY
-- operations only — never raw TLC clinical/therapy data. The wall is the instance
-- boundary + the fact that only ministry-ops rows exist here.
--
-- DEPENDS ON: schema-v2.1-infra.sql. Mirrors the choir/bus ministry spine
-- (MINISTRY-SUPPORT-PATTERN.md). IDEMPOTENT + realtime-published.
-- Word-first: "Let all things be done decently and in order" (1 Corinthians 14:40).
-- =============================================================================

CREATE TABLE IF NOT EXISTS ministry_ops (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  ministry       text NOT NULL DEFAULT 'general',   -- 'bus' | 'choir' | 'ushers' | 'media' | 'general' | ...
  title          text NOT NULL,
  detail         text,
  status         text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in-progress','blocked','done')),
  week_of        date,                              -- Monday of the ops week this item belongs to
  owner_name     text,
  owner_user_id  uuid REFERENCES auth.users(id),
  member_visible boolean NOT NULL DEFAULT false,    -- true = shown to paid members as curated content
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS ministry_ops_instance_idx ON ministry_ops(instance_id, week_of DESC);
CREATE INDEX IF NOT EXISTS ministry_ops_member_idx   ON ministry_ops(instance_id, member_visible);

ALTER TABLE ministry_ops ENABLE ROW LEVEL SECURITY;

-- READ: staff (owner/admin) see everything; any instance member sees ONLY the
-- items marked member_visible (the curated subscriber content).
DROP POLICY IF EXISTS ministry_ops_read ON ministry_ops;
CREATE POLICY ministry_ops_read ON ministry_ops FOR SELECT
  USING (
    user_role_in_instance(instance_id) IN ('owner','admin')
    OR (member_visible AND user_in_instance(instance_id))
  );

-- WRITE: staff (owner/admin) only.
DROP POLICY IF EXISTS ministry_ops_write  ON ministry_ops;
DROP POLICY IF EXISTS ministry_ops_update ON ministry_ops;
DROP POLICY IF EXISTS ministry_ops_delete ON ministry_ops;
CREATE POLICY ministry_ops_write  ON ministry_ops FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY ministry_ops_update ON ministry_ops FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY ministry_ops_delete ON ministry_ops FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

CREATE OR REPLACE FUNCTION public.engagement_touch_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ministry_ops_touch_updated ON ministry_ops;
CREATE TRIGGER ministry_ops_touch_updated BEFORE UPDATE ON ministry_ops FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ministry_ops'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ministry_ops;
  END IF;
END
$realtime$;
