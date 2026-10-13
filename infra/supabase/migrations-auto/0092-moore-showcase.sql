-- =============================================================================
-- 0092 — the showcase gallery: her previous work, front-screen (DR-0114 lane)
-- =============================================================================
-- Darrell 2026-07-07: "an image space showcasing her previous work for clients
-- to get inspired and purchase their own... She will upload historical images
-- when she is ready. Make sure it looks good to display to users when they
-- enter." Pieces are steward-curated rows; images live in a PUBLIC-READ
-- storage bucket (the 0078 pattern); anon sees pieces ONLY through the
-- definer read (no table access); every write is a steward-gated RPC that
-- pins the business instance server-side. Sort: pinned favorites first, then
-- newest (Darrell: "sorted by whatever makes sense").
-- DEPENDS ON: 0078 pattern, 0089 (moore-divahs instance). IDEMPOTENT.
-- =============================================================================

-- The public-read image bucket (uploads still require the policies below).
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('moore-showcase', 'moore-showcase', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0092: insufficient privilege on storage.buckets - create moore-showcase (public) via the Supabase dashboard';
END $$;

-- Steward-only writes into the bucket (public read rides bucket.public).
DO $$
BEGIN
  EXECUTE $pol$
    CREATE POLICY moore_showcase_write ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'moore-showcase'
        AND EXISTS (
          SELECT 1 FROM instance_members im JOIN instances i ON i.id = im.instance_id
           WHERE i.slug = 'moore-divahs' AND im.user_id = auth.uid()
             AND im.role IN ('owner','admin','member')
        )
      )
  $pol$;
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN insufficient_privilege THEN
  RAISE NOTICE '0092: insufficient privilege on storage.objects policies - add the moore-showcase steward write policy via the dashboard';
END $$;

CREATE TABLE IF NOT EXISTS showcase_pieces (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id),
  slug         text NOT NULL,
  title        text NOT NULL DEFAULT '',
  description  text,
  product_type text NOT NULL DEFAULT 'other',
  image_path   text NOT NULL,                 -- storage path in moore-showcase
  pinned       boolean NOT NULL DEFAULT false,
  seed         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz
);
CREATE INDEX IF NOT EXISTS showcase_pieces_instance_idx ON showcase_pieces(instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS showcase_pieces_slug_uniq ON showcase_pieces(instance_id, slug);

GRANT SELECT ON showcase_pieces TO authenticated;

ALTER TABLE showcase_pieces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS showcase_pieces_read ON showcase_pieces;
CREATE POLICY showcase_pieces_read ON showcase_pieces FOR SELECT
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- No INSERT/UPDATE/DELETE policies: every write goes through the RPCs below.

-- Public gallery read — piece data only, pinned-first then newest.
CREATE OR REPLACE FUNCTION public.moore_showcase(p_instance_slug text)
RETURNS TABLE (slug text, title text, description text, product_type text, image_path text, pinned boolean, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.slug, s.title, s.description, s.product_type, s.image_path, s.pinned, s.created_at
  FROM showcase_pieces s JOIN instances i ON i.id = s.instance_id
  WHERE i.slug = p_instance_slug AND s.seed IS NOT TRUE
  ORDER BY s.pinned DESC, s.created_at DESC
  LIMIT 100;
$$;
GRANT EXECUTE ON FUNCTION public.moore_showcase(text) TO anon;
GRANT EXECUTE ON FUNCTION public.moore_showcase(text) TO authenticated;

-- Steward writes — instance pinned server-side; membership checked; never anon.
CREATE OR REPLACE FUNCTION public.add_showcase_piece(p_instance_slug text, p_slug text, p_title text, p_description text, p_product_type text, p_image_path text)
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
  INSERT INTO showcase_pieces (instance_id, created_by, slug, title, description, product_type, image_path)
  VALUES (v_inst, auth.uid(), p_slug, trim(coalesce(p_title,'')), p_description, coalesce(p_product_type,'other'), p_image_path)
  ON CONFLICT (instance_id, slug) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.set_showcase_pin(p_instance_slug text, p_slug text, p_pinned boolean)
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
  UPDATE showcase_pieces SET pinned = coalesce(p_pinned,false), updated_at = now()
   WHERE instance_id = v_inst AND slug = p_slug;
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.delete_showcase_piece(p_instance_slug text, p_slug text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_inst uuid; v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role NOT IN ('owner','admin') THEN RAISE EXCEPTION 'owner/admin only'; END IF;
  DELETE FROM showcase_pieces WHERE instance_id = v_inst AND slug = p_slug;
  RETURN FOUND;
END $$;

REVOKE EXECUTE ON FUNCTION public.add_showcase_piece(text,text,text,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_showcase_pin(text,text,boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_showcase_piece(text,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_showcase_piece(text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_showcase_pin(text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_showcase_piece(text,text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Verify after apply:
--   As anon: moore_showcase('moore-divahs') -> pieces (or []); write RPCs -> denied.
--   As Shay: add/pin/delete work; a stranger authenticated -> 'not a steward'.
