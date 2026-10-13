-- =============================================================================
-- 0259 USAGE CALENDAR SMOKE — when, and by whom, for the governor circle only
-- (DR-0843). Runs after the chain, in a transaction, and ROLLS BACK. PASS
-- prints 'USAGE CALENDAR SMOKE: PASS'; any breach RAISES.
--
-- Assertions
--   a governor reads each person's opens and uses per day (counts only)     ✔
--   two opens on one day by one person read as one row with n = 2           ✔
--   a view and a use on the same day are two rows, by kind                  ✔
--   an event older than the window is not counted                           ✔
--   no view name rides in the answer (the row has user_id, day, kind, n)    ✔
--   a caller outside poe-family is refused                        -> REFUSED ✘
-- =============================================================================
BEGIN;

\set gov  'a0000000-0000-4000-a000-000000000259'
\set son  'b0000000-0000-4000-a000-000000000259'
\set out  'c0000000-0000-4000-a000-000000000259'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'gov', 'authenticated','authenticated','gov0259@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'son', 'authenticated','authenticated','son0259@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'out', 'authenticated','authenticated','out0259@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type)
VALUES ('70000000-0000-4000-b000-000000000259', 'poe-family', 'Poe Family (smoke)', 'family')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name)
VALUES ((SELECT id FROM instances WHERE slug = 'poe-family'), :'gov', 'member', 'The Governor');

-- Yesterday in Chicago, at 10:00, 12:00 and 13:00 local, so the three events
-- share one calendar day whatever hour this smoke runs.
INSERT INTO usage_events (owner, kind, name, at) VALUES
  (:'son', 'view', 'properties',    (((now() AT TIME ZONE 'America/Chicago')::date - 1) + time '10:00') AT TIME ZONE 'America/Chicago'),
  (:'son', 'view', 'books',         (((now() AT TIME ZONE 'America/Chicago')::date - 1) + time '12:00') AT TIME ZONE 'America/Chicago'),
  (:'son', 'use',  'camera.window', (((now() AT TIME ZONE 'America/Chicago')::date - 1) + time '13:00') AT TIME ZONE 'America/Chicago'),
  (:'son', 'view', 'properties',    now() - interval '400 days'),
  (:'gov', 'view', 'admin',         now() - interval '2 days');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000259","role":"authenticated"}';

DO $$
DECLARE
  son_view bigint; son_use bigint; son_rows int; old_rows int;
BEGIN
  SELECT n INTO son_view FROM public.usage_calendar_metrics(90) m WHERE m.user_id = 'b0000000-0000-4000-a000-000000000259' AND m.kind = 'view' AND m.day = (now() AT TIME ZONE 'America/Chicago')::date - 1;
  SELECT n INTO son_use  FROM public.usage_calendar_metrics(90) m WHERE m.user_id = 'b0000000-0000-4000-a000-000000000259' AND m.kind = 'use'  AND m.day = (now() AT TIME ZONE 'America/Chicago')::date - 1;
  SELECT count(*) INTO son_rows FROM public.usage_calendar_metrics(90) m WHERE m.user_id = 'b0000000-0000-4000-a000-000000000259';
  SELECT count(*) INTO old_rows FROM public.usage_calendar_metrics(90) m WHERE m.day < (now() - interval '300 days')::date;
  IF son_view IS DISTINCT FROM 2 THEN RAISE EXCEPTION 'SMOKE FAIL: two opens on one day should read n = 2, read %', son_view; END IF;
  IF son_use IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'SMOKE FAIL: the use on that day should read n = 1, read %', son_use; END IF;
  IF son_rows <> 2 THEN RAISE EXCEPTION 'SMOKE FAIL: the son should have exactly two rows in the window (view, use), read %', son_rows; END IF;
  IF old_rows <> 0 THEN RAISE EXCEPTION 'SMOKE FAIL: an event older than the window was counted'; END IF;
  -- the shape: user_id, day, kind, n and nothing else (no view name rides here)
  PERFORM m.user_id, m.day, m.kind, m.n FROM public.usage_calendar_metrics(90) m LIMIT 1;
END $$;

SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000259","role":"authenticated"}';
DO $$ BEGIN
  PERFORM * FROM public.usage_calendar_metrics(90);
  RAISE EXCEPTION 'SMOKE FAIL: a caller outside poe-family read the calendar';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;

RESET ROLE;
SELECT 'USAGE CALENDAR SMOKE: PASS' AS result;
ROLLBACK;
