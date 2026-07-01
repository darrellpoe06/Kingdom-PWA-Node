-- =====================================================================
-- PROPOSED (GATED — NOT auto-applied). See infra/supabase/proposed/README.md
--
-- role-framework-and-threads.sql
-- GENERAL, CONFIGURABLE role primitive + tiered-visibility conversations.
--
-- Supersedes property-manager-scoped-role.sql: Property Manager, Project
-- Manager, contractor, volunteer, learner, and future roles are all
-- CONFIGURED roles on ONE framework — adding a role is configuration
-- (a row), not a new build. Subscribers configure their OWN roles inside
-- their OWN org; cross-org isolation stays absolute (no-leak).
--
-- Model (four parts Darrell named):
--   (a) SCOPE   — role_assignments: subject -> (scope_kind, scope_ref).
--   (b) SEE     — least-privilege views/policies gated by subject_assigned_to().
--   (c) THREADS — threads/participants/messages with TIERED visibility RLS.
--   (d) OWNER-ABOVE — owner/admin of the org sees ALL in-org, addresses either side.
--
-- Fail-closed: a worker/learner is an external subject OR a non-member auth
-- user -> passes user_in_instance() NOWHERE -> default-DENY; sees only what an
-- un-revoked assignment / thread participation opens. Owner's all-seeing scope
-- is BOUNDED by their instance (tenant) — the tenant boundary is the no-leak wall.
--
-- Depends on: schema-v2.1-infra.sql (instances, external_users, current_external_user_id,
--   user_in_instance, user_role_in_instance), schema-v2.2-rentals.sql, schema-v2.4-contractor.sql.
-- Pairs with: docs/00-foundations/ROLE-FRAMEWORK-CONFIGURED-ROLES.md,
--   role-framework-leak-test.sql (proven-to-catch across role variants).
-- Guards: tenancy-guard.mjs (RLS on every instance_id table) + grant-guard.mjs.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. external_users may now be a property-manager / project-manager / worker.
-- ---------------------------------------------------------------------
ALTER TABLE external_users DROP CONSTRAINT IF EXISTS external_users_type_check;
ALTER TABLE external_users ADD CONSTRAINT external_users_type_check CHECK (type IN (
  'contractor','renter','client','donor','parishioner','volunteer','customer','vendor',
  'property-manager','project-manager','worker'      -- NEW (1099 worker variants)
));

-- ---------------------------------------------------------------------
-- 1. role_definitions — the CONFIGURABLE role catalog, PER INSTANCE.
--    Each subscriber org defines its own roles. worker_class groups the tier;
--    scope_kinds says what a role may be scoped to; read_only marks learners.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_definitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  role_key     text NOT NULL,                       -- 'property-manager','project-manager','learner',...
  worker_class text NOT NULL CHECK (worker_class IN
                 ('1099-contractor','staff','volunteer','learner')),
  label        text NOT NULL,
  scope_kinds  text[] NOT NULL DEFAULT '{}',         -- {'property'} | {'project'} | {'project','board'} ...
  capabilities text[] NOT NULL DEFAULT '{}',         -- 'threads:participate','items:update','read-only'
  read_only    boolean NOT NULL DEFAULT false,       -- learner = true
  created_by   uuid NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, role_key)
);
CREATE INDEX IF NOT EXISTS role_definitions_instance_idx ON role_definitions (instance_id);
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_defs_member_read ON role_definitions FOR SELECT
  USING (user_in_instance(instance_id));            -- members see their org's role catalog
