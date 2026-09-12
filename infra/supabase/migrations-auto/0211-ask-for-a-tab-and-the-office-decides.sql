-- =============================================================================
-- 0211 — ASK FOR A TAB, AND THE OFFICE DECIDES
-- =============================================================================
-- Darrell 2026-09-11: "each user will be able to be upgraded based on checking
-- another access these tabs type functionality for the office staff and tech
-- team to give access based on BG and have an request and approval process for
-- changing or giving access to the tabs that are staff and work related"
--
-- BG is Bishop Gwin (bg@thechurchofthelivinggod.com) — already the whole church
-- staff allowlist in the shell, and the person named as the gate.
--
-- THE PREMISE CONFLICT THIS MIGRATION HAD TO SOLVE FIRST. The staff church tabs
-- are gated in the shell by an EMAIL ALLOWLIST (CHURCH_STAFF_EMAILS), not by
-- anything in this database. So "approve the request" could not have granted
-- anything: it would have needed a code edit and a deploy, per person. An
-- approval queue that cannot actually grant is theatre.
--
-- The fix is to give the grant a real home, and 0126 already built one:
-- member_capabilities, written only through set_member_capability, which is
-- owner/admin-only, refuses self-grants, and refuses to "grant" an owner powers
-- they already hold. This migration adds ONE capability to that closed
-- allowlist — see:church-staff — and the shell learns to honour it beside the
-- email list. A capability is granted by the office, in the app, to a named
-- person, with a row to show for it.
--
-- WHY ONE KEY AND NOT ONE PER TAB. Every staff church surface gates on the SAME
-- predicate today. A key per tab would be a promise the app cannot keep — it
-- would show a person a granted "Devices" and still hand them the Infra Plan.
-- So the REQUEST names the surface (the office sees what was actually wanted)
-- and the GRANT is the one thing that is real. The surface says so in words
-- rather than letting somebody discover it: granting opens every staff tab.
--
-- IT IS A SEE KEY, NOT A WRITE KEY. see:church-staff unlocks no table and no
-- write path: capability_area() does not map it, the viewer read-only overlay
-- does not consult it, and RLS is untouched. It changes what the app DRAWS.
-- Every row behind those tabs is still decided by the database (DR-0060).
--
-- DECIDING IS NOT GRANTING, AND BOTH ARE RECORDED. access_request_decide marks
-- the request and, on approval, grants through set_member_capability — the same
-- guarded door the checklist uses, never a private path around it. If that door
-- refuses (the person left the church, an owner cannot be "granted"), the
-- decision refuses with it rather than recording an approval that did nothing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE ASK
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The SURFACES id the person was standing in front of when they asked. Kept
  -- as text on purpose: the registry lives in the app, and a foreign key to a
  -- list that ships with the client would go stale the first time a tab is
  -- renamed. The office reads it to know what was wanted.
  surface_id    text NOT NULL,
  surface_label text,
  -- What the app would have to grant for that surface to open.
  capability    text NOT NULL DEFAULT 'see:church-staff',
  reason        text,
  status        text NOT NULL DEFAULT 'open',
  decided_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at    timestamptz,
  decision_note text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT access_requests_status_chk
    CHECK (status IN ('open', 'granted', 'refused', 'withdrawn')),
  CONSTRAINT access_requests_surface_chk CHECK (btrim(surface_id) <> ''),
  -- A decided request must say who decided it and when. A "granted" row with no
  -- hand behind it is exactly the record this table exists to prevent.
  CONSTRAINT access_requests_decided_chk CHECK (
    (status = 'open' AND decided_by IS NULL AND decided_at IS NULL)
    OR (status = 'withdrawn')
    OR (status IN ('granted','refused') AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
  )
);

-- One OPEN ask per person per surface. Asking twice is not two asks; it is the
-- same person still waiting, and a queue full of duplicates is a queue nobody
-- reads. Decided rows stay, so the history is whole.
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_one_open_idx
  ON public.access_requests (instance_id, user_id, surface_id)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS access_requests_queue_idx
  ON public.access_requests (instance_id, status, created_at DESC);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- You see your own asks. The office sees its own space's.
DROP POLICY IF EXISTS access_requests_read ON public.access_requests;
CREATE POLICY access_requests_read ON public.access_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (public.user_in_instance(instance_id)
        AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
  );

