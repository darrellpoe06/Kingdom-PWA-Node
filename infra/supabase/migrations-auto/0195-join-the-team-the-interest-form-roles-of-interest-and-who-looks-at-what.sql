-- =============================================================================
-- 0195 -- JOIN THE TEAM: the interest form (roles of interest), a honeypot on
--         apply, who looks at what (views per posting) and the hiring report
--         (DR-0350 amended)
-- =============================================================================
-- Darrell 2026-09-10, on the live door reading "No open positions right now":
-- "HOW DOES ONE JOIN THE TEAM!" / "link to form and options for roles they can
-- show they are interested in... how many people look at this role vs this
-- one... data driven reporting..."
--
-- 1. THE INTEREST CARD. tlc_jobs gains kind: 'posting' (a vacancy) or
--    'interest' (the standing "tell us which roles interest you" card). The
--    office instance is seeded with one open interest card, so the door is
--    never a dead end: with no vacancy posted a person still says which roles
--    fit them and how to reach them, and the office reads it in Applicants.
-- 2. ROLES OF INTEREST. tlc_job_applications gains interest_roles (an array
--    of seat keys from the governance chart, at most 12, deduplicated); an
--    application to an interest card must name at least one.
-- 3. A HONEYPOT on the public apply (the assessment's "anonymous apply is a
--    public write" risk): the form carries a field a person never sees; a
--    filled one is refused before any lookup.
-- 4. WHO LOOKS AT WHAT. tlc_job_views counts, per posting per day, the times
--    a posting was opened on the door (anon tlc_job_viewed, open postings
--    only; only the RPC writes; staff read). A counter, not a person: no
--    identity, no address, nothing to protect.
-- 5. THE HIRING REPORT. tlc_hiring_report() (owner/admin): every posting with
--    its views (total and the last seven days), its applications by station,
--    and the roles people said they are interested in, counted.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. kind on the posting
-- ---------------------------------------------------------------------------
ALTER TABLE public.tlc_jobs ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'posting';
ALTER TABLE public.tlc_jobs DROP CONSTRAINT IF EXISTS tlc_jobs_kind_check;
ALTER TABLE public.tlc_jobs ADD CONSTRAINT tlc_jobs_kind_check CHECK (kind IN ('posting','interest'));

-- ---------------------------------------------------------------------------
-- 2. roles of interest on the application; the guard pins them like every
--    other applicant-written column
-- ---------------------------------------------------------------------------
ALTER TABLE public.tlc_job_applications ADD COLUMN IF NOT EXISTS interest_roles jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.tlc_job_applications DROP CONSTRAINT IF EXISTS tlc_job_applications_interest_roles_check;
ALTER TABLE public.tlc_job_applications ADD CONSTRAINT tlc_job_applications_interest_roles_check
  CHECK (jsonb_typeof(interest_roles) = 'array' AND jsonb_array_length(interest_roles) <= 12);

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
  NEW.interest_roles := OLD.interest_roles;
  NEW.created_at  := OLD.created_at;
  NEW.updated_at  := now();
  IF NEW.telehealth_status IS DISTINCT FROM OLD.telehealth_status THEN
    NEW.telehealth_at := now();
    NEW.telehealth_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. who looks at what: a counter per posting per day
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tlc_job_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  office_id   text NOT NULL DEFAULT 'tlc' CHECK (char_length(office_id) BETWEEN 1 AND 40),
  job_id      uuid NOT NULL REFERENCES public.tlc_jobs(id) ON DELETE CASCADE,
  day         date NOT NULL DEFAULT current_date,
  views       integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  UNIQUE (job_id, day)
);
CREATE INDEX IF NOT EXISTS tlc_job_views_instance_idx ON public.tlc_job_views (instance_id, job_id, day);

ALTER TABLE public.tlc_job_views ENABLE ROW LEVEL SECURITY;
-- Staff read the counts; nobody writes them by hand (only tlc_job_viewed,
-- SECURITY DEFINER, and only for an open posting). NULL-safe role guard (0131).
DROP POLICY IF EXISTS tlc_job_views_staff_read ON public.tlc_job_views;
CREATE POLICY tlc_job_views_staff_read ON public.tlc_job_views
  FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin','member'));
GRANT SELECT ON public.tlc_job_views TO authenticated;

CREATE OR REPLACE FUNCTION public.tlc_job_viewed(office_in text, job_id_in uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.tlc_jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM public.tlc_jobs
   WHERE id = job_id_in AND office_id = coalesce(office_in, 'tlc') AND status = 'open';
  IF v_job.id IS NULL THEN RETURN jsonb_build_object('counted', false); END IF;
  INSERT INTO public.tlc_job_views (instance_id, office_id, job_id, day, views)
  VALUES (v_job.instance_id, v_job.office_id, v_job.id, current_date, 1)
  ON CONFLICT (job_id, day) DO UPDATE SET views = public.tlc_job_views.views + 1;
  RETURN jsonb_build_object('counted', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.tlc_job_viewed(text, uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- The door's list carries the kind now.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_public_jobs(office_in text DEFAULT 'tlc')
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', j.id, 'kind', j.kind, 'title', j.title, 'summary', j.summary, 'requirements', j.requirements,
           'employment_type', j.employment_type, 'modality', j.modality, 'location', j.location,
           'pay_note', j.pay_note, 'posted_at', j.posted_at)
         ORDER BY (j.kind = 'interest') ASC, j.posted_at DESC NULLS LAST, j.created_at DESC), '[]'::jsonb)
    FROM public.tlc_jobs j
   WHERE j.office_id = office_in AND j.status = 'open';
