-- =============================================================================
-- 0186 -- FULL PROFILES: one row per person, seen by the people who may
--         already message you (DR-0342)
-- =============================================================================
-- Darrell, 2026-09-09, from the church door: "we want users to have full
-- profiles etc.... Robust Architecture and development and design" -- and:
-- "scalability is key."
--
-- WHAT EXISTED. A person's name lived in instance_members.display_name, one
-- copy per instance they belong to, plus snapshots in messages, choir rows and
-- presence. There was no picture, no house, no ministries, no testimony, and no
-- single place the person owns. Every surface that shows a person showed a
-- string.
--
-- THE DESIGN, AND WHY EACH LINE IS THE SCALABLE ONE.
--
-- 1. ONE ROW PER PERSON, keyed by auth.uid() -- not per instance. A family
--    member who is also a church member is one person with one profile; the
--    instance rows keep role and membership, the profile keeps the person.
--    Lookups are a primary-key read; there is nothing to fan out.
--
-- 2. THE LIST NEVER CARRIES THE BYTES (DR-0303 / P40, the 2026-08-14 lockout
--    class). The only picture stored is a small thumbnail (photo_thumb, a data
--    URL capped at 32,000 characters -- about 160px), and it is fetched by id
--    when a card opens, never in any roster. No storage bucket dependency: a
--    sovereign box that has not created its buckets (0183) still serves
--    profiles. Text fields are capped too, so a row stays a few KB for ever.
--
-- 3. WHO MAY SEE IT IS NOT A NEW POLICY. The question "may I see your
--    profile?" has the same answer as "may I message you?" -- users_can_dm
--    (0096): a leader and everyone in their instance, both ways; roster to
--    roster. get_profile() reuses that function and adds no reach. The owner
--    then narrows it with one field, visibility:
--      'members' (default) -- anyone who may message me sees the full card
--      'leaders'           -- only owners/admins of a shared instance see it
--      'private'           -- everyone gets name + picture only
--    Name and picture are never hidden from someone who may message you: a
--    thread must always show whom you are talking to.
--
-- 4. THE OWNER WRITES THROUGH ONE FUNCTION. upsert_my_profile() validates
--    every field on the server (lengths, the visibility set, the thumb cap)
--    and, when the display name changes, updates instance_members.display_name
--    for every membership the person holds -- so the roster, the contact list
--    and the messages all agree on the name, from one write, by the indexed
--    user_id.
--
-- 5. NO DIRECT SELECT FOR OTHERS. RLS lets a person read and write only their
--    own row; everyone else reads through get_profile(), which is SECURITY
--    DEFINER and applies the rule above. There is no way to enumerate profiles.
--
-- IDEMPOTENT (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS). No RETURNS
-- TABLE is widened (both functions are new). Word-first: "Let every one of us
-- please his neighbour for his good to edification" (Romans 15:2); a profile is
-- what a brother or sister is allowed to know so they can do that.
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  photo_thumb     text CHECK (photo_thumb IS NULL OR (photo_thumb LIKE 'data:image/%' AND char_length(photo_thumb) <= 32000)),
  house           text CHECK (house IS NULL OR char_length(house) <= 80),
  ministries      text[] NOT NULL DEFAULT '{}'::text[] CHECK (cardinality(ministries) <= 12),
  favorite_verse  text CHECK (favorite_verse IS NULL OR char_length(favorite_verse) <= 40),
  testimony       text CHECK (testimony IS NULL OR char_length(testimony) <= 2000),
  visibility      text NOT NULL DEFAULT 'members' CHECK (visibility IN ('members','leaders','private')),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- My own row, and only my own row, directly.
