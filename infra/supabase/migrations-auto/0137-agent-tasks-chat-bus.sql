-- ============================================================================
-- 0137 — agent_tasks: the chat/task bus the router's header already describes
-- ============================================================================
-- DR-0132 P1 decided the path (Supabase-bus + outbound-poll box agent; no
-- inbound middleware, no n8n) and llm-router.js:10 has described `agent_tasks`
-- since 2026-07-08 — but MEASURED 2026-08-15: no migration ever created the
-- table and no app code writes it. The unified chat pane (green-lit 2026-08-15,
-- relayed via the Gemini ensemble seam) is its first writer.
--
-- Shape: one row per prompt/task. The PWA INSERTs and READS; the (Cage-gated,
-- ships-inert) box agent polls outbound, runs the router's pick, and writes
-- status/result back. The UI's pending state IS the queued row — no sockets,
-- no SSE normalization, nothing to time out (the exact flaws the inbound
-- design was rejected for).
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  created_by  uuid NOT NULL DEFAULT auth.uid(),
  kind        text NOT NULL DEFAULT 'chat',
  message     text NOT NULL,
  -- 'local' | 'claude' | 'gemini' — the client's parsed @prefix, default local.
  target      text NOT NULL DEFAULT 'local'
              CHECK (target IN ('local', 'claude', 'gemini')),
  -- DR-0073's line, enforced in the DATABASE, not only the client: a private
  -- row physically cannot carry a vendor target. Belt (client) AND suspenders.
  private     boolean NOT NULL DEFAULT false,
  status      text NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued', 'running', 'done', 'failed', 'cancelled')),
  result      text,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_tasks_private_is_local CHECK (NOT private OR target = 'local')
);

-- The 0136 touch function is shared by design; updated_at stays a trustworthy
-- watermark here from day one instead of needing its own 0136 later.
DROP TRIGGER IF EXISTS agent_tasks_touch_updated_at ON public.agent_tasks;
CREATE TRIGGER agent_tasks_touch_updated_at
  BEFORE INSERT OR UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS agent_tasks_poll_idx
  ON public.agent_tasks (status, created_at)
  WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS agent_tasks_instance_updated_idx
  ON public.agent_tasks (instance_id, updated_at);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- USER-scoped, not instance-scoped (the DR-0291-era data-liberation pattern):
-- your prompts are yours. The box agent reads via service role and is unbound
-- by these policies; no other user sees your chat.
DROP POLICY IF EXISTS agent_tasks_owner_read ON public.agent_tasks;
CREATE POLICY agent_tasks_owner_read ON public.agent_tasks
  FOR SELECT USING (user_in_instance(instance_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS agent_tasks_owner_insert ON public.agent_tasks;
CREATE POLICY agent_tasks_owner_insert ON public.agent_tasks
  FOR INSERT WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS agent_tasks_owner_cancel ON public.agent_tasks;
CREATE POLICY agent_tasks_owner_cancel ON public.agent_tasks
  FOR UPDATE USING (user_in_instance(instance_id) AND created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Prove it (DR-0076): the privacy CHECK must actually reject a private+vendor row.
DO $$
BEGIN
  BEGIN
    INSERT INTO public.agent_tasks (instance_id, created_by, message, target, private)
    VALUES (gen_random_uuid(), gen_random_uuid(), '0137 selftest', 'claude', true);
    RAISE EXCEPTION '0137: the private-is-local CHECK failed to catch a private vendor row';
  EXCEPTION WHEN check_violation THEN
    NULL; -- caught, as required
  END;
END $$;

-- Every instance-scoped table re-runs the standing overlays (DR-0241 / 0130):
-- the viewer read-only family and the assistant scope family must cover this
-- table too, or a viewer could write chat rows and an assistant could read
-- outside its office. The tenancy/assistant gates enforce exactly this line.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
