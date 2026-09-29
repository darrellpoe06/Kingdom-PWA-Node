-- =============================================================================
-- 0241 — the Governor decides which version ships: choose one, merge part by
-- part, or take all with the best part of each (DR-0672)
-- =============================================================================
-- Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for
-- me to review their and the decide on which one or merge 2 of them or all of
-- them..."
--
-- A lesson written by more than one writer (DR-0669, public.lesson_versions)
-- waits for his decision. The decision is one row here; the NAS lesson builder
-- reads the newest `pending` row per teaching, composes the lesson, re-runs
-- EVERY gate on the composite, and writes back status + gate_result (and the
-- lesson id and PR number when it ships). The record is append-only from the
-- app: a new decision is a new row; the builder marks older ones superseded.
--
--   mode              choose | merge | all
--   chosen_version_id the version, for `choose` (lesson_versions.id)
--   merge_map         { part: version id } for merge / all; parts are
--                     base, title, movement:<n>, lesson, band:<child|youth|
--                     teen|senior>, quiz (app/src/lib/lesson-decisions.js)
--   edits             { part: text } — Scripture spans are unchanged by
--                     contract (the app refuses otherwise; the builder's verse
--                     gate re-checks every span on the composite)
--   version_ids       every version he saw when he decided
--   status            pending | building | shipped | gate-failed | superseded
--   gate_result       the builder's gate record on the composite; on
--                     gate-failed it names each failed check and part
--
-- WHO: only the Governor (is_lesson_governor(), 0237 — his two sign-in doors)
-- reads or writes a decision from the app, and only as himself (decided_by =
-- auth.uid()), only `pending`, never with a gate_result. No client UPDATE or
-- DELETE. The builder writes status through its own database connection.
-- lesson_versions is not referenced by a foreign key: that table arrives with
-- DR-0669's own migration, and a decision must never block on its order.
-- Proven by infra/supabase/tests/0241-lesson-decisions-smoke.sql.
-- IDEMPOTENT: IF NOT EXISTS, DROP+CREATE POLICY.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_decisions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teaching_row_id    uuid NOT NULL REFERENCES public.agent_inbox(id) ON DELETE CASCADE,
  build_id           uuid,
  mode               text NOT NULL CHECK (mode IN ('choose', 'merge', 'all')),
  chosen_version_id  uuid,
  merge_map          jsonb NOT NULL DEFAULT '{}'::jsonb,
  edits              jsonb NOT NULL DEFAULT '{}'::jsonb,
  version_ids        jsonb NOT NULL DEFAULT '[]'::jsonb,
  decided_by         uuid NOT NULL DEFAULT auth.uid(),
  decided_at         timestamptz NOT NULL DEFAULT now(),
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'building', 'shipped', 'gate-failed', 'superseded')),
  gate_result        jsonb,
  lesson_id          text,
  pr_number          integer,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_decisions_choose_names_one CHECK (mode <> 'choose' OR chosen_version_id IS NOT NULL),
  CONSTRAINT lesson_decisions_merge_has_map CHECK (mode = 'choose' OR (jsonb_typeof(merge_map) = 'object' AND merge_map ? 'base')),
  CONSTRAINT lesson_decisions_objects CHECK (jsonb_typeof(edits) = 'object' AND jsonb_typeof(version_ids) = 'array')
);
CREATE INDEX IF NOT EXISTS lesson_decisions_teaching_idx ON public.lesson_decisions (teaching_row_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS lesson_decisions_pending_idx ON public.lesson_decisions (status) WHERE status = 'pending';

ALTER TABLE public.lesson_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_decisions_read ON public.lesson_decisions;
CREATE POLICY lesson_decisions_read ON public.lesson_decisions FOR SELECT
  USING (public.is_lesson_governor());

DROP POLICY IF EXISTS lesson_decisions_insert ON public.lesson_decisions;
CREATE POLICY lesson_decisions_insert ON public.lesson_decisions FOR INSERT
  WITH CHECK (public.is_lesson_governor() AND decided_by = auth.uid() AND status = 'pending'
              AND gate_result IS NULL AND lesson_id IS NULL AND pr_number IS NULL);

REVOKE UPDATE, DELETE ON public.lesson_decisions FROM authenticated, anon;
GRANT SELECT, INSERT ON public.lesson_decisions TO authenticated;
