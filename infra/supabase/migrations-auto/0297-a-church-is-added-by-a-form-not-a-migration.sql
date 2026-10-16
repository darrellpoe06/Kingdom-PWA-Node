-- =============================================================================
-- 0297 — a church is added by a form, not a migration (DR-1066)
-- =============================================================================
-- Darrell 2026-10-16, after the Pushpay research-review named the gap: a Bishop
-- in Los Angeles wants what the Love Corner has, and today a second church
-- cannot be onboarded without an engineer writing a migration. Measured in
-- that review (docs/99-session-notes/2026-10-16-research-review-pushpay-*.md
-- §4 gap 3): join_church_instance (0294) decides leadership from a VALUES list
-- of four hardcoded addresses mapped to slug 'colg'; the giving channels are
-- COLG constants in app/src/lib/giving.js; seventeen migrations name 'colg'.
-- COMMUNITY-FIRST-MISSION.md says the Church Module "generalizes from COLG's
-- needs to other churches anywhere in similar situations"; the model was
-- multi-tenant from 0012, the onboarding never was.
--
-- WHAT THIS ADDS (nothing is removed; every existing read and policy is kept):
--
--   church_leaders   who may lead which church, as ROWS. Replaces the VALUES
--                    list inside join_church_instance. COLG's four addresses
--                    are seeded here verbatim, so the join answers exactly as
--                    before for every existing person.
--   church_profiles  a church's public face and its PUBLISHED GIVING CHANNELS,
--                    one row per church instance, written by its own office.
--                    The app links OUT to these; no payment data ever touches
--                    this app (lib/giving.js, the binding rule). A channel URL
--                    must be https and is validated by a trigger, never by the
--                    client alone — a bad link on a Give button is a real harm.
--   provision_church_instance()  the steward's one call: the instance, the
--                    first leader, the steward's own oversight seat (the 0089
--                    pattern for Moore Divahs), and the profile row. Only an
--                    owner/admin of 'poe-family' — the platform's governors —
--                    may call it. Idempotent on slug: calling it again for an
--                    existing church adds the named leader and nothing else.
--   set_church_profile()         the church office writes its own profile and
--                    channels (owner/admin of THAT instance only).
--   join_church_instance()       re-replaced with the SAME signature and the
--                    SAME contract as 0294 — the only change is step 3a, which
--                    reads church_leaders instead of a VALUES list, and may
--                    therefore seat a leader at ANY church, not only colg.
--   join_church_instance_at()    for a person with standing at more than one
--                    church: the seat at the church they name, or NULL.
--
-- WHAT THIS DOES NOT DO: it does not give a new church its own installable
-- door (/lovecorner/app/ is a build-time MPA input, app/vite.config.js); a new
-- church is met through the PoeTech door's Church tab until that is a
-- generator. It does not move money. It does not touch the family instance.
--
-- WALLS: church_leaders is readable by that church's owner/admin only and has
-- NO client write policy (RPC only). church_profiles is readable by that
-- church's members, or by anyone once the office marks it public; writable by
-- that church's owner/admin only. Both carry instance_id and RLS (DR-0060).
-- Idempotent: IF NOT EXISTS / ON CONFLICT / CREATE OR REPLACE throughout.
-- Proven on a fresh PostgreSQL in ci.yml (church-onboarding) and on the live
-- database in rls-isolation.yml (choir-claim leg), smoke 0297.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. church_leaders — leadership as rows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS church_leaders (
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL CHECK (role IN ('owner','admin')),
  added_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_id, email),
  CONSTRAINT church_leaders_email_lower CHECK (email = lower(trim(email)) AND position('@' in email) > 1)
);
CREATE INDEX IF NOT EXISTS church_leaders_email_idx ON church_leaders (email);

ALTER TABLE church_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS church_leaders_office_read ON church_leaders;
CREATE POLICY church_leaders_office_read ON church_leaders FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
-- No INSERT / UPDATE / DELETE policy: rows are written by provision_church_instance only.
GRANT SELECT ON church_leaders TO authenticated;

