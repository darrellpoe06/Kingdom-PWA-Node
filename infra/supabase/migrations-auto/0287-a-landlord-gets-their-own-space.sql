-- =============================================================================
-- 0287 — A landlord gets their own space, by their own hand (DR-1007)
-- =============================================================================
-- The door asks "Who are you?" and offers "I own properties" — and then, after
-- the sign-in, a landlord who is not the family met the TENANT face: no doors,
-- no grants, no household, so PropertiesApp fell through to 'tenant' and told
-- them their place "is tied to the email your landlord used to invite you"
-- (measured: PropertiesApp.jsx role memo, model.js WHO_OPTIONS 'landlord').
-- Nothing anywhere minted a landlord space for a stranger; DR-0365 made ONE,
-- for the family, by migration.
--
-- WHAT THIS DOES. One RPC, called by the signed-in person for THEMSELVES:
--   claim_landlord_space(display_name_in, path_in)
--     * path 'properties' — Poe Properties by itself: a landlord-type instance
--       (slug ll-<uid>), owned by the caller. Nothing else is made.
--     * path 'poetech'    — the full PoeTech app: the same landlord space AND
--       the person's family home (slug u-<uid>, the 0119 shape), so the shell's
--       join_default_instance() — which orders a family-type home FIRST — lands
--       them on the home and the properties tab reads the landlord space
--       through my_properties_instance_role() (0207). The home is minted here
--       rather than by calling join_default_instance(), because that function
--       returns ANY existing non-church membership first: a landlord-only
--       person would have been handed their landlord space as "home".
--   Idempotent: a person who already holds a landlord seat (owner, admin or
--   member — the seat is the proof, 0207) gets THAT seat back as 'already' and
--   no second space; the 'poetech' home is still minted on a later call, so a
--   properties-only landlord upgrades to the full app with one more tap.
--
-- GUARDS: signed in; path in ('properties','poetech'); the slug is derived
-- from auth.uid() so nobody can name or collide a space; audit_log 'create'
-- on the new instance with the path chosen (DR-0829's shape: the measurement
-- for the re-review is a query on audit_log).
--
-- NO SUBSCRIPTION ROW (as 0207 / DR-0365 (a)): pricing is a bright line, not a
-- schema one; with no active tier instance_active_tier() is NULL and
-- rentals_tier_enforce returns early. The tier decision carries its own
-- re-review in DR-1007.
-- IDEMPOTENT: CREATE OR REPLACE only.
-- =============================================================================

-- THE PRECONDITION THIS NEEDS, MADE TRUE HERE (0131 / DR-0273): schema-v1's
-- pre-rename twin `tenants_tenant_type_check` (six types, no 'landlord') sat
-- beside v2.1's thirteen-type check and silently refused every landlord
-- instance. 0131 dropped it on the live database; a database that replays
-- this file without 0131 (the journeys' own, scripts/e2e/build-door-db.sh)
-- would refuse the space this function makes. Idempotent, by its real name.
ALTER TABLE public.instances DROP CONSTRAINT IF EXISTS tenants_tenant_type_check;

-- THE RESOLVER THE DOOR READS, DECLARED AGAIN BYTE-FOR-BYTE (0207 §5). A
-- database that cannot replay 0207's data move — the journeys' own, whose
-- rentals carry no entity_slug (scripts/door-work-ci-rentals-shape.sql) —
-- still needs the seat read that PropertiesApp and the door make
-- (getPropertiesInstanceId, loadMyLandlordSeat). Same signature, same body,
-- same grants: the newest definer is this file, and it changes nothing.
CREATE OR REPLACE FUNCTION public.my_properties_instance_role()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT jsonb_build_object(
           'instance_id',   i.id,
           'instance_slug', i.slug,
           'instance_type', i.instance_type,
           'role',          m.role)
    FROM public.instance_members m
    JOIN public.instances i ON i.id = m.instance_id
   WHERE m.user_id = auth.uid()
     AND i.instance_type = 'landlord'
   ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
            i.created_at
   LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.my_properties_instance_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_properties_instance_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_landlord_space(
  display_name_in text DEFAULT NULL,
  path_in text DEFAULT 'properties'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user   uuid := auth.uid();
  v_path   text := lower(trim(coalesce(path_in, 'properties')));
  v_email  text;
  v_name   text;
  v_slug   text;
  v_home   text;
  v_seat   record;
  v_id     uuid;
  v_status text := 'created';
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'claim_landlord_space: not authenticated';
  END IF;
  IF v_path NOT IN ('properties', 'poetech') THEN
    RAISE EXCEPTION 'claim_landlord_space: path must be properties or poetech';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('claim_landlord_space:' || v_user::text, 0));

  SELECT lower(coalesce(email, '')) INTO v_email FROM auth.users WHERE id = v_user;
  v_name := coalesce(nullif(trim(display_name_in), ''), nullif(split_part(v_email, '@', 1), ''), 'Landlord');

  -- THE SEAT IS THE PROOF (0207): a landlord membership of any role answers.
  SELECT i.id, i.slug, m.role INTO v_seat
    FROM instance_members m
    JOIN instances i ON i.id = m.instance_id
   WHERE m.user_id = v_user AND i.instance_type = 'landlord'
   ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, i.created_at
   LIMIT 1;

  IF v_seat.id IS NOT NULL THEN
    v_id := v_seat.id;
    v_slug := v_seat.slug;
    v_status := 'already';
  ELSE
    v_slug := 'll-' || replace(v_user::text, '-', '');
    INSERT INTO instances (slug, display_name, instance_type)
      VALUES (v_slug, v_name || '''s properties', 'landlord')
      ON CONFLICT (slug) DO NOTHING;
    SELECT id INTO v_id FROM instances WHERE slug = v_slug;
    INSERT INTO instance_members (instance_id, user_id, role, display_name)
      VALUES (v_id, v_user, 'owner', v_name)
      ON CONFLICT (instance_id, user_id) DO NOTHING;
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
      VALUES (v_id, v_user, 'create', 'instance', v_id, NULL,
              jsonb_build_object('slug', v_slug, 'instance_type', 'landlord', 'path', v_path),
              'claim_landlord_space');
  END IF;

  -- THE FULL APP: the person's own family home beside the landlord space,
  -- minted in 0119's shape so join_default_instance() finds it first.
  IF v_path = 'poetech' THEN
    v_home := 'u-' || replace(v_user::text, '-', '');
    IF NOT EXISTS (
      SELECT 1 FROM instance_members m JOIN instances i ON i.id = m.instance_id
       WHERE m.user_id = v_user AND i.instance_type = 'family'
    ) THEN
      INSERT INTO instances (slug, display_name, instance_type)
        VALUES (v_home, v_name, 'family')
        ON CONFLICT (slug) DO NOTHING;
      INSERT INTO instance_members (instance_id, user_id, role, display_name)
        SELECT id, v_user, 'owner', v_name FROM instances WHERE slug = v_home
        ON CONFLICT (instance_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'instance_id', v_id,
    'slug', v_slug,
    'role', coalesce(v_seat.role, 'owner'),
    'path', v_path
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_landlord_space(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_landlord_space(text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
