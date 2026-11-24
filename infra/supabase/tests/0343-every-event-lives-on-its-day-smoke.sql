-- =============================================================================
-- 0343 EVERY EVENT LIVES ON ITS DAY SMOKE — the walls of DR-1628, proven.
-- Runs in a transaction and ROLLS BACK. PASS prints
-- 'CALENDAR DAYS SMOKE: PASS'; any breach RAISES.
--
-- Assertions
--   the reader files the November calendar's events on their days     ✔
--     (time and place kept as words; the picture named on each row)
--   the SAME picture again files nothing ('already')                 ✔
--   an event the office removed does not come back on the next run   ✔
--   a flyer naming an event already on that day does not double it   ✔
--   a member cannot call the reader's door                -> REFUSED ✘
--   a plain member cannot add an event                    -> REFUSED ✘
--   a named lead adds for their unit; the row says the unit           ✔
--   a named lead cannot add for a unit they do not lead   -> REFUSED ✘
--   a lead of ANOTHER church cannot add here              -> REFUSED ✘
--   the office adds for the church, and "Use again" links the source  ✔
--   a member cannot name a lead; the office can                       ✘✔
--   Use again cannot reach another church's event         -> REFUSED ✘
--   only an archived calendar/flyer is read; a letter is not        ✘
--   the office uploads an old flyer; a member cannot; bytes first    ✔✘
--   the office cannot write into another church's folder   -> REFUSED ✘
--   can_post answers office / units / nothing truthfully              ✔
-- =============================================================================
BEGIN;

\set mem    'a0000000-0000-4000-a000-000000000343'
\set lead   'b0000000-0000-4000-a000-000000000343'
\set office 'c0000000-0000-4000-a000-000000000343'
\set other  'd0000000-0000-4000-a000-000000000343'
\set inst   '10000000-0000-4000-b000-000000000343'
\set inst2  '20000000-0000-4000-b000-000000000343'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'mem',    'authenticated', 'authenticated', 'mem0343@test.local',    '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'lead',   'authenticated', 'authenticated', 'lead0343@test.local',   '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'office', 'authenticated', 'authenticated', 'office0343@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'other',  'authenticated', 'authenticated', 'other0343@test.local',  '', now(), now());
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'inst',  'church-0343',  'Test Church',    'church'),
  (:'inst2', 'church-0343b', 'Another Church', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst',  :'mem',    'member', 'A Member'),
  (:'inst',  :'lead',   'member', 'Choir Lead'),
  (:'inst',  :'office', 'admin',  'The Office'),
  (:'inst2', :'other',  'member', 'Elsewhere');
-- A lead in the OTHER church, for the cross-church wall.
INSERT INTO church_calendar_leads (instance_id, user_id, unit) VALUES (:'inst2', :'other', 'Choir');
-- The pictures the archive already keeps (0342): the November calendar and the Battle Cry flyer.
INSERT INTO church_site_archive (instance_id, kind, title, for_year, for_month, month_from, sha256, bytes, content_type,
                                 storage_path, source_path, source_page)
VALUES
  (:'inst', 'calendar', 'November 2026 calendar', 2026, 11, 'page', repeat('c', 64), 100, 'image/jpeg',
   :'inst' || '/' || repeat('c', 64) || '.jpeg', '/uploads/6/0/6/7/6067835/november-2026-calendar.jpg', 'calendar'),
  (:'inst', 'flyer', 'Battle Cry Sunday', 2026, 11, 'first-seen', repeat('f', 64), 100, 'image/jpeg',
   :'inst' || '/' || repeat('f', 64) || '.jpeg', '/uploads/6/0/6/7/6067835/battle-cry.jpg', 'current-events'),
  (:'inst', 'letter', 'October 2026 letter', 2026, 10, 'file', repeat('e', 64), 100, 'image/jpeg',
   :'inst' || '/' || repeat('e', 64) || '.jpeg', '/uploads/6/0/6/7/6067835/october-2026-letter.jpg', 'letters-from-bg');
INSERT INTO ministry_ops (id, instance_id, ministry, title, week_of, member_visible)
VALUES ('e9000000-0000-4000-a000-000000000343', :'inst2', 'calendar', 'Their Revival', '2026-10-01', true);

-- ── the reader files a calendar's events, once ─────────────────────────────
SET LOCAL ROLE service_role;
DO $$
DECLARE r jsonb; n int; d text; p text; rf text;
  cal jsonb := jsonb_build_object('sha256', repeat('c', 64));
  evs jsonb := '[
    {"date":"2026-11-24","name":"NA Meeting","time":"9:00 AM","place":"Café"},
    {"date":"2026-11-15","name":"Battle Cry Sunday","time":"11:00 AM"},
    {"date":"2026-11-03","name":"Election Day","time":"6:00 AM to 7:00 PM"},
    {"date":"2026-02-30","name":"Not a day"},
    {"date":"2026-11-10","name":""}
  ]'::jsonb;
