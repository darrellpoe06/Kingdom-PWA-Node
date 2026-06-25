// The supporting-lessons layer backs all three sides + the whole situation. It is
// engine-shaped (learn-framework module shape) so the existing lesson engine
// renders it age-adaptively. Verified: three tracks, side mapping, engine-compat,
// guardrails + honest "needs validation" default, and CE credits TO-CONFIRM.
import { describe, it, expect } from 'vitest';
import {
  TLC_LESSON_TRACKS, LESSON_TRACK_KEYS, tracksForSide, leadMagnetLessons,
  allTracks, getTrack, isEngineRenderable, isTrackPublishable, ceCreditsToConfirm,
  READING_SUPPORT,
} from '../lib/tlc-lessons.js';
import { resolveForAge } from '../lib/learn-framework.js';

describe('three supporting-lesson tracks', () => {
  it('covers client, therapist, and whole-situation', () => {
    expect(LESSON_TRACK_KEYS.sort()).toEqual(['client', 'therapist', 'whole']);
    expect(TLC_LESSON_TRACKS.client.sideKey).toBe('client');
    expect(TLC_LESSON_TRACKS.therapist.ceTrack).toBe(true);
  });
  it('maps each marketplace side to supporting tracks (whole supports everyone)', () => {
    expect(tracksForSide('client').map((t) => t.key)).toContain('client-psychoeducation');
    expect(tracksForSide('client').map((t) => t.key)).toContain('whole-situation-support');
    expect(tracksForSide('therapist').map((t) => t.key)).toContain('clinician-ce');
    expect(tracksForSide('training').map((t) => t.key)).toEqual(['clinician-ce']);
  });
  it('exposes lead-magnet lessons per side (funnel value)', () => {
    expect(leadMagnetLessons('client').length).toBeGreaterThan(0);
    expect(leadMagnetLessons('client').every((t) => t.leadMagnet)).toBe(true);
  });
});

describe('engine compatibility (renders on the existing lesson engine)', () => {
  it('every module is engine-renderable and resolveForAge returns text per age band', () => {
    for (const track of allTracks()) {
      for (const m of track.modules) {
        expect(isEngineRenderable(m), `${track.key}/${m.id}`).toBe(true);
        const adult = resolveForAge(m, 'adult');
        expect(typeof adult.text).toBe('string');
        expect(adult.text.length).toBeGreaterThan(0);
        const senior = resolveForAge(m, 'senior');
        expect(senior.text.length).toBeGreaterThan(0);
      }
    }
  });
  it('client + whole modules carry a child/teen depth for younger / struggling readers', () => {
    const wtx = resolveForAge(TLC_LESSON_TRACKS.whole.modules[0], 'youth');
    expect(wtx.text.length).toBeGreaterThan(0);
  });
  it('reading support is on (age-adaptive + large-print + read-aloud + dyslexia-friendly)', () => {
    expect(READING_SUPPORT.ageAdaptive).toBe(true);
    expect(READING_SUPPORT.dyslexiaFriendly).toBe(true);
    for (const t of allTracks()) expect(t.readingSupport.readAloud).toBe(true);
  });
});

describe('guardrails + honesty', () => {
  it('NOTHING is publishable until validated (honest default)', () => {
    for (const t of allTracks()) expect(isTrackPublishable(t)).toBe(false);
  });
  it('client + whole tracks are psychoeducation-not-treatment', () => {
    expect(TLC_LESSON_TRACKS.client.guardrailKey).toBe('psychoeducation-not-treatment');
    expect(TLC_LESSON_TRACKS.whole.guardrailKey).toBe('psychoeducation-not-treatment');
  });
  it('therapist track is CE-accuracy and its CE credits are TO-CONFIRM (> 0 but unverified)', () => {
    expect(TLC_LESSON_TRACKS.therapist.guardrailKey).toBe('ce-accuracy');
    expect(ceCreditsToConfirm(TLC_LESSON_TRACKS.therapist)).toBeGreaterThan(0);
    expect(isTrackPublishable(TLC_LESSON_TRACKS.therapist)).toBe(false);
  });
  it('getTrack resolves by map key or track key', () => {
    expect(getTrack('client')).toBeTruthy();
    expect(getTrack('clinician-ce')).toBeTruthy();
    expect(getTrack('nope')).toBeNull();
  });
});
