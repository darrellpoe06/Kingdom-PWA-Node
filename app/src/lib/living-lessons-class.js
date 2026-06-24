// =============================================================================
// living-lessons-class — "Living Lessons from the Word"
// =============================================================================
// A Word-first, non-denominational LESSON SERIES that rides the SAME shared Learn
// engine as the four PoeTech / COLG courses ("Learning A.I. The Way", "The
// Broadcast", "The Infrastructure", "Sovereign A.I.") — the generic helpers in
// church-classes.js, the self-driving tutor (class-tutor.js → askTutor), and the
// multi-modal lesson schema + age-adaptive skill-level branching + quiz +
// graduate→helper from learn-framework.js. The difference is PRESENTATION, not
// machinery: this series is SELF-PACED (no cohort, no weekly clock), so it sets
// `meta.unit` to render its rows as "Lessons" instead of "Weeks" (a small,
// backward-compatible label layer in ChurchLearn; the four courses, which set no
// `meta.unit`, are unchanged).
//
// The lessons are structured on DARRELL'S 4D/3D FRAMEWORK — the same spine as his
// Study, the Thought-finalizer, and the Eternal Algorithms library:
//
//   • DEEP SOURCE (4th-dimensional) — the deep, Scripture-and-language-grounded
//     teaching (the module `lesson`, surfaced in the facilitator/teaching layer).
//   • PLAIN (3rd-dimensional)        — the wider-audience distillation, paced to
//     age (the module `levels`: child / teen / senior, plus the standard `lesson`
//     base and the `bigIdea` hook).
//   • BENEFITS                       — what running the lesson FREES in you (the
//     module `benefits` array, rendered as "What this frees in you"), plus the
//     real-life "Take it with you" action.
//
// LESSON 1 — "The Perfect You Were Made For" — is Darrell's teaching:
//   "None of us are 3rd-dimensional perfect; however Yahweh describes a Perfect
//    He expects — that's a lesson."
// It is the matching ETERNAL ALGORITHM ("The Perfect You Were Made For — whole,
// not flawless"; seeded in eternal-algorithms.js): 3D flawless-performance vs the
// 4D Perfect Yahweh actually expects.
//
// VERIFICATION / NO-FABRICATION (DR-0076, and the Source-of-Answers rule):
//   • Every Scripture is cited by REFERENCE; quoted text is the ESV (primary) with
//     the KJV noted where the KJV wording IS the teaching point, per
//     SCRIPTURE-REFERENCE-STANDARD — fetched and verified, not produced from
//     memory. The translation insight at the heart of the lesson (the KJV renders
//     BOTH Hebrew `tamim`, Gen 17:1, and Greek `teleios`, Matt 5:48, as "perfect,"
//     where the ESV reads "blameless" and "perfect/mature") is verified against
//     the lexicons (Strong's H8549 tamim = complete / whole / sound / blameless /
//     integrity; Strong's G5046 teleios, from G5056 telos = end / goal, = complete
//     / brought-to-its-end / lacking-nothing / full-grown / mature — NOT "without
//     any flaw").
//   • EVENHANDED: the historic traditions on sanctification / "Christian
//     perfection" (Wesleyan entire-sanctification, Reformed progressive
//     sanctification, Orthodox theosis, and others) are presented fairly and
//     Word-first; the lesson names their common ground and lets the Word + the
//     Spirit lead, rather than dividing the Body (COMMUNITY-FIRST / Word-first).
//   • WELL-BEING-POSITIVE (binding): the lesson FREES the reader from crushing
//     self-perfectionism and works-righteousness; it distinguishes God's "perfect"
//     (grace, maturity, love, His finished work in us) from the anxious flawless-
//     performance the flesh chases. Grace-centered, never pressure-adding.
// =============================================================================

