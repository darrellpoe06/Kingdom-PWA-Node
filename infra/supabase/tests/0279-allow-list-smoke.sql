-- =============================================================================
-- 0279 — the door_events allow-list carries every subject, and each is readable
-- =============================================================================
-- DR-0976. Rolls back.
--
-- WHAT THIS CATCHES, measured: 0275 rebuilt door_events_subject_check from
-- 0262's two values plus 'stay', deleting 0263's 'document' and 0266's
-- 'camera'. Lease signing (three writes) and door-camera access (a trigger)
-- raised on every write for ~28 hours live, and 0263's smoke failed 10
-- consecutive rls-isolation runs.
--
-- It also catches the mirror fault in the same breath: 0275 added
-- 'portal-request' to the constraint and never gave door_events_read an arm
-- for it, so its own audit rows were written and then invisible to every
-- authenticated reader — a `CASE ... ELSE false` hides what it has no arm for.
--
-- Run AFTER 0279. Needs door_events (0262) and the tables each arm points at.
--
-- THE INSTANCE IS CREATED, NOT INVENTED. The first version of this file made
-- up an instance_id, and `door_events.instance_id` REFERENCES instances(id)
-- (0262:138) — so every insert below failed the foreign key and the CI leg
-- went red. It passed locally because the reproduction I proved it against was
-- a hand-built door_events with no foreign keys: real PostgreSQL, but not the
-- real SCHEMA. The sibling smokes all create their own rows and roll back
-- (0263:31), which is the idiom this now follows.
BEGIN;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010279', 'allow-list-smoke-279', 'Allow-list Smoke', 'business')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  inst uuid := '00000000-0000-4000-b000-000000010279';
  n int;
  qual text;
  v text;
BEGIN
  -- 1. EVERY SUBJECT THE CONSTRAINT ALLOWS CAN ACTUALLY BE WRITTEN. The list
  --    is read from the constraint itself rather than retyped here: a retyped
  --    list is the exact mistake 0275 made.
  FOR v IN
    SELECT unnest(regexp_matches(pg_get_constraintdef(oid), '''([a-z-]+)''', 'g'))
      FROM pg_constraint WHERE conname = 'door_events_subject_check'
  LOOP
    BEGIN
      EXECUTE format(
        'INSERT INTO door_events (instance_id, subject, subject_id, event) VALUES (%L, %L, %L, %L)',
        inst, v, gen_random_uuid(), 'smoke');
    EXCEPTION WHEN check_violation THEN
      RAISE EXCEPTION 'ALLOW-LIST SMOKE FAIL: the constraint names subject %, and writing it is refused', v;
    END;
  END LOOP;

  -- 2. THE TWO 0275 DELETED ARE NAMED EXPLICITLY, so this fails loudly if a
  --    later file rebuilds the list without them even if everything else holds.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'door_events_subject_check'
                    AND pg_get_constraintdef(oid) LIKE '%''document''%') THEN
    RAISE EXCEPTION 'ALLOW-LIST SMOKE FAIL: ''document'' is gone again — lease signing writes it three times (0263)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'door_events_subject_check'
                    AND pg_get_constraintdef(oid) LIKE '%''camera''%') THEN
    RAISE EXCEPTION 'ALLOW-LIST SMOKE FAIL: ''camera'' is gone again — the 0266 trigger writes it on every grant';
  END IF;

  SELECT count(*) INTO n FROM door_events WHERE instance_id = inst;
  IF n < 5 THEN
    RAISE EXCEPTION 'ALLOW-LIST SMOKE FAIL: only % subject(s) were written; the constraint looks empty', n;
  END IF;

  -- 3. THE READ POLICY HAS AN ARM FOR EACH ONE. `ELSE false` means a subject
  --    with no arm is written and then unreadable, which is silent by
  --    construction — so it is asserted rather than trusted.
  SELECT pg_get_expr(polqual, polrelid) INTO qual FROM pg_policy WHERE polname = 'door_events_read';
  IF qual IS NULL THEN
    RAISE EXCEPTION 'ALLOW-LIST SMOKE FAIL: door_events_read is gone';
  END IF;
  FOREACH v IN ARRAY ARRAY['rent', 'work', 'document', 'camera', 'stay', 'portal-request'] LOOP
    IF position(''''  || v || '''' IN qual) = 0 THEN
      RAISE EXCEPTION 'ALLOW-LIST SMOKE FAIL: door_events_read has no arm for %, so those rows are written and then invisible', v;
    END IF;
  END LOOP;

  -- 'application' is allowed and deliberately has NO arm: 0272 (PR #2106) is
  -- the file that adds that value and defines the table it points at. Asserted
  -- so that when 0272 lands and adds the arm, whoever updates this reads why.
  IF position('''application''' IN qual) <> 0 THEN
    RAISE EXCEPTION 'ALLOW-LIST SMOKE FAIL: door_events_read gained an application arm — if 0272 landed, update this smoke and DR-0976';
  END IF;

  RAISE NOTICE 'ALLOW-LIST SMOKE: PASS';
END $$;

ROLLBACK;
