-- =============================================================================
-- 0191 -- TLC HIRING: jobs posted on the door, applicants hired into onboarding
--         (DR-0350)
-- =============================================================================
-- Darrell, 2026-09-10: "need to have the ability to hire people for jobs we
-- post so we can hire through the app and onboarding goes to the telehealth
-- app we use." Then: "The website is already linked however opportunities and
-- constraints."
--
-- WHAT EXISTED. 0187 built the second half of hiring: a one-time invite minted
-- by the office owner/admin, the intake packet bound to the colleague's own
-- login, approval writing the roster and the public card. Nothing came BEFORE
-- the invite: no posting, no application, no place a stranger could raise a
-- hand. The office hired by email and Christina typed the invite by hand.
--
-- THE DESIGN.
--
-- 1. A JOB IS AN OFFICE ROW. tlc_jobs is instance-scoped like every workspace
--    table; office members read it, the owner/admin write it (post, edit,
--    close). An OPEN job is public through tlc_public_jobs() -- the same anon
--    SECURITY DEFINER shape as tlc_public_roster() -- so the door and the
--    website (which links the door) show one list from one source.
--
-- 2. AN APPLICATION IS WRITTEN ONLY THROUGH tlc_apply(). The table has RLS on
--    and NO insert policy: a stranger never touches the table; the function
--    validates every field against the same bounds the device checks
--    (lib/tlc-hiring.js), refuses a closed job, refuses a second open
--    application to the same job from the same email, and caps one email at
--    five applications per office per day. Nothing in an application is
--    client health information: a name, how to reach them, a license type and
--    state, years, a statement, availability, an optional link. Uploads wait
--    for the packet (0187), where they are pointers in a private bucket.
--
-- 3. HIRE IS ONE ATOMIC STEP. tlc_application_hire() marks the application
--    hired AND mints the 0187 invite for that email in the same transaction,
--    linking the invite id back, so the pipeline the office sees (applied ->
--    invited -> packet -> approved -> on the telehealth platform) is one row
--    joined to the packet it produced. Approving the packet stays 0187's job.
--
-- 4. THE TELEHEALTH HAND-OFF IS RECORDED, NOT PRETENDED. The office's
--    scheduling / telehealth platform (the handbook names SimplePractice) has
--    no public API for adding a team member; the app does not fake one. The
--    owner/admin marks the hand-off on the row (invited -> active, dated, by
--    whom) after doing it in that platform, and the app carries the ready
--    message and the checklist. Honest state, one place.
--
-- 5. WHO MAY SEE WHAT. Applications carry a stranger's contact details, so
--    they are read and updated by the office OWNER/ADMIN only (0130's gate,
--    NULL-safe); a member, an assistant (0130 overlay, re-run) and a viewer
--    (0125 overlay, re-run) never see them. Jobs are read by every office
--    member (the team sees what is posted) and written by the owner/admin.
--    Idempotent; nothing widened.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tlc_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  office_id        text NOT NULL DEFAULT 'tlc' CHECK (char_length(office_id) BETWEEN 1 AND 40),
  title            text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  summary          text NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 2000),
  requirements     jsonb NOT NULL DEFAULT '[]'::jsonb
                     CHECK (jsonb_typeof(requirements) = 'array' AND jsonb_array_length(requirements) <= 20),
  employment_type  text NOT NULL DEFAULT 'contractor' CHECK (employment_type IN ('contractor','employee')),
  modality         text NOT NULL DEFAULT 'telehealth' CHECK (modality IN ('telehealth','in-person','hybrid')),
  location         text CHECK (location IS NULL OR char_length(location) <= 120),
  pay_note         text CHECK (pay_note IS NULL OR char_length(pay_note) <= 300),
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  posted_at        timestamptz,
  closed_at        timestamptz,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tlc_jobs_instance_idx ON public.tlc_jobs (instance_id, office_id, status);

ALTER TABLE public.tlc_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tlc_jobs_member_read ON public.tlc_jobs;
CREATE POLICY tlc_jobs_member_read ON public.tlc_jobs
  FOR SELECT TO authenticated
  USING (public.user_in_instance(instance_id));
DROP POLICY IF EXISTS tlc_jobs_manager_insert ON public.tlc_jobs;
CREATE POLICY tlc_jobs_manager_insert ON public.tlc_jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.user_in_instance(instance_id)
              AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));
DROP POLICY IF EXISTS tlc_jobs_manager_update ON public.tlc_jobs;
CREATE POLICY tlc_jobs_manager_update ON public.tlc_jobs
  FOR UPDATE TO authenticated
  USING (public.user_in_instance(instance_id)
         AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
  WITH CHECK (public.user_in_instance(instance_id)
              AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));
DROP POLICY IF EXISTS tlc_jobs_manager_delete ON public.tlc_jobs;
CREATE POLICY tlc_jobs_manager_delete ON public.tlc_jobs
  FOR DELETE TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

