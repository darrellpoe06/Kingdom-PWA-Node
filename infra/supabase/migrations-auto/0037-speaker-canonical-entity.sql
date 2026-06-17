-- =============================================================================
-- 0037 — Speaker as a canonical ENTITY, not a free-text string (Darrell 2026-06-17)
-- =============================================================================
-- THE BUG (surfaced on the The Word - Migdal "Preachers & Teachers" list): one
-- man, Bishop Lloyd E. Gwin ("BG"), fragmented into NINE roster entries because
-- choir_sermons.speaker is free text and the YouTube-title importer copied
-- whatever spelling each video used verbatim:
--   "Bishop Lloyd E. Gwin", "Bishop Lloyd Gwin", "Bishop Gwin",
--   "Bishop Lloyd E Gwin", "BISHOP LLOYD GWIN", "Bishop Lloyd E.Gwin",
--   "Bishop Lloyd E . Gwin", "Bishop E. Gwin", "Bishop Lloyd E .Gwin".
-- The roster grouped by the raw string, so the same person showed up nine times.
-- This violates "all data has a path and a purpose": the speaker must be a
-- normalized entity the message POINTS AT, never a string each row re-spells.
--
-- THE FIX (architecture-first, recurrence-proof at the DATA layer):
--   1. church_speakers  — one canonical row per real preacher/teacher, per
--      church instance. Carries a normalized name_key + an alias-key set so
--      every spelling resolves to ONE entity. is_primary flags the church's
--      primary voice (BG) — replacing the brittle /gwin/i regex with real data.
--   2. choir_sermons.speaker_id — a FK to that entity (the real normalization).
--      The denormalized choir_sermons.speaker text is kept as the canonical
--      DISPLAY copy (so the public RPC + existing readers need no join), always
--      rewritten to the entity's canonical_name.
--   3. A BEFORE INSERT/UPDATE TRIGGER canonicalizes EVERY write — the in-app
--      form, the YouTube importer, a future SQL backfill, a manual Studio edit.
--      A brand-new spelling either resolves to an existing entity (collapse) or
--      becomes its own canonical entity (a guest preacher) — it can never again
--      fragment an existing person. The database itself refuses to store a
--      free-text speaker; the typeahead in the UI is a convenience on top.
--   4. A one-time backfill points every historical row at its canonical entity
--      and rewrites its speaker text to canonical, so the count is TRULY one.
--
-- Targets the COLG instance by slug ('colg') for the BG seed; the entity model
-- + trigger are instance-general so any church instance behaves the same.
--
-- DEPENDS ON: 0011 (choir_sermons), 0012 (colg instance), schema-v2.1
--             (instances, user_in_choir, user_role_in_instance).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, ADD COLUMN IF NOT
--             EXISTS, ON CONFLICT, DROP-then-CREATE policies/trigger. Safe to
--             re-run; the backfill is deterministic and converges.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. NORMALIZATION KEY — lowercase, strip everything but [a-z0-9]. Collapses
--    case, spacing (incl. non-breaking/double spaces — the invisible duplicate
--    that made the SAME display name count twice), and punctuation. Two names
--    with the SAME letters+digits share a key; genuinely different name-forms
--    ("Bishop Gwin" vs "Bishop Lloyd E. Gwin") get DIFFERENT keys and are tied
--    together by an explicit alias set on the canonical record, not guessed.
--    IMMUTABLE so it is safe in indexes/constraints.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.speaker_norm(raw text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT regexp_replace(lower(coalesce(raw, '')), '[^a-z0-9]+', '', 'g')
$$;

-- ---------------------------------------------------------------------------
-- 1. ENTITY — church_speakers (one canonical record per real person, per church)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS church_speakers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,                 -- the ONE display spelling, e.g. "Bishop Lloyd E. Gwin"
  name_key       text NOT NULL,                 -- speaker_norm(canonical_name)
  aliases        text[] NOT NULL DEFAULT '{}',  -- additional normalized keys that resolve here
  is_primary     boolean NOT NULL DEFAULT false,-- the church's primary preacher (BG) — real-data replacement for /gwin/i
  role_title     text,                          -- optional, e.g. "Bishop", "Sister"
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);
-- One canonical key per instance — the constraint the find-or-create races on.
CREATE UNIQUE INDEX IF NOT EXISTS church_speakers_key_uniq
  ON church_speakers(instance_id, name_key);
