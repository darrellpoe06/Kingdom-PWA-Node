# Consolidation + IA Design — One Unified Surface Per Area

**Date:** 2026-06-24
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Status:** DRAFT design doc for Darrell's review. Quality gate, not a hold parked on Darrell.
**Layer:** 3 (reference) per ICM. Read with `CLAUDE.md` (Layer 0), `MODULE-ARCHITECTURE-ADR.md` (the surface-mount architecture), and `PROJECTS-TAB-COHERENCE-REVIEW.md` (the sibling "system mountain" IA cleanup).
**Decision record:** DR-0079.
**Pattern:** research-first → current-vs-target map → unified-surface design → zero-loss migration plan. **No live UI refactor in this pass** — this is the design that precedes the build.

---

## Darrell's directive (the why)

> "all these inputs need to be considered and consolidated into one per page that does everything in one."

This session spec'd many capabilities across several lanes. Left as-is they would ship as **scattered fragments** the user has to bounce between — a capture box here, a finalizer there, a library on a third tab, reactions wired five different ways. The directive is to fold each area's pieces into **ONE cohesive surface that does everything for that area** — capture, finalize, present, library, react, publish — on one page, built as a clean module on the hybrid-modular surface-mount architecture (DR-0078) so consolidation means **shared primitives, not forks**.

This doc is the content/teaching counterpart to `PROJECTS-TAB-COHERENCE-REVIEW.md` (which consolidates the *system/governance* surfaces — Discussions/Concerns/Decisions/Review/Loops/Build). The two together cover the app's IA cleanup; they are complementary and must not collide (this doc owns the **teaching/content** mountain; that doc owns the **system** mountain).

---

## The inputs being consolidated (this session's lanes)

