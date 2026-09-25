-- =============================================================================
-- 0238 — a member may choose to be named; the Governor may keep it anonymous
-- (DR-0639)
-- =============================================================================
-- Darrell 2026-09-24: "Name is used if they want to though... make sense?"
--
-- The member's choice needs no new column: it rides the row's own tags
-- (`lesson-name-ok` + `lesson-name:<name>`), written by the member's insert
-- under the same RLS as every inbox row (only the sender reads it; the
-- Governor sees it through member_lesson_queue(), which already returns tags).
--
-- What changes here is the decision: review_member_lesson() gains a third
-- decision, 'approve-anonymous' — approve the lesson but keep the member
-- anonymous even though they offered their name. It appends BOTH
-- `lesson-approved` and `lesson-anonymous`, so the reader captures it and
-- never uses the name. Everything else is 0237, unchanged: Governor-only, a
-- decline needs a reason, a row is never decided twice, the Governor's own
-- rows are not in this door.
-- Proven by infra/supabase/tests/0238-member-lesson-name-smoke.sql.
-- IDEMPOTENT: CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.review_member_lesson(p_row uuid, p_decision text, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tags  jsonb;
  v_email text;
  v_add   jsonb;
  v_tag   text;
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'review_member_lesson: only the Governor reviews member lessons' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approve', 'approve-anonymous', 'decline') THEN
    RAISE EXCEPTION 'review_member_lesson: decision must be approve, approve-anonymous or decline';
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

  v_tag := CASE WHEN p_decision = 'decline' THEN 'lesson-declined' ELSE 'lesson-approved' END;
  v_add := CASE WHEN p_decision = 'approve-anonymous'
                THEN '["lesson-approved", "lesson-anonymous"]'::jsonb
                ELSE jsonb_build_array(v_tag) END;
  UPDATE agent_inbox
     SET tags = tags || v_add,
         review_reason = CASE WHEN p_decision = 'decline' THEN btrim(p_reason) ELSE NULLIF(btrim(coalesce(p_reason, '')), '') END,
         reviewed_at = now(),
         reviewed_by = auth.uid()
   WHERE id = p_row;
  RETURN jsonb_build_object('id', p_row, 'tag', v_tag, 'anonymous', p_decision = 'approve-anonymous');
END $$;
REVOKE ALL ON FUNCTION public.review_member_lesson(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_member_lesson(uuid, text, text) TO authenticated;

-- =============================================================================
-- THE MESSAGES EDGE (DR-0639; Darrell 2026-09-24: "Connects to the users and
-- messages systems?"). The Governor's own client sends the member an end-to-
-- end encrypted Message (direct-messages-sync.js) for each decision and, later,
-- for each published lesson. The reader cannot send an encrypted Message from
-- its server side, so it tags the row `lesson-published` + `lesson-id:<id>`,
-- and the Governor's client sends that Message on his next visit to the queue.
-- These two functions let his client find what still needs a Message and mark
-- it sent, without any client being able to UPDATE an inbox row.
-- =============================================================================

-- Rows whose Message is still owed: decided without `messaged:decision`, or
-- published without `messaged:published`. Governor-only.
CREATE OR REPLACE FUNCTION public.member_lesson_outbox()
RETURNS TABLE (id uuid, body text, tags jsonb, review_reason text, created_by uuid, sender_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'member_lesson_outbox: only the Governor sends lesson Messages' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT a.id, a.body, a.tags, a.review_reason, a.created_by,
           coalesce(nullif(im.display_name, ''), 'A member')::text
      FROM agent_inbox a
      LEFT JOIN instance_members im ON im.instance_id = a.instance_id AND im.user_id = a.created_by
      LEFT JOIN auth.users u ON u.id = a.created_by
     WHERE a.tags @> '["lesson"]'::jsonb
       AND NOT (lower(coalesce(u.email, '')) = ANY (public.lesson_governor_emails()))
       AND (
             (a.tags ?| array['lesson-approved', 'lesson-declined'] AND NOT (a.tags ?| array['messaged:decision', 'messaged:published']))
          OR (a.tags @> '["lesson-published"]'::jsonb AND NOT a.tags @> '["messaged:published"]'::jsonb)
           )
     ORDER BY a.created_at ASC
     LIMIT 100;
END $$;
REVOKE ALL ON FUNCTION public.member_lesson_outbox() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.member_lesson_outbox() TO authenticated;

-- Mark a Message sent: appends `messaged:decision` or `messaged:published`.
CREATE OR REPLACE FUNCTION public.mark_member_lesson_messaged(p_row uuid, p_kind text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tag text;
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'mark_member_lesson_messaged: only the Governor sends lesson Messages' USING ERRCODE = '42501';
  END IF;
  IF p_kind NOT IN ('decision', 'published') THEN
    RAISE EXCEPTION 'mark_member_lesson_messaged: kind must be decision or published';
  END IF;
  v_tag := 'messaged:' || p_kind;
  UPDATE agent_inbox
     SET tags = CASE WHEN tags @> jsonb_build_array(v_tag) THEN tags ELSE tags || to_jsonb(v_tag) END
   WHERE id = p_row AND tags @> '["lesson"]'::jsonb;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'mark_member_lesson_messaged: no such lesson row';
  END IF;
  RETURN jsonb_build_object('id', p_row, 'tag', v_tag);
END $$;
REVOKE ALL ON FUNCTION public.mark_member_lesson_messaged(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_member_lesson_messaged(uuid, text) TO authenticated;
