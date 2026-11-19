-- =============================================================================
-- 0342 CHURCH SITE ARCHIVE SMOKE — the walls of DR-1596, proven, not claimed.
-- Runs in a transaction and ROLLS BACK. PASS prints
-- 'CHURCH SITE ARCHIVE SMOKE: PASS'; any breach RAISES.
--
-- Assertions
--   the reader keeps a flyer                                   -> 'kept'   ✔
--   the SAME flyer seen again is the same row, not a copy      -> 'seen'   ✔
--     (one row, seen_count 2, first_seen_at unchanged)
--   an earlier Wayback sighting moves first_seen_at back                   ✔
--   a month the page states replaces one inferred from the day seen        ✔
--   a signed-in member cannot call the reader's door           -> REFUSED  ✘
--   a member reads their own church's archive                  -> 1 row    ✔
--   a member of ANOTHER church reads none of it                -> 0 rows   ✘
--   a member cannot write or delete an archive row             -> 0 rows   ✘
--   the office (admin) can delete an archive row                           ✔
--   storage: a member reads their church's picture, an outsider does not   ✔✘
--   a PAST calendar event the office removes is ARCHIVED, still there      ✔
--     (archived_by = the office, archived_at set, an audit_log row)
--   a FUTURE calendar event the office removes is deleted                  ✔
--   a direct DELETE of a past calendar row is refused by the wall          ✘
--   a member cannot remove a calendar event                    -> REFUSED  ✘
-- =============================================================================
BEGIN;

