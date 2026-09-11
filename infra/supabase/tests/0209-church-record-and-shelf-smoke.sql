-- =============================================================================
-- 0209 CHURCH RECORD AND SHELF SMOKE — the walls, proven rather than commented
-- (0209). Run on the LIVE Supabase (as postgres) AFTER 0209. Runs in a
-- transaction and ROLLS BACK.
-- PASS prints 'CHURCH RECORD AND SHELF SMOKE: PASS'; any breach RAISES.
--
-- A comment claiming a wall is not a wall. Every refusal 0209 states in prose
-- is asserted here against the real database, because the one that matters most
-- — that a church cannot learn what a person gives — is exactly the kind of
-- promise that quietly stops being true.
--
-- Assertions
--   a member reads and fills their OWN record                               ✔
--   a giving amount is refused by the PATCH GUARD             -> REFUSED    ✘
--   a giving total is refused by the TABLE CONSTRAINT too     -> REFUSED    ✘
--     (two independent walls: no path, and no row)
--   an SSN / password / diagnosis is refused                  -> REFUSED    ✘
--   the office roll returns the ROLL cells                                  ✔
--   ... and NOT what the person studies or their household                  ✘
--   a prayer request aimed at the pastor ALONE is absent from the roll      ✘
--   ... and one aimed at the prayer team IS present                         ✔
--   a non-office member cannot read the roll at all           -> REFUSED    ✘
--   a document is private to its filer                        -> 0 rows     ✘
--   ... visible to the office only once SHARED                             ✔
--   ... and the office still cannot EDIT it (the pen stays home) -> 0 rows  ✘
--   a document that is neither a file nor a pointer is refused -> REFUSED   ✘
-- =============================================================================
BEGIN;

\set mem   'a0000000-0000-4000-a000-000000000209'
\set mem2  'b0000000-0000-4000-a000-000000000209'
\set staff 'c0000000-0000-4000-a000-000000000209'
\set inst  '10000000-0000-4000-b000-000000000209'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', :'mem',   'authenticated','authenticated','mem0209@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'mem2',  'authenticated','authenticated','mem2-0209@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'staff', 'authenticated','authenticated','staff0209@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type)
VALUES (:'inst', 'church-0209', 'Test Church', 'church');
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'inst', :'mem',   'member', 'A Member'),
  (:'inst', :'mem2',  'member', 'Another Member'),
  (:'inst', :'staff', 'admin',  'The Office');

-- ── a member fills their own record ────────────────────────────────────────
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000209","role":"authenticated"}';

PERFORM public.church_member_record_patch(jsonb_build_object(
  'fullName', 'Sister Ruth', 'contactEmail', 'ruth@test.local',
  'standing', 'A member', 'studyInterest', 'The book of Ruth',
  'childrenCount', '2',
  'prayerRequest', 'for my mother', 'prayerShareable', 'Only the pastor'));

DO $$
DECLARE v jsonb;
BEGIN
  v := public.church_member_record_read();
  IF v->'record'->>'fullName' IS DISTINCT FROM 'Sister Ruth' THEN
    RAISE EXCEPTION 'a member must read their own record';
  END IF;
END $$;

-- ── the giving wall: two independent refusals ──────────────────────────────
DO $$
BEGIN
  BEGIN
    PERFORM public.church_member_record_patch(jsonb_build_object('givingAmount', 100));
    RAISE EXCEPTION 'BREACH: the patch guard accepted a giving amount';
  EXCEPTION WHEN others THEN
    IF position('what a person gives' in SQLERRM) = 0 THEN RAISE; END IF;
  END;
END $$;

-- ...and the table itself refuses, so no future code path can write one either.
SET LOCAL ROLE postgres;
DO $$
BEGIN
  BEGIN
    UPDATE public.church_member_records
       SET record = record || jsonb_build_object('givingTotal', 4200)
     WHERE user_id = 'a0000000-0000-4000-a000-000000000209';
    RAISE EXCEPTION 'BREACH: the table accepted a giving total';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000209","role":"authenticated"}';
DO $$
DECLARE k text;
BEGIN
  FOREACH k IN ARRAY ARRAY['ssn','password','diagnosis','accountNumber'] LOOP
    BEGIN
      PERFORM public.church_member_record_patch(jsonb_build_object(k, 'x'));
      RAISE EXCEPTION 'BREACH: the patch guard accepted %', k;
    EXCEPTION WHEN others THEN
      IF position('BREACH' in SQLERRM) > 0 THEN RAISE; END IF;
    END;
  END LOOP;
