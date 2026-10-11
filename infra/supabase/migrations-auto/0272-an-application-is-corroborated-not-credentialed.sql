-- =============================================================================
-- 0272 — an application is CORROBORATED, not credentialed
-- =============================================================================
-- Darrell, 2026-10-10, after asking whether we should take uploaded licenses
-- and being shown why an applicant's ID is the one document we must not hold:
-- "How can we verify people without ID?" then, naming the model himself,
-- "Same as rent a center..."
--
-- THAT IS THE RIGHT MODEL AND IT IS WORTH SAYING WHY. Rent-A-Center runs no
-- credit check. What it actually does is call four to six personal references,
-- take a utility bill or lease proving the address, take a pay stub, and know
-- where the person physically is. CORROBORATION INSTEAD OF CREDENTIALS. It
-- transfers to a landlord better than it does to them, because the asset never
-- leaves his possession — the tenant lives in it.
--
-- And it verifies the thing that actually matters. A forged licence costs
-- about eighty dollars; six people who answer the phone and know your name, a
-- gas bill at an address, and an employer whose number the landlord looks up
-- himself are expensive to fake. An ID proves WHO someone is. It has never
-- once predicted whether they will pay the rent or keep the place. References,
-- employment and payment history do — which is why the app's own fair-housing
-- message (intake.js screenDecisionReason) ALREADY names "income, references,
-- payment history" as the criteria a decision may rest on. This migration
-- finishes what that sentence started.
--
-- WHAT WAS MEASURED, AND IT IS THE WHOLE GAP. The application already collects
-- landlordName, landlordPhone, employer, supervisorName, supervisorPhone,
-- monthlySalary and two emergency contacts (intake.js). NOTHING IS EVER
-- CHECKED, and there is no record of whether anyone tried. We gather the
-- numbers and never dial them. Rent-A-Center's entire edge is that they make
-- the calls.
--
-- ── THE DESIGN, AND THE TWO THINGS IT REFUSES TO BE ─────────────────────────
--
-- 1. IT IS NOT A SCORE. There is no total, no threshold, no pass mark. A score
--    is an exclusion engine wearing arithmetic, and it would quietly shut out
--    exactly the people this posture exists to keep a door open for — the
--    young renter with no rental history, the recently-arrived, the unbanked,
--    the person leaving a household rather than a lease. 'not-applicable' is a
--    first-class outcome for that reason: the check is still RECORDED, it
--    simply does not apply, and nobody is penalised for a row they could never
--    have filled.
--
-- 2. IT IS NOT DISCRETION EITHER. The list is FIXED and the same for every
--    applicant, and a decision cannot be recorded until every item on it has
--    been ATTEMPTED — attempted, not passed. That is both halves of DR-0101
--    §7 at once: the diligence is real, and the consistency is structural
--    rather than remembered. A landlord who calls one applicant's references
--    and not another's is the fair-housing exposure; a fixed list he must work
--    through for everyone is the defence, and it is better evidence than any
--    note he could write afterwards.
--
-- NO ID, STILL. 0152 already refuses an SSN or a driver's licence in the
-- answers payload by CHECK (rental_applications_no_ssn). Nothing here softens
-- that, and `heard` carries a light refusal of SSN-shaped text so a phone note
-- does not become the back door the payload is barred from being.
--
-- APPEND-ONLY, like every other record of who-did-what here. A second attempt
-- on the same item is a NEW ROW, never an edit: "called Tuesday, no answer"
-- followed by "called Thursday, reached her" IS the record, and collapsing it
-- to a final state would destroy the only part a dispute turns on. No UPDATE
-- and no DELETE is granted, to anyone.
--
-- checked_by is `DEFAULT auth.uid()` for the reason 0271 learned the hard way
-- one hour earlier: a who-did-it column that a caller is merely trusted to
-- send arrives NULL from the first writer that forgets, and a NULL cannot be
-- frozen. The database says who, so nobody has to be trusted to.
--
-- Idempotent: safe to apply twice. Additive: no existing row changes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE CORROBORATION RECORD
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_checks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
  -- The fixed list. Every applicant gets all of it; that is the point.
  item           text NOT NULL CHECK (item IN (
                   'prior-landlord',   -- the last landlord was called
                   'employer',         -- employment and income confirmed at source
                   'income-shown',     -- a pay stub / benefits letter / deposits seen
                   'address-shown',    -- a bill or lease in their name, where they live now
                   'reference',        -- a personal reference reached (repeatable)
                   'phone-answers'     -- the number they gave is theirs and answers
                 )),
  -- 'not-applicable' is not a failure and must never be read as one.
  outcome        text NOT NULL CHECK (outcome IN (
                   'confirmed', 'could-not-reach', 'did-not-confirm', 'not-applicable'
                 )),
  -- What was actually said. A note about a phone call, not a dossier.
  heard          text,
  checked_by     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  checked_at     timestamptz NOT NULL DEFAULT now(),

  -- The payload bar from 0152, carried onto free text. Not a guarantee — no
  -- regex makes prose safe — but the obvious shape of the one number we have
  -- promised never to hold does not get in through a call note.
  CONSTRAINT application_checks_no_ssn CHECK (
    heard IS NULL OR heard !~ '[0-9]{3}-[0-9]{2}-[0-9]{4}'
  )
);

