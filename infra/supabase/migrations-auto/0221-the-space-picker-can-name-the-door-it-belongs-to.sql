-- =============================================================================
-- 0221 — list_my_admin_instances also returns the slug (DR-0447)
-- =============================================================================
-- Darrell 2026-09-16, with the Messages -> Add contact space picker open:
-- "Messages don't give an option for the Love Corner." Measured against this
-- database the same day: he is OWNER of the church instance, so the picker DOES
-- offer it — under the name the row carries, "The Church of the Living God."
-- Nothing in that list says "Love Corner," which is the name of the DOOR he
-- opens, so the option he was looking for was not there to find.
--
-- The app already knows which door a space lives behind, keyed by SLUG
-- (lib/app-doors.js, DR-0444) — but this RPC never returned the slug, so the
-- picker had no way to name the door. One additive column closes it.
--
-- SAFE + unchanged scope: still ONLY the caller's own owner/admin memberships,
-- same ordering. The slug is already readable by a member of the instance
-- (0056 instances_member_read); this saves the second round trip.
--
-- DEPENDS ON: 0112-list-my-admin-instances.sql.
-- IDEMPOTENT: DROP + CREATE (the return type changes, so REPLACE is refused).
-- =============================================================================

DROP FUNCTION IF EXISTS public.list_my_admin_instances();

CREATE FUNCTION public.list_my_admin_instances()
RETURNS TABLE (instance_id uuid, slug text, display_name text, instance_type text, role text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT i.id, i.slug, i.display_name, i.instance_type, im.role
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid()
     AND im.role IN ('owner','admin')
   ORDER BY CASE i.instance_type WHEN 'church' THEN 0 ELSE 1 END, i.display_name;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_admin_instances() TO authenticated;

NOTIFY pgrst, 'reload schema';