-- COLG's leaders, exactly the four addresses 0294 carried, seeded as rows so
-- the join's answer for every existing person is unchanged. Skipped quietly
-- where the colg instance does not exist (a fresh CI database).
INSERT INTO church_leaders (instance_id, email, role)
SELECT i.id, v.email, v.role
  FROM instances i
  CROSS JOIN (VALUES
    ('darrellpoe06@gmail.com',            'owner'),
    ('mrspoe06@gmail.com',                'admin'),
    ('christina@tlctherapysolutions.com', 'admin'),
    ('bg@thechurchofthelivinggod.com',    'admin')
  ) AS v(email, role)
 WHERE i.slug = 'colg'
ON CONFLICT (instance_id, email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. church_profiles — the public face and the published giving channels
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS church_profiles (
  instance_id     uuid PRIMARY KEY REFERENCES instances(id) ON DELETE CASCADE,
  profile         jsonb NOT NULL DEFAULT '{}'::jsonb,
  giving_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public       boolean NOT NULL DEFAULT false,
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- The reason a channel list is refused, or NULL when it is sound. A pure SQL
-- function so the trigger and the smoke read the same rule. The rule is the
-- never-invent-a-URL discipline of lib/giving.js carried to the wall: every
-- channel is a labelled https link the office typed, at most eight of them.
CREATE OR REPLACE FUNCTION public.church_giving_channels_problem(ch jsonb)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  e jsonb;
  ids text[] := ARRAY[]::text[];
  id text; label text; url text;
BEGIN
  IF ch IS NULL OR jsonb_typeof(ch) <> 'array' THEN RETURN 'giving channels must be a list'; END IF;
  IF jsonb_array_length(ch) > 8 THEN RETURN 'at most eight giving channels'; END IF;
  FOR e IN SELECT * FROM jsonb_array_elements(ch) LOOP
    IF jsonb_typeof(e) <> 'object' THEN RETURN 'each giving channel must be an object'; END IF;
    id    := e->>'id';
    label := e->>'label';
    url   := e->>'url';
    IF id IS NULL OR id !~ '^[a-z0-9][a-z0-9-]{0,31}$' THEN RETURN 'each channel needs an id of letters, digits and dashes'; END IF;
    IF id = ANY (ids) THEN RETURN 'channel ids must be unique: ' || id; END IF;
    ids := ids || id;
    IF label IS NULL OR length(trim(label)) < 1 OR length(label) > 40 THEN RETURN 'each channel needs a label of 1 to 40 characters'; END IF;
    IF url IS NULL OR url !~* '^https://[a-z0-9][a-z0-9.-]*[a-z0-9](:[0-9]{2,5})?(/[^[:space:]]*)?$' THEN
      RETURN 'each channel url must be a complete https link (' || coalesce(label, id) || ')';
    END IF;
    IF length(url) > 2048 THEN RETURN 'a channel url is too long (' || coalesce(label, id) || ')'; END IF;
    IF length(coalesce(e->>'display', '')) > 120 THEN RETURN 'a channel display is too long (' || coalesce(label, id) || ')'; END IF;
    IF length(coalesce(e->>'how', '')) > 200 THEN RETURN 'a channel note is too long (' || coalesce(label, id) || ')'; END IF;
  END LOOP;
  RETURN NULL;
END $$;

-- The reason a profile is refused, or NULL. Every link in it is https; the
-- whole thing is bounded so a profile can never be used as a dumping ground.
CREATE OR REPLACE FUNCTION public.church_profile_problem(p jsonb)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  k text; v text;
BEGIN
  IF p IS NULL OR jsonb_typeof(p) <> 'object' THEN RETURN 'the profile must be an object'; END IF;
  IF length(p::text) > 12000 THEN RETURN 'the profile is too large'; END IF;
  IF length(coalesce(p->>'name', '')) > 120 THEN RETURN 'the name is too long'; END IF;
  FOREACH k IN ARRAY ARRAY['site', 'youtube'] LOOP
    v := CASE k WHEN 'site' THEN p->>'site' ELSE p->'media'->>'youtube' END;
    IF v IS NOT NULL AND v <> '' AND v !~* '^https://[a-z0-9][a-z0-9.-]*[a-z0-9](:[0-9]{2,5})?(/[^[:space:]]*)?$' THEN
      RETURN 'the ' || k || ' link must be a complete https link';
    END IF;
  END LOOP;
  IF p ? 'links' THEN
    IF jsonb_typeof(p->'links') <> 'object' THEN RETURN 'links must be an object'; END IF;
    FOR k, v IN SELECT key, value FROM jsonb_each_text(p->'links') LOOP
      IF v IS NOT NULL AND v <> '' AND v !~* '^https://[a-z0-9][a-z0-9.-]*[a-z0-9](:[0-9]{2,5})?(/[^[:space:]]*)?$' THEN
        RETURN 'the ' || k || ' link must be a complete https link';
      END IF;
    END LOOP;
  END IF;
  IF p ? 'services' AND jsonb_typeof(p->'services') <> 'array' THEN RETURN 'services must be a list'; END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.church_profiles_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE why text;
BEGIN
  why := public.church_profile_problem(NEW.profile);
  IF why IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'church profile refused: ' || why; END IF;
  why := public.church_giving_channels_problem(NEW.giving_channels);
  IF why IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE = 'check_violation', MESSAGE = 'giving channels refused: ' || why; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS church_profiles_guard ON church_profiles;
CREATE TRIGGER church_profiles_guard
  BEFORE INSERT OR UPDATE ON church_profiles
  FOR EACH ROW EXECUTE FUNCTION public.church_profiles_guard();

ALTER TABLE church_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS church_profiles_read ON church_profiles;
CREATE POLICY church_profiles_read ON church_profiles FOR SELECT
  TO authenticated
  USING (is_public OR user_in_instance(instance_id));
DROP POLICY IF EXISTS church_profiles_public_read ON church_profiles;
CREATE POLICY church_profiles_public_read ON church_profiles FOR SELECT
  TO anon
  USING (is_public);
DROP POLICY IF EXISTS church_profiles_office_insert ON church_profiles;
CREATE POLICY church_profiles_office_insert ON church_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
DROP POLICY IF EXISTS church_profiles_office_update ON church_profiles;
CREATE POLICY church_profiles_office_update ON church_profiles FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
GRANT SELECT ON church_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON church_profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Who is a platform steward: an owner/admin of the family instance, by
--    any of the doors that are the same person (0141 person_links, DR-0311).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_steward()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE i.slug = 'poe-family'
       AND im.role IN ('owner','admin')
       AND (
         im.user_id = auth.uid()
         OR im.user_id IN (
           SELECT CASE WHEN pl.primary_user = auth.uid() THEN pl.door_user ELSE pl.primary_user END
             FROM person_links pl
            WHERE pl.primary_user = auth.uid() OR pl.door_user = auth.uid()
         )
       )
  );
$$;
REVOKE ALL ON FUNCTION public.is_platform_steward() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_steward() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. provision_church_instance — the steward's one call
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_church_instance(
  slug_in         text,
  display_name_in text,
  leader_email_in text,
  leader_role_in  text DEFAULT 'owner',
  profile_in      jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller  uuid := auth.uid();
  v_slug    text := lower(trim(coalesce(slug_in, '')));
  v_name    text := trim(coalesce(display_name_in, ''));
  v_email   text := lower(trim(coalesce(leader_email_in, '')));
  v_role    text := lower(trim(coalesce(leader_role_in, 'owner')));
  v_profile jsonb := coalesce(profile_in, '{}'::jsonb);
  v_inst    uuid;
  v_type    text;
  v_created boolean := false;
  v_why     text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'provision_church_instance: not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT public.is_platform_steward() THEN
    RAISE EXCEPTION 'provision_church_instance: only a platform steward may add a church' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_slug !~ '^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$' THEN
    RAISE EXCEPTION 'provision_church_instance: the slug must be 2 to 40 lowercase letters, digits or dashes' USING ERRCODE = 'check_violation';
  END IF;
  IF v_slug IN ('poe-family', 'poetech', 'app', 'api', 'admin') OR v_slug LIKE 'u-%' THEN
    RAISE EXCEPTION 'provision_church_instance: that slug is reserved' USING ERRCODE = 'check_violation';
  END IF;
  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'provision_church_instance: a display name of 2 to 120 characters is required' USING ERRCODE = 'check_violation';
  END IF;
  IF v_email = '' OR position('@' in v_email) < 2 THEN
    RAISE EXCEPTION 'provision_church_instance: a valid leader email is required' USING ERRCODE = 'check_violation';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'provision_church_instance: the first leader is an owner or an admin' USING ERRCODE = 'check_violation';
  END IF;
  v_why := public.church_profile_problem(v_profile);
  IF v_why IS NOT NULL THEN
    RAISE EXCEPTION 'provision_church_instance: profile refused: %', v_why USING ERRCODE = 'check_violation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('provision_church_instance:' || v_slug, 0));

  SELECT id, instance_type INTO v_inst, v_type FROM instances WHERE slug = v_slug;
  IF v_inst IS NOT NULL AND v_type <> 'church' THEN
    RAISE EXCEPTION 'provision_church_instance: % is already a % space, not a church', v_slug, v_type USING ERRCODE = 'check_violation';
  END IF;
  IF v_inst IS NULL THEN
    INSERT INTO instances (slug, display_name, instance_type)
      VALUES (v_slug, v_name, 'church')
      RETURNING id INTO v_inst;
    v_created := true;
  END IF;

  -- The named leader: a row that never expires. On a second call this is the
  -- whole effect — the way a steward adds a leader to an existing church.
  INSERT INTO church_leaders (instance_id, email, role, added_by)
    VALUES (v_inst, v_email, v_role, v_caller)
    ON CONFLICT (instance_id, email) DO UPDATE
      SET role = CASE WHEN church_leaders.role = 'owner' THEN 'owner' ELSE EXCLUDED.role END;

  -- The steward's own oversight seat (0089's pattern), only when the church is new.
  IF v_created THEN
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
      VALUES (v_inst, v_caller, 'admin', 'PoeTech steward')
      ON CONFLICT (instance_id, user_id) DO NOTHING;
    INSERT INTO church_profiles (instance_id, profile, giving_channels, is_public, updated_by)
      VALUES (v_inst, v_profile || jsonb_build_object('name', v_name), '[]'::jsonb, false, v_caller)
      ON CONFLICT (instance_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'instance_id', v_inst,
    'slug', v_slug,
    'created', v_created,
    'leader_email', v_email,
    'leader_role', v_role
  );
END $$;
REVOKE ALL ON FUNCTION public.provision_church_instance(text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_church_instance(text, text, text, text, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. set_church_profile — the office writes its own face and channels
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_church_profile(
  instance_in uuid,
  profile_in  jsonb,
  channels_in jsonb,
  public_in   boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_row    church_profiles%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'set_church_profile: not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF instance_in IS NULL OR user_role_in_instance(instance_in) NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'set_church_profile: only the church office (owner/admin) edits the profile' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM instances WHERE id = instance_in AND instance_type = 'church') THEN
    RAISE EXCEPTION 'set_church_profile: that space is not a church' USING ERRCODE = 'check_violation';
  END IF;

  -- A NULL argument means "leave that part as it is" — so the office can mark
  -- the profile public without re-sending its channels. The smoke caught the
  -- first draft coalescing the EXCLUDED default ('{}' / '[]') over the kept
  -- row and wiping both; the parameters, not EXCLUDED, carry the intent.
  INSERT INTO church_profiles (instance_id, profile, giving_channels, is_public, updated_by)
    VALUES (instance_in, coalesce(profile_in, '{}'::jsonb), coalesce(channels_in, '[]'::jsonb), coalesce(public_in, false), v_caller)
    ON CONFLICT (instance_id) DO UPDATE
      SET profile         = coalesce(profile_in,  church_profiles.profile),
          giving_channels = coalesce(channels_in, church_profiles.giving_channels),
          is_public       = coalesce(public_in,   church_profiles.is_public),
          updated_by      = v_caller
    RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'instance_id', v_row.instance_id,
    'profile', v_row.profile,
    'giving_channels', v_row.giving_channels,
    'is_public', v_row.is_public,
    'updated_at', v_row.updated_at
  );
END $$;
REVOKE ALL ON FUNCTION public.set_church_profile(uuid, jsonb, jsonb, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_church_profile(uuid, jsonb, jsonb, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. join_church_instance — 0294's function, step 3a now reads church_leaders.
--    SAME signature, SAME return type, SAME contract (SECURITY DEFINER, pinned
--    search_path, NULL for no standing, the advisory lock, idempotent seat).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_church_instance(display_name_in text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_emails       text[];
  v_instance_id  uuid;
  v_role         text;
  v_linked_name  text;
  v_display_name text;
  v_existing     uuid;
  v_invite_id    uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));

  -- 1. Your own church seat, as before.
  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type = 'church'
   -- A total order (P35): standing, then the earliest seat, then the row id as
   -- the tiebreak — never an unordered LIMIT 1 that flips with the planner.
   ORDER BY CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, im.joined_at, im.id
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- 2. A linked identity's church seat: same church, same role.
  SELECT im.instance_id, im.role, im.display_name
    INTO v_instance_id, v_role, v_linked_name
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
    JOIN person_links pl
      ON (pl.primary_user = v_user_id AND pl.door_user    = im.user_id)
      OR (pl.door_user    = v_user_id AND pl.primary_user = im.user_id)
   WHERE i.instance_type = 'church'
   ORDER BY CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
            im.joined_at, im.id
   LIMIT 1;

  -- Every address that identifies the caller: their own and every linked one.
  SELECT coalesce(array_agg(DISTINCT x.e), ARRAY[]::text[]) INTO v_emails
    FROM (
      SELECT lower(u.email) AS e
        FROM auth.users u
       WHERE u.id = v_user_id AND u.email IS NOT NULL
      UNION
      SELECT lower(u.email)
        FROM person_links pl
        JOIN auth.users u
          ON u.id = CASE WHEN pl.primary_user = v_user_id THEN pl.door_user ELSE pl.primary_user END
       WHERE (pl.primary_user = v_user_id OR pl.door_user = v_user_id)
         AND u.email IS NOT NULL
    ) x;

  -- 3a. The leader rows (0297: church_leaders, any church), matched on every
  --     address; owner outranks admin; the earliest-named church wins a tie.
  IF v_instance_id IS NULL THEN
    SELECT cl.instance_id, cl.role INTO v_instance_id, v_role
      FROM church_leaders cl
      JOIN instances i ON i.id = cl.instance_id
     WHERE cl.email = ANY (v_emails)
       AND i.instance_type = 'church'
     ORDER BY CASE cl.role WHEN 'owner' THEN 0 ELSE 1 END, cl.created_at, cl.instance_id
     LIMIT 1;
  END IF;

  -- 3b. A pending, unexpired church invite to any of those addresses.
  IF v_instance_id IS NULL THEN
    SELECT inv.id, inv.instance_id, inv.role
      INTO v_invite_id, v_instance_id, v_role
      FROM instance_invites inv
      JOIN instances i ON i.id = inv.instance_id
     WHERE i.instance_type = 'church'
       AND lower(inv.email) = ANY (v_emails)
       AND inv.accepted_at IS NULL
       AND inv.expires_at > now()
     ORDER BY inv.expires_at DESC
     LIMIT 1;
    IF v_invite_id IS NOT NULL THEN
      UPDATE instance_invites SET accepted_at = now() WHERE id = v_invite_id;
    END IF;
  END IF;

  IF v_role IS NULL OR v_instance_id IS NULL THEN
    RETURN NULL;  -- no church standing at either door; the gate names it (DR-1032)
  END IF;

  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    NULLIF(trim(v_linked_name), ''),
    (SELECT NULLIF(split_part(e, '@', 1), '')
       FROM unnest(v_emails) AS e
      WHERE e NOT LIKE '%@phone.poetech.us'
      ORDER BY e
      LIMIT 1),
    'Member'
  );
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_instance_id, v_user_id, v_role, v_display_name)
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  RETURN v_instance_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_church_instance(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. join_church_instance_at — the seat at the church the caller names.
--    A person who leads or belongs to more than one church is not stuck with
--    whichever seat sorts first: the app can ask for a church by slug. Same
--    walls as above — a seat, a leader row or a live invite AT THAT CHURCH,
--    else NULL. Never creates an instance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_church_instance_at(slug_in text, display_name_in text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_slug        text := lower(trim(coalesce(slug_in, '')));
  v_inst        uuid;
  v_emails      text[];
  v_role        text;
  v_invite_id   uuid;
  v_name        text;
BEGIN
  IF v_user_id IS NULL OR v_slug = '' THEN RETURN NULL; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = v_slug AND instance_type = 'church';
  IF v_inst IS NULL THEN RETURN NULL; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));

  IF EXISTS (SELECT 1 FROM instance_members WHERE instance_id = v_inst AND user_id = v_user_id) THEN
    RETURN v_inst;
  END IF;

  SELECT coalesce(array_agg(DISTINCT x.e), ARRAY[]::text[]) INTO v_emails
    FROM (
      SELECT lower(u.email) AS e FROM auth.users u WHERE u.id = v_user_id AND u.email IS NOT NULL
      UNION
      SELECT lower(u.email)
        FROM person_links pl
        JOIN auth.users u
          ON u.id = CASE WHEN pl.primary_user = v_user_id THEN pl.door_user ELSE pl.primary_user END
       WHERE (pl.primary_user = v_user_id OR pl.door_user = v_user_id)
         AND u.email IS NOT NULL
    ) x;

  SELECT cl.role INTO v_role
    FROM church_leaders cl
   WHERE cl.instance_id = v_inst AND cl.email = ANY (v_emails)
   ORDER BY CASE cl.role WHEN 'owner' THEN 0 ELSE 1 END
   LIMIT 1;

  IF v_role IS NULL THEN
    SELECT inv.id, inv.role INTO v_invite_id, v_role
      FROM instance_invites inv
     WHERE inv.instance_id = v_inst
       AND lower(inv.email) = ANY (v_emails)
       AND inv.accepted_at IS NULL
       AND inv.expires_at > now()
     ORDER BY inv.expires_at DESC
     LIMIT 1;
    IF v_invite_id IS NOT NULL THEN
      UPDATE instance_invites SET accepted_at = now() WHERE id = v_invite_id;
    END IF;
  END IF;

  IF v_role IS NULL THEN RETURN NULL; END IF;

  v_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    (SELECT NULLIF(split_part(e, '@', 1), '') FROM unnest(v_emails) AS e
      WHERE e NOT LIKE '%@phone.poetech.us' ORDER BY e LIMIT 1),
    'Member'
  );
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_inst, v_user_id, v_role, v_name)
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  RETURN v_inst;
END;
$$;
REVOKE ALL ON FUNCTION public.join_church_instance_at(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_church_instance_at(text, text) TO authenticated;

-- The two standing overlays re-run so the new instance-scoped tables inherit
-- them (DR-0241: a viewer never writes; the assistant's scope is bounded) —
-- the tenancy guard refuses a migration that creates such a table without this.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';

-- Verify after apply (live):
--   SELECT count(*) FROM church_leaders cl JOIN instances i ON i.id = cl.instance_id WHERE i.slug = 'colg';  -> 4
--   SELECT join_church_instance('Darrell');   -> colg's id (unchanged)
--   as a non-steward: SELECT provision_church_instance('x-church','X','x@x.org');  -> insufficient_privilege
