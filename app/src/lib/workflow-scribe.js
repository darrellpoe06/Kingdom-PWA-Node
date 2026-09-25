// =============================================================================
// workflow-scribe — the Scribe capture core (record workflows on a screen, and
// long meetings/conversations) — Phase 1 of the scribe function.
// =============================================================================
// Darrell 2026-07-27: "Can we build a scribe type function inside PoeTech…"
// + "I want to be able to record whole meetings… 30min... 1hr..." + "record
// workflows on a screen to get the required features and MVP." Research review:
// docs/99-session-notes/2026-07-27-scribe-function-research-review.md.
//
// This module is the browser-capture half, the long-session sibling of
// voice-recording.js. Two capture kinds:
//   'workflow' — screen capture (getDisplayMedia) + optional mic narration; the
//                operator marks steps while working; the manifest's step list is
//                the seed of the auto-generated step-by-step guide.
//   'meeting'  — mic capture (getUserMedia) for a whole meeting/conversation;
//                the manifest feeds whisper-gpu → minutes on the NAS.
//
// Long-session hardening (PERPETUAL-PIPELINE-HEALTH): the recorder emits a chunk
// every SCRIBE_CHUNK_MS, so a crash or tab kill loses at most one chunk, never
// the hour; a Screen Wake Lock is requested so a phone doesn't sleep the
// recorder; the duration cap matches ministry-meetings' 180-min ceiling so a
// forgotten recorder self-stops.
//
// Consent is a BUILD REQUIREMENT, not polish: Illinois is an all-party-consent
// state for private conversations (720 ILCS 5/14), so a 'meeting' capture will
// not start until every named party has consented; a 'workflow' capture requires
// the operator's own explicit confirmation. The consent record travels in the
// session manifest (DATA-AS-EMPOWERMENT: audit trail, opt-in per stream).
//
// Everything below the hook is pure and unit-tested; the hook is thin glue.
import { useCallback, useEffect, useRef, useState } from 'react';
import { pickRecorderMime } from './voice-recording.js';
import { releaseSpeechRecognition } from './voice-dictation.js';

// Aligned with lib/ministry-meetings.js maxDurationMin — one ceiling, one truth.
export const SCRIBE_MAX_DURATION_MIN = 180;
// One chunk per minute: a crash loses ≤ 1 minute of a 1-hour recording.
export const SCRIBE_CHUNK_MS = 60_000;
export const SCRIBE_KINDS = ['workflow', 'meeting'];

/** Is screen-workflow capture possible in this browser? Never throws. */
export function isScreenCaptureSupported(nav = (typeof navigator !== 'undefined' ? navigator : undefined),
                                         win = (typeof window !== 'undefined' ? window : undefined)) {
  return !!(nav && nav.mediaDevices && typeof nav.mediaDevices.getDisplayMedia === 'function'
    && win && typeof win.MediaRecorder === 'function');
}

/** Is mic (meeting) capture possible? Never throws. */
export function isMicCaptureSupported(nav = (typeof navigator !== 'undefined' ? navigator : undefined),
                                      win = (typeof window !== 'undefined' ? window : undefined)) {
  return !!(nav && nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function'
    && win && typeof win.MediaRecorder === 'function');
}

/**
 * Build the consent record that travels with the session. Parties is
 * [{ name, consented }]. allConsented is true only when every named party
 * consented AND there is at least one party.
 */
export function buildConsent(parties) {
  const list = (Array.isArray(parties) ? parties : [])
    .map((p) => ({ name: String((p && p.name) || '').trim(), consented: !!(p && p.consented) }))
    .filter((p) => p.name);
  return { parties: list, allConsented: list.length > 0 && list.every((p) => p.consented) };
}

/**
 * The start gate. Returns { ok, reason }. A capture that fails this gate never
 * touches getDisplayMedia/getUserMedia — the refusal is the feature.
 */
export function canStartCapture({ kind, supported, consent } = {}) {
  if (!SCRIBE_KINDS.includes(kind)) return { ok: false, reason: 'unknown-kind' };
  if (!supported) return { ok: false, reason: 'not-supported' };
  const c = consent || { parties: [], allConsented: false };
  if (!c.allConsented) {
    return { ok: false, reason: kind === 'meeting' ? 'all-party-consent-required' : 'operator-consent-required' };
  }
  return { ok: true, reason: '' };
}

/** The 180-min self-stop. */
export function capExceeded(seconds) {
  return (Number(seconds) || 0) >= SCRIBE_MAX_DURATION_MIN * 60;
}

