-- 2026-06-24 - COLG Sanctuary AV + GPU planning: in-app project documentation
-- Materializes this session's sanctuary AV + GPU planning (LED wall + NovaStar
-- VX1000, signal path, Presenter-replaces-ProPresenter, GPU inventory, live-mix AI,
-- optional VX1000 API control) as in-app documentation, using the discussions
-- (institutional-memory / decisions-with-rationale) model so each entry RENDERS in
-- the app under the EXISTING seeded project "COLG media+AI node - CHURCH"
-- (client-seed id `pr-cuda-colg-node`, domain church). Renders at:
--   Projects -> (domain: Church) -> "COLG media+AI node - CHURCH" -> Manage -> Discussions driving this
--   Projects -> Discussions (filtered to the project)
--
-- SOURCE OF TRUTH for the prose: infra/seed-data/2026-06-24-colg-sanctuary-av-gpu-docs.json
-- REUSES the exact mechanism of infra/seed-data/2026-06-23-colg-local-infrastructure-docs.sql
-- (the content-engine lane) - same discussions model, new file, NOT a fork.
--
-- NOTE - NO project row is created. `pr-cuda-colg-node` is a CLIENT-SIDE seed project
--   (app/src/poe-financial-mvp-v28.jsx, projects[]), not a DB row. The discussions
--   table stores the project slug as a plain string in project_slugs (no FK), and the
--   app's discussionsForProject(project.id) matches that string client-side. So linking
--   project_slugs = ["pr-cuda-colg-node"] is all that is needed for these to render
--   inline under that project - we deliberately do NOT duplicate the project as a DB row.
--
-- APPLY: run ONCE in Supabase Studio (SQL editor) against the COLG cloud instance.
--   Idempotent: resolves the instance by slug='colg' (the proven pattern from
--   migration 0013-colg-sermon-backfill.sql); ON CONFLICT (instance_id, slug) DO NOTHING.
--   created_by is left NULL (system-seeded doc). If discussions.created_by is NOT NULL in
--   your schema, set it to a COLG owner/admin uuid and swap the NULLs.
--   NOT yet applied to cloud as of this commit (this local session cannot reach the cloud Studio).
--
-- BINDING (DR-0076, verification doctrine): specs are recorded as provided; items not yet
--   read off the real hardware are explicitly marked TO CONFIRM (exact wall pixel resolution,
--   exact QL console model, exact 4070 VRAM). No fabricated facts about the installed units.

DO $$
DECLARE
  v_instance uuid;