\set mem    'a0000000-0000-4000-a000-000000000342'
\set office 'c0000000-0000-4000-a000-000000000342'
\set other  'd0000000-0000-4000-a000-000000000342'
\set inst   '10000000-0000-4000-b000-000000000342'
\set inst2  '20000000-0000-4000-b000-000000000342'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'mem',    'authenticated', 'authenticated', 'mem0342@test.local',    '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'office', 'authenticated', 'authenticated', 'office0342@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'other',  'authenticated', 'authenticated', 'other0342@test.local',  '', now(), now());
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst',  'church-0342',  'Test Church',    'church'),
  (:'inst2', 'church-0342b', 'Another Church', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst',  :'mem',    'member', 'A Member'),
  (:'inst',  :'office', 'admin',  'The Office'),
  (:'inst2', :'other',  'member', 'Elsewhere');

-- ── the reader keeps; the same content is one row ─────────────────────────
SET LOCAL ROLE service_role;
DO $$
DECLARE r text; n int; c int; first_at timestamptz;
  t0 timestamptz := date_trunc('second', now()) - interval '20 days';
  t1 timestamptz := date_trunc('second', now()) - interval '2 days';
  t2 timestamptz := date_trunc('second', now()) - interval '1 day';
  flyer jsonb := jsonb_build_object(
    'kind', 'flyer', 'title', 'Battle Cry Sunday', 'for_year', 2026, 'for_month', 11, 'month_from', 'first-seen',
    'sha256', repeat('a', 64), 'bytes', 1234, 'content_type', 'image/jpeg',
    'source_path', '/uploads/6/0/6/7/6067835/battle-cry-sunday-flyer.jpg', 'source_page', 'current-events');
BEGIN
  flyer := flyer || jsonb_build_object('seen_at', t1);
  r := public.church_site_archive_keep('church-0342', flyer);
  IF r <> 'kept' THEN RAISE EXCEPTION 'BREACH: a new flyer must be kept, got %', r; END IF;
  -- Re-posted under another file name, the next day: the same picture.
  r := public.church_site_archive_keep('church-0342', flyer || jsonb_build_object(
         'source_path', '/uploads/6/0/6/7/6067835/battle-cry-sunday-flyer-2.jpg', 'seen_at', t2));
  IF r <> 'seen' THEN RAISE EXCEPTION 'BREACH: the same flyer seen twice must be one item, got %', r; END IF;
  SELECT count(*), max(seen_count), max(first_seen_at) INTO n, c, first_at
    FROM public.church_site_archive WHERE sha256 = repeat('a', 64);
  IF n <> 1 OR c <> 2 THEN RAISE EXCEPTION 'BREACH: one content must be one row (rows %, seen %)', n, c; END IF;
  IF first_at <> t1 THEN RAISE EXCEPTION 'BREACH: a later sighting moved first_seen_at'; END IF;

  -- A Wayback snapshot saw it earlier, and the page named its month.
  r := public.church_site_archive_keep('church-0342', flyer || jsonb_build_object(
         'found_via', 'wayback', 'seen_at', t0, 'for_month', 10, 'month_from', 'page'));
  SELECT first_seen_at, for_month, month_from INTO first_at, c, r FROM public.church_site_archive WHERE sha256 = repeat('a', 64);
  IF first_at <> t0 THEN RAISE EXCEPTION 'BREACH: an earlier sighting must move first_seen_at back'; END IF;
  IF c <> 10 OR r <> 'page' THEN RAISE EXCEPTION 'BREACH: a stated month must replace an inferred one (% from %)', c, r; END IF;

  -- A calendar for another church instance is a separate archive.
  r := public.church_site_archive_keep('church-0342b', flyer || jsonb_build_object('kind', 'calendar'));
  IF r <> 'kept' THEN RAISE EXCEPTION 'BREACH: another church must keep its own copy'; END IF;
END $$;
-- The bytes, as the reader lays them out.
INSERT INTO storage.objects (bucket_id, name)
SELECT 'church-archive', storage_path FROM public.church_site_archive;

-- ── a member: reads their church's archive and nothing else ───────────────
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000342","role":"authenticated"}';
DO $$
DECLARE n int; d int;
BEGIN
  BEGIN
    PERFORM public.church_site_archive_keep('church-0342', '{}'::jsonb);
    RAISE EXCEPTION 'BREACH: a member called the reader''s door';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  SELECT count(*) INTO n FROM public.church_site_archive;
  IF n <> 1 THEN RAISE EXCEPTION 'BREACH: a member must read exactly their church''s one item, read %', n; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'church-archive';
  IF n <> 1 THEN RAISE EXCEPTION 'BREACH: a member must read exactly their church''s one picture, read %', n; END IF;
  UPDATE public.church_site_archive SET title = 'changed';
  GET DIAGNOSTICS d = ROW_COUNT;
  IF d <> 0 THEN RAISE EXCEPTION 'BREACH: a member changed an archive row'; END IF;
  DELETE FROM public.church_site_archive;
  GET DIAGNOSTICS d = ROW_COUNT;
  IF d <> 0 THEN RAISE EXCEPTION 'BREACH: a member deleted an archive row'; END IF;
END $$;

-- ── another church's member: none of it ────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"d0000000-0000-4000-a000-000000000342","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.church_site_archive WHERE instance_id = '10000000-0000-4000-b000-000000000342';
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: another church''s member read this archive'; END IF;
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'church-archive' AND name LIKE '10000000-0000-4000-b000-000000000342/%';
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: another church''s member read this church''s picture'; END IF;
END $$;

-- ── the calendar: past is archived, future is deleted ──────────────────────
SET LOCAL ROLE postgres;
INSERT INTO ministry_ops (id, instance_id, ministry, title, week_of, member_visible, created_by) VALUES
  ('e0000000-0000-4000-a000-000000000342', :'inst', 'calendar', 'Harvest Day',     public.church_today() - 30, true, :'office'),
  ('e1000000-0000-4000-a000-000000000342', :'inst', 'calendar', 'Posted by mistake', public.church_today() + 30, true, :'office'),
  ('e2000000-0000-4000-a000-000000000342', :'inst', 'calendar', 'Old Revival',     public.church_today() - 400, true, :'office');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000342","role":"authenticated"}';
DO $$
BEGIN
  BEGIN
    PERFORM public.church_calendar_remove('e1000000-0000-4000-a000-000000000342');
    RAISE EXCEPTION 'BREACH: a member removed a calendar event';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000342","role":"authenticated"}';
DO $$
DECLARE r text; n int; by_ uuid; at_ timestamptz;
BEGIN
  r := public.church_calendar_remove('e0000000-0000-4000-a000-000000000342');
  IF r <> 'archived' THEN RAISE EXCEPTION 'BREACH: a past event removed by the office must be archived, got %', r; END IF;
  SELECT archived_by, archived_at INTO by_, at_ FROM ministry_ops WHERE id = 'e0000000-0000-4000-a000-000000000342';
  IF by_ IS DISTINCT FROM 'c0000000-0000-4000-a000-000000000342'::uuid OR at_ IS NULL THEN
    RAISE EXCEPTION 'BREACH: an archived event must keep who archived it and when';
  END IF;

  r := public.church_calendar_remove('e1000000-0000-4000-a000-000000000342');
  IF r <> 'deleted' THEN RAISE EXCEPTION 'BREACH: a future event posted by mistake must still delete, got %', r; END IF;
  SELECT count(*) INTO n FROM ministry_ops WHERE id = 'e1000000-0000-4000-a000-000000000342';
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: the deleted future event is still there'; END IF;

  -- The wall under the function: even the office cannot delete the past directly.
  BEGIN
    DELETE FROM ministry_ops WHERE id = 'e2000000-0000-4000-a000-000000000342';
    RAISE EXCEPTION 'BREACH: a direct delete of a past calendar event went through';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- The office may take a wrong picture out of the archive.
  DELETE FROM public.church_site_archive WHERE instance_id = '10000000-0000-4000-b000-000000000342';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'BREACH: the office could not delete an archive row'; END IF;
END $$;

SET LOCAL ROLE postgres;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM ministry_ops WHERE id IN ('e0000000-0000-4000-a000-000000000342', 'e2000000-0000-4000-a000-000000000342');
  IF n <> 2 THEN RAISE EXCEPTION 'BREACH: a past event is gone from history'; END IF;
  SELECT count(*) INTO n FROM audit_log WHERE entity_type = 'church_calendar_event'
     AND entity_id IN ('e0000000-0000-4000-a000-000000000342', 'e1000000-0000-4000-a000-000000000342');
  IF n <> 2 THEN RAISE EXCEPTION 'BREACH: each removal must leave an audit row, found %', n; END IF;
END $$;

SELECT 'CHURCH SITE ARCHIVE SMOKE: PASS' AS result;
ROLLBACK;
