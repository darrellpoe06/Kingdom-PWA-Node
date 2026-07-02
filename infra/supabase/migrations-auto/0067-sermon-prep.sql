-- =============================================================================
-- 0067 — sermon prep: the teacher's OWN pre-service outline as the authoritative
--        seed for The Word's points + the Scripture surface.
-- =============================================================================
-- Declared by Darrell 2026-07-02. Bishop Gwin EMAILS Christina his sermon prep
-- document (a .docx) before each service — his numbered teaching points and the
-- scriptures under each. That document is GROUND TRUTH: his own words + structure,
-- far cleaner than the numbered outline parsed from the noisy service transcript.
--
-- WHAT THIS TABLE HOLDS. One row per (instance, sermon) = BG's parsed prep outline
-- for that service: his `points` (each with its own scriptures + lettered sub-
-- points) as jsonb, the rolled-up `scriptures` list (the Scripture-surface feed),
-- his `theme`, and — the honesty contract — the `raw_text` the parse came from so a
-- human can re-check or re-parse, and `needs_review` = this is an editable DRAFT.
--
-- WHY IT WINS OVER THE TRANSCRIPT (sermon-points.js precedence prep > harvest >
-- transcript > title). Where a prep outline exists for a service, it is BG's own
-- outline — the transcript lane only fills gaps. This is also the fix for the two
-- current bugs: scripture references live in `scriptures` (they NO LONGER
-- masquerade as teaching points), and each point carries its real, incrementing
-- number from the source header (never "all 1.").
--
-- THE HUMAN-EDIT LEARNING HOOK (noted, not built here). `edited_by` + keeping
-- `raw_text` and the parser `version` means a later job can diff the machine parse
-- against a human-corrected outline as training signal for an LLM assist on the
-- CUDA boxes — the same learning-loop shape as the worship-song harvester. The
-- capture hook attaches at UPDATE of `points`/`scriptures` by a non-service role.
--
-- ROLE-SCOPED / NO LEAK (mirrors video_transcripts 0058, video_harvests 0050):
-- READ = the whole choir/leadership (user_in_choir, the same wall as the message
-- library); WRITE = owner/admin. NO anon policy — prep content is church-internal.
-- The producer (scripts/sermon-import/import-prep.mjs) writes with the SERVICE ROLE
-- key (bypasses RLS), reading Christina's owner-authorized mailbox in place.
--
-- MULTI-TENANT / CHANNEL-AGNOSTIC. Nothing here is COLG/BG-specific. The
-- teacher-email SOURCE is registered as a row in content_sources (0066) with
-- platform 'gmail-teacher' — another church plugs in its teacher's address by
-- config, no code change. A seed row for colg is added at the bottom (idempotent).
--
-- DEPENDS ON (all present): instances, choir_sermons, user_role_in_instance,
--   user_in_choir, engagement_touch_updated_at (0011/0050), content_sources (0066).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--   publication add, ON CONFLICT DO NOTHING seed. Additive, church-internal.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- One row per (instance, sermon). `points` is BG's outline; `scriptures` is the
-- rolled-up reference feed (his key text first). `anchor` is the primary text for
-- choir_sermons.scripture_ref. `source` records where the outline came from
-- (email = BG's prep .docx; transcript = derived; manual = a steward typed it).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sermon_prep (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sermon_id     uuid NOT NULL REFERENCES choir_sermons(id) ON DELETE CASCADE,
  service_date  date,
  service_type  text,
  theme         text,
  anchor        text,                          -- primary scripture (-> choir_sermons.scripture_ref)
  points        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{n,text,scriptures:[],subpoints:[{label,text,scriptures:[]}]}]
  scriptures    text[] NOT NULL DEFAULT '{}',  -- rolled-up distinct refs = the Scripture-surface feed
  source        text NOT NULL DEFAULT 'email'
                  CHECK (source IN ('email','transcript','manual')),
  source_ref    text,                          -- provenance (email subject / docx filename / uid)
  needs_review  boolean NOT NULL DEFAULT true, -- editable best-effort DRAFT until a steward confirms
  raw_text      text,                          -- the extracted document text the parse came from
  version       text,                          -- parser version, e.g. 'prep-outline:v1'
  edited_by     uuid,                          -- human-edit-capture hook (who last corrected)
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);

-- One prep outline per (instance, sermon) so the idempotent producer upserts,
-- never duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS sermon_prep_uniq     ON sermon_prep(instance_id, sermon_id);
CREATE INDEX        IF NOT EXISTS sermon_prep_inst_idx ON sermon_prep(instance_id);

-- updated_at touch (reuses the shared function from 0010/0011/0050).
DROP TRIGGER IF EXISTS sermon_prep_touch_updated ON sermon_prep;
CREATE TRIGGER sermon_prep_touch_updated
  BEFORE UPDATE ON sermon_prep
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs. Leave `anon` untouched (the Choir 42501 incident): a signed-in role
-- needs the EXPLICIT grant. NO grant to anon — prep content is never public.
-- The producer uses the SERVICE ROLE key, which bypasses RLS entirely.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON sermon_prep TO authenticated;

ALTER TABLE sermon_prep ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sermon_prep_read   ON sermon_prep;
DROP POLICY IF EXISTS sermon_prep_insert ON sermon_prep;
DROP POLICY IF EXISTS sermon_prep_update ON sermon_prep;
DROP POLICY IF EXISTS sermon_prep_delete ON sermon_prep;

-- READ = whole choir/leadership (same wall as the message library + the ledger).
CREATE POLICY sermon_prep_read ON sermon_prep FOR SELECT
  TO authenticated
  USING (user_in_choir(instance_id));
-- WRITE = owner/admin (the stewards; the producer writes as service_role, RLS-exempt).
CREATE POLICY sermon_prep_insert ON sermon_prep FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY sermon_prep_update ON sermon_prep FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY sermon_prep_delete ON sermon_prep FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a prep outline landed by the producer lights The Word live
-- on every open surface, the same way video_transcripts streams (0058).
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'sermon_prep'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sermon_prep;
  END IF;
END $realtime$;

-- ---------------------------------------------------------------------------
-- SEED the teacher-email source in the content_sources registry (0066) so the
-- producer is CONFIG-DRIVEN, not hardcoded. platform 'gmail-teacher'; source_key
-- is the teacher's sending address; config carries the mailbox + secret REFERENCE
-- (never a secret value). Another church adds its own row to onboard its teacher.
-- Idempotent via the UNIQUE(instance_id, platform, source_key).
-- ---------------------------------------------------------------------------
INSERT INTO content_sources (instance_id, platform, source_key, label, config, enabled)
SELECT i.id, 'gmail-teacher', 'bg@thechurchofthelivinggod.com',
       'Bishop Gwin prep emails (points + scriptures)',
       jsonb_build_object(
         'mailbox', 'mrspoe06@gmail.com',
         'auth', 'app-password',
         'secret_ref', 'gmail-mrspoe06',
         'match', 'proclaim',
         'attachment', 'docx'
       ),
       true
  FROM instances i
 WHERE i.slug = 'colg'
ON CONFLICT (instance_id, platform, source_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
