// @vitest-environment node
//
// curriculum-diversity — the living diversity MAP (DR-0215 §5). Proven-to-catch
// (DR-0076): the map must read the REAL modules (never a painted number), catch
// a genuinely skewed curriculum, and report the real one as healthy where it is.
import { describe, it, expect } from 'vitest';
import { measureDiversity, LENGTH_BUCKETS } from '../lib/curriculum-diversity.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const story = (tone, kind = 'parable') => ({ tone, kind, title: 't', body: 'b', verse: 'v' });

describe('measureDiversity — reads the real spread', () => {
  it('reports a balanced, spread curriculum as such', () => {
    const mods = [
      { anchor: { ref: 'John 1:1' }, lesson: 'short one two three.', stories: [story('light'), story('solemn')], inApp: 'x', quiz: { questions: [{}] } },
      { anchor: { ref: 'Genesis 1:1' }, lesson: 'another short lesson here.', stories: [story('solemn'), story('light')], inApp: 'x', quiz: { questions: [{}] } },
      { anchor: { ref: 'Romans 8:1' }, lesson: 'a third one.', stories: [story('light'), story('solemn')], inApp: 'x', quiz: { questions: [{}] } },
    ];
    const d = measureDiversity(mods);
    expect(d.lessonCount).toBe(3);
    expect(d.tone.balanced).toBe(true);
    expect(d.tone.light).toBe(3);
    expect(d.tone.solemn).toBe(3);
    expect(d.topic.distinctBooks).toBe(3);
  });

  it('CATCHES a tone-skewed curriculum (all one register)', () => {
    const mods = Array.from({ length: 4 }, (_, i) => ({
      anchor: { ref: `John ${i + 1}:1` }, lesson: 'x y z.', stories: [story('solemn'), story('solemn')], inApp: 'x',
    }));
    const d = measureDiversity(mods);
    expect(d.tone.balanced).toBe(false);
    expect(d.flags.join(' ')).toMatch(/skewed/i);
  });

  it('CATCHES a topic-concentrated curriculum (one book dominates)', () => {
    const mods = Array.from({ length: 5 }, () => ({
      anchor: { ref: 'John 3:16' }, lesson: 'a b c.', stories: [story('light'), story('solemn')], inApp: 'x',
    }));
    const d = measureDiversity(mods);
    expect(d.topic.concentration).toBeGreaterThan(0.35);
    expect(d.flags.join(' ')).toMatch(/concentrated/i);
  });

  it('flags a uniform interaction format but does not call it a defect', () => {
    const mods = [{ anchor: { ref: 'John 1:1' }, lesson: 'x.', stories: [story('light'), story('solemn')], inApp: 'x', quiz: { questions: [{}] } }];
    const d = measureDiversity(mods);
    expect(d.format.uniform).toBe(true);
    expect(d.flags.join(' ')).toMatch(/expected for a teaching series/i);
  });

  it('never throws on an empty curriculum', () => {
    const d = measureDiversity([]);
    expect(d.lessonCount).toBe(0);
    expect(Object.keys(d.length.buckets)).toEqual(LENGTH_BUCKETS);
  });

  it('the REAL Living Lessons curriculum is diverse on tone and topic', () => {
    const d = measureDiversity(LIVING_LESSONS_MODULES);
    expect(d.lessonCount).toBe(LIVING_LESSONS_MODULES.length);
    expect(d.tone.balanced).toBe(true);                 // ~50/50 light/solemn
    expect(d.topic.distinctBooks).toBeGreaterThanOrEqual(15);
    expect(d.tone.storyCount).toBeGreaterThan(100);     // >=2 stories per lesson
  });
});
