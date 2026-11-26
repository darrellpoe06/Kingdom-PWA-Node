-- =============================================================================
-- 0344 DOWNLOADS SWITCH SMOKE — the walls of DR-1656, proven.
-- Runs in a transaction and ROLLS BACK. PASS prints
-- 'DOWNLOADS SWITCH SMOKE: PASS'; any breach RAISES.
--
-- Assertions
--   with no row, downloads_open() is false (closed until opened)      ✔
--   a member cannot flip it                              -> REFUSED ✘
--   a member cannot read or write the table directly     -> REFUSED ✘
--   anon cannot flip it                                  -> REFUSED ✘
--   the Governor opens it; everyone reads true                         ✔
--   the Governor closes it; everyone reads false                       ✔
-- =============================================================================
BEGIN;

\set mem 'a0000000-0000-4000-a000-000000000344'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', :'mem', 'authenticated', 'authenticated', 'mem0344@test.local', '', now(), now());

-- The Governor: Darrell's own account where it exists (production), or a
-- stand-in carrying a governor address where it does not (a bare replay).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = ANY (public.lesson_governor_emails())) THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-a000-000000000344', 'authenticated', 'authenticated',
            (public.lesson_governor_emails())[1], '', now(), now());
  END IF;
END $$;
SELECT id AS gov FROM auth.users WHERE lower(email) = ANY (public.lesson_governor_emails()) ORDER BY created_at LIMIT 1 \gset

DELETE FROM public.platform_switches WHERE key = 'downloads';

DO $$ BEGIN
  IF public.downloads_open() IS DISTINCT FROM false THEN RAISE EXCEPTION 'no row must read closed'; END IF;
END $$;

-- A member: refused at the function and at the table.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', :'mem', 'role', 'authenticated')::text, true);
DO $$ BEGIN
  BEGIN
    PERFORM public.set_downloads_open(true);
    RAISE EXCEPTION 'BREACH: a member flipped the downloads switch';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM 1 FROM public.platform_switches;
    RAISE EXCEPTION 'BREACH: a member read the switch table directly';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.platform_switches (key, is_on) VALUES ('downloads', true);
    RAISE EXCEPTION 'BREACH: a member wrote the switch table directly';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF public.downloads_open() IS DISTINCT FROM false THEN RAISE EXCEPTION 'BREACH: still must read closed'; END IF;
END $$;

-- Anon: cannot flip.
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
DO $$ BEGIN
  BEGIN
    PERFORM public.set_downloads_open(true);
    RAISE EXCEPTION 'BREACH: anon flipped the downloads switch';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- The Governor: opens, then closes.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', :'gov', 'role', 'authenticated')::text, true);
DO $$ BEGIN
  IF public.set_downloads_open(true) IS DISTINCT FROM true THEN RAISE EXCEPTION 'open did not answer true'; END IF;
  IF public.downloads_open() IS DISTINCT FROM true THEN RAISE EXCEPTION 'open did not hold'; END IF;
  IF public.set_downloads_open(false) IS DISTINCT FROM false THEN RAISE EXCEPTION 'close did not answer false'; END IF;
  IF public.downloads_open() IS DISTINCT FROM false THEN RAISE EXCEPTION 'close did not hold'; END IF;
END $$;

RESET ROLE;
SELECT 'DOWNLOADS SWITCH SMOKE: PASS' AS result;
ROLLBACK;
