// =============================================================================
// scripture-teaching — the adaptive engine the Scripture material is taught
// through (Darrell 2026-06-24). Pure + tested; the content lives in scriptures.js.
// =============================================================================
// Darrell's binding additions turned the Scripture resource into a teaching
// SYSTEM. This engine implements the parts that are logic (so they are tested
// directly), leaving the words to scriptures.js:
//
//   1. DEPTH TIERS — the same theme authored at three reading depths (essential →
//      standard → deep/book-capable). A reader (or the app) picks how deep to go;
//      fitDepthToBudget() reflows to a reading budget the way the time-adaptive
//      presenter fits a time budget — proportional, core meaning preserved at
//      every tier, never broken.
//   2. EXPERIENCE / COGNITIVE LEVELS — the SAME truth framed for a child, a new
//      believer, the standard reader, and a scholar; Universal Design for Learning
//      (multiple means of representation) + the dyslexia/large-print + read-aloud
//      primitives the app already ships. Understanding for ALL.
//   3. PERSONALIZATION — surface the themes a consumer needs now from THEIR
//      interests + THEIR viewing history, CONSENTED and owner-scoped. Served, not
//      surveilled (DATA-AS-EMPOWERMENT-NOT-EXTRACTION): no consent → no ranking.
//   4. RETENTION TESTING — comprehension + recall + spaced repetition (Leitner) +
//      mastery, so a learner HOLDS the Word. Encouraging, never punitive; retries
//      are expected. What is tested is Yahweh's Word — answers are verified in the
//      content file, never from memory.
//
// THE GOVERNING LENS (binding posture for every tier + level) is declared here so
// it is loaded before any theme is taught.
// =============================================================================

// -----------------------------------------------------------------------------
// THE GOVERNING LENS — how every theme is taught, at every depth and every level.
// This is the through-line Darrell set: not doctrine recited, but Yahweh's heart
// explained. Encoded as data so the surface can show it and a test can assert it
// is present on the material.
// -----------------------------------------------------------------------------
export const GOVERNING_LENS = {
  // The heart of it: explain Yahweh's perspective and His love.
  perspective: 'Every theme answers how Yahweh SEES it — His viewpoint, higher than ours (Isaiah 55:8-9), revealed in the Son (John 1:14; 14:9).',
  love: 'Yahweh is love (1 John 4:7-8,16,19; John 3:16; Romans 5:8); the method is love (John 13:34-35) — relational and grace-centered, explaining His heart toward people, not condemnation.',
  // Grace AND truth, together — never one at the other's expense.
  graceAndTruth: 'Full of grace AND truth (John 1:14): His love is presented genuinely AND the hard truths faithfully — hell, sin, repentance, the narrow way — spoken as Jesus spoke them, in love, as warning that flows FROM love, with the hope of salvation always held out.',
  // The governing tone for how every hard truth lands.
  noCondemnation: 'Truth without condemnation: God sent the Son NOT to condemn but to save (John 3:17); "neither do I condemn thee; go and sin no more" (John 8:10-11); no condemnation in Christ (Romans 8:1). Conviction is the Spirit\'s work that leads to life; condemnation crushes. Truth yes, condemnation no — especially for the wounded and the children.',
  // His purposes, and ordering life around His will and way.
  purposes: 'He works with intent and design (Jeremiah 29:11; Romans 8:28; Ephesians 1:9-11; Proverbs 19:21; Isaiah 46:9-10) — learners are helped to see the why behind His ways.',
  willAndWay: 'Form learners to put His will and way first: seek first the Kingdom (Matthew 6:33), lean not on your own understanding (Proverbs 3:5-6), "not my will but Thine" (Luke 22:42), do the will of the Father (Matthew 7:21), commit your way (Psalm 37:5; Proverbs 16:3,9).',
  // The telos that orders everything.
  soulsTelos: 'The ultimate aim is SOULS reaching their eternal home with the Father (Luke 2:49; 19:10; John 3:16-17; 2 Peter 3:9; Ezekiel 33:11; James 5:19-20; Proverbs 11:30). Truth warns, love draws — both for the soul\'s sake; staging is flexible (1 Corinthians 9:19-22), substance never compromised.',
};

// -----------------------------------------------------------------------------
// DEPTH TIERS — book-capable down to light. Ordered light → deep.
// -----------------------------------------------------------------------------
export const DEPTH_TIERS = [
  { id: 'essential', label: 'Essential', hint: 'The core in a few sentences — read it in a moment.', order: 0 },
  { id: 'standard', label: 'Standard', hint: 'A fuller treatment — a paragraph or two.', order: 1 },
  { id: 'deep', label: 'Deep', hint: 'The full, book-capable treatment — read as far as you want.', order: 2 },
];
export const DEFAULT_TIER = 'standard';

export function normalizeTier(id) {
  return DEPTH_TIERS.some((t) => t.id === id) ? id : DEFAULT_TIER;
}

function countWords(s) {
  const t = typeof s === 'string' ? s.trim() : '';
  return t ? t.split(/\s+/).length : 0;
}

