-- =============================================================================
-- 0246 — a person adds their own voice, with their own consent, and can take
-- it back (DR-0720)
-- =============================================================================
-- Darrell 2026-10-01: "can we somehow validate people using only their voice
-- so we can tag people who are speaking when we record?" and "Can you get my
-- voice the same way?"
--
-- ONE ROW PER PERSON: their consent (the words they agreed to, and when), the
-- label the transcript will show (two or three capital letters), the name
-- beside it, and where their voice stands. NO VOICEPRINT IS EVER STORED HERE:
-- the signature (a list of numbers) is made and kept only on the NAS
-- (infra/nas-lesson-voice/voice_enroll.py). The sample audio waits in the
-- person's own folder of the private lesson-audio bucket (0229) until the NAS
-- takes it and deletes it.
--
-- WALLS:
--   * RLS on. A person reads ONLY their own row. No client writes the table
--     directly: there are no INSERT, UPDATE or DELETE policies, and no grant.
--   * Every write is one of three functions that act on auth.uid()'s own row:
--       give_voice_consent()  -- the tap to agree, with the time;
--       send_voice_sample()   -- REFUSED without that consent row, and only
--                                 for a path in the person's own folder;
--       remove_my_voice()     -- deletes the row (the consent) at once; the
--                                 NAS deletes the voiceprint on its next pass
--                                 and never uses it again from this moment
--                                 (it reads consent live before naming).
--   * Labels: one per person, unique. BG is held for Bishop Gwin's
--     word-attributed print (DR-0712) and is not taken by self-enrollment;
--     DP may be taken only by the Governor (Darrell re-enrolling himself).
--   * The Governor sees the LABEL LIST (label, name, state) through
--     voice_enrollment_labels(); never a vector (none exists here), never a
--     sample path.
--   * The NAS writes the result (status, reason, enrolled_at) with the
--     service role, which RLS does not restrict.
-- No instance_id: this is the person's own consent, not household data.
-- Proven by scripts/voice-enrollment-ci-smoke.sql on a real PostgreSQL (CI job
-- voice-enrollments) and infra/supabase/tests/0246-voice-enrollment-smoke.sql.
-- IDEMPOTENT: IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.voice_enrollments (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  label          text NOT NULL CHECK (label ~ '^[A-Z]{2,3}$'),
  display_name   text NOT NULL DEFAULT '' CHECK (length(display_name) <= 80),
  consent_text   text NOT NULL CHECK (length(btrim(consent_text)) > 0),
  consented_at   timestamptz NOT NULL DEFAULT now(),
  keep_sample    boolean NOT NULL DEFAULT false,
  sample_path    text,
  sample_sent_at timestamptz,
  status         text NOT NULL DEFAULT 'consented'
                 CHECK (status IN ('consented', 'sample-sent', 'enrolled', 'refused')),
  reason         text,
  enrolled_at    timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS voice_enrollments_label_key ON public.voice_enrollments (label);

ALTER TABLE public.voice_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.voice_enrollments FROM PUBLIC;
REVOKE ALL ON public.voice_enrollments FROM anon;
REVOKE ALL ON public.voice_enrollments FROM authenticated;
GRANT SELECT ON public.voice_enrollments TO authenticated;
GRANT ALL ON public.voice_enrollments TO service_role;

DROP POLICY IF EXISTS voice_enrollments_own_read ON public.voice_enrollments;
CREATE POLICY voice_enrollments_own_read ON public.voice_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- The tap to agree. Re-agreeing (to record again, or to change the name) keeps
-- an added voice standing only while the label stays the same.
CREATE OR REPLACE FUNCTION public.give_voice_consent(p_label text, p_display_name text, p_consent_text text, p_keep_sample boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_label text := upper(btrim(coalesce(p_label, '')));
  v_name  text := btrim(coalesce(p_display_name, ''));
  v_row   public.voice_enrollments;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'give_voice_consent: sign in first' USING ERRCODE = '42501';
  END IF;
  IF v_label !~ '^[A-Z]{2,3}$' THEN
    RAISE EXCEPTION 'give_voice_consent: the label is two or three letters, like JM';
  END IF;
  IF length(btrim(coalesce(p_consent_text, ''))) = 0 THEN
    RAISE EXCEPTION 'give_voice_consent: the words agreed to are required';
  END IF;
  IF length(v_name) > 80 THEN
    RAISE EXCEPTION 'give_voice_consent: the name is 80 characters or fewer';
  END IF;
  IF v_label = 'BG' THEN
    RAISE EXCEPTION 'give_voice_consent: BG is held for Bishop Gwin; choose other letters' USING ERRCODE = '42501';
  END IF;
  IF v_label = 'DP' AND NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'give_voice_consent: DP is held for Darrell Poe; choose other letters' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.voice_enrollments e WHERE e.label = v_label AND e.user_id <> v_uid) THEN
    RAISE EXCEPTION 'give_voice_consent: % is already someone''s label; choose other letters', v_label USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.voice_enrollments AS e (user_id, label, display_name, consent_text, consented_at, keep_sample, status, updated_at)
  VALUES (v_uid, v_label, v_name, btrim(p_consent_text), now(), coalesce(p_keep_sample, false), 'consented', now())
  ON CONFLICT (user_id) DO UPDATE
     SET label        = EXCLUDED.label,
         display_name = EXCLUDED.display_name,
         consent_text = EXCLUDED.consent_text,
         consented_at = now(),
         keep_sample  = EXCLUDED.keep_sample,
         status       = CASE WHEN e.label = EXCLUDED.label AND e.enrolled_at IS NOT NULL THEN 'enrolled' ELSE 'consented' END,
         enrolled_at  = CASE WHEN e.label = EXCLUDED.label THEN e.enrolled_at ELSE NULL END,
         reason       = NULL,
         updated_at   = now()
  RETURNING * INTO v_row;
  RETURN jsonb_build_object('label', v_row.label, 'status', v_row.status, 'consented_at', v_row.consented_at);
END $$;
REVOKE ALL ON FUNCTION public.give_voice_consent(text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.give_voice_consent(text, text, text, boolean) TO authenticated;

-- The sample is filed for the NAS only behind a consent row, and only from the
-- person's own folder.
CREATE OR REPLACE FUNCTION public.send_voice_sample(p_path text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'send_voice_sample: sign in first' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.voice_enrollments WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'send_voice_sample: agree first; no voice is taken without consent' USING ERRCODE = '42501';
  END IF;
  IF p_path IS NULL OR position(v_uid::text || '/' IN p_path) <> 1 OR p_path LIKE '%..%' THEN
    RAISE EXCEPTION 'send_voice_sample: the sample must be in your own folder' USING ERRCODE = '42501';
  END IF;
  UPDATE public.voice_enrollments
     SET sample_path = p_path, sample_sent_at = now(), status = 'sample-sent', reason = NULL, updated_at = now()
   WHERE user_id = v_uid;
  RETURN jsonb_build_object('status', 'sample-sent', 'path', p_path);
END $$;
REVOKE ALL ON FUNCTION public.send_voice_sample(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_voice_sample(text) TO authenticated;

-- Remove my voice: the consent goes now; the NAS deletes the print and any
-- kept sample on its next pass, and from this moment never names the voice.
CREATE OR REPLACE FUNCTION public.remove_my_voice()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_path text;
  v_label text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'remove_my_voice: sign in first' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.voice_enrollments WHERE user_id = v_uid RETURNING sample_path, label INTO v_path, v_label;
  RETURN jsonb_build_object('removed', v_label IS NOT NULL, 'label', v_label, 'sample_path', v_path);
END $$;
REVOKE ALL ON FUNCTION public.remove_my_voice() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_my_voice() TO authenticated;

-- The Governor's label list: who has added a voice, never a vector or a path.
CREATE OR REPLACE FUNCTION public.voice_enrollment_labels()
RETURNS TABLE (label text, display_name text, status text, enrolled_at timestamptz, consented_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'voice_enrollment_labels: only the Governor reads the label list' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT e.label, e.display_name, e.status, e.enrolled_at, e.consented_at
      FROM public.voice_enrollments e
     ORDER BY e.label;
END $$;
REVOKE ALL ON FUNCTION public.voice_enrollment_labels() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.voice_enrollment_labels() TO authenticated;

NOTIFY pgrst, 'reload schema';
