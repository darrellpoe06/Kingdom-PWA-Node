// =============================================================================
// journey-coverage-guard — every surface family and every module has a journey
// (DR-1330 D2). The pure check is pinned here and proven to catch: a registry
// missing a family, a module with no journey, a bare deferral, and a deferral
// past its date each REQUIRE a finding; the real registry on the real repo
// must be clean.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, familiesIn, modulesIn } from '../../../scripts/journey-coverage-guard.mjs';
import { JOURNEYS, FAMILIES, RUNNERS } from '../../../scripts/e2e/journeys.mjs';
import { JOURNEY_IDS, TAP_JOURNEYS } from '../../../scripts/e2e/app-journeys.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SURFACES = readFileSync(join(ROOT, 'app/src/surfaces.js'), 'utf8');

const base = {
  families: ['top', 'church'],
  modules: ['properties'],
  runners: ['app-journeys', 'door-journeys'],
  appJourneyIds: ['a', 'b'],
  today: '2026-11-05',
  journeys: [
    { id: 'a', runner: 'app-journeys', family: 'top', status: 'active' },
    { id: 'b', runner: 'app-journeys', family: 'church', status: 'active' },
    { id: 'door-journeys', runner: 'door-journeys', family: 'top', module: 'properties', status: 'active' },
  ],
};

describe('journey-coverage-guard: proven to catch', () => {
  it('passes a registry that covers every family and module', () => {
    expect(check(base)).toEqual([]);
  });
  it('fails a family with no journey', () => {
    expect(check({ ...base, families: ['top', 'church', 'books'] })[0]).toMatch(/family 'books' has no journey/);
  });
  it('fails a module with no journey', () => {
    expect(check({ ...base, modules: ['properties', 'office-assistant'] })[0]).toMatch(/module app\/src\/modules\/office-assistant has no journey/);
  });
  it('fails a deferral without a why and a date, and a deferral past its date', () => {
    const bare = { id: 'x', runner: 'app-journeys', family: 'top', module: 'm', status: 'deferred' };
    expect(check({ ...base, modules: ['properties', 'm'], journeys: [...base.journeys, bare] })[0]).toMatch(/deferred without a why/);
    const late = { ...bare, why: 'needs sign-in', reReview: '2026-11-01' };
    expect(check({ ...base, modules: ['properties', 'm'], journeys: [...base.journeys, late] })[0]).toMatch(/passed its re-review date 2026-11-01/);
    const dated = { ...late, reReview: '2026-11-19' };
    expect(check({ ...base, modules: ['properties', 'm'], journeys: [...base.journeys, dated] })).toEqual([]);
  });
  it('fails an unknown runner and an app journey the runner does not define', () => {
    expect(check({ ...base, journeys: [...base.journeys, { id: 'z', runner: 'nope', family: 'top', status: 'active' }] })[0]).toMatch(/unknown runner 'nope'/);
    expect(check({ ...base, journeys: [...base.journeys, { id: 'ghost', runner: 'app-journeys', family: 'top', status: 'active' }] })[0]).toMatch(
      /does not define it/
    );
  });
});

describe('journey-coverage-guard: the real repo', () => {
  it('reads the nav families from the real registry and the real module directories', () => {
    const families = familiesIn(SURFACES);
    expect(families.sort()).toEqual([...FAMILIES].sort());
    expect(modulesIn(join(ROOT, 'app/src/modules'))).toContain('properties');
  });
  it('is covered today, with every deferral dated in the future of this record', () => {
    const findings = check({
      journeys: JOURNEYS,
      families: familiesIn(SURFACES),
      modules: modulesIn(join(ROOT, 'app/src/modules')),
      runners: RUNNERS,
      appJourneyIds: JOURNEY_IDS,
      today: '2026-11-05',
    });
    expect(findings).toEqual([]);
  });
  it('every active app journey in the registry is defined by the runner, and the tap journeys are a subset', () => {
    for (const j of JOURNEYS.filter((x) => x.runner === 'app-journeys' && x.status === 'active')) expect(JOURNEY_IDS).toContain(j.id);
    for (const id of TAP_JOURNEYS) expect(JOURNEY_IDS).toContain(id);
  });
});
