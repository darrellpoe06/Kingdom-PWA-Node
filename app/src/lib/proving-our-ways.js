// =============================================================================
// proving-our-ways — are our ways producing His will, and has anyone tried them
// =============================================================================
// Darrell 2026-10-08, two questions in one breath:
//
//   "Are there metrics for my family for their use of the PoeTech App and other
//    builds to see if they are testing and using evaluating the functions based
//    on the use so we can streamline our process for testing these
//    applications... make sense?"
//
//   "Where inside the PoeTech App is the reports and historical information and
//    framework for our culturally responsive evaluation and assessments to make
//    sure we are producing His Will with our ways and tools? Comprehensive
//    module/s"
//
// And then, into the same channel, the Word he answered himself with, which is
// now L219 (DR-0818): "Prudence and also leaning on His Understanding... which
// tells me to be prudent... His Knowledge is the Highest Authority And Level...
// in all dimensions..."
//
// WHAT WAS ALREADY THERE, MEASURED BEFORE BUILDING (DR-0061 reality-trace):
//   - Admin > Users and usage (AccessUsageMetrics) carries the roster with role
//     and scope, activity and build freshness from member_presence, aggregate
//     tab flow from usage_flow_metrics (0073), per-person most-used views for a
//     steward from user_usage_metrics (0145), and platform signups.
//   - Quality proof, Data integrity report, Perpetual report and System flow
//     proof report on the SYSTEM: gates, audits, flows, timelines.
//
// WHAT WAS NOT THERE, AND IS THE GAP THIS MODULE CLOSES:
//   1. Every usage number was a TAB OPENED (usage_events kind='view'). Nothing
//      recorded a FUNCTION being exercised, so "has anyone ever tried the
//      camera window" had no answer, which is exactly the testing question.
//   2. Nothing linked a thing we SHIPPED to whether it had been touched since.
//   3. There was no evaluation framework at all. A search of the whole repo and
//      the app for "culturally responsive" returned nothing.
//
// THE MEASURE ITSELF IS UNDER JUDGMENT. "Divers weights, and divers measures,
// both of them are alike abomination to the LORD." (Proverbs 20:10) So this
// module holds itself to what it measures: every number comes from real rows,
// a function with no rows reads NOT TRIED rather than a painted zero dressed as
// a finding, and the same weight is used on every function including the ones
// shipped this week.
//
// Pure: no DOM, no fetch, no Date.now inside a rollup (the caller passes nowMs),
// so every count here is unit-tested and reproducible (DR-0076).

