# Research-Review — The Body's Study → Structured Course Materials (sovereign two-NAS + CUDA mesh)

**Date:** 2026-06-23 (revised same day with Darrell's architecture directives)
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — survey options with citations + trade-offs → recommendation. **No pipeline code written.** This is the design review that precedes the build.
**Status:** DRAFT for Darrell's review. Quality gate, not a hold parked on Darrell.
**In-app companion:** the recommended best-way for each topic below is also materialized as in-app documentation under the **Church Local Infrastructure** project (see §11) — repo doc = the survey; in-app entries = the decided best-way, rendered where the family works.

---

## TL;DR

**The goal (now the full content engine):** ONE shared transcript→structure engine, **multiple sources → multiple outputs.** **Sources:** the church Body's living study (Bishop Gwin's Word *and the congregation's contributions* — Q&A, discussion, collaborative study — as they "discuss Yahweh's perspectives explicitly") **+ Darrell's in-app conversations** (discussions, Study reflections, chat-in, family voice, his private thinking space — all owner/family-scoped). **Outputs, compiled in sequence:** structured **lessons** (Learn) → **curriculum** (courses/series) → **books** (downloadable PDF/EPUB) → **digital-marketing assets** (lead magnets / products). Faithful to the Word, served-not-surveilled, sovereign on our own hardware, operated through the app on the CUDA boxes. The recordings→lessons pipeline (§0–§10) and the conversations→lessons pipeline (§13) are the **same engine pointed at different sources**; §12 frames the whole engine and §15 gives the firm phased timeline.

**The architecture, settled across this session's directives:**

1. **Source = BOTH, reconciled — and continuous (§18).** The originals already live on the **church's local NAS** (sovereign storage at COLG). The **YouTube channel — The Love Corner, [@thelovecorner](https://youtube.com/@thelovecorner)** (`UC821pJh7YR5llBNnWUJj-ZA`, **836 videos**, joined Sep 22 2014, ~133.7k views) — is the published mirror. We use **both**: their *union* is the comprehensive video history, and the *matched pair* cross-verifies completeness + fidelity. **This same source — the historical archive PLUS every ongoing/future recording (continuous) — feeds EVERY engine output** (sermons/stories, choir, SME/keyboardist instruction, worship self-critique, lessons, music). **No new dedicated capture step** — it's all already captured, and the future auto-feeds.
2. **Retention = best-of-one.** Verify with both copies, then **keep the single best version** of each item (highest res/bitrate, most complete, best audio — audio matters most for transcription), recording matched-pair provenance even though only one file is retained. The church NAS has **~100 TB** (after the 5×12 TB add) — ample.
3. **Processing = the app *is* the cockpit, running *on* the CUDA boxes.** The PoeTech PWA opens locally on the GPU machine at the church (and at home); that app instance reads the local-LAN recordings, drives the local GPU (faster-whisper + Ollama on CUDA), and publishes course materials back into the app. Operating the pipeline = clicks in the app that become local API calls. Nothing leaves the box.
4. **Access = the tailnet.** Home ↔ church reach each other over Tailscale (the COLG sovereign-NAS build puts both on one tailnet). Reaching/authenticating to the church NAS is a **credential / his-hand step** (Darrell/BG hold those creds — the pipeline does not).

**One honest flag (Reality-Trace / Verification Doctrine):** I have **not** yet inventoried the church NAS read-only — I don't hold its creds from this session. So "the church NAS has the complete set" is **Darrell's report, marked `pending inventory`** here, not a verified claim. The reconciliation table (§4) is the instrument that will *prove* completeness once that access exists. The 836-video figure IS verified (read from YouTube's own page data this session).

**Recommendation in one line:** build the **reconcile-both → retain-best → app-on-CUDA-processes → faithfulness-gated → human-reviewed → publish-newest-first** pipeline, operated entirely through in-app surfaces, reusing every proven piece and adding only the genuinely-new links: **church-NAS access, the reconciliation/retention engine, the faithfulness gate, and the in-app pipeline cockpit.**

> ### ⭐ LEAD BUILD (Darrell's priority, 2026-06-24): BG's Sermon Stories library is BUILD #1.
> Bishop Gwin's reusable **Sermon Stories** library (**§16**) is the **prioritized first deliverable** — the thing to start building the moment this spec lands. It is the cheapest fully-buildable slice of the whole engine: it needs **one sermon transcript** (produced by one manual run of the *existing* `sme-pipeline` — no church-NAS access, no GPU, no reconciliation engine), it lands in BG's **existing** study surface (The Word — Migdal), and it reuses proven pieces end-to-end (corpus, `speakerKey`, `corpusPrep`, the no-leak visibility filter). §16 carries the **build-ready detail** (data model, extraction approach, trusted-access scope, the first-PR checklist). **The rest of the engine — conversations→lessons (§13), curriculum→books (§14) — follows, in any order.**

---

## 0. What this builds ON (proven pieces — reference, do NOT rebuild)

Every one is on `main` and verified. The new pipeline is a *spine connecting them*, not a rewrite.

| Proven piece | Where it lives | What it already does | Role here |
|---|---|---|---|
| **SME video→spec pipeline** | `infra/nas-sme-pipeline/` (README, `transcribe.py`, `sme-video-to-spec.sh`, `Dockerfile`, `buildspec-prompt.md`) | faster-whisper `large-v3-turbo` INT8 in an isolated container → transcript → local Ollama `qwen2.5:14b` → structured `spec.md`. Manual-run, no cron (three brakes). | **The transcription + extraction engine**, re-pointed from "build spec" to "lesson spec," and re-homed onto the CUDA box. |
| **`choir_sermons` catalog** | `infra/supabase/migrations-auto/0013-colg-sermon-backfill.sql`, `app/src/lib/choir-sync.js` (`CHURCH_CHANNEL_HANDLE='thelovecorner'`) | An **existing in-app catalog of COLG videos** keyed by `video_id` + `service_date` + `service_type` (sunday/wednesday) + `title` + `speaker`, scoped to the `colg` instance. | **The reconciliation substrate.** The "on-YouTube?" column of §4 reads from here; matched NAS originals fill the "on-NAS?" column. |
| **Learn framework** | `app/src/lib/learn-framework.js` (`LEARN_LEVELS`, `AGE_BANDS`, `resolveLevel`, `gradeQuiz`, `QUIZ_PASS_RATIO`, `courseAssessment`, `chunkLessonForAge`, `lessonPlanForAge`) | Skill-level branching + age-adaptive pacing + real (never-painted) assessment + graduate→helper. | **The lesson schema + delivery.** A study session becomes a `MODULES`-shaped lesson. |
| **Course pattern (Jennings-style)** | `app/src/lib/church-classes.js`, `app/src/lib/broadcast-class.js`, `app/src/components/ChurchLearn.jsx` | Two shipped courses prove the authored-`MODULES` schema: `{id,title,bigIdea,lesson,anchor,media,levels,quiz,facilitator}`. | **The target output shape** the extractor fills. |
| **Universal Presenter** | `app/src/components/Presenter.jsx` + `app/src/lib/presentable.js`; rendered via `ChurchLearn.jsx` `AgePacedLesson` | scenes = audience + presenter-notes (no-leak); time-adaptive segments/breaks; ALL Learn courses + The Word teach through it. | **The teach surface.** A lesson plays as a paced presentation. |
| **BG Wednesday trivia Q&A** | `app/src/components/Engagement.jsx`, `app/src/lib/engagement-sync.js`; `trivia_answers` table | BG poses questions at the end of a message → in-app answers, app-side grading, RLS-scoped. Static John 18 anchor today; weekly pipeline blocked on Gmail OAuth. | **The trivia output.** Questions the Body raised become the lesson's check-for-understanding. |
| **Study reflection lane** | `app/src/lib/study-space.js`, `app/src/components/Study.jsx`; `docs/00-foundations/darrells-study/yahweh-discussions.md` | Private device-local rooms (reflection/processing/research); deep↔plain distillation. | **The Body's contribution capture + Darrell's Yahweh-study append rule.** |
| **Church-Live** | `app/src/lib/church-live.js` (`liveStatus`, `liveStreamEmbedUrl`, `latestUploadEmbedUrl`), `ChurchVideoWall.jsx` | Honest live/offline gating; latest-upload fallback; zero YouTube API key. | **The clip surface + the "a service happened" signal.** |
| **Discussions / institutional memory** | `app/src/lib/discussions.js`, `discussions-sync.js`, `app/src/components/Discussions.jsx`; migration `0035-discussions.sql` | Per-project decision/directive/reflection/handoff records, rendered inline on the project + in a Discussions tab, no-leak. | **The in-app documentation model** the §11 best-way entries use. |

**Reuse, not rebuild, is itself a constraint resolution.**

---

## 1. Two-NAS topology + the inventory (read-only, 2026-06-23)

There are **two distinct NAS contexts** — do not conflate them:

| | **HOME NAS — DS1621xs** | **CHURCH NAS — at COLG** |
|---|---|---|
| Role | Processing + governance substrate; the SME pipeline's current home; this repo's NAS-side ops. | **Source-of-truth storage** for the original service / study recordings. |
| Reached this session? | ✅ Yes, read-only (SSH `dpoe@192.168.1.26`). | ❌ **No** — creds not held this session. Holdings `pending inventory`. |
| Capacity | DS1621xs, 8-core CPU, ~32 GB RAM. | **~100 TB** total after adding 5×12 TB drives (Darrell). |
| GPU | None yet (CPU-only). Home **CUDA box** planned. | **CUDA box** planned (the COLG 9k build). |

### What the HOME NAS actually holds (verified read-only this session)

| Location | What's there | Relevance |
|---|---|---|
| `/volume1/NetBackup/*.prproj` (×4) | **Sermon-titled Adobe Premiere projects, 2015** ("Let's Get It Done", "Get Ready It's Going To Rain", "Sombody Is Going To Get Saved", "Isaiah") + preview files. | Historical media-production archive (the Broadcast course's lineage); a decade old. |
| `/volume1/photo/` (~200 GB) | Family videos/photos 2012–2022; a few singing clips. **No recorded services / Bible studies.** | Family content, out of scope. |
| `/volume1/homes/cpoe/.../Z Fold7/` | Recent (2025–26) phone backups only. | Personal, not church-study source. |
| `/volume1/Media`, `/volume1/PlexMediaServer` | **Empty** placeholders. | The "obvious" media shares hold nothing. |
| `/volume1/PoeTech/sme-pipeline/` | Transcription engine **pre-built + idle**: `large-v3-turbo` INT8 cached; `input/`+`output/` empty. | **Ready to run** the moment a recording lands. |
| Local Ollama (`127.0.0.1:11434`) | `qwen2.5:14b`, `qwen2.5:3b`, `hermes3:8b`, `deepseek-r1:8b`, **`nomic-embed-text`** (embeddings → RAG/verse-grounding). | Extraction + retrieval brains, local + sovereign. |

**Home-NAS verdict:** the *engine* is here and idle; the *fuel* (recent Body-study recordings) is **not** here. It's at the church NAS + mirrored on YouTube.

### What the CHURCH NAS holds — `pending inventory`

Darrell's report: *"we have them on the local NAS at the church."* Treated as a claim to **verify**, not a fact to build on. The §4 reconciliation table is the instrument that confirms it. What's needed to inventory it read-only: tailnet access + read creds (his-hand step — §5).

### The YouTube mirror — verified this session

[@thelovecorner](https://youtube.com/@thelovecorner) (Church of the Living God): channel `UC821pJh7YR5llBNnWUJj-ZA`, **836 videos**, joined **Sep 22 2014**, ~133,762 views. (Read from the channel page's own embedded data over plain HTTP; the public RSS feed (`/feeds/videos.xml?channel_id=UC821pJh7YR5llBNnWUJj-ZA`) returns only the latest ~15 — **the full 836-item archive cannot be enumerated read-only without owner access**, so per-item reconciliation needs YouTube Studio / Takeout, §5.) The in-app `choir_sermons` catalog already holds a curated slice of these by date/type/title/speaker (migration 0013).

---

## 2. The recommended pipeline (shape) + topology

```
                          THE TAILNET (Tailscale: home <-> church, sovereign mesh)
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │                                                                                     │
   │   CHURCH SITE (same LAN)                          HOME SITE (same LAN)               │
   │   ┌───────────────┐   ┌──────────────────┐        ┌────────────┐  ┌───────────────┐ │
   │   │ CHURCH NAS    │   │ CHURCH CUDA BOX  │        │ HOME CUDA  │  │ HOME DS1621xs │ │
   │   │ ~100TB        │──▶│ opens PoeTech    │        │ BOX        │  │ (engine idle, │ │
   │   │ ORIGINAL      │LAN│ PWA = COCKPIT +  │        │ opens PWA  │  │  governance)  │ │
   │   │ recordings    │   │ PROCESSING NODE  │        │ = mirror   │  │               │ │
   │   │ (source of    │   │  • faster-whisper│        │ node       │  │               │ │
   │   │   truth)      │   │    on CUDA       │        └────────────┘  └───────────────┘ │
   │   └───────────────┘   │  • Ollama on CUDA│                                           │
   │                       │  • verse-parser  │   sovereign sync layer keeps both         │
   │   YouTube mirror ─────│  • Presidio      │   app instances + the catalog coherent    │
   │   (@thelovecorner)    └──────────────────┘                                           │
   └───────────────────────────────────────────────────────────────────────────────────┘

   PER-ITEM FLOW (runs on whichever CUDA box is local to the recording):

   [0] RECONCILE      church-NAS original  ∪  YouTube item (catalog: choir_sermons)
       (§4)           match by date/title/duration/hash -> status per item
            |
   [1] RETAIN BEST    keep the single best copy (res/bitrate/completeness/AUDIO);
       (§6)           record matched-pair provenance even though one file is kept
            |
   [2] TRANSCRIBE     app-on-CUDA -> faster-whisper large-v3-turbo (GPU)
            |          + scripture-aware initial_prompt (book names, BG/COLG, KJV register)
            |
   [3] FAITHFULNESS   verse-parser detects every ref; each quoted verse checked vs local
       GATE (§3.1)    canonical KJV/ESV -> drift flagged. Cross-check vs the matched mirror.
            |          A misquote attributed to a speaker NEVER ships unverified.
            |
   [4] CONSENT SCRUB  Presidio (local NER+regex) strips congregant names / prayer requests /
       (§3.3)         testimony -> redacted working transcript
            |
   [5] STRUCTURE      app-on-CUDA -> local Ollama -> MODULES-shaped lesson: objectives,
            |          segments, anchor refs, THE BODY'S CONTRIBUTIONS, trivia
            |
   [6] HUMAN REVIEW   in-app Governor-gated queue: faithfulness + consent flags shown;
            |          Darrell/BG approve / edit / reject. Nothing publishes un-reviewed.
            |
   [7] PUBLISH        -> Learn (series) + Presenter (teach) + Study (reflection seed)
       (newest-first)    + Engagement (trivia) + Church (clips).  By series, not all-at-once.
```

**Why this order:** reconcile → retain best → transcribe → **verify the Word before anything else touches it** → scrub people → structure → human gate → publish. The two gates ([3] faithfulness, [4] consent) sit *upstream of the LLM* so the model never structures misquoted or un-consented content. The human gate [6] is the Cage: the system advises with receipts; the human decides (DR-0076 §9).

---

## 3. Constraint resolutions (options surveyed → recommendation)

### 3.1 Transcription accuracy on the Word (a misquoted verse is unacceptable)

Whisper "excels at generalizing but loses accuracy on specific vocabularies" — exactly our failure mode (proper nouns, book/verse refs, KJV register) ([arXiv:2410.18363](https://arxiv.org/abs/2410.18363)).

| Option | What | Trade-off |
|---|---|---|
| A. Bigger model only | `large-v3` full vs `-turbo`. | Marginal proper-noun gain; slower; **verifies nothing.** |
| B. Fine-tune on church audio | Train on labeled COLG recordings. | Best raw accuracy in theory, but "demands extensive labeled data" + "overfits on scarcity" ([arXiv:2410.18363](https://arxiv.org/abs/2410.18363)). No labeled corpus yet. GPU-era. |
| C. Contextual biasing / `initial_prompt` | Feed Whisper the 66 book names, "Bishop Gwin", "Church of the Living God", KJV phrasings — no retraining. | "Significantly reduced WER across all model sizes... resilient where fine-tuning overfit." Cheap, runs today. **Improves, doesn't guarantee.** |
| D. Post-hoc scripture verification | Detect refs ([pythonbible](https://github.com/avendesora/pythonbible) `get_references()`, [python-scriptures](http://www.davisd.com/python-scriptures/), [bible-verse-parser](https://github.com/eliranwong/bible-verse-parser)), check each quote vs **local canonical** KJV/ESV, flag drift. | Turns "trust the transcript" into "verify the quote." Mature libs. |
| **E. Matched-pair cross-check (NEW — both sources)** | Because we hold the NAS original *and* the YouTube mirror, transcribe one and **sanity-check against the other** (and against the `choir_sermons` title/speaker). | Two independent copies of the Word ⇒ a bad transcript is far less likely to pass unnoticed. Free byproduct of keeping both for verification. |

**Recommendation: C + D + E.** Bias the input, verify the output against canonical text, **and** cross-check against the matched mirror copy. A flagged verse goes to the human queue [6] — never published as a silent claim. This is the Verification Doctrine made mechanical: *measure, don't claim; proven-to-catch; a misquote is expensive to ship.* ESV primary / KJV secondary per SCRIPTURE-REFERENCE-STANDARD; **fetch the actual translation, never reconstruct from the model.** Fine-tuning (B) parked for the GPU era (re-review: "labeled COLG corpus exists").

### 3.2 Faithful to Yahweh's-perspective / Word-first / the BODY's contributions

| Option | What | Trade-off |
|---|---|---|
| A. Pastor-monologue only | Structure only BG's teaching. | **Violates the directive** — Darrell named the Body's contributions as source. |
| B. Speaker-diarized | Diarize (who-spoke-when), structure the Word *and* the Body's Q&A as first-class. | Faithful; CPU diarization doable (whisperX/pyannote), trivial on CUDA; adds a privacy surface (§3.3). Maps to `MODULES`: BG → `lesson`/`anchor`; Body Q&A → new `bodyContributions[]` + `quiz`. |
| C. Worldview-grounded prompt | Extraction prompt anchored to THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW / THE-WAY / SCRIPTURE-REFERENCE-STANDARD; model **extracts, never improvises theology.** | Essential regardless. Faithful-intent is *already settled by the source* — the Body states Yahweh's perspective plainly on the recording; we structure what was said, never paraphrase intent. |

**Recommendation: B + C.** Diarize so the **Body's voice is first-class** (the directive's heart); ground extraction in the worldview spine. Add `bodyContributions[]`; route congregation questions into the trivia lane. Religion-AND-Relationship test + the eight-question Test run against every published lesson.

### 3.3 Privacy / consent in live-service recordings (served-not-surveilled)

Congregant names, prayer requests, testimonies **must be scrubbed or consented before becoming shareable** (DATA-AS-EMPOWERMENT, COMMUNITY-FIRST, QUALITY-OF-LIFE).

| Option | What | Trade-off |
|---|---|---|
| A. Manual review only | Human redacts by hand. | Safest, doesn't scale. Keep as the *final* gate, not the only one. |
| B. [Microsoft Presidio](https://github.com/microsoft/presidio) auto-scrub | Local NER+regex detection of names/PII; Anonymizer redacts "before storing transcripts"; custom recognizers for prayer/testimony; image-redaction (Tesseract OCR) for on-screen lower-thirds. | NER ≠ intent, so it's a *first pass that surfaces*, human backstop. Mature, permissive, fully local. |
| C. Consent-at-source | Media team tags segments "teaching (shareable)" vs "personal (private)"; standing consent for the teaching portion. | Cleanest — consent is *governance*, not just tech. |

**Recommendation: C + B + A, layered.** Default posture: **private unless it is the teaching of the Word, which is shareable.** Presidio auto-scrubs + surfaces every hit; the review queue [6] shows consent flags beside faithfulness flags; nothing publishes until cleared. *Served-not-surveilled* enforced as a gate. (Building Surveillance-Station camera feeds are **out of scope** — teaching recordings only.)

### 3.4 Curation + volume (newest-first, by series, behind compute brakes)

| Option | What | Trade-off |
|---|---|---|
| A. Batch-everything backfill | Transcribe all 836 at once. | On CPU this is the runaway the three-brakes rule forbids; floods the review queue. **No.** On CUDA it's faster but the *review* queue is still the human bottleneck — so still no. |
| B. Newest-first, one-series-at-a-time, manual-run | Most-recent first; advance by series; budget + single-instance lock + kill-switch. | Matches `sme-pipeline`'s manual-run, three-brakes posture; keeps the human queue human-sized; honest "N of M," never silently capped. |
| C. GPU acceleration | App-on-CUDA makes transcription dramatically faster; pipeline shape unchanged. | The scale answer is *hardware*, not loosening brakes. |

**Recommendation: B + C.** Newest-first by series, manual-run, all three brakes (non-negotiable per the 2026-06-06 runaway — FEEDBACK_AUTONOMOUS_AUTOMATION_THREE_BRAKES). **Backfill of the 836-item history is opt-in, batched, and never auto-fired.** CUDA buys speed, not permission to remove brakes.

---

## 4. Inventory becomes a RECONCILIATION TABLE (verify with both sources)

The inventory section is now a **reconciliation ledger**: the goal state is *every item present + verified on sovereign storage.* Built on the existing `choir_sermons` catalog (the "on-YouTube?" side) + a church-NAS read-only scan (the "on-NAS?" side, `pending inventory`).

| Field | Meaning |
|---|---|
| `item` | service/study, identified by date + title + service_type (sunday/wednesday) |
| `on_nas` | present in the church-NAS originals? (`pending inventory`) |
| `on_youtube` | present on @thelovecorner? (from `choir_sermons` / Studio export) |
| `matched` | same item in both? matched by **date + title + duration + hash** |
| `status` | `complete` (both, matched) · `backfill-from-YT` (YouTube only → owner-export to NAS) · `backfill-to-archive` (NAS only, never published) · `discrepancy` (missing / truncated / re-edited) |
| `provenance` | which source won retention + the matched-pair metadata (kept even when one copy is discarded) |

- **`complete`** → process from the retained best copy.
- **`backfill-from-YT`** → the Takeout/Studio export fallback runs for **just these** items (§5).
- **`backfill-to-archive`** → a NAS original that never hit YouTube; still captured (often the richest — uncut).
- **`discrepancy`** → flagged to the human; the matched pair is exactly what catches a truncated or re-edited published version.

**Denominator is known:** 836 YouTube items since 2014. **Numerator (church-NAS holdings) is `pending inventory`.** The table cannot claim "complete" until both columns are filled — and that honesty *is* the verification guarantee.

---

## 5. Acquisition / access path (rights-clean, sovereign)

The acquisition gap **collapses from a download problem to an access problem**, because the originals already sit on the church NAS. Two paths, in priority order:

1. **PRIMARY — reach the church NAS over the tailnet (no download at all).** Home and church are on one Tailscale tailnet (the COLG sovereign-NAS build). The app-on-CUDA at the church reads the originals over the **local LAN** (lowest latency); cross-site access (e.g., home governance reading a church path) rides Tailscale. **Reaching/authenticating to the church NAS is a credential / his-hand step** — Darrell/BG hold the church-NAS read creds; the pipeline and I do not. *What's needed to light this up:* tailnet membership for the processing node + a read-only service account / share on the church NAS. Until then, church-NAS contents stay `pending inventory`.
2. **FALLBACK (only for `backfill-from-YT` items) — owner-export, never scrape.** For any item on YouTube but missing from the NAS, the **channel owner** exports the originals via **YouTube Studio → Content → download** or **Google Takeout** (it's COLG's *own* channel) and lands them on the NAS. **Not yt-dlp, not scraping, not pulled through our tools** — a channel-owner credential action in Darrell's/BG's hand. *Owner steps:* Takeout → select **YouTube → "video and channel data"** → export → download archive → copy the video files into the church-NAS originals share → they appear in the next reconciliation scan.

**Both bounded by:** owner-export effort (manual, one-time for backfill + ongoing for new uploads) + NAS storage (ample, §6) + transcription compute (CPU now / GPU later). New uploads going forward: capture-to-NAS at the broadcast source is cleanest (ties to the Broadcast course); until then, the owner-export step repeats per new service.

---

## 6. Retention (best-of-one) + capacity (~100 TB)

**Verification and retention are separate decisions:**

- **Verify with BOTH** (§4) — reconcile, confirm completeness, cross-check fidelity.
- **Retain the single BEST version** — not redundant duplicates. "Best" criteria, in order: **(1) audio quality** (it dominates transcription accuracy — the whole point), (2) completeness/uncut, (3) resolution/bitrate. Where the NAS original and the YouTube copy differ, keep the better one; **record provenance + matched-pair metadata** (date/title/duration/hash/which-source-won) even though only one file is retained — so verification history survives without storing two copies.
- **Plus the derived artifacts** retained per item: extracted audio (or kept inline), transcript (`.txt`+`.json`), the structured lesson, generated clips, and working space.

**Capacity sanity-check:** church NAS **~100 TB** total after **5×12 TB = 60 TB raw** added. **RAID caveat:** usable < raw — SHR/RAID-5 over 5×12 TB ≈ ~48 TB usable from that set (one-drive parity); RAID-6 ≈ ~36 TB; the "~100 TB" figure is total-pool-after-add, so headroom is ample either way. A back-of-envelope: 836 items × ~1–3 GB best-version each ≈ **~1–2.5 TB** for the whole archive video, plus transcripts/lessons (tiny) and clips (modest). **The comprehensive history fits comfortably with vast headroom** — retention is not a constraint; best-of-one is a *cleanliness* choice (no needless duplicate sprawl), not a capacity necessity.

---

## 7. App-as-cockpit, running ON the CUDA boxes (the operating model)

**Binding directive:** *"Make it work THROUGH the PoeTech app wherever it makes sense. We can open the app on the CUDA machines."* Two halves:

### 7.1 The app IS the cockpit (operate / monitor / review / publish in-app)

Operating the pipeline = **clicks in the app that become local API calls** — not external scripts. This realizes AI-FOUNDATION-INTERNAL-OPERATIONS ("anything that is a click today should be an API call tomorrow, called from a workflow; browsers are for humans deciding things") + the App-Is-Primary rule. In-app surfaces, "wherever it makes sense":

| Surface | What it does | Reuses |
|---|---|---|
| **Reconcile** (Church › Course Pipeline) | shows the §4 reconciliation table; per-item status; "export-needed" list for owner-backfill. | `choir_sermons`, discussions render pattern |
| **Build** | trigger a transcription/course build for an item or a series; shows the brake state (budget/lock/kill-switch). | `sme-pipeline` call → local GPU |
| **Monitor** | live progress (transcribe → gate → scrub → structure); honest "N of M"; CUDA box health. | Dispatch-status reel pattern |
| **Review** | the Governor-gated queue: faithfulness flags + consent flags; approve / edit / reject. | Discussions / Governor Review surfaces |
| **Publish** | push the approved lesson → Learn / Presenter / Study / Engagement / Church clips. | Learn framework, Presenter |

*Don't force-fit:* heavy compute stays on the GPU; the app is the **control plane**, not the transcoder. "Wherever it makes sense" = operate/monitor/review/publish in-app; raw GPU work stays native.

### 7.2 The app RUNS ON the CUDA box (processing node = app instance)

The PWA is installable/openable locally. **The app instance on the CUDA machine IS the processing + orchestration node:** it reaches the **local GPU** (faster-whisper + Ollama on CUDA) directly and the **local recordings** (church NAS on the same LAN) — low-latency, fully sovereign, nothing leaves. Church CUDA box opens app → reads church-NAS recordings over LAN → transcribes + structures on its own GPU → publishes course materials into the app (synced via the sovereign sync layer). Same pattern at home. This is the **local-conductor / GPU-does-the-work** realization of the 24-7 success metric: the conductor (the app) is small and local; the GPU does the heavy lifting; the mesh keeps both sites coherent.

---

## 8. Required screens (Darrell's standard)

### Sovereign-mesh compatibility tier (1–4)

**Tier 1 — fully sovereign, end to end.** Source recordings on our own church NAS; processing on our own CUDA box; orchestration in our own app; publish into our own app; sync over our own tailnet. **No third-party API in the core path** — YouTube is a *verification mirror*, never system-of-record, and the only time we touch Google is the owner's *own* Takeout export for backfill (his data, his credential, one-time). Canonical scripture bundled locally (KJV public-domain; ESV per licensing). **This is the strongest sovereignty tier in the whole build** — both the data and the compute stay on hardware the family/church owns.

### MVP-pragmatism check

**MVP = one recent service, end to end, by hand-run, on whatever GPU exists first.** Don't build the cockpit or the reconciler first:
1. Owner places **one recent recording** on the church NAS (or exports one via Takeout).
2. Run the **existing** `sme-video-to-spec.sh` with a scripture-aware prompt → transcript.
3. Run the **faithfulness gate** (verse-parser + canonical check) as a small standalone script → flag list; eyeball against the YouTube copy (matched-pair cross-check, by hand).
4. **Hand-author** the first `MODULES` lesson → it teaches through the **existing** Presenter.

Zero new infrastructure — a prompt, a verification script, a lesson file. The cockpit, the reconciliation table, Presidio automation, the in-app review queue, series curation, and the CUDA re-home are all **increments on a working spine**, added newest-first. Honors *confirm-need → smallest-change → verify-live → land-it*.

### Cost-efficiency screen

- **Growth justification:** the Body produces teaching *every week* (Sunday + Wednesday Bible study + BG's Wednesday message) — a perpetual stream that today evaporates into a YouTube archive nobody re-studies. Turning 12 years (836 items) + every future week into structured, re-teachable, searchable, **sovereign** curriculum is **compounding**: the Body's own intellectual output becomes its own owned asset, not a platform's training data. Black-church-as-economic-powerhouse.
- **Unit cost:** marginal cost per recording ≈ **electricity + operator attention.** No API spend (local Whisper + local Ollama + local Presidio + local verse-parser). On CPU: 1–3× media length (batch overnight). On CUDA: a fraction of real-time — the GPU box (already in the COLG 9k plan) is the accelerant, shared with surveillance/other ops, so **no new hardware is bought for this pipeline.** vs a managed transcription/structuring SaaS (~$0.006–0.02/min + per-seat LLM fees), the sovereign path's recurring cash cost is **≈ $0** and the data never leaves the box.
- **Lean alternative (if ever judged too heavy):** skip ingest + diarization and run the pipeline on **BG's emailed Wednesday message text** (already text — no transcription, no audio-privacy surface) once Gmail OAuth lands → faithfulness gate → lesson → trivia. **The cheapest possible wedge, recommended as the literal first increment** while audio reconciliation is designed; it reuses the trivia lane already built and waiting on that same OAuth.

### Father's-Business test (does it serve souls?)

**Yes — directly.** It takes the living teaching of the Word *and the Body's own wrestling with Yahweh's perspectives* and makes it **re-studiable, age-paced, searchable, and shareable** to people who couldn't be in the room — in a sovereign system the community owns and that will never sell or mine their worship. It serves the elderly tech-novice COLG staff (COMMUNITY-FIRST's named first community), it disciples (graduate→helper, 2 Tim 2:2), and it keeps the Word faithful by *verifying every quote against two independent copies* rather than letting a machine misattribute scripture to a man of God. The faithfulness gate is itself reverence: *we will not let a misquoted verse go out under a preacher's name.* Religion (verified, Word-first, structured) **and** relationship (the Body's voice carried, age-met, served not surveilled). Passes the eight-question Test.

---

## 9. The genuinely-new links (design next — NOT built here)

1. **Church-NAS access** (§5) — tailnet membership + read-only service account for the processing node. His-hand credential step.
2. **The reconciliation + retention engine** (§4, §6) — NAS-scan ∪ `choir_sermons`, match by date/title/duration/hash, status per item, retain best-of-one with provenance.
3. **The faithfulness gate** (§3.1) — verse-parser + local canonical check + matched-pair cross-check, **proven-to-catch** (seed it a known-misquoted transcript; it must flag it before it's trusted — DR-0076 §3). The most important new code in the build.
4. **The in-app pipeline cockpit on CUDA** (§7) — Reconcile / Build / Monitor / Review / Publish surfaces; app-instance-as-processing-node.

Everything else is reuse + wiring.

---

## 10. Recommendation (rationale, for the ledger)

**Build the reconcile-both → retain-best → app-on-CUDA-processes → faithfulness-gated → human-reviewed → publish-newest-first pipeline, operated through in-app surfaces, reusing every proven piece.** Specifically:

1. **Start with the text wedge** (BG's Wednesday message → lesson + trivia) once Gmail OAuth lands — cheapest increment, reuses the waiting trivia lane, zero audio-privacy surface.
2. **Then the one-recording MVP** — owner places/exports one recording → existing `sme-pipeline` + scripture-aware prompt → faithfulness gate (with by-hand matched-pair cross-check) → hand-authored first lesson on the existing Presenter.
3. **Source = both, reconciled** (§4) — church NAS originals ∪ YouTube mirror; the union is the comprehensive history; the matched pair verifies completeness + fidelity.
4. **Retain best-of-one** (§6) — verify with both, keep the better copy (audio first), record provenance; ~100 TB is ample.
5. **Process on the CUDA boxes, operate in the app** (§7) — the app instance on the GPU machine reads local recordings, drives the local GPU, publishes into the app; the mesh keeps sites coherent.
6. **Bias the input, verify the output, cross-check the mirror** (§3.1: C+D+E) — a flagged verse never publishes silently.
7. **Carry the Body's voice** (§3.2: B+C) — diarize, `bodyContributions[]` + trivia, worldview-grounded extraction; the model organizes, never improvises theology.
8. **Served-not-surveilled** (§3.3: C+B+A) — consent-at-source + Presidio + human backstop; teaching recordings only.
9. **Curate newest-first, three brakes** (§3.4: B now / C on GPU) — backfill of the 836-item history opt-in + batched; honest "N of M."
10. **The human governs the bright line** — in-app Governor-gated review shows faithfulness + consent flags; Darrell/BG approve / edit / reject; nothing publishes un-reviewed. The system advises with receipts; the human decides.

**Why this and not "scrape YouTube and auto-publish":** because the originals are already on sovereign storage (access, not download), because both copies together *verify* the Word two ways, because a CPU/GPU box auto-backfilling 836 items is the exact runaway the three-brakes rule forbids, and because *a misquoted verse or an un-consented testimony is unacceptable* — so verification, consent, and the human gate are gates, not afterthoughts. Faithful, sovereign, served-not-surveilled, verifiably right.

---

## 11. In-app materialization (the best-way, where the family works)

Per *"let's get the best ways AND documentation for each inside the PoeTech app"*: the decided best-way for each topic is materialized as **in-app documentation** — a **Church Local Infrastructure** project (domain `church`, instance `colg`) with **9 discussion entries** (the app's institutional-memory / Events-as-data model, rendered inline on the project + in the Discussions tab). Each entry = recommended best way + decisions-with-rationale ("we chose X not Y because Z").

- **Committed source (this repo):** `infra/seed-data/2026-06-23-colg-local-infrastructure-docs.json` (structured seed) + `infra/seed-data/2026-06-23-colg-local-infrastructure-docs.sql` (idempotent applier, resolves the `colg` instance by slug — the proven `(SELECT id FROM instances WHERE slug='colg')` pattern from migration 0013).
- **Two projects (umbrella scope):**
  - **Church Local Infrastructure** (`colg-local-infra-2026-06`, domain `church`) — the sovereign-infra + recordings-pipeline entries.
  - **Content Engine** (`content-engine-2026-06`, domain `church`) — the broader workstream: the unified engine, conversations→lessons, curriculum→books, and the phased timeline. Engine entries link to **both** projects.
- **In-app nav (after apply):** **Projects → (domain: Church) → "Church Local Infrastructure"** *and* **"Content Engine"** — best-way entries render inline under *Discussions driving this*, and in **Projects → Discussions** filtered to each project. The **17 entries**: (1) Source = both, reconciled · (2) Retention = best-of-one + ~100 TB · (3) Processing = app-on-CUDA · (4) Access = tailnet + Takeout fallback · (5) Faithful-extraction guarantee · (6) Privacy/consent scrub · (7) Curation + brakes · (8) BG Wednesday trivia Q&A · (9) Recordings→courses pipeline · (10) **Unified content engine** · (11) **Conversations→Lessons** · (12) **Curriculum→Books** (premise conflict + copyright + no-payment) · (13) **Phased timeline (CPU-now vs GPU-later)** · (14) **⭐ Sermon Stories — BUILD #1** (BG's reusable illustration library, in The Word — Migdal; the prioritized first build). The BG-stories entry lands in The Word — Migdal (BG's existing study), not a new surface. · (15) **Community engagement** (reactions/ratings/most-loved/radio stations on sermons + lessons, riding the shared primitive `local_ad147f53`; §17). · (16) **Single source** (historical archive + continuous future feeds every output; no separate capture; §18). · (17) **Depth-adaptive + interest-personalized** (book-capable quick/standard/deep tiers + opt-in sovereign personalization; §19).
- **Live-render status (honest):** these **render live after the one-time Studio apply against the `colg` cloud instance** — a cloud/Darrell-hand step, exactly like every DB change in this repo (the db-migrate convention). Committed + pushed here; **not yet applied to cloud** (this local session cannot reach the cloud Studio). Marked pending, not claimed live.

---

## 12. THE UNIFIED CONTENT ENGINE (sources → lessons → curriculum → books → marketing)

One engine, many sources, many outputs. The transcript→structure→faithfulness-gate→consent→MODULES→review→publish spine (§2) is **source-agnostic**: feed it a recording or a conversation, it produces a lesson. Lessons compile up into curriculum; curriculum compiles into books; books become marketing assets. Each arrow is a compile step, each behind the same brakes + the same human gate.

```
  SOURCES                          ENGINE (shared)            OUTPUTS (compiled in sequence)
  ┌────────────────────────┐                                 ┌───────────────────────────────┐
  │ church recordings      │                                 │ LESSON   (Learn / Presenter)  │
  │  (NAS ∪ YouTube)  §0-10 │──┐                          ┌─▶│   MODULES: objectives, segs,  │
  ├────────────────────────┤  │   ┌──────────────────┐    │  │   anchor refs, body-contrib,  │
  │ in-app CONVERSATIONS    │  ├──▶│ transcribe/ingest│────┤  │   trivia                      │
  │  discussions / Study /  │  │   │ faithfulness gate│    │  └───────────────┬───────────────┘
  │  chat-in / family-voice/│  │   │ consent scrub    │    │                  │ compile related
  │  thinking space   §13   │──┘   │ structure (LLM)  │    │                  ▼
  │  (owner/family-scoped)  │      │ human review     │    │  ┌───────────────────────────────┐
  └────────────────────────┘      └──────────────────┘    │  │ CURRICULUM (course / series)  │
                                      app-on-CUDA          │  │   learn-framework course shape│
                                      = the cockpit        │  └───────────────┬───────────────┘
                                                           │                  │ compile course
                                                           │                  ▼
                                                           │  ┌───────────────────────────────┐
                                                           └──│ BOOK  (PDF / EPUB, downloadable)│
                                                              │   OWNED content only          │
                                                              └───────────────┬───────────────┘
                                                                              │ package
                                                                              ▼
                                                              ┌───────────────────────────────┐
                                                              │ MARKETING ASSET (lead magnet/  │
                                                              │  product)  — payment = his hand│
                                                              └───────────────────────────────┘
```

The same in-app cockpit (§7) operates every stage; the same three brakes + Governor review gate every compile.

**One source for everything (§18).** Every output below — and every *other* engine output (choir songs, SME/keyboardist instruction, worship self-critique, music) — draws from the **same single source: the historical archive (church NAS ∪ YouTube, reconciled, best-version) + ongoing/future recordings (continuous auto-feed).** There is **no separate capture step per output** — the sources box on the left is the *one* established archive, and new recordings join it continuously.

**Multiple outputs per sermon — fan-out, not a single line.** One transcript yields *several* artifacts in parallel: a **lesson** (Learn), material toward **curriculum/books**, **and** — new, requested by Bishop Gwin himself — his reusable **Sermon Stories** (the discrete illustrations/anecdotes he tells, collected into his personal section; §16). The extraction pass runs once; the structuring fans out to whichever outputs are wanted. BG's stories are an **owner-scoped (BG-private) output**, distinct from the shareable lesson/book outputs.

---

## 13. PHASE — Conversations → Lessons (same engine, in-app conversation sources)

Point the engine at **in-app conversation data** instead of (or alongside) recordings. No transcription needed for the text sources — they're already text — so this phase is **CPU-OK today**.

### Sources (all owner/family-scoped)

| Source | Where | Scope / sensitivity |
|---|---|---|
| **Discussions** | `discussions` table (Supabase), `app/src/lib/discussions.js` | instance-scoped + RLS; `visibility: private` filtered to author+owners (`visibleDiscussions`). |
| **Study reflections / thinking space** | `app/src/lib/study-space.js` (`KINDS`: reflection/processing/research) | **Device-local only (localStorage), never synced to cloud** — his most private processing. *Process-don't-store* is binding here. |
| **chat-in** | `app/src/lib/chat-import.js` (`parseChatHistory`, `toConversationEntries`) → project `conversationLog` | owner-scoped imported chats. |
| **Family voice** | family-voice inputs (`SelfServeWelcome.jsx`) | family-scoped. |
| **Yahweh discussions** | `docs/00-foundations/darrells-study/yahweh-discussions.md` | private to Darrell/Christina/BG (the append rule). |

### Constraint resolutions (deltas from the recordings pipeline)

- **Privacy/consent is the senior gate here, inverted.** Recordings default *teaching=shareable*; **conversations default PRIVATE**, especially the Study thinking space. The engine is **opt-in per item** — Darrell *picks* a conversation to turn into a lesson; nothing auto-publishes his private processing. The Presidio scrub + the no-leak visibility filter still run, but the first gate is *his explicit selection*.
- **Faithful structuring** is unchanged: the model organizes what he said, never improvises theology; the faithfulness gate still verifies any scripture he quoted (§3.1 C+D; the matched-pair cross-check E doesn't apply — there's one copy).
- **No transcription** for text sources → no Whisper, no GPU dependency → **runs on CPU now.** (A *voiced* family-voice clip would re-enter the transcription path.)

### Build sizing

- **Phase 1 (MVP, CPU-OK) — ~3–5 build days:** pick-a-conversation → draft lesson → human review → publish to Learn. Reuses the `MODULES` schema, the review queue, the Presenter. The new code is the *conversation-selector* surface + the conversation→MODULES extraction prompt. **Depends on: privacy scoping** (the opt-in selector + the private-by-default posture).
- **Phase 2 (batch, GPU-accelerated) — after the engine is proven:** batch-process conversation history behind the three brakes, newest-first. GPU helps only where voiced clips need transcription; pure-text batch is CPU-fine but volume-gated by the human review queue.

---

## 14. PHASE — Curriculum → Books (downloadable PDF/EPUB, marketing-ready)

Compile a course/curriculum into a **downloadable book**, positioned as a digital-marketing asset.

### ⚠ Premise conflict surfaced (verify before building)

The directive says *"surface in the existing BOOKS tab."* **The app's "Books" tab is the financial ledger** (accounting — `BooksEntities.jsx`; "Books → Tx", "Books → Imported"; nav id `books` in the monolith's `VALID` list), **not** a publishing/library shelf. There is **no existing downloadable-book surface.** Bolting a curriculum-book library onto the accounting tab would collide two unrelated meanings of "books."

**Recommendation:** home the book/library surface in the **Learn / Church area** where the curriculum already lives (a "Library" / "Shelf" sub-surface), reusing the **`CreationWorkspace` export primitive** (`app/src/lib/creation-workspace.js`, `CreationWorkspace.jsx`) that already does dependency-free document export. This also matches the existing tracked goal *"Worldview teaching book · finish + publish"* (a real project row in the monolith). **Do not duplicate, and do not overload the financial Books tab.** (If Darrell *means* a new top-level "Library" tab, that's a small nav addition — his call.)

### Export approach — options

No PDF/EPUB lib is in `package.json` today.

| Option | What | Trade-off |
|---|---|---|
| **A. Print-CSS → PDF (zero-dep)** | A print stylesheet + `window.print()` → user "saves as PDF." | Zero new dependency, fully sovereign, works offline, reuses the browser. No EPUB. Least control over pagination. **Leanest; recommended for MVP.** |
| **B. jsPDF / pdf-lib (client-side PDF)** | Generate the PDF in-app, real download button. | One dependency; precise control; still sovereign (client-side). EPUB still separate. |
| **C. + JSZip EPUB** | EPUB = a zip of XHTML; build client-side with JSZip. | Adds reflowable-ebook output (better for phones/readers); +1–2 deps. Do only if EPUB is actually wanted. |

**Recommendation: A for the MVP** (zero-dep, proves the compile + download), **B/C as the next increment** when a polished product/lead-magnet is wanted.

### Hard rules (binding)

- **No payment / monetization build.** We produce the **book + download + marketing-ready packaging only.** Payment processing, checkout, pricing rails = **Darrell's hand**, explicitly out of scope (he owns the money flow).
- **Copyright (binding):** books are built from **OWNED curriculum** — church content + Darrell's own conversations — which is fine. **Do NOT embed copyrighted song lyrics or third-party copyrighted text.** Scripture refs + themes + the Body's own words are fine; **derived data only** (a reference, a theme, a paraphrase-marked summary), never a pasted copyrighted lyric or passage. This pairs with the Worship/Music section's per-track vetting and the SCRIPTURE-REFERENCE-STANDARD (fetch the actual translation; mark paraphrase).
- **Faithfulness carries through:** a book inherits its lessons' verified status — nothing with an open faithfulness/consent flag compiles into a shippable book.

### Build sizing

- **Curriculum → Book (MVP, CPU-OK) — ~3–5 build days** with Option A (print-CSS): compile a course's lessons → a paginated book view → download. **Depends on: the Library-surface decision** (where it lives) + the export approach.
- EPUB / polished product: **+~2 days** (Option B/C).

---

## 15. FIRM PHASED TIMELINE — the whole engine

**Build order (Darrell's priority, 2026-06-24):** **#1 = BG's Sermon Stories (P3c / §16)** — built first, ahead of everything, because it's the most build-ready high-value slice (one transcript, no new infra). **#2+ = the rest in any order:** conversations→lessons (P1), curriculum→books (P3→P4), and the recordings/reconciliation/GPU phases as their dependencies land. The phase *numbers* below describe dependencies, not build sequence; the **sequence is set by the priority callout**, with P0 (text wedge) available in parallel whenever Gmail OAuth lands.

Build-day estimates are engineering effort, not wall-clock; phases gated by their **dependencies**, not the calendar. "CPU-now" = ships on current hardware; "GPU-later" = needs/accelerated-by the CUDA box.

| Phase | What ships | Build days | Compute | Hard dependencies |
|---|---|---|---|---|
| **P0** | Text wedge: BG Wednesday message → lesson + trivia | ~2–3 | **CPU-now** | Gmail OAuth (the only blocker) |
| **P1** | **Conversations → Lessons** MVP (pick → draft → review → publish to Learn) | **~3–5** | **CPU-now** | Privacy scoping (opt-in selector, private-by-default) |
| **P2** | **Recordings → Lessons** MVP (one recording → faithfulness gate → lesson) | ~4–6 | **CPU-now** (slow), **GPU accelerates** | The faithfulness gate (§9.3); one recording on the NAS (manual upload OR church-NAS access) |
| **P3** | **Lessons → Curriculum** (compile related lessons into courses/series) | ~2–3 | **CPU-now** | P1/P2 producing lessons; reuses learn-framework |
| **P3c ⭐ BUILD #1** | **Sermon Stories** (BG's reusable illustration library; §16) — **the prioritized first build** | ~3–5 | **CPU-now** | ONE transcript (one manual `sme-pipeline` run — no church-NAS access, no GPU) + the new sub-tab in The Word — Migdal; batch back-catalog rides P7 |
| **P4** | **Curriculum → Books** MVP (compile → paginated → download PDF) | ~3–5 | **CPU-now** | Library-surface decision (§14, NOT the financial Books tab); export approach |
| **P5** | **Reconciliation + retention engine** (NAS ∪ YouTube, best-of-one) | ~5–8 | CPU-now | Church-NAS read access (tailnet, his-hand creds) |
| **P6** | **In-app cockpit on CUDA** (Reconcile/Build/Monitor/Review/Publish surfaces) | ~6–10 | runs CPU; **homes on GPU box** | GPU box online; P2/P5 logic to wrap |
| **P7** | **Batch backfill** (all conversation history + the 836-video archive, behind brakes, newest-first) | ~2–4 + run-time | **GPU-later** | GPU box + P5 reconciler + P6 cockpit + three brakes |
| **P8** | **Books → Marketing assets** (lead-magnet/product packaging; EPUB) | ~2–4 | CPU-now | P4; **payment = Darrell's hand, NOT built** |

### Dependency graph (what unblocks what)

```
  Gmail OAuth ──▶ P0
  Privacy scoping ──▶ P1 ──┐
                           ├─▶ P3 (curriculum) ──▶ P4 (books) ──▶ P8 (marketing; payment = his hand)
  Faithfulness gate ──▶ P2 ┘
        │
        └─(church-NAS access via tailnet)─▶ P5 (reconcile) ──┐
                                                             ├─▶ P6 (cockpit on CUDA) ──▶ P7 (batch backfill)
                              GPU box online ────────────────┘
```

### CPU-now vs GPU-later (the honest split)

- **CPU-now (ship today on current hardware):** P0, P1, P2 (slow but works), P3, P4, P5, P8. **The entire sources→lessons→curriculum→books→marketing spine can be PROVEN on CPU** — text sources need no GPU at all, and one recording transcribes (slowly) on the DS1621xs.
- **GPU-later (needs/accelerated-by the CUDA box):** P6 (the cockpit *homes* on the GPU box as the processing node) and **P7 (batch backfill of 836 videos + all-history)** — the only phase that genuinely *requires* GPU to be practical. GPU also turns P2's "slow" into "fast."

**Sequencing recommendation (priority-ordered):** **P3c — BG's Sermon Stories — FIRST** (Darrell's call: highest value, smallest dependency set, one transcript, no new infra). Then P0/P1 (text wedge + conversations→lessons) → P3 → P4 (prove the compile chain to a downloadable book on owned conversation content) → then P2/P5/P6/P7 as the church-NAS access + GPU box land → P8 packaging when Darrell wants products. **The whole engine is demonstrable end-to-end on CPU before a single GPU dependency is required — and BG's Sermon Stories is the first thing to ship.**

### Standard screens (engine-wide)

- **Sovereign-mesh Tier 1** holds for the whole engine — every source, compile, and output stays on owned hardware; books generate client-side; marketing packaging is local; the only external touch is the owner's own Takeout (his data) and, later, his own payment rail (his hand, not built).
- **Cost:** marginal cost ≈ electricity + operator attention + (P7) GPU time on hardware already bought for the COLG build. Book generation = $0 (client-side). vs a SaaS course-builder + ebook-compiler + transcription stack (easily $50–300/mo combined), the sovereign engine's recurring cash cost is **≈ $0**, and the family/church **owns the curriculum, the books, and the audience relationship** — the anti-extraction moat.
- **Father's-Business:** the engine turns the Body's worship + Darrell's private wrestling-with-Yahweh into re-studiable lessons, owned curriculum, and books that disciple and can fund the mission — soul-serving content the community owns, never sold-from-under-them. Books built from owned content, no copyrighted lyrics, payment governed by Darrell. Passes the eight-question Test.

---

## 16. ⭐ BUILD #1 — Bishop Gwin's reusable "Sermon Stories" library (BG-requested, PRIORITIZED MVP)

**This is the lead deliverable (Darrell, 2026-06-24): build it first.** Requested by Bishop Gwin himself: extract every **story / illustration** he tells in a sermon and collect them into **his personal section** as a reusable, searchable library — so he doesn't dig through old sermons to find an illustration for a new one. This is the **first output of the engine** to ship (lessons §13 and books §14 follow), and it's the **most build-ready** because it depends on nothing new: one transcript from the existing `sme-pipeline`, BG's existing study surface, and proven primitives. The detail below is enough to start the first PR.

**Why it's the right first build:** smallest dependency set in the whole engine (one transcript, no church-NAS access, no GPU, no reconciliation/retention engine, no new top-level surface), highest direct value to a named user (the Bishop), and it exercises the engine's hardest guarantee (faithful extraction + verify) on a small, ownable surface before scaling.

### Where it lands (extend, don't duplicate)

BG's section already exists: **The Word — Migdal** — the staff-gated (owner/admin) Bishop's-study surface (`app/src/components/Pulpit.jsx`, nav id `pulpit`; engine `app/src/lib/pulpit-prep.js` — `theWordTabs`, `corpusPrep`, `speakerRoster`), reading the `choir_sermons` corpus. **Add a new "Sermon Stories" sub-tab there** via `theWordTabs(canManage)`, reusing the corpus + the `corpusPrep` search pattern. **Do not build a new top-level surface** — it lives inside his existing study (ties to the prior BG-study work, lane `local_cb09eb75`). Owner-scoped to BG by default.

### Access scope — trusted-steward set (owner = BG; shared = Darrell + Christina)

BG's clarification: the library is **his**, but **Darrell and Christina also have access.** A small trusted-steward set — **not BG-only, and not public.** Modeled on the **unified roles/membership layer** (`instance_members(instance_id, user_id, role)` with roles `owner|admin|member|viewer|specialist`; the RLS helpers `user_in_instance()` / `user_role_in_instance()`; `role_scopes`; the `colg` instance):

- **OWNER = Bishop Gwin** — full read / write / curate; **he makes the grants** (governance stays with the owner).
- **Shared read/use = Darrell (system steward) + Christina** — they view + use stories; they do **not** re-scope ownership.
- **NOT instance-wide, NOT public.** This is a **named subgroup narrower than `user_in_instance`** — the exact shape the **Choir module already uses** (`user_in_choir()`: a defined subset gets read/use, owner/admin edit). Enforce with a `role_scopes` grant or a `user_in_sermon_stories_stewards(instance_id)` subgroup predicate, **not** the broad instance-member check (which would expose it to every COLG member). The default instance-member RLS on `discussions`/`choir_sermons` is therefore *too wide* for this surface — Sermon Stories needs the narrower steward predicate.
- **Congregant/family-name privacy still applies *within* the set:** per-story `visibility` private-by-default, the Presidio scrub (§3.3), and the no-leak `visibleDiscussions` filter; **consent/scrub before any sharing beyond the trusted three.** "Trusted set" widens *who can steward*, not *what may be broadcast*.
- **Design-level scope only.** This documents the intended scope; the **actual permission grants are made by the owner (BG) through the app's own roles UI** — not a live permission flipped from here.

### Extraction shape (one record per story)

| Field | Meaning |
|---|---|
| `story` | the anecdote/illustration as he told it (faithful — his words, lightly cleaned; **not fabricated**) |
| `point` | the moral / takeaway it served |
| `scripture` | the verse(s)/theme it illustrated (verified via the §3.1 faithfulness gate) |
| `theme` / `topic` / `tags` | for search + filter (e.g., perseverance, grace, fatherhood) |
| `source` | source sermon + `service_date` + **timestamp** into the recording (jump-back link) |
| `speaker` | normalized via `speakerKey` (BG's canonical entity) |
| `visibility` | **private to BG by default** (a story may name a congregant/family member) |

Searchable/filterable by **theme, scripture, topic** — pull a past illustration into a new sermon fast.

### Build-ready data model (proposed `sermon_stories` table)

A dedicated table (sibling to `choir_sermons`, not a reuse of `discussions` — these are structured records with a narrower steward scope and a verify lifecycle). Migration is additive; next free number at build time (≥ 0041).

```sql
CREATE TABLE IF NOT EXISTS sermon_stories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sermon_id     uuid REFERENCES choir_sermons(id) ON DELETE SET NULL,  -- source sermon
  slug          text NOT NULL,                       -- stable local id (sync pattern)
  story         text NOT NULL,                       -- the anecdote, his words (faithful)
  point         text,                                -- the moral / takeaway
  scripture     jsonb DEFAULT '[]'::jsonb,           -- verified refs (faithfulness gate)
  theme         text,                                -- primary theme
  tags          text[] DEFAULT '{}',                 -- topic/theme tags for filter
  start_ts      text,                                -- mm:ss into the recording (jump-back)
  speaker_key   text,                                -- speakerKey(name) canonical
  status        text NOT NULL DEFAULT 'candidate'    -- candidate | kept | archived
                CHECK (status IN ('candidate','kept','archived')),
  visibility    text NOT NULL DEFAULT 'stewards'     -- stewards | private  (never instance-wide)
                CHECK (visibility IN ('stewards','private')),
  verified_by   uuid,                                -- BG (or steward) who confirmed
  verified_at   timestamptz,                         -- null until verified
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, slug)
);
-- RLS: the TRUSTED-STEWARD predicate, NOT user_in_instance (too wide).
--   read/use : user_in_sermon_stories_stewards(instance_id)   -- BG + Darrell + Christina
--   write    : owner (BG) full; stewards may add candidates / use; owner curates 'kept'
-- A 'candidate' row is never treated as canonical; only status='kept' (verified_at set) is reusable.
```

`user_in_sermon_stories_stewards(instance_id)` is the new subgroup helper — the `user_in_choir()` shape (a `role_scopes` grant or a small steward table), seeded with BG (owner) + Darrell + Christina. **Sync** rides the existing table-sync pattern (slug + instance), like `discussions-sync`/`choir-sync`.

### Extraction approach (faithful, grounded, no fabrication)

Runs on a sermon **transcript** (one manual `sme-pipeline` run produces it today — `transcript.txt` + timestamped `transcript.json`). Pipeline:

1. **Transcript in** (existing `sme-pipeline`; scripture-aware `initial_prompt` per §3.1 C).
2. **Story-candidate extraction** — local Ollama (`qwen2.5:14b`) over the transcript with a **grounded extraction prompt**: *"From THIS transcript only, list each distinct story/illustration the speaker actually tells. For each: the story in/near his words, its point, any scripture referenced, a 1–3 word theme + tags, and the start timestamp. Do NOT invent stories, morals, or scripture not present. If unsure, omit."* → returns a JSON array of candidates (the table shape above), each `status='candidate'`.
3. **Faithfulness gate (§3.1 D)** — every `scripture` ref is parsed + checked against local canonical KJV/ESV; drift is flagged on the candidate.
4. **Consent scrub (§3.3)** — Presidio passes the `story`/`point` for congregant/family names → flags (not auto-deletes — BG decides).
5. **BG verifies** — candidates surface in the Sermon Stories sub-tab with the jump-back timestamp; BG confirms (→ `status='kept'`, `verified_at`), edits, or archives. **Only `kept` rows are reusable; nothing is auto-canonical.**

No GPU required for steps 2–5 (text over a transcript); step 1 is the only slow part on CPU, and it's one sermon for the MVP.

### First-PR checklist (what "build it" means)

- [ ] Migration: `sermon_stories` table + RLS + `user_in_sermon_stories_stewards()` helper + steward seed (BG/Darrell/Christina).
- [ ] `lib/sermon-stories.js` (pure): normalize/validate a story, `filterStories(by theme/scripture/topic)`, candidate-vs-kept helpers, the no-leak visibility filter (mirror `visibleDiscussions`). + unit tests (proven-to-catch: a private/candidate row never leaks).
- [ ] `lib/sermon-stories-sync.js`: table-sync (slug+instance), mirroring `choir-sync`/`discussions-sync`.
- [ ] Extraction prompt + a small runner that turns a transcript → candidate rows (reuses `sme-pipeline` output; can run on the home box for the MVP).
- [ ] UI: a **"Sermon Stories" sub-tab** added to `theWordTabs(canManage)` in The Word — Migdal — search/filter (theme/scripture/topic), candidate-review (verify/edit/archive), jump-back-to-timestamp.
- [ ] Faithfulness-gate hook on `scripture`; Presidio flag surfaced in review.
- [ ] Gate: tests green + the visibility proven-to-catch test + steward-scope (not instance-wide) test.

### Two parts

1. **Reuse from old sermons (primary).** From his sermon corpus (church NAS ∪ YouTube → transcripts, the *same* source as lessons/books), auto-extract the discrete stories he *actually told* — anecdote + point + scripture/theme + source/date/timestamp — into the Sermon Stories library. **Faithful extraction only: pull what he said, never invent; he verifies before a story is "kept."** The faithfulness gate (§3.1) still verifies any scripture attached.
2. **New-story sourcing aid (optional, secondary).** A curated source of stories/illustrations for *new* sermons "for perspective" — clean, attributed, theologically aligned (Word-first / non-denominational). **BG curates; this is a sourcing aid, not auto-insert.** **Copyright (binding):** external stories are **attributed**, **summary/reference only — never reproduce copyrighted text**; derived data (the gist, the source citation) only — same rule as §14 books and the Worship/Music vetting.

### Constraint resolutions (deltas)

- **Privacy/consent is the senior gate (BG-private).** Stories often name congregants, family, the departed, personal testimonies. **Default private to BG**; the Presidio scrub (§3.3) + the no-leak visibility filter run; **consent/scrub before BG ever chooses to share** a story outward (e.g., into a public lesson/book). His selection is the first gate.
- **Faithful, never fabricated.** The model extracts candidate stories from the transcript and presents them for **BG's verification**; an unverified story stays in a "candidate" state, never auto-canonical (Verification Doctrine — characterize before you trust; he is the human gate).
- **Reuse the proven pieces:** the same transcript pass, the same faithfulness gate, the `speakerKey` canonical entity, the `corpusPrep` search, the discussions/no-leak visibility model, the Presidio scrub. **New code only:** the story-extraction prompt + the Sermon Stories sub-tab in The Word — Migdal.

### Timeline slice

- **P3c — Sermon Stories MVP (BG's reusable library) — ~3–5 build days, CPU-now.** Depends on: transcripts existing (rides P2's transcript output) + the new sub-tab in The Word — Migdal. Pure text-processing once a transcript exists → no GPU. Extracts candidate stories → BG verifies → kept stories become searchable. Batch-extract across his back-catalog rides **P7** (GPU-accelerated, behind brakes, newest-first) once the corpus is transcribed.
- **New-story sourcing aid** is a small, separate curated surface — ships when BG wants it; copyright-vetted, attribution-only.

### Standard screens (delta)

- **Sovereign-mesh Tier 1** holds — stories are extracted locally from owned transcripts into BG's own owned section; nothing leaves. The optional new-story sourcing aid is the only surface that *might* reference external material, and only as attributed summary/reference (no copyrighted text), so it stays clean.
- **Cost:** marginal (text extraction on already-produced transcripts); $0 recurring.
- **Father's-Business:** it serves the preacher directly — hands Bishop Gwin his own illustrations back, organized and instantly findable, so he spends his preparation on the Word and the people, not on digging through archives. His stories, his section, his to verify and to share or keep private. Passes the eight-question Test.

---

## 17. Community-engagement layer — reactions, ratings, most-loved, "radio" stations (shared primitive)

**Directive (Darrell, 2026-06-24):** apply the **same community-engagement pattern as the Worship/Music section** to **BG's sermons** and **everything else that makes sense** (the lessons/courses the engine produces). Same four moves the music section gets:

- **Reactions** — love / emoji, a **clean, Word-first, child-safe reaction set** (no arbitrary emoji; a curated, dignified set).
- **Community ratings** — the Body rates; aggregate resonance per item.
- **Most-loved ranking** — order the library by community love/ratings.
- **"Radio" / continuous-play station** — e.g., a **"Most-Loved Sermons" station** that plays the library continuously in ratings-driven order (the sermon analogue of the music station).

### Reuse the shared primitive — DO NOT FORK

This **rides the shared engagement primitive being designed in the consolidation lane (`local_ad147f53`)** — one primitive (reactions + ratings + most-loved + station), **many surfaces.** The music section, BG's sermon library, and the engine's lessons/courses all **consume the same primitive**; we do **not** build a separate sermon-reactions stack. When the primitive lands, these surfaces register with it. (Existing kin to align with, not duplicate: `feedback-sync.js`'s `rating` vocabulary `love/good/rough/broken`, the `engagement-sync` trivia/message lane.)

### Where it attaches (shareable surfaces only)

| Surface | Engagement | Source/primitive |
|---|---|---|
| **The Word — Migdal public sermon library** | reactions + ratings + **"Most-Loved Sermons" station** | `choir_sermons` / `theword_public_sermons()` (0029) + the shared primitive |
| **ChurchLearn lessons / courses** (engine output) | reactions + ratings + most-loved courses/lessons | learn-framework + the shared primitive |
| **Everything else that makes sense** | same | the shared primitive (register the surface) |

**Boundary (important):** engagement attaches to **community-visible / shareable** outputs. **BG's private Sermon Stories (§16) are trusted-steward-private and do NOT get community reactions** — they're not community-visible. *If* BG later shares a story into a public lesson, the engagement rides that public lesson, not the private record. Private stays private.

### Scope, credit, faithfulness

- **Community-scoped per PIN-optional-community-default** — engagement is the community's, gated by the existing PIN-optional-community-default posture (not public-internet, not surveilled).
- **Credit BG** — every sermon + most-loved entry attributes the preacher (`speakerKey`), consistent with The Word — Migdal's existing "each message credits who delivered it."
- **Clean + Word-first + child-safe** — the curated reaction set keeps it dignified; **most-loved orders *discovery*, it never replaces curation or ranks truth by popularity.** Resonance is a find-it-faster signal, not a doctrine signal (Religion-AND-Relationship: warmth *and* backbone).
- **Data-as-empowerment** — reaction/rating data is the community's own, sovereign, never sold or engagement-optimized (DATA-AS-EMPOWERMENT-NOT-EXTRACTION; no dark-pattern "maximize loves").

### Standard screens (delta)

- **Sovereign-mesh Tier 1** — engagement lives on the community's own instance, served from owned infra; the station plays owned library items; nothing leaves.
- **Cost** ≈ $0 (rides the shared primitive; no new service).
- **Father's-Business** — surfaces the Word the Body most responds to so newcomers find the messages that move people, draws them deeper, and credits the preacher — community love as a discipleship on-ramp, not a vanity metric. Passes the eight-question Test.

### Timeline

**Rides the shared primitive's delivery** (consolidation lane `local_ad147f53`), then registers the sermon + lessons/courses surfaces — an **additive layer once each surface ships**. It does **not** change the build order: **BG's Sermon Stories (§16) is still Build #1**; engagement attaches to the *public* sermon library + lessons as the shared primitive lands.

---

## 18. SINGLE SOURCE — the historical archive + continuous future (engine-wide principle)

**Binding clarification (Darrell, 2026-06-24), applies to the WHOLE engine:** *"It's all already captured in the historical videos on YouTube and Church NAS, and into the future."*

**There is ONE source for everything the engine produces.** Every output — BG's sermons/stories (§16), choir songs, SME/keyboardist instruction, worship presentations for self-critique, lessons (§13), curriculum/books (§14), music, and the community-engagement surfaces (§17) — draws from the **same established source**:

- **The historical archive** — church NAS ∪ YouTube (@thelovecorner, 836 items since 2014), **reconciled both-ways (§4), best-version retained (§6).** It's *already captured*.
- **PLUS ongoing/future recordings** — every future service / Bible study / rehearsal **auto-feeds** the same archive, continuously.

### What this changes (bake in across the engine)

- **No new dedicated capture step.** The engine **processes the existing + continuous archive** — it does not ask anyone to re-record or stand up a new capture pipeline per output. Capture already happened (and keeps happening); the engine's job is *process → route*.
- **Self-critique / worship-review draws from the archive, not fresh capture.** The worship-review / SME pipeline lane (`local_eceef6e5`) pulls a learner's **PAST altar presentations** *from the historical archive* so they can review work they already did — and **every future service auto-feeds** new material to review. Continuous, no separate "record yourself" step.
- **All extraction outputs reference this shared source.** BG's stories, choir songs, the keyboardist's instruction, lessons, music — all sourced from the same historical + ongoing archive. One reconciliation/retention spine (§4/§6) feeds them all; we never wire a bespoke source per surface.
- **Continuous ingestion = a BRAKED queue, not an unbraked loop.** New recordings land → get processed → flow to the right surfaces **automatically, behind the three brakes** (budget + single-instance lock + kill-switch; FEEDBACK_AUTONOMOUS_AUTOMATION_THREE_BRAKES). This ties the continuous-feedback-reel *cadence* + church-NAS-as-source + app-on-CUDA processing (§7) into one loop. **"Continuous" means newest-first + auto-routed, NOT always-on-unattended:** per the 2026-06-06 runaway lesson, the auto-feed ships **inactive (Tier C)** and is turned on only with someone watching; the human review gate (§2 step 6) still clears every shareable output before publish.

### The routing (one pass, fan-out by surface)

```
  ARCHIVE (historical ∪ continuous future, reconciled, best-version)
        │  one transcript/extraction pass per item (app-on-CUDA, behind brakes)
        ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  faithfulness gate · consent scrub · structure · HUMAN REVIEW     │
   └──────────────────────────────────────────────────────────────────┘
        │ fan-out to whichever surfaces apply (no re-capture)
        ├─▶ BG Sermon Stories (§16, private)        ├─▶ Lessons / Curriculum / Books (§13/§14)
        ├─▶ Choir songs / worship                   ├─▶ SME / keyboardist instruction
        ├─▶ Worship self-critique (local_eceef6e5)  └─▶ Community engagement (§17, shareable)
```

**The source clarification does not change the build order:** BG's Sermon Stories (§16) is still **Build #1**; it simply confirms that its source — and every output's source — is the one archive, already captured, continuously fed.

---

## 19. ENGINE PROPERTIES — depth-adaptive + interest-personalized (all outputs)

**Binding (Darrell, 2026-06-24):** everything the engine produces — **lessons, scripture material, courses, books** — must be **depth-adaptive** and **interest-personalized.** These are *properties of every output*, applied across the whole chain (sources → lessons → curriculum → books), not a one-off feature.

### Property A — Book-capable + depth tiers (core meaning preserved at every tier)

Author each piece **deep enough to be a BOOK**, then scale it **down** to lighter tiers so each consumer takes it at the depth they currently need:

| Tier | What it is |
|---|---|
| **Quick** | the essence — the point, the anchor verse, the one takeaway |
| **Standard** | the working lesson — balanced depth (the default) |
| **Deep** | the full treatment — the book-grade version, edge cases, the "why" |

- **It's the reading-depth analog of the time-adaptive Presenter's proportional reflow** — the same guarantee: **core meaning is preserved at every tier**, only the elaboration scales. Authored once at book-depth; lighter tiers are *reflows*, never different content.
- **Reuse the proven primitives — don't reinvent:** the learn-framework already does this for skill/age (`resolveLevel` over `LEARN_LEVELS`, `chunkLessonForAge`, `lessonPlanForAge`), and the Study space already does **deep↔plain distillation** (`study-space.js` `distillState`: a 4th-dimensional *deep* version ↔ a wider-audience *plain* version, both preserved). Depth tiers generalize that to quick/standard/deep across lessons → curriculum → **books** (a book renders at the reader's chosen tier; the "quick" book is a faithful digest, the "deep" book is the full text).
- **Faithfulness holds at every tier:** a scripture quote is verified (§3.1) at deep tier and **carried verbatim** into quick/standard — reflow never paraphrases the Word silently (SCRIPTURE-REFERENCE-STANDARD; mark any paraphrase).

### Property B — Interest-personalization (consented, owner-scoped, served-not-surveilled)

Surface **topics + depth matching what the consumer actually engages with** — meet each person where their interest already is.

**Interest signals, in priority order:**
1. **In-app engagement (primary, sovereign)** — the consumer's own reactions / ratings / most-loved / what-they-open within the app (§17). This is the *cleanest* signal: it's already ours, already consented, never leaves.
2. **The consumer's own YouTube viewing history (optional enrichment)** — viewing history as an interest signal, **only via the consumer's own consented import** (their data, e.g. their Google Takeout / an explicit opt-in), **never by surveilling their account.** Used to surface topics + depth; **owner-scoped to that consumer**, **opt-in**, **never sold**, **never shared** with advertisers/employers/insurers (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).

**Hard rules (binding):**
- **Opt-in, off by default.** No personalization without the consumer's explicit yes; the engine works fully un-personalized.
- **Served-not-surveilled.** No tracking, no engagement-maximization, no dark patterns. Personalization *serves discovery* (find the next thing that feeds you), it **never** optimizes for time-on-app.
- **Owner-scoped + sovereign + deletable.** Each consumer's interest profile is theirs — exportable, deletable, never sold, never trained-on for anyone else.
- **Personalization orders discovery; it never gates the Word.** Like most-loved (§17), it changes *what surfaces first*, never *what's true* or *what's available* — anyone can reach any depth tier and any topic regardless of profile.

### Applies across the whole chain

A lesson, a course, and a **book** each ship with the three depth tiers and honor the consumer's (opt-in) interest profile to pick a starting topic + depth. The single source (§18) feeds it; the faithfulness + consent gates clear it; depth-tiering + personalization shape *how each consumer receives it.*

### Standard screens (delta)

- **Sovereign-mesh Tier 1** — depth reflow + interest matching run locally on owned data; the interest profile lives on the consumer's own instance, never leaves, never sold.
- **Cost** ≈ $0 (reuses the learn-framework reflow + the §17 engagement signals; YouTube-history enrichment is the consumer's own one-time import).
- **Father's-Business** — meets each soul where they are: the seeker gets the quick essence, the student gets the book; each is handed what matches their hunger, in their own depth, by their own interest — discipleship that adapts to the person rather than forcing one size. Religion-AND-Relationship (backbone preserved at every tier; warmth in meeting them where they are). Passes the eight-question Test.

---

## Sources (June 2026 — re-verify at build time)

- Contextual biasing for domain vocabulary in Whisper: [arXiv:2410.18363](https://arxiv.org/abs/2410.18363)
- Bible-verse reference parsing + canonical text: [pythonbible](https://github.com/avendesora/pythonbible), [python-scriptures](http://www.davisd.com/python-scriptures/), [bible-verse-parser](https://github.com/eliranwong/bible-verse-parser)
- Local PII de-identification: [microsoft/presidio](https://github.com/microsoft/presidio)
- Channel (verified this session): [@thelovecorner](https://youtube.com/@thelovecorner) — `UC821pJh7YR5llBNnWUJj-ZA`, 836 videos, joined Sep 22 2014
- On-NAS engine: `infra/nas-sme-pipeline/README.md`; in-app catalog: `infra/supabase/migrations-auto/0013-colg-sermon-backfill.sql`, `app/src/lib/choir-sync.js`
- Foundations: `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`, `SCRIPTURE-REFERENCE-STANDARD.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`, `AI-FOUNDATION-INTERNAL-OPERATIONS.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (2026-06-06), CLAUDE.md (three-brakes, Reality-Trace, App-Is-Primary, Verification Doctrine DR-0076)

**Decision posture:** Tier B/C build (new feature, COLG-facing, real recordings) — it soaks before it ships. Nothing here is built yet. This doc is the research-first survey + the in-app best-way documentation that precede a decision. Church-NAS holdings: **`pending inventory`** until read-only access exists.
