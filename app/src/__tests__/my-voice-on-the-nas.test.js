// =============================================================================
// My voice on the NAS (DR-1538): the reader names the engine that makes it
// =============================================================================
// When the tower's studio is dark, the /voice forwarder hands "My voice" to the
// NAS's own clone (Piper + the OpenVoice V2 converter) and its /health answers
// { ok: true, engine: 'nas-clone' }. The reader must say which engine that is,
// never call it the church's voice studio, and never keep an engine name past
// a probe that read the road as down.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MY_VOICE, myVoiceLine } from '../lib/my-voice.js';
import { probeVoiceService, voiceServiceEngine, resetVoiceServiceHealthForTests } from '../lib/voice-service.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const realFetch = globalThis.fetch;
const answer = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('the words say which engine made my voice', () => {
  it('the NAS engine is named as the NAS, with the pacing said plainly', () => {
    const line = myVoiceLine({ name: 'Darrell Poe', status: MY_VOICE.READY, engine: 'nas-clone' });
    expect(line).toMatch(/NAS/);
    expect(line).toMatch(/tower is dark/);
    expect(line).toMatch(/pacing is the house voice/);
    expect(line).not.toMatch(/church’s own voice studio/);
  });
  it('the tower studio keeps its own sentence', () => {
    expect(myVoiceLine({ name: 'Darrell Poe', status: MY_VOICE.READY })).toMatch(/church’s own voice studio/);
  });
});

describe('the probe learns the engine from the answer, and forgets it when the road is down', () => {
  beforeEach(() => {
    resetVoiceServiceHealthForTests();
    import.meta.env.VITE_VOICE_SERVICE_URL = 'https://voice.example/';
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    resetVoiceServiceHealthForTests();
  });

  it('{ ok: true, engine: nas-clone } reads up, engine nas-clone', async () => {
    globalThis.fetch = answer(200, { ok: true, engine: 'nas-clone', studio: 'unreachable' });
    expect(await probeVoiceService({ force: true })).toBe('up');
    expect(voiceServiceEngine()).toBe('nas-clone');
  });
  it('PROVEN-TO-CATCH: a 502 after a NAS answer leaves no engine named', async () => {
    globalThis.fetch = answer(200, { ok: true, engine: 'nas-clone' });
    await probeVoiceService({ force: true });
    globalThis.fetch = answer(502, { ok: false, error: 'studio-unreachable' });
    expect(await probeVoiceService({ force: true })).toBe('down');
    expect(voiceServiceEngine()).toBe('');
  });
  it('the tower studio (no engine field) names none', async () => {
    globalThis.fetch = answer(200, { ok: true, clone: true });
    await probeVoiceService({ force: true });
    expect(voiceServiceEngine()).toBe('');
  });
});

describe('the NAS road is wired end to end in the repository', () => {
  const services = JSON.parse(readFileSync(join(ROOT, 'infra/nas-loops/services.json'), 'utf8')).services;
  it('voice-clone installs itself, before the /voice forwarder in the same cycle', () => {
    const names = services.map((s) => s.name);
    expect(names).toContain('voice-clone');
    expect(names.indexOf('voice-clone')).toBeLessThan(names.indexOf('voice-transport'));
    expect(services.find((s) => s.name === 'voice-clone').enabled).toBe(true);
  });
  it('the forwarder falls back to the clone, and its installer can mount /voice for it', () => {
    const fwd = readFileSync(join(ROOT, 'infra/voice-studio/voice_forwarder.py'), 'utf8');
    expect(fwd).toMatch(/NAS_CLONE_DEFAULT = os\.environ\.get\("VOICE_NAS_CLONE_UPSTREAM", "http:\/\/127\.0\.0\.1:8773"\)/);
    const inst = readFileSync(join(ROOT, 'infra/voice-studio/install.sh'), 'utf8');
    expect(inst).toMatch(/127\.0\.0\.1:8773\/health/);
  });
  it('the clone binds loopback only and pins the OpenVoice commit it was read at', () => {
    const srv = readFileSync(join(ROOT, 'infra/nas-voice-clone/nas_clone_server.py'), 'utf8');
    expect(srv).toMatch(/ThreadingHTTPServer\(\("127\.0\.0\.1", args\.port\)/);
    const inst = readFileSync(join(ROOT, 'infra/nas-voice-clone/install.sh'), 'utf8');
    expect(inst).toMatch(/OV_COMMIT=74a1d147b17a8c3092dd5430504bd83ef6c7eb23/);
    expect(inst).toMatch(/--no-deps/);
  });
});
