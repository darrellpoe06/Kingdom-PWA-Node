// =============================================================================
// test-integrity — credit where it is due (DR-1386)
// =============================================================================
// Darrell, 2026-11-10: "Not seeing any part... taking the test... and some
// kpi's that fit noticing when a human roll a test!!!... We want to give credit
// where it is due... not anything..." and, of DR-1384's "a passed exam, Done, or
// every part seen counts as read": "is there a better way?"
//
// THE BETTER WAY: three credits, each for what it is, never one standing in
// for another.
//   READ        evidence the words were met: the parts seen or heard (the two
//               witnesses lib/learn-resume.js already keeps), or a finish by
//               the reader, the deck or the end door. Never a test, never Done.
//   UNDERSTOOD  a passed exam, carried WITH how it was taken: after reading,
//               partly read, or before reading; and whether it was rushed.
//   DONE        the learner's own mark. Kept and shown, a self-report.
//
// "Rolled" tests are noticed by measures the record can actually hold: an
// exam taken before the reading was on record, answered faster than a person
// can read the questions, or retaken within a minute (guessing until it passes).
// Everything here is PURE so the gates pin it, and nothing is painted.
// =============================================================================

/**
 * The pace words are credited as SEEN, with grace (Darrell 2026-11-10:
 * "Listening or reading at a pace based on words and processing the
 * information... grace and mercy given... also data driven"). Measured adult
 * silent reading averages about 238 words a minute for non-fiction (Brysbaert,
 * 2019, a meta-analysis of 190 studies); 600 is two and a half times that,
 * room for a fast reader and a rereader. It is a ceiling on credit, never a
 * floor: a slow reader is never held back. Hearing is paced by the reader's
 * own voice and needs no ceiling.
 */
export const GRACE_WPM = 600;

/** A reading counts when this much of the lesson was seen or heard. */
export const READ_FLOOR = 0.9;
/** Below this, the lesson was not read before the test. */
export const PARTLY_FLOOR = 0.25;
/** Fewer seconds than this per question is not a reading of the questions. */
export const RUSH_SECONDS_PER_QUESTION = 5;
/** A retake this soon after the last attempt is guessing, not studying. */
export const QUICK_RETAKE_SECONDS = 60;

const frac = (n) => (Number.isFinite(Number(n)) ? Math.max(0, Math.min(1, Number(n))) : 0);

/**
 * The seen fraction credited for one reading: what was on screen, no more than
 * the words a reader could have read since this reading began at GRACE_WPM, on
 * top of what was already credited (`from`). Pure: the caller passes the time.
 */
export function pacedSeen({ raw = 0, from = 0, words = 0, ms = 0, wpm = GRACE_WPM } = {}) {
  const r = frac(raw);
  const n = Number(words) || 0;
  if (n <= 0) return r;
  const readable = (Math.max(0, Number(ms) || 0) / 60000) * wpm;
  return Math.min(r, Math.max(frac(from), Math.min(1, frac(from) + readable / n)));
}

/** How much of the lesson the device's witnesses say was met, 0..1. */
export function readingReached(place) {
  if (!place || typeof place !== 'object') return 0;
  return Math.max(frac(place.seen), frac(place.heard));
}

/** Is there evidence enough to credit a READ? */
export function hasReadEvidence(place) {
  return readingReached(place) >= READ_FLOOR;
}

/**
 * How one attempt was taken. `reached` is the reading reached at the moment
 * of the attempt (0..1); `ms` the time from the first answer to the check;
 * `questions` how many the exam asked.
 */
export function attemptIntegrity({ reached = 0, ms = null, questions = 0 } = {}) {
  const r = frac(reached);
  const reading = r >= READ_FLOOR ? 'after' : r >= PARTLY_FLOOR ? 'partly' : 'before';
  const secs = Number.isFinite(ms) && ms >= 0 && questions > 0 ? ms / 1000 / questions : null;
  const rushed = secs !== null && secs < RUSH_SECONDS_PER_QUESTION;
  return { reading, readPct: Math.round(r * 100), secsPerQuestion: secs === null ? null : Math.round(secs * 10) / 10, rushed };
}

