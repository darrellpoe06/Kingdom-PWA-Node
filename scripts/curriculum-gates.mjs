// =============================================================================
// curriculum-gates — the repo's own lesson gates, run on the NAS copy (DR-0677)
// =============================================================================
// The lessons stay in the app's code (Darrell 2026-09-29: "The apps code is
// needed to keep context!!!!!!!%"); the NAS database holds a synchronized copy.
// The gates move WITH the content: whatever the database is asked to hold, and
// whatever it holds, is judged by the very functions CI runs on the course files
// today. Nothing here is a second implementation of a gate; every check below
// IMPORTS the gate module the repo's pinned tests import:
//
//   verse       scripts/quoted-verse-is-the-verse.mjs  (scanQuotedVerses, quotedTexts)
//   quotation   scripts/quotation-integrity.mjs         (scan + ratchet, both baselines)
//   full levels scripts/full-levels.mjs                 (scan + ratchet)
//   reading     scripts/reading-level.mjs               (scanSeries + ratchet)
//   bands       scripts/band-differentiation.mjs        (scan + ratchet)
//   coverage    scripts/course-band-coverage.mjs        (scan + ratchet, and the
//               per-lesson all-four rule against its pinned list, DR-0691)
//   structure   ids present, unique across the whole school, Living Lessons ids
//               shaped ll<n>-slug with no number claimed twice
//               (the living-lessons-id-collision.test.js contract).
//
// THE SCOPE OF EACH GATE IS TODAY'S SCOPE, NOT A NEW ONE. The Living-Lessons
// ratchets judge the Living Lessons, the catalog ratchets judge the catalog,
// exactly as their tests do. The one widening: the verse gate. Today it pins
// Living Lessons and Little Learners at ZERO faults; every other course was
// never measured with it. Measured 2026-09-29 (DR-0677): 516 faults across 30
// other courses. Those are recorded in curriculum-verse-baseline.json as
// shrink-only debt, so from today no course can gain a new one — a stricter
// house than yesterday, never a looser one.
//
// Two callers:
//   gateCorpus(courses)                 the CI job on a DB snapshot, and the
//                                       NAS parity pass after every sync;
//   gateLessonForPublish(courses, k, l) the check a publish write must pass
//                                       (the NAS builder, PR #1837 / DR-0669,
//                                       and the sync) BEFORE the row is written.
// =============================================================================
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanQuotedVerses, describeFault } from './quoted-verse-is-the-verse.mjs';
import { quotedTexts, scanQuotationIntegrity, ratchetQuotationIntegrity } from './quotation-integrity.mjs';
import { scanFullness, ratchetFullness } from './full-levels.mjs';
import { scanSeries, ratchet as ratchetReading } from './reading-level.mjs';
import { scanDifferentiation, ratchetDifferentiation } from './band-differentiation.mjs';
import { scanCourseBands, ratchetCourseBands, lessonsOfCourse, ratchetFourBands, loadFourBandAllowlist } from './course-band-coverage.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '..', 'app', 'src', 'lib');
const readJson = (name) => JSON.parse(readFileSync(join(LIB, name), 'utf8'));

export const VERSE_BASELINE_PATH = join(LIB, 'curriculum-verse-baseline.json');

/** The courses whose verse gate is ZERO faults today (quoted-verse-is-the-verse.test.js). */
export const VERSE_ZERO_COURSES = Object.freeze(['living-lessons', 'little-learners']);

/** Courses the Eternal-Algorithms family builds at render time (not LEARN_CATALOG). */
export const isEternal = (courseKey) => /^eternal-/.test(courseKey);

const LL_ID = /^ll(\d+)-[a-z0-9-]+$/;

/** A fault's signature: stable across runs, specific enough to tell two apart. */
export function verseSignature(f) {
  return [f.kind, f.where, f.ref || '', (f.names || []).join('+')].join(' | ');
}

