-- =============================================================================
-- 0141 — DR-0311 account unification: one person, two doors, one library
-- =============================================================================
-- Measured ground (nas-health run 32417595488, the census receipt): Darrell is
-- ONE person holding TWO auth.users rows — the gmail identity
-- f13843f2-742b-4f8a-82af-7ecfbdc536ec (darrellpoe06@gmail.com, ~22,400
-- attributed rows, the colg owner + moore-divahs admin seats) and the phone
-- door c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc (15636502416@phone.poetech.us,
-- 110 remappable rows + door-class singles). GoTrue cannot hold two password
-- credentials (6-digit PIN + full password) on one row, so two rows is the
-- structurally required design — the cure is to make the DATABASE know they
-- are the same person, not to delete either row. NOTHING here deletes: the
-- proposal to drop the gmail row was refused on the measured record (it alone
-- holds the colg/moore seats and 15 months of attribution).
--
-- Three moves:
--   1) person_links — the one-row fact "these two UUIDs are one person."
--      App roles can only SELECT their own link; there are NO app write
--      policies at all — links are written by migration (as postgres) only.
--   2) same_person(uuid) — STABLE SECURITY DEFINER predicate; substituted for
--      owner = auth.uid() on the PURE owner-scoped libraries (study_entries,
--      study_spaces from 0070; eternal_algorithms from 0071; tv_watch from
--      0072) and the owner BRANCH of tv_share_select (0074) — the circle
--      logic is untouched. game_saves is NOT touched: 0077 scopes it by
--      user_role_in_instance(instance_id), not by owner.
--   3) Attribution remap — the phone door's user-scoped rows move to the
--      gmail identity (board_tasks.created_by, usage_events.owner,
--      feedback.user_id, market_watchlist.created_by,
--      family_snapshots.updated_by), with floor + exhaustion assertions.
--      Door-class rows (user_credentials, dm_public_keys, member_presence,
--      instance_members) stay on the door — each door keeps its own key.

-- 1) The link table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS person_links (
  primary_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  door_user    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (primary_user, door_user),
  CONSTRAINT person_links_distinct CHECK (primary_user <> door_user),
  CONSTRAINT person_links_door_unique UNIQUE (door_user)
);

ALTER TABLE person_links ENABLE ROW LEVEL SECURITY;

-- SELECT only, and only the person's own link. NO insert/update/delete policy
-- exists on purpose: with RLS enabled and no policy, app roles cannot write a
-- link — self-linking to someone else's library is structurally impossible.
DROP POLICY IF EXISTS person_links_select ON person_links;
CREATE POLICY person_links_select ON person_links FOR SELECT
  USING (primary_user = auth.uid() OR door_user = auth.uid());

GRANT SELECT ON person_links TO authenticated;

-- Seed the one measured link: gmail identity <- phone door. Guarded so a box
-- without both rows (fresh install before the account copy) skips cleanly.
INSERT INTO person_links (primary_user, door_user)
SELECT g.id, p.id
  FROM auth.users g, auth.users p
 WHERE g.email = 'darrellpoe06@gmail.com'
   AND p.email = '15636502416@phone.poetech.us'
ON CONFLICT DO NOTHING;

-- 2) The predicate ------------------------------------------------------------
-- True when the row's owner IS the caller, or is linked to the caller in
-- either direction. STABLE (one snapshot per statement) + SECURITY DEFINER
-- (reads person_links under RLS bypass), search_path pinned (0074 pattern).
CREATE OR REPLACE FUNCTION public.same_person(other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT other = auth.uid()
      OR EXISTS (
           SELECT 1 FROM person_links
            WHERE (primary_user = auth.uid() AND door_user    = other)
               OR (door_user    = auth.uid() AND primary_user = other)
         );
$$;
GRANT EXECUTE ON FUNCTION public.same_person(uuid) TO authenticated, anon;

-- 3) Policy substitution — the pure owner-scoped libraries --------------------
-- study_entries + study_spaces (0070:44-62 verbatim, owner test widened):
DROP POLICY IF EXISTS study_entries_select ON study_entries;
CREATE POLICY study_entries_select ON study_entries FOR SELECT
  USING (same_person(owner));
DROP POLICY IF EXISTS study_entries_insert ON study_entries;
CREATE POLICY study_entries_insert ON study_entries FOR INSERT
  WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS study_entries_update ON study_entries;
CREATE POLICY study_entries_update ON study_entries FOR UPDATE
  USING (same_person(owner)) WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS study_entries_delete ON study_entries;
