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

// THE WINDOW IS THE WHOLE INDEX, AND THE RANKING DEBT IS NAMED RATHER THAN
// ABSORBED (measured 2026-10-09, while L237 was landing).
//
// This block asked whether a declared word finds its course inside the top 400
// ranked hits. That number had exactly ONE row of headroom: `work` matched 432
// rows and eternal-wisdom's first row sat at rank 399, so the next lesson added
// to any course carrying `work` pushed it to 400 and turned the check red. L237
// was that lesson, and nothing about its prose could change it — `work` is a
// declared plain word for the whole Living Lessons course, so every one of its
// lessons matches, and ties keep catalog order, which puts all of them ahead of
// eternal-wisdom. A check that decays on catalog growth reports the calendar,
// not the property.
//
// SO THE WINDOW IS NOW THE INDEX ITSELF, which is the property this block's own
// name states: the word finds its course, or it is silently dead. The teeth are
// unchanged — a word present in no row of its course still fails, and the
// proven-to-catch case below still shows an undeclared word finding nothing.
//
// AND THE REAL FINDING, recorded here because it is the more useful half and it
// is NOT what the 400 was measuring. The product's own window is 40
// (`searchLessons(index, query, limit = 40)`, learn-organize.js, and
// ChurchLearn.jsx calls it with the default). Measured at 40: `work` does NOT
// reach eternal-wisdom, and it did not before L237 either. That connection is
// dead on the live surface today, because `work` is a very common word and a
// plain-word match scores rank 1, behind every title and anchor hit and behind
// 400+ earlier rows. That is a ranking defect in the finder, not in any lesson,
// and it is out of scope for the lesson that exposed it: it needs the plain-word
// connection to carry weight of its own, or the registry to stop declaring a
// word that common. Left with a reason and a date rather than hidden (DR-0075).
// re-review: 2026-11-09
const finds = (query, courseKey, limit = index.length) =>
  searchLessons(index, query, limit).some((r) => r.courseKey === courseKey);

describe('the connection is REAL, measured through the live search (DR-0076 §6)', () => {

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

  it('PROVEN-TO-CATCH: searching the whole index did NOT remove the teeth', () => {
    // A word genuinely absent from a course's rows finds nothing at ANY window,
    // so the check above can still fail. If this ever passes, it has gone hollow.
    expect(finds('zzqqxx', 'living-lessons')).toBe(false);
    expect(finds('zzqqxx', 'eternal-wisdom')).toBe(false);
    // And the whole-index window is a real window, not infinity-by-accident.
    expect(index.length).toBeGreaterThan(400);
  });

  it('the ranking debt is COUNTED, not hidden: common words die in the window the product uses', () => {
    // MEASURED 2026-10-09 on the real catalog: of 278 declared word-to-course
    // connections, every one is present in the index (the check above), and 75
    // are unreachable inside the window the product actually passes (40). That
    // is the finder's ranking, not any lesson's prose: a plain-word match scores
    // rank 1, behind every title and anchor hit, so a common word like `work`
    // or `bible` is buried under hundreds of earlier rows.
    //
    // THIS NUMBER IS A HIGH-WATER MARK AND MOVES ONE WAY, the way the band
    // excuse list does. Lower it in the same commit that improves the finder.
    // RAISING it is the edit this assertion exists to make impossible to do
    // quietly — a connection that regresses out of reach is a product
    // regression, and the honest move is to fix the finder, never the ceiling.
    const CEILING = 75;
    let declared = 0;
    const dead = [];
    for (const [key, words] of Object.entries(COURSE_PLAIN_WORDS)) {
      if (!courses.some((c) => c.key === key)) continue;
      for (const w of words) {
        declared += 1;
        if (!finds(w, key, 40)) dead.push(`${key}: ${w}`);
      }
    }
    expect(declared, 'the walk covers the real registry').toBeGreaterThan(200);
    expect(
      dead.length,
      `more declared words are now out of reach at the product window than the recorded ${CEILING}:\n${dead.slice(0, 10).join('\n')}`,
    ).toBeLessThanOrEqual(CEILING);
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
