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
//     whole result list on every event, and Android Chrome reports every
//     partial as a cumulative FINAL; the hook commits final words through
//     createFinalCommitter() so each word lands once (DR-0685).
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

// THE 54,115-CHARACTER LESSON (DR-0685, 2026-09-29). A lesson spoken into
// Thinking Space on Android Chrome was saved as "lesson lesson or or how or how
// or how did or how did ..." -- every growing snapshot of the sentence kept as
// new words. Android Chrome, in continuous mode, hands back each partial as a
// result ALREADY MARKED FINAL holding the WHOLE utterance so far, often at a
// fresh result index, sometimes re-reporting the whole list from resultIndex 0,
// sometimes reusing one slot. extractNewFinalTranscript trusts resultIndex and
// isFinal, so on that engine it forwarded every snapshot and the box appended
// them all. The committer below does not trust either:
//   - each result SLOT commits once; the same slot coming back grown commits
//     only the new words (a shrink or a repeat commits nothing);
//   - a NEW slot that merely grows the last committed utterance by prefix
//     (Android's cumulative snapshot) commits only the new words -- the safety
//     net -- within a short window, so a genuine repeat after a real pause is
//     still kept.
// Interim words never reach it: they are shown live and REPLACED each event.

// Android's snapshots arrive well under a second apart; a person repeating
// themselves after a real pause is kept.
export const GROWTH_WINDOW_MS = 10_000;

const wordKey = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean);

/**
 * If `next` is `prev` grown by whole words (case / punctuation tolerant),
 * return just the added words ('' for a repeat or a shrink). Return null when
 * `next` is not a growth of `prev` -- a different utterance. Pure.
 */
export function growingPrefixDelta(prev, next) {
  const a = words(prev).map(wordKey);
  const bRaw = words(next);
  const b = bRaw.map(wordKey);
  if (!a.length || !b.length) return null;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return null;
  return bRaw.slice(a.length).join(' ');
}

/**
 * One committer per dictation session: commit(event) returns the words to
 * append for this result event ('' for none). Final text commits once, however
 * the engine reports it (desktop's per-utterance finals, or Android's
 * cumulative snapshots). `now` is injectable for tests.
 */
export function createFinalCommitter({ now = () => Date.now(), windowMs = GROWTH_WINDOW_MS } = {}) {
  const bySlot = new Map();   // result index -> the text already committed for it
  let last = null;            // { text, at } the most recently committed utterance
  const tidy = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  return {
    // A restarted engine (push-to-end, after a pause) numbers its slots from 0
    // again: forget the slots, keep the last utterance so a restart that
    // re-reports it is still recognized as a repeat.
    restart() { bySlot.clear(); },
    commit(event) {
      const all = (event && event.results) ? Array.from(event.results) : [];
      const out = [];
      // Scan every slot, not only from resultIndex: Android's resultIndex is not
      // trustworthy, and the per-slot memory is what keeps a final to one commit.
      all.forEach((r, i) => {
        if (!r || !(r.isFinal === undefined || r.isFinal)) return;
        const text = tidy(r[0] && r[0].transcript);
        if (!text) return;
        const t = now();
        const had = bySlot.get(i);
        let add;
        if (had !== undefined) {
          if (had === text) return;
          const d = growingPrefixDelta(had, text);
          if (d === '') { bySlot.set(i, had.length >= text.length ? had : text); return; }
          add = d === null ? text : d;   // a slot reused for a new utterance commits whole
        } else if (last && (t - last.at) <= windowMs) {
          const d = growingPrefixDelta(last.text, text);
          add = d === null ? text : d;   // '' = a repeated snapshot: nothing new
        } else {
          add = text;
        }
        bySlot.set(i, text);
        // Track the longest form of the utterance so a later, shorter re-report
        // is recognized as a repeat rather than a new utterance.
        const grew = last && growingPrefixDelta(last.text, text) !== null;
        const keep = grew && words(last.text).length > words(text).length ? last.text : text;
        last = { text: keep, at: t };
        if (add) out.push(add);
      });
      return tidy(out.join(' '));
    },
  };
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
  const committerRef = useRef(createFinalCommitter());
  // The engine's handlers are wired once per start; call the LATEST onTranscript
  // so a surface appending to its own current value never gets a stale one.
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

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
    committerRef.current.restart();
    r.onresult = (e) => {
      // Interim words are shown live and REPLACED each event; final words go
      // through the committer, so they land once (DR-0685).
      const live = extractInterimTranscript(e);
      const chunk = committerRef.current.commit(e);
      if (live || chunk) markHeard();
      setInterim(live);
      if (chunk) {
        finalWordsRef.current += chunk.split(/\s+/).filter(Boolean).length;
        if (typeof onTranscriptRef.current === 'function') onTranscriptRef.current(chunk);
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
    committerRef.current = createFinalCommitter();
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
