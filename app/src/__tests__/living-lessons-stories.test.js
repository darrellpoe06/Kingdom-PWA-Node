// @vitest-environment node
//
// Every lesson carries its stories (DR-0215, restored by DR-0855).
//
// Darrell 2026-07-21 set the standard: "Add at least 2 stories to each 25
// minute lesson, add more if they fit and make sense." Nothing enforced it, and
// on 2026-10-09 he asked: "What happened to the having two stories/parables
// inside each lesson?!!!!!!" Measured that day: 146 of 228 lessons carried
// fewer than two; the last lesson to carry them was L166. This gate is the
// machine check that makes it impossible to ship a lesson without its stories
// again, and the proof case below shows it catches exactly that.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { isTeachingSection, storyHeading, storyFootnote } from '../lib/story-truth.js';

export const MIN_STORIES = 2;
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const isStory = (s) => s && (s.kind === 'parable' || s.kind === 'testimony');

/** Lessons that carry fewer than MIN_STORIES real stories (parable or testimony). */
export function lessonsShortOfStories(modules) {
  return modules.filter((m) => (Array.isArray(m.stories) ? m.stories.filter(isStory).length : 0) < MIN_STORIES).map((m) => m.id);
}

describe('every lesson carries at least two stories', () => {
  it('no lesson in the catalog is short of its stories', () => {
    const short = lessonsShortOfStories(LIVING_LESSONS_MODULES);
    expect(short, `short of ${MIN_STORIES} stories:\n${short.join('\n')}`).toEqual([]);
  });
  it('proven to catch: a lesson that drops its stories fails the gate', () => {
    const m = LIVING_LESSONS_MODULES[LIVING_LESSONS_MODULES.length - 1];
    expect(lessonsShortOfStories([{ ...m, stories: [] }])).toEqual([m.id]);
    expect(lessonsShortOfStories([{ ...m, stories: m.stories.filter(isStory).slice(0, 1) }])).toEqual([m.id]);
    expect(lessonsShortOfStories([{ id: 'x' }])).toEqual(['x']);
  });
});

describe('every entry says truthfully what it is', () => {
  it('every entry is a parable, a true story, or a teaching section, and nothing else', () => {
    const bad = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const [i, s] of (m.stories || []).entries()) {
        if (!(isStory(s) || isTeachingSection(s))) bad.push(`${m.id} [${i}]`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it('every story has a title and a real scene; a true story names who lived it', () => {
    const bad = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const [i, s] of (m.stories || []).entries()) {
        if (!isStory(s)) continue;
        if (!String(s.title || '').trim()) bad.push(`${m.id} [${i}] no title`);
        if (words(s.body) < 60) bad.push(`${m.id} [${i}] body ${words(s.body)} words`);
        if (s.kind === 'testimony' && !String(s.source || '').trim()) bad.push(`${m.id} [${i}] testimony without a source`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
  it('a teaching section is never called a parable or a true story', () => {
    const sec = { heading: 'Game Is the Wrong Word', body: 'Teaching.' };
    expect(storyHeading(sec)).toBe('More on this lesson — Game Is the Wrong Word');
    expect(storyHeading(sec)).not.toMatch(/parable|true story/i);
    expect(storyFootnote(sec)).not.toMatch(/parable|true story/i);
    expect(storyHeading({ kind: 'parable', title: 'T', body: 'b' })).toMatch(/Picture this, a parable — T/);
  });
});
