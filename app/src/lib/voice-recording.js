// =============================================================================
// voice-recording — in-app MIC capture for voice enrollment (record YOUR voice)
// =============================================================================
// Darrell: "can't you have me record a sample and use it for the app?" Yes — this
// is the PRIMARY enrollment path. Recording in-app beats scraping YouTube: clean
// audio, explicit consent (the act of recording IS the consent gesture), and the
// person's CURRENT voice. The recorded sample becomes the speaker reference a
// few-shot clone model (XTTS-v2) conditions on — so once the model endpoint is
// live, this sample reads any app text back in that person's own voice.
//
// This module is the browser-capture half (getUserMedia + MediaRecorder). It is
// null-safe and feature-detected: on a device without mic support the hook reports
// supported:false and the UI shows a graceful note instead of a dead button. The
// pure helpers (mime pick, duration math, min-length check, the read script) are
// exported for unit tests; the React hook is thin glue over them.
import { useCallback, useEffect, useRef, useState } from 'react';

// A short, plain read-aloud script. ~30-60s of clean speech gives a good few-shot
// clone; XTTS-v2 can condition on as little as ~6s, so even a partial read works.
// Warm, scripture-grounded, easy to read aloud.
export const RECORD_SCRIPT = [
  'Hello. This is my voice, and I am recording it so the app can read to me in my own voice.',
  'I am grateful for this day and for the work of my hands.',
  'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.',
  'I will speak clearly and at a steady pace, the way I would read a passage aloud.',
  'When I am done, I can listen back, and re-record if I want a cleaner take.',
];

export const MIN_RECORD_SECONDS = 8;   // XTTS-v2 floor for a usable few-shot clone
export const GOOD_RECORD_SECONDS = 30;  // a comfortably good sample

/** Is in-app voice recording possible in this browser? Never throws. */
export function isRecordingSupported(nav = (typeof navigator !== 'undefined' ? navigator : undefined),
                                     win = (typeof window !== 'undefined' ? window : undefined)) {
  return !!(nav && nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function'
    && win && typeof win.MediaRecorder === 'function');
}

/** Pick the best supported audio mime type for MediaRecorder, or '' for the default. */
export function pickRecorderMime(MR = (typeof MediaRecorder !== 'undefined' ? MediaRecorder : undefined)) {
  if (!MR || typeof MR.isTypeSupported !== 'function') return '';
  // Prefer Opus (small, clean); fall back across browsers.
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const c of candidates) { try { if (MR.isTypeSupported(c)) return c; } catch (_) { /* ignore */ } }
  return '';
}

/** mm:ss for a seconds count. Pure. */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** A sample is long enough to clone from. */
export function meetsMinDuration(seconds) {
  return (Number(seconds) || 0) >= MIN_RECORD_SECONDS;
}

/** Quality label for a given recorded length. */
export function durationQuality(seconds) {
  const s = Number(seconds) || 0;
  if (s < MIN_RECORD_SECONDS) return { tone: 'short', label: `Keep going — at least ${MIN_RECORD_SECONDS}s for a clone` };
  if (s < GOOD_RECORD_SECONDS) return { tone: 'ok', label: 'Good — a longer take clones even better' };
  return { tone: 'great', label: 'Great length for a clean clone' };
}

/**
 * useVoiceRecorder — record / stop / reset a mic sample, with a live duration
 * timer and a playable result. Returns the recorded Blob + an object URL for
 * preview. Releases the mic track on stop and revokes the URL on reset/unmount.
 */
export function useVoiceRecorder() {
  const supported = isRecordingSupported();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const mrRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const urlRef = useRef('');

  const cleanupStream = () => {
    try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()); } catch (_) {}
    streamRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const revokeUrl = () => { try { if (urlRef.current) URL.revokeObjectURL(urlRef.current); } catch (_) {} urlRef.current = ''; };

  const start = useCallback(async () => {
    if (!supported) { setError('Recording is not supported in this browser — try Chrome or Safari.'); return; }
    setError('');
    revokeUrl(); setBlob(null); setUrl(''); setSeconds(0); chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mimeType = pickRecorderMime();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const type = mr.mimeType || 'audio/webm';
        const b = new Blob(chunksRef.current, { type });
        const u = URL.createObjectURL(b);
        urlRef.current = u;
        setBlob(b); setUrl(u);
        cleanupStream();
        setRecording(false);
      };
      mr.start();
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setError(e && e.name === 'NotAllowedError'
        ? 'Microphone permission was blocked — allow the mic and try again.'
        : 'Could not start recording — check the microphone and try again.');
      cleanupStream();
      setRecording(false);
    }
  }, [supported]);

  const stop = useCallback(() => {
    try { mrRef.current && mrRef.current.state !== 'inactive' && mrRef.current.stop(); } catch (_) { cleanupStream(); setRecording(false); }
  }, []);

  const reset = useCallback(() => {
    revokeUrl(); setBlob(null); setUrl(''); setSeconds(0); chunksRef.current = []; setError('');
  }, []);

  useEffect(() => () => { cleanupStream(); revokeUrl(); }, []);

  return { supported, recording, seconds, blob, url, error, start, stop, reset };
}
