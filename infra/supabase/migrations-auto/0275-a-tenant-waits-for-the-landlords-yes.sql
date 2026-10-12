-- =============================================================================
-- 0275 — a tenant waits for the landlord's yes, and the database is what makes
--        them wait
-- =============================================================================
-- Darrell, 2026-10-11: "After a tenant registers, they should NOT automatically
-- access the tenant dashboard or any property information. Instead, they should
-- be redirected to a Waiting for Landlord Approval screen... These restrictions
-- must be enforced through backend authorization and database security, not
-- simply by hiding pages or buttons."
--
-- WHAT WAS MEASURED FIRST, because the directive opens with a claimed leak —
-- "tenants are being redirected to a page where they can see information that
-- should not be accessible to them". Executed on a real PostgreSQL 16.15 with
-- this chain applied, as a signed-in stranger with no membership, no tenancy
-- and no household row:
--
--     rental_tenancies: 0      rentals:         0
--     property_photos:  0      tenancy_notes:   0
--
-- and the control in the same harness — Christina, the real tenant on that
-- door — reads her 1 tenancy. So the test is live and RLS HOLDS: no tenant's
-- lease, rent, balance, phone or email is reaching a new registrant today.
-- That part of the report is not what is happening.
--
-- WHAT IS REAL is the screen. PropertiesApp's role resolver ends
-- `return 'tenant'`, so a person the system knows nothing about is handed the
-- TENANT FACE — a dashboard built for somebody else, empty because RLS
-- correctly withheld everything, with no explanation and no way forward. It is
-- the 2026-08-27 defect wearing the other shoe: then a landlord "met an empty
-- screen built for someone else", now a stranger does. An empty screen is not
-- a leak, and it is still wrong: it tells a person nothing true about where
-- they stand.
--
-- SO THE FIX IS A STATE, NOT A HIDDEN BUTTON. A person who has asked for
-- access is PENDING, and pending is a fact in this database that the landlord
-- alone can change. The app renders the waiting screen because the database
-- says pending; it does not decide pending for itself. That ordering is the
-- whole point of the directive's "not simply by hiding pages or buttons", and
-- it is DR-0060's rule — isolation is a gate, the UI only reflects it.
--
-- WHAT THIS DOES NOT TOUCH. No existing table changes shape. No tenancy, lease,
-- payment, photo, work order or rental row is altered, moved or deleted. The
-- grant that actually opens a tenant's door is still, exactly as before,
-- rental_tenancies.tenant_user_id — this migration only adds the queue in front
-- of it and the one function that may set it.
--
-- Idempotent: safe to apply twice. Additive.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. NORMALIZING A PERSON'S CONTACT DETAILS
-- ---------------------------------------------------------------------------
-- Darrell: "Email addresses and phone numbers should be normalized before
-- matching to prevent formatting differences from causing problems."
--
-- (217) 555-0101, 217-555-0101 and +1 217 555 0101 are one phone. A US number
-- keeps its last ten digits so a leading 1 or +1 cannot split one person into
-- two. Anything else keeps its digits and is compared as digits.
CREATE OR REPLACE FUNCTION public.normalized_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
           WHEN d IS NULL OR length(d) < 7 THEN NULL
           WHEN length(d) = 11 AND left(d, 1) = '1' THEN right(d, 10)
           WHEN length(d) > 10 THEN right(d, 10)
           ELSE d
         END
  FROM (SELECT nullif(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), '') AS d) s;
$$;

