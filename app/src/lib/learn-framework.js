// =============================================================================
// learn-framework — the SHARED scaffolding every PoeTech Learn course consumes
// =============================================================================
// Darrell 2026-06-16 (binding standard for ALL courses): "as rich as possible,
// with or without me, inside PoeTech." This file is the REUSABLE framework so both
// "Learning A.I. The Way" and "The Broadcast: How It All Works" get the richness at
// once — never duplicated per course. A module is authored data; this framework
// gives that data structure + behavior:
//
//   • SELF-DRIVING TUTOR — a solo learner finishes with NO facilitator required;
//     the per-week tutor (lib/class-tutor.js → askTutor, sovereign local LLM) walks
//     them through, grounded in the week's authored content (+ the course's tutor
//     course-meta). Facilitator mode is available but never required.
//   • MULTI-MODAL LESSON SCHEMA — each module may carry: a written `lesson`,
//     skill-branched `levels`, `media` (POV SOP clips / embedded videos / diagrams),
//     a hands-on `inApp` activity, a `quiz` (check-for-understanding), and a
//     Scripture `anchor`. Every field except title/bigIdea/anchor is OPTIONAL, so a
//     lean module still renders; a rich one renders richer. Same renderer for both.
//   • SKILL-LEVEL BRANCHING — the right depth for a senior founding member vs a
//     teen. resolveLevel() picks the level's text and falls back to the base lesson.
//   • PROGRESS + ASSESSMENT + GRADUATE→HELPER — progress is 0→complete from the
//     learner's REAL record; quizzes are graded; finishing (+ passing the quizzes
//     that exist) makes the learner eligible to help teach the next cohort. The
//     course teaches itself forward.
//
// SOVEREIGN (the Charter; DR-0076): the tutor + any media processing route to the
// LOCAL LLM on the family NAS, never a vendor cloud, for course content. Nothing is
// painted — progress + assessment come from the learner's real record; media that
// isn't captured yet shows as pending, never a fake player.
// =============================================================================

// ---------------------------------------------------------------------------
// Skill-level branching
// ---------------------------------------------------------------------------
// A module MAY carry `levels: { teen?, standard?, senior? }` (each a lesson string
// at that depth). When it does, the learner's chosen level picks the text; when it
// doesn't, every level falls back to the base `lesson`. 'standard' is the default.
export const LEARN_LEVELS = [
  { id: 'standard', label: 'Standard', hint: 'A clear, balanced depth for most learners.' },
  { id: 'teen', label: 'Teen', hint: 'Plainer language, more encouragement, smaller steps.' },
  { id: 'senior', label: 'Senior / founding', hint: 'Honors deep experience; gets to the why and the edge cases.' },
];
export const DEFAULT_LEVEL = 'standard';

export function normalizeLevel(levelId) {
  return LEARN_LEVELS.some((l) => l.id === levelId) ? levelId : DEFAULT_LEVEL;
}

// Resolve the lesson text a learner should see at their chosen level. Falls back
// cleanly: requested level → standard level → base lesson. Returns { text, levelId,
// branched } so the UI can show whether a level-specific version exists.
export function resolveLevel(module, levelId = DEFAULT_LEVEL) {
  const m = module || {};
  const levels = m.levels && typeof m.levels === 'object' ? m.levels : null;
  const want = normalizeLevel(levelId);
  if (levels) {
    if (typeof levels[want] === 'string' && levels[want]) return { text: levels[want], levelId: want, branched: true };
    if (typeof levels[DEFAULT_LEVEL] === 'string' && levels[DEFAULT_LEVEL]) return { text: levels[DEFAULT_LEVEL], levelId: DEFAULT_LEVEL, branched: true };
  }
  return { text: m.lesson || '', levelId: want, branched: false };
}

