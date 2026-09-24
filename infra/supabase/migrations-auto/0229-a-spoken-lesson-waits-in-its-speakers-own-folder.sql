-- =============================================================================
-- 0229 — a spoken lesson waits in its speaker's own folder until Whisper on our
-- own machines has written its words (DR-0611)
-- =============================================================================
-- Darrell 2026-09-24: "can whisper work for us?" then "Go build the Whisper
-- intake". The Speak box uploads a recorded lesson here; the NAS loop
-- lesson-voice-transcribe polls outbound with the service role, downloads it,
-- transcribes it on the tower (CPU Whisper on the NAS as the fallback), keeps
-- the audio on the NAS, files the transcript to agent_inbox, and DELETES the
-- object here. The bucket is a waiting room, not an archive.
--
-- PRIVATE. Paths are `<owner user id>/<stamp>-<suffix>.<ext>`, so the first
-- folder segment IS the access rule (the 0201 family-documents shape). A
-- member reads, writes and removes only their own folder; nobody else's; no
-- anon access. The service role (the NAS loop) is unaffected by these policies.
-- No table is created, so no tenancy column is needed: the row that names the
-- audio lives in agent_inbox, which is already instance-scoped (0127).
-- =============================================================================

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('lesson-audio', 'lesson-audio', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0229: insufficient privilege on storage.buckets - create lesson-audio (PRIVATE) via the dashboard';
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS lesson_audio_object_read   ON storage.objects;
  DROP POLICY IF EXISTS lesson_audio_object_write  ON storage.objects;
  DROP POLICY IF EXISTS lesson_audio_object_delete ON storage.objects;

  CREATE POLICY lesson_audio_object_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'lesson-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY lesson_audio_object_write ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'lesson-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY lesson_audio_object_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'lesson-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0229: insufficient privilege on storage.objects - create the three lesson-audio policies via the dashboard';
END $$;

NOTIFY pgrst, 'reload schema';
