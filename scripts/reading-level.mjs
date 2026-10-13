// =============================================================================
// reading-level — is a "child" level actually written for a child? MEASURED.
// =============================================================================
// Darrell, 2026-09-06: "Did our build make sure to have each version of the
// Lesson based on neuroplasticity and the brain's positions based on age and
// experience according to the biblical scriptures and the competencies most
// human beings have capacity for at those ages?"
//
// The structural half of that was already enforced — every lesson carries
// authored prose for all five bands, no band falls back, and a child level
// cannot carry adult content. What was NOT checked was the REGISTER: whether
// the child text actually reads like child text. That was authorial judgment,
// and judgment unmeasured is a claim (DR-0076 §4: measure, don't claim).
//
// The first measurement found the claim to be partly false: 29 of 128 lessons
// read HARDER at child level than at teen level, and the worst child level
// measured grade 11.8. This module is what stops that recurring.
//
// ── WHAT THIS MEASURES, AND WHAT IT DOES NOT ────────────────────────────────
// Flesch-Kincaid is a syllable-and-sentence-length formula. It does not know
// that "whosoever" and "notwithstanding" are KJV quotations we are REQUIRED to
// reproduce verbatim and forbidden to simplify. Scoring the raw text would
// therefore punish faithfulness to Scripture, which is the opposite of what
// this platform wants.
//
// So the gate scores OUR AUTHORED PROSE, with quoted Scripture removed — the
// register an author actually controls — and reports the full-text figure
// beside it as context.
//
// Neither number is comprehension. Both are proxies, and a proxy installed
// where the truth was available is its own defect (DR-0332). What this
// honestly catches is the GROSS case: a level labelled "child" written at
// college register. That case is real, it is currently present 29 times, and
// catching it is worth a proxy.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BASELINE_PATH = join(HERE, '..', 'app', 'src', 'lib', 'reading-level-baseline.json');

/**
 * A child level must not read above this grade. Set from the MEASURED
 * distribution (median 6.1), not from a preference: it is roughly the middle of
 * the existing corpus, so it is demonstrably achievable prose rather than an
 * aspiration nobody meets. Lessons above it today are recorded as debt.
 */
export const CHILD_CEILING = 7.0;

/**
 * A child level in a lesson written AFTER 2026-09-15 must not read above this
 * grade. Darrell, 2026-09-15 (DR-0417 D3, approved "Yes. Nice!"): the band is
 * ages 6–10, which is US grades 1–5, so 5.0 is the top of the band's own range
 * — an AGE number, where CHILD_CEILING is a corpus number. The 7.0 ratchet
 * still holds the existing corpus (82 of 153 read above 5.0 today, brought
 * down as each is re-authored); every lesson not in the baseline's
 * `knownLessons` is new and is held here.
 */
export const NEW_LESSON_CHILD_CEILING = 5.0;

/**
 * The intended ordering. Each band should read no harder than the next.
 *
 * YOUTH WAS MISSING UNTIL 2026-09-19 (DR-0544). This gate was written
 * 2026-09-06; the youth band was introduced with L81 and never added here. So
 * for two weeks the app displayed a youth level that NOTHING measured, while
 * the band-fill pass was authoring eighty more of them. The first measurement
 * after adding it found 30 of the 115 lessons carrying a youth band read
 * HARDER at youth than at teen — the younger band, the harder text, which is
 * precisely the defect this file exists to catch, hidden only because youth
 * was not in this array. Those 30 are recorded as shrink-only debt.
 */
export const BAND_ORDER = ['child', 'youth', 'teen', 'senior'];

/** Rough English syllable count. Deliberately simple and deterministic. */
export function syllables(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  return (trimmed.match(/[aeiouy]{1,2}/g) || []).length || 1;
}

/**
 * Strip double-quoted spans — in this corpus those are verbatim KJV, which we
 * may not simplify and must not be scored against the author.
 */
export function ourProseOnly(text) {
  return String(text || '').replace(/"[^"]*"/g, ' ');
}

