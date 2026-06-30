// @vitest-environment node
//
// persona-voice-prefs — per-persona device-voice PIN (lib/persona-voice-prefs.js).
// Proven-to-catch (DR-0076): the pin is what makes "save the voice for use" actually
// stick — it survives a reload and is read back for every read-aloud. Locks the
// round-trip, the clear-to-auto path, and null-safety in private mode.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPersonaVoiceMap, savePersonaVoice, personaVoiceOverride,
} from '../lib/persona-voice-prefs.js';

function makeStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}

describe('persona-voice-prefs', () => {
  let store;
  beforeEach(() => { store = makeStore(); });

  it('round-trips a pin and reads it back (this is what makes the choice persist)', () => {
    savePersonaVoice('voice-dp', 'Microsoft Mark - English (United States)', store);
    const map = loadPersonaVoiceMap(store);
    expect(personaVoiceOverride(map, 'voice-dp')).toBe('Microsoft Mark - English (United States)');
  });

  it('keeps multiple personas independent', () => {
    savePersonaVoice('voice-dp', 'mark', store);
    savePersonaVoice('voice-cp', 'zira', store);
    const map = loadPersonaVoiceMap(store);
    expect(personaVoiceOverride(map, 'voice-dp')).toBe('mark');
    expect(personaVoiceOverride(map, 'voice-cp')).toBe('zira');
  });

  it('clears a pin (reverts to auto) when given a falsy voiceURI', () => {
    savePersonaVoice('voice-dp', 'mark', store);
    savePersonaVoice('voice-dp', '', store);
    expect(personaVoiceOverride(loadPersonaVoiceMap(store), 'voice-dp')).toBe(null);
  });

  it('never throws on corrupt JSON or hostile storage', () => {
    store.setItem('poe-persona-voice-overrides', '{not json');
    expect(() => loadPersonaVoiceMap(store)).not.toThrow();
    expect(loadPersonaVoiceMap(store)).toEqual({});
    const hostile = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(() => savePersonaVoice('voice-dp', 'mark', hostile)).not.toThrow();
    expect(loadPersonaVoiceMap(hostile)).toEqual({});
  });

  it('personaVoiceOverride is null-safe', () => {
    expect(personaVoiceOverride(null, 'voice-dp')).toBe(null);
    expect(personaVoiceOverride({}, 'voice-dp')).toBe(null);
  });
});
