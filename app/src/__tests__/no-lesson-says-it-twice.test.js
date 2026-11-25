// "At times it looks like in some places the first few paragraphs of the
// lessons are repeated... why?" (Darrell, 2026-11-25). Measured: the Kids
// lesson's bubble showed the band's opening and section one began with the
// same words in 946 of 946 Kids/Youth/Teen lessons; the new look's Key
// Teaching box repeated a big idea already in the text in 40 of 337.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { bandOpening, lessonPlanForAge } from '../lib/learn-framework.js';
import { openingRepeats, segmentWords, bubbleFor } from '../components/kids/KidsAdventure.jsx';

describe('no lesson says its opening twice', () => {
  it('openingRepeats sees a repeat and only a repeat', () => {
    expect(openingRepeats('God never asked you.', 'God never asked you. And more.')).toBe(true);
    expect(openingRepeats('A greeting.', 'The reading starts elsewhere.')).toBe(false);
    expect(openingRepeats('', 'anything')).toBe(false);
  });
  it('for every Kids, Youth and Teen lesson, the bubble never repeats the first section', () => {
    const twice = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const band of ['child', 'youth', 'teen']) {
        if (!m.levels || !m.levels[band]) continue;
        const opening = bandOpening(m, band).text;
        const first = segmentWords(lessonPlanForAge(m, band).segments[0]);
        const bubble = bubbleFor(opening, m.title, m.bigIdea, first);
        if (bubble && openingRepeats(bubble, first)) twice.push(`${m.id}/${band}`);
      }
    }
    expect(twice).toEqual([]);
  });
});
