# Research-Review — The Body's Study → Structured Course Materials (sovereign NAS pipeline)

**Date:** 2026-06-23
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — survey options with citations + trade-offs → recommendation. **No pipeline code written.** This is the design review that precedes the build.
**Status:** DRAFT for Darrell's review. Quality gate, not a hold parked on Darrell.

---

## TL;DR

**The goal:** turn the church Body's living study — Bishop Gwin's Word *and the congregation's contributions* (Q&A, discussion, collaborative study) as they "discuss Yahweh's perspectives explicitly" — into structured **course materials** inside the PoeTech app: objectives, segments, scripture refs, the Body's contributions, trivia → Learn + Presenter + Study + clips. Faithful to the Word, served-not-surveilled, behind compute brakes, sovereign on our own hardware.

**The honest headline from the NAS inventory (read-only, completed 2026-06-23):** the recorded services / Bible-studies that this pipeline is supposed to *consume are not currently on the NAS.* The on-NAS church corpus is **historical media-production work** — 4 sermon-titled Adobe Premiere projects from 2015 and a 2015 church document — plus family phone backups. The recent Body-study content lives **on the COLG YouTube stream** (`church-live.js` embeds it, never pulls it) and in **Bishop Gwin's emailed Wednesday messages** (text, Gmail-OAuth-blocked). **So the real first link of this pipeline — the one Darrell's "pull from the NAS, not YouTube" directive assumes already exists — is a sovereign INGEST step that lands the recordings onto the NAS in the first place.** That gap is the work; naming it is this review's most important finding (Reality-Trace, Verification Doctrine).

**The recommendation in one line:** build the **ingest-first, human-in-the-loop, faithfulness-gated** pipeline — *land the recording on the NAS → local faithful transcript (Whisper + scripture-aware correction + verse-parser verification) → consent/PII scrub → human-reviewed structured lesson → publish newest-first behind the three brakes* — reusing every proven piece (`sme-pipeline`, `learn-framework`, the Presenter contract, the trivia lane, Study) and adding only the two genuinely-missing links: **sovereign ingest** and the **faithfulness gate.**

---

## 0. What this builds ON (proven pieces — reference, do NOT rebuild)

Every one of these is already on `main` and verified. The new pipeline is a *spine that connects them*, not a rewrite.

