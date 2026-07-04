-- =============================================================================
-- 0074 — TV Time family/circle SHARING: the higher-stakes cross-member tenancy
-- =============================================================================
-- Darrell 2026-07-04, co-designed. This is the layer 0072 deliberately DEFERRED:
--   "the CIRCLE-SHARED layer ... is a SEPARATE, higher-stakes tenancy (self-formed
--    groups + invite-code join + membership-gated RLS) and lands in its own
--    migration ONLY AFTER a data-isolation smoke-test on the live NAS Supabase
--    (circle A must never read circle B)."
--
-- THE MODEL. A show is PRIVATE by default. Per show, the owner opts it into
-- independent audiences (never nested):
--   us      — the owner + their spouse only (never the kids)
--   family  — the whole household, INCLUDING the kids (kid-appropriate)
--   circle  — the friend group / community feed
-- The owner's CLIENT publishes, per audience, ONLY the shows flagged for it
-- (lib/tv-sharing.js publishDocFor). A private show is never written to tv_share,
-- so it cannot leak even if a policy were wrong — RLS is the SECOND wall; the
-- publish filter is the first (defense in depth).
--
-- KIDS ARE PROTECTED. A child never reads 'us'. A parent has oversight (reads any
-- household member's shares). Nobody reads across circles. The RLS below MIRRORS
-- lib/tv-sharing.js canReadShare exactly, so the JS and SQL walls can be diffed.
--
-- ⚠ ENABLEMENT GATE (DR-0076 — no unverified multi-tenant isolation marked done).
-- Creating these tables does NOT expose anything: no UI reads tv_share until the
-- Family/Circle views ship AND the isolation smoke test
-- (infra/supabase/tests/0074-isolation-smoke.sql) passes on the LIVE NAS Supabase.
-- Circle A must never read Circle B; a non-member must never read the kids.
--
-- IDEMPOTENT: IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE.

-- 1. A circle — a self-formed group. kind: 'household' (has parent/child roles) or
--    'friends' (peers). Joined by a short invite code.
CREATE TABLE IF NOT EXISTS tv_circle (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL DEFAULT 'My circle',
  kind         text NOT NULL DEFAULT 'friends' CHECK (kind IN ('household', 'friends')),
  invite_code  text NOT NULL UNIQUE,
  created_by   uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Membership — one row per (circle, member). role gates visibility; spouse_of
--    names the member's spouse WITHIN the circle (drives the 'us' audience).
CREATE TABLE IF NOT EXISTS tv_circle_member (
  circle_id   uuid NOT NULL REFERENCES tv_circle(id) ON DELETE CASCADE,
  member      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'adult' CHECK (role IN ('parent', 'adult', 'child')),
  spouse_of   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display     text NOT NULL DEFAULT '',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (circle_id, member)
);

-- 3. Shared docs — one row per (owner, circle, audience). doc holds ONLY the shows
--    the owner flagged for that audience (published by the client; never private).
CREATE TABLE IF NOT EXISTS tv_share (
  owner       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  circle_id   uuid NOT NULL REFERENCES tv_circle(id) ON DELETE CASCADE,
  audience    text NOT NULL CHECK (audience IN ('us', 'family', 'circle')),
  doc         jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner, circle_id, audience)
);

-- ── SECURITY DEFINER helpers ────────────────────────────────────────────────
-- These read membership WITHOUT triggering tv_circle_member's own RLS (avoids
-- policy-on-policy recursion). They are the ONLY carve-out; each is a narrow,
-- read-only predicate. STABLE + SECURITY DEFINER, search_path pinned.
CREATE OR REPLACE FUNCTION tv_is_member(_circle uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM tv_circle_member m WHERE m.circle_id = _circle AND m.member = _uid);
$$;

