-- =====================================================================
-- PROVEN-TO-CATCH leak test for the general role framework + tiered threads.
-- Apply role-framework-and-threads.sql FIRST, then:
--   psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f role-framework-leak-test.sql
-- "ALL ROLE-FRAMEWORK ISOLATION CHECKS PASSED" + exit 0 = pass. Any RAISE = fail.
--
-- Covers MULTIPLE role variants and ALL tiers in one run:
--   owner (all-in-org) · PM-property (assigned units) · PM-project (assigned
--   boards) · tenant/customer (own thread only) · learner/minor (curated,
--   read-only) · outbound-approval guardrail · CROSS-ORG isolation (no leak).
--
-- NOT run by Claude (no-fake-green): needs the migration applied to a DB and
-- real sessions. This file is the runnable proof; running it is the owner's step.
--
-- PROVEN-TO-CATCH — what makes each check FAIL if the model regresses:
--   * PM-property sees a project thread  -> TIER bug (can_see_thread too broad).
--   * tenant sees a second thread        -> participant tier leak.
--   * any worker/learner sees accounts   -> fail-OPEN membership leak.
--   * learner view exposes a $ column    -> curation leak.
--   * sms message inserts as 'sent'      -> outbound guardrail bypass.
--   * cross-org identity sees org A rows  -> tenant-boundary leak.
-- =====================================================================

BEGIN;

\set iA '''aaaa0000-0000-0000-0000-00000000000a'''
\set iB '''bbbb0000-0000-0000-0000-00000000000b'''
\set uOwnerA '''1111aaaa-0000-0000-0000-00000000a001'''
\set uOwnerB '''2222bbbb-0000-0000-0000-00000000b001'''
\set uPMprop '''3333cccc-0000-0000-0000-0000000pm001'''
\set uPMproj '''4444dddd-0000-0000-0000-0000000pm002'''
\set uTenant '''5555eeee-0000-0000-0000-0000000tn001'''
\set uChild  '''6666ffff-0000-0000-0000-0000000ch001'''
\set xPMprop '''7777aaaa-0000-0000-0000-000000ext001'''
\set xPMproj '''8888bbbb-0000-0000-0000-000000ext002'''
\set xTenant '''9999cccc-0000-0000-0000-000000ext003'''
\set rA1 '''aa11aa11-0000-0000-0000-00000000rA01'''
\set rA2 '''aa22aa22-0000-0000-0000-00000000rA02'''
\set rB1 '''bb11bb11-0000-0000-0000-00000000rB01'''
\set tT1 '''cc11cc11-0000-0000-0000-0000000thr01'''
\set tT2 '''cc22cc22-0000-0000-0000-0000000thr02'''

-- ---- auth.users (columns can vary by Supabase version; adapt if needed) ----
INSERT INTO auth.users (id, email, aud, role) VALUES
  (:uOwnerA,'ownerA@ex.com','authenticated','authenticated'),
  (:uOwnerB,'ownerB@ex.com','authenticated','authenticated'),
  (:uPMprop,'pmprop@ex.com','authenticated','authenticated'),
  (:uPMproj,'pmproj@ex.com','authenticated','authenticated'),
  (:uTenant,'tenant@ex.com','authenticated','authenticated'),
  (:uChild, 'child@ex.com', 'authenticated','authenticated')
ON CONFLICT (id) DO NOTHING;

-- ---- two isolated orgs ----
INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  (:iA,'leak-org-a','Org A','landlord'), (:iB,'leak-org-b','Org B','landlord')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  (:iA,:uOwnerA,'owner','Owner A'), (:iB,:uOwnerB,'owner','Owner B')
ON CONFLICT DO NOTHING;

-- ---- role catalog for both orgs (subscribers configure their own) ----
INSERT INTO role_definitions (instance_id, role_key, worker_class, label, scope_kinds, capabilities, read_only, created_by) VALUES
  (:iA,'property-manager','1099-contractor','Property Manager',ARRAY['property'],ARRAY['threads:participate'],false,:uOwnerA),
  (:iA,'project-manager','1099-contractor','Project Manager',ARRAY['project'],ARRAY['threads:participate'],false,:uOwnerA),
  (:iA,'learner','learner','Next-Gen Steward',ARRAY['property','project'],ARRAY['read-only'],true,:uOwnerA),
  (:iB,'property-manager','1099-contractor','Property Manager',ARRAY['property'],ARRAY['threads:participate'],false,:uOwnerB)
