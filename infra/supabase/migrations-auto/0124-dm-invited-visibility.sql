-- =============================================================================
-- 0124 — DM invited-visibility: the people a leader invited are visible-but-
-- pending in Messages, never an invisible empty world
-- =============================================================================
-- Darrell 2026-07-28 ("I still can't send him a message through the PoeTech
-- App... also he is already a user... the systems should already know"), and
-- the 2026-07-27 messaging review's own GAP 1 (already dated 2026-07-29):
-- list_dm_contacts (0118) legitimately projects instance_members only, so an
-- invited-but-unclaimed person, or a saved contact with no email, renders as
-- "no one to message" — the surface reads as broken when the truth is "no
-- membership row yet." This adds the one read the surface was missing:
--
--   list_dm_invited() — the OPEN invites (accepted_at IS NULL, unexpired) of
--   every instance the caller leads (owner/admin). The surface renders them
--   as pending chips ("invited — waiting for their first sign-in") beside the
--   startable contacts, so the owner sees exactly where each person stands.
--
-- Adds NO reach: invites are the caller's own instances' rows (the same data
-- the Admin invite lane already shows a leader); members-only visibility and
-- users_can_dm (0096) are untouched; DR-0187's two-party confirm stands —
-- this reads intent, it grants nothing. IDEMPOTENT.
-- Word-first: "let your communication be, Yea, yea; Nay, nay" (Matthew 5:37)
-- — the surface says plainly what is and is not yet true.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.list_dm_invited()
RETURNS TABLE (invite_id uuid, email text, instance_id uuid, invite_role text, expires_at timestamptz)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT inv.id, inv.email, inv.instance_id, inv.role, inv.expires_at
  FROM instance_invites inv
  WHERE inv.accepted_at IS NULL
    AND (inv.expires_at IS NULL OR inv.expires_at > now())
    AND EXISTS (
      SELECT 1 FROM instance_members im
      WHERE im.instance_id = inv.instance_id
        AND im.user_id = auth.uid()
        AND im.role IN ('owner','admin')
    );
$$;

REVOKE ALL ON FUNCTION public.list_dm_invited() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.list_dm_invited() TO authenticated;
