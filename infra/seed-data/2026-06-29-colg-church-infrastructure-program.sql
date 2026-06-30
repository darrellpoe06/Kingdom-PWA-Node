-- 2026-06-29 -- Church Infrastructure Program: in-app program + 7 milestone records
-- Materializes the church HARDWARE/COMPUTE infrastructure work as ONE in-app
-- program (one projects row, domain=church) with seven discussion records (the
-- milestones), using the institutional-memory / Events-as-data model. Renders at:
--   Projects -> (domain: Church) -> "Church Infrastructure Program" -> Discussions driving this
--   Projects -> Discussions (filtered to the project)
--
-- SOURCE OF TRUTH for the prose: infra/seed-data/2026-06-29-colg-church-infrastructure-program.json
-- DEVICE REGISTER (item 4): docs/99-session-notes/2026-06-29-colg-church-device-asset-register.md
-- UMBRELLA SURVEY: docs/99-session-notes/2026-06-09-research-review-colg-9k-church-build.md
--
-- ROLE-SCOPED / NO LEAK: instance=colg, discussions RLS scopes every row to the
-- COLG instance + owner/admin/member roles (no anon policy; see 0035-discussions).
-- This is NOT public seed.
--
-- APPLY: run ONCE in Supabase Studio (SQL editor) against the COLG cloud instance.
--   Idempotent: resolves the instance by slug='colg' (the proven pattern from
--   migration 0013-colg-sermon-backfill.sql); ON CONFLICT (instance_id, slug) DO NOTHING.
--   created_by is left NULL (system-seeded record). If projects.created_by /
--   discussions.created_by is NOT NULL in your schema, set a COLG owner/admin uuid
--   and swap the NULLs.
--   NOT yet applied to cloud as of this commit (this session cannot reach the cloud Studio).

DO $$
DECLARE
  v_instance uuid;
