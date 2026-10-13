-- =============================================================================
-- 0152 — see the options WITHOUT an account: listed vacancies + an application
-- =============================================================================
-- Darrell, 2026-08-26: "Ask who they are landlord tenant or applicant... others?
-- ... Options to see inventory and rented or available.... etc..." and then
-- "See options without a user account..."
--
-- Until now the Poe Properties door had exactly one thing to say to someone with
-- no door: "a landlord invites you." An APPLICANT — the person most likely to
-- open a property app first — hit a dead end. This migration gives the door two
-- honest things to offer with no sign-in at all: what is available, and a way to
-- apply for it.
--
-- ── WHY LISTING IS AN OPT-IN, NOT "no tenancy = vacant" ──────────────────────
-- Deriving vacancy would publish every empty house the family owns to anonymous
-- readers the moment a tenant moved out — an unoccupied address advertised by
-- our own software, with nobody choosing to. So a unit is public ONLY when the
-- landlord lists it (`listed_at`), and even then the RPC returns a coarse
-- location — city/state and the unit label — never the street address. The
-- address is given to a real applicant by a human, the way it already works.
--
-- ── WHAT MAY NEVER LEAVE THE INSTANCE ───────────────────────────────────────
-- `rentals` carries purchase_price, mortgage_balance, mortgage_rate, reserves,
-- current_market_value and the current tenant's NAME. The vacancy RPC is
-- column-explicit for exactly this reason: it can only ever return the five
-- fields named in its RETURNS TABLE, so a later `select *` cannot leak the
-- family's balance sheet to the public internet. The table's own RLS is
-- untouched — no anon policy is added to `rentals`, ever.
--
-- ── THE APPLICATION ─────────────────────────────────────────────────────────
-- `rental_applications` follows the proven anon-capture shape (0055-era
-- conference_public_registrations: anon INSERT with check true, owner/admin
-- read). It stores the intake payload as jsonb because the field set is the
-- family's own form (modules/properties/intake.js), and that form will change.
-- NO SSN, NO DRIVER'S LICENSE — the app refuses to hold either (intake.js marks
-- them collect:'out-of-band'), and the CHECK below makes that refusal structural
-- rather than a convention a later caller could forget.
--
-- IDEMPOTENT. Additive. DEPENDS ON: 0150/0151 (the properties spine).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. A door is public only when the landlord says so.
-- ---------------------------------------------------------------------------
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS listed_at   timestamptz;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS listed_rent numeric;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS listed_note text;
COMMENT ON COLUMN rentals.listed_at IS
  'Set when the landlord LISTS this unit publicly. Null = never shown to anyone without access. Vacancy is never derived from the absence of a tenancy (DR-0313).';

-- ---------------------------------------------------------------------------
-- 2. public_vacancies() — the only thing an anonymous visitor may read.
--    Column-explicit by design: it cannot return a column it does not name.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_vacancies()
RETURNS TABLE (
  id           uuid,
  label        text,
  unit         text,
  city         text,
  state        text,
  property_type text,
  rent         numeric,
  note         text,
  listed_at    timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id,
         coalesce(nullif(r.display_name, ''), nullif(r.city, ''), 'Available unit') AS label,
         r.unit,
         r.city,
         r.state,
         r.property_type,
         coalesce(r.listed_rent, r.monthly_rent) AS rent,
         r.listed_note AS note,
         r.listed_at
    FROM rentals r
   WHERE r.listed_at IS NOT NULL
     -- Listed AND actually free: a door with an active tenancy is never offered.
     AND NOT EXISTS (
       SELECT 1 FROM rental_tenancies t
        WHERE t.rental_ref = r.slug AND t.status = 'active'
     )
   ORDER BY r.listed_at DESC
$$;
REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. rental_applications — an application from someone with NO account.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid REFERENCES instances(id) ON DELETE CASCADE,
  rental_id     uuid REFERENCES rentals(id) ON DELETE SET NULL,
  applicant_name  text NOT NULL,
  applicant_email text,
  applicant_phone text,
  answers       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted','reviewing','approved','declined','withdrawn')),
  decision_reason text,
  decided_by    uuid REFERENCES auth.users(id),
  decided_at    timestamptz,
  submitted_by  uuid REFERENCES auth.users(id),   -- null when there is no account
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- The app refuses to hold these, structurally (intake.js collect:'out-of-band').
  CONSTRAINT rental_applications_no_ssn CHECK (
    NOT (answers ? 'applicant.ssn') AND NOT (answers ? 'applicant.driversLicense')
  ),
  -- A decision must carry its reason: DR-0101 §7 consistency is not optional.
  CONSTRAINT rental_applications_decision_has_reason CHECK (
    status NOT IN ('approved','declined')
    OR (decision_reason IS NOT NULL AND length(trim(decision_reason)) >= 10)
  )
);
CREATE INDEX IF NOT EXISTS rental_applications_instance_idx ON rental_applications(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rental_applications_rental_idx   ON rental_applications(rental_id);

GRANT SELECT, INSERT, UPDATE ON rental_applications TO authenticated;
GRANT INSERT ON rental_applications TO anon;
ALTER TABLE rental_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_applications_public_insert ON rental_applications;
DROP POLICY IF EXISTS rental_applications_read ON rental_applications;
DROP POLICY IF EXISTS rental_applications_update ON rental_applications;
-- Anyone may APPLY (that is what an application is); nobody may read back.
CREATE POLICY rental_applications_public_insert ON rental_applications FOR INSERT TO anon, authenticated
  WITH CHECK (true);
-- Only the instance's own people, or a manager granted application.review, read
-- or decide. An applicant cannot read even their own row through this table —
-- the decision reaches them from a human, not from a database read.
CREATE POLICY rental_applications_read ON rental_applications FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR EXISTS (SELECT 1 FROM delegated_capabilities dc
                     WHERE dc.instance_id = rental_applications.instance_id
                       AND dc.grantee_user_id = auth.uid()
                       AND dc.capability = 'application.review'
                       AND dc.setting = 'allow'));
CREATE POLICY rental_applications_update ON rental_applications FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR EXISTS (SELECT 1 FROM delegated_capabilities dc
                          WHERE dc.instance_id = rental_applications.instance_id
                            AND dc.grantee_user_id = auth.uid()
                            AND dc.capability = 'application.review'
                            AND dc.setting = 'allow'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR EXISTS (SELECT 1 FROM delegated_capabilities dc
                          WHERE dc.instance_id = rental_applications.instance_id
                            AND dc.grantee_user_id = auth.uid()
                            AND dc.capability = 'application.review'
                            AND dc.setting = 'allow'));

COMMENT ON TABLE rental_applications IS
  'Applications from people with or without an account. Anyone may insert; only the instance and an application.review manager may read or decide. No SSN or driver''s license, enforced by CHECK (DR-0313).';

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
