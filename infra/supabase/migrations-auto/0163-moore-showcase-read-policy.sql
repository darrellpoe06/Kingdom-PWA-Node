-- =============================================================================
-- 0163 — the moore-showcase bucket gets the SELECT policy it never had
-- =============================================================================
-- Found 2026-08-31 during the gallery-images regression audit. 0092 created the
-- bucket and a steward INSERT policy on storage.objects, but NO SELECT policy.
-- Reads work today only because the bucket row carries public = true and
-- /object/public bypasses RLS entirely. That is a latent fail-closed trap: the
-- day anything reads this bucket through a signed or authenticated URL — a
-- storage restore that drops the public flag, the sovereign cutover recreating
-- buckets, or a move to createSignedUrl — every image 404s with no policy to
-- authorize it and nothing in the app to say why.
--
-- This states the intent the bucket has always had, explicitly: these blobs are
-- public-read. Nothing about today's behavior changes; the policy is simply
-- there when the public flag is not. Steward-only writes (0092) are untouched.
-- DEPENDS ON: 0092. IDEMPOTENT.
-- =============================================================================

DO $$
BEGIN
  EXECUTE $pol$
    CREATE POLICY moore_showcase_read ON storage.objects FOR SELECT TO anon, authenticated
      USING (bucket_id = 'moore-showcase')
  $pol$;
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN insufficient_privilege THEN
  RAISE NOTICE '0163: insufficient privilege on storage.objects policies - add the moore-showcase public read policy via the Supabase dashboard';
END $$;

-- Belt-and-braces: the bucket must still be public-read. If a restore or the
-- sovereign cutover recreated it closed, this puts it back the way 0092 meant.
DO $$
BEGIN
  UPDATE storage.buckets SET public = true WHERE id = 'moore-showcase' AND public IS DISTINCT FROM true;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0163: insufficient privilege on storage.buckets - confirm moore-showcase is public via the Supabase dashboard';
END $$;
