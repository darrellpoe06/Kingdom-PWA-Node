-- =============================================================================
-- 0128 — family bridge-token provisioning (DR-0268 — "Humans don't do anything")
-- =============================================================================
-- Darrell 2026-08-03, from the fold screenshot: the Real Estate photos/history
-- panels sat on "paste the bridge token" — the per-device paste was v1 by
-- design (nas-photos.js: "Promoting this to a family-shared … setting is a
-- follow-up"), and tonight the follow-up came due: a signed-in family device
-- provisions itself; nobody pastes a token per device again.
--
-- SECURITY POSTURE (keeps the 2026-07-30 leak-closure intact):
--   * The token NEVER ships in the public bundle (that was the 27-day leak).
--   * The table is RLS deny-all — no direct reads even for authenticated;
--     access is ONLY through the two SECURITY DEFINER RPCs below.
--   * get: any signed-in MEMBER of a non-church instance that has a row.
--   * set: only an OWNER/ADMIN of a non-church instance (one paste anywhere
--     by a steward provisions every family device; church roles get nothing).
--   * Demo / profileless / anon: no membership -> NULL -> the old honest gate.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members).
-- IDEMPOTENT: CREATE IF NOT EXISTS / OR REPLACE. Safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.family_secure_config (
  instance_id uuid PRIMARY KEY REFERENCES public.instances(id) ON DELETE CASCADE,
  chat_bridge_token text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.family_secure_config ENABLE ROW LEVEL SECURITY;
-- Deny-all on purpose: no policies. The RPCs are the only doors.

CREATE OR REPLACE FUNCTION public.get_family_bridge_token()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT fsc.chat_bridge_token
    FROM family_secure_config fsc
    JOIN instance_members im ON im.instance_id = fsc.instance_id
    JOIN instances i ON i.id = fsc.instance_id
   WHERE im.user_id = auth.uid()
     AND COALESCE(i.instance_type, '') <> 'church'
   ORDER BY fsc.updated_at DESC
   LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_family_bridge_token() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_family_bridge_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  clean text := left(btrim(COALESCE(p_token, '')), 512);
  wrote int;
BEGIN
  IF clean = '' THEN
    RETURN false;
  END IF;
  INSERT INTO family_secure_config (instance_id, chat_bridge_token, updated_by, updated_at)
  SELECT im.instance_id, clean, auth.uid(), now()
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid()
     AND im.role IN ('owner','admin')
     AND COALESCE(i.instance_type, '') <> 'church'
  ON CONFLICT (instance_id) DO UPDATE
     SET chat_bridge_token = EXCLUDED.chat_bridge_token,
         updated_by = EXCLUDED.updated_by,
         updated_at = EXCLUDED.updated_at;
  GET DIAGNOSTICS wrote = ROW_COUNT;
  RETURN wrote > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_family_bridge_token(text) TO authenticated;

-- New instance-scoped table => the viewer read-only overlay MUST re-run so a
-- viewer role can never write it (DR-0241; enforced by tenancy-guard.test.js —
-- which correctly went red on the first cut of this migration).
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
