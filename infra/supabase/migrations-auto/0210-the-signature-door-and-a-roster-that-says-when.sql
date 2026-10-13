-- =============================================================================
-- 0210 — THE SIGNATURE DOOR 0209 SHIPPED WITHOUT, AND A ROSTER THAT SAYS WHEN
-- =============================================================================
-- TWO THINGS, ONE MIGRATION.
--
-- 1. THE COVENANT WAS UNSIGNABLE. 0209 requires the church covenant in the
--    member intake and its patch guard REFUSES an 'acknowledgments' key on
--    purpose — a signature is made on a document, never typed into a cell. It
--    shipped with no acknowledge door, so there was no way to make the required
--    signature at all. Measured on the live database before writing this:
--    church_member_records exists, church_member_record_read exists,
--    church_member_record_acknowledge is NULL. 0209 has already replayed, so
--    editing it would never reach production; the function belongs here.
--
-- 2. THE ROSTER KNOWS WHO BUT NOT WHEN. Darrell 2026-09-11, with the Admin
--    screen open: "PoeTech App should be able to see who is and when also the
--    ability to change user levels... also see the email and try to get email
--    and cellphone together if they have them... however just not allowing it
--    to be a constraint." list_instance_members answers WHO (name, email, role,
--    classification, relationship) and nothing about WHEN or about a phone.
--    instance_members.joined_at is populated on every row in the live database
--    and was simply never returned.
--
-- WHERE A PHONE ACTUALLY IS, measured 2026-09-11 across all 23 accounts:
--     auth.users.phone                    0 populated
--     raw_user_meta_data->>'phone'        3 (the phone-door accounts)
--     <digits>@phone.poetech.us email     3 (the same three)
-- So the phone door is the only real source today, and it is an EMAIL column
-- holding a PHONE. This returns the digits as a phone and leaves the email
-- column honestly empty for those accounts rather than printing a synthetic
-- address as if a person could be written to there (DR-0076 rule 8).
--
-- NOT A CONSTRAINT, as instructed: nothing here becomes required, nothing is
-- refused for a missing contact, and no row is hidden for lacking either one.
-- These are extra columns on a read. Every existing caller keeps working —
-- lib/member-roles.js maps by name and ignores what it does not ask for.
--
-- ACCESS IS UNCHANGED: still owner/admin of that instance, still enforced
-- inside the function body, exactly as 0111/0143/0144 wrote it. A member's own
-- email was already returned to their owner/admin; a phone is the same class of
-- fact about the same person and adds no new audience.
-- =============================================================================


