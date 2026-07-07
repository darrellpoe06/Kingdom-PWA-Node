-- =============================================================================
-- 0090 — my_business_role(slug): the door asks "who am I here?" safely
-- =============================================================================
-- The unified business door (Admin login / User login — Darrell 2026-07-07)
-- renders the steward board for an owner/admin of the business instance and
-- My Orders for everyone else. The client cannot read instance_members
-- directly (correct); this narrow SECURITY DEFINER read returns ONLY the
-- caller's own role in the named instance ('none' when not a member / not
-- signed in). The button is signage; THIS is the gate's input — and RLS on
-- every table remains the real wall regardless of what the client renders.
-- IDEMPOTENT: CREATE OR REPLACE. Signed-in only; no anon execute.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.my_business_role(p_instance_slug text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT im.role
       FROM instance_members im
       JOIN instances i ON i.id = im.instance_id
      WHERE i.slug = p_instance_slug
        AND im.user_id = auth.uid()
      LIMIT 1),
    'none'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.my_business_role(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.my_business_role(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Verify after apply:
--   As anon:  rpc/my_business_role -> permission denied.
--   As Shay:  my_business_role('moore-divahs') -> 'owner' (or 'admin').
--   As a customer: 'none'.
