-- =============================================================================
-- 0342 — What the church office posts is kept, and nothing the office
--        removes disappears by accident (DR-1596)
-- =============================================================================
-- Darrell 2026-11-19: "We like to keep historical events and activities
-- etc..." and "Why does the office only have today forward... because they
-- don't want to need to archive it... we can inside the Love Corner App
-- because it's automated!?!!!!!!!"
--
-- The church website (DR-1550) shows one month's calendar picture, the latest
-- Letter from BG and the current flyers; each is REPLACED when the next goes
-- up, so last month's are gone from the site. This keeps them:
--
--   1. church_site_archive — one row per picture the office posted, with the
--      month and year it was for and the day it was first seen. The BYTES
--      live in the private `church-archive` bucket at <instance_id>/<sha256>.
--      ONE COPY PER CONTENT: (instance_id, sha256) is unique, so a re-post of
--      the same picture is the same row (its last_seen_at moves), never a
--      second copy. Written only by the daily reader through
--      church_site_archive_keep(), which only the service role may call.
--      Read by the church's own members; deleted only by its office.
--
--   2. ministry_ops (calendar rows) gains archived_at / archived_by. The
--      office's "Remove" now calls church_calendar_remove(): an event that
--      began before today (the church's own day, America/Chicago, the zone
--      lib/church-live.js CHURCH_TIME_ZONE names) is ARCHIVED, never deleted,
--      with who and when, plus an audit_log row; an event from today on is
--      deleted, so a mistaken future post still goes. A BEFORE DELETE trigger
--      is the wall under it: a direct DELETE of a past calendar row is
--      refused (a cascade from deleting the whole instance is not).
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, user_in_instance,
-- user_role_in_instance, audit_log) and 0099 (ministry_ops). IDEMPOTENT.
-- Smoke: infra/supabase/tests/0342-church-site-archive-smoke.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE ARCHIVE — one row per picture, one copy per content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.church_site_archive (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('calendar', 'letter', 'flyer')),
  title         text NOT NULL DEFAULT '' CHECK (length(title) <= 200),
  for_year      integer NOT NULL CHECK (for_year BETWEEN 2000 AND 2200),
  for_month     integer NOT NULL CHECK (for_month BETWEEN 1 AND 12),
  month_from    text NOT NULL DEFAULT 'first-seen' CHECK (month_from IN ('page', 'file', 'first-seen')),
  sha256        text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  bytes         bigint NOT NULL CHECK (bytes > 0 AND bytes <= 26214400),
  content_type  text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp')),
  storage_path  text NOT NULL,
  source_path   text NOT NULL CHECK (source_path ~ '^/uploads/'),
  source_page   text NOT NULL CHECK (source_page IN ('calendar', 'letters-from-bg', 'current-events', 'previous-events')),
  found_via     text NOT NULL DEFAULT 'site' CHECK (found_via IN ('site', 'wayback')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  seen_count    integer NOT NULL DEFAULT 1,
  CONSTRAINT church_site_archive_one_copy UNIQUE (instance_id, sha256),
  CONSTRAINT church_site_archive_path_chk CHECK (storage_path = instance_id::text || '/' || sha256 || '.' || split_part(content_type, '/', 2))
);
CREATE INDEX IF NOT EXISTS church_site_archive_month_idx
  ON public.church_site_archive(instance_id, for_year DESC, for_month DESC);

ALTER TABLE public.church_site_archive ENABLE ROW LEVEL SECURITY;

-- The church's own members read their church's archive; nobody else.
DROP POLICY IF EXISTS church_site_archive_read ON public.church_site_archive;
CREATE POLICY church_site_archive_read ON public.church_site_archive FOR SELECT TO authenticated
  USING (public.user_in_instance(instance_id));

-- Only the office (owner/admin) may take an item out. There is no INSERT or
-- UPDATE policy: the reader writes through the function below, as the
-- service role.
DROP POLICY IF EXISTS church_site_archive_delete ON public.church_site_archive;
CREATE POLICY church_site_archive_delete ON public.church_site_archive FOR DELETE TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin'));

