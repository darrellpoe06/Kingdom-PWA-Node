// @vitest-environment node
//
// Every lesson in every course is what it should be (2026-10-21).
//
// Darrell, on Revelation — Deep Processing: "None of these have two [stories]...
// make sure all lessons are what they should be... Even the verses of the
// lessons are not here in these courses... Inside each lesson." Measured that
// night across the whole Learn catalog: 827 lessons, 407 carrying two stories,
// 787 quoting the Word inside the lesson. The census (lib/lesson-completeness.js)
// counts both; this gate holds every course to a baseline that only shrinks: a
// lesson short today may be filled, a filled lesson may never fall back, and a
// new lesson must arrive whole.
import { describe, it, expect } from 'vitest';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import { catalogCompleteness, courseCompleteness, completenessLine, quotesTheWord, storyCount } from '../lib/lesson-completeness.js';
import BASELINE from '../lib/lesson-completeness-baseline.json';
import { withWordQuotes } from '../lib/lesson-word-quotes.js';
import { withSideStories } from '../lib/lesson-side-stories.js';

// The same pipeline the Learn tab runs (ChurchLearn: withSideStories(withWordQuotes(...)) over the mounted courses).
const census = catalogCompleteness(withSideStories(withWordQuotes([...buildCatalogCourseDescriptors(), ...buildEternalProcessingCourses()])));
const allowed = (key, field) => new Set(((BASELINE[key] || {})[field]) || []);

describe('no lesson falls short that was not already short', () => {
  for (const field of ['shortOfStories', 'wordOutside']) {
    it(`${field}: only the lessons the baseline names`, () => {
      const fresh = [];
      for (const c of census.courses) {
        const ok = allowed(c.key, field);
        for (const id of c[field]) if (!ok.has(id)) fresh.push(`${c.key}: ${id}`);
      }
      expect(fresh, `newly short (${field}):\n${fresh.join('\n')}`).toEqual([]);
    });
    it(`${field}: the baseline only shrinks (a lesson now whole leaves it)`, () => {
      const stale = [];
      for (const [key, v] of Object.entries(BASELINE)) {
        if (key.startsWith('_')) continue;
        const c = census.courses.find((x) => x.key === key);
        const now = new Set(c ? c[field] : []);
        for (const id of (v[field] || [])) if (!now.has(id)) stale.push(`${key}: ${id}`);
      }
      expect(stale, `now whole, remove from lesson-completeness-baseline.json:\n${stale.join('\n')}`).toEqual([]);
    });
  }
});

describe('the census measures what the reader meets', () => {
  const whole = {
    id: 'w',
    stories: [{ kind: 'parable', title: 'A', body: 'x' }, { kind: 'testimony', title: 'B', body: 'y', source: 's' }],
    lesson: 'Plain words. "For God so loved the world, that he gave" (John 3:16, KJV).',
  };
  it('PROVEN TO CATCH: a lesson that drops a story, or quotes no verse, is counted short', () => {
    expect(courseCompleteness({ key: 'k', schedule: [whole] })).toMatchObject({ lessons: 1, withStories: 1, withWord: 1 });
    const oneStory = { ...whole, stories: whole.stories.slice(0, 1) };
    const sectionOnly = { ...whole, stories: [whole.stories[0], { heading: 'More', body: 'teaching' }] };
    const refOnly = { ...whole, lesson: 'Read John 3:16 in the study.' };
    const c = courseCompleteness({ key: 'k', schedule: [oneStory, sectionOnly, refOnly] });
    expect(c.shortOfStories).toEqual(['w', 'w']);
    expect(c.wordOutside).toEqual(['w']);
  });
  it('both quote styles count, in the lesson or any age band', () => {
    expect(quotesTheWord({ lesson: '**KJV — Daniel 12:4:** *"But thou, O Daniel, shut up the words"*' })).toBe(true);
    expect(quotesTheWord({ lesson: 'none', levels: { teen: '“I am the door: by me if any man enter in” (John 10:9).' } })).toBe(true);
    expect(quotesTheWord({ lesson: 'See (John 10:9).' })).toBe(false);
    expect(storyCount({ stories: [{ kind: 'parable' }, { kind: 'section' }] })).toBe(1);
  });
  it('the course header line says the numbers plainly', () => {
    expect(completenessLine({ lessons: 8, withStories: 8, withWord: 5 })).toBe('Two stories in all 8 lessons · the verses quoted inside 5 of 8');
    expect(completenessLine({ lessons: 0 })).toBe('');
  });
  it('every Eternal pattern quotes its verses (the 2026-10-21 fix holds)', () => {
    for (const c of census.courses.filter((x) => String(x.key).startsWith('eternal-'))) expect(c.wordOutside, c.key).toEqual([]);
  });
});

describe('the stories reach the lesson the reader opens', () => {
  it('PROVEN TO CATCH: an Eternal Revelation pattern teaches its two stories in the lesson arc', async () => {
    const { buildLessonArc } = await import('../lib/lesson-flow.js');
    const rev = census.courses.find((c) => c.key === 'eternal-revelation');
    expect(rev.withStories).toBe(rev.lessons);
    const course = buildEternalProcessingCourses().find((c) => c.key === 'eternal-revelation');
    const taught = (m) => buildLessonArc(m).segments.flatMap((seg) => (seg.audience && seg.audience.stories) || []);
    expect(taught(course.schedule[0]).filter((s) => s.kind === 'parable')).toHaveLength(2);
    expect(taught({ ...course.schedule[0], stories: [] })).toHaveLength(0);
  });
});
