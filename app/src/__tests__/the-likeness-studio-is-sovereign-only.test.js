// @vitest-environment jsdom
// THE LIKENESS STUDIO IS SOVEREIGN-ONLY AND NEVER FAILS SILENTLY (DR-0430).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { avatarServiceUrl, activeAvatarEndpoint, isAvatarServiceReady, renderTalkingPortrait, probeAvatarHealth } from '../lib/avatar-service.js';

afterEach(() => vi.unstubAllEnvs());
const blob = (n, type) => new Blob([new Uint8Array(n)], { type });

describe('configuration', () => {
  it('no URL → not ready, and a render returns a tagged error rather than throwing', async () => {
    vi.stubEnv('VITE_AVATAR_SERVICE_URL', '');
    expect(isAvatarServiceReady()).toBe(false);
    expect(activeAvatarEndpoint()).toBeNull();
    expect(await renderTalkingPortrait({ audioBlob: blob(10, 'audio/wav'), portraitBlob: blob(10, 'image/png'), personKey: 'darrell' })).toEqual({ error: 'avatar-service-not-configured' });
    expect((await probeAvatarHealth()).ready).toBe(false);
  });
  it('a URL → the sovereign endpoint, trailing slash trimmed; there is no vendor kind', () => {
    vi.stubEnv('VITE_AVATAR_SERVICE_URL', 'http://192.168.1.26:8772/');
    expect(avatarServiceUrl()).toBe('http://192.168.1.26:8772');
    expect(activeAvatarEndpoint()).toEqual({ url: 'http://192.168.1.26:8772/render', health: 'http://192.168.1.26:8772/health', kind: 'sovereign' });
  });
});

describe('render', () => {
  it('refuses without a person key, audio or portrait (an anonymous likeness is never sent)', async () => {
    vi.stubEnv('VITE_AVATAR_SERVICE_URL', 'http://x');
    expect((await renderTalkingPortrait({ audioBlob: blob(10, 'audio/wav'), portraitBlob: blob(10, 'image/png') })).error).toBe('person-key-required');
    expect((await renderTalkingPortrait({ personKey: 'darrell', portraitBlob: blob(10, 'image/png') })).error).toBe('no-audio');
    expect((await renderTalkingPortrait({ personKey: 'darrell', audioBlob: blob(10, 'audio/wav') })).error).toBe('no-portrait');
  });
  it('posts both data URIs and the person key, and returns a playable URL with the AI-generated stamp', async () => {
    vi.stubEnv('VITE_AVATAR_SERVICE_URL', 'http://x');
    let sent = null;
    const fetchImpl = vi.fn(async (url, init) => { sent = { url, body: JSON.parse(init.body) }; return { ok: true, status: 200, headers: { get: (k) => (k === 'X-AI-Generated' ? 'likeness' : null) }, blob: async () => blob(20, 'video/mp4') }; });
    globalThis.URL.createObjectURL = globalThis.URL.createObjectURL || (() => 'blob:fake');
    const out = await renderTalkingPortrait({ audioBlob: blob(10, 'audio/wav'), portraitBlob: blob(10, 'image/png'), personKey: 'darrell', fetchImpl });
    expect(sent.url).toBe('http://x/render');
    expect(sent.body.person_key).toBe('darrell');
    expect(sent.body.audio.startsWith('data:audio/wav;base64,')).toBe(true);
    expect(sent.body.portrait.startsWith('data:image/png;base64,')).toBe(true);
    expect(out.error).toBeUndefined();
    expect(out.aiGenerated).toBe('likeness');
  });
  it('a 503 from the studio comes back as a tagged error naming the reason — never a silent still', async () => {
    vi.stubEnv('VITE_AVATAR_SERVICE_URL', 'http://x');
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({ error: 'model-not-ready' }) }));
    const out = await renderTalkingPortrait({ audioBlob: blob(10, 'audio/wav'), portraitBlob: blob(10, 'image/png'), personKey: 'darrell', fetchImpl });
    expect(out.error).toBe('avatar-service-503:model-not-ready');
  });
});
