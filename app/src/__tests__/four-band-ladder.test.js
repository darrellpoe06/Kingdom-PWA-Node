// @vitest-environment node
// =============================================================================
// four-band-ladder — proven-to-catch (DR-0076 §3) for the shared ladder the
// banded catalog courses pin (fixtures/four-band-ladder.js).
// =============================================================================
// A green check must mean something. Each case below takes a lesson that
// PASSES the ladder and breaks exactly one thing, and the ladder must name it.
import { describe, it, expect } from 'vitest';
import { PROPERTY_PRINCIPLE_MODULES } from '../lib/property-principle-course.js';
import { fourBandFaults, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const good = PROPERTY_PRINCIPLE_MODULES[0];
const withBand = (band, text) => ({ ...good, levels: { ...good.levels, [band]: text } });

describe('the four-band ladder can fail', () => {
  it('passes the lesson it breaks below (otherwise every catch is theatre)', () => {
    expect(fourBandFaults(good)).toEqual([]);
  });

  it('sees a missing band', () => {
    const { youth, ...rest } = good.levels;
    expect(youth).toBeTruthy();
    expect(fourBandFaults({ ...good, levels: rest })).toEqual(['youth: missing']);
  });

  it('sees a band that is a summary rather than the lesson', () => {
    const stub = good.levels.youth.split('. ').slice(0, 3).join('. ');
    expect(fourBandFaults(withBand('youth', stub)).join(' ')).toMatch(/youth: carries/);
  });

  it('sees an inverted ladder — the child band handed the senior words', () => {
    expect(fourBandFaults(withBand('child', good.levels.senior)).join(' ')).toMatch(/ladder: child/);
  });

  it('sees one band repeated under two names', () => {
    expect(fourBandFaults(withBand('youth', good.levels.child)).join(' ')).toMatch(/child~youth: near copy/);
  });

  it('sees a band that never names its lesson', () => {
    const drift = 'Here we begin somewhere else entirely. Nothing in these first lines says what we study today. We talk about the weather, the drive over, the snack table, the chairs, and the long, slow week that is now behind us. ';
    expect(drift.length).toBeGreaterThan(200);
    const unnamed = drift + good.levels.teen;
    expect(fourBandFaults(withBand('teen', unnamed)).join(' ')).toMatch(/teen: does not name its lesson/);
  });

  it('knows the four bands by name', () => {
    expect(FOUR_BANDS).toEqual(['child', 'youth', 'teen', 'senior']);
  });
});
