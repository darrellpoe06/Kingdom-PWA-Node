-- =============================================================================
-- 0339 — each visit says which app it was (DR-1591)
-- =============================================================================
-- Darrell, 2026-11-19, on Admin > Users & usage > Signups: "How do I know who
-- signed up and if and when they got in? Coreyon is supposed to be using the
-- Poe Properties App... he may also want the Love Corner App... as well as the
-- PoeTech App... how do I know?"
--
-- WHAT WAS MISSING, MEASURED. usage_events (0073) records a person, a kind
-- ('view' a tab opened, 'use' a function exercised, 0253), a tab name and a
-- time. It does not record which app the person was in: PoeTech, The Love
-- Corner, Poe Properties, TLC or Moore Divahs (app/src/lib/app-doors.js DOORS).
-- And the Poe Properties door boots the properties module without the PoeTech
-- shell, so it wrote no usage row at all. Nobody could answer "has Coreyon
-- ever opened the Poe Properties app".
--
-- WHAT THIS ADDS
--   1. usage_events.door, nullable. The app writes the door key (DOORS[].key)
--      on every view and use row from now on, and one kind='door' row the
--      first time a signed-in person is seen in a door on each page load
--      (lib/usage-events.js noteDoorOpen). Rows written before this have no
--      door, and are reported as such, never guessed.
--   2. admin_person_doors(), for the governor circle only (the poe-family gate
--      of 0055 / 0259): per person, each door opened with the first time, the
--      last time and how many rows; the count and last time of rows from
--      before doors were recorded; and the moment door tracking began (the
--      earliest row that carries a door), so the screen can say "before door
--      tracking began on <date>".
--
-- Nothing existing moves: usage_flow_metrics reads kind='view' only, and the
-- When & by whom calendar drops kind='door' in its pure shaping
-- (lib/usage-calendar.js), so no tab count or calendar number changes. Each
-- person still owns and can delete their own trail (0073's policies stand).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, the check dropped and re-added, CREATE
-- INDEX IF NOT EXISTS, CREATE OR REPLACE FUNCTION, grants re-applied.
-- Smoke: infra/supabase/tests/0339-person-doors-smoke.sql (ROLLS BACK).
-- =============================================================================

ALTER TABLE public.usage_events ADD COLUMN IF NOT EXISTS door text;

-- A door key is a short lowercase word (poetech, lovecorner, properties, tlc,
-- moore); anything else is refused so the column cannot carry free text.
ALTER TABLE public.usage_events DROP CONSTRAINT IF EXISTS usage_events_door_shape;
ALTER TABLE public.usage_events
  ADD CONSTRAINT usage_events_door_shape
  CHECK (door IS NULL OR door ~ '^[a-z][a-z0-9-]{0,31}$');

CREATE INDEX IF NOT EXISTS usage_events_owner_door_idx
  ON public.usage_events (owner, door, at)
  WHERE door IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_person_doors()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_since  timestamptz;
  v_people jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'admin_person_doors: not authenticated' USING ERRCODE = '28000';
  END IF;
  -- Gate first: SECURITY DEFINER reads every person's rows.
  IF NOT EXISTS (
    SELECT 1 FROM instance_members im JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = v_caller AND i.slug = 'poe-family'
  ) THEN
    RAISE EXCEPTION 'admin_person_doors: not authorized (poe-family governors only)' USING ERRCODE = '42501';
  END IF;

  SELECT min(ue.at) INTO v_since FROM usage_events ue WHERE ue.door IS NOT NULL;

  WITH per_door AS (
    SELECT ue.owner, ue.door, min(ue.at) AS first_at, max(ue.at) AS last_at, count(*)::int AS n
      FROM usage_events ue
     WHERE ue.door IS NOT NULL
     GROUP BY ue.owner, ue.door
  ),
  untagged AS (
    SELECT ue.owner, count(*)::int AS n, max(ue.at) AS last_at
      FROM usage_events ue
     WHERE ue.door IS NULL
     GROUP BY ue.owner
  ),
  people AS (
    SELECT owner FROM per_door UNION SELECT owner FROM untagged
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'user_id', p.owner,
           'doors', coalesce((
              SELECT jsonb_agg(jsonb_build_object('door', d.door, 'first_at', d.first_at, 'last_at', d.last_at, 'n', d.n)
                               ORDER BY d.last_at DESC)
                FROM per_door d WHERE d.owner = p.owner), '[]'::jsonb),
           'before_tracking', (
              SELECT jsonb_build_object('n', u.n, 'last_at', u.last_at)
                FROM untagged u WHERE u.owner = p.owner)
         )), '[]'::jsonb)
    INTO v_people
    FROM people p;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'door_tracking_since', v_since,
    'people', v_people
  );
END;
$$;

-- The replay grants EXECUTE to anon by default (DR-0935); the gate would refuse
-- anon anyway, but the function is not for anon at all.
REVOKE ALL ON FUNCTION public.admin_person_doors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_person_doors() TO authenticated;

-- Receipt: the column, its check and the reader exist, or this migration failed.
DO $chk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'usage_events' AND column_name = 'door'
  ) THEN RAISE EXCEPTION '0339: usage_events.door is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usage_events_door_shape'
  ) THEN RAISE EXCEPTION '0339: the door shape check is missing'; END IF;
  IF to_regprocedure('public.admin_person_doors()') IS NULL THEN
    RAISE EXCEPTION '0339: admin_person_doors() is missing';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
