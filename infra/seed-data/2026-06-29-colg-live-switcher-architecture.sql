-- 2026-06-29 -- Church live-production switcher architecture (PROPOSED)
-- Adds discussion entries to the EXISTING 'Church Local Infrastructure' project
-- (colg-local-infra-2026-06, seeded 2026-06-23) so the switcher decision, the
-- NDI->ATEM bridge outage, the reframe, and the recommended hybrid are documented
-- + governed in-app, alongside the LED-wall / compute-towers / infra lane.
--
-- PROPOSED, pending Darrell's confirmation -- NOT final. Decision record: DR-0082.
-- Renders at: Projects -> (domain: Church) -> "Church Local Infrastructure" -> Discussions.
-- Gated: visibility 'shared' (family scope), NOT a public seed.
--
-- SOURCE OF TRUTH for the prose: infra/seed-data/2026-06-29-colg-live-switcher-architecture.json
-- RESEARCH-REVIEW: docs/99-session-notes/2026-06-29-church-live-production-switcher-architecture.md
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
    (gen_random_uuid(), v_instance, NULL, 'dc-colg-switcher-incident-ndi-bridge', 'reflection',
     'NDI->HDMI->ATEM bridge outage - the live camera switch is down (root cause)',
     'INCIDENT (2026-06-29): the live camera switch into the ATEM is down. SIGNAL CHAIN as recorded: 3x PTZOptics 4K cameras output SDI AND NDI simultaneously; 1x Blackmagic camera is SDI-only; the right CUDA tower runs OBS for the online broadcast and pulls camera NDI fine; the presentation tower publishes graphics as NDI; the NovaStar VX1000 drives the LED wall. The left Lenovo Legion was bridging camera NDI -> HDMI into the ATEM Production Studio 4K (the ATEM has no native NDI input). ROOT CAUSE: the cameras already reach OBS over NDI - the ONLY job of the Lenovo Legion was the NDI -> HDMI conversion so the ATEM could see a camera. When that PC/bridge fell over, the ATEM lost its source: a single fragile software hop became the single point of failure for the hardware switcher. This is the PC/OS-reliability failure class the architecture decision weighs. VERIFY-NOT-CLAIM (DR-0076): exact ATEM model/input map, the VX1000 program wiring, and whether the wall shows IMAG are TO CONFIRM. Full trace: docs/99-session-notes/2026-06-29-church-live-production-switcher-architecture.md.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0082"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-switcher-decision-obs-vs-atem', 'decision',
     'OBS-as-switcher vs keep-the-ATEM - evenhanded (PROPOSED)',
     'DECISION (PROPOSED, pending Darrell confirmation - NOT final). OBS-AS-SWITCHER (all-NDI software): PROS = graphics/scene flexibility, cost-free (already running for the broadcast), sovereign (owned towers, church LAN), single pane to switch+build+stream. CONS = PC/OS reliability is exactly the failure class that just took the program down (a crash is a BLACK program, not one lost input); NDI encode->net->decode latency desyncs IMAG from the live room. KEEP-THE-ATEM (hardware switcher): PROS = boots instantly / does not crash, ~zero latency + frame-synced (IMAG stays in sync), purpose-built for live cutting. CONS = far less flexible graphics; no native NDI - needs a bridge, which is the current break. The needs-a-bridge con is what the reframe (next entry) removes. WE LEAN hybrid, NOT all-OBS, BECAUSE a Sunday cannot ride PC/OS reliability for the in-room program and IMAG cannot ride NDI latency. The all-OBS path stays VALID IF single-software-pane + sovereignty are judged to outweigh latency + reliability - a deliberate trade, named so Darrell chooses on purpose.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0082"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-switcher-reframe-sdi-and-ndi', 'reflection',
     'Reframe: PTZOptics output SDI+NDI at once -> feed the ATEM by SDI, OBS by NDI (deletes the bridge)',
     'KEY REFRAME (SURFACE-PREMISE - the must-bridge-NDI-into-the-ATEM premise was false): the 3x PTZOptics 4K cameras output SDI AND NDI SIMULTANEOUSLY. So run camera SDI -> ATEM directly (the ATEM gets every PTZOptics camera natively, with NO NDI bridge at all - the fragile NDI->HDMI Lenovo Legion hop is DELETED, not repaired) AND camera NDI -> OBS as it already does. The Blackmagic camera is SDI-only and already belongs on the ATEM SDI inputs. Both switchers get all cameras natively over the transport each was built for - there is no either/or forced by the cabling. WE CHOSE delete-the-bridge over fix-the-bridge BECAUSE the cameras emit SDI in parallel, so the right fix removes the thing that broke instead of maintaining one more fragile software hop in the live path.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0082"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-switcher-recommended-hybrid', 'directive',
     'Recommended HYBRID: ATEM cuts cameras (SDI), OBS does graphics+stream (NDI), wall fed direct from ATEM',
     'RECOMMENDED HYBRID (each tool does what it is best at). WIRING: camera SDI -> ATEM (all 3 PTZOptics + the Blackmagic); camera NDI -> OBS (unchanged); presentation-tower graphics NDI -> OBS; ATEM program -> SDI/HDMI -> NovaStar VX1000 -> LED wall; OBS -> online broadcast. ROLES: ATEM = live camera switcher fed by SDI (low-latency, reliable - THIS fixes the current outage); OBS = graphics + streaming pulling NDI (no longer load-bearing for the in-room program); wall gets program from the ATEM. WALL FEED - the honest detail: feed the wall ATEM program DIRECT via SDI/HDMI to the VX1000 (lowest latency; REQUIRED if the wall shows IMAG - NDI encode->net->decode latency desyncs IMAG from the room). This matches the prior AV decision dc-colg-av-signal-path-presenter-vx1000 (direct cable to the wall; NDI is LAN routing, not the wall-direct feed). The NDI encoder->decoder->VX1000 path is the FALLBACK only for graphics-only / cable-impractical cases. TO CONFIRM (DR-0076): exact ATEM model + input map; wall source (IMAG vs graphics-only vs both); SDI run lengths. WE CHOSE ATEM-cuts + OBS-graphics/stream + direct-wall-feed, NOT all-software-OBS, BECAUSE it fixes the outage by deleting the bridge, keeps IMAG in sync, and keeps OBS flexibility where it is safe. PROPOSED - Darrell confirmation finalizes it.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0082"}'::jsonb, '{}'::jsonb, 'darrell', now(), now())
  ON CONFLICT (instance_id, slug) DO NOTHING;
END $$;
