-- =============================================================================
-- 0154 — a photo's CAPTION is editable, its IMAGE is not; "remove" archives
-- =============================================================================
-- Darrell, 2026-08-27: "if you dont have a name just put all the known data and
-- let the users update and edit each profile and property etc..." and "Have a
-- place where each property has a pictures like MooreDivahs App kind of..."
-- (that gallery's own promise: "edit any piece anytime, no re-upload").
--
-- EDITABLE-EVERYWHERE is binding and names Leases, Tenants and Rooms outright:
-- "a record without an Edit affordance is a bug, not a feature." 0153 shipped
-- property_photos append-only with no UPDATE and no DELETE grant, which put it
-- in violation the moment it landed.
--
-- The reconciliation is EDITABLE-EVERYWHERE's own exception 2 (immutable
-- historical facts): the PHOTOGRAPH is the evidence and never changes; the
-- CAPTION, the ROOM it is filed to, and the KIND are somebody's description of
-- it, and a description that cannot be corrected is just a mistake nobody can
-- fix. So:
--
--   * UPDATE is granted on caption / room_id / kind / archived_at ONLY.
--     storage_path, taken_at, tenancy_id, rental_ref and instance_id are frozen
--     by a trigger — re-pointing a move-out condition photo at another door or
--     another date is exactly the tampering the append-only rule existed to
--     stop, and a column grant alone would not have prevented it.
--   * There is still NO DELETE. "Remove" sets archived_at, the same as a room:
--     the deposit argument a condition set exists to settle can arrive long
--     after somebody decided the picture was clutter.
-- =============================================================================

ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.property_photos ADD COLUMN IF NOT EXISTS edited_at   timestamptz;

-- The frozen columns. A trigger, not just a column grant: column privileges are
-- easy to widen later by accident, and this is the rule the evidence rests on.
CREATE OR REPLACE FUNCTION public.property_photos_freeze_evidence()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  if NEW.storage_path is distinct from OLD.storage_path then
    raise exception 'a photo''s image cannot be changed — add a new photo instead';
  end if;
  if NEW.taken_at is distinct from OLD.taken_at then
    raise exception 'a photo''s taken_at cannot be changed — it is what the camera recorded';
  end if;
  if NEW.rental_ref is distinct from OLD.rental_ref
     or NEW.tenancy_id is distinct from OLD.tenancy_id
     or NEW.instance_id is distinct from OLD.instance_id then
    raise exception 'a photo cannot be moved to another door, tenancy or instance';
  end if;
  NEW.edited_at := now();
  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS property_photos_freeze ON public.property_photos;
CREATE TRIGGER property_photos_freeze
  BEFORE UPDATE ON public.property_photos
  FOR EACH ROW EXECUTE FUNCTION public.property_photos_freeze_evidence();

-- Whoever may file a photo may correct its description. Same predicate as the
-- insert policy (0153), so no new standing is created here.
GRANT UPDATE (caption, room_id, kind, archived_at, archived_by) ON public.property_photos TO authenticated;

DROP POLICY IF EXISTS property_photos_update ON public.property_photos;
CREATE POLICY property_photos_update ON public.property_photos FOR UPDATE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR (tenancy_id IS NOT NULL
             AND (user_is_tenant(tenancy_id)
                  OR user_is_tenancy_household(tenancy_id)
                  OR user_is_enabled_worker(tenancy_id)
                  OR user_delegated_can(tenancy_id,'request.manage')
                  OR user_delegated_can(tenancy_id,'docs.add'))))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR (tenancy_id IS NOT NULL
                  AND (user_is_tenant(tenancy_id)
                       OR user_is_tenancy_household(tenancy_id)
                       OR user_is_enabled_worker(tenancy_id)
                       OR user_delegated_can(tenancy_id,'request.manage')
                       OR user_delegated_can(tenancy_id,'docs.add'))));

-- Still no DELETE grant, deliberately.

