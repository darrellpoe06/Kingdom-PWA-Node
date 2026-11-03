// =============================================================================
// bible-timeline-link — a lesson opens the Bible at the timeline
// =============================================================================
// Darrell 2026-11-03: the writing-order timeline belongs "inside the bible we
// already have so users can see the timeline with or without the lesson". A
// lesson's timeline offers "See all 66 books in the Bible"; this is how that
// tap lands on the Bible with the timeline already open, and on the book the
// reader came from.
//
// A plain address (?view=church&sub=scripture), the same road hrefForView gives
// every surface, because a lesson is mounted in places with no nav shell to
// call into. The address cannot carry the timeline itself: the history seed
// keeps only PRESERVED_PARAMS, so the wish rides one sessionStorage entry the
// Bible reader reads ONCE on mount and clears. Storage that throws (private
// mode, blocked site data) just means the Bible opens as it always does.
// =============================================================================

import { hrefForView } from './nav-history.js';

export const BIBLE_TIMELINE_KEY = 'poetech.bible.openTimeline';

/** The address of the Bible: the Scripture room, whose first tab is the full Bible. */
export function bibleHref(opts) {
  return `${hrefForView('church', opts)}&sub=scripture`;
}

/** Ask the next Bible mount to open the timeline, at `book` when given. */
export function requestBibleTimeline(book = '', store) {
  try {
    const s = store || (typeof window !== 'undefined' && window.sessionStorage);
    if (s) s.setItem(BIBLE_TIMELINE_KEY, book ? String(book) : '1');
  } catch (e) { /* storage blocked: the Bible still opens, timeline folded */ }
}

/** Read and clear the wish: null when none, '' for the whole timeline, or a book name. */
export function takeBibleTimelineRequest(store) {
  try {
    const s = store || (typeof window !== 'undefined' && window.sessionStorage);
    if (!s) return null;
    const v = s.getItem(BIBLE_TIMELINE_KEY);
    if (v == null) return null;
    s.removeItem(BIBLE_TIMELINE_KEY);
    return v === '1' ? '' : v;
  } catch (e) { return null; }
}
