// @vitest-environment jsdom
// =============================================================================
// Every voice is choosable (DR-0655)
// =============================================================================
// Darrell 2026-09-25, Android, The Love Corner → Church → Learn, Living Lesson
// 191 at 1.5x, the panel reading "Ready · stand-in voice, the studio is
// offline": "I can only pic this fake dying voice!!!!!! Why limitations are
// built into the app!!!!! Fix it!!!!!" — and then, of his Firestick: does it
// still work there?
//
// Pinned here against the REAL hook, with a fake speechSynthesis and a fake
// NAS answer:
//   * the house (NAS) voices listed are EXACTLY the ones the server reports;
//   * a house voice picked is the model the NAS is asked for;
//   * every phone voice is offered, English and natural voices first;
//   * the pick persists;
//   * on a device with NO voices (Fire TV / Silk) there is no empty phone
//     group, and the default reads in the NAS voice, never a dead phone voice;
//   * the picker plays a sample as a voice is picked, and a remote can work it.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: null } }), updateUser: async () => ({}) } },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
const nas = vi.hoisted(() => ({ list: { voices: [] }, calls: [], speakOk: true }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    fetchHouseVoices: async () => nas.list,
    synthesizeLite: async (args) => { nas.calls.push(args); return nas.speakOk ? { url: 'blob:clip' } : { error: 'voice-lite-503' }; },
    synthesizeSpeech: async () => ({ error: 'studio-test' }),
    isVoiceServiceReady: () => false,
    mayAttemptStudio: () => false,
  };
});

import { useReadAloud, rankDeviceVoices, VOICE_GROUPS } from '../lib/use-read-aloud.js';
import { _resetLiteVoiceForTests } from '../lib/voice-service.js';
import VoicePicker, { groupCatalog } from '../components/VoicePicker.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function pause() {};
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};

const ALAN = { id: 'en_GB-alan-medium', label: 'Alan', gender: 'male', accent: 'British', quality: 'medium', note: 'Real audio from the church’s own server. Keeps playing when you switch apps.' };
const JOE = { id: 'en_US-joe-medium', label: 'Joe', gender: 'male', accent: 'American', quality: 'medium', note: 'Real audio.' };
const RYAN_HIGH = { id: 'en_US-ryan-high', label: 'Ryan (high quality)', gender: 'male', accent: 'American', quality: 'high', note: 'Most natural of the house voices, and the slowest.' };

const US = { name: 'English United States (en_US)', voiceURI: 'English United States (en_US)', lang: 'en_US', localService: true };
const GOOGLE = { name: 'Google US English', voiceURI: 'Google US English', lang: 'en-US', localService: false };
const ES = { name: 'Español Estados Unidos (es_US)', voiceURI: 'Español Estados Unidos (es_US)', lang: 'es_US', localService: true };

class FakeUtterance { constructor(t) { this.text = t; this.voice = null; this.lang = ''; } }
function installSynth(voices) {
  const spoken = [];
  window.speechSynthesis = {
    spoken, paused: false, speaking: false, pending: false,
    speak(u) { spoken.push(u); if (u.onstart) u.onstart(); },
    cancel() {}, pause() {}, resume() {},
    getVoices() { return voices; },
    addEventListener() {}, removeEventListener() {}, onvoiceschanged: null,
  };
  window.SpeechSynthesisUtterance = FakeUtterance;
  return window.speechSynthesis;
}

let container; let root; let api;
function Probe() { api = useReadAloud({ isOwner: true }); return null; }
const flush = async () => { for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); }); };
const mount = async () => { await act(async () => root.render(createElement(Probe))); await flush(); };

beforeEach(() => {
  localStorage.clear();
  nas.list = { voices: [ALAN, JOE, RYAN_HIGH], default: 'en_US-ryan-medium' };
  nas.calls = [];
  nas.speakOk = true;
  _resetLiteVoiceForTests();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
});

const houseIds = () => api.catalog.filter((c) => c.group === VOICE_GROUPS.HOUSE).map((c) => c.id);

describe('the house voices are what the NAS reports, never a painted list', () => {
  it('lists exactly the voices in the server’s answer', async () => {
    installSynth([US]);
    await mount();
    expect(houseIds()).toEqual(['house:en_GB-alan-medium', 'house:en_US-joe-medium', 'house:en_US-ryan-high']);
  });

  it('a different answer, a different list: nothing is listed that the NAS did not report', async () => {
    installSynth([US]);
    nas.list = { voices: [JOE] };
    await mount();
    expect(houseIds()).toEqual(['house:en_US-joe-medium']);
    expect(api.catalog.some((c) => /Alan/.test(c.label))).toBe(false);
  });

  it('a NAS that does not answer is said, as a disabled line, not hidden and not invented', async () => {
    installSynth([US]);
    nas.list = { voices: [], error: 'voice-lite-503' };
    await mount();
    const house = api.catalog.filter((c) => c.group === VOICE_GROUPS.HOUSE);
    expect(house).toHaveLength(1);
    expect(house[0].usable).toBe(false);
    expect(house[0].label).toMatch(/not answering/);
  });

  it('every entry carries its one-line truth, and a high model is labelled slower', async () => {
    installSynth([US, GOOGLE]);
    await mount();
    for (const c of api.catalog) expect(c.note, `${c.id} has no note`).toBeTruthy();
    expect(api.catalog.find((c) => c.id === 'house:en_US-ryan-high').label).toMatch(/slower/);
    expect(api.catalog.find((c) => c.id === US.voiceURI).note).toMatch(/stops when you switch apps/);
    expect(api.catalog.find((c) => c.id === 'house:en_GB-alan-medium').note).toMatch(/Keeps playing/);
  });

  it('the studio entry says its honest state when the studio is dark', async () => {
    installSynth([US]);
    await mount();
    const studio = api.catalog[0];
    expect(studio.group).toBe(VOICE_GROUPS.STUDIO);
    expect(studio.label).toMatch(/offline now|not answering yet/);
    expect(studio.note).toMatch(/house voice/);
  });
});

