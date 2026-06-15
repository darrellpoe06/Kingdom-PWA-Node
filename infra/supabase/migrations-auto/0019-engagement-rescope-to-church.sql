-- =============================================================================
-- 0019 — re-home the Engagement/Trivia content onto the church instance
-- =============================================================================
-- PR #119 unified the Church surfaces on the church instance ('colg'): from then
-- on engagement-sync resolves churchInstanceId() and FILTERS every read by it
-- (subscribeMessages / getActiveQuestion / getReviewQuestions). But the Trivia
-- questions, answers, and message thread created BEFORE #119 were written under
-- the FAMILY instance ('poe-family', via the old ensureTenantMembership ->
-- join_default_instance path). After #119 those rows no longer match the read
-- scope, so BG's church Trivia + messages disappeared from the Engagement tab.
-- This moves them to the church instance so they read again.
--
-- SAFE TO MOVE WHOLESALE: the messages / trivia_questions / trivia_answers tables
-- are touched ONLY by engagement-sync.js (the Church Engagement surface); the
-- in-app-messaging seed writes projects, not messages — so every row under
-- poe-family in these tables is church Engagement content, not family chat.
-- After the move, colg's RLS (user_in_instance) lets the church members read
-- them (Darrell/Christina auto-join colg via join_church_instance).
--
-- IDEMPOTENT: only rows still on poe-family are moved; a second run is a no-op
-- (nothing matches). Guarded: if either instance is missing, do nothing.
-- =============================================================================

DO $$
DECLARE
  v_family uuid;
  v_church uuid;
  v_q int := 0;
  v_a int := 0;
  v_m int := 0;
BEGIN
  SELECT id INTO v_family FROM instances WHERE slug = 'poe-family';
  SELECT id INTO v_church FROM instances WHERE slug = 'colg';
  IF v_family IS NULL OR v_church IS NULL THEN
    RAISE NOTICE '0019: poe-family or colg instance missing — no-op';
    RETURN;
  END IF;

  UPDATE trivia_questions SET instance_id = v_church WHERE instance_id = v_family;
  GET DIAGNOSTICS v_q = ROW_COUNT;
  UPDATE trivia_answers   SET instance_id = v_church WHERE instance_id = v_family;
  GET DIAGNOSTICS v_a = ROW_COUNT;
  UPDATE messages         SET instance_id = v_church WHERE instance_id = v_family;
  GET DIAGNOSTICS v_m = ROW_COUNT;

  RAISE NOTICE '0019: re-homed to colg — % questions, % answers, % messages', v_q, v_a, v_m;
END $$;

NOTIFY pgrst, 'reload schema';