// ─────────────────────────────────────────────────────────────────────────────
// THE STANDARD — culturally responsive, Word-grounded, in His order
// ─────────────────────────────────────────────────────────────────────────────
// CULTURALLY RESPONSIVE, SAID PLAINLY AND NOT BORROWED. In the world's usage the
// phrase means an assessment that meets people inside their own language, age,
// pace and circumstance instead of grading them against a stranger's default.
// This house keeps that and grounds it, because the Word got there first: the
// same message is carried to child, youth, teen and senior in each one's own
// register and nothing is reduced for any of them; the Word's own method is
// daily talk in the four places of a family's ordinary day (Deuteronomy 6:7);
// and the measure may not change depending on whose work is on it
// (Proverbs 20:10). Responsive to the person, fixed in the standard.
//
// Each dimension carries ONE question that can be answered from real state, and
// the verse it stands on. The verses are pinned verbatim by a test against the
// in-repo KJV corpus, the same way every lesson is.
export const PROVING_DIMENSIONS = Object.freeze([
  Object.freeze({
    key: 'real-state',
    title: 'Do we know the real state, or only our impression of it',
    verse: 'Proverbs 27:23',
    text: 'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
    asks: 'Is every number on this page read from a real row, a real run or a real timestamp?',
  }),
  Object.freeze({
    key: 'tried',
    title: 'Has the thing we shipped actually been used by anyone',
    verse: 'Luke 14:28',
    text: 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
    asks: 'Of the functions we shipped, how many has a person exercised even once?',
  }),
  Object.freeze({
    key: 'one-measure',
    title: 'Is the measure the same for everyone, including us',
    verse: 'Proverbs 20:10',
    text: 'Divers weights, and divers measures, both of them are alike abomination to the LORD.',
    asks: 'Would this assessment read the same if someone else had built the thing?',
  }),
  Object.freeze({
    key: 'own-work',
    title: 'Are we proving our own work, not comparing ourselves',
    verse: 'Galatians 6:4',
    text: 'But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.',
    asks: 'Is the finding about what we built, with no other person used as the yardstick?',
  }),
  Object.freeze({
    key: 'each-register',
    title: 'Does it meet each person where they are, nothing reduced',
    verse: 'Deuteronomy 6:7',
    text: 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
    asks: 'Does a child, a youth, a teen and an elder each get the whole of it in their own register?',
  }),
  Object.freeze({
    key: 'not-leaning',
    title: 'Are we leaning on His Understanding rather than our own',
    verse: 'Proverbs 3:5',
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
    asks: 'Did we check this against the Word, or only against what seemed sensible to us?',
  }),
  Object.freeze({
    key: 'his-will',
    title: 'Is the proving aimed at His will, or at our output',
    verse: 'Romans 12:2',
    text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
    asks: 'What would change about this work if it turned out not to serve His will?',
  }),
  Object.freeze({
    key: 'faithful',
    title: 'Is the standard faithful, rather than impressive',
    verse: '1 Corinthians 4:2',
    text: 'Moreover it is required in stewards, that a man be found faithful.',
    asks: 'Are we measuring what we promised to keep, or what looks best in a report?',
  }),
]);

// ─────────────────────────────────────────────────────────────────────────────
// THE SHIPPED FUNCTIONS — the link that did not exist
// ─────────────────────────────────────────────────────────────────────────────
// A thing we shipped, the decision record that shipped it, the day it landed,
// and the event name the app records when a person exercises it. A function
// belongs here when it is a FUNCTION A PERSON USES, not a gate, a migration or
// a report. Adding a row without wiring its `event` is caught by a test, so
// this registry can never quietly claim coverage it does not have.
export const SHIPPED_FUNCTIONS = Object.freeze([
  Object.freeze({ event: 'lesson.open', label: 'Open a lesson in its own space', where: 'Church, Learn', dr: 'DR-0631', shipped: '2026-09-14' }),
  Object.freeze({ event: 'reader.read', label: 'Read a lesson aloud, start to finish', where: 'Lesson reader', dr: 'DR-0659', shipped: '2026-09-25' }),
  Object.freeze({ event: 'reader.follow', label: 'Follow along while it reads', where: 'Lesson reader', dr: 'DR-0659', shipped: '2026-09-25' }),
  Object.freeze({ event: 'reader.pitch', label: 'Give a voice its own pitch', where: 'Lesson reader', dr: 'DR-0801', shipped: '2026-10-07' }),
  Object.freeze({ event: 'reader.pointer', label: 'Hovering pointer for a remote', where: 'Lesson reader', dr: 'DR-0802', shipped: '2026-10-07' }),
  Object.freeze({ event: 'textsize.change', label: 'Change the text size', where: 'Everywhere', dr: 'DR-0147', shipped: '2026-07-10' }),
  Object.freeze({ event: 'camera.window', label: 'Open the camera wall full size', where: 'Cameras', dr: 'DR-0788', shipped: '2026-10-06' }),
  Object.freeze({ event: 'camera.focus', label: 'Click a camera to make it largest', where: 'Cameras', dr: 'DR-0796', shipped: '2026-10-07' }),
]);

/** The registry keyed by event name. */
export function shippedByEvent() {
  const m = new Map();
  for (const f of SHIPPED_FUNCTIONS) m.set(f.event, f);
  return m;
}

const DAY_MS = 86400000;

