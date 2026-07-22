-- =============================================================================
-- 0114 — the Governed Support Door (DR-0223 / DR-0220 Phase 6)
-- =============================================================================
-- Darrell 2026-07-22: "Build the support door — Phase 6, all of it." How the
-- technology team fixes issues WITHOUT ambient access to data: privacy is the
-- default; support access is a scoped, time-boxed, consented, AUDITED exception,
-- never ambient. This is the enforcement for DR-0223.
--
-- Pieces:
--   1. Capability layer (DR-0220 §2b): role_capabilities + member_has_capability.
--      A role carries named capabilities (checkboxes) — no per-policy rewrites.
--   2. support_supportable_table(): the PHI-exclusion allowlist. CLINICAL/PHI and
--      anything unknown map to NULL = NEVER break-glass-able (fail closed,
--      TLC-FIREWALL / DR-0003). Support fixes the SYSTEM around PHI, never reads it.
--   3. support_access_grants: a break-glass grant to ONE resource, time-boxed.
--   4. grant_support_access(): owner/admin grants a capable specialist a scoped,
--      expiring grant to a NON-PHI resource, with a required reason; writes an
--      audit_log permission-grant row.
--   5. support_read(): the specialist reads the scoped resource IF the grant is
--      LIVE (theirs, unexpired, unrevoked) — and LOGS EVERY READ to audit_log
--      (visible to the data owner). Reads only via the allowlisted table (format
--      %I over a fixed allowlist — injection-safe).
--   6. revoke_support_access(), list_my_support_grants().
--
-- Owner holds the keys (can grant) but exercises them per-incident + logged, never
-- ambient sight. Isolation-tested (tests/0114-support-door-smoke.sql) before trust.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members,
--             user_role_in_instance, audit_log). IDEMPOTENT. Re-runnable.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Capability layer (DR-0220 §2b)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_capabilities (
  role       text NOT NULL,
  capability text NOT NULL,
  PRIMARY KEY (role, capability)
);

-- Seed the Dev/Ops Specialist capability set (+ owner/admin baselines). The
-- 'specialist' role IS the Dev/Ops Specialist; owner keeps everything.
INSERT INTO public.role_capabilities (role, capability) VALUES
  ('specialist', 'support.reproduce'),
  ('specialist', 'support.breakglass'),
  ('specialist', 'member.provision'),
  ('owner',      'support.reproduce'),
  ('owner',      'support.breakglass'),
  ('owner',      'member.provision'),
  ('admin',      'member.provision')
ON CONFLICT DO NOTHING;

-- member_has_capability(instance, capability[, user]) — does the user's role in
-- this instance carry the capability? SECURITY DEFINER to read the join.
CREATE OR REPLACE FUNCTION public.member_has_capability(instance_uuid uuid, capability_in text, check_user uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM instance_members im
      JOIN role_capabilities rc ON rc.role = im.role
     WHERE im.instance_id = instance_uuid
       AND im.user_id = COALESCE(check_user, auth.uid())
       AND rc.capability = capability_in
  );
$$;
GRANT EXECUTE ON FUNCTION public.member_has_capability(uuid, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. The PHI-exclusion allowlist. NON-clinical, operational resources map to a
--    table; CLINICAL/PHI + anything unknown map to NULL = NOT supportable (fail
--    closed). This is the hard TLC-FIREWALL line: confessions / TLC clinical /
--    anything not explicitly listed can NEVER be break-glass-read.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.support_supportable_table(resource_type text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(resource_type, ''))
    WHEN 'transaction'     THEN 'transactions'
    WHEN 'instance_member' THEN 'instance_members'
    WHEN 'choir_member'    THEN 'choir_members'
    WHEN 'inquiry'         THEN 'inquiries'
    WHEN 'invite'          THEN 'instance_invites'
    ELSE NULL   -- clinical/PHI + unknown -> never supportable
  END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Break-glass grants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_access_grants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  grantee_user_id uuid NOT NULL REFERENCES auth.users(id),
  resource_type   text NOT NULL,
  resource_id     uuid NOT NULL,
  reason          text NOT NULL,
  consent_source  text NOT NULL CHECK (consent_source IN ('user', 'governor')),
  granted_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  revoked_at      timestamptz
);
CREATE INDEX IF NOT EXISTS support_grants_instance_idx ON public.support_access_grants(instance_id);
CREATE INDEX IF NOT EXISTS support_grants_grantee_idx  ON public.support_access_grants(grantee_user_id, expires_at);

