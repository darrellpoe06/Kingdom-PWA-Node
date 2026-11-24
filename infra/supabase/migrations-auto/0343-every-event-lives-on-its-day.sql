-- =============================================================================
-- 0343 — Every event lives on its day, perpetually; the office and the unit
--        leaders it names are the only hands that add to it (DR-1628)
-- =============================================================================
-- Darrell 2026-11-24, over a Times tab whose calendar said "Nothing is on the
-- church calendar for this day" while the office's own November picture,
-- right below it, listed an NA meeting that very day:
--   "The events should show from the calendar for that specific day!!!!!!!!
--    ... we prefer each event on their respective days inside the calendar
--    ... Automatic Calendar update ... also only certain people can add to the
--    calendar... office staff and sent in by minister leadership over units"
-- and, over the Battle Cry Sunday flyer:
--   "This should be showing on that day... perpetually.... and staff should be
--    able to reuse it with updated information.... just to see what happened
--    last year for the congregation"
--
--   1. ministry_ops (calendar rows) gains
--        read_from     'calendar:<sha256>' | 'flyer:<sha256>' — the office
--                      picture the event was READ from by the daily reader
--                      (NULL = typed by a person)
--        picture_path  that picture's place in the private church-archive
--                      bucket (<instance>/<sha256>.<ext>), so the day shows
--                      the flyer itself even after the website takes it down
--        sent_by_unit  the unit whose leadership sent it in (NULL = the office)
--        reused_from   the past event it was made from ("Use again")
--   2. church_calendar_leads — the unit leaders the office names. A lead may
--      add events for their own unit, nothing else. Only the office names or
--      removes a lead.
--   3. church_calendar_post() — the one door for a person adding one event:
--      the office (owner/admin) for the church or any unit; a named lead for
--      their unit only. Everyone else is refused. An audit row each time.
--   4. church_calendar_can_post() — what the signed-in reader may do, so the
--      app shows the form only to someone the database will accept.
--   5. church_calendar_keep_read() — the daily reader's door (service role
--      only): the events read from ONE office picture are filed ONCE. A
--      picture already filed is 'already' forever after, so an event the
--      office removed never comes back on the next run (church_calendar_reads
--      is that memory). Insert-only: the reader never deletes or changes a
--      row. An event already on that day under the same name is not doubled.
--      Only a picture already IN the church archive (0342) can be read, and
--      its kind and place come from that row.
--   6. church_site_archive_upload() — the office adds a picture by hand (an
--      old flyer the website no longer shows); the reader reads it next run.
--
-- PERPETUAL: nothing here deletes the past. 0342's wall (a past calendar row
-- cannot be deleted, only archived) stands under every row this files.
--
-- DEPENDS ON: schema-v2.1-infra.sql, 0099 (ministry_ops), 0342
-- (church_today, archived_at). IDEMPOTENT.
-- Smoke: infra/supabase/tests/0343-every-event-lives-on-its-day-smoke.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. WHERE A CALENDAR ROW CAME FROM
-- ---------------------------------------------------------------------------
ALTER TABLE public.ministry_ops ADD COLUMN IF NOT EXISTS read_from text;
ALTER TABLE public.ministry_ops ADD COLUMN IF NOT EXISTS picture_path text;
ALTER TABLE public.ministry_ops ADD COLUMN IF NOT EXISTS sent_by_unit text;
ALTER TABLE public.ministry_ops ADD COLUMN IF NOT EXISTS reused_from uuid REFERENCES public.ministry_ops(id) ON DELETE SET NULL;