/** Whole days between two ISO days / timestamps; null when either is unusable. */
export function daysBetween(fromIso, toMs) {
  const a = Date.parse(fromIso);
  const b = Number(toMs);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.floor((b - a) / DAY_MS);
}

/**
 * Every shipped function, with whether anyone has exercised it.
 *
 * `rows` is what feature_use_metrics returns in `features`:
 *   [{ name, count, people, last_at }]
 * A function with no row reads `tried: false` and says so. It is NEVER reported
 * as a zero that could be mistaken for a measurement of disuse: no row means
 * nobody has used it inside the window, which is a different sentence from
 * "it was used zero times", and the surface says the first one.
 */
export function tryStatus(rows, nowMs, functions = SHIPPED_FUNCTIONS) {
  const by = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (r && typeof r.name === 'string') by.set(r.name, r);
  }
  return functions.map((f) => {
    const r = by.get(f.event) || null;
    const uses = r ? Number(r.count) || 0 : 0;
    const people = r ? Number(r.people) || 0 : 0;
    const lastAt = r && r.last_at ? String(r.last_at) : '';
    return {
      ...f,
      tried: uses > 0,
      uses,
      people,
      lastAt,
      daysSinceShipped: daysBetween(f.shipped, nowMs),
    };
  });
}

/** How the whole catalog of shipped functions is doing. Pure. */
export function provingSummary(status) {
  const list = Array.isArray(status) ? status : [];
  const tried = list.filter((s) => s.tried);
  const untried = list.filter((s) => !s.tried);
  const waiting = untried
    .filter((s) => Number.isFinite(s.daysSinceShipped))
    .sort((a, b) => b.daysSinceShipped - a.daysSinceShipped);
  return {
    shipped: list.length,
    tried: tried.length,
    untried: untried.length,
    people: list.reduce((n, s) => Math.max(n, s.people), 0),
    longestUntried: waiting[0] || null,
  };
}

/**
 * The one line the steward reads first. Honest when there is nothing to read:
 * a snapshot that never arrived is NOT "nothing has been tried".
 */
export function provingLine(summary, snapshotOk) {
  if (!snapshotOk) return 'No usage snapshot yet, so nothing can be said about what has been tried.';
  const s = summary || {};
  const shipped = Number(s.shipped) || 0;
  if (!shipped) return 'No functions are registered yet.';
  const tried = Number(s.tried) || 0;
  if (tried === shipped) return `All ${shipped} registered functions have been tried.`;
  const waited = s.longestUntried && Number.isFinite(s.longestUntried.daysSinceShipped)
    ? ` The longest untried is "${s.longestUntried.label}", ${s.longestUntried.daysSinceShipped} days since it shipped.`
    : '';
  return `${tried} of ${shipped} registered functions have been tried.${waited}`;
}

/**
 * The historical record: one assessment per day the snapshot was taken, newest
 * first, so the steward can see the direction and not only today. Pure over
 * rows the caller already holds.
 */
export function assessmentHistory(entries) {
  const list = (Array.isArray(entries) ? entries : [])
    .filter((e) => e && typeof e.at === 'string' && Number.isFinite(Number(e.tried)))
    .map((e) => ({
      at: e.at,
      tried: Number(e.tried) || 0,
      shipped: Number(e.shipped) || 0,
      share: Number(e.shipped) ? Math.round((Number(e.tried) / Number(e.shipped)) * 100) : 0,
    }));
  list.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return list;
}

/** Is it getting better? The direction between the newest two assessments. */
export function assessmentDirection(history) {
  const h = Array.isArray(history) ? history : [];
  if (h.length < 2) return { known: false, delta: 0, word: 'Not enough history yet to say.' };
  const delta = h[0].share - h[1].share;
  if (delta > 0) return { known: true, delta, word: `Up ${delta} points since the last assessment.` };
  if (delta < 0) return { known: true, delta, word: `Down ${Math.abs(delta)} points since the last assessment.` };
  return { known: true, delta: 0, word: 'Unchanged since the last assessment.' };
}