| Input | Lane | What it is |
|---|---|---|
| Study + 4D finalizer + auto-populating Eternal Algorithms | `local_bc755236` | Private capture → distillation (deep source → plain → benefits) → derived algorithm library |
| BG's Sermon Stories library | `local_c119ab7a` | BG's reusable illustration library, extracted from sermons (BUILD #1) |
| The unified content engine | (research-review pipeline) | recordings + conversations → lessons → curriculum → books → marketing |
| The Christian music / Worship section | `local_9140a64c` | Christ-centered library, lyrics-as-curriculum, reactions, radio, promote-Yahweh-promoters |
| The generalized Presenter | (Universal Presenter, on main) | Each lesson/message presents itself; time-adaptive; one primitive across surfaces |
| App-as-cockpit on the CUDA boxes | (research-review §3/§7) | The app operates everything, running on the GPU boxes |
| The shared engagement/reaction primitive | `local_ad147f53` | ONE reaction control across music + sermons + lessons + video (sibling lane — reuse, don't fork) |

---

## Part 1 — GROUND: the current IA (what exists today)

Verified by reading `app/src/poe-financial-mvp-v28.jsx` (the monolith, ~9.5k lines), the component/lib tree, and `MODULE-ARCHITECTURE-ADR.md`.

### 1.1 Top-level nav (15 surfaces)

`overview` (Big Picture) · `books` (financial ledger) · `inbound` · `rentals` · `projects` · `practice` · `opportunities` (Dev/Ops) · `about` · `notes` (Thinking Space) · `create` (Creation Workspace) · `study` · `church` · `markets` · `center` (Command, Control & Serve / C2S) · `admin`.

Mount pattern today: a hard-coded import block + a `{view === 'id' && <Component/>}` render switch in the monolith. **Every recorded monolith collision was this mount-wiring** (DR-0078), not the components — which already live in separate files.

### 1.2 Church sub-tabs (9)

`home` (Church) · `engagement` · `choir` · `pulpit` (The Word — Migdal) · `learn` (ChurchLearn) · `conference` · `events` (Venues) · `videowall` (staff) · `observe` (staff).

### 1.3 The surfaces touched by the inputs (current state)

| Surface | File(s) | What it does today | Fragment problem |
|---|---|---|---|
| **Study** | `components/Study.jsx`, `lib/study-space.js` | Private (Darrell+Christina+BG) device-local rooms: Reflections / Processing / Research; deep↔plain distillation per entry. **A space toggle** flips between "Workspace" and "Eternal Algorithms." | Two surfaces behind a toggle; the finalizer (deep→plain→benefits) and the algorithm library are conceptually one flow but presented as separate spaces. |
| **Eternal Algorithms** | `components/EternalAlgorithms.jsx`, `lib/eternal-algorithms.js` | Library of biblical patterns: 4D source ↔ 3D expression ↔ first-class OUTCOME; seeded; cross-links to Study reflections. | Lives behind the Study toggle; **does not auto-populate** from finalized reflections — entries are hand-authored/seeded. |
| **The Word — Migdal** | `components/Pulpit.jsx`, `lib/pulpit-prep.js` | Public sermon library (RPC over `choir_sermons`) + leadership prep (corpus retrieval over BG's history) + speaker roster (canonical `speakerKey`). | No Sermon Stories surface yet; illustrations are buried in full sermons. |
| **ChurchLearn** | `components/ChurchLearn.jsx`, `lib/learn-framework.js`, `church-classes.js`, `broadcast-class.js` | Two courses (A.I. The Way, The Broadcast); skill-levels + age-bands + real assessment + graduate→helper; plays through the Presenter. | No downloadable book/library shelf; the content engine's outputs have no consumption home beyond the two hand-authored courses. |
| **Presenter** | `components/Presenter.jsx`, `lib/presentable.js`, `lib/teach-present.js` | Universal two-window present mode (audience + presenter-notes, no-leak; time-adaptive). Used by courses, The Word, Study, Conference, Documents. | Already a shared primitive — the consolidation must keep it ONE, consumed via adapters, never forked per surface. |
| **Music / Worship** | (spec only) `docs/.../2026-06-23-christian-rap-hottest-worship-section-spec.md` | Not built. Spec'd as a new `worship` Church sub-tab: curated YouTube grid, multi-type shelves, lyrics-as-curriculum, radio stations, artist promotion. | Greenfield — design it unified from the start, don't ship fragments. |
| **Reaction primitive** | `components/shared.jsx` (spec'd), `lib/feedback-sync.js` | ONE positive reaction control (love/amen/fire/praise), `media_reactions` table 0042, applied across songs + every video surface. | Being built in sibling lane `local_ad147f53` — reuse it, do not fork a per-surface reaction stack. |
| **Content engine** | `infra/nas-sme-pipeline/`, seed docs, scattered | The pipeline spine exists as infra + a research-review survey + in-app best-way docs; **no operator surface** in the app. | The cockpit (Sources→Build→Review→Publish) has no single home — it's a concept, not a page. |

### 1.4 The hybrid-modular target (DR-0078, the architecture we build ON)

A small **stable shell/core** (shell + **surface-mount registry** `app/src/surfaces.js`, auth/session, role-gating, the Operations/Events spine, design system + shared primitives, instance-scoped sync) + **independent feature modules**. Mounting a surface becomes a **data entry** — `{ id, label, nav, requires:{role,tier,flag}, boundary, load:()=>import('./components/X.jsx') }` — not a code edit to a shared switch. Modules never import each other's internals; interdependence flows through core + the Events spine (boundary gate enforces it). **Conference-safe: planning only, nothing risky ships before July.**

This is the substrate every unified surface below is built on: each unified surface = one clean module + one registry entry; the shared primitives (Presenter, reaction, voice, 4D-finalizer) live in core and are consumed, not copied.

---

## Part 2 — DESIGN: the unified surfaces (one page that does everything)

The inputs cluster into **five unified surfaces + four shared core primitives**. Each unified surface is a single cohesive page that runs its area's whole flow; each is a clean feature module mounted via the registry.

### The mapping at a glance

```
  SHARED CORE PRIMITIVES (one each, consumed by all — never forked)
  ├─ Presenter (present mode)         ── every teachable surface presents through it
  ├─ Engagement/Reaction (love/amen/fire/praise) ── music + sermons + lessons + video
  ├─ Voice dictation (type-or-speak)  ── every input
  └─ 4D Finalizer (deep→plain→benefits) ── Study distillation + lesson structuring shape

  FIVE UNIFIED SURFACES (one page per area, each a feature module)
  ├─ A. THE STUDY        (private circle)  capture → finalize(4D) → Eternal Algorithms → hand-off to engine
  ├─ B. THE WORD — Migdal (church staff)   library → prep → Sermon Stories → present
  ├─ C. THE CONTENT ENGINE (governor)      Sources → Build → Review(gate) → Publish → Outputs  [app-as-cockpit on CUDA]
  ├─ D. LEARN & LIBRARY  (church / all)    courses → lessons → books shelf, all via Presenter
  └─ E. WORSHIP          (church / all)    library/shelves → radio → react → lyrics-as-curriculum → promote artist
```

The content engine (C) is the **producer**; The Study (A), The Word (B), Learn & Library (D), and Worship (E) are where its inputs come from and its outputs land. The four core primitives are the connective tissue that keeps all five consistent.

---

### Surface A — **The Study** (private; Darrell + Christina + BG)

**Absorbs:** Study Workspace (Reflections/Processing/Research) + Eternal Algorithms (de-toggle) + the 4D finalizer + the content-engine conversation-source selection. **Eliminates:** the Workspace ↔ Eternal Algorithms space toggle.

**The one page does everything, top to bottom as one flow:**

1. **Capture** — the three rooms (Reflection / Processing / Research) with voice dictation (the shared voice primitive). Paste-in composer for deep exchanges. *(Today's Workspace, kept.)*
2. **Finalize (the 4D finalizer)** — each entry's spine: **deep source → plain distillation → benefits/outcome.** The finalizer enforces the pairing (deep + plain) and adds the third beat the directive named — the **benefits/outcome** — making each finalized entry a complete 4D→3D→OUTCOME object. Distill-state badges nudge incomplete entries (already present; extended with the benefits beat).
3. **Eternal Algorithms — auto-populated.** When an entry is finalized into the deep→plain→benefits shape, it **becomes (or proposes) an Eternal Algorithm** automatically: `fourD = deep source + scripture`, `threeD = plain distillation`, `outcome = benefits`. The library stops being a separate hand-authored toggle and becomes the **derived crystallization of finalized reflections** — one flow, capture → finalize → it shows up in the library. Hand-authoring and the seeds still work; auto-population is additive.
4. **Hand-off to the Content Engine (opt-in).** A finalized reflection can be selected — explicitly, per item — as a source for the content engine (conversations→lessons). **Private-by-default is the senior gate** (Study thinking space is his most private processing; process-don't-store binding): nothing auto-publishes; Darrell *picks* what becomes a lesson.

**Why one surface:** capture, finalize, and the algorithm library are three beats of a single motion (raw thought → distilled truth → reusable pattern). The toggle today hides that they are one flow. Merging them makes the deep→plain→benefits finalizer the visible spine and the algorithm library the natural output of finishing an entry.

**Module:** `surfaces.js` entry `{ id:'study', requires:{flag:'study-circle'}, load:()=>import('./components/Study.jsx') }`; `EternalAlgorithms` becomes an in-module section, not a peer toggle. Stays device-local/sovereign (no cloud) per the existing posture.

---

### Surface B — **The Word — Migdal** (church staff-gated; BG owns)

**Absorbs:** Pulpit (library + prep) + **BG's Sermon Stories** (BUILD #1). **Eliminates:** the need for a separate sermon-illustration surface.

**The one page does everything sermon-related:**

1. **Library** — the chronological sermon archive (public RPC `theword_public_sermons` over `choir_sermons`), searchable by title/scripture/speaker, inline video, canonical `speakerKey` attribution. *(Today, kept.)*
2. **Prep** — corpus retrieval over BG's message history (real retrieval, no fabrication). *(Today, kept.)*
3. **Sermon Stories (new, BUILD #1)** — a new sub-section/tab within The Word: BG's reusable **illustration library**. Each story = the anecdote (his words, faithful, not fabricated) + point/moral + scripture/theme (faithfulness-gate verified) + source sermon + date + timestamp (jump-back) + `speakerKey`. Searchable/filterable by theme/scripture/topic. Two parts: (1) **reuse-from-old** — auto-extract discrete stories he actually told from the sermon corpus; (2) **new-story sourcing aid** (optional, curated, attributed). **BG verifies before a story is kept** (model surfaces candidates; the preacher decides). **Access scope:** trusted-steward set — owner BG (read/write/curate, makes the grants), shared read/use for Darrell + Christina; enforced by a named subgroup predicate (`user_in_sermon_stories_stewards`), narrower than the broad instance-member check, modeled on the Choir `user_in_choir` pattern. Private-by-default within the set (stories may name people; Presidio scrub + no-leak filter).
4. **Present** — any sermon or story presents through the shared **Presenter** (audience + presenter-notes, no-leak).

**Why one surface:** the library, the prep tool, and the illustration library all read the same corpus (`choir_sermons`) and serve the same person (BG) for the same job (preparing and delivering the Word). They belong on one page: find a message → study the corpus → pull a reusable story → present.

**Module:** extend `Pulpit.jsx` (the existing `theWordTabs`) with a `stories` sub-tab — **extend, not a new top-level surface** (ties to the prior BG-study lane). New code = the story-extraction prompt + the sub-tab + the steward-scope predicate.

---

### Surface C — **The Content Engine** (Governor-gated operator cockpit; app-as-cockpit on CUDA)

**Absorbs:** the scattered pipeline conception (infra + survey + best-way docs) into ONE operator surface. **This is the new unified surface the directive most needs** — today the engine is a concept with no page.

**The one page runs the whole production pipeline (the cockpit):**

1. **Sources** — pick the input: church recordings (NAS ∪ YouTube, reconciled) **or** in-app conversations (Study reflections, Discussions, chat-in, family-voice — opt-in per item, private-by-default).
2. **Reconcile / Retain** (recordings) — NAS-original ∪ YouTube match, keep-best-of-one with matched-pair provenance.
3. **Build** — transcribe (faster-whisper on CUDA, scripture-aware prompt) → structure into a `MODULES`-shaped lesson (objectives / segments / anchor refs / the Body's contributions / trivia). Runs **on the CUDA box**: the app instance opens locally on the GPU machine and drives the local GPU + local recordings; operating the pipeline = clicks that become local API calls. CPU-now works (slow); GPU accelerates.
4. **Review (the gate)** — faithfulness gate (every quoted verse checked vs canonical KJV/ESV; matched-pair cross-check) **and** consent scrub (Presidio + human backstop) in one review queue. **Nothing publishes with an open faithfulness or consent flag.** Governor-gated.
5. **Publish — fan-out to the consuming surfaces.** One transcript → several outputs in parallel: a **lesson** (→ Learn & Library), material toward **curriculum → books** (→ Learn & Library shelf), BG's **Sermon Stories** (→ The Word), trivia (→ Engagement). The compile chain lessons → curriculum → books → marketing assets is operated here, each arrow behind the same three brakes + the same Governor gate.
6. **Monitor** — run state, the three brakes (budget ceiling / single-instance concurrency lock / kill-switch), event reel, vendor summons. Ships **inert** (kill-switch engaged); Tier C, never self-activates unattended (the three-brakes rule).

**Why one surface:** the producer of all teaching content is a single pipeline with one set of brakes and one review gate. Scattering its stages across Study, ChurchLearn, and infra scripts would re-create the fragmentation. The cockpit is the **operator seat**; the consuming surfaces (B/D/E) are where outputs *land*, not where they're *made*.

**Placement + module:** Governor-gated feature module mounted via the registry, **composed into Command, Control & Serve (C2S)** — the steward seat that already composes OpsBoard / QualityProof / WakeOrchestrator / ConflictLoop. This keeps the app-as-cockpit principle coherent (one steward seat operates everything) and avoids a peer top-level surface. The engine's own page is reachable inside C2S's Command/Control sections. *(Decision-with-rationale: it could be a standalone Governor surface; composing it into C2S is the better-aligned call because app-as-cockpit and C2S are the same idea — the steward operating the system from inside the app.)*

---

### Surface D — **Learn & Library** (church / all signed-in)

**Absorbs:** ChurchLearn (courses) + the new **downloadable Books/Library shelf**. **Resolves a premise conflict:** the app's existing top-level **"Books" tab is the financial ledger** (accounting), NOT a publishing shelf — the curriculum-book library must **not** be bolted onto it. It homes here, in the Learn area where the curriculum already lives.

**The one page does everything for consuming taught content:**

1. **Courses** — the authored + engine-produced courses (skill-levels, age-bands, real assessment, graduate→helper). *(Today's ChurchLearn, kept.)*
2. **Lessons** — individual engine-produced lessons (from recordings or conversations), playable standalone.
3. **Library / Shelf** — downloadable **books** (PDF/EPUB) compiled from curriculum. Export via the zero-dep `CreationWorkspace` print-CSS→PDF primitive (MVP); jsPDF/JSZip later. **Owned content only** (no copyrighted lyrics/text; derived data only). **No payment build** — packaging only; money is Darrell's hand.
4. **Present** — every course/lesson/book presents through the shared **Presenter**; every item carries the shared **reaction** control.

**Why one surface:** courses, lessons, and books are the same content at three compile altitudes (lesson → curriculum → book), all consumed by the same learner, all played through the same Presenter. They are one shelf, not three tabs.

**Module:** extend `ChurchLearn.jsx` into a `learn` module with a `library` sub-section; the Books shelf reuses `creation-workspace.js` export. Registry entry under `nav:'church'`.

---

### Surface E — **Worship** (church / all signed-in)

**Greenfield — design unified from day one.** A new `worship` Church sub-tab. **The one page does everything music:**

1. **Library / shelves** — multi-type, Christ-centered first: Christian rap/hip-hop · R&B · gospel · worship, plus personal **"Your Music"** favorites (the ❤️ reaction doubles as the save signal). Curated, admin-editable, content-vetted + age-tagged before anything surfaces (child-safety binding — twins are 10; profanity is the hard exclusion).
2. **Radio stations** — continuous auto-play ranked by community ratings: **"Most Loved"** flagship + per-type radios + a personal "Your Favorites" radio. Profanity-free + Christ-centered-only pool. User-initiated (no autonomous automation).
3. **React** — the shared **reaction primitive** (love/amen/fire/praise) — same control as sermons/lessons/video; feeds favorites + most-loved ranking.
4. **Lyrics-as-curriculum** — each song carries an educational-data layer (scripture refs, themes, vocabulary, theology, kid discussion questions) pitched age-appropriately, to **form children in The Way** — Proverbs 22:6 is the section's mission. **Copyright bright line:** derived teaching data only; full copyrighted lyrics never stored/displayed without a license.
5. **Promote the artist** — each artist gets an outbound promotable presence (channel/site/socials/where-to-support) + a featured rotation — "promote those promoting Yahweh." **No payment processing built by us** (outbound visibility only).

**Why one surface:** play, react, learn-from, and promote are one continuous experience around a track — splitting them across tabs would break the flow that forms a child and uplifts an artist in the same moment.

**Module:** new `Worship.jsx` feature module; reuses Choir's curated-list + YouTube-embed pattern, `church-live` embed helpers, `learn-framework` age-band for the kids-safe filter, `freshness` dot. Registry entry under `nav:'church'`. Builds **nothing new** beyond the shelf/radio UI — it consumes the shared reaction + age-band + embed primitives.

---

### The four shared core primitives (consistency, not forks)

| Primitive | Lives in | Consumed by | Consolidation rule |
|---|---|---|---|
| **Presenter** (`Presenter.jsx` + `presentable.js`) | core/shared | Learn lessons, The Word sermons + stories, Study, Conference, Books | ONE present mode; surfaces supply a pure `presentable` adapter (scenes = audience + presenter-notes), never fork the renderer. |
| **Engagement primitive** (`shared.jsx` + `lib/engagement-primitive.js` + `feedback-sync.js` + `media_reactions` 0042) | core/shared | Worship, The Word public sermons, church videos/stream, Learn lessons/courses, Choir songs, Books/Library, pastoral content (limited) | The **layered** primitive: **reactions → community ratings → most-loved ranking → optional continuous-play station.** ONE implementation built in sibling lane `local_ad147f53` — **reuse, never fork.** Each surface composes only the layers that fit. Full spec + surface matrix below. |
| **Voice dictation** (`lib/voice-dictation.js` → `useVoiceDictation`) | core/shared | Study capture, every free-text input | ONE hook; don't re-copy. |
| **4D Finalizer** (deep→plain→benefits) | core/shared (extracted from `study-space.js`) | Study distillation **and** the content engine's lesson-structuring shape | The deep-source→plain-teaching motion is the same 4D→3D motion the engine uses to structure a lesson and that Eternal Algorithms encodes — extract it once so Study and the engine share the finalizer's shape, not two implementations. |

---

### The Engagement Primitive — reactions → ratings → most-loved → stations (one primitive, many surfaces)

**Darrell's directive (2026-06-24):** the music section's engagement pattern — REACTIONS + COMMUNITY RATINGS + MOST-LOVED ranking + RADIO/continuous-play STATIONS — is **not a music-only feature.** It is a **single shared primitive** applied to BG's sermons and "everything possible that makes sense," composed consistently, never forked per surface. This is core to "one surface does everything": every content surface composes the same engagement primitive.

#### The four layers (composable — a surface takes only what fits)

```
  LAYER 1  REACTIONS        positive, child-safe control (❤️ love · 🙏 amen · 🔥 fire · 🙌 praise)
           (per item)       love doubles as the save/favorite signal. No negative reactions, ever.
              │  aggregate
              ▼
  LAYER 2  COMMUNITY        per-item rating signal derived from reactions (count + weight),
           RATINGS          scoped to the community (PIN-optional-community-default).
              │  rank a collection
              ▼
  LAYER 3  MOST-LOVED       a sort/view over any collection ordered by the rating signal.
           RANKING          Orders DISCOVERY ("find it faster"), NEVER ranks truth by popularity.
              │  feed a queue
              ▼
  LAYER 4  STATION          optional continuous-play queue that auto-fills from the ranked pool
           (continuous play) and re-ranks live. PLAYABLE MEDIA ONLY. USER-INITIATED (no autoplay
                            without a gesture; no autonomous automation — the three-brakes posture).
```

A surface composes **layers 1–N**: a text-only collection stops at most-loved (nothing to continuously play); a playable-media collection runs all four. Same code, different composition — that is what "not forked" means.

#### The shared component design (core module)

- **Identity contract** — every reactable item is addressed by `{ surface, itemType, itemId }`. This is what lets one primitive attach to songs, sermons, videos, lessons, and books without per-surface tables.
- **Layer 1 — `<Reactions item={ref} set={...} scope={...} />`** (`shared.jsx`): the positive control. Writes one row to `media_reactions` (0042: `{ id, instance_id, user_id, surface, item_type, item_id, reaction, created_at }`). `love` is also the favorite/"Your Music" save. Reuses `feedback-sync.js` rating vocabulary — **align, do not duplicate.**
- **Layer 2 — `useRatings(ref)` / `media_reaction_counts`** (`lib/engagement-primitive.js`): aggregates reactions into a per-item signal (a count view; weighting tunable). RLS: community-scoped read, self-write, owner moderation.
- **Layer 3 — `rankByLove(items)` + `<MostLovedSort>`**: a pure selector + a sort/view toggle any collection drops in to get a "Most Loved" ordering.
- **Layer 4 — `<Station name pool={rankedItems} />`**: the continuous-play queue. Auto-fills from the ranked pool, re-ranks live as reactions arrive, credits + links the creator on every now-playing entry. Mounts **only** for playable media; **user-initiated** (a tap starts it — never autoplay; no clock-driven automation).

#### Constraints baked into the primitive (not per-surface afterthoughts)

- **Positive + child-safe set only** — love/amen/fire/praise (+ a pastoral 🙏 "praying" variant, below). No negative/down reactions anywhere. Twins are 10; the set is safe by construction.
- **Clean / Christ-centered / profanity-free pool** governs ratings + stations **where content policy applies** (music, sermons): secular-clean never plays on a station; a track/clip not vetted does not enter the pool.
- **Scoping = PIN-optional-community-default** — engagement is community-scoped by default (per instance), private/owner records are excluded by construction (they aren't community-visible). Engagement data is the community's own, sovereign, never sold (DATA-AS-EMPOWERMENT).
- **Promote-the-creator** — most-loved entries + now-playing credit and link the creator (artist; speaker via `speakerKey`). The ranking uplifts the people promoting Yahweh, it doesn't just sort.
- **Discovery, not doctrine** — most-loved is a find-it-faster signal; it never asserts that the most-reacted teaching is the most true. Doctrine/pastoral content is **never popularity-ranked** (see the pastoral carve-out below).

#### Which surfaces get it — the call (rationale documented; not bounced to Darrell)

| Surface | L1 React | L2 Rate | L3 Most-Loved | L4 Station | Rationale |
|---|:--:|:--:|:--:|:--:|---|
| **Worship / Music** | ✅ | ✅ | ✅ | ✅ | The origin pattern. "Most Loved" + per-type + "Your Favorites" radios; profanity-free Christ-centered pool. |
| **The Word — Migdal — public sermon library** | ✅ | ✅ | ✅ | ✅ | "Most-Loved Sermons" station (continuous sermon playback); credits BG via `speakerKey`. Discovery only — never ranks the Word by popularity. |
| **Church public videos / stream / clips** (Church-Live, past-service videos) | ✅ | ✅ | ✅ | ✅ | Playable community media; "Most-Loved Services/Clips" station. |
| **Learn — lessons / courses** | ✅ | ✅ | ✅ | ⚠️ cond. | Reactions + most-loved aid discovery of lessons. Station ONLY for standalone playable lessons — a structured course path is sequential, not a shuffle pool, so no station over a course. |
| **Choir — songs** (worship-team) | ✅ | ✅ | ✅ | ➖ opt | **Choir-member-scoped** (not the public community) — helps the team see/pick loved songs. Station optional/low-value for a coordination surface. |
| **Books / Library** (downloadable) | ✅ | ✅ | ✅ | ❌ | "Most-loved books" aids discovery; books are not continuous-play media, so no station. |
| **Pastoral content** (prayer requests, Church home prayer board) | ⚠️ 🙏-only | ❌ | ❌ | ❌ | A **support reaction only** (🙏 "praying for this") — genuine care. **No ratings, no most-loved, no station:** ranking prayer/pastoral content by popularity is inappropriate and would wound. Deliberate carve-out. |
| **Conference** (session content) | ✅ | ✅ | ➖ | ❌ | Reactions/ratings on published session recordings; when conference content is published into The Word/Learn it **rides those surfaces** rather than duplicating. Low priority. |
| **Video Wall — *content* vs *project tracker*** | content✅ | content✅ | content✅ | content✅ | The wall *displays* a most-loved worship/scripture station (content). The CapEx **project-tracking** surface itself gets nothing — it's a facilities tracker, not a content collection. |

**Excluded by design (not community-visible content, or not content at all):**
- **The Study + Eternal Algorithms** — private (Darrell+Christina+BG), device-local. No community engagement; not community-visible.
- **BG's *private* Sermon Stories** — private within the steward set. If BG shares a story into a public lesson, engagement rides **that public lesson**, not the private record.
- **Creation Workspace private documents** — until/unless published to a community surface (then they ride that surface).
- **All financial / ops / admin surfaces** — Books (financial ledger), Markets, Rentals, Projects, Inbound, Dispatch, Admin. Not content collections; the primitive does not apply.

**The boundary rule (one line):** the engagement primitive attaches to **community-visible content collections**; it never attaches to **private records, pastoral content beyond a support reaction, or operational surfaces.** Private → publish-first; pastoral → support-react-only; operational → none.

---

## Part 3 — Current → Target IA map

### Top-level nav

| Today | Target | Change |
|---|---|---|
| `study` (Workspace ⇄ Eternal Algorithms toggle) | **`study`** (capture → finalize → Eternal Algorithms, one flow) | De-toggle; merge into one module. |
| `church` → `pulpit` (The Word) | `church` → **`pulpit`** (+ Sermon Stories sub-tab) | Extend with BUILD #1. |
| `church` → `learn` (ChurchLearn) | `church` → **`learn`** (+ Library/Books shelf) | Extend with the books shelf (NOT the financial Books tab). |
| *(none)* | `church` → **`worship`** | New unified music surface. |
| *(scattered: infra + docs)* | **Content Engine** (composed into `center`/C2S) | New unified operator cockpit. |
| `books` (financial ledger) | `books` (financial ledger) | **Unchanged** — name-collision resolved: publishing lives in Learn & Library, not here. |

### What gets eliminated / merged

- **Study Workspace ⇄ Eternal Algorithms toggle** → one Study flow (capture → finalize → derived library).
- **"Books" overload** → the financial `books` tab keeps its meaning; the publishing/library shelf homes in Learn & Library. No second tab named "Books."
- **Per-surface reaction wiring** → one shared reaction primitive (`local_ad147f53`), consumed by all media surfaces.
- **Per-surface present modes** → one Presenter, consumed via adapters.
- **The content-engine "where does it live" ambiguity** → one cockpit, composed into the steward seat (C2S).

### Coordination with the sibling "system mountain" cleanup

`PROJECTS-TAB-COHERENCE-REVIEW.md` relocates Build/Decisions/Loops into C2S and merges Review→Loops. This doc adds the **Content Engine** cockpit into that same C2S steward seat. Both are consistent: **C2S is the one operator seat; everything the steward operates is composed there.** No collision — that doc owns Projects/governance surfaces; this doc owns teaching/content surfaces; both feed C2S.

---

## Part 4 — Zero-loss migration plan (build on DR-0078, conference-safe)

**Principle:** migrate to the unified surfaces with **zero feature loss**, incrementally, on the surface-mount registry. Each step is independently shippable, behind the existing safety gates (leak/lockout/tests/a11y), and **nothing risky ships before the July conference** (DR-0078 conference-safe constraint). Each migration carries a **feature-parity checklist** verified against the live surface (Verification Doctrine — characterize before change; measure, don't claim).

### Phase 0 — Registry foundation (infra; after conference per DR-0078)

- Introduce `app/src/surfaces.js`; the monolith iterates it once. The import-block + render-switch choke-points are **frozen** after this. *(This is DR-0078 step 1 — prerequisite for everything below; not gated on this doc.)*

### Phase 1 — Shared primitives extracted to core (no surface moves yet)

1. **4D Finalizer** — extract the deep→plain→benefits shape from `study-space.js` into a shared core module; Study consumes it unchanged (parity check: every existing reflection still renders + distill-state badges unchanged).
2. **Reaction primitive** — land `local_ad147f53`'s shared control in `shared.jsx` + `media_reactions` (0042). Parity: no existing surface loses its current feedback behavior.
3. **Presenter** — confirm all current present-mode surfaces route through the one `Presenter` via adapters (audit `presentable.js` consumers; no fork remains).

*Zero loss:* these are additive extractions; the surfaces keep behaving identically. Each ships when its parity checklist is green.

### Phase 2 — The unified surfaces, one at a time (priority-ordered)

Build order follows the content-engine timeline's priority (BUILD #1 first) and the cheapest-highest-value path:

1. **The Word + Sermon Stories (BUILD #1)** — add the `stories` sub-tab to `Pulpit.jsx`; story-extraction prompt; `user_in_sermon_stories_stewards` scope. *(~3–5 build days CPU; rides one `sme-pipeline` transcript. No church-NAS access, no GPU.)* **Parity:** existing library + prep untouched; stories are purely additive.
2. **The Study (de-toggle + auto-populate)** — merge the Workspace and Eternal Algorithms into one flow; auto-populate algorithms from finalized entries. **Parity checklist:** every existing reflection, every seeded + hand-authored algorithm, the search, the voice capture, the device-local sovereignty — all preserved; the toggle's two views become one scroll, nothing dropped.
3. **The Content Engine cockpit** — the operator surface composed into C2S; Sources → Build → Review → Publish → Monitor; ships **inert** (kill-switch engaged), Tier C. Starts CPU-now (conversations→lessons, P1) and grows into the CUDA phases (P5/P6/P7) as hardware lands.
4. **Learn & Library** — add the Library/Books shelf to the `learn` module (print-CSS→PDF export). **Parity:** both existing courses, assessment, graduate→helper, Presenter playback — all preserved.
5. **Worship** — new module; greenfield, so "zero loss" = ship the unified design (library + radio + react + lyrics-as-curriculum + promote) rather than a fragment. Child-safety gate + content-vetting are part of step one, not a follow-up.

### Phase 3 — Registry migration + decomposition (DR-0078 steps 2–5)

- Migrate each unified surface onto the registry as it stabilizes; peel it out of the monolith into its clean module. Use the conflict-loop's ranked hot-file output as the work queue. Add the boundary gate (core must not import features; features must not import each other's internals). The monolith trends toward a thin composition root.

### Zero-loss guarantees (the discipline)

- **Characterize before change:** before merging/moving any surface, pin what it actually does (the parity checklist) against the live surface — not memory.
- **Additive-first:** new unified behavior lands alongside the old until parity is verified, then the old fragment is removed in the same PR that proves the new one.
- **Gates, not claims:** tests (1298+ vitest) + build + wf36 + a11y/contrast gates must be green; "looks done" is not a status (Verification Doctrine, DR-0076).
- **Conference-safe:** anything touching the front door / COLG-facing surfaces / real money is Tier C and soaks; nothing risky ships before July.

---

## Part 5 — The through-line (why this is one coherent design, not five tasks)

Everything above is one idea expressed five times: **a surface is where a real flow runs, and the app is the one place it all comes together** (DR-0061, DR-0065). The content engine *produces*; The Study, The Word, Learn & Library, and Worship are where its inputs originate and its outputs are taught; the four core primitives keep them consistent; and the whole thing is operated from inside the app, on the CUDA boxes, from the steward seat (app-as-cockpit). Consolidating the session's fragments into these five surfaces + four primitives is the directive — *"one per page that does everything in one"* — made concrete on the hybrid-modular architecture, so consolidation is reuse, not forking.

---

## Provenance + honest flags (Verification Doctrine)

- The current-IA map was read from `poe-financial-mvp-v28.jsx` and the component/lib tree this session (file:line cited in Part 1).
- The in-flight specs (Sermon Stories §16, content engine §12–§16, music spec) were read from the committed research-review + spec docs on this branch; lanes `local_ad147f53` (engagement primitive) and `local_3e189506` (IA cleanup) are **in-flight siblings** — this design coordinates with their specs and must be reconciled at integration, not assumed merged.
- **Church-NAS holdings remain `pending inventory`** (no read-only access this session) — the content-engine recordings phases (P5+) depend on that access, a his-hand credential step.
- This is a **design doc, not a build** — no live UI was refactored. The build is the migration plan in Part 4, gated by the parity checklists.
