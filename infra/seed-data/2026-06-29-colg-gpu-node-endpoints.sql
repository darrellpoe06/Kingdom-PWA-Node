-- 2026-06-29 -- Church GPU node: record the 2x RTX 4070 + three serving endpoints
-- Adds discussion entries to the EXISTING 'Church Local Infrastructure' project
-- (colg-local-infra-2026-06, seeded 2026-06-23) so the GPU node is documented and
-- governed in-app, alongside the LED-wall / infra lane.
--
-- Renders at: Projects -> (domain: Church) -> "Church Local Infrastructure" -> Discussions
--
-- SOURCE OF TRUTH for the prose: infra/seed-data/2026-06-29-colg-gpu-node-endpoints.json
-- SETUP RUNBOOK: docs/99-session-notes/2026-06-29-church-4070-gpu-node-setup-runbook.md
--
-- APPLY: run ONCE in Supabase Studio (SQL editor) against the COLG cloud instance.
--   Idempotent: resolves the instance by slug='colg'; ON CONFLICT (instance_id, slug) DO NOTHING.
--   created_by is left NULL (system-seeded doc). If discussions.created_by is NOT NULL in your
--   schema, set it to a COLG owner/admin uuid. The umbrella project (2026-06-23 seed) must exist
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
    (gen_random_uuid(), v_instance, NULL, 'dc-colg-gpu-node-inventory', 'reflection',
     'GPU node inventory: church 2x RTX 4070, three serving endpoints',
     'INVENTORY (recorded 2026-06-29): the church has 2x RTX 4070 machines (~12 GB VRAM each), the same boxes that run OBS / ProPresenter. They host the GPU node that unlocks voice + harvest + sovereign AI. THREE SOVEREIGN SERVING ENDPOINTS, one docker compose (infra/church-gpu-node/docker-compose.yml), headless + restart-on-boot + healthchecked + GPU-reserved: (1) Ollama :11434 - local LLMs, qwen2.5:14b-instruct-q4_K_M fits 12 GB at Q4 (DR-0012); (2) voice-studio :8770 - XTTS-v2 few-shot voice clone, POST /speak, the destination of the bridge-to-sovereign voice plan; (3) whisper-gpu :8771 - faster-whisper large-v3-turbo, POST /transcribe, the harvest no-caption fallback. EXACT per-box facts (OS build, driver/CUDA version, free VRAM, LAN IPv4, Tailscale IP) are captured by the runbook section-1 inventory commands at standup - PENDING the on-site run; not fabricated here. Setup: docs/99-session-notes/2026-06-29-church-4070-gpu-node-setup-runbook.md.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0012"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-gpu-node-standup-decision', 'decision',
     'Stand up the GPU endpoints in Docker, headless + sovereign, app points at them',
     'BEST WAY: serve the three endpoints from ONE docker compose on a church 4070 (restart: always = survives reboot no-login; healthcheck per service; nvidia GPU reservation). The app/NAS POINT AT them through seams that already exist - voice via VITE_VOICE_SERVICE_URL -> {base}/speak (voice-service.js); LLM via the NAS n8n OLLAMA_BASE_URL pointed at the box (talk-about / class-tutor workflows); harvest via the whisper :8771 endpoint, with the existing CPU pipeline unchanged as fallback. SOVEREIGNTY: bind LAN / Tailscale only, never the public internet - access control is the network. BRAKES: the endpoints are passive (serve-then-stop), so they need no brakes themselves; any autonomous caller (harvest backfill, continuous ingestion) keeps budget + single-flight lock + kill-switch and ships inactive (Tier C, 2026-06-06 lesson). DR-0012 service-time preemption: stop Ollama during Sunday/Wednesday live services on a box that also encodes the stream - creative/live has absolute GPU priority. WE CHOSE containerized-headless-endpoints-the-app-points-at, NOT bespoke scripts and NOT a public API and NOT removing brakes because CUDA is fast, BECAUSE the app is the primary artifact (a click today is an API call tomorrow), everything stays on our hardware, and speed never buys permission to remove a brake.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0012"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-gpu-node-unlocks', 'directive',
     'What the GPU node unlocks: voice clone, harvest transcription, sovereign LLM',
     'WHY THIS MATTERS: the 4070 node is the single dependency under three gated capabilities. (1) VOICE CLONE - XTTS-v2 on :8770 makes Darrell-hears-Darrell real: the in-app recorded sample (consent gesture) becomes spoken text in his own voice, same Voice-tab UI, falling back to the labeled stand-in on any error (never silent, the AI-generated label always stays). Retires the Replicate bridge stopgap -> zero per-call cost, nothing leaves the network. (2) HARVEST TRANSCRIPTION - faster-whisper on :8771 transcribes the rare caption-less service video locally in under a minute (vs >10 min CPU), feeding the content engine recordings->lessons spine (P2/P7) without sending media anywhere. (3) SOVEREIGN LLM - Ollama on :11434 gives the deterministic-first / AI-needed tiers a fast local model on our hardware, so Talk-about / tutors / finalizer run grounded and private instead of honest-offline. CONSENT + faithfulness gates are unchanged: voice only reads text he chooses (never words in his mouth); transcripts pass the scripture faithfulness gate; nothing publishes without the human review gate. WE CHOSE one-node-three-unlocks tied into the existing seams, NOT three separate stacks, BECAUSE it is the same hardware serving the same app the same sovereign way - one place to stand up, govern, and brake.',
     '["colg-local-infra-2026-06","content-engine-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0076"}'::jsonb, '{}'::jsonb, 'darrell', now(), now())
  ON CONFLICT (instance_id, slug) DO NOTHING;
END $$;
