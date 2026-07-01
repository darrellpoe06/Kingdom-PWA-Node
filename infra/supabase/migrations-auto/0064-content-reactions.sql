-- =============================================================================
-- 0064 — content_reactions: the ONE reusable in-app reaction primitive.
-- =============================================================================
-- Darrell 2026-07-01: in-app reactions are PoeTech's OWN palette and the PRIMARY
-- engagement/ranking signal (YouTube stats are secondary display). Social-media
-- style — a person taps ONE reaction on a piece of content; tapping again removes
-- it; switching replaces it cleanly. The set is the "Images of the Godhead"
-- palette (Lion / Lamb / Crown / Dove / Fire / ...) plus like / love / amen /
-- wrestling. REUSABLE across ANY content: sermons, studies, songs, posts, AND
-- family/financial DECISIONS ("the kids loving a budget decision Christina made").
--
-- SUPERSEDES 0063's sermon-only sermon_reactions + sermon_reaction_counts (which
-- shipped hours earlier with ~no data). Those are DROPPED here so there is ONE
-- reaction table, not two (DR-0079 consistency / ONE-primitive). The YouTube
-- secondary display (sermon_video_stats) is KEPT untouched.
--
-- SINGLE-PICK: one row per (instance, content_type, content_id, user). The UNIQUE
-- makes the toggle unambiguous — the buggy double-count/stuck-heart is gone by
-- construction. Toggle-off = delete the row; switch = update reaction_key.
--
-- reaction_key is free text (a light non-empty check) — NOT an enum — so adding a
-- reaction is a one-line JS registry change (lib/reactions.js), never a migration.
--
-- PRIVACY / VISIBILITY (community-default, DATA-AS-EMPOWERMENT):
--   * direct SELECT = own rows only (a member sees/toggles their OWN pick).
--   * AGGREGATE counts via SECURITY DEFINER RPC content_reaction_counts() — the
--     community-visible per-reaction totals, NO user id.
--   * WHO reacted via SECURITY DEFINER RPC content_reactors(), gated to INSTANCE
--     MEMBERS only (a family member sees the kids' reactions on a decision — the
--     encouragement; a non-member never reads names). This is the "tap shows who,
--     where appropriate" path.
--
-- SCOPE / SAFETY: reacting is self-scoped (user_id = auth.uid()). A scoped kid /
-- learner reacts only to content the guardian has granted them access to reach —
-- that gating lives at the SURFACE/content layer (roles + relationship scope),
-- not here; this table just records the tap. COPPA-safe: no PII beyond a display
-- name the user already shows in the app; family-positive by design.
--
-- DEPENDS ON: instances, user_role_in_instance, engagement_touch_updated_at
--   (present since 0011/0050). NO anon policy (the Choir 42501 rule).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/fns, guarded
--   publication add, guarded DROP of the 0063 objects. Additive + one clean drop.
-- APPLY: db-migrate. Until applied, reaction fetches degrade to empty (the control
--   shows the palette but no counts) and never throw.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Retire the 0063 sermon-only reaction table + its RPC (superseded). Guarded so
-- the migration is safe whether or not 0063 ran on this cloud.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.sermon_reaction_counts(uuid);
DROP TABLE    IF EXISTS sermon_reactions;

-- ---------------------------------------------------------------------------
-- content_reactions — one row per (instance, content_type, content_id, user).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  content_type  text NOT NULL,                 -- 'sermon' | 'decision' | 'study' | 'song' | 'post' | ...
  content_id    text NOT NULL,                 -- stable id of the item (video_id, decision id, ...)
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_key  text NOT NULL CHECK (char_length(reaction_key) BETWEEN 1 AND 40),
  display_name  text,                          -- snapshot so content_reactors() needs no join
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  UNIQUE (instance_id, content_type, content_id, user_id)   -- single-pick per person per item
);

CREATE INDEX IF NOT EXISTS content_reactions_item_idx ON content_reactions(instance_id, content_type, content_id);
CREATE INDEX IF NOT EXISTS content_reactions_user_idx ON content_reactions(user_id);

DROP TRIGGER IF EXISTS content_reactions_touch_updated ON content_reactions;
CREATE TRIGGER content_reactions_touch_updated
  BEFORE UPDATE ON content_reactions
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON content_reactions TO authenticated;
ALTER TABLE content_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_reactions_own_read   ON content_reactions;
DROP POLICY IF EXISTS content_reactions_own_insert ON content_reactions;
DROP POLICY IF EXISTS content_reactions_own_update ON content_reactions;
DROP POLICY IF EXISTS content_reactions_own_delete ON content_reactions;

-- READ = own rows only (my pick / toggle state). Counts + who come via the RPCs.
CREATE POLICY content_reactions_own_read ON content_reactions FOR SELECT
  TO authenticated USING (user_id = auth.uid());
-- INSERT / UPDATE / DELETE = self only (react/switch/remove your OWN reaction).
CREATE POLICY content_reactions_own_insert ON content_reactions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY content_reactions_own_update ON content_reactions FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY content_reactions_own_delete ON content_reactions FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- content_reaction_counts — aggregate totals per item + reaction (NO user id).
-- Community-visible engagement signal. Scoped to one instance + content_type so
-- it never sweeps another tenant's or another surface's reactions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.content_reaction_counts(p_instance uuid, p_content_type text)
RETURNS TABLE (content_id text, reaction_key text, count bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT content_id, reaction_key, count(*)::bigint
    FROM content_reactions
   WHERE instance_id = p_instance AND content_type = p_content_type
   GROUP BY content_id, reaction_key
$$;
REVOKE ALL ON FUNCTION public.content_reaction_counts(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.content_reaction_counts(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- content_reactors — WHO reacted on one item (reaction_key + display_name),
-- gated to INSTANCE MEMBERS (the "tap shows who, where appropriate" path). A
-- non-member gets nothing; a family member sees the kids' reactions on a decision.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.content_reactors(p_instance uuid, p_content_type text, p_content_id text)
RETURNS TABLE (reaction_key text, display_name text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT reaction_key, display_name
    FROM content_reactions
   WHERE instance_id = p_instance
     AND content_type = p_content_type
     AND content_id = p_content_id
     AND public.user_role_in_instance(p_instance) IS NOT NULL   -- caller must be a member
   ORDER BY created_at
$$;
REVOKE ALL ON FUNCTION public.content_reactors(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.content_reactors(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- REALTIME — a reaction tapped on one device updates the counts live on another.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'content_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE content_reactions;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
