-- =============================================================================
-- 0192 -- TLC HIRING: the audit actions within the allow-list (the smoke
--         caught it) (DR-0350 amended)
-- =============================================================================
-- THE INCIDENT (rls-isolation run 130 on main, 2026-09-10, the tlc-office
-- leg, 0191-tlc-hiring-smoke.sql): the first anonymous application through
-- tlc_apply() RAISED
--
--   new row for relation "audit_log" violates check constraint
--   "audit_log_action_check"
--
-- audit_log.action carries an allow-list (schema v2.10: create, update,
-- delete, status-change, export, login, logout, permission-grant,
-- permission-revoke, invite, accept-invite, pin-change, export-privileged,
-- export-stripped, failed-auth, system, and the ai-* family). 0191 wrote
-- 'apply' and 'hire' -- two words the list does not hold -- so in production
-- EVERY application would have failed at the audit row, and every hire with
-- it. The mocked render tests could not see this; the real-policy smoke
-- Darrell asked for ("not fake test", DR-0347) saw it on the first run.
--
-- THE FIX: the same two functions, redefined with allow-listed actions --
-- an application is a 'create' of a tlc_job_application; a hire is a
-- 'status-change' on it. Nothing else changes. 0191 stays as applied
-- (append-only; a new directive is a new file); this file follows it in the
-- tlc-office leg so the replayed state is the corrected one.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.tlc_apply(office_in text, job_id_in uuid, applicant_in jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_job    public.tlc_jobs%ROWTYPE;
  v_email  text := lower(trim(coalesce(applicant_in->>'email', '')));
  v_name   text := trim(coalesce(applicant_in->>'name', ''));
  v_stmt   text := trim(coalesce(applicant_in->>'statement', ''));
  v_years  integer;
  v_row    public.tlc_job_applications%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM public.tlc_jobs WHERE id = job_id_in AND office_id = coalesce(office_in, 'tlc');
  IF v_job.id IS NULL OR v_job.status <> 'open' THEN
    RAISE EXCEPTION 'that position is not open';
  END IF;
  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN RAISE EXCEPTION 'please give your full name'; END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(v_email) > 200 THEN RAISE EXCEPTION 'that is not a valid email address'; END IF;
  IF char_length(v_stmt) < 20 OR char_length(v_stmt) > 3000 THEN RAISE EXCEPTION 'please write a few sentences about yourself (20 to 3000 characters)'; END IF;
  BEGIN
    v_years := nullif(trim(coalesce(applicant_in->>'years_experience', '')), '')::integer;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'years of experience must be a whole number';
  END;
  IF v_years IS NOT NULL AND (v_years < 0 OR v_years > 60) THEN RAISE EXCEPTION 'years of experience must be between 0 and 60'; END IF;

  IF EXISTS (SELECT 1 FROM public.tlc_job_applications a
              WHERE a.job_id = v_job.id AND a.email = v_email AND a.status <> 'declined') THEN
    RAISE EXCEPTION 'you have already applied for this position; the office has it';
  END IF;
  IF (SELECT count(*) FROM public.tlc_job_applications a
       WHERE a.instance_id = v_job.instance_id AND a.email = v_email AND a.created_at > now() - interval '1 day') >= 5 THEN
    RAISE EXCEPTION 'too many applications from this email today; try again tomorrow';
  END IF;

  INSERT INTO public.tlc_job_applications
    (instance_id, office_id, job_id, name, email, phone, license_type, license_state, years_experience, statement, availability, link)
  VALUES
    (v_job.instance_id, v_job.office_id, v_job.id, v_name, v_email,
     nullif(left(trim(coalesce(applicant_in->>'phone', '')), 40), ''),
     nullif(left(trim(coalesce(applicant_in->>'license_type', '')), 80), ''),
     nullif(left(trim(coalesce(applicant_in->>'license_state', '')), 40), ''),
     v_years, v_stmt,
     nullif(left(trim(coalesce(applicant_in->>'availability', '')), 500), ''),
     nullif(left(trim(coalesce(applicant_in->>'link', '')), 300), ''))
  RETURNING * INTO v_row;

  -- 'create' is on the audit_log allow-list; 'apply' (0191) was not.
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_job.instance_id, auth.uid(), 'create', 'tlc_job_application', v_row.id,
          NULL, jsonb_build_object('job_id', v_job.id, 'email', v_email), 'tlc_apply');

  RETURN jsonb_build_object('id', v_row.id, 'job_title', v_job.title, 'received_at', v_row.created_at);
END;
$$;
GRANT EXECUTE ON FUNCTION public.tlc_apply(text, uuid, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.tlc_application_hire(application_id_in uuid, note_in text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
  v_app    public.tlc_job_applications%ROWTYPE;
  v_invite jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can hire';
  END IF;
  SELECT * INTO v_app FROM public.tlc_job_applications WHERE id = application_id_in AND instance_id = v_office.instance_id;
  IF v_app.id IS NULL THEN RAISE EXCEPTION 'no such application in your office'; END IF;
  IF v_app.status = 'hired' AND v_app.invite_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_app.id, 'already', true, 'invite_id', v_app.invite_id);
  END IF;

  v_invite := public.tlc_onboarding_invite(v_app.email, coalesce(nullif(trim(coalesce(note_in, '')), ''), 'Hired from the app: ' || v_app.name));

  UPDATE public.tlc_job_applications
     SET status = 'hired', invite_id = (v_invite->>'id')::uuid, hired_at = now(), hired_by = auth.uid()
   WHERE id = v_app.id;

  -- 'status-change' is on the audit_log allow-list; 'hire' (0191) was not.
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_office.instance_id, auth.uid(), 'status-change', 'tlc_job_application', v_app.id,
          jsonb_build_object('status', v_app.status), jsonb_build_object('status', 'hired', 'invite_id', v_invite->>'id'), 'tlc_application_hire');

  RETURN jsonb_build_object('id', v_app.id, 'already', false, 'invite_id', v_invite->>'id',
                            'token', v_invite->>'token', 'email', v_invite->>'email', 'expires_at', v_invite->>'expires_at');
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_application_hire(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_application_hire(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
