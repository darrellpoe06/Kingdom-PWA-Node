# Research-Review — The Body's Study → Structured Course Materials (sovereign two-NAS + CUDA mesh)

**Date:** 2026-06-23 (revised same day with Darrell's architecture directives)
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — survey options with citations + trade-offs → recommendation. **No pipeline code written.** This is the design review that precedes the build.
**Status:** DRAFT for Darrell's review. Quality gate, not a hold parked on Darrell.
**In-app companion:** the recommended best-way for each topic below is also materialized as in-app documentation under the **Church Local Infrastructure** project (see §11) — repo doc = the survey; in-app entries = the decided best-way, rendered where the family works.

---

## TL;DR

**The goal:** turn the church Body's living study — Bishop Gwin's Word *and the congregation's contributions* (Q&A, discussion, collaborative study) as they "discuss Yahweh's perspectives explicitly" — into structured **course materials** inside the PoeTech app: objectives, segments, scripture refs, the Body's contributions, trivia → Learn + Presenter + Study + clips. Faithful to the Word, served-not-surveilled, sovereign on our own hardware.

**The architecture, settled across this session's directives:**

1. **Source = BOTH, reconciled.** The originals already live on the **church's local NAS** (sovereign storage at COLG). The **YouTube channel — The Love Corner, [@thelovecorner](https://youtube.com/@thelovecorner)** (`UC821pJh7YR5llBNnWUJj-ZA`, **836 videos**, joined Sep 22 2014, ~133.7k views) — is the published mirror. We use **both**: their *union* is the comprehensive video history, and the *matched pair* cross-verifies completeness + fidelity.
2. **Retention = best-of-one.** Verify with both copies, then **keep the single best version** of each item (highest res/bitrate, most complete, best audio — audio matters most for transcription), recording matched-pair provenance even though only one file is retained. The church NAS has **~100 TB** (after the 5×12 TB add) — ample.
3. **Processing = the app *is* the cockpit, running *on* the CUDA boxes.** The PoeTech PWA opens locally on the GPU machine at the church (and at home); that app instance reads the local-LAN recordings, drives the local GPU (faster-whisper + Ollama on CUDA), and publishes course materials back into the app. Operating the pipeline = clicks in the app that become local API calls. Nothing leaves the box.
4. **Access = the tailnet.** Home ↔ church reach each other over Tailscale (the COLG sovereign-NAS build puts both on one tailnet). Reaching/authenticating to the church NAS is a **credential / his-hand step** (Darrell/BG hold those creds — the pipeline does not).

**One honest flag (Reality-Trace / Verification Doctrine):** I have **not** yet inventoried the church NAS read-only — I don't hold its creds from this session. So "the church NAS has the complete set" is **Darrell's report, marked `pending inventory`** here, not a verified claim. The reconciliation table (§4) is the instrument that will *prove* completeness once that access exists. The 836-video figure IS verified (read from YouTube's own page data this session).

**Recommendation in one line:** build the **reconcile-both → retain-best → app-on-CUDA-processes → faithfulness-gated → human-reviewed → publish-newest-first** pipeline, operated entirely through in-app surfaces, reusing every proven piece and adding only the genuinely-new links: **church-NAS access, the reconciliation/retention engine, the faithfulness gate, and the in-app pipeline cockpit.**

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
- **In-app nav (after apply):** **Projects → (domain: Church) → "Church Local Infrastructure"** — the 9 best-way entries render inline under *Discussions driving this*, and in **Projects → Discussions** filtered to the project. The nine: (1) Source = both, reconciled · (2) Retention = best-of-one + ~100 TB · (3) Processing = app-on-CUDA · (4) Access = tailnet + Takeout fallback · (5) Faithful-extraction guarantee · (6) Privacy/consent scrub · (7) Curation + brakes · (8) BG Wednesday trivia Q&A · (9) End-to-end pipeline.
- **Live-render status (honest):** these **render live after the one-time Studio apply against the `colg` cloud instance** — a cloud/Darrell-hand step, exactly like every DB change in this repo (the db-migrate convention). Committed + pushed here; **not yet applied to cloud** (this local session cannot reach the cloud Studio). Marked pending, not claimed live.

---

## Sources (June 2026 — re-verify at build time)

- Contextual biasing for domain vocabulary in Whisper: [arXiv:2410.18363](https://arxiv.org/abs/2410.18363)
- Bible-verse reference parsing + canonical text: [pythonbible](https://github.com/avendesora/pythonbible), [python-scriptures](http://www.davisd.com/python-scriptures/), [bible-verse-parser](https://github.com/eliranwong/bible-verse-parser)
- Local PII de-identification: [microsoft/presidio](https://github.com/microsoft/presidio)
- Channel (verified this session): [@thelovecorner](https://youtube.com/@thelovecorner) — `UC821pJh7YR5llBNnWUJj-ZA`, 836 videos, joined Sep 22 2014
- On-NAS engine: `infra/nas-sme-pipeline/README.md`; in-app catalog: `infra/supabase/migrations-auto/0013-colg-sermon-backfill.sql`, `app/src/lib/choir-sync.js`
- Foundations: `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`, `SCRIPTURE-REFERENCE-STANDARD.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`, `AI-FOUNDATION-INTERNAL-OPERATIONS.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (2026-06-06), CLAUDE.md (three-brakes, Reality-Trace, App-Is-Primary, Verification Doctrine DR-0076)

**Decision posture:** Tier B/C build (new feature, COLG-facing, real recordings) — it soaks before it ships. Nothing here is built yet. This doc is the research-first survey + the in-app best-way documentation that precede a decision. Church-NAS holdings: **`pending inventory`** until read-only access exists.
