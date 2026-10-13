-- =============================================================================
-- 0212 — A CONGREGANT COULD NOT OPEN THEIR OWN RECORD
-- =============================================================================
-- THE DEFECT, live on production from the moment 0209 applied. Every function
-- 0209 and 0210 wrote resolved "which church?" like this:
--
--   coalesce(instance_in, my_default_instance_role()->>'instance_id')
--
-- and my_default_instance_role() (0130) reads, verbatim:
--
--   WHERE im.user_id = auth.uid() AND i.instance_type <> 'church'
--
-- It EXCLUDES churches, on purpose — it is the SHELL's resolver, for a person's
-- default non-church space. So for anybody who belongs only to a church, it
-- returns NULL and the record functions raise "no church to read" / "no church
-- to fill" / "no church to sign for".
--
-- Which is every real member of the Church of the Living God who is not also in
-- the Poe family — the entire intended audience of the feature.
--
-- AND IT IS WORSE THAN A LOCKOUT, measured on the live database 2026-09-12.
-- For the two people who ARE in a family instance, the old resolver did not
-- fail — it answered `poe-family`. So a church member record filled in by
-- either of them would have been written into the FAMILY instance, and
-- church_roll_read would have read the family's roll instead of the church's.
-- That is a tenancy defect (DR-0060), not merely an availability one:
--
--     email                    old resolver     new resolver
--     mrspoe06@gmail.com       poe-family       colg
--     darrellpoe06@gmail.com   poe-family       colg
--
-- NO DATA WAS MISFILED. church_member_records holds ZERO rows — measured, not
-- assumed — because the surface shipped the same night this was found. The
-- defect is corrected before the first real record exists, which is the only
-- reason this migration is a fix and not also a data repair.
--
-- HOW IT WAS FOUND, and why it took a day: 0209's smoke asserts exactly this
-- path, and the smoke had never run. It opened with two top-level PERFORM
-- statements (plpgsql-only — a syntax error at the psql top level), so psql
-- died at line 52 on every run and the fourteen assertions below it were never
-- reached. Fixed in 6d3da2b with a guard in the required lane; the very next
-- dispatch got to line 73 and found THIS. That is the whole argument for
-- LESSONS P53 in one sequence: the gate was not weak, it was absent, and what
-- it was hiding was not hypothetical.
--
-- THE FIX. One resolver, named for what it resolves, and the four functions
-- re-declared to use it. Every other line of every function below is 0209's and
-- 0210's own, extracted from those files and re-emitted unchanged — the
-- resolver line is the only edit, and it is the only edit on purpose.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE RESOLVER THE CHURCH FUNCTIONS SHOULD ALWAYS HAVE HAD
-- ---------------------------------------------------------------------------
-- The caller's own church. Deterministic when somebody belongs to two: the one
-- they joined first, so a person's record does not move between churches
-- because a query planner changed its mind.
--
-- This is the same resolution 0211's my_church_access() already does; it is
-- lifted out so there is ONE place that answers "which church is this person
-- in?" and four functions cannot drift from each other again.
CREATE OR REPLACE FUNCTION public.my_church_instance_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT i.id
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid() AND i.instance_type = 'church'
   ORDER BY im.joined_at NULLS LAST, i.slug
   LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.my_church_instance_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_church_instance_id() TO authenticated;

COMMENT ON FUNCTION public.my_church_instance_id() IS
  'The caller''s own church instance. my_default_instance_role() deliberately EXCLUDES churches (0130), which is why the church functions may never use it (0212).';