CREATE POLICY role_defs_owner_write ON role_definitions FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin') AND created_by = auth.uid());
CREATE POLICY role_defs_owner_update ON role_definitions FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------
-- 2. role_assignments — generalizes property_assignments.
--    Subject is EITHER an external user (1099 worker/customer) OR a non-member
--    auth user (a learner/minor). scope_ref is TEXT so it holds a rental uuid
--    OR a board slug OR any entity key — one primitive, any scope.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id         uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  role_key            text NOT NULL,
  subject_kind        text NOT NULL CHECK (subject_kind IN ('external','member')),
  subject_external_id uuid REFERENCES external_users(id) ON DELETE CASCADE,
  subject_user_id     uuid REFERENCES auth.users(id),
  scope_kind          text NOT NULL,                 -- 'property','project','board','instance'
  scope_ref           text NOT NULL,                 -- rental_id::text | board_slug | ...
  guardian_user_id    uuid REFERENCES auth.users(id),-- set for learner/minor
  granted_by          uuid NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  revoked_at          timestamptz,
  revoked_by          uuid REFERENCES auth.users(id),
  FOREIGN KEY (instance_id, role_key) REFERENCES role_definitions (instance_id, role_key),
  CHECK ( (subject_kind='external' AND subject_external_id IS NOT NULL AND subject_user_id IS NULL)
       OR (subject_kind='member'   AND subject_user_id     IS NOT NULL AND subject_external_id IS NULL) ),
  UNIQUE (instance_id, role_key, subject_external_id, subject_user_id, scope_kind, scope_ref)
);
CREATE INDEX IF NOT EXISTS role_assignments_ext_idx
  ON role_assignments (subject_external_id, scope_kind) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS role_assignments_member_idx
  ON role_assignments (subject_user_id, scope_kind) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS role_assignments_scope_idx
  ON role_assignments (scope_kind, scope_ref) WHERE revoked_at IS NULL;

ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

-- Only owner/admin of the OWNING org may grant/modify (DB-level enforcement of
-- "humans grant, not the agent" — an agent has no owner session).
CREATE POLICY role_assign_owner_read ON role_assignments FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY role_assign_owner_insert ON role_assignments FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin') AND granted_by = auth.uid());
CREATE POLICY role_assign_owner_update ON role_assignments FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
-- Guardian may read/revoke the learner assignments they created (curate their kids).
CREATE POLICY role_assign_guardian_manage ON role_assignments FOR UPDATE
  USING (guardian_user_id = auth.uid())
  WITH CHECK (guardian_user_id = auth.uid());
-- The subject may READ their OWN active assignments (their app lists their scope).
CREATE POLICY role_assign_subject_self_read ON role_assignments FOR SELECT
  USING (revoked_at IS NULL AND (
      (subject_kind='external' AND subject_external_id = current_external_user_id())
   OR (subject_kind='member'   AND subject_user_id     = auth.uid())));

-- ---------------------------------------------------------------------
-- 3. THE predicate — is the CURRENT subject assigned to this scope?
--    Handles both subject identities. Returns false for a plain owner (they
--    read via membership, not assignment), so it never widens internal access.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subject_assigned_to(p_scope_kind text, p_scope_ref text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM role_assignments ra
    WHERE ra.scope_kind = p_scope_kind
      AND ra.scope_ref  = p_scope_ref
      AND ra.revoked_at IS NULL
      AND ( (ra.subject_kind='external' AND ra.subject_external_id = current_external_user_id())
         OR (ra.subject_kind='member'   AND ra.subject_user_id     = auth.uid()) )
  )
$$;
GRANT EXECUTE ON FUNCTION public.subject_assigned_to(text, text) TO authenticated, anon;

