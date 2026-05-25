-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.2-rentals.sql
--
-- v2.2 RENTALS migration — landlord domain.
-- Depends on: schema-v2.1-infra.sql (instances, external_users, audit helpers,
--             tier helpers, disclaimers_acknowledgments).
--
-- Locked in 2026-05-25 by Darrell. Test instance: Poe Properties, 11 doors.
--
-- Source design doc: docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md
--                    (§6 Domain — Landlord, §6 renter_household_members for Q5)
--
-- Tables:
--   - rentals
--   - leases
--   - renters
--   - renter_household_members   (Q5 lock-in 2026-05-25)
--   - rent_payments
--   - maintenance_requests
--
-- Tier enforcement: rentals_tier_enforce trigger refuses inserts that would
-- exceed Family / Landlord tier limits (see v2.1-infra §4.6).
--
-- POE binding: a renter and their household members can each submit
-- maintenance requests via the external_users portal pattern (Q5 lock-in).
-- =====================================================================

BEGIN;

-- =====================================================================
-- rentals — the properties themselves
-- =====================================================================

CREATE TABLE IF NOT EXISTS rentals (
  -- Standard columns
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"new","openedAt":null,"closedAt":null,"log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  -- Domain columns
  address                 text NOT NULL,
  unit                    text,
  display_name            text NOT NULL,
  property_type           text NOT NULL CHECK (property_type IN (
    'single-family','duplex','multi-family',
    'condo','townhouse','commercial','land'
  )),
  purchase_date           date,
  purchase_price          numeric(12,2),
  current_market_value    numeric(12,2),
  mortgage_amount         numeric(12,2),
  mortgage_paid_off       boolean NOT NULL DEFAULT false,
  property_taxes_annual   numeric(12,2),
  insurance_annual        numeric(12,2),
  hoa_monthly             numeric(12,2),
  notes                   text,
  status                  text NOT NULL DEFAULT 'occupied'
                          CHECK (status IN
                            ('occupied','vacant','rehab','listed','sold','off-market'))
);

CREATE INDEX IF NOT EXISTS rentals_instance_idx ON rentals (instance_id);
CREATE INDEX IF NOT EXISTS rentals_entity_idx   ON rentals (entity_id);
CREATE INDEX IF NOT EXISTS rentals_status_idx   ON rentals (status);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY rentals_member_read   ON rentals FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY rentals_member_insert ON rentals FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY rentals_member_update ON rentals FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY rentals_owner_delete  ON rentals FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- renters — the people in the rentals
--   (the v1 word `tenants` was renamed to `instances`; real-estate renters
--    are exclusively `renters`. "Tenant" survives only in lease document text.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS renters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"new","openedAt":null,"closedAt":null,"log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  display_name             text NOT NULL,
  contact_email            text,
  contact_phone            text,
  emergency_contact_name   text,
  emergency_contact_phone  text,
  move_in_date             date,
  move_out_date            date,
  notes                    text,
  external_user_id         uuid REFERENCES external_users(id),
  household_id             uuid REFERENCES renters(id),
  relationships            jsonb NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS renters_instance_idx  ON renters (instance_id);
CREATE INDEX IF NOT EXISTS renters_household_idx ON renters (household_id);

ALTER TABLE renters ENABLE ROW LEVEL SECURITY;

CREATE POLICY renters_member_read   ON renters FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY renters_member_insert ON renters FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY renters_member_update ON renters FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY renters_owner_delete  ON renters FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- renter_household_members — household structure (Q5 lock-in 2026-05-25)
--
-- Per Darrell's 2026-05-25 ratification: renters AND their family members
-- can submit change_requests / incidents / projects / maintenance requests
-- via being represented as `external_users`. Each household member gets
-- their own portal row with explicit `permissions`.
-- =====================================================================

CREATE TABLE IF NOT EXISTS renter_household_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id),
  lifecycle       jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links           jsonb NOT NULL DEFAULT '[]',
  entity_id       uuid REFERENCES entities(id) ON DELETE SET NULL,

  household_id        uuid NOT NULL REFERENCES renters(id) ON DELETE CASCADE,
  member_renter_id    uuid REFERENCES renters(id),
  display_name        text NOT NULL,
  relationship        text CHECK (relationship IN
                        ('spouse','partner','child','parent','sibling',
                         'roommate','dependent','guest-long-term','other')),
  date_of_birth       date,
  contact_email       text,
  contact_phone       text,
  external_user_id    uuid REFERENCES external_users(id),
  can_submit_requests boolean NOT NULL DEFAULT true,
  is_lease_signer     boolean NOT NULL DEFAULT false,
  moved_in_at         date,
  moved_out_at        date,
  notes               text
);

