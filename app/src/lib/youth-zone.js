// =============================================================================
// youth-zone — the Youth Zone's pure rules (the Love Corner redesign, Phase 2)
// =============================================================================
// The brief (2026-11-12 §6): "a dedicated Youth Zone that children and teenagers
// actually want to visit... Bible trivia games, Scripture memory challenges,
// weekly activities, achievement badges, positive encouragement... different
// experiences for children and teenagers... Rewards should encourage
// participation, learning, kindness, and spiritual growth rather than unhealthy
// competition. For children's accounts... Do not introduce public child
// profiles or unrestricted messaging."
//
// GROUNDED, NOT PAINTED (P15; DR-0076):
//   • The doors are the app's own age bands (lib/learn-framework.js
//     AGE_BANDS). TRUE AGES (DR-1508; the 2026-11-13 audit found the Kids door
//     labeled 6–10 over Little Learners, whose own meta says about 3 to 6,
//     and the Teens door reading at teen with the 11–14 youth band unused):
//     Kids 6–10 reads Living Lessons at `child` (every lesson carries an
//     authored, screened child level); Teens 11–17 reads at `youth` by
//     default and `teen` on a tap (TEEN_BANDS); Little Ones 3–6 is the
//     Little Learners course, kept as its own door inside Kids.
//   • A memory verse's text is never typed here: only the REFERENCE is listed,
//     and the game loads the words from the hosted King James text
//     (lib/bible-kjv.js verseText) at play time. A verse the device cannot
//     load is shown as not loaded, never filled in.
//   • Badges are DERIVED from the learner's real rows (learner_lesson_records):
//     a badge appears only when the rows that earn it exist, and disappears
//     when they do not (proven-to-catch in youth-zone.test.js). No badge is a
//     count of anyone else: there is no leaderboard, by design.
//   • The week's activity is a real lesson from a registered course, chosen
//     deterministically by the ISO week so every child sees the same one and
//     it changes on its own with the calendar.
// Pure: no React, no I/O, `now` passed in.
import { AGE_BANDS } from './learn-framework.js';
import { LITTLE_LEARNERS_MODULES } from './little-learners-class.js';
import { LIVING_LESSONS_MODULES } from './living-lessons-class.js';

const band = (id) => AGE_BANDS.find((b) => b.id === id) || null;

/** The two doors. `band` is the learn-framework age band the door reads at. */
export const YOUTH_DOORS = Object.freeze([
  {
    key: 'kids',
    title: 'Kids',
    range: '6–10',
    band: 'child',
    courseKey: 'living-lessons',
    caption: 'Short bursts, pictures, quick wins',
    cheer: 'You are loved, and you are learning. One small step at a time!',
  },
  {
    key: 'teens',
    title: 'Teens',
    range: '11–17',
    band: 'youth',
    courseKey: 'living-lessons',
    caption: 'Real questions, real challenges',
    cheer: 'Real questions deserve real answers. The Word has them.',
  },
  {
    key: 'little',
    title: 'Little Ones',
    range: '3–6',
    band: 'child',
    courseKey: 'little-learners',
    caption: 'Letters, numbers and first words from the Word, read aloud',
    cheer: 'Big words start small. Yahweh made you, and He loves you!',
  },
]);

/** The Teens door reads at one of these, youth (11–14) by default and teen (15–17) on a tap. */
export const TEEN_BANDS = Object.freeze(['youth', 'teen']);
export const TEEN_BAND_PREF_KEY = 'poetech.youth.teenBand';

export function normalizeTeenBand(id) {
  return TEEN_BANDS.includes(id) ? id : TEEN_BANDS[0];
}

export const DEFAULT_DOOR = 'kids';
export const DOOR_PREF_KEY = 'poetech.youth.door';

export function normalizeDoor(key) {
  return YOUTH_DOORS.some((d) => d.key === key) ? key : DEFAULT_DOOR;
}

export function doorBandProfile(key, teenBand = null) {
  const d = YOUTH_DOORS.find((x) => x.key === normalizeDoor(key));
  return band(d.key === 'teens' && teenBand ? normalizeTeenBand(teenBand) : d.band);
}

/**
 * Memory verses: REFERENCES only (the words come from the hosted KJV at play
 * time). Psalm 34:3 is the church record's own verse; the rest are the verses
 * a Sunday-school child meets first. `kids` marks the shorter ones.
 */
export const MEMORY_VERSES = Object.freeze([
  { ref: 'Psalm 34:3', kids: true },
  { ref: 'John 3:16', kids: true },
  { ref: 'Psalm 23:1', kids: true },
  { ref: '1 John 4:19', kids: true },
  { ref: 'Ephesians 6:1', kids: true },
  { ref: 'Psalm 119:11', kids: false },
  { ref: 'Proverbs 3:5-6', kids: false },
  { ref: 'Philippians 4:13', kids: false },
  { ref: 'Joshua 1:9', kids: false },
  { ref: 'Matthew 22:37-39', kids: false },
]);

/** The verses a door offers: Kids and Little Ones get the short ones, Teens gets them all. */
export function versesFor(doorKey) {
  return normalizeDoor(doorKey) === 'teens' ? MEMORY_VERSES : MEMORY_VERSES.filter((v) => v.kids);
}

