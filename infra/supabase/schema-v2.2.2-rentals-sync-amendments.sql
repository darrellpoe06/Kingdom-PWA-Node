-- =====================================================================
-- ⚠️ SUPERSEDED — NEVER APPLIED. DO NOT RUN. (2026-06-10, same day.)
-- This file targeted the v2.2 rentals shape, but the LIVE cloud rentals
-- table turned out to be the v1.2-numeric-sync shape evolved — v2.2's
-- CREATE TABLE no-opped against the pre-existing v1.2 table. The run of
-- this file rolled back (its backfill referenced a links column that
-- doesn't exist live). Superseded by schema-v2.13-family-data-sync.sql,
-- which is live-aligned and WAS applied 2026-06-10. Kept for the record.
-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.2.2-rentals-sync-amendments.sql
--
-- v2.2.2 RENTALS SYNC AMENDMENTS (2026-06-10, review follow-up to the
-- feat/rentals-table-sync wedge, PR #24).
-- Depends on: schema-v2.2-rentals.sql, schema-v2.2.1-rentals-amendments.sql.
--
-- APPLY THIS IN THE CLOUD STUDIO SQL EDITOR **BEFORE** TESTING THE PR #24
-- PREVIEW. The client on that branch writes the new columns (slug, city,
-- state, zip) and the full local status / property-type vocab; inserts
-- will fail against a database still on v2.2.1.
--
-- Four amendments, all in service of honest data flow (no value gets
-- faked to satisfy a CHECK, no field silently stays behind on one device):
--
--  1. `slug` becomes a real column with a per-instance unique index.
--     v2.2 had no slug column, so the first client rode the local slug
--     inside the `links` jsonb — workable, but dedup was client-side
--     only and two devices doing their first sign-in concurrently could
--     double-insert the same property. The unique index closes that race
--     at the database. Existing rows are backfilled from `links`.
--
--  2. `city` / `state` / `zip` columns. The app builds Zillow / Realtor /
--     Redfin / county-assessor lookups from address + city + state + zip;
--     without these columns a property adopted on a second device had a
--     bare street address and those links degraded.
--
--  3. The status and property_type CHECKs widen to the union of the
--     remote occupancy vocab and the app's richer local vocab. The v0
--     client had to flatten 'primary-home' to 'single-family' and
--     'late' to 'occupied' (lossy, one-way). Now the true value is
--     stored and syncs two-way. The original six occupancy statuses
--     stay valid so rows written by the v0 soak client are untouched.
--
--  4. The tier door-count stops counting the family's own homes.
--     rentals_tier_enforce counted every row with status != 'sold' as a
--     rental door, so a primary residence consumed the Family-tier
--     single-door cap (Q3 lock-in) or one of the Landlord tier's ten.
--     A home the family lives in is not a rental door. Counts now
--     exclude property_type 'primary-home' / 'secondary-home' and
--     status 'owner-occupied'. The Family no-third-party-renters check
--     and the notification-on-refusal behavior (Q4 lock-in) carry
--     forward unchanged from v2.2.1.
--
-- POE binding: unchanged — the trigger refuses, notifies, and the human
-- has the last word on upgrading.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. slug column + backfill from links + per-instance unique index
-- ---------------------------------------------------------------------
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS slug text;

UPDATE rentals
   SET slug = (
     SELECT t.v->>'id'
       FROM jsonb_array_elements(links) AS t(v)
      WHERE t.v->>'type' = 'local-slug'
      LIMIT 1
   )
 WHERE slug IS NULL
   AND jsonb_typeof(links) = 'array';

-- If this index creation fails with a duplicate-key error, the soak
-- left two rows with the same slug (the client-side dedup race this
-- index exists to close). The rentals table has no production data yet
-- (PR #24 never merged), so clear the soak rows and re-run:
--   DELETE FROM rentals;  -- soak/test rows only — verify first
CREATE UNIQUE INDEX IF NOT EXISTS rentals_instance_slug_uniq
  ON rentals (instance_id, slug)
  WHERE slug IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2. city / state / zip travel with the property
-- ---------------------------------------------------------------------
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS city  text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS zip   text;

-- ---------------------------------------------------------------------
-- 3. widen the CHECKs to the union vocab (remote occupancy + local app)
--    Postgres auto-named the inline v2.2 constraints <table>_<col>_check.
-- ---------------------------------------------------------------------
ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_property_type_check;
ALTER TABLE rentals ADD CONSTRAINT rentals_property_type_check
  CHECK (property_type IN (
    'single-family','duplex','multi-family','condo','townhouse',
    'commercial','land',
    'primary-home','secondary-home','vacation','other'
  ));

ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check;
ALTER TABLE rentals ADD CONSTRAINT rentals_status_check
  CHECK (status IN (
    -- original v2.2 occupancy vocab (kept for v0-soak rows + reporting)
    'occupied','vacant','rehab','listed','sold','off-market',
    -- app rent-collection vocab (now stored as-is, syncs two-way)
    'paying','late','for-sale','owner-occupied','seasonal','unrented'
  ));

-- ---------------------------------------------------------------------
-- 4. door-counts exclude the family's own homes
--    (function body otherwise identical to v2.2.1; rentals_tier_notify
--    is unchanged and not recreated here)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rentals_tier_enforce()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_door_count   int;
  v_active_doors int;
  v_tier         text;
  v_msg          text;
BEGIN
  v_tier := instance_active_tier(NEW.instance_id);

  -- Family-tier: no third-party renters (carried forward from v2.2)
  IF v_tier = 'family' AND TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM leases l
    JOIN renters r ON r.id = l.renter_id
    WHERE l.rental_id = NEW.id
      AND r.external_user_id IS NOT NULL
  ) THEN
    v_msg := 'Family tier: rentals cannot have non-family renters. '
          || 'Upgrade to Landlord or Business tier.';
    PERFORM rentals_tier_notify(NEW.instance_id, NEW.id, v_tier, v_msg);
    RAISE EXCEPTION '%', v_msg;
  END IF;

  -- Family-tier: single-door cap (Q3 lock-in 2026-05-25). v2.2.2: the
  -- family's own homes are not rental doors and do not consume the cap.
  IF v_tier = 'family' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_active_doors FROM rentals
      WHERE instance_id = NEW.instance_id
        AND status NOT IN ('sold','owner-occupied')
        AND property_type NOT IN ('primary-home','secondary-home');
    IF v_active_doors > 1 THEN
      v_msg := 'Family tier: maximum 1 active rental door. '
            || 'Currently ' || v_active_doors || ' at this instance; '
            || 'upgrade to Landlord (up to 10 doors) or Business (up to 50) tier.';
      PERFORM rentals_tier_notify(NEW.instance_id, NEW.id, v_tier, v_msg);
      RAISE EXCEPTION '%', v_msg;
    END IF;
  END IF;

  -- Landlord-tier: 10-door cap (carried forward; same home exclusion)
  IF v_tier = 'landlord' THEN
    SELECT COUNT(*) INTO v_door_count FROM rentals
      WHERE instance_id = NEW.instance_id
        AND status NOT IN ('sold','owner-occupied')
        AND property_type NOT IN ('primary-home','secondary-home');
    IF v_door_count > 10 THEN
      v_msg := 'Landlord tier: maximum 10 active doors. '
            || 'Currently ' || v_door_count || ' at this instance; '
            || 'upgrade to Premium or Business tier.';
      PERFORM rentals_tier_notify(NEW.instance_id, NEW.id, v_tier, v_msg);
      RAISE EXCEPTION '%', v_msg;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach so the cap also re-checks when a property is re-classified
-- (e.g. primary-home -> duplex turns a non-door into a door).
DROP TRIGGER IF EXISTS rentals_tier_enforce_trg ON rentals;
CREATE TRIGGER rentals_tier_enforce_trg
  AFTER INSERT OR UPDATE OF status, property_type ON rentals
  FOR EACH ROW EXECUTE FUNCTION rentals_tier_enforce();

COMMIT;

-- =====================================================================
-- End of schema-v2.2.2-rentals-sync-amendments.sql
-- =====================================================================
