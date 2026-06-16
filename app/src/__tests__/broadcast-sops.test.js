// @vitest-environment node
//
// broadcast-sops — the POV Sequence / SOP Library. These prove the reserved
// structure is honest (DR-0076): every clip is pending-capture with NO fake media
// URL, every sequence carries a real written checklist, the pipeline is sovereign +
// capture-only, Deacon Wright's founding sequence is flagged, and the consent
// bright line (team + gear, never the congregation) is present.
import { describe, it, expect } from 'vitest';
import {
  SOP_SEQUENCES, SOP_CAPTURE_PIPELINE, sopLibrarySummary, sopLibraryMarkdown,
} from '../lib/broadcast-sops.js';

describe('the SOP library structure (clip + checklist per sequence)', () => {
  it('covers the named stations with a real checklist each', () => {
    expect(SOP_SEQUENCES.length).toBeGreaterThanOrEqual(5);
    for (const s of SOP_SEQUENCES) {
      expect(s.id && s.station && s.owner && s.title).toBeTruthy();
      expect(Array.isArray(s.steps)).toBe(true);
      expect(s.steps.length).toBeGreaterThan(2);
    }
    const stations = SOP_SEQUENCES.map((s) => s.station.toLowerCase()).join(' | ');
    expect(stations).toMatch(/obs/);
    expect(stations).toMatch(/camera/);
    expect(stations).toMatch(/lighting/);
    expect(stations).toMatch(/video wall|video-wall/);
    expect(stations).toMatch(/service open|founding/);
  });
  it('every clip is pending-capture with NO fake media url (honest reality-trace)', () => {
    for (const s of SOP_SEQUENCES) {
      expect(s.clip.status).toBe('pending-capture');
      expect(s.clip.src).toBeNull();
    }
  });
  it("captures Deacon Wright's founding sequence, flagged as founding", () => {
    const founding = SOP_SEQUENCES.find((s) => s.founding);
    expect(founding).toBeTruthy();
    expect(founding.owner).toMatch(/Wright/);
  });
});

describe('the pipeline is sovereign, capture-only, consent-bound', () => {
  it('routes raw media to the NAS + local LLM, never Meta cloud for content', () => {
    expect(SOP_CAPTURE_PIPELINE.captureOnly).toBe(true);
    expect(SOP_CAPTURE_PIPELINE.sovereign).toBe(true);
    const steps = SOP_CAPTURE_PIPELINE.steps.join(' ').toLowerCase();
    expect(steps).toMatch(/nas|sovereign store/);
    expect(steps).toMatch(/local/);
    expect(steps).toMatch(/never meta|not meta/);
  });
  it('states the consent bright line: team + gear, never the congregation', () => {
    expect(SOP_CAPTURE_PIPELINE.consent.toLowerCase()).toMatch(/never the congregation/);
  });
});

describe('library summary + markdown', () => {
  it('summary reports 0 captured today (every clip pending), honestly', () => {
    const sum = sopLibrarySummary();
    expect(sum.total).toBe(SOP_SEQUENCES.length);
    expect(sum.captured).toBe(0);
    expect(sum.pending).toBe(SOP_SEQUENCES.length);
  });
  it('markdown carries the pipeline, consent, and every sequence checklist', () => {
    const md = sopLibraryMarkdown();
    expect(md).toContain('Sequence / SOP Library');
    expect(md).toMatch(/Never the congregation/i);
    for (const s of SOP_SEQUENCES) expect(md).toContain(s.title);
  });
});
