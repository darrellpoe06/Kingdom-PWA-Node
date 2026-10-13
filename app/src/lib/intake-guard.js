// =============================================================================
// intake-guard — nothing in the app interrupts words coming in (DR-0748)
// =============================================================================
// Darrell 2026-10-02, after a multi-minute spoken message was lost to an app
// that put something on the screen while he was still speaking: "let's build
// a safety into the PoeTech App.... so it can't interfere with the message
// intake from a voice message nor a texts as they are occurring."
//
// While a person is RECORDING, DICTATING, TYPING, LISTENING to a reading, or
// has a DOWNLOAD running, the app is theirs. Anything that would take the
// screen or the page from under them waits:
//   - the zero-click update reload (lib/sw-update.js) and the stale-chunk heal
//     reload (lib/chunk-reload-heal.js) are DEFERRED until the intake is over,
//     then run as they would have;
//   - the install nudge and the "Updated" toast (components/PwaPrompts.jsx)
//     are not shown while held;
//   - the arrivals list does not open itself on launch (components/
//     ArrivalsBell.jsx) while held; it opens once the person is free.
// A recording that has FINISHED but not yet been sent is held too, and the
// hold DOES NOT EXPIRE (2026-10-10). It used to release itself after
// RESULT_HOLD_MS and let the zero-click reload take the page -- a timer
// guessing how long a person needs. Darrell, after the outage took a lesson
// he and Christina had just recorded: "an App Reload has to account for the
// specific situations on cellphones and make sure they want the update when
// we push them it should be a choice... so the users can finish without
// failing their process at that moment." So the hold stands until the take is
// sent or dropped, and the update is OFFERED the whole time by the
// FreshnessDot ("Update", tap to apply) rather than applied mid-process.
//
// Holds are named by what they protect ('recording', 'dictation', 'typing',
// 'reading', 'download', 'recording-kept'), so the deferral can be said in
// plain words ("waiting: you are recording"). Everything here is pure module
// state with injectable timers, proven in plain Node; the React hook is thin.
// =============================================================================
import { useEffect, useState } from 'react';

/** Fired on the window each time a hold is taken or released. */
export const INTAKE_EVENT = 'poetech:intake';

/** A deferred action runs only after the intake has been free this long, so a Stop followed at once by a Send is not cut in two. */
export const QUIET_MS = 3000;

/**
 * RETIRED 2026-10-10 as a release timer, kept as a named number because the
 * suite pins it and because it records what the policy USED to be. Nothing
 * schedules a release from it any more: an unsent take holds until it is sent
 * or dropped. See the header.
 */
export const RESULT_HOLD_MS = 10 * 60 * 1000;

/** Typing with no keystroke this long releases the hold (a field left open overnight is not intake). */
export const TYPING_IDLE_MS = 2 * 60 * 1000;

export const INTAKE_KINDS = Object.freeze(['recording', 'recording-kept', 'dictation', 'typing', 'reading', 'download']);

const KIND_WORDS = Object.freeze({
  recording: 'you are recording',
  'recording-kept': 'a recording is waiting to be sent',
  dictation: 'you are speaking',
  typing: 'you are typing',
  reading: 'a reading is playing',
  download: 'a download is running',
});

const holds = new Map();      // id -> { kind, since }
const listeners = new Set();
let nextId = 1;

function announce(win) {
  const snap = { held: holds.size > 0, kinds: intakeKinds() };
  for (const fn of Array.from(listeners)) {
    try { fn(snap); } catch (_) { /* one listener never blocks another */ }
  }
  const w = win || (typeof window !== 'undefined' ? window : null);
  try {
    if (w && typeof w.dispatchEvent === 'function') {
      const evt = typeof w.CustomEvent === 'function' ? new w.CustomEvent(INTAKE_EVENT, { detail: snap }) : { type: INTAKE_EVENT, detail: snap };
      w.dispatchEvent(evt);
    }
  } catch (_) { /* the event is a courtesy */ }
}

/**
 * Take a hold. Returns the release function; releasing twice is harmless.
 * Unknown kinds are kept (a new surface may name a new kind) but normalised
 * to a string.
 */
export function holdIntake(kind, win) {
  const id = nextId++;
  holds.set(id, { kind: String(kind || 'intake'), since: Date.now() });
  announce(win);
  let open = true;
  return function release() {
    if (!open) return false;
    open = false;
    holds.delete(id);
    announce(win);
    return true;
  };
}

/** Is anything coming in right now? */
export function intakeHeld() { return holds.size > 0; }

/** The kinds held right now, each once, in the order first taken. */
export function intakeKinds() {
  const out = [];
  for (const h of holds.values()) if (!out.includes(h.kind)) out.push(h.kind);
  return out;
}