$$;
GRANT EXECUTE ON FUNCTION public.tlc_public_jobs(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3 + 2. Apply: the honeypot first; roles of interest bounded and required
--        on an interest card. Everything else is 0192's, verbatim.
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
  v_roles  jsonb := '[]'::jsonb;
  v_row    public.tlc_job_applications%ROWTYPE;
BEGIN
  -- A field no person sees, filled: a script. Refused before any lookup.
  IF coalesce(applicant_in->>'website', '') <> '' THEN
    RAISE EXCEPTION 'application refused';
  END IF;
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

  -- Roles of interest: short seat keys, deduplicated, at most 12.
  IF jsonb_typeof(applicant_in->'interest_roles') = 'array' THEN
    SELECT coalesce(jsonb_agg(DISTINCT r ORDER BY r), '[]'::jsonb) INTO v_roles
      FROM (SELECT left(trim(x), 40) AS r
              FROM jsonb_array_elements_text(applicant_in->'interest_roles') AS x
             WHERE trim(x) <> '') s;
    IF jsonb_array_length(v_roles) > 12 THEN RAISE EXCEPTION 'choose at most 12 roles'; END IF;
  END IF;
  IF v_job.kind = 'interest' AND jsonb_array_length(v_roles) = 0 THEN
    RAISE EXCEPTION 'choose at least one role you are interested in';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tlc_job_applications a
              WHERE a.job_id = v_job.id AND a.email = v_email AND a.status <> 'declined') THEN
    RAISE EXCEPTION 'you have already applied for this position; the office has it';
  END IF;
  IF (SELECT count(*) FROM public.tlc_job_applications a
       WHERE a.instance_id = v_job.instance_id AND a.email = v_email AND a.created_at > now() - interval '1 day') >= 5 THEN
    RAISE EXCEPTION 'too many applications from this email today; try again tomorrow';
  END IF;

  INSERT INTO public.tlc_job_applications
    (instance_id, office_id, job_id, name, email, phone, license_type, license_state, years_experience, statement, availability, link, interest_roles)
  VALUES
    (v_job.instance_id, v_job.office_id, v_job.id, v_name, v_email,
     nullif(left(trim(coalesce(applicant_in->>'phone', '')), 40), ''),
     nullif(left(trim(coalesce(applicant_in->>'license_type', '')), 80), ''),
     nullif(left(trim(coalesce(applicant_in->>'license_state', '')), 40), ''),
     v_years, v_stmt,
     nullif(left(trim(coalesce(applicant_in->>'availability', '')), 500), ''),
     nullif(left(trim(coalesce(applicant_in->>'link', '')), 300), ''),
     v_roles)
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_job.instance_id, auth.uid(), 'create', 'tlc_job_application', v_row.id,
          NULL, jsonb_build_object('job_id', v_job.id, 'email', v_email, 'interest_roles', v_roles), 'tlc_apply');

  RETURN jsonb_build_object('id', v_row.id, 'job_title', v_job.title, 'kind', v_job.kind, 'received_at', v_row.created_at);
END;
$$;
GRANT EXECUTE ON FUNCTION public.tlc_apply(text, uuid, jsonb) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. The hiring report (owner/admin): data, not impressions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_hiring_report()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
  v_jobs   jsonb;
  v_roles  jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin reads the hiring report';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', j.id, 'title', j.title, 'kind', j.kind, 'status', j.status, 'posted_at', j.posted_at,
           'views_total', coalesce((SELECT sum(v.views) FROM public.tlc_job_views v WHERE v.job_id = j.id), 0),
           'views_7d',    coalesce((SELECT sum(v.views) FROM public.tlc_job_views v WHERE v.job_id = j.id AND v.day >= current_date - 6), 0),
           'applications_total', (SELECT count(*) FROM public.tlc_job_applications a WHERE a.job_id = j.id),
           'applications', coalesce((SELECT jsonb_object_agg(s.status, s.n)
                                       FROM (SELECT a.status, count(*) AS n FROM public.tlc_job_applications a WHERE a.job_id = j.id GROUP BY a.status) s),
                                    '{}'::jsonb))
         ORDER BY (j.status = 'open') DESC, j.posted_at DESC NULLS LAST, j.created_at DESC), '[]'::jsonb)
    INTO v_jobs
    FROM public.tlc_jobs j
   WHERE j.instance_id = v_office.instance_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object('role', r.role, 'interested', r.n) ORDER BY r.n DESC, r.role), '[]'::jsonb)
    INTO v_roles
    FROM (SELECT x.role, count(*) AS n
            FROM public.tlc_job_applications a, jsonb_array_elements_text(a.interest_roles) AS x(role)
           WHERE a.instance_id = v_office.instance_id
           GROUP BY x.role) r;

  RETURN jsonb_build_object('office', v_office.office_name, 'jobs', v_jobs, 'roles', v_roles, 'as_of', now());
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_hiring_report() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_hiring_report() TO authenticated;

-- ---------------------------------------------------------------------------
-- 1b. The standing interest card on the office instance (0193). One per
--     office; the office may close it from Jobs like any posting.
-- ---------------------------------------------------------------------------
INSERT INTO public.tlc_jobs (instance_id, office_id, kind, title, summary, requirements, employment_type, modality, status, posted_at)
SELECT i.id, 'tlc', 'interest', 'Tell us which roles interest you',
       'No opening posted for what you do? Say which roles fit you and a few sentences about yourself. The office reads every note in the app and reaches out when a seat opens.',
       '[]'::jsonb, 'contractor', 'telehealth', 'open', now()
  FROM public.instances i
 WHERE i.slug = 'tlc-therapy-solutions'
   AND NOT EXISTS (SELECT 1 FROM public.tlc_jobs j WHERE j.instance_id = i.id AND j.kind = 'interest');

-- The overlays re-run so the new table carries the assistant scope and the
-- viewer read-only wall like every other (0190).
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