-- Asking is a write anyone in the house may make, for THEMSELVES only. Nobody
-- files a request in somebody else's name.
DROP POLICY IF EXISTS access_requests_insert ON public.access_requests;
CREATE POLICY access_requests_insert ON public.access_requests FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.user_in_instance(instance_id)
    AND status = 'open'
    AND decided_by IS NULL
  );

-- DECIDING IS RPC-ONLY. There is deliberately no UPDATE policy: a decision that
-- could be written straight to the table could skip the grant, and then the
-- queue would say granted while the person still saw a locked tile.
DROP POLICY IF EXISTS access_requests_update ON public.access_requests;

-- Withdrawing your own open ask is yours to do.
DROP POLICY IF EXISTS access_requests_delete ON public.access_requests;
CREATE POLICY access_requests_delete ON public.access_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'open');

-- ---------------------------------------------------------------------------
-- 2. THE CAPABILITY THAT MAKES AN APPROVAL MEAN SOMETHING
-- ---------------------------------------------------------------------------
-- 0126's set_member_capability carries a CLOSED allowlist, which is why this is
-- a migration and not a config line. Re-declared here with one key added.
--
-- EVERY GUARD is 0126's, unchanged and on purpose: only an owner/admin of the
-- space may write it, nobody may grant themselves, the target must actually be
-- in the space, and an owner/admin cannot be "granted" powers they already
-- hold. Diffed against 0126 line for line before shipping.
--
-- TWO THINGS BESIDES THE KEY DID CHANGE, and both are named here rather than
-- left for a reader to find in a diff:
--   * an audit_log row. 0126 wrote none, so a capability could be granted or
--     revoked with nothing to show for it — the one class of write where that
--     matters most, since it is the write that hands somebody a power. Every
--     other privileged write in this system audits; this one now does too.
--   * REVOKE ... FROM PUBLIC, anon. 0126 only GRANTed to authenticated. This is
--     a tightening, matching every function written since.
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
    'write:events','write:property','write:content',
    -- 0211. A SEE key: it unlocks no table and no write path. capability_area()
    -- does not map it, so the viewer read-only overlay never consults it and
    -- RLS is untouched. It changes what the app DRAWS, and nothing else.
    'see:church-staff'
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

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (instance_uuid, v_caller, 'update', 'member_capability', target_user,
          jsonb_build_object('capability', v_cap, 'enabled', NOT enabled),
          jsonb_build_object('capability', v_cap, 'enabled', enabled),
          'set_member_capability');

  RETURN jsonb_build_object('status', CASE WHEN enabled THEN 'granted' ELSE 'revoked' END,
                            'capability', v_cap, 'user_id', target_user);