-- The reader's one door. Returns 'kept' for a picture not held before and
-- 'seen' for one already held (same content): its last_seen_at moves, an
-- earlier sighting (a Wayback snapshot) moves first_seen_at back, and a month
-- the page or the file name states replaces one inferred from the day seen.
CREATE OR REPLACE FUNCTION public.church_site_archive_keep(slug_in text, item_in jsonb)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_instance uuid;
  v_seen     timestamptz := coalesce(nullif(item_in->>'seen_at', '')::timestamptz, now());
  v_inserted boolean;
BEGIN
  IF item_in IS NULL OR jsonb_typeof(item_in) <> 'object' THEN
    RAISE EXCEPTION 'church_site_archive_keep: an item is an object';
  END IF;
  IF v_seen > now() + interval '1 hour' THEN
    RAISE EXCEPTION 'church_site_archive_keep: an item cannot be seen in the future';
  END IF;
  SELECT id INTO v_instance FROM instances WHERE slug = lower(trim(coalesce(slug_in, '')));
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'church_site_archive_keep: no church with that slug';
  END IF;

  INSERT INTO public.church_site_archive AS a
    (instance_id, kind, title, for_year, for_month, month_from, sha256, bytes, content_type,
     storage_path, source_path, source_page, found_via, first_seen_at, last_seen_at)
  VALUES
    (v_instance, item_in->>'kind', left(coalesce(item_in->>'title', ''), 200),
     (item_in->>'for_year')::integer, (item_in->>'for_month')::integer,
     coalesce(nullif(item_in->>'month_from', ''), 'first-seen'),
     lower(item_in->>'sha256'), (item_in->>'bytes')::bigint, item_in->>'content_type',
     v_instance::text || '/' || lower(item_in->>'sha256') || '.' || split_part(item_in->>'content_type', '/', 2),
     item_in->>'source_path', item_in->>'source_page', coalesce(nullif(item_in->>'found_via', ''), 'site'),
     v_seen, v_seen)
  ON CONFLICT (instance_id, sha256) DO UPDATE
     SET last_seen_at  = greatest(a.last_seen_at, EXCLUDED.last_seen_at),
         first_seen_at = least(a.first_seen_at, EXCLUDED.first_seen_at),
         seen_count    = a.seen_count + 1,
         for_year      = CASE WHEN a.month_from = 'first-seen' AND EXCLUDED.month_from <> 'first-seen' THEN EXCLUDED.for_year ELSE a.for_year END,
         for_month     = CASE WHEN a.month_from = 'first-seen' AND EXCLUDED.month_from <> 'first-seen' THEN EXCLUDED.for_month ELSE a.for_month END,
         month_from    = CASE WHEN a.month_from = 'first-seen' AND EXCLUDED.month_from <> 'first-seen' THEN EXCLUDED.month_from ELSE a.month_from END
  RETURNING (xmax = 0) INTO v_inserted;

  RETURN CASE WHEN v_inserted THEN 'kept' ELSE 'seen' END;
END;
$$;
REVOKE ALL ON FUNCTION public.church_site_archive_keep(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.church_site_archive_keep(text, jsonb) TO service_role;

COMMENT ON TABLE public.church_site_archive IS
  'Every calendar, letter and flyer the church office posted on its website, kept the first time the daily reader saw it (0342, DR-1596). One row per content (sha256); bytes in the private church-archive bucket.';

-- ---------------------------------------------------------------------------
-- 2. THE BUCKET — private; <instance_id>/<sha256>.<ext>
-- ---------------------------------------------------------------------------
-- The instance a stored path belongs to, or NULL when the first folder is not
-- an instance id (a bad cast must never throw inside a storage policy).
CREATE OR REPLACE FUNCTION public.church_archive_path_instance(name_in text)
RETURNS uuid
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE WHEN split_part(coalesce(name_in, ''), '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN split_part(name_in, '/', 1)::uuid END
$$;

DO $bucket$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE '0342: storage is not on this box yet - the church-archive bucket and its policies are not asserted; re-run after storage-api has migrated (the reader also creates the bucket through the storage API)';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public) VALUES ('church-archive', 'church-archive', false)
  ON CONFLICT (id) DO NOTHING;
  UPDATE storage.buckets SET public = false WHERE id = 'church-archive' AND public IS DISTINCT FROM false;

  EXECUTE 'DROP POLICY IF EXISTS church_archive_objects_read ON storage.objects';
  EXECUTE $p$CREATE POLICY church_archive_objects_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'church-archive' AND public.user_in_instance(public.church_archive_path_instance(name)))$p$;
  EXECUTE 'DROP POLICY IF EXISTS church_archive_objects_delete ON storage.objects';
  EXECUTE $p$CREATE POLICY church_archive_objects_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'church-archive' AND public.user_role_in_instance(public.church_archive_path_instance(name)) IN ('owner', 'admin'))$p$;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0342: insufficient privilege on storage - create the private church-archive bucket by hand; the reader also creates it through the storage API';