/** Deterministic, idempotent chunk name — re-uploading the same index overwrites, never duplicates. */
export function chunkName(sessionId, index) {
  return `${sessionId}.${String(index).padStart(5, '0')}.webm`;
}

/** Add a step marker (workflow kind). Pure: returns the new array or throws on misuse. */
export function addStepMarker(steps, { label, atSeconds, recording }) {
  if (!recording) throw new Error('step-marker-requires-recording');
  const at = Number(atSeconds);
  if (!Number.isFinite(at) || at < 0) throw new Error('step-marker-bad-time');
  const text = String(label || '').trim() || `Step ${(steps || []).length + 1}`;
  return [...(steps || []), { index: (steps || []).length + 1, label: text, atSeconds: at }];
}

/** The session manifest — the single record the NAS ingest verifies against. */
export function buildManifest({ sessionId, kind, mime, startedAtIso, seconds, chunkCount, steps, consent }) {
  return {
    v: 1,
    sessionId: String(sessionId || ''),
    kind,
    mime: String(mime || ''),
    startedAt: String(startedAtIso || ''),
    seconds: Math.max(0, Math.floor(Number(seconds) || 0)),
    chunkCount: Math.max(0, Math.floor(Number(chunkCount) || 0)),
    steps: Array.isArray(steps) ? steps : [],
    consent: consent || { parties: [], allConsented: false },
  };
}

/**
 * Manifest integrity check — the proven-to-catch half. Catches: no chunks,
 * missing/invalid consent, over-cap duration, unknown kind, missing session id.
 */
export function validateManifest(m) {
  const problems = [];
  if (!m || typeof m !== 'object') return { ok: false, problems: ['no-manifest'] };
  if (!m.sessionId) problems.push('missing-session-id');
  if (!SCRIBE_KINDS.includes(m.kind)) problems.push('unknown-kind');
  if (!m.chunkCount || m.chunkCount < 1) problems.push('no-chunks');
  if (!m.consent || !m.consent.allConsented) problems.push('consent-missing');
  if ((Number(m.seconds) || 0) > SCRIBE_MAX_DURATION_MIN * 60) problems.push('over-duration-cap');
  return { ok: problems.length === 0, problems };
}

/**
 * createChunkUploader — sovereign upload with retry/backoff (try-catch every
 * external I/O). fetchImpl/sleep are injectable so tests prove the retry path
 * actually retries. Endpoint is the SAME-ORIGIN /scribe route (never the
 * absolute Funnel URL — transport memory / DR-0083).
 */
export function createChunkUploader({ endpoint, token, fetchImpl, retries = 3, backoffMs = 500, sleep } = {}) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  return {
    async put({ sessionId, index, track }, blob) {
      if (!doFetch) return { ok: false, attempts: 0, error: 'no-fetch' };
      let attempts = 0;
      let lastError = '';
      while (attempts < retries) {
        attempts += 1;
        try {
          const form = new FormData();
          form.append('file', blob, chunkName(sessionId, index));
          form.append('sessionId', sessionId);
          form.append('index', String(index));
          form.append('track', track || 'main');
          const res = await doFetch(`${endpoint}/chunk`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form,
          });
          if (res && res.ok) return { ok: true, attempts };
          lastError = `http-${res ? res.status : 'no-response'}`;
        } catch (e) {
          lastError = (e && e.message) || 'network-error';
        }
        if (attempts < retries) await wait(backoffMs * attempts);
      }
      return { ok: false, attempts, error: lastError };
    },
  };
}

// THE MICROPHONE THAT GIVES SILENCE (2026-09-24). Darrell recorded a
// conversation with a friend who was on a phone call, spoke right at the mic,
// and nothing was captured, not even his own voice. On Android a live call
// owns the microphone: a page on the same phone gets digital silence (true
// zeros), or is refused. A recorder that shows "recording" over zeros is the
// failure. So the stream is measured (an AnalyserNode on the same stream) and
// a run of digital silence is SAID on screen.
export const DIGITAL_SILENCE_PEAK = 0.0005;   // about -66 dBFS; a real room is never this quiet with processing off
export const SILENCE_WARN_SECONDS = 5;

/** The loudest sample in a frame of float samples (-1..1). Pure. */
export function peakLevel(samples) {
  let peak = 0;
  if (!samples) return 0;
  for (let i = 0; i < samples.length; i += 1) {
    const v = Math.abs(samples[i] || 0);
    if (v > peak) peak = v;
  }
  return peak;
}

/**
 * Plain words for a run of digital silence, or '' while the mic is hearing.
 * Counts CONSECUTIVE silent seconds, so a call that takes the mic mid-way is
 * caught too; a quiet room is never true zeros. Pure.
 */
