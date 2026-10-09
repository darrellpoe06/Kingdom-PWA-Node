// @vitest-environment node
// =============================================================================
// THE SIMPLE WORD BESIDE THE TITLE — connection, never rename (DR-0519)
// =============================================================================
// Darrell 2026-09-19, three messages that only make sense read together:
//
//   "Even courses on Money... course titles pulls people into the lessons and
//    courses... we need to use terms they already understand so words that are
//    to big or not usually used will not be understood unless we also use them
//    in context and also use words that are in the current vocabulary..."
//   "Not saying don't use the same words we are just thinking about broad
//    connections made by simple word choices..."
//   "I like the current titles they pull me in..."
//
// The first message reads like a rename request. The second and third correct
// it, and the correction is the whole design: TITLES ARE UNTOUCHED, and the
// everyday word rides alongside. This file is what keeps that true — the gate
// that fails if a course goes unreachable by the plain word for what it
// teaches, and equally if the registry starts smuggling house vocabulary back
// in under the name "plain".
//
// PROVEN-TO-CATCH IS THE POINT (DR-0076 §3): the first four checks break the
// measure on purpose and require it to report.
import { describe, it, expect } from 'vitest';
import {
  EVERYDAY_WORDS, COURSE_PLAIN_WORDS, plainWordsFor, plainWordLine,
  coursesMissingPlainWords, nonEverydayPlainWords, echoOnlyPlainWords, orphanPlainWordRows,
} from '../lib/learn-plain-words.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import { buildLessonIndex, searchLessons } from '../lib/learn-organize.js';

const courses = [
  ...LEARN_CATALOG.map((e) => ({ key: e.key, meta: e.meta, schedule: e.buildScheduleRows() })),
  ...buildEternalProcessingCourses(),
];
const index = buildLessonIndex(courses);

describe('the measure catches what it exists to catch', () => {
  it('names a course with no plain words, and one with too few', () => {
    expect(coursesMissingPlainWords([{ key: 'nope', meta: { title: 'X' } }])).toEqual(['nope']);
    expect(coursesMissingPlainWords([{ key: 'mathematics', meta: { title: 'X' } }])).toEqual([]);
  });

  it('names a row that only echoes its own title, which adds no connection', () => {
    // Every declared word already inside the title: the reader who did not know
    // the title could never have arrived.
    const echo = [{ key: 'mathematics', meta: { title: 'numbers counting measuring shapes fractions maths' } }];
    expect(echoOnlyPlainWords(echo)).toEqual(['mathematics']);
  });

  it('names a registry key no mounted course claims', () => {
    expect(orphanPlainWordRows([{ key: 'mathematics' }])).toContain('kingdom-economics');
  });

  it('passes the real registry, so a green result means something', () => {
    expect(nonEverydayPlainWords()).toEqual([]);
  });
});

describe('every mounted course is reachable by an everyday word', () => {
  it('leaves no course without plain words', () => {
    expect(coursesMissingPlainWords(courses)).toEqual([]);
  });

  it('declares nothing for a course that is not mounted', () => {
    expect(orphanPlainWordRows(courses)).toEqual([]);
  });

  it('never smuggles house vocabulary in under the name plain', () => {
    // If this fails, the fix is to choose a simpler word — NOT to add the house
    // word to EVERYDAY_WORDS, which would empty the rule of meaning.
    expect(nonEverydayPlainWords()).toEqual([]);
  });

  it('adds a connection rather than echoing the title', () => {
    expect(echoOnlyPlainWords(courses)).toEqual([]);
  });

  it('keeps every row at three words or more, so one word is never the whole door', () => {
    for (const [key, words] of Object.entries(COURSE_PLAIN_WORDS)) {
      expect(words.length, key).toBeGreaterThanOrEqual(3);
      expect(new Set(words).size, `${key} repeats a word`).toBe(words.length);
      for (const w of words) expect(w, `${key}: ${w}`).toBe(w.toLowerCase());
    }
  });
});

describe('THE TITLES ARE UNTOUCHED — this is additive or it is wrong', () => {
  it('changes no course title anywhere in the catalog', () => {
    // The registry is a separate file and holds no title field at all. If a
    // future edit ever tries to make this a rename, it fails here.
    for (const words of Object.values(COURSE_PLAIN_WORDS)) expect(Array.isArray(words)).toBe(true);
    const asText = JSON.stringify(COURSE_PLAIN_WORDS);
    for (const c of courses) expect(asText).not.toContain(String(c.meta?.title || '\u0000'));
  });

  it('the title Darrell named is exactly as it was, and now carries money', () => {
    const ke = courses.find((c) => c.key === 'kingdom-economics');
    expect(ke.meta.title).toContain('Kingdom Economics');
    expect(ke.meta.title.toLowerCase()).not.toContain('money');
    expect(plainWordsFor('kingdom-economics')).toContain('money');
  });
});

