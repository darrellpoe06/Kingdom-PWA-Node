-- =============================================================================
-- arrivals-ci-bootstrap.sql — the tables 0245 touches, in their migration
-- shapes, for the CI `arrivals-push` job (DR-0728)
-- =============================================================================
-- Runs after scripts/curriculum-ci-bootstrap.sql (roles, auth.users, auth.uid())
-- against a throwaway postgres:16. It supplies only what 0245 and its smoke
-- touch, copied from the migrations that define them: instances (0012 shape,
-- the columns used), agent_inbox (0127), push_outbox (0220), and a
-- user_role_in_instance() that answers "no role" so the office policy of 0220
-- can be created and proven NOT to open a person's rows. Never applied to a
-- real database.
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.instances (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL
);

-- 0127, verbatim in shape.
CREATE TABLE IF NOT EXISTS public.agent_inbox (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  body          text NOT NULL,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  source        text NOT NULL DEFAULT 'thinking-space',
  directive_id  text,
  relayed_at    timestamptz,
  created_by    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 0220, verbatim in shape.
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
  attempts     integer     NOT NULL DEFAULT 0
);
ALTER TABLE public.push_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_outbox FROM PUBLIC, anon;
GRANT SELECT ON public.push_outbox TO authenticated;

CREATE OR REPLACE FUNCTION public.user_role_in_instance(p_instance uuid)
RETURNS text LANGUAGE sql STABLE AS $$ SELECT NULL::text $$;

DROP POLICY IF EXISTS push_outbox_office ON public.push_outbox;
CREATE POLICY push_outbox_office ON public.push_outbox
  FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));