// Resolve a theme's text at a tier, with a fallback chain that NEVER returns
// empty: requested → next-lighter → … → essential (the proportional floor that
// preserves core meaning). Returns { tierId, text, words, requested, branched }.
export function resolveDepth(theme, tierId = DEFAULT_TIER) {
  const depths = theme && theme.depths && typeof theme.depths === 'object' ? theme.depths : {};
  const want = normalizeTier(tierId);
  const order = ['deep', 'standard', 'essential'];
  // Build the fallback: from the requested tier downward to essential.
  const start = order.indexOf(want);
  const chain = start >= 0 ? order.slice(start) : ['standard', 'essential'];
  for (const k of chain) {
    if (typeof depths[k] === 'string' && depths[k].trim()) {
      return { tierId: k, text: depths[k], words: countWords(depths[k]), requested: want, branched: k !== want };
    }
  }
  // Last resort: the theme blurb, so a reader always sees the core meaning.
  const fallback = theme && theme.blurb ? theme.blurb : '';
  return { tierId: 'essential', text: fallback, words: countWords(fallback), requested: want, branched: true };
}

// Fit-to-budget reflow (the reading analogue of the presenter's time fit): pick
// the RICHEST tier whose length fits within `budgetWords`; if even essential is
// longer than the budget, still return essential (core meaning is never dropped —
// proportional, never broken). Returns the resolveDepth shape + { fit }.
export function fitDepthToBudget(theme, budgetWords = 120) {
  const budget = Number.isFinite(budgetWords) && budgetWords > 0 ? budgetWords : 120;
  for (const tier of ['deep', 'standard', 'essential']) {
    const r = resolveDepth(theme, tier);
    if (r.tierId === tier && r.words <= budget) return { ...r, fit: true };
  }
  const essential = resolveDepth(theme, 'essential');
  return { ...essential, fit: essential.words <= budget };
}

// -----------------------------------------------------------------------------
// EXPERIENCE / COGNITIVE LEVELS — the SAME truth, every level (UDL).
// -----------------------------------------------------------------------------
export const EXPERIENCE_LEVELS = [
  { id: 'child', label: 'Child', hint: 'Simple, warm, concrete, hope-centered. Honest, never frightening.' },
  { id: 'new-believer', label: 'New believer', hint: 'Plain language, first principles, lots of encouragement.' },
  { id: 'standard', label: 'Standard', hint: 'A clear, balanced depth for most readers.' },
  { id: 'scholar', label: 'Scholar', hint: 'Original-language notes, textual honesty, the harder questions.' },
];
export const DEFAULT_LEVEL = 'standard';

export function normalizeLevel(id) {
  return EXPERIENCE_LEVELS.some((l) => l.id === id) ? id : DEFAULT_LEVEL;
}

// Resolve the framing for an experience level. An AUTHORED level variant is
// always senior. Where none is authored, the level DERIVES from the theme's
// own depth tiers — the SAME truth at the depth that fits the level (child /
// new believer ← essential, standard ← standard, scholar ← deep) — instead of
// silently handing every level the standard adult text (the 2026-07-08 gap:
// the level switch rendered but 12 of 20 themes had nothing to branch to).
// Depth selection over the theme's own authored words, never an invented
// rephrase (DR-0076/DR-0127). Returns { levelId, text, branched, adaptedFrom }.
const LEVEL_DEPTH_FALLBACK = { child: 'essential', 'new-believer': 'essential', standard: 'standard', scholar: 'deep' };
export function resolveLevel(theme, levelId = DEFAULT_LEVEL) {
  const levels = theme && theme.levels && typeof theme.levels === 'object' ? theme.levels : {};
  const want = normalizeLevel(levelId);
  if (typeof levels[want] === 'string' && levels[want].trim()) return { levelId: want, text: levels[want], branched: false };
  const d = resolveDepth(theme, LEVEL_DEPTH_FALLBACK[want] || 'standard');
  return { levelId: want, text: d.text, branched: true, adaptedFrom: d.tierId };
}

// Universal Design for Learning + accessibility posture (the app already ships
// the primitives this composes: large-print text-size, read-aloud TTS).
export const ACCESSIBILITY = {
  udl: 'Multiple means of representation (read / hear / size-adjust), engagement (encouraging mastery tone, retries), and action (browse, search, test). The same truth reaches every ability.',
  dyslexia: 'Large-print scaling, generous spacing, plain-language tiers, and read-aloud lower the reading load; the essential tier and the child level carry the full core meaning for a struggling reader.',
  reuses: ['lib/text-size.js (large-print)', 'lib/tts.js (read-aloud)'],
};

// -----------------------------------------------------------------------------
// PERSONALIZATION — consented, owner-scoped. Served, not surveilled.
// -----------------------------------------------------------------------------
export const PRIVACY = {
  consent: 'Interest + viewing personalization is OPT-IN. With no consent, nothing is ranked or stored — the library shows its authored order.',
  scope: 'A profile is the consumer\'s OWN data on the consumer\'s OWN device/instance — never sold, never surveilled, never used to train (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).',
  youtube: 'Viewing history is read ONLY as an interest signal the consumer chose to share; it maps to topic weights and nothing else leaves their control.',
};

