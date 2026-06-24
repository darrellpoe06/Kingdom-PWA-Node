-- 2026-06-23 — Church Local Infrastructure: in-app best-way documentation
-- Materializes the DECIDED best-way + rationale for the church study -> course-materials
-- pipeline as in-app documentation: one umbrella project + 9 discussion entries
-- (institutional-memory / Events-as-data model). Renders at:
--   Projects -> (domain: Church) -> "Church Local Infrastructure" -> Discussions driving this
--   Projects -> Discussions (filtered to the project)
--
-- SOURCE OF TRUTH for the prose: infra/seed-data/2026-06-23-colg-local-infrastructure-docs.json
-- SURVEY: docs/99-session-notes/2026-06-23-research-review-body-study-to-course-materials-pipeline.md
--
-- APPLY: run ONCE in Supabase Studio (SQL editor) against the COLG cloud instance.
--   Idempotent: resolves the instance by slug='colg' (the proven pattern from
--   migration 0013-colg-sermon-backfill.sql); ON CONFLICT (instance_id, slug) DO NOTHING.
--   created_by is left NULL (system-seeded doc). If projects.created_by / discussions.created_by
--   is NOT NULL in your schema, set :seed_author to a COLG owner/admin uuid and swap the NULLs.
--   NOT yet applied to cloud as of this commit (this local session cannot reach the cloud Studio).

DO $$
DECLARE
  v_instance uuid;