/** ISO-ish week number of `now` in UTC (deterministic; a tie-breaker, not a date shown). */
export function weekIndex(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7) + d.getUTCFullYear() * 100;
}

/** Pick one item of a list for this week: the same one all week, the next one next week. */
export function weeklyPick(items, now = new Date()) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[weekIndex(now) % items.length];
}

/** This week's memory verse for a door (a reference; the words load at play time). */
export function weeklyVerse(doorKey, now = new Date()) {
  return weeklyPick(versesFor(doorKey), now);
}

/** This week's lesson for a door: a REAL module of the door's course, with the course key for the link. */
export function weeklyLesson(doorKey, now = new Date()) {
  const d = YOUTH_DOORS.find((x) => x.key === normalizeDoor(doorKey));
  const modules = d.courseKey === 'little-learners' ? LITTLE_LEARNERS_MODULES : LIVING_LESSONS_MODULES;
  const m = weeklyPick(modules, now);
  if (!m) return null;
  return { courseKey: d.courseKey, lessonId: m.id, title: m.title || m.id, bigIdea: m.bigIdea || '' };
}

/**
 * Blank every `every`-th word of a verse, starting at an offset the seed picks,
 * so the same verse blanks the same words all week. Punctuation stays on the
 * word; the answer is compared without it. Returns tokens the game renders:
 * { word, blank, answer } where `answer` is the letters only, lowercased.
 */
export function blankWords(text, seed = 0, every = 4) {
  const words = String(text || '')
    .split(/\s+/)
    .filter(Boolean);
  const step = Math.max(2, every);
  const offset = Math.abs(Number(seed) || 0) % step;
  return words.map((word, i) => {
    const answer = word.replace(/[^A-Za-z']/g, '').toLowerCase();
    const blank = answer.length > 2 && (i + offset) % step === step - 1;
    return { word, blank, answer };
  });
}

/** True when a typed answer matches the blanked word, ignoring case and punctuation. */
export function matchesBlank(input, answer) {
  return (
    String(input || '')
      .replace(/[^A-Za-z']/g, '')
      .toLowerCase() === String(answer || '')
  );
}

/** A learner row from any of the shapes the sync returns, in one shape. */
export function normalizeRecord(r = {}) {
  return {
    lessonId: r.lessonId ?? r.lesson_id ?? null,
    courseKey: r.courseKey ?? r.course_key ?? null,
    completedAt: r.completedAt ?? r.completed_at ?? null,
    quizPassed: r.quizPassed ?? r.quiz_passed ?? null,
    quizPct: r.quizPct ?? r.quiz_pct ?? null,
    ageBand: r.ageBand ?? r.age_band ?? null,
  };
}

/**
 * The badges, each DERIVED from the rows: `earned` is true only when the rows
 * that earn it exist. Order is the order they are shown; the copy encourages
 * learning, kindness and showing up, never beating anyone.
 */
export const BADGES = Object.freeze([
  { key: 'first-step', title: 'First Step', how: 'Read your first lesson', icon: 'sparkle' },
  { key: 'five-lessons', title: 'Five Lessons', how: 'Read five lessons', icon: 'book' },
  { key: 'first-quiz', title: 'Quiz Star', how: 'Pass your first quiz', icon: 'check' },
  { key: 'three-quizzes', title: 'Three in a Row', how: 'Pass three quizzes', icon: 'crown' },
  { key: 'showed-up', title: 'Showed Up', how: 'Read on three different days in one week', icon: 'calendar' },
  { key: 'kids-reader', title: 'Little Reader', how: 'Read a lesson at the Kids or Teens level', icon: 'heart' },
]);

const dayKey = (iso) => String(iso || '').slice(0, 10);

export function badgesFor(records = [], { now = new Date() } = {}) {
  const rows = (records || []).map(normalizeRecord);
  const read = rows.filter((r) => r.completedAt);
  const passed = rows.filter((r) => r.quizPassed === true);
  const weekAgo = now.getTime() - 7 * 86400000;
  const daysThisWeek = new Set(read.filter((r) => Date.parse(r.completedAt) >= weekAgo).map((r) => dayKey(r.completedAt)));
  const youthBand = rows.some((r) => ['child', 'youth', 'teen'].includes(r.ageBand) && (r.completedAt || r.quizPassed));
  const earned = {
    'first-step': read.length >= 1,
    'five-lessons': read.length >= 5,
    'first-quiz': passed.length >= 1,
    'three-quizzes': passed.length >= 3,
    'showed-up': daysThisWeek.size >= 3,
    'kids-reader': youthBand,
  };
  return BADGES.map((b) => ({ ...b, earned: !!earned[b.key] }));
}

/** A word of encouragement that fits what the rows show, never a score. */
export function encouragement(badges = []) {
  const n = badges.filter((b) => b.earned).length;
  if (n === 0) return 'Every badge starts with one lesson. Pick one and begin.';
  if (n < 3) return 'You started. Keep going; the Word grows in you a little every day.';
  if (n < badges.length) return 'Look at you go. Kindness and showing up count as much as answers.';
  return 'Every badge earned. Now teach someone what you learned.';
}
