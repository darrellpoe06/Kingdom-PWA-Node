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
  };

  const stop = useCallback(() => {
    try { mrRef.current && mrRef.current.state !== 'inactive' && mrRef.current.stop(); }
    catch (_) { cleanup(); setRecording(false); }
  }, []);

  const start = useCallback(async ({ kind, consent }) => {
    const supported = kind === 'workflow' ? screenSupported : micSupported;
    const gate = canStartCapture({ kind, supported, consent });
    if (!gate.ok) { setError(gate.reason); return gate; }
    setError(''); setResult(null); setSteps([]); setSeconds(0);
    chunksRef.current = []; stepsRef.current = []; secondsRef.current = 0;
    try { if (urlRef.current) URL.revokeObjectURL(urlRef.current); } catch (_) {}
    urlRef.current = '';
    try {
      const stream = kind === 'workflow'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mimeType = kind === 'workflow' ? '' : pickRecorderMime();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mrRef.current = mr;
      const session = { id: newSessionId(), kind, consent, startedAtIso: new Date().toISOString(), mime: mr.mimeType || mimeType || '' };
      sessionRef.current = session;
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const type = mr.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const manifest = buildManifest({
          sessionId: session.id, kind: session.kind, mime: type, startedAtIso: session.startedAtIso,
          seconds: secondsRef.current, chunkCount: chunksRef.current.length,
          steps: stepsRef.current, consent: session.consent,
        });
        setResult({ blob, url, manifest, chunks: chunksRef.current.slice() });
        cleanup();
        setRecording(false);
      };
      // The user ending the screen share from the browser chrome stops us cleanly.
      try { stream.getVideoTracks().forEach((t) => { t.onended = () => stop(); }); } catch (_) {}
      // Wake lock so a phone/tablet doesn't sleep a long recording (best-effort).
      try { wakeRef.current = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch (_) { wakeRef.current = null; }
      mr.start(SCRIBE_CHUNK_MS);
      setRecording(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (capExceeded(secondsRef.current)) stop();
      }, 1000);
      return { ok: true, reason: '' };
    } catch (e) {
      setError(e && e.name === 'NotAllowedError' ? 'permission-blocked' : 'start-failed');
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

  return { screenSupported, micSupported, recording, seconds, steps, result, error, start, stop, markStep };
}
