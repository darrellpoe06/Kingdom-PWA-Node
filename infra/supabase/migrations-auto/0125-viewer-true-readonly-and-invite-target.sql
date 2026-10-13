-- =============================================================================
-- 0125 — VIEWER BECOMES TRULY READ-ONLY + the invite targets the picked space
-- =============================================================================
-- DR-0241. Two defects traced in the 2026-07-29 guest-access comprehensive
-- review (the "what would my brother have access to?" question):
--
--   1. `viewer` was a no-op role. No RLS policy anywhere referenced 'viewer',
--      so a person granted "Viewer" had the SAME write reach as a member on
--      every `user_in_instance()`-gated table, and INSERT+UPDATE on the core
--      books (0100 excludes only child/successor/assistant). The UI label
--      promised read-only; the database did not deliver it. This migration
--      delivers it: a RESTRICTIVE deny-overlay on every RLS-enabled
--      instance-scoped table blocks INSERT/UPDATE/DELETE for role 'viewer'.
--      Restrictive policies AND with the existing permissive ones, so nothing
--      is widened — only narrowed, and only for 'viewer'.
--
--   2. `invite_to_instance` ignored the space picker. The UI offers "into
--      which space" but the RPC re-resolved the target server-side
--      (family-first), so picking "PoeTech Business" silently granted the
--      family space. The RPC now accepts an explicit instance and validates
--      the caller is owner/admin of THAT (non-church) instance.
--
-- PARTICIPATION EXCEPTIONS: a handful of tables carry instance_id but hold
-- SELF-SCOPED participation rows (your own DM, your own feedback, your own
-- settings). A read-only guest must still be able to talk to a leader and
-- send feedback — their own policies (sender = auth.uid() etc.) remain the
-- real gate there. The list is pinned by tenancy-guard Check E; adding to it
-- is a visible decision, never a silent widening.
--
-- FUTURE TABLES: the overlay is a re-runnable function. Any later migration
-- that creates an instance-scoped table MUST end with
--     SELECT public.apply_viewer_readonly_overlay();
-- tenancy-guard Check E fails the build when a new instance-scoped table's
-- migration forgets the call. IDEMPOTENT throughout.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.apply_viewer_readonly_overlay()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
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
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_insert ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
      || 'WITH CHECK (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'')', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_update ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
      || 'USING (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'') '
      || 'WITH CHECK (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'')', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_delete ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
      || 'USING (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'')', r.tbl);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

-- Overlay every existing instance-scoped table now.
SELECT public.apply_viewer_readonly_overlay();

-- ---------------------------------------------------------------------------
-- invite_to_instance — honor the picked space. Byte-faithful to 0119 when no
-- instance is passed (family-first resolution); with an explicit instance the
-- caller must be owner/admin of THAT instance and it must not be a church
-- (church invites ride invite_to_church / join_church_instance).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.invite_to_instance(text, text);
DROP FUNCTION IF EXISTS public.invite_to_instance(text, text, uuid);
CREATE FUNCTION public.invite_to_instance(email_in text, role_in text DEFAULT 'member', instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
-- extensions must be on the pinned path: pgcrypto (gen_random_bytes) lives in
-- the extensions schema on Supabase, and a pinned search_path without it fails
-- at call time even though session-path migrations resolve it fine.
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
    -- Explicit target: the picker means what it says. Caller must lead it.
    SELECT im.instance_id INTO v_instance
      FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.instance_id = instance_in
       AND im.user_id = v_user_id
       AND i.instance_type <> 'church'
       AND im.role IN ('owner','admin');
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

NOTIFY pgrst, 'reload schema';