DO $chk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ministry_ops_read_from_chk') THEN
    ALTER TABLE public.ministry_ops ADD CONSTRAINT ministry_ops_read_from_chk
      CHECK (read_from IS NULL OR read_from ~ '^(calendar|flyer):[0-9a-f]{64}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ministry_ops_picture_path_chk') THEN
    ALTER TABLE public.ministry_ops ADD CONSTRAINT ministry_ops_picture_path_chk
      CHECK (picture_path IS NULL OR picture_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{64}\.(jpeg|png|gif|webp)$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ministry_ops_sent_by_unit_chk') THEN
    ALTER TABLE public.ministry_ops ADD CONSTRAINT ministry_ops_sent_by_unit_chk
      CHECK (sent_by_unit IS NULL OR length(btrim(sent_by_unit)) BETWEEN 1 AND 80);
  END IF;
END
$chk$;

CREATE INDEX IF NOT EXISTS ministry_ops_calendar_day_idx
  ON public.ministry_ops(instance_id, week_of) WHERE ministry = 'calendar';

-- ---------------------------------------------------------------------------
-- 2. THE UNIT LEADERS THE OFFICE NAMES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.church_calendar_leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit        text NOT NULL CHECK (length(btrim(unit)) BETWEEN 1 AND 80),
  granted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT church_calendar_leads_one UNIQUE (instance_id, user_id, unit)
);
CREATE INDEX IF NOT EXISTS church_calendar_leads_user_idx ON public.church_calendar_leads(user_id, instance_id);

ALTER TABLE public.church_calendar_leads ENABLE ROW LEVEL SECURITY;

-- The office sees its church's leads; a lead sees their own rows.
DROP POLICY IF EXISTS church_calendar_leads_read ON public.church_calendar_leads;
CREATE POLICY church_calendar_leads_read ON public.church_calendar_leads FOR SELECT TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin') OR user_id = auth.uid());

-- Only the office names a lead, and only a member of its own church.
DROP POLICY IF EXISTS church_calendar_leads_insert ON public.church_calendar_leads;
CREATE POLICY church_calendar_leads_insert ON public.church_calendar_leads FOR INSERT TO authenticated
  WITH CHECK (
    public.user_role_in_instance(instance_id) IN ('owner', 'admin')
    AND EXISTS (SELECT 1 FROM instance_members m WHERE m.instance_id = church_calendar_leads.instance_id AND m.user_id = church_calendar_leads.user_id)
  );

DROP POLICY IF EXISTS church_calendar_leads_delete ON public.church_calendar_leads;
CREATE POLICY church_calendar_leads_delete ON public.church_calendar_leads FOR DELETE TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin'));

COMMENT ON TABLE public.church_calendar_leads IS
  'Unit leaders the church office allows to add calendar events for their unit (0343, DR-1628).';