CREATE OR REPLACE FUNCTION public.normalized_email(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT nullif(lower(btrim(coalesce(p, ''))), '');
$$;

COMMENT ON FUNCTION public.normalized_phone(text) IS
  'The comparable form of a phone number: last ten digits for a US number, digits otherwise, NULL when too short to be one (DR-0957).';

-- ---------------------------------------------------------------------------
-- 2. WHICH DOORS A REGISTERING TENANT MAY NAME
-- ---------------------------------------------------------------------------
-- Darrell: "IMPORTANT: Include occupied rental properties, not just vacant
-- properties available for rent. Existing tenants must be able to locate and
-- select the property where they currently live." And: "The landlord should be
-- able to control which properties appear."
--
-- Default TRUE, deliberately. The whole purpose of this list is an existing
-- tenant finding the home they already live in; a default of false would mean
-- every door is invisible until somebody remembers to switch it on, and the
-- feature would appear broken on the day it ships.
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS portal_registration_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.rentals.portal_registration_enabled IS
  'Whether this door appears in the tenant-portal registration dropdown. Default true so an existing tenant can find the home they live in; the landlord may hide a door (DR-0957).';

-- ---------------------------------------------------------------------------
-- 3. WHO MAY REVIEW — the property manager, when the landlord says so
-- ---------------------------------------------------------------------------
-- Darrell: "The landlord should control whether a property manager can approve
-- tenant registrations." 0075 already has the vocabulary for a delegated
-- capability; this is one more of them rather than a new mechanism.
--
-- Defined HERE, before the policies that call it, because a policy body is
-- resolved when the policy is created and a forward reference simply fails.
CREATE OR REPLACE FUNCTION public.user_can_review_portal_requests(p_instance uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM delegated_capabilities dc
     WHERE dc.grantee_user_id = auth.uid()
       AND dc.instance_id = p_instance
       AND dc.capability = 'tenant.approve'
       AND dc.setting = 'allow'
  );
$$;

REVOKE ALL ON FUNCTION public.user_can_review_portal_requests(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_review_portal_requests(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE REGISTRATION REQUEST
-- ---------------------------------------------------------------------------
-- A row here is a person ASKING. It is not access, the way
-- property_access_invites (0150) is intent and not access. Nothing in this
-- table is read by any policy that governs a tenancy, a payment or a document.
CREATE TABLE IF NOT EXISTS public.tenant_portal_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  -- WHO IS ASKING is the session, never a typed field. A person cannot file a
  -- request in somebody else's name because they cannot forge auth.uid().
  requested_by  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,

  first_name    text NOT NULL CHECK (btrim(first_name) <> ''),
  last_name     text NOT NULL CHECK (btrim(last_name)  <> ''),
  email         text,
  phone         text,
  -- Stored normalized so matching is a column comparison and an index, not a
  -- guess at call time.
  email_norm    text GENERATED ALWAYS AS (public.normalized_email(email)) STORED,
  phone_norm    text GENERATED ALWAYS AS (public.normalized_phone(phone)) STORED,
  CONSTRAINT tenant_portal_requests_needs_a_way_to_reach_them
    CHECK (public.normalized_email(email) IS NOT NULL OR public.normalized_phone(phone) IS NOT NULL),

  -- The door they picked from the dropdown, and the unit as the list showed it.
  rental_id     uuid REFERENCES rentals(id) ON DELETE SET NULL,
  unit_label    text,

  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'denied', 'more-info')),
  -- What the landlord asked for, when status is 'more-info'.
  landlord_note text,

  -- A POSSIBLE match, for the landlord's eyes. Setting this grants NOTHING; it
  -- is a hint on a review screen. The link that matters is linked_tenancy_id,
  -- and only the approval function writes that.
  matched_tenancy_id uuid REFERENCES rental_tenancies(id) ON DELETE SET NULL,
  linked_tenancy_id  uuid REFERENCES rental_tenancies(id) ON DELETE SET NULL,

  -- Did they prove they hold the address/number they typed?
  verified_email_at timestamptz,
  verified_phone_at timestamptz,

  decided_by    uuid REFERENCES auth.users(id),
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ONE OPEN REQUEST PER PERSON PER INSTANCE. Darrell: "Duplicate registrations
-- and duplicate tenant records are prevented where possible." A decided request
-- is history and may sit beside a new one; two PENDING rows for one person are
-- a queue the landlord has to reconcile by hand, so they cannot happen.
CREATE UNIQUE INDEX IF NOT EXISTS tenant_portal_requests_one_open
  ON public.tenant_portal_requests (instance_id, requested_by)
  WHERE status IN ('pending', 'more-info');

CREATE INDEX IF NOT EXISTS tenant_portal_requests_instance_idx ON public.tenant_portal_requests(instance_id, status);
CREATE INDEX IF NOT EXISTS tenant_portal_requests_email_idx    ON public.tenant_portal_requests(email_norm);
CREATE INDEX IF NOT EXISTS tenant_portal_requests_phone_idx    ON public.tenant_portal_requests(phone_norm);

-- ---------------------------------------------------------------------------
-- 4. A PERSON MAY ASK. ONLY THE LANDLORD MAY ANSWER.
-- ---------------------------------------------------------------------------
-- A COLUMN GRANT IS NOT A WALL IN THIS DATABASE, and saying so would be the
-- kind of claim that reads as security and is not (DR-0076 section 1).
-- Measured 2026-10-11: 0024-restore-authenticated-grants sets
-- `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE,
-- DELETE ON TABLES TO authenticated`, so this table was born with table-wide
-- DML for every signed-in person before a single GRANT below was read. The
-- narrow grant is written anyway — it states the intent, and it becomes real
-- the day those default privileges narrow — but the walls that actually hold,
-- and that were proven to hold by trying to break them, are the RLS policies
-- and the trigger beneath them.
GRANT SELECT, INSERT ON public.tenant_portal_requests TO authenticated;
GRANT UPDATE (first_name, last_name, email, phone, rental_id, unit_label, updated_at)
  ON public.tenant_portal_requests TO authenticated;

ALTER TABLE public.tenant_portal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_portal_requests_read   ON public.tenant_portal_requests;
DROP POLICY IF EXISTS tenant_portal_requests_insert ON public.tenant_portal_requests;
DROP POLICY IF EXISTS tenant_portal_requests_update ON public.tenant_portal_requests;

-- Mine, or the landlord's own instance. Never another applicant's.
CREATE POLICY tenant_portal_requests_read ON public.tenant_portal_requests
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid()
         OR user_role_in_instance(instance_id) IN ('owner', 'admin')
         OR public.user_can_review_portal_requests(instance_id));

