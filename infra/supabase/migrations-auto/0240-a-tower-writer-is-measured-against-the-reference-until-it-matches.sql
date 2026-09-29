-- =============================================================================
-- 0240 — a tower writer is measured against the reference until it matches
-- (DR-0671)
-- =============================================================================
-- Darrell 2026-09-29: "The final goal is to not need any no local model... we
-- need to make more workflows that produce the same outcome from claude based on
-- the process being used... claude needs to create the specific algorithmic
-- fixes for our workflows to work on the towers etc..."
--
-- The tower parity loop (infra/nas-lesson-parity) reads every version of a
-- lesson the NAS lesson builder stored (lesson_versions, DR-0669), measures each
-- tower version against the Claude reference with deterministic code, and
-- writes what it measured here:
--   lesson_parity            one row per (tower version, reference, measure
--                            version): the parity score, the hard floors, every
--                            section with its evidence, the named gap classes;
--   lesson_crossref          per teaching: every version against every other,
--                            the consensus, the one-writer candidate insights,
--                            the versions excluded for failing the verse gate;
--   lesson_parity_fixes      each algorithmic fix Claude was asked to write,
--                            with its budget, branch and PR;
--   lesson_parity_promotion  per tower writer: the streak, the threshold, the
--                            status (reference-only / ready / primary), and the
--                            Governor's hold.
--
-- lesson_versions is created HERE only if the builder's own migration has not
-- created it first (the documented shape, DR-0669; IF NOT EXISTS so the two
-- converge in either order).
--
-- READABLE ONLY BY THE GOVERNOR (his two sign-in doors, is_lesson_governor(),
-- migration 0237). No insert/update/delete policy exists for anyone: the NAS
-- writes with the service role. His one write is the hold, through
-- set_lesson_parity_hold(), Governor-only.
-- Proven by infra/supabase/tests/0240-lesson-parity-smoke.sql (RLS matrix).
-- IDEMPOTENT: IF NOT EXISTS, DROP+CREATE POLICY, CREATE OR REPLACE.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_versions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teaching_row_id  uuid,
  lesson_id        text,
  writer           text NOT NULL,
  model_label      text,
  prompt_sha256    text,
  prompt_text      text,
  body             jsonb,
  gate_results     jsonb,
  elapsed_ms       integer,
  created_at       timestamptz NOT NULL DEFAULT now(),
  published        boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS lesson_versions_teaching_idx ON public.lesson_versions (teaching_row_id, created_at);

CREATE TABLE IF NOT EXISTS public.lesson_parity (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teaching_row_id       uuid,
  lesson_id             text,
  version_id            uuid NOT NULL,
  reference_version_id  uuid NOT NULL,
  writer                text,
  writer_family         text NOT NULL,
  model_label           text NOT NULL DEFAULT '',
  prompt_sha256         text,
  same_prompt           boolean NOT NULL DEFAULT false,
  parity_score          numeric(6,4) NOT NULL,
  passed                boolean NOT NULL,
  floors                jsonb NOT NULL DEFAULT '{}'::jsonb,
  sections              jsonb NOT NULL DEFAULT '{}'::jsonb,
  gaps                  jsonb NOT NULL DEFAULT '[]'::jsonb,
  gap_classes           text[] NOT NULL DEFAULT '{}',
  measure_version       text NOT NULL,
  version_created_at    timestamptz,
  measured_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, reference_version_id, measure_version)
);
CREATE INDEX IF NOT EXISTS lesson_parity_writer_idx ON public.lesson_parity (writer_family, model_label, version_created_at);

