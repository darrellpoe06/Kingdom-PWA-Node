-- =============================================================================
-- 0044 — Trivia questions: LIVE BY DEFAULT (drop the human-approval hold)
-- =============================================================================
-- CORRECTION to the 0010 / schema-v2.12 lifecycle. That lifecycle assumed trivia
-- questions were AI-GENERATED content that an owner/admin had to REVIEW (draft ->
-- approve -> active) before the congregation could see them. That premise was
-- wrong: the questions are Bishop Gwin's OWN questions, posed at the end of his
-- Wednesday messages (Darrell, 2026-06-24). They are the pastor's authored
-- content, like a sermon — there is nothing to human-review, and parking them on
-- a reviewer is exactly the kind of unnecessary hold this work removes.
--
-- Binding rule (feedback-validate-by-using-app-no-human-review-gate): NO hold on
-- a non-technical person. Validation = ship + let them use it; feedback returns
-- in-app. Only an UNMET SAFETY GATE holds — named, on the GATE. Theological
-- accuracy is the PASTOR'S own authorship here, not a safety gate, so it does not
-- hold. Any concern about whether the EXTRACTION is faithful is a verifiable data
-- check (app/src/lib/engagement-sync.js checkQuestionFidelity), not a person.
--
-- WHAT CHANGES (additive, idempotent, reversible):
--   1. status DEFAULT flips 'draft' -> 'active' so an inserted question is LIVE
--      the moment it lands (no approval step).
--   2. Any stranded 'draft' rows are promoted to 'active' (none real exist yet;
--      safe + idempotent).
--   3. The member-read RLS policy shows every question EXCEPT 'rejected'
--      (retracted). Previously it hid 'draft', which was the hold at the data
--      layer; a retracted/bad extraction is the only thing members don't see.
--   4. Owner/admin INSERT + UPDATE policies are kept verbatim — an owner can
--      still RETRACT or correct a bad extraction post-hoc (ship-then-fix). That
--      is moderation of already-live content, not a pre-publish gate.
--
-- DEPENDS ON: 0010-engagement-trivia-questions.sql (the table + base policies).
-- IDEMPOTENCY: ALTER ... SET DEFAULT, a guarded UPDATE, DROP-then-CREATE policy.
--              Safe to re-run.
-- =============================================================================

-- 1. Live by default on insert.
ALTER TABLE trivia_questions ALTER COLUMN status SET DEFAULT 'active';

-- 2. Promote any stranded drafts to live (the approval step is gone).
UPDATE trivia_questions SET status = 'active' WHERE status = 'draft';

-- 3. Members see all live questions; only a retracted ('rejected') one is hidden.
DROP POLICY IF EXISTS trivia_questions_member_read ON trivia_questions;
CREATE POLICY trivia_questions_member_read ON trivia_questions FOR SELECT
  USING (user_in_instance(instance_id) AND status <> 'rejected');

-- (reviewer_read / reviewer_write / reviewer_edit from 0010 are intentionally
--  left in place: owner/admin may still retract or correct LIVE content, which is
--  post-hoc moderation, not a hold on a healthy question.)

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFY (read-only — run after applying):
--   SELECT column_default FROM information_schema.columns
--    WHERE table_name='trivia_questions' AND column_name='status';
--   -- expect 'active'::text
--
--   SELECT count(*) FROM trivia_questions WHERE status='draft';   -- expect 0
--
--   SELECT policyname, qual FROM pg_policies
--    WHERE tablename='trivia_questions' AND policyname='trivia_questions_member_read';
--   -- qual should reference status <> 'rejected'
-- =============================================================================

-- =============================================================================
-- ROLLBACK (restores the 0010 review lifecycle):
--   ALTER TABLE trivia_questions ALTER COLUMN status SET DEFAULT 'draft';
--   DROP POLICY IF EXISTS trivia_questions_member_read ON trivia_questions;
--   CREATE POLICY trivia_questions_member_read ON trivia_questions FOR SELECT
--     USING (user_in_instance(instance_id) AND status IN ('approved','active','archived'));
--   NOTIFY pgrst, 'reload schema';
-- =============================================================================
-- End of 0044.
-- =============================================================================
