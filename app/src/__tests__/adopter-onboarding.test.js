// adopter-onboarding — the offering and the guided journey. The journey must be
// real (every step answers what/when/why/how) so a new adopter is productive in
// hours, and the offering's trust promises must be present (governance IS the
// offer).
import { describe, it, expect } from 'vitest';
import {
  ADOPTER_TYPES, THE_OFFERING, ONBOARDING_JOURNEY,
  journeyFor, adopterSteps, DECISIONS_PENDING,
} from '../lib/adopter-onboarding.js';

describe('the offering', () => {
  it('names three adopter types', () => {
    expect(ADOPTER_TYPES.map((a) => a.key)).toEqual(['family', 'church', 'business']);
  });

  it('lists the free pathways including community (funded by aligned-brand partners)', () => {
    const keys = THE_OFFERING.freePathways.map((p) => p.key);
    expect(keys).toContain('foundation');
    expect(keys).toContain('community');
    const community = THE_OFFERING.freePathways.find((p) => p.key === 'community');
    expect(community.detail.toLowerCase()).toContain('aligned-brand');
    expect(community.detail.toLowerCase()).not.toContain('paying subscriber');
  });

  it('carries the governance/trust promises — sovereignty, no-sale, Cage-bounded AI', () => {
    const keys = THE_OFFERING.trustPromises.map((p) => p.key);
    for (const k of ['sovereign', 'served', 'no-sale', 'consent', 'bounded-ai']) {
      expect(keys).toContain(k);
    }
    const cage = THE_OFFERING.trustPromises.find((p) => p.key === 'bounded-ai');
    expect(cage.detail.toLowerCase()).toMatch(/budget|lock|kill-switch/);
  });
});

describe('the guided journey', () => {
  it('every step answers what / when / why / how (anxiety-clarity)', () => {
    for (const step of ONBOARDING_JOURNEY) {
      expect(step.what, `${step.id}.what`).toBeTruthy();
      expect(step.when, `${step.id}.when`).toBeTruthy();
      expect(step.why, `${step.id}.why`).toBeTruthy();
      expect(Array.isArray(step.how) && step.how.length > 0, `${step.id}.how`).toBe(true);
      expect(['adopter', 'operator']).toContain(step.owner);
    }
  });

  it('starts with create-profile and includes adding people and learning the system', () => {
    const ids = ONBOARDING_JOURNEY.map((s) => s.id);
    expect(ids[0]).toBe('create-profile');
    expect(ids).toContain('add-people');
    expect(ids).toContain('learn-the-system');
    expect(ids).toContain('tell-us');
  });

  it('journeyFor specializes the choose-starter step by type', () => {
    const fam = journeyFor('family').find((s) => s.id === 'choose-starter');
    expect(fam.what).toContain('family');
  });

  it('adopterSteps returns only self-serve steps', () => {
    expect(adopterSteps().every((s) => s.owner === 'adopter')).toBe(true);
    expect(adopterSteps().length).toBeGreaterThan(0);
  });

  it('flags the honest decisions still pending (sponsors, pricing, Tier-C go)', () => {
    expect(DECISIONS_PENDING.length).toBeGreaterThan(0);
    expect(DECISIONS_PENDING.join(' ').toLowerCase()).toMatch(/sponsor|pricing|tier-c/);
  });
});
