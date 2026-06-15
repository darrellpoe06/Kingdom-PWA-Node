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
// "Dynamic" = the mic appears ONLY where the browser actually supports speech
// recognition (detectSpeechRecognition), and every surface stays fully usable by
// typing where it doesn't. No vendor, no network, no PII leaves the device — the
// Web Speech API runs in the browser.
//
// The imperative bits that are worth testing (feature detection + transcript
// parsing) are pure functions; the React hook is thin glue over them.
import { useRef, useState } from 'react';

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
 * Safe on a malformed/empty event (returns '').
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
 * useVoiceDictation — "type or speak" for any input surface.
 *
 *   const mic = useVoiceDictation({ onTranscript: t => appendToField(t) });
 *   {mic.supported && (
 *     <button onClick={mic.toggle} aria-pressed={mic.listening}>
 *       {mic.listening ? '⏹ Stop' : '🎤 Speak'}
 *     </button>
 *   )}
 *
 * onTranscript receives the final transcript string when the user stops
 * speaking; the caller decides how to merge it (append, replace, etc.).
 */
export function useVoiceDictation({ onTranscript, lang = 'en-US' } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const SR = detectSpeechRecognition();
  const supported = !!SR;

  const stop = () => {
    try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
    setListening(false);
  };

  const toggle = () => {
    if (!supported) {
      setError('Voice input is not supported in this browser — type instead.');
      return;
    }
    if (listening) { stop(); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = lang;
    r.onresult = (e) => {
      const transcript = extractTranscript(e);
      if (transcript && typeof onTranscript === 'function') onTranscript(transcript);
    };
    r.onerror = (e) => {
      setError(`Voice input error: ${(e && e.error) || 'unknown'} — type instead.`);
      setListening(false);
    };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    setError('');
    try {
      r.start();
      setListening(true);
    } catch (_) {
      setError('Could not start voice input — type instead.');
      setListening(false);
    }
  };

  return { supported, listening, error, toggle, stop, clearError: () => setError('') };
}
