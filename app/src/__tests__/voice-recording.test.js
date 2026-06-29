// @vitest-environment node
//
// Record-your-voice enrollment — pure helpers + the reference store + the
// bridge-or-sovereign endpoint selection. Proven-to-catch on the safety defaults:
// no endpoint => no synth attempt; a personal voice needs a reference.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isRecordingSupported, pickRecorderMime, formatDuration, meetsMinDuration,
  durationQuality, RECORD_SCRIPT, MIN_RECORD_SECONDS,
} from '../lib/voice-recording.js';
import {
  referenceKey, isUsableReference, saveReference, loadReference, hasReference,
  clearReference, blobToDataUri,
} from '../lib/voice-reference.js';
import {
  voiceServiceUrl, voiceBridgeEnabled, activeVoiceEndpoint, isVoiceServiceReady, synthesizeSpeech,
} from '../lib/voice-service.js';

describe('recording helpers (pure)', () => {
  it('feature-detects safely with no browser APIs', () => {
    expect(isRecordingSupported(undefined, undefined)).toBe(false);
    expect(isRecordingSupported({ mediaDevices: { getUserMedia: () => {} } }, { MediaRecorder: function () {} })).toBe(true);
    expect(isRecordingSupported({}, {})).toBe(false);
  });
  it('pickRecorderMime returns "" when MediaRecorder is absent', () => {
    expect(pickRecorderMime(undefined)).toBe('');
    expect(pickRecorderMime({ isTypeSupported: (t) => t === 'audio/webm;codecs=opus' })).toBe('audio/webm;codecs=opus');
  });
  it('formats duration mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(9)).toBe('0:09');
    expect(formatDuration(75)).toBe('1:15');
  });
  it('enforces a minimum clone length', () => {
    expect(meetsMinDuration(MIN_RECORD_SECONDS - 1)).toBe(false);
    expect(meetsMinDuration(MIN_RECORD_SECONDS)).toBe(true);
    expect(durationQuality(2).tone).toBe('short');
    expect(durationQuality(40).tone).toBe('great');
  });
  it('ships a non-empty read script', () => {
    expect(RECORD_SCRIPT.length).toBeGreaterThan(2);
  });
});

describe('reference store (IndexedDB → memory fallback in node)', () => {
  const KEY = 'darrell';
  beforeEach(async () => { await clearReference(KEY); });

  it('keys per person', () => { expect(referenceKey('darrell')).toBe('ref:darrell'); });

  it('only accepts a real audio blob', () => {
    expect(isUsableReference(null)).toBe(false);
    expect(isUsableReference({ size: 10, type: 'audio/webm' })).toBe(false); // too small
    expect(isUsableReference({ size: 5000, type: 'text/plain' })).toBe(false); // not audio
    expect(isUsableReference({ size: 5000, type: 'audio/webm' })).toBe(true);
  });

  it('round-trips a saved sample and reports existence', async () => {
    expect(await hasReference(KEY)).toBe(false);
    const ok = await saveReference(KEY, { size: 5000, type: 'audio/webm' });
    expect(ok).toBe(true);
    expect(await hasReference(KEY)).toBe(true);
    const got = await loadReference(KEY);
    expect(got.size).toBe(5000);
    await clearReference(KEY);
    expect(await hasReference(KEY)).toBe(false);
  });

  it('refuses to save a too-short sample', async () => {
    expect(await saveReference(KEY, { size: 10, type: 'audio/webm' })).toBe(false);
  });

  it('blobToDataUri never throws without FileReader', async () => {
    expect(await blobToDataUri({ size: 5000, type: 'audio/webm' })).toBe('');
  });
});

describe('voice endpoint selection — bridge vs sovereign, safe default', () => {
  beforeEach(() => { vi.unstubAllEnvs(); });

  it('no endpoint by default → not ready, no synth attempt', async () => {
    expect(voiceServiceUrl()).toBe('');
    expect(voiceBridgeEnabled()).toBe(false);
    expect(activeVoiceEndpoint()).toBe(null);
    expect(isVoiceServiceReady()).toBe(false);
    const r = await synthesizeSpeech({ text: 'hi', referenceDataUri: 'data:audio/webm;base64,AAAA' });
    expect(r.error).toBe('voice-service-not-configured');
  });

  it('bridge enabled → routes to the same-origin function and REQUIRES a reference', async () => {
    vi.stubEnv('VITE_VOICE_BRIDGE', '1');
    const ep = activeVoiceEndpoint();
    expect(ep.kind).toBe('bridge');
    expect(ep.url).toBe('/api/voice-speak');
    const noRef = await synthesizeSpeech({ text: 'hi' });
    expect(noRef.error).toBe('no-voice-sample'); // never synth a clone without the sample
    vi.unstubAllEnvs();
  });

  it('sovereign studio URL takes precedence and posts to {base}/speak', () => {
    vi.stubEnv('VITE_VOICE_SERVICE_URL', 'http://192.168.1.26:8770');
    const ep = activeVoiceEndpoint();
    expect(ep.kind).toBe('sovereign');
    expect(ep.url).toBe('http://192.168.1.26:8770/speak');
    vi.unstubAllEnvs();
  });
});
