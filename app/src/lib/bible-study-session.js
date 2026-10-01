// =============================================================================
// bible-study-session — the lessons that come from the weekly Bible study at
// The Church of the Living God in Champaign, Illinois, taught by Bishop Gwin (BG).
// =============================================================================
// Darrell, 2026-10-01 (DR-0719): "For that lesson with Mary Gwin... and all
// lessons that are recorded at that Bible study session time... it's BG...
// Don't say the teacher alone... say the teacher BG or Bishop Gwin
// interchangeable because it's him either way."
//
// So in our own prose a lesson from that session never says "the teacher" (or
// "our teacher", "the instructor", "the speaker") on its own: it says Bishop
// Gwin or BG. "The teacher, Bishop Gwin," is fine; the name is what matters.
// A line the recording does not give to BG is never attributed to him (DR-0712);
// it says "the class", or names the speaker the recording shows.
//
// Pure: no I/O. The gate test (bible-study-session-names-bishop-gwin.test.js)
// reads every course file, recognises every session lesson by the rule below,
// and fails when one is missing from this list or carries a bare "the teacher".
// =============================================================================

export const BIBLE_STUDY_SESSION = Object.freeze({
  church: 'The Church of the Living God',
  place: 'Champaign, Illinois',
  when: 'the weekly 1 p.m. Bible study (Wednesday)',
  teacher: 'Bishop Gwin',
  short: 'BG',
  rule: 'At the weekly 1 p.m. Bible study the teacher is Bishop Gwin (BG): never "the teacher" alone.',
});

// Every lesson whose source is that session, with where its provenance is written.
// `pending` marks a lesson whose fix is owned by another open PR: until the date,
// its count of bare mentions may only fall; after it, it must be zero.
export const BIBLE_STUDY_SESSION_LESSONS = Object.freeze([
  Object.freeze({
    id: 'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job',
    file: 'living-lessons-class.js',
    date: '2026-09-02',
    provenance: 'docs/99-session-notes/2026-09-03-living-lesson-l119-equipped-to-win.md (Wednesday Bible Study, Bishop Lloyd E. Gwin, video WQIcLeynG0w); the lesson body says so in its SOURCE line',
  }),
  Object.freeze({
    id: 'll202-prepared-before-the-position-homecoming-legacy-good-success-and-represent',
    file: 'living-lessons-class.js',
    date: '2026-09-30',
    provenance: 'DR-0690 (recorded in the app at the weekly 1 p.m. Bible study); speakers in DR-0711 / DR-0712',
    pending: Object.freeze({ pr: 1900, until: '2026-10-07', ceiling: 43 }),
  }),
]);

export const BIBLE_STUDY_SESSION_IDS = Object.freeze(BIBLE_STUDY_SESSION_LESSONS.map((l) => l.id));

// THE RECOGNISER: a lesson is from the session when its own words name Bishop
// Gwin (or BG) AND a Bible study that is the weekly one (Wednesday, 1 p.m. or
// 1 o'clock, or "weekly"). A Sunday message, a sermon email, or a lesson that
// only mentions "a Bible study" in passing is not recognised.
export function isBibleStudySessionText(text) {
  const t = String(text || '');
  const bg = /\bBishop\s+(?:Lloyd\s+E\.\s*)?Gwin\b|\bBG\b/.test(t);
  const study = /\bBible\s+[Ss]tudy\b/.test(t);
  const weekly = /\bWednesday\s+Bible\s+[Ss]tudy\b|\b1\s*p\.m\.\s*Bible\s+[Ss]tudy\b|\bweekly\b[^.]{0,40}\bBible\s+[Ss]tudy\b|\b1\s*o['’]clock\b/i.test(t);
  return bg && study && weekly;
}

// Our own prose: everything outside double quotation marks (straight or curly).
// Quoted Scripture and quoted transcript lines are never touched by this rule.
export function authoredProse(text) {
  return String(text || '').replace(/"[^"]*"/g, ' ').replace(/“[^”]*”/g, ' ');
}

// A bare mention: "the teacher", "our teacher", "the instructor", "the speaker"
// (lower-case noun; "the Teacher" with a capital is Jesus and is never matched),
// NOT followed by BG or Bishop Gwin.
// "the teacher's" counts too: it should read "Bishop Gwin's".
const BARE = /\b(?:[Tt]he|[Oo]ur)\s+(?:teacher|instructor|speaker)\b(?!\s*,?\s*(?:BG\b|Bishop\s+Gwin\b))/g;

export function bareTeacherMentions(text) {
  const prose = authoredProse(text);
  const out = [];
  for (const m of prose.matchAll(BARE)) {
    out.push(prose.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, ' ').trim());
  }
  return out;
}

// Every string in a lesson object, with its path, so a hit names where it is.
export function lessonStrings(node, path = '') {
  if (typeof node === 'string') return [[path, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => lessonStrings(v, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => lessonStrings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

export function bareTeacherMentionsInLesson(lesson) {
  return lessonStrings(lesson).flatMap(([where, s]) => bareTeacherMentions(s).map((hit) => ({ where, hit })));
}
