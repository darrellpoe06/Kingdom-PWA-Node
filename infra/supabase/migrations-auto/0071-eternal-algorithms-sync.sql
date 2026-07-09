-- =============================================================================
-- 0071 — Eternal Algorithms: sync rail + the publish window (Darrell 2026-07-03,
-- approved: "yes 🔥" to the forge→pulpit bridge).
-- =============================================================================
-- "Scriptures are eternal algorithms to me and to everything." Two rooms, one
-- pipeline: the Study gallery is the FORGE (circle-private, where a framework
-- is finished); the Church tab is the PULPIT (the public study series). This
-- migration gives the forge the same owner-only sync rail as the Study
-- (0070 — notes follow their owner's sign-in across devices), plus the ONE
-- deliberate public window: a SECURITY DEFINER function that exposes ONLY
-- entries the owner explicitly published, and exposes the deep 4D layer ONLY
-- when the owner chose to include it at publish time (DR-0094: the owner
-- decides what's shared — per entry, per layer).
--
-- PRIVACY MODEL: identical to 0070. Every row is OWNER-ONLY on every operation
-- (auth.uid() = owner); the realtime stream respects the same RLS. Unpublished
-- drafts/frameworks are readable by their owner's sign-in alone. `published`
-- is a real column (mirrored from doc by the client on upsert) so the public
-- window filters at the database, never in client code (DR-0074: never a
-- UI-only lock).
--
-- IDEMPOTENT: IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE.

CREATE TABLE IF NOT EXISTS eternal_algorithms (
  owner        uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id           text NOT NULL,             -- client-generated entry id (eternal-algorithms makeId)
  doc          jsonb NOT NULL DEFAULT '{}'::jsonb,
  published    boolean NOT NULL DEFAULT false,
  deleted      boolean NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner, id)
);

ALTER TABLE eternal_algorithms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eternal_algorithms_select ON eternal_algorithms;
CREATE POLICY eternal_algorithms_select ON eternal_algorithms FOR SELECT
  USING (owner = auth.uid());
DROP POLICY IF EXISTS eternal_algorithms_insert ON eternal_algorithms;
CREATE POLICY eternal_algorithms_insert ON eternal_algorithms FOR INSERT
  WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS eternal_algorithms_update ON eternal_algorithms;
CREATE POLICY eternal_algorithms_update ON eternal_algorithms FOR UPDATE
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS eternal_algorithms_delete ON eternal_algorithms;
CREATE POLICY eternal_algorithms_delete ON eternal_algorithms FOR DELETE
  USING (owner = auth.uid());

-- The ONE public window (pattern: 0029 theword_public_sermons). Returns ONLY
-- published, non-deleted entries, and ONLY their public-safe fields. The deep
-- 4D layer (four_d_summary) is NULL unless the owner chose "include the deep
-- layer" at publish time (doc.publish4D). Scripture refs are always public —
-- the Word is the point.
CREATE OR REPLACE FUNCTION public.eternal_algorithms_public()
RETURNS TABLE (
  id text,
  name text,
  outcome text,
  three_d_summary text,
  four_d_summary text,
  scripture text,
  tags jsonb,
  published_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id,
         a.doc->>'name',
         a.doc->>'outcome',
         a.doc->'threeD'->>'summary',
         CASE WHEN (a.doc->>'publish4D')::boolean IS TRUE
              THEN a.doc->'fourD'->>'summary' ELSE NULL END,
         a.doc->'fourD'->>'scripture',
         COALESCE(a.doc->'tags', '[]'::jsonb),
         NULLIF(a.doc->>'publishedAt', '')::timestamptz
  FROM eternal_algorithms a
  WHERE a.published = true AND a.deleted = false
  ORDER BY NULLIF(a.doc->>'publishedAt', '')::timestamptz DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.eternal_algorithms_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eternal_algorithms_public() TO anon, authenticated;

-- Realtime — the owner's other open devices update live (RLS-scoped stream).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'eternal_algorithms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE eternal_algorithms;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
