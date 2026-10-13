// =============================================================================
// reader-return — you left the page; the reader takes you back to the sentence
// =============================================================================
// Darrell 2026-09-20, from his phone with Read Aloud showing "Paused": "If and
// when you leave the page to do something necessary and want to come back in
// and listen to what you were just listening to and the system needs to be
// able to keep reading and move them back to the highlighted sentences and
// pages right away from the reader."
//
// REALITY-TRACE FIRST (DR-0061), because most of this was already built and
// the gap is narrow and specific.
//
//   ALREADY TRUE. The sentence is recorded on EVERY spoken segment
//   (TTSControl rememberSentence -> learn-resume.recordPlace), with a
//   non-reversible fingerprint so a re-paced lesson cannot resume silently in
//   the wrong place. savedStartIndex() starts a read at that sentence rather
//   than the top. tts.js holds position when the SCREEN goes off and re-speaks
//   the current segment on return, and TTSControl offers CONTINUE if the
//   engine's own recovery fails.
//
//   THE GAP. Every one of those recoveries hangs off `visibilitychange` — the
//   screen going dark, or the app being backgrounded. IN-APP NAVIGATION FIRES
//   NO visibilitychange. The reader itself survives (TTSControl is mounted at
//   the app root), but the lesson's DOM unmounts, its ranges point at nodes
//   that no longer exist, and NOTHING uses the intact place record to carry
//   the reader back. The place was remembered; nobody took you to it.
//
// THE SIGNAL THIS MODULE IS BUILT ON, and why no new bookkeeping was added:
// a surface that owns a reading registers it with `setReadTarget(owner, ...)`
// and its unmount calls `clearReadTarget(owner)`. So leaving the page ALREADY
// emits a precise, owner-keyed event — the target goes from {owner: X} to null
// while the place record still names lesson X and a sentence in it. That
// transition IS "the reading lost its page", and it needs no visibility event,
// no timer and no extra state.
//
// WHY A PURE REDUCER RATHER THAN AN EFFECT. The hard part here is not the
// scrolling; it is deciding WHEN an offer is honest. Four cases have to come
// apart cleanly, and two of them must stay silent:
//
//   left mid-read        -> offer, and resume on return          (the ask)
//   left after PAUSING   -> offer, do NOT auto-resume            (his pause is his)
//   left after FINISHING -> silent (finishPlace already ran)     (nothing to return to)
//   never left           -> silent                               (obviously)
//
// Encoding that in a component effect would make it untestable without a
// browser and invisible to review. As a reducer it is nine lines and every
// branch is pinned below.
//
// AND IT NEVER NAGS A DELIBERATE PAUSE (the DR-0439 lesson, learned the hard
// way when a CONTINUE offer flashed and vanished). Pausing is a reader's own
// act: the way back is OFFERED so they can take it in one tap, and the audio
// is never restarted for them.
// =============================================================================

/** Nothing has happened yet. */
export const IDLE = Object.freeze({ away: false, owner: null, sentence: null, wasReading: false, held: false });

const ownerOf = (target) => (target && target.owner) || null;

/**
 * Fold one (target, isReading, place) observation into the return state.
 *
 * Pure: no DOM, no timers, no storage. `prev` is the last state, `obs` is what
 * the reader can see right now.
 *
 *   obs.target    the live read-target registry value, or null
 *   obs.isReading whether the engine is speaking (a PAUSE still counts as a
 *                 live reading everywhere else in this app, so the caller
 *                 passes `paused` separately rather than folding it in here)
 *   obs.paused    whether the reader paused on purpose
 *   obs.place     the saved place record { lessonId, sentence, ... }
 */
export function foldReturn(prev = IDLE, obs = {}) {
  const { target, isReading = false, paused = false, place = null } = obs;
  const owner = ownerOf(target);
  const lessonId = place && place.lessonId ? place.lessonId : null;
  const sentence = place && Number.isFinite(place.sentence) ? place.sentence : null;
  const finished = !!(place && place.done);

  // THE READING'S PAGE IS HERE. Watch it, and remember whether it is live —
  // this is the state the first version dropped, which is why the offer could
  // never fire: by the time the unmount arrived, nothing knew a read had been
  // running on that page a moment earlier.
  if (owner && lessonId && owner === lessonId) {
    return {
      away: false,
      owner: lessonId,
      sentence,
      wasReading: isReading && !paused,
      // Worth carrying back to only if there is a sentence to carry back TO,
      // it was live or deliberately paused, and it is not already finished.
      held: (isReading || paused) && !finished && sentence !== null,
    };
  }

  // THE PAGE WENT AWAY while we were watching something worth holding.
  if (!owner && !prev.away && prev.held) {
    return { away: true, owner: prev.owner, sentence: prev.sentence, wasReading: prev.wasReading, held: true };
  }

  // Already holding: keep holding. Wandering into ANOTHER lesson is not the
  // same as coming back, and must not hijack where he actually was.
  if (prev.away) return prev;

  return IDLE;
}

/** Should the reader show a way back right now? */
export function offersReturn(state) {
  return !!(state && state.away && state.owner && state.sentence !== null);
}

/**
 * Where the way back points. Never a bare index: the sentence fingerprint the
 * place record carries is what makes a resume safe across a re-paced lesson,
 * so callers resolve through learn-resume.findSentence rather than trusting
 * the number (lib/learn-resume.js).
 */
export function returnTarget(state, place = null) {
  if (!offersReturn(state)) return null;
  return {
    lessonId: state.owner,
    sentence: state.sentence,
    sentenceKey: (place && place.sentenceKey) || null,
    resume: !!state.wasReading,
  };
}

/**
 * Taking the way back: what the reader should DO on arrival.
 *
 * `scrollTo` is always the sentence — that is the half he asked for that did
 * not exist ("move them back to the highlighted sentences"). `speak` honours
 * how they left: reading resumes, a deliberate pause does not restart.
 */
export function returnPlan(state, place = null) {
  const t = returnTarget(state, place);
  if (!t) return null;
  return { lessonId: t.lessonId, scrollTo: t.sentence, sentenceKey: t.sentenceKey, speak: t.resume };
}

/** One honest line for the control, matching how they actually left. */
export function returnLabel(state) {
  if (!offersReturn(state)) return '';
  return state.wasReading ? 'Back to where it was reading' : 'Back to where you stopped';
}
