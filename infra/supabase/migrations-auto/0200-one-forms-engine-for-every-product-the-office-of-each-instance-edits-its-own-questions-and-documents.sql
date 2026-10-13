-- =============================================================================
-- 0200 — One forms engine for every product: the office of each instance edits
-- its own questions and documents (DR-0357)
-- =============================================================================
-- Darrell 2026-09-11: "Create the same type of intake forms for PoeTech and
-- Poe Properties Apps... each has their own databases so each can work
-- independently and together as our Ways and documentation state."
--
-- 0196 gave the TLC office its own forms, keyed to instance_type
-- 'therapy-practice'. What it proved is a WAY, not a TLC feature. This is that
-- way with the product lifted out:
--
--   product_forms(instance_id, product, key)  -- one versioned body per form
--   product_form_history                       -- append-only, every version
--   product_form_save(product, key, body, note)
--   product_forms_read(product, instance)
--
-- "ITS OWN DATABASE" is the instance, and RLS on instance_id is the wall
-- (DR-0060). A product's forms live in whichever instance runs that product:
-- the household's in the family instance, the landlord's in whatever instance
-- holds its doors. NOTHING here names an instance_type, so the day Poe
-- Properties gets its own instance (a tenancy decision, DR-0313's dated
-- re-review, the Governor's to make) this table needs no change at all.
--
-- TLC's own tables are NOT touched. 0196 is live with real versions in it;
-- re-homing it would be a data migration with nothing to gain. TLC and the new
-- products share the JS engine (lib/forms-engine.js) and keep their own rows.
--
-- WHO MAY DO WHAT
--   save : owner/admin of that instance. Every save is version+1 with a note.
--   read : any member of the instance — plus ANON for the 'properties'
--          product ONLY, because a rental application is filled by someone
--          with no account (modules/properties, DR-0313) and must show the
--          landlord's current wording, not the wording at deploy time.
--          Every other product refuses an anonymous read outright.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.product_forms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  product      text NOT NULL,
  key          text NOT NULL,
  body         jsonb NOT NULL,
  version      integer NOT NULL DEFAULT 1,
  note         text,
  updated_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_forms_product_chk CHECK (product IN ('poetech','properties')),
  CONSTRAINT product_forms_key_chk CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT product_forms_body_chk CHECK (jsonb_typeof(body) = 'object'),
  CONSTRAINT product_forms_version_chk CHECK (version >= 1),
  UNIQUE (instance_id, product, key)
);

CREATE TABLE IF NOT EXISTS public.product_form_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      uuid NOT NULL REFERENCES public.product_forms(id) ON DELETE CASCADE,
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  product      text NOT NULL,
  key          text NOT NULL,
  body         jsonb NOT NULL,
  version      integer NOT NULL,
  note         text,
  saved_by     uuid REFERENCES auth.users(id),
  saved_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, version)
);

CREATE INDEX IF NOT EXISTS product_forms_lookup_idx ON public.product_forms(instance_id, product, key);
CREATE INDEX IF NOT EXISTS product_form_history_form_idx ON public.product_form_history(form_id, version DESC);

ALTER TABLE public.product_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_form_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_forms_member_read ON public.product_forms;
CREATE POLICY product_forms_member_read ON public.product_forms FOR SELECT TO authenticated
  USING (public.user_in_instance(instance_id));

DROP POLICY IF EXISTS product_form_history_office_read ON public.product_form_history;
CREATE POLICY product_form_history_office_read ON public.product_form_history FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

-- Writes go through the function alone: no INSERT/UPDATE/DELETE policy exists
-- on either table, so RLS refuses every direct write even for an owner.

-- ---------------------------------------------------------------------------
-- SAVE — owner/admin of the instance, a note required, version+1, audited.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.product_form_save(
  product_in     text,
  key_in         text,
  body_in        jsonb,
  note_in        text,
  instance_in    uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_row      public.product_forms%ROWTYPE;
  v_note     text := left(btrim(coalesce(note_in, '')), 500);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF product_in IS NULL OR product_in NOT IN ('poetech','properties') THEN
    RAISE EXCEPTION 'no such product';
  END IF;
  IF key_in IS NULL OR key_in !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'no such form';
  END IF;
  IF body_in IS NULL OR jsonb_typeof(body_in) <> 'object' THEN
    RAISE EXCEPTION 'the form must be an object';
  END IF;
  IF length(v_note) < 3 THEN
    RAISE EXCEPTION 'say in a few words what changed';
  END IF;

  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no instance to save into'; END IF;
  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the owner or an admin may change this form';
  END IF;

  INSERT INTO public.product_forms (instance_id, product, key, body, version, note, updated_by)
  VALUES (v_instance, product_in, key_in, body_in, 1, v_note, auth.uid())
  ON CONFLICT (instance_id, product, key) DO UPDATE
     SET body = EXCLUDED.body,
         version = public.product_forms.version + 1,
         note = EXCLUDED.note,
         updated_by = auth.uid(),
         updated_at = now()
  RETURNING * INTO v_row;

  INSERT INTO public.product_form_history (form_id, instance_id, product, key, body, version, note, saved_by)
  VALUES (v_row.id, v_row.instance_id, v_row.product, v_row.key, v_row.body, v_row.version, v_row.note, auth.uid())
  ON CONFLICT (form_id, version) DO NOTHING;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_row.instance_id, auth.uid(), 'update', 'product_form', v_row.id,
          jsonb_build_object('product', v_row.product, 'key', v_row.key, 'version', v_row.version - 1),
          jsonb_build_object('product', v_row.product, 'key', v_row.key, 'version', v_row.version),
          v_note);

  RETURN jsonb_build_object(
    'instance_id', v_row.instance_id, 'product', v_row.product, 'key', v_row.key,
    'version', v_row.version, 'note', v_row.note, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.product_form_save(text, text, jsonb, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.product_form_save(text, text, jsonb, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- READ — every form a product has saved, keyed by form key.
-- A member of the instance may read its own. ANON may read 'properties' only,
-- and only for an instance named outright: the application and the criteria
-- are written to be read by someone who has no account yet.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.product_forms_read(
  product_in  text,
  instance_in uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
BEGIN
  IF product_in IS NULL OR product_in NOT IN ('poetech','properties') THEN
    RAISE EXCEPTION 'no such product';
  END IF;

  IF auth.uid() IS NULL THEN
    -- The anonymous applicant: properties only, and the instance must be named.
    IF product_in <> 'properties' THEN RAISE EXCEPTION 'sign in first'; END IF;
    IF instance_in IS NULL THEN RAISE EXCEPTION 'name the office'; END IF;
    v_instance := instance_in;
  ELSE
    v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
    IF v_instance IS NULL THEN RAISE EXCEPTION 'no instance to read'; END IF;
    IF NOT public.user_in_instance(v_instance) THEN
      -- A signed-in stranger reading the public application is the same case
      -- as the anonymous one; anything else is refused.
      IF product_in <> 'properties' THEN RAISE EXCEPTION 'that is not your instance'; END IF;
    END IF;
  END IF;

  RETURN coalesce((
    SELECT jsonb_object_agg(f.key, jsonb_build_object(
             'body', f.body, 'version', f.version, 'note', f.note, 'updated_at', f.updated_at))
      FROM public.product_forms f
     WHERE f.instance_id = v_instance AND f.product = product_in
  ), '{}'::jsonb) || jsonb_build_object('_instance_id', to_jsonb(v_instance::text));
END;
$$;
REVOKE ALL ON FUNCTION public.product_forms_read(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.product_forms_read(text, uuid) TO authenticated, anon;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