/** Flesch-Kincaid grade level. Returns null for text with no words. */
export function fleschKincaidGrade(text) {
  const t = String(text || '');
  const words = t.match(/[A-Za-z’']+/g) || [];
  if (!words.length) return null;
  // Count sentence terminators; never divide by zero on a fragment.
  const sentences = (t.match(/[.!?]+/g) || []).length || 1;
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

const round1 = (n) => (n === null ? null : Math.round(n * 10) / 10);

/**
 * Measure one lesson. `authored` is the gated number (quotes removed);
 * `full` is what the reader actually faces, reported for context.
 */
export function measureLesson(module) {
  const levels = (module && module.levels) || {};
  const bands = {};
  for (const band of BAND_ORDER) {
    const text = levels[band];
    if (typeof text !== 'string' || !text) continue;
    bands[band] = {
      authored: round1(fleschKincaidGrade(ourProseOnly(text))),
      full: round1(fleschKincaidGrade(text)),
    };
  }
  if (typeof module.lesson === 'string' && module.lesson) {
    bands.adult = {
      authored: round1(fleschKincaidGrade(ourProseOnly(module.lesson))),
      full: round1(fleschKincaidGrade(module.lesson)),
    };
  }
  return { id: module.id, bands };
}

/**
 * Is the ordering inverted? child should read no harder than youth, youth no
 * harder than teen, and teen no harder than senior. A lesson missing a band is
 * not judged here — the
 * band-coverage gates own that, and two gates blaming each other for the same
 * defect is how a gap survives both.
 */
export function isInverted(measured) {
  const b = measured.bands;
  const present = BAND_ORDER.filter((k) => b[k] && b[k].authored !== null);
  if (present.length < 2) return false;
  for (let i = 0; i + 1 < present.length; i += 1) {
    if (b[present[i]].authored > b[present[i + 1]].authored) return true;
  }
  return false;
}

/** Does the child level read above the ceiling? */
export function breachesChildCeiling(measured, ceiling = CHILD_CEILING) {
  const c = measured.bands.child;
  return !!(c && c.authored !== null && c.authored > ceiling);
}

/** Measure a whole series and name every offender. */
export function scanSeries(modules, { ceiling = CHILD_CEILING, newCeiling = NEW_LESSON_CHILD_CEILING } = {}) {
  const measured = (modules || []).map(measureLesson);
  return {
    total: measured.length,
    measured,
    inverted: measured.filter(isInverted).map((m) => m.id),
    childOverCeiling: measured.filter((m) => breachesChildCeiling(m, ceiling)).map((m) => m.id),
    // Every lesson over the NEW-lesson ceiling; the ratchet decides which of
    // them are new (not in knownLessons) and therefore fail.
    childOverNewCeiling: measured.filter((m) => breachesChildCeiling(m, newCeiling)).map((m) => m.id),
  };
}

/** The recorded debt. This list may ONLY shrink. */
export function loadBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return { ceiling: CHILD_CEILING, newLessonCeiling: NEW_LESSON_CHILD_CEILING, inverted: [], childOverCeiling: [], knownLessons: [] };
  }
}

/**
 * Compare a fresh scan against the recorded debt.
 *
 * `fresh` — offenders NOT in the baseline. These FAIL the build: a new lesson
 *           may not be added at the wrong register, ever.
 * `healed` — baseline entries no longer offending. Informational; the baseline
 *           is expected to shrink and should be re-committed when it does.
 * `freshOverNewCeiling` — lessons NOT in `knownLessons` (written after
 *           2026-09-15) whose child level reads above NEW_LESSON_CHILD_CEILING.
 *           These FAIL the build. A known lesson is judged by the 7.0 ratchet
 *           only; the set of known lessons is fixed at the decision and never
 *           grows, so a lesson is either held to the age or recorded as debt,
 *           never quietly promoted from one to the other.
 */
export function ratchet(scan, baseline = loadBaseline()) {
  const wasInverted = new Set(baseline.inverted || []);
  const wasOver = new Set(baseline.childOverCeiling || []);
  const known = new Set(baseline.knownLessons || []);
  return {
    freshInverted: scan.inverted.filter((id) => !wasInverted.has(id)),
    freshOverCeiling: scan.childOverCeiling.filter((id) => !wasOver.has(id)),
    freshOverNewCeiling: (scan.childOverNewCeiling || []).filter((id) => !known.has(id)),
    healedInverted: (baseline.inverted || []).filter((id) => !scan.inverted.includes(id)),
    healedOverCeiling: (baseline.childOverCeiling || []).filter((id) => !scan.childOverCeiling.includes(id)),
  };
}

/** Build the artifact that gets committed. */
export function buildBaseline(scan, { ceiling = CHILD_CEILING, newLessonCeiling = NEW_LESSON_CHILD_CEILING, knownLessons = null } = {}) {
  // knownLessons is FIXED at the 2026-09-15 corpus: carried forward from the
  // committed baseline, never rebuilt from the scan, so a lesson written later
  // can never be promoted into the 7.0 debt class.
  const known = Array.isArray(knownLessons) ? knownLessons : (loadBaseline().knownLessons || []);
  return {
    ceiling,
    newLessonCeiling,
    note: 'Shrink-only debt. A NEW offender fails the build; entries may be removed as lessons are rewritten, never added. Lessons not in knownLessons are held to newLessonCeiling (DR-0417 D3). The inverted list grew ONCE, on 2026-09-19, when the youth band was added to BAND_ORDER and 30 pre-existing youth inversions became visible (DR-0544) — that was the gate widening, not the corpus worsening; it is shrink-only from there. See docs/00-foundations/07-neuroplasticity-and-the-word.md §4.',
    measuredLessons: scan.total,
    inverted: [...scan.inverted].sort(),
    childOverCeiling: [...scan.childOverCeiling].sort(),
    knownLessons: [...known].sort(),
  };
}
