-- =============================================================================
-- 0325 — the Institute keeps its roll, its attendance and its credentials
-- =============================================================================
-- The TLC Theological Institute (DR-1455 Slice A, the public surface; the
-- 2026-11-12 Institute note §4 and §5 Slice B). Four tables, two doors, and
-- the rule the plan itself wrote: "launch enrollment only after regulatory
-- confirmation" — carried by DATA, never by memory.
--
--   institute_settings     one row per church: the name, the regulatory state
--                          the OFFICE sets (not-filed / filed / confirmed), and
--                          whether enrollment is open. The public surface reads
--                          it and says plainly what it finds.
--   institute_enrollments  an applicant's own row per program; written by the
--                          applicant ONLY while the settings read confirmed AND
--                          open (the policy checks the settings row); read by
--                          the applicant and the office.
--   institute_attendance   marked by the office per session date; read by the
--                          student for their own rows.
--   institute_credentials  written ONLY through institute_issue_credential,
--                          office-only, which re-runs the completion standard
--                          on the server; a public verify door returns the
--                          holder, the program, the kind and the date, nothing
--                          else.
--
-- ACCESS follows 0223 (the ministries list) and 0209 (the member record):
-- the office is owner/admin of the church instance in instance_members; the
-- applicant is auth.uid(); nobody reads across instances. Every table carries
-- RLS; UPDATE policies carry both USING and WITH CHECK; the two SECURITY
-- DEFINER doors check auth.uid() and the office role in their own bodies.
--
-- IDEMPOTENT throughout; applies twice in CI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institute_settings (
  instance_id       uuid PRIMARY KEY REFERENCES public.instances (id) ON DELETE CASCADE,
  name              text NOT NULL DEFAULT 'TLC Theological Institute',
  exemption_status  text NOT NULL DEFAULT 'not-filed'
                    CHECK (exemption_status IN ('not-filed', 'filed', 'confirmed')),
  filing_reference  text,
  filed_at          date,
  enrollment_open   boolean NOT NULL DEFAULT false,
  -- The completion standard's attendance floor: present sessions required
  -- before a credential may issue. The office sets it per cohort; 0 means
  -- attendance is not part of the standard yet.
  attendance_floor  int NOT NULL DEFAULT 0 CHECK (attendance_floor >= 0),
  updated_by        uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.institute_settings ENABLE ROW LEVEL SECURITY;

-- READ: anyone. The landing says "enrollment opens after the state
-- confirmation" to a signed-out visitor; that sentence is read from here.
DROP POLICY IF EXISTS institute_settings_public_read ON public.institute_settings;
CREATE POLICY institute_settings_public_read
  ON public.institute_settings FOR SELECT
  USING (true);

-- WRITE: the church office only.
DROP POLICY IF EXISTS institute_settings_office_write ON public.institute_settings;
CREATE POLICY institute_settings_office_write
  ON public.institute_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.instance_members im
      WHERE im.instance_id = institute_settings.instance_id
        AND im.user_id = (SELECT auth.uid())
        AND im.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instance_members im
      WHERE im.instance_id = institute_settings.instance_id
        AND im.user_id = (SELECT auth.uid())
        AND im.role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 2. enrollments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institute_enrollments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances (id) ON DELETE CASCADE,
  user_id       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  program_key   text NOT NULL,
  program_title text NOT NULL,
  -- The program's course keys as they stood when the person applied: the
  -- completion standard is re-run against THESE, so a course added to the
  -- program next year does not retroactively unfinish a student.
  course_keys   text[] NOT NULL DEFAULT '{}',
  cohort_start  date,
  status        text NOT NULL DEFAULT 'applied'
                CHECK (status IN ('applied', 'accepted', 'withdrawn', 'completed')),
  note          text,
  applied_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, user_id, program_key)
);
CREATE INDEX IF NOT EXISTS institute_enrollments_instance_idx
  ON public.institute_enrollments (instance_id, status);
CREATE INDEX IF NOT EXISTS institute_enrollments_user_idx
  ON public.institute_enrollments (user_id);
ALTER TABLE public.institute_enrollments ENABLE ROW LEVEL SECURITY;

-- The office of an instance, as one predicate the policies share.
CREATE OR REPLACE FUNCTION public.institute_is_office(p_instance uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.instance_members im
    WHERE im.instance_id = p_instance
      AND im.user_id = (SELECT auth.uid())
      AND im.role IN ('owner', 'admin')
  );
$$;

-- READ: your own applications, and the office reads the roll.
DROP POLICY IF EXISTS institute_enrollments_own_read ON public.institute_enrollments;
CREATE POLICY institute_enrollments_own_read
  ON public.institute_enrollments FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.institute_is_office(instance_id));

