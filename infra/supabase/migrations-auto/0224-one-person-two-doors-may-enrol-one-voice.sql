-- =============================================================================
-- 0224 — one person, two doors, one voice: voice_profiles joins DR-0311
-- =============================================================================
-- THE REPORT, and it named its own cause. Darrell, 2026-09-22, on the Voice tab
-- with a sample already recorded and the studio answering:
--
--     "I also couldn't record and hear my voice... it didn't work..."
--     new row violates row-level security policy (USING expression)
--                                              for table "voice_profiles"
--
-- "(USING expression)" on what the app calls an INSERT is the tell. enrollMyVoice
-- does an UPSERT on (instance_id, person_key), so when a row for that person
-- already exists Postgres takes the UPDATE path -- and the UPDATE path evaluates
-- voice_profiles_update's USING, which was:
--
--     USING (created_by = auth.uid())
--
-- The one row in this table (measured 2026-09-22: ever_inserted = 1, stats never
-- reset) was created by ONE of his doors. Signed in on the OTHER door, the same
-- man is not the same uuid, so his own row refused him. Every re-record after
-- that hit the same wall, which is exactly why the table has one row and no
-- second enrolment ever landed.
--
-- THIS IS A SOLVED CLASS IN THIS HOUSE. Migration 0141 (DR-0311) built
-- same_person(uuid) precisely for it -- a STABLE SECURITY DEFINER predicate that
-- is true when the row belongs to you OR to your own other door, resolved
-- through person_links. It was substituted into study_entries, study_spaces,
-- eternal_algorithms and tv_watch so ONE library serves both doors.
-- voice_profiles was simply never included. This includes it.
--
-- THE SELF-CONSENT BRIGHT LINE IS NOT WIDENED, and that is the whole reason this
-- is safe. person_links joins a PERSON'S OWN two doors and nothing else, so
-- same_person(created_by) still means "this is my row". Nobody gains the ability
-- to create, move or revoke consent on another human being's voice, which is the
-- rule 0047 exists to enforce and which stands untouched here. What changes is
-- that a man stops being a stranger to his own consent record.
--
-- THE INSTANCE-MEMBERSHIP TEST IS KEPT on INSERT exactly as 0047 wrote it, so a
-- linked door still cannot enrol into a space it is not a member of.
--
-- THE RESTRICTIVE OVERLAYS ARE UNTOUCHED. assistant_scope_* and viewer_readonly_*
-- (0125/0126/0130/0190, applied by catalog-driven loops) are RESTRICTIVE and
-- intersect with these; an assistant still touches nothing and a viewer still
-- cannot write. Read live and confirmed by name on 2026-09-22 before this
-- migration was written, rather than assumed from the source.
--
-- DEPENDS ON: 0047 (voice_profiles), 0141 (person_links + same_person).
-- IDEMPOTENT: DROP-then-CREATE on named policies only. Additive to nothing;
-- it replaces three policies with three policies.
-- =============================================================================

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'same_person') THEN
    RAISE EXCEPTION '0224 requires public.same_person(uuid) from migration 0141 - run 0141 first';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE n.nspname = 'public' AND c.relname = 'voice_profiles') THEN
    RAISE EXCEPTION '0224 requires voice_profiles from migration 0047 - run 0047 first';
  END IF;
END $guard$;

-- INSERT: you may create YOUR OWN row -- from either of your own doors -- and
-- only inside an instance you belong to. 0047's membership test is verbatim.
DROP POLICY IF EXISTS voice_profiles_insert ON voice_profiles;
CREATE POLICY voice_profiles_insert ON voice_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    same_person(created_by)
    AND user_role_in_instance(instance_id) IN ('owner','admin','member')
  );

-- UPDATE: the row's own person may move their consent (grant / revoke), and the
-- USING half is what the failing upsert actually hit.
DROP POLICY IF EXISTS voice_profiles_update ON voice_profiles;
CREATE POLICY voice_profiles_update ON voice_profiles FOR UPDATE
  TO authenticated
  USING      (same_person(created_by))
  WITH CHECK (same_person(created_by));

-- DELETE: the row's own person removes their enrolment; an instance owner may
-- also remove a row (a withdrawal actioned by the governor). 0047's owner
-- clause is kept exactly as it was.
DROP POLICY IF EXISTS voice_profiles_delete ON voice_profiles;
CREATE POLICY voice_profiles_delete ON voice_profiles FOR DELETE
  TO authenticated
  USING (same_person(created_by) OR user_role_in_instance(instance_id) = 'owner');

-- SELECT is unchanged (0047): any member of the instance may SEE who is
-- enrolled. Left alone on purpose -- widening it was never the problem.

NOTIFY pgrst, 'reload schema';
