-- =============================================================================
-- 0294 — the church knows one person at either door (DR-0311 carried to the
--        church join; DR-1043)
-- =============================================================================
-- Darrell 2026-10-15, on the Fold, after DR-1032 made the refusal name what it
-- read: Church → Order of Service said
--   "Signed in as 15636502416@phone.poetech.us.
--    No church space answered for this account."
-- The owner of the church space was refused his own order of service.
--
-- TRACED. join_church_instance (0014) decides by ONE address, the caller's own
-- auth.users email. The leader allowlist names darrellpoe06@gmail.com; the
-- pending-invite match reads the same single address. His phone+PIN door is a
-- second auth.users row (DR-0311: GoTrue cannot hold a PIN and a password on
-- one row) whose address is the synthetic 15636502416@phone.poetech.us. So the
-- door matched nothing, got no seat, and every church read after it
-- (user_role_in_instance, user_in_choir, user_is_worship_finalizer, the
-- service_program RLS) answered "outsider" to the owner.
--
-- 0141 already taught the database "these two rows are one person"
-- (person_links). 0151 taught property invites to match EVERY address that
-- identifies the caller. 0182 taught my_business_role to read the seat through
-- the link. The church join never learned it. It does now, three ways, in
-- this order, the first that answers wins:
--
--   1. Your own church seat (unchanged): returned as before.
--   2. A LINKED identity's church seat: the door is seated on the same church
--      with the same role. The role is a fact about the person, not about the
--      handle they turned (0182's rule); owner > admin > the rest.
--   3. The leader allowlist and pending invites, matched against EVERY address
--      that identifies the caller (own + linked), highest allowlist role wins.
--
-- WHY THE DOOR GETS ITS OWN SEAT rather than every read learning same_person:
-- DR-0311 §5 keeps door-class rows ON the door (instance_members included) and
-- the family space already gives the phone door its own seat (0140). Seating
-- the door once makes every existing church read and every RLS policy answer
-- correctly with no further change, the narrowest cure.
--
-- WHY THIS GRANTS NOTHING NEW: person_links has no app write policy (0141);
-- links are written by migration as postgres only, between two accounts of
-- the SAME person by construction. Matching through a link adds no grantee;
-- it stops one person being locked out by which door they used (0151's
-- argument, word for word).
--
-- SAME CONTRACT as 0014: SECURITY DEFINER, search_path pinned, NULL for a
-- signed-out caller or a person with no church standing, the advisory lock,
-- and an idempotent seat insert. CREATE OR REPLACE with the same signature
-- and return type. Nothing is deleted.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.join_church_instance(display_name_in text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_emails       text[];
  v_instance_id  uuid;
  v_role         text;
  v_linked_name  text;
  v_display_name text;
  v_existing     uuid;
  v_invite_id    uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));

  -- 1. Your own church seat, as before.
  SELECT im.instance_id INTO v_existing
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = v_user_id AND i.instance_type = 'church'
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- 2. A linked identity's church seat: same church, same role.
  SELECT im.instance_id, im.role, im.display_name
    INTO v_instance_id, v_role, v_linked_name
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
    JOIN person_links pl
      ON (pl.primary_user = v_user_id AND pl.door_user    = im.user_id)
      OR (pl.door_user    = v_user_id AND pl.primary_user = im.user_id)
   WHERE i.instance_type = 'church'
   ORDER BY CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
            im.joined_at
   LIMIT 1;

  -- Every address that identifies the caller: their own and every linked one.
  SELECT coalesce(array_agg(DISTINCT x.e), ARRAY[]::text[]) INTO v_emails
    FROM (
      SELECT lower(u.email) AS e
        FROM auth.users u
       WHERE u.id = v_user_id AND u.email IS NOT NULL
      UNION
      SELECT lower(u.email)
        FROM person_links pl
        JOIN auth.users u
          ON u.id = CASE WHEN pl.primary_user = v_user_id THEN pl.door_user ELSE pl.primary_user END
       WHERE (pl.primary_user = v_user_id OR pl.door_user = v_user_id)
         AND u.email IS NOT NULL
    ) x;

  -- 3a. The leader allowlist (unchanged names), matched on every address.
  IF v_instance_id IS NULL THEN
    SELECT a.role INTO v_role
      FROM (VALUES
              ('darrellpoe06@gmail.com',             'owner', 0),
              ('mrspoe06@gmail.com',                 'admin', 1),
              ('christina@tlctherapysolutions.com',  'admin', 1),
              ('bg@thechurchofthelivinggod.com',     'admin', 1)
           ) AS a(email, role, rank)
     WHERE a.email = ANY (v_emails)
     ORDER BY a.rank
     LIMIT 1;
    IF v_role IS NOT NULL THEN
      SELECT id INTO v_instance_id FROM instances WHERE slug = 'colg';
    END IF;
  END IF;

  -- 3b. A pending, unexpired church invite to any of those addresses.
  IF v_instance_id IS NULL THEN
    SELECT inv.id, inv.instance_id, inv.role
      INTO v_invite_id, v_instance_id, v_role
      FROM instance_invites inv
      JOIN instances i ON i.id = inv.instance_id
     WHERE i.instance_type = 'church'
       AND lower(inv.email) = ANY (v_emails)
       AND inv.accepted_at IS NULL
       AND inv.expires_at > now()
     ORDER BY inv.expires_at DESC
     LIMIT 1;
    IF v_invite_id IS NOT NULL THEN
      UPDATE instance_invites SET accepted_at = now() WHERE id = v_invite_id;
    END IF;
  END IF;

  IF v_role IS NULL OR v_instance_id IS NULL THEN
    RETURN NULL;  -- no church standing at either door; the gate names it (DR-1032)
  END IF;

  -- A door is named as the person: what the app passed, else the name the
  -- linked seat already carries, else the local part of a real (non-phone)
  -- address, never the digits of a synthetic login.
  v_display_name := COALESCE(
    NULLIF(trim(display_name_in), ''),
    NULLIF(trim(v_linked_name), ''),
    (SELECT NULLIF(split_part(e, '@', 1), '')
       FROM unnest(v_emails) AS e
      WHERE e NOT LIKE '%@phone.poetech.us'
      ORDER BY e
      LIMIT 1),
    'Member'
  );
  INSERT INTO instance_members (instance_id, user_id, role, display_name)
    VALUES (v_instance_id, v_user_id, v_role, v_display_name)
    ON CONFLICT (instance_id, user_id) DO NOTHING;
  RETURN v_instance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_church_instance(text) TO authenticated;

-- Verify after apply (as the phone door, jwt sub = the linked door uuid):
--   SELECT join_church_instance('Darrell');           -> colg's id (was NULL)
--   SELECT user_role_in_instance(<colg id>);          -> 'owner'
-- And as an unlinked authenticated uuid with no invite: -> NULL (unchanged)