// ---------------------------------------------------------------------------
// Multi-modal media
// ---------------------------------------------------------------------------
// A module MAY carry `media: [{ type, title, ... }]`. Types:
//   • 'diagram' — { type, key, title, caption } — key maps to an authored renderer.
//   • 'video'   — { type, title, src?, status?, caption } — an embedded sermon /
//                 broadcast walk-through. No src yet => status 'pending' (honest).
//   • 'clip'    — { type, title, sopId?, status?, caption } — a POV SOP clip. Until
//                 captured, status 'pending-capture'; sopId links to the SOP library.
// Returns the list with a normalized `status` so the renderer never guesses.
export function normalizeMedia(module) {
  const list = Array.isArray(module?.media) ? module.media : [];
  return list.map((item) => {
    const it = item || {};
    let status = it.status || null;
    if (!status) {
      if (it.type === 'diagram') status = 'ready';
      else if (it.src) status = 'ready';
      else status = it.type === 'clip' ? 'pending-capture' : 'pending';
    }
    return { ...it, status };
  });
}

export function hasReadyMedia(module) {
  return normalizeMedia(module).some((m) => m.status === 'ready');
}

// ---------------------------------------------------------------------------
// Quiz / assessment (check-for-understanding)
// ---------------------------------------------------------------------------
// A module MAY carry `quiz: { questions: [{ q, options:[...], answer:idx, explain? }] }`.
// `answers` is { [questionIndex]: selectedOptionIndex }. Grading is pure + tested.
export const QUIZ_PASS_RATIO = 0.7;

export function gradeQuiz(quiz, answers = {}) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const total = questions.length;
  if (!total) return { total: 0, correct: 0, pct: 0, passed: false, answered: 0, perQuestion: [] };
  let correct = 0;
  let answered = 0;
  const perQuestion = questions.map((q, i) => {
    const sel = answers[i];
    const has = sel !== undefined && sel !== null;
    if (has) answered += 1;
    const isCorrect = has && Number(sel) === Number(q.answer);
    if (isCorrect) correct += 1;
    return { index: i, selected: has ? Number(sel) : null, correct: isCorrect, answer: Number(q.answer) };
  });
  const pct = Math.round((correct / total) * 100);
  return { total, correct, pct, passed: correct / total >= QUIZ_PASS_RATIO, answered, perQuestion };
}

// Has this learner passed this module's quiz? quizState is the stored map keyed by
// module id: { [moduleId]: { passed, pct, at } }. A module with NO quiz is treated
// as "no gate" (passed === true) so quiz-less modules never block graduation.
export function moduleQuizPassed(module, quizState = {}) {
  if (!module?.quiz?.questions?.length) return true;
  const rec = quizState[module.id];
  return !!(rec && rec.passed);
}

// ---------------------------------------------------------------------------
// Progress, assessment summary, and the graduate → helper path
// ---------------------------------------------------------------------------
// Counts are REAL (from the learner's progress + quiz records), never painted.
// `progress` = { [moduleId]: truthy } ; `quizState` = { [moduleId]: { passed,pct } }.
export function courseAssessment(modules = [], progress = {}, quizState = {}) {
  const list = modules || [];
  const total = list.length;
  const done = list.filter((m) => !!progress[m.id]).length;
  const withQuiz = list.filter((m) => m.quiz?.questions?.length);
  const quizzesPassed = withQuiz.filter((m) => moduleQuizPassed(m, quizState)).length;
  const progressPct = total ? Math.round((done / total) * 100) : 0;
  // "Complete" = every week marked done AND every quiz that exists is passed.
  const complete = total > 0 && done === total && quizzesPassed === withQuiz.length;
  return {
    total,
    done,
    progressPct,
    quizTotal: withQuiz.length,
    quizzesPassed,
    complete,
    // Eligible to help teach the next cohort once the course is complete — the
    // "graduate becomes the next cohort's helper" multiplication path (2 Tim 2:2).
    eligibleToHelp: complete,
  };
}

// The note a graduate sends to volunteer as a next-cohort helper. Rides the same
// cross-tenant feedback pipe the interest button uses, so it reaches the Governor.
export function helperInterestText(courseTitle, who, tag = '[Class helper]') {
  const name = (who || 'A learner').trim() || 'A learner';
  return `${tag} ${name} completed "${courseTitle}" and wants to help teach the next cohort.`;
}
