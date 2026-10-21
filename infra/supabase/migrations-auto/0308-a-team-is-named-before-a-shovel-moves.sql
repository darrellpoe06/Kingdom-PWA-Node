-- =============================================================================
-- 0308 — A team is named before a shovel moves (DR-1175)
-- =============================================================================
-- Darrell, 2026-10-21, with a photograph of a slide titled "Your Team" and a
-- link: "Research and add features and functionality for users to formulation
-- of their teams... make sense? Inside the Poe Properties Apps for building
-- from nothing... make sense?"
--
-- The sixth child of dev_projects (0307). The other five count the BUILDING —
-- its budget, its change orders, its bays, its checks, its capital. This one
-- counts the PEOPLE, which is the thing a person starting from nothing has
-- none of and does not yet know to go find.
--
-- One row per role per project: who fills it, how to reach them, and anything
-- worth remembering about them. A role nobody fills has NO ROW, so a gap is a
-- gap in the record and not a row pretending to be one — the app reads the
-- sixteen roles from development-team.js (the slide, verbatim) and the names
-- from here, and the difference between the two IS the answer to "who do I
-- still need".
--
-- role_key is development-team.js's `roleKey` of the slide's own wording
-- ('surveyor', 'attorney-title-company', 'gc', ...). It is NOT constrained to
-- those sixteen: a build can need a role the slide does not name, and when it
-- does, `label` carries that role's own words. The sixteen are the spec, not a
-- ceiling.
--
-- THE WALL is the books' own, inherited from 0307 unchanged: owners, admins and
-- members read; only the owner or an admin writes; a child row must sit in its
-- project's own instance, so a name cannot be filed into another household's
-- project. A tenant, a child, an assistant, a viewer and anyone outside the
-- instance read nothing here — these are a developer's contacts, not a door's.
--
-- Idempotent: every CREATE is IF NOT EXISTS and every policy is dropped before
-- it is made, so the lane can apply this file twice.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.dev_team (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  -- roleKey() of the slide's wording, or of a role it does not name.
  role_key     text NOT NULL,
  -- The role's own words, only when it is NOT one of the slide's sixteen.
  label        text,
  name         text NOT NULL,
  company      text,
  phone        text,
  email        text,
  note         text,
  -- When they came on. NULL means nobody wrote it down, never today.
  joined_on    date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- A row exists because somebody fills the role. A blank name is not a person,
  -- and a row with one would read as filled on every surface that counts them.
  CONSTRAINT dev_team_name_chk CHECK (length(btrim(name)) > 0),
  CONSTRAINT dev_team_role_chk CHECK (length(btrim(role_key)) > 0),
  -- One person to a role, so "2 of 16 filled" counts roles and not rows.
  UNIQUE (project_id, role_key)
);
CREATE INDEX IF NOT EXISTS dev_team_project_idx ON public.dev_team(project_id, role_key);

-- ---------------------------------------------------------------------------
-- THE WALL — 0307's own functions, unchanged. dev_can_read / dev_can_write /
-- dev_project_in already exist and already say the right thing; this file
-- declares no new rule, it joins the one already standing.
-- ---------------------------------------------------------------------------
ALTER TABLE public.dev_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_team_read ON public.dev_team;
CREATE POLICY dev_team_read ON public.dev_team FOR SELECT TO authenticated
  USING (public.dev_can_read(instance_id));
DROP POLICY IF EXISTS dev_team_insert ON public.dev_team;
CREATE POLICY dev_team_insert ON public.dev_team FOR INSERT TO authenticated
  WITH CHECK (public.dev_can_write(instance_id) AND public.dev_project_in(project_id, instance_id));
DROP POLICY IF EXISTS dev_team_update ON public.dev_team;
CREATE POLICY dev_team_update ON public.dev_team FOR UPDATE TO authenticated
  USING (public.dev_can_write(instance_id))
  WITH CHECK (public.dev_can_write(instance_id) AND public.dev_project_in(project_id, instance_id));
DROP POLICY IF EXISTS dev_team_delete ON public.dev_team;
CREATE POLICY dev_team_delete ON public.dev_team FOR DELETE TO authenticated
  USING (public.dev_can_write(instance_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_team TO authenticated;

-- ---------------------------------------------------------------------------
-- THE OVERLAYS, in 0232's order (as 0302 and 0307). dev_team is instance-scoped,
-- so the assistant overlay narrows it the same way it narrows its five siblings,
-- and the RESTRICTIVE viewer overlay means a viewer who already reads nothing
-- here cannot write either.
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