ON CONFLICT DO NOTHING;

-- ---- rentals + a finance row + boards ----
INSERT INTO rentals (id, instance_id, created_by, address, display_name, property_type, purchase_price, status) VALUES
  (:rA1,:iA,:uOwnerA,'1 A St','A1 assigned','single-family',250000,'occupied'),
  (:rA2,:iA,:uOwnerA,'2 A St','A2 unassigned','single-family',260000,'occupied'),
  (:rB1,:iB,:uOwnerB,'9 B St','B1 other org','single-family',999999,'occupied')
ON CONFLICT (id) DO NOTHING;
INSERT INTO accounts (id, instance_id, created_by, name, type, balance)
  VALUES (gen_random_uuid(), :iA, :uOwnerA, 'Org A Ops','checking',50000) ON CONFLICT DO NOTHING;
INSERT INTO board_tasks (id, instance_id, created_by, slug, board_slug, board_title, title) VALUES
  (gen_random_uuid(),:iA,:uOwnerA,'bt-x1','proj-x','Project X','X item assigned'),
  (gen_random_uuid(),:iA,:uOwnerA,'bt-y1','proj-y','Project Y','Y item unassigned')
ON CONFLICT DO NOTHING;

-- ---- external subjects (1099 workers + a tenant) ----
INSERT INTO external_users (id, instance_id, type, display_name, email, linked_entity_type, linked_entity_id, invite_status, invited_by, created_by) VALUES
  (:xPMprop,:iA,'property-manager','PM Prop','pmprop@ex.com','contractor',:iA,'accepted',:uOwnerA,:uOwnerA),
  (:xPMproj,:iA,'project-manager','PM Proj','pmproj@ex.com','contractor',:iA,'accepted',:uOwnerA,:uOwnerA),
  (:xTenant,:iA,'renter','Tenant','tenant@ex.com','renter',:iA,'accepted',:uOwnerA,:uOwnerA)
ON CONFLICT (id) DO NOTHING;

-- ---- assignments: PMprop -> rA1 only; PMproj -> proj-x only; learner child -> rA1 (curated) ----
INSERT INTO role_assignments (instance_id, role_key, subject_kind, subject_external_id, scope_kind, scope_ref, granted_by) VALUES
  (:iA,'property-manager','external',:xPMprop,'property',:rA1,:uOwnerA),
  (:iA,'project-manager','external',:xPMproj,'project','proj-x',:uOwnerA)
ON CONFLICT DO NOTHING;
INSERT INTO role_assignments (instance_id, role_key, subject_kind, subject_user_id, scope_kind, scope_ref, guardian_user_id, granted_by) VALUES
  (:iA,'learner','member',:uChild,'property',:rA1,:uOwnerA,:uOwnerA)
ON CONFLICT DO NOTHING;

-- ---- threads: T1 property(rA1) with tenant participant; T2 project(proj-x) ----
INSERT INTO threads (id, instance_id, scope_kind, scope_ref, subject, kind, created_by_member) VALUES
  (:tT1,:iA,'property',:rA1,'Leak under sink','service-request',:uOwnerA),
  (:tT2,:iA,'project','proj-x','X planning','discussion',:uOwnerA)
ON CONFLICT (id) DO NOTHING;
INSERT INTO thread_participants (thread_id, instance_id, participant_kind, participant_external_id, added_by)
  VALUES (:tT1,:iA,'external',:xTenant,:uOwnerA) ON CONFLICT DO NOTHING;
INSERT INTO thread_messages (thread_id, instance_id, author_kind, author_user_id, body) VALUES
  (:tT1,:iA,'member',:uOwnerA,'owner note on T1'),
  (:tT2,:iA,'member',:uOwnerA,'owner note on T2')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- TIER 1 — OWNER A: sees ALL in-org, nothing cross-org.