-- Back-compat wrapper so the rentals-lane handoff keeps working unchanged.
CREATE OR REPLACE FUNCTION public.pm_assigned_to_rental(p_rental_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$ SELECT public.subject_assigned_to('property', p_rental_id::text) $$;
GRANT EXECUTE ON FUNCTION public.pm_assigned_to_rental(uuid) TO authenticated, anon;

-- ---------------------------------------------------------------------
-- 4. PER-SCOPE least-privilege SEE surfaces (config, not bespoke).
-- ---------------------------------------------------------------------
-- 4a. PROPERTY scope — management columns only, assigned units only.
CREATE OR REPLACE VIEW public.pm_property_view AS
  SELECT id, instance_id, address, unit, display_name, property_type,
         city, state, zip, status
  FROM rentals WHERE subject_assigned_to('property', id::text);
GRANT SELECT ON public.pm_property_view TO authenticated;

CREATE OR REPLACE VIEW public.pm_renter_view AS
  SELECT DISTINCT r.id, r.instance_id, r.display_name, r.contact_email, r.contact_phone,
         r.emergency_contact_name, r.emergency_contact_phone, l.rental_id
  FROM renters r JOIN leases l ON l.renter_id = r.id
  WHERE subject_assigned_to('property', l.rental_id::text);
GRANT SELECT ON public.pm_renter_view TO authenticated;

CREATE POLICY maint_req_worker_read ON maintenance_requests FOR SELECT
  USING (subject_assigned_to('property', rental_id::text));
CREATE POLICY maint_req_worker_insert ON maintenance_requests FOR INSERT
  WITH CHECK (subject_assigned_to('property', rental_id::text) AND created_by = auth.uid()
              AND submitted_via IN ('in-person','owner-discovery','phone','email','sms'));
CREATE POLICY maint_req_worker_update ON maintenance_requests FOR UPDATE
  USING (subject_assigned_to('property', rental_id::text))
  WITH CHECK (subject_assigned_to('property', rental_id::text));

-- 4b. PROJECT scope — a Project Manager sees assigned boards' items only.
--     board_tasks keys on board_slug (text) -> scope_ref = board_slug.
CREATE POLICY board_tasks_worker_read ON board_tasks FOR SELECT
  USING (subject_assigned_to('project', board_slug));
CREATE POLICY board_tasks_worker_update ON board_tasks FOR UPDATE
  USING (subject_assigned_to('project', board_slug))
  WITH CHECK (subject_assigned_to('project', board_slug));
-- (No finance/other-board access: any board not assigned -> predicate false.)

-- 4c. LIVE per-unit management surface (0055 + 0062, applied on main).
--     RECONCILED with the rentals-mgmt lane (local_9aedb5b8): the surface the
--     owner actually uses is tenant_messages / tenant_maintenance_requests,
--     which key on tenancy_id (NOT the v2.2 maintenance_requests in §4a).
--     Resolve tenancy_id -> the unit door (rental_ref) so the external PM sees
--     ONLY assigned units. RENTAL_REF ALIGNMENT: property scope_ref == the unit
--     door id the live tables use (rentals[].id, stored as rental_ref); the
--     owner assigns using that same ref (the UI passes the door id both use).
CREATE OR REPLACE FUNCTION public.subject_assigned_to_tenancy(p_tenancy_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT public.subject_assigned_to('property', rt.rental_ref)
  FROM rental_tenancies rt WHERE rt.id = p_tenancy_id
$$;
GRANT EXECUTE ON FUNCTION public.subject_assigned_to_tenancy(uuid) TO authenticated, anon;

-- Tenant service requests: PM reads + works requests for assigned units only.
CREATE POLICY tenant_maint_worker_read ON tenant_maintenance_requests FOR SELECT
  USING (subject_assigned_to_tenancy(tenancy_id));
CREATE POLICY tenant_maint_worker_insert ON tenant_maintenance_requests FOR INSERT
  WITH CHECK (subject_assigned_to_tenancy(tenancy_id) AND created_by_role = 'manager');
CREATE POLICY tenant_maint_worker_update ON tenant_maintenance_requests FOR UPDATE
  USING (subject_assigned_to_tenancy(tenancy_id))
  WITH CHECK (subject_assigned_to_tenancy(tenancy_id));

-- Tenant<->PM messages: PM reads the thread + posts AS 'manager' for assigned units.
CREATE POLICY tenant_msg_worker_read ON tenant_messages FOR SELECT
  USING (subject_assigned_to_tenancy(tenancy_id));
CREATE POLICY tenant_msg_worker_insert ON tenant_messages FOR INSERT
  WITH CHECK (subject_assigned_to_tenancy(tenancy_id) AND from_role = 'manager');
-- NOTE: tenant_messages has NO delivery_status column; outbound-to-non-user
-- approval is enforced in the app (UnitManagement.jsx draft->preview->approve).
-- The DB-level outbound guardrail lives in thread_messages (§5); the live store
-- converges onto threads later (rentals-lane handoff), not forked speculatively.
--
-- property_notes (0062) is DELIBERATELY NOT PM-readable: it is the landlord's
-- OWN private per-unit memory (may hold sensitive owner notes), never even
-- tenant-visible. The PM gets tenant-facing exchanges, not the owner's memory.
-- (Confirmed with the rentals-mgmt lane, 2026-07-01.)

-- ---------------------------------------------------------------------
-- 5. THREADS — conversations with TIERED visibility (the core of this change).
--    Owner/admin: ALL in-org.  Worker: threads for scopes assigned to them.
--    Participant (tenant/customer): only threads they are in.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS threads (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id        uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  scope_kind         text NOT NULL,                  -- 'property','project','board'
  scope_ref          text NOT NULL,                  -- the unit/board the thread is about
  subject            text,
  kind               text NOT NULL DEFAULT 'discussion'
                       CHECK (kind IN ('discussion','service-request','announcement')),
  created_by_member  uuid REFERENCES auth.users(id),
  created_by_external uuid REFERENCES external_users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  last_message_at    timestamptz
);
CREATE INDEX IF NOT EXISTS threads_scope_idx ON threads (scope_kind, scope_ref);
CREATE INDEX IF NOT EXISTS threads_instance_idx ON threads (instance_id);

CREATE TABLE IF NOT EXISTS thread_participants (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id               uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  instance_id             uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  participant_kind        text NOT NULL CHECK (participant_kind IN ('member','external')),
  participant_user_id     uuid REFERENCES auth.users(id),
  participant_external_id uuid REFERENCES external_users(id),
  added_by                uuid REFERENCES auth.users(id),
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS thread_participants_thread_idx ON thread_participants (thread_id);

CREATE TABLE IF NOT EXISTS thread_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id         uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  instance_id       uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  author_kind       text NOT NULL CHECK (author_kind IN ('member','external')),
  author_user_id    uuid REFERENCES auth.users(id),
  author_external_id uuid REFERENCES external_users(id),
  body              text NOT NULL,
  channel           text NOT NULL DEFAULT 'in-app' CHECK (channel IN ('in-app','sms','email')),
  -- GUARDRAIL: in-app between registered users sends directly; OUTBOUND to a
  -- non-user (sms/email) MUST start pending-approval and be approved by a human.
  delivery_status   text NOT NULL DEFAULT 'sent'
                      CHECK (delivery_status IN ('sent','pending-approval','approved','declined','failed')),
  approved_by       uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS thread_messages_thread_idx ON thread_messages (thread_id, created_at);

ALTER TABLE threads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_messages     ENABLE ROW LEVEL SECURITY;

-- One visibility function -> the three tiers, evaluated per thread.
CREATE OR REPLACE FUNCTION public.can_see_thread(p_thread_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM threads t WHERE t.id = p_thread_id AND (
         user_role_in_instance(t.instance_id) IN ('owner','admin')      -- TIER 1: owner sees ALL in-org
      OR subject_assigned_to(t.scope_kind, t.scope_ref)                 -- TIER 2: worker sees assigned scope
      OR EXISTS (SELECT 1 FROM thread_participants tp                    -- TIER 3: participant sees own thread
                 WHERE tp.thread_id = t.id
                   AND ((tp.participant_kind='member'   AND tp.participant_user_id = auth.uid())
                     OR (tp.participant_kind='external' AND tp.participant_external_id = current_external_user_id())))
    )
  )
$$;
GRANT EXECUTE ON FUNCTION public.can_see_thread(uuid) TO authenticated, anon;

CREATE POLICY threads_tiered_read ON threads FOR SELECT USING (can_see_thread(id));
CREATE POLICY thread_participants_tiered_read ON thread_participants FOR SELECT
  USING (can_see_thread(thread_id));
CREATE POLICY thread_messages_tiered_read ON thread_messages FOR SELECT
  USING (can_see_thread(thread_id));

-- Anyone who can see a thread may post to it, AS themselves. The outbound
-- guardrail is enforced in the WITH CHECK: an sms/email message may only be
-- INSERTED as pending-approval; it is NEVER auto-sent.
CREATE POLICY thread_messages_insert ON thread_messages FOR INSERT WITH CHECK (
  can_see_thread(thread_id)
  AND ( (author_kind='member'   AND author_user_id     = auth.uid())
     OR (author_kind='external' AND author_external_id = current_external_user_id()) )
  AND ( (channel = 'in-app'                 AND delivery_status = 'sent')
     OR (channel IN ('sms','email')         AND delivery_status = 'pending-approval') )
);
-- Only owner/admin OR the assigned worker on the thread's scope may APPROVE an
-- outbound message (move pending-approval -> approved/declined). Never auto.
CREATE POLICY thread_messages_approve ON thread_messages FOR UPDATE
  USING ( EXISTS (SELECT 1 FROM threads t WHERE t.id = thread_messages.thread_id
                  AND (user_role_in_instance(t.instance_id) IN ('owner','admin')
                    OR subject_assigned_to(t.scope_kind, t.scope_ref))) )
  WITH CHECK ( delivery_status IN ('approved','declined','failed','sent')
               AND approved_by = auth.uid() );

CREATE POLICY threads_insert ON threads FOR INSERT WITH CHECK (
  user_in_instance(instance_id)                                   -- internal starts a thread
  OR subject_assigned_to(scope_kind, scope_ref)                   -- assigned worker starts one
);
CREATE POLICY thread_participants_owner_worker_write ON thread_participants FOR INSERT
  WITH CHECK ( user_role_in_instance(instance_id) IN ('owner','admin')
               OR subject_assigned_to((SELECT scope_kind FROM threads WHERE id = thread_id),
                                      (SELECT scope_ref  FROM threads WHERE id = thread_id)) );

-- ---------------------------------------------------------------------
-- 6. LEARNER / next-gen steward — guardian-curated, READ-ONLY, minor-safe.
--    A learner is a role_assignment (worker_class 'learner', subject_kind
--    'member' = the child's account, guardian_user_id set). They read a
--    CURATED view of what the guardian permits — never raw finances/PII
--    unless the guardian opts a scope in. Reuses subject_assigned_to.
-- ---------------------------------------------------------------------
-- Curated learner property view: what's managed + status, NO financials, NO
-- tenant PII. Teaching overlays live in the app (two-tier self-explaining).
CREATE OR REPLACE VIEW public.learner_property_view AS
  SELECT id, instance_id, display_name, property_type, status
  FROM rentals WHERE subject_assigned_to('property', id::text);
GRANT SELECT ON public.learner_property_view TO authenticated;

-- Curated learner project view: what we plan to do + progress, NO $ columns.
CREATE OR REPLACE VIEW public.learner_project_view AS
  SELECT id, instance_id, board_slug, board_title, title, status, group_label
  FROM board_tasks WHERE subject_assigned_to('project', board_slug);
GRANT SELECT ON public.learner_project_view TO authenticated;

-- Guardian RPC: curate exactly what a child (learner) may see. Owner/admin +
-- guardian only. The child's account must already exist (guardian-CREATED,
-- no self-signup — see COPPA note). This is the ONLY learner-grant path.
CREATE OR REPLACE FUNCTION public.assign_learner_scope(
  p_child_user_id uuid, p_scope_kind text, p_scope_ref text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE v_caller uuid := auth.uid(); v_instance uuid; v_id uuid;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'assign_learner_scope: not authenticated'; END IF;
  SELECT im.instance_id INTO v_instance FROM instance_members im
    WHERE im.user_id = v_caller AND im.role IN ('owner','admin') LIMIT 1;
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'assign_learner_scope: only an owner/admin guardian may curate a learner';
  END IF;
  -- The child must NOT be a full member of this org (fail-closed: a learner
  -- reads only curated scopes, never via membership).
  IF EXISTS (SELECT 1 FROM instance_members WHERE instance_id = v_instance AND user_id = p_child_user_id
             AND role NOT IN ('minor','viewer')) THEN
    RAISE EXCEPTION 'assign_learner_scope: learner must not hold a full-member role';
  END IF;
  INSERT INTO role_assignments (instance_id, role_key, subject_kind, subject_user_id,
                                scope_kind, scope_ref, guardian_user_id, granted_by)
  VALUES (v_instance, 'learner', 'member', p_child_user_id,
          p_scope_kind, p_scope_ref, v_caller, v_caller)
  ON CONFLICT (instance_id, role_key, subject_external_id, subject_user_id, scope_kind, scope_ref)
    DO UPDATE SET revoked_at = NULL, revoked_by = NULL
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_learner_scope(uuid, text, text) TO authenticated;

-- COPPA / minor-safety note (enforced across the stack, not just here):
--   * Minor accounts are guardian-CREATED only (no self-signup path exists;
--     their emails are on no self-serve allowlist). No phone required/stored.
--   * A minor holds role 'minor' for their own age-appropriate surfaces (see
--     ROLES-MEMBERSHIP-MULTITENANCY-ADR GAP B) and a curated 'learner' scope
--     here for the management-teaching view. Neither grants raw family finances.
--   * Guardian opts a scope in per child; default is nothing visible.

-- ---------------------------------------------------------------------
-- 7. GENERAL onboarding RPC — invite ANY external worker (1099 variant).
--    Owner/admin only. Creates the external_user, the role_assignments for
--    each scope_ref, links a contractor/tax record, returns the id the app
--    uses to mint the magic-link invite. (Learners use assign_learner_scope.)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invite_worker(
  p_email        text,
  p_display_name text,
  p_role_key     text,
  p_scope_kind   text,
  p_scope_refs   text[],
  p_link_1099    boolean DEFAULT true
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_caller   uuid := auth.uid();
  v_instance uuid;
  v_email    text := lower(trim(coalesce(p_email,'')));
  v_ext_id   uuid;
  v_type     text;
  v_ref      text;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'invite_worker: not authenticated'; END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invite_worker: a valid email is required'; END IF;
  IF p_scope_refs IS NULL OR array_length(p_scope_refs,1) IS NULL THEN
    RAISE EXCEPTION 'invite_worker: at least one scope must be assigned'; END IF;

  -- Caller must be owner/admin of an org that has this role_key configured.
  SELECT rd.instance_id INTO v_instance FROM role_definitions rd
    WHERE rd.role_key = p_role_key
      AND user_role_in_instance(rd.instance_id) IN ('owner','admin')
    LIMIT 1;
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'invite_worker: no org where you are owner/admin has role %', p_role_key; END IF;

  v_type := CASE p_role_key
              WHEN 'property-manager' THEN 'property-manager'
              WHEN 'project-manager'  THEN 'project-manager'
              ELSE 'worker' END;

  INSERT INTO external_users (instance_id, type, display_name, email,
                              linked_entity_type, linked_entity_id, invite_status,
                              invited_at, invited_by, permissions, created_by)
  VALUES (v_instance, v_type, coalesce(nullif(trim(p_display_name),''), v_email), v_email,
          'contractor', v_instance, 'invited', now(), v_caller,
          ARRAY['threads:participate','items:update'], v_caller)
  ON CONFLICT (instance_id, email, type)
    DO UPDATE SET invite_status='invited', invited_at=now(), invited_by=v_caller
  RETURNING id INTO v_ext_id;

  FOREACH v_ref IN ARRAY p_scope_refs LOOP
    INSERT INTO role_assignments (instance_id, role_key, subject_kind, subject_external_id,
                                  scope_kind, scope_ref, granted_by)
    VALUES (v_instance, p_role_key, 'external', v_ext_id, p_scope_kind, v_ref, v_caller)
    ON CONFLICT (instance_id, role_key, subject_external_id, subject_user_id, scope_kind, scope_ref)
      DO UPDATE SET revoked_at=NULL, revoked_by=NULL, granted_by=v_caller;
  END LOOP;

  -- 1099-PROFILE LINK: tie this worker to a contractor/tax record so their
  -- work (threads, items) and their PAY / year-end 1099 live on ONE profile.
  IF p_link_1099 THEN
    INSERT INTO contractors_1099 (instance_id, created_by, contact_display_name, external_user_id)
    VALUES (v_instance, v_caller, coalesce(nullif(trim(p_display_name),''), v_email), v_ext_id)
    ON CONFLICT DO NOTHING;   -- if a contractor row already exists, Books links it.
  END IF;

  RETURN v_ext_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.invite_worker(text, text, text, text, text[], boolean) TO authenticated;

-- Worker profile: work-scope + pay in ONE place (owner-facing).
CREATE OR REPLACE VIEW public.worker_profile_view AS
  SELECT eu.id AS external_user_id, eu.instance_id, eu.display_name, eu.email, eu.type,
         eu.invite_status,
         c.id AS contractor_id, c.ytd_paid, c.ytd_received,
         (SELECT count(*) FROM role_assignments ra
            WHERE ra.subject_external_id = eu.id AND ra.revoked_at IS NULL) AS active_scopes
  FROM external_users eu
  LEFT JOIN contractors_1099 c ON c.external_user_id = eu.id
  WHERE user_in_instance(eu.instance_id);           -- owner/members of the org only
GRANT SELECT ON public.worker_profile_view TO authenticated;

-- ---------------------------------------------------------------------
-- 8. QUALITATIVE SIGNAL — pipe exchanges into feedback/Quality-Care analytics,
--    privacy-safe + IN-ORG only (owner-facing aggregate; no raw cross-org).
--    The feedback lane reads this; it never crosses the instance boundary.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.org_qualitative_signal AS
  SELECT t.instance_id, t.scope_kind, t.scope_ref, t.kind,
         count(m.id)                                   AS message_count,
         max(m.created_at)                             AS last_activity_at,
         count(*) FILTER (WHERE t.kind='service-request') AS service_threads
  FROM threads t LEFT JOIN thread_messages m ON m.thread_id = t.id
  WHERE user_role_in_instance(t.instance_id) IN ('owner','admin')  -- owner-only, in-org
  GROUP BY t.instance_id, t.scope_kind, t.scope_ref, t.kind;
GRANT SELECT ON public.org_qualitative_signal TO authenticated;

-- ---------------------------------------------------------------------
-- 9. SEED the Poe org's role catalog (example; subscribers seed their own).
-- ---------------------------------------------------------------------
INSERT INTO role_definitions (instance_id, role_key, worker_class, label, scope_kinds, capabilities, read_only, created_by)
SELECT i.id, v.role_key, v.worker_class, v.label, v.scope_kinds, v.caps, v.ro,
       (SELECT user_id FROM instance_members WHERE instance_id = i.id AND role='owner' LIMIT 1)
FROM instances i
CROSS JOIN (VALUES
  ('property-manager','1099-contractor','Property Manager', ARRAY['property'],          ARRAY['threads:participate','items:update'], false),
  ('project-manager', '1099-contractor','Project Manager',  ARRAY['project','board'],   ARRAY['threads:participate','items:update'], false),
  ('learner',         'learner',        'Next-Gen Steward', ARRAY['property','project'],ARRAY['read-only'],                          true)
) AS v(role_key, worker_class, label, scope_kinds, caps, ro)
WHERE i.slug = 'poe-family'
ON CONFLICT (instance_id, role_key) DO NOTHING;

COMMIT;

-- =====================================================================
-- HANDOFF (lanes):
--  * rentals-mgmt (local_9aedb5b8): thread the tenant<->PM conversation through
--    threads/thread_messages with scope_kind='property', scope_ref=rental_id::text.
--    pm_assigned_to_rental() still works (now a wrapper). New unit/notes tables
--    keep USING (subject_assigned_to('property', <rental_id>::text)).
--  * projects/boards (local_99389e0e): Project-Manager scope is scope_kind
--    'project', scope_ref = board_slug. board_tasks policies are in §4b.
--  * adopter-onboarding (local_7d0b6b36): invite_worker() is the general path;
--    subscribers configure role_definitions in THEIR org, then invite.
--  * feedback (local_79771246): read org_qualitative_signal for the in-org,
--    privacy-safe qualitative pipe into Quality-Care (never cross-instance).
-- =====================================================================
