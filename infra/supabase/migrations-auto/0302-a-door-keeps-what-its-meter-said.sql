-- =============================================================================
-- 0302 — a door keeps what its meter said, and every file that said it
-- =============================================================================
-- Darrell 2026-10-18: "I want my home energy system to be incorporated into
-- the PoeTech App... evaluate the DRs..."  The record is DR-1098.
--
-- REALITY-TRACE (DR-0061). Before this migration the repo held NO energy data
-- of any kind: a search of app/, infra/, backend/ and scripts/ for enphase,
-- powerwall, emporia, kwh, green button, inverter and smart meter returned only
-- lesson prose (L221, L236) and test fixtures. So the Energy tab has to draw
-- from a real row or draw nothing, and these are the rows. No seed, no demo
-- meter, no default: an empty table is the honest state of a door whose meter
-- file nobody has imported yet.
--
-- WHY A DOOR AND NOT A HOUSEHOLD. A meter belongs to a building. The family's
-- own home is one of the properties (0156: "our own home is not a rental
-- door", and systems.js: "like all our properties"), so the meter is keyed by
-- rentals.id exactly as property_systems is, and the same tab serves the home
-- and every rental that has its own meter.
--
-- WHY THE READ IS NARROWER THAN property_systems. The furnace's age describes
-- the building, so 0156 lets a viewer and the assistant read it. A meter's
-- hourly reads describe the PEOPLE: when the house wakes, when it sleeps, and
-- which days it stands empty. That is the one thing a stranger casing a house
-- wants to know. So the read is owner, admin and member only. A viewer and the
-- assistant read nothing here, and no client check stands in for that
-- (DR-0060): RLS is the wall.
--
-- WHY THE IMPORT LEDGER. "Where did this number come from" must always have
-- an answer (DR-0076 §8). Every reading points at the file that last wrote it;
-- the file row carries its name, its SHA-256, its format, its span and what
-- the parser left out and why. Deleting a mistaken import (the wrong door's
-- file) removes exactly the readings that file still owns, by cascade.
--
-- WHY RE-IMPORT REPLACES. A reading is identified by door, commodity,
-- direction, start and length. A utility revises estimated reads into measured
-- ones, so the newest download of an hour is the utility's latest word: the
-- app upserts on that identity, and the reading moves to the newer file.
--
-- IDEMPOTENT: every statement guarded, safe to apply twice.

-- ---------------------------------------------------------------------------
-- Every meter file imported onto a door.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_energy_imports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL,
  rental_ref     uuid NOT NULL,                 -- the door (rentals.id, never the slug)
  file_name      text NOT NULL DEFAULT '',
  file_sha256    text CHECK (file_sha256 IS NULL OR file_sha256 ~ '^[0-9a-f]{64}$'),
  source_format  text NOT NULL CHECK (source_format IN ('espi-xml', 'csv')),
  commodities    text[] NOT NULL DEFAULT '{}',
  reading_count  integer NOT NULL CHECK (reading_count >= 0),
  first_start_at timestamptz,
  last_end_at    timestamptz,
  notes          text NOT NULL DEFAULT '',      -- what the parser left out, and why
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS property_energy_imports_door_idx
  ON public.property_energy_imports (rental_ref, created_at DESC);

-- ---------------------------------------------------------------------------
-- Every reading the meter gave, in its own unit, at its own instant.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_energy_readings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  rental_ref  uuid NOT NULL,
  import_id   uuid NOT NULL REFERENCES public.property_energy_imports (id) ON DELETE CASCADE,
  commodity   text NOT NULL CHECK (commodity IN ('electricity', 'gas')),
  -- delivered = from the grid to the house; received = from the house back to
  -- the grid (solar). A net file's negative hours arrive as received.
  direction   text NOT NULL CHECK (direction IN ('delivered', 'received')),
  start_at    timestamptz NOT NULL,
  -- A read longer than a month is a bill, not a read.
  seconds     integer NOT NULL CHECK (seconds > 0 AND seconds <= 2678400),
  amount      numeric NOT NULL CHECK (amount >= 0),
  -- The unit is fixed by the commodity, so a kWh can never be summed as a therm.
  unit        text NOT NULL,
  cost_cents  numeric,                          -- NULL = the file carried no cost for it
  quality     text NOT NULL DEFAULT 'measured' CHECK (quality IN ('measured', 'estimated', 'edited', 'questionable')),
  CONSTRAINT property_energy_readings_unit_fits CHECK (
    (commodity = 'electricity' AND unit = 'Wh') OR (commodity = 'gas' AND unit = 'therm'))
);
CREATE UNIQUE INDEX IF NOT EXISTS property_energy_readings_identity
  ON public.property_energy_readings (rental_ref, commodity, direction, start_at, seconds);
