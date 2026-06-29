-- 2026-06-24 — Unified Surfaces (IA Consolidation): in-app design documentation
-- Materializes DR-0079 (the consolidation + IA design) as in-app documentation:
-- one "Unified Surfaces (IA Consolidation)" project + 8 discussion entries
-- (institutional-memory / Events-as-data model). Renders at:
--   Projects -> (domain: Church) -> "Unified Surfaces (IA Consolidation)" -> Discussions
--   Projects -> Discussions (filtered to the project)
--
-- SOURCE OF TRUTH for the prose: infra/seed-data/2026-06-24-consolidation-unified-surfaces-docs.json
-- DESIGN DOC: docs/00-foundations/CONSOLIDATION-IA-UNIFIED-SURFACES.md
-- DECISION:   docs/decisions/DR-0079-consolidate-into-unified-surfaces-on-the-module-registry.md
--
-- APPLY: run ONCE in Supabase Studio (SQL editor) against the COLG cloud instance.
--   Idempotent: resolves the instance by slug='colg'; ON CONFLICT (instance_id, slug) DO NOTHING.
--   created_by is left NULL (system-seeded doc). If projects.created_by / discussions.created_by
--   is NOT NULL in your schema, set a COLG owner/admin uuid and swap the NULLs.
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
    'unified-surfaces-2026-06',
    'Unified Surfaces (IA Consolidation)',
    'active', 'church',
    'Darrell''s directive: consolidate this session''s lanes into one cohesive page per area. FIVE unified surfaces (The Study; The Word - Migdal + Sermon Stories; The Content Engine cockpit; Learn & Library; Worship) + FOUR shared core primitives (Presenter, Reaction, Voice, 4D Finalizer), each a clean module on the surface-mount registry (DR-0078). Design: docs/00-foundations/CONSOLIDATION-IA-UNIFIED-SURFACES.md. Decision: DR-0079.',
    now(), now()
  )
  ON CONFLICT (instance_id, slug) DO NOTHING;

  -- 2) Seven design discussion entries --------------------------------------
  INSERT INTO discussions
    (id, instance_id, created_by, slug, kind, title, body, project_slugs, visibility, status, links, meta, author_persona, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_instance, NULL, 'dc-unified-the-study', 'decision',
     'Unified surface: The Study (capture -> 4D finalize -> Eternal Algorithms, one flow)',
     'BEST WAY: ONE private (Darrell+Christina+BG) Study page that does the whole motion - Capture (Reflection/Processing/Research rooms + voice) -> Finalize (the 4D finalizer: deep source -> plain distillation -> benefits/outcome) -> Eternal Algorithms AUTO-POPULATED from finalized entries (fourD=deep+scripture, threeD=plain, outcome=benefits) -> opt-in hand-off to the content engine. De-toggles today''s Workspace <-> Eternal Algorithms split into one flow. Stays device-local/sovereign; private-by-default is the senior gate. WE CHOSE de-toggle + auto-populate, NOT a separate hand-authored algorithm tab, BECAUSE finishing an entry into deep->plain->benefits IS a 4D->3D->OUTCOME algorithm - the library is the natural crystallization of the finalizer, not a second surface.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-unified-the-word-migdal', 'decision',
     'Unified surface: The Word - Migdal (library + prep + Sermon Stories + present)',
     'BEST WAY: ONE church-staff page for everything sermon - the public sermon Library (choir_sermons / theword_public_sermons) + corpus Prep (real retrieval over BG''s history) + BG''s Sermon Stories (BUILD #1: reusable illustration library, faithfulness-gate verified, BG verifies before keep) + Present (the shared Presenter). Extend Pulpit.jsx''s theWordTabs with a stories sub-tab - NOT a new top-level surface. Sermon Stories access = trusted-steward set (owner BG curates + grants; shared read/use Darrell+Christina) via user_in_sermon_stories_stewards, private-by-default within the set. WE CHOSE extend-The-Word, NOT a separate stories surface, BECAUSE library, prep, and stories all read the same corpus and serve the same person (BG) for the same job.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-unified-content-engine-cockpit', 'decision',
     'Unified surface: The Content Engine cockpit (composed into C2S; app-as-cockpit on CUDA)',
     'BEST WAY: ONE Governor-gated operator page that runs the whole pipeline - Sources (recordings NAS-union-YouTube OR in-app conversations, opt-in) -> Reconcile/Retain -> Build (transcribe+structure on the local GPU) -> Review (faithfulness gate + consent scrub, ONE queue) -> Publish (fan-out: lessons->Learn, books->Library, stories->The Word, trivia->Engagement) -> Monitor (three brakes, ships INERT, Tier C). The app opens locally ON the CUDA box and drives the local GPU + local recordings. COMPOSED INTO Command, Control & Serve (C2S), the steward seat that already composes the other operator surfaces. WE CHOSE compose-into-C2S, NOT a peer top-level surface, BECAUSE app-as-cockpit and C2S are the same idea - one steward seat operates everything.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-unified-learn-and-library', 'decision',
     'Unified surface: Learn & Library (courses + lessons + Books shelf; NOT the financial Books tab)',
     'BEST WAY: ONE church/all page for consuming taught content - Courses (authored + engine-produced) + individual Lessons + a downloadable Library/Books shelf (PDF/EPUB from curriculum, zero-dep print-CSS export via CreationWorkspace, owned content only, no copyrighted lyrics, NO payment build), all via the shared Presenter and carrying the shared reaction control. PREMISE CONFLICT RESOLVED: the publishing shelf homes HERE in Learn, NOT on the app''s top-level Books tab (which is the FINANCIAL ledger). WE CHOSE Learn-home + owned-content-only + no-payment-build, NOT the financial Books tab and NOT scraping copyrighted text, BECAUSE courses/lessons/books are the same content at three compile altitudes for the same learner, and books already means the ledger.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-unified-worship', 'decision',
     'Unified surface: Worship (library + radio + reactions + lyrics-as-curriculum + artist promotion)',
     'BEST WAY: ONE new worship Church sub-tab designed unified from day one - multi-type Christ-centered library (rap/R&B/gospel/worship + Your Music favorites, content-vetted + age-tagged before surfacing; profanity is the hard exclusion; twins are 10) + Radio stations (Most-Loved + per-type + Your Favorites, ratings-driven, user-initiated) + the shared Reaction control + Lyrics-as-curriculum (derived data only, never copyrighted lyrics without a license; Prov 22:6 child-formation mission) + Promote-the-artist (outbound links + featured rotation; NO payment processing by us). WE CHOSE design-it-unified-greenfield, NOT ship fragments, BECAUSE play/react/learn-from/promote are one continuous experience around a track.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-unified-shared-core-primitives', 'directive',
     'Four shared core primitives: Presenter, Reaction, Voice, 4D Finalizer (reuse, never fork)',
     'BEST WAY: consolidation = shared primitives in core, consumed by all - NOT forked per surface. (1) PRESENTER - one present mode (Presenter.jsx + presentable.js); surfaces supply a pure presentable adapter, never fork the renderer. (2) ENGAGEMENT/REACTION - one positive control (love/amen/fire/praise, media_reactions 0042) from sibling lane local_ad147f53; REUSE across music + public sermons + lessons + every video surface; private records get no community reactions. (3) VOICE DICTATION - one hook (voice-dictation.js useVoiceDictation). (4) 4D FINALIZER - the deep->plain->benefits shape extracted once from study-space.js, shared by Study distillation AND the engine''s lesson structuring. WE CHOSE one-primitive-many-surfaces, NOT a per-surface stack, BECAUSE the directive is consolidation and DR-0078 puts shared primitives in core.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-unified-engagement-primitive', 'decision',
     'Shared engagement primitive: reactions -> ratings -> most-loved -> stations (one primitive, many surfaces)',
     'BEST WAY (Darrell 2026-06-24): the music section''s engagement pattern is NOT music-only - it is ONE layered shared primitive applied to BG''s sermons and everything community-visible that makes sense, never forked. FOUR composable layers: (1) REACTIONS - positive child-safe control (love/amen/fire/praise; love=save/favorite; no negative reactions), one row per item in media_reactions 0042 keyed by {surface,item_type,item_id}; (2) COMMUNITY RATINGS - per-item signal aggregated from reactions; (3) MOST-LOVED - a sort/view over any collection (orders DISCOVERY, never ranks truth by popularity); (4) STATION - optional continuous-play queue from the ranked pool, re-ranks live, credits the creator, PLAYABLE MEDIA ONLY, USER-INITIATED (no autoplay/autonomous automation). A surface composes only the layers that fit. Reuse local_ad147f53; align with feedback-sync vocab. Constraints: positive/child-safe only; clean/Christ-centered/profanity-free pool where policy applies; PIN-optional-community-default scoping (sovereign, never sold); promote-the-creator (speakerKey for sermons); discovery-not-doctrine. THE CALL: FULL (4 layers) = Worship, The Word public sermon library (Most-Loved Sermons station), church public videos/stream/clips. REACT+RATE+MOST-LOVED (station conditional/none) = Learn lessons/courses (station only for standalone playable lessons), Choir songs (choir-scoped), Books/Library (no station). SUPPORT-REACTION-ONLY = pastoral/prayer content (🙏 only; no ranking - inappropriate to rank prayer by popularity). EXCLUDED = Study + Eternal Algorithms, private Sermon Stories, private Creation docs, all financial/ops/admin surfaces. BOUNDARY: community-visible content only - private->publish-first, pastoral->support-react-only, operational->none. WE CHOSE one layered primitive composed per-surface, NOT music-only and NOT a per-surface stack, BECAUSE the mechanism is identical everywhere - one implementation keeps surfaces consistent, child-safe, and creator-promoting.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now()),

    (gen_random_uuid(), v_instance, NULL, 'dc-unified-zero-loss-migration', 'directive',
     'Zero-loss, conference-safe migration to the unified surfaces',
     'BEST WAY: migrate on the surface-mount registry with ZERO feature loss, incrementally, behind the safety gates, nothing risky before July. Phase 0 registry foundation (DR-0078 step 1) -> Phase 1 extract the four shared primitives to core -> Phase 2 build the unified surfaces one at a time, priority-ordered: BUILD #1 Sermon Stories first, then The Study (de-toggle+auto-populate), The Content Engine cockpit (ships inert), Learn & Library (Books shelf), Worship -> Phase 3 registry-migrate + decompose using the conflict-loop hot-file queue. ADDITIVE-FIRST: new behavior lands alongside the old until a feature-parity checklist (verified against the LIVE surface) is green, THEN the old fragment is removed in the same PR. Gates not claims. Tier C for COLG-facing / engine cockpit / Worship. WE CHOSE additive parity-checklisted migration, NOT a big-bang refactor, BECAUSE Verification Doctrine (DR-0076) requires characterizing before changing, and conference-safety (DR-0078) forbids risky pre-July moves.',
     '["unified-surfaces-2026-06"]'::jsonb, 'shared', 'open', '{"dr_ref":"DR-0079"}'::jsonb, '{}'::jsonb, 'darrell', now(), now());

END $$;