END;
$$;
REVOKE ALL ON FUNCTION public.set_member_capability(uuid, uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_capability(uuid, uuid, text, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. WHAT THE APP MAY DRAW FOR ME — my own answer, about myself
-- ---------------------------------------------------------------------------
-- The shell asks this once and reads the answer into its surface gates. It
-- returns the caller's OWN church membership and OWN capabilities; there is no
-- argument for looking up somebody else, because there is no reason to.
CREATE OR REPLACE FUNCTION public.my_church_access()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_slug     text;
  v_role     text;
  v_caps     jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('instance_id', NULL, 'role', NULL, 'capabilities', '[]'::jsonb);
  END IF;

  -- The caller's church membership, if they have one. A person in two churches
  -- gets the one they joined first, deterministically, rather than whichever
  -- row the planner happened to hand back.
  SELECT i.id, i.slug, im.role INTO v_instance, v_slug, v_role
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid() AND i.instance_type = 'church'
   ORDER BY im.joined_at NULLS LAST, i.slug
   LIMIT 1;

  IF v_instance IS NULL THEN
    RETURN jsonb_build_object('instance_id', NULL, 'role', NULL, 'capabilities', '[]'::jsonb);
  END IF;

  SELECT coalesce(jsonb_agg(mc.capability ORDER BY mc.capability), '[]'::jsonb) INTO v_caps
    FROM member_capabilities mc
   WHERE mc.instance_id = v_instance AND mc.user_id = auth.uid();

  RETURN jsonb_build_object(
    'instance_id', v_instance, 'instance_slug', v_slug,
    'role', coalesce(v_role, ''), 'capabilities', v_caps);
END;
$$;
REVOKE ALL ON FUNCTION public.my_church_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_church_access() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE QUEUE THE OFFICE READS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.access_request_queue(instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_rows     jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  v_instance := coalesce(instance_in,
    nullif(public.my_church_access()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to read'; END IF;
  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the church office may read the access queue';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', r.id,
           'user_id', r.user_id,
           -- Enough to know WHO asked, and nothing about their life.
           'display_name', im.display_name,
           'email', CASE WHEN u.email::text LIKE '%@phone.poetech.us' THEN NULL
                         ELSE u.email::text END,
           'member_role', im.role,
           'surface_id', r.surface_id,
           'surface_label', r.surface_label,
           'capability', r.capability,
           'reason', r.reason,
           'status', r.status,
           'decided_by', r.decided_by,
           'decided_at', r.decided_at,
           'decision_note', r.decision_note,
           'created_at', r.created_at,
           -- Does the grant this request asks for ALREADY exist? An office
           -- looking at a queue needs to know it is not about to grant
           -- something twice, or refuse something already given.
           'already_granted', EXISTS (
             SELECT 1 FROM member_capabilities mc
              WHERE mc.instance_id = r.instance_id AND mc.user_id = r.user_id
                AND mc.capability = r.capability)
         ) ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.created_at DESC), '[]'::jsonb)
    INTO v_rows
    FROM public.access_requests r
    LEFT JOIN instance_members im ON im.instance_id = r.instance_id AND im.user_id = r.user_id
    LEFT JOIN auth.users u ON u.id = r.user_id
   WHERE r.instance_id = v_instance;

  RETURN jsonb_build_object('instance_id', v_instance, 'rows', v_rows,
                            'open', (SELECT count(*) FROM public.access_requests
                                      WHERE instance_id = v_instance AND status = 'open'));
END;
$$;
REVOKE ALL ON FUNCTION public.access_request_queue(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.access_request_queue(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. THE DECISION — which GRANTS, through the same guarded door
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.access_request_decide(
  request_in  uuid,
  decision_in text,
  note_in     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_req   public.access_requests%ROWTYPE;
  v_role  text;
  v_dec   text := lower(btrim(coalesce(decision_in, '')));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF v_dec NOT IN ('granted','refused') THEN
    RAISE EXCEPTION 'a decision is granted or refused, not %', decision_in;
  END IF;

  SELECT * INTO v_req FROM public.access_requests WHERE id = request_in;
  IF v_req.id IS NULL THEN RAISE EXCEPTION 'no such request'; END IF;
  IF v_req.status <> 'open' THEN
    RAISE EXCEPTION 'that request was already %', v_req.status;
  END IF;

  v_role := coalesce(public.user_role_in_instance(v_req.instance_id), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the church office may decide an access request';
  END IF;
  IF v_req.user_id = auth.uid() THEN
    RAISE EXCEPTION 'you cannot decide your own request';
  END IF;

  -- THE GRANT GOES FIRST, through 0126's guarded door. If it refuses — the
  -- person has left the church, or is already an owner — this whole call
  -- raises and NOTHING is written. A queue that said granted while the tile
  -- stayed locked would be worse than no queue at all.
  IF v_dec = 'granted' THEN
    PERFORM public.set_member_capability(v_req.instance_id, v_req.user_id, v_req.capability, true);
  END IF;

  UPDATE public.access_requests
     SET status = v_dec,
         decided_by = auth.uid(),
         decided_at = now(),
         decision_note = nullif(left(btrim(coalesce(note_in, '')), 500), ''),
         updated_at = now()
   WHERE id = v_req.id
   RETURNING * INTO v_req;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_req.instance_id, auth.uid(), 'update', 'access_request', v_req.id,
          jsonb_build_object('status', 'open', 'asked_for', v_req.surface_id),
          jsonb_build_object('status', v_dec, 'capability', v_req.capability, 'for_user', v_req.user_id),
          coalesce(v_req.decision_note, 'access_request_decide'));

  RETURN jsonb_build_object('id', v_req.id, 'status', v_req.status,
                            'capability', v_req.capability, 'user_id', v_req.user_id,
                            'decided_at', v_req.decided_at);
END;
$$;
REVOKE ALL ON FUNCTION public.access_request_decide(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.access_request_decide(uuid, text, text) TO authenticated;

COMMENT ON TABLE public.access_requests IS
  'A person asks the office for a staff tab; the office decides, and an approval GRANTS through set_member_capability rather than only marking a row (0211).';
COMMENT ON FUNCTION public.my_church_access() IS
  'The caller''s own church membership and own capabilities, for the app''s surface gates. The database is still the wall (0211, DR-0060).';

-- ---------------------------------------------------------------------------
-- 6. THE OVERLAYS — re-run, because this migration created an instance-scoped table
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
