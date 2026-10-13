-- =============================================================================
-- 0182 — my_business_role(slug) honors person_links (DR-0311: one person,
--        two doors, one library)
-- =============================================================================
-- Darrell 2026-09-07, on his own tablet at poetech.us/moore/app/: "where is the
-- logout button?" — the Moore door's header rendered NOTHING for him. Traced:
-- his tablet holds the phone+PIN door's session; 0090's my_business_role reads
-- instance_members by auth.uid() ALONE, and the seat on 'moore-divahs' is on
-- his gmail identity. So the door answered 'none' to a governor and drew the
-- signed-in-customer header, which was blank. 0141 already made RLS serve one
-- library to both of a linked person's doors (same_person); the role read the
-- door asks first never learned it. It does now.
--
-- SAME contract as 0090: SECURITY DEFINER, returns ONLY the caller's own role
-- in the named instance, 'none' when not a member / not signed in, signed-in
-- only. RLS on every table remains the real wall regardless of what the
-- client renders. IDEMPOTENT: CREATE OR REPLACE.
--
-- Precedence when a person has seats through more than one door: the higher
-- role wins (owner > admin > member/other) — the role is a fact about the
-- person, not about which handle they happened to turn.
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
        AND same_person(im.user_id)
      ORDER BY CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END
      LIMIT 1),
    'none'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.my_business_role(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.my_business_role(text) TO authenticated;

-- Verify after apply (as the phone door, jwt sub = the linked door uuid):
--   SELECT my_business_role('moore-divahs');   -> 'admin' (was 'none')
-- And as an unlinked authenticated uuid:       -> 'none' (unchanged)