CREATE INDEX IF NOT EXISTS renter_household_members_household_idx
  ON renter_household_members (household_id);
CREATE INDEX IF NOT EXISTS renter_household_members_external_user_idx
  ON renter_household_members (external_user_id);

ALTER TABLE renter_household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY renter_hh_member_read   ON renter_household_members FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY renter_hh_member_insert ON renter_household_members FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY renter_hh_member_update ON renter_household_members FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY renter_hh_member_owner_delete ON renter_household_members FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- leases
-- =====================================================================

CREATE TABLE IF NOT EXISTS leases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"new","openedAt":null,"closedAt":null,"log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  rental_id           uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  renter_id           uuid NOT NULL REFERENCES renters(id) ON DELETE RESTRICT,
  lease_start         date NOT NULL,
  lease_end           date NOT NULL,
  monthly_rent        numeric(12,2) NOT NULL,
  security_deposit    numeric(12,2),
  pet_deposit         numeric(12,2),
  lease_terms         text,
  document_uri        text,
  renewal_option      text CHECK (renewal_option IN
                        ('auto-renew','month-to-month-after-term','expire')),
  late_fee_amount     numeric(12,2),
  late_fee_after_days int NOT NULL DEFAULT 5,
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN
                        ('draft','active','expired','terminated-early','renewed'))
);

CREATE INDEX IF NOT EXISTS leases_instance_idx ON leases (instance_id);
CREATE INDEX IF NOT EXISTS leases_rental_idx   ON leases (rental_id);
CREATE INDEX IF NOT EXISTS leases_renter_idx   ON leases (renter_id);
CREATE INDEX IF NOT EXISTS leases_active_idx   ON leases (status) WHERE status = 'active';

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY leases_member_read   ON leases FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY leases_member_insert ON leases FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY leases_member_update ON leases FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY leases_owner_delete  ON leases FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- rent_payments
-- =====================================================================

CREATE TABLE IF NOT EXISTS rent_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"pending","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  lease_id         uuid NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  period_month     date NOT NULL,
  expected_amount  numeric(12,2) NOT NULL,
  received_amount  numeric(12,2) NOT NULL DEFAULT 0,
  received_at      timestamptz,
  method           text CHECK (method IN
                     ('cash','check','ach','zelle','venmo','cashapp','other')),
  late_fee_applied numeric(12,2) NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN
                     ('pending','received','partial','late','waived','reversed')),
  transaction_id   uuid REFERENCES transactions(id),
  notes            text,
  UNIQUE (lease_id, period_month)
);

