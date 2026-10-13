-- =============================================================================
-- 0126 — THE GOVERNANCE CHECKLIST: per-member capabilities between the roles
-- =============================================================================
-- DR-0242 (Darrell 2026-07-29: "the checklist of options to give access to
-- different levels of governance without the full admin or only whatever we
-- give other types of users"). The three base roles stay the floor; this adds
-- ADDITIVE, per-person grants an owner/admin checks on and off:
--
--   * write:<area>  — unlocks WRITE on one named area's tables for a viewer
--                     (a read-only guest who helps run the choir, the bus
--                     ministry, an event...) without making them a member.
--   * invite:viewer — lets a member mint one-time invites, but ONLY at the
--                     read-only Viewer level (the DR-0187 two-party claim +
--                     confirm flow is unchanged). Role/admin powers are NOT
--                     delegable — only an owner/admin ever changes roles.
--
-- SAFETY MODEL (narrowing-first, DR-0241/DR-0076):
--   * DEFAULT DENY: only tables mapped to a named area are unlockable at all.
--     Everything unmapped — the money core, tax, payments, membership,
--     invites, capabilities themselves — stays viewer-read-only NO MATTER
--     WHAT is granted. The never-unlockable core is ALSO pinned explicitly in
--     never_unlockable_tables() below, checked by tenancy-guard Check E.
--   * Grants only ADD within the viewer deny-overlay; members/admins are
--     untouched, and no capability ever reaches role management.
--   * member_capabilities is RPC-only for writes (SECURITY DEFINER, guarded);
--     RLS lets a person read their own grants and leaders read their space's.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The grants table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_capabilities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  capability  text NOT NULL,
  granted_by  uuid,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, user_id, capability)
);
CREATE INDEX IF NOT EXISTS member_capabilities_lookup_idx
  ON member_capabilities (instance_id, user_id);
ALTER TABLE member_capabilities ENABLE ROW LEVEL SECURITY;

-- Read your own grants; leaders read their space's. Writes are RPC-only.
DROP POLICY IF EXISTS member_capabilities_read_own ON member_capabilities;
CREATE POLICY member_capabilities_read_own ON member_capabilities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 2. The area map — WHICH tables a write:<area> grant can unlock. DEFAULT
--    DENY: a table not matched here is NEVER unlockable. The core list below
--    is pinned belt-and-suspenders (tenancy-guard Check E asserts it).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.never_unlockable_tables()
RETURNS text[]
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT ARRAY[
    -- the core books (the 0100 list, verbatim) + money movement
    'entities','accounts','transactions','debts','projects',
    'payments','budget_goals','member_stewardship',
    -- membership, invites, and the checklist itself
    'instance_members','instance_invites','member_capabilities',
    'child_capabilities','delegated_capabilities','role_capabilities'
  ];
$$;