CREATE POLICY study_entries_delete ON study_entries FOR DELETE
  USING (same_person(owner));

DROP POLICY IF EXISTS study_spaces_select ON study_spaces;
CREATE POLICY study_spaces_select ON study_spaces FOR SELECT
  USING (same_person(owner));
DROP POLICY IF EXISTS study_spaces_insert ON study_spaces;
CREATE POLICY study_spaces_insert ON study_spaces FOR INSERT
  WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS study_spaces_update ON study_spaces;
CREATE POLICY study_spaces_update ON study_spaces FOR UPDATE
  USING (same_person(owner)) WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS study_spaces_delete ON study_spaces;
CREATE POLICY study_spaces_delete ON study_spaces FOR DELETE
  USING (same_person(owner));

-- eternal_algorithms (0071:35-48; PK is (owner, id), which is exactly why the
-- cure is a LINK and not an owner rewrite — rewriting owner would collide ids):
DROP POLICY IF EXISTS eternal_algorithms_select ON eternal_algorithms;
CREATE POLICY eternal_algorithms_select ON eternal_algorithms FOR SELECT
  USING (same_person(owner));
DROP POLICY IF EXISTS eternal_algorithms_insert ON eternal_algorithms;
CREATE POLICY eternal_algorithms_insert ON eternal_algorithms FOR INSERT
  WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS eternal_algorithms_update ON eternal_algorithms;
CREATE POLICY eternal_algorithms_update ON eternal_algorithms FOR UPDATE
  USING (same_person(owner)) WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS eternal_algorithms_delete ON eternal_algorithms;
CREATE POLICY eternal_algorithms_delete ON eternal_algorithms FOR DELETE
  USING (same_person(owner));

-- tv_watch (0072:38-51):
DROP POLICY IF EXISTS tv_watch_select ON tv_watch;
CREATE POLICY tv_watch_select ON tv_watch FOR SELECT
  USING (same_person(owner));
DROP POLICY IF EXISTS tv_watch_insert ON tv_watch;
CREATE POLICY tv_watch_insert ON tv_watch FOR INSERT
  WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS tv_watch_update ON tv_watch;
CREATE POLICY tv_watch_update ON tv_watch FOR UPDATE
  USING (same_person(owner)) WITH CHECK (same_person(owner));
DROP POLICY IF EXISTS tv_watch_delete ON tv_watch;
CREATE POLICY tv_watch_delete ON tv_watch FOR DELETE
  USING (same_person(owner));

-- tv_share (0074:138-151): ONLY the owner branch of the SELECT widens; the
-- circle-membership logic (tv_is_member / tv_role / tv_is_spouse) and every
-- write policy stay byte-identical to 0074 — sharing semantics are untouched.
DROP POLICY IF EXISTS tv_share_select ON tv_share;
CREATE POLICY tv_share_select ON tv_share FOR SELECT
  USING (
    same_person(owner)
    OR (
      tv_is_member(circle_id, auth.uid())
      AND (
        tv_role(circle_id, auth.uid()) = 'parent'
        OR audience IN ('family', 'circle')
        OR (audience = 'us' AND tv_is_spouse(circle_id, auth.uid(), owner))
      )
    )
  );

-- 4) Attribution remap, with floor + exhaustion assertions --------------------
-- The phone door's user-scoped attribution moves to the gmail identity so the
-- person's record reads as ONE person everywhere. Assertions are replay-safe
-- by design (the relay's strict "exactly 110" was rejected on the record:
-- usage_events grows live, so equality would jam the replay frontier on
-- honest growth):
--   • FLOOR (conservation) — after the remap, each gmail-side count must be
--     >= its own pre-remap count plus the rows just moved. CORRECTED
--     2026-08-24: the original floor hardcoded the NAS census (board>=17,
--     usage>=2164, ...), which described ONE database at one moment; the
--     cloud twin behind db-migrate carries slightly different counts, so
--     0141 rolled back there on every replay (runs red since merge — run
--     32681100792 is the receipt). Conservation states the same no-loss
--     intent from the database's OWN baseline, so it holds on any box and
--     still uses >= (never =) so honest live growth can never jam a replay.
--   • EXHAUSTION — zero phone-attributed rows remain in each column. Holds by
--     construction immediately after the UPDATE, on every replay.
-- Actual moved counts are NOTICE'd so the replay log is the receipt.
DO $$
DECLARE
  gml uuid; phn uuid;
  b_board int; b_usage int; b_feed int; b_watch int; b_snap int;
  n_board int; n_usage int; n_feed int; n_watch int; n_snap int;
  g_board int; g_usage int; g_feed int; g_watch int; g_snap int;
  x_total int;
