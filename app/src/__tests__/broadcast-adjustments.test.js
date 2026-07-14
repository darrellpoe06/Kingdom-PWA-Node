// Christina's broadcast review (2026-07-14) — proven-to-catch. Guards the three
// captured directives against drift: (1) saxophone DOWN, (2) choir UP to sit just
// BELOW the lead (not level, not the buried "way lower" it is now), (3) the choir
// walk-in HOLD-then-REVEAL cue (hold the graphic through the walk-in; reveal only
// when the choir is fully set). Flip any directive to its opposite and a case
// fails. Nothing here is allowed to read "done" — these are requests until an
// operator sets them and a reviewer signs off (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  BROADCAST_REVIEW, AUDIO_ADJUSTMENTS, CHOIR_WALKIN_CUE, BROADCAST_ADJUSTMENTS,
} from '../lib/broadcast-adjustments.js';

describe('BROADCAST_REVIEW — attributed to Christina, relayed by Darrell', () => {
  it('names Christina as the reviewer and Darrell as the relay, dated 2026-07-14', () => {
    expect(BROADCAST_REVIEW.reviewer).toMatch(/Christina/);
    expect(BROADCAST_REVIEW.relayedBy).toMatch(/Darrell/);
    expect(BROADCAST_REVIEW.capturedOn).toBe('2026-07-14');
  });
  it('is the online broadcast (YouTube + Facebook), reviewed as a viewer meets it', () => {
    expect(BROADCAST_REVIEW.service).toMatch(/YouTube/);
    expect(BROADCAST_REVIEW.service).toMatch(/Facebook/);
    expect(BROADCAST_REVIEW.posture).toMatch(/DR-0104|viewer/i);
  });
});

describe('AUDIO_ADJUSTMENTS — sax down, choir up to just under the lead', () => {
  it('every item is addressed to the Yamaha TF5 station and is a request, not "done"', () => {
    for (const a of AUDIO_ADJUSTMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.station).toMatch(/Yamaha TF5/);
      expect(a.change).toBeTruthy();
      expect(a.status).toBe('requested');
      expect(a.status).not.toMatch(/done|complete|fixed/i);
    }
  });
  it('turns the SAXOPHONE DOWN', () => {
    const sax = AUDIO_ADJUSTMENTS.find((a) => a.id === 'sax-down');
    expect(sax.change).toMatch(/saxophone/i);
    expect(sax.change).toMatch(/down/i);
    expect(sax.change).not.toMatch(/\bup\b/i);
  });
  it('brings the CHOIR UP to sit just BELOW the lead — not level, not still buried', () => {
    const choir = AUDIO_ADJUSTMENTS.find((a) => a.id === 'choir-up');
    expect(choir.change).toMatch(/choir/i);
    expect(choir.change).toMatch(/up/i);
    // The target is RELATIVE: a little below the lead, correcting the current "way lower".
    expect(choir.target).toMatch(/below|lower/i);
    expect(choir.target).toMatch(/lead/i);
    expect(choir.why).toMatch(/buried|distant|way lower/i);
  });
});

describe('CHOIR_WALKIN_CUE — hold the graphic through the walk-in, reveal only when set', () => {
  it('is on the online-broadcast program path (not the LED-wall Freeze) and is a request', () => {
    expect(CHOIR_WALKIN_CUE.station).toMatch(/program|OBS|ATEM/i);
    expect(CHOIR_WALKIN_CUE.status).toBe('requested');
  });
  it('the principle: never show the choir walking in; reveal only when fully set', () => {
    expect(CHOIR_WALKIN_CUE.principle).toMatch(/walking in/i);
    expect(CHOIR_WALKIN_CUE.principle).toMatch(/only when|fully in place|ready/i);
    expect(CHOIR_WALKIN_CUE.principle).toMatch(/always/i); // "as if always set"
  });
  it('holds the graphic DURING the walk-in and does NOT cut to the choir mid-entrance', () => {
    const during = CHOIR_WALKIN_CUE.steps.find((s) => /DURING/i.test(s));
    expect(during).toMatch(/HOLD/i);
    expect(during).toMatch(/do NOT cut|not cut/i);
  });
  it('reveals the choir + drops the graphic ONLY when the choir is fully set', () => {
    const reveal = CHOIR_WALKIN_CUE.steps.find((s) => /ONLY WHEN/i.test(s));
    expect(reveal).toMatch(/fully set|in place|ready/i);
    expect(reveal).toMatch(/down/i); // take the holding graphic down
  });
  it('gates the reveal on the choir being set (observed off-program), never on a timer', () => {
    expect(CHOIR_WALKIN_CUE.guard).toMatch(/never on a timer|not.*timer/i);
    expect(CHOIR_WALKIN_CUE.guard).toMatch(/hold the graphic longer|hold.*longer/i);
  });
});

describe('BROADCAST_ADJUSTMENTS — the one record the surface reads', () => {
  it('bundles the review, both audio items, and the video cue', () => {
    expect(BROADCAST_ADJUSTMENTS.review).toBe(BROADCAST_REVIEW);
    expect(BROADCAST_ADJUSTMENTS.audio).toHaveLength(2);
    expect(BROADCAST_ADJUSTMENTS.video).toContain(CHOIR_WALKIN_CUE);
  });
});