BEGIN
  r := public.church_calendar_keep_read('church-0343', cal, evs);
  IF r->>'result' <> 'filed' OR (r->>'added')::int <> 3 OR (r->>'read')::int <> 5 THEN
    RAISE EXCEPTION 'BREACH: the calendar must file its 3 real events, got %', r;
  END IF;
  SELECT detail, picture_path, read_from INTO d, p, rf FROM ministry_ops
   WHERE instance_id = '10000000-0000-4000-b000-000000000343' AND week_of = '2026-11-24' AND title = 'NA Meeting';
  IF d IS DISTINCT FROM E'Time: 9:00 AM\nPlace: Café' THEN RAISE EXCEPTION 'BREACH: time and place must be kept as words, got %', d; END IF;
  IF p <> '10000000-0000-4000-b000-000000000343/' || repeat('c', 64) || '.jpeg' OR rf <> 'calendar:' || repeat('c', 64) THEN
    RAISE EXCEPTION 'BREACH: the row must name the picture it was read from';
  END IF;

  r := public.church_calendar_keep_read('church-0343', cal, evs);
  IF r->>'result' <> 'already' THEN RAISE EXCEPTION 'BREACH: the same picture must file once, got %', r; END IF;

  -- A flyer for Battle Cry Sunday: already on that day, not doubled.
  r := public.church_calendar_keep_read('church-0343',
         jsonb_build_object('sha256', repeat('f', 64)),
         '[{"date":"2026-11-15","name":"battle cry sunday","time":"11:00 AM"}]'::jsonb);
  IF (r->>'added')::int <> 0 THEN RAISE EXCEPTION 'BREACH: the flyer doubled an event already on its day'; END IF;
  SELECT count(*) INTO n FROM ministry_ops WHERE week_of = '2026-11-15' AND ministry = 'calendar'
     AND instance_id = '10000000-0000-4000-b000-000000000343';
  IF n <> 1 THEN RAISE EXCEPTION 'BREACH: one event on its day, found %', n; END IF;

  -- A picture the archive does not hold, and a letter, are not read.
  BEGIN
    PERFORM public.church_calendar_keep_read('church-0343', jsonb_build_object('sha256', repeat('9', 64)), '[]'::jsonb);
    RAISE EXCEPTION 'BREACH: a picture outside the archive was read onto the calendar';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'BREACH%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.church_calendar_keep_read('church-0343', jsonb_build_object('sha256', repeat('e', 64)), '[]'::jsonb);
    RAISE EXCEPTION 'BREACH: a letter was read onto the calendar';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'BREACH%' THEN RAISE; END IF;
  END;
END $$;

-- The office removes a future event the picture listed (as if in error);
-- the next run must not bring it back.
SET LOCAL ROLE postgres;
DELETE FROM ministry_ops WHERE instance_id = :'inst' AND title = 'NA Meeting';
SET LOCAL ROLE service_role;
DO $$
DECLARE n int;
BEGIN
  PERFORM public.church_calendar_keep_read('church-0343',
    jsonb_build_object('sha256', repeat('c', 64)),
    '[{"date":"2026-11-24","name":"NA Meeting"}]'::jsonb);
  SELECT count(*) INTO n FROM ministry_ops WHERE title = 'NA Meeting' AND instance_id = '10000000-0000-4000-b000-000000000343';
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: an event the office removed came back'; END IF;
END $$;

