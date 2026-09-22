// =============================================================================
// voice-dictation — one reusable voice-to-text primitive for every input
// =============================================================================
// The app already had working Web Speech dictation, but it was copy-pasted into
// the Input Center and the Thinking Space "Suggest" box and never reached the
// other input surfaces — so the church "Speak — one place for everything" box
// had no mic at all (Darrell 2026-06-15: "I thought it would auto/dynamically
// choose by text or voice in all input locations"). This extracts the pattern
// once so any surface can add "type OR speak" with three lines.
//
// PUSH-TO-END (Darrell 2026-07-10: "Voice notes don't take long voice notes
// well... long pauses stop it instead of push to end for those inputs or all
// why not?"): the browser's recognizer ends itself on a few seconds of
// silence — a long, thoughtful pause used to silently END the note mid-word.
// The mic is now PUSH-TO-END on every surface (the one-primitive dividend,
// DR-0131): while the speaker has the mic on, a recognizer that ends on a
// pause is transparently RESTARTED and the transcript keeps appending; only
// the speaker's own Stop tap (or the hard session cap) ends the note.
//   • 'no-speech' / 'aborted' during an active session are NOT errors — they
//     are what a pause looks like to the engine; the session rides through.
//   • THE BRAKE: a hard session cap (5 minutes) so a forgotten mic can never
//     listen forever (the three-brakes posture applied to a live microphone —
//     on cap the mic stops with an honest message, never silently).
//   • Duplicate-proof: with continuous recognition the engine re-reports the
//     whole result list on every event; extractNewFinalTranscript() forwards
//     only the results that are BOTH new since the last event AND final, so a
//     pause never re-inserts the sentence before it.
//
// "Dynamic" = the mic appears ONLY where the browser actually supports speech
// recognition (detectSpeechRecognition), and every surface stays fully usable by
// typing where it doesn't. No vendor account, no PII stored — the Web Speech
// API runs through the browser's own speech engine.
//
// The imperative bits that are worth testing (feature detection + transcript
// parsing + the pause-vs-stop decision) are pure functions; the React hook is
// thin glue over them.
import { useRef, useState } from 'react';

// The brake: no session listens longer than this, tap or no tap.
export const VOICE_SESSION_CAP_MS = 5 * 60 * 1000;

// LISTEN TO THE WHOLE THING (Darrell, 2026-09-22, sending a screenshot of the
// Notes box beside a reel playing: "This needs to be able to listen to the
// whole thing").
//
// The five-minute cap above is right for DICTATION -- a person speaking a note
// into a box -- and it is a lid on the other job this mic is asked to do:
// listening to something that PLAYS. A reel, a sermon, a class, an interview
// all run past five minutes, and at five minutes the session ended with
// everything after it simply not heard. The lid, not the microphone, is the
// defect; the same shape as the sticky lesson title earlier today.
//
// So the cap is now SIZED TO THE JOB rather than removed. Long-form is 180
// minutes, which is not a number invented here: it is the self-stop
// workflow-scribe already carries for a long capture, so the two long-listening
// paths in this app stop on the same clock instead of on two opinions.
//
// The brake is still a brake, and all three parts of it survive. It is a HARD
// ceiling a tap cannot extend. It is OPT-IN, so an ordinary note keeps the
// tighter five minutes and no surface starts listening for three hours because
// someone touched a mic. And it ends with an HONEST message that now names the
// real number -- see below, where the message used to say "5 minutes" no matter
// what the cap actually was.
export const LONG_FORM_SESSION_CAP_MS = 180 * 60 * 1000;

// Engine errors that just mean "the speaker paused" — never fatal mid-session.
const PAUSE_ERRORS = ['no-speech', 'aborted'];

/**
 * Return the SpeechRecognition constructor for this browser, or null if voice
 * input isn't supported (so callers can hide the mic and stay type-only).
 */
