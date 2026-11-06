// =============================================================================
// When Bishop Gwin (BG) taught a lesson, it says Bishop Gwin or BG, never "the
// teacher" alone; and no one assumes who taught (DR-0719). Darrell, 2026-10-01:
// "say the teacher BG or Bishop Gwin interchangeable because it's him either
// way" and "The teacher in that specific lesson is BG... others may or may not
// have him."
//
// 1. Every weekly-Bible-study lesson in any course file is in the list
//    (lib/bible-study-session.js) with its teacher and the evidence; teacher
//    'BG' needs evidence that names him as the one teaching.
// 2. No lesson BG taught carries a bare "the teacher" / "our teacher" / "the
//    instructor" / "the speaker" in its own prose (quotations are not touched).
// 3. The NAS lesson builder and the intake Way carry the rule in plain words.
// PROVEN-TO-CATCH: the checker fails on L202 as it stands on main (43 bare
// mentions), on a listed lesson with one bare mention spliced in, and on an
// unlisted lesson that names the session.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  BIBLE_STUDY_SESSION,
  BIBLE_STUDY_SESSION_LESSONS,
  BIBLE_STUDY_SESSION_IDS,
  TAUGHT_BY_BG_IDS,
  isBibleStudySessionText,
  showsBishopGwinTaught,
  bareTeacherMentions,
  bareTeacherMentionsInLesson,
} from '../lib/bible-study-session.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const REPO = join(process.cwd(), '..');
const LIB = join(process.cwd(), 'src', 'lib');
const ID_LINE = /^\s{2,4}(?:id|"id"):\s*['"]([^'"]+)['"]/;

// A lesson's text is what the lesson SAYS, never what a comment says ABOUT it.
// Added 2026-11-06 (DR-1351) after a measured false positive. A block runs from
// one `id:` line to the next, so the header comment a builder writes ABOVE the
// next lesson sits inside the PREVIOUS lesson's block and was being read as
// that lesson's own words.
//
// MEASURED, on sov69's branch, which is what went red. sov68's block ran lines
// 9372-9655 and matched all three terms the classifier needs:
//   study  + weekly  <- sov68's OWN text, line 9424, inside a quotation:
//                       "A recording of a weekly Bible study, taught by a named
//                       preacher" -- an innocent example in a lesson about
//                       provenance, and there since sov68 shipped.
//   church           <- line 9631, inside sov69's HEADER COMMENT:
//                       "// crediting Bishop Gwin for a send that names nobody."
// So the gate read a sentence FORBIDDING his credit as evidence he taught it,
// and filed it under the neighbour above. Two faults compounding: the block
// boundary, and comments counted as lesson prose.
//
// Whole-line comments are blanked (kept as empty lines so numbering is intact).
// Deliberately whole-line only: a trailing `// ...` after code is rare in these
// files, and a blind `//` strip would cut `https://` inside real lesson text --
// the same limit measured in member-surfaces-every-control-acts earlier today.
// A genuine session lesson names Bishop Gwin in its PROSE, not in a comment, so
// nothing real is lost. `re-review: 2026-12-05` for the trailing-comment case
// and for the same blind spot in any other caller of isBibleStudySessionText.
export function withoutWholeLineComments(src) {
  let inBlock = false;
  return String(src)
    .split('\n')
    .map((l) => {
      const t = l.trim();
      if (inBlock) {
        if (t.includes('*/')) inBlock = false;
        return '';
      }
      if (t.startsWith('/*')) {
        if (!t.includes('*/')) inBlock = true;
        return '';
      }
      return t.startsWith('//') ? '' : l;
    })
    .join('\n');
}

// Every lesson-shaped block in every course file, by its id line.
function sessionLessonsInSource() {
  const found = [];
  for (const f of readdirSync(LIB).filter((n) => n.endsWith('.js') && n !== 'bible-study-session.js')) {
    const lines = withoutWholeLineComments(readFileSync(join(LIB, f), 'utf8')).split('\n');
    const starts = [];
    lines.forEach((l, i) => { const m = l.match(ID_LINE); if (m) starts.push([i, m[1]]); });
    starts.forEach(([s, id], k) => {
      const e = k + 1 < starts.length ? starts[k + 1][0] : lines.length;
      if (isBibleStudySessionText(lines.slice(s, e).join('\n'))) found.push(id);
    });
  }
  return found;
}

const byId = (id) => LIVING_LESSONS_MODULES.find((m) => m.id === id);
const today = new Date().toISOString().slice(0, 10);

