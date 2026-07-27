// workflow-scribe.test.js — proven-to-catch coverage for the Scribe capture core
// (DR-0076 §3: each test fires the failure class it guards, then proves the
// sound path passes). The hook is thin glue; everything load-bearing is pure
// and exercised here without a DOM.
import { describe, it, expect, vi } from 'vitest';
import {
  SCRIBE_MAX_DURATION_MIN,
  isScreenCaptureSupported,
  isMicCaptureSupported,
  buildConsent,
  canStartCapture,
  capExceeded,
  chunkName,
  addStepMarker,
  buildManifest,
  validateManifest,
  createChunkUploader,
} from '../lib/workflow-scribe.js';

describe('feature detection', () => {
  it('reports unsupported when getDisplayMedia is absent', () => {
    expect(isScreenCaptureSupported({ mediaDevices: {} }, { MediaRecorder: function () {} })).toBe(false);
    expect(isScreenCaptureSupported(undefined, undefined)).toBe(false);
  });
  it('reports supported when getDisplayMedia + MediaRecorder exist', () => {
    expect(isScreenCaptureSupported({ mediaDevices: { getDisplayMedia: () => {} } }, { MediaRecorder: function () {} })).toBe(true);
  });
  it('mic detection mirrors voice-recording (getUserMedia + MediaRecorder)', () => {
    expect(isMicCaptureSupported({ mediaDevices: { getUserMedia: () => {} } }, { MediaRecorder: function () {} })).toBe(true);
    expect(isMicCaptureSupported({ mediaDevices: {} }, { MediaRecorder: function () {} })).toBe(false);
  });
});

describe('consent gate (all-party — 720 ILCS 5/14 posture)', () => {
  it('a meeting with a non-consenting party CANNOT start', () => {
    const consent = buildConsent([{ name: 'Darrell', consented: true }, { name: 'Guest', consented: false }]);
    expect(consent.allConsented).toBe(false);
    const gate = canStartCapture({ kind: 'meeting', supported: true, consent });
    expect(gate.ok).toBe(false);
    expect(gate.reason).toBe('all-party-consent-required');
  });
  it('a meeting with zero named parties cannot start (empty consent is not consent)', () => {
    const gate = canStartCapture({ kind: 'meeting', supported: true, consent: buildConsent([]) });
    expect(gate.ok).toBe(false);
  });
  it('a workflow without the operator confirmation cannot start', () => {
    const gate = canStartCapture({ kind: 'workflow', supported: true, consent: buildConsent([]) });
    expect(gate.ok).toBe(false);
    expect(gate.reason).toBe('operator-consent-required');
  });
  it('unsupported browser is refused before any consent question', () => {
    const consent = buildConsent([{ name: 'Darrell', consented: true }]);
    expect(canStartCapture({ kind: 'workflow', supported: false, consent }).reason).toBe('not-supported');
  });
  it('an unknown kind is refused', () => {
    expect(canStartCapture({ kind: 'screencast', supported: true, consent: buildConsent([{ name: 'D', consented: true }]) }).reason).toBe('unknown-kind');
  });
  it('all parties consenting opens the gate', () => {
    const consent = buildConsent([{ name: 'Darrell', consented: true }, { name: 'Christyn', consented: true }]);
    expect(canStartCapture({ kind: 'meeting', supported: true, consent }).ok).toBe(true);
  });
  it('blank party names are dropped, not silently counted as consenters', () => {
    const consent = buildConsent([{ name: '   ', consented: true }]);
    expect(consent.allConsented).toBe(false);
  });
});

describe('duration cap (aligned with ministry-meetings 180 min)', () => {
  it('fires at exactly the cap and beyond, not before', () => {
    expect(capExceeded(SCRIBE_MAX_DURATION_MIN * 60 - 1)).toBe(false);
    expect(capExceeded(SCRIBE_MAX_DURATION_MIN * 60)).toBe(true);
    expect(capExceeded(SCRIBE_MAX_DURATION_MIN * 60 + 1)).toBe(true);
  });
});

