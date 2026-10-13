-- =============================================================================
-- 0237 — a member's lesson is reviewed by the Governor before it is written
-- (DR-0635)
-- =============================================================================
-- Darrell 2026-09-24: "Que for me to review..." A member's own situation, sent
-- under the Lesson chip, may become a new lesson, but only after he reviews it.
-- This is the door DR-0312 kept shut, widened by his word and no further.
--
-- What this adds:
--   1. Three review columns on agent_inbox: review_reason (the reason he gives
--      when he declines), reviewed_at, reviewed_by.
--   2. READ TIGHTENED: a member reads only their OWN inbox rows. Before this,
--      any member of an instance read every row in it (0127), so a household
--      member could read another's words. Nothing in the app reads another
--      person's rows (lesson-inbox.js and recorded-note.js read their own); the
--      NAS rider reads through the service role and is unaffected.
--   3. is_lesson_governor(): the Governor's own sign-in doors (DR-0172 pairs
--      them). Only he opens the queue and decides.
--   4. member_lesson_queue(): SECURITY DEFINER, Governor-only. Every row tagged
--      `lesson` from anyone who is not the Governor, not yet decided, with the
--      sender's name as their instance knows it. A raw recording (tag `voice`
--      without `voice-transcript`) and a failed transcription are left out:
--      the words to review are the transcript row.
--   5. review_member_lesson(row, decision, reason): SECURITY DEFINER,
--      Governor-only. Approve appends `lesson-approved`; decline requires a
--      reason and appends `lesson-declined`. A decided row is never decided
--      again, and the Governor's own rows are not in this door.
-- Proven by infra/supabase/tests/0237-member-lesson-review-smoke.sql.
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, DROP+CREATE POLICY, CREATE OR REPLACE.
-- =============================================================================

ALTER TABLE agent_inbox ADD COLUMN IF NOT EXISTS review_reason text;
ALTER TABLE agent_inbox ADD COLUMN IF NOT EXISTS reviewed_at   timestamptz;
ALTER TABLE agent_inbox ADD COLUMN IF NOT EXISTS reviewed_by   uuid;

-- 2) Each person reads only their own inbox rows.
DROP POLICY IF EXISTS agent_inbox_read ON agent_inbox;
CREATE POLICY agent_inbox_read ON agent_inbox FOR SELECT
  USING (created_by = auth.uid() AND user_role_in_instance(instance_id) IS NOT NULL);

-- 3) The Governor, by his declared sign-in doors (one list, used everywhere).
CREATE OR REPLACE FUNCTION public.lesson_governor_emails()
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['darrellpoe06@gmail.com', '15636502416@phone.poetech.us']::text[] $$;

CREATE OR REPLACE FUNCTION public.is_lesson_governor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
     WHERE u.id = auth.uid()
       AND lower(coalesce(u.email, '')) = ANY (public.lesson_governor_emails())
  );
$$;
REVOKE ALL ON FUNCTION public.is_lesson_governor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_lesson_governor() TO authenticated;

-- 4) The queue.
CREATE OR REPLACE FUNCTION public.member_lesson_queue()
RETURNS TABLE (id uuid, body text, tags jsonb, source text, created_at timestamptz, created_by uuid, sender_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'member_lesson_queue: only the Governor reviews member lessons' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT a.id, a.body, a.tags, a.source, a.created_at, a.created_by,
           coalesce(nullif(im.display_name, ''), 'A member')::text AS sender_name
      FROM agent_inbox a
      LEFT JOIN instance_members im ON im.instance_id = a.instance_id AND im.user_id = a.created_by
      LEFT JOIN auth.users u ON u.id = a.created_by
     WHERE a.tags @> '["lesson"]'::jsonb
       AND NOT (a.tags ?| array['lesson-approved', 'lesson-declined', 'voice-failed'])
       AND NOT (a.tags @> '["voice"]'::jsonb AND NOT a.tags @> '["voice-transcript"]'::jsonb)
       AND NOT (lower(coalesce(u.email, '')) = ANY (public.lesson_governor_emails()))
     ORDER BY a.created_at ASC
     LIMIT 200;
END $$;
REVOKE ALL ON FUNCTION public.member_lesson_queue() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.member_lesson_queue() TO authenticated;

-- 5) The decision.
CREATE OR REPLACE FUNCTION public.review_member_lesson(p_row uuid, p_decision text, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tags  jsonb;
  v_email text;
  v_tag   text;
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'review_member_lesson: only the Governor reviews member lessons' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approve', 'decline') THEN
    RAISE EXCEPTION 'review_member_lesson: decision must be approve or decline';
  END IF;
  IF p_decision = 'decline' AND length(btrim(coalesce(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'review_member_lesson: a decline needs a reason the member will read';
  END IF;

  SELECT a.tags, lower(coalesce(u.email, '')) INTO v_tags, v_email
    FROM agent_inbox a LEFT JOIN auth.users u ON u.id = a.created_by
   WHERE a.id = p_row
   FOR UPDATE OF a;
  IF v_tags IS NULL THEN
    RAISE EXCEPTION 'review_member_lesson: no such row';
  END IF;
  IF NOT v_tags @> '["lesson"]'::jsonb THEN
    RAISE EXCEPTION 'review_member_lesson: not a lesson row';
  END IF;
  IF v_email = ANY (public.lesson_governor_emails()) THEN
    RAISE EXCEPTION 'review_member_lesson: the Governor''s own lessons are not reviewed here';
  END IF;
  IF v_tags ?| array['lesson-approved', 'lesson-declined'] THEN
    RAISE EXCEPTION 'review_member_lesson: already decided';
  END IF;

  v_tag := CASE WHEN p_decision = 'approve' THEN 'lesson-approved' ELSE 'lesson-declined' END;
  UPDATE agent_inbox
     SET tags = tags || to_jsonb(v_tag),
         review_reason = CASE WHEN p_decision = 'decline' THEN btrim(p_reason) ELSE NULLIF(btrim(coalesce(p_reason, '')), '') END,
         reviewed_at = now(),
         reviewed_by = auth.uid()
   WHERE id = p_row;
  RETURN jsonb_build_object('id', p_row, 'tag', v_tag);
END $$;
REVOKE ALL ON FUNCTION public.review_member_lesson(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_member_lesson(uuid, text, text) TO authenticated;

-- Keep the viewer read-only overlay covering agent_inbox (DR-0241).
SELECT public.apply_viewer_readonly_overlay();
