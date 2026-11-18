// =============================================================================
// kids/trail — a Bible Adventure's trail: the stops a child unlocks in order
// =============================================================================
// Darrell, 2026-11-17 (DR-1523): "Adventure Map: make progress functional.
// Children should unlock the next activity after completing the appropriate
// lesson or challenge." And: "Add three Jonah adventure badges that children
// can earn through actual participation."
//
// GROUNDED, NOT PAINTED (P15; DR-0076): a stop is lit by a learner record and
// by nothing else. The storybook writes `storybook-<id>`; Put the story in
// order writes `order-<id>`; the memory verse game writes `memory-<id>`; Who
// am I? writes `whoami-<hero>`; the Theater writes `episode-<id>` when a
// self-hosted episode plays to its end. The next unlit stop is where the
// guide waits; the stops after it are locked on the trail (the Games tab
// still opens everything, so no child is ever shut out of a game). A stop
// that cannot be done yet (the episode before it is published) reads
// "coming soon" and never blocks the trail. Pure: no React, no I/O.
import { normalizeRecord } from '../youth-zone.js';
import { EPISODES, watchable } from './theater.js';

/** The course a kind of stop records under. */
export const TRAIL_COURSES = Object.freeze({
  read: 'kids-storybooks',
  order: 'kids-games',
  verse: 'kids-memory',
  hero: 'kids-games',
  watch: 'kids-theater',
});

/** The record a finished stop writes: the same shape a lesson writes. */
export function activityRecord({ lessonId, courseKey, passed = true, pct = 100, at = new Date().toISOString() } = {}) {
  return {
    lessonId,
    courseKey,
    ageBand: 'child',
    completedAt: at,
    quiz: { passed: !!passed, pct, at, attempts: 1 },
  };
}

/** The trail of one storybook: five stops, in the order a child walks them. */
export function trailFor(book, episodes = EPISODES) {
  if (!book) return [];
  const ep = episodes.find((e) => e.storybook === book.id) || null;
  const canWatch = !!(ep && watchable(ep));
  const hero = String(book.hero || '');
  return [
    {
      id: 'read',
      title: 'Read the story',
      how: 'Read all eight pages and answer the questions',
      lessonId: `storybook-${book.id}`,
      courseKey: TRAIL_COURSES.read,
      open: `story:${book.id}`,
      available: true,
    },
    {
      id: 'order',
      title: 'Put it in order',
      how: 'Put the eight pages back in the order the Word tells them',
      lessonId: `order-${book.id}`,
      courseKey: TRAIL_COURSES.order,
      open: `order:${book.id}`,
      available: true,
    },
    {
      id: 'verse',
      title: 'Learn the verse',
      how: `Fill every word of ${book.memory}`,
      lessonId: `memory-${book.id}`,
      courseKey: TRAIL_COURSES.verse,
      open: `memory:${book.id}`,
      available: !!book.memory,
    },
    {
      id: 'hero',
      title: 'Who am I?',
      how: `Guess ${hero} from the clues of the Word`,
      lessonId: `whoami-${hero.toLowerCase()}`,
      courseKey: TRAIL_COURSES.hero,
      open: `whoami:${hero}`,
      available: !!hero,
    },
    {
      id: 'watch',
      title: 'Watch the episode',
      how: canWatch ? 'Watch it to the end' : 'Coming soon',
      lessonId: `episode-${book.id}`,
      courseKey: TRAIL_COURSES.watch,
      open: 'theater',
      available: canWatch,
    },
  ];
}

/**
 * The trail with each stop's state from the rows: `lit` (a record exists),
 * `next` (the first unlit stop a child can do now), `locked` (after the next
 * one), `soon` (cannot be done yet, never blocking). `done` is true when every
 * available stop is lit. Signed out, nothing is lit and the first stop is next.
 */
export function trailProgress(book, records = [], episodes = EPISODES) {
  const rows = (records || []).map(normalizeRecord).filter((r) => r.completedAt && r.lessonId);
  const done = new Set(rows.map((r) => r.lessonId));
  const stops = trailFor(book, episodes).map((s) => ({ ...s, lit: s.available && done.has(s.lessonId) }));
  let next = -1;
  const out = stops.map((s, i) => {
    let state;
    if (!s.available) state = 'soon';
    else if (s.lit) state = 'lit';
    else if (next === -1) {
      next = i;
      state = 'next';
    } else state = 'locked';
    return { ...s, state };
  });
  const available = out.filter((s) => s.available);
  const lit = available.filter((s) => s.lit).length;
  return { stops: out, lit, total: available.length, next, done: available.length > 0 && lit === available.length };
}

/** What a tap on a stop does: opens it, or says kindly what to finish first. */
export function stopTap(progress, index) {
  const s = progress && progress.stops ? progress.stops[index] : null;
  if (!s) return { open: null, says: '' };
  if (s.state === 'soon') return { open: null, says: `${s.title} is coming soon. Nothing on your trail waits for it.` };
  if (s.state === 'locked') {
    const before = progress.stops[progress.next];
    return { open: null, says: `Finish "${before ? before.title : 'the stop before'}" first, then this one opens.` };
  }
  return { open: s.open, says: '' };
}
