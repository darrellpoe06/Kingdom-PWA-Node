-- =============================================================================
-- 0310 — a work order keeps its pictures, a note carries them, and a name
--        typed once is offered after (DR-1235)
-- =============================================================================
-- Darrell, 2026-10-27, from his phone on Big Picture → Work order triage (#13,
-- "Exhaust Fan and microwave installation inside apartment 2", CHECK IT):
--   (1) "Need to be able to upload pictures to the workorders and notes for
--       images"
--   (2) "also when adding a new name for an image it should be automatically
--       one of the options moving forward"
--
-- WHAT STOOD (measured on the migrations, not remembered). property_photos
-- (0153) already carries request_id — "optional: a work order's before/after"
-- — and the kinds 'work-order-before' / 'work-order-after'. Nothing in the app
-- wrote it: the triage's Add a note wrote tenancy_notes only, and a picture had
-- no column for the NOTE it rides on or for a Real Estate INCIDENT (the shell's
-- Action Queue, keyed by a text id such as in-1761500000000). The anchor check
-- (rental_ref OR tenancy_id) refused a picture on a building's work order,
-- which has neither. And the only person who could file to a job was one with
-- a delegated capability on the door (0185) or an enabled-worker row on the
-- tenancy (0075): the worker a work order was GIVEN TO (assigned_to, 0062)
-- with nothing else could not attach the picture of what he did.
--
-- WHAT THIS DOES.
--   1. property_photos.note_id — the note the picture rides on (tenancy_notes).
--      property_photos.incident_ref — the Real Estate incident it belongs to.
--      The anchor check now accepts a work order (request_id) or an incident
--      (incident_ref) as the thing a picture hangs on. The picture of a work
--      order on a door STILL carries rental_ref, so it shows on the door's
--      wall beside the move-out set (one record, DR-0065).
--   2. user_is_assigned_to_request(request) — true for the worker the work
--      order names in assigned_to. Two policies on property_photos: the
--      assigned worker reads the job's pictures and files his own (uploaded_by
--      = himself, on that request only). Whoever may read the work order reads
--      its pictures (the tenant who filed the leak sees the before/after).
--   3. picture_names — the names an instance has given its pictures. One row
--      per name per instance, matched without case; remember_picture_name()
--      is the only writer: it adds a name typed once, and counts a reuse. The
--      pickers read it, so a NEW name is one of the options from then on, on
--      every device, not for one session on one phone.
--
-- Idempotent; applied twice in CI (door-work leg) and proven on the live
-- database (rls-isolation, poe-properties leg) by 0310-work-order-pictures-
-- smoke.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Where a picture hangs: a note, an incident.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS note_id      uuid;
ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS incident_ref text;
CREATE INDEX IF NOT EXISTS property_photos_note_idx     ON public.property_photos(note_id);
CREATE INDEX IF NOT EXISTS property_photos_incident_idx ON public.property_photos(incident_ref);

COMMENT ON COLUMN public.property_photos.note_id IS
  'The tenancy_notes row this picture rides on (DR-1235). A note can carry pictures; the picture still belongs to the door / work order it names.';
COMMENT ON COLUMN public.property_photos.incident_ref IS
  'The Real Estate incident (the shell''s Action Queue id, e.g. in-1761500000000) this picture belongs to (DR-1235). Text because the queue keys its rows by text.';

-- A photo has to hang on something, or it can never be shown or governed
-- (0153). A work order or an incident is now something: a building's foyer
-- light has no door and no tenancy, and its before/after is still evidence.
ALTER TABLE public.property_photos DROP CONSTRAINT IF EXISTS property_photos_has_an_anchor;
ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_has_an_anchor
  CHECK (rental_ref IS NOT NULL OR tenancy_id IS NOT NULL OR request_id IS NOT NULL OR incident_ref IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 2. The worker the work order was given to.
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER (mirrors user_is_enabled_worker, 0075): the worker may not
-- otherwise read the request row he is named on.
CREATE OR REPLACE FUNCTION public.user_is_assigned_to_request(p_request uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_request IS NOT NULL AND EXISTS (
    SELECT 1 FROM tenant_maintenance_requests r
     WHERE r.id = p_request
       AND r.assigned_to IS NOT NULL
       AND r.assigned_to = auth.uid())
$$;
REVOKE ALL ON FUNCTION public.user_is_assigned_to_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_assigned_to_request(uuid) TO authenticated;

-- The work order's own people read its pictures: the worker it was given to,
-- and whoever may read the work order (its tenant, household, management,
-- delegates — tenant_maintenance_requests' own policies decide; this one asks
-- them). Additive to 0153 / 0185 / 0309; nothing there is touched.
DROP POLICY IF EXISTS property_photos_work_order_read ON public.property_photos;
CREATE POLICY property_photos_work_order_read ON public.property_photos FOR SELECT TO authenticated
  USING (request_id IS NOT NULL
         AND (public.user_is_assigned_to_request(request_id)
              OR EXISTS (SELECT 1 FROM public.tenant_maintenance_requests r WHERE r.id = property_photos.request_id)));

-- The assigned worker files his own picture of his own job, and nothing else:
-- uploaded_by is himself, request_id is a job he was given. He does not
-- re-caption or archive (no UPDATE arm), exactly as a delegate (0185).
DROP POLICY IF EXISTS property_photos_work_order_insert ON public.property_photos;
CREATE POLICY property_photos_work_order_insert ON public.property_photos FOR INSERT TO authenticated
  WITH CHECK (request_id IS NOT NULL
              AND uploaded_by = auth.uid()
              AND public.user_is_assigned_to_request(request_id));

-- ---------------------------------------------------------------------------
-- 3. The names an instance gives its pictures.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.picture_names (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL,
  name         text NOT NULL,
  -- Matched without case or stray spaces, so "before" and "Before " are one
  -- name. The first spelling typed is the one kept and offered.
  name_key     text GENERATED ALWAYS AS (lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))) STORED,
  uses         integer NOT NULL DEFAULT 1,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'picture_names_name_present') THEN
    ALTER TABLE public.picture_names ADD CONSTRAINT picture_names_name_present
      CHECK (length(btrim(name)) > 0 AND length(name) <= 80);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS picture_names_one_per_instance_idx ON public.picture_names(instance_id, name_key);
