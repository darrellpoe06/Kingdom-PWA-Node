-- =============================================================================
-- 0143 — worker classification: family / W-2 / 1099 / volunteer, per member
-- =============================================================================
-- Darrell 2026-08-22: "when adding a new person to my family members or
-- assistants, 1099 and other etc... how can we change their statuses as
-- needed." Access ROLES (owner/admin/member/viewer/assistant, 0111/0130)
-- answer what a person may DO; this adds the missing second axis — what the
-- person IS to the family's books: family, W-2 staff, 1099 contractor, or
-- volunteer. A label, never a power: it grants nothing, it feeds the Books
-- side (1099 tracking at year-end) and the Role & stewards surface.

-- 1) The column, with its allowed values (NULL = not yet classified).
ALTER TABLE instance_members ADD COLUMN IF NOT EXISTS classification text;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'instance_members_classification_check'
       AND conrelid = 'instance_members'::regclass
  ) THEN
    ALTER TABLE instance_members
      ADD CONSTRAINT instance_members_classification_check
      CHECK (classification IS NULL OR classification IN ('family','w2','1099','volunteer'));
  END IF;
END $$;

-- 2) The guarded setter — same authority line as set_member_role (0111/0130):
--    only an owner/admin of the instance; empty clears the label. A label is
--    not a power, so self-classification is allowed and owners are settable.
CREATE OR REPLACE FUNCTION public.set_member_classification(instance_uuid uuid, target_user uuid, new_class text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_class text := lower(trim(coalesce(new_class, '')));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'set_member_classification: not authenticated';
  END IF;
  -- NULL-safe (0131 class): a non-member's role is NULL, and NULL NOT IN (...)
  -- is NULL — which would skip this gate entirely. coalesce closes it.
  IF coalesce(user_role_in_instance(instance_uuid), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'set_member_classification: only an owner/admin can classify members';
  END IF;
  IF v_class = '' THEN
    UPDATE instance_members SET classification = NULL
     WHERE instance_id = instance_uuid AND user_id = target_user;
  ELSIF v_class IN ('family','w2','1099','volunteer') THEN
    UPDATE instance_members SET classification = v_class
     WHERE instance_id = instance_uuid AND user_id = target_user;
  ELSE
    RAISE EXCEPTION 'set_member_classification: classification must be family, w2, 1099, or volunteer (empty clears)';
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'set_member_classification: that person is not a member of this space';
  END IF;
  RETURN jsonb_build_object('ok', true, 'classification', NULLIF(v_class, ''));
END;
$$;
REVOKE ALL ON FUNCTION public.set_member_classification(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_classification(uuid, uuid, text) TO authenticated;

-- 3) The roster speaks the label: list_instance_members gains the column.
--    Return-shape change requires DROP + recreate (grants restated below).
DROP FUNCTION IF EXISTS public.list_instance_members(uuid);
CREATE FUNCTION public.list_instance_members(instance_uuid uuid)
RETURNS TABLE (user_id uuid, display_name text, email text, role text, classification text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT im.user_id, im.display_name, u.email::text, im.role, im.classification
    FROM instance_members im
    LEFT JOIN auth.users u ON u.id = im.user_id
   WHERE im.instance_id = instance_uuid
     AND user_role_in_instance(instance_uuid) IN ('owner','admin')
   ORDER BY
     CASE im.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
     im.display_name;
$$;
REVOKE ALL ON FUNCTION public.list_instance_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_instance_members(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
