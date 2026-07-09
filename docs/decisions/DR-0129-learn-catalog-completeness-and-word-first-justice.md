# DR-0129 — Every finished course ships to the Learn catalog, and every lesson speaks the Word's justice

- **Status:** accepted
- **Tier:** A/B (course content + a derived registry + a render gate; no serving-path change; the lesson-content half is doctrinally governed by DR-0098/DR-0100, both already accepted)
- **Scope:** `app/src/lib/learn-catalog.js` (the registry), Church → Learn (the catalog + derived count), `app/src/lib/world-issues-class.js` + `lib/discernment-track.js` + `components/DiscernmentStages.jsx` (the justice framing), `lib/living-lessons-class.js` + `components/ChurchLearn.jsx` (the crash fix), `ARI_STANDING_DUTIES` + the Perpetual Report `courses` stream
- **Date:** 2026-07-08
- **Principles:** TEACH-DONT-DEBATE (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), VERIFICATION-DOCTRINE (DR-0076), NO-STATIC-DATA (DR-0121), REPORT-STREAMS (DR-0122 §3), APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT

## Directive

Darrell, 2026-07-08, three messages in one session:

> *"Keep finding issues with lessons because claude keeps rewriting my courses based on lies of the devil review how Jesus would interpreted justice in the musk case and accountability according to the word not these lies. Review all content and context to make sure it is submitted to Yahwehs perspectives. Also none of my course were added that I asked for and Again when we add features we need to update our Ways and documentation and find the opportunities and constraints, Ari's responsibility and reports should all update to reflect as well all inside the PoeTech App. No static data combine what makes sense and keep cleaning until we like it. Period."*

> *"The Learn tab in the Church tab should have at least 40 lessons based on finished lessons in the PoeTech App this is my 1000th time requesting this."*

> *"Living lessons break."* (screenshot: the Learn surface boundary on live poetech.us)

## The verified gaps (reality-trace before building)

1. **Built but unsurfaced courses.** Kingdom Economics (7 sessions) and Prophetic Voices (6 voices) were fully authored on 2026-07-04 — modules, quizzes, sources, tutor metas, tests — and never wired into Church → Learn. The Learn tab hand-listed 10 course descriptors in the host; nothing checked that what was built was surfaced. That is the exact "derived-but-unparsed" staleness face of DR-0122, on the course axis.
2. **The both-sides posture in the Musk lesson.** The lesson's own headline ran "steelman every side… no verdict on a soul," and the documented core (the Owen Diaz jury FINDING, Grok's outputs, the Boxtown siting) was carried *inside* the critics' perspective as "one side's strongest case" — a vote on whether proven harm is real. DR-0100 names that posture the failure: under-claiming a verified truth is as much a lie as over-claiming an unverified one.
3. **The live crash.** Living Lessons L12 ("If One Member Suffers") shipped without an `anchor`; CourseView rendered `m.anchor.ref` unguarded; opening Living Lessons crashed the whole Learn surface behind the boundary on live poetech.us. The existing render test exercised only the DEFAULT course, so the crash shipped green.

## Decision

1. **The Learn catalog registry (built ⇒ surfaced).** `lib/learn-catalog.js` is the ONE source of truth for every finished course. The host mounts the self-paced courses FROM the registry (`buildSelfPacedDescriptors`); the helper-tag routing derives from it; the Learn header shows a count derived live from the mounted courses ("12 courses · 97 lessons"), never a typed number (DR-0121). Kingdom Economics and Prophetic Voices ship in this PR. A machine gate (`learn-catalog-render.test.jsx`) (a) scans `src/lib` for any course lib not registered, (b) clicks EVERY registered course in a real render, and (c) holds the **≥ 40-lesson floor** — a course that is built-but-unsurfaced, or that crashes on open, fails CI instead of production. Proven-to-catch: the gate's first run caught the live Living Lessons crash (DR-0076 §3).
2. **Word-first justice in discernment lessons (DR-0098 + DR-0100 applied to course content).** The lesson's OWN voice states the documented facts plainly — an adjudicated finding IS a verdict, and hedging it back into "allegation" is false witness in the other direction (Isaiah 5:20; Jeremiah 6:14). The believer's lens leads with how Jesus interprets justice: liberty for the bruised (Luke 4:18), the deed named to its face (Matthew 21:13), a king's sin named at cost (Mark 6:18), repentance measured by restitution (Luke 19:8-9), woe on the powerful who omit judgment and mercy (Matthew 23:23). Perspectives are interpretive positions on the UNRESOLVED parts only — the defense is heard at its strongest AND marked for what it answers versus what it leaves standing — never a vote on whether proven harm is real. The ONE verdict withheld is the verdict on a soul (Matthew 7:1-5; Romans 14:4), and that restraint never mutes the deeds. The engine copy (discernment-track, DiscernmentStages, the track footer, the tutor posture) carries the same frame, so every future issue inherits it. All quoted verse fragments were verified verbatim against the repo's KJV source (DR-0076).
3. **The Learn surface is unbreakable.** L12 got its anchor (1 Corinthians 12:25-26; Galatians 6:2 — verified verbatim); both anchor render sites are guarded so a missing optional field degrades to an omitted line, never a dead surface.
4. **Ari + reports update with the feature (the standing rule, run).** `ARI_STANDING_DUTIES` gains the `learn-catalog` duty (this DR); the Perpetual Report gains the `courses` stream projected from the SAME registry the Learn tab mounts (DR-0122 §3) — the report and the tab can never disagree.

## Opportunities and constraints

- **Opportunity:** the cohort courses (broadcast, infrastructure, sovereign A.I., AI legal blueprint) still carry bespoke host descriptors for their cohort-date wiring; folding cohort state into the registry would finish the de-duplication. `re-review: 2026-07-22`.
- **Opportunity:** the Eternal Algorithms / Godhead Study and TLC training tracks live on their own surfaces by design; a cross-link row in Learn ("more study lives here") would make the whole teaching estate discoverable from one place. `re-review: 2026-07-22`.
- **Opportunity:** the beauty-supply and Game Changers issues already carry most of the DR-0100 frame; a content pass applying the sharpened Stage-3 preamble ("perspectives judge the unresolved parts only") to their perspective labels would finish the track-wide alignment. `re-review: 2026-07-15`.
- **Constraint (verified):** the cloud sandbox cannot reach poetech.us, so the live crash was reproduced by building the full-catalog harness locally (it reproduced deterministically) — the fix is proven by the gate, and the family's DR-0104 reviewer pass confirms it on the live build after deploy.
- **Constraint (held):** course metas carry no event dates, so the report's `courses` rows stay honestly undated (DR-0076 — never invent a date); the lesson count is their live description.

## Supersedes / pairs

Pairs with DR-0098 (teach, don't debate), DR-0100 (speak established fact), DR-0076 (proven-to-catch gates), DR-0121 (no static data), DR-0122 §3 (report streams), DR-0125 (Ari's derived duties). No supersession.