CREATE POLICY tenant_portal_requests_insert ON public.tenant_portal_requests
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

-- A person edits their OWN row and only while it is still open — a decided
-- request is a record of what was decided and must not be rewritten under it.
-- The landlord may edit any row in their instance (that is how "correct the
-- property or unit before approving" works).
CREATE POLICY tenant_portal_requests_update ON public.tenant_portal_requests
  FOR UPDATE TO authenticated
  USING      ((requested_by = auth.uid() AND status IN ('pending', 'more-info'))
              OR user_role_in_instance(instance_id) IN ('owner', 'admin')
              OR public.user_can_review_portal_requests(instance_id))
  WITH CHECK ((requested_by = auth.uid() AND status IN ('pending', 'more-info'))
              OR user_role_in_instance(instance_id) IN ('owner', 'admin')
              OR public.user_can_review_portal_requests(instance_id));

-- THE BELT TO THE COLUMN-GRANT BRACES. A trigger, because a grant protects the
-- columns it names and a future migration that widens the grant would silently
-- remove the protection. Here the rule is stated once, in force regardless.
CREATE OR REPLACE FUNCTION public.tenant_portal_request_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_landlord boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Asking is always just asking. Whatever the client sent, a new request is
    -- pending, unlinked, undecided and unverified.
    NEW.status := 'pending';
    NEW.linked_tenancy_id := NULL;
    NEW.decided_by := NULL;
    NEW.decided_at := NULL;
    NEW.verified_email_at := NULL;
    NEW.verified_phone_at := NULL;
    RETURN NEW;
  END IF;

  -- COALESCED, AND THAT IS NOT STYLE (measured 2026-10-11). For a person who
  -- is a member of nothing, user_role_in_instance() returns NULL, so
  -- `NULL IN ('owner','admin')` is NULL, `NOT NULL` is NULL, and `IF NULL THEN
  -- RAISE` DOES NOT FIRE. The first version of this guard waved a total
  -- stranger straight through; what stopped her in the harness was a later
  -- "that seat is taken" check, which is luck and not a wall. An RLS policy is
  -- safe from this because SQL treats a NULL USING clause as false — plpgsql
  -- does not. Every authorization test in this file is therefore written
  -- `IF NOT coalesce(..., false)`.
  is_landlord := coalesce(user_role_in_instance(NEW.instance_id) IN ('owner', 'admin'), false)
                 OR coalesce(public.user_can_review_portal_requests(NEW.instance_id), false);

  IF NOT is_landlord THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'only the landlord decides a registration request'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.linked_tenancy_id IS DISTINCT FROM OLD.linked_tenancy_id
       OR NEW.matched_tenancy_id IS DISTINCT FROM OLD.matched_tenancy_id
       OR NEW.decided_by IS DISTINCT FROM OLD.decided_by
       OR NEW.verified_email_at IS DISTINCT FROM OLD.verified_email_at
       OR NEW.verified_phone_at IS DISTINCT FROM OLD.verified_phone_at
       OR NEW.instance_id IS DISTINCT FROM OLD.instance_id
       OR NEW.requested_by IS DISTINCT FROM OLD.requested_by THEN
      RAISE EXCEPTION 'a requester may correct only their own details'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tenant_portal_request_guard_t ON public.tenant_portal_requests;
CREATE TRIGGER tenant_portal_request_guard_t
  BEFORE INSERT OR UPDATE ON public.tenant_portal_requests
  FOR EACH ROW EXECUTE FUNCTION public.tenant_portal_request_guard();

-- ---------------------------------------------------------------------------
-- 5. WHERE THIS PERSON STANDS — the one answer the app gates on
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER and parameterless: it can only ever describe the caller.
-- The app asks this before it decides what to draw, which is what makes the
-- waiting screen a consequence of the database rather than a guess.
CREATE OR REPLACE FUNCTION public.my_portal_status()
RETURNS TABLE (
  state        text,     -- 'none' | 'pending' | 'more-info' | 'denied' | 'approved'
  request_id   uuid,
  landlord_note text,
  asked_at     timestamptz,
  decided_at   timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(r.status, 'none')::text,
         r.id,
         CASE WHEN r.status = 'more-info' THEN r.landlord_note END,
         r.created_at,
         r.decided_at
    FROM (SELECT 1) one
    LEFT JOIN tenant_portal_requests r
      ON r.requested_by = auth.uid()
     ORDER BY (r.status = 'pending') DESC, r.created_at DESC NULLS LAST
     LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.my_portal_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_portal_status() TO authenticated;

COMMENT ON FUNCTION public.my_portal_status() IS
  'Where the signed-in person stands with the tenant portal. Parameterless and SECURITY DEFINER, so it can only describe its own caller (DR-0957).';

-- ---------------------------------------------------------------------------
-- 7. THE DROPDOWN — addresses and units, never the people in them
-- ---------------------------------------------------------------------------
-- Darrell: "The dropdown must not expose existing tenants' names, contact
-- information, balances, or other private information."
--
-- So it returns four columns and there is nowhere for a person to hide. It
-- reads `rentals` under SECURITY DEFINER because a registrant is a member of
-- nothing and could not otherwise see the door they live in — which is the
-- feature. It is bounded to ONE instance, named by the caller, so this is
-- never a way to enumerate every landlord on the platform.
CREATE OR REPLACE FUNCTION public.registerable_doors(p_instance uuid)
RETURNS TABLE (
  id          uuid,
  label       text,
  unit        text,
  occupied    boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id,
         -- "805 N Prospect Avenue - Unit 2", or the door's own name when it has
         -- one. A tenant recognises their home by its address, so the address
         -- leads.
         btrim(concat_ws(' - ',
           coalesce(nullif(btrim(r.address), ''), nullif(btrim(r.display_name), ''), 'Unnamed property'),
           CASE WHEN nullif(btrim(r.unit), '') IS NOT NULL THEN 'Unit ' || btrim(r.unit) END)),
         nullif(btrim(r.unit), ''),
         EXISTS (SELECT 1 FROM rental_tenancies t
                  WHERE t.rental_ref = r.slug AND t.status = 'active')
    FROM rentals r
   WHERE r.instance_id = p_instance
     AND r.portal_registration_enabled
     -- OCCUPIED DOORS ARE THE POINT (Darrell, explicitly). A vacancy list would
     -- be useless to the people this feature exists for.
     AND NOT public.rental_is_own_home(r.status, r.property_type)
   ORDER BY 2;
$$;

REVOKE ALL ON FUNCTION public.registerable_doors(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registerable_doors(uuid) TO authenticated;

COMMENT ON FUNCTION public.registerable_doors(uuid) IS
  'The doors a registering tenant may name: address, unit, and whether somebody lives there. Never a tenant name, contact, balance or lease. Occupied doors are included on purpose — an existing tenant has to be able to find the home they live in (DR-0957).';

-- ---------------------------------------------------------------------------
-- 8. THE POSSIBLE MATCH — a hint for the landlord, never a grant
-- ---------------------------------------------------------------------------
-- Darrell: "If a matching record is found: identify the potential match...
-- Do not automatically grant access."
--
-- The match is computed on the landlord's side and stored on the request.
-- Note what it does NOT do: it never tells the person registering whether they
-- matched. Saying "we found your record" to whoever types an address is a way
-- to probe who lives where, and nothing in the directive asks for it.
CREATE OR REPLACE FUNCTION public.match_portal_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  hit uuid;
  -- NORMALIZED HERE, NOT READ OFF THE ROW. email_norm and phone_norm are
  -- GENERATED columns, and Postgres computes those AFTER the BEFORE triggers
  -- have run — so inside this function they are still NULL and every
  -- comparison against them is false. Measured 2026-10-11: the first version
  -- read NEW.email_norm and found NO match for a tenant whose email and phone
  -- were both already on her tenancy. It would have shipped as "the landlord
  -- never sees a possible match", with nothing failing anywhere.
  want_email text := public.normalized_email(NEW.email);
  want_phone text := public.normalized_phone(NEW.phone);
BEGIN
  SELECT t.id INTO hit
    FROM rental_tenancies t
    JOIN rentals r ON r.slug = t.rental_ref AND r.instance_id = t.instance_id
   WHERE t.instance_id = NEW.instance_id
     AND (
          (want_email IS NOT NULL AND public.normalized_email(t.tenant_email) = want_email)
       OR (want_phone IS NOT NULL AND public.normalized_phone(t.tenant_phone) = want_phone)
     )
   ORDER BY (t.status = 'active') DESC,
            -- a match on the door they named outranks one anywhere else
            (NEW.rental_id IS NOT NULL AND r.id = NEW.rental_id) DESC,
            t.created_at DESC
   LIMIT 1;
  NEW.matched_tenancy_id := hit;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS match_portal_request_t ON public.tenant_portal_requests;
CREATE TRIGGER match_portal_request_t
  BEFORE INSERT OR UPDATE OF email, phone, rental_id ON public.tenant_portal_requests
  FOR EACH ROW EXECUTE FUNCTION public.match_portal_request();

-- ---------------------------------------------------------------------------
-- 9. THE LANDLORD'S YES — the only thing that opens a door
-- ---------------------------------------------------------------------------
-- Darrell: "A landlord can revoke a tenant's portal access without deleting the
-- tenant's rental history", and "Do not allow the approval process to create
-- duplicate tenant records unnecessarily."
--
-- So approval LINKS rather than creates: it writes tenant_user_id onto the
-- tenancy the landlord confirmed. Revoking clears that one column and the
-- tenancy — the lease, the rent, the whole history — is untouched.
CREATE OR REPLACE FUNCTION public.decide_portal_request(
  p_request  uuid,
  p_decision text,                 -- 'approved' | 'denied' | 'more-info'
  p_tenancy  uuid DEFAULT NULL,    -- the landlord's confirmed tenancy, on approval
  p_note     text DEFAULT NULL
)
RETURNS tenant_portal_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  req tenant_portal_requests;
  tgt uuid;
  out_row tenant_portal_requests;
BEGIN
  SELECT * INTO req FROM tenant_portal_requests WHERE id = p_request;
  IF req.id IS NULL THEN
    RAISE EXCEPTION 'no such registration request' USING ERRCODE = 'no_data_found';
  END IF;

  -- coalesce: a non-member's role is NULL and `IF NOT (NULL IN (...))` never
  -- fires (see the note on the guard trigger above).
  IF NOT (coalesce(user_role_in_instance(req.instance_id) IN ('owner', 'admin'), false)
          OR coalesce(public.user_can_review_portal_requests(req.instance_id), false)) THEN
    RAISE EXCEPTION 'only the landlord decides a registration request'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_decision NOT IN ('approved', 'denied', 'more-info') THEN
    RAISE EXCEPTION 'a decision is approved, denied or more-info' USING ERRCODE = 'check_violation';
  END IF;

  IF p_decision = 'approved' THEN
    tgt := coalesce(p_tenancy, req.matched_tenancy_id);
    IF tgt IS NULL THEN
      RAISE EXCEPTION 'approving needs the tenancy this person belongs to'
        USING ERRCODE = 'check_violation';
    END IF;
    -- The tenancy must be the landlord's own. Passing somebody else's id is how
    -- an approval would become a cross-instance grant.
    IF NOT EXISTS (SELECT 1 FROM rental_tenancies t
                    WHERE t.id = tgt AND t.instance_id = req.instance_id) THEN
      RAISE EXCEPTION 'that tenancy is not on this instance' USING ERRCODE = 'check_violation';
    END IF;
    -- ONE PERSON PER TENANCY SEAT. If the seat already holds somebody else, say
    -- so rather than quietly moving a stranger into their record.
    IF EXISTS (SELECT 1 FROM rental_tenancies t
                WHERE t.id = tgt AND t.tenant_user_id IS NOT NULL
                  AND t.tenant_user_id <> req.requested_by) THEN
      RAISE EXCEPTION 'another account already holds that tenancy — revoke it first'
        USING ERRCODE = 'check_violation';
    END IF;

    UPDATE rental_tenancies SET tenant_user_id = req.requested_by WHERE id = tgt;
  ELSE
    tgt := NULL;
  END IF;

  UPDATE tenant_portal_requests
     SET status = p_decision,
         linked_tenancy_id = tgt,
         landlord_note = CASE WHEN p_decision = 'more-info' THEN p_note ELSE landlord_note END,
         decided_by = auth.uid(),
         decided_at = now(),
         updated_at = now()
   WHERE id = p_request
  RETURNING * INTO out_row;

  RETURN out_row;
END $$;

REVOKE ALL ON FUNCTION public.decide_portal_request(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_portal_request(uuid, text, uuid, text) TO authenticated;

-- THE AUDIT TRAIL. Darrell: "Approval and denial actions are recorded in an
-- audit log." door_events (0262) already is the ledger every other decision on
-- a door lands in, so this joins it rather than starting a second one.
--
-- ITS `subject` CHECK IS AN ALLOW-LIST and this widens it. Two things are
-- deliberate: the widened list NAMES 'application' as well, because 0272 (open
-- on PR #2106) adds that value and this file carries the higher number — so if
-- it merges first and mine rebuilt the constraint from 0262's two values, this
-- migration would SILENTLY DELETE its value and 0272's writes would start
-- failing. Listing a value a sibling branch adds costs nothing if that branch
-- never lands. And the whole block is skipped when door_events does not exist,
-- so the earlier chain legs that stop before 0262 still replay clean.
--
-- CORRECTION, ADDED 2026-10-12 (DR-0976). THE PARAGRAPH ABOVE IS WRONG ABOUT
-- WHAT THE STATEMENT BELOW DOES. It says "this widens it" and the statement
-- NARROWS it: the list was rebuilt from 0262's two values plus 'stay', so
-- 0263's 'document' and 0266's 'camera' were DELETED — the exact harm this
-- comment set out to avoid, done to the already-merged files while guarding
-- the unmerged sibling.
--
-- MEASURED CONSEQUENCE: lease signing (three writes in 0263) and door-camera
-- access (a trigger in 0266) raised on every write for ~28 hours, and
-- rls-isolation failed 10 consecutive runs on 0263's smoke. Restored by 0279.
-- Nothing here is changed — the SQL stays exactly as it was applied; only the
-- record is corrected, where the next reader will look.
--
-- allow-list-change: door_events_subject_check document -- DEFECT, not intent: deleted by mistake, restored by 0279 (DR-0976)
-- allow-list-change: door_events_subject_check camera -- DEFECT, not intent: deleted by mistake, restored by 0279 (DR-0976)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'door_events') THEN
    RETURN;
  END IF;

  ALTER TABLE public.door_events DROP CONSTRAINT IF EXISTS door_events_subject_check;
  ALTER TABLE public.door_events ADD CONSTRAINT door_events_subject_check
    CHECK (subject IN ('rent', 'work', 'application', 'stay', 'portal-request'));

  EXECUTE $ddl$
    CREATE OR REPLACE FUNCTION public.log_portal_decision()
    RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
    BEGIN
      IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
      END IF;
      -- Never the person's contact details: the ledger records THAT a decision
      -- happened and who made it, not a copy of what they were deciding about.
      INSERT INTO door_events (instance_id, subject, subject_id, event, from_value, to_value, by_user)
      VALUES (NEW.instance_id, 'portal-request', NEW.id, NEW.status,
              CASE WHEN TG_OP = 'UPDATE' THEN OLD.status END, NEW.status, auth.uid());
      RETURN NEW;
    END $f$;
  $ddl$;

  DROP TRIGGER IF EXISTS log_portal_decision_t ON public.tenant_portal_requests;
  CREATE TRIGGER log_portal_decision_t
    AFTER INSERT OR UPDATE OF status ON public.tenant_portal_requests
    FOR EACH ROW EXECUTE FUNCTION public.log_portal_decision();
END $$;

-- ---------------------------------------------------------------------------
-- 10. REVOKING, WITHOUT LOSING A SINGLE RECEIPT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_portal_access(p_tenancy uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inst uuid;
BEGIN
  SELECT instance_id INTO inst FROM rental_tenancies WHERE id = p_tenancy;
  IF inst IS NULL THEN
    RAISE EXCEPTION 'no such tenancy' USING ERRCODE = 'no_data_found';
  END IF;
  IF NOT coalesce(user_role_in_instance(inst) IN ('owner', 'admin'), false) THEN
    RAISE EXCEPTION 'only the landlord revokes portal access' USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- The ONE column. The lease, the rent, the payments, the work orders and the
  -- whole chronology stay exactly where they are.
  UPDATE rental_tenancies SET tenant_user_id = NULL WHERE id = p_tenancy;
END $$;

REVOKE ALL ON FUNCTION public.revoke_portal_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_portal_access(uuid) TO authenticated;

COMMENT ON TABLE public.tenant_portal_requests IS
  'A person ASKING for the tenant portal. Holds no access of any kind: the grant is rental_tenancies.tenant_user_id and decide_portal_request() is the only thing that writes it (DR-0957).';

-- The standing deny-overlays, re-run because a new instance-scoped table has
-- appeared and a read-only viewer must not be able to write it (DR-0241).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
