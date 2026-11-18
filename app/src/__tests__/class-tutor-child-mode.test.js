// @vitest-environment node
// =============================================================================
// Ari reads child mode for real. The flag on LITTLE_LEARNERS_TUTOR_META existed
// since DR-0431 and never reached the prompt (2026-11-13 shell audit §2.6).
// Proven both ways: every child rule is in the prompt when the flag is on, and
// none of them when it is off or absent (DR-0076 §3).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { tutorSystemPrompt, CHILD_MODE_RULES } from '../lib/class-tutor.js';
import { LITTLE_LEARNERS_MODULES, LITTLE_LEARNERS_TUTOR_META } from '../lib/little-learners-class.js';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

describe('child mode in the tutor prompt', () => {
  it('Little Learners, whose meta carries childMode: true, gets every child rule', () => {
    const sys = tutorSystemPrompt(LITTLE_LEARNERS_MODULES[0], LITTLE_LEARNERS_TUTOR_META);
    expect(LITTLE_LEARNERS_TUTOR_META.childMode).toBe(true);
    for (const rule of CHILD_MODE_RULES) expect(sys).toContain(rule);
    expect(sys).toContain(LITTLE_LEARNERS_MODULES[0].title);
  });
  it('a Living Lesson read at the Kids door gets the same rules when its meta is marked childMode', () => {
    const kidsMeta = { ...LIVING_LESSONS_META, childMode: true };
    const sys = tutorSystemPrompt(LIVING_LESSONS_MODULES[0], kidsMeta);
    for (const rule of CHILD_MODE_RULES) expect(sys).toContain(rule);
  });
  it('an adult course, or no meta at all, carries none of the child rules', () => {
    const adult = tutorSystemPrompt(LIVING_LESSONS_MODULES[0], LIVING_LESSONS_META);
    const bare = tutorSystemPrompt(LIVING_LESSONS_MODULES[0]);
    for (const rule of CHILD_MODE_RULES) {
      expect(adult).not.toContain(rule);
      expect(bare).not.toContain(rule);
    }
  });
  it('the rules name the lines a child-facing surface owes: no links, no personal details, a grown-up', () => {
    const joined = CHILD_MODE_RULES.join('\n');
    expect(joined).toMatch(/Never give a link/);
    expect(joined).toMatch(/Never ask the child for their name/);
    expect(joined).toMatch(/grown-up/);
  });
});
