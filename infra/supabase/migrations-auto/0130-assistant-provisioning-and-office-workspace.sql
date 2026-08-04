-- =============================================================================
-- 0130 — ASSISTANT becomes GRANTABLE + scoped to the shared office workspace
-- =============================================================================
-- Requested by Christina 2026-08-04: "My assistant is unable to see what I see
-- in the assistant section of the TLC portion of the Poe Tech app... I will
-- need something on my end that I can use to give this person assistant rights.
-- ... I don't want them to be able to see everything [on] all of the other
-- tabs, but I do want them to see everything in the assistant tab right now."
--
-- Reality-trace (DR-0061) found TWO causes:
--   1. NO PROVISIONING PATH: the 'assistant' role exists in instance_members
--      (0100) but instance_invites' CHECK, invite_to_instance, and
--      set_member_role all clamp to admin/member/viewer — nothing can issue it.
--      (The 2026-07-30 access-groups evaluation carried exactly this as the
--      dated 2026-08-06 item: "assistant grant table + ... wiring".)
--   2. NO SHARED DATA: the office-assistant workspace (referral orgs, content
--      posts, ideas, schedule) is device-local localStorage — the assistant
--      would see an empty workspace even with access.
--
-- THE CHANGE (recorded as DR-0271; the 0100 books wall is UNTOUCHED):
--   1. instance_invites.role CHECK widens to carry 'assistant'.
--   2. invite_to_instance may issue 'assistant' (byte-faithful to 0126's
--      version otherwise — the invite:viewer delegation branch and the DR-0187
--      claim + confirm two-party handshake are untouched; never 'owner').
--   3. set_member_role may set 'assistant' (owner or admin; all 0111 guards
--      kept: never owner, owners untouchable, only-owner-touches-admin,
--      no self-change, audit_log on every change).
--   4. remove_instance_member — the REVOKE half (owner/admin; never an owner;
--      only an owner removes an admin; no self-removal; audit-logged).
--   5. my_default_instance_role — the client's honest way to learn its own
--      role server-side (DR-0220 P3: affordances from backend role, not email
--      allowlists). SECURITY DEFINER; deterministic 0119 resolution order.
--   6. office_records — the shared per-office workspace table the Assistant
--      tab syncs to (orgs / posts / ideas / schedule blocks as jsonb payload
--      rows). Instance-scoped, RLS, realtime. This is a WORKSPACE table (the
--      office's operating records), NOT a second CRM funnel: lead CAPTURE
--      stays on the crm_leads backbone (DR-0081/DR-0235); reconciling the
--      referral working list with crm_leads is a dated DR-0271 follow-up.
--   7. apply_assistant_scope_overlay() — the wall Christina asked for, made
--      structural: RESTRICTIVE deny policies for role 'assistant' on EVERY
--      RLS-enabled instance-scoped table EXCEPT the office workspace and the
--      same six self-scoped participation tables 0125 excepts for viewer
--      (an assistant may still DM a leader, send feedback, keep settings).
--      Without this, an assistant invited into the family instance could read
--      every membership-gated table (e.g. inquiries) — the 0082-child-gap
--      class. Restrictive policies AND with permissive ones: this only ever
--      NARROWS, and only for 'assistant'. Future instance-scoped tables must
--      re-run it (scripts/assistant-scope-guard.mjs fails the build if a
--      later migration creates one without the call — the Check-E pattern).
--   8. Christina (christina@tlctherapysolutions.com, mrspoe06@gmail.com)
--      becomes ADMIN of poe-family — the 0113 precedent: the grant control
--      must work on HER end, and invite/confirm/remove gate on owner/admin.
--      Darrell remains the sole owner.
--
-- DEPENDS ON: 0100 (assistant role in instance_members CHECK), 0104 (claim/
--             confirm handshake), 0111 (set_member_role/audit shape), 0119
--             (deterministic resolution), 0125/0126 (viewer overlay +
--             invite_to_instance body this re-declares).
-- IDEMPOTENT: guarded constraint swap; CREATE OR REPLACE / DROP-then-CREATE;
--             ON CONFLICT/EXISTS guards. Forward-only (DR-0011).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. instance_invites.role CHECK — carry 'assistant' (constraint name may be
--    the pre-rename tenant_invites_role_check; drop whichever exists).
-- ---------------------------------------------------------------------------
ALTER TABLE public.instance_invites DROP CONSTRAINT IF EXISTS tenant_invites_role_check;
ALTER TABLE public.instance_invites DROP CONSTRAINT IF EXISTS instance_invites_role_check;
ALTER TABLE public.instance_invites ADD CONSTRAINT instance_invites_role_check CHECK (
  role IN ('owner','admin','member','viewer','assistant')
);

-- ---------------------------------------------------------------------------
-- 2. invite_to_instance — may now issue 'assistant'. Byte-faithful to 0126
--    otherwise (explicit-target guard, invite:viewer delegation forced to
--    viewer, deterministic family-first fallback, token mint). Never 'owner'.
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
  IF v_role NOT IN ('admin','member','viewer','assistant') THEN
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

-- ---------------------------------------------------------------------------
-- 3. set_member_role — 'assistant' joins the settable set. All 0111 guards
--    kept verbatim: never 'owner'; owners untouchable; only an owner grants or
--    revokes 'admin'; no self-change; audit_log on every change.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_member_role(instance_uuid uuid, target_user uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor      uuid := auth.uid();
  v_actor_role text;
  v_role       text := lower(trim(coalesce(new_role, '')));
  v_target     record;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'set_member_role: not authenticated';
  END IF;
  -- Never 'owner' by this control. specialist/child/successor keep their own
  -- provisioning paths; 'assistant' is settable here as of 0130 (DR-0271) so
  -- an owner/admin can grant or unwind assistant scope without re-inviting.
  IF v_role NOT IN ('admin','member','viewer','assistant') THEN
    RAISE EXCEPTION 'set_member_role: role must be admin, member, viewer, or assistant';
  END IF;

  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'set_member_role: only an owner/admin can change roles';
  END IF;

  IF target_user = v_actor THEN
    RAISE EXCEPTION 'set_member_role: you cannot change your own role';
  END IF;

  SELECT * INTO v_target
    FROM instance_members
   WHERE instance_id = instance_uuid AND user_id = target_user
   LIMIT 1;
  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'set_member_role: that person is not a member of this space';
  END IF;

  -- Owners are untouchable via this control (no demote, no lockout).
  IF v_target.role = 'owner' THEN
    RAISE EXCEPTION 'set_member_role: an owner''s role cannot be changed here';
  END IF;

  -- Only an OWNER may create or revoke an admin.
  IF (v_role = 'admin' OR v_target.role = 'admin') AND v_actor_role <> 'owner' THEN
    RAISE EXCEPTION 'set_member_role: only an owner can grant or remove admin access';
  END IF;

  IF v_target.role = v_role THEN
    RETURN jsonb_build_object('status', 'noop', 'role', v_role);
  END IF;

  UPDATE instance_members SET role = v_role WHERE id = v_target.id;

  -- Record it (CAGE). Rank privilege to label grant vs revoke; 'assistant'
  -- ranks below member (it reaches ONLY the office workspace).
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (
    instance_uuid, v_actor,
    CASE WHEN (CASE v_role WHEN 'admin' THEN 3 WHEN 'member' THEN 2 WHEN 'assistant' THEN 1 ELSE 0 END)
            > (CASE v_target.role WHEN 'admin' THEN 3 WHEN 'member' THEN 2 WHEN 'assistant' THEN 1 WHEN 'viewer' THEN 0 ELSE 2 END)
         THEN 'permission-grant' ELSE 'permission-revoke' END,
    'instance_member', v_target.id,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', v_role),
    'set_member_role'
  );

  RETURN jsonb_build_object('status', 'changed', 'role', v_role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. remove_instance_member — the REVOKE half of "give someone assistant
--    rights". Same guard family as set_member_role: owner/admin only; never an
--    owner; only an owner removes an admin; no self-removal; audit-logged.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_instance_member(instance_uuid uuid, target_user uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor      uuid := auth.uid();
  v_actor_role text;
  v_target     record;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'remove_instance_member: not authenticated';
  END IF;

  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'remove_instance_member: only an owner/admin can remove a member';
  END IF;

  IF target_user = v_actor THEN
    RAISE EXCEPTION 'remove_instance_member: you cannot remove yourself';
  END IF;

  SELECT * INTO v_target
    FROM instance_members
   WHERE instance_id = instance_uuid AND user_id = target_user
   LIMIT 1;
  IF v_target.id IS NULL THEN
    RETURN jsonb_build_object('status', 'noop');
  END IF;

  IF v_target.role = 'owner' THEN
    RAISE EXCEPTION 'remove_instance_member: an owner cannot be removed';
  END IF;
  IF v_target.role = 'admin' AND v_actor_role <> 'owner' THEN
    RAISE EXCEPTION 'remove_instance_member: only an owner can remove an admin';
  END IF;

  DELETE FROM instance_members WHERE id = v_target.id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (
    instance_uuid, v_actor, 'permission-revoke',
    'instance_member', v_target.id,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', null),
    'remove_instance_member'
  );

  RETURN jsonb_build_object('status', 'removed', 'role', v_target.role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_instance_member(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. my_default_instance_role — the caller's OWN role + instance, resolved
--    with 0119's deterministic order. The client-side honest role source
--    (DR-0220 P3): the shell derives assistant-scope affordances from THIS,
--    never from an email allowlist. SECURITY DEFINER so an overlay-denied
--    assistant can still learn its own role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_default_instance_role()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
              'instance_id', im.instance_id,
              'instance_slug', i.slug,
              'instance_type', i.instance_type,
              'role', im.role)
       FROM instance_members im
       JOIN instances i ON i.id = im.instance_id
      WHERE im.user_id = auth.uid() AND i.instance_type <> 'church'
      ORDER BY CASE WHEN i.instance_type = 'family' THEN 0 ELSE 1 END,
               im.joined_at ASC,
               i.id ASC
      LIMIT 1),
    jsonb_build_object('instance_id', null, 'instance_slug', null, 'instance_type', null, 'role', null)
  );
$$;
GRANT EXECUTE ON FUNCTION public.my_default_instance_role() TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. office_records — the shared office workspace (the Assistant tab's real
--    data): referral orgs, content posts, and idea captures as one jsonb
--    payload row each; the work schedule as ONE row (kind 'schedule',
--    payload.blocks — the store persists the whole list wholesale, so the row
--    mirrors that authority). NO PHI by design: referral SOURCES only —
--    organizations and office contacts, never clients (the TLC bright line,
--    configs/tlc.js noPhiNote; DR-0003 keeps clinical data out of this app).
--    Seed/sample rows are NEVER uploaded (client filters isSeedId) — every row
--    here is a real record (DR-0061).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.office_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES auth.users(id),
  office_id   text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('org','post','idea','schedule')),
  slug        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One row per office record (slug is the client's stable id); re-import safe.
CREATE UNIQUE INDEX IF NOT EXISTS office_records_instance_office_slug_uidx
  ON public.office_records (instance_id, office_id, kind, slug);
CREATE INDEX IF NOT EXISTS office_records_instance_office_idx
  ON public.office_records (instance_id, office_id);

ALTER TABLE public.office_records ENABLE ROW LEVEL SECURITY;

-- The working set: owner/admin/member AND assistant — this table IS the
-- assistant's granted surface ("everything in the Assistant tab"). child /
-- successor / specialist / viewer are excluded by omission (default deny);
-- the 0125 viewer overlay additionally pins viewer to read-nothing here
-- (viewer is not in the read set) and write-nothing everywhere. DELETE is
-- open to the same working set: these are re-creatable operating records
-- (a schedule block, a draft post), not a ledger — the books stay 0100/0108.
DROP POLICY IF EXISTS office_records_work_read ON public.office_records;
CREATE POLICY office_records_work_read ON public.office_records
  FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member','assistant'));

DROP POLICY IF EXISTS office_records_work_insert ON public.office_records;
CREATE POLICY office_records_work_insert ON public.office_records
  FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member','assistant') AND created_by = auth.uid());

DROP POLICY IF EXISTS office_records_work_update ON public.office_records;
CREATE POLICY office_records_work_update ON public.office_records
  FOR UPDATE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member','assistant'));

DROP POLICY IF EXISTS office_records_work_delete ON public.office_records;
CREATE POLICY office_records_work_delete ON public.office_records
  FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member','assistant'));

-- Realtime, so the workspace live-updates across Christina's and the
-- assistant's devices (the proven table-sync channel path).
DO $office_records_realtime$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'office_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.office_records;
  END IF;
END $office_records_realtime$;

-- ---------------------------------------------------------------------------
-- 7. apply_assistant_scope_overlay — "not everything on all the other tabs",
--    made structural. RESTRICTIVE deny for role 'assistant' on EVERY
--    RLS-enabled instance-scoped table, all four verbs, EXCEPT:
--      * office_records — the granted workspace (§6), and
--      * the same six self-scoped participation tables 0125 excepts, so an
--        assistant can still DM a leader, speak in a placed group, send
--        feedback, and keep their own settings/telemetry (their own policies
--        stay the real gate there).
--    Restrictive policies AND with the permissive ones — nothing is widened,
--    only narrowed, and only for 'assistant'. Re-runnable; future migrations
--    that create an instance-scoped table MUST end with
--        SELECT public.apply_assistant_scope_overlay();
--    (scripts/assistant-scope-guard.mjs fails the build when one forgets —
--    the same discipline tenancy-guard Check E applies for the viewer overlay.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_assistant_scope_overlay()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
  -- The assistant's granted surface + the self-scoped participation tables
  -- (each still gated by its own self-scoped policies).
  allowed text[] := ARRAY[
    'office_records',         -- the granted workspace (the Assistant tab)
    'direct_messages',        -- DM a leader (users_can_dm still gates)
    'group_messages',         -- speak in a group they were placed in
    'family_messages',        -- legacy DM rail (self/recipient-scoped)
    'feedback',               -- an assistant may always send feedback
    'usage_events',           -- their own telemetry
    'user_instance_settings'  -- their own per-instance settings row
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
       AND NOT (c.relname = ANY (allowed))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS assistant_scope_select ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY assistant_scope_select ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated '
      || 'USING (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''assistant'')', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS assistant_scope_insert ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY assistant_scope_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
      || 'WITH CHECK (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''assistant'')', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS assistant_scope_update ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY assistant_scope_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
      || 'USING (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''assistant'') '
      || 'WITH CHECK (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''assistant'')', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS assistant_scope_delete ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY assistant_scope_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
      || 'USING (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''assistant'')', r.tbl);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

-- Overlay every existing instance-scoped table now.
SELECT public.apply_assistant_scope_overlay();

-- Re-run the viewer overlay so office_records (new instance-scoped table)
-- carries the viewer read-only deny too (tenancy-guard Check E requires the
-- call in this file).
SELECT public.apply_viewer_readonly_overlay();

-- ---------------------------------------------------------------------------
-- 8. Christina administers the family space (the 0113 precedent: the control
--    must work where the person administers). Both of her sign-in emails;
--    admin, never owner (Darrell stays the sole owner); idempotent; a future
--    re-join never downgrades (join INSERT is ON CONFLICT DO NOTHING).
-- ---------------------------------------------------------------------------
UPDATE public.instance_members im
   SET role = 'admin'
  FROM public.instances i, auth.users u
 WHERE im.instance_id = i.id
   AND i.slug = 'poe-family'
   AND im.user_id = u.id
   AND lower(u.email) IN ('christina@tlctherapysolutions.com', 'mrspoe06@gmail.com')
   AND im.role NOT IN ('owner', 'admin');

NOTIFY pgrst, 'reload schema';
