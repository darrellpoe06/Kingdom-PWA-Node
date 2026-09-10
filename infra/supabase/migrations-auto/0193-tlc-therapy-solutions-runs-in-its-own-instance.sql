-- =============================================================================
-- 0193 -- TLC THERAPY SOLUTIONS RUNS IN ITS OWN INSTANCE (DR-0351)
-- =============================================================================
-- Darrell 2026-09-10: "yes TLC gets it's own database!"
--
-- BEFORE: the TLC office and the Poe family shared the poe-family instance
-- (Darrell owner, Christina admin, 0130 §8). Every office row (tasks,
-- assignments, invites, packets, banking, roster, jobs, applications) carried
-- the FAMILY instance id, family members appeared in the office's Governance
-- list, a family child seat could be mistaken for an office seat, and the
-- office resolver (tlc_onboarding_my_office, 0187) was the shell's family-first
-- resolution wearing an office name.
--
-- AFTER: one instance of type 'therapy-practice' -- slug
-- tlc-therapy-solutions -- is the office. Christina owns it (both sign-ins);
-- Darrell administers it (his gmail identity and his phone identity, 0140);
-- nobody else is seeded -- every other seat is granted from Governance or
-- minted by a hire. The office rows move (there were none live on
-- 2026-09-10; the statements are exact for a replay that has some). The
-- resolver becomes OFFICE-ONLY: tlc_onboarding_my_office() and the new
-- my_office_instance_role() answer only from a therapy-practice membership,
-- so a family member who is not office staff is a client at the TLC door,
-- and the shell's my_default_instance_role() (family-first) is untouched --
-- the family app keeps working for the same people.
--
-- Not moved (the next increment, DR-0351 re-review): office_records
-- (office_id = 'tlc', the Assistant workspace) and practice_leads, which the
-- PoeTech shell's Practice tab reads from the family instance as well.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The instance. Idempotent by slug (tenants_slug_key).
-- ---------------------------------------------------------------------------
INSERT INTO public.instances (slug, display_name, instance_type)
SELECT 'tlc-therapy-solutions', 'TLC Therapy Solutions', 'therapy-practice'
 WHERE NOT EXISTS (SELECT 1 FROM public.instances WHERE slug = 'tlc-therapy-solutions');

-- ---------------------------------------------------------------------------
-- 2. The people. By email lookup in auth.users (the 0130 §8 pattern), the
--    display name carried over from the family membership where one exists.
--    Christina: owner, never downgraded. Darrell: admin, never downgraded
--    from owner should the office ever make him one. A missing sign-in
--    (christina@tlctherapysolutions.com has no account yet on 2026-09-10)
--    simply seeds nothing for that address; a later run seeds it.
-- ---------------------------------------------------------------------------
INSERT INTO public.instance_members (instance_id, user_id, role, display_name)
SELECT i.id, u.id, 'owner', coalesce(fm.display_name, split_part(u.email, '@', 1))
  FROM public.instances i
  JOIN auth.users u ON lower(u.email) IN ('christina@tlctherapysolutions.com', 'mrspoe06@gmail.com')
  LEFT JOIN public.instances fam ON fam.slug = 'poe-family'
  LEFT JOIN public.instance_members fm ON fm.instance_id = fam.id AND fm.user_id = u.id
 WHERE i.slug = 'tlc-therapy-solutions'
ON CONFLICT (instance_id, user_id) DO UPDATE SET role = 'owner';

INSERT INTO public.instance_members (instance_id, user_id, role, display_name)
SELECT i.id, u.id, 'admin', coalesce(fm.display_name, 'Darrell')
  FROM public.instances i
  JOIN auth.users u ON lower(u.email) IN ('darrellpoe06@gmail.com', '15636502416@phone.poetech.us')
  LEFT JOIN public.instances fam ON fam.slug = 'poe-family'
  LEFT JOIN public.instance_members fm ON fm.instance_id = fam.id AND fm.user_id = u.id
 WHERE i.slug = 'tlc-therapy-solutions'
ON CONFLICT (instance_id, user_id) DO UPDATE SET role = 'admin'
  WHERE public.instance_members.role <> 'owner';

-- ---------------------------------------------------------------------------
-- 3. The office rows move from the family instance to the office. Eight
--    tables carry instance_id (every tlc_* table with an FK to instances).
--    tlc_job_applications wears a guard trigger that pins instance_id (0191);
--    it is stepped around for this one move and re-armed in the same step.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_tlc uuid;
  v_fam uuid;
BEGIN
  SELECT id INTO v_tlc FROM public.instances WHERE slug = 'tlc-therapy-solutions';
  SELECT id INTO v_fam FROM public.instances WHERE slug = 'poe-family';
  IF v_tlc IS NULL OR v_fam IS NULL THEN RETURN; END IF;

  UPDATE public.tlc_office_tasks        SET instance_id = v_tlc WHERE instance_id = v_fam;
  UPDATE public.tlc_lesson_assignments  SET instance_id = v_tlc WHERE instance_id = v_fam;
  UPDATE public.tlc_onboarding_invites  SET instance_id = v_tlc WHERE instance_id = v_fam;
  UPDATE public.tlc_onboarding_packets  SET instance_id = v_tlc WHERE instance_id = v_fam;
  UPDATE public.tlc_onboarding_banking  SET instance_id = v_tlc WHERE instance_id = v_fam;
  UPDATE public.tlc_roster              SET instance_id = v_tlc WHERE instance_id = v_fam;
  UPDATE public.tlc_jobs                SET instance_id = v_tlc WHERE instance_id = v_fam;

  ALTER TABLE public.tlc_job_applications DISABLE TRIGGER tlc_job_applications_guard_trg;
  UPDATE public.tlc_job_applications    SET instance_id = v_tlc WHERE instance_id = v_fam;
  ALTER TABLE public.tlc_job_applications ENABLE TRIGGER tlc_job_applications_guard_trg;
END $$;

-- ---------------------------------------------------------------------------
-- 4. The office resolver, OFFICE-ONLY. Same shape as 0187; the family-first
--    fallback is gone: no therapy-practice membership = no office. Every
--    tlc_* function (invite, open, save, review, roster, jobs, hire) reads
--    this, so the whole server side follows in one definition.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_my_office()
RETURNS TABLE (instance_id uuid, role text, office_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT im.instance_id, im.role, i.display_name
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid() AND i.instance_type = 'therapy-practice'
   ORDER BY im.joined_at ASC, i.id ASC
   LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_my_office() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_my_office() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. The app's office role -- the office sibling of my_default_instance_role
--    (0130). The TLC door reads THIS for who is staff; the shell keeps reading
--    the family-first one. Same jsonb shape so lib/instance-role.js serves
--    both from one store.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_office_instance_role()
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
      WHERE im.user_id = auth.uid() AND i.instance_type = 'therapy-practice'
      ORDER BY im.joined_at ASC, i.id ASC
      LIMIT 1),
    jsonb_build_object('instance_id', null, 'instance_slug', null, 'instance_type', null, 'role', null)
  );
$$;
REVOKE ALL ON FUNCTION public.my_office_instance_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_office_instance_role() TO authenticated;

-- The overlays re-run so the assistant scope and the viewer read-only wall
-- carry every table exactly as before (0190: a redefinition carries every
-- earlier exception).
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
