# Spec + Research-Review — Keyboardist SME → Music-Lessons curriculum in Learn (lessons, finger-placement, auto-fingering, dual-mode, build-your-music, worship self-critique)

**Date:** 2026-06-24
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — reuse proven machinery, cite live sources for new model choices, no feature code written here. This is the design + research review that precedes the build.
**Status:** DRAFT for Darrell's review. Quality gate, not a hold parked on Darrell.
**Builds on:** the SME video→knowledge pipeline (`infra/nas-sme-pipeline/`, built + verified 2026-06-23/24) and its **choir keyboardist source** (Christian) — this spec adds a SECOND output of that same source: a music-lessons learning path in Learn.
**Sibling lanes (reuse, do not collide):** Learn framework (`learn-framework.js`), Choir Song Workshop (`song-workshop-sync.js`, lane local_93003caa), the Worship/music section spec (`2026-06-23-christian-rap-hottest-worship-section-spec.md`), Presenter (PR #306, on main — NOT on this branch), the reactions primitive (spec-only).

---

## TL;DR

Christian, the COLG choir keyboardist, is already a consented SME source feeding choir songs (keys/arrangements/technique → `choir_song_ideas`). Darrell adds: his captured instruction should **also** become a **keyboard/music learning path in the Learn area** — the same SME video → transcribe → structured-content engine, pointed at the existing Learn lesson framework instead of the choir table. Built for Darrell's **son (age 10)** first, and for any young musician / choir member.

Six components, in build order of readiness:

- **A — Keyboard lessons in Learn (ready-ish now).** Christian's lesson videos → the SME pipeline (a new *lesson-extraction* profile) → structured Learn modules (`{title, bigIdea, lesson, levels, media, quiz, anchor}`) consumed by the **already-built** Learn engine (`learn-framework.js`: age-bands, skill-levels, quiz/mastery, graduate→helper). A new "Keyboard & Music with Christian" course. CPU-NAS does the transcription; the lesson engine is pure front-end.
- **B — Finger-placement instruction (core component).** Capture his hand-on-keys demonstrations and structure them as **foundational technique**: finger numbers (standard 1–5), hand position, common patterns/scales, progressive fundamentals→patterns→pieces. Presented with a **visual keyboard diagram** (finger-number overlays synced over time), not just prose. Correct habits early (train-up-a-child).
- **C — Music-Listen → Auto Finger-Placement (research-review, GPU-gated).** Given a song's audio → (1) **audio→notes** (Basic Pitch / ByteDance high-res piano transcription), (2) **notes→fingering** (PIG-dataset models / open piano-fingering nets), (3) **notes+fingering→playable lesson** synced to the audio. **Honest:** AMT + fingering are imperfect (esp. polyphonic full-band audio); the output is an **assistive draft the keyboardist verifies/corrects**, never gospel. Heavy compute ⇒ **GPU box**, not the CPU NAS.
- **D — Study with OR without a teacher (dual-mode).** **Self-directed:** fully self-guided, adaptive (mastery-gated progression, auto-fingering guide, practice prompts, never-stuck help) — leaning on the adaptive-LMS pattern + the **anxiety-clarity principle** (every step answers what/when/why/how, err toward MORE guidance). **Teacher-led:** Christian assigns, sees progress, verifies/corrects. Same content, a toggle.
- **E — "Build your music" (strategic creation process).** A repeatable 8-stage pathway to **create original, Christ-centered music** (inspiration → melody → harmony → structure → lyrics → arrangement → practice → finish/publish), each stage with what/why/prompts/milestone, solo-or-teacher, wiring the lessons → creation → publish loop (present in the music section; ties promote-those-promoting-Yahweh).
- **F — Worship self-critique / review.** When a learner **presents skills "on the altar"**, capture it (owner-private; +guardian for minors; +teacher if opted in), have them **self-review first**, then offer **specific, encouraging, growth-oriented** feedback. **Binding tone guardrail:** never harsh/shaming/scoring — affirm effort + heart first; formation, not judgment. **Spiritual frame:** an offering to Yahweh, excellence as worship (Col 3:23), grace-centered — never performance anxiety, works-righteousness, or comparison.

**Cross-cutting binding constraints:** child-safe + **guardian-scoped + COPPA-aware** for the minor; **consented** (Christian is the recorded teacher); **faithful extraction** (never invent a key, fingering, or technique he didn't teach); **owner/circle-scoped** (never public); **sovereign/local** (videos + models on the NAS / GPU box, nothing leaves the box); any timer-driven automation is **Tier C + three brakes, inactive on ship**.

---

## 0. Scriptural foundation (Word-first — fetched ESV, not from memory)

> **ESV — Proverbs 22:6:** *"Train up a child in the way he should go; even when he is old he will not depart from it."*

> **ESV — Colossians 3:23:** *"Whatever you do, work heartily, as for the Lord and not for men,"*

Prov 22:6 is the **formation** mandate: building correct musical technique early in a 10-year-old is "training up in the way he should go" applied to a gift. Col 3:23 is the **worship** frame for Component F: skill offered to Yahweh, done heartily as for Him — which is why the self-critique is grace-centered growth, not performance scoring. Both are printed in the surface's mission copy, not merely implied.

---

## 1. What this builds ON (proven pieces — reuse, do NOT rebuild)

Verified by code survey on this branch (`docs/feature-workflow-register`), 2026-06-24.

| Proven piece | Where | What it already does | Role here |
|---|---|---|---|
| **SME video→knowledge pipeline** | `infra/nas-sme-pipeline/` (NAS `/volume1/PoeTech/sme-pipeline/`) | video → faster-whisper transcript → local Ollama → structured output; isolated, braked, manual-run; **verified twice** | The transcription + extraction substrate. Add a **lesson-extraction profile**. |
| **Learn framework** | `app/src/lib/learn-framework.js:1–318` | Module shape `{id,title,bigIdea,lesson,levels,media,quiz,anchor,facilitator}`; `LEARN_LEVELS` (teen/standard/senior); `AGE_BANDS` (child 6-10 / youth / teen / adult / senior) + `chunkLessonForAge` + `lessonPlanForAge`; `gradeQuiz` (PASS=0.7); `courseAssessment` → `{progressPct, complete, eligibleToHelp}` | **The lesson engine.** Keyboard lessons are modules in this shape. The son uses the `child` band. |
| **Course catalog pattern** | `app/src/lib/church-classes.js`, `broadcast-class.js`; `components/ChurchLearn.jsx` | `CLASS_META` + `MODULES` + `buildSchedule` + `exportCurriculumMarkdown`; progress from `data.classProgress` | The course-registration + render path. Add a "Keyboard & Music" course. |
| **Choir Song Workshop** | `app/src/lib/song-workshop-sync.js`; migration `0036` | `choir_song_ideas {title,key_label,arrangement,note,status}` + RLS (member read / director write) | The **keys/arrangements** cross-reference. Lesson content that names a song enriches the same rows (Christian's other output). |
| **TTS (read-aloud)** | `app/src/lib/tts.js`; `TTSControl` | Web Speech API, `segmentText`, rate steps, per-device prefs | Read lesson steps aloud (a 10-year-old who can't yet read fluently). |
| **Voice dictation** | `app/src/lib/voice-dictation.js` (`useVoiceDictation`) | type-OR-speak, on-device | "Tell the app what you practiced," hands-busy interaction at the keys. |
| **Minor/guardian gate** | `app/src/lib/install-help.js:96–114`; `interest-sync.js` | `validateInterest` requires `parentConfirmed` when `isMinor`; stores `is_minor`/`parent_confirmed` | The seed of guardian-scoping. Extend for COPPA (see §8). |
| **Multi-point auth** | `app/src/lib/multi-point-auth.js` | identity/device/PIN; `decideAccess`; no-lockout fallback | Gate the minor's private worship-review captures (PIN/guardian). |
| **Scripture anchor** | module `anchor:{ref,theme}` pattern | reference-only, never a quoted verse in data | Word-first anchor on lessons + the creation/worship surfaces. |

**NOT on this branch (honest — reality-trace):**
- **Presenter** (`components/Presenter.jsx`, `lib/presentable.js`) — PR #306 is on `main`, **absent here**. Component F's capture/present surface depends on it; the build must confirm Presenter is on `main` first (it is, per MEMORY) or fall back to a simple capture.
- **Reactions primitive** (love/amen/fire/praise in `shared.jsx`, `media_reactions` table) — **spec-only, not built.** Components E/F reference it; they degrade gracefully until it ships.
- **`lib/learn-engagement`** referenced in `learn-framework.js:173` — does not exist; engagement-tuning is aspirational.

---

## 2. Component A — Keyboard music-lessons track in Learn

**Goal.** Christian's lesson videos become a structured, age-adaptive keyboard course in Learn, usable by Darrell's son and other young musicians.

**The flow (reuses the SME pipeline + the Learn engine):**

```
  Christian's lesson video (NAS intake)
    -> faster-whisper transcript          (existing container)
    -> local Ollama + LESSON-extraction prompt   (new profile)
    -> lessons.json  (array of Learn-module objects) + lessons.md (review)
    -> reviewed -> a "Keyboard & Music with Christian" course in Learn
```

- **New SME-pipeline profile** (mirrors the verified choir profile, additive): `keyboardist-lesson-to-course.sh` + `keyboard-lesson-prompt.md` / `keyboard-lesson-json-prompt.md`. The JSON prompt shapes output to the **`learn-framework` module schema** so it drops straight into a course:
  ```json
  {
    "course": { "teacher": "Christian", "role": "COLG choir keyboardist", "title": "Keyboard & Music with Christian" },
    "modules": [
      {
        "id": "kbd-01-hand-position",
        "title": "string",
        "bigIdea": "one-sentence takeaway",
        "lesson": "the teaching text (his substance, faithful)",
        "levels": { "teen": "…", "standard": "…", "senior": "…" },
        "media": [ { "type": "fingering|video|diagram", "title": "…", "status": "pending-capture" } ],
        "fingering": { /* see §3 */ },
        "quiz": { "questions": [ { "q": "…", "options": ["…"], "answer": 0, "explain": "…" } ] },
        "anchor": { "ref": "Colossians 3:23", "theme": "skill offered heartily to the Lord" },
        "source_quote": "a direct quote anchoring the lesson (faithfulness check)",
        "confidence": "high|med|low"
      }
    ],
    "unclear": [ "gaps to confirm with Christian" ]
  }
  ```
- **Faithfulness (binding):** capture only what he teaches; null/“(not stated)” for anything he didn't say; ambiguities → `unclear`, never guessed into a field. His instruction is the asset.
- **Age-adaptive:** the engine already chunks/paces by band (`child` for the son: 45-word segments, frequent checks, hands-on, encouraging tone). No new work — the lessons just declare content; `lessonPlanForAge` does the rest.
- **Placement (new module, never the monolith):** `app/src/components/MusicLessons.jsx` + `app/src/lib/music-lessons.js`; registered in the Learn catalog; one nav line. Course progress reuses the existing `classProgress` pattern (no second progress table).
- **Cross-reference tie:** when a lesson covers a specific song, its key/arrangement also flows to that song's `choir_song_ideas` row — the same knowledge serves both the **player** (choir) and the **learner** (Learn).

---

## 3. Component B — Finger-placement / fingering instruction (core curriculum)

**Why it's foundational.** Correct hand position and fingering built early is "training up in the way he should go" for the hands — bad habits are expensive to unlearn. This is a **first-class component of the curriculum**, not an add-on.

**What is captured.** Christian's videos show his hands on the keys. Capture, per lesson:
- **Finger numbers** — the universal 1–5 system (thumb=1 … pinky=5), both hands.
- **Hand position** — posture, wrist height, curved fingers, thumb-under / cross-over.
- **Patterns & scales** — five-finger positions, common scales (C, G, F…), chord shapes, the comping patterns he actually uses in worship.
- **Progression** — fundamentals (hand position, five-finger patterns) → patterns (scales, chord voicings, turnarounds) → pieces (apply to a real song).

**How it's taught / presented (the design):**

1. **A reusable visual keyboard diagram** — `components/KeyboardDiagram.jsx` (new, dependency-free SVG, same posture as the Creation Workspace's native-SVG approach). It renders an octave (or two) of keys and overlays **finger-number badges** on the keys to press, color-coded by hand (e.g., left/right). A small, legible, high-contrast widget (WCAG AA; large-print friendly via the existing text-size primitive).
2. **Fingering data shape** (lesson-level, also the auto-fingering output target in §4):
   ```json
   "fingering": {
     "hand_position": "C five-finger position, right hand",
     "steps": [
       { "t": 0.0, "note": "C4", "midi": 60, "hand": "R", "finger": 1 },
       { "t": 0.5, "note": "D4", "midi": 62, "hand": "R", "finger": 2 }
     ],
     "patterns": ["C major five-finger", "I–IV–V turnaround in C"]
   }
   ```
   `finger` ∈ 1..5; `hand` ∈ L/R. This is the contract shared by the human-authored lessons (B) and the auto-generated drafts (C), so one renderer serves both.
3. **Three presentation modes**, learner-selectable:
   - **Static diagram** — the hand position for a pattern/scale, finger numbers labeled (the fundamentals).
   - **Step-through** — tap forward note-by-note; the diagram highlights the next key + finger; paired with the read-aloud step text (TTS) so a young learner isn't blocked on reading.
   - **Play-along (synced)** — for a piece, the finger sequence scrolls/highlights in time with the audio/video (this is where §4's output renders).
4. **Capturing fingering from his hand videos** — two paths: (a) **now:** the lesson-extraction prompt captures fingering he *states*, and Christian annotates the keyboard diagram (authoritative, faithful); (b) **later, GPU:** computer-vision fingering-from-video — the **"At Your Fingertips" (arXiv 2303.03745)** approach extracts fingering instructions directly from piano hand videos — turns his demonstrations into draft `fingering.steps` he verifies. GPU-gated, research-stage; flagged honestly, not promised.

**Child-development note (binding):** age-appropriate, guardian-scoped for the minor; emphasis on *correct habit first, speed later*; positive framing ("let's get the hand shape comfy") over correction-heavy drill.

---

## 4. Component C — Music-Listen → Auto Finger-Placement (research-review, GPU-gated)

**Goal.** Pick a song (e.g., from the Christian music library) → the system **listens** and **auto-generates the keyboard fingering** to play it → a playable lesson with finger numbers synced to the audio. "Any song → a draft keyboard lesson."

This is a **research-review with a recommended sovereign stack**, explicitly **imperfect and GPU-gated**. Three stages:

### Stage 1 — Audio → Notes (Automatic Music Transcription)

| Option | What it is | Sovereign fit | Verdict |
|---|---|---|---|
| **Spotify Basic Pitch** | Lightweight NN audio→MIDI w/ pitch-bend; **<20MB, ~17K params**; Apache-2.0; pip **and** npm (`basic-pitch-ts`); instrument-agnostic, polyphonic | **Best sovereign default.** Small enough to run **on the NAS CPU** for a rough draft, and even in-browser via the TS port (fully local, nothing leaves the device) | **Recommended tier-1.** Good for melody / simpler textures; the everyday "good-enough draft." |
| **ByteDance High-resolution Piano Transcription** (`piano_transcription_inference`, qiuqiangkong) | Regressing onset/offset times; **piano-specialized**, pedals; pip; PyTorch | **GPU box.** Highest accuracy for **solo piano** audio specifically | **Recommended tier-2 (GPU).** Use when the source is solo-piano-ish and accuracy matters. |
| **Onsets & Frames** (Magenta) | CNN+LSTM dual-objective polyphonic piano→MIDI; open; JS + Python | GPU preferred | Strong piano baseline; older than ByteDance. Optional. |
| **MT3** (Google) | Multi-task **multi-instrument** transcription | GPU, heavier | For multi-instrument arrangements; overkill for a keyboard lesson. Note only. |

**Honest constraint:** transcribing a **full-band, vocal-led worship/CHH track** to clean notes is materially harder than transcribing solo piano — accuracy degrades with polyphony, percussion, and vocals. The draft will have errors. This is why a human verifies (below). For the cleanest results, prefer source audio that is piano-forward, or a stem if available.

### Stage 2 — Notes → Fingering (auto finger-placement)

| Option | What it is | Verdict |
|---|---|---|
| **PIG dataset + Nakamura models** (3rd-order HMM / LSTM; "Statistical Learning and Estimation of Piano Fingering", arXiv 1904.10237) | The standard annotated piano-fingering corpus (100k+ tags) + the classic statistical models | The **reference baseline + training data**. |
| **PRamoneda — Automatic-Piano-Fingering** (GitHub) | Open-source neural fingering: autoregressive/seq2seq + beam search, GNN variants for polyphony | **Recommended open implementation.** Maintained, modern. |
| **PianoFingering.jl** (model-based RL) | Julia, RL approach | Experimental ("a lot of bugs" per its README). Note only. |

**Prerequisite sub-problem (honest):** fingering models assume you know **which notes are left vs right hand**. AMT output is a flat note stream — hand assignment must be inferred (pitch-split heuristic, or a hand-assignment model). This is lossy, especially for crossovers and middle-register overlaps. Another reason the output is a **draft**.

**Domain caveat:** PIG and most fingering models are trained on **classical solo piano.** Gospel/CHH **comping, pads, and chord-stabs** that Christian actually plays differ from classical etudes — the model's fingering may be technically valid but not how he'd voice it. **His correction is what makes it a real lesson.**

### Stage 3 — Notes + Fingering → Lesson

- Render via the **shared `fingering.steps` contract (§3)** into the **play-along keyboard diagram**, finger numbers highlighting in time with the audio. Reuse the lesson/Presenter pattern for the synced playback surface.
- The draft is saved as a lesson with a visible **"AUTO-DRAFT — verify with Christian"** banner. Christian (or any teacher) edits the `fingering.steps`; once verified, the banner clears and it becomes a first-class lesson — and (Component E) a piece a learner can "pick a song → learn to play it."

### Compute + sovereignty (binding)

- **GPU-gated.** ByteDance transcription + neural fingering are GPU work. The **CPU NAS is too slow for real-time**; it can run Basic Pitch for an offline rough draft only. The full listen→fingering pipeline ships on the **sovereign CUDA box** when it lands (same posture as the rest of the GPU-era plan). Until then: Basic-Pitch-on-CPU draft + heavy human correction, or wait for the GPU box.
- **Local/sovereign:** all models run on PoeTech hardware; audio + outputs stay on the box; no third-party API; nothing trains an external model.
- **Child-safe / guardian-scoped** for the son's use.

**Standing honesty banner (Verification Doctrine):** AMT and fingering are **assistive drafts, not ground truth.** Every auto-generated lesson is labeled as a draft and is **teacher-verifiable**. We never present a machine-guessed fingering as "the right way" to a child.

---

## 5. Component D — Study with OR without a teacher (dual-mode)

**Same content, two modes, a toggle.** Both are first-class.

### Self-directed (no teacher needed)
A learner (the son, any user) can progress **entirely on their own**:
- **Adaptive, mastery-gated progression** — reuse `courseAssessment` + `moduleQuizPassed` (PASS=0.7): a module unlocks the next; `lessonPlanForAge` paces it for the learner's band. (Lexia-style: you advance by demonstrating mastery, not by clicking "next.")
- **Auto-fingering guide** (§4) + **step-through diagrams** (§3) so a solo learner can see exactly which finger, which key, at their own pace, with read-aloud.
- **Practice prompts + self-check** — each lesson ends with a concrete "now try this" and a self-rated / quiz check.
- **Never-stuck affordance (anxiety-clarity principle, binding).** Every step answers **what / when / why / how**, and errs toward **MORE** guidance. A persistent **"Stuck?"** control offers: slow it down, show the hand again, break it smaller, a hint, or "ask Christian" (queues a question for the teacher mode). The solo learner is **never** left at a dead end — that is the ANXIETY-CLARITY-PRINCIPLE applied to a scared/uncertain beginner.

### Teacher-led
- **Christian guides, assigns, verifies, corrects.** A teacher view (owner/admin authority, same pattern as the choir director's `status` say) shows learner **progress** (from `classProgress`/`courseAssessment`), lets him **assign** the next lesson, **verify/correct** the auto-fingering drafts, and **leave feedback**.
- His **SME instruction layers on top** of the same content the solo learner sees — the auto-fingering is the assistive draft he validates.

### The toggle
- A learner switches **solo ⇄ teacher-supported** without changing courses. In teacher-supported mode, the teacher can see progress and step in; questions raised by "Stuck? → ask Christian" surface in his queue.
- **Child-safe / guardian-scoped:** for the minor, the teacher link and any progress-sharing is **guardian-approved** (§8); solo mode needs no sharing at all.

---

## 6. Component E — "Build your music" (strategic creation process)

**Goal.** Not only learn/play existing songs — a **repeatable, guided method to CREATE original, Christ-centered music.** A staged pathway where the learner always knows the next step (anxiety-clarity: err toward MORE guidance). Solo or teacher-mentored.

**The 8 stages** — each carries **what to do / why / prompts / a milestone** (so progress is visible and the next step is never ambiguous):

| # | Stage | What to do | Why | Milestone |
|---|---|---|---|---|
| 1 | **Inspiration / idea** | Pick a theme, a scripture, or a feeling to build from (Christ-centered) | Creation starts with something to say; Word-first gives it a spine | A captured seed (theme + optional `anchor:{ref,theme}`) |
| 2 | **Melody** | Hum/sing/play a melodic idea; capture it (voice-dictation / record) | The tune is the memorable core | A recorded/notated melody fragment |
| 3 | **Harmony / chords** | Choose a chord progression under the melody (apply lessons) | Harmony gives the melody color + emotion | A chord progression (e.g., I–V–vi–IV) tied to the key |
| 4 | **Song structure** | Lay out intro / verse / chorus / bridge | Structure is what makes it a *song*, not a loop | A section map |
| 5 | **Lyrics** (if a song) | Write words — **clean, Word-first**; lyrics-as-curriculum | The message; what it teaches the singer + listener | Drafted lyrics passing the clean/Word-first check |
| 6 | **Arrangement / instrumentation** | Decide parts, dynamics, build (keys-forward) | How it's delivered; the keyboard role | An arrangement plan |
| 7 | **Practice / refine** | Apply keyboard technique + **auto-fingering** to play it; iterate | Skill meets the song; correct technique | A playable take + a fingering guide for it |
| 8 | **Finish → record → publish/present** | Record it; present in the music section / Presenter | Offer it; promote those promoting Yahweh; present-anywhere | A finished piece + a share/present action |

- **Artifact container:** reuse the **Creation Workspace** (`migration 0037`, `WORKSPACE_TYPES`) — add a `song` workspace type whose stages are the eight above, each a milestone the learner checks off. The melody/lyrics/arrangement live as workspace content; the finished piece links to the music section.
- **Dual-mode (same as §5):** fully self-guided (each stage has prompts + a milestone + the "Stuck?" help) **or** keyboardist mentorship/feedback **at each stage** (he can comment, approve a stage, suggest a chord).
- **Integrates the loop:** lessons (technique) → creation (these stages) → **publish/present** (music section + Presenter) → reactions/ratings (encouraging engagement; the reactions primitive when it ships). This is the **lessons → creation → publish loop**: a learner moves from *playing* to *making* to *offering*.
- **Christ-centered + child-safe:** stage 1 anchors in scripture/theme; stage 5 enforces clean/Word-first lyrics; guardian-scoped for the son and young creators; sovereign/local tools throughout.

---

## 7. Component F — Worship self-critique / review ("on the altar")

**Goal.** When a learner **presents their skill** (plays/sings/offers) "on the altar," capture it and use it as **critique for themselves** — they review their own offering and grow **comfortable with constructive information** about it, as a normal, safe part of growth.

**Design (in order):**

1. **Capture** — record the presentation when they present skills (via **Presenter** once confirmed on `main`; else a simple in-app record). **Owner-scoped, private to the learner.** For a minor: **+ guardian**; **+ teacher only if the learner opts in.** Stored sovereign/local, governed by RLS + the minor gate (§8).
2. **Self-review FIRST (primary).** They watch/listen to their **own** work with **guided prompts**: *What went well? What's one thing to grow? How did it feel as an offering?* Self-critique is primary — it builds **ownership + self-awareness** before any external voice.
3. **Constructive feedback, gently (secondary).** Then the app — and **optionally** the keyboardist/teacher — offers **specific, encouraging, growth-oriented** notes: **what's strong first**, then **one or two** concrete next-step improvements. The **goal is comfort**: receiving constructive feedback as safe and normal, not threatening.
4. **The offering frame.** Framed throughout as an **offering to Yahweh** — excellence as worship (Col 3:23, *"work heartily, as for the Lord"*), growing the gift He gave. Grace-centered: **the offering is received, and we grow it in love.** Word-first.

**Tone guardrail — BINDING, and ENFORCED structurally (not just hoped for):**

- **Never harsh, shaming, or crushing.** **No numeric/letter scores. No ranking. No comparison or competition. No reinforcing negative self-talk.** Affirm **effort + heart first**; frame growth positively. *Formation, not judgment.*
- **How it's enforced (so the tone is verifiable, not claimed — Verification Doctrine):**
  1. **A constrained feedback prompt** for the local LLM with hard rules baked in: a **pastoral posture** (the Council Chamber **Hear → Mirror → Anchor → Invite** pattern), **affirm-before-grow**, **max 1–2 next steps**, **no scores/grades**, **no "bad/wrong/terrible"-class language**, scripture-anchored encouragement. The model is told it is helping a child offer worship, not judging a performance.
  2. **A proven-to-catch gate/test** (LESSONS-LEARNED → new gate, DR-0076): the feedback output is checked for **banned patterns** (numeric scores, shaming/harsh lexicon, comparison phrasing). If detected, it does **not** surface — it's regenerated. A green check *means* the tone held.
  3. **Reactions are positive-only here** (love/amen/praise; **never** a down-signal) — consistent with the kids-safe, positive-only reaction set in the worship spec.
  4. **Self-rating is non-numeric** — reflective prompts ("one thing I'm proud of / one thing to grow"), never a 1–10 the child can feel crushed by.
- **Spiritual guardrail:** the copy explicitly names what this is **NOT** — not performance anxiety, not works-righteousness, not comparison. It IS grace-centered growth of a gift, offered to Yahweh. (Religion AND relationship: backbone + warmth.)

**Ties:** Presenter (present skills), the lessons + creation process (the thing being offered), reactions (encouraging-only here), child formation (train-up-a-child). Honest dependency: **Presenter + reactions are not on this branch** — Component F ships after they land, or with the simple-capture fallback.

---

## 8. Child-safety / guardian-scoping / COPPA (binding, cross-cutting)

Darrell's son is **10**. This is the senior constraint over every component.

1. **Guardian-scoped by default.** Any content **involving or aimed at the minor** (his lessons, his progress, his worship captures, his creations) is **owner + guardian** scoped. Default sharing = **off**; the teacher link, progress-sharing, and any capture visible beyond the child require **explicit guardian consent** (extend the `isMinor` + `parentConfirmed` pattern, `install-help.js:96–114`).
2. **COPPA-aware (under-13).** No third-party data collection on the minor; **no advertising, no engagement-optimization, no external analytics** (DATA-AS-EMPOWERMENT already forbids these platform-wide). Captures stay **local/sovereign**. Data is **exportable + deletable** on the guardian's word. Minimal data; clear purpose.
3. **Age-appropriate content.** The `child (6-10)` band drives pacing, depth, and tone; feedback (F) is gentle by gate; creation (E) is Christ-centered + clean.
4. **Private captures gated.** The worship-review captures are PIN/guardian-gated (reuse multi-point-auth; ties `project_private_locations_pin`).
5. **Consent is the teacher's too.** Christian is the **consented recorded teacher** (his SME consent, already recorded for the choir source) — extended here to "instructional content for learners incl. minors." Darrell to confirm exact wording with Christian.

> **Proven-to-catch:** a test asserts a minor's capture/progress is **not** readable without guardian scope, and that the feedback gate (§7) strips banned tone — both machine-checked, per DR-0076.

---

## 9. Data model (new — migration 0041+)

Schema-only; real content seeded via Studio (no minor data or private captures in the repo/bundle). Mirrors existing instance-scoped + RLS patterns.

- **`music_courses` / reuse `classProgress`** — the keyboard course registers in the existing Learn catalog; **progress reuses `classProgress`** (no new progress table — the Explore survey's explicit guidance).
- **`music_lessons`** (if persisted beyond the static course def) — `{ id, instance_id, course_id, title, big_idea, lesson, levels jsonb, media jsonb, fingering jsonb, quiz jsonb, anchor jsonb, teacher, source_quote, confidence, status }`. `fingering` jsonb is the §3 contract.
- **`music_creations`** — extend Creation Workspace (`0037`) with a `song` type; stages + artifacts in its content jsonb; `owner` + guardian scope.
- **`worship_reviews`** — `{ id, instance_id, learner_id, media_ref, self_review jsonb, feedback jsonb (tone-gated), shared_with ('none'|'guardian'|'teacher'), created_at }`; **owner-private RLS**, guardian/teacher only by opt-in.
- **Auto-fingering drafts** — stored on the lesson (`fingering` + `status:'auto-draft'`), GPU-box-produced, teacher-verifiable.
- **Reactions** — defer to the shared `media_reactions` primitive when it ships; positive-only here.

**Migration discipline:** `0041` is next free (0040 highest). Apply via Studio; **verify the `db-migrate` run actually fired** (`project_db_migrate_trigger_gap`). Grant `authenticated` explicitly (`project_authenticated_grants_lost_on_new_tables`).

---

## 10. Sovereignty, cost, GPU-gating

| Layer | Where | Note |
|---|---|---|
| Lesson transcription/extraction (A, B) | **NAS CPU** (existing pipeline) | Slow but works today; batch overnight. |
| Lesson engine, diagrams, dual-mode, creation, self-review UI | **Front-end / Supabase** | ~$0 incremental; no GPU; the Learn engine already exists. |
| Auto-fingering (C) — AMT + fingering + sync | **GPU box (CUDA), sovereign** | Real compute; CPU NAS too slow for real-time; ships when the GPU box lands. Basic-Pitch-on-CPU = offline rough draft only. |
| Worship-review feedback generation (F) | **Local Ollama** (existing) | qwen2.5:14b; minutes on CPU; tone-gated. |
| All media + models | **PoeTech hardware** | Nothing leaves the box; no external API; no external training. |

**Father's-Business test (Matt 6:33):** lifts the family (forms the son in a gift, Word-first) AND creates rather than extracts (sovereign, non-extractive, COPPA-clean); promotes those promoting Yahweh (creation → present). **Passes.**

---

## 11. Tiering & rollout (RELEASE-TIERS)

- **A (lessons in Learn), B (finger-placement), D (dual-mode):** **Tier B** — new feature/visual surfaces; soak on preview; family eyes first. The **minor-facing** nature pushes content sign-off toward **Tier C judgment** (Darrell/guardian + Christian approve the first course).
- **E (build-your-music):** **Tier B** mechanism; Christ-centered content is **Tier C judgment**.
- **F (worship self-critique):** **Tier C** — it touches a **minor's private worship capture** + a tone-sensitive feedback surface; family review + the tone gate proven-to-catch before it ships. Depends on Presenter + reactions landing.
- **C (auto-fingering):** **GPU-gated**, ships when the CUDA box is live; any batch/auto job is **Tier C + three brakes, inactive on ship** (`feedback_autonomous_automation_three_brakes`). Manual-run drafts only until then.

---

## 12. Build order (when Darrell greenlights — NOT done here)

1. **SME lesson-extraction profile** (additive to the verified pipeline): `keyboard-lesson-prompt.md` + JSON prompt + `keyboardist-lesson-to-course.sh` → `lessons.json` (module-shaped). Verify on a sample transcript (same way the choir profile was verified). *Cheap, ready now — no real video needed to stand up + test.*
2. **`KeyboardDiagram.jsx`** (SVG, finger-number overlays) + the `fingering` contract (§3). Proven-to-catch: renders finger 1–5 / L–R correctly.
3. **`MusicLessons.jsx` + `lib/music-lessons.js`** course in Learn (reuse `learn-framework` + `ChurchLearn`); register one course; child band default.
4. **Dual-mode (D):** solo flow (mastery gate + "Stuck?" anxiety-clarity help) + teacher view (progress + assign + correct). Guardian-gated teacher link.
5. **Build-your-music (E):** `song` workspace type on Creation Workspace; 8 stages with prompts/milestones; publish hook to the music section.
6. **Worship self-critique (F):** after Presenter + reactions confirmed on main; capture + self-review + **tone-gated** feedback + the proven-to-catch tone test; Tier C.
7. **Auto-fingering (C):** GPU box — Basic Pitch / ByteDance + PRamoneda fingering + sync renderer; "AUTO-DRAFT — verify with Christian" banner; teacher correction loop.
8. Migration `0041`; verify db-migrate fired; explicit grants; Tier soak per §11.

---

## 13. Honest constraints / what does NOT exist yet (reality-trace, Verification Doctrine)

- **No real lesson videos on the NAS yet** (same as the base pipeline — backup stalled). The *engine* is stood up; the content lands later. We do **not** build surfaces over data that isn't there.
- **Presenter + reactions are not on this branch** — Components E/F that depend on them ship after they land (or with the simple-capture fallback).
- **Auto-fingering accuracy is genuinely limited** for full-band audio + non-classical voicings — it is an **assistive draft**, teacher-verified. Stated, not hidden.
- **GPU box is future** — Component C is real but gated on hardware that isn't live.
- **Consent wording** for Christian-as-teacher (incl. minor learners) is Darrell's to confirm.
- Cited models/datasets reflect live web sources (2026-06-24), provenance-tagged below; not training-data recall.

---

## 14. Institutional-Memory Event (church-work / education)

```json
{
  "id": "evt-20260624-keyboardist-music-lessons",
  "date": "2026-06-24",
  "type": "church-work",
  "title": "Spec: Keyboardist SME -> Music-Lessons curriculum in Learn (lessons, finger-placement, auto-fingering, dual-mode, build-your-music, worship self-critique)",
  "description": "Adds a SECOND output to the consented choir-keyboardist SME source (Christian): his captured instruction becomes a keyboard/music learning path in the existing Learn engine, for Darrell's son (10) + young musicians. Six components: (A) keyboard lessons via the SME pipeline's new lesson-extraction profile -> learn-framework modules; (B) finger-placement instruction as core curriculum, presented on a reusable SVG keyboard diagram with finger numbers 1-5/L-R, progressive fundamentals->patterns->pieces; (C) GPU-gated music-listen->auto-fingering research-review (Basic Pitch / ByteDance high-res transcription -> PIG-dataset/PRamoneda fingering -> synced playable lesson, assistive-draft + teacher-verified); (D) dual-mode study solo (adaptive mastery-gate + anxiety-clarity never-stuck help) or teacher-led (Christian assigns/verifies/corrects); (E) 8-stage 'build your music' Christ-centered creation pathway wiring lessons->creation->publish; (F) worship self-critique 'on the altar' = capture + self-review-first + gently-constructive tone-gated feedback, offering-to-Yahweh frame (Col 3:23), never harsh/scoring, formation-not-judgment.",
  "resolution": "Reuse SME pipeline (transcribe+extract, braked, manual) + learn-framework.js (age-bands incl. child 6-10, levels, quiz/mastery, courseAssessment) + Creation Workspace (0037, add 'song' type) + TTS/voice + multi-point-auth/minor-gate. New: lesson-extraction profile, KeyboardDiagram.jsx + fingering contract, MusicLessons.jsx, dual-mode teacher view, worship_reviews (owner-private RLS), tone-gate proven-to-catch. Auto-fingering GPU-gated (CUDA box). Migration 0041. Binding: child-safe + guardian-scoped + COPPA-aware for the minor; consented teacher; faithful extraction; owner/circle-scoped never public; sovereign/local; tone guardrail enforced by constrained pastoral prompt + banned-pattern gate + positive-only reactions + non-numeric self-rating.",
  "tags": {
    "workflows": [],
    "modules": ["learn", "music-lessons", "church", "choir", "creation-workspace", "presenter", "reactions", "sme-pipeline", "worship", "scripture"],
    "sector": ["education", "church", "spiritual", "community"],
    "senders": ["dpoe"]
  },
  "provenance": {
    "who": "Claude (advisory)",
    "when": "2026-06-24",
    "source_surface": "research-review + code survey (learn-framework.js, song-workshop-sync.js, install-help.js, multi-point-auth.js) + live web research (Basic Pitch, ByteDance piano transcription, PIG/PRamoneda fingering) + fetched ESV (Prov 22:6, Col 3:23)"
  },
  "learnings": "1) The keyboardist SME source has TWO outputs from one capture: choir-song enrichment (key/arrangement) AND a Learn music course. 2) The Learn engine already does age-bands/mastery/quiz -- lessons just declare content. 3) Finger-placement is foundational (train-up-a-child) and needs a VISUAL keyboard diagram, not prose; one fingering contract serves human + auto lessons. 4) Auto-fingering = AMT (Basic Pitch sovereign-light / ByteDance GPU-accurate) -> fingering (PIG/PRamoneda) -> synced lesson, but it is an ASSISTIVE DRAFT (polyphonic audio + non-classical voicing + hand-assignment all lossy); teacher verifies. GPU-gated. 5) Dual-mode = same content, solo (anxiety-clarity never-stuck) or teacher-led; both first-class. 6) Creation is a staged pathway (8 milestones) so the learner is never lost; lessons->creation->publish loop. 7) Worship self-critique must be self-review-FIRST + gently constructive; tone guardrail is ENFORCED (constrained pastoral prompt + banned-pattern proven-to-catch gate + positive-only reactions + non-numeric self-rating), framed as offering-to-Yahweh (Col 3:23), grace-centered not performance. 8) Minor (10) => guardian-scoped + COPPA-aware over everything; consent extends to teacher-of-minors (Darrell confirms). 9) Presenter + reactions are NOT on this branch -- F/E degrade gracefully until they land. 10) Cite live sources for model choices; never present machine-guessed fingering as 'the right way' to a child.",
  "related_artifacts": [
    "docs/99-session-notes/2026-06-24-keyboardist-music-lessons-and-auto-fingering-spec.md",
    "infra/nas-sme-pipeline/CHOIR-SOURCE.md",
    "app/src/lib/learn-framework.js:183-317",
    "app/src/lib/song-workshop-sync.js",
    "app/src/lib/install-help.js:96-114",
    "https://github.com/spotify/basic-pitch",
    "https://github.com/qiuqiangkong/piano_transcription_inference",
    "https://github.com/PRamoneda/Automatic-Piano-Fingering",
    "https://arxiv.org/pdf/1904.10237",
    "https://arxiv.org/pdf/2303.03745"
  ],
  "status": "open"
}
```

---

## Sources (live research, 2026-06-24)

**Audio → notes (AMT):**
- [Spotify Basic Pitch — GitHub](https://github.com/spotify/basic-pitch) · [TypeScript port](https://github.com/spotify/basic-pitch-ts) · [about](https://basicpitch.spotify.com/about) (Apache-2.0, <20MB, polyphonic, pip+npm)
- [ByteDance High-resolution Piano Transcription — `piano_transcription_inference` (PyPI)](https://pypi.org/project/piano-transcription-inference/) · [GitHub](https://github.com/qiuqiangkong/piano_transcription_inference) · [training repo](https://github.com/bytedance/piano_transcription)
- [Onsets & Frames — Magenta](https://magenta.withgoogle.com/onsets-frames) · [MT3 (multi-instrument)](https://github.com/magenta/mt3)

**Notes → fingering:**
- [Nakamura et al., "Statistical Learning and Estimation of Piano Fingering" (PIG dataset, HMM/LSTM) — arXiv 1904.10237](https://arxiv.org/pdf/1904.10237)
- [PRamoneda — Automatic-Piano-Fingering (GitHub)](https://github.com/PRamoneda/Automatic-Piano-Fingering)
- [Checklist Models for Piano Fingering Prediction — arXiv 2209.05622](https://arxiv.org/pdf/2209.05622)
- ["At Your Fingertips: Extracting Piano Fingering Instructions from Videos" — arXiv 2303.03745](https://arxiv.org/pdf/2303.03745) (fingering FROM hand videos — ties §3/§4)

**Scripture:** ESV via Bible Gateway — [Colossians 3:23 + Proverbs 22:6](https://www.biblegateway.com/passage/?search=Colossians+3%3A23%3B+Proverbs+22%3A6&version=ESV)