/**
 * The sentence the learner reads under the score. EVALUATION, NEVER
 * CONDEMNATION (Darrell 2026-11-10: "No Condemnation.. evaluation... for an
 * experience to see ourselves in the Way He does"; "Only Yahweh can condemn
 * you... His Word is our mirror"). It says what happened and what is kept,
 * plainly, and never scolds; the score is always kept.
 */
export function attemptIntegrityLine(i) {
  if (!i) return '';
  const pace = i.rushed
    ? ` Answered quickly, about ${i.secsPerQuestion} seconds a question. There is no limit on tries; take it again at your own pace whenever you like.`
    : '';
  if (i.reading === 'after') return `Taken after reading (${i.readPct}% of the lesson seen or heard).${pace}`;
  if (i.reading === 'partly')
    return `Taken with ${i.readPct}% of the lesson read. Your score is kept, and the lesson is marked read once its parts are seen or heard.${pace}`;
  return `Taken before reading the lesson (${i.readPct}% seen or heard). Your score is kept, and the lesson is marked read once its parts are seen or heard.${pace}`;
}

/**
 * The integrity measures across a learner's records (learner-records.js
 * rowToRecord shape: completedAt, quizHistory [{at, pct, passed}]). Each
 * attempt is placed against the reading ON RECORD for that lesson: taken at or
 * after it, or before it (or with none). Quick retakes are attempts on the same
 * lesson within QUICK_RETAKE_SECONDS of the one before. Tries to first pass is
 * the mean number of attempts up to and including the first pass. TAKING and
 * GRADING are kept apart ("test taking and grading are separate and both
 * should mean more"): taken / rushed say how the exam was sat, passed says
 * what it scored. UNDERSTOOD, the main goal ("reading and comprehension as the
 * main goal"), counts the lessons read AND passed at or after the reading.
 * Rushed is known only for attempts this device measured (DR-1386).
 */
export function testIntegrityKpis(records = []) {
  let taken = 0;
  let afterReading = 0;
  let beforeReading = 0;
  let passedBeforeReading = 0;
  let quickRetakes = 0;
  let rushed = 0;
  let passed = 0;
  let understood = 0;
  const triesToPass = [];
  for (const r of Array.isArray(records) ? records : []) {
    if (!r || !Array.isArray(r.quizHistory) || !r.quizHistory.length) continue;
    // The reading on evidence when the record has it (0316), else the lesson's mark.
    const readAt = r.readEvidenceAt ? Date.parse(r.readEvidenceAt) : r.completedAt ? Date.parse(r.completedAt) : NaN;
    const tries = r.quizHistory
      .map((e) => {
        const how = e.taken || e.integrity || null;
        return { t: Date.parse(e.at), passed: !!e.passed, rushed: !!(how && how.rushed), reading: how && how.reading ? how.reading : null };
      })
      .filter((e) => Number.isFinite(e.t))
      .sort((a, b) => a.t - b.t);
    let firstPass = null;
    let understoodHere = false;
    tries.forEach((e, i) => {
      taken += 1;
      if (e.rushed) rushed += 1;
      if (e.passed) passed += 1;
      // The attempt's own account of the reading wins; else the moments are compared.
      const after = e.reading ? e.reading === 'after' : Number.isFinite(readAt) && readAt <= e.t;
      if (after && e.passed) understoodHere = true;
      if (after) afterReading += 1;
      else {
        beforeReading += 1;
        if (e.passed) passedBeforeReading += 1;
      }
      if (i > 0 && e.t - tries[i - 1].t < QUICK_RETAKE_SECONDS * 1000) quickRetakes += 1;
      if (firstPass === null && e.passed) firstPass = i + 1;
    });
    if (firstPass !== null) triesToPass.push(firstPass);
    if (understoodHere) understood += 1;
  }
  const mean = triesToPass.length ? Math.round((triesToPass.reduce((a, b) => a + b, 0) / triesToPass.length) * 10) / 10 : null;
  return { taken, passed, rushed, afterReading, beforeReading, passedBeforeReading, quickRetakes, triesToFirstPass: mean, understood };
}
