-- =============================================================================
-- church-archive-ci-bootstrap.sql — the storage shape 0342 asserts its bucket
-- and policies on, for the walls job in church-site-archive.yml (DR-1596).
-- Never applied to a real database.
-- =============================================================================
-- A throwaway postgres:16 has no storage-api. This supplies only what 0342
-- touches: storage.buckets (id, name, public) and storage.objects (bucket_id,
-- name) with RLS on, in the columns storage-api itself creates. Run after
-- door-work-ci-bootstrap.sql (roles, auth.users, auth.uid()).
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets(id), name text NOT NULL,
  owner uuid, created_at timestamptz DEFAULT now()
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON storage.objects, storage.buckets TO anon, authenticated, service_role;