BEGIN
  SELECT id INTO v_instance FROM instances WHERE slug = 'colg';
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'No instance with slug=colg; seed migration 0012 must be applied first.';
  END IF;

  -- Six sanctuary-AV + GPU planning entries, all linked to pr-cuda-colg-node ----
  INSERT INTO discussions
    (id, instance_id, created_by, slug, kind, title, body, project_slugs, visibility, status, links, meta, author_persona, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_instance, NULL, 'dc-colg-av-led-wall-vx1000', 'decision',
     'Sanctuary LED wall (9ft x 12ft, 1.9mm) driven by NovaStar VX1000',
     'BEST WAY: the new altar wall is a 9ft x 12ft fine-pitch LED wall at 1.9mm pitch (fine-pitch cabinets, install in progress, started 2026-06-22), driven by the NovaStar VX1000 all-in-one processor/controller already on hand. VX1000 caps (per NovaStar VX1000 spec): ~6.5M px loading capacity; max output 10240x8192; inputs 2x HDMI 1.4, 2x DVI, 1x 3G-SDI, 2x 10G fiber; 3x 4K layers; 1-frame latency; genlock; 10 presets; PC control over RJ45/USB plus the NovaStar API. Wall pixel count approx 1920x1440 (~2.76M px) -> well inside the 6.5M px cap on a single controller. TO CONFIRM (DR-0076, mark the unverified): exact wall pixel resolution read off the NovaStar config once the cabinets are mapped - 1920x1440 is an estimate from the panel geometry, not a read of the unit. WE CHOSE drive-the-new-wall-with-the-VX1000-we-already-have, NOT a new processor, BECAUSE the VX1000 is a single-box processor/controller whose capacity (~2.76M of 6.5M px) and HDMI/DVI inputs cover this wall with headroom at one-frame latency.',
     '["pr-cuda-colg-node"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0076"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-av-signal-path-presenter-vx1000', 'decision',
     'Signal path: PoeTech Presenter -> HDMI/DVI -> VX1000 -> wall (NDI is LAN routing, not wall-direct)',
     'BEST WAY: the worship-graphics path to the wall is PoeTech Presenter (on the presentation PC) -> HDMI or DVI out -> NovaStar VX1000 input -> the LED wall. The VX1000 has NO native NDI input; if NDI transport is ever wanted INTO the wall it must pass through an NDI->HDMI hardware bridge (decoder) feeding a VX1000 HDMI input. NDI''s role here is PRODUCTION-LAN routing - cameras, feeds, and other screens/monitors around the building over the gigabit LAN - NOT the direct feed to the altar wall. Ties to the program-output bridge already in the repo (lib/ndi-output.js, the ?output=1 Presenter route): that bridge is for LAN/OBS routing, while the wall takes a direct video cable. WE CHOSE Presenter-over-HDMI/DVI-straight-into-the-VX1000, NOT NDI-into-the-wall, BECAUSE the VX1000 accepts HDMI/DVI/SDI/fiber but not NDI, so a direct video cable from the Presenter machine is the simplest, lowest-latency, most reliable path; NDI stays on the production LAN where its IP routing is the right tool.',
     '["pr-cuda-colg-node"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-av-presenter-replaces-propresenter', 'directive',
     'PoeTech Presenter targets feature-parity to retire ProPresenter (frees a CUDA box)',
     'MARCHING ORDER: bring PoeTech Presenter to feature-parity + reliability with ProPresenter for live worship presentation on this wall, then RETIRE ProPresenter - which frees one of the church''s CUDA machines for AI work. STAGED, never a hard cutover: (1) run PoeTech Presenter ALONGSIDE ProPresenter on the new wall; (2) PROVE parity + reliability across real services (lyrics, Scripture, lower-thirds, sermon graphics, smooth transitions, operator ergonomics); (3) CUT OVER only once proven, with ProPresenter held as fallback through the soak. Reuses the Universal Presenter primitive (Presenter.jsx + lib/presentable.js) and the program-output bridge (lib/ndi-output.js, ?output=1 route). WE CHOSE staged-run-alongside-prove-cutover, NOT rip-and-replace, BECAUSE Sunday worship cannot risk a blank wall - parity is proven on the live wall next to the incumbent before the incumbent is removed; the freed CUDA box is the payoff, not the gate.',
     '["pr-cuda-colg-node"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-av-gpu-inventory-runs-now', 'decision',
     'GPU inventory: church-side AI runs NOW on 2x existing RTX 4070 boxes (not gated on the weekend purchase)',
     'REAL INVENTORY: the church already has 2x CUDA machines, each with an RTX 4070 (~12-16GB VRAM). Church-side AI runs on THESE today: live-mix / per-voice EQ assist, faster-whisper transcription, content processing, NDI/CUDA media, and a mid-size local LLM. This is NOT gated on the heavier weekend hardware purchase - that purchase is the heavier home / 70B+ tier (see pr-cuda-home-box and the 192GB COLG node procurement line on this project), not a prerequisite for church-side AI. Retiring ProPresenter (entry above) frees one of the two 4070 boxes fully for AI. TO CONFIRM: exact VRAM per card (4070 12GB vs 4070 Ti/Super 16GB) once the boxes are inventoried. WE CHOSE run-church-AI-on-the-4070s-we-have-NOW, NOT wait-for-the-weekend-box, BECAUSE the 4070s already run faster-whisper, mid-size LLMs, and live-mix assist comfortably; the big purchase is for the heavy home/70B+ tier and must not become a false blocker for church-side AI that already has the hardware.',
     '["pr-cuda-colg-node"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-av-livemix-ai-ql', 'decision',
     'Live-mix AI on the Yamaha QL console: staged assistive -> supervised -> autonomous, human-on-loop',
     'BEST WAY: the sanctuary sound console is a Yamaha QL (software-controllable over its network protocol), so per-voice EQ / mix assist can be driven by software on a church CUDA box (the 4070s above). STAGED, with hard safety bounds and a human on the loop at every stage: (1) ASSISTIVE - AI suggests EQ/level moves, the engineer applies; (2) SUPERVISED - AI makes bounded moves live, the engineer watches and can veto/override instantly; (3) AUTONOMOUS - AI holds per-voice EQ within HARD safety bounds (gain ceilings, feedback guard, rate limits), human still on the loop. Autonomous operation is timer/auto-driven control -> it ships behind the three brakes (budget/scope ceiling + single-instance lock + kill-switch - the 2026-06-06 runaway rule) and INACTIVE, turned on only with someone watching. Cross-ref: the live-sound training track + sound-engineer SME lane (local_ecc353b2). TO CONFIRM: exact QL model (QL1 vs QL5) and its control surface/protocol. WE CHOSE staged-assistive-to-autonomous-with-hard-bounds-and-human-on-loop, NOT day-one-autonomous-mixing, BECAUSE a live congregation''s sound cannot be a science experiment - the AI earns each rung by proving it inside bounds while a human can always override, and autonomous control obeys the three-brakes rule.',
     '["pr-cuda-colg-node"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-av-vx1000-api-control-optional', 'decision',
     'OPTIONAL/FUTURE: app drives VX1000 (brightness/presets/genlock) via NovaStar API from the master Sunday program',
     'FORWARD OPTION (not in current scope): the PoeTech app could control the NovaStar VX1000 - brightness, preset recall (10 presets), genlock - through the NovaStar API / RJ45-USB control channel, driven automatically by the master Sunday Order-of-Service program (recall the pre-service preset, dim for video, restore for lyrics, at the right cue). Rides the same "a click today is an API call tomorrow" posture (AI-FOUNDATION-INTERNAL-OPERATIONS) and the master-program seam already used by the order-of-service derived views. DEFERRED - not a launch requirement; manual VX1000 control via its PC software is the day-one path. re-review: 2026-09-30 (after Presenter parity/cutover is proven; revisit whether program-driven wall control is worth wiring) - DR-0075: a parked improvement carries a re-review date. WE CHOSE record-it-as-an-optional-future-control-with-a-re-review-date, NOT build-it-now and NOT drop-it-silently, BECAUSE program-driven wall control is real value but it is downstream of proving the Presenter on the wall first; parking it with a date keeps it from being lost or prematurely built.',
     '["pr-cuda-colg-node"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0075"}'::jsonb, '{}'::jsonb, 'darrell', now(), now())
  ON CONFLICT (instance_id, slug) DO NOTHING;
END $$;
