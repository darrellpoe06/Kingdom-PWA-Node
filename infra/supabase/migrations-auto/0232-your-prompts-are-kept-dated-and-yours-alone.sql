-- =============================================================================
-- 0232 — your prompts are kept, dated, and yours alone (DR-0615)
-- =============================================================================
-- Darrell 2026-09-24: "We also need a historical prompts space so I can use the
-- same or similar prompts later for various reasons." / "Dated and sortable etc."
--
-- One row per person per distinct prompt. Sending the same words again does not
-- make a second row: it raises use_count and moves last_used_at (the
-- remember_prompt function below), so the history reads "used 4 times, last on
-- ..." instead of four copies. `kept` marks the ones he chose to keep.
--
-- PRIVATE TO ITS AUTHOR. Every policy is created_by = auth.uid() AND a member of
-- the instance: a spouse, a steward, an assistant in the same instance sees none
-- of it. Proven by infra/supabase/tests/0232-saved-prompts-smoke.sql in the RLS
-- matrix.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.saved_prompts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL,
  body          text NOT NULL CHECK (length(btrim(body)) > 0),
  body_sha      text GENERATED ALWAYS AS (md5(body)) STORED,
  title         text,
  destination   text,
  kept          boolean NOT NULL DEFAULT false,
  use_count     integer NOT NULL DEFAULT 1,
  last_used_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (created_by, body_sha)
);
CREATE INDEX IF NOT EXISTS saved_prompts_author_used_idx
  ON public.saved_prompts (created_by, last_used_at DESC);

COMMENT ON TABLE public.saved_prompts IS 'Each person''s own prompt history: dated, counted, kept on request, private to its author. DR-0615.';

ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_prompts_read   ON public.saved_prompts;
DROP POLICY IF EXISTS saved_prompts_insert ON public.saved_prompts;
DROP POLICY IF EXISTS saved_prompts_update ON public.saved_prompts;
DROP POLICY IF EXISTS saved_prompts_delete ON public.saved_prompts;

CREATE POLICY saved_prompts_read ON public.saved_prompts FOR SELECT
  USING (created_by = auth.uid() AND user_in_instance(instance_id));
CREATE POLICY saved_prompts_insert ON public.saved_prompts FOR INSERT
  WITH CHECK (created_by = auth.uid() AND user_in_instance(instance_id));
CREATE POLICY saved_prompts_update ON public.saved_prompts FOR UPDATE
  USING (created_by = auth.uid() AND user_in_instance(instance_id))
  WITH CHECK (created_by = auth.uid() AND user_in_instance(instance_id));
CREATE POLICY saved_prompts_delete ON public.saved_prompts FOR DELETE
  USING (created_by = auth.uid() AND user_in_instance(instance_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_prompts TO authenticated;

-- Remember a prompt: a new one is inserted; the same words again raise the
-- count and the date. SECURITY INVOKER, so the policies above still decide.
CREATE OR REPLACE FUNCTION public.remember_prompt(p_instance uuid, p_body text, p_destination text DEFAULT NULL, p_keep boolean DEFAULT false)
RETURNS uuid
LANGUAGE sql SECURITY INVOKER
SET search_path = public
AS $$
  INSERT INTO saved_prompts (instance_id, created_by, body, destination, kept, use_count, last_used_at)
  VALUES (p_instance, auth.uid(), left(btrim(p_body), 8000), p_destination, COALESCE(p_keep, false), 1, now())
  ON CONFLICT (created_by, body_sha) DO UPDATE
     SET use_count    = saved_prompts.use_count + 1,
         last_used_at = now(),
         kept         = saved_prompts.kept OR EXCLUDED.kept,
         destination  = COALESCE(EXCLUDED.destination, saved_prompts.destination),
         updated_at   = now()
  RETURNING id;
$$;
GRANT EXECUTE ON FUNCTION public.remember_prompt(uuid, text, text, boolean) TO authenticated;

-- The overlays cover the new instance-scoped table: the assistant scope
-- (migration 0130's gate) and the viewer read-only deny (DR-0241).
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