export function silenceMessage({ silentSeconds, warnAfter = SILENCE_WARN_SECONDS, recordingSeconds = null, bytes = null }) {
  // No bytes at all after the recorder should have handed some over (it
  // hands a slice every second) is the same failure seen from the other side.
  if (bytes === 0 && typeof recordingSeconds === 'number' && recordingSeconds >= warnAfter) {
    return "The phone isn't giving the app any sound — a phone call, another app, or the Speak button may be holding the microphone. Stop, close the other app or end the call, and start again.";
  }
  if ((Number(silentSeconds) || 0) < warnAfter) return '';
  return "The phone isn't letting the app hear the microphone — a phone call may be using it. On a call, put it on speaker and record from a second device, or record after the call.";
}

/**
 * The verdict on a finished take, pure: is there something to send?
 * { ok, reason } — never offers Send for an empty or silent take.
 */
export function takeVerdict(result) {
  const blob = result && result.blob;
  if (!blob || !blob.size) return { ok: false, reason: 'Nothing was recorded — the phone gave the app no sound at all. A phone call, another app, or the Speak button may have been holding the microphone.' };
  if (result.measured && !result.heardSound) return { ok: false, reason: 'Nothing was recorded — the microphone gave only silence the whole time. A phone call, another app, or the Speak button may have been holding it.' };
  return { ok: true, reason: '' };
}