/** Plain words for why the app is waiting: "you are recording", "you are speaking and typing". '' when free. */
export function intakeWords(kinds = intakeKinds()) {
  const words = (kinds || []).map((k) => KIND_WORDS[k] || `${k} is in progress`);
  if (!words.length) return '';
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** Listen for changes. fn({ held, kinds }). Returns the unsubscribe. */
export function subscribeIntake(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * Run fn now if nothing is coming in; otherwise run it once the intake has
 * been free for quietMs. Returns { deferred, cancel }. Timers are injectable.
 */
export function whenIntakeFree(fn, { quietMs = QUIET_MS, setTimeout: setT, clearTimeout: clearT } = {}) {
  const schedule = setT || ((cb, ms) => setTimeout(cb, ms));
  const unschedule = clearT || ((t) => clearTimeout(t));
  if (!intakeHeld()) { fn({ waited: false }); return { deferred: false, cancel() {} }; }
  let timer = null;
  let done = false;
  let off = () => {};
  const finish = () => {
    if (done) return;
    done = true;
    off();
    if (timer !== null) { try { unschedule(timer); } catch (_) { /* ignore */ } timer = null; }
  };
  const onChange = ({ held }) => {
    if (done) return;
    if (held) {
      if (timer !== null) { try { unschedule(timer); } catch (_) { /* ignore */ } timer = null; }
      return;
    }
    if (timer !== null) return;
    timer = schedule(() => {
      timer = null;
      if (done) return;
      if (intakeHeld()) return;   // taken again inside the quiet time; wait for the next release
      finish();
      fn({ waited: true });
    }, quietMs);
  };
  off = subscribeIntake(onChange);
  return { deferred: true, cancel: finish };
}

/** True for a field a person types words into. Pure. */
export function isTypingTarget(el) {
  if (!el || typeof el !== 'object') return false;
  const tag = String(el.tagName || '').toLowerCase();
  if (tag === 'textarea') return !el.readOnly && !el.disabled;
  if (tag === 'input') {
    const type = String(el.type || 'text').toLowerCase();
    return !el.readOnly && !el.disabled && ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes(type);
  }
  try { if (el.isContentEditable === true) return true; } catch (_) { /* not a DOM node */ }
  return false;
}

function hasWords(el) {
  try {
    if (typeof el.value === 'string') return el.value.trim().length > 0;
    return String(el.textContent || '').trim().length > 0;
  } catch (_) { return false; }
}

/**
 * Watch a document for typing. A hold is taken while a text field is focused
 * and has words in it; it is released when the field is left, emptied, or
 * has had no keystroke for idleMs. Returns the stop function.
 */
export function watchTypedIntake(doc, { idleMs = TYPING_IDLE_MS, setTimeout: setT, clearTimeout: clearT, win } = {}) {
  if (!doc || typeof doc.addEventListener !== 'function') return () => {};
  const schedule = setT || ((cb, ms) => setTimeout(cb, ms));
  const unschedule = clearT || ((t) => clearTimeout(t));
  let release = null;
  let idle = null;
  let field = null;
  const drop = () => {
    if (idle !== null) { try { unschedule(idle); } catch (_) { /* ignore */ } idle = null; }
    if (release) { release(); release = null; }
  };
  const armIdle = () => {
    if (idle !== null) { try { unschedule(idle); } catch (_) { /* ignore */ } }
    idle = schedule(() => { idle = null; drop(); }, idleMs);
  };
  const look = (el) => {
    field = el && isTypingTarget(el) ? el : null;
    if (field && hasWords(field)) {
      if (!release) release = holdIntake('typing', win);
      armIdle();
    } else {
      drop();
    }
  };
  const onFocusIn = (e) => look(e && e.target);
  const onFocusOut = () => { field = null; drop(); };
  const onInput = (e) => { if (e && e.target && e.target === field) look(field); else look(e && e.target); };
  doc.addEventListener('focusin', onFocusIn);
  doc.addEventListener('focusout', onFocusOut);
  doc.addEventListener('input', onInput);
  doc.addEventListener('keydown', onInput);
  try { if (doc.activeElement) look(doc.activeElement); } catch (_) { /* no focus yet */ }
  return () => {
    doc.removeEventListener('focusin', onFocusIn);
    doc.removeEventListener('focusout', onFocusOut);
    doc.removeEventListener('input', onInput);
    doc.removeEventListener('keydown', onInput);
    drop();
  };
}

/** React: is anything coming in? Re-renders on each hold or release. */
export function useIntakeHeld() {
  const [held, setHeld] = useState(() => intakeHeld());
  useEffect(() => {
    setHeld(intakeHeld());
    return subscribeIntake(({ held: h }) => setHeld(h));
  }, []);
  return held;
}

/** React: take a hold of `kind` while `on` is true. */
export function useIntakeHold(kind, on) {
  useEffect(() => {
    if (!on) return undefined;
    const release = holdIntake(kind);
    return release;
  }, [kind, on]);
}

/** For tests: drop every hold. */
export function resetIntakeForTests() {
  holds.clear();
  announce();
}
