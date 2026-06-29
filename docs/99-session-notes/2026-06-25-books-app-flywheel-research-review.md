# Books ↔ App Flywheel — research-review + first build increment (2026-06-25)

> Darrell's vision: *"produce books that are supported by the PoeTech app in some
> way or ways, to keep interactions and interest, market the business, and have
> the learning content feed the development of the app and the skills of the
> community and the PoeTech app."*

A **books ↔ app flywheel**: books are made FROM the corpus the family and
community already created, and they read the reader straight back INTO the live
app. This note records (1) what content-production capability already existed,
(2) the publishing/format decision, (3) the four-loop flywheel design, and
(4) the first build increment that shipped.

---

## 1. Ground — what already existed (reused, not rebuilt)

| Capability | Where | Reused as |
| --- | --- | --- |
| Authored curriculum (the conversations→lessons→curriculum path) | `lib/learn-framework.js`, `lib/church-classes.js`, `lib/living-lessons-class.js`, `lib/sovereign-ai-class.js` — the MODULE shape (`bigIdea`, `lesson`, `anchor`, `benefits`, `levels`, `facilitator`) | Book **chapters** via `lessonModuleToSource` |
| Eternal Algorithms (4D/3D framework↔outcome library) | `lib/eternal-algorithms.js` (`SEED_ALGORITHMS`, device-local `loadLibrary`) | Book chapters via `algorithmToSource` |
| Scripture library (KJV verbatim, public domain; other translations linked not reproduced) | `lib/scriptures.js` (`kjvText`, `allThemes`, `COPYRIGHT_NOTE`) | The **Scripture resolver** + a themed book |
| Sermon / message corpus (no-video-lost harvest) | `choir_sermons`, `lib/pulpit-prep.js`, the SME pipeline, `video_harvests` | Book chapters via `sermonToSource` (wires when The Word loads) |
| Document creation + dependency-free export | `lib/creation-workspace.js` (`buildExportSvg`, `triggerDownload`, `exportFilename`, `escapeXml`) | Download plumbing + escaping |
| Curriculum→Markdown export | `church-classes.js` `exportCurriculumMarkdownFor` | The model `toMarkdown` mirrors |
| Surface-mount registry (modular spine, DR-0078) | `app/src/surfaces.js` | Library registered here (lazy chunk) |
| Braked approve-to-publish pattern | `lib/orchestrator-handoff.js` (preview→decide→hand-off, default-deny) | `evaluatePublishGate` / `buildPublishHandoff` |

**Finding:** there was no single "book" producer, but every *part* existed. The
content→courses path is a **direct in-source assembly** (authored MODULE arrays
rendered + paced + assessed), not a runtime pipeline. The flywheel's job was to
add a thin, pure **assembly + format + companion + gate** layer over that corpus —
which is exactly what shipped.

---

## 2. Publishing / format decision

**Goal:** real, downloadable formats AND an in-app reader, with zero new
dependencies (sovereign, offline) and the integrity standard intact.

| Format | Decision | Why |
| --- | --- | --- |
| **In-app reader** | Ship now | The companion surface — chapters with live deep-links a static file can't have. |
| **.epub** | Ship now, **real file** | EPUB is a ZIP of XHTML. Built a tiny **store-only ZIP writer + CRC32** (`zipStore`/`crc32` in `book-formats.js`) — no library. `mimetype` is the first, uncompressed entry per the OCF spec. Verified valid by test (PK signature, EOCD, CRC32 check vector `0xCBF43926`, required parts present). |
| **.html** (self-contained, printable) | Ship now | One file, embedded styles, opens anywhere, and **prints to PDF** from any browser — an honest PDF path with no heavy PDF dependency. |
| **.md** | Ship now | Portable, re-editable source; mirrors the existing curriculum-markdown export. |
| **Native .pdf via a PDF lib** | **Deferred** | A real PDF engine (pdf-lib/jsPDF) is a heavy dependency; print-to-PDF from the reader HTML covers the need now. Re-review when a server-side render path exists. |

**Why dependency-free EPUB over "just call a library":** sovereignty +
verifiability. A store-only ZIP we wrote ourselves can be byte-asserted in a
test; it adds nothing to the bundle; and it works fully offline. The trade is a
~90-line ZIP writer — paid once, owned forever.

### Integrity / attribution (binding)

The engine **only arranges text it is handed** — it never authors, paraphrases,
or fabricates. Enforced structurally:

- Every chapter carries a `sourceRef` (traceable to a real corpus record).
- Scripture is materialized **verbatim** through `kjvResolver` → `kjvText`
  (KJV, public domain). Unresolved refs are **flagged, never faked**.
- `bookIntegrityReport` fails the book if any chapter is unsourced/empty or any
  Scripture ref is unresolved. The approve-to-publish gate reads this report — a
  book that fails integrity **can never be approved**, even by a Governor.
- Other translations are **referenced, not reproduced** (study-bible separation).

This is the verification doctrine (DR-0076) made structural: integrity is shown,
not claimed.

---

## 3. The flywheel — all four loops Darrell named

Encoded in `lib/book-flywheel.js`, each loop is a concrete, wired descriptor
(not prose). `flywheel(book)` returns all four.

### Loop 1 — KEEP INTERACTION / INTEREST
The book pulls readers into the live app. `companionManifest` exposes, per
chapter, **deep-links** into the lesson (Learn), the message (The Word),
Scripture, the worship presenter, and a discussion — plus a stable `readerRoute`
a QR / deep link on a printed or exported copy returns to. *The app enriches the
book (interactivity, updates, community) the static file cannot.*

