// @vitest-environment node
//
// Hybrid-modular boundary gate (DR-0078 §4.1 boundary law; DR-0076 verification
// doctrine). The registry (app/src/surfaces.js) must stay core: it mounts
// surfaces only via lazy load thunks, it is shell-only, and no feature reaches
// back into the shell. Logic in scripts/module-boundary-guard.mjs (also a CLI:
// `node scripts/module-boundary-guard.mjs`).
//
// Anti-theater (DR-0076): a gate that only ever passes is itself a lie. These
// tests PROVE the gate catches each violation class on synthetic sources, then
// assert the real tree is clean.
import { describe, it, expect } from 'vitest';
import {
  staticImportSources, registryStaticFeatureImports, scan,
} from '../../../scripts/module-boundary-guard.mjs';

describe('the real repo holds the boundary', () => {
  const result = scan();

  it('sees a non-trivial set of feature files (not vacuously empty)', () => {
    expect(result.featureFileCount).toBeGreaterThan(50);
  });

  it('the registry imports no feature component statically (C1 stays absorbed)', () => {
    expect(result.registryViolations, result.registryViolations.join(' | ')).toEqual([]);
  });

  it('no feature module imports the registry (registry is shell-only)', () => {
    const msg = result.importsRegistry.map((v) => v.file).join(', ');
    expect(result.importsRegistry, msg).toEqual([]);
  });

  it('no feature module imports the shell outside the dated baseline', () => {
    const msg = result.importsShell.map((v) => v.file).join(', ');
    expect(result.importsShell, msg).toEqual([]);
  });

  it('passes overall', () => {
    expect(result.ok, result.violations.join(' | ')).toBe(true);
  });
});

describe('proven-to-catch — the gate flags each violation class', () => {
  it('catches a STATIC feature import in the registry (dynamic import is allowed)', () => {
    const bad = `import Choir from './components/Choir.jsx';\nexport const SURFACES = [];`;
    expect(registryStaticFeatureImports(bad).length).toBe(1);

    const good = `import { lazy } from 'react';\nexport const SURFACES = [{ load: () => import('./components/Choir.jsx') }];`;
    expect(registryStaticFeatureImports(good)).toEqual([]);
  });

  it('only counts STATIC imports, never dynamic import() thunks', () => {
    const src = `import { lazy } from 'react';\nconst x = () => import('./components/Pulpit.jsx');\nimport y from './lib/foo.js';`;
    const sources = staticImportSources(src);
    expect(sources).toContain('./lib/foo.js');
    expect(sources).not.toContain('./components/Pulpit.jsx');
  });
});