/** Per-lesson verse faults for every course: { lessonId: [signature, ...] }. */
export function scanCorpusVerses(courses) {
  const byLesson = {};
  const lines = [];
  let spans = 0; let verbatim = 0;
  for (const [key, lessons] of Object.entries(courses)) {
    const scan = scanQuotedVerses(lessons, quotedTexts);
    spans += scan.spans; verbatim += scan.verbatim;
    for (const f of scan.faults) {
      (byLesson[f.id] = byLesson[f.id] || []).push(verseSignature(f));
      lines.push({ course: key, id: f.id, sig: verseSignature(f), text: describeFault(f) });
    }
  }
  for (const id of Object.keys(byLesson)) byLesson[id].sort();
  return { spans, verbatim, byLesson, lines };
}

export function loadVerseBaseline(path = VERSE_BASELINE_PATH) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return { faults: {} }; }
}

/** A fault not recorded for that lesson is FRESH. Zero-courses may record nothing. */
export function ratchetVerses(scan, courses, baseline = loadVerseBaseline()) {
  const known = baseline.faults || {};
  const courseOf = {};
  for (const [key, lessons] of Object.entries(courses)) for (const l of lessons) courseOf[l.id] = key;
  const fresh = [];
  for (const line of scan.lines) {
    const zero = VERSE_ZERO_COURSES.includes(line.course);
    if (zero || !(known[line.id] || []).includes(line.sig)) fresh.push(line.text);
  }
  const healed = [];
  for (const [id, sigs] of Object.entries(known)) {
    for (const s of sigs) if (!(scan.byLesson[id] || []).includes(s)) healed.push(`${id} :: ${s}`);
  }
  const zeroRecorded = Object.keys(known).filter((id) => VERSE_ZERO_COURSES.includes(courseOf[id]));
  return { fresh, healed, zeroRecorded };
}

/** Structure: every lesson has an id and a title; ids are unique school-wide. */
export function checkStructure(courses) {
  const problems = [];
  const seen = new Map();
  for (const [key, lessons] of Object.entries(courses)) {
    if (!Array.isArray(lessons)) { problems.push(`${key}: lessons is not a list`); continue; }
    for (const l of lessons) {
      if (!l || typeof l.id !== 'string' || !l.id) { problems.push(`${key}: a lesson has no id`); continue; }
      if (typeof l.title !== 'string' || !l.title.trim()) problems.push(`${key}/${l.id}: no title`);
      if (seen.has(l.id)) problems.push(`${l.id}: claimed by ${seen.get(l.id)} AND ${key}`);
      else seen.set(l.id, key);
    }
  }
  const ll = courses['living-lessons'] || [];
  const nums = new Map();
  for (const l of ll) {
    const hit = LL_ID.exec(l.id || '');
    if (!hit) { problems.push(`living-lessons/${l.id}: id is not ll<number>-<slug>`); continue; }
    const n = Number(hit[1]);
    if (nums.has(n)) problems.push(`L${n}: ${nums.get(n)} AND ${l.id} (two lessons, one number)`);
    else nums.set(n, l.id);
  }
  return problems;
}

/**
 * Every gate, on a whole curriculum { courseKey: [lesson, ...] }. `passed` is
 * true only when nothing is FRESH anywhere; healed debt is reported, not failed
 * (the repo's tests fail on healed so the baselines shrink — that is their job,
 * and it stays theirs).
 */