### Loop 2 — MARKET THE BUSINESS(es)
`marketingAssetFor(book, business)` produces a **lead-magnet descriptor per
business** — Church, PoeTech, TLC — each with its own promise/CTA lens
(`BUSINESS_LENS`), an opt-in capture (`consentRequired: true`, never extractive),
and a landing deep-link into the in-app reader. Shaped to feed the social /
marketing + CRM engine (the Father's-Business reach).

### Loop 3 — FEED LEARNING
`learningLoop` is **reciprocal**: a book can become a paced course (each chapter
→ a lesson in the 5-stage arc), and the book records that it *was* assembled from
existing teaching. Book content flows into Learn curriculum and back.

### Loop 4 — FEED APP + COMMUNITY DEVELOPMENT
`communityLoop` returns two things: a **development signal** (reactions/feedback
tagged per book → execution-outcome observability), and the **skill ladder**
`read → reflect → contribute → teach` — readers level up and graduate toward
leading (experience over credentials, SKOS). Engagement is both a product signal
and a discipleship path.

### Per-business / per-ministry lens
`BUSINESS_LENS` carries church / poetech / tlc framings; a book declares which
`businesses` it serves, and the marketing loop emits one asset per business.

### Publishing is gated
`evaluatePublishGate` is **default-deny**: a book is publishable only when every
requirement is met (integrity ok, title, attribution) **and** a human has
explicitly approved. `buildPublishHandoff` stages a `lane: 'publish'` hand-off
(`gateAllowed: false`, `dispatchState: 'staged'`) — preview→approve→execute,
mirroring the orchestrator Cage. Nothing auto-publishes.

---

## 4. First build increment — what shipped

**Branch:** `feat/books-app-flywheel` (auto-merge lane). **No migration** — the
shelf is sovereign device-local (like Study + the Eternal Algorithms library),
and the corpus is read client-side, so the change is additive and the db-migrate
gap can't bite. Reading is open to any signed-in user; the build **Studio** is
family/Governor-gated.

**New pure libs (43 dedicated tests, all green):**
- `lib/book-engine.js` — `assembleBook`, `buildChapter`, `bookIntegrityReport`,
  `bookStats`, `deepLinksFor`, `companionManifest`. Source-agnostic + pure
  (timestamps injected → deterministic).
- `lib/book-formats.js` — `toMarkdown`, `bookToReaderHtml`, `bookToEpubBytes`
  (+ the `zipStore`/`crc32` store-only ZIP writer).
- `lib/book-flywheel.js` — the four loops, per-business marketing, the
  approve-to-publish gate + hand-off.
- `lib/book-corpus.js` — adapters (lesson/algorithm/scripture/sermon →
  BookSource), the `kjvResolver`, the buildable-now **recipes**
  (`availableRecipes`/`buildRecipe`), and the sovereign **shelf** (`loadShelf`/
  `saveShelf`/`upsert`/`remove`).

**New surface:** `components/Library.jsx` (tab **Library**, 📖, Notes group) —
three faculties: **Shelf** (in-app reader + device-local bookshelf), **Studio**
(build from corpus → integrity report + flywheel strip + download .epub/.html/.md
+ save), **Reader** (companion deep-links into the live app). Registered in
`surfaces.js` (DR-0078 lazy chunk, 12.25 kB gzip), wired into nav + the
feedback-area gate + route allow-list.

**Buildable right now from real corpus:** the Living Lessons course, the Learning
A.I. course, the Sovereign A.I. course, the Eternal Algorithms (seed catalog or
the user's own library), and Scripture-by-theme. The Messages book is recipe-ready
and lights up when the Church → The Word tab loads the sermon corpus.

**Verification (DR-0076 — evidence, not claims):**
- `npm run build` ✓ (real export resolution; `Library` is its own chunk).
- Full suite **2142 tests / 173 files green**, incl. the 43 book tests, the
  EPUB byte-validity test, the integrity/default-deny-gate tests, the
  feedback-area-coverage gate (now includes `library`), and the module-boundary
  guard (the registry entry is a compliant lazy thunk).
- ESLint clean on all new files.
- *Not verified here:* an interactive signed-in clickthrough of the gated Studio
  (needs a real family OAuth session); the reader is a pure render of
  engine-verified data, and the build/assembly path is covered by tests.

---

## 5. Next increments (named, not silent)

1. **Wire the loaded sermon corpus** into the Library `ctx.sermons` from the
   Church → The Word surface (the Messages recipe is ready; the shell currently
   passes `[]`).
2. **`books` table + sync** (Tier C, needs a migration apply) — published books
   shareable across devices + a public shelf, behind the approve-to-publish gate.
3. **Real publishing channels** — the staged `lane: 'publish'` hand-off executes
   to the social/marketing + CRM engine (lead magnets) once a Governor approves.
4. **Audio narration** — read-aloud the reader via the existing TTS primitive
   (`lib/tts.js`); sovereign Piper/Coqui on the GPU box later.
5. **EPUB images + native PDF** when a server-side render path exists
   (re-review).
6. **Book → course generation** — turn `learningLoop.bookToCourse` into an actual
   Learn course scaffold.

The flywheel turns: corpus → book → reader-into-the-app → engagement → learning +
marketing + community skill → more corpus. Souls, the Word, and value over
accreditation stay the north star.