-- ---------------------------------------------------------------------------
-- 2. THE FOUR FUNCTIONS, 0209's and 0210's bodies with ONE line changed
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.church_member_record_read(instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_row      public.church_member_records%ROWTYPE;
  v_name     text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  v_instance := coalesce(instance_in, public.my_church_instance_id());
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to read'; END IF;
  IF NOT public.user_in_instance(v_instance) THEN RAISE EXCEPTION 'that is not your church'; END IF;

  SELECT * INTO v_row FROM public.church_member_records
   WHERE instance_id = v_instance AND user_id = auth.uid();
  IF v_row.id IS NULL THEN
    INSERT INTO public.church_member_records (instance_id, user_id, record)
    VALUES (v_instance, auth.uid(), '{}'::jsonb)
    ON CONFLICT (instance_id, user_id) DO UPDATE
       SET updated_at = public.church_member_records.updated_at
    RETURNING * INTO v_row;
  END IF;

  SELECT display_name INTO v_name FROM instances WHERE id = v_instance;
  RETURN jsonb_build_object(
    'record_id', v_row.id, 'instance_id', v_row.instance_id, 'church_name', v_name,
    'record', v_row.record, 'updated_at', v_row.updated_at, 'created_at', v_row.created_at,
    'my_role', coalesce(public.user_role_in_instance(v_instance), ''));
END;
$$;
REVOKE ALL ON FUNCTION public.church_member_record_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_member_record_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.church_member_record_patch(
  patch_in    jsonb,
  note_in     text DEFAULT NULL,
  instance_in uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_row      public.church_member_records%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  PERFORM public.church_member_patch_guard(patch_in);
  v_instance := coalesce(instance_in, public.my_church_instance_id());
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to fill'; END IF;
  IF NOT public.user_in_instance(v_instance) THEN RAISE EXCEPTION 'that is not your church'; END IF;

  INSERT INTO public.church_member_records (instance_id, user_id, record)
  VALUES (v_instance, auth.uid(), patch_in)
  ON CONFLICT (instance_id, user_id) DO UPDATE
     SET record = coalesce(public.church_member_records.record, '{}'::jsonb) || patch_in,
         updated_at = now()
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'update', 'church_member_record', v_row.id,
          jsonb_build_object('own_record', true),
          jsonb_build_object('cells', (SELECT jsonb_agg(k) FROM jsonb_object_keys(patch_in) k)),
          coalesce(nullif(left(btrim(coalesce(note_in, '')), 500), ''), 'church_member_record_patch'));

  RETURN jsonb_build_object('record_id', v_row.id, 'instance_id', v_row.instance_id,
                            'record', v_row.record, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.church_member_record_patch(jsonb, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_member_record_patch(jsonb, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.church_roll_read(instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_rows     jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  v_instance := coalesce(instance_in, public.my_church_instance_id());
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no church to read'; END IF;
  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the church office may read the roll';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'user_id',   r.user_id,
           'updated_at', r.updated_at,
           -- The roll cells, named one by one on purpose.
           'fullName',          r.record->>'fullName',
           'preferredName',     r.record->>'preferredName',
           'contactEmail',      r.record->>'contactEmail',
           'contactPhone',      r.record->>'contactPhone',
           'contactPreference', r.record->>'contactPreference',
           'homeArea',          r.record->>'homeArea',
           'standing',          r.record->>'standing',
           'sinceWhen',         r.record->>'sinceWhen',
           'howYouFoundUs',     r.record->>'howYouFoundUs',
           'newMemberWelcome',  r.record->'newMemberWelcome',
           'servingInterest',   coalesce(r.record->'servingInterest', '[]'::jsonb),
           'servingNote',       r.record->>'servingNote',
           'canDrive',          r.record->'canDrive',
           'needsRide',         r.record->'needsRide',
           'rideServices',      coalesce(r.record->'rideServices', '[]'::jsonb),
           'accessibleNeeded',  r.record->'accessibleNeeded',
           'accessNeeds',       r.record->>'accessNeeds',
           -- The prayer request appears ONLY if the person pointed it at the
           -- office or wider. Left out entirely otherwise — not blanked, absent.
           'prayerRequest', CASE
             WHEN r.record->>'prayerShareable' IN ('The prayer team','The whole church')
               THEN r.record->>'prayerRequest' ELSE NULL END,
           'prayerShareable', r.record->>'prayerShareable'
         ) ORDER BY r.record->>'fullName'), '[]'::jsonb)
    INTO v_rows
    FROM public.church_member_records r
   WHERE r.instance_id = v_instance;

  RETURN jsonb_build_object('instance_id', v_instance, 'rows', v_rows,
                            'count', jsonb_array_length(v_rows));
END;
$$;
REVOKE ALL ON FUNCTION public.church_roll_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.church_roll_read(uuid) TO authenticated;

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

  v_instance := coalesce(instance_in, public.my_church_instance_id());
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
-- 3. THE OVERLAYS — re-run, because functions were redefined
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