CREATE INDEX IF NOT EXISTS application_checks_application_idx
  ON public.application_checks(application_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS application_checks_instance_idx
  ON public.application_checks(instance_id, checked_at DESC);

COMMENT ON TABLE public.application_checks IS
  'Corroboration instead of credentials (DR-0945): the fixed list of checks run on every rental application, each row naming who checked, when, and what they heard. Append-only. No score, no threshold — not-applicable is a first-class outcome so a person with no rental history is not excluded by arithmetic.';

-- APPEND-ONLY. Read and insert; never update, never delete.
REVOKE ALL ON public.application_checks FROM anon, authenticated;
GRANT SELECT, INSERT ON public.application_checks TO authenticated;
ALTER TABLE public.application_checks ENABLE ROW LEVEL SECURITY;

-- Exactly who may read an application may read its checks — the same standing
-- 0152 grants, not a new one. Spelled out rather than inherited so a later
-- reader of this file can see the whole rule in one place.
DROP POLICY IF EXISTS application_checks_read ON public.application_checks;
CREATE POLICY application_checks_read ON public.application_checks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rental_applications a WHERE a.id = application_id));

DROP POLICY IF EXISTS application_checks_insert ON public.application_checks;
CREATE POLICY application_checks_insert ON public.application_checks FOR INSERT TO authenticated
  WITH CHECK (
    checked_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rental_applications a
      WHERE a.id = application_id AND a.instance_id = application_checks.instance_id
    )
  );

-- ---------------------------------------------------------------------------
-- 2. A DECISION WAITS FOR THE LIST TO HAVE BEEN WORKED
-- ---------------------------------------------------------------------------
-- ATTEMPTED, NOT PASSED. Every item needs a row; what the row SAYS is the
-- landlord's business and this gate never reads it. 'could-not-reach' on all
-- six is a perfectly recordable state — he tried, nobody answered, and he
-- decided anyway with that written down. What is not recordable is deciding
-- while the list is blank.
--
-- IT DOES NOT PRE-EMPT 0152. If the decision is missing its reason this
-- trigger stays silent and lets rental_applications_decision_has_reason raise,
-- because that constraint has a smoke test asserting it fires and a gate that
-- shadows another gate quietly retires it (DR-0076 §3).
CREATE OR REPLACE FUNCTION public.rental_applications_require_corroboration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  missing text[];
BEGIN
  IF NEW.status NOT IN ('approved', 'declined') THEN RETURN NEW; END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  -- 0152's constraint speaks first. See above.
  IF NEW.decision_reason IS NULL OR length(btrim(NEW.decision_reason)) < 10 THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(i ORDER BY i) INTO missing
  FROM unnest(ARRAY['prior-landlord','employer','income-shown',
                    'address-shown','reference','phone-answers']) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM application_checks c
    WHERE c.application_id = NEW.id AND c.item = i
  );

  IF missing IS NOT NULL AND array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION
      'this application has not been checked yet — still to do: %. Every applicant gets the same list, and "could not reach" is an answer; a blank is not.',
      array_to_string(missing, ', ');
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.rental_applications_require_corroboration() FROM PUBLIC;