-- APPLY: your own row, only while the office has confirmed the paperwork AND
-- opened enrollment. The settings row is the gate; a surface cannot paint
-- past it.
DROP POLICY IF EXISTS institute_enrollments_own_apply ON public.institute_enrollments;
CREATE POLICY institute_enrollments_own_apply
  ON public.institute_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'applied'
    AND EXISTS (
      SELECT 1 FROM public.institute_settings s
      WHERE s.instance_id = institute_enrollments.instance_id
        AND s.exemption_status = 'confirmed'
        AND s.enrollment_open
    )
  );

-- WITHDRAW: your own row may move to withdrawn (and its note may change);
-- nothing else about it is yours to edit.
DROP POLICY IF EXISTS institute_enrollments_own_withdraw ON public.institute_enrollments;
CREATE POLICY institute_enrollments_own_withdraw
  ON public.institute_enrollments FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND status IN ('applied', 'withdrawn'));

-- THE OFFICE: accepts, completes, withdraws, sets the cohort.
DROP POLICY IF EXISTS institute_enrollments_office_write ON public.institute_enrollments;
CREATE POLICY institute_enrollments_office_write
  ON public.institute_enrollments FOR UPDATE
  TO authenticated
  USING (public.institute_is_office(instance_id))
  WITH CHECK (public.institute_is_office(instance_id));

-- -----------------------------------------------------------------------------
-- 3. attendance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institute_attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances (id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.institute_enrollments (id) ON DELETE CASCADE,
  session_date  date NOT NULL,
  present       boolean NOT NULL DEFAULT true,
  marked_by     uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  marked_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, session_date)
);
CREATE INDEX IF NOT EXISTS institute_attendance_enrollment_idx
  ON public.institute_attendance (enrollment_id, session_date);
ALTER TABLE public.institute_attendance ENABLE ROW LEVEL SECURITY;

-- READ: the student reads their own; the office reads all of its church's.
DROP POLICY IF EXISTS institute_attendance_read ON public.institute_attendance;
CREATE POLICY institute_attendance_read
  ON public.institute_attendance FOR SELECT
  TO authenticated
  USING (
    public.institute_is_office(instance_id)
    OR EXISTS (
      SELECT 1 FROM public.institute_enrollments e
      WHERE e.id = institute_attendance.enrollment_id
        AND e.user_id = (SELECT auth.uid())
    )
  );

-- WRITE: the office only. A student never marks their own attendance.
DROP POLICY IF EXISTS institute_attendance_office_write ON public.institute_attendance;
CREATE POLICY institute_attendance_office_write
  ON public.institute_attendance FOR ALL
  TO authenticated
  USING (public.institute_is_office(instance_id))
  WITH CHECK (
    public.institute_is_office(instance_id)
    AND EXISTS (
      SELECT 1 FROM public.institute_enrollments e
      WHERE e.id = institute_attendance.enrollment_id
        AND e.instance_id = institute_attendance.instance_id
    )
  );