DROP POLICY IF EXISTS profiles_read_own ON profiles;
CREATE POLICY profiles_read_own ON profiles FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS profiles_delete_own ON profiles;
CREATE POLICY profiles_delete_own ON profiles FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- May I see this person's profile? Exactly the people who may message me may
-- see mine (users_can_dm, 0096), across any instance we share; then my own
-- visibility narrows what they get. Returns ONE row or nothing.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_profile(other uuid)
RETURNS TABLE (
  user_id uuid, display_name text, photo_thumb text, house text,
  ministries text[], favorite_verse text, testimony text, visibility text,
  updated_at timestamptz, full_view boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  may_message boolean := false;
  is_leader_of_shared boolean := false;
  p profiles%ROWTYPE;
BEGIN
  IF me IS NULL OR other IS NULL THEN RETURN; END IF;
  SELECT * INTO p FROM profiles WHERE profiles.user_id = other;
  IF NOT FOUND THEN RETURN; END IF;

  IF me = other THEN
    may_message := true; is_leader_of_shared := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM instance_members im
       WHERE im.user_id = other
         AND users_can_dm(im.instance_id, other)
    ) INTO may_message;
    IF NOT may_message THEN RETURN; END IF;
    SELECT EXISTS (
      SELECT 1 FROM instance_members mine
        JOIN instance_members theirs ON theirs.instance_id = mine.instance_id
       WHERE mine.user_id = me AND theirs.user_id = other
         AND mine.role IN ('owner','admin')
    ) INTO is_leader_of_shared;
  END IF;

  -- visibility: what the viewer is allowed beyond name + picture.
  IF p.visibility = 'members' OR (p.visibility = 'leaders' AND is_leader_of_shared) OR me = other THEN
    RETURN QUERY SELECT p.user_id, p.display_name, p.photo_thumb, p.house, p.ministries,
                        p.favorite_verse, p.testimony, p.visibility, p.updated_at, true;
  ELSE
    RETURN QUERY SELECT p.user_id, p.display_name, p.photo_thumb, NULL::text, '{}'::text[],
                        NULL::text, NULL::text, p.visibility, p.updated_at, false;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.get_profile(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_profile(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- The owner writes through here. Validates on the server; keeps every
-- membership's display_name in step with the profile's, by the indexed user_id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_my_profile(
  display_name_in text,
  photo_thumb_in text DEFAULT NULL,
  house_in text DEFAULT NULL,
  ministries_in text[] DEFAULT '{}'::text[],
  favorite_verse_in text DEFAULT NULL,
  testimony_in text DEFAULT NULL,
  visibility_in text DEFAULT 'members'
)
RETURNS profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  nm text := btrim(coalesce(display_name_in, ''));
  row_out profiles;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'sign in to edit your profile' USING ERRCODE = '42501'; END IF;
  IF char_length(nm) < 1 OR char_length(nm) > 80 THEN RAISE EXCEPTION 'a display name is 1 to 80 characters' USING ERRCODE = '22023'; END IF;
  IF visibility_in NOT IN ('members','leaders','private') THEN RAISE EXCEPTION 'visibility must be members, leaders or private' USING ERRCODE = '22023'; END IF;
  IF photo_thumb_in IS NOT NULL AND (photo_thumb_in NOT LIKE 'data:image/%' OR char_length(photo_thumb_in) > 32000) THEN
    RAISE EXCEPTION 'the picture must be a small image thumbnail' USING ERRCODE = '22023';
  END IF;

  INSERT INTO profiles (user_id, display_name, photo_thumb, house, ministries, favorite_verse, testimony, visibility, updated_at)
  VALUES (me, nm, photo_thumb_in, nullif(btrim(house_in), ''), coalesce(ministries_in, '{}'::text[]),
          nullif(btrim(favorite_verse_in), ''), nullif(btrim(testimony_in), ''), visibility_in, now())
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    photo_thumb = EXCLUDED.photo_thumb,
    house = EXCLUDED.house,
    ministries = EXCLUDED.ministries,
    favorite_verse = EXCLUDED.favorite_verse,
    testimony = EXCLUDED.testimony,
    visibility = EXCLUDED.visibility,
    updated_at = now()
  RETURNING * INTO row_out;

  -- One name everywhere: the roster, the contact list and every message
  -- header read instance_members.display_name.
  UPDATE instance_members SET display_name = nm WHERE user_id = me AND display_name IS DISTINCT FROM nm;

  RETURN row_out;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_my_profile(text, text, text, text[], text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.upsert_my_profile(text, text, text, text[], text, text, text) TO authenticated;
