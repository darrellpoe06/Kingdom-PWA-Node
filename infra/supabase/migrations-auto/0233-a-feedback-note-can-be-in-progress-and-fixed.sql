-- =============================================================================
-- 0233 — a feedback note can be "in progress" and "fixed" (DR-0616)
-- =============================================================================
-- Darrell 2026-09-24: "Also make sure our feedback loop is correct inside this
-- workflow." The receipt the sender reads (lib/feedback-receipt.js) could only
-- say "being worked on" or "fixed" for statuses this CHECK did not allow
-- (schema-v1: new / reviewed / promoted / declined / needs-info), so no note
-- could ever close. This keeps every existing value and adds the two the loop
-- needs. Existing rows are untouched (all are within the old set).
-- =============================================================================

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'public.feedback'::regclass AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%triage_status%'
  LOOP
    EXECUTE format('ALTER TABLE public.feedback DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_triage_status_check
  CHECK (triage_status IN ('new','reviewed','promoted','in-progress','needs-info','fixed','declined'));

NOTIFY pgrst, 'reload schema';
