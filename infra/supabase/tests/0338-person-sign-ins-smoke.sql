-- =============================================================================
-- 0338 SMOKE — did they get in is on their row (DR-1592)
-- =============================================================================
-- One transaction; ROLLS BACK. PASS prints 'PERSON SIGN-INS SMOKE: PASS'.
-- Needs: the door-work bootstrap, schema-v1 / v1.1 / v2.1, 0315, then 0338.
-- The bootstrap's auth.users is a minimal shape, so the GoTrue columns this
-- read uses are added here (inside the rolled-back transaction), with
-- GoTrue's own audit table and the invitations table in the shapes they have.
--
--   a person with NO space whose only auth rows have instance_id NULL is read  ✔
--   failures since the last success are counted, earlier ones are not        ✔
--   a Royalty Link sign-in seen only in GoTrue's log counts as a success      ✔
--   GoTrue's provider is carried as the method                                ✔
--   a link sent and never followed is carried                                 ✔
--   every space a person belongs to is listed with role and join time         ✔
--   an unclaimed invitation is on the account it is addressed to              ✔
--   an unclaimed invitation to an address with no account is listed apart     ✔
--   a claimed or revoked invitation is on neither                             ✘
--   a signed-in person outside poe-family is refused                          ✘
--   anon cannot execute the read at all                                       ✘
-- =============================================================================
BEGIN;

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS recovery_sent_at timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
  instance_id uuid, id uuid PRIMARY KEY, payload json, created_at timestamptz, ip_address varchar(64) DEFAULT ''
);
CREATE TABLE IF NOT EXISTS public.property_access_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), instance_id uuid, email text NOT NULL,
  role_label text NOT NULL, display_name text, claimed_at timestamptz, claimed_by uuid,
  revoked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at, last_sign_in_at, recovery_sent_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0338', 'authenticated','authenticated','gov338@test.local',     '', now() - interval '90 days', now(), now() - interval '1 day', NULL),
  -- stuck: no space, a success 5 days ago, then three failures
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0338', 'authenticated','authenticated','stuck338@test.local',   '', now() - interval '10 days', now(), now() - interval '5 days', NULL),
  -- link: asked for a Royalty Link two days ago, never signed in
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0338', 'authenticated','authenticated','link338@test.local',    '', now() - interval '3 days', now(), NULL, now() - interval '2 days'),
  -- otp: signed in by Royalty Link yesterday; GoTrue's log has it, last_sign_in_at lags
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0338', 'authenticated','authenticated','otp338@test.local',     '', now() - interval '20 days', now(), now() - interval '9 days', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010338', 'poe-family', 'Poe Family', 'family'),
  ('00000000-0000-4000-b000-000000020338', 'poe-properties', 'Poe Properties', 'business')
ON CONFLICT DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name)
SELECT i.id, '00000000-0000-4000-a000-0000000a0338', 'member', 'Gov' FROM instances i WHERE i.slug = 'poe-family'
ON CONFLICT DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name)
SELECT i.id, '00000000-0000-4000-a000-0000000d0338', 'member', 'Otp' FROM instances i WHERE i.slug = 'poe-properties'
ON CONFLICT DO NOTHING;

-- The hook's rows for the person with no space: instance_id NULL, as 0315 writes them.
INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, note, at) VALUES
  (NULL, '00000000-0000-4000-a000-0000000b0338', 'failed-auth', 'auth', '00000000-0000-4000-a000-0000000b0338', 'password verification attempt', now() - interval '6 days'),
  (NULL, '00000000-0000-4000-a000-0000000b0338', 'login',       'auth', '00000000-0000-4000-a000-0000000b0338', 'password verification attempt', now() - interval '5 days'),
  (NULL, '00000000-0000-4000-a000-0000000b0338', 'failed-auth', 'auth', '00000000-0000-4000-a000-0000000b0338', 'password verification attempt', now() - interval '2 days'),
  (NULL, '00000000-0000-4000-a000-0000000b0338', 'failed-auth', 'auth', '00000000-0000-4000-a000-0000000b0338', 'password verification attempt', now() - interval '1 day'),
  (NULL, '00000000-0000-4000-a000-0000000b0338', 'failed-auth', 'auth', '00000000-0000-4000-a000-0000000b0338', 'password verification attempt', now() - interval '1 hour'),
  -- the Royalty Link person once failed a password before switching to the link
  (NULL, '00000000-0000-4000-a000-0000000d0338', 'failed-auth', 'auth', '00000000-0000-4000-a000-0000000d0338', 'password verification attempt', now() - interval '3 days');

