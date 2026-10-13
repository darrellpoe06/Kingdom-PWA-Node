-- =============================================================================
-- 0234 — every connection leaves its live numbers (DR-0622)
-- =============================================================================
-- Darrell 2026-09-24: "The data should be the proof of the end, whole end to
-- end process. So we can actually see, and that data should seed the next
-- process."
--
-- The whole-system flow graph (scripts/system-flow-registry.mjs) names every
-- connection between the app, the NAS riders and the GitHub workflows. Every
-- 6 hours .github/workflows/system-flow-proof.yml reads each connection's live
-- numbers on this database — how many rows were written, the newest one, how
-- many were picked up downstream — and each workflow's latest run, and writes
-- one row per resource here. The app's Interconnect proof and the Decision
-- Intelligence board read these rows; a stale or broken connection becomes an
-- escalation, so the monitors' own output seeds the next readout.
--
-- NOT instance-scoped: these are facts about the platform, not any family's
-- rows, so there is no instance_id and no overlay applies. WRITES: the service
-- role and the migration role only (the runner writes through scripts/
-- live-sql.sh as supabase_admin); no client can write a row. READS: the
-- governor circle only — an owner, admin or member of the poe-family instance
-- (the same circle admin_signup_metrics() admits, migration 0055). A viewer, a
-- stranger, or a member of any other instance reads nothing. Proven by
-- infra/supabase/tests/0234-system-flow-proof-smoke.sql in the RLS matrix.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.system_flow_proof (
  id           bigserial PRIMARY KEY,
  run_id       text NOT NULL,
  measured_at  timestamptz NOT NULL DEFAULT now(),
  resource     text NOT NULL,
  written      bigint,
  newest_at    timestamptz,
  consumed     bigint,
  note         text,
  error        text
);
CREATE INDEX IF NOT EXISTS system_flow_proof_measured_idx
  ON public.system_flow_proof (measured_at DESC);
CREATE INDEX IF NOT EXISTS system_flow_proof_run_idx
  ON public.system_flow_proof (run_id);

COMMENT ON TABLE public.system_flow_proof IS 'One row per resource per proof run: the live count written, newest row, count consumed downstream (or a workflow''s latest run). Written by system-flow-proof.yml; read by governors. DR-0622.';

ALTER TABLE public.system_flow_proof ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_flow_proof_governors_read ON public.system_flow_proof;
CREATE POLICY system_flow_proof_governors_read ON public.system_flow_proof
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM public.instance_members im
      JOIN public.instances i ON i.id = im.instance_id
     WHERE im.user_id = auth.uid()
       AND i.slug = 'poe-family'
       AND im.role IN ('owner', 'admin', 'member')
  ));

REVOKE ALL ON public.system_flow_proof FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.system_flow_proof FROM authenticated;
GRANT SELECT ON public.system_flow_proof TO authenticated;
GRANT ALL ON public.system_flow_proof TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.system_flow_proof_id_seq TO service_role;

NOTIFY pgrst, 'reload schema';