-- =====================================================================
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',:uOwnerA)::text, true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM threads;  -- T1 + T2, not org B
  IF n<>2 THEN RAISE EXCEPTION 'OWNER FAIL: should see 2 org-A threads, saw %', n; END IF;
  SELECT count(*) INTO n FROM worker_profile_view;  -- sees its workers
  IF n<3 THEN RAISE EXCEPTION 'OWNER FAIL: worker_profile_view too small (%).', n; END IF;
  SELECT count(*) INTO n FROM org_qualitative_signal;  -- the qualitative pipe (in-org)
  IF n<1 THEN RAISE EXCEPTION 'OWNER FAIL: qualitative signal empty'; END IF;
  RAISE NOTICE 'Owner A: all-in-org OK.';
END $$; RESET ROLE;

-- =====================================================================
-- TIER 2a — PM-PROPERTY: assigned unit + its thread ONLY; no project, no finance.
-- =====================================================================
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',:uPMprop,'external_user_id',:xPMprop)::text, true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM pm_property_view;
  IF n<>1 THEN RAISE EXCEPTION 'PMprop FAIL: should see 1 unit, saw %', n; END IF;
  IF EXISTS (SELECT 1 FROM pm_property_view WHERE display_name='A2 unassigned') THEN
    RAISE EXCEPTION 'PMprop FAIL: saw an unassigned unit'; END IF;
  SELECT count(*) INTO n FROM threads;  -- only T1 (property scope), NOT T2 (project)
  IF n<>1 THEN RAISE EXCEPTION 'PMprop FAIL: should see 1 thread (T1), saw %', n; END IF;
  IF EXISTS (SELECT 1 FROM threads WHERE scope_kind='project') THEN
    RAISE EXCEPTION 'PMprop FAIL: saw a PROJECT thread (tier bug)'; END IF;
  SELECT count(*) INTO n FROM accounts;      IF n<>0 THEN RAISE EXCEPTION 'PMprop FAIL: saw % accounts', n; END IF;
  SELECT count(*) INTO n FROM board_tasks;   IF n<>0 THEN RAISE EXCEPTION 'PMprop FAIL: saw % board_tasks', n; END IF;
  SELECT count(*) INTO n FROM rentals;       IF n<>0 THEN RAISE EXCEPTION 'PMprop FAIL: read base rentals', n; END IF;
  RAISE NOTICE 'PM-property: scoped OK.';
END $$; RESET ROLE;

-- =====================================================================
-- TIER 2b — PM-PROJECT: assigned board + its thread ONLY; no property, no finance.
-- =====================================================================
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',:uPMproj,'external_user_id',:xPMproj)::text, true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM board_tasks;  -- only proj-x items
  IF n<>1 THEN RAISE EXCEPTION 'PMproj FAIL: should see 1 board item, saw %', n; END IF;
  IF EXISTS (SELECT 1 FROM board_tasks WHERE board_slug='proj-y') THEN
    RAISE EXCEPTION 'PMproj FAIL: saw an unassigned board'; END IF;
  SELECT count(*) INTO n FROM threads;  -- only T2 (project proj-x), NOT T1
  IF n<>1 THEN RAISE EXCEPTION 'PMproj FAIL: should see 1 thread (T2), saw %', n; END IF;
  IF EXISTS (SELECT 1 FROM threads WHERE scope_kind='property') THEN
    RAISE EXCEPTION 'PMproj FAIL: saw a PROPERTY thread (tier bug)'; END IF;
  SELECT count(*) INTO n FROM pm_property_view; IF n<>0 THEN RAISE EXCEPTION 'PMproj FAIL: saw property units', n; END IF;
  SELECT count(*) INTO n FROM accounts;         IF n<>0 THEN RAISE EXCEPTION 'PMproj FAIL: saw accounts', n; END IF;
  RAISE NOTICE 'PM-project: scoped OK.';
END $$; RESET ROLE;