CREATE TABLE IF NOT EXISTS public.tlc_job_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  office_id         text NOT NULL DEFAULT 'tlc' CHECK (char_length(office_id) BETWEEN 1 AND 40),
  job_id            uuid NOT NULL REFERENCES public.tlc_jobs(id) ON DELETE CASCADE,
  name              text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email             text NOT NULL CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 200),
  phone             text CHECK (phone IS NULL OR char_length(phone) <= 40),
  license_type      text CHECK (license_type IS NULL OR char_length(license_type) <= 80),
  license_state     text CHECK (license_state IS NULL OR char_length(license_state) <= 40),
  years_experience  integer CHECK (years_experience IS NULL OR (years_experience BETWEEN 0 AND 60)),
  statement         text NOT NULL CHECK (char_length(statement) BETWEEN 20 AND 3000),
  availability      text CHECK (availability IS NULL OR char_length(availability) <= 500),
  link              text CHECK (link IS NULL OR (char_length(link) <= 300 AND link ~* '^https?://')),
  status            text NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new','reviewing','interview','offered','hired','declined')),
  note              text CHECK (note IS NULL OR char_length(note) <= 2000),
  invite_id         uuid REFERENCES public.tlc_onboarding_invites(id) ON DELETE SET NULL,
  hired_at          timestamptz,
  hired_by          uuid REFERENCES auth.users(id),
  telehealth_status text NOT NULL DEFAULT 'not-started'
                      CHECK (telehealth_status IN ('not-started','invited','active')),
  telehealth_at     timestamptz,
  telehealth_by     uuid REFERENCES auth.users(id),
  telehealth_note   text CHECK (telehealth_note IS NULL OR char_length(telehealth_note) <= 500),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tlc_job_applications_instance_idx ON public.tlc_job_applications (instance_id, office_id, status);
CREATE INDEX IF NOT EXISTS tlc_job_applications_email_idx ON public.tlc_job_applications (instance_id, email, created_at);

ALTER TABLE public.tlc_job_applications ENABLE ROW LEVEL SECURITY;
-- No INSERT policy on purpose: an application is written only by tlc_apply().
DROP POLICY IF EXISTS tlc_job_applications_manager_read ON public.tlc_job_applications;
CREATE POLICY tlc_job_applications_manager_read ON public.tlc_job_applications
  FOR SELECT TO authenticated
  USING (public.user_in_instance(instance_id)
         AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));
DROP POLICY IF EXISTS tlc_job_applications_manager_update ON public.tlc_job_applications;
CREATE POLICY tlc_job_applications_manager_update ON public.tlc_job_applications
  FOR UPDATE TO authenticated
  USING (public.user_in_instance(instance_id)
         AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
  WITH CHECK (public.user_in_instance(instance_id)
              AND coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));
DROP POLICY IF EXISTS tlc_job_applications_manager_delete ON public.tlc_job_applications;
CREATE POLICY tlc_job_applications_manager_delete ON public.tlc_job_applications
  FOR DELETE TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

-- The hired / telehealth columns are set only by the functions below and the
-- owner/admin's own update; an update may never change who applied or to what.
CREATE OR REPLACE FUNCTION public.tlc_job_applications_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.instance_id := OLD.instance_id;
  NEW.office_id   := OLD.office_id;
  NEW.job_id      := OLD.job_id;
  NEW.name        := OLD.name;
  NEW.email       := OLD.email;
  NEW.phone       := OLD.phone;
  NEW.license_type := OLD.license_type;
  NEW.license_state := OLD.license_state;
  NEW.years_experience := OLD.years_experience;
  NEW.statement   := OLD.statement;
  NEW.availability := OLD.availability;
  NEW.link        := OLD.link;
  NEW.created_at  := OLD.created_at;
  NEW.updated_at  := now();
  IF NEW.telehealth_status IS DISTINCT FROM OLD.telehealth_status THEN
    NEW.telehealth_at := now();
    NEW.telehealth_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tlc_job_applications_guard_trg ON public.tlc_job_applications;
CREATE TRIGGER tlc_job_applications_guard_trg
  BEFORE UPDATE ON public.tlc_job_applications
  FOR EACH ROW EXECUTE FUNCTION public.tlc_job_applications_guard();

-- ---------------------------------------------------------------------------
-- The open jobs, for anyone (the door, and the website that links it).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_public_jobs(office_in text DEFAULT 'tlc')
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', j.id, 'title', j.title, 'summary', j.summary, 'requirements', j.requirements,
           'employment_type', j.employment_type, 'modality', j.modality, 'location', j.location,
           'pay_note', j.pay_note, 'posted_at', j.posted_at)
         ORDER BY j.posted_at DESC NULLS LAST, j.created_at DESC), '[]'::jsonb)
    FROM public.tlc_jobs j
   WHERE j.office_id = office_in AND j.status = 'open';
$$;
GRANT EXECUTE ON FUNCTION public.tlc_public_jobs(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Apply, for anyone: validated, bounded, one open application per job per
-- email, five a day per email per office. Returns the application id only.
-- ---------------------------------------------------------------------------
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

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_job.instance_id, auth.uid(), 'apply', 'tlc_job_application', v_row.id,
          NULL, jsonb_build_object('job_id', v_job.id, 'email', v_email), 'tlc_apply');

  RETURN jsonb_build_object('id', v_row.id, 'job_title', v_job.title, 'received_at', v_row.created_at);
END;
$$;
GRANT EXECUTE ON FUNCTION public.tlc_apply(text, uuid, jsonb) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Hire, atomically: the application becomes hired AND the 0187 invite is
-- minted for that email in the same transaction; the invite id is linked.
-- Owner/admin only (tlc_onboarding_invite enforces it too).
-- ---------------------------------------------------------------------------
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

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_office.instance_id, auth.uid(), 'hire', 'tlc_job_application', v_app.id,
          jsonb_build_object('status', v_app.status), jsonb_build_object('status', 'hired', 'invite_id', v_invite->>'id'), 'tlc_application_hire');

  RETURN jsonb_build_object('id', v_app.id, 'already', false, 'invite_id', v_invite->>'id',
                            'token', v_invite->>'token', 'email', v_invite->>'email', 'expires_at', v_invite->>'expires_at');
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_application_hire(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_application_hire(uuid, text) TO authenticated;

-- The two overlays cover the new instance-scoped tables.
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