-- ---------------------------------------------------------------------------
-- A DOCUMENT is not a photograph. Darrell, 2026-08-27: "add a location for
-- uploading documents and images like or other workflows."
--
-- Kept as its own table rather than a `kind` on property_photos because the two
-- differ in every way that matters: a document has a signer and an effective
-- date, a photo has a camera and a shutter time; a lease is replaced by a newer
-- lease, a condition photo never is. Sharing one table would mean one set of
-- columns half-null for whichever kind it is not.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL,
  rental_ref    uuid,
  tenancy_id    uuid,
  kind          text NOT NULL DEFAULT 'other',
  title         text NOT NULL,
  note          text NOT NULL DEFAULT '',
  storage_path  text NOT NULL,
  mime_type     text NOT NULL DEFAULT '',
  byte_size     integer,
  effective_on  date,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  uploaded_by   uuid,
  author_label  text NOT NULL DEFAULT '',
  archived_at   timestamptz,
  archived_by   uuid
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_documents_kind_check') THEN
    ALTER TABLE public.property_documents ADD CONSTRAINT property_documents_kind_check
      CHECK (kind IN ('lease','addendum','rules','notice','receipt','inspection',
                      'insurance','w9','invoice','permit','correspondence','id-verification','other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_documents_title_present') THEN
    ALTER TABLE public.property_documents ADD CONSTRAINT property_documents_title_present
      CHECK (length(btrim(title)) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_documents_has_an_anchor') THEN
    ALTER TABLE public.property_documents ADD CONSTRAINT property_documents_has_an_anchor
      CHECK (rental_ref IS NOT NULL OR tenancy_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS property_documents_door_idx    ON public.property_documents(rental_ref, uploaded_at);
CREATE INDEX IF NOT EXISTS property_documents_tenancy_idx ON public.property_documents(tenancy_id, uploaded_at);

GRANT SELECT, INSERT ON public.property_documents TO authenticated;
GRANT UPDATE (title, note, kind, effective_on, archived_at, archived_by) ON public.property_documents TO authenticated;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS property_documents_read   ON public.property_documents;
DROP POLICY IF EXISTS property_documents_insert ON public.property_documents;
DROP POLICY IF EXISTS property_documents_update ON public.property_documents;

-- Same ladder as property_photos: a door-level document (a permit, the
-- building insurance) is management-only; a tenancy's own papers reach that
-- household. A tenant must be able to read their OWN lease — that is the whole
-- point of giving them the app.
CREATE POLICY property_documents_read ON public.property_documents FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR (tenancy_id IS NOT NULL
             AND (user_is_tenant(tenancy_id)
                  OR user_is_tenancy_household(tenancy_id)
                  OR user_is_enabled_worker(tenancy_id)
                  OR user_delegated_can(tenancy_id,'property.history')
                  OR user_delegated_can(tenancy_id,'docs.add'))));

CREATE POLICY property_documents_insert ON public.property_documents FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR (tenancy_id IS NOT NULL
                  AND (user_is_tenant(tenancy_id)
                       OR user_is_tenancy_household(tenancy_id)
                       OR user_is_enabled_worker(tenancy_id)
                       OR user_delegated_can(tenancy_id,'docs.add'))));

CREATE POLICY property_documents_update ON public.property_documents FOR UPDATE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR (tenancy_id IS NOT NULL AND user_delegated_can(tenancy_id,'docs.add')))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR (tenancy_id IS NOT NULL AND user_delegated_can(tenancy_id,'docs.add')));

-- The overlays must know about the new table, or a viewer/assistant falls
-- through it — the miss the tenancy guard caught on 0150.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- The listing's own pictures. Darrell, 2026-08-27: a QR at the property so
-- "a person scan[s] a qr code to apply for an open spot", plus a per-property
-- gallery — which only works if the applicant can actually SEE the unit.
--
-- THE LINE, drawn deliberately tight. This is the only path by which any photo
-- leaves the instance, so it is a separate RPC rather than a wider
-- public_vacancies row (which would also have meant changing that function's
-- return type a second time — the 0153 mistake, now guarded).
--
--   * kind = 'listing' ONLY. A move-in/move-out condition set, a damage photo,
--     a work-order before/after are the inside of somebody's home and can never
--     reach this path however the caller asks.
--   * The unit must be LISTED (listed_at) and have NO active tenancy — the same
--     two conditions public_vacancies uses. A door stops being public the
--     moment somebody lives in it.
--   * Not archived.
--   * It returns the caption and the image, and NOT room_id, tenancy_id,
--     uploaded_by or author_label: who took it and which room it is filed to
--     are the landlord's record, not the applicant's business.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_vacancy_photos(p_rental uuid)
RETURNS TABLE (
  id           uuid,
  caption      text,
  storage_path text,
  taken_at     timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ph.id, ph.caption, ph.storage_path, ph.taken_at
    FROM property_photos ph
    JOIN rentals r ON r.id = ph.rental_ref
   WHERE ph.rental_ref = p_rental
     AND ph.kind = 'listing'
     AND ph.archived_at IS NULL
     AND r.listed_at IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM rental_tenancies t
        WHERE t.rental_ref = r.slug AND t.status = 'active'
     )
   ORDER BY ph.taken_at DESC NULLS LAST, ph.uploaded_at DESC
$$;

REVOKE ALL ON FUNCTION public.public_vacancy_photos(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vacancy_photos(uuid) TO anon, authenticated;