/** "12 KB" for a byte count, for the live "captured" line. Pure. */
export function formatBytes(n) {
  const b = Math.max(0, Number(n) || 0);
  if (b < 1024) return `${b} bytes`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/** getUserMedia refusals, in words a person can act on. Pure. */
export function explainMicError(e) {
  const name = (e && e.name) || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone permission is off for PoeTech. Allow the microphone for this site in the browser settings, then try again.';
  if (name === 'NotReadableError' || name === 'AbortError') return "The phone won't give the app the microphone. A phone call or another app is using it. Record after the call, or from a second device with the call on speaker.";
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No microphone was found on this device.';
  return 'Could not start recording. Check the microphone and try again.';
}

function newSessionId() {
  try { return crypto.randomUUID(); } catch (_) {
    return `scribe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * useWorkflowScribe — the thin React glue over the pure core. Records screen
 * ('workflow') or mic ('meeting') in SCRIBE_CHUNK_MS chunks, requests a wake
 * lock, self-stops at the 180-min cap or when the user ends the screen share,
 * and yields { blob, url, manifest, chunks } on stop.
 */
export function useWorkflowScribe() {
  const screenSupported = isScreenCaptureSupported();
  const micSupported = isMicCaptureSupported();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null); // { blob, url, manifest }
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // the same refusal, in plain words
  const [silentSeconds, setSilentSeconds] = useState(0);
  const [heardSound, setHeardSound] = useState(false);
  const sampleTimerRef = useRef(null);
  const [bytes, setBytes] = useState(0);
  const [level, setLevel] = useState(0);
  const bytesRef = useRef(0);
  const levelRef = useRef(null);  // { ctx, analyser, buf } while a mic stream is measured
  const silentRef = useRef(0);
  const heardRef = useRef(false);

  const mrRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const wakeRef = useRef(null);
  const sessionRef = useRef(null);
  const secondsRef = useRef(0);
  const stepsRef = useRef([]);
  const urlRef = useRef('');

  const cleanup = () => {
    try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()); } catch (_) {}
    streamRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try { wakeRef.current && wakeRef.current.release && wakeRef.current.release(); } catch (_) {}
    wakeRef.current = null;
    if (sampleTimerRef.current) { clearInterval(sampleTimerRef.current); sampleTimerRef.current = null; }
    try { levelRef.current && levelRef.current.ctx && levelRef.current.ctx.close && levelRef.current.ctx.close(); } catch (_) {}
    levelRef.current = null;
  };

  // One reading per second of the loudest sample on the recording stream.
  // MEASURED IN A REAL CHROMIUM (scripts/mic-record-probe.mjs, 2026-09-24):
  // an AudioContext made after the await for the microphone starts SUSPENDED
  // (the tap's permission to play sound has lapsed), and a suspended context
  // reads true zeros while the recorder is capturing real audio. Counting
  // those zeros would have told a person "Nothing was recorded" about a good
  // take. So the context is made inside the tap, resumed, and a reading only
  // counts while it is actually running; an unmeasured take is never called
  // silent (unknown is not silence).
  const measuredRef = useRef(0);
  // The loudest moment of each second: five short looks a second, not one
  // 40-millisecond glance that can land between two words.
  const windowPeakRef = useRef(-1);
  const sampleLevel = () => {
    const lv = levelRef.current;
    if (!lv) return;
    try {
      if (lv.ctx && lv.ctx.state && lv.ctx.state !== 'running') {
        try { lv.ctx.resume && lv.ctx.resume(); } catch (_) { /* next look */ }
        return;
      }
      lv.analyser.getFloatTimeDomainData(lv.buf);
      windowPeakRef.current = Math.max(windowPeakRef.current, peakLevel(lv.buf));
    } catch (_) { /* a meter that cannot read never blocks the recording */ }
  };
  const measureLevel = () => {
    const lv = levelRef.current;
    if (!lv) return;
    try {
      const got = windowPeakRef.current;
      windowPeakRef.current = -1;
      if (got < 0) return; // nothing measured this second: unknown, never silence
      measuredRef.current += 1;
      const peak = got;
      setLevel(peak);
      if (peak < DIGITAL_SILENCE_PEAK) {
        silentRef.current += 1;
      } else {
        silentRef.current = 0;
        if (!heardRef.current) { heardRef.current = true; setHeardSound(true); }
      }
      setSilentSeconds(silentRef.current);
    } catch (_) { /* a meter that cannot read never blocks the recording */ }
  };

  const stop = useCallback(() => {
    try { mrRef.current && mrRef.current.state !== 'inactive' && mrRef.current.stop(); }
    catch (_) { cleanup(); setRecording(false); }
  }, []);

  // Options (2026-09-24, the recorded conversation on the Notes box):
  //   audio              — getUserMedia audio constraints for a 'meeting'
  //   audioBitsPerSecond — so three hours of speech fits the 50 MB upload
  //   measureLevel       — watch the stream for digital silence (see above)
  //   timesliceMs        — how often the recorder hands over audio (1000 for a
  //                        lesson, so bytes are seen arriving every second)
  const start = useCallback(async ({ kind, consent, audio, audioBitsPerSecond, measureLevel: watchLevel = false, timesliceMs = SCRIBE_CHUNK_MS }) => {
    const supported = kind === 'workflow' ? screenSupported : micSupported;
    const gate = canStartCapture({ kind, supported, consent });
    if (!gate.ok) { setError(gate.reason); setErrorMessage(''); return gate; }
    setError(''); setErrorMessage(''); setResult(null); setSteps([]); setSeconds(0);
    setSilentSeconds(0); setHeardSound(false); silentRef.current = 0; heardRef.current = false;
    setBytes(0); setLevel(0); bytesRef.current = 0;
    // One microphone, one holder: a live Speak session is stopped first.
    if (kind === 'meeting') releaseSpeechRecognition();
    // The meter's AudioContext is made NOW, inside the tap, and resumed.
    measuredRef.current = 0;
    let meterCtx = null;
    if (watchLevel) {
      try {
        const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
        if (AC) { meterCtx = new AC(); if (meterCtx.resume) meterCtx.resume().catch(() => {}); }
      } catch (_) { meterCtx = null; }
    }
    chunksRef.current = []; stepsRef.current = []; secondsRef.current = 0;
    try { if (urlRef.current) URL.revokeObjectURL(urlRef.current); } catch (_) {}
    urlRef.current = '';
    try {
      const stream = kind === 'workflow'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ audio: audio || { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      if (meterCtx) {
        try {
          const analyser = meterCtx.createAnalyser();
          analyser.fftSize = 2048;
          // The source node is HELD (source: below). Measured in Chromium: a
          // MediaStreamAudioSourceNode that nothing references is collected,
          // and the analyser behind it then reads true zeros for the whole take.
          const source = meterCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          levelRef.current = { ctx: meterCtx, analyser, source, buf: new Float32Array(analyser.fftSize) };
          windowPeakRef.current = -1;
          sampleTimerRef.current = setInterval(sampleLevel, 200);
        } catch (_) { levelRef.current = null; }
      }
      const mimeType = kind === 'workflow' ? '' : pickRecorderMime();
      const opts = {};
      if (mimeType) opts.mimeType = mimeType;
      if (audioBitsPerSecond) opts.audioBitsPerSecond = audioBitsPerSecond;
      const mr = new MediaRecorder(stream, Object.keys(opts).length ? opts : undefined);
      mrRef.current = mr;
      const session = { id: newSessionId(), kind, consent, startedAtIso: new Date().toISOString(), mime: mr.mimeType || mimeType || '' };
      sessionRef.current = session;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) {
          chunksRef.current.push(e.data);
          bytesRef.current += e.data.size;
          setBytes(bytesRef.current);
        }
      };
      mr.onstop = () => {
        const type = mr.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        // A preview URL is a convenience; the recording must never be lost to it.
        let url;
        try { url = URL.createObjectURL(blob); } catch (_) { url = ''; }
        urlRef.current = url;
        const manifest = buildManifest({
          sessionId: session.id, kind: session.kind, mime: type, startedAtIso: session.startedAtIso,
          seconds: secondsRef.current, chunkCount: chunksRef.current.length,
          steps: stepsRef.current, consent: session.consent,
        });
        setResult({ blob, url, manifest, chunks: chunksRef.current.slice(), measured: measuredRef.current > 0, heardSound: heardRef.current });
        cleanup();
        setRecording(false);
      };
      // The user ending the screen share from the browser chrome stops us cleanly.
      try { stream.getVideoTracks().forEach((t) => { t.onended = () => stop(); }); } catch (_) {}
      // Wake lock so a phone/tablet doesn't sleep a long recording (best-effort).
      try { wakeRef.current = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch (_) { wakeRef.current = null; }
      mr.start(timesliceMs);
      setRecording(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        measureLevel();
        setSeconds(secondsRef.current);
        if (capExceeded(secondsRef.current)) stop();
      }, 1000);
      return { ok: true, reason: '' };
    } catch (e) {
      setError(e && e.name === 'NotAllowedError' ? 'permission-blocked' : 'start-failed');
      setErrorMessage(explainMicError(e));
      cleanup();
      setRecording(false);
      return { ok: false, reason: 'start-failed' };
    }
  }, [screenSupported, micSupported, stop]);

  const markStep = useCallback((label) => {
    try {
      const next = addStepMarker(stepsRef.current, { label, atSeconds: secondsRef.current, recording: !!mrRef.current && mrRef.current.state === 'recording' });
      stepsRef.current = next;
      setSteps(next);
      return true;
    } catch (_) { return false; }
  }, []);

  useEffect(() => () => { cleanup(); try { if (urlRef.current) URL.revokeObjectURL(urlRef.current); } catch (_) {} }, []);

  return { screenSupported, micSupported, recording, seconds, steps, result, error, errorMessage, silentSeconds, heardSound, bytes, level, start, stop, markStep };
}

// ---------------------------------------------------------------------------
// WHAT A RECORDING BECAME, read back (DR-0622). The whole-system flow graph
// found this chain ending in the dark: the NAS consumer wrote transcript.json
// and minutes.md, and nothing ever read them back to the person who recorded.
// The ingest server now serves them (GET /scribe/sessions, /scribe/session/:id,
// infra/nas-scribe/scribe_results.py). The door opens with the family key the
// device already provisioned (lib/bridge-provision.js), the same key the photo
// and voice doors take — before this, the app sent no credential at all and
// every upload was refused.
// ---------------------------------------------------------------------------
export const scribeAuth = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export const SCRIBE_STATES = Object.freeze({
  recording: 'Started, not finished uploading',
  queued: 'Waiting for Whisper',
  transcribed: 'Written down',
  minuted: 'Written down, with minutes',
});

/** { ok, sessions, reason } — every recording and where it stands. */
export async function fetchScribeSessions({ token = '', fetchImpl } = {}) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return { ok: false, sessions: [], reason: 'no-fetch' };
  try {
    const res = await doFetch('/scribe/sessions', { headers: scribeAuth(token) });
    if (!res || !res.ok) return { ok: false, sessions: [], reason: `http-${res ? res.status : 'no-response'}` };
    const j = await res.json();
    return { ok: true, sessions: Array.isArray(j && j.sessions) ? j.sessions : [], reason: '' };
  } catch (e) {
    return { ok: false, sessions: [], reason: (e && e.message) || 'network-error' };
  }
}

/** { ok, transcript, minutes, reason } — the words of one recording. */
export async function fetchScribeWords(sessionId, { token = '', fetchImpl } = {}) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return { ok: false, transcript: '', minutes: '', reason: 'no-fetch' };
  try {
    const res = await doFetch(`/scribe/session/${encodeURIComponent(sessionId)}`, { headers: scribeAuth(token) });
    if (!res || !res.ok) return { ok: false, transcript: '', minutes: '', reason: `http-${res ? res.status : 'no-response'}` };
    const j = await res.json();
    return { ok: true, transcript: String((j && j.transcript) || ''), minutes: String((j && j.minutes) || ''), reason: '' };
  } catch (e) {
    return { ok: false, transcript: '', minutes: '', reason: (e && e.message) || 'network-error' };
  }
}