describe('a picked house voice is the voice the NAS is asked for', () => {
  it('reads in that exact model', async () => {
    const synth = installSynth([US]);
    await mount();
    await act(async () => api.setVoiceId('house:en_GB-alan-medium'));
    await flush();
    await act(async () => { await api.read('In the beginning was the Word.'); });
    await flush();
    expect(nas.calls.length).toBeGreaterThan(0);
    expect(nas.calls[0].voice, 'the NAS was asked for a different voice than the pick').toBe('en_GB-alan-medium');
    expect(synth.spoken, 'a phone voice spoke over the house voice').toHaveLength(0);
  });

  it('the pick persists, and a fresh reader comes back to it', async () => {
    installSynth([US]);
    await mount();
    await act(async () => api.setVoiceId('house:en_US-joe-medium'));
    await flush();
    expect(JSON.parse(localStorage.getItem('poe-reading-voice')).voiceId).toBe('house:en_US-joe-medium');
    act(() => root.unmount());
    root = createRoot(container);
    await mount();
    expect(api.voiceId).toBe('house:en_US-joe-medium');
    expect(api.currentItem.id).toBe('house:en_US-joe-medium');
  });

  it('a house voice the NAS cannot voice falls to the phone and SAYS so', async () => {
    const synth = installSynth([US]);
    nas.speakOk = false;
    await mount();
    await act(async () => api.setVoiceId('house:en_GB-alan-medium'));
    await flush();
    await act(async () => { await api.read('Hello.'); });
    await flush();
    expect(synth.spoken.length).toBeGreaterThan(0);
    expect(api.standInWhy).toBe('house-offline');
  });

  it('a sample plays in a voice WITHOUT changing the pick', async () => {
    installSynth([US]);
    await mount();
    await act(async () => { await api.preview('house:en_US-joe-medium'); });
    await flush();
    expect(nas.calls[0].voice).toBe('en_US-joe-medium');
    expect(api.voiceId).toBe('system');
  });
});

describe('every phone voice is offered, English and natural first', () => {
  it('keeps non-English voices, ranks English + Google first', () => {
    const ranked = rankDeviceVoices([ES, US, GOOGLE, US]);
    expect(ranked.map((v) => v.voiceURI)).toEqual([GOOGLE.voiceURI, US.voiceURI, ES.voiceURI]);
  });

  it('the hook offers them all, non-English included', async () => {
    installSynth([ES, US, GOOGLE]);
    await mount();
    const phone = api.catalog.filter((c) => c.group === VOICE_GROUPS.PHONE).map((c) => c.id);
    expect(phone).toEqual([GOOGLE.voiceURI, US.voiceURI, ES.voiceURI]);
  });
});

describe('Fire TV: a device that reports NO voices', () => {
  it('shows the studio and the house voices and no empty phone group', async () => {
    installSynth([]);
    await mount();
    const groups = groupCatalog(api.catalog).map((g) => g.name);
    expect(groups).toEqual([VOICE_GROUPS.STUDIO, VOICE_GROUPS.HOUSE]);
  });

  it('the default voice reads as real NAS audio, never a phone voice that cannot speak', async () => {
    const synth = installSynth([]);
    await mount();
    expect(api.voiceId).toBe('system');
    await act(async () => { await api.read('The Lord is my shepherd.'); });
    await flush();
    expect(nas.calls.length, 'the default fell to the device voice instead of the NAS').toBeGreaterThan(0);
    expect(synth.spoken, 'a dead phone voice was asked to speak').toHaveLength(0);
    expect(api.audioVoice).toBe('audio');
  });

  it('a phone voice picked on another device still reads in the NAS voice here', async () => {
    const synth = installSynth([]);
    localStorage.setItem('poe-reading-voice', JSON.stringify({ voiceId: US.voiceURI, at: Date.now() }));
    await mount();
    await act(async () => { await api.read('The Lord is my shepherd.'); });
    await flush();
    expect(nas.calls.length, 'the phone pick went to a device with no voices').toBeGreaterThan(0);
    expect(synth.spoken).toHaveLength(0);
  });
});

