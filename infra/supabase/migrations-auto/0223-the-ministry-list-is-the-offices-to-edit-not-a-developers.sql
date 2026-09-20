-- =============================================================================
-- 0223 — the ministry list belongs to the office, not to a developer
-- =============================================================================
-- Darrell 2026-09-20, the morning of Back to Church and Volunteer Sunday: "We
-- can just make the list like our others in Books.... we can add as we need and
-- we have a list we can edit at anytime.... so expandable by staff and no need
-- for technical work... make sense?"
--
-- It makes complete sense, and it is the correction to how 0222's sibling work
-- was done. Fourteen ministries were added that morning by editing a JavaScript
-- array, which means the fifteenth needs an agent, a commit, a review and a
-- deploy. A church that starts a Motorcycle Ministry on a Tuesday should have it
-- on the volunteer list on Tuesday. The array becomes a SEED; this table is the
-- living list.
--
-- THE SEED STILL MATTERS AND IS NOT REDUNDANT. lib/church-ministries.js keeps
-- the full flyer roster, and the app falls back to it whenever this table is
-- empty or unreachable. So a brand-new instance, an offline phone and a
-- signed-out visitor all still see the church's real ministries -- the database
-- adds to the floor, it never becomes the floor.
--
-- ACCESS, following church_devices (0056) rather than inventing a scheme:
--   read  -- anyone. A volunteer list is a public invitation; the flyer with
--            this QR code on it was handed out in the street.
--   write -- owner/admin of the church instance. The office edits its own list.
--
-- IDEMPOTENT throughout.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.church_ministries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances (id) ON DELETE CASCADE,
  slug          text NOT NULL,
  name          text NOT NULL,
  blurb         text,
  join_note     text,
  -- Where the ministry lives in the app, when it has a home of its own yet.
  view          text,
  sub           text,
  feedback_key  text,
  sort_order    int  NOT NULL DEFAULT 100,
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, slug)
);

CREATE INDEX IF NOT EXISTS church_ministries_instance_idx
  ON public.church_ministries (instance_id, sort_order);

ALTER TABLE public.church_ministries ENABLE ROW LEVEL SECURITY;

-- READ: everyone, signed in or not. The invitation is public by design -- the
-- flyer carrying this QR code is handed to strangers, and a volunteer list that
-- demanded an account before it would show itself would turn that invitation
-- into a door. Only ACTIVE rows; a retired ministry stays in the table for its
-- history without appearing on the list.
DROP POLICY IF EXISTS church_ministries_public_read ON public.church_ministries;
CREATE POLICY church_ministries_public_read
  ON public.church_ministries FOR SELECT
  USING (is_active);

-- WRITE: the office. Owner or admin of that instance, exactly as the device
-- register does it -- one scheme for staff editing, not a second one to learn.
DROP POLICY IF EXISTS church_ministries_staff_write ON public.church_ministries;
CREATE POLICY church_ministries_staff_write
  ON public.church_ministries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.instance_members im
      WHERE im.instance_id = church_ministries.instance_id
        AND im.user_id = auth.uid()
        AND im.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instance_members im
      WHERE im.instance_id = church_ministries.instance_id
        AND im.user_id = auth.uid()
        AND im.role IN ('owner', 'admin')
    )
  );

-- updated_at is maintained by the database, so an edit from any client -- the
-- app, a script, the SQL console -- stamps honestly. A client-set timestamp is
-- a timestamp that lies the first time someone edits from somewhere else.
CREATE OR REPLACE FUNCTION public.touch_church_ministries()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS church_ministries_touch ON public.church_ministries;
CREATE TRIGGER church_ministries_touch
  BEFORE UPDATE ON public.church_ministries
  FOR EACH ROW EXECUTE FUNCTION public.touch_church_ministries();

-- THE STANDING OVERLAYS, BECAUSE A NEW INSTANCE-SCOPED TABLE SHIPPED.
-- church_ministries carries instance_id, so both overlays must be re-applied
-- in the same migration that creates it (DR-0059 / DR-0241 / DR-0347) or the
-- tenancy guard fails the build -- which is exactly what it did here, and it
-- was right to. The RLS above already limits writes to owner/admin, but the
-- viewer overlay is a SEPARATE grant surface: without re-running it a viewer
-- role could write this table, and the church's ministry directory is the
-- public face of the Love Corner. A guard catching this before merge is the
-- whole reason it exists.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
