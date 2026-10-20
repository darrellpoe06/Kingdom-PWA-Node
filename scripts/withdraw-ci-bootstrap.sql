-- =============================================================================
-- withdraw-ci-bootstrap.sql — the tables and the one helper 0304 touches, in
-- their migration shapes, for the CI `withdraw-walls` job (DR-1137)
-- =============================================================================
-- Runs after scripts/curriculum-ci-bootstrap.sql (roles, auth.users, auth.uid())
-- against a throwaway postgres:16. It supplies only what 0304 and its smoke
-- touch, copied from the files that define them: instances (the columns used),
-- instance_members and user_role_in_instance() (schema-v2.1-infra.sql, the
-- REAL rule — a member's role in a house, or NULL), agent_inbox (0127, with
-- the 0237 review columns), and push_outbox (0220 + 0246, with the dedupe
-- index the sweep's ON CONFLICT needs). Never applied to a real database.
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.instances (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS public.instance_members (
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL,
  role         text NOT NULL,
  display_name text,
  PRIMARY KEY (instance_id, user_id)
);
CREATE OR REPLACE FUNCTION public.user_role_in_instance(tenant_uuid uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM instance_members
  WHERE instance_id = tenant_uuid AND user_id = auth.uid()
  LIMIT 1
$$;

-- 0127 (+ 0237's review columns), verbatim in shape.
CREATE TABLE IF NOT EXISTS public.agent_inbox (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  body          text NOT NULL,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  source        text NOT NULL DEFAULT 'thinking-space',
  directive_id  text,
  relayed_at    timestamptz,
  created_by    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  review_reason text,
  reviewed_at   timestamptz,
  reviewed_by   uuid
);
ALTER TABLE public.agent_inbox ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.agent_inbox TO authenticated;
DROP POLICY IF EXISTS agent_inbox_read ON public.agent_inbox;
CREATE POLICY agent_inbox_read ON public.agent_inbox FOR SELECT
  USING (public.user_role_in_instance(instance_id) IS NOT NULL);

-- 0220 + 0246, verbatim in shape.
CREATE TABLE IF NOT EXISTS public.push_outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  fault_id     uuid,
  kind         text        NOT NULL DEFAULT 'door_fault',
  title        text        NOT NULL,
  body         text        NOT NULL,
  target_role  text        NOT NULL DEFAULT 'owner_admin',
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz,
  attempts     integer     NOT NULL DEFAULT 0,
  target_user  uuid,
  url          text,
  dedupe_key   text
);
CREATE UNIQUE INDEX IF NOT EXISTS push_outbox_dedupe_idx
  ON public.push_outbox (dedupe_key) WHERE dedupe_key IS NOT NULL;
