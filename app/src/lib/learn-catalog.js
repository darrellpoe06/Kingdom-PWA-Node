// =============================================================================
// learn-catalog — the ONE derived registry of every finished Learn course
// =============================================================================
// Darrell 2026-07-08 ("this is my 1000th time requesting this"): the Church →
// Learn tab must carry EVERY finished course in the PoeTech App — at least 40
// lessons — and the catalog must be DERIVED, never a hand-typed list that
// silently drops what was built (Kingdom Economics and Prophetic Voices were
// fully built on 2026-07-04 and never surfaced; that class of miss ends here).
//
// This registry is the single source of truth for WHAT finished courses exist.
// - The host (poe-financial-mvp-v28.jsx) builds its self-paced course
//   descriptors FROM this registry (buildSelfPacedDescriptors) — the cohort
//   courses keep their bespoke cohort wiring but are still REGISTERED here so
//   counting and completeness cover them.
// - learn-catalog-render.test.jsx clicks every registered course in a real
//   render and asserts the ≥ 40-lesson floor — a course that is built but not
//   surfaced, or that crashes on open, fails CI instead of production
//   (DR-0076 proven-to-catch; the 2026-07-08 "Living lessons break").
// - The lesson count shown in the Learn header derives from the live course
//   list at render time (no static number — DR-0121).
// =============================================================================

import { CLASS_META, SESSION_FLOW, buildSchedule, progressSummary, exportCurriculumMarkdown, CLASS_INTEREST_TAG } from './church-classes.js';
import { BROADCAST_META, BROADCAST_SESSION_FLOW, buildBroadcastSchedule, broadcastProgressSummary, exportBroadcastCurriculumMarkdown, BROADCAST_INTEREST_TAG, BROADCAST_HELPER_TAG, BROADCAST_TUTOR_META } from './broadcast-class.js';
import { INFRA_META, INFRA_SESSION_FLOW, buildInfraSchedule, infraProgressSummary, exportInfraCurriculumMarkdown, INFRA_INTEREST_TAG, INFRA_HELPER_TAG, INFRA_TUTOR_META } from './infrastructure-class.js';
import { SOVEREIGN_AI_META, SOVEREIGN_AI_SESSION_FLOW, buildSovereignAiSchedule, sovereignAiProgressSummary, exportSovereignAiCurriculumMarkdown, SOVEREIGN_AI_INTEREST_TAG, SOVEREIGN_AI_HELPER_TAG, SOVEREIGN_AI_TUTOR_META } from './sovereign-ai-class.js';
import { AI_LEGAL_BLUEPRINT_META, AI_LEGAL_BLUEPRINT_SESSION_FLOW, buildAiLegalBlueprintSchedule, aiLegalBlueprintProgressSummary, exportAiLegalBlueprintCurriculumMarkdown, AI_LEGAL_BLUEPRINT_INTEREST_TAG, AI_LEGAL_BLUEPRINT_HELPER_TAG, AI_LEGAL_BLUEPRINT_TUTOR_META } from './ai-legal-blueprint-class.js';
import { LIVING_LESSONS_META, LIVING_LESSONS_SESSION_FLOW, buildLivingLessonsSchedule, livingLessonsProgressSummary, exportLivingLessonsCurriculumMarkdown, LIVING_LESSONS_INTEREST_TAG, LIVING_LESSONS_HELPER_TAG, LIVING_LESSONS_TUTOR_META } from './living-lessons-class.js';
import { MADE_IN_TIME_META, MADE_IN_TIME_SESSION_FLOW, buildMadeInTimeSchedule, madeInTimeProgressSummary, exportMadeInTimeCurriculumMarkdown, MADE_IN_TIME_INTEREST_TAG, MADE_IN_TIME_HELPER_TAG, MADE_IN_TIME_TUTOR_META } from './made-in-time-course.js';
import { SOUND_BOARD_META, SOUND_BOARD_SESSION_FLOW, buildSoundBoardSchedule, soundBoardProgressSummary, exportSoundBoardCurriculumMarkdown, SOUND_BOARD_INTEREST_TAG, SOUND_BOARD_HELPER_TAG, SOUND_BOARD_TUTOR_META } from './sound-board-class.js';
import { WORD_OUT_META, WORD_OUT_SESSION_FLOW, buildWordOutSchedule, wordOutProgressSummary, exportWordOutCurriculumMarkdown, WORD_OUT_INTEREST_TAG, WORD_OUT_HELPER_TAG, WORD_OUT_TUTOR_META } from './word-out-course.js';
import { CHURCH_OFFICES_META, CHURCH_OFFICES_SESSION_FLOW, buildChurchOfficesSchedule, churchOfficesProgressSummary, exportChurchOfficesCurriculumMarkdown, CHURCH_OFFICES_INTEREST_TAG, CHURCH_OFFICES_HELPER_TAG, CHURCH_OFFICES_TUTOR_META } from './church-offices-course.js';
import { WORLD_ISSUES_META, WORLD_ISSUES_SESSION_FLOW, buildWorldIssuesSchedule, worldIssuesProgressSummary, exportWorldIssuesCurriculumMarkdown, WORLD_ISSUES_INTEREST_TAG, WORLD_ISSUES_HELPER_TAG, WORLD_ISSUES_TUTOR_META } from './world-issues-class.js';
import { DATASYSTEMS_META, DATASYSTEMS_SESSION_FLOW, buildDatasystemsSchedule, datasystemsProgressSummary, exportDatasystemsCurriculumMarkdown, DATASYSTEMS_INTEREST_TAG, DATASYSTEMS_HELPER_TAG, DATASYSTEMS_TUTOR_META } from './datasystems-course.js';
import { SUCCESSION_META, SUCCESSION_SESSION_FLOW, buildSuccessionSchedule, successionProgressSummary, exportSuccessionCurriculumMarkdown, SUCCESSION_INTEREST_TAG, SUCCESSION_HELPER_TAG, SUCCESSION_TUTOR_META } from './succession-class.js';
import { ECON_META, ECON_SESSION_FLOW, buildEconSchedule, econProgressSummary, exportEconCurriculumMarkdown, ECON_INTEREST_TAG, ECON_HELPER_TAG, ECON_TUTOR_META } from './economics-class.js';
import { PV_META, PV_SESSION_FLOW, buildPvSchedule, pvProgressSummary, exportPvCurriculumMarkdown, PV_INTEREST_TAG, PV_HELPER_TAG, PV_TUTOR_META } from './prophetic-voices.js';

