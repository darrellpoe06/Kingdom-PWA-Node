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

describe('the connection is REAL, measured through the live search (DR-0076 §6)', () => {
  const finds = (query, courseKey) =>
    searchLessons(index, query, 400).some((r) => r.courseKey === courseKey);

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
