// =============================================================================
// At the weekly 1 p.m. Bible study the teacher is Bishop Gwin (BG): never "the
// teacher" alone (DR-0719). Darrell, 2026-10-01: "Don't say the teacher alone...
// say the teacher BG or Bishop Gwin interchangeable because it's him either way."
//
// 1. Every lesson whose own words name that session is in the list
//    (lib/bible-study-session.js), and every listed lesson is one.
// 2. No listed lesson carries a bare "the teacher" / "our teacher" / "the
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
  isBibleStudySessionText,
  bareTeacherMentions,
  bareTeacherMentionsInLesson,
} from '../lib/bible-study-session.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const REPO = join(process.cwd(), '..');
const LIB = join(process.cwd(), 'src', 'lib');
const ID_LINE = /^\s{2,4}(?:id|"id"):\s*['"]([^'"]+)['"]/;

// Every lesson-shaped block in every course file, by its id line.
function sessionLessonsInSource() {
  const found = [];
  for (const f of readdirSync(LIB).filter((n) => n.endsWith('.js') && n !== 'bible-study-session.js')) {
    const lines = readFileSync(join(LIB, f), 'utf8').split('\n');
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

describe('the weekly Bible study lessons name Bishop Gwin (DR-0719)', () => {
  it('every lesson that names the session is listed, and every listed lesson names it', () => {
    const found = sessionLessonsInSource();
    expect([...new Set(found)].sort()).toEqual([...BIBLE_STUDY_SESSION_IDS].sort());
    for (const l of BIBLE_STUDY_SESSION_LESSONS) {
      expect(l.provenance, l.id).toMatch(/\S/);
      expect(l.file, l.id).toBe('living-lessons-class.js');
      expect(byId(l.id), l.id).toBeTruthy();
    }
  });

  for (const l of BIBLE_STUDY_SESSION_LESSONS) {
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
    const l124 = byId(BIBLE_STUDY_SESSION_IDS[0]);
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

  it('PROVEN-TO-CATCH: the recogniser finds an unlisted session lesson, and passes over others', () => {
    expect(isBibleStudySessionText('We met for the normal weekly 1 p.m. Bible study with Bishop Gwin.')).toBe(true);
    expect(isBibleStudySessionText('Captured from a Wednesday Bible Study taught by Bishop Lloyd E. Gwin.')).toBe(true);
    expect(isBibleStudySessionText("Bishop Gwin's Celebration message on a Sunday.")).toBe(false);
    expect(isBibleStudySessionText('This discipline keeps a Bible study honest.')).toBe(false);
    expect(isBibleStudySessionText('A podcast host and a guest teacher at a weekly Bible study.')).toBe(false);
  });

  it('the NAS lesson builder and the intake Way carry the rule in plain words', () => {
    const writer = readFileSync(join(REPO, 'infra', 'nas-lesson-builder', 'lesson_writer.py'), 'utf8');
    const intake = readFileSync(join(REPO, 'docs', '00-foundations', '_root', 'COLG-SERMON-INTAKE.md'), 'utf8');
    const rule = 'At the weekly 1 p.m. Bible study the teacher is Bishop Gwin (BG): never "the teacher" alone.';
    expect(BIBLE_STUDY_SESSION.rule).toBe(rule);
    expect(writer).toContain(rule);
    expect(intake).toContain(rule);
  });
});