BEGIN
  SELECT id INTO v_instance FROM instances WHERE slug = 'colg';
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'No instance with slug=colg; seed migration 0012 must be applied first.';
  END IF;

  -- 1) Umbrella project ------------------------------------------------------
  INSERT INTO projects (id, instance_id, created_by, slug, title, status, domain, description, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_instance, NULL,
    'colg-local-infra-2026-06',
    'Church Local Infrastructure',
    'active', 'church',
    'COLG sovereign local-infrastructure build: church NAS (~100 TB) + CUDA box + local AI, and the study/recordings -> structured course-materials pipeline that runs on it. Umbrella for the decided best-way + rationale on source, retention, processing topology, access, faithful extraction, consent, curation, trivia, and the end-to-end pipeline. Survey: docs/99-session-notes/2026-06-23-research-review-body-study-to-course-materials-pipeline.md',
    now(), now()
  )
  ON CONFLICT (instance_id, slug) DO NOTHING;

  -- 1b) Content Engine workstream project -----------------------------------
  INSERT INTO projects (id, instance_id, created_by, slug, title, status, domain, description, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_instance, NULL,
    'content-engine-2026-06',
    'Content Engine',
    'active', 'church',
    'The unified content engine: ONE shared transcript->structure engine, multiple sources (church recordings + Darrell''s in-app conversations) -> multiple outputs compiled in sequence (lessons -> curriculum -> books -> digital-marketing assets). Holds the engine framing, conversations->lessons, curriculum->books, and the firm phased timeline (CPU-now vs GPU-later). Survey: docs/99-session-notes/2026-06-23-research-review-body-study-to-course-materials-pipeline.md sections 12-15.',
    now(), now()
  )
  ON CONFLICT (instance_id, slug) DO NOTHING;

  -- 2) Thirteen best-way discussion entries ---------------------------------
  INSERT INTO discussions
    (id, instance_id, created_by, slug, kind, title, body, project_slugs, visibility, status, links, meta, author_persona, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-source-both-reconciled', 'decision',
     'Source = BOTH church-NAS originals + YouTube archive, reconciled',
     'BEST WAY: treat the church NAS originals AND the YouTube @thelovecorner archive (UC821pJh7YR5llBNnWUJj-ZA, 836 videos since Sep 2014) as ONE reconciled set. Their union = the comprehensive video history; the matched pair (date/title/duration/hash) cross-verifies completeness AND fidelity. Built on the existing in-app choir_sermons catalog (migration 0013) for the on-YouTube side. WE CHOSE both-reconciled, NOT church-NAS-only and NOT YouTube-only, BECAUSE two independent copies of the Word let us prove nothing is missing or truncated and let us sanity-check each transcript against the published version. Church-NAS holdings are PENDING INVENTORY until read-only access exists; the 836 figure is verified.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-retain-best-of-one', 'decision',
     'Retention = keep the single BEST version (~100 TB church NAS)',
     'BEST WAY: verify with both copies, then RETAIN only the single best version per item - criteria in order: (1) audio quality (dominates transcription accuracy), (2) completeness/uncut, (3) resolution/bitrate. Record matched-pair provenance (date/title/duration/hash/which-source-won) even though only one file is kept. Capacity: ~100 TB total after 5x12 TB add (RAID caveat: 60 TB raw -> ~48 TB usable at SHR/RAID-5, ~36 TB at RAID-6); whole archive best-versions ~1-2.5 TB - vast headroom. WE CHOSE best-of-one, NOT redundant duplicates, BECAUSE storage is not the constraint - cleanliness is; two copies are for VERIFICATION, one copy is for RETENTION.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-app-on-cuda-cockpit', 'decision',
     'Processing = the app is the cockpit, running ON the CUDA boxes',
     'BEST WAY: the PoeTech PWA opens locally ON the GPU machine (church + home). That app instance IS the processing + orchestration node - it reaches the LOCAL GPU (faster-whisper + Ollama on CUDA) and the LOCAL recordings (church NAS on the same LAN) directly. Operating the pipeline = clicks in the app that become local API calls (Reconcile / Build / Monitor / Review / Publish). The sovereign sync layer keeps both sites coherent. WE CHOSE app-on-CUDA-as-node, NOT external scripts and NOT cloud processing, BECAUSE the app is the primary artifact (a click today is an API call tomorrow), low-latency local LAN + local GPU is fully sovereign, and nothing leaves the box. The app is the control plane; raw GPU work stays native.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-access-tailnet-takeout-fallback', 'decision',
     'Access path = tailnet (primary) + owner-export Takeout (fallback)',
     'BEST WAY: the acquisition gap is an ACCESS problem, not a download problem - originals already sit on the church NAS. PRIMARY: reach them over the LAN (app-on-CUDA at the church) and cross-site over Tailscale (home + church on one tailnet). Reaching/authenticating to the church NAS is a credential / his-hand step (Darrell/BG hold the creds; the pipeline does not) - needs tailnet membership for the processing node + a read-only service account/share. FALLBACK, only for items on YouTube but missing from the NAS: the OWNER exports via YouTube Studio download / Google Takeout (COLG''s own channel) and lands them on the NAS. WE CHOSE tailnet-access + owner-export, NOT yt-dlp/scraping and NOT pulling through our tools, BECAUSE it is rights-clean and sovereign - a channel-owner credential action, never a scrape.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-faithful-extraction-guarantee', 'decision',
     'Faithful-extraction guarantee = bias input + verify output + matched-pair cross-check',
     'BEST WAY: a misquoted verse attributed to a speaker NEVER ships unverified. Three layers: (C) contextual biasing - feed Whisper a scripture-aware initial_prompt (66 book names, Bishop Gwin, Church of the Living God, KJV register) to cut errors at the source (arXiv:2410.18363); (D) post-hoc verification - detect every reference with a Bible-verse parser (pythonbible / python-scriptures) and check each quote against LOCAL canonical KJV/ESV, flag drift; (E) matched-pair cross-check - sanity-check the transcript against the other copy (NAS original vs YouTube mirror) + the choir_sermons title/speaker. Flagged verses go to human review; ESV primary / KJV secondary; fetch the actual translation, never reconstruct from the model. WE CHOSE bias+verify+cross-check, NOT fine-tuning Whisper, BECAUSE there is no labeled COLG corpus yet and fine-tuning overfits on scarce data; verification is proven-to-catch and runs today (DR-0076).',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0076"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-privacy-consent-scrub', 'decision',
     'Privacy/consent = consent-at-source + Presidio scrub + human backstop',
     'BEST WAY: congregant names, prayer requests, and testimonies are scrubbed or consented before anything becomes shareable (served-not-surveilled). Layered: (C) consent-at-source - default PRIVATE unless it is the teaching of the Word, which is shareable; media team can tag teaching vs personal segments; (B) Microsoft Presidio auto-scrub - local NER+regex strips names/PII before storing transcripts, custom recognizers for prayer/testimony, image-redaction for on-screen lower-thirds; (A) human backstop - the review queue shows consent flags beside faithfulness flags; nothing publishes until cleared. Teaching recordings ONLY - building Surveillance-Station camera feeds are out of scope. WE CHOSE consent-as-governance + automated first-pass + human backstop, NOT automation-only, BECAUSE NER catches names but not intent - the human is the final gate.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-curation-newest-first-brakes', 'decision',
     'Curation = newest-first, by series, behind the three brakes',
     'BEST WAY: process newest-first, one series at a time, manual-run, with all three brakes (budget ceiling + single-instance concurrency lock + kill-switch). Backfill of the 836-item history is OPT-IN and batched, never auto-fired. Honest N of M, never a silent cap. Matches the sme-pipeline manual-run posture. WE CHOSE newest-first manual-run, NOT batch-everything, BECAUSE auto-backfilling 836 items is the exact runaway the three-brakes rule forbids (2026-06-06 incident) and the human REVIEW queue is the real bottleneck regardless of GPU speed. CUDA buys speed, NOT permission to remove brakes.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-bg-wednesday-trivia', 'decision',
     'BG Wednesday-1PM trivia Q&A = questions BG poses -> in-app answers',
     'BEST WAY: the questions Bishop Gwin poses at the end of a message become the lesson check-for-understanding - answered in-app, graded app-side, RLS-scoped to the church instance. Reuses the shipped Engagement surface + trivia_answers table + engagement-sync. The Body''s own questions feed the trivia, not just generated quiz items. Currently a static John 18 anchor set; weekly auto-generation is blocked on Gmail OAuth (BG''s emailed Wednesday message via Christina''s inbox). WE CHOSE reuse-the-Engagement-lane + the Body''s real questions, NOT a new trivia surface and NOT only machine-generated questions, BECAUSE the lane is built and waiting on the same OAuth, and the Body''s contributions are first-class source. The text wedge (BG message -> lesson + trivia) is the cheapest first increment.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-colg-infra-end-to-end-pipeline', 'directive',
     'End-to-end: recordings -> course materials (the whole pipeline)',
     'BEST WAY (the umbrella): reconcile-both -> retain-best -> app-on-CUDA transcribes (scripture-aware) -> faithfulness gate -> consent scrub -> structure into a MODULES lesson (objectives/segments/anchor refs/the Body''s contributions/trivia) -> human review (Governor-gated) -> publish newest-first into Learn + Presenter + Study + Engagement + Church clips. Operated entirely through in-app surfaces. Reuses sme-pipeline, learn-framework, the Presenter contract, the trivia lane, Study, choir_sermons, and the discussions model. New links only: church-NAS access, the reconciliation/retention engine, the faithfulness gate, and the in-app cockpit. WE CHOSE app-operated, gate-first, human-in-the-loop, NOT scrape-and-auto-publish, BECAUSE the Word must be verifiably faithful (two copies, canonical check), people must be consented (served-not-surveilled), and the human governs the bright line. Tier B/C: soaks before it ships.',
     '["colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-content-engine-unified', 'directive',
     'Unified content engine: sources -> lessons -> curriculum -> books -> marketing',
     'BEST WAY: ONE shared transcript->structure engine, source-agnostic. SOURCES: church recordings (NAS union YouTube) + Darrell''s in-app conversations (discussions / Study / chat-in / family-voice / private thinking space, owner-family-scoped). OUTPUTS compiled in sequence: LESSON (Learn/Presenter) -> CURRICULUM (course/series, learn-framework shape) -> BOOK (downloadable PDF/EPUB, owned content only) -> MARKETING ASSET (lead magnet/product). Each arrow is a compile step behind the same three brakes + the same Governor review gate; the same app-on-CUDA cockpit operates every stage. WE CHOSE one engine many sources/outputs, NOT separate one-off tools, BECAUSE the transcript->faithfulness-gate->consent->MODULES->review->publish spine is identical whether the input is a recording or a conversation - reuse, not rebuild.',
     '["content-engine-2026-06","colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-content-engine-conversations-to-lessons', 'decision',
     'Conversations -> Lessons (in-app conversation sources, CPU-now)',
     'BEST WAY: point the same engine at in-app conversation data (Supabase discussions, Study reflections/thinking-space, chat-in conversationLog, family-voice, the yahweh-discussions append). No transcription for text sources -> CPU-OK today, no GPU dependency. PRIVACY IS THE SENIOR GATE, INVERTED: recordings default teaching=shareable, but conversations default PRIVATE (especially the Study thinking space - process-don''t-store is binding). The engine is OPT-IN PER ITEM - Darrell picks a conversation to turn into a lesson; nothing auto-publishes his private processing. Presidio scrub + no-leak visibility filter still run. Faithful structuring unchanged. Phase 1 MVP (pick -> draft -> review -> publish to Learn) ~3-5 build days, depends on privacy scoping. Phase 2 batch-all-history behind brakes, GPU-accelerated only where voiced clips need transcription. WE CHOSE opt-in private-by-default, NOT auto-ingest-all-conversations, BECAUSE the Study space is his most private thinking - he selects what becomes public, the system never decides that for him.',
     '["content-engine-2026-06","colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-content-engine-curriculum-to-books', 'decision',
     'Curriculum -> Books (PDF/EPUB; NOT the financial Books tab; owned content only)',
     'BEST WAY: compile a course/curriculum into a downloadable book (PDF/EPUB), positioned as a digital-marketing asset. PREMISE CONFLICT SURFACED: the app''s existing Books tab is the FINANCIAL LEDGER (accounting - BooksEntities.jsx, Books->Tx/Imported), NOT a publishing/library shelf - there is no existing downloadable-book surface. Do NOT bolt a book library onto the accounting tab. RECOMMEND: home the library in the Learn/Church area where curriculum lives, reusing the CreationWorkspace export primitive (creation-workspace.js); matches the tracked Worldview-teaching-book goal. EXPORT: Option A print-CSS->PDF (zero-dep, recommended MVP); B jsPDF/pdf-lib; C +JSZip EPUB. HARD RULES: (1) NO payment/monetization build - book + download + marketing packaging ONLY; payment is Darrell''s hand. (2) COPYRIGHT - owned curriculum is fine; do NOT embed copyrighted song lyrics or third-party text; derived data only (scripture refs, themes, paraphrase-marked). (3) a book inherits its lessons verified status - nothing with an open faithfulness/consent flag compiles. MVP ~3-5 build days (print-CSS); EPUB +~2. WE CHOSE Learn/Library-home + zero-dep export + owned-content-only + no-payment-build, NOT the financial Books tab and NOT scraping copyrighted text, BECAUSE Books means two different things in the app and we ship only what we own and can verify.',
     '["content-engine-2026-06","colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-content-engine-phased-timeline', 'directive',
     'Firm phased timeline (CPU-now vs GPU-later)',
     'BEST WAY (phases gated by dependencies, not calendar): P0 text wedge BG-message->lesson+trivia (~2-3d, CPU, dep Gmail OAuth). P1 Conversations->Lessons MVP (~3-5d, CPU, dep privacy scoping). P2 Recordings->Lessons MVP (~4-6d, CPU-slow/GPU-accelerates, dep faithfulness gate + one recording). P3 Lessons->Curriculum (~2-3d, CPU). P3c Sermon Stories MVP (~3-5d, CPU, dep transcripts + The Word-Migdal sub-tab). P4 Curriculum->Books MVP (~3-5d, CPU, dep Library-surface decision + export). P5 Reconciliation+retention engine (~5-8d, CPU, dep church-NAS access via tailnet). P6 In-app cockpit on CUDA (~6-10d, homes on GPU box, dep GPU online). P7 Batch backfill 836 videos + all-history incl. story extraction (GPU-LATER, dep GPU + P5 + P6 + brakes). P8 Books->Marketing packaging (~2-4d, CPU; payment = his hand, NOT built). The ENTIRE sources->lessons->curriculum->books->marketing spine is demonstrable end-to-end ON CPU with owned conversation data before any GPU dependency; only P7 batch genuinely requires GPU. SEQUENCING: P0/P1 -> P3 -> P4 -> then P2/P5/P6/P7 as church-NAS access + GPU box land -> P8 when products are wanted. WE CHOSE prove-on-CPU-first, NOT wait-for-GPU, BECAUSE the cheapest highest-value path (owned conversations -> lessons -> curriculum -> book) needs no new hardware; GPU is only the batch-backfill accelerant.',
     '["content-engine-2026-06","colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-content-engine-sermon-stories', 'decision',
     'Sermon Stories - BG''s reusable illustration library (BG-requested output mode)',
     'BEST WAY (requested by Bishop Gwin himself): a THIRD engine output alongside lessons + books - extract every story/illustration BG tells and collect them into HIS personal section as a reusable searchable library, so he does not dig through old sermons to find an illustration for a new one. LANDS IN: The Word - Migdal (the existing staff-gated Bishop''s-study surface - Pulpit.jsx, pulpit-prep.js, reads choir_sermons) as a NEW Sermon Stories sub-tab via theWordTabs - extend, NOT a new top-level surface (ties to prior BG-study lane local_cb09eb75). RECORD per story: the anecdote (his words, faithful, not fabricated), the point/moral, the scripture/theme (faithfulness-gate verified), source sermon + date + timestamp (jump-back), speaker via speakerKey; searchable/filterable by theme/scripture/topic. TWO PARTS: (1) reuse-from-old - auto-extract discrete stories he ACTUALLY told from the sermon corpus (same NAS-union-YouTube transcripts as lessons/books); (2) new-story sourcing aid (optional) - curated, attributed, theologically-aligned stories for NEW sermons; BG curates, not auto-insert; copyright: attribution + summary/reference only, never reproduce copyrighted text. PRIVACY (senior gate): stories may name congregants/family - DEFAULT PRIVATE TO BG; Presidio scrub + no-leak filter; consent/scrub before he chooses to share. FAITHFUL ONLY: model extracts candidates, BG VERIFIES before a story is kept; unverified stays candidate, never auto-canonical. Reuses the transcript pass + faithfulness gate + speakerKey + corpusPrep search + Presidio + discussions visibility; new code only = the story-extraction prompt + the sub-tab. Timeline: P3c ~3-5 build days CPU (rides P2 transcripts); batch back-catalog rides P7 (GPU). WE CHOSE extend-The-Word-Migdal + BG-private-by-default + faithful-with-BG-verify, NOT a new surface and NOT auto-canonical extraction, BECAUSE it is his personal section and his stories - the system surfaces candidates, the preacher verifies and decides what to keep or share.',
     '["content-engine-2026-06","colg-local-infra-2026-06"]'::jsonb, 'shared', 'open', '{}'::jsonb, '{}'::jsonb, 'darrell', now(), now())
  ON CONFLICT (instance_id, slug) DO NOTHING;
END $$;
