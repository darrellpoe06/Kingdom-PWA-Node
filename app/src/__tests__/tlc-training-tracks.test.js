import { describe, it, expect } from 'vitest';
import {
  TLC_TRAINING_TRACKS, getTrack, listTracks, trackHoursStructure, tracksSummary,
  allTracksConfirmed, UIUC_PIPELINE, IL_MIN_MONTHS, TRACK_SOURCES,
} from '../lib/tlc-training-tracks.js';

describe('multi-track structure — one backbone, many audiences', () => {
  it('serves the four named audiences/tracks', () => {
    const keys = TLC_TRAINING_TRACKS.map((t) => t.key);
    expect(keys).toEqual(['msw-field', 'lcsw-supervised', 'licensed-ce', 'contractor']);
  });

  it('GROUNDED IL/CSWE figures are present and CITED (not fabricated)', () => {
    const mswField = getTrack('msw-field');
    expect(mswField.requirement.hours).toBe(900);       // CSWE MSW field minimum
    expect(mswField.requirement.source).toBe(TRACK_SOURCES.cswe);

    const lcsw = getTrack('lcsw-supervised');
    expect(lcsw.requirement.hours).toBe(3000);          // IL supervised clinical
    expect(lcsw.requirement.months).toBe(24);
    expect(lcsw.requirement.source.label).toMatch(/225 ILCS 20|IL Clinical Social Work/);

    const ce = getTrack('licensed-ce');
    expect(ce.requirement.hours).toBe(30);              // IL CE per 2-yr cycle
  });

  it('PROVEN-TO-CATCH: state-hour requirements are SME-confirm-pending (flagged, not assumed)', () => {
    expect(getTrack('msw-field').requirement.confirmed).toBe(false);
    expect(getTrack('lcsw-supervised').requirement.confirmed).toBe(false);
    expect(getTrack('lcsw-supervised').requirement.smeConfirm).toMatch(/face-to-face|supervisor/i);
    expect(allTracksConfirmed()).toBe(false); // not all confirmed until Christina ratifies
  });

  it('everything maps across the 24-month minimum window', () => {
    expect(IL_MIN_MONTHS).toBe(24);
    for (const t of TLC_TRAINING_TRACKS) expect(t.requirement.months).toBe(24);
  });

  it('the curriculum role is HONEST: it supplies CE/onboarding hours but only COMPLEMENTS clinical hours', () => {
    expect(trackHoursStructure(getTrack('msw-field'), {}).curriculumRole).toBe('complements');
    expect(trackHoursStructure(getTrack('lcsw-supervised'), {}).curriculumRole).toBe('complements');
    expect(trackHoursStructure(getTrack('licensed-ce'), {}).curriculumRole).toBe('supplies');
    expect(trackHoursStructure(getTrack('contractor'), {}).curriculumRole).toBe('supplies');
    // The complements note never claims didactic hours satisfy the clinical requirement.
    expect(trackHoursStructure(getTrack('lcsw-supervised'), {}).note).toMatch(/ledger/i);
  });

  it('trackHoursStructure spreads the requirement across 24 months', () => {
    const s = trackHoursStructure(getTrack('lcsw-supervised'), { hoursPerMonth: 24 });
    expect(s.requirementPerMonth).toBe(125);            // 3000 / 24
    expect(s.trainingOverWindow).toBe(24 * 24);
  });

  it('tracksSummary returns a structure per track', () => {
    const rows = tracksSummary({ libraryHours: 60 });
    expect(rows.length).toBe(4);
    expect(rows.every((r) => r.structure)).toBe(true);
  });

  it('the contractor onboarding track is internal + confirmed (not a state mandate)', () => {
    const c = getTrack('contractor');
    expect(c.requirement.kind).toBe('onboarding');
    expect(c.requirement.confirmed).toBe(true);
  });

  it('UIUC pipeline captures the business positioning + Christiana connection', () => {
    expect(UIUC_PIPELINE.market).toMatch(/UIUC|Urbana/);
    expect(UIUC_PIPELINE.connection.name).toBe('Christiana Poe');
    expect(UIUC_PIPELINE.connection.relationship).toMatch(/BSW.{0,3}MSW/i);
    expect(UIUC_PIPELINE.recruitment).toMatch(/recruit/i);
  });

  it('listTracks gives a compact picker shape', () => {
    expect(listTracks().map((t) => t.kind)).toEqual(['field', 'supervised', 'ce', 'onboarding']);
  });
});
