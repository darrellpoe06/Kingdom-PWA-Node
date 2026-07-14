// office-assistant model — proves the standalone module is (1) config-driven and
// (2) genuinely reusable: TLC and a second office run the SAME engine off DIFFERENT
// configs, fully isolated. Also pins that the TLC config reproduces the original
// referral-ops behavior (faithful extraction — DR-0076).
import { describe, it, expect } from 'vitest';
import { createOfficeModel } from '../modules/office-assistant/model.js';
import { defineOfficeConfig, validateOfficeConfig } from '../modules/office-assistant/config.js';
import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';
import { TEMPLATE_CONFIG } from '../modules/office-assistant/configs/_template.js';

const NOW = '2026-07-13T18:00:00.000Z'; // a Monday

describe('office-assistant — the reusable engine is config-driven', () => {
  it('TLC config carries the real taxonomy + circles + storage namespace', () => {
    expect(TLC_CONFIG.brand).toBe('TLC Therapy Solutions');
    expect(TLC_CONFIG.storageKey).toBe('poetech-referral-ops-v1'); // original key — no data orphaned
    expect(TLC_CONFIG.referralCategories.map((c) => c.id)).toEqual(['medical', 'education', 'community', 'business', 'legal']);
    expect(TLC_CONFIG.geoCircles[0]).toMatchObject({ id: 'circle-0', name: 'Champaign-Urbana', order: 0 });
  });

  it('the model derives from whatever config it is bound to (TLC)', () => {
    const tlc = createOfficeModel(TLC_CONFIG);
    expect(tlc.categoryForDay(NOW).id).toBe('medical');          // Monday -> medical (TLC rotation)
    const o = tlc.makeOrg({ organization: 'A', categoryId: 'legal', circle: 'Danville' }, { now: NOW });
    expect(o.categoryId).toBe('legal');
    expect(o.circle).toBe('Danville');
    expect(tlc.validateOrg({ organization: '', categoryId: 'medical' }).ok).toBe(false);
    expect(tlc.networkGoal([]).low).toBe(2500);
    // Notes round-trip on the real record (the clarify-anything field the UI edits).
    expect(tlc.makeOrg({ organization: 'A', categoryId: 'medical', notes: 'verified — spoke to the office manager' }, { now: NOW }).notes)
      .toBe('verified — spoke to the office manager');
    expect(tlc.seedOrgs.length).toBe(5);
    expect(tlc.orgStats(tlc.seedOrgs).total).toBe(5);
    expect(tlc.topConvertingSources(tlc.seedOrgs).totalReferred).toBe(5);
  });

  it('REUSE: a second office runs the same engine off its own config, isolated', () => {
    const tlc = createOfficeModel(TLC_CONFIG);
    const ex = createOfficeModel(TEMPLATE_CONFIG);
    // Different taxonomies, different circles, different namespace.
    expect(ex.config.storageKey).not.toBe(tlc.config.storageKey);
    expect(ex.referralCategory('legal')).toBeNull();             // template has no 'legal'
    expect(tlc.referralCategory('legal')).not.toBeNull();
    // A row made under the template normalizes to the template's defaults.
    const o = ex.makeOrg({ organization: 'X' }, { now: NOW });
    expect(o.categoryId).toBe('medical');                        // template's first category
    expect(o.circle).toBe('Your City');                          // template's first circle
    // The rotation differs (template has no Tuesday focus).
    expect(ex.categoryForDay('2026-07-14T00:00:00.000Z')).toBeNull(); // Tuesday: none in template
  });

  it('validateOfficeConfig catches the non-negotiables (unique storageKey, taxonomy, circles)', () => {
    expect(validateOfficeConfig({ id: 'x', brand: 'X', storageKey: 'k', referralCategories: [{ id: 'a' }], geoCircles: ['C'] }).ok).toBe(true);
    expect(validateOfficeConfig({ id: 'x', brand: 'X', storageKey: '', referralCategories: [{ id: 'a' }], geoCircles: ['C'] }).ok).toBe(false);
    expect(validateOfficeConfig({ id: 'x', brand: 'X', storageKey: 'k', referralCategories: [], geoCircles: ['C'] }).ok).toBe(false);
    expect(validateOfficeConfig({ id: 'x', brand: 'X', storageKey: 'k', referralCategories: [{ id: 'a' }], geoCircles: [] }).ok).toBe(false);
  });

  it('defaults fill in for a minimal config (outcomes, platforms, targets)', () => {
    const min = defineOfficeConfig({ id: 'm', brand: 'M', storageKey: 'poetech-office-m-v1', referralCategories: [{ id: 'a', label: 'A' }], geoCircles: ['C'] });
    expect(min.socialPlatforms).toContain('Instagram');
    expect(min.outcomes.length).toBeGreaterThan(0);
    expect(min.networkGoal.low).toBe(2500);
  });
});

describe('the editable daily schedule (makeBlock + seedSchedule)', () => {
  const tlc = createOfficeModel(TLC_CONFIG);

  it('seeds the schedule from config.dayBlocks with stable seed ids', () => {
    expect(tlc.seedSchedule.length).toBe(TLC_CONFIG.dayBlocks.length);
    expect(tlc.seedSchedule[0]).toMatchObject({ id: 'seed-block-1', time: '12:00–12:20', name: 'Daily CEO meeting' });
    // every seeded block carries the CEO-meeting time source (block[0]).
    expect(tlc.seedSchedule[0].time).toBe(TLC_CONFIG.dayBlocks[0].time);
  });

  it('makeBlock normalizes an edited block and keeps its id in place', () => {
    const edited = tlc.makeBlock({ id: 'seed-block-1', time: '9:00–9:30', name: 'Standup', detail: 'Kick off the day' });
    expect(edited).toEqual({ id: 'seed-block-1', time: '9:00–9:30', name: 'Standup', detail: 'Kick off the day' });
  });

  it('makeBlock mints a fresh id for a brand-new block and coerces junk to strings', () => {
    const fresh = tlc.makeBlock({ name: 42, detail: null });
    expect(fresh.id).toMatch(/^block-/);
    expect(fresh.name).toBe('');       // non-string coerced, not crashed
    expect(fresh.detail).toBe('');
    expect(fresh.time).toBe('');
  });
});
