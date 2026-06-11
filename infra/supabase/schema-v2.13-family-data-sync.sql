-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.13-family-data-sync.sql
--
-- v2.13 FAMILY DATA SYNC — LIVE-ALIGNED. ✅ APPLIED 2026-06-10 to the
-- cloud project (mjjlevhdufpaplypnqrv) via Studio SQL Editor, driven by
-- Claude in Darrell's signed-in session. Verified by catalog query after
-- the run: 12/12 rentals columns, 2/2 incidents columns, contractors_1099
-- present with 4 policies, trigger NULL-guard confirmed.
--
-- *** THE LIVE-SHAPE DISCOVERY (read before touching rentals DDL) ***
-- The cloud `rentals` and `incidents` tables are the v1.2-numeric-sync
-- shapes evolved (instance_id, slug, entity_slug, free-text status, no
-- CHECKs) — NOT the v2.2 shapes. schema-v2.2's CREATE TABLE rentals
-- no-opped because the v1.2 table already existed (IF NOT EXISTS), while
-- the REST of v2.2 (renters, leases, rent_payments, the tier trigger)
-- did apply. The repo's schema files are NOT a record of applied state;
-- verify information_schema before mapping client code. This superseded
-- schema-v2.2.2-rentals-sync-amendments.sql (never applied — it targeted
-- the phantom v2.2 columns and its backfill referenced a links column
-- that doesn't exist live, so its transaction rolled back).
--
-- What this migration does:
--  1. rentals — adds the columns the app carries that the live table
--     lacked. Native live columns already in use: slug (unique with
--     instance_id), entity_slug, address, unit, monthly_rent,
--     mortgage_payment (monthly P&I), status, notes, tenant_name.
--  2. incidents — adds the two QC-trail columns (lifecycle, dispatch).
--     Live table natively has slug, entity_slug, linked_to_kind,
--     linked_to_slug, and no CHECKs (the app vocab stores as-is).
--  3. contractors_1099 — creates the shared 1099 worker roster in this
--     database's native style, columns 1:1 with the app's shape.
--  4. rentals_tier_enforce — replaced with a live-shape-safe version:
--     NULL tier (no active subscription — both current instances) means
--     NO caps; the family's own homes (primary-home / secondary-home /
--     owner-occupied) are never counted as rental doors; the v2.2.1
--     notification call is dropped (rentals_tier_notify never existed
--     in this database).
-- =====================================================================

BEGIN;

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS current_market_value numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS mortgage_balance numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS mortgage_rate numeric(6,3);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS mortgage_escrow numeric(12,2);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS rent_actual numeric(12,2);

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS lifecycle jsonb;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS dispatch jsonb;

CREATE TABLE IF NOT EXISTS contractors_1099 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  slug text,
  entity_slug text,
  direction text NOT NULL DEFAULT 'outbound',
  name text NOT NULL,
  phone text,
  email text,
  role text,
  ytd_paid numeric(12,2) NOT NULL DEFAULT 0,
  ytd_received numeric(12,2) NOT NULL DEFAULT 0,
  monthly numeric(12,2) NOT NULL DEFAULT 0,
  monthly_expected numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text
);
CREATE UNIQUE INDEX IF NOT EXISTS contractors_instance_slug_uidx ON contractors_1099 (instance_id, slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS contractors_instance_idx ON contractors_1099 (instance_id);
ALTER TABLE contractors_1099 ENABLE ROW LEVEL SECURITY;
CREATE POLICY contractors_member_read ON contractors_1099 FOR SELECT USING (user_in_instance(instance_id));
CREATE POLICY contractors_member_insert ON contractors_1099 FOR INSERT WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY contractors_member_update ON contractors_1099 FOR UPDATE USING (user_in_instance(instance_id)) WITH CHECK (user_in_instance(instance_id));
CREATE POLICY contractors_member_delete ON contractors_1099 FOR DELETE USING (user_in_instance(instance_id));

CREATE OR REPLACE FUNCTION public.rentals_tier_enforce()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_tier text;
  v_doors int;
BEGIN
  v_tier := instance_active_tier(NEW.instance_id);
  IF v_tier IS NULL THEN RETURN NEW; END IF;

  IF v_tier = 'family' AND TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM leases l JOIN renters r ON r.id = l.renter_id
    WHERE l.rental_id = NEW.id AND r.external_user_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Family tier: rentals cannot have non-family renters. Upgrade to Landlord or Business tier.';
  END IF;

  SELECT COUNT(*) INTO v_doors FROM rentals
   WHERE instance_id = NEW.instance_id
     AND COALESCE(status,'') NOT IN ('sold','owner-occupied')
     AND COALESCE(property_type,'') NOT IN ('primary-home','secondary-home');

  IF v_tier = 'family' AND v_doors > 1 THEN
    RAISE EXCEPTION 'Family tier: maximum 1 active rental door (currently %).', v_doors;
  END IF;
  IF v_tier = 'landlord' AND v_doors > 10 THEN
    RAISE EXCEPTION 'Landlord tier: maximum 10 active doors (currently %).', v_doors;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rentals_tier_enforce_trg ON rentals;
CREATE TRIGGER rentals_tier_enforce_trg
  AFTER INSERT OR UPDATE OF status, property_type ON rentals
  FOR EACH ROW EXECUTE FUNCTION rentals_tier_enforce();

COMMIT;

-- =====================================================================
-- End of schema-v2.13-family-data-sync.sql (applied 2026-06-10)
-- =====================================================================
