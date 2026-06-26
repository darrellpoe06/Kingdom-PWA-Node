// @vitest-environment node
//
// The ONE global reading-voice preference — the id model + two-layer persistence
// (localStorage cache + account sync). Proven-to-catch: an account pref overrides
// the local cache (the "follows me to any device" property).
import { describe, it, expect } from 'vitest';
import {
  SYSTEM_VOICE_ID, personVoiceId, isPersonVoiceId, personKeyOf, isSystemVoiceId,
  loadReadingVoiceId, saveReadingVoiceId, loadReadingVoiceFromAccount, saveReadingVoiceToAccount,
  subscribeReadingVoice, broadcastReadingVoice,
} from '../lib/reading-voice.js';

function makeStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

describe('voice id model (pure)', () => {
  it('tags personal vs system', () => {
    expect(personVoiceId('darrell')).toBe('person:darrell');
    expect(isPersonVoiceId('person:darrell')).toBe(true);
    expect(isPersonVoiceId('Samantha-URI')).toBe(false);
    expect(personKeyOf('person:darrell')).toBe('darrell');
    expect(personKeyOf('system')).toBe(null);
    expect(isSystemVoiceId('system')).toBe(true);
    expect(isSystemVoiceId('')).toBe(true);
    expect(isSystemVoiceId('person:darrell')).toBe(false);
  });
});

describe('localStorage persistence', () => {
  it('defaults to system and round-trips any id', () => {
    const store = makeStore();
    expect(loadReadingVoiceId(store)).toBe(SYSTEM_VOICE_ID);
    saveReadingVoiceId('person:darrell', store);
    expect(loadReadingVoiceId(store)).toBe('person:darrell');
    saveReadingVoiceId('Google US English', store);
    expect(loadReadingVoiceId(store)).toBe('Google US English');
  });
  it('never throws on hostile storage', () => {
    const hostile = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(() => saveReadingVoiceId('x', hostile)).not.toThrow();
    expect(loadReadingVoiceId(hostile)).toBe(SYSTEM_VOICE_ID);
  });
});

describe('same-tab reactivity (one pick updates everywhere)', () => {
  it('a broadcast reaches every subscriber; unsubscribe stops it', () => {
    const a = []; const b = [];
    const unsubA = subscribeReadingVoice((id) => a.push(id));
    const unsubB = subscribeReadingVoice((id) => b.push(id));
    broadcastReadingVoice('person:darrell');
    expect(a).toEqual(['person:darrell']);
    expect(b).toEqual(['person:darrell']);
    unsubA();
    broadcastReadingVoice('Samantha');
    expect(a).toEqual(['person:darrell']);        // unsubscribed — no further updates
    expect(b).toEqual(['person:darrell', 'Samantha']);
    unsubB();
  });
  it('a throwing subscriber never breaks the broadcast', () => {
    const seen = [];
    const u1 = subscribeReadingVoice(() => { throw new Error('boom'); });
    const u2 = subscribeReadingVoice((id) => seen.push(id));
    expect(() => broadcastReadingVoice('system')).not.toThrow();
    expect(seen).toEqual(['system']);
    u1(); u2();
  });
});

describe('account sync (cross-device)', () => {
  it('reads reading_voice_id from the signed-in user metadata', async () => {
    const client = { auth: { getUser: async () => ({ data: { user: { user_metadata: { reading_voice_id: 'person:darrell' } } } }) } };
    expect(await loadReadingVoiceFromAccount(client)).toBe('person:darrell');
  });
  it('returns null when signed out / no metadata, never throws', async () => {
    expect(await loadReadingVoiceFromAccount({ auth: { getUser: async () => ({ data: { user: null } }) } })).toBe(null);
    expect(await loadReadingVoiceFromAccount({ auth: { getUser: async () => { throw new Error('x'); } } })).toBe(null);
  });
  it('writes the pref to the account (updateUser data), swallowing errors', async () => {
    let written = null;
    const client = { auth: { updateUser: async ({ data }) => { written = data; } } };
    await saveReadingVoiceToAccount('Samantha', client);
    expect(written).toEqual({ reading_voice_id: 'Samantha' });
    // signed out → updateUser throws → no throw out
    await expect(saveReadingVoiceToAccount('x', { auth: { updateUser: async () => { throw new Error('no session'); } } })).resolves.toBeUndefined();
  });
});