BEGIN
  SELECT id INTO v_instance FROM instances WHERE slug = 'colg';
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'No instance with slug=colg; seed migration 0012 must be applied first.';
  END IF;

  -- 1) The program project ---------------------------------------------------
  INSERT INTO projects (id, instance_id, created_by, slug, title, status, domain, description, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_instance, NULL,
    'colg-church-infra-program-2026-06',
    'Church Infrastructure Program',
    'active', 'church',
    'COLG sovereign hardware + compute infrastructure program. Umbrella for the physical/compute build at the church: the sanctuary LED video wall, the two CUDA towers next to the NovaStar (livestream-primary, AI on idle only), idle-GPU opportunistic scheduling behind the Cage brakes, the unified church device asset register, the two-NAS mesh (church + home) with a capability-routed job router and local-coder workers, and a staff/volunteer Learn course on the data systems. Hardware sibling of Church Local Infrastructure (colg-local-infra-2026-06), the content/study-to-course pipeline that runs ON this hardware. Survey: docs/99-session-notes/2026-06-09-research-review-colg-9k-church-build.md',
    now(), now()
  )
  ON CONFLICT (instance_id, slug) DO NOTHING;

  -- 2) The seven milestone records (discussions) -----------------------------
  INSERT INTO discussions
    (id, instance_id, created_by, slug, kind, title, body, project_slugs, visibility, status, links, meta, author_persona, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-led-video-wall', 'decision',
     'LED video wall capital project + install/power/data runbook',
     'The sanctuary altar LED video wall is a capital project with a confirmed-spec on-site install/power/data runbook, on main (PR #407): confirmed from datasheets in lib/video-wall-spec.js (pure single source of truth, 23 proven-to-catch tests; P1.99mm, 16:9, ~2560x1440). Signal path is HDMI/DVI into a NovaStar VX1000 processor (not NDI-direct). The capital-FINANCE side (pledged/received) is tracked separately in the gated church_capital_projects table (migration 0030, owner/admin RLS); this record is the BUILD/install side. WE CHOSE a NovaStar-processor HDMI/DVI path, NOT NDI-direct to the wall, BECAUSE the wall hardware ingests a processor feed.',
     '["colg-church-infra-program-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{"verify_status":"CONFIRMED","item_no":1}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-cuda-towers', 'decision',
     'Two CUDA towers next to the NovaStar (livestream-primary, AI-idle-only)',
     'Two CUDA towers sit next to the NovaStar: each is the SAME box that runs OBS / ProPresenter for the live stream. POSTURE (binding): livestream-primary, AI on idle only - AI inference is preempted during Sunday / Wednesday services so NVENC and the LLM never contend for VRAM. WE CHOSE reuse-the-stream-boxes-on-idle, NOT a dedicated always-on AI box, BECAUSE it is sovereign and free of new hardware while the stream stays first-class. Setup runbook + serving stack are on main (PR #405/#409); the in-app endpoint records seed is infra/seed-data/2026-06-29-colg-compute-towers-endpoints.json. SME-PENDING: the actual per-box GPU/CPU/RAM specs were re-scoped to TBD (NOT assumed 4070) and are not yet supplied by Darrell - not fabricated here.',
     '["colg-church-infra-program-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{"verify_status":"PARTIAL","item_no":2,"sme_pending":true}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-idle-gpu-scheduling', 'decision',
     'Idle-GPU opportunistic scheduling (service-window lock, live-detection, checkpoint/resume, Cage brakes)',
     'AI work runs on the towers ONLY when they are idle of livestream duty. The deterministic scheduler is BUILT and on main (PR #413, app/src/lib/gpu-scheduler.js + infra/gpu-scheduler/), shipped INERT (do-not-arm). MECHANICS: a service-window lock (stop AI during Sunday / Wednesday services), live-detection, and checkpoint/resume so a preempted job resumes rather than restarts. BRAKES (binding): all three Cage brakes - budget ceiling, single-flight concurrency lock, kill-switch - BEFORE any scheduler entry is enabled (the 2026-06-06 runaway lesson; three-brakes rule). WE CHOSE preempt-on-service + checkpoint/resume behind the Cage, NOT best-effort always-on inference, BECAUSE the live stream is first-class and unattended automation never ships without the three brakes. Arming is reserved for Darrell.',
     '["colg-church-infra-program-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{"verify_status":"PARTIAL","item_no":3}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-device-asset-register', 'directive',
     'Church device inventory / asset register',
     'ONE unified register of every church device: the two CUDA towers, the church NAS, the NovaStar VX1000, the LED wall, network gear, cameras, and the sound board. The PRIMARY in-app register is BUILT and on main (PR #413): a Church > Devices surface (DeviceInventory.jsx, Registry + Compute Pool tabs) over the church_devices table (migration 0056, staff-scoped RLS), with lib/church-devices.js feeding the capability router; narrative companion is docs/99-session-notes/2026-06-29-colg-church-device-asset-register.md. GROUNDING RULE: records only what is grounded in a repo doc or verified inventory; uninventoried items are marked SME-PENDING with no fabricated value (DR-0076). CONFIRMED today: two compute towers (specs TBD per PR #409), NovaStar VX1000, NAS ~100 TB capacity. SME-PENDING: per-box specs, network gear, cameras, sound board make/model.',
     '["colg-church-infra-program-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{"verify_status":"CONFIRMED","item_no":4,"sme_pending":true}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-two-nas-mesh', 'decision',
     'Two-NAS mesh (church + home): replication + capability-routed job router + local-coder workers',
     'The church NAS and the home NAS form ONE sovereign mesh over a single Tailscale tailnet: replication for coherence, a capability-routed job router (pick a worker by declared capability behind the brakes - GPU jobs to church-cuda, etc.), and local-coder workers (Aider + Ollama on the towers) as a future capability. A committed node manifest (infra/ai-orchestrator/mesh/nodes.json) declares each node once. WE CHOSE capability-routed federation over a single tailnet, NOT a flat cron fan-out and NOT cloud orchestration, BECAUSE it is sovereign, low-latency on-LAN, and routes each job to the node that can actually run it. STATUS: the mesh research review + node manifest are on main (PR #406); the in-app mesh records seed is infra/seed-data/2026-06-29-sovereign-mesh-two-nas.json (project sovereign-mesh-2026-06, poe-family scope since it spans home + church).',
     '["colg-church-infra-program-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{"verify_status":"PARTIAL","item_no":5,"sme_pending":true}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-staff-learn-course', 'directive',
     'Staff/volunteer Learn course: PoeTech Data Systems & Infrastructure',
     'The staff/volunteer Learn course PoeTech Data Systems & Infrastructure is authored and on main (PR #410): a Word-first, self-paced onboarding + operating course in Church > Learn, riding the SAME shared Learn engine as the other courses (meta.unit=Module, no cohort clock) and sourced from the live in-app HELP registry so it stays in sync with the app. It teaches what the towers / NAS / wall do and how to operate the stream + the app cockpit. WE CHOSE a self-paced course on the shared Learn engine, NOT a bespoke training app, BECAUSE it reuses the proven lesson/quiz/retention machinery and stays maintainable. Module: app/src/lib/datasystems-course.js.',
     '["colg-church-infra-program-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{"verify_status":"CONFIRMED","item_no":6}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-program-record', 'decision',
     'Church infrastructure program record (this program)',
     'This program record itself: Church Infrastructure Program is the single in-app frame that holds items 1-6 as milestones, role-scoped to the COLG instance (no public seed). It is the HARDWARE/compute sibling of Church Local Infrastructure (colg-local-infra-2026-06, the content/study-to-course pipeline) and the Content Engine (content-engine-2026-06). Together they cover: the boxes (this program), the pipeline that runs on them, and the content the pipeline produces. WE CHOSE a dedicated hardware program cross-linked to the existing content program, NOT folding hardware into the content project, BECAUSE the two are distinct workstreams with distinct owners and milestones even though they share the same physical infrastructure.',
     '["colg-church-infra-program-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{"verify_status":"CONFIRMED","item_no":7}'::jsonb, 'darrell', now(), now())
  ON CONFLICT (instance_id, slug) DO NOTHING;
END $$;
