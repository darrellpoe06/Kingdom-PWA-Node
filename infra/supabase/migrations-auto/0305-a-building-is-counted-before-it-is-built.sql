-- =============================================================================
-- 0305 — A building is counted before it is built (DR-1158)
-- =============================================================================
-- Darrell, 2026-10-21, over Daniil Kleyman's walk-through of a 40-unit
-- mixed-use build in Richmond: "Find and create processes for these types of
-- real-estate solutions." Then each phase's systems and checks, and the
-- commercial shell with its tenant improvement allowance.
--
-- A development project and its records, in the instance that owns it (the
-- landlord instance for Poe Properties, DR-0365):
--   dev_projects        the building: apartments, square feet, dates, and the
--                       income and cap rates its value is read from
--   dev_budget_lines    land, soft, hard, TI, cost of money, contingency
--   dev_change_orders   every change, where its money comes from, and its yes
--   dev_bays            each commercial bay and its TI allowance, drawn down
--   dev_capital         who funds it: the loan, the investors, our own equity
--   dev_checks          a phase's checks: passed, failed or pending, dated
--                       and signed (the third-party concrete test, the seven
--                       rough-in trades, the elevator inspection)
-- The arithmetic lives in app/src/modules/properties/development.js.
--
-- THE WALL is the books' own (0202): owners, admins and members read; only the
-- owner or an admin writes; a child, an assistant, a viewer and anyone outside
-- the instance read nothing. Every child row must sit in its project's own
-- instance, so a row cannot be filed into another household's project.
--
-- Money is integer cents (0203's rule). A blank amount is NULL, never 0: the
-- engine names it unpriced rather than adding a zero. Cap rates are basis
-- points (550 = 5.5%), so a rate is exact.
--
-- Idempotent: every CREATE is IF NOT EXISTS and every policy is dropped before
-- it is made, so the lane can apply this file twice.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.dev_projects (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id            uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by             uuid NOT NULL REFERENCES auth.users(id),
  name                   text NOT NULL,
  kind                   text NOT NULL DEFAULT 'mixed-use',
  has_elevator           boolean NOT NULL DEFAULT false,
  -- The PoeTech Projects tab's project for this build (projects.slug): the
  -- work and its hours live there, the building's numbers here.
  project_ref            text,
  place                  text,
  units                  integer,
  gross_sq_ft            integer,
  starts_on              date,
  finishes_on            date,
  status                 text NOT NULL DEFAULT 'planning',
  residential_noi_cents  bigint,
  residential_cap_bp     integer,
  commercial_noi_cents   bigint,
  commercial_cap_bp      integer,
  note                   text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_projects_name_chk CHECK (length(btrim(name)) > 0),
  CONSTRAINT dev_projects_kind_chk CHECK (kind IN ('home','duplex','multifamily','mixed-use','commercial')),
  CONSTRAINT dev_projects_status_chk CHECK (status IN ('planning','building','complete','archived')),
  CONSTRAINT dev_projects_units_chk CHECK (units IS NULL OR units >= 0),
  CONSTRAINT dev_projects_sqft_chk CHECK (gross_sq_ft IS NULL OR gross_sq_ft >= 0),
  CONSTRAINT dev_projects_res_cap_chk CHECK (residential_cap_bp IS NULL OR residential_cap_bp > 0),
  CONSTRAINT dev_projects_com_cap_chk CHECK (commercial_cap_bp IS NULL OR commercial_cap_bp > 0),
  CONSTRAINT dev_projects_dates_chk CHECK (starts_on IS NULL OR finishes_on IS NULL OR finishes_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS dev_projects_instance_idx ON public.dev_projects(instance_id, status);

CREATE TABLE IF NOT EXISTS public.dev_budget_lines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  kind          text NOT NULL,
  grp           text,
  label         text NOT NULL,
  budget_cents  bigint,
  actual_cents  bigint,
  sort          integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_budget_lines_kind_chk CHECK (kind IN ('land','soft','hard','ti','financing','contingency')),
  CONSTRAINT dev_budget_lines_label_chk CHECK (length(btrim(label)) > 0),
  CONSTRAINT dev_budget_lines_budget_chk CHECK (budget_cents IS NULL OR budget_cents >= 0),
  CONSTRAINT dev_budget_lines_actual_chk CHECK (actual_cents IS NULL OR actual_cents >= 0)
);
CREATE INDEX IF NOT EXISTS dev_budget_lines_project_idx ON public.dev_budget_lines(project_id, kind, sort);

CREATE TABLE IF NOT EXISTS public.dev_change_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  label         text NOT NULL,
  amount_cents  bigint NOT NULL,
  source        text NOT NULL DEFAULT 'contingency',
  status        text NOT NULL DEFAULT 'proposed',
  decided_on    date,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_change_orders_label_chk CHECK (length(btrim(label)) > 0),
  CONSTRAINT dev_change_orders_amount_chk CHECK (amount_cents > 0),
  CONSTRAINT dev_change_orders_source_chk CHECK (source IN ('contingency','ti','line','owner')),
  CONSTRAINT dev_change_orders_status_chk CHECK (status IN ('proposed','approved','rejected')),
  CONSTRAINT dev_change_orders_decided_chk CHECK (status = 'proposed' OR decided_on IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS dev_change_orders_project_idx ON public.dev_change_orders(project_id, status);

CREATE TABLE IF NOT EXISTS public.dev_bays (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name            text NOT NULL,
  sq_ft           integer,
  tenant          text,
  ti_cents        bigint,
  ti_drawn_cents  bigint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_bays_name_chk CHECK (length(btrim(name)) > 0),
  CONSTRAINT dev_bays_sqft_chk CHECK (sq_ft IS NULL OR sq_ft >= 0),
  CONSTRAINT dev_bays_ti_chk CHECK (ti_cents IS NULL OR ti_cents >= 0),
  CONSTRAINT dev_bays_drawn_chk CHECK (ti_drawn_cents >= 0)
);
CREATE INDEX IF NOT EXISTS dev_bays_project_idx ON public.dev_bays(project_id);

CREATE TABLE IF NOT EXISTS public.dev_capital (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  kind          text NOT NULL,
  name          text NOT NULL,
  amount_cents  bigint,
  rate_bp       integer,
  share_bp      integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_capital_kind_chk CHECK (kind IN ('loan','investor','sponsor')),
  CONSTRAINT dev_capital_name_chk CHECK (length(btrim(name)) > 0),
  CONSTRAINT dev_capital_amount_chk CHECK (amount_cents IS NULL OR amount_cents >= 0),
  CONSTRAINT dev_capital_rate_chk CHECK (rate_bp IS NULL OR rate_bp >= 0),
  CONSTRAINT dev_capital_share_chk CHECK (share_bp IS NULL OR (share_bp >= 0 AND share_bp <= 10000))
);
CREATE INDEX IF NOT EXISTS dev_capital_project_idx ON public.dev_capital(project_id, kind);

CREATE TABLE IF NOT EXISTS public.dev_checks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  phase_key    text NOT NULL,
  check_key    text NOT NULL,
  label        text,
  required     boolean NOT NULL DEFAULT true,
  state        text NOT NULL DEFAULT 'pending',
  checked_on   date,
  signed_by    text,
  note         text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_checks_phase_chk CHECK (phase_key IN ('site','foundation','underground','structure','envelope','mep','interior','commercial-shell')),
  CONSTRAINT dev_checks_state_chk CHECK (state IN ('pending','passed','failed')),
  -- A passed or failed check says when.
  CONSTRAINT dev_checks_dated_chk CHECK (state = 'pending' OR checked_on IS NOT NULL),
  UNIQUE (project_id, phase_key, check_key)
);

-- ---------------------------------------------------------------------------
-- THE WALL — the books' own (0202): read by owner, admin, member; written by
-- owner or admin; a child row stays in its project's instance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dev_can_read(instance_in uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT coalesce(public.user_role_in_instance(instance_in), '') IN ('owner','admin','member')
$$;
CREATE OR REPLACE FUNCTION public.dev_can_write(instance_in uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT coalesce(public.user_role_in_instance(instance_in), '') IN ('owner','admin')
$$;
CREATE OR REPLACE FUNCTION public.dev_project_in(project_in uuid, instance_in uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (SELECT 1 FROM public.dev_projects p WHERE p.id = project_in AND p.instance_id = instance_in)
$$;
REVOKE ALL ON FUNCTION public.dev_can_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_can_write(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_project_in(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_can_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_can_write(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_project_in(uuid, uuid) TO authenticated;

ALTER TABLE public.dev_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_capital ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_projects_read ON public.dev_projects;
CREATE POLICY dev_projects_read ON public.dev_projects FOR SELECT TO authenticated
  USING (public.dev_can_read(instance_id));
DROP POLICY IF EXISTS dev_projects_insert ON public.dev_projects;
CREATE POLICY dev_projects_insert ON public.dev_projects FOR INSERT TO authenticated
  WITH CHECK (public.dev_can_write(instance_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS dev_projects_update ON public.dev_projects;
CREATE POLICY dev_projects_update ON public.dev_projects FOR UPDATE TO authenticated
  USING (public.dev_can_write(instance_id)) WITH CHECK (public.dev_can_write(instance_id));
DROP POLICY IF EXISTS dev_projects_delete ON public.dev_projects;
CREATE POLICY dev_projects_delete ON public.dev_projects FOR DELETE TO authenticated
  USING (public.dev_can_write(instance_id));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['dev_budget_lines','dev_change_orders','dev_bays','dev_checks','dev_capital'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.dev_can_read(instance_id))', t || '_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.dev_can_write(instance_id) AND public.dev_project_in(project_id, instance_id))', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.dev_can_write(instance_id)) WITH CHECK (public.dev_can_write(instance_id) AND public.dev_project_in(project_id, instance_id))', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.dev_can_write(instance_id))', t || '_delete', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_projects, public.dev_budget_lines,
  public.dev_change_orders, public.dev_bays, public.dev_checks, public.dev_capital TO authenticated;

-- ---------------------------------------------------------------------------
-- THE OVERLAYS, in 0232's order (as 0302). All six tables are instance-scoped.
-- The viewer overlay is RESTRICTIVE, so re-running it only narrows: a viewer
-- already reads nothing here and now cannot write either.
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
