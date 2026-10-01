// =============================================================================
// bible-study-session — lessons from the weekly Bible study at The Church of the
// Living God in Champaign, Illinois, and who taught each one.
// =============================================================================
// Darrell, 2026-10-01 (DR-0719): "Don't say the teacher alone... say the teacher
// BG or Bishop Gwin interchangeable because it's him either way." Then, narrowing
// it the same day: "The teacher in that specific lesson is BG... others may or
// may not have him."
//
// So the rule is about WHO TAUGHT, never assumed from the session alone:
//   - A lesson whose provenance positively shows Bishop Gwin (BG) taught it
//     (its DR, its grounds, its own source line, or speaker marks carrying BG,
//     DR-0712 voice:BG) never says "the teacher" (or "our teacher", "the
//     instructor", "the speaker") alone in our prose: Bishop Gwin or BG.
//   - Where the teacher is someone else or not identified, the lesson names them
//     as the recording does, or says plainly the teacher is not identified.
//   - A line the recording does not give to BG is never put on him (DR-0712).
//
// Pure: no I/O. The gate test (bible-study-session-names-bishop-gwin.test.js)
// finds every weekly-study lesson in every course file; each must be listed here
// with its teacher and the evidence for it, so no new one is assumed.
// =============================================================================

export const BIBLE_STUDY_SESSION = Object.freeze({
  church: 'The Church of the Living God',
  place: 'Champaign, Illinois',
  when: 'the weekly 1 p.m. Bible study (Wednesday)',
  rule: "Name the teacher from the speaker marks (DR-0712: voice:BG) or the recording; when it is Bishop Gwin, say Bishop Gwin or BG, never 'the teacher' alone; never assume who taught.",
});

// Every weekly-study lesson, with who taught it and the evidence. `teacher` is
// 'BG' only on positive evidence; otherwise 'not identified' or the name the
// recording gives. `pending` marks a lesson whose fix is owned by another open
// PR: until the date its count of bare mentions may only fall; after it, zero.
export const BIBLE_STUDY_SESSION_LESSONS = Object.freeze([
  Object.freeze({
    id: 'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job',
    file: 'living-lessons-class.js',
    date: '2026-09-02',
    teacher: 'BG',
    evidence: 'its own SOURCE line: "a Wednesday Bible Study taught by Bishop Lloyd E. Gwin"; docs/99-session-notes/2026-09-03-living-lesson-l119-equipped-to-win.md (video WQIcLeynG0w)',
  }),
  Object.freeze({
    id: 'll202-prepared-before-the-position-homecoming-legacy-good-success-and-represent',
    file: 'living-lessons-class.js',
    date: '2026-09-30',
    teacher: 'BG',
    evidence: 'Darrell, 2026-10-01: "The teacher in that specific lesson is BG"; DR-0711 speaker marks give BG the teaching and its numbered points (PR #1900); DR-0690',
    pending: Object.freeze({ pr: 1900, until: '2026-10-07', ceiling: 43 }),
  }),
  Object.freeze({
    id: 'll204-the-word-checks-every-teller-many-counsellors-all-under-him',
    file: 'living-lessons-class.js',
    date: '2026-09-30',
    teacher: 'DP',
    evidence: 'not a class: Darrell typed these lines into the build on 2026-09-30 about how a lesson is made (DR-0714); its prose names L202\'s weekly class only to describe the worked example; no recording, no one else taught it',
  }),
]);

export const BIBLE_STUDY_SESSION_IDS = Object.freeze(BIBLE_STUDY_SESSION_LESSONS.map((l) => l.id));
export const TAUGHT_BY_BG_IDS = Object.freeze(
  BIBLE_STUDY_SESSION_LESSONS.filter((l) => l.teacher === 'BG').map((l) => l.id),
);

// THE FINDER: a lesson is from the weekly study when its own words name the
// church (or Bishop Gwin / BG) AND a Bible study that is the weekly one
// (Wednesday, 1 p.m., 1 o'clock or "weekly"). Finding it decides nothing about
// who taught: that is the list's `teacher`, set only on evidence.
export function isBibleStudySessionText(text) {
  const t = String(text || '');
  const church = /\bBishop\s+(?:Lloyd\s+E\.\s*)?Gwin\b|\bBG\b|Church of the Living God|Love Corner/.test(t);
  const study = /\bBible\s+[Ss]tudy\b/.test(t);
  const weekly = /\bWednesday\s+Bible\s+[Ss]tudy\b|\b1\s*p\.m\.\s*Bible\s+[Ss]tudy\b|\bweekly\b[^.]{0,40}\bBible\s+[Ss]tudy\b|\b1\s*o['’]clock\b/i.test(t);
  return church && study && weekly;
}

// Positive evidence in a lesson's own words that BG taught it: "taught by Bishop
// Gwin", "Bishop Gwin taught", or a speaker-marked line "BG: ...". Being at the
// session, or a teaching "named for" him, is not by itself evidence.
export function showsBishopGwinTaught(text) {
  return /\btaught\s+by\s+Bishop\s+(?:Lloyd\s+E\.\s*)?Gwin\b|\bBishop\s+(?:Lloyd\s+E\.\s*)?Gwin\s+taught\b|(?:^|\n)\s*BG:\s/.test(String(text || ''));
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
