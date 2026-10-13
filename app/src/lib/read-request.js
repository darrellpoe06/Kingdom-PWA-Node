// =============================================================================
// read-request — any surface can say "read this now"
// =============================================================================
// Darrell 2026-08-10, from the presenter bar mid-lesson: "I should be able to
// also listen to the full message or lesson/s from here... easygoing...
// easy-to-use" and "speakers are supposed to be able to push play for reading
// whatever... especially Scriptures."
//
// Until now the ONLY way to start a reading was to find the floating reader,
// open its panel, and pick an action — three taps and a hunt, from a surface
// where the speaker's hands are already busy and a room is watching. A speaker
// standing in front of a congregation should be able to press ONE button that
// says Read aloud, on the screen they are already using.
//
// This is the seam that makes that possible without every surface importing the
// reader: a surface asks, and the reader (which owns the voice, the follow-along
// and the hands-free run) answers. Same shape as read-target.js — plain module
// state, no context plumbing, pure enough to unit-test with no browser.
// =============================================================================

const subs = new Set();

/**
 * Ask the reader to start reading. With a read target registered it reads THAT
 * piece start to finish and keeps going to the next one (the hands-free run);
 * with none, it reads the page.
 *
 * Returns true when a reader was listening — false says plainly that nothing
 * answered, so a caller can tell the truth instead of leaving a dead button.
 */
export function requestRead(detail = {}) {
  let heard = false;
  for (const fn of subs) {
    try { fn(detail || {}); heard = true; } catch { /* one bad listener never blocks the rest */ }
  }
  return heard;
}

/** The reader listens here. Returns the unsubscribe function. */
export function subscribeReadRequest(fn) {
  if (typeof fn !== 'function') return () => {};
  subs.add(fn);
  return () => subs.delete(fn);
}

/** True when a reader is mounted and listening — for a surface that wants to hide its button otherwise. */
export function readerAvailable() {
  return subs.size > 0;
}