// Score a profile's interest in a theme. A profile is
// { consented:boolean, interests:[topicId], youtube:[{topic, weight}] }.
// Themes carry `interests: [topicId]`. Pure; no profile or no consent → score 0.
export function interestScore(theme, profile) {
  if (!profile || !profile.consented) return 0;
  const topics = new Set(Array.isArray(theme && theme.interests) ? theme.interests : []);
  if (!topics.size) return 0;
  let score = 0;
  for (const i of (profile.interests || [])) if (topics.has(i)) score += 2; // explicit interest weighs more
  for (const v of (profile.youtube || [])) {
    if (v && topics.has(v.topic)) score += Math.max(0, Number(v.weight) || 1); // viewing signal
  }
  return score;
}

// Rank themes for a consumer. Consented + signal → highest-interest first (stable
// for ties, so the authored order breaks ties). No consent / no signal → the
// authored order is returned UNCHANGED (no surveillance, no dark-pattern reorder).
export function rankByInterest(themes, profile) {
  const list = Array.isArray(themes) ? themes.slice() : [];
  if (!profile || !profile.consented) return list;
  const scored = list.map((t, i) => ({ t, i, s: interestScore(t, profile) }));
  const anySignal = scored.some((x) => x.s > 0);
  if (!anySignal) return list;
  scored.sort((a, b) => (b.s - a.s) || (a.i - b.i));
  return scored.map((x) => x.t);
}

// -----------------------------------------------------------------------------
// RETENTION TESTING — comprehension, recall, spaced repetition, mastery.
// Encouraging, never punitive; retries expected. Answers are verified content.
// -----------------------------------------------------------------------------
export const MASTERY_RATIO = 0.8; // hold the Word: a higher bar than a pass.
export const PASS_RATIO = 0.7;

// Grade a test. `test` = { questions:[{ q, options, answer, explain, ref? }] };
// `answers` = { [i]: selectedIndex }. Pure + deterministic.
export function gradeTest(test, answers = {}) {
  const questions = Array.isArray(test && test.questions) ? test.questions : [];
  const total = questions.length;
  if (!total) return { total: 0, correct: 0, pct: 0, passed: false, mastered: false, perQuestion: [] };
  let correct = 0;
  const perQuestion = questions.map((q, i) => {
    const sel = answers[i];
    const has = sel !== undefined && sel !== null;
    const ok = has && Number(sel) === Number(q.answer);
    if (ok) correct += 1;
    return { index: i, selected: has ? Number(sel) : null, correct: ok, answer: Number(q.answer), ref: q.ref || null };
  });
  const pct = Math.round((correct / total) * 100);
  return {
    total, correct, pct,
    passed: correct / total >= PASS_RATIO,
    mastered: correct / total >= MASTERY_RATIO,
    perQuestion,
  };
}

// Encouraging, mastery-oriented feedback — never punitive. Retries are framed as
// the normal path to holding the Word.
export function encouragement(grade) {
  const g = grade || {};
  if (g.mastered) return 'You\'ve got it — the Word is taking root in you. Well done.';
  if (g.passed) return 'Strong work. Review the few you missed and you\'ll have it fully.';
  if ((g.correct || 0) > 0) return 'Good start — you got some. Look at the explanations and try again; this is how it sticks.';
  return 'No worries at all — read it once more and give it another try. Every try plants it deeper.';
}

// Leitner spaced repetition: a card moves UP a box when recalled, back to box 1
// when missed; higher boxes are reviewed less often (the Word held long-term).
export const LEITNER_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35]; // box 0..5

export function nextBox(box, correct) {
  const b = Number.isInteger(box) ? box : 0;
  if (correct) return Math.min(b + 1, LEITNER_INTERVAL_DAYS.length - 1);
  return 0; // missed → back to daily review (gentle, not punitive — just more reps)
}

export function reviewIntervalDays(box) {
  const b = Number.isInteger(box) ? box : 0;
  return LEITNER_INTERVAL_DAYS[Math.max(0, Math.min(b, LEITNER_INTERVAL_DAYS.length - 1))];
}

// Is a card due? `card` = { box, lastReviewedMs }. `nowMs` passed in (pure — no
// Date.now() here, per the no-clock rule for testable logic).
export function dueForReview(card, nowMs) {
  if (!card) return true;
  const last = Number(card.lastReviewedMs);
  if (!Number.isFinite(last)) return true;
  const due = last + reviewIntervalDays(card.box) * 86400000;
  return nowMs >= due;
}

// Update a review card after an attempt. Returns the next card state.
export function reviewCardAfter(card, correct, nowMs) {
  const box = nextBox(card ? card.box : 0, correct);
  return { box, lastReviewedMs: nowMs, lastCorrect: !!correct };
}