export function gateCorpus(courses, { baselines = null } = {}) {
  const b = baselines || {
    quotation: readJson('quotation-integrity-baseline.json'),
    courseQuotation: readJson('course-quotation-integrity-baseline.json'),
    fullLevels: readJson('full-levels-baseline.json'),
    reading: readJson('reading-level-baseline.json'),
    bandDiff: readJson('band-differentiation-baseline.json'),
    courseBands: readJson('course-band-coverage-baseline.json'),
    verse: loadVerseBaseline(),
  };
  const ll = courses['living-lessons'] || [];
  const catalogKeys = Object.keys(courses).filter((k) => !isEternal(k));
  const pseudoCatalog = catalogKeys.map((key) => ({ key, buildScheduleRows: () => courses[key] }));
  const catalogModules = pseudoCatalog.flatMap(lessonsOfCourse);

  const structure = checkStructure(courses);
  const verseScan = scanCorpusVerses(courses);
  const verse = ratchetVerses(verseScan, courses, b.verse);
  const quotation = ratchetQuotationIntegrity(scanQuotationIntegrity(ll), b.quotation);
  const courseQuotation = ratchetQuotationIntegrity(scanQuotationIntegrity(catalogModules), b.courseQuotation);
  const fullLevels = ratchetFullness(scanFullness(ll), b.fullLevels);
  const reading = ratchetReading(scanSeries(ll), b.reading);
  const bandDiff = ratchetDifferentiation(scanDifferentiation(ll), b.bandDiff);
  const llIds = new Set(ll.map((m) => m.id));
  const courseBandScan = scanCourseBands(pseudoCatalog, llIds);
  const courseBands = ratchetCourseBands(courseBandScan, b.courseBands);
  const byKey = {};
  for (const key of catalogKeys) for (const m of lessonsOfCourse(pseudoCatalog.find((c) => c.key === key))) byKey[`${key}/${m.id}`] = m;
  const fourBands = ratchetFourBands(courseBandScan, b.fourBands || loadFourBandAllowlist(), byKey);

  const fresh = [
    ...structure.map((x) => `structure :: ${x}`),
    ...verse.fresh.map((x) => `verse :: ${x}`),
    ...verse.zeroRecorded.map((id) => `verse :: ${id} is in a zero-fault course and may not be recorded as debt`),
    ...quotation.fresh.map((x) => `quotation :: ${x}`),
    ...courseQuotation.fresh.map((x) => `course-quotation :: ${x}`),
    ...fullLevels.fresh.map((x) => `full-levels :: ${x}`),
    ...reading.freshInverted.map((x) => `reading-level :: ${x} :: inverted`),
    ...reading.freshOverCeiling.map((x) => `reading-level :: ${x} :: child band over ceiling`),
    ...reading.freshOverNewCeiling.map((x) => `reading-level :: ${x} :: child band over the new-lesson ceiling`),
    ...bandDiff.fresh.map((x) => `band-differentiation :: ${x}`),
    ...courseBands.worse.map((x) => `course-bands :: ${x}`),
    ...fourBands.fresh.map((x) => `four-bands :: ${x}`),
  ];
  return {
    passed: fresh.length === 0,
    fresh,
    evidence: {
      courses: Object.keys(courses).length,
      lessons: Object.values(courses).reduce((t, l) => t + l.length, 0),
      spans: verseScan.spans,
      verbatim: verseScan.verbatim,
      recordedVerseDebt: Object.values(b.verse.faults || {}).reduce((t, s) => t + s.length, 0),
    },
  };
}

/**
 * The check a publish write must pass: the curriculum AS IT WOULD BE with this
 * lesson in it (replacing its own id, or appended to its course) is gated whole,
 * so a lesson is judged by exactly the rules its neighbours were.
 */
export function gateLessonForPublish(courses, courseKey, lesson, opts = {}) {
  const next = { ...courses };
  const list = [...(next[courseKey] || [])];
  const i = list.findIndex((l) => l.id === lesson.id);
  if (i >= 0) list[i] = lesson; else list.push(lesson);
  next[courseKey] = list;
  const verdict = gateCorpus(next, opts);
  return { ...verdict, lessonId: lesson.id, courseKey };
}

/** Build the verse baseline from a scan (used once, and when debt is repaid). */
export function buildVerseBaseline(scan, courses) {
  const faults = {};
  for (const [key, lessons] of Object.entries(courses)) {
    if (VERSE_ZERO_COURSES.includes(key)) continue;
    for (const l of lessons) if (scan.byLesson[l.id]) faults[l.id] = scan.byLesson[l.id];
  }
  return {
    note: 'Shrink-only verse debt outside the zero-fault courses (DR-0677). Measured 2026-09-29 by scripts/quoted-verse-is-the-verse.mjs over every quoted surface (quotedTexts) of every course: these faults existed before the NAS copy did. A fault not listed here fails the publish gate and the CI snapshot job; entries may only be removed as lessons are repaired. living-lessons and little-learners may record nothing: they are held at zero, as their own test holds them.',
    measured: '2026-09-29',
    faults,
  };
}