INSERT INTO auth.audit_log_entries (id, payload, created_at) VALUES
  (gen_random_uuid(), '{"action":"login","actor_id":"00000000-0000-4000-a000-0000000d0338","traits":{"provider":"email"}}', now() - interval '1 day'),
  (gen_random_uuid(), '{"action":"token_refreshed","actor_id":"00000000-0000-4000-a000-0000000d0338"}', now() - interval '1 hour');

INSERT INTO property_access_invites (email, role_label, display_name, created_at) VALUES
  ('Stuck338@test.local', 'tenant', 'Stuck', now() - interval '4 days'),
  ('noaccount338@test.local', 'field_worker', 'Worker', now() - interval '6 days');
INSERT INTO property_access_invites (email, role_label, claimed_at, claimed_by) VALUES
  ('otp338@test.local', 'tenant', now() - interval '2 days', '00000000-0000-4000-a000-0000000d0338');
INSERT INTO property_access_invites (email, role_label, revoked) VALUES
  ('gone338@test.local', 'tenant', true);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000b0338","role":"authenticated"}';
DO $$
BEGIN
  PERFORM public.admin_person_sign_ins();
  RAISE EXCEPTION 'a person outside poe-family must not read every person''s sign-ins';
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;

SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-4000-a000-0000000a0338","role":"authenticated"}';
DO $$
DECLARE r jsonb; s jsonb; l jsonb; o jsonb; orphans jsonb;
BEGIN
  r := public.admin_person_sign_ins();
  IF r->>'gotrue_audit' <> 'read' THEN RAISE EXCEPTION 'GoTrue''s log must be read here, got %', r->>'gotrue_audit'; END IF;

  SELECT e INTO s FROM jsonb_array_elements(r->'people') e WHERE e->>'user_id' = '00000000-0000-4000-a000-0000000b0338';
  IF s IS NULL THEN RAISE EXCEPTION 'a person with no space must be read: %', r; END IF;
  IF (s->>'failed_since_success')::int <> 3 THEN RAISE EXCEPTION 'three failures since the success, got %', s; END IF;
  IF (s->>'failed_30d')::int <> 4 THEN RAISE EXCEPTION 'four failures in 30 days, got %', s; END IF;
  IF s->>'last_password_login_at' IS NULL OR s->>'last_failed_at' IS NULL THEN RAISE EXCEPTION 'last success and last failure must be read: %', s; END IF;
  IF jsonb_array_length(s->'spaces') <> 0 THEN RAISE EXCEPTION 'no spaces expected: %', s; END IF;
  IF jsonb_array_length(s->'open_invites') <> 1 OR s->'open_invites'->0->>'role_label' <> 'tenant' THEN
    RAISE EXCEPTION 'the unclaimed invitation must be on the account it is addressed to (any case): %', s;
  END IF;

  SELECT e INTO l FROM jsonb_array_elements(r->'people') e WHERE e->>'user_id' = '00000000-0000-4000-a000-0000000c0338';
  IF l->>'link_sent_at' IS NULL OR l->>'last_sign_in_at' IS NOT NULL THEN RAISE EXCEPTION 'a link sent and never followed: %', l; END IF;

  SELECT e INTO o FROM jsonb_array_elements(r->'people') e WHERE e->>'user_id' = '00000000-0000-4000-a000-0000000d0338';
  IF o->>'gotrue_method' <> 'email' OR o->>'gotrue_login_at' IS NULL THEN RAISE EXCEPTION 'the Royalty Link sign-in must be read from GoTrue: %', o; END IF;
  IF (o->>'failed_since_success')::int <> 0 THEN RAISE EXCEPTION 'a failure before a Royalty Link success is not "since": %', o; END IF;
  IF jsonb_array_length(o->'spaces') <> 1 OR o->'spaces'->0->>'slug' <> 'poe-properties' OR o->'spaces'->0->>'joined_at' IS NULL THEN
    RAISE EXCEPTION 'the space must be listed with its join time: %', o;
  END IF;
  IF jsonb_array_length(o->'open_invites') <> 0 THEN RAISE EXCEPTION 'a claimed invitation is not open: %', o; END IF;

  orphans := r->'invites_without_account';
  IF jsonb_array_length(orphans) <> 1 OR orphans->0->>'address' <> 'noaccount338@test.local' THEN
    RAISE EXCEPTION 'exactly the unclaimed invitation with no account must be listed apart, got %', orphans;
  END IF;
END $$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.admin_person_sign_ins();
  RAISE EXCEPTION 'anon must not be able to read every person''s sign-ins';
EXCEPTION WHEN insufficient_privilege THEN
  NULL;
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'PERSON SIGN-INS SMOKE: PASS'; END $$;
ROLLBACK;
