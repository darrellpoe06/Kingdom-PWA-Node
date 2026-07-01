// @vitest-environment node
//
// help-freshness — the gate that keeps the Help tab CURRENT so the two-tier
// self-explaining surfaces stay LIGHT (Darrell 2026-07-01: "keeping up with the
// help tab keeps the PoeTech App clean and clear of clutter"). Proven-to-catch:
// a stale/missing Help entry FAILS; the live tree's committed help-freshness.json
// is byte-in-sync with a fresh reconcile (DR-0076 — a gate that only ever passes
// is a lie).
import { describe, it, expect } from 'vitest';
import { computeFreshness, buildRecords, loadRecords, findingsFromFreshness } from '../../../scripts/help-freshness.mjs';
import { SURFACE_HELP, aboutFingerprint, deriveHelpFromAbout } from '../lib/surface-help.js';
import { HELP } from '../lib/help-content.js';

const ABOUT = { what: 'W', where: 'S', how: 'H', helpTopic: 'x:one' };
const REG = { 'x:one': ABOUT };

describe('aboutFingerprint — a stable key that moves only when the copy moves', () => {
  it('is deterministic and whitespace-insensitive', () => {
    expect(aboutFingerprint(ABOUT)).toBe(aboutFingerprint({ ...ABOUT, what: ' W ' }));
  });
  it('changes when the surface summary changes (the staleness signal)', () => {
    expect(aboutFingerprint(ABOUT)).not.toBe(aboutFingerprint({ ...ABOUT, what: 'W2' }));
  });
});

describe('computeFreshness — proven to CATCH stale / missing Help', () => {
  it('CURRENT when the recorded fingerprint matches and an entry exists', () => {
    const fr = computeFreshness({ 'x:one': aboutFingerprint(ABOUT) }, { 'x:one': {} }, REG);
    expect(fr.ok).toBe(true);
    expect(fr.rows[0].status).toBe('current');
  });
  it('STALE when the surface changed but the record did not', () => {
    const fr = computeFreshness({ 'x:one': 'deadbeef' }, { 'x:one': {} }, REG);
    expect(fr.ok).toBe(false);
    expect(fr.stale.map((r) => r.topic)).toEqual(['x:one']);
  });
  it('MISSING-ENTRY when a self-explaining surface has no Help entry', () => {
    const fr = computeFreshness({ 'x:one': aboutFingerprint(ABOUT) }, {}, REG);
    expect(fr.ok).toBe(false);
    expect(fr.missing.map((r) => r.topic)).toEqual(['x:one']);
  });
  it('UNRECORDED (a brand-new surface never synced) also fails the gate', () => {
    const fr = computeFreshness({}, { 'x:one': {} }, REG);
    expect(fr.ok).toBe(false);
    expect(fr.stale[0].status).toBe('unrecorded');
  });
  it('surfaces its failures as audit findings for the proactive reviewer', () => {
    const fr = computeFreshness({ 'x:one': 'deadbeef' }, { 'x:one': {} }, REG);
    const findings = findingsFromFreshness(fr);
    expect(findings).toHaveLength(1);
    expect(findings[0].dimension).toBe('self-explaining');
    expect(findings[0].detectedBy).toBe('help-freshness');
  });
});

describe('deriveHelpFromAbout — the auto-create seed for a NEW surface', () => {
  it('produces a help-shaped entry anchored to the about', () => {
    const seed = deriveHelpFromAbout(ABOUT, { title: 'One', section: 'church' });
    expect(seed.what).toBe('W');
    expect(Array.isArray(seed.how)).toBe(true);
    expect(seed._seededFromSurface).toBe(true);
  });
});

describe('the LIVE tree keeps Help current', () => {
  it('is not vacuous — there are self-explaining surfaces registered', () => {
    expect(Object.keys(SURFACE_HELP).length).toBeGreaterThan(0);
  });
  it('every self-explaining surface has a current Help entry (THE gate)', () => {
    const fr = computeFreshness(); // real records + real HELP + real SURFACE_HELP
    const bad = [...fr.missing, ...fr.stale].map((r) => `${r.topic}:${r.status}`);
    expect(fr.ok, `Help out of date: ${bad.join(', ')} — run: node scripts/help-freshness.mjs --sync`).toBe(true);
  });
  it('committed help-freshness.json is byte-in-sync with a fresh reconcile', () => {
    expect(loadRecords()).toEqual(buildRecords().topics);
  });
  it('every registered topic resolves to a real, non-empty Help entry', () => {
    for (const topic of Object.keys(SURFACE_HELP)) {
      expect(HELP[topic], `missing HELP['${topic}']`).toBeTruthy();
      expect(String(HELP[topic].what || '').length).toBeGreaterThan(0);
    }
  });
});