DROP TRIGGER IF EXISTS rental_applications_corroboration ON public.rental_applications;
CREATE TRIGGER rental_applications_corroboration
  BEFORE UPDATE ON public.rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.rental_applications_require_corroboration();

-- ---------------------------------------------------------------------------
-- 3. THE CLOCK COVERS APPLICATIONS TOO
-- ---------------------------------------------------------------------------
-- Darrell, 2026-10-10: "Logs for who did what and when for all users including
-- me". door_events is that clock (0262); applications were outside it, which
-- is the same hole DR-0903 found in the timeline. Both ends go on it: the
-- CHECK (who called whom, and what came back) and the DECISION.
ALTER TABLE public.door_events DROP CONSTRAINT IF EXISTS door_events_subject_check;
ALTER TABLE public.door_events ADD CONSTRAINT door_events_subject_check
  CHECK (subject IN ('rent', 'work', 'document', 'camera', 'stay', 'application'));

DROP POLICY IF EXISTS door_events_read ON public.door_events;
CREATE POLICY door_events_read ON public.door_events FOR SELECT TO authenticated
  USING (CASE subject
           WHEN 'rent' THEN EXISTS (SELECT 1 FROM rent_records r WHERE r.id = subject_id)
           WHEN 'work' THEN EXISTS (SELECT 1 FROM tenant_maintenance_requests w WHERE w.id = subject_id)
           WHEN 'document' THEN EXISTS (SELECT 1 FROM property_documents d WHERE d.id = subject_id)
           WHEN 'camera' THEN EXISTS (SELECT 1 FROM door_camera_access a WHERE a.id = subject_id)
           WHEN 'stay' THEN EXISTS (SELECT 1 FROM door_stays s WHERE s.id = subject_id)
           WHEN 'application' THEN EXISTS (SELECT 1 FROM rental_applications p WHERE p.id = subject_id)
           ELSE false END);

CREATE OR REPLACE FUNCTION public.door_events_from_application()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'application', NEW.id, 'applied', NEW.status,
            jsonb_strip_nulls(jsonb_build_object('rental_id', NEW.rental_id, 'applicant', NEW.applicant_name)),
            auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO door_events (instance_id, subject, subject_id, event, from_value, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'application', NEW.id, NEW.status, OLD.status, NEW.status,
            jsonb_strip_nulls(jsonb_build_object('reason', NEW.decision_reason, 'rental_id', NEW.rental_id)),
            auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.door_events_from_application() FROM PUBLIC;

DROP TRIGGER IF EXISTS rental_applications_events ON public.rental_applications;
CREATE TRIGGER rental_applications_events
  AFTER INSERT OR UPDATE ON public.rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.door_events_from_application();

-- Each corroboration attempt is itself an event. `heard` is deliberately NOT
-- copied into the clock: the clock says a call was made and how it came back,
-- and the note stays in the one table whose read is scoped to the application.
CREATE OR REPLACE FUNCTION public.door_events_from_application_check()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
  VALUES (NEW.instance_id, 'application', NEW.application_id, 'checked', NEW.outcome,
          jsonb_build_object('item', NEW.item), NEW.checked_by);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.door_events_from_application_check() FROM PUBLIC;

DROP TRIGGER IF EXISTS application_checks_events ON public.application_checks;
CREATE TRIGGER application_checks_events
  AFTER INSERT ON public.application_checks
  FOR EACH ROW EXECUTE FUNCTION public.door_events_from_application_check();

-- ---------------------------------------------------------------------------
-- 4. THE VIEWER OVERLAY COVERS THE NEW TABLE
-- ---------------------------------------------------------------------------
-- tenancy-guard caught this and it was a REAL HOLE, not a formality: a new
-- instance-scoped table that does not re-run the overlay leaves a VIEWER able
-- to WRITE it (DR-0241). On this table that means a read-only viewer could
-- file corroboration attempts against somebody's application — inventing a
-- record of calls that were never made, on the one surface whose whole value
-- is that its record is true.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