CREATE OR REPLACE FUNCTION public.capability_area(tbl text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN tbl = ANY (public.never_unlockable_tables()) THEN NULL
    WHEN tbl LIKE 'choir\_%'                                   THEN 'choir'
    WHEN tbl LIKE 'bus\_%'                                     THEN 'bus'
    WHEN tbl LIKE 'inventory\_%'
      OR tbl IN ('purchase_orders','purchase_order_lines',
                 'shop_inventory','custom_orders')             THEN 'inventory'
    WHEN tbl LIKE 'crm\_%'
      OR tbl IN ('practice_leads','practice_ceu_entries')      THEN 'crm'
    WHEN tbl LIKE 'event\_%'
      OR tbl LIKE 'conference%'
      OR tbl IN ('class_sessions','class_signups')             THEN 'events'
    WHEN tbl IN ('rent_records','rent_balance_adjustments','rental_tenancies',
                 'maintenance_requests','property_notes',
                 'request_documentation')                      THEN 'property'
    WHEN tbl IN ('discussions','discovery_items','recipes','content_reactions',
                 'content_sources','showcase_pieces',
                 'creation_workspaces')                        THEN 'content'
    ELSE NULL
  END;
$$;

-- Does the CALLER hold a capability in this instance? (SECURITY DEFINER so the
-- RLS policies built on it never recurse into member_capabilities' own RLS.)
CREATE OR REPLACE FUNCTION public.has_capability(inst uuid, cap text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_capabilities
     WHERE instance_id = inst AND user_id = auth.uid() AND capability = cap
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_capability(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. The viewer deny-overlay learns the checklist. Same RESTRICTIVE narrowing
--    (nothing widens for member/admin); a viewer passes ONLY where a
--    write:<area> grant exists AND the table maps to that area. Unmapped
--    tables keep the pure deny — the area is baked per-table at apply time so
--    most tables never even consult the grants.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_viewer_readonly_overlay()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
  v_area text;
  v_pred text;
  -- Self-scoped participation tables a read-only guest may still write to
  -- (their OWN rows, gated by each table's own self-scoped policies).
  participation text[] := ARRAY[
    'direct_messages',       -- send a DM to a leader (users_can_dm still gates)
    'group_messages',        -- speak in a group they were placed in
    'family_messages',       -- legacy family DM rail (self/recipient-scoped)
    'feedback',              -- a guest may always send feedback
    'usage_events',          -- their own telemetry
    'user_instance_settings' -- their own per-instance settings row
  ];
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
      FROM pg_class c
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      JOIN pg_attribute a  ON a.attrelid = c.oid
                          AND a.attname = 'instance_id'
                          AND NOT a.attisdropped
     WHERE ns.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relrowsecurity
       AND a.atttypid = 'uuid'::regtype
       AND NOT (c.relname = ANY (participation))
  LOOP
    v_area := public.capability_area(r.tbl);
    IF v_area IS NULL THEN
      v_pred := 'public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer''';
    ELSE
      v_pred := format(
        '(public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'''
        || ' OR public.has_capability(instance_id, %L))', 'write:' || v_area);
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_insert ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
      || 'WITH CHECK (%s)', r.tbl, v_pred);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_update ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
      || 'USING (%s) WITH CHECK (%s)', r.tbl, v_pred, v_pred);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_delete ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
      || 'USING (%s)', r.tbl, v_pred);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Grant/revoke RPC — the checklist's write path. Owner/admin of the space
--    only; the catalog is validated server-side; owners are untouchable and
--    you never grant to yourself (mirrors set_member_role's guards, 0111).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_member_capability(
  instance_uuid uuid, target_user uuid, capability_in text, enabled boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_role text;
  v_target_role text;
  v_cap text := lower(trim(coalesce(capability_in, '')));
  v_known text[] := ARRAY[
    'invite:viewer',
    'write:choir','write:bus','write:inventory','write:crm',
    'write:events','write:property','write:content'
  ];
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'set_member_capability: not authenticated';
  END IF;
  IF NOT (v_cap = ANY (v_known)) THEN
    RAISE EXCEPTION 'set_member_capability: unknown capability %', v_cap;
  END IF;
  SELECT role INTO v_caller_role FROM instance_members
   WHERE instance_id = instance_uuid AND user_id = v_caller;
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'set_member_capability: only an owner/admin of the space may change the checklist';
  END IF;
  IF target_user = v_caller THEN
    RAISE EXCEPTION 'set_member_capability: you cannot change your own checklist';
  END IF;
  SELECT role INTO v_target_role FROM instance_members
   WHERE instance_id = instance_uuid AND user_id = target_user;
  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'set_member_capability: that person is not in this space';
  END IF;
  IF v_target_role IN ('owner','admin') THEN
    RAISE EXCEPTION 'set_member_capability: owners/admins already hold these powers';
  END IF;

  IF enabled THEN
    INSERT INTO member_capabilities (instance_id, user_id, capability, granted_by)
    VALUES (instance_uuid, target_user, v_cap, v_caller)
    ON CONFLICT (instance_id, user_id, capability) DO NOTHING;
  ELSE
    DELETE FROM member_capabilities
     WHERE instance_id = instance_uuid AND user_id = target_user AND capability = v_cap;
  END IF;
  RETURN jsonb_build_object('status', CASE WHEN enabled THEN 'granted' ELSE 'revoked' END,
                            'capability', v_cap, 'user_id', target_user);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_member_capability(uuid, uuid, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_member_capabilities(instance_uuid uuid)
RETURNS TABLE (user_id uuid, capability text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mc.user_id, mc.capability
    FROM member_capabilities mc
   WHERE mc.instance_id = instance_uuid
     AND EXISTS (SELECT 1 FROM instance_members im
                  WHERE im.instance_id = instance_uuid
                    AND im.user_id = auth.uid()
                    AND im.role IN ('owner','admin'));
$$;
GRANT EXECUTE ON FUNCTION public.list_member_capabilities(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. invite_to_instance learns invite:viewer — a member holding the grant may
--    mint invites for THE SPACE THE GRANT IS ON, forced to role 'viewer'
--    (never member/admin), explicit target only. Owner/admin paths unchanged;
--    the DR-0187 claim + confirm handshake is untouched.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.invite_to_instance(text, text, uuid);
CREATE FUNCTION public.invite_to_instance(email_in text, role_in text DEFAULT 'member', instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
-- extensions must be on the pinned path: pgcrypto (gen_random_bytes) lives in
-- the extensions schema on Supabase (the 0125 hotfix's lesson).
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_instance uuid;
  v_email    text := lower(trim(coalesce(email_in, '')));
  v_role     text := lower(trim(coalesce(role_in, 'member')));
  v_token    text := encode(gen_random_bytes(18), 'hex');
  v_id       uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'invite_to_instance: not authenticated';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invite_to_instance: a valid email is required';
  END IF;
  IF v_role NOT IN ('admin','member','viewer') THEN
    v_role := 'member';
  END IF;

  IF instance_in IS NOT NULL THEN
    -- Explicit target: the picker means what it says. Caller must lead it —
    -- OR be a member delegated invite:viewer for it (viewer-only mint).
    SELECT im.instance_id INTO v_instance
      FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.instance_id = instance_in
       AND im.user_id = v_user_id
       AND i.instance_type <> 'church'
       AND im.role IN ('owner','admin');
    IF v_instance IS NULL THEN
      SELECT im.instance_id INTO v_instance
        FROM instance_members im
        JOIN instances i ON i.id = im.instance_id
       WHERE im.instance_id = instance_in
         AND im.user_id = v_user_id
         AND i.instance_type <> 'church'
         AND im.role = 'member'
         AND public.has_capability(instance_in, 'invite:viewer');
      IF v_instance IS NOT NULL THEN
        v_role := 'viewer';  -- the delegated power mints read-only ONLY
      END IF;
    END IF;
    IF v_instance IS NULL THEN
      RAISE EXCEPTION 'invite_to_instance: you must be an owner/admin of that (non-church) space to invite into it';
    END IF;
  ELSE
    SELECT im.instance_id INTO v_instance
      FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_user_id AND i.instance_type <> 'church' AND im.role IN ('owner','admin')
     ORDER BY CASE WHEN i.instance_type = 'family' THEN 0 ELSE 1 END,
              im.joined_at ASC,
              i.id ASC
     LIMIT 1;
    IF v_instance IS NULL THEN
      RAISE EXCEPTION 'invite_to_instance: only an instance owner/admin can invite';
    END IF;
  END IF;

  -- One live invite per email+instance: clear any prior unaccepted one.
  DELETE FROM instance_invites
   WHERE instance_id = v_instance AND lower(email) = v_email AND accepted_at IS NULL;

  INSERT INTO instance_invites (instance_id, email, role, invited_by, claim_token)
    VALUES (v_instance, v_email, v_role, v_user_id, v_token)
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'token', v_token, 'email', v_email, 'role', v_role, 'instance_id', v_instance);
END;
$$;
GRANT EXECUTE ON FUNCTION public.invite_to_instance(text, text, uuid) TO authenticated;

-- Re-apply the overlay so every instance-scoped table (member_capabilities
-- included) carries the refreshed policies. Check E requires this call.
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
