-- =============================================================================
-- 0264 — A JOB CAN REQUIRE PROOF BEFORE IT IS DONE, AND PAID (DR-0937)
-- =============================================================================
-- Darrell, 2026-10-10: "1099 works notice of the need for pictures to
-- document the work... may be mandatory for payment... situations that need
-- images to validate the work is completely done and video when necessary...
-- make sense?"
--
-- THE SHAPE.
--   * The family marks a job's PROOF: none (as today), photos, or photos and
--     video, with an optional line saying what to show ("the new cabinet with
--     the fan running"). It is a column on the work order, so the worker sees
--     it on the job and in the dispatch text before he starts.
--   * A worker's "Fixed" on a job that requires proof is REFUSED by the
--     database until the proof is on the job: at least one picture, and for
--     photos-and-video at least one video. The refusal says what is missing
--     and that it is required for payment.
--   * A video is a documentation row of its own (video_data, a data URL like
--     image_data). The board's list never carries a video's bytes
--     (DR-0303: the list never carries the bytes): has_video is a stored
--     generated column the list reads; the bytes are fetched one at a time,
--     when someone opens the video.
--
-- The family can still close a job by its own status move — the requirement
-- binds the documented "Fixed", which is the worker's claim of done and the
-- evidence the payment rests on. Every move stays on record_events (0262).
--
-- IDEMPOTENT: IF NOT EXISTS, guarded constraints, CREATE OR REPLACE,
-- DROP/CREATE trigger. ADDITIVE: every existing job reads proof 'none'.
-- =============================================================================

ALTER TABLE public.tenant_maintenance_requests ADD COLUMN IF NOT EXISTS proof_required text NOT NULL DEFAULT 'none';
ALTER TABLE public.tenant_maintenance_requests ADD COLUMN IF NOT EXISTS proof_note text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_maintenance_requests_proof_required_check') THEN
    ALTER TABLE public.tenant_maintenance_requests ADD CONSTRAINT tenant_maintenance_requests_proof_required_check
      CHECK (proof_required IN ('none', 'photos', 'photos-and-video'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_maintenance_requests_proof_note_len') THEN
    ALTER TABLE public.tenant_maintenance_requests ADD CONSTRAINT tenant_maintenance_requests_proof_note_len
      CHECK (proof_note IS NULL OR length(proof_note) <= 300);
  END IF;
END $$;
COMMENT ON COLUMN public.tenant_maintenance_requests.proof_required IS
  'DR-0937: what a documented "Fixed" must carry on this job before it is accepted — none, photos, or photos-and-video. Required for payment.';

ALTER TABLE public.request_documentation ADD COLUMN IF NOT EXISTS video_data text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'request_documentation' AND column_name = 'has_video') THEN
    ALTER TABLE public.request_documentation
      ADD COLUMN has_video boolean GENERATED ALWAYS AS (video_data IS NOT NULL) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'request_documentation_video_is_a_video') THEN
    ALTER TABLE public.request_documentation ADD CONSTRAINT request_documentation_video_is_a_video
      CHECK (video_data IS NULL OR (video_data LIKE 'data:video/%' AND length(video_data) <= 36000000));
  END IF;
END $$;

-- A documented "Fixed" on a job that requires proof needs the proof on the job.
CREATE OR REPLACE FUNCTION public.request_documentation_proof_before_fixed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_need text; v_photos int; v_videos int;
BEGIN
  IF NEW.outcome IS DISTINCT FROM 'fixed' THEN RETURN NEW; END IF;
  SELECT proof_required INTO v_need FROM tenant_maintenance_requests WHERE id = NEW.request_id;
  IF coalesce(v_need, 'none') = 'none' THEN RETURN NEW; END IF;
  SELECT count(*) FILTER (WHERE image_data IS NOT NULL), count(*) FILTER (WHERE video_data IS NOT NULL)
    INTO v_photos, v_videos
    FROM request_documentation WHERE request_id = NEW.request_id;
  v_photos := v_photos + CASE WHEN NEW.image_data IS NOT NULL THEN 1 ELSE 0 END;
  v_videos := v_videos + CASE WHEN NEW.video_data IS NOT NULL THEN 1 ELSE 0 END;
  IF v_photos < 1 THEN
    RAISE EXCEPTION 'This job needs pictures of the finished work before it is marked fixed. They are required for payment: add them, then mark it fixed.';
  END IF;
  IF v_need = 'photos-and-video' AND v_videos < 1 THEN
    RAISE EXCEPTION 'This job needs a video of the finished work before it is marked fixed. It is required for payment: add it, then mark it fixed.';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.request_documentation_proof_before_fixed() FROM PUBLIC;

DROP TRIGGER IF EXISTS request_documentation_proof ON public.request_documentation;
CREATE TRIGGER request_documentation_proof
  BEFORE INSERT ON public.request_documentation
  FOR EACH ROW EXECUTE FUNCTION public.request_documentation_proof_before_fixed();

-- The proof requirement and its changes are on the clock too.
CREATE OR REPLACE FUNCTION public.record_events_from_work_proof()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.proof_required IS DISTINCT FROM OLD.proof_required THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, from_value, to_value, by_user)
    VALUES (NEW.instance_id, 'work', NEW.id, 'proof', OLD.proof_required, NEW.proof_required, auth.uid());
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.record_events_from_work_proof() FROM PUBLIC;

DROP TRIGGER IF EXISTS tenant_maintenance_requests_proof_events ON public.tenant_maintenance_requests;
CREATE TRIGGER tenant_maintenance_requests_proof_events
  AFTER UPDATE OF proof_required ON public.tenant_maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.record_events_from_work_proof();

NOTIFY pgrst, 'reload schema';