-- Sign the church covenant, in place, with the server's own clock (0199's rule).
-- The patch guard above REFUSES an 'acknowledgments' key on purpose: a
-- signature is made on the document, never typed into a cell. So this is the
-- only door, and without it the covenant this intake requires would be
-- unsignable. Unlike the household's version there is NO seat test — the
-- record belongs to the person, and a person signs for themselves.
CREATE OR REPLACE FUNCTION public.church_member_record_acknowledge(
  key_in         text,
  signature_in   text,
  doc_version_in text DEFAULT NULL,
  attestation_in text DEFAULT NULL,
  agreed_at_in   text DEFAULT NULL,
  instance_in    uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_row      public.church_member_records%ROWTYPE;
  v_stamp    text := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_prev     jsonb;
  v_rec      jsonb;
  v_sig      text := left(btrim(coalesce(signature_in, '')), 200);
  v_att      text := left(btrim(coalesce(attestation_in, '')), 500);
  v_ver      text := left(btrim(coalesce(doc_version_in, '')), 40);
  v_when     text := left(btrim(coalesce(agreed_at_in, '')), 40);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF key_in IS NULL OR key_in <> 'churchCovenant' THEN RAISE EXCEPTION 'no such document to acknowledge'; END IF;
  IF v_sig = '' THEN RAISE EXCEPTION 'sign by typing your full legal name'; END IF;
  IF v_att = '' THEN RAISE EXCEPTION 'the acknowledgment sentence must be checked'; END IF;

  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to sign for'; END IF;
  IF NOT public.user_in_instance(v_instance) THEN RAISE EXCEPTION 'that is not your church'; END IF;

  SELECT * INTO v_row FROM public.church_member_records
   WHERE instance_id = v_instance AND user_id = auth.uid();
  IF v_row.id IS NULL THEN
    INSERT INTO public.church_member_records (instance_id, user_id, record)
    VALUES (v_instance, auth.uid(), '{}'::jsonb) RETURNING * INTO v_row;
  END IF;

  v_prev := coalesce(v_row.record->'acknowledgments'->key_in, '{}'::jsonb);
  v_rec := jsonb_build_object(
    'agreed', true,
    'signature', v_sig,
    'signedOn', left(v_stamp, 10),
    'signedAt', CASE WHEN v_when <> '' THEN v_when ELSE v_stamp END,
    'docVersion', v_ver,
    'attestation', v_att,
    'agreedAt', CASE WHEN v_when <> '' THEN v_when ELSE v_stamp END,
    -- Re-reading a document you already signed, unchanged, does not re-date the
    -- signature. A NEW version does (0199 keep-or-renew).
    'signedAtServer', CASE
      WHEN coalesce(v_prev->>'signedAtServer', '') <> ''
       AND (v_prev->>'signature') IS NOT DISTINCT FROM v_sig
       AND (v_prev->>'docVersion') IS NOT DISTINCT FROM v_ver
      THEN v_prev->>'signedAtServer'
      ELSE v_stamp END);

  UPDATE public.church_member_records
     SET record = jsonb_set(
           jsonb_set(coalesce(record, '{}'::jsonb), ARRAY['acknowledgments'], coalesce(record->'acknowledgments', '{}'::jsonb), true),
           ARRAY['acknowledgments', key_in], v_rec, true),
         updated_at = now()
   WHERE id = v_row.id
   RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'update', 'church_member_record', v_row.id,
          jsonb_build_object('acknowledged', key_in, 'previousVersion', v_prev->>'docVersion'),
          jsonb_build_object('docVersion', v_ver, 'signedAtServer', v_rec->>'signedAtServer'),
          'church_member_record_acknowledge');

  RETURN jsonb_build_object('record_id', v_row.id, 'instance_id', v_row.instance_id,
                            'record', v_row.record, 'acknowledged', key_in, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.church_member_record_acknowledge(text, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_member_record_acknowledge(text, text, text, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. THE ROSTER ANSWERS "WHO, AND WHEN"
-- ---------------------------------------------------------------------------
-- Added over 0144's shape: joined_at (when they came into THIS space),
-- last_sign_in_at (when they were last here), created_at (when the account was
-- made), phone (from wherever one honestly exists) and email_is_phone_door (so
-- a caller never prints a sign-in address as a mailbox).
DROP FUNCTION IF EXISTS public.list_instance_members(uuid);
CREATE FUNCTION public.list_instance_members(instance_uuid uuid)
RETURNS TABLE (
  user_id uuid, display_name text, email text, role text,
  classification text, relationship text,
  joined_at timestamptz, last_sign_in_at timestamptz, created_at timestamptz,
  phone text, email_is_phone_door boolean
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
         (u.email::text LIKE '%@phone.poetech.us')
    FROM instance_members im
    LEFT JOIN auth.users u ON u.id = im.user_id
   WHERE im.instance_id = instance_uuid
     AND user_role_in_instance(instance_uuid) IN ('owner','admin')
   ORDER BY
     CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
     im.display_name;
$$;
REVOKE ALL ON FUNCTION public.list_instance_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_instance_members(uuid) TO authenticated;

COMMENT ON FUNCTION public.list_instance_members(uuid) IS
  'The roster an owner/admin of this instance may read: who, when they joined, when they were last here, and how to reach them. A missing email or phone is never a constraint (0210).';

NOTIFY pgrst, 'reload schema';