END $$;

-- A second member, whose request IS aimed at the prayer team.
SET LOCAL "request.jwt.claims" TO '{"sub":"b0000000-0000-4000-a000-000000000209","role":"authenticated"}';
PERFORM public.church_member_record_patch(jsonb_build_object(
  'fullName', 'Brother Amos', 'contactEmail', 'amos@test.local', 'standing', 'A member',
  'prayerRequest', 'for work', 'prayerShareable', 'The prayer team'));

-- ── a member may NOT read the roll ─────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    PERFORM public.church_roll_read('10000000-0000-4000-b000-000000000209');
    RAISE EXCEPTION 'BREACH: a member read the roll';
  EXCEPTION WHEN others THEN
    IF position('only the church office' in SQLERRM) = 0 THEN RAISE; END IF;
  END;
END $$;

-- ── the office roll: the roll cells, and only those ────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000209","role":"authenticated"}';
DO $$
DECLARE v jsonb; ruth jsonb; amos jsonb;
BEGIN
  v := public.church_roll_read('10000000-0000-4000-b000-000000000209');
  IF (v->>'count')::int <> 2 THEN RAISE EXCEPTION 'the roll must carry both members'; END IF;
  SELECT x INTO ruth FROM jsonb_array_elements(v->'rows') x WHERE x->>'fullName' = 'Sister Ruth';
  SELECT x INTO amos FROM jsonb_array_elements(v->'rows') x WHERE x->>'fullName' = 'Brother Amos';

  IF ruth->>'contactEmail' IS DISTINCT FROM 'ruth@test.local' THEN
    RAISE EXCEPTION 'the roll must carry how to reach a person';
  END IF;
  -- What she studies, and her household, are HERS.
  IF ruth ? 'studyInterest' THEN RAISE EXCEPTION 'BREACH: the office saw what she studies'; END IF;
  IF ruth ? 'childrenCount' THEN RAISE EXCEPTION 'BREACH: the office saw her household counts'; END IF;
  -- Her request was for the pastor ALONE: absent, not blanked.
  IF ruth->>'prayerRequest' IS NOT NULL THEN
    RAISE EXCEPTION 'BREACH: a pastor-only prayer request reached the roll';
  END IF;
  -- His was for the prayer team: present.
  IF amos->>'prayerRequest' IS DISTINCT FROM 'for work' THEN
    RAISE EXCEPTION 'a prayer-team request must reach the team';
  END IF;
END $$;

-- ── the shelf ──────────────────────────────────────────────────────────────
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000209","role":"authenticated"}';
INSERT INTO public.church_documents (instance_id, filed_by, title, kind, paper_location)
VALUES (:'inst', :'mem', 'My baptism certificate', 'certificate', 'the blue folder at home');

-- A row that is neither a file nor a pointer is refused.
DO $$
BEGIN
  BEGIN
    INSERT INTO public.church_documents (instance_id, filed_by, title)
    VALUES ('10000000-0000-4000-b000-000000000209', 'a0000000-0000-4000-a000-000000000209', 'nothing at all');
    RAISE EXCEPTION 'BREACH: a document with neither a file nor a pointer was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

-- Private to its filer: the office sees nothing yet.
SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000209","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.church_documents;
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: the office read an unshared document'; END IF;
END $$;

-- The filer shares it; now the office sees it.
SET LOCAL "request.jwt.claims" TO '{"sub":"a0000000-0000-4000-a000-000000000209","role":"authenticated"}';
UPDATE public.church_documents SET shared_with_office = true WHERE filed_by = :'mem';

SET LOCAL "request.jwt.claims" TO '{"sub":"c0000000-0000-4000-a000-000000000209","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.church_documents;
  IF n <> 1 THEN RAISE EXCEPTION 'a shared document must reach the office'; END IF;
  -- ...but sharing does NOT hand over the pen.
  UPDATE public.church_documents SET title = 'the office renamed it';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: the office edited a document it does not own'; END IF;
END $$;

-- Another member never sees it at all, shared or not.
SET LOCAL "request.jwt.claims" TO '{"sub":"b0000000-0000-4000-a000-000000000209","role":"authenticated"}';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.church_documents;
  IF n <> 0 THEN RAISE EXCEPTION 'BREACH: another member read a shelf that is not theirs'; END IF;
END $$;

SET LOCAL ROLE postgres;
DO $$ BEGIN RAISE NOTICE 'CHURCH RECORD AND SHELF SMOKE: PASS'; END $$;

ROLLBACK;
