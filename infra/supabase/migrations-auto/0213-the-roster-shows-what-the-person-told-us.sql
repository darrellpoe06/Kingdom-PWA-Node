-- =============================================================================
-- 0213 — THE ROSTER SHOWS WHAT THE PERSON THEMSELVES TOLD US
-- =============================================================================
-- Darrell 2026-09-11, with the Admin roster open:
--   "also see the email and try to get email and cellphone together if they
--    have them... however just not allowing it to be a constraint."
--
-- 0210 answered the account half of that: a phone from auth.users, its
-- metadata, or the digits inside a phone-door sign-in address. It never looked
-- at the one place a person actually WRITES their number down — their own
-- record. DR-0366 decision 3 already says the person's own answer outranks
-- anything derived, and lib/member-contact.js already reads `declaredEmail` /
-- `declaredPhone` and labels them "they told us". The server simply never sent
-- them. This closes that.
--
-- MEASURED BEFORE WRITING (live, 2026-09-12 — DR-0076 rule 4), because the
-- dated item this closes rested on a premise that turned out to be wrong:
--
--   DR-0366 said the contactPhone cell "exists for church members and for
--   nobody else yet," and dated 2026-10-11 to ask whether the household and
--   TLC intakes should carry the same cell. They ALREADY DO:
--     household-intake.js:75   contactPhone, type tel, NOT required
--     tlc-office-forms.js:54   phone, in FLOOR_REQUIRED
--   So that question is answered and is not the gap. The gap is this function.
--
--   And the rows, counted rather than assumed:
--     church_member_records      0 rows
--     household_records          0 rows
--     tlc_onboarding_packets     0 rows
--   Nobody has filled a record yet anywhere. So this ships a door that is
--   correct and, today, returns NULL for all 23 accounts. That is the honest
--   state and it is stated rather than dressed up: the reason 21 of 23 accounts
--   show no phone is NOT a missing form cell, it is that no record has been
--   filled. Chasing that is exactly what Darrell forbade.
--
-- WHERE A DECLARED CONTACT MAY HONESTLY COME FROM — the whole design is which
-- tables are PER-PERSON, because a roster row is a claim about ONE PERSON:
--
--   church_member_records   (instance_id, user_id, record)   PER PERSON   READ
--   tlc_onboarding_packets  (instance_id, applicant_user_id, packet)
--                                                            PER PERSON   READ
--   household_records       (instance_id, record, started_by)
--                                                      PER INSTANCE   NOT READ
--   office_records          (instance_id, created_by, payload)
--                                                      not a contact   NOT READ
--
-- The household record is ONE ROW FOR THE WHOLE HOUSEHOLD — it has no user_id,
-- only `started_by`. Its "Best phone" is the HOUSEHOLD's number. Attaching it
-- to every member's row would print a number beside a person as though they had
-- given it, which is the exact false statement DR-0076 rule 8 and 0210's own
-- phone-door handling exist to refuse. It is deliberately not read, and the
-- smoke PROVES it does not leak.
--
-- AUDIENCE IS UNCHANGED. Still owner/admin of that instance, still enforced
-- inside the function body. Two cells come back — the contact ones, which the
-- person wrote under a label that says how to reach them — and nothing else
-- from a record that holds 27 other answers. The rest of their record stays
-- exactly where it was, readable only by them and by the doors 0209 defined.
--
-- STILL NOT A CONSTRAINT. Two more nullable columns on a read. Nothing becomes
-- required, no row is hidden, no caller breaks: lib/member-roles.js maps by
-- name, so a deployment that has not replayed this simply gets undefined and
-- the surface says what it knows.
-- =============================================================================

DROP FUNCTION IF EXISTS public.list_instance_members(uuid);
CREATE FUNCTION public.list_instance_members(instance_uuid uuid)
RETURNS TABLE (
  user_id uuid, display_name text, email text, role text,
  classification text, relationship text,
  joined_at timestamptz, last_sign_in_at timestamptz, created_at timestamptz,
  phone text, email_is_phone_door boolean,
  declared_email text, declared_phone text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT im.user_id,
         im.display_name,
         -- A phone-door address is a sign-in identity, not a mailbox. Returned
         -- as NULL so a caller cannot accidentally state "you can email this".
         CASE WHEN u.email::text LIKE '%@phone.poetech.us' THEN NULL
              ELSE u.email::text END,
         im.role,
         im.classification,
         im.relationship,
         im.joined_at,
         u.last_sign_in_at,
         u.created_at,
         -- The account's own phone, then the sign-up metadata, then the digits
         -- carried by the phone-door address. NULL when there is none, which is
         -- a fine thing for a row to say.
         coalesce(
           nullif(btrim(coalesce(u.phone, '')), ''),
           nullif(btrim(coalesce(u.raw_user_meta_data->>'phone', '')), ''),
           CASE WHEN u.email::text LIKE '%@phone.poetech.us'
                THEN regexp_replace(split_part(u.email::text, '@', 1), '\D', '', 'g')
                ELSE NULL END
         ),
         (u.email::text LIKE '%@phone.poetech.us'),
         -- WHAT THEY THEMSELVES WROTE. Only from a record that belongs to THIS
         -- person in THIS instance, and only the two contact cells.
         coalesce(own.declared_email, tlc.declared_email),
         coalesce(own.declared_phone, tlc.declared_phone)
    FROM instance_members im
    LEFT JOIN auth.users u ON u.id = im.user_id
    LEFT JOIN LATERAL (
      SELECT nullif(btrim(coalesce(r.record->>'contactEmail', '')), '') AS declared_email,
             nullif(btrim(coalesce(r.record->>'contactPhone', '')), '') AS declared_phone
        FROM public.church_member_records r
       WHERE r.instance_id = im.instance_id AND r.user_id = im.user_id
       LIMIT 1
    ) own ON TRUE
    LEFT JOIN LATERAL (
      -- A colleague's onboarding packet is their own answers (phone is in the
      -- office's FLOOR_REQUIRED). Newest first so a resubmitted packet wins
      -- deterministically rather than by table order.
      SELECT nullif(btrim(coalesce(p.packet->>'preferredEmail', '')), '') AS declared_email,
             nullif(btrim(coalesce(p.packet->>'phone', '')), '')          AS declared_phone
        FROM public.tlc_onboarding_packets p
       WHERE p.instance_id = im.instance_id AND p.applicant_user_id = im.user_id
       ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST
       LIMIT 1
    ) tlc ON TRUE
   WHERE im.instance_id = instance_uuid
     AND user_role_in_instance(instance_uuid) IN ('owner','admin')
   ORDER BY
     CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
     im.display_name;
$$;
REVOKE ALL ON FUNCTION public.list_instance_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_instance_members(uuid) TO authenticated;

COMMENT ON FUNCTION public.list_instance_members(uuid) IS
  'The roster an owner/admin of this instance may read: who, when they joined, when they were last here, and how to reach them — including the contact the person wrote in their OWN record for this instance (0213). A missing email or phone is never a constraint.';

NOTIFY pgrst, 'reload schema';
