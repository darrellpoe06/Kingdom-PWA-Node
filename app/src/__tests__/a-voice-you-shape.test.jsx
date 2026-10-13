// @vitest-environment jsdom
// =============================================================================
// Each voice keeps its own pitch, so one engine voice is several readers (DR-0801)
// =============================================================================
// Darrell 2026-10-07, on the Firestick: "Can we choose different male and
// female voices... different pitches... or even a pitch and other voice kpi
// sliders to get a unique voice that has the right sound for each
// individual?" — and, in the same breath, the measurement that makes it
// matter: "I only see one option other than my own that doesn't work yet
// until the 4070 does something... correct?"
//
// He is right about what he sees, and this file pins why. The picker's third
// group is whatever speechSynthesis.getVoices() hands back on THAT device; a
// TV browser hands back almost none. The Web Speech API has no gender field,
// so male and female come only from the named voices a device offers. Pitch
// is the lever we own — and the engine carried one all along with nothing to
// set it. Now it is set, and kept PER VOICE.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  PITCH_STEPS, DEFAULT_PITCH, MIN_PITCH, MAX_PITCH, VOICE_SHAPE_KEY,
  clampPitch, pitchStep, nextPitch, loadVoiceShapes, saveVoiceShape, shapeFor, distinctVoices,
} from '../lib/voice-shape.js';
import { createBrowserTTS, DEFAULT_PITCH as TTS_DEFAULT_PITCH } from '../lib/tts.js';

describe('the shape a voice keeps', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* private mode */ } });

  it('five named steps, lowest to highest, each with one word', () => {
    expect(PITCH_STEPS.length).toBe(5);
    const values = PITCH_STEPS.map((s) => s.value);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    expect(values).toContain(DEFAULT_PITCH);
    for (const s of PITCH_STEPS) {
      expect(s.label.split(/\s/).length, `${s.label} is one word`).toBe(1);
      expect(s.label.length).toBeLessThanOrEqual(8);
      expect(s.name.length).toBeGreaterThan(s.label.length);
      expect(s.value).toBeGreaterThanOrEqual(MIN_PITCH);
      expect(s.value).toBeLessThanOrEqual(MAX_PITCH);
    }
  });

  it('a pitch is clamped, and never NaN whatever it is handed', () => {
    expect(clampPitch(1.0)).toBe(1.0);
    expect(clampPitch(9)).toBe(MAX_PITCH);
    expect(clampPitch(-3)).toBe(MIN_PITCH);
    expect(clampPitch('zzz')).toBe(DEFAULT_PITCH);
    expect(clampPitch(undefined)).toBe(DEFAULT_PITCH);
    expect(clampPitch(null)).toBe(DEFAULT_PITCH);
  });

  it('a pitch belongs to the nearest named step, and one tap walks them and wraps', () => {
    expect(pitchStep(1.0).label).toBe('Natural');
    expect(pitchStep(0.62).label).toBe('Deepest');
    expect(pitchStep(1.55).label).toBe('Highest');
    expect(pitchStep('nonsense').label).toBe('Natural');
    let p = PITCH_STEPS[0].value;
    const walked = [pitchStep(p).label];
    for (let i = 0; i < 4; i += 1) { p = nextPitch(p); walked.push(pitchStep(p).label); }
    expect(walked).toEqual(PITCH_STEPS.map((s) => s.label));
    expect(pitchStep(nextPitch(p)).label, 'wraps to the lowest').toBe(PITCH_STEPS[0].label);
  });

  it('the shape is kept per VOICE, so two voices hold two different sounds', () => {
    saveVoiceShape('voice-a', { pitch: 0.6 });
    saveVoiceShape('voice-b', { pitch: 1.6 });
    expect(shapeFor('voice-a').pitch).toBe(0.6);
    expect(shapeFor('voice-b').pitch).toBe(1.6);
    expect(shapeFor('voice-never-shaped').pitch, 'an unshaped voice is Natural').toBe(DEFAULT_PITCH);
  });

  it('a voice shaped back to Natural is forgotten, not stored as a default', () => {
    saveVoiceShape('voice-a', { pitch: 0.8 });
    expect(Object.keys(loadVoiceShapes())).toEqual(['voice-a']);
    saveVoiceShape('voice-a', { pitch: DEFAULT_PITCH });
    expect(loadVoiceShapes()).toEqual({});
    expect(localStorage.getItem(VOICE_SHAPE_KEY), 'the empty file is removed, not left as {}').toBeNull();
  });

  it('PROVEN TO CATCH: rubbish in storage reads as no shapes, never a crash and never a bad pitch', () => {
    localStorage.setItem(VOICE_SHAPE_KEY, 'not json at all');
    expect(loadVoiceShapes()).toEqual({});
    localStorage.setItem(VOICE_SHAPE_KEY, '[1,2,3]');
    expect(loadVoiceShapes()).toEqual({});
    localStorage.setItem(VOICE_SHAPE_KEY, JSON.stringify({ a: { pitch: 'high' }, b: { pitch: 99 }, c: null }));
    const got = loadVoiceShapes();
    expect(got.a, 'a non-number is dropped').toBeUndefined();
    expect(got.c).toBeUndefined();
    expect(got.b.pitch, 'an out-of-range number is clamped, not trusted').toBe(MAX_PITCH);
  });

  it('a storage that throws is survived on both the read and the write', () => {
    const angry = { getItem() { throw new Error('private mode'); }, setItem() { throw new Error('private mode'); }, removeItem() { throw new Error('nope'); } };
    expect(() => loadVoiceShapes(angry)).not.toThrow();
    expect(loadVoiceShapes(angry)).toEqual({});
    expect(() => saveVoiceShape('v', { pitch: 1.3 }, angry)).not.toThrow();
  });

  it('says honestly how many readers this device can actually tell apart', () => {
    // Darrell's Firestick: the System voice plus his own, which cannot read yet.
    const firestick = [{ id: 'system', usable: true }, { id: 'person:darrell', usable: false }];
    const d = distinctVoices(firestick, { system: { pitch: 0.6 } });
    expect(d.voices, 'one usable voice, which is what he sees').toBe(1);
    expect(d.shaped).toBe(1);
    expect(d.reachable, 'one voice at five pitches').toBe(5);
    expect(distinctVoices([], {}).reachable).toBe(0);
  });
});

