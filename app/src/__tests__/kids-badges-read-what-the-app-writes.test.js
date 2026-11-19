// @vitest-environment node
// =============================================================================
// The badge shelf reads the record the app itself writes (DR-0076; found on the
// 2026-11-18 J2 phone walk: a Jonah finish with every answer right left the
// Great Fish badge dark, because the storybook writes `quiz: { passed }` and
// the normalizer read only `quizPassed` / `quiz_passed`). Three shapes, one
// answer. Proven to catch: the nested shape alone used to normalize to null.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { normalizeRecord, badgesFor } from '../lib/youth-zone.js';
import { storybookRecord } from '../components/kids/Storybook.jsx';
import { STORYBOOKS } from '../lib/kids/storybooks.js';

const jonah = STORYBOOKS.find((b) => b.id === 'jonah');

describe('badges read the record the app writes', () => {
  it('the three record shapes normalize to the same quiz result', () => {
    const at = '2026-11-18T15:00:00.000Z';
    const fromDb = { lesson_id: 'storybook-jonah', completed_at: at, quiz_passed: true, quiz_pct: 100 };
    const flat = { lessonId: 'storybook-jonah', completedAt: at, quizPassed: true, quizPct: 100 };
    const written = storybookRecord(jonah, { passed: true, pct: 100, at });
    for (const r of [fromDb, flat, written]) {
      const n = normalizeRecord(r);
      expect(n.lessonId).toBe('storybook-jonah');
      expect(n.quizPassed).toBe(true);
      expect(n.quizPct).toBe(100);
    }
    expect(normalizeRecord(storybookRecord(jonah, { passed: false, pct: 33, at })).quizPassed).toBe(false);
    expect(normalizeRecord({ lessonId: 'x', completedAt: at }).quizPassed).toBeNull();
  });
  it('a Jonah finish with every answer right earns Great Fish before any round trip', () => {
    const rows = [storybookRecord(jonah, { passed: true, pct: 100 })];
    const earned = Object.fromEntries(badgesFor(rows).map((b) => [b.key, b.earned]));
    expect(earned['great-fish']).toBe(true);
    expect(earned['first-quiz']).toBe(true);
    const notYet = Object.fromEntries(badgesFor([storybookRecord(jonah, { passed: false, pct: 66 })]).map((b) => [b.key, b.earned]));
    expect(notYet['great-fish']).toBe(false);
  });
});
