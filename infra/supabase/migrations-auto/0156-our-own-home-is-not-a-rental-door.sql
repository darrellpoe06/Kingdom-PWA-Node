-- =============================================================================
-- 0156 — our own home is not a rental door, and every property keeps a
--        mechanical history of its systems and their issues
-- =============================================================================
-- Darrell, 2026-08-28: "2111 Talans Dr. is not a rental location it is our own
-- home only in books for our mortgage to be inside our books for showing
-- payments etc... not in the Properties tab because it's not for renting...
-- we still want to calculate the funds and other home ownership type things
-- like keeping a mechanical history of the system's and issues like all our
-- properties etc..." and, immediately after: "Real Estate keeps it just as our
-- home and asset."
--
-- THE DEFECT THIS CLOSES. rentals row 12a697f9 (2111 Talans Dr) has carried
-- status = 'owner-occupied' and property_type = 'primary-home' since it was
-- entered, and app/src/lib/rental-portfolio.js:17 has honoured that on the Real
-- Estate side for months (isPersonalProp — excluded from the door count and the
-- rent rollup, still present as a property and a mortgage). The Poe Properties
-- board, shipped yesterday, read neither field. So the family home appeared on
-- the rental board reading "AVAILABLE - no rent on record" with QR TO APPLY,
-- ADVERTISE and START A TENANCY beside it. Measured on the live build, not
-- inferred: the screenshot is the observation.
--
-- The app-side fix is a filter. This file is the part a filter cannot do:
--
--   1. public_vacancies() must never be able to return a home. The RPC is the
--      public listing — anon and authenticated both hold EXECUTE — and its only
--      gate was `listed_at IS NOT NULL`. One stray listing timestamp on the
--      family's own address would publish where they live to the open internet.
--      A UI filter cannot reach that; the function has to refuse for itself.
--   2. The CHECK makes the stray timestamp unwritable in the first place. Two
--      independent refusals, because this is the one row where being wrong is
--      not a display bug (DR-0076 §7 — high stakes get a second, independent
--      method).
--
-- WHAT IS DELIBERATELY *NOT* DONE HERE: nothing is removed, hidden or
-- restricted about the home's records. It keeps its rentals row, its mortgage,
-- its payments, its rooms, its photographs, its documents and its chronology,
-- because the ask is that it stay in the books and keep a mechanical history
-- "like all our properties". It stops being OFFERED. It does not stop being OURS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A home can never be advertised. Written as one predicate so the RPC below and
-- the CHECK cannot drift apart: change the definition of "ours" in one place.
-- IMMUTABLE + a plain expression, so a CHECK constraint may call it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rental_is_own_home(p_status text, p_property_type text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT coalesce(p_status, '') = 'owner-occupied'
      OR coalesce(p_property_type, '') IN ('primary-home', 'secondary-home')
$$;

COMMENT ON FUNCTION public.rental_is_own_home(text, text) IS
  'True when a rentals row is the family''s own home rather than a rental door. The single definition behind the vacancies RPC, the never-advertised CHECK, and the app''s isOwnHome().';

DO $$
BEGIN
  -- Verified writable before adding: all twelve rentals rows carry
  -- listed_at IS NULL as of 2026-08-28, so nothing existing violates this.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rentals_home_is_never_listed') THEN
    ALTER TABLE public.rentals ADD CONSTRAINT rentals_home_is_never_listed
      CHECK (listed_at IS NULL OR NOT public.rental_is_own_home(status, property_type));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- The public listing refuses to answer for a home.
--
-- Same RETURNS shape as 0155, so CREATE OR REPLACE is legal here and no DROP is
-- needed (0153 is the counter-example: it WIDENED the shape without a DROP and
-- rolled the whole file back — migration-return-type-guard.mjs now fails the
-- build for that, and it is silent here precisely because nothing widened).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_vacancies()
RETURNS TABLE (
  id            uuid,
  label         text,
  unit          text,
  city          text,
  state         text,
  property_type text,
  rent          numeric,
  note          text,
  listed_at     timestamptz,
  bedrooms      integer,
  bathrooms     numeric,
  offering      text,
  nightly_rate  numeric,
  min_stay_nights integer
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
         r.listed_at,
         (SELECT count(*)::integer FROM property_rooms pr
           WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bedroom') AS bedrooms,
         (SELECT coalesce(sum(CASE WHEN pr.name ~* '(half|powder)' THEN 0.5 ELSE 1 END), 0)::numeric
            FROM property_rooms pr
           WHERE pr.rental_ref = r.id AND pr.archived_at IS NULL AND pr.kind = 'bathroom') AS bathrooms,
         coalesce(r.offering, 'long-term') AS offering,
         r.nightly_rate,
         r.min_stay_nights
    FROM rentals r
   WHERE r.listed_at IS NOT NULL
     -- Our own home is never on offer, whatever else the row says.
     AND NOT public.rental_is_own_home(r.status, r.property_type)
     AND NOT EXISTS (
       SELECT 1 FROM rental_tenancies t
        WHERE t.rental_ref = r.slug AND t.status = 'active'
     )
   ORDER BY r.listed_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancies() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- THE MECHANICAL HISTORY. "keeping a mechanical history of the system's and
-- issues like all our properties" — so this is not a home-only feature. Every
-- door gets it; the home is simply one of the doors that has one.
--
-- Two tables, because a system and an event about it are different lifetimes.
-- A furnace is a THING that sits in a house for twenty years and carries an age,
-- a make, a model and a warranty. A service call is a MOMENT. Folding them into
-- one table would either lose the moment (one row, overwritten) or lose the
-- thing (rows that each re-describe the same furnace and eventually disagree).
--
-- maintenance_requests already exists and is NOT what this is. That table is a
-- work order: something is broken, someone is dispatched, it costs money and it
-- closes. This is the equipment record behind it — what is installed, how old
-- it is, and everything that has ever happened to it. A work order can point at
-- a system (request_id below), which is how "the issues" join "the systems".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_systems (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL,
  rental_ref      uuid NOT NULL,              -- the door (rentals.id — UUID, not the slug)
  room_id         uuid,                       -- optional: where it physically is
  name            text NOT NULL,              -- "Furnace", "Water heater", "Roof"
  kind            text NOT NULL DEFAULT 'other',
  make            text NOT NULL DEFAULT '',
  model           text NOT NULL DEFAULT '',
  serial          text NOT NULL DEFAULT '',
  location_note   text NOT NULL DEFAULT '',   -- "basement, north wall"
  installed_on    date,                       -- NULL = unknown, never guessed
  expected_life_years integer,
  warranty_until  date,
  service_interval_months integer,            -- NULL = nothing scheduled
  last_service_on date,
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid,
  updated_at      timestamptz,
  updated_by      uuid,
  archived_at     timestamptz,                -- replaced or removed; history stands
  archived_by     uuid
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_systems_kind_check') THEN
    ALTER TABLE public.property_systems ADD CONSTRAINT property_systems_kind_check
      CHECK (kind IN ('heating','cooling','water-heater','plumbing','electrical',
                      'roof','foundation','windows','appliance','septic','well',
                      'sump','gutters','driveway','landscape','safety','other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_systems_name_present') THEN
    ALTER TABLE public.property_systems ADD CONSTRAINT property_systems_name_present
      CHECK (length(btrim(name)) > 0);
  END IF;
  -- A life or an interval of zero months is not a schedule, it is a typo that
  -- would report every system overdue forever.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_systems_life_positive') THEN
    ALTER TABLE public.property_systems ADD CONSTRAINT property_systems_life_positive
      CHECK (expected_life_years IS NULL OR expected_life_years >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_systems_interval_positive') THEN
    ALTER TABLE public.property_systems ADD CONSTRAINT property_systems_interval_positive
      CHECK (service_interval_months IS NULL OR service_interval_months >= 1);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS property_systems_live_name_idx
  ON public.property_systems(rental_ref, lower(btrim(name))) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS property_systems_door_idx ON public.property_systems(rental_ref, kind);

GRANT SELECT, INSERT, UPDATE ON public.property_systems TO authenticated;
ALTER TABLE public.property_systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_systems_read   ON public.property_systems;
DROP POLICY IF EXISTS property_systems_write  ON public.property_systems;
DROP POLICY IF EXISTS property_systems_update ON public.property_systems;

-- The equipment describes the building, not the household — the same standing
-- as property_rooms. A tenant may see that the furnace is fourteen years old;
-- only management may edit the record, because it is the basis of a capital
-- decision and, on the home, of the family's own planning.
CREATE POLICY property_systems_read ON public.property_systems FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member','viewer','assistant'));
CREATE POLICY property_systems_write ON public.property_systems FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY property_systems_update ON public.property_systems FOR UPDATE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- No DELETE, ever. archived_at is the removal; a replaced furnace's service
-- history is exactly what tells you whether the replacement was overdue.

CREATE TABLE IF NOT EXISTS public.property_system_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL,
  system_ref    uuid NOT NULL,          -- property_systems.id
  rental_ref    uuid NOT NULL,          -- denormalised so a door's whole mechanical
                                        -- history reads in one query
  request_id    uuid,                   -- optional: the work order this came from
  kind          text NOT NULL,
  event_date    date NOT NULL,
  summary       text NOT NULL,
  vendor_name   text NOT NULL DEFAULT '',
  cost          numeric,
  notes         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid,
  author_label  text NOT NULL DEFAULT ''
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_system_events_kind_check') THEN
    ALTER TABLE public.property_system_events ADD CONSTRAINT property_system_events_kind_check
      CHECK (kind IN ('installed','serviced','inspected','repaired','issue',
                      'replaced','removed','warranty-claim','note'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_system_events_summary_present') THEN
    ALTER TABLE public.property_system_events ADD CONSTRAINT property_system_events_summary_present
      CHECK (length(btrim(summary)) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_system_events_cost_not_negative') THEN
    ALTER TABLE public.property_system_events ADD CONSTRAINT property_system_events_cost_not_negative
      CHECK (cost IS NULL OR cost >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS property_system_events_system_idx ON public.property_system_events(system_ref, event_date DESC);
CREATE INDEX IF NOT EXISTS property_system_events_door_idx   ON public.property_system_events(rental_ref, event_date DESC);

GRANT SELECT, INSERT ON public.property_system_events TO authenticated;
ALTER TABLE public.property_system_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_system_events_read  ON public.property_system_events;
DROP POLICY IF EXISTS property_system_events_write ON public.property_system_events;

CREATE POLICY property_system_events_read ON public.property_system_events FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member','viewer','assistant'));
CREATE POLICY property_system_events_write ON public.property_system_events FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- No UPDATE and no DELETE: an event is what happened on a date. It is corrected
-- by recording what is true now, the way the rest of this schema treats
-- evidence — the same reason property_photos is append-only.

-- The overlays must know about the two new instance-scoped tables, or a viewer
-- or assistant would fall straight through their policies and be able to write
-- equipment records. Caught by the tenancy guard on this exact file before it
-- ever ran (src/__tests__/tenancy-guard.test.js — checkViewerOverlay), which is
-- what a proven-to-catch gate is for: I forgot, and the build said so.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