CREATE INDEX IF NOT EXISTS church_speakers_instance_idx
  ON church_speakers(instance_id, is_primary DESC);

-- ---------------------------------------------------------------------------
-- 2. LINK — choir_sermons.speaker_id points at the entity (the normalization).
--    The existing free-text `speaker` column stays as the canonical display
--    cache, kept in sync by the trigger below (so the public RPC needs no join).
-- ---------------------------------------------------------------------------
ALTER TABLE choir_sermons
  ADD COLUMN IF NOT EXISTS speaker_id uuid REFERENCES church_speakers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS choir_sermons_speaker_idx ON choir_sermons(speaker_id);

-- ---------------------------------------------------------------------------
-- 3. RLS — read = any choir member (the roster names are already shown on the
--    public library); write/edit/delete = owner/admin. Mirrors choir_songs.
-- ---------------------------------------------------------------------------
ALTER TABLE church_speakers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS church_speakers_read   ON church_speakers;
DROP POLICY IF EXISTS church_speakers_write  ON church_speakers;
DROP POLICY IF EXISTS church_speakers_update ON church_speakers;
DROP POLICY IF EXISTS church_speakers_delete ON church_speakers;
CREATE POLICY church_speakers_read   ON church_speakers FOR SELECT
  USING (user_in_choir(instance_id));
CREATE POLICY church_speakers_write  ON church_speakers FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_speakers_update ON church_speakers FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY church_speakers_delete ON church_speakers FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- Explicit DML grant: the 0024 blanket grant only covered tables that existed
-- when it ran — a table created now is NOT reachable by `authenticated` without
-- this (every read/write would 403 with 42501 before RLS runs). grant-guard
-- enforces this for instance-scoped tables; here it is, actually correct.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_speakers TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. updated_at touch (reuses the shared trigger fn from 0011).
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS church_speakers_touch_updated ON church_speakers;
CREATE TRIGGER church_speakers_touch_updated
  BEFORE UPDATE ON church_speakers
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. SEED the primary voice — Bishop Lloyd E. Gwin, the one canonical record
--    for COLG, with the alias keys that tie the genuinely-different name-forms
--    to him: "Bishop Lloyd Gwin", "Bishop Gwin", "Bishop E. Gwin". (Pure
--    case/space/punctuation variants of "Bishop Lloyd E. Gwin" already share
--    the canonical key via speaker_norm and need no alias.)
-- ---------------------------------------------------------------------------
INSERT INTO church_speakers (instance_id, canonical_name, name_key, aliases, is_primary, role_title)
  SELECT i.id, 'Bishop Lloyd E. Gwin', speaker_norm('Bishop Lloyd E. Gwin'),
         ARRAY[speaker_norm('Bishop Lloyd Gwin'), speaker_norm('Bishop Gwin'), speaker_norm('Bishop E. Gwin')],
         true, 'Bishop'
  FROM instances i
  WHERE i.slug = 'colg'
ON CONFLICT (instance_id, name_key)
  DO UPDATE SET aliases = EXCLUDED.aliases, is_primary = true, role_title = EXCLUDED.role_title;

-- ---------------------------------------------------------------------------
-- 6. AUTO-CREATE a canonical record for every OTHER distinct normalized speaker
--    already in choir_sermons (guest preachers/teachers). Representative display
--    name = the longest distinct raw form for that key (most complete spelling).
--    Skips any key already covered by an existing canonical OR its aliases (so
--    no duplicate is created for the Gwin keys seeded above).
-- ---------------------------------------------------------------------------
INSERT INTO church_speakers (instance_id, canonical_name, name_key)
  SELECT reps.instance_id, reps.canonical_name, reps.name_key
  FROM (
    SELECT DISTINCT ON (s.instance_id, speaker_norm(s.speaker))
           s.instance_id,
           btrim(s.speaker)            AS canonical_name,
           speaker_norm(s.speaker)     AS name_key
    FROM choir_sermons s
    WHERE s.speaker IS NOT NULL
      AND speaker_norm(s.speaker) <> ''
    ORDER BY s.instance_id, speaker_norm(s.speaker),
             length(btrim(s.speaker)) DESC, btrim(s.speaker)
  ) reps
  WHERE NOT EXISTS (
    SELECT 1 FROM church_speakers cs
    WHERE cs.instance_id = reps.instance_id
      AND (cs.name_key = reps.name_key OR reps.name_key = ANY(cs.aliases))
  )
