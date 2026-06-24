# Dyslexia Support Module — Spec

**Status: DRAFT — pending specialist review.** This document specifies a dyslexia *learning-support and psychoeducation* module built on PoeTech's existing learning engine — **open, opt-in support available to anyone who wants it** (kids, adults, families, patients who self-select), not something gated behind a diagnosis. It is **not** a diagnostic tool and does **not** deliver clinical intervention. The support layer is broadly available; a clinically-validated *intervention* path — reading specialist + Christina — is layered on top for those who need formal remediation. Before any part of this ships as "dyslexia help," a reading specialist (Orton-Gillingham / Structured Literacy certified) and Christina (clinical validation) must review the instructional sequence and the framing. See [Who it's for](#3-who-its-for--opt-in-broadly-available) and [Validation & Honest Constraints](#7-validation--honest-constraints).

*Frame.* All knowledge is from Yahweh; the reading scientists and clinicians cited here are conduits of an order He authored — the human reading brain, the structure of language, the way mastery is built. We build on the open, published methodology they surfaced; we do not copy the proprietary programs that package it.

---

## 1. Why this module

Reading is the gate to almost everything else PoeTech teaches — Scripture, the financial system, the courses. A reader who silently struggles is locked out of the rest. Dyslexia is the most common specific learning difficulty (commonly estimated near 1-in-5 for some degree of difficulty), and the standard of care for it is **well-established, evidence-based, and methodologically open**. We can build genuine, dignified learning support on that open standard without reinventing it and without overclaiming.

Crucially, **you do not need a diagnosis to benefit.** The Structured-Literacy practice that helps dyslexic readers helps *anyone* who finds reading hard or wants to sharpen it — the same research is explicit that this instruction benefits all learners. So this is **open, opt-in support for whoever is interested**, with a clinically-validated intervention path layered on for those who need it. That makes it a strong candidate for the **free gleaning-edge tier** (§6): core teaching/support stays free, available at the edge of the field for anyone to glean.

This is the same posture as the rest of the platform: meet the underserved person where they are, with excellence and warmth, grounded in truth (COMMUNITY-FIRST-MISSION, QUALITY-OF-LIFE-AS-NORTH-STAR, ANXIETY-CLARITY-PRINCIPLE).

---

## 2. The standard (researched, cited)

The evidence-based standard for dyslexia reading support has converged. The pieces below are the consensus, not one vendor's claim.

### 2.1 Structured Literacy / the Science of Reading — the methodology

**Structured Literacy** is the umbrella term the **International Dyslexia Association (IDA)** adopted for instruction that follows the **Science of Reading** — the converged body of reading research. Its defining attributes: instruction that is **explicit, systematic, cumulative, sequential, diagnostic/prescriptive, and mastery-based**, integrating listening, speaking, reading, and writing across the language's structural systems:

- **Phonology** — the sound structure of spoken words (phonemic awareness is the most consistent early predictor of reading difficulty).
- **Orthography** — the writing system, i.e., sound-to-spelling mapping (phonics).
- **Morphology** — base words, prefixes, suffixes.
- **Syntax** — the grammatical order of words.
- **Semantics** — meaning and the relationships among words.
- **Discourse** — the organization of connected spoken and written text.

Sources: [IDA — Effective Reading Instruction](https://dyslexiaida.org/effective-reading-instruction/), [IDA — Structured Literacy Education (infographic)](https://dyslexialibrary.org/structured-literacy-education-infographic/), [NCIL — Features of Structured Literacy Instruction](https://improvingliteracy.org/resource/features-of-structured-literacy-instruction/).

### 2.2 Orton-Gillingham — the gold-standard delivery

**Orton-Gillingham (O-G)** is the original and most-cited Structured Literacy *approach*: a direct, explicit, **multisensory** (sight + hearing + touch + movement), structured, sequential, diagnostic, and prescriptive way to teach reading and spelling, designed first for dyslexic learners. It is the framework most branded programs descend from.

Honest note on strength of evidence: O-G is the methodological *standard of care*, but the research base is uneven — a 2021 synthesis ([Stevens et al., *Current State of the Evidence*, PMC8497161](https://pmc.ncbi.nlm.nih.gov/articles/PMC8497161/)) found O-G interventions did not produce statistically significant effects large enough to call them definitively superior to other Structured-Literacy instruction, while still supporting the broader Structured-Literacy principles. **Takeaway for us: build on the open *principles* of Structured Literacy (explicit, systematic, multisensory, mastery-based), not on the brand mystique of any one program.**

Sources: [IDA Oregon — What is Structured Literacy](https://or.dyslexiaida.org/what-is-structured-literacy-2/), [Stevens et al. 2021 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8497161/).

### 2.3 Named programs built on it (proprietary — do not copy)

These are the recognized programs built on the O-G / Structured-Literacy base. We name them for orientation and credibility; **they are proprietary and we do not reproduce their sequences, materials, or scripts** (see constraints):

- **Wilson Reading System**
- **Barton Reading & Spelling System**
- **Lindamood-Bell (LiPS — Lindamood Phoneme Sequencing)**
- **Take Flight** (Scottish Rite)
- **Adaptive software:** **Lexia Core5** (PreK-5) and **Lexia PowerUp Literacy** (6-12).

### 2.4 The adaptive-engine pattern (what the software adds)

The adaptive reading-software pattern is a tight mastery loop:

> **assess** the reader → **target** the specific decoding / phonological gap → deliver **explicit + multisensory practice** at that skill → **advance on mastery** (not on time/seat-hours) → re-assess.

Lexia's adaptive blended-learning implementation of this loop has the strongest published efficacy record in this category — Core5 and PowerUp both meet **ESSA "Strong Evidence"** (the top federal tier); PowerUp reports effect sizes up to ~0.69 and Core5 up to ~0.53, with Core5 carrying ~20 ESSA-qualifying peer-reviewed studies. (Vendor-reported figures; the ESSA tier itself is the independent signal.)

**This loop — not Lexia's content — is what we reuse.** It maps almost one-to-one onto PoeTech's existing age-adaptive Learn framework (see §4).

Sources: [Lexia — Product Efficacy & ESSA Evidence](https://www.lexialearning.com/research/product-efficacy), [Lexia Core5](https://www.lexialearning.com/core5), [Lexia PowerUp](https://www.lexialearning.com/powerup).

### 2.5 Standard accessibility supports

These are the standard *access* supports that ride alongside the instruction (and benefit all readers):

- **Text-to-speech / audio-first options** — reduce decoding load so comprehension can be worked separately. (Well-supported.)
- **Adjustable text size, line/letter spacing, short line length, generous whitespace** — broad consensus (British Dyslexia Association style guidance).
- **Fonts — *contested, handle honestly.*** Clear sans-serif faces (Arial, Verdana, **Lexend**) have reasonable support; **Lexend** has the stronger reading-speed evidence of the "dyslexia-branded" options. **OpenDyslexic is popular but not evidence-based** — at least one study found it *reduced* reading speed/accuracy vs. Arial, and the W3C/BDA position is that no special font is a proven intervention. **Design decision: offer Lexend + a clean default sans-serif; OpenDyslexic may be an opt-in choice with an honest "many find it comfortable; the evidence is mixed" note — never the imposed default and never claimed as a fix.**

Sources: [Edutopia — Do Dyslexia Fonts Actually Work?](https://www.edutopia.org/article/do-dyslexia-fonts-actually-work/), [Wery & Diliberto, *OpenDyslexic font* (PMC5629233)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233/), [Lexifont — research-first font guide](https://lexifont.com/blog/best-fonts-for-dyslexia-2026).

---

## 3. Who it's for — opt-in, broadly available

**Anyone who wants it.** No diagnosis, no gate, no label required to start. The module is **opt-in support whoever is interested can self-select into:**

- **Kids** who find reading hard (the classic case, where early support matters most).
- **Adults** who never got help and quietly struggle — a large, underserved group.
- **Families** working with a child, or a parent practicing alongside them.
- **Patients / people who self-identify** ("I think I might be dyslexic" / "reading is hard for me") and want practice and understanding *now*, without waiting on a formal evaluation.
- **Anyone strengthening reading** — the Structured-Literacy practice that helps dyslexic readers helps all readers, so the door is wide.

**The support layer is broadly available and free-tier-bound (§6). The clinical *intervention* path is layered on top** for those who, after engaging, want or need formal remediation — that path involves a reading specialist and Christina. Nobody is forced toward it; it's an offered next step, not a gate in front of the support.

### What this module IS and IS NOT

| IS | IS NOT |
|---|---|
| **Open, opt-in** learning **support** + **psychoeducation** ("what dyslexia is, what helps") | A **diagnosis** of dyslexia, or anything gated behind one |
| Structured-Literacy *practice* built on open principles, for anyone interested | A licensed clinical **intervention** / a substitute for a specialist |
| Adaptive practice that **advances on mastery** | A guarantee of remediation outcomes |
| Access supports (TTS, text-size, spacing, font choice) | A claim that a font "cures" dyslexia |
| An **on-ramp** to formal help for those who want it ("here's how to reach a specialist") | An assessment that labels a person |

This boundary is binding. Every screening-flavored surface routes to "this is a learning check, not a diagnosis — a reading specialist confirms dyslexia" (mirrors the TLC clinical bright line held elsewhere in the platform). Opt-in does **not** mean lowering this line — it means the *support* is open to all while *diagnosis/intervention* stays specialist-owned.

---

## 4. Architecture — reuse, don't reinvent

The module is a new course/surface that **composes existing primitives**. No new engine. (All file paths are real, verified in-repo.)

### 4.1 The adaptive loop ← existing Learn framework

`app/src/lib/learn-framework.js` already implements the mastery loop the dyslexia standard needs:

- **Author content immutably** as `module = { id, title, lesson, levels, media, quiz: {questions}, anchor }`.
- `gradeQuiz(quiz, answers)` → `{ pct, passed, perQuestion }` — the **mastery check** (advance only on `passed`).
- `courseAssessment(modules, progress, quizState)` → `{ complete, eligibleToHelp, ... }` — overall progression; a graduate becomes eligible to **help the next learner** (the graduate→helper arc fits dyslexia mentoring beautifully).
- **Age-adaptive layer** (`AGE_BANDS`, `resolveForAge`, `chunkLessonForAge`, `lessonPlanForAge`) — this is decisive for dyslexia. It already chunks a lesson into short, sentence-boundary-aligned segments sized per developmental band (`child` 6-10, `youth` 11-14, `teen` 15-17, `adult`, `senior`) with built-in break cadence. **Short segments + frequent breaks + content-before-check is exactly the pacing dyslexic readers need**, and it's already built and telemetry-tuned.

**Mapping the standard onto the framework:**

| Structured-Literacy / adaptive standard | PoeTech primitive |
|---|---|
| Explicit, systematic, **sequential** skill order | Ordered course `modules[]` (phonological awareness → phonics → fluency → morphology → comprehension) |
| **Mastery-based** advance (not seat-time) | `gradeQuiz().passed` gates progression |
| **Diagnostic/prescriptive** (target the gap) | Per-skill modules + `perQuestion` results identify the weak skill |
| **Multisensory** (see/hear/say/touch) | TTS (hear) + text (see) + voice dictation (say aloud) + tap/trace interactions (touch) — see §4.3 |
| Short, paced practice | `chunkLessonForAge` + `lessonPlanForAge` segment & break cadence |
| Continuous improvement of pacing | `learn-engagement.js` telemetry by age band |

### 4.2 The instructional sequence (Structured-Literacy spine)

Author the course modules in the IDA Structured-Literacy order. **DRAFT sequence — a specialist sets the real scope-and-sequence:**

1. **Phonological & phonemic awareness** — hearing, segmenting, blending sounds (the highest-yield early skill).
2. **Phonics / orthography** — explicit, systematic sound-to-spelling.
3. **Fluency** — accurate, automatic word reading; repeated reading.
4. **Morphology** — base words, prefixes, suffixes (decoding longer words).
5. **Syntax & semantics** — sentence structure and meaning.
6. **Comprehension & discourse** — connected text.

Each module: explicit teach → multisensory practice → mastery check → advance. Plus a **psychoeducation track** ("What is dyslexia? It is a difference in how the brain processes language, not a measure of intelligence or worth") — warm, identity-affirming, scripture-anchored where natural (per ANXIETY-CLARITY-PRINCIPLE and the Religion AND Relationship test).

### 4.3 Multisensory via existing access primitives

Multisensory is the heart of O-G, and PoeTech already has every channel:

- **HEAR** — `app/src/lib/tts.js` + `app/src/components/TTSControl.jsx` (segmented read-aloud, live rate, per-device prefs). Reuse `useTextToSpeech()`. Audio-first option for any text.
- **SEE** — `app/src/lib/text-size.js` + `app/src/components/TextSizeControl.jsx` (`A / A+ / A++ / A+++` root-rem scaling). Reuse `<TextSizeControl variant="panel" />` on reading surfaces. **Add a font + spacing toggle here** (Lexend + clean default; OpenDyslexic opt-in with honest note; line/letter-spacing controls).
- **SAY** — `app/src/lib/voice-dictation.js` (`useVoiceDictation`). Reader reads a word/sentence aloud; the transcript is the "say it" channel (and a low-friction self-check).
- **TOUCH/MOVE** — tap-to-blend, drag-to-segment, trace-the-letter interactions authored as module media/activities (new lightweight components; no new engine).

All four run **in-browser, no PII off device** (Web Speech APIs) — consistent with DATA-AS-EMPOWERMENT-NOT-EXTRACTION.

### 4.4 Presenter primitive (group teaching)

For a tutor/parent teaching a child, `app/src/lib/teach-present.js` (BroadcastChannel two-screen, audience-only payload, no-leak) lets the helper run a clean learner-facing view on one screen while keeping prompts/notes on their own — useful for a parent-led O-G-style session. Reuse as-is; the no-leak contract already guarantees facilitator notes never reach the learner screen.

---

## 5. Where it lives

**Primary home: a course inside the existing Learn surface** (`view === 'church'`, `churchView === 'learn'`), sitting beside the A.I., Broadcast, and Infrastructure courses — same framework, same registration pattern. It is a *learning* module, and Learn is where learners already are.

- **Registration** follows the established "new surface = new module" pattern (own files, not the monolith): author a course descriptor file (e.g., `app/src/lib/dyslexia-course.js` exporting `DYSLEXIA_META`) consumed by the shared `learn-framework.js` + `learn-engagement.js` hooks, and a thin `DyslexiaLearnModule` component rendered in the Learn tab. If it warrants its own Church sub-tab later, add one tuple at the sub-tab list (~line 4740 of `poe-financial-mvp-v28.jsx`) and one render line (~line 4828) — no monolith logic.
- **Access supports** (TTS, text-size/font/spacing) are already in the app header globally; the module surfaces a prominent `<TextSizeControl variant="panel" />` + font/spacing panel on its reading views so a struggling reader doesn't have to hunt.
- **Audience reach:** because it's pure learning support (no diagnosis, no clinical data), it is **opt-in and broadly available** — anyone can self-select in. It serves the **family**, the **COLG community** (COMMUNITY-FIRST: elderly + youth, many underserved by mainstream ed-tech), self-identifying adults, and beyond — gated only by normal opt-in enrollment, **not** by any clinical access control or diagnosis.

### Data & migration

**No new migration required for v1.** Progress rides existing `data.classProgress` (keyed by module id, e.g., `dx-pa-1`); interest + engagement ride the existing cross-tenant feedback pipe (`addFeedback({ area: 'church-learn', ... })`) via `learn-engagement.js`. A migration is only needed if we later persist per-skill mastery profiles beyond the shared shape — and that would be a Tier-gated follow-up, not v1. (Next free migration number is `0041` if ever needed; do not allocate it speculatively.)

---

## 6. Tier & availability — free gleaning-edge candidate

The core teaching and practice are a **strong candidate for the free gleaning-edge tier.** The gleaning principle (Lev 19:9-10 — leave the edges of the field for anyone to glean) is the right shape here: foundational reading support is exactly what should sit at the open edge, free for whoever is hungry for it, with no diagnosis or paywall in the way.

- **What is free (gleaning edge):** the Structured-Literacy practice modules, the access supports (TTS, text-size, font/spacing), the psychoeducation track. This aligns with the existing "what is actually free" framing — the Spiritual Module for the Body and the Financial System for Families are free; foundational reading support belongs in that same dignity-first, no-extraction tier.
- **What may be layered/paid later (not v1, not assumed):** the formal, **clinically-validated intervention path** — specialist-guided remediation, progress reporting to a reading specialist, Christina-supervised plans. That layer carries human clinical cost, so it can be where any future pricing lives — never the open support layer. Pricing of the clinical layer is a Darrell decision, out of scope for this draft.
- **Why free fits the mission:** an adult who never got help, a child in an underserved school, a family without the money for private tutoring — these are exactly the people COMMUNITY-FIRST-MISSION and DATA-AS-EMPOWERMENT-NOT-EXTRACTION exist for. Charging at the door for *foundational reading help* would betray the frame. The free support layer IS the mission; the optional clinical layer funds the people who deliver it.

Free-tier candidacy is a *recommendation* for Darrell's ratification, consistent with [[project_what_is_actually_free]] and [[project_community_free_funded_by_aligned_brand_sponsorship]]; it is not self-authorizing.

---

## 7. Validation & honest constraints

**These are binding, not caveats to soften later.**

1. **Specialist review before "dyslexia help" ships.** The instructional scope-and-sequence (§4.2) must be reviewed by an Orton-Gillingham / Structured-Literacy-certified reading specialist. The current sequence is a DRAFT placeholder. (DR-0076 Verification Doctrine: do not claim "evidence-based dyslexia instruction" without the specialist's sign-off as the evidence.)
2. **Christina's clinical validation** on the boundary between *support* and *intervention*, and on any psychoeducation copy that touches a child's self-concept. (Mirrors the TLC clinical bright line.)
3. **No diagnosis, ever.** The module never labels a person dyslexic. Screening-flavored checks are framed as learning checks and route to "a reading specialist confirms dyslexia" with a real referral path.
4. **The methodology is open; the programs are not.** We build on the open Structured-Literacy / O-G *principles* and the *published adaptive loop*. We do **not** copy Wilson / Barton / LiPS / Take Flight / Lexia content, sequences, scripts, or materials. Original content authored to open principles only.
5. **Font honesty.** No "dyslexia font cures reading" claim. Lexend + clean default offered; OpenDyslexic opt-in with the mixed-evidence note (§2.5).
6. **Outcomes are not promised.** Support improves access and practice; it is not a guaranteed remediation outcome. Say so.
7. **Release tier.** A child-facing learning-support surface touching self-concept and a clinical-adjacent boundary is **Tier B at minimum, likely Tier C** (COLG-facing + family review + Quality Gatekeeper) per RELEASE-TIERS.md — not a direct-to-main change. (Note: "free + opt-in + broadly available" does **not** downgrade the tier — wide reach to vulnerable readers raises the review bar, it does not lower it.)
8. **Opt-in, never auto-enrolled.** Availability is broad, but entry is always the person's own choice. No one is flagged, labeled, or pushed in; the support is offered and self-selected.

---

## 8. Build sequence (when greenlit — not part of this read-only spec)

1. Specialist + Christina review and ratify the §4.2 scope-and-sequence → it stops being DRAFT.
2. Author `dyslexia-course.js` (`DYSLEXIA_META`) to the ratified sequence, in `learn-framework.js` shape.
3. Author the multisensory practice components (tap-to-blend, trace, say-aloud-check) as small reusable pieces.
4. Add the font + spacing toggle to the SEE access panel (Lexend, default sans, OpenDyslexic opt-in).
5. Register the `DyslexiaLearnModule` in the Learn tab (own files, framework-driven).
6. Wire engagement telemetry; verify pacing-by-age in the Governor aggregate.
7. Tier B/C soak + family/COLG review before public.

---

## Sources

**Structured Literacy / Science of Reading / Orton-Gillingham**
- [IDA — Effective Reading Instruction](https://dyslexiaida.org/effective-reading-instruction/)
- [IDA — Structured Literacy Education infographic](https://dyslexialibrary.org/structured-literacy-education-infographic/)
- [NCIL — Features of Structured Literacy Instruction](https://improvingliteracy.org/resource/features-of-structured-literacy-instruction/)
- [IDA Oregon — What is Structured Literacy](https://or.dyslexiaida.org/what-is-structured-literacy-2/)
- [Stevens et al. 2021 — Current State of the Evidence: O-G Interventions (PMC8497161)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8497161/)

**Adaptive software efficacy**
- [Lexia — Product Efficacy & ESSA Evidence](https://www.lexialearning.com/research/product-efficacy)
- [Lexia Core5](https://www.lexialearning.com/core5)
- [Lexia PowerUp Literacy](https://www.lexialearning.com/powerup)

**Fonts (contested) & accessibility**
- [Edutopia — Do Dyslexia Fonts Actually Work?](https://www.edutopia.org/article/do-dyslexia-fonts-actually-work/)
- [Wery & Diliberto — OpenDyslexic font on reading rate/accuracy (PMC5629233)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233/)
- [Lexifont — research-first font guide](https://lexifont.com/blog/best-fonts-for-dyslexia-2026)

---

*DRAFT — pending specialist review. Layer 3 reference material for a future build; no app behavior changes with this document.*
