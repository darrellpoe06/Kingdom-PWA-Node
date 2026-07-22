-- =============================================================================
-- 0113 — the poe-family founder is the OWNER (so role management works there)
-- =============================================================================
-- Darrell 2026-07-22, in the live Admin -> Role & stewards panel: "why can't I
-- edit the roles?" Reality-trace of the real data model found the cause: the
-- founder-allowlist branch of join_default_instance (0012/0104) inserts EVERY
-- founder into poe-family as role='member' (so "all three adult accounts see
-- everything" equally). But the role controls (0111) gate on owner/admin, and
-- poe-family has NEITHER — so no one, including the Governor, can manage roles in
-- the family space. The control is inert exactly where he administers.
--
-- FIX: promote the primary founder (darrellpoe06@gmail.com) to OWNER of poe-family.
-- Owner is the Governor/founder role; from it he can manage every other member
-- (member<->admin<->viewer) via set_member_role. The other founders are left as
-- 'member' (unchanged — they still see everything; he can adjust them in the UI).
-- This does NOT weaken isolation: owner sees exactly what member sees, plus the
-- ability to manage. RLS setup is untouched (tenancy-guard stays green).
--
-- SAFE + IDEMPOTENT: a single targeted UPDATE, only when the row exists and is not
-- already owner. join_default_instance's INSERT is ON CONFLICT DO NOTHING, so a
-- future re-join never downgrades this owner back to member.
--
-- DEPENDS ON: 0012/0104 (poe-family + the founder membership row), schema-v2.1
--             (instance_members, instances). Re-runnable.
-- =============================================================================

UPDATE public.instance_members im
   SET role = 'owner'
  FROM public.instances i, auth.users u
 WHERE im.instance_id = i.id
   AND i.slug = 'poe-family'
   AND im.user_id = u.id
   AND lower(u.email) = 'darrellpoe06@gmail.com'
   AND im.role IS DISTINCT FROM 'owner';

NOTIFY pgrst, 'reload schema';