// Every finished course, in picker order. `wiring: 'cohort'` = the host owns a
// bespoke cohort-dated descriptor; `wiring: 'self-paced'` = the descriptor is
// built HERE (buildSelfPacedDescriptors) and rides in via extraCourses.
export const LEARN_CATALOG = [
  {
    key: 'ai', wiring: 'component', unitCap: 'Week',
    meta: { ...CLASS_META, key: 'ai', category: 'A.I. The Way' }, sessionFlow: SESSION_FLOW,
    buildScheduleRows: () => buildSchedule(null), progressSummary: (p) => progressSummary(p),
    exportMarkdown: () => exportCurriculumMarkdown(null), downloadName: 'learning-ai-the-way-curriculum.md',
    interestTag: CLASS_INTEREST_TAG, helperTag: '[Class helper]', tutorCourseMeta: null,
  },
  {
    key: 'broadcast', wiring: 'cohort', unitCap: 'Week',
    meta: { ...BROADCAST_META, key: 'broadcast', category: 'Serve the House' }, sessionFlow: BROADCAST_SESSION_FLOW,
    buildScheduleRows: () => buildBroadcastSchedule(null), progressSummary: (p) => broadcastProgressSummary(p),
    exportMarkdown: () => exportBroadcastCurriculumMarkdown(null), downloadName: 'the-broadcast-how-it-all-works-curriculum.md',
    interestTag: BROADCAST_INTEREST_TAG, helperTag: BROADCAST_HELPER_TAG, tutorCourseMeta: BROADCAST_TUTOR_META,
  },
  {
    key: 'infrastructure', wiring: 'cohort', unitCap: 'Week',
    meta: { ...INFRA_META, key: 'infrastructure', category: 'Serve the House' }, sessionFlow: INFRA_SESSION_FLOW,
    buildScheduleRows: () => buildInfraSchedule(null), progressSummary: (p) => infraProgressSummary(p),
    exportMarkdown: () => exportInfraCurriculumMarkdown(null), downloadName: 'the-infrastructure-how-we-build-it-sovereign-curriculum.md',
    interestTag: INFRA_INTEREST_TAG, helperTag: INFRA_HELPER_TAG, tutorCourseMeta: INFRA_TUTOR_META,
  },
  {
    key: 'sovereign-ai', wiring: 'cohort', unitCap: 'Week',
    meta: { ...SOVEREIGN_AI_META, key: 'sovereign-ai', category: 'A.I. The Way' }, sessionFlow: SOVEREIGN_AI_SESSION_FLOW,
    buildScheduleRows: () => buildSovereignAiSchedule(null), progressSummary: (p) => sovereignAiProgressSummary(p),
    exportMarkdown: () => exportSovereignAiCurriculumMarkdown(null), downloadName: 'sovereign-ai-why-we-build-local-curriculum.md',
    interestTag: SOVEREIGN_AI_INTEREST_TAG, helperTag: SOVEREIGN_AI_HELPER_TAG, tutorCourseMeta: SOVEREIGN_AI_TUTOR_META,
  },
  {
    key: 'ai-legal-blueprint', wiring: 'cohort', unitCap: 'Week',
    meta: { ...AI_LEGAL_BLUEPRINT_META, key: 'ai-legal-blueprint', category: 'A.I. The Way' }, sessionFlow: AI_LEGAL_BLUEPRINT_SESSION_FLOW,
    buildScheduleRows: () => buildAiLegalBlueprintSchedule(null), progressSummary: (p) => aiLegalBlueprintProgressSummary(p),
    exportMarkdown: () => exportAiLegalBlueprintCurriculumMarkdown(null), downloadName: 'ai-legal-blueprint-what-never-to-tell-a-chatbot-curriculum.md',
    interestTag: AI_LEGAL_BLUEPRINT_INTEREST_TAG, helperTag: AI_LEGAL_BLUEPRINT_HELPER_TAG, tutorCourseMeta: AI_LEGAL_BLUEPRINT_TUTOR_META,
  },
  {
    key: 'living-lessons', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...LIVING_LESSONS_META, key: 'living-lessons', category: 'The Word & The Way' }, sessionFlow: LIVING_LESSONS_SESSION_FLOW,
    buildScheduleRows: () => buildLivingLessonsSchedule(), progressSummary: (p) => livingLessonsProgressSummary(p),
    exportMarkdown: () => exportLivingLessonsCurriculumMarkdown(), downloadName: 'living-lessons-from-the-word.md',
    interestTag: LIVING_LESSONS_INTEREST_TAG, helperTag: LIVING_LESSONS_HELPER_TAG, tutorCourseMeta: LIVING_LESSONS_TUTOR_META,
    interestText: (who) => `${LIVING_LESSONS_INTEREST_TAG} ${who} wants more Living Lessons.`,
    interestCopy: {
      heading: 'Want more Living Lessons?',
      blurb: 'Tell Darrell which Word-first lessons would help you and your family most, and he’ll add them to the series. Read at your own pace, any time, at any age.',
      cta: 'I’d like more',
      sent: '✓ Sent — Darrell will see what you’re hungry for. The Word feeds the whole Body.',
    },
  },
  {
    key: 'made-in-time', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...MADE_IN_TIME_META, key: 'made-in-time', category: 'The Word & The Way' }, sessionFlow: MADE_IN_TIME_SESSION_FLOW,
    buildScheduleRows: () => buildMadeInTimeSchedule(), progressSummary: (p) => madeInTimeProgressSummary(p),
    exportMarkdown: () => exportMadeInTimeCurriculumMarkdown(), downloadName: 'made-in-time.md',
    interestTag: MADE_IN_TIME_INTEREST_TAG, helperTag: MADE_IN_TIME_HELPER_TAG, tutorCourseMeta: MADE_IN_TIME_TUTOR_META,
    interestText: (who) => `${MADE_IN_TIME_INTEREST_TAG} ${who} wants more of Made in Time.`,
    interestCopy: {
      heading: 'Want more of this course?',
      blurb: 'Tell Darrell which ages, mind-and-brain questions, or spiritual-warfare topics to cover next, and he’ll add them — Word-first, with science as a witness, never over the Word.',
      cta: 'I’d like more',
      sent: '✓ Sent — Darrell will see what you’re hungry for.',
    },
  },
  {
    key: 'sound-board', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...SOUND_BOARD_META, key: 'sound-board', category: 'Serve the House' }, sessionFlow: SOUND_BOARD_SESSION_FLOW,
    buildScheduleRows: () => buildSoundBoardSchedule(), progressSummary: (p) => soundBoardProgressSummary(p),
    exportMarkdown: () => exportSoundBoardCurriculumMarkdown(), downloadName: 'running-the-board-live-sound.md',
    interestTag: SOUND_BOARD_INTEREST_TAG, helperTag: SOUND_BOARD_HELPER_TAG, tutorCourseMeta: SOUND_BOARD_TUTOR_META,
    interestText: (who) => `${SOUND_BOARD_INTEREST_TAG} ${who} wants to learn to run the sound board.`,
    interestCopy: {
      heading: 'Want to learn the sound board?',
      blurb: 'Tell Darrell you want to train on live sound for worship and he’ll get you started with the sound engineer. Learn at your own pace, right at the board, at any experience level.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will get you on the sound team. We mix so the Word is heard.',
    },
  },
  {
    key: 'church-offices', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...CHURCH_OFFICES_META, key: 'church-offices', category: 'The Word & The Way' }, sessionFlow: CHURCH_OFFICES_SESSION_FLOW,
    buildScheduleRows: () => buildChurchOfficesSchedule(), progressSummary: (p) => churchOfficesProgressSummary(p),
    exportMarkdown: () => exportChurchOfficesCurriculumMarkdown(), downloadName: 'the-functions-of-the-house.md',
    interestTag: CHURCH_OFFICES_INTEREST_TAG, helperTag: CHURCH_OFFICES_HELPER_TAG, tutorCourseMeta: CHURCH_OFFICES_TUTOR_META,
    interestText: (who) => `${CHURCH_OFFICES_INTEREST_TAG} ${who} wants The Functions of the House study.`,
    interestCopy: {
      heading: 'Want this study of the offices?',
      blurb: 'Deacons, elders, bishops, pastors, the Ephesians 4 gifts — who they are in the Word, with every count measured from the text. Tell Darrell you want it for yourself or your leadership group.',
      cta: 'I want this study',
      sent: '✓ Sent — Darrell will see it. Function over title; the Word explains the Word.',
    },
  },
  {
    key: 'word-out', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...WORD_OUT_META, key: 'word-out', category: 'Serve the House' }, sessionFlow: WORD_OUT_SESSION_FLOW,
    buildScheduleRows: () => buildWordOutSchedule(), progressSummary: (p) => wordOutProgressSummary(p),
    exportMarkdown: () => exportWordOutCurriculumMarkdown(), downloadName: 'getting-the-word-out.md',
    interestTag: WORD_OUT_INTEREST_TAG, helperTag: WORD_OUT_HELPER_TAG, tutorCourseMeta: WORD_OUT_TUTOR_META,
    interestText: (who) => `${WORD_OUT_INTEREST_TAG} ${who} wants the Getting the Word Out staff training.`,
    interestCopy: {
      heading: 'Want this staff training?',
      blurb: 'Tell Darrell you want to learn the broadcast flow — one upload, everywhere — and how to ask for what you want built. Self-paced, plain words, at the real pages.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will see it. One upload, and the Word goes out.',
    },
  },
  {
    key: 'world-issues', wiring: 'self-paced', unitCap: 'Issue',
    meta: { ...WORLD_ISSUES_META, key: 'world-issues', category: 'The Word & The Way' }, sessionFlow: WORLD_ISSUES_SESSION_FLOW,
    buildScheduleRows: () => buildWorldIssuesSchedule(), progressSummary: (p) => worldIssuesProgressSummary(p),
    exportMarkdown: () => exportWorldIssuesCurriculumMarkdown(), downloadName: 'thinking-it-through-world-issues-discernment.md',
    interestTag: WORLD_ISSUES_INTEREST_TAG, helperTag: WORLD_ISSUES_HELPER_TAG, tutorCourseMeta: WORLD_ISSUES_TUTOR_META,
    interestText: (who) => `${WORLD_ISSUES_INTEREST_TAG} ${who} wants more World Issues discernment lessons.`,
    interestCopy: {
      heading: 'Want more discernment lessons?',
      blurb: 'Tell Darrell which world issue you’d like thought through The Way — documented truth spoken plainly, every side heard fairly, and the Word’s justice, with the verdict on a soul left to God. Read at your own pace, at any age.',
      cta: 'I’d like more',
      sent: '✓ Sent — Darrell will see what to think through next. We speak truth and hold grace.',
    },
  },
  {
    key: 'datasystems', wiring: 'self-paced', unitCap: 'Module',
    meta: { ...DATASYSTEMS_META, key: 'datasystems', category: 'Serve the House' }, sessionFlow: DATASYSTEMS_SESSION_FLOW,
    buildScheduleRows: () => buildDatasystemsSchedule(), progressSummary: (p) => datasystemsProgressSummary(p),
    exportMarkdown: () => exportDatasystemsCurriculumMarkdown(), downloadName: 'poetech-data-systems-and-infrastructure.md',
    interestTag: DATASYSTEMS_INTEREST_TAG, helperTag: DATASYSTEMS_HELPER_TAG, tutorCourseMeta: DATASYSTEMS_TUTOR_META,
    interestText: (who) => `${DATASYSTEMS_INTEREST_TAG} ${who} wants to learn the PoeTech data systems and infrastructure.`,
    interestCopy: {
      heading: 'Want to learn the systems?',
      blurb: 'Tell Darrell you want to come up to speed on the PoeTech data systems and the church tech stack — how it works, the equipment, and the skills — and he’ll get you started. Self-paced, plain language, at any experience level.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will get you onboarded. We steward the systems so the Body is equipped.',
    },
  },
  {
    key: 'handed-forward', wiring: 'self-paced', unitCap: 'Week',
    meta: { ...SUCCESSION_META, key: 'handed-forward', category: 'Kingdom Life & Stewardship' }, sessionFlow: SUCCESSION_SESSION_FLOW,
    buildScheduleRows: () => buildSuccessionSchedule(null), progressSummary: (p) => successionProgressSummary(p),
    exportMarkdown: () => exportSuccessionCurriculumMarkdown(), downloadName: 'handed-forward-succession-curriculum.md',
    interestTag: SUCCESSION_INTEREST_TAG, helperTag: SUCCESSION_HELPER_TAG, tutorCourseMeta: SUCCESSION_TUTOR_META,
    interestText: (who) => `${SUCCESSION_INTEREST_TAG} ${who} wants to take the Handed Forward succession course.`,
    interestCopy: {
      heading: 'Being raised to take over?',
      blurb: 'Tell Darrell you want to take Handed Forward — the succession course for the next generation. We hand you the mission, not our path: know the God of your father, learn to read the real books, and build what we could not. Self-paced, at any age.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will see you’re in. We hand it forward.',
    },
  },
  {
    key: 'kingdom-economics', wiring: 'self-paced', unitCap: 'Session',
    meta: { ...ECON_META, key: 'kingdom-economics', category: 'Kingdom Life & Stewardship' }, sessionFlow: ECON_SESSION_FLOW,
    buildScheduleRows: () => buildEconSchedule(null), progressSummary: (p) => econProgressSummary(p),
    exportMarkdown: () => exportEconCurriculumMarkdown(null), downloadName: 'kingdom-economics-curriculum.md',
    interestTag: ECON_INTEREST_TAG, helperTag: ECON_HELPER_TAG, tutorCourseMeta: ECON_TUTOR_META,
    interestText: (who) => `${ECON_INTEREST_TAG} ${who} wants to take the Kingdom Economics course.`,
    interestCopy: {
      heading: 'Want to learn Kingdom Economics?',
      blurb: 'Tell Darrell you want to take Kingdom Economics — the soul prospers first, the documented truth is told whole, and the Body builds ownership together. Self-paced or as a class, at every age.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will see you’re in. Prosper as your soul prospers.',
    },
  },
  {
    key: 'prophetic-voices', wiring: 'self-paced', unitCap: 'Voice',
    meta: { ...PV_META, key: 'prophetic-voices', category: 'The Word & The Way' }, sessionFlow: PV_SESSION_FLOW,
    buildScheduleRows: () => buildPvSchedule(null), progressSummary: (p) => pvProgressSummary(p),
    exportMarkdown: () => exportPvCurriculumMarkdown(null), downloadName: 'prophetic-voices-study.md',
    interestTag: PV_INTEREST_TAG, helperTag: PV_HELPER_TAG, tutorCourseMeta: PV_TUTOR_META,
    interestText: (who) => `${PV_INTEREST_TAG} ${who} wants to take the Prophetic Voices study.`,
    interestCopy: {
      heading: 'Ready to hear the Body’s own prophets?',
      blurb: 'Tell Darrell you want the Prophetic Voices study — the record of the Body’s own witnesses who named the truth at cost, cited to their real work and weighed by the Word. Self-paced, one voice at a time.',
      cta: 'I want the record',
      sent: '✓ Sent — Darrell will see you’re in. We keep the record of the ones who told the truth.',
    },
  },
];