-- ── a plain member ─────────────────────────────────────────────────────────
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000343","role":"authenticated"}';
DO $$
DECLARE j jsonb;
BEGIN
  BEGIN
    PERFORM public.church_calendar_keep_read('church-0343', '{}'::jsonb, '[]'::jsonb);
    RAISE EXCEPTION 'BREACH: a member called the reader''s door';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.church_calendar_post('10000000-0000-4000-b000-000000000343', 'My party', '2026-12-01');
    RAISE EXCEPTION 'BREACH: a plain member added to the calendar';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO church_calendar_leads (instance_id, user_id, unit)
    VALUES ('10000000-0000-4000-b000-000000000343', 'a0000000-0000-4000-a000-000000000343', 'Choir');
    RAISE EXCEPTION 'BREACH: a member named themselves a lead';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  j := public.church_calendar_can_post('10000000-0000-4000-b000-000000000343');
  IF (j->>'office')::boolean OR jsonb_array_length(j->'units') <> 0 THEN RAISE EXCEPTION 'BREACH: a member was told they may post: %', j; END IF;
  BEGIN
    PERFORM public.church_site_archive_upload('10000000-0000-4000-b000-000000000343', 'flyer', repeat('1', 64), 10, 'image/png', 2025, 11, 'Old flyer');
    RAISE EXCEPTION 'BREACH: a member added to the archive';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- ── the office names a lead ────────────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000343","role":"authenticated"}';
INSERT INTO church_calendar_leads (instance_id, user_id, unit, granted_by) VALUES (:'inst', :'lead', 'Choir', :'office');
DO $$
DECLARE j jsonb;
BEGIN
  -- Not a member of this church: refused even for the office.
  BEGIN
    INSERT INTO church_calendar_leads (instance_id, user_id, unit)
    VALUES ('10000000-0000-4000-b000-000000000343', 'd0000000-0000-4000-a000-000000000343', 'Ushers');
    RAISE EXCEPTION 'BREACH: the office named a lead from another church';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  j := public.church_calendar_can_post('10000000-0000-4000-b000-000000000343');
  IF NOT (j->>'office')::boolean THEN RAISE EXCEPTION 'BREACH: the office was not told it may post'; END IF;
  -- The office uploads last year's flyer: refused until the bytes are there, then kept.
  BEGIN
    PERFORM public.church_site_archive_upload('10000000-0000-4000-b000-000000000343', 'flyer', repeat('1', 64), 10, 'image/png', 2025, 11, 'Old flyer');
    RAISE EXCEPTION 'BREACH: a row was filed for a picture that is not in the bucket';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'BREACH%' THEN RAISE; END IF;
  END;
  INSERT INTO storage.objects (bucket_id, name)
  VALUES ('church-archive', '10000000-0000-4000-b000-000000000343/' || repeat('1', 64) || '.png');
  IF public.church_site_archive_upload('10000000-0000-4000-b000-000000000343', 'flyer', repeat('1', 64), 10, 'image/png', 2025, 11, 'Old flyer') <> 'kept' THEN
    RAISE EXCEPTION 'BREACH: the office''s upload was not kept';
  END IF;
  BEGIN
    INSERT INTO storage.objects (bucket_id, name)
    VALUES ('church-archive', '20000000-0000-4000-b000-000000000343/' || repeat('2', 64) || '.png');
    RAISE EXCEPTION 'BREACH: the office put a picture in another church''s folder';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- ── the lead ───────────────────────────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"b0000000-0000-4000-a000-000000000343","role":"authenticated"}';
