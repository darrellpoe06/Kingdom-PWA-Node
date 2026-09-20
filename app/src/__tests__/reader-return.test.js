// @vitest-environment node
// =============================================================================
// You left the page. The reader takes you back to the sentence.
// =============================================================================
// Darrell 2026-09-20, from his phone with Read Aloud showing "Paused": "If and
// when you leave the page to do something necessary and want to come back in
// and listen to what you were just listening to and the system needs to be
// able to keep reading and move them back to the highlighted sentences and
// pages right away from the reader."
//
// THE GAP, traced before a line was written. The sentence was ALREADY recorded
// on every spoken segment, with a fingerprint so a re-paced lesson cannot
// resume in the wrong place; a read ALREADY restarts at it; and the SCREEN-OFF
// case was ALREADY solved end to end. But every one of those recoveries hangs
// off `visibilitychange`, and IN-APP NAVIGATION FIRES NONE. The place was
// remembered and nobody took him to it.
//
// WHY THIS IS A PURE REDUCER. The hard part is not scrolling; it is deciding
// when an offer is HONEST. Two of the four cases must stay silent, and a
// component effect would make those branches untestable without a browser and
// invisible to review. Every branch is pinned below.
import { describe, it, expect } from 'vitest';
import {
  IDLE, foldReturn, offersReturn, returnTarget, returnPlan, returnLabel,
} from '../lib/reader-return.js';

const LESSON = 'll181-run-it-through-the-word';
const target = (owner) => ({ owner, label: 'Lesson', text: 'words' });
const place = (over = {}) => ({ lessonId: LESSON, sentence: 14, sentenceKey: 'abc123', ...over });

// The real sequence: reading a lesson, then navigating away inside the app.
const reading = { target: target(LESSON), isReading: true, paused: false, place: place() };
const navigatedAway = { target: null, isReading: false, paused: false, place: place() };

describe('the four cases, two of which must stay silent', () => {
  it('LEFT MID-READ → offers the way back, and resumes on return', () => {
    let s = foldReturn(IDLE, reading);
    expect(offersReturn(s), 'nothing to offer while the page is still here').toBe(false);
    s = foldReturn(s, navigatedAway);
    expect(offersReturn(s)).toBe(true);
    expect(returnPlan(s, place())).toEqual({
      lessonId: LESSON, scrollTo: 14, sentenceKey: 'abc123', speak: true,
    });
  });

  it('LEFT AFTER PAUSING → offers the way back, and does NOT restart the audio', () => {
    // His pause is his. The DR-0439 lesson was learned by a CONTINUE offer
    // that flashed and vanished; the mirror failure is an offer that takes a
    // deliberate pause and starts talking again.
    let s = foldReturn(IDLE, { ...reading, isReading: false, paused: true });
    s = foldReturn(s, navigatedAway);
    expect(offersReturn(s)).toBe(true);
    expect(returnPlan(s, place()).speak, 'a deliberate pause was restarted').toBe(false);
    expect(returnLabel(s)).toBe('Back to where you stopped');
  });

  it('LEFT AFTER FINISHING → silent, because there is nothing to return to', () => {
    // finishPlace() already ran. Offering a way back to the last sentence of a
    // finished lesson is the exact trap DR-0439 fixed for re-listening.
    let s = foldReturn(IDLE, { ...reading, place: place({ done: true }) });
    s = foldReturn(s, { ...navigatedAway, place: place({ done: true }) });
    expect(offersReturn(s)).toBe(false);
    expect(returnPlan(s, place({ done: true }))).toBeNull();
  });

  it('NEVER LEFT → silent', () => {
    let s = foldReturn(IDLE, reading);
    s = foldReturn(s, reading);
    s = foldReturn(s, reading);
    expect(offersReturn(s)).toBe(false);
  });
});

describe('the offer is spent the moment the page comes back', () => {
  it('returning to the lesson clears the held way back', () => {
    let s = foldReturn(foldReturn(IDLE, reading), navigatedAway);
    expect(offersReturn(s)).toBe(true);
    s = foldReturn(s, { target: target(LESSON), isReading: false, paused: false, place: place() });
    // Not deep-equal to IDLE on purpose: once the page is back the state goes
    // on WATCHING it (that is how the next departure is caught). The contract
    // that matters is that nothing is offered any more.
    expect(offersReturn(s)).toBe(false);
    expect(s.away).toBe(false);
  });

  it('a DIFFERENT lesson opening does not clear or hijack the held one', () => {
    // Wandering to another lesson is not the same as coming back. The offer
    // must still point at the lesson he was actually listening to.
    let s = foldReturn(foldReturn(IDLE, reading), navigatedAway);
    s = foldReturn(s, { target: target('ll99-some-other-lesson'), isReading: false, place: place() });
    expect(offersReturn(s)).toBe(true);
    expect(returnTarget(s, place()).lessonId).toBe(LESSON);
  });
});

describe('PROVEN-TO-CATCH: it never offers a way back it cannot honour', () => {
  it('no place record → no offer', () => {
    const s = foldReturn(foldReturn(IDLE, { ...reading, place: null }), { ...navigatedAway, place: null });
    expect(offersReturn(s)).toBe(false);
  });

  it('a place with no sentence → no offer', () => {
    // The whole ask is the SENTENCE. A place that only knows the lesson would
    // send him to the top, which is the thing he was complaining about.
    const p = place({ sentence: null });
    const s = foldReturn(foldReturn(IDLE, { ...reading, place: p }), { ...navigatedAway, place: p });
    expect(offersReturn(s)).toBe(false);
  });

  it('a page that was never being read → no offer', () => {
    // Merely having a saved place from days ago must not make every
    // navigation pop a way-back offer.
    const s = foldReturn(IDLE, navigatedAway);
    expect(offersReturn(s)).toBe(false);
  });

  it('the plan always carries the SENTENCE to scroll to — that is the half that was missing', () => {
    const s = foldReturn(foldReturn(IDLE, reading), navigatedAway);
    const plan = returnPlan(s, place());
    expect(plan.scrollTo, 'the plan would land him at the top again').toBe(14);
    // and the fingerprint rides along, so a re-paced lesson resolves safely
    expect(plan.sentenceKey).toBe('abc123');
  });
});

describe('what the control says matches how they left', () => {
  it('reads differently for a live read and a deliberate pause', () => {
    const live = foldReturn(foldReturn(IDLE, reading), navigatedAway);
    const paused = foldReturn(foldReturn(IDLE, { ...reading, isReading: false, paused: true }), navigatedAway);
    expect(returnLabel(live)).toBe('Back to where it was reading');
    expect(returnLabel(paused)).toBe('Back to where you stopped');
    expect(returnLabel(IDLE)).toBe('');
  });
});
