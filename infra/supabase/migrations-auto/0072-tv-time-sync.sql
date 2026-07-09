-- =============================================================================
-- 0072 — TV Time sync: your watch list follows your sign-in across your devices
-- (Darrell 2026-07-04: "Sure. Why not good idea." — sync the friend group's TV
-- Time). Foundation layer: OWNER-ONLY, the same proven rail Study rides (0070).
-- =============================================================================
-- TV Time was device-local localStorage by design — sovereign, never a third-
-- party cloud. This rail keeps the sovereignty promise because Supabase here IS
-- the family's own server (self-hosted on the Synology — infra/supabase/README.md):
-- the list moves between the OWNER's devices THROUGH the family NAS, never a
-- third-party cloud, never mined. It is the anti-"TV Time shut down and took your
-- data" guarantee at the database layer (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).
--
-- PRIVACY MODEL: every row is OWNER-ONLY. auth.uid() = owner on every operation;
-- the realtime stream respects the same RLS (WAL-RLS). Your list is readable by
-- your sign-in alone. This is the lowest-risk isolation model (identical to 0070,
-- already smoke-tested on the NAS for Study).
--
-- SHAPE: one row per owner — the whole normalized TV Time store as jsonb `doc`
-- ({ shows, custom }). Whole-list newest-wins by `updated_at` (a single user's own
-- devices; per-item CRDT merge is a documented refinement). localStorage stays the
-- immediate source of truth on-device; this table is the courier between devices.
--
-- NOTE (Darrell's cross-member "circle" ask): the CIRCLE-SHARED layer — friends
-- seeing each other's activity — is a SEPARATE, higher-stakes tenancy (self-formed
-- groups + invite-code join + membership-gated RLS) and lands in its own migration
-- ONLY AFTER a data-isolation smoke-test on the live NAS Supabase (circle A must
-- never read circle B). Not shipped here (DR-0076: no unverified multi-tenant
-- isolation marked done).
--
-- IDEMPOTENT: IF NOT EXISTS / DROP POLICY IF EXISTS; safe to re-run.

CREATE TABLE IF NOT EXISTS tv_watch (
  owner       uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  doc         jsonb NOT NULL DEFAULT '{}'::jsonb,   -- the normalized { shows, custom } store
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tv_watch ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tv_watch_select ON tv_watch;
CREATE POLICY tv_watch_select ON tv_watch FOR SELECT
  USING (owner = auth.uid());
DROP POLICY IF EXISTS tv_watch_insert ON tv_watch;
CREATE POLICY tv_watch_insert ON tv_watch FOR INSERT
  WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS tv_watch_update ON tv_watch;
CREATE POLICY tv_watch_update ON tv_watch FOR UPDATE
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());
DROP POLICY IF EXISTS tv_watch_delete ON tv_watch;
CREATE POLICY tv_watch_delete ON tv_watch FOR DELETE
  USING (owner = auth.uid());

-- Realtime — a save on one of the owner's devices reaches their other open
-- devices live; RLS applies to the stream (an owner only receives their own row).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'tv_watch'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tv_watch;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
