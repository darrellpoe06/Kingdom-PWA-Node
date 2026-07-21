-- =============================================================================
-- 0112 — list_my_admin_instances (DR-0221 — "Inside the Love Corner App also")
-- =============================================================================
-- Darrell 2026-07-21, repeating: "Inside the Love Corner App also." The Admin ->
-- Role & stewards "Manage access roles" panel (0111) was scoped to ONE instance
-- (the shell passes the family/personal instance), so a church leader could not
-- manage the COLG / Love Corner church instance's roles there. This returns the
-- instances the caller may administer, so the panel can offer an instance PICKER
-- (family AND every church/ministry space where they are owner/admin) and target
-- the chosen one — same set_member_role / list_instance_members underneath.
--
-- SAFE: returns ONLY the caller's own owner/admin memberships (never another
-- person's, never an instance they don't administer). SECURITY DEFINER to read
-- across the join without tripping instance_members RLS recursion.
--
-- DEPENDS ON: schema-v2.1-infra.sql (instances, instance_members).
-- IDEMPOTENT: CREATE OR REPLACE. Safe to re-run.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.list_my_admin_instances()
RETURNS TABLE (instance_id uuid, display_name text, instance_type text, role text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT i.id, i.display_name, i.instance_type, im.role
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid()
     AND im.role IN ('owner','admin')
   ORDER BY CASE i.instance_type WHEN 'church' THEN 0 ELSE 1 END, i.display_name;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_admin_instances() TO authenticated;

NOTIFY pgrst, 'reload schema';