describe('the engine really speaks at the pitch it is given', () => {
  // The whole claim rests on u.pitch reaching the utterance. Measured, not assumed.
  function fakeSynth() {
    const spoken = [];
    return {
      spoken,
      synth: {
        speaking: false, paused: false,
        speak(u) { spoken.push({ text: u.text, pitch: u.pitch, rate: u.rate }); this.speaking = true; if (u.onstart) u.onstart(); },
        cancel() { this.speaking = false; },
        pause() { this.paused = true; },
        resume() { this.paused = false; },
        getVoices: () => [],
      },
    };
  }
  class FakeUtterance {
    constructor(text) { this.text = text; this.pitch = 1; this.rate = 1; }
  }

  it('a pitch set on the engine lands on the utterance', () => {
    const f = fakeSynth();
    const eng = createBrowserTTS({ synth: f.synth, Utterance: FakeUtterance, prefs: { rate: 1, pitch: 1 }, doc: document });
    expect(eng.pitch).toBe(TTS_DEFAULT_PITCH);
    eng.setPitch(0.6);
    expect(eng.pitch).toBe(0.6);
    eng.load('Yahweh asked Moses a question once.');
    eng.play();
    expect(f.spoken.length).toBeGreaterThan(0);
    expect(f.spoken[0].pitch, 'the utterance carries the pitch').toBe(0.6);
  });

  it('PROVEN TO CATCH: a pitch that is not a number never reaches the utterance', () => {
    const f = fakeSynth();
    const eng = createBrowserTTS({ synth: f.synth, Utterance: FakeUtterance, prefs: { rate: 1, pitch: 1 }, doc: document });
    eng.setPitch('deep please');
    expect(eng.pitch).toBe(TTS_DEFAULT_PITCH);
    eng.load('It was just a stick.');
    eng.play();
    expect(Number.isFinite(f.spoken[0].pitch)).toBe(true);
  });
});
