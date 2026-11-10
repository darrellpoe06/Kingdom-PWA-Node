-- =============================================================================
-- 0319 — one person sees one house from either sign-in (DR-1407)
-- =============================================================================
-- Darrell 2026-11-10, with a screenshot of Big Picture -> Work order triage
-- (4 open, 9 closed, #13 from Poe Properties with 33 pictures): "Why don't
-- Christina see the same page on the Big Picture!!!" Christina has two
-- sign-ins on record (0140 names both as family): her Gmail and her TLC
-- address. A person's household is chosen at sign-in by join_default_instance
-- (family first, then the oldest seat), and Poe Properties' work orders are
-- read under the reader's own seat. So a sign-in that holds only some of her
-- seats opens on a different house, and an RLS read with no seat comes back
-- empty rather than as an error. That is a different page with nothing on it
-- saying why.
--
-- This gives each of a person's sign-ins the seats the other holds, at the
-- same role. It never removes a seat and never lowers a role. It only adds
-- what is missing, or raises member to admin or admin to owner where the
-- other sign-in already stands higher. Only the owner / admin / member ladder
-- is carried; renter, contractor and other seats stay where they were given.
--
-- The pairs are declared here, as 0140 declared the family's addresses. A
-- pair whose second account does not exist yet changes nothing. Every
-- sign-in asks again (share_my_households_across_my_sign_ins, called by the
-- app before it resolves the household), so an account made later is
-- brought level on its first sign-in, and only for the person signing in.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sign_in_pairs()
RETURNS TABLE (a text, b text)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $fn$
  VALUES ('mrspoe06@gmail.com', 'christina@tlctherapysolutions.com')
$fn$;

REVOKE ALL ON FUNCTION public.sign_in_pairs() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.mirror_sign_in_seats(p_from uuid, p_to uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  n integer := 0;
  k integer;
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR p_from = p_to THEN
    RETURN 0;
  END IF;

  INSERT INTO public.instance_members (instance_id, user_id, role, display_name, title, classification, relationship)
  SELECT f.instance_id, p_to, f.role, f.display_name, f.title, f.classification, f.relationship
    FROM public.instance_members f
   WHERE f.user_id = p_from
     AND f.role IN ('owner', 'admin', 'member')
  ON CONFLICT (instance_id, user_id) DO NOTHING;
  GET DIAGNOSTICS k = ROW_COUNT;
  n := n + k;

  UPDATE public.instance_members t
     SET role = f.role
    FROM public.instance_members f
   WHERE f.user_id = p_from
     AND t.user_id = p_to
     AND t.instance_id = f.instance_id
     AND f.role IN ('owner', 'admin')
     AND t.role IN ('admin', 'member')
     AND (CASE f.role WHEN 'owner' THEN 0 ELSE 1 END)
       < (CASE t.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END);
  GET DIAGNOSTICS k = ROW_COUNT;
  RETURN n + k;
END;
$fn$;

REVOKE ALL ON FUNCTION public.mirror_sign_in_seats(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.share_my_households_across_my_sign_ins()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_me    uuid := auth.uid();
  v_email text;
  v_twin  uuid;
  n       integer := 0;
BEGIN
  IF v_me IS NULL THEN
    RETURN 0;
  END IF;
  SELECT lower(coalesce(email, '')) INTO v_email FROM auth.users WHERE id = v_me;
  FOR v_twin IN
    SELECT u.id
      FROM public.sign_in_pairs() p
      JOIN auth.users u
        ON lower(u.email) = CASE WHEN p.a = v_email THEN p.b WHEN p.b = v_email THEN p.a END
  LOOP
    n := n + public.mirror_sign_in_seats(v_twin, v_me) + public.mirror_sign_in_seats(v_me, v_twin);
  END LOOP;
  RETURN n;
END;
$fn$;

REVOKE ALL ON FUNCTION public.share_my_households_across_my_sign_ins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.share_my_households_across_my_sign_ins() TO authenticated;

-- Bring every declared pair level now, so the next sign-in opens on the same
-- house without waiting for this call.
DO $apply$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT ua.id AS a_id, ub.id AS b_id
      FROM public.sign_in_pairs() p
      JOIN auth.users ua ON lower(ua.email) = p.a
      JOIN auth.users ub ON lower(ub.email) = p.b
  LOOP
    PERFORM public.mirror_sign_in_seats(r.a_id, r.b_id);
    PERFORM public.mirror_sign_in_seats(r.b_id, r.a_id);
  END LOOP;
END
$apply$;