CREATE INDEX IF NOT EXISTS picture_names_instance_idx ON public.picture_names(instance_id, name_key);

-- Who names pictures in an instance: its management, a delegate on any of its
-- doors, an enabled worker on any of its tenancies, or the worker a work order
-- of its was given to. SECURITY DEFINER so a worker with no instance role is
-- still matched.
CREATE OR REPLACE FUNCTION public.user_may_name_pictures(p_instance uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- coalesce: a stranger's role is NULL, and NULL IN (...) is NULL, which an
  -- IF NOT would wave through. Unknown reads as no.
  SELECT p_instance IS NOT NULL AND (
    coalesce(public.user_role_in_instance(p_instance) IN ('owner','admin','member'), false)
    OR EXISTS (SELECT 1 FROM delegated_capabilities dc
                WHERE dc.instance_id = p_instance AND dc.grantee_user_id = auth.uid() AND dc.setting = 'allow')
    OR EXISTS (SELECT 1 FROM tenancy_worker_access w
                JOIN rental_tenancies t ON t.id = w.tenancy_id
                WHERE t.instance_id = p_instance AND w.worker_user_id = auth.uid() AND w.active = true)
    OR EXISTS (SELECT 1 FROM tenant_maintenance_requests r
                WHERE r.instance_id = p_instance AND r.assigned_to = auth.uid()))
$$;
REVOKE ALL ON FUNCTION public.user_may_name_pictures(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_may_name_pictures(uuid) TO authenticated;

GRANT SELECT ON public.picture_names TO authenticated;
ALTER TABLE public.picture_names ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS picture_names_read ON public.picture_names;
CREATE POLICY picture_names_read ON public.picture_names FOR SELECT TO authenticated
  USING (public.user_may_name_pictures(instance_id)
         OR coalesce(public.user_role_in_instance(instance_id) IN ('viewer','assistant'), false));
-- No INSERT / UPDATE / DELETE grant: remember_picture_name() is the one writer,
-- so the match-without-case rule cannot be stepped around by a direct insert.

CREATE OR REPLACE FUNCTION public.remember_picture_name(p_instance uuid, p_name text)
RETURNS TABLE (id uuid, name text, uses integer, added boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  r record;
BEGIN
  IF NOT public.user_may_name_pictures(p_instance) THEN
    RAISE EXCEPTION 'you do not name pictures in this instance' USING ERRCODE = '42501';
  END IF;
  IF length(clean) = 0 OR length(clean) > 80 THEN
    RAISE EXCEPTION 'a picture name is one to eighty characters' USING ERRCODE = '23514';
  END IF;
  SELECT n.id, n.name, n.uses INTO r FROM picture_names n
   WHERE n.instance_id = p_instance AND n.name_key = lower(clean);
  IF FOUND THEN
    UPDATE picture_names n SET uses = n.uses + 1, last_used_at = now() WHERE n.id = r.id;
    RETURN QUERY SELECT r.id, r.name, r.uses + 1, false;
  ELSE
    RETURN QUERY INSERT INTO picture_names (instance_id, name, created_by)
      VALUES (p_instance, clean, auth.uid())
      RETURNING picture_names.id, picture_names.name, picture_names.uses, true;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.remember_picture_name(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remember_picture_name(uuid, text) TO authenticated;

-- The overlays re-read every policy set (0153, 0185 and 0309 did the same).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
