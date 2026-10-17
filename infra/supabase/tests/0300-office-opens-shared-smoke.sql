-- =============================================================================
-- 0300 SMOKE — the office opens what a member shared with it (DR-1086)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'OFFICE OPENS SHARED SMOKE: PASS'.
-- Every account and instance here is a test row inside this rollback.
--
--   Church C: O is admin (the office), M a member who files two papers, P a
--   second member. S is a stranger who is admin of a different church.
--     O may open M's SHARED paper                            -> true    ✔
--     O may not open M's private paper                       -> false   ✘
--     P (a member, not the office) may not open the shared one -> false ✘
--     S (office of another church) may not open it           -> false   ✘
--     M stops sharing                                        -> O false ✔
-- =============================================================================
BEGIN;

\set o '00000000-0000-4000-a000-0000000a0300'
\set m '00000000-0000-4000-a000-0000000b0300'
\set p '00000000-0000-4000-a000-0000000c0300'
\set s '00000000-0000-4000-a000-0000000d0300'
\set c '00000000-0000-4000-b000-000000010300'
\set c2 '00000000-0000-4000-b000-000000020300'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'o', 'authenticated','authenticated','o0300@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'m', 'authenticated','authenticated','m0300@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'p', 'authenticated','authenticated','p0300@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'s', 'authenticated','authenticated','s0300@test.local','', now(), now());

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:'c',  'church-0300a', 'Church 0300 (smoke)', 'church'),
  (:'c2', 'church-0300b', 'Other church 0300 (smoke)', 'church');

INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:'c',  :'o', 'admin',  'Office O'),
  (:'c',  :'m', 'member', 'Member M'),
  (:'c',  :'p', 'member', 'Member P'),
  (:'c2', :'s', 'admin',  'Other office S');

INSERT INTO church_documents (instance_id, filed_by, title, kind, storage_path, shared_with_office) VALUES
  (:'c', :'m', 'Shared 0300',  'other', '00000000-0000-4000-b000-000000010300/00000000-0000-4000-a000-0000000b0300/shared.pdf',  true),
  (:'c', :'m', 'Private 0300', 'other', '00000000-0000-4000-b000-000000010300/00000000-0000-4000-a000-0000000b0300/private.pdf', false);

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.as_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_temp.as_postgres() TO authenticated;

DO $$
DECLARE
  o uuid := '00000000-0000-4000-a000-0000000a0300';
  m uuid := '00000000-0000-4000-a000-0000000b0300';
  p uuid := '00000000-0000-4000-a000-0000000c0300';
  s uuid := '00000000-0000-4000-a000-0000000d0300';
  shared_path  text := '00000000-0000-4000-b000-000000010300/00000000-0000-4000-a000-0000000b0300/shared.pdf';
  private_path text := '00000000-0000-4000-b000-000000010300/00000000-0000-4000-a000-0000000b0300/private.pdf';
BEGIN
  PERFORM pg_temp.as_user(o);
  IF NOT public.church_object_shared_with_my_office(shared_path) THEN
    RAISE EXCEPTION '0300: the office cannot open a paper the member shared with it';
  END IF;
  IF public.church_object_shared_with_my_office(private_path) THEN
    RAISE EXCEPTION '0300: the office opened a paper the member did not share';
  END IF;

  PERFORM pg_temp.as_user(p);
  IF public.church_object_shared_with_my_office(shared_path) THEN
    RAISE EXCEPTION '0300: a member who is not the office opened another member''s shared paper';
  END IF;

  PERFORM pg_temp.as_user(s);
  IF public.church_object_shared_with_my_office(shared_path) THEN
    RAISE EXCEPTION '0300: another church''s office opened this church''s paper';
  END IF;

  PERFORM pg_temp.as_postgres();
  UPDATE church_documents SET shared_with_office = false WHERE storage_path = shared_path;
  PERFORM pg_temp.as_user(o);
  IF public.church_object_shared_with_my_office(shared_path) THEN
    RAISE EXCEPTION '0300: the office still opens a paper the member stopped sharing';
  END IF;

  PERFORM pg_temp.as_postgres();
  RAISE NOTICE 'OFFICE OPENS SHARED SMOKE: PASS';
END $$;

ROLLBACK;