| Proven piece | Where it lives | What it already does | Role in this pipeline |
|---|---|---|---|
| **SME video→spec pipeline** | `infra/nas-sme-pipeline/` (README, `transcribe.py`, `sme-video-to-spec.sh`, `Dockerfile`, `buildspec-prompt.md`) | faster-whisper `large-v3-turbo` INT8 in an isolated container → transcript → local Ollama `qwen2.5:14b` → structured `spec.md`. Manual-run, no cron (three brakes). | **The transcription + extraction engine.** Re-pointed from "build spec" to "lesson spec." |
| **Learn framework** | `app/src/lib/learn-framework.js` (`LEARN_LEVELS`, `AGE_BANDS`, `resolveLevel`, `gradeQuiz`, `QUIZ_PASS_RATIO`, `courseAssessment`, `chunkLessonForAge`, `lessonPlanForAge`) | Skill-level branching (teen/standard/senior) + age-adaptive pacing + real (never-painted) assessment + graduate→helper. | **The lesson schema + delivery.** A study session becomes a `MODULES`-shaped lesson. |
| **Course pattern ("Jennings"-style)** | `app/src/lib/church-classes.js`, `app/src/lib/broadcast-class.js`, `app/src/components/ChurchLearn.jsx` | Two shipped courses prove the authored-`MODULES` schema: `{id,title,bigIdea,lesson,anchor,media,levels,quiz,facilitator}`. | **The target output shape** the extractor fills. |
| **Universal Presenter** | `app/src/components/Presenter.jsx` + `app/src/lib/presentable.js` (per memory `project_universal_presenter`); rendered via `ChurchLearn.jsx` `AgePacedLesson` | scenes = audience + presenter-notes (no-leak); time-adaptive segments/breaks; ALL Learn courses + The Word teach through it. | **The teach surface.** A lesson plays as a paced presentation. |
| **BG Wednesday trivia Q&A** | `app/src/components/Engagement.jsx`, `app/src/lib/engagement-sync.js` (`uploadTriviaAnswer`, `sendMessage`, `subscribeMessages`); `trivia_answers` table | BG poses questions at the end of a message → in-app answers, app-side grading, RLS-scoped. Currently a static John 18 anchor set; weekly pipeline blocked on Gmail OAuth. | **The trivia output.** Questions the Body raised become the lesson's check-for-understanding. |
| **Study reflection lane** | `app/src/lib/study-space.js` (`KINDS`, `captureExchange`, `distillState`, `loadStudy`/`saveStudy`), `app/src/components/Study.jsx` | Private device-local rooms (reflection/processing/research); deep↔plain distillation; pinned, newest-first. | **The Body's contribution capture + Darrell's Yahweh-study append rule** (`yahweh-discussions.md`). |
| **Church-Live** | `app/src/lib/church-live.js` (`liveStatus`, `liveStreamEmbedUrl`, `latestUploadEmbedUrl`), `ChurchVideoWall.jsx` | Honest live/offline gating off the service schedule; latest-upload fallback; zero YouTube API key. | **The clip surface + the upstream signal** that a service happened (so ingest knows there's something to pull). |

**Reuse, not rebuild, is itself a constraint resolution:** this design adds the *two* missing links and wires the rest.

---

## 1. NAS content inventory (read-only, 2026-06-23)

Reached the NAS over SSH read-only (`dpoe@192.168.1.26`, DS1621xs, DSM 4.4.302+). **Nothing moved or modified — listings only.**

### What church/study media actually exists on the NAS

| Location | What's there | Relevance |
|---|---|---|
| `/volume1/NetBackup/*.prproj` (×4) | **Sermon-titled Adobe Premiere projects, 2015:** "030115 Let's Get It Done", "031515 Get Ready It's Going To Rain", "040515 Sombody Is Going To Get Saved", "Isaiah.prproj". Plus `Adobe Premiere Pro Preview Files/`. | **Historical media-production archive.** Project files, not necessarily the rendered video. Proves the church-media muscle (the Broadcast course's lineage), but it's a decade old. |
| `/volume1/NetBackup/Christina Poe/church/` | One 2015 church document (PDF). | Historical. |
| `/volume1/photo/` (~200 GB) | Large family-media library: family videos (2012–2022), photos, school/IEP videos, a few singing clips ("Christiana Poe - Singing at The Love Cor"). **No recorded services / Bible studies.** | Family content, not church-study source. Confirms the Photo-sovereignty memory but is out of scope here. |
| `/volume1/homes/cpoe/Photos/MobileBackup/Christina's Z Fold7/` | Recent (2025–2026) phone backups — motion-photo `.mp4`s, camera roll. | **The only recent media on the NAS is personal phone backup**, not church recordings. |
| `/volume1/Media/`, `/volume1/PlexMediaServer/` | **Empty** (placeholder folders only). | The "obvious" media shares hold nothing. |
| `/volume1/PoeTech/sme-pipeline/` | The transcription pipeline, **pre-built and idle**: `large-v3-turbo` INT8 model cached under `models/`; `input/` and `output/` empty. | **Ready to run the moment a recording lands.** |
| Local Ollama (`127.0.0.1:11434`) | Models present: `qwen2.5:14b-instruct-q4_K_M`, `qwen2.5:3b`, `hermes3:8b`, `deepseek-r1:8b`, **`nomic-embed-text`** (embeddings — enables on-NAS RAG/verse-grounding). | The extraction + (future) retrieval brains are already local and sovereign. |

### The inventory's verdict (state the premise out loud — Reality-Trace step 4)

- ✅ **The engine is on the NAS and idle.** Whisper model cached, Ollama models present, pipeline scaffolding ready.
- ❌ **The fuel is not on the NAS.** The recent Body-study recordings Darrell describes are **not** sitting on our storage as files. They are on the **COLG YouTube channel** (streamed, embedded by `church-live.js`, never downloaded) and in **BG's emailed Wednesday messages** (text).
- ⚠️ **Therefore "pull from the NAS, not YouTube" describes the *destination state*, not today's reality.** The directive is right as a *principle* (sovereignty: our copy, our box, no scraping a third party's platform as the system-of-record). But operationally, the first link that must exist is **getting a sovereign copy onto the NAS** — and the cleanest, consent-clean way to do that is a one-time **upload/record-direct-to-NAS** path for the media team, *not* a YouTube scraper. (Options in §5.)

This is exactly the "a human would have known" check the Reality-Trace rule exists to force: don't build a display layer over data that isn't there.

---

## 2. The recommended pipeline (shape)

```
  [0] SOVEREIGN INGEST            recording lands on the NAS (media-team upload / record-to-NAS),
      (the missing link)          NOT a YouTube scrape. church-live signals "a service happened."
            |
  [1] LOCAL FAITHFUL TRANSCRIPT   sme-pipeline: faster-whisper large-v3-turbo INT8
            |                      + scripture-aware initial_prompt (book names, BG/COLG proper nouns, KJV register)
            |                      -> transcript.txt + transcript.json (timestamps)
            |
  [2] FAITHFULNESS GATE           verse-parser detects every scripture ref; each quoted verse is
      (the new quality gate)       checked against a local canonical KJV/ESV text -> flagged if it drifts.
            |                      A misquote attributed to a speaker NEVER ships unverified.
            |
  [3] CONSENT / PII SCRUB         Presidio (local NER + regex) strips congregant names, prayer requests,
            |                      personal testimony -> redacted/pseudonymized working transcript.
            |
  [4] STRUCTURED LESSON           local Ollama (qwen2.5:14b) + lesson-extraction prompt ->
            |                      MODULES-shaped draft: objectives, segments, anchor refs,
            |                      THE BODY'S CONTRIBUTIONS (Q&A/discussion), trivia.
            |
  [5] HUMAN REVIEW                Governor-gated queue in-app: faithfulness flags + consent flags shown;
            |                      Darrell/BG approve, edit, or reject. Nothing publishes un-reviewed.
            |
  [6] PUBLISH (newest-first)      lesson -> Learn (course/series), Presenter (teach), Study (reflection seed),
                                   trivia -> Engagement, clips -> Church surfaces. By series, not all-at-once.
```

**Why this order:** transcript → **verify the Word before anything else touches it** → scrub people → structure → human gate → publish. The two gates ([2] faithfulness, [3] consent) sit *upstream of the LLM* so the model never structures content that's either misquoted or un-consented. The human gate [5] is the Cage: the system *advises with receipts*, the human *decides* (DR-0076 §9).

---

## 3. Constraint resolutions (options surveyed → recommendation)

### Constraint 1 — Transcription accuracy on the Word (a misquoted verse is unacceptable)

The threat is specific: proper nouns (Bishop Gwin, COLG, biblical names), scripture book/verse refs, and KJV-register phrasing. Whisper "excels at generalizing but loses accuracy on specific vocabularies" — exactly our failure mode ([arXiv:2410.18363](https://arxiv.org/abs/2410.18363)).

| Option | What it is | Trade-off |
|---|---|---|
| **A. Bigger model only** | Run `large-v3` (full) instead of `-turbo`. | Marginal proper-noun gain; **much** slower on CPU (we're already CPU-bound). Doesn't *verify* anything. |
| **B. Fine-tune Whisper on church audio** | Train on labeled COLG recordings. | Best raw accuracy *in theory*, but "demands extensive labeled audio data that is hard to acquire" and "overfits on data scarcity" ([arXiv:2410.18363](https://arxiv.org/abs/2410.18363)). We don't have a labeled corpus. Heavy, GPU-era. |
| **C. Contextual biasing / `initial_prompt`** | Feed Whisper a domain vocabulary (the 66 book names, "Bishop Gwin", "Church of the Living God", common KJV phrasings) as a biasing prompt — no retraining. | "Significantly reduced WER across all model sizes... resilient where fine-tuning overfit" ([arXiv:2410.18363](https://arxiv.org/abs/2410.18363)). Cheap, no training data, runs today. **Improves but does not guarantee.** |
| **D. Post-hoc scripture verification** (the verifier) | Detect every ref with a Bible-verse parser, then check the quoted text against a **local canonical** KJV/ESV; flag any drift for human review. | Libraries exist and are mature: [`pythonbible`](https://github.com/avendesora/pythonbible) (`get_references()` + canonical text retrieval), [python-scriptures](http://www.davisd.com/python-scriptures/), [bible-verse-parser](https://github.com/eliranwong/bible-verse-parser). Turns "trust the transcript" into "verify the quote." Doesn't fix mis-hearing, but **catches it**. |

**Recommendation: C + D together — bias the input, verify the output.** Use a scripture-aware `initial_prompt` (Option C) to reduce errors at the source, then run the **faithfulness gate** (Option D) so every verse reference the transcript attributes to a speaker is checked against canonical text and *flagged if it drifts*. A flagged verse goes to the human queue [5] — it never publishes as a silent claim. This is the Verification Doctrine made mechanical: *measure, don't claim; proven-to-catch; a misquote is expensive to ship.* Fine-tuning (B) is parked for the GPU era with a re-review tied to "labeled COLG corpus exists." Per SCRIPTURE-REFERENCE-STANDARD: ESV primary, KJV secondary; **fetch the actual translation, never reconstruct a verse from the model.**

### Constraint 2 — Faithful to Yahweh's-perspective / Word-first / the BODY's contributions (not just the pastor)

| Option | What it is | Trade-off |
|---|---|---|
| **A. Pastor-monologue extraction** | Structure only BG's teaching. | Simplest, but **violates the directive** — Darrell explicitly named the Body's contributions (congregation Q&A, collaborative study) as source. |
| **B. Speaker-diarized extraction** | Diarize the transcript (who-spoke-when), then structure both the Word *and* the Body's questions/insights as first-class lesson elements. | Faithful to the directive; diarization on CPU is doable (whisperX/pyannote) but adds compute + a privacy surface (see Constraint 3). Maps cleanly onto the `MODULES` schema: BG's teaching → `lesson`/`anchor`; the Body's Q&A → a new `bodyContributions[]` + `quiz` (their questions become trivia). |
| **C. Worldview-grounded prompt** | The extraction prompt is explicitly anchored to the Word-first, non-denominational, Yahweh's-perspective frame (THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW, THE-WAY, SCRIPTURE-REFERENCE-STANDARD). The model **extracts and organizes, never improvises theology** (CLAUDE.md "does NOT improvise theology"). | Essential regardless of A/B. The faithful-intent question is *already settled* by the source itself — the Body states Yahweh's perspective plainly on the recording, so we structure what was said, we don't paraphrase intent. |

**Recommendation: B + C.** Diarize so the **Body's contributions are first-class** (the directive's heart), and ground the extraction prompt in the worldview spine so structuring stays Word-first and the model organizes rather than invents. Extend the lesson schema with a `bodyContributions[]` field and route congregation questions into the existing trivia lane. The Religion-AND-Relationship test and the eight-question Test run against every published lesson (CLAUDE.md).

### Constraint 3 — Privacy / consent in live-service recordings (served-not-surveilled)

Congregant names, prayer requests, and personal testimonies in a recording **must be scrubbed or consented before becoming shareable material** (DATA-AS-EMPOWERMENT-NOT-EXTRACTION, COMMUNITY-FIRST-MISSION, QUALITY-OF-LIFE).

| Option | What it is | Trade-off |
|---|---|---|
| **A. Manual review only** | A human reads every transcript and redacts by hand. | Safest, zero false-negatives if done well, but doesn't scale and is the slow link. Keep as the *final* gate, not the *only* one. |
| **B. Automated PII scrub — [Microsoft Presidio](https://github.com/microsoft/presidio)** | Open-source, local (NER + regex + checksum) detection of names/emails/phones; Analyzer flags → Anonymizer redacts/pseudonymizes "before storing transcripts" ([microsoft/presidio](https://github.com/microsoft/presidio)). Customizable recognizers (add "prayer-request"/testimony patterns). Runs on the NAS, nothing leaves. | Not perfect recall on free-form testimony (it's NER, not intent) — so it's a *first pass that surfaces*, with the human as backstop. Mature, permissive license, image-redaction too (Tesseract OCR) for on-screen lower-thirds. |
| **C. Consent-at-source** | Media team marks segments as "teaching (shareable)" vs "personal (private)" at ingest; or a standing congregation consent posture for the teaching portion. | The cleanest — consent is *governance*, not just tech. Pairs with B. The teaching/Word portion is inherently shareable; the prayer/testimony portions default private unless explicitly consented. |

**Recommendation: C (consent governance) + B (Presidio auto-scrub) + A (human backstop) — layered.** Default posture: **private unless the segment is the teaching of the Word, which is shareable.** Presidio scrubs names/PII automatically and surfaces every hit; the human review queue [5] shows consent flags alongside faithfulness flags; nothing publishes until cleared. This is *served-not-surveilled* enforced as a gate, not a promise. (Note: Surveillance-Station camera feeds on the NAS are **out of scope** — this pipeline touches *teaching recordings only*, never the building cameras.)

### Constraint 4 — Curation + volume (newest-first, by series, behind compute brakes)

| Option | What it is | Trade-off |
|---|---|---|
| **A. Batch-everything backfill** | Transcribe the whole archive at once. | On a CPU NAS this is the runaway risk the three-brakes rule exists to prevent (1–3× media length per hour of video). Floods the review queue. **No.** |
| **B. Newest-first, one-series-at-a-time, manual-run** | Process the most recent service/study first; advance by series; a human runs each batch; budget + single-instance lock + kill-switch. | Matches `sme-pipeline`'s existing manual-run, three-brakes posture exactly. The review queue stays human-sized. Honest "N of M processed" surfaced, never silently capped. |
| **C. GPU-era acceleration** | When the dual-3090 box (per the COLG-9k build review) lands, the same script gets dramatically faster — change `WHISPER_COMPUTE`, point at a CUDA image; pipeline shape unchanged. | The scale answer is *hardware*, not loosening the brakes. Re-review tied to "GPU box online." |

**Recommendation: B now, C later.** Newest-first by series, manual-run, all three brakes (budget / concurrency lock / kill-switch) — non-negotiable per the 2026-06-06 runaway lesson (FEEDBACK_AUTONOMOUS_AUTOMATION_THREE_BRAKES). **Backfill is opt-in, batched overnight, and never auto-fired.** Curation surfaces newest-first in-app, grouped by series, exactly like the existing course catalog.

---

## 4. Required screens (Darrell's standard)

### Sovereign-mesh compatibility tier (1–4)

**Tier 1 — fully sovereign, runs today on our own hardware.** Every step is local: ingest to our NAS, faster-whisper + Ollama + Presidio + the verse-parser all on the DS1621xs, publish into our own app. **The only non-sovereign dependencies are deliberately excluded** — we do *not* scrape YouTube as system-of-record (that's why ingest-to-NAS replaces it), and the canonical scripture texts are bundled locally (KJV public-domain; ESV per SCRIPTURE-REFERENCE-STANDARD licensing). Nothing in the core path calls a third-party API. This is the strongest sovereignty tier in the build.

### MVP-pragmatism check

**MVP = one service, end to end, by hand-run.** Don't build the orchestrator first. The leanest valuable slice:
1. Media team **uploads one recent recording** to `sme-pipeline/input/` (manual; the ingest "link" is literally a file copy for the MVP).
2. Run the **existing** `sme-video-to-spec.sh` with a scripture-aware prompt → transcript.
3. Run the **faithfulness gate** (verse-parser + canonical check) as a small standalone script → flag list.
4. **Hand-review** the transcript + flags (Presidio optional in MVP; human reads it — A is the floor).
5. Hand-author the first `MODULES` lesson from the structured output → it teaches through the **existing** Presenter.

That proves the whole shape with **zero new infrastructure** — only a prompt, a verification script, and a lesson file. Everything past that (auto-diarization, Presidio automation, the in-app review queue, series curation) is an *increment on a working spine*, added newest-first. This honors *confirm-need → smallest-change → verify-live → land-it*.

### Cost-efficiency screen

- **Growth justification:** the church Body produces teaching *every week* (Sunday services + Wednesday Bible study + BG's Wednesday message). That's a perpetual content stream that today evaporates into a YouTube archive nobody re-studies. Turning it into structured, re-teachable, searchable course material is **compounding** — each week adds to a sovereign curriculum the community owns. This is the Black-church-as-economic-powerhouse frame: the Body's own intellectual output becomes its own owned asset, not a platform's training data.
- **Unit cost (today, CPU):** marginal cost per recording ≈ **electricity + operator attention.** No API spend (local Whisper + local Ollama + local Presidio + local verse-parser). Transcription is 1–3× media length on the DS1621xs (an hour of video ≈ a couple hours, batched overnight) — *time*, not *dollars*. Versus a managed transcription/structuring SaaS at ~$0.006–0.02/min + per-seat LLM fees, the sovereign path's recurring cash cost is **≈ $0** and the data never leaves the box.
- **Lean alternative (if this is ever judged too heavy):** skip ingest + diarization entirely and run the pipeline on **BG's emailed Wednesday message text** (already text, no transcription, no audio-privacy surface) once Gmail OAuth is connected — text → faithfulness gate → lesson → trivia. That's the *cheapest possible wedge* and it reuses the trivia lane that's already built and waiting on that same OAuth. **Recommended as the literal first increment** while audio ingest is designed.

### Father's-Business test (does it serve souls?)

**Yes — directly.** This takes the living teaching of the Word *and the Body's own wrestling with Yahweh's perspectives* and makes it **re-studiable, age-paced, searchable, and shareable** to people who couldn't be in the room, in a sovereign system the community owns and that will never sell or mine their worship. It serves the elderly tech-novice COLG staff (COMMUNITY-FIRST-MISSION's named first community), it disciples (graduate→helper, 2 Tim 2:2), and it keeps the Word faithful by *verifying every quote* rather than letting a machine misattribute scripture to a man of God. The faithfulness gate is itself an act of reverence: *we will not let a misquoted verse go out under a preacher's name.* Religion (verified, Word-first, structured) **and** relationship (the Body's voice carried, age-met, served not surveilled). It passes the eight-question Test.

---

## 5. The two genuinely-new links (what to actually design next — NOT built here)

1. **Sovereign ingest** — the missing first link. **Recommended approach: record/upload direct to NAS, not a YouTube scraper.** Options to design: (a) media team uploads the rendered service file to a watched `input/` share after each stream (manual, consent-clean, MVP-ready); (b) record-to-NAS at the broadcast source (cleanest long-term, ties to the Broadcast course + future GPU/capture build); (c) *if and only if* a sovereign copy of an already-public stream is genuinely needed, a one-time authenticated export of **our own** channel's content — never third-party scraping, never as system-of-record. Decision belongs to Darrell + the media team.
2. **The faithfulness gate** — verse-parser + local canonical check as a standalone, **proven-to-catch** script (seed it a known-misquoted transcript; it must flag it before it's trusted — DR-0076 §3). This is the new quality primitive and the most important new code in the whole build.

Everything else is reuse + wiring.

---

## 6. Recommendation (rationale, for the ledger)

**Build the ingest-first, faithfulness-gated, human-reviewed pipeline — newest-first, behind the three brakes — reusing every proven piece and adding only sovereign ingest + the faithfulness gate.** Specifically:

1. **Start with the text wedge** (BG's Wednesday message → lesson + trivia) once Gmail OAuth lands — cheapest increment, reuses the waiting trivia lane, zero audio-privacy surface.
2. **Then the one-recording MVP** — manual upload → existing `sme-pipeline` with a scripture-aware prompt → faithfulness gate → hand-authored first lesson teaching through the existing Presenter.
3. **Bias the input, verify the output** (Constraint 1: C+D) — scripture-aware `initial_prompt` + post-hoc verse verification; a flagged verse never publishes silently.
4. **Carry the Body's voice** (Constraint 2: B+C) — diarize, make congregation Q&A first-class (`bodyContributions[]` + trivia), ground extraction in the worldview spine; the model organizes, never improvises theology.
5. **Served-not-surveilled** (Constraint 3: C+B+A) — consent-at-source (teaching = shareable, personal = private by default) + Presidio auto-scrub + human backstop; teaching recordings only, never the building cameras.
6. **Curate newest-first, three brakes** (Constraint 4: B now / C on GPU) — manual-run, budget + lock + kill-switch; backfill opt-in and overnight; honest "N of M," never silent caps.
7. **The human governs the bright line** — an in-app Governor-gated review queue shows faithfulness + consent flags; Darrell/BG approve, edit, or reject; nothing publishes un-reviewed. The system advises with receipts; the human decides.

**Why this and not the obvious "scrape YouTube and auto-publish":** because the inventory proved the recordings aren't on the NAS, because a CPU NAS auto-backfilling the whole archive is the exact runaway the three-brakes rule forbids, and because *a misquoted verse or an un-consented testimony is unacceptable* — so verification and consent are gates, not afterthoughts. Faithful, sovereign, served-not-surveilled, and verifiably right.

---

## Sources (June 2026 — re-verify at build time)

- Contextual biasing for domain vocabulary in Whisper (no fine-tuning): [arXiv:2410.18363](https://arxiv.org/abs/2410.18363)
- Bible-verse reference parsing + canonical text: [pythonbible](https://github.com/avendesora/pythonbible), [python-scriptures](http://www.davisd.com/python-scriptures/), [bible-verse-parser](https://github.com/eliranwong/bible-verse-parser)
- PII detection / de-identification (local, open-source): [microsoft/presidio](https://github.com/microsoft/presidio)
- On-NAS pipeline: `infra/nas-sme-pipeline/README.md` (this repo)
- Foundations: `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`, `SCRIPTURE-REFERENCE-STANDARD.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (2026-06-06), CLAUDE.md (three-brakes, Reality-Trace, Verification Doctrine DR-0076)

**Decision posture:** this is a Tier B/C build (new feature, COLG-facing, real recordings) — it soaks before it ships. Nothing here is built yet. This doc is the research-first survey that precedes a decision.
