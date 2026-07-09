-- =============================================================================
-- 0094 — showcase pieces carry a price, and existing pieces are EDITABLE
-- =============================================================================
-- Shay via Darrell 2026-07-08: "a place to add prices for the images... for
-- the images there wasn't a spot for pricing... wasn't able to go back and
-- add to the previous pics so it'll be a matter of deleting and adding them
-- back." This kills the delete-and-re-add: price_cents joins the piece row,
-- the public gallery read returns it (shown ONLY when she set one — never a
-- painted number, DR-0076), and update_showcase_piece lets a steward edit
-- title/description/price on any existing piece in place.
-- DEPENDS ON: 0092. IDEMPOTENT. DROP-then-CREATE where a signature changes
-- (the 0088 lesson: return/arg-type changes need the DROP first; grants are
-- re-issued below in the same migration).
-- =============================================================================

ALTER TABLE showcase_pieces ADD COLUMN IF NOT EXISTS price_cents integer;

-- Public gallery read now carries the price (return type changed -> DROP first).
DROP FUNCTION IF EXISTS public.moore_showcase(text);
CREATE FUNCTION public.moore_showcase(p_instance_slug text)
RETURNS TABLE (slug text, title text, description text, product_type text, image_path text, pinned boolean, price_cents integer, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.slug, s.title, s.description, s.product_type, s.image_path, s.pinned, s.price_cents, s.created_at
  FROM showcase_pieces s JOIN instances i ON i.id = s.instance_id
  WHERE i.slug = p_instance_slug AND s.seed IS NOT TRUE
  ORDER BY s.pinned DESC, s.created_at DESC
  LIMIT 100;
$$;
GRANT EXECUTE ON FUNCTION public.moore_showcase(text) TO anon;
GRANT EXECUTE ON FUNCTION public.moore_showcase(text) TO authenticated;

-- add_showcase_piece gains the price argument (arg signature changed -> DROP
-- the old overload so PostgREST never sees two candidates).
DROP FUNCTION IF EXISTS public.add_showcase_piece(text,text,text,text,text,text);
CREATE FUNCTION public.add_showcase_piece(p_instance_slug text, p_slug text, p_title text, p_description text, p_product_type text, p_image_path text, p_price_cents integer DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_inst uuid; v_role text; v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'not a steward of this business'; END IF;
  INSERT INTO showcase_pieces (instance_id, created_by, slug, title, description, product_type, image_path, price_cents)
  VALUES (v_inst, auth.uid(), p_slug, trim(coalesce(p_title,'')), p_description, coalesce(p_product_type,'other'), p_image_path, p_price_cents)
  ON CONFLICT (instance_id, slug) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Edit-in-place: title/description/price on an EXISTING piece, steward-gated.
-- All three set verbatim from the args (the UI prefills current values, and a
-- NULL price honestly clears the price).
CREATE OR REPLACE FUNCTION public.update_showcase_piece(p_instance_slug text, p_slug text, p_title text, p_description text, p_price_cents integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_inst uuid; v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'not a steward of this business'; END IF;
  UPDATE showcase_pieces
     SET title = trim(coalesce(p_title,'')), description = p_description,
         price_cents = p_price_cents, updated_at = now()
   WHERE instance_id = v_inst AND slug = p_slug;
  RETURN FOUND;
END $$;

REVOKE EXECUTE ON FUNCTION public.add_showcase_piece(text,text,text,text,text,text,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_showcase_piece(text,text,text,text,integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_showcase_piece(text,text,text,text,text,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_showcase_piece(text,text,text,text,integer) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Verify after apply:
--   As anon: moore_showcase('moore-divahs') rows carry price_cents; update RPC -> denied.
--   As Shay: update_showcase_piece fixes an old piece's price without re-upload.