-- -----------------------------------------------------------------------------
-- 4. credentials — written only through the door below
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institute_credentials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances (id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL UNIQUE REFERENCES public.institute_enrollments (id) ON DELETE CASCADE,
  kind          text NOT NULL DEFAULT 'certificate' CHECK (kind IN ('certificate')),
  credential_no text NOT NULL UNIQUE,
  verify_code   text NOT NULL UNIQUE,
  holder_name   text NOT NULL,
  program_title text NOT NULL,
  issued_by     uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  issued_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.institute_credentials ENABLE ROW LEVEL SECURITY;

-- READ: the holder reads their own; the office reads its church's. No
-- INSERT, UPDATE or DELETE policy exists on purpose: the only way in is the
-- office door below, which re-runs the standard first.
DROP POLICY IF EXISTS institute_credentials_read ON public.institute_credentials;
CREATE POLICY institute_credentials_read
  ON public.institute_credentials FOR SELECT
  TO authenticated
  USING (
    public.institute_is_office(instance_id)
    OR EXISTS (
      SELECT 1 FROM public.institute_enrollments e
      WHERE e.id = institute_credentials.enrollment_id
        AND e.user_id = (SELECT auth.uid())
    )
  );

-- The completion standard, as one function the office door and the surface
-- both read. True only when every course the enrollment names has a passed
-- quiz row for that learner AND the present sessions meet the floor.
CREATE OR REPLACE FUNCTION public.institute_completion(p_enrollment uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e           public.institute_enrollments%ROWTYPE;
  v_floor     int;
  v_present   int;
  v_missing   text[];
BEGIN
  SELECT * INTO e FROM public.institute_enrollments WHERE id = p_enrollment;
  IF NOT FOUND THEN RAISE EXCEPTION 'no such enrollment'; END IF;
  -- Only the student and the office may ask.
  IF (SELECT auth.uid()) IS NULL
     OR NOT (e.user_id = (SELECT auth.uid()) OR public.institute_is_office(e.instance_id)) THEN
    RAISE EXCEPTION 'not yours to read';
  END IF;
  SELECT coalesce(s.attendance_floor, 0) INTO v_floor
    FROM public.institute_settings s WHERE s.instance_id = e.instance_id;
  v_floor := coalesce(v_floor, 0);
  SELECT count(*) INTO v_present
    FROM public.institute_attendance a
    WHERE a.enrollment_id = e.id AND a.present;
  SELECT coalesce(array_agg(k), '{}') INTO v_missing
    FROM unnest(e.course_keys) AS k
    WHERE NOT EXISTS (
      SELECT 1 FROM public.learner_lesson_records r
      WHERE r.user_id = e.user_id AND r.course_key = k AND r.quiz_passed
    );
  RETURN jsonb_build_object(
    'complete', (cardinality(v_missing) = 0 AND v_present >= v_floor AND e.status IN ('accepted', 'completed')),
    'status', e.status,
    'coursesMissing', to_jsonb(v_missing),
    'present', v_present,
    'floor', v_floor
  );
END;
$$;
REVOKE ALL ON FUNCTION public.institute_completion(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.institute_completion(uuid) TO authenticated;

-- The office door: issue a credential ONLY when the standard is met. Returns
-- the credential row's public fields.
CREATE OR REPLACE FUNCTION public.institute_issue_credential(p_enrollment uuid, p_holder_name text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e        public.institute_enrollments%ROWTYPE;
  v_done   jsonb;
  v_seq    int;
  v_no     text;
  v_code   text;
  v_row    public.institute_credentials%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO e FROM public.institute_enrollments WHERE id = p_enrollment;
  IF NOT FOUND THEN RAISE EXCEPTION 'no such enrollment'; END IF;
  IF NOT public.institute_is_office(e.instance_id) THEN
    RAISE EXCEPTION 'only the church office may issue a credential';
  END IF;
  IF coalesce(nullif(trim(p_holder_name), ''), '') = '' THEN
    RAISE EXCEPTION 'the holder''s name is required on the certificate';
  END IF;
  v_done := public.institute_completion(p_enrollment);
  IF NOT coalesce((v_done->>'complete')::boolean, false) THEN
    RAISE EXCEPTION 'the completion standard is not met: %', v_done::text;
  END IF;
  IF EXISTS (SELECT 1 FROM public.institute_credentials c WHERE c.enrollment_id = p_enrollment) THEN
    RAISE EXCEPTION 'a credential was already issued for this enrollment';
  END IF;
  SELECT count(*) + 1 INTO v_seq FROM public.institute_credentials c WHERE c.instance_id = e.instance_id;
  v_no := to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 4, '0');
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  INSERT INTO public.institute_credentials (instance_id, enrollment_id, kind, credential_no, verify_code, holder_name, program_title, issued_by)
    VALUES (e.instance_id, e.id, 'certificate', v_no, v_code, trim(p_holder_name), e.program_title, (SELECT auth.uid()))
    RETURNING * INTO v_row;
  UPDATE public.institute_enrollments SET status = 'completed', updated_at = now() WHERE id = e.id;
  RETURN jsonb_build_object(
    'id', v_row.id, 'credentialNo', v_row.credential_no, 'verifyCode', v_row.verify_code,
    'holderName', v_row.holder_name, 'programTitle', v_row.program_title, 'kind', v_row.kind, 'issuedAt', v_row.issued_at
  );
END;
$$;
REVOKE ALL ON FUNCTION public.institute_issue_credential(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.institute_issue_credential(uuid, text) TO authenticated;

-- The public verify door: a code in, the minimal public fields out, or null.
-- Anyone may ask (a future employer holding a certificate); nothing else about
-- the holder leaves.
CREATE OR REPLACE FUNCTION public.institute_verify_credential(p_code text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'holderName', c.holder_name, 'programTitle', c.program_title, 'kind', c.kind,
    'credentialNo', c.credential_no, 'issuedAt', c.issued_at
  )
  FROM public.institute_credentials c
  WHERE c.verify_code = upper(trim(coalesce(p_code, '')))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.institute_verify_credential(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.institute_verify_credential(text) TO anon, authenticated;

-- updated_at on the rows the office edits.
CREATE OR REPLACE FUNCTION public.touch_institute_row()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS institute_settings_touch ON public.institute_settings;
CREATE TRIGGER institute_settings_touch
  BEFORE UPDATE ON public.institute_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_institute_row();
DROP TRIGGER IF EXISTS institute_enrollments_touch ON public.institute_enrollments;
CREATE TRIGGER institute_enrollments_touch
  BEFORE UPDATE ON public.institute_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.touch_institute_row();

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
NOTIFY pgrst, 'reload schema';
