// =============================================================================
// youth-zone — the Youth Zone's rules are derived, deterministic and honest:
// badges come from rows (proven-to-catch both ways), the week's verse and
// lesson are real and stable within a week, the verse game blanks real words.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  YOUTH_DOORS,
  normalizeDoor,
  doorBandProfile,
  MEMORY_VERSES,
  versesFor,
  weekIndex,
  weeklyPick,
  weeklyVerse,
  weeklyLesson,
  blankWords,
  matchesBlank,
  normalizeRecord,
  BADGES,
  badgesFor,
  encouragement,
} from '../lib/youth-zone.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { LITTLE_LEARNERS_MODULES } from '../lib/little-learners-class.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { parseRef } from '../lib/bible-kjv.js';

const MON = new Date('2026-11-16T15:00:00Z');
const SAT = new Date('2026-11-21T15:00:00Z');
const NEXT_MON = new Date('2026-11-23T15:00:00Z');

describe('the two doors', () => {
  it('are Kids, Teens and Little Ones, each reading at a real age band of a registered course (true ages, DR-1508)', () => {
    expect(YOUTH_DOORS.map((d) => d.key)).toEqual(['kids', 'teens', 'little']);
    expect(YOUTH_DOORS.find((d) => d.key === 'kids').band).toBe('child');
    expect(YOUTH_DOORS.find((d) => d.key === 'teens').band).toBe('youth');
    expect(doorBandProfile('teens', 'teen').id).toBe('teen');
    expect(doorBandProfile('teens', 'nonsense').id).toBe('youth');
    expect(YOUTH_DOORS.find((d) => d.key === 'little').courseKey).toBe('little-learners');
    for (const d of YOUTH_DOORS) {
      expect(doorBandProfile(d.key), d.key).toBeTruthy();
      expect(
        LEARN_CATALOG.some((c) => c.key === d.courseKey),
        d.courseKey
      ).toBe(true);
    }
    expect(normalizeDoor('nonsense')).toBe('kids');
    expect(normalizeDoor('teens')).toBe('teens');
  });
});

describe('memory verses are references the hosted Word can resolve', () => {
  it('every reference parses; Kids gets the short set, Teens all', () => {
    for (const v of MEMORY_VERSES) expect(parseRef(v.ref), v.ref).toBeTruthy();
    expect(versesFor('kids').every((v) => v.kids)).toBe(true);
    expect(versesFor('little').every((v) => v.kids)).toBe(true);
    expect(versesFor('teens')).toHaveLength(MEMORY_VERSES.length);
    expect(MEMORY_VERSES[0].ref).toBe('Psalm 34:3');
  });
  it('the week pick is the same all week and moves the next week', () => {
    expect(weekIndex(MON)).toBe(weekIndex(SAT));
    expect(weekIndex(NEXT_MON)).not.toBe(weekIndex(MON));
    expect(weeklyVerse('kids', MON)).toEqual(weeklyVerse('kids', SAT));
    expect(weeklyPick([], MON)).toBeNull();
    expect(weeklyPick(['a'], MON)).toBe('a');
  });
  it("the week's lesson is a real module of the door's course", () => {
    const k = weeklyLesson('kids', MON);
    const t = weeklyLesson('teens', MON);
    const l = weeklyLesson('little', MON);
    expect(LIVING_LESSONS_MODULES.some((m) => m.id === k.lessonId)).toBe(true);
    expect(k.courseKey).toBe('living-lessons');
    expect(LITTLE_LEARNERS_MODULES.some((m) => m.id === l.lessonId)).toBe(true);
    expect(l.courseKey).toBe('little-learners');
    expect(LIVING_LESSONS_MODULES.some((m) => m.id === t.lessonId)).toBe(true);
    expect(t.courseKey).toBe('living-lessons');
    expect(weeklyLesson('kids', MON)).toEqual(weeklyLesson('kids', SAT));
  });
});

