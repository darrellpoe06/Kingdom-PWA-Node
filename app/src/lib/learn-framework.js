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

// =============================================================================
// AGE-ADAPTIVE DELIVERY — ONE curriculum, translated by age (Darrell 2026-06-16)
// =============================================================================
// "The same content renders per age band — short/visual/playful/hands-on for a
// child, longer/deeper for an adult. Same truth, age-right delivery." This is a
// SHARED-framework capability EVERY course reuses (the Infrastructure course +
// Darrell's son Christian, 10, are the first concrete instance). It LAYERS on top
// of the existing skill-level branching (`levels`/resolveLevel): an age band picks
// a sensible default depth AND a developmental DELIVERY profile (segment length,
// break cadence, how much content before a check, visual/hands-on weight, tone).
//
// The bands carry real developmental DEFAULTS — sustained attention roughly scales
// with age, so younger learners get shorter segments, more frequent novelty/breaks,
// quick wins, and more hands-on. These are STARTING defaults, deliberately tunable:
// the continuous-feedback reel tracks engagement BY AGE BAND (lib/learn-engagement)
// and these numbers are meant to be refined from real use — improving the timing
// for one age improves the shared library for every course at once.
//
// Nothing here fabricates content. An age band only ever changes (a) WHICH authored
// `levels` text is shown and (b) HOW the authored lesson is paced/chunked on screen.
// When a band's preferred depth wasn't authored for a module, it falls back cleanly
// to a simpler authored level and finally the base lesson — never an empty or
// invented one.
// ---------------------------------------------------------------------------
export const AGE_BANDS = [
  {
    id: 'child', label: 'Child', range: '6–10',
    depth: 'child', // preferred levels key; falls back child → teen → standard → base
    segmentMinutes: 5, breakEveryMin: 10, contentBeforeCheck: 1,
    visual: 'high', handsOn: 'high', tone: 'playful',
    hint: 'Short bursts, lots of pictures, touch the real thing, a quick win every few minutes.',
    pacing: 'One small idea at a time, then a quick win. Move and touch real things. Take a stretch break often.',
  },
  {
    id: 'youth', label: 'Youth', range: '11–14',
    depth: 'teen', segmentMinutes: 10, breakEveryMin: 20, contentBeforeCheck: 2,
    visual: 'high', handsOn: 'high', tone: 'encouraging',
    hint: 'Plain language, real examples, hands-on, a check after a couple of ideas.',
    pacing: 'A couple of ideas, then check understanding. Keep it concrete and hands-on.',
  },
  {
    id: 'teen', label: 'Teen', range: '15–17',
    depth: 'teen', segmentMinutes: 15, breakEveryMin: 30, contentBeforeCheck: 2,
    visual: 'normal', handsOn: 'high', tone: 'encouraging',
    hint: 'Plainer language and more encouragement; can hold a longer thread.',
    pacing: 'Teach a fuller idea, then check; tie it to something they can build.',
  },
  {
    id: 'adult', label: 'Adult', range: '18–64',
    depth: 'standard', segmentMinutes: 25, breakEveryMin: 0, contentBeforeCheck: 4,
    visual: 'normal', handsOn: 'normal', tone: 'plain',
    hint: 'A clear, balanced depth for most learners; the full lesson at once.',
    pacing: 'Read the full lesson, then check understanding. Self-paced.',
  },
  {
    id: 'senior', label: 'Senior / founding', range: '65+',
    depth: 'senior', segmentMinutes: 15, breakEveryMin: 0, contentBeforeCheck: 3,
    visual: 'normal', handsOn: 'normal', tone: 'respectful',
    hint: 'Honors deep experience; gets to the why and the edge cases, at a patient pace.',
    pacing: 'Unhurried; gets to the why and the edge cases; honors experience.',
  },
];
export const DEFAULT_AGE_BAND = 'adult';

export function normalizeAgeBand(id) {
  return AGE_BANDS.some((b) => b.id === id) ? id : DEFAULT_AGE_BAND;
}

export function ageBandProfile(id) {
  const want = normalizeAgeBand(id);
  return AGE_BANDS.find((b) => b.id === want);
}