-- =====================================================================
-- TIER 3 — TENANT/CUSTOMER: only their OWN thread; nothing else.
-- =====================================================================
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',:uTenant,'external_user_id',:xTenant)::text, true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM threads;  -- only T1 (participant), NOT T2
  IF n<>1 THEN RAISE EXCEPTION 'TENANT FAIL: should see 1 own thread, saw %', n; END IF;
  IF EXISTS (SELECT 1 FROM threads WHERE id = :'tT2') THEN
    RAISE EXCEPTION 'TENANT FAIL: saw a thread they do not participate in'; END IF;
  SELECT count(*) INTO n FROM accounts;  IF n<>0 THEN RAISE EXCEPTION 'TENANT FAIL: saw accounts', n; END IF;
  SELECT count(*) INTO n FROM rentals;   IF n<>0 THEN RAISE EXCEPTION 'TENANT FAIL: saw rentals', n; END IF;
  RAISE NOTICE 'Tenant: own-thread-only OK.';
END $$; RESET ROLE;

-- =====================================================================
-- LEARNER / MINOR — curated read-only; NO financial column; nothing raw.
-- =====================================================================
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',:uChild)::text, true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM learner_property_view;  -- curated rA1 only
  IF n<>1 THEN RAISE EXCEPTION 'LEARNER FAIL: should see 1 curated unit, saw %', n; END IF;
  BEGIN
    EXECUTE 'SELECT purchase_price FROM learner_property_view LIMIT 1';
    RAISE EXCEPTION 'LEARNER FAIL: curated view exposed a financial column';
  EXCEPTION WHEN undefined_column THEN NULL; END;
  SELECT count(*) INTO n FROM accounts;     IF n<>0 THEN RAISE EXCEPTION 'LEARNER FAIL: minor saw accounts!', n; END IF;
  SELECT count(*) INTO n FROM pm_property_view; IF n<>0 THEN RAISE EXCEPTION 'LEARNER FAIL: minor saw full PM view', n; END IF;
  RAISE NOTICE 'Learner/minor: curated read-only OK.';
END $$; RESET ROLE;

-- =====================================================================
-- OUTBOUND GUARDRAIL — sms/email cannot auto-send; must be pending-approval.
-- =====================================================================
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',:uPMprop,'external_user_id',:xPMprop)::text, true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  -- in-app to a registered user: direct send OK.
  INSERT INTO thread_messages (thread_id, instance_id, author_kind, author_external_id, body, channel, delivery_status)
    VALUES (:'tT1', :'iA', 'external', :'xPMprop', 'in-app ok', 'in-app', 'sent');
  -- outbound sms marked 'sent' MUST be rejected (never auto-send).
  BEGIN
    INSERT INTO thread_messages (thread_id, instance_id, author_kind, author_external_id, body, channel, delivery_status)
      VALUES (:'tT1', :'iA', 'external', :'xPMprop', 'sneaky auto sms', 'sms', 'sent');
    RAISE EXCEPTION 'OUTBOUND FAIL: sms auto-sent without approval!';
  EXCEPTION WHEN check_violation OR insufficient_privilege THEN NULL; END;
  -- outbound sms as pending-approval is allowed (awaits human approval).
  INSERT INTO thread_messages (thread_id, instance_id, author_kind, author_external_id, body, channel, delivery_status)
    VALUES (:'tT1', :'iA', 'external', :'xPMprop', 'sms pending', 'sms', 'pending-approval');
  RAISE NOTICE 'Outbound guardrail: enforced OK.';
END $$; RESET ROLE;

-- =====================================================================
-- CROSS-ORG — Owner B sees org B only, ZERO of org A (the no-leak wall).
-- =====================================================================
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',:uOwnerB)::text, true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM threads;      IF n<>0 THEN RAISE EXCEPTION 'CROSS-ORG FAIL: Owner B saw % org-A threads', n; END IF;
  SELECT count(*) INTO n FROM role_assignments; IF n<>0 THEN RAISE EXCEPTION 'CROSS-ORG FAIL: Owner B saw org-A assignments', n; END IF;
  SELECT count(*) INTO n FROM rentals WHERE display_name LIKE 'A%'; IF n<>0 THEN RAISE EXCEPTION 'CROSS-ORG FAIL: Owner B saw org-A rentals', n; END IF;
  SELECT count(*) INTO n FROM worker_profile_view; IF n<>0 THEN RAISE EXCEPTION 'CROSS-ORG FAIL: Owner B saw org-A workers', n; END IF;
  RAISE NOTICE 'Cross-org: Owner B isolated OK.';
END $$; RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL ROLE-FRAMEWORK ISOLATION CHECKS PASSED'; END $$;
ROLLBACK;