describe('the NAS server and its installer name the same voices', () => {
  it('VOICES in voice_lite_server.py matches HOUSE_VOICES in install.sh, ryan + amy first', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const dir = resolve(__dirname, '../../../infra/nas-voice-lite');
    const py = readFileSync(resolve(dir, 'voice_lite_server.py'), 'utf8');
    const sh = readFileSync(resolve(dir, 'install.sh'), 'utf8');
    const block = py.slice(py.indexOf('VOICES = {'), py.indexOf('\n}\n', py.indexOf('VOICES = {')));
    const serverIds = [...block.matchAll(/^\s+"([A-Za-z_]+-[A-Za-z_]+-(?:low|medium|high))":/gm)].map((m) => m[1]);
    const shLine = (sh.match(/^HOUSE_VOICES="([^"]+)"/m) || [])[1] || '';
    const installIds = shLine.split(/\s+/).filter(Boolean).map((s) => s.split(':').join('-'));
    expect(serverIds.length).toBeGreaterThanOrEqual(9);
    expect(installIds).toEqual(serverIds);
    expect(installIds.slice(0, 2)).toEqual(['en_US-ryan-medium', 'en_US-amy-medium']);
    // The aliases keep working.
    expect(py).toMatch(/ALIASES = \{"male": "en_US-ryan-medium", "female": "en_US-amy-medium"\}/);
    // Checked 2026-09-25 against rhasspy/piper VOICES.md (the index of the
    // rhasspy/piper-voices v1.0.0 files); a name outside it would 404 forever.
    const VERIFIED = [
      'en_US-ryan-medium', 'en_US-amy-medium', 'en_US-lessac-medium', 'en_US-joe-medium',
      'en_US-hfc_male-medium', 'en_US-hfc_female-medium', 'en_GB-alan-medium',
      'en_GB-northern_english_male-medium', 'en_US-ryan-high',
    ];
    for (const id of installIds) expect(VERIFIED, `${id} was not verified against piper's index`).toContain(id);
  });
});

describe('the picker', () => {
  const catalog = [
    { id: 'system', label: 'Church studio voice', group: VOICE_GROUPS.STUDIO, usable: true, note: 'Studio line.' },
    { id: 'house:en_GB-alan-medium', label: 'Alan', group: VOICE_GROUPS.HOUSE, usable: true, note: 'House line.' },
    { id: 'x', label: 'Odd', group: 'A group nobody listed', usable: true, note: 'Odd line.' },
  ];
  let pickRoot; let host;
  beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); pickRoot = createRoot(host); });
  afterEach(() => { act(() => pickRoot.unmount()); host.remove(); });

  it('picking a voice saves it AND plays a sample in it; the note is shown', () => {
    const setVoiceId = vi.fn(); const preview = vi.fn();
    act(() => pickRoot.render(createElement(VoicePicker, { catalog, voiceId: 'system', setVoiceId, preview })));
    const sel = host.querySelector('[data-testid="voice-picker-select"]');
    act(() => {
      sel.value = 'house:en_GB-alan-medium';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(setVoiceId).toHaveBeenCalledWith('house:en_GB-alan-medium');
    expect(preview).toHaveBeenCalledWith('house:en_GB-alan-medium');
    expect(host.querySelector('[data-testid="voice-picker-note"]').textContent).toBe('Studio line.');
  });

  it('never cuts into a reading with a sample', () => {
    const preview = vi.fn();
    act(() => pickRoot.render(createElement(VoicePicker, { catalog, voiceId: 'system', setVoiceId: () => {}, preview, isReading: true })));
    const sel = host.querySelector('[data-testid="voice-picker-select"]');
    act(() => { sel.value = 'x'; sel.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(preview).not.toHaveBeenCalled();
  });

  it('every group shows, in catalog order, even one no list names', () => {
    act(() => pickRoot.render(createElement(VoicePicker, { catalog, voiceId: 'system', setVoiceId: () => {} })));
    const labels = [...host.querySelectorAll('optgroup')].map((g) => g.label);
    expect(labels).toEqual([VOICE_GROUPS.STUDIO, VOICE_GROUPS.HOUSE, 'A group nobody listed']);
  });

  it('a TV remote can work it: native select + button, both focusable with a visible focus ring', () => {
    const preview = vi.fn();
    act(() => pickRoot.render(createElement(VoicePicker, { catalog, voiceId: 'system', setVoiceId: () => {}, preview })));
    const sel = host.querySelector('[data-testid="voice-picker-select"]');
    const hear = host.querySelector('[data-testid="voice-picker-hear"]');
    expect(sel.tagName).toBe('SELECT');
    expect(hear.tagName).toBe('BUTTON');
    for (const el of [sel, hear]) {
      expect(el.getAttribute('tabindex')).not.toBe('-1');
      expect(el.className).toMatch(/focus-visible:outline/);
      el.focus();
      expect(document.activeElement).toBe(el);
    }
    // Enter / OK on a remote activates a focused <button> as a click.
    act(() => hear.click());
    expect(preview).toHaveBeenCalledWith('system');
  });
});