// Self-paced: there is no cohort and no weekly schedule. We keep these exports so
// the host wiring mirrors the other courses exactly, but the start is null (rows
// carry no painted dates) and the UI reads "Self-paced" instead of "Cohort 1."
export const LIVING_LESSONS_PROPOSED_COHORT_START = null;
export const LIVING_LESSONS_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const LIVING_LESSONS_META = {
  key: 'living-lessons',
  title: 'Living Lessons from the Word',
  audience: 'the whole family and the whole Body — every age',
  tagline: 'You were never made to be flawless. You were made to be whole.',
  format: 'Self-paced · read it alone, as a family, or in a group · paced to your age',
  cadenceDays: 7,
  weeks: 1, // one published lesson today; the series grows as Darrell teaches more
  handsOnLabel: 'Take it with you',
  // The label layer that lets the shared engine render this honestly as a
  // self-paced lesson series rather than a weekly cohort class.
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to lead it (family or small group)',
    countNoun: 'lesson',
  },
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. Word-first and non-denominational — Scripture is senior to any tradition, and we let the Word and the Spirit lead. Grace-centered, for every age._',
};

// A gentle reading rhythm — not a 75-minute cohort clock. Used by the facilitator
// guide and the printout so a family or a small group has a shape to follow.
export const LIVING_LESSONS_SESSION_FLOW = [
  { minutes: 3, name: 'Open in prayer + read the Scripture' },
  { minutes: 10, name: 'The big idea, in your own words' },
  { minutes: 10, name: 'Go deeper — the two "perfects"' },
  { minutes: 10, name: 'Reflect together' },
  { minutes: 2, name: 'Take it with you' },
];
export const LIVING_LESSONS_SESSION_MINUTES = LIVING_LESSONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const LIVING_LESSONS_MODULES = [
  // ---------------------------------------------------------------------------
  {
    id: 'll1-the-perfect-yahweh-expects',
    title: 'The Perfect You Were Made For',
    bigIdea: 'None of us are flawless — and Yahweh never asked us to be. When He says "be perfect," the word does not mean "make no mistakes ever." It means whole, complete, grown-up, all-in. The flawless kind of perfect is a trap that breeds fear; the Perfect Yahweh actually expects is a wholehearted love that He Himself grows in you by grace. One crushes; the other sets you free.',
    inApp: 'Name the one place you have been beating yourself up for not being "perfect." Then say the truth out loud: "I was made to be whole, not flawless — and God is growing me." Carry that sentence into one real moment today where you would normally feel like you fell short.',
    anchor: {
      ref: 'Matthew 5:48; Genesis 17:1',
      theme: 'Two famous "be perfect" verses — and both words mean whole / complete / wholehearted, not flawless. The Perfect Yahweh expects is maturity and all-in love, grown in you by grace, not a spotless performance you have to produce.',
    },
    // BENEFITS — "What this frees in you." Darrell's framework made visible.
    benefits: [
      'Freedom from the crushing pressure to be flawless — the standard you were never actually given.',
      'Less anxiety and self-condemnation, because acceptance is a gift of grace, not a score you earn.',
      'A real, reachable target: grow whole — wholehearted, maturing, perfected in love by the Spirit.',
      'Rest for the scared, tired heart — you stop performing for God and start walking WITH Him.',
      'A way to extend the same grace to others, because you have stopped measuring everyone (including yourself) by flawless.',
    ],
    levels: {
      child: 'God never asked you to be perfect like a robot that never makes a single mistake. When the Bible says "be perfect," the word really means "be whole" and "be all grown up in love" — like an apple that is fully ripe, or a puzzle with every piece in. You will still mess up sometimes, and that is okay — God is not mad; He is helping you grow, a little at a time, like a gardener helps a plant. So you do not have to be scared or sad about not being perfect. You just keep loving God with your WHOLE heart, and He does the growing. That is the kind of perfect He wants — and it is good news, not bad news.',
      teen: 'Real talk: you are not flawless, and God already knows that — He was never asking for flawless. The verses that say "be perfect" (Matthew 5:48; Genesis 17:1) use words that mean WHOLE, COMPLETE, all-in — "mature," "wholehearted" — not "never make a mistake." Chasing flawless is actually a trap: it makes you anxious, never enough, always performing, and it is a standard the Bible never set. The perfect God actually wants is a heart that is all-in with Him, and the wild part is He grows that in you Himself, by His grace and His Spirit — you do not manufacture it by trying harder. Paul, who wrote a third of the New Testament, literally said "not that I am already perfect... but I press on" (Philippians 3:12). If he is still pressing on, you are allowed to be growing too. That is freedom.',
      senior: 'For the seasoned believer, this lesson lands as both relief and depth. The English word "perfect" has drifted: today it means flawless, but in 1611 (and in the underlying languages) it meant complete, whole, sound, brought to its proper end. The KJV translates BOTH the Hebrew tamim (Genesis 17:1, "walk before me, and be thou perfect" — Strong\'s H8549: complete, whole, sound, having integrity) AND the Greek teleios (Matthew 5:48 — Strong\'s G5046, from telos, "end / goal": complete, mature, brought to its purpose, lacking nothing necessary) as "perfect." The ESV, reading the same words, renders them "blameless" and "you... must be perfect, as your heavenly Father is perfect" — wholeness and maturity, not the modern sinless flawlessness. This matters pastorally: a lifetime of hearing "perfect" as "never falter" has wounded many sincere saints. Scripture is plain that flawless self-performance is neither the standard nor possible this side of glory (1 John 1:8; Philippians 3:12). What IS expected — and what grace produces — is a heart made whole and wholehearted, "perfected in love" (1 John 4:17-18), pressing on toward maturity (Hebrews 6:1; Colossians 1:28; James 1:4). The traditions differ on HOW far that perfecting goes in this life; they agree it is God\'s grace-work in us, not our flawless résumé. Rest in the finished work, and keep growing.',
    },
    quiz: {
      questions: [
        {
          q: 'When the Bible says "be perfect" (Matthew 5:48; Genesis 17:1), what does the word most directly mean?',
          options: [
            'Never make a single mistake — flawless',
            'Whole, complete, mature, wholehearted — brought to its proper end',
            'Better than everyone around you',
          ],
          answer: 1,
          explain: 'The Greek teleios (from telos, "end / goal") and the Hebrew tamim both mean complete / whole / mature / sound — not modern "flawless." The KJV even renders both as "perfect," which is why the older sense matters.',
        },
        {
          q: 'How is the "perfect" Yahweh expects actually produced in you?',
          options: [
            'By trying harder until you finally never slip',
            'By God\'s grace and His Spirit growing you — His work in you, received, not manufactured',
            'It is impossible, so you should give up',
          ],
          answer: 1,
          explain: 'It is grace-work: God perfects His people in love and grows them to maturity. We receive and cooperate; we do not manufacture flawlessness by effort.',
        },
        {
          q: 'What did the apostle Paul say about his own "perfection"?',
          options: [
            '"I have already arrived and am flawless."',
            '"Not that I am already perfect... but I press on" (Philippians 3:12).',
            'He never mentioned it.',
          ],
          answer: 1,
          explain: 'Paul models the posture exactly: already accepted in Christ, not yet flawless, still pressing on. Growth, not arrival, is the honest Christian life.',
        },
        {
          q: 'Why is chasing flawless-perfection spiritually dangerous?',
          options: [
            'It is not dangerous; it is the goal.',
            'It breeds fear, anxiety, and self-condemnation, and replaces grace with a score you can never earn.',
            'It makes you too humble.',
          ],
          answer: 1,
          explain: '"Perfect love casts out fear" (1 John 4:18) — flawless-performance religion runs on fear; the Perfect God expects runs on love and rest.',
        },
      ],
    },
    // DEEP SOURCE (4D) — the deep, language-and-grace-grounded teaching.
    lesson: 'Start with the honest truth no one should have to whisper: none of us are flawless. Not the pastor, not the parent, not the saint you admire. In this third-dimensional, in-the-flesh life, a spotless, never-falter record is not on offer to anyone — "if we say we have no sin, we deceive ourselves" (1 John 1:8, ESV). So when people read "You therefore must be perfect, as your heavenly Father is perfect" (Matthew 5:48, ESV) and hear "never make a mistake or you have failed God," it crushes them — and it is a misreading. The whole lesson turns on what the word "perfect" actually means. The English word has drifted: in everyday speech today "perfect" means flawless, but that is not what the biblical words mean, and it is not even what the word meant when the King James translators chose it in 1611. The Greek behind Matthew 5:48 is teleios (Strong\'s G5046), and it comes from telos — "end, goal, purpose." Teleios means complete, brought to its proper end, lacking nothing necessary to its completeness, full-grown, mature. It is the word for ripe fruit and for a grown adult, not for a machine with zero defects. The Hebrew behind Genesis 17:1 — where God tells Abram, "walk before me, and be thou perfect" (KJV) — is tamim (Strong\'s H8549): complete, whole, sound, having integrity. Notice the beautiful clue hiding in plain sight: the KJV translates BOTH of these very different words as "perfect," while the ESV, reading the exact same words, renders Genesis 17:1 "walk before me, and be blameless" and keeps Matthew 5:48 as "perfect... as your heavenly Father is perfect" in the sense of whole and mature. Same Scripture, and the older English "perfect" simply meant whole. So there are two very different "perfects." The first is the flawless kind the flesh chases — a spotless performance you must produce to be acceptable. The Bible never sets that as the standard, and chasing it is a trap: it breeds anxiety, endless self-measuring, and the quiet terror of never being enough. That is fear-driven religion, and "there is no fear in love, but perfect love casts out fear... whoever fears has not been perfected in love" (1 John 4:18, ESV). The second is the Perfect Yahweh actually expects: a heart made whole and wholehearted, complete in its devotion, maturing toward the purpose it was made for, and — this is the freeing part — "perfected in love" (1 John 4:17). And crucially, this perfect is something GOD does in you. It is grace-work, not self-manufacture: you "let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing" (James 1:4); you "go on to maturity" (Hebrews 6:1); Christ is at work to "present everyone mature in Christ" (Colossians 1:28). Even the apostle Paul — who wrote much of the New Testament — refused to claim flawlessness: "Not that I have already obtained this or am already perfect, but I press on to make it my own, because Christ Jesus has made me his own... forgetting what lies behind and straining forward to what lies ahead, I press on toward the goal" (Philippians 3:12-14, ESV). Already His, not yet flawless, still pressing on — that is the honest Christian posture, and Paul then says, "Let those of us who are mature [teleios] think this way" (Philippians 3:15). Now, sincere believers across the Body have long differed on HOW complete this perfecting becomes in this life. The Wesleyan and holiness streams have spoken of "Christian perfection" or entire sanctification — that God can so fill a heart with love that love, not sin, becomes its governing disposition (still maturing, never claiming sinless flawlessness). The Reformed stream emphasizes progressive sanctification — a real, lifelong growth in holiness that is never completed until glory, so "perfect" is chiefly the goal we press toward (Philippians 3:12). The Eastern Christian tradition speaks of theosis — being gradually transformed into the likeness of God by grace, a lifelong becoming. These are real differences, and we hold them with humility and do not divide the Body over them. But hear their common ground, because it is large and it is Word-first: all agree that the "perfect" of Scripture is NOT the flawless, never-stumble performance the flesh fears; all agree it is the work of God\'s grace and His Spirit, not something we manufacture by trying harder; all agree it centers on love and wholehearted devotion to God; and all agree it rests on the finished work of Christ, not on our résumé. So let the Word and the Spirit lead you here, not your shame. The standard was never flawless. The expectation is whole — and the same God who set the expectation is the One who grows it in you. That is not pressure. That is the kindest news your tired heart could hear.',
    facilitator: {
      talkingPoints: [
        'Two different "perfects": (1) flawless self-performance — the trap the flesh chases, which the Bible never sets as the standard and which breeds fear; (2) whole / complete / mature / wholehearted — the Perfect Yahweh actually expects, which God grows in you by grace.',
        'The language is verified, not vibes: Greek teleios (Matt 5:48, Strong\'s G5046) from telos ("end / goal") = complete, full-grown, mature, lacking nothing necessary. Hebrew tamim (Gen 17:1, Strong\'s H8549) = complete, whole, sound, integrity. Neither means "without any flaw."',
        'The translation clue: the KJV renders BOTH tamim and teleios as "perfect"; the ESV reads Gen 17:1 as "blameless" and Matt 5:48 as "perfect... as your Father is perfect" (whole/mature). The old English "perfect" simply meant whole.',
        'It is grace-work, received not manufactured: James 1:4 (perfect and complete), Hebrews 6:1 (go on to maturity), Colossians 1:28 (present everyone mature), 1 John 4:17-18 (perfected in love; perfect love casts out fear).',
        'Paul\'s posture is the model: "not that I am already perfect... but I press on" (Phil 3:12-14), then "let those of us who are mature think this way" (3:15). Already His, not yet flawless, still pressing.',
        'Evenhanded + Word-first: name the traditions fairly (Wesleyan entire-sanctification / Reformed progressive sanctification / Orthodox theosis) and their LARGE common ground; let the Word and the Spirit lead; do not divide the Body.',
        'Well-being bright line: this FREES from perfectionism. If anyone leaves more burdened, it was taught wrong. The standard was never flawless; the expectation is whole, and God grows it.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Matthew 5:48 and Genesis 17:1 aloud — ask, "what does \'perfect\' make you feel?" | The big idea, in your own words (10): name the two perfects — flawless (the trap) vs whole (what God expects); ask who has felt crushed by the flawless kind. | Go deeper — the two "perfects" (10): walk through teleios (from telos, "goal") and tamim (whole / sound), and the KJV-vs-ESV clue; land James 1:4, Hebrews 6:1, 1 John 4:18, and Paul\'s "I press on" (Phil 3:12). | Reflect together (10): use the discussion prompts; if it fits the room, name the traditions fairly and their common ground, then let the Word lead. | Take it with you (2): each person names one place they\'ve chased flawless, and trades it for "made whole, growing by grace" — carry that into one real moment.',
      discussionPrompts: [
        'Where in your life have you been carrying "flawless" as the standard — and how has that felt?',
        'What changes when you hear "perfect" as WHOLE and WHOLEHEARTED instead of flawless?',
        'Paul said "not that I am already perfect... but I press on." How does it free you that he is still growing too?',
        '"Perfect love casts out fear." Where is fear still driving how you try to be good — and what would love do instead?',
        'If God Himself grows this in you by grace, what can you stop white-knuckling today?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this series behaves identically to the four courses. The
// schedule is built WITHOUT dates (self-paced): rows carry week/lesson numbers
// but no painted calendar date.
// ---------------------------------------------------------------------------
import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const LIVING_LESSONS_INTEREST_TAG = '[Living Lessons interest]';
export const LIVING_LESSONS_HELPER_TAG = '[Living Lessons helper]';

export function resolveLivingLessonsCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, LIVING_LESSONS_CONFIRMED_COHORT, LIVING_LESSONS_PROPOSED_COHORT_START);
}

// Self-paced: one row per lesson with its lesson number, but NO computed date.
export function buildLivingLessonsSchedule() {
  return LIVING_LESSONS_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function livingLessonsProgressSummary(progress = {}) {
  return progressSummaryFor(LIVING_LESSONS_MODULES, progress);
}

export function exportLivingLessonsCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: LIVING_LESSONS_META, sessionFlow: LIVING_LESSONS_SESSION_FLOW, modules: LIVING_LESSONS_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide introduces itself as a Word-first,
// grace-centered companion, age-aware, never improvising theology beyond Scripture.
export const LIVING_LESSONS_TUTOR_META = {
  title: LIVING_LESSONS_META.title,
  intro: 'You are a warm, grace-centered guide for a Word-first, non-denominational lesson series called "Living Lessons from the Word."',
  posture: 'Guide ONE reader — who may be a child, a teen, an adult, or a seasoned believer — through the lesson, matching your words and pace to their age. The throughline of Lesson 1: the "perfect" God expects means WHOLE / COMPLETE / MATURE / WHOLEHEARTED (Greek teleios, from telos = goal; Hebrew tamim = whole, sound), NOT flawless self-performance — and God grows it by grace, so it frees rather than burdens. Be relentlessly WELL-BEING-POSITIVE: lift the weight of perfectionism off them; never add pressure or shame. Be EVENHANDED and Word-first: if traditions on sanctification come up (Wesleyan, Reformed, Orthodox), present them fairly, name their common ground, and let the Word and the Spirit lead — do not divide the Body. Cite Scripture by reference (ESV primary, KJV where the wording is the point); never invent or paraphrase a verse as if quoting it, and if unsure of a text, say so rather than fabricate. Always point them back to grace and the finished work of Christ.',
};