ALTER TABLE public.support_access_grants ENABLE ROW LEVEL SECURITY;
-- Read: owner/admin of the instance (oversight) OR the grantee (their own grants).
-- No client INSERT/UPDATE/DELETE — grants are minted + revoked only via the RPCs.
DROP POLICY IF EXISTS support_grants_read ON public.support_access_grants;
CREATE POLICY support_grants_read ON public.support_access_grants FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR grantee_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. grant_support_access — owner/admin grants a CAPABLE specialist a scoped,
--    expiring grant to a NON-PHI resource. Returns the grant id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_support_access(
  instance_uuid uuid, grantee uuid, resource_type_in text, resource_id_in uuid,
  reason_in text, minutes_in int DEFAULT 60)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor      uuid := auth.uid();
  v_actor_role text;
  v_table      text;
  v_mins       int := greatest(1, least(coalesce(minutes_in, 60), 1440));  -- 1 min .. 24 h
  v_id         uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'grant_support_access: not authenticated';
  END IF;
  IF coalesce(trim(reason_in), '') = '' THEN
    RAISE EXCEPTION 'grant_support_access: a reason is required (every grant is on the record)';
  END IF;

  -- CLINICAL/PHI + unknown is NEVER grantable (fail closed).
  v_table := support_supportable_table(resource_type_in);
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'grant_support_access: "%" is not a supportable resource — clinical/PHI is never break-glass-able', resource_type_in;
  END IF;

  -- Only an owner/admin of the instance may grant (governor-granted, audited).
  v_actor_role := user_role_in_instance(instance_uuid);
  IF v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'grant_support_access: only an owner/admin can grant support access';
  END IF;

  -- The grantee must hold the support.breakglass capability (a Dev/Ops Specialist).
  IF NOT member_has_capability(instance_uuid, 'support.breakglass', grantee) THEN
    RAISE EXCEPTION 'grant_support_access: the grantee does not have support break-glass capability';
  END IF;

  INSERT INTO support_access_grants
    (instance_id, grantee_user_id, resource_type, resource_id, reason, consent_source, granted_by, expires_at)
  VALUES
    (instance_uuid, grantee, lower(resource_type_in), resource_id_in, reason_in, 'governor', v_actor,
     now() + make_interval(mins => v_mins))
  RETURNING id INTO v_id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, to_value, note)
  VALUES (instance_uuid, v_actor, 'permission-grant', 'support_access_grant', v_id,
          jsonb_build_object('grantee', grantee, 'resource_type', lower(resource_type_in),
                             'resource_id', resource_id_in, 'reason', reason_in, 'expires_minutes', v_mins),
          'grant_support_access');

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.grant_support_access(uuid, uuid, text, uuid, text, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. support_read — the specialist reads the scoped resource IFF the grant is
--    LIVE (theirs, unexpired, unrevoked). LOGS EVERY READ to audit_log so the
--    data owner always has a receipt. Returns { status, resource_type, resource_id, data }.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.support_read(grant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_g     support_access_grants;
  v_table text;
  v_row   jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'support_read: not authenticated';
  END IF;

  SELECT * INTO v_g FROM support_access_grants WHERE id = grant_id;
  IF v_g.id IS NULL THEN
    RETURN jsonb_build_object('status', 'no-grant');
  END IF;
  IF v_g.grantee_user_id <> v_user THEN
    RAISE EXCEPTION 'support_read: this grant is not yours';
  END IF;
  IF v_g.revoked_at IS NOT NULL OR v_g.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  -- Belt-and-suspenders: the type must still be supportable (never PHI).
  v_table := support_supportable_table(v_g.resource_type);
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'support_read: resource type is not supportable';
  END IF;

  -- Read ONLY via the fixed allowlist table name (format %I — injection-safe).
  EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id = $1', v_table)
    INTO v_row USING v_g.resource_id;

  -- LOG EVERY READ (CAGE) — the data owner sees this in the audit log.
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, note)
  VALUES (v_g.instance_id, v_user, 'export', v_g.resource_type, v_g.resource_id,
          'support_read via grant ' || grant_id::text);

  RETURN jsonb_build_object('status', 'ok', 'resource_type', v_g.resource_type,
                            'resource_id', v_g.resource_id, 'data', coalesce(v_row, 'null'::jsonb));
END;
$$;
GRANT EXECUTE ON FUNCTION public.support_read(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. revoke_support_access + list_my_support_grants
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_support_access(grant_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_g    support_access_grants;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'revoke_support_access: not authenticated';
  END IF;
  SELECT * INTO v_g FROM support_access_grants WHERE id = grant_id;
  IF v_g.id IS NULL THEN
    RETURN false;
  END IF;
  -- The granter, the grantee, or any owner/admin of the instance may revoke.
  IF NOT (v_g.granted_by = v_user OR v_g.grantee_user_id = v_user
          OR user_role_in_instance(v_g.instance_id) IN ('owner','admin')) THEN
    RAISE EXCEPTION 'revoke_support_access: not permitted';
  END IF;
  UPDATE support_access_grants SET revoked_at = now() WHERE id = grant_id AND revoked_at IS NULL;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, note)
  VALUES (v_g.instance_id, v_user, 'permission-revoke', 'support_access_grant', grant_id, 'revoke_support_access');
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.revoke_support_access(uuid) TO authenticated;

-- The caller's own LIVE grants (for the specialist's support panel).
CREATE OR REPLACE FUNCTION public.list_my_support_grants()
RETURNS TABLE (grant_id uuid, instance_id uuid, resource_type text, resource_id uuid, reason text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id, instance_id, resource_type, resource_id, reason, expires_at
    FROM support_access_grants
   WHERE grantee_user_id = auth.uid()
     AND revoked_at IS NULL
     AND expires_at > now()
   ORDER BY expires_at;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_support_grants() TO authenticated;

NOTIFY pgrst, 'reload schema';