describe('a lesson Bishop Gwin taught names him (DR-0719)', () => {
  it('every weekly-study lesson is listed with its teacher and the evidence, and none is assumed', () => {
    const found = sessionLessonsInSource();
    expect([...new Set(found)].sort()).toEqual([...BIBLE_STUDY_SESSION_IDS].sort());
    for (const l of BIBLE_STUDY_SESSION_LESSONS) {
      expect(l.teacher, l.id).toMatch(/\S/);
      expect(l.evidence, l.id).toMatch(/\S/);
      expect(l.file, l.id).toBe('living-lessons-class.js');
      expect(byId(l.id), l.id).toBeTruthy();
      if (l.teacher === 'BG') {
        // Evidence must name him as the one teaching: his own words in the lesson,
        // Darrell's word, or speaker marks (BG / voice:BG).
        const lessonShows = showsBishopGwinTaught(JSON.stringify(byId(l.id)).replace(/\\"/g, '"'));
        expect(lessonShows || /Darrell, \d{4}-\d{2}-\d{2}: "The teacher in that specific lesson is BG"|speaker marks give BG|voice:BG/.test(l.evidence), l.id).toBe(true);
      }
    }
  });

  it('L124 shows it in its own words: taught by Bishop Lloyd E. Gwin', () => {
    expect(showsBishopGwinTaught(byId(TAUGHT_BY_BG_IDS[0]).lesson)).toBe(true);
  });

  for (const l of BIBLE_STUDY_SESSION_LESSONS.filter((x) => x.teacher === 'BG')) {
    it(`${l.id.slice(0, 40)}… never says "the teacher" alone`, () => {
      const hits = bareTeacherMentionsInLesson(byId(l.id));
      if (l.pending && today <= l.pending.until) {
        // Owned by another open PR (l.pending.pr): the count may only fall until the date.
        expect(hits.length, JSON.stringify(hits.slice(0, 3))).toBeLessThanOrEqual(l.pending.ceiling);
      } else {
        expect(hits, JSON.stringify(hits.slice(0, 5))).toEqual([]);
      }
    });
  }

  it('PROVEN-TO-CATCH: L202 as it stood on main carries bare mentions the strict check finds', () => {
    const l202 = BIBLE_STUDY_SESSION_LESSONS.find((l) => l.id.startsWith('ll202-'));
    const hits = bareTeacherMentionsInLesson(byId(l202.id));
    // Once PR #1900 converts it, this count is 0 and the pending entry is removed.
    if (hits.length) expect(hits.length).toBeLessThanOrEqual(l202.pending.ceiling);
    // The checker itself, on the exact shapes L202 used:
    expect(bareTeacherMentions('The teacher said, then get busy.')).toHaveLength(1);
    expect(bareTeacherMentions("The teacher's third point.")).toHaveLength(1);
    expect(bareTeacherMentions('What did the teacher say about a closed door?')).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: one bare mention spliced into L124 fails it', () => {
    const l124 = byId(TAUGHT_BY_BG_IDS[0]);
    expect(bareTeacherMentionsInLesson(l124)).toEqual([]);
    const broken = { ...l124, lesson: `${l124.lesson} The teacher told about ruined houses.` };
    expect(bareTeacherMentionsInLesson(broken)).toHaveLength(1);
  });

  it('allows the name, keeps quotations and the capital Teacher (Jesus) untouched', () => {
    expect(bareTeacherMentions('Bishop Gwin said it. BG said it again.')).toEqual([]);
    expect(bareTeacherMentions('The teacher, Bishop Gwin, read the Psalm.')).toEqual([]);
    expect(bareTeacherMentions('the teacher BG asked the room')).toEqual([]);
    expect(bareTeacherMentions('He said, "the teacher is here" (a transcript line).')).toEqual([]);
    expect(bareTeacherMentions('taught by the Teacher Himself')).toEqual([]);
    expect(bareTeacherMentions('our teacher said so')).toHaveLength(1);
    expect(bareTeacherMentions('the speaker said so')).toHaveLength(1);
  });

  it('PROVEN-TO-CATCH: being at the session is not evidence that BG taught', () => {
    expect(showsBishopGwinTaught('We met for the weekly 1 p.m. Bible study with Bishop Gwin and those who came.')).toBe(false);
    expect(showsBishopGwinTaught('Darrell named the teaching for Bishop Gwin.')).toBe(false);
    expect(showsBishopGwinTaught('Captured from a Wednesday Bible Study taught by Bishop Lloyd E. Gwin.')).toBe(true);
    expect(showsBishopGwinTaught('Speakers: BG, DP\nBG: get busy.')).toBe(true);
  });

  it('PROVEN-TO-CATCH: the finder finds an unlisted session lesson, and passes over others', () => {
    expect(isBibleStudySessionText('We met for the normal weekly 1 p.m. Bible study with Bishop Gwin.')).toBe(true);
    expect(isBibleStudySessionText('Captured from a Wednesday Bible Study taught by Bishop Lloyd E. Gwin.')).toBe(true);
    expect(isBibleStudySessionText("Bishop Gwin's Celebration message on a Sunday.")).toBe(false);
    expect(isBibleStudySessionText('This discipline keeps a Bible study honest.')).toBe(false);
    expect(isBibleStudySessionText('A podcast host and a guest teacher at a weekly Bible study.')).toBe(false);
  });

  // DR-1351. The comment-stripping added above could have DISARMED this gate
  // rather than corrected it, so these cases pin both directions: the false
  // positive is gone, and every true positive still fires.
  it('PROVEN-TO-CATCH: a comment naming him is not the neighbour lesson’s words', () => {
    // The exact shape that went red, reduced: sov68's innocent quoted example
    // supplies study + weekly, and the HEADER COMMENT for the next lesson
    // supplies the only mention of him -- in a sentence forbidding his credit.
    const file = [
      '    "id": "sovNN-the-previous-lesson",',
      '    "lesson": "A recording of a weekly Bible study, taught by a named preacher is one thing.",',
      '  // WEEK NN+1 - WHO TAUGHT: NOBODY. The gate forbids',
      '  // crediting Bishop Gwin for a send that names nobody.',
      '    "id": "sovNN1-the-next-lesson",',
      '    "lesson": "Something else entirely.",',
    ].join('\n');
    // Raw, the previous lesson's block swallows the comment and matches.
    expect(isBibleStudySessionText(file.split('\n').slice(0, 4).join('\n'))).toBe(true);
    // Stripped, it does not -- which is the fix.
    const stripped = withoutWholeLineComments(file).split('\n');
    expect(isBibleStudySessionText(stripped.slice(0, 4).join('\n'))).toBe(false);
    // And the stripping kept the line count, so id-line indexes still line up.
    expect(stripped.length).toBe(file.split('\n').length);
  });

  it('PROVEN-TO-CATCH: stripping comments does NOT disarm a real session lesson', () => {
    const real = [
      '    "id": "llNN-a-real-session-lesson",',
      '    "lesson": "Taught by Bishop Lloyd E. Gwin at the Wednesday Bible Study.",',
    ].join('\n');
    expect(isBibleStudySessionText(withoutWholeLineComments(real))).toBe(true);
    // A URL in real lesson text survives, which is why only WHOLE-LINE
    // comments are blanked and a blind `//` strip was refused.
    const withUrl = '    "inApp": "See https://poetech.us/learn for the weekly Bible study with Bishop Gwin.",';
    expect(withoutWholeLineComments(withUrl)).toBe(withUrl);
    expect(isBibleStudySessionText(withoutWholeLineComments(withUrl))).toBe(true);
  });

  it('block comments are blanked too, and an unterminated one does not eat the file', () => {
    expect(withoutWholeLineComments('  /* Bishop Gwin */\n  "a": 1').split('\n')[0]).toBe('');
    const multi = '  /* Bishop Gwin\n     weekly Bible study */\n    "id": "llNN-after",';
    const out = withoutWholeLineComments(multi).split('\n');
    expect(out[0]).toBe('');
    expect(out[1]).toBe('');
    expect(out[2]).toBe('    "id": "llNN-after",');
  });

  it('the NAS lesson builder, the intake Way and the builder brief carry the rule in plain words', () => {
    const writer = readFileSync(join(REPO, 'infra', 'nas-lesson-builder', 'lesson_writer.py'), 'utf8');
    const intake = readFileSync(join(REPO, 'docs', '00-foundations', '_root', 'COLG-SERMON-INTAKE.md'), 'utf8');
    const brief = readFileSync(join(REPO, 'docs', 'templates', 'builder-brief.md'), 'utf8');
    const rule = "Name the teacher from the speaker marks (DR-0712: voice:BG) or the recording; when it is Bishop Gwin, say Bishop Gwin or BG, never 'the teacher' alone; never assume who taught.";
    expect(BIBLE_STUDY_SESSION.rule).toBe(rule);
    expect(writer).toContain(rule);
    expect(intake).toContain(rule);
    expect(brief).toContain(rule);
  });
});