CREATE INDEX IF NOT EXISTS rent_payments_lease_period_idx
  ON rent_payments (lease_id, period_month DESC);

ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY rent_pay_member_read   ON rent_payments FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY rent_pay_member_insert ON rent_payments FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY rent_pay_member_update ON rent_payments FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY rent_pay_owner_delete  ON rent_payments FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- maintenance_requests
-- =====================================================================

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"new","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  rental_id           uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  renter_id           uuid REFERENCES renters(id),
  submitted_via       text CHECK (submitted_via IN
                        ('renter-portal','phone','email','sms','in-person','owner-discovery')),
  category            text NOT NULL CHECK (category IN
                        ('plumbing','electrical','hvac','appliance','roofing',
                         'pest','flooring','exterior','structural','cosmetic','other')),
  urgency             text NOT NULL DEFAULT 'normal'
                        CHECK (urgency IN ('emergency','urgent','normal','low')),
  description         text NOT NULL,
  estimated_cost      numeric(12,2),
  actual_cost         numeric(12,2),
  vendor_name         text,
  assigned_to_user_id uuid REFERENCES auth.users(id),
  -- incident_id FK will be ADDed in schema-v2.8-ops.sql once incidents table exists
  status              text NOT NULL DEFAULT 'new'
                        CHECK (status IN
                          ('new','triaging','scheduled','in-progress',
                           'awaiting-parts','resolved','declined')),
  scheduled_at        timestamptz,
  resolved_at         timestamptz
);

CREATE INDEX IF NOT EXISTS maint_req_rental_idx    ON maintenance_requests (rental_id);
CREATE INDEX IF NOT EXISTS maint_req_open_idx
  ON maintenance_requests (status) WHERE status NOT IN ('resolved','declined');

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY maint_req_member_read   ON maintenance_requests FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY maint_req_member_insert ON maintenance_requests FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY maint_req_member_update ON maintenance_requests FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY maint_req_owner_delete  ON maintenance_requests FOR DELETE
  USING (user_role_in_instance(instance_id) = 'owner');

-- =====================================================================
-- Tier enforcement trigger on rentals (Family / Landlord / Business gates)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rentals_tier_enforce()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_door_count int;
  v_tier text;
BEGIN
  v_tier := instance_active_tier(NEW.instance_id);

  -- Family-tier: homes only, no third-party renters
  -- (a third-party renter is a renter row whose external_user_id is set —
  --  i.e. someone given portal access who is not part of the family-instance's
  --  internal membership.)
  IF v_tier = 'family' AND TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM leases l
    JOIN renters r ON r.id = l.renter_id
    WHERE l.rental_id = NEW.id
      AND r.external_user_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Family tier: rentals cannot have non-family renters. '
      'Upgrade to Landlord or Business tier.';
  END IF;

  -- Landlord-tier: 10-door cap
  SELECT COUNT(*) INTO v_door_count FROM rentals
    WHERE instance_id = NEW.instance_id AND status != 'sold';
  IF v_tier = 'landlord' AND v_door_count > 10 THEN
    RAISE EXCEPTION
      'Landlord tier: maximum 10 active doors. Currently % at instance %; upgrade to Premium or Business.',
      v_door_count, NEW.instance_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rentals_tier_enforce_trg ON rentals;
CREATE TRIGGER rentals_tier_enforce_trg
  AFTER INSERT OR UPDATE OF status ON rentals
  FOR EACH ROW EXECUTE FUNCTION rentals_tier_enforce();

-- Optional: a CHECK that family-tier instances cannot link external_users to renters
-- via leases. Implemented as a constraint trigger on leases for finer control.
CREATE OR REPLACE FUNCTION public.leases_family_tier_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier text;
  v_has_external boolean;
BEGIN
  v_tier := instance_active_tier(NEW.instance_id);
  IF v_tier = 'family' THEN
    SELECT (external_user_id IS NOT NULL) INTO v_has_external
      FROM renters WHERE id = NEW.renter_id;
    IF v_has_external THEN
      RAISE EXCEPTION
        'Family tier: lease % cannot reference a renter with external portal access. '
        'Upgrade to Landlord or Business tier.', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leases_family_tier_check_trg ON leases;
CREATE TRIGGER leases_family_tier_check_trg
  BEFORE INSERT OR UPDATE OF renter_id ON leases
  FOR EACH ROW EXECUTE FUNCTION leases_family_tier_check();

COMMIT;

-- =====================================================================
-- End of schema-v2.2-rentals.sql
-- =====================================================================