CREATE TABLE IF NOT EXISTS public.lesson_crossref (
  teaching_row_id         uuid PRIMARY KEY,
  lesson_id               text,
  version_ids             text[] NOT NULL DEFAULT '{}',
  versions                jsonb NOT NULL DEFAULT '[]'::jsonb,
  matrix                  jsonb NOT NULL DEFAULT '[]'::jsonb,
  consensus               jsonb NOT NULL DEFAULT '{}'::jsonb,
  insights                jsonb NOT NULL DEFAULT '[]'::jsonb,
  excluded                jsonb NOT NULL DEFAULT '[]'::jsonb,
  reference_vs_consensus  jsonb,
  measure_version         text NOT NULL,
  measured_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_parity_fixes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_class           text NOT NULL,
  writer_family       text NOT NULL,
  occurrences         integer NOT NULL DEFAULT 0,
  example_parity_id   uuid,
  example_version_id  uuid,
  status              text NOT NULL CHECK (status IN ('awaiting-writer','running','pushed','failed','budget-stopped','merged','closed-verified')),
  detail              text,
  branch              text,
  pr_url              text,
  before              jsonb,
  after               jsonb,
  budget              jsonb,
  turns               integer,
  elapsed_ms          integer,
  writer_label        text,
  prompt_sha256       text,
  prompt_text         text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_parity_fixes_class_idx ON public.lesson_parity_fixes (writer_family, gap_class, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lesson_parity_promotion (
  writer_family      text NOT NULL,
  model_label        text NOT NULL DEFAULT '',
  tower              boolean NOT NULL DEFAULT true,
  streak             integer NOT NULL DEFAULT 0,
  required_n         integer NOT NULL,
  threshold          numeric(6,4) NOT NULL,
  teachings          integer NOT NULL DEFAULT 0,
  ready              boolean NOT NULL DEFAULT false,
  status             text NOT NULL DEFAULT 'reference-only' CHECK (status IN ('reference-only','ready','primary')),
  held               boolean NOT NULL DEFAULT false,
  held_by            uuid,
  held_at            timestamptz,
  last_score         numeric(6,4),
  history            jsonb NOT NULL DEFAULT '[]'::jsonb,
  status_changed_at  timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (writer_family, model_label)
);

COMMENT ON TABLE public.lesson_parity IS 'Each tower lesson version measured against the Claude reference, deterministic, with evidence. DR-0671.';
COMMENT ON TABLE public.lesson_crossref IS 'Every version of a teaching against every other, and the consensus. DR-0671.';
COMMENT ON TABLE public.lesson_parity_fixes IS 'The algorithmic fixes Claude was asked to write for recurring tower gaps. DR-0671.';
COMMENT ON TABLE public.lesson_parity_promotion IS 'Per tower writer: the parity streak and whether it is the primary writer; the Governor holds. DR-0671.';

ALTER TABLE public.lesson_versions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_parity           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_crossref         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_parity_fixes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_parity_promotion ENABLE ROW LEVEL SECURITY;

-- The Governor reads the parity tables; nobody else reads a row.
DROP POLICY IF EXISTS lesson_parity_governor_read ON public.lesson_parity;
CREATE POLICY lesson_parity_governor_read ON public.lesson_parity FOR SELECT USING (public.is_lesson_governor());
DROP POLICY IF EXISTS lesson_crossref_governor_read ON public.lesson_crossref;
CREATE POLICY lesson_crossref_governor_read ON public.lesson_crossref FOR SELECT USING (public.is_lesson_governor());
DROP POLICY IF EXISTS lesson_parity_fixes_governor_read ON public.lesson_parity_fixes;
CREATE POLICY lesson_parity_fixes_governor_read ON public.lesson_parity_fixes FOR SELECT USING (public.is_lesson_governor());
DROP POLICY IF EXISTS lesson_parity_promotion_governor_read ON public.lesson_parity_promotion;
CREATE POLICY lesson_parity_promotion_governor_read ON public.lesson_parity_promotion FOR SELECT USING (public.is_lesson_governor());
-- lesson_versions: a Governor read is added only when no policy exists yet, so
-- the builder's own policy (if it landed first) is never replaced.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lesson_versions') THEN
    EXECUTE 'CREATE POLICY lesson_versions_governor_read ON public.lesson_versions FOR SELECT USING (public.is_lesson_governor())';
  END IF;
END $$;

GRANT SELECT ON public.lesson_parity, public.lesson_crossref, public.lesson_parity_fixes,
  public.lesson_parity_promotion, public.lesson_versions TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lesson_parity, public.lesson_crossref, public.lesson_parity_fixes,
  public.lesson_parity_promotion FROM authenticated, anon;

-- The Governor's brake on a promotion: hold (or release) one tower writer.
-- A held writer can reach 'ready' but never 'primary'; the loop recomputes the
-- status on its next pass, and this function applies it at once.
CREATE OR REPLACE FUNCTION public.set_lesson_parity_hold(p_writer_family text, p_model_label text, p_hold boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_row public.lesson_parity_promotion;
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'set_lesson_parity_hold: only the Governor holds a promotion' USING ERRCODE = '42501';
  END IF;
  UPDATE public.lesson_parity_promotion
     SET held = COALESCE(p_hold, false),
         held_by = CASE WHEN COALESCE(p_hold, false) THEN auth.uid() ELSE NULL END,
         held_at = CASE WHEN COALESCE(p_hold, false) THEN now() ELSE NULL END,
         status = CASE WHEN ready AND NOT COALESCE(p_hold, false) THEN 'primary'
                       WHEN ready THEN 'ready' ELSE 'reference-only' END,
         updated_at = now()
   WHERE writer_family = p_writer_family AND model_label = COALESCE(p_model_label, '')
   RETURNING * INTO v_row;
  IF v_row IS NULL THEN
    RAISE EXCEPTION 'set_lesson_parity_hold: no such writer';
  END IF;
  RETURN jsonb_build_object('writer_family', v_row.writer_family, 'model_label', v_row.model_label,
                            'held', v_row.held, 'status', v_row.status);
END $$;
REVOKE ALL ON FUNCTION public.set_lesson_parity_hold(text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_lesson_parity_hold(text, text, boolean) TO authenticated;