ON CONFLICT (instance_id, name_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. BACKFILL — point every historical row at its canonical entity and rewrite
--    its speaker text to the canonical display name. After this, the nine Gwin
--    variants are ONE: same speaker_id, same "Bishop Lloyd E. Gwin" string.
--    Deterministic + idempotent (re-running selects the same canonical).
-- ---------------------------------------------------------------------------
UPDATE choir_sermons s
   SET speaker_id = cs.id,
       speaker    = cs.canonical_name
  FROM church_speakers cs
 WHERE s.instance_id = cs.instance_id
   AND s.speaker IS NOT NULL
   AND (speaker_norm(s.speaker) = cs.name_key OR speaker_norm(s.speaker) = ANY(cs.aliases))
   AND (s.speaker_id IS DISTINCT FROM cs.id OR s.speaker IS DISTINCT FROM cs.canonical_name);

-- ---------------------------------------------------------------------------
-- 8. RECURRENCE GUARD AT THE DATA LAYER — a BEFORE INSERT/UPDATE trigger that
--    canonicalizes the speaker on EVERY write. Resolves NEW.speaker to its
--    entity (find-or-create), sets speaker_id, and rewrites speaker to the
--    canonical name. No write path can store a fragmenting free-text speaker
--    again. SECURITY DEFINER so the find-or-create into church_speakers always
--    succeeds; reaching here already required owner/admin write on choir_sermons.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.choir_sermons_canonicalize_speaker()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  k     text;
  sid   uuid;
  cname text;
BEGIN
  IF NEW.speaker IS NULL THEN
    NEW.speaker_id := NULL;
    RETURN NEW;
  END IF;

  k := speaker_norm(NEW.speaker);
  IF k = '' THEN                       -- whitespace/punctuation-only = no credit
    NEW.speaker    := NULL;
    NEW.speaker_id := NULL;
    RETURN NEW;
  END IF;

  -- Existing canonical for this key (by canonical key OR an alias)?
  SELECT id, canonical_name INTO sid, cname
    FROM church_speakers
   WHERE instance_id = NEW.instance_id
     AND (name_key = k OR k = ANY(aliases))
   LIMIT 1;

  -- None yet: create one (a guest preacher/teacher). Race-safe via the unique
  -- key + ON CONFLICT, then re-select so a concurrent insert still resolves.
  IF sid IS NULL THEN
    INSERT INTO church_speakers (instance_id, canonical_name, name_key, created_by)
    VALUES (NEW.instance_id, btrim(NEW.speaker), k, NEW.created_by)
    ON CONFLICT (instance_id, name_key) DO NOTHING
    RETURNING id, canonical_name INTO sid, cname;

    IF sid IS NULL THEN
      SELECT id, canonical_name INTO sid, cname
        FROM church_speakers
       WHERE instance_id = NEW.instance_id AND name_key = k
       LIMIT 1;
    END IF;
  END IF;

  NEW.speaker_id := sid;
  NEW.speaker    := cname;             -- store the ONE canonical display name
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS choir_sermons_canonicalize ON choir_sermons;
CREATE TRIGGER choir_sermons_canonicalize
  BEFORE INSERT OR UPDATE OF speaker, speaker_id, instance_id ON choir_sermons
  FOR EACH ROW EXECUTE FUNCTION public.choir_sermons_canonicalize_speaker();

-- ---------------------------------------------------------------------------
-- 9. REALTIME — stream church_speakers so the leadership typeahead stays live.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'church_speakers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE church_speakers;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