// Derived catalog totals — courses and finished lessons. This is the number the
// Learn header shows and the ≥ 40-lesson floor is asserted against. Never a
// hand-typed count (DR-0121).
export function learnCatalogSummary() {
  const lessons = LEARN_CATALOG.reduce((t, c) => t + c.buildScheduleRows().length, 0);
  return { courses: LEARN_CATALOG.length, lessons };
}

// The helper tag for a course key — replaces the host's hand-typed ternary
// chain so a course added to the catalog is automatically covered.
export function helperTagForCourse(courseKey) {
  const entry = LEARN_CATALOG.find((c) => c.key === courseKey);
  return (entry && entry.helperTag) || '[Class helper]';
}

// Build the SELF-PACED course descriptors for the Learn tab from the registry.
// `submitInterestFor(entry)` returns the descriptor's submitInterest (or null);
// `rosterFor(entry)` returns the Governor roster (or null). Cohort courses keep
// their bespoke host descriptors — but they are registered above so counting
// and the render gate cover them.
export function buildSelfPacedDescriptors({ submitInterestFor = null, rosterFor = null, engagementByAge = null } = {}) {
  return LEARN_CATALOG.filter((e) => e.wiring === 'self-paced').map((e) => ({
    meta: e.meta,
    sessionFlow: e.sessionFlow,
    schedule: e.buildScheduleRows(),
    cohortStart: null,
    cohortConfirmed: false,
    setCohortStart: null,
    confirmCohort: null,
    progressSummary: e.progressSummary,
    exportMarkdown: e.exportMarkdown,
    downloadName: e.downloadName,
    submitInterest: submitInterestFor ? submitInterestFor(e) : null,
    roster: rosterFor ? rosterFor(e) : null,
    interestCopy: e.interestCopy,
    tutorCourseMeta: e.tutorCourseMeta,
    engagementByAge,
  }));
}

// Test/harness helper — descriptors for EVERY registered course except the
// component-owned youth A.I. course (ChurchLearn always mounts that itself), so
// a render gate can click through the whole catalog.
export function buildCatalogCourseDescriptors() {
  return LEARN_CATALOG.filter((e) => e.wiring !== 'component').map((e) => ({
    meta: e.meta,
    sessionFlow: e.sessionFlow,
    schedule: e.buildScheduleRows(),
    cohortStart: null,
    cohortConfirmed: false,
    setCohortStart: null,
    confirmCohort: null,
    progressSummary: e.progressSummary,
    exportMarkdown: e.exportMarkdown,
    downloadName: e.downloadName,
    submitInterest: null,
    roster: null,
    interestCopy: e.interestCopy || null,
    tutorCourseMeta: e.tutorCourseMeta,
    engagementByAge: null,
  }));
}
