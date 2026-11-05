// =============================================================================
// surface-sweep — the registry parser, the route builder, and the judge are
// pinned here; the browser half runs in CI (ci.yml `surface-sweep` leg), where
// --break=chunk and --break=pageerror prove it can fail (DR-1330 D1).
// =============================================================================
// THE STRUCTURAL CASE (found by the sweep's first run, 2026-11-05): a surface
// registered in surfaces.js whose top-level view the router does not list
// falls through to the Overview — `?view=study` and `?view=moore` did exactly
// that, silently, for every deep link. The parity case below is the gate for
// that class: every top-level registry view is a VALID_VIEWS route.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { parseRegistry, routeFor, distinctRoutes, judge, parseArgs, MIN_SURFACES } from '../../../scripts/e2e/surface-sweep.mjs';
import { VALID_VIEWS } from '../lib/nav-history.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY = readFileSync(join(HERE, '..', 'surfaces.js'), 'utf8');

describe('surface-sweep: the registry is the list', () => {
  const entries = parseRegistry(REGISTRY);

  it(`parses at least ${MIN_SURFACES} surfaces from the real registry, each with a view and a loader file`, () => {
    expect(entries.length).toBeGreaterThanOrEqual(MIN_SURFACES);
    for (const e of entries) {
      expect(e.id, 'id').toBeTruthy();
      expect(e.view, `${e.id} view`).toBeTruthy();
      expect(e.loadFile, `${e.id} loader`).toBeTruthy();
      expect(['top', 'church', 'books', 'create']).toContain(e.nav);
    }
  });

  it('every top-level registry view is a route the router lists (no deep link falls through to the Overview)', () => {
    const missing = entries.filter((e) => e.nav === 'top' && !VALID_VIEWS.includes(e.view)).map((e) => `${e.id} (?view=${e.view})`);
    expect(missing, `registered but unroutable: ${missing.join(', ')}`).toEqual([]);
  });

  it('builds the URL the shell reads: ?view= alone for a top surface, ?view=&sub= for a sub-surface', () => {
    expect(routeFor({ view: 'about', sub: null })).toBe('?view=about');
    expect(routeFor({ view: 'church', sub: 'learn' })).toBe('?view=church&sub=learn');
  });

  it('dedupes routes shared by several entries (the three church entries on sub=conference)', () => {
    const routes = distinctRoutes(entries);
    const ids = new Set(routes.map((r) => r.route));
    expect(ids.size).toBe(routes.length);
    expect(routes.length).toBeLessThan(entries.length);
    expect(routes.find((r) => r.route === '?view=church&sub=conference').entry.id).toBe('conference');
  });

  it('parses --only, --widths and --break', () => {
    const a = parseArgs(['app/dist', '--only=about,rentals', '--widths=390', '--break=chunk:rentals']);
    expect(a).toEqual({ dist: 'app/dist', breakSpec: 'chunk:rentals', widths: [390], only: ['about', 'rentals'] });
    expect(parseArgs([]).widths).toEqual([390, 1440]);
  });
});

describe('surface-sweep: the judge', () => {
  const overview = 'Big Picture welcome card and the rest of the overview text goes here for the fingerprint';
  const ok = { pageErrors: [], bodyText: 'PoeTech Rentals board with its doors', mainText: 'Rentals board with its doors and their rent, all forty characters wide', overviewMainText: overview };

  it('passes a surface that opened', () => {
    expect(judge(ok, '?view=rentals@390px')).toEqual([]);
  });
  it('fails an uncaught page error', () => {
    expect(judge({ ...ok, pageErrors: ['TypeError: x is undefined'] }, 'r')[0]).toMatch(/page error/);
  });
  it('fails a rendered surface boundary and the app-wide boundary', () => {
    expect(judge({ ...ok, bodyText: 'Rentals hit an error This part of the app ran into a problem' }, 'r')[0]).toMatch(/error boundary/);
    expect(judge({ ...ok, bodyText: 'Something went wrong on this screen' }, 'r')[0]).toMatch(/error boundary/);
  });
  it('fails a route that fell through to the Overview', () => {
    expect(judge({ ...ok, mainText: overview }, '?view=study@390px')[0]).toMatch(/fell through/);
    expect(judge({ ...ok, mainText: overview }, '?view=overview@390px')).toEqual([]);
  });
  it('fails a hollow main region', () => {
    expect(judge({ ...ok, mainText: '   ' }, 'r')[0]).toMatch(/hollow/);
  });
});