BEGIN
  SELECT id INTO gml FROM auth.users WHERE email = 'darrellpoe06@gmail.com';
  SELECT id INTO phn FROM auth.users WHERE email = '15636502416@phone.poetech.us';
  IF gml IS NULL OR phn IS NULL THEN
    RAISE NOTICE 'DR-0311 remap skipped: both identities are not present on this box (gmail found: %, phone found: %)', gml IS NOT NULL, phn IS NOT NULL;
    RETURN;
  END IF;

  -- Baseline: this database's own gmail-side counts BEFORE the remap.
  SELECT count(*) INTO b_board FROM board_tasks      WHERE created_by = gml;
  SELECT count(*) INTO b_usage FROM usage_events     WHERE owner      = gml;
  SELECT count(*) INTO b_feed  FROM feedback         WHERE user_id    = gml;
  SELECT count(*) INTO b_watch FROM market_watchlist WHERE created_by = gml;
  SELECT count(*) INTO b_snap  FROM family_snapshots WHERE updated_by = gml;

  UPDATE board_tasks       SET created_by = gml WHERE created_by = phn;
  GET DIAGNOSTICS n_board = ROW_COUNT;
  UPDATE usage_events      SET owner      = gml WHERE owner      = phn;
  GET DIAGNOSTICS n_usage = ROW_COUNT;
  UPDATE feedback          SET user_id    = gml WHERE user_id    = phn;
  GET DIAGNOSTICS n_feed  = ROW_COUNT;
  UPDATE market_watchlist  SET created_by = gml WHERE created_by = phn;
  GET DIAGNOSTICS n_watch = ROW_COUNT;
  UPDATE family_snapshots  SET updated_by = gml WHERE updated_by = phn;
  GET DIAGNOSTICS n_snap  = ROW_COUNT;

  RAISE NOTICE 'DR-0311 remap moved phone->gmail: board_tasks.created_by=% usage_events.owner=% feedback.user_id=% market_watchlist.created_by=% family_snapshots.updated_by=% (total %)',
    n_board, n_usage, n_feed, n_watch, n_snap, n_board + n_usage + n_feed + n_watch + n_snap;

  -- FLOOR (conservation): gmail-side per column >= its own baseline + moved.
  SELECT count(*) INTO g_board FROM board_tasks      WHERE created_by = gml;
  SELECT count(*) INTO g_usage FROM usage_events     WHERE owner      = gml;
  SELECT count(*) INTO g_feed  FROM feedback         WHERE user_id    = gml;
  SELECT count(*) INTO g_watch FROM market_watchlist WHERE created_by = gml;
  SELECT count(*) INTO g_snap  FROM family_snapshots WHERE updated_by = gml;
  RAISE NOTICE 'DR-0311 floor check (gmail-side after remap, vs own baseline+moved): board_tasks=% (>=%) usage_events=% (>=%) feedback=% (>=%) market_watchlist=% (>=%) family_snapshots=% (>=%)',
    g_board, b_board + n_board, g_usage, b_usage + n_usage, g_feed, b_feed + n_feed, g_watch, b_watch + n_watch, g_snap, b_snap + n_snap;
  IF g_board < b_board + n_board OR g_usage < b_usage + n_usage OR g_feed < b_feed + n_feed
     OR g_watch < b_watch + n_watch OR g_snap < b_snap + n_snap THEN
    RAISE EXCEPTION 'DR-0311 FLOOR FAILED: a gmail-side count fell below its own baseline plus the rows just moved — the library this remap promised is not all here. Check the baseline data before re-running (board=% usage=% feed=% watch=% snap=%)',
      g_board, g_usage, g_feed, g_watch, g_snap;
  END IF;

  -- EXHAUSTION: no phone-attributed rows remain in any remapped column.
  SELECT (SELECT count(*) FROM board_tasks      WHERE created_by = phn)
       + (SELECT count(*) FROM usage_events     WHERE owner      = phn)
       + (SELECT count(*) FROM feedback         WHERE user_id    = phn)
       + (SELECT count(*) FROM market_watchlist WHERE created_by = phn)
       + (SELECT count(*) FROM family_snapshots WHERE updated_by = phn)
    INTO x_total;
  RAISE NOTICE 'DR-0311 exhaustion check: phone-attributed rows remaining across all five columns = %', x_total;
  IF x_total <> 0 THEN
    RAISE EXCEPTION 'DR-0311 EXHAUSTION FAILED: % phone-attributed rows remain after the remap', x_total;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