export function detectSpeechRecognition(win = (typeof window !== 'undefined' ? window : undefined)) {
  if (!win) return null;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * Flatten a SpeechRecognition result event into a single trimmed transcript.
 * Safe on a malformed/empty event (returns ''). (Kept for callers/tests that
 * flatten a whole event; the hook itself uses extractNewFinalTranscript so a
 * continuous session never duplicates earlier sentences.)
 */
export function extractTranscript(event) {
  const results = (event && event.results) ? Array.from(event.results) : [];
  return results
    .map(res => (res && res[0] && res[0].transcript) ? res[0].transcript : '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * From a continuous-recognition result event, return ONLY the newly-finalized
 * text: results from event.resultIndex onward whose isFinal is true (an engine
 * that doesn't mark finality — or a non-continuous engine — falls back to
 * treating the new slice as final so no words are lost).
 */
export function extractNewFinalTranscript(event) {
  const all = (event && event.results) ? Array.from(event.results) : [];
  const from = (event && typeof event.resultIndex === 'number') ? event.resultIndex : 0;
  return all.slice(from)
    .filter(res => !res || res.isFinal === undefined || res.isFinal)
    .map(res => (res && res[0] && res[0].transcript) ? res[0].transcript : '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Render a cap for a person: "5 minutes", "3 hours", "90 minutes". Pure, so the
 * message a speaker reads is testable without a microphone.
 */
export function capMinutes(ms) {
  const mins = Math.round(ms / 60000);
  if (mins % 60 === 0 && mins >= 60) {
    const hrs = mins / 60;
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
  }
  return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
}

/**
 * The pause-vs-stop decision, pure: when the engine ends, should the session
 * restart? Only while the speaker still holds the mic AND the hard cap hasn't
 * passed. Returns 'restart' | 'cap' | 'stopped'.
 */
export function decideOnEngineEnd({ active, startedAt, now, capMs = VOICE_SESSION_CAP_MS }) {
  if (!active) return 'stopped';
  if (typeof startedAt === 'number' && typeof now === 'number' && (now - startedAt) >= capMs) return 'cap';
  return 'restart';
}

/**
 * useVoiceDictation — "type or speak" for any input surface, PUSH-TO-END.
 *
 *   const mic = useVoiceDictation({ onTranscript: t => appendToField(t) });
 *   {mic.supported && (
 *     <button onClick={mic.toggle} aria-pressed={mic.listening}>
 *       {mic.listening ? '⏹ Stop' : '🎤 Speak'}
 *     </button>
 *   )}
 *
 * onTranscript receives each newly-finalized chunk as the speaker talks;
 * pauses do not end the session — only the Stop tap (or the 5-minute cap).
 * The caller decides how to merge chunks (append, replace, etc.).
 */
export function useVoiceDictation({ onTranscript, lang = 'en-US', capMs = VOICE_SESSION_CAP_MS } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);   // the SPEAKER's intent — true until they tap Stop
  const startedAtRef = useRef(0);

  const SR = detectSpeechRecognition();
  const supported = !!SR;

  const stop = () => {
    activeRef.current = false;
    try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
    setListening(false);
  };

  const startEngine = () => {
    const r = new SR();
    r.continuous = true;        // keep collecting through pauses where honored
    r.interimResults = false;
    r.lang = lang;
    r.onresult = (e) => {
      const chunk = extractNewFinalTranscript(e);
      if (chunk && typeof onTranscript === 'function') onTranscript(chunk);
    };
    r.onerror = (e) => {
      const code = (e && e.error) || 'unknown';
      // A pause is not an error — onend will restart the session.
      if (activeRef.current && PAUSE_ERRORS.includes(code)) return;
      setError(`Voice input error: ${code} — type instead.`);
      activeRef.current = false;
      setListening(false);
    };
    r.onend = () => {
      const verdict = decideOnEngineEnd({
        active: activeRef.current,
        startedAt: startedAtRef.current,
        now: Date.now(),
        capMs,
      });
      if (verdict === 'restart') {
        // The engine gave up on a pause; the speaker didn't. Re-arm quietly.
        try { startEngine(); return; } catch (_) { /* fall through to stop */ }
      }
      if (verdict === 'cap') {
        // THE MESSAGE SAYS THE REAL NUMBER. It used to be the literal string
        // "5 minutes" while decideOnEngineEnd already accepted a capMs the hook
        // never passed -- so the moment a caller set a different cap, the app
        // would have told the speaker a time that was not the time. A brake
        // that misreports itself is worse than a brake nobody can see.
        setError(`Paused after ${capMinutes(capMs)} of listening — tap Speak to keep going. Everything you said is kept.`);
      }
      activeRef.current = false;
      setListening(false);
    };
    recognitionRef.current = r;
    r.start();
  };

  const toggle = () => {
    if (!supported) {
      setError('Voice input is not supported in this browser — type instead.');
      return;
    }
    if (listening) { stop(); return; }
    setError('');
    activeRef.current = true;
    startedAtRef.current = Date.now();
    try {
      startEngine();
      setListening(true);
    } catch (_) {
      setError('Could not start voice input — type instead.');
      activeRef.current = false;
      setListening(false);
    }
  };

  return { supported, listening, error, toggle, stop, clearError: () => setError('') };
}
