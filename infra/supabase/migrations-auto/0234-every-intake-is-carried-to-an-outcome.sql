-- =============================================================================
-- 0234 — every intake is carried to an outcome (DR-0622, building DR-0621 3a)
-- =============================================================================
-- Darrell 2026-09-24: "it should go through our workflow system and be
-- categorized ... if it's low hanging fruit, then we fix it. The system fixes it
-- automatically ... i don't want humans to have to communicate that".
--
-- 1. public.feedback carries the outcome the sender reads:
--      intake_category / intake_basis — the category and WHY (lib/intake-
--        outcome.js categorizeIntake), written at submit and by the runner, so
--        the answer a person was given can be audited later even after the
--        ledger moves on;
--      outcome_note / outcome_ref / outcome_at — what changed, the record
--        (a pull request or DR id) and when; outcome_at is what the measured
--        intake-to-outcome window is computed from;
--      reply_to — a sender's reply to an outcome re-enters intake linked to the
--        note it answers, and always goes to a person.
--    A sender may not write an outcome onto their own note: an INSERT by a
--    signed-in person has the three outcome columns cleared and the status set
--    to 'new' (the trigger below). Stewards write outcomes through the existing
--    owner/admin UPDATE policy; the runner writes with the service role.
--
-- 2. public.intake_fix_queue — the low-hanging-fruit queue the gated fix lane
--    drains. One row per note (UNIQUE feedback_id). Stewards (owner / admin)
--    read it and may skip a row; the runner (service role) enqueues and moves
--    rows. Members and viewers read nothing: the queue carries the runner's
--    working state, and the sender reads the outcome on their own note.
--
-- Instance-scoped, the overlays applied (assistant scope, viewer read-only).
-- Proven by infra/supabase/tests/0234-intake-outcome-smoke.sql in the RLS
-- matrix. IDEMPOTENT: IF NOT EXISTS, DROP-then-CREATE. Additive.
-- =============================================================================

ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS intake_category text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS intake_basis jsonb;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS outcome_note text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS outcome_ref text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS outcome_at timestamptz;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.feedback(id) ON DELETE SET NULL;

ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_intake_category_check;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_intake_category_check
  CHECK (intake_category IS NULL OR intake_category IN ('fix','decided','work','ask','thanks','signal'));

CREATE INDEX IF NOT EXISTS feedback_intake_category_idx ON public.feedback (intake_category);
CREATE INDEX IF NOT EXISTS feedback_reply_to_idx ON public.feedback (reply_to) WHERE reply_to IS NOT NULL;

-- A sender cannot write an outcome onto their own note.
CREATE OR REPLACE FUNCTION public.feedback_intake_insert_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- NULLIF: an unset or emptied claims setting is '' and must not be cast.
  IF coalesce(NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'role', '') IN ('authenticated', 'anon') THEN
    NEW.outcome_note := NULL;
    NEW.outcome_ref  := NULL;
    NEW.outcome_at   := NULL;
    NEW.triage_status := 'new';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS feedback_intake_insert_guard ON public.feedback;
CREATE TRIGGER feedback_intake_insert_guard
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_intake_insert_guard();

CREATE TABLE IF NOT EXISTS public.intake_fix_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  feedback_id  uuid NOT NULL UNIQUE REFERENCES public.feedback(id) ON DELETE CASCADE,
  rule         text NOT NULL,
  scope        text NOT NULL CHECK (scope IN ('copy','style')),
  status       text NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','claimed','opened','merged','failed','skipped')),
  attempts     int  NOT NULL DEFAULT 0,
  branch       text,
  pr_number    int,
  pr_title     text,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  claimed_at   timestamptz,
  finished_at  timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS intake_fix_queue_status_idx ON public.intake_fix_queue (status, created_at);
CREATE INDEX IF NOT EXISTS intake_fix_queue_instance_idx ON public.intake_fix_queue (instance_id, created_at DESC);

COMMENT ON TABLE public.intake_fix_queue IS 'Low-hanging-fruit notes the gated fix lane drains, one row per note. DR-0622.';

ALTER TABLE public.intake_fix_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intake_fix_queue_read   ON public.intake_fix_queue;
DROP POLICY IF EXISTS intake_fix_queue_update ON public.intake_fix_queue;

-- Stewards read the queue and may move a row (e.g. skip it). No INSERT or
-- DELETE policy: the runner, with the service role, owns the queue's rows.
CREATE POLICY intake_fix_queue_read ON public.intake_fix_queue FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY intake_fix_queue_update ON public.intake_fix_queue FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

GRANT SELECT, UPDATE ON public.intake_fix_queue TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
