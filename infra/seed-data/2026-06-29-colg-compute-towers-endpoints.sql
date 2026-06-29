-- 2026-06-29 -- Church compute towers: record the TWO towers beside the NovaStar
-- Adds discussion entries to the EXISTING 'Church Local Infrastructure' project
-- (colg-local-infra-2026-06, seeded 2026-06-23) so the two-tower compute node, its
-- physical/logical install, and the role-separation rule are documented + governed
-- in-app, alongside the LED-wall / infra lane.
--
-- HARDWARE IS SME/UNKNOWN: exact GPU/CPU/RAM per tower are TBD (Darrell to provide);
-- NOT assumed to be any specific card. SUPERSEDES the spec-specific seed
-- 2026-06-29-colg-gpu-node-endpoints.sql (which assumed 2x RTX 4070) -- those rows
-- were not applied to cloud; apply THIS one instead.
--
-- Renders at: Projects -> (domain: Church) -> "Church Local Infrastructure" -> Discussions
--
-- SOURCE OF TRUTH for the prose: infra/seed-data/2026-06-29-colg-compute-towers-endpoints.json
-- SETUP RUNBOOK: docs/99-session-notes/2026-06-29-church-compute-towers-setup-runbook.md
--
-- APPLY: run ONCE in Supabase Studio (SQL editor) against the COLG cloud instance.
--   Idempotent: resolves the instance by slug='colg'; ON CONFLICT (instance_id, slug) DO NOTHING.
--   created_by is left NULL (system-seeded doc). The umbrella project (2026-06-23 seed) must exist
--   first; these are additive discussion rows on it.
--   NOT yet applied to cloud as of this commit (this local session cannot reach the cloud Studio).

DO $$
DECLARE
  v_instance uuid;
BEGIN
  SELECT id INTO v_instance FROM instances WHERE slug = 'colg';
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'No instance with slug=colg; seed migration 0012 must be applied first.';
  END IF;

  INSERT INTO discussions
    (id, instance_id, created_by, slug, kind, title, body, project_slugs, visibility, status, links, meta, author_persona, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_instance, NULL, 'dc-colg-towers-inventory', 'reflection',
     'Compute node = TWO tower computers beside the NovaStar (specs SME/TBD)',
     'INVENTORY (recorded 2026-06-29): the church compute node is TWO tower computers physically sitting next to the NovaStar LED-wall processor. The exact GPU / CPU / RAM / PSU in each tower is SME/UNKNOWN - Darrell will provide them; NOT assumed to be any specific card (it is NOT 2x RTX 4070; the 3090s are not purchased). They host the serving endpoints that unlock voice + harvest + sovereign AI. THREE SOVEREIGN SERVING ENDPOINTS, one docker compose (infra/church-gpu-node/docker-compose.yml), headless + restart-on-boot + healthchecked + GPU-reserved (reservation honored when a GPU is present, ignored on a CPU-only tower): (1) Ollama :11434 - local LLMs, model SIZED TO THE TOWER VRAM (runbook section 3 table); (2) voice-studio :8770 - XTTS-v2 few-shot voice clone, POST /speak, needs a CUDA GPU; (3) whisper-gpu :8771 - faster-whisper, POST /transcribe, the harvest no-caption fallback. The runbook section-2 inventory commands DISCOVER the real per-tower specs (GPU+VRAM, CPU, RAM, driver/CUDA, LAN + tailnet IPs); those values fill the device-inventory rows (section 6). Setup: docs/99-session-notes/2026-06-29-church-compute-towers-setup-runbook.md.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0012"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-towers-install-physical', 'decision',
     'Physical/logical install of the two towers: airflow, own power, wired+fixed IPs, UPS',
     'BEST WAY: install the two towers beside the NovaStar without compromising the wall feed or the towers. PLACEMENT: do not block the NovaStar or either tower airflow; vented shelf/rack, OFF the floor, >=4 in intake/exhaust clearance; towers side-by-side (not stacked exhaust-into-intake); out of the cable/service path. POWER: each tower ~500-850 W under load (real PSU watts TBD) on its OWN dedicated circuit/PDU - NOT the NovaStar strip and NOT the LED-wall circuits (the wall is ~4800 W peak on its own feeds). One dedicated 20 A carries both towers (2x850 W=1700 W=14.2 A < 1920 W cap) OR one 15 A per tower; never both towers on one 15 A. UPS on the NovaStar AND the towers (protect the processor + the compute that carries state; stagger power-on, do not ride the wall inrush). NETWORK: Cat6 to the church switch, NOT WiFi; static/reserved IPs (DHCP reservation by MAC or static); Tailscale on each tower for the home<->church mesh; record each tower LAN IPv4 + tailnet IP. WE CHOSE own-circuit + UPS + wired-fixed-IP + vented-off-floor, NOT shared-strip and NOT WiFi, BECAUSE an AI load spike must never drop or stutter the live wall, a serving node needs a stable wired address, and the processor + compute are what must survive a blip.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0012"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-towers-role-separation', 'decision',
     'Role separation: live-media tower stays separate from AI compute; AI off service hours',
     'BEST WAY: the live-media box that feeds the NovaStar -> wall stays SEPARATE from the AI-compute work. The machine rendering the wall during a service must not run model inference at the same time (they contend for GPU/CPU; a wall stutter is unacceptable). DEFAULT MAPPING (confirm once roles assigned): one tower = the live-media source into the VX1000, the other = the headless AI worker for heavy jobs (transcription backfill, batch voice synth, LLM). Towers run heavy AI jobs OFF service hours; Sunday/Wednesday service windows are a hard no for AI grind on any tower that touches the wall. If a tower MUST dual-purpose, its AI work is scheduled to NEVER overlap service times - the idle-GPU / off-hours scheduler enforces the window. WE CHOSE separate-roles + off-service-windowing, NOT one-machine-does-everything-anytime, BECAUSE live/creative production has absolute priority and AI yields (DR-0012 principle generalized from one shared card to the two-tower node).',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0012"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-towers-unlocks', 'directive',
     'What the towers unlock: voice clone, harvest transcription, sovereign LLM (spec-gated)',
     'WHY THIS MATTERS: the two-tower node is the single dependency under three gated capabilities. (1) VOICE CLONE - XTTS-v2 on :8770 makes Darrell-hears-Darrell real (in-app recorded sample -> his own voice, same Voice-tab UI, labeled stand-in fallback). Needs a CUDA GPU on the worker tower - feasibility is SPEC-GATED. (2) HARVEST TRANSCRIPTION - faster-whisper on :8771 transcribes the rare caption-less service video locally (fast on GPU, batch on CPU), feeding the content-engine recordings->lessons spine. (3) SOVEREIGN LLM - Ollama on :11434 gives the AI tiers a local model sized to the tower VRAM, so Talk-about / tutors / finalizer run fast + private on our hardware. NEEDS DARRELL EXACT SPECS to finalize: per-tower GPU+VRAM (which model fits / is voice-clone feasible), whether either tower has a CUDA GPU, PSU watts (circuit sizing), church subnet (static IPs), role assignment, CPU/RAM/disk (device inventory). Consent + faithfulness gates unchanged. WE CHOSE one-node-three-unlocks tied into the existing app seams, NOT three separate stacks, BECAUSE it is the same hardware serving the same app the same sovereign way - one place to stand up, govern, and brake.',
     '["colg-local-infra-2026-06","content-engine-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0076"}'::jsonb, '{}'::jsonb, 'darrell', now(), now())
  ON CONFLICT (instance_id, slug) DO NOTHING;
END $$;