DO $$
DECLARE id_ uuid; u text; j jsonb;
BEGIN
  j := public.church_calendar_can_post('10000000-0000-4000-b000-000000000343');
  IF (j->>'office')::boolean OR j->'units' <> '["Choir"]'::jsonb THEN RAISE EXCEPTION 'BREACH: the lead was told %', j; END IF;
  id_ := public.church_calendar_post('10000000-0000-4000-b000-000000000343', 'Choir rehearsal', '2026-12-05', 'Time: 10:00 AM', 'choir');
  SELECT sent_by_unit INTO u FROM ministry_ops WHERE id = id_;
  IF u <> 'Choir' THEN RAISE EXCEPTION 'BREACH: the row must say which unit sent it, got %', u; END IF;
  BEGIN
    PERFORM public.church_calendar_post('10000000-0000-4000-b000-000000000343', 'Usher meeting', '2026-12-06', NULL, 'Ushers');
    RAISE EXCEPTION 'BREACH: a lead added for a unit they do not lead';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.church_calendar_post('10000000-0000-4000-b000-000000000343', 'For the church', '2026-12-06');
    RAISE EXCEPTION 'BREACH: a lead added without naming their unit';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- ── a lead of another church ───────────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"d0000000-0000-4000-a000-000000000343","role":"authenticated"}';
DO $$
BEGIN
  BEGIN
    PERFORM public.church_calendar_post('10000000-0000-4000-b000-000000000343', 'Visiting', '2026-12-07', NULL, 'Choir');
    RAISE EXCEPTION 'BREACH: another church''s lead added here';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- ── the office: adds for the church, and uses a past event again ───────────
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000343","role":"authenticated"}';
DO $$
DECLARE src uuid; id_ uuid; r uuid; u text; n int;
BEGIN
  SELECT id INTO src FROM ministry_ops WHERE title = 'Battle Cry Sunday' AND instance_id = '10000000-0000-4000-b000-000000000343';
  id_ := public.church_calendar_post('10000000-0000-4000-b000-000000000343', 'Battle Cry Sunday', '2027-11-14',
                                     'Time: 11:00 AM', NULL, src);
  SELECT reused_from, sent_by_unit INTO r, u FROM ministry_ops WHERE id = id_;
  IF r IS DISTINCT FROM src OR u IS NOT NULL THEN RAISE EXCEPTION 'BREACH: Use again must link its source and post for the church'; END IF;
  SELECT count(*) INTO n FROM ministry_ops WHERE title = 'Battle Cry Sunday' AND instance_id = '10000000-0000-4000-b000-000000000343';
  IF n <> 2 THEN RAISE EXCEPTION 'BREACH: last year''s event must stay on its day, found %', n; END IF;
  BEGIN
    PERFORM public.church_calendar_post('10000000-0000-4000-b000-000000000343', 'Elsewhere', '2027-01-01', NULL, NULL,
      'e9000000-0000-4000-a000-000000000343');
    RAISE EXCEPTION 'BREACH: Use again copied another church''s event';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'BREACH%' THEN RAISE; END IF;
  END;
  SELECT count(*) INTO n FROM audit_log WHERE entity_type = 'church_calendar_event' AND action = 'create';
  IF n < 2 THEN RAISE EXCEPTION 'BREACH: each post must leave an audit row, found %', n; END IF;
END $$;

-- ── the next run reads the uploaded flyer onto its day ─────────────────────
SET LOCAL ROLE service_role;
DO $$
DECLARE r jsonb; fv text;
BEGIN
  r := public.church_calendar_keep_read('church-0343', jsonb_build_object('sha256', repeat('1', 64)),
         '[{"date":"2025-11-16","name":"Battle Cry Sunday","time":"11:00 AM"}]'::jsonb);
  IF (r->>'added')::int <> 1 THEN RAISE EXCEPTION 'BREACH: the uploaded flyer was not read onto its day, got %', r; END IF;
  SELECT found_via INTO fv FROM church_site_archive WHERE sha256 = repeat('1', 64);
  IF fv <> 'upload' THEN RAISE EXCEPTION 'BREACH: an upload must say it was uploaded'; END IF;
END $$;

SELECT 'CALENDAR DAYS SMOKE: PASS' AS result;
ROLLBACK;
