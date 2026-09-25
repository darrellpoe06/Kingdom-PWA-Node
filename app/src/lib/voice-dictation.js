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
 * From a continuous-recognition event, return the words still being heard
 * (not yet final), so the box can show them live. Pure.
 */
export function extractInterimTranscript(event) {
  const all = (event && event.results) ? Array.from(event.results) : [];
  const from = (event && typeof event.resultIndex === 'number') ? event.resultIndex : 0;
  return all.slice(from)
    .filter(res => res && res.isFinal === false)
    .map(res => (res && res[0] && res[0].transcript) ? res[0].transcript : '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// THE PHONE THAT HEARS NOTHING (Darrell, 2026-09-24: "it shows like it's
// recording however at the end there are not text in the text box"). The
// engine's error codes, said in words a person can act on. 'audio-capture'
// is what Android reports when something else holds the microphone, and a
// phone call on the same phone always does.
export function explainVoiceError(code) {
  switch (code) {
    case 'audio-capture':
      return "The phone isn't letting the app hear the microphone. A phone call or another app may be using it. Record after the call, or record from a second device with the call on speaker.";
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission is off for PoeTech. Allow the microphone for this site in the browser settings, then try again.';
    case 'network':
      return 'Speaking to type needs an internet connection on this phone. Record instead: the recording is kept and written out later.';
    case 'language-not-supported':
      return 'This phone cannot turn English speech into text here. Record instead.';
    default:
      return `Voice input stopped (${code || 'unknown'}). Type instead, or record.`;
  }
}

// How long a session may run with nothing heard before the surface says so,
// instead of showing "listening" over silence.
export const NOTHING_HEARD_MS = 8000;

// ONE MICROPHONE, ONE HOLDER (2026-09-24, "Never recorded"). A phone gives
// the microphone to one taker. If the Speak button's speech engine is still
// listening when a recording starts, the recording can get silence. Every
// live dictation session registers its stop here; a recorder calls
// releaseSpeechRecognition() before it asks for the microphone.
const liveSessions = new Set();
export function releaseSpeechRecognition() {
  const n = liveSessions.size;
  for (const stopIt of Array.from(liveSessions)) {
    try { stopIt(); } catch (_) { /* a stop that throws is already stopped */ }
  }
  liveSessions.clear();
  return n;
}
export function liveSpeechSessions() { return liveSessions.size; }

/**
 * The verdict when a dictation session ends, pure: did it produce words?
 * 'words' | 'no-words' (the session ran and wrote nothing) | 'none' (no
 * session). The Speak box turns 'no-words' into a plain message, never a
 * silently empty box (the 2026-09-24 defect).
 */
export function sessionOutcome({ ran, finalWords }) {
  if (!ran) return 'none';
  return (Number(finalWords) || 0) > 0 ? 'words' : 'no-words';
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
 *
 * Also returned (2026-09-24): `interim`, the words being heard right now,
 * shown live; `heard`, anything at all reached the engine; `nothingHeard`,
 * the session has run NOTHING_HEARD_MS with nothing heard; and `outcome` of
 * the last session ('words' | 'no-words' | 'none').
 */
export function useVoiceDictation({ onTranscript, lang = 'en-US', capMs = VOICE_SESSION_CAP_MS } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [interim, setInterim] = useState('');
  const [heard, setHeard] = useState(false);
  const [nothingHeard, setNothingHeard] = useState(false);
  const [outcome, setOutcome] = useState('none');
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);   // the SPEAKER's intent — true until they tap Stop
  const startedAtRef = useRef(0);
  const finalWordsRef = useRef(0);
  const heardRef = useRef(false);
  const sessionOpenRef = useRef(false);
  const watchRef = useRef(null);

  const SR = detectSpeechRecognition();
  const supported = !!SR;

  const endSession = () => {
    liveSessions.delete(registered.current);
    if (watchRef.current) { clearTimeout(watchRef.current); watchRef.current = null; }
    if (!sessionOpenRef.current) return;
    sessionOpenRef.current = false;
    setInterim('');
    setNothingHeard(false);
    setOutcome(sessionOutcome({ ran: true, finalWords: finalWordsRef.current }));
  };

  const markHeard = () => {
    if (heardRef.current) return;
    heardRef.current = true;
    setHeard(true);
    setNothingHeard(false);
  };

  // The registry holds ONE stable function per hook that calls the latest stop.
  const latestStop = useRef(null);
  const registered = useRef(() => { if (latestStop.current) latestStop.current(); });
  const stop = () => {
    activeRef.current = false;
    liveSessions.delete(registered.current);
    try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
    setListening(false);
    endSession();
  };
  latestStop.current = stop;

  const startEngine = () => {
    const r = new SR();
    r.continuous = true;        // keep collecting through pauses where honored
    r.interimResults = true;    // show the words as they are heard (2026-09-24)
    r.lang = lang;
    r.onsoundstart = markHeard;
    r.onspeechstart = markHeard;
    r.onresult = (e) => {
      const live = extractInterimTranscript(e);
      const chunk = extractNewFinalTranscript(e);
      if (live || chunk) markHeard();
      setInterim(live);
      if (chunk) {
        finalWordsRef.current += chunk.split(/\s+/).filter(Boolean).length;
        if (typeof onTranscript === 'function') onTranscript(chunk);
      }
    };
    r.onerror = (e) => {
      const code = (e && e.error) || 'unknown';
      // A pause is not an error — onend will restart the session.
      if (activeRef.current && PAUSE_ERRORS.includes(code)) return;
      setError(explainVoiceError(code));
      activeRef.current = false;
      setListening(false);
      endSession();
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
      endSession();
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
    setInterim('');
    setOutcome('none');
    setHeard(false);
    setNothingHeard(false);
    heardRef.current = false;
    finalWordsRef.current = 0;
    activeRef.current = true;
    startedAtRef.current = Date.now();
    try {
      startEngine();
      sessionOpenRef.current = true;
      liveSessions.add(registered.current);
      setListening(true);
      // Never show "listening" over silence: if nothing at all reaches the
      // engine, the surface says so in words.
      watchRef.current = setTimeout(() => { if (activeRef.current && !heardRef.current) setNothingHeard(true); }, NOTHING_HEARD_MS);
    } catch (_) {
      setError('Could not start voice input — type instead.');
      activeRef.current = false;
      setListening(false);
    }
  };

  return {
    supported, listening, error, toggle, stop, interim, heard, nothingHeard, outcome,
    clearError: () => setError(''), clearOutcome: () => setOutcome('none'),
  };
}