END
$bucket$;

-- ---------------------------------------------------------------------------
-- 3. A PAST CALENDAR EVENT IS ARCHIVED, NOT DELETED
-- ---------------------------------------------------------------------------
ALTER TABLE public.ministry_ops ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.ministry_ops ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- The church's own day. One zone, the one the app's calendar uses.
CREATE OR REPLACE FUNCTION public.church_today()
RETURNS date
LANGUAGE sql STABLE
AS $$ SELECT (now() AT TIME ZONE 'America/Chicago')::date $$;

-- The wall: a calendar row whose day has passed cannot be deleted directly.
-- pg_trigger_depth() > 1 is a cascade (the whole instance being deleted),
-- which is not the office removing one event.
CREATE OR REPLACE FUNCTION public.church_calendar_keep_the_past()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.ministry = 'calendar' AND OLD.week_of IS NOT NULL AND OLD.week_of < public.church_today()
     AND pg_trigger_depth() <= 1 THEN
    RAISE EXCEPTION 'a calendar event that has happened is archived, not deleted (church_calendar_remove)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS ministry_ops_keep_the_past ON public.ministry_ops;
CREATE TRIGGER ministry_ops_keep_the_past BEFORE DELETE ON public.ministry_ops
  FOR EACH ROW EXECUTE FUNCTION public.church_calendar_keep_the_past();

-- The office's Remove. 'archived' for an event that began before today,
-- 'deleted' for one from today on. Owner/admin of the row's church only.
CREATE OR REPLACE FUNCTION public.church_calendar_remove(row_in uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_row public.ministry_ops%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_row FROM public.ministry_ops WHERE id = row_in AND ministry = 'calendar';
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'no such calendar event'; END IF;
  IF coalesce(public.user_role_in_instance(v_row.instance_id), '') NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'only the church office removes a calendar event' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_row.week_of IS NOT NULL AND v_row.week_of < public.church_today() THEN
    IF v_row.archived_at IS NULL THEN
      UPDATE public.ministry_ops SET archived_at = now(), archived_by = auth.uid() WHERE id = v_row.id;
      INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
      VALUES (v_row.instance_id, auth.uid(), 'update', 'church_calendar_event', v_row.id,
              jsonb_build_object('title', v_row.title, 'week_of', v_row.week_of),
              jsonb_build_object('archived', true), 'church_calendar_remove: past event archived, kept in history');
    END IF;
    RETURN 'archived';
  END IF;

  DELETE FROM public.ministry_ops WHERE id = v_row.id;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_row.instance_id, auth.uid(), 'delete', 'church_calendar_event', v_row.id,
          jsonb_build_object('title', v_row.title, 'week_of', v_row.week_of), NULL,
          'church_calendar_remove: future event deleted');
  RETURN 'deleted';
END;
$$;
REVOKE ALL ON FUNCTION public.church_calendar_remove(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_calendar_remove(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE OVERLAYS — re-run, because this migration created an instance-scoped
--    table (church_site_archive). A new table does not inherit them by
--    existing: the assistant scope overlay (0130) keeps an assistant inside its
--    workspace, the viewer read-only overlay (DR-0241) keeps a viewer a viewer.
--    Caught by assistant-scope-noleak and tenancy-guard on the first draft.
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