describe('chunk naming (idempotent upload identity)', () => {
  it('pads the index so re-uploads land on the same name', () => {
    expect(chunkName('abc', 0)).toBe('abc.00000.webm');
    expect(chunkName('abc', 42)).toBe('abc.00042.webm');
  });
});

describe('step markers', () => {
  it('rejects a marker when not recording (the failure class)', () => {
    expect(() => addStepMarker([], { label: 'x', atSeconds: 5, recording: false })).toThrow('step-marker-requires-recording');
  });
  it('rejects a negative/invalid timestamp', () => {
    expect(() => addStepMarker([], { label: 'x', atSeconds: -1, recording: true })).toThrow('step-marker-bad-time');
  });
  it('appends with a 1-based index and default label', () => {
    const one = addStepMarker([], { label: '', atSeconds: 3, recording: true });
    const two = addStepMarker(one, { label: 'Open Admin', atSeconds: 9, recording: true });
    expect(two).toEqual([
      { index: 1, label: 'Step 1', atSeconds: 3 },
      { index: 2, label: 'Open Admin', atSeconds: 9 },
    ]);
  });
});

describe('manifest integrity (the NAS-side contract)', () => {
  const sound = () => buildManifest({
    sessionId: 's1', kind: 'workflow', mime: 'video/webm', startedAtIso: '2026-07-27T18:00:00.000Z',
    seconds: 600, chunkCount: 10,
    steps: [{ index: 1, label: 'Step 1', atSeconds: 3 }],
    consent: buildConsent([{ name: 'Darrell', consented: true }]),
  });
  it('a sound manifest passes', () => {
    expect(validateManifest(sound())).toEqual({ ok: true, problems: [] });
  });
  it('catches zero chunks (a recording that captured nothing must not queue)', () => {
    expect(validateManifest({ ...sound(), chunkCount: 0 }).problems).toContain('no-chunks');
  });
  it('catches missing consent', () => {
    expect(validateManifest({ ...sound(), consent: buildConsent([]) }).problems).toContain('consent-missing');
  });
  it('catches an over-cap duration', () => {
    expect(validateManifest({ ...sound(), seconds: SCRIBE_MAX_DURATION_MIN * 60 + 1 }).problems).toContain('over-duration-cap');
  });
  it('catches a missing session id and unknown kind', () => {
    const bad = validateManifest({ ...sound(), sessionId: '', kind: 'nope' });
    expect(bad.problems).toContain('missing-session-id');
    expect(bad.problems).toContain('unknown-kind');
  });
});

describe('chunk uploader (retry with backoff, bearer auth, same-origin endpoint)', () => {
  const blob = { size: 3 }; // FormData in node test env accepts any blob-ish; we only assert call shape
  it('retries a failing upload and succeeds on the 3rd attempt', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => { calls += 1; return { ok: calls >= 3, status: calls >= 3 ? 200 : 503 }; });
    const up = createChunkUploader({ endpoint: '/scribe', token: 'tok', fetchImpl, retries: 3, sleep: async () => {} });
    const res = await up.put({ sessionId: 's1', index: 2, track: 'main' }, new Blob(['abc']));
    expect(res).toEqual({ ok: true, attempts: 3 });
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toBe('/scribe/chunk');
    expect(opts.headers.Authorization).toBe('Bearer tok');
  });
  it('gives up cleanly after max retries (never throws into the recorder)', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('ECONNREFUSED'); });
    const up = createChunkUploader({ endpoint: '/scribe', token: '', fetchImpl, retries: 2, sleep: async () => {} });
    const res = await up.put({ sessionId: 's1', index: 0 }, new Blob(['x']));
    expect(res.ok).toBe(false);
    expect(res.attempts).toBe(2);
    expect(res.error).toBe('ECONNREFUSED');
    void blob;
  });
});