CREATE OR REPLACE FUNCTION tv_role(_circle uuid, _uid uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.role FROM tv_circle_member m WHERE m.circle_id = _circle AND m.member = _uid;
$$;

-- Is _viewer the spouse of _owner within _circle (and not a child)? Drives 'us'.
CREATE OR REPLACE FUNCTION tv_is_spouse(_circle uuid, _viewer uuid, _owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tv_circle_member m
    WHERE m.circle_id = _circle AND m.member = _viewer
      AND m.role <> 'child' AND m.spouse_of = _owner
  );
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE tv_circle        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_circle_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_share         ENABLE ROW LEVEL SECURITY;

-- tv_circle: a member sees their own circles; anyone may create a circle they own;
-- the creator may rename/remove it.
DROP POLICY IF EXISTS tv_circle_select ON tv_circle;
CREATE POLICY tv_circle_select ON tv_circle FOR SELECT
  USING (tv_is_member(id, auth.uid()) OR created_by = auth.uid());
DROP POLICY IF EXISTS tv_circle_insert ON tv_circle;
CREATE POLICY tv_circle_insert ON tv_circle FOR INSERT
  WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS tv_circle_update ON tv_circle;
CREATE POLICY tv_circle_update ON tv_circle FOR UPDATE
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS tv_circle_delete ON tv_circle;
CREATE POLICY tv_circle_delete ON tv_circle FOR DELETE
  USING (created_by = auth.uid());

-- tv_circle_member: a member sees co-members of circles they belong to. You may
-- add YOURSELF (join by invite — the client verifies the code, then inserts self);
-- a parent may add/adjust members (set a child's role) in their household; you may
-- remove yourself, a parent may remove anyone in their circle.
DROP POLICY IF EXISTS tv_member_select ON tv_circle_member;
CREATE POLICY tv_member_select ON tv_circle_member FOR SELECT
  USING (tv_is_member(circle_id, auth.uid()));
DROP POLICY IF EXISTS tv_member_insert ON tv_circle_member;
CREATE POLICY tv_member_insert ON tv_circle_member FOR INSERT
  WITH CHECK (
    member = auth.uid()                                   -- join yourself
    OR tv_role(circle_id, auth.uid()) = 'parent'          -- a parent adds household members
  );
DROP POLICY IF EXISTS tv_member_update ON tv_circle_member;
CREATE POLICY tv_member_update ON tv_circle_member FOR UPDATE
  USING (member = auth.uid() OR tv_role(circle_id, auth.uid()) = 'parent')
  WITH CHECK (member = auth.uid() OR tv_role(circle_id, auth.uid()) = 'parent');
DROP POLICY IF EXISTS tv_member_delete ON tv_circle_member;
CREATE POLICY tv_member_delete ON tv_circle_member FOR DELETE
  USING (member = auth.uid() OR tv_role(circle_id, auth.uid()) = 'parent');

-- tv_share: WRITE is owner-only AND the owner must belong to the circle. READ is
-- the crux — it MIRRORS lib/tv-sharing.js canReadShare:
--   • owner always reads their own shares
--   • else viewer must be a member of the row's circle, AND
--       - a parent reads any member's shares (oversight), OR
--       - audience is 'family' or 'circle' (any member incl. kids), OR
--       - audience is 'us' AND viewer is the owner's spouse (never a child)
DROP POLICY IF EXISTS tv_share_select ON tv_share;
CREATE POLICY tv_share_select ON tv_share FOR SELECT
  USING (
    owner = auth.uid()
    OR (
      tv_is_member(circle_id, auth.uid())
      AND (
        tv_role(circle_id, auth.uid()) = 'parent'
        OR audience IN ('family', 'circle')
        OR (audience = 'us' AND tv_is_spouse(circle_id, auth.uid(), owner))
      )
    )
  );
DROP POLICY IF EXISTS tv_share_insert ON tv_share;
CREATE POLICY tv_share_insert ON tv_share FOR INSERT
  WITH CHECK (owner = auth.uid() AND tv_is_member(circle_id, auth.uid()));
DROP POLICY IF EXISTS tv_share_update ON tv_share;
CREATE POLICY tv_share_update ON tv_share FOR UPDATE
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid() AND tv_is_member(circle_id, auth.uid()));
DROP POLICY IF EXISTS tv_share_delete ON tv_share;
CREATE POLICY tv_share_delete ON tv_share FOR DELETE
  USING (owner = auth.uid());

-- Realtime — a share update reaches co-members' open devices (RLS applies to the
-- stream, so a viewer only receives rows the SELECT policy already permits).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tv_share'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tv_share;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
