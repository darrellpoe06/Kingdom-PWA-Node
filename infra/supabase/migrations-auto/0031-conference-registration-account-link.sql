-- =============================================================================
-- 0031 — conference registration -> optional account ON-RAMP (the funnel)
-- =============================================================================
-- Declared by Darrell 2026-06-17. The open, no-login congregation registration
-- (0027) is the easy front door and STAYS exactly as frictionless as it is. This
-- migration adds the OPTIONAL second step of the funnel: a registrant who chooses
-- to create a PoeTech account (Google primary; email+password secondary) has their
-- conference registration LINKED to that account, so a one-time attendee becomes an
-- app member without re-entering anything. Skipping the account is fully supported:
-- the registration is complete on its own (NO lockout) — see ConferenceRegisterForm.
--
-- WHAT THIS ADDS (additive only; 0027's open-insert + owner/admin-read are unchanged
-- so NO new leak surface on the table itself):
--   1. linked_user_id — the account a registration was claimed by (NULL = open row).
--   2. claim_conference_registration(p_reg_id) — SECURITY DEFINER. Links an
--      UNCLAIMED row to the CALLER's own auth.uid(). It can only ever set the row
--      to the caller (never to an arbitrary user) and only when the row is not yet
--      claimed (never hijacks a row already linked to someone else). Returns true
--      when a row was linked. The row id is a client-generated, unguessable uuid
--      held only by the registrant's own browser (no anon SELECT exists to
--      enumerate ids), so a caller can only claim a registration they actually made.
--   3. get_my_conference_registrations() — SECURITY DEFINER, filtered strictly to
--      auth.uid(), so a member can see THEIR OWN linked registration carry into the
--      app WITHOUT opening any broad SELECT on the table (the roll stays
--      owner/admin-only). This is the only member read path and it self-scopes.
--   4. One-time cleanup: delete the readiness-eval probe row + any k6 load-test
--      rows (both explicitly-tagged test artifacts; see the 2026-06-16 readiness
--      eval note) so the live registration count is clean.
--
-- NO-LEAK (proven structurally by scripts/conference-link-guard.mjs + its vitest):
--   - No anon SELECT/UPDATE/DELETE policy is added; anon keeps INSERT-only.
--   - claim sets linked_user_id = auth.uid() (NOT a client value) and only on
--     linked_user_id IS NULL rows; EXECUTE revoked from PUBLIC/anon.
--   - get_my filters by auth.uid(); EXECUTE revoked from PUBLIC/anon.
--
-- DEPENDS ON: 0027 (conference_public_registrations), schema-v2.1-infra (auth).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE, guarded DELETE.
-- Tier C (auth + registration-data surface) — ship reviewed.
-- =============================================================================

-- 1. The link column ----------------------------------------------------------
ALTER TABLE conference_public_registrations
  ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS conference_public_registrations_linked_user_idx
  ON conference_public_registrations(linked_user_id);

-- 2. claim — link an UNCLAIMED row to the calling user (the funnel join) -------
-- SECURITY DEFINER so it can write past the owner/admin-only UPDATE policy, but it
-- is tightly bounded: caller must be signed in; it sets linked_user_id to the
-- caller's OWN uid; it only touches a row that is not yet claimed. A caller can
-- neither set the row to another user nor steal a row already linked.
CREATE OR REPLACE FUNCTION public.claim_conference_registration(p_reg_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_rows integer;
BEGIN
  IF auth.uid() IS NULL OR p_reg_id IS NULL THEN
    RETURN false;                       -- must be signed in with a target row
  END IF;
  UPDATE conference_public_registrations
     SET linked_user_id = auth.uid()    -- the CALLER only — never a client value
   WHERE id = p_reg_id
     AND linked_user_id IS NULL;        -- unclaimed only — never hijack
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$fn$;

REVOKE ALL     ON FUNCTION public.claim_conference_registration(uuid) FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.claim_conference_registration(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.claim_conference_registration(uuid) TO authenticated;

-- 3. get_my — a member reads ONLY their own linked registration(s) -------------
-- The table SELECT stays owner/admin-only (0027). This SECURITY DEFINER function
-- is the member's only read path and is filtered strictly to auth.uid(), so it can
-- never return the roll — it returns the caller's own rows or nothing.
CREATE OR REPLACE FUNCTION public.get_my_conference_registrations()
RETURNS SETOF conference_public_registrations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT *
    FROM conference_public_registrations
   WHERE linked_user_id = auth.uid()
   ORDER BY created_at DESC;
$fn$;

REVOKE ALL     ON FUNCTION public.get_my_conference_registrations() FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.get_my_conference_registrations() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_my_conference_registrations() TO authenticated;

-- 4. One-time cleanup of test artifacts so the live count is clean -------------
-- The readiness eval created one probe row; the k6 load-test script tags its rows
-- 'loadtest-k6'. Both are explicitly test data (docs/99-session-notes/
-- 2026-06-16-conference-1000-user-readiness-eval.md). Idempotent: 0 rows once gone.
DELETE FROM conference_public_registrations
 WHERE source IN ('readiness-probe', 'loadtest-k6')
    OR name = '__readiness_probe__';

NOTIFY pgrst, 'reload schema';
