// @vitest-environment node
//
// ari — Ari is the PoeTech A.I. identity (the Black Lion, the Lion of Judah).
// These prove the ONE identity source holds the binding doctrine and that the
// surfaces which speak as the A.I. actually carry Ari's persona — so the same
// Ari speaks everywhere (DR-0079), under the Most High, and honest about being a
// tool (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  ARI, ARI_PERSONA, ariSystemPrompt, ARI_VOICE_NAME, ARI_VOICE_DESCRIPTION,
} from '../lib/ari.js';
import { SYSTEM_VOICE } from '../lib/voice-registry.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { MODULES } from '../lib/church-classes.js';

describe('Ari is one consistent identity', () => {
  it('names Ari, the Lion of Judah', () => {
    expect(ARI.name).toBe('Ari');
    expect(ARI.title).toMatch(/Lion of Judah/);
    expect(ARI.meaning.toLowerCase()).toContain('lion');
    expect(ARI.scriptureRef).toBe('Revelation 5:5');
  });
  it('is honest that it is a sovereign tool that can be wrong (DR-0076)', () => {
    expect(ARI.honesty).toMatch(/sovereign/i);
    expect(ARI.honesty).toMatch(/wrong|test|verify/i);
  });
});

describe('the persona carries the binding doctrine', () => {
  it('holds Yahweh as the Most High and Ari UNDER Him (never a rival)', () => {
    expect(ARI_PERSONA).toMatch(/Most High/);
    expect(ARI_PERSONA).toMatch(/Yahweh/);
    expect(ARI_PERSONA).toMatch(/under the Most High|bow/i);
    // Ari never claims to be divine / to be the Lion himself.
    expect(ARI_PERSONA).toMatch(/never claim/i);
  });
  it('holds the Godhead even-handed (Father, Son, Holy Spirit named)', () => {
    expect(ARI_PERSONA).toMatch(/the Father/);
    expect(ARI_PERSONA).toMatch(/the Son|Jesus/);
    expect(ARI_PERSONA).toMatch(/the Holy Spirit/);
  });
  it('carries the mission: open eyes / sight as liberation', () => {
    expect(ARI_PERSONA.toLowerCase()).toMatch(/open .* eyes|blind|sight/);
  });
  it('instructs the binding typography and never capitalizes the adversary', () => {
    expect(ARI_PERSONA).toMatch(/[Cc]apitalize references to God/);
    // The persona text itself must not capitalize an adversary name.
    expect(ARI_PERSONA).not.toMatch(/Satan|Lucifer|The Devil|The Adversary/);
  });
  it('stays plain and never preachy (a posture, not a sermon)', () => {
    expect(ARI_PERSONA.toLowerCase()).toMatch(/never preachy|plain/);
  });
});

describe('THE HEART — the unseen, made seen (Darrell, 2026-06-26)', () => {
  it('the persona carries the Black Lion = the unseen', () => {
    expect(ARI_PERSONA).toMatch(/UNSEEN|unseen/);
    expect(ARI_PERSONA).toMatch(/no black lions/i);
    expect(ARI_PERSONA).toMatch(/real, royal/i);
  });
  it('the persona names Yahweh as El Roi, the God who SEES (Genesis 16:13)', () => {
    expect(ARI_PERSONA).toMatch(/El Roi/);
    expect(ARI_PERSONA).toMatch(/Genesis 16:13/);
    expect(ARI_PERSONA).toMatch(/Hagar/);
    expect(ARI_PERSONA).toMatch(/sees|SEES/);
  });
  it('the persona makes Ari the unseen MADE SEEN, in dignity from the Most High', () => {
    expect(ARI_PERSONA).toMatch(/made seen|MADE SEEN/i);
    expect(ARI_PERSONA).toMatch(/dignity/i);
    // The blindness is the world's, not Yahweh's.
    expect(ARI_PERSONA).toMatch(/blindness belongs to the WORLD|blindness belongs to the world/i);
  });
  it('the in-app meaning copy (ARI.meaning / meaningFull) is the unseen-made-seen heart', () => {
    expect(ARI.meaning.toLowerCase()).toContain('unseen');
    expect(ARI.meaningFull).toMatch(/unseen/i);
    expect(ARI.meaningFull).toMatch(/El Roi/);
    expect(ARI.meaningFull).toMatch(/Genesis 16:13/);
    expect(ARI.meaningFull).toMatch(/real, royal, revealed/i);
  });
  it('carries the seeing scripture (Genesis 16:13) alongside the Lion (Revelation 5:5)', () => {
    expect(ARI.seeingScriptureRef).toBe('Genesis 16:13');
    expect(ARI.scriptureRef).toBe('Revelation 5:5');
    expect(ARI.mission.toLowerCase()).toContain('unseen');
  });
});

describe('ariSystemPrompt composes identity FIRST, then the task', () => {
  it('puts the persona before the task', () => {
    const out = ariSystemPrompt('TASK: tutor the youth class.');
    expect(out.startsWith(ARI_PERSONA)).toBe(true);
    expect(out).toContain('TASK: tutor the youth class.');
    expect(out.indexOf('Ari')).toBeLessThan(out.indexOf('TASK:'));
  });
  it('returns the bare persona when there is no task', () => {
    expect(ariSystemPrompt('')).toBe(ARI_PERSONA);
    expect(ariSystemPrompt()).toBe(ARI_PERSONA);
  });
});

describe('Ari surfaces where the A.I. actually speaks', () => {
  it('the default reading voice is Ari, honestly the device system voice (not a clone)', () => {
    expect(SYSTEM_VOICE.name).toBe(ARI_VOICE_NAME);
    expect(SYSTEM_VOICE.name).toMatch(/Ari/);
    expect(SYSTEM_VOICE.description).toBe(ARI_VOICE_DESCRIPTION);
    // Honest: it must read as a system/built-in voice, not claim a cloned timbre.
    expect(ARI_VOICE_DESCRIPTION.toLowerCase()).toMatch(/built-in|system/);
    expect(SYSTEM_VOICE.kind).toBe('synthetic');
  });
  it('every course tutor speaks AS Ari, with the week content still grounded', () => {
    const sys = tutorSystemPrompt(MODULES[2]);
    expect(sys).toContain('You are Ari');           // identity established
    expect(sys.startsWith(ARI_PERSONA)).toBe(true); // identity FIRST
    expect(sys).toContain(MODULES[2].title);        // still grounded in the week
    expect(sys.toLowerCase()).toContain('verify');  // honesty preserved
  });
  it('a course-specific intro still composes under the one Ari identity', () => {
    const sys = tutorSystemPrompt(MODULES[0], {
      intro: 'You are a tutor for the broadcast team.',
      posture: 'Guide one operator.',
    });
    expect(sys).toContain('You are Ari');
    expect(sys).toContain('broadcast team');
  });
});