CREATE INDEX IF NOT EXISTS property_energy_readings_import_idx
  ON public.property_energy_readings (import_id);

GRANT SELECT, INSERT, DELETE ON public.property_energy_imports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.property_energy_readings TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS. Owner, admin and member of the door's instance; nobody else.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_energy_imports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_energy_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS property_energy_imports_read   ON public.property_energy_imports;
DROP POLICY IF EXISTS property_energy_imports_write  ON public.property_energy_imports;
DROP POLICY IF EXISTS property_energy_imports_delete ON public.property_energy_imports;
DROP POLICY IF EXISTS property_energy_readings_read   ON public.property_energy_readings;
DROP POLICY IF EXISTS property_energy_readings_write  ON public.property_energy_readings;
DROP POLICY IF EXISTS property_energy_readings_update ON public.property_energy_readings;

CREATE POLICY property_energy_imports_read ON public.property_energy_imports FOR SELECT TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin', 'member'));
-- An import is filed in the name of the person who filed it, never another's.
CREATE POLICY property_energy_imports_write ON public.property_energy_imports FOR INSERT TO authenticated
  WITH CHECK (public.user_role_in_instance(instance_id) IN ('owner', 'admin', 'member')
              AND created_by = auth.uid());
-- Taking back a wrong file is the owner's or an admin's act; its readings go
-- with it by cascade, and the readings a later file replaced stay.
CREATE POLICY property_energy_imports_delete ON public.property_energy_imports FOR DELETE TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin'));

CREATE POLICY property_energy_readings_read ON public.property_energy_readings FOR SELECT TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin', 'member'));
-- A reading must belong to an import on the SAME door in the SAME instance, so
-- one file cannot write readings onto another door.
CREATE POLICY property_energy_readings_write ON public.property_energy_readings FOR INSERT TO authenticated
  WITH CHECK (
    public.user_role_in_instance(instance_id) IN ('owner', 'admin', 'member')
    AND EXISTS (SELECT 1 FROM public.property_energy_imports i
                 WHERE i.id = property_energy_readings.import_id
                   AND i.instance_id = property_energy_readings.instance_id
                   AND i.rental_ref = property_energy_readings.rental_ref));
CREATE POLICY property_energy_readings_update ON public.property_energy_readings FOR UPDATE TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner', 'admin', 'member'))
  WITH CHECK (
    public.user_role_in_instance(instance_id) IN ('owner', 'admin', 'member')
    AND EXISTS (SELECT 1 FROM public.property_energy_imports i
                 WHERE i.id = property_energy_readings.import_id
                   AND i.instance_id = property_energy_readings.instance_id
                   AND i.rental_ref = property_energy_readings.rental_ref));
-- No DELETE on readings. A reading leaves only with the file that owns it.

-- ---------------------------------------------------------------------------
-- The hour, counted by the database. A year of 15-minute reads is 35,040 rows
-- and the API pages at 1,000; folding each hour's quarters here sends 8,760.
-- SECURITY INVOKER: RLS above decides what is summed, so a stranger's call
-- sums nothing. An hour's cost is reported only when every quarter carried
-- one, and an hour with an estimated quarter says estimated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.property_energy_hourly(p_rental_ref uuid, p_since timestamptz DEFAULT NULL)
RETURNS TABLE (commodity text, direction text, start_at timestamptz, seconds integer,
               amount numeric, cost_cents numeric, quality text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT r.commodity,
         r.direction,
         CASE WHEN r.seconds < 3600
              THEN date_trunc('hour', r.start_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
              ELSE r.start_at END,
         sum(r.seconds)::integer,
         sum(r.amount),
         CASE WHEN bool_and(r.cost_cents IS NOT NULL) THEN sum(r.cost_cents) END,
         CASE WHEN bool_or(r.quality = 'estimated') THEN 'estimated'
              WHEN bool_or(r.quality = 'questionable') THEN 'questionable'
              WHEN bool_or(r.quality = 'edited') THEN 'edited'
              ELSE 'measured' END
    FROM public.property_energy_readings r
   WHERE r.rental_ref = p_rental_ref
     AND (p_since IS NULL OR r.start_at >= p_since)
   GROUP BY r.commodity, r.direction,
            CASE WHEN r.seconds < 3600
                 THEN date_trunc('hour', r.start_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
                 ELSE r.start_at END,
            CASE WHEN r.seconds < 3600 THEN 0 ELSE r.seconds END
   ORDER BY 3, 1, 2
$$;
REVOKE ALL ON FUNCTION public.property_energy_hourly(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.property_energy_hourly(uuid, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------------
-- THE OVERLAYS, in 0232's order. Both tables are instance-scoped. The viewer
-- overlay is RESTRICTIVE, so re-running it only narrows: a viewer already
-- reads nothing here and now cannot write either.
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