// WHY THE 400-RESULT WINDOW CAME OFF (2026-10-09, measured, DR-0332).
// `finds` used to ask for the first 400 results and look for the course there.
// That read as a relevance window and was not one. `searchLessons`
// (app/src/lib/learn-organize.js:508-529) scores a hit 3 for a title match, 2
// for a reference match and 1 otherwise, then breaks every tie by CATALOG
// POSITION (`(a.i - b.i)`, line 527). There is no relevance score at all, so a
// slice of the ordering is a slice of the catalog, in catalog order.
//
// What that cost, measured the day it bit: `work` is declared for
// eternal-wisdom, which is near the end of the catalog, and its first `work`
// hit sat at position 399 of 432 — the last slot in the window. Adding ONE
// lesson anywhere ahead of it that contains the word pushed it to 400 and the
// gate went red, on a lesson whose only uses of the word were inside two verses
// it is required to quote verbatim (Proverbs 16:11, "all the weights of the bag
// are his work"; Proverbs 24:27, "Prepare thy work without"). No edit to that
// lesson's prose could move it, because position is not prose, and the one edit
// that would have — altering a quotation — is forbidden (DR-0459, Layer 0).
//
// So the window measured catalog size, not connection, and this file's own
// header says what it is for: it "fails if a course goes unreachable by the
// plain word for what it teaches." Unreachable is the claim, so reachable is
// what is asked, across the whole index. The cue is untouched — every word in
// COURSE_PLAIN_WORDS must still reach its own course through the live search,
// and the checks below still name any that does not. What is gone is a silent
// dependency on how many lessons happen to sit ahead of the course.
describe('the connection is REAL, measured through the live search (DR-0076 §6)', () => {
  const hits = (query, courseKey) =>
    searchLessons(index, query, index.length).filter((r) => r.courseKey === courseKey);
  const finds = (query, courseKey) => hits(query, courseKey).length > 0;

  it('money reaches Kingdom Economics, whose title has no such word', () => {
    expect(finds('money', 'kingdom-economics')).toBe(true);
  });

  it('sleep reaches Healthy Living, whose title says 3rd-Dimension Witness', () => {
    expect(finds('sleep', 'healthy-living')).toBe(true);
  });

  it('jobs reaches The Functions of the House', () => {
    expect(finds('jobs', 'church-offices')).toBe(true);
  });

  it('loan reaches the Financing course', () => {
    expect(finds('loan', 'financing-debt')).toBe(true);
  });

  it('every declared word finds its own course, with none silently dead', () => {
    const dead = [];
    for (const [key, words] of Object.entries(COURSE_PLAIN_WORDS)) {
      if (!courses.some((c) => c.key === key)) continue;
      for (const w of words) if (!finds(w, key)) dead.push(`${key}: ${w}`);
    }
    expect(dead, dead.slice(0, 10).join(', ')).toEqual([]);
  });

  // PROVEN-TO-CATCH for the reachability form (DR-0076 §3): a check that cannot
  // return false is not a check. A word no lesson of the course carries must
  // come back unreached however large the index is, and the real case — the one
  // the window dropped — must come back reached.
  it('PROVEN-TO-CATCH: a word the course does not carry is unreached, and the one it does is reached', () => {
    expect(finds('zzqqxx', 'eternal-wisdom')).toBe(false);
    expect(finds('work', 'eternal-wisdom')).toBe(true);
  });

  // STRONGER THAN THE WINDOW IT REPLACES, and not catalog-size dependent: a
  // course is not "reached" by a row that carries no lesson. Every declared
  // word must land on a real lesson of its own course, named.
  it('every declared word lands on a REAL lesson of its own course', () => {
    const hollow = [];
    for (const [key, words] of Object.entries(COURSE_PLAIN_WORDS)) {
      if (!courses.some((c) => c.key === key)) continue;
      for (const w of words) {
        const real = hits(w, key).filter((r) => String(r.lessonId || '').trim() && String(r.title || '').trim());
        if (!real.length) hollow.push(`${key}: ${w}`);
      }
    }
    expect(hollow, hollow.slice(0, 10).join(', ')).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a word nobody declared finds nothing, so the search is not matching everything', () => {
    expect(searchLessons(index, 'zzqqxx', 40)).toEqual([]);
  });
});

describe('the line a reader sees', () => {
  it('reads as plain words separated for the eye, not as a sentence', () => {
    expect(plainWordLine('kingdom-economics')).toBe('money · debt · giving · saving · business · work');
  });

  it('is empty for a course with no declaration, so nothing renders', () => {
    expect(plainWordLine('not-a-course')).toBe('');
    expect(plainWordsFor(undefined)).toEqual([]);
  });

  it('every everyday word is genuinely everyday — short, lowercase, no jargon', () => {
    for (const w of EVERYDAY_WORDS) {
      expect(w, `${w} is not lowercase`).toBe(w.toLowerCase());
      expect(w.length, `${w} is long enough to need explaining`).toBeLessThanOrEqual(12);
    }
  });
});