-- ---------------------------------------------------------------------------
-- 3. WHAT THE SIGNED-IN READER MAY DO
-- ---------------------------------------------------------------------------
-- { "office": bool, "units": [ ... ] }. Unknown is not a yes: signed out or
-- not a member answers office false, no units.
CREATE OR REPLACE FUNCTION public.church_calendar_can_post(instance_in uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT jsonb_build_object(
    'office', coalesce(public.user_role_in_instance(instance_in), '') IN ('owner', 'admin'),
    'units', coalesce((SELECT jsonb_agg(l.unit ORDER BY l.unit)
                         FROM public.church_calendar_leads l
                        WHERE l.instance_id = instance_in AND l.user_id = auth.uid()
                          AND public.user_in_instance(instance_in)), '[]'::jsonb)
  )
$$;
REVOKE ALL ON FUNCTION public.church_calendar_can_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_calendar_can_post(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. ONE EVENT, ADDED BY A PERSON
-- ---------------------------------------------------------------------------
-- The office posts for the church (unit_in NULL) or for any unit; a named
-- lead posts only for a unit the office named them over. reused_from_in, when
-- given, must be a calendar row of the same church (the "Use again" link).
CREATE OR REPLACE FUNCTION public.church_calendar_post(
  instance_in uuid, title_in text, date_in date, detail_in text DEFAULT NULL,
  unit_in text DEFAULT NULL, reused_from_in uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office boolean;
  v_unit   text := nullif(btrim(coalesce(unit_in, '')), '');
  v_title  text := btrim(coalesce(title_in, ''));
  v_id     uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF length(v_title) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'an event needs a name (1 to 200 letters)'; END IF;
  IF date_in IS NULL THEN RAISE EXCEPTION 'an event needs a day'; END IF;
  IF length(coalesce(detail_in, '')) > 2000 THEN RAISE EXCEPTION 'the details are too long'; END IF;

  v_office := coalesce(public.user_role_in_instance(instance_in), '') IN ('owner', 'admin');
  IF NOT v_office THEN
    IF v_unit IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.church_calendar_leads l
       WHERE l.instance_id = instance_in AND l.user_id = auth.uid() AND lower(l.unit) = lower(v_unit)
         AND public.user_in_instance(instance_in)
    ) THEN
      RAISE EXCEPTION 'only the church office, or a unit leader the office named, adds to the calendar'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    SELECT l.unit INTO v_unit FROM public.church_calendar_leads l
     WHERE l.instance_id = instance_in AND l.user_id = auth.uid() AND lower(l.unit) = lower(v_unit) LIMIT 1;
  END IF;

  IF reused_from_in IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.ministry_ops o WHERE o.id = reused_from_in AND o.instance_id = instance_in AND o.ministry = 'calendar'
  ) THEN
    RAISE EXCEPTION 'that event is not on this church''s calendar';
  END IF;

  INSERT INTO public.ministry_ops
    (instance_id, ministry, title, detail, week_of, status, member_visible, created_by, sent_by_unit, reused_from)
  VALUES
    (instance_in, 'calendar', v_title, nullif(btrim(coalesce(detail_in, '')), ''), date_in, 'todo', true, auth.uid(), v_unit, reused_from_in)
  RETURNING id INTO v_id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (instance_in, auth.uid(), 'create', 'church_calendar_event', v_id, NULL,
          jsonb_build_object('title', v_title, 'week_of', date_in, 'unit', v_unit, 'reused_from', reused_from_in),
          CASE WHEN v_office THEN 'church_calendar_post: the office added an event'
               ELSE 'church_calendar_post: sent in by ' || v_unit || ' leadership' END);
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.church_calendar_post(uuid, text, date, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_calendar_post(uuid, text, date, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. THE DAILY READER FILES WHAT IT READ FROM AN OFFICE PICTURE — ONCE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.church_calendar_reads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sha256      text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  kind        text NOT NULL CHECK (kind IN ('calendar', 'flyer')),
  read_at     timestamptz NOT NULL DEFAULT now(),
  events_read integer NOT NULL DEFAULT 0,
  events_added integer NOT NULL DEFAULT 0,
  CONSTRAINT church_calendar_reads_once UNIQUE (instance_id, sha256)
);
ALTER TABLE public.church_calendar_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS church_calendar_reads_read ON public.church_calendar_reads;
CREATE POLICY church_calendar_reads_read ON public.church_calendar_reads FOR SELECT TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin'));

-- item_in: { sha256 } of a picture already in church_site_archive
-- events_in: [ { date: 'YYYY-MM-DD', name, time?, place?, detail? }, ... ]
-- Returns { result: 'filed'|'already', read, added }.
CREATE OR REPLACE FUNCTION public.church_calendar_keep_read(slug_in text, item_in jsonb, events_in jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_instance uuid;
  v_sha      text := lower(coalesce(item_in->>'sha256', ''));
  v_kind     text;
  v_path     text;
  v_ev       jsonb;
  v_date     date;
  v_name     text;
  v_detail   text;
  v_read     integer := 0;
  v_added    integer := 0;
BEGIN
  IF v_sha !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'church_calendar_keep_read: no content hash'; END IF;
  IF events_in IS NULL OR jsonb_typeof(events_in) <> 'array' THEN RAISE EXCEPTION 'church_calendar_keep_read: events are a list'; END IF;
  IF jsonb_array_length(events_in) > 120 THEN RAISE EXCEPTION 'church_calendar_keep_read: more events than one picture holds'; END IF;
  SELECT id INTO v_instance FROM instances WHERE slug = lower(trim(coalesce(slug_in, '')));
  IF v_instance IS NULL THEN RAISE EXCEPTION 'church_calendar_keep_read: no church with that slug'; END IF;
  -- Only a picture the church archive holds is read onto the calendar; its
  -- kind and its place come from that row, never from the caller.
  SELECT a.kind, a.storage_path INTO v_kind, v_path
    FROM public.church_site_archive a WHERE a.instance_id = v_instance AND a.sha256 = v_sha;
  IF v_kind IS NULL THEN RAISE EXCEPTION 'church_calendar_keep_read: that picture is not in the church archive'; END IF;
  IF v_kind NOT IN ('calendar', 'flyer') THEN RAISE EXCEPTION 'church_calendar_keep_read: only a calendar or a flyer holds events'; END IF;

  -- Once per picture, forever: what the office later removes stays removed.
  INSERT INTO public.church_calendar_reads (instance_id, sha256, kind)
  VALUES (v_instance, v_sha, v_kind)
  ON CONFLICT (instance_id, sha256) DO NOTHING;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('result', 'already', 'read', 0, 'added', 0);
  END IF;

  FOR v_ev IN SELECT * FROM jsonb_array_elements(events_in) LOOP
    v_read := v_read + 1;
    v_name := btrim(coalesce(v_ev->>'name', ''));
    BEGIN
      v_date := (v_ev->>'date')::date;
    EXCEPTION WHEN others THEN
      v_date := NULL;
    END;
    CONTINUE WHEN v_date IS NULL OR length(v_name) NOT BETWEEN 1 AND 200;
    -- The same name on the same day (typed by the office, or read from
    -- another picture, archived or not) is already on the calendar.
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.ministry_ops o
       WHERE o.instance_id = v_instance AND o.ministry = 'calendar' AND o.week_of = v_date
         AND lower(btrim(o.title)) = lower(v_name)
    );
    v_detail := nullif(concat_ws(E'\n',
      CASE WHEN btrim(coalesce(v_ev->>'time', '')) <> '' THEN 'Time: ' || left(btrim(v_ev->>'time'), 60) END,
      CASE WHEN btrim(coalesce(v_ev->>'place', '')) <> '' THEN 'Place: ' || left(btrim(v_ev->>'place'), 120) END,
      nullif(left(btrim(coalesce(v_ev->>'detail', '')), 600), '')
    ), '');
    INSERT INTO public.ministry_ops
      (instance_id, ministry, title, detail, week_of, status, member_visible, read_from, picture_path)
    VALUES
      (v_instance, 'calendar', v_name, v_detail, v_date, 'todo', true, v_kind || ':' || v_sha, v_path);
    v_added := v_added + 1;
  END LOOP;

  UPDATE public.church_calendar_reads SET events_read = v_read, events_added = v_added
   WHERE instance_id = v_instance AND sha256 = v_sha;
  RETURN jsonb_build_object('result', 'filed', 'read', v_read, 'added', v_added);
END;
$$;
REVOKE ALL ON FUNCTION public.church_calendar_keep_read(text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.church_calendar_keep_read(text, jsonb, jsonb) TO service_role;

COMMENT ON TABLE public.church_calendar_reads IS
  'Each office picture (calendar or flyer) the daily reader has filed as calendar events, once (0343, DR-1628).';

-- ---------------------------------------------------------------------------
-- 6. THE OFFICE UPLOADS A PICTURE THE WEBSITE NEVER HAD (or no longer has)
-- ---------------------------------------------------------------------------
-- Darrell 2026-11-24: "We need to find the churches archives of event flyers
-- etc... on the website or we can add through uploading". The website road is
-- the daily reader (site + Wayback). This is the hand road: the office puts
-- the bytes in the private bucket at <instance>/<sha256>.<ext> (the storage
-- policy below admits only the office, only into its own church's folder),
-- then files the row here. An uploaded picture has no site path.
ALTER TABLE public.church_site_archive ALTER COLUMN source_path DROP NOT NULL;
DO $arch$
BEGIN
  ALTER TABLE public.church_site_archive DROP CONSTRAINT IF EXISTS church_site_archive_source_path_check;
  ALTER TABLE public.church_site_archive DROP CONSTRAINT IF EXISTS church_site_archive_source_page_check;
  ALTER TABLE public.church_site_archive DROP CONSTRAINT IF EXISTS church_site_archive_found_via_check;
  ALTER TABLE public.church_site_archive DROP CONSTRAINT IF EXISTS church_site_archive_where_chk;
  ALTER TABLE public.church_site_archive ADD CONSTRAINT church_site_archive_where_chk CHECK (
    (found_via IN ('site', 'wayback')
       AND source_path ~ '^/uploads/'
       AND source_page IN ('calendar', 'letters-from-bg', 'current-events', 'previous-events'))
    OR (found_via = 'upload' AND source_path IS NULL AND source_page = 'upload')
  );
END
$arch$;

CREATE OR REPLACE FUNCTION public.church_site_archive_upload(
  instance_in uuid, kind_in text, sha_in text, bytes_in bigint, content_type_in text,
  year_in integer, month_in integer, title_in text DEFAULT ''
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_sha  text := lower(coalesce(sha_in, ''));
  v_path text;
  v_new  boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF coalesce(public.user_role_in_instance(instance_in), '') NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'only the church office adds to the archive' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF kind_in NOT IN ('calendar', 'letter', 'flyer') THEN RAISE EXCEPTION 'a calendar, a letter or a flyer'; END IF;
  IF v_sha !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'no content hash'; END IF;
  IF content_type_in NOT IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp') THEN RAISE EXCEPTION 'a picture: jpeg, png, gif or webp'; END IF;
  v_path := instance_in::text || '/' || v_sha || '.' || split_part(content_type_in, '/', 2);
  IF to_regclass('storage.objects') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'church-archive' AND o.name = v_path) THEN
    RAISE EXCEPTION 'the picture itself is not in the archive yet; upload it first';
  END IF;

  INSERT INTO public.church_site_archive AS a
    (instance_id, kind, title, for_year, for_month, month_from, sha256, bytes, content_type,
     storage_path, source_path, source_page, found_via)
  VALUES
    (instance_in, kind_in, left(btrim(coalesce(title_in, '')), 200), year_in, month_in, 'page', v_sha, bytes_in,
     content_type_in, v_path, NULL, 'upload', 'upload')
  ON CONFLICT (instance_id, sha256) DO UPDATE SET last_seen_at = now(), seen_count = a.seen_count + 1
  RETURNING (xmax = 0) INTO v_new;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, note)
  VALUES (instance_in, auth.uid(), 'create', 'church_site_archive',
          'church_site_archive_upload: the office uploaded a ' || kind_in || ' for ' || year_in || '-' || lpad(month_in::text, 2, '0'));
  RETURN CASE WHEN v_new THEN 'kept' ELSE 'seen' END;
END;
$$;
REVOKE ALL ON FUNCTION public.church_site_archive_upload(uuid, text, text, bigint, text, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_site_archive_upload(uuid, text, text, bigint, text, integer, integer, text) TO authenticated;

DO $bucket$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE '0343: storage is not on this box yet - the office upload policy is not asserted';
    RETURN;
  END IF;
  EXECUTE 'DROP POLICY IF EXISTS church_archive_objects_office_insert ON storage.objects';
  EXECUTE $p$CREATE POLICY church_archive_objects_office_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'church-archive'
      AND public.user_role_in_instance(public.church_archive_path_instance(name)) IN ('owner', 'admin')
      AND name ~ '^[0-9a-f-]{36}/[0-9a-f]{64}\.(jpeg|png|gif|webp)$')$p$;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0343: insufficient privilege on storage - add the office upload policy by hand';
END
$bucket$;

-- ---------------------------------------------------------------------------
-- 7. THE OVERLAYS — re-run: two new instance-scoped tables.
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