describe('the verse game blanks real words and checks kindly', () => {
  it('blanks every fourth word longer than two letters, the same way for the same seed', () => {
    const text = 'O magnify the LORD with me, and let us exalt his name together.';
    const a = blankWords(text, 7);
    const b = blankWords(text, 7);
    expect(a).toEqual(b);
    expect(a.map((t) => t.word).join(' ')).toBe(text);
    expect(a.filter((t) => t.blank).length).toBeGreaterThan(0);
    for (const t of a.filter((x) => x.blank)) expect(t.answer.length).toBeGreaterThan(2);
    expect(blankWords(text, 7).filter((t) => t.blank)).not.toEqual(blankWords(text, 8).filter((t) => t.blank));
  });
  it('matches ignoring case and punctuation, and nothing else', () => {
    expect(matchesBlank('Together.', 'together')).toBe(true);
    expect(matchesBlank('  TOGETHER ', 'together')).toBe(true);
    expect(matchesBlank('apart', 'together')).toBe(false);
    expect(matchesBlank('', 'together')).toBe(false);
  });
});

describe('badges are derived from rows', () => {
  const read = (iso, extra = {}) => ({ lesson_id: `l-${iso}`, course_key: 'little-learners', completed_at: iso, ...extra });
  const earnedKeys = (rows, now) =>
    badgesFor(rows, { now })
      .filter((b) => b.earned)
      .map((b) => b.key);
  it('no rows, no badge; every badge has copy about learning, never about beating anyone', () => {
    expect(earnedKeys([], MON)).toEqual([]);
    expect(BADGES.map((b) => b.key)).toEqual(['first-step', 'five-lessons', 'first-quiz', 'three-quizzes', 'showed-up', 'kids-reader']);
    for (const b of BADGES) expect(b.how).not.toMatch(/beat|rank|leader|top/i);
  });
  it('one read earns First Step; five earn Five Lessons; reads on three days in the week earn Showed Up', () => {
    expect(earnedKeys([read('2026-11-14T10:00:00Z')], MON)).toEqual(['first-step']);
    const five = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'].map((d) => read(`${d}T10:00:00Z`));
    expect(earnedKeys(five, MON)).toEqual(['first-step', 'five-lessons', 'showed-up']);
  });
  it('quizzes earn Quiz Star and Three in a Row; a youth band earns Little Reader; snake and camel rows both count', () => {
    const q = (n) => ({ lessonId: `q${n}`, courseKey: 'x', quizPassed: true, completedAt: null });
    expect(earnedKeys([q(1)], MON)).toEqual(['first-quiz']);
    expect(earnedKeys([q(1), q(2), q(3)], MON)).toEqual(['first-quiz', 'three-quizzes']);
    expect(earnedKeys([read('2026-11-14T10:00:00Z', { age_band: 'child' })], MON)).toEqual(['first-step', 'kids-reader']);
    expect(normalizeRecord({ lesson_id: 'a', quiz_passed: true })).toMatchObject({ lessonId: 'a', quizPassed: true });
  });
  it('PROVEN-TO-CATCH: take the rows away and the badge goes with them', () => {
    const rows = [read('2026-11-14T10:00:00Z')];
    expect(badgesFor(rows, { now: MON }).find((b) => b.key === 'first-step').earned).toBe(true);
    expect(badgesFor([], { now: MON }).find((b) => b.key === 'first-step').earned).toBe(false);
    // a read older than a week does not count toward Showed Up
    const old = ['2026-10-01', '2026-10-02', '2026-10-03'].map((d) => read(`${d}T10:00:00Z`));
    expect(earnedKeys(old, MON)).not.toContain('showed-up');
  });
  it('encouragement follows what the rows show and never names a score', () => {
    const none = badgesFor([], { now: MON });
    expect(encouragement(none)).toContain('one lesson');
    const all = BADGES.map((b) => ({ ...b, earned: true }));
    expect(encouragement(all)).toContain('teach someone');
    for (const text of [encouragement(none), encouragement(all)]) expect(text).not.toMatch(/\d+ points|score/i);
  });
});