// The depth (levels key) an age band reads by default, with its fallback chain.
// child → teen → standard ; youth/teen → teen → standard ; adult → standard ;
// senior → senior → standard. resolveForAge applies it against the module's
// authored `levels`, then the base lesson.
export function depthChainForAge(id) {
  const band = ageBandProfile(id);
  const chain = [band.depth];
  if (band.depth === 'child') chain.push('teen');
  if (!chain.includes('standard')) chain.push('standard');
  return chain;
}

// Resolve the lesson text for an age band. `levelOverride` (an explicit depth the
// learner picked) wins over the band default so the existing skill-level control
// still works as an advanced override. Returns { text, levelId, branched, band }.
export function resolveForAge(module, ageBandId = DEFAULT_AGE_BAND, levelOverride = null) {
  const band = ageBandProfile(ageBandId);
  const m = module || {};
  const levels = m.levels && typeof m.levels === 'object' ? m.levels : null;
  const chain = levelOverride ? [levelOverride, 'standard'] : depthChainForAge(ageBandId);
  if (levels) {
    for (const key of chain) {
      if (typeof levels[key] === 'string' && levels[key]) {
        return { text: levels[key], levelId: key, branched: true, band };
      }
    }
  }
  return { text: m.lesson || '', levelId: chain[0], branched: false, band };
}

// Split a lesson into developmentally-sized segments. Younger bands get shorter
// chunks (fewer words per on-screen step) so a child isn't handed a wall of text;
// every band now chunks long prose into readable sections. Splits on sentence
// boundaries and never drops content — every word of the authored lesson survives,
// only the chunking changes. Pure + deterministic (no Date/Math.random).
// Words per on-screen segment, by band. Smaller = more, shorter reading sections.
// Adult was once Infinity (the whole lesson as ONE block) — Darrell 2026-07-28:
// "these lessons need to be more broken down into sections for easy reading for
// the presenter." So the adult band now chunks into comfortable ~200-word
// sections too; every word still survives (chunked, never summarized), it just
// reads as sections instead of a wall.
const WORDS_PER_SEGMENT = { child: 45, youth: 90, teen: 140, adult: 200, senior: 120 };

export function chunkLessonForAge(text, ageBandId = DEFAULT_AGE_BAND) {
  const band = ageBandProfile(ageBandId);
  const clean = typeof text === 'string' ? text.trim() : '';
  if (!clean) return [];
  const target = WORDS_PER_SEGMENT[band.id] ?? Infinity;
  if (!Number.isFinite(target)) return [clean];
  // Sentence-ish split that keeps the terminator with its sentence.
  const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) || [clean];
  const segments = [];
  let buf = '';
  let words = 0;
  for (const s of sentences) {
    const w = s.trim().split(/\s+/).filter(Boolean).length;
    buf += s;
    words += w;
    if (words >= target) {
      segments.push(buf.trim());
      buf = '';
      words = 0;
    }
  }
  if (buf.trim()) segments.push(buf.trim());
  return segments.length ? segments : [clean];
}

// The full developmental TIMELINE for one module at one age band: the chunked
// lesson plus the pacing knobs the UI uses to chunk, break, and check. Everything
// here is derived from the band profile + the authored content — a real plan, not
// a painted one.
export function lessonPlanForAge(module, ageBandId = DEFAULT_AGE_BAND, levelOverride = null) {
  const band = ageBandProfile(ageBandId);
  const resolved = resolveForAge(module, ageBandId, levelOverride);
  const segments = chunkLessonForAge(resolved.text, ageBandId);
  // How many segments between a break/novelty nudge (0 = no nudges, e.g. adult).
  const breakAfter = band.breakEveryMin > 0 && band.segmentMinutes > 0
    ? Math.max(1, Math.round(band.breakEveryMin / band.segmentMinutes))
    : 0;
  return {
    band,
    levelId: resolved.levelId,
    branched: resolved.branched,
    segments,
    totalSegments: segments.length,
    segmentMinutes: band.segmentMinutes,
    breakAfterSegments: breakAfter,
    checkAfterSegments: Math.max(1, band.contentBeforeCheck),
    estimatedMinutes: segments.length * band.segmentMinutes,
  };
}
