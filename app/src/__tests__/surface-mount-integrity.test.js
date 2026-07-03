// surface-mount-integrity (DR-0090) — the REAL registry against the REAL shell.
//
// Two dead-end gaps this closes (per the 2026-07-03 hardening recon):
//   1. The surface-audit CLI asserts reachability for TOP-LEVEL surfaces only,
//      and only as a CI step — nothing in the vitest suite bound the actual
//      SURFACES array to the actual monolith. If the CLI step were ever dropped
//      or the registry drifted, no test would go red.
//   2. Church/books SUB-surfaces were a documented reachability hole: a
//      registered sub whose `churchView === '<sub>'` / `booksView === '<sub>'`
//      branch vanished from the shell would ship as a silent dead end.
//
// This test feeds the REAL registry and the REAL shell source through a pure
// checker covering all three nav kinds, and proves the checker catches (a
// fabricated unmounted surface is detected). Also pins the DR-0090 containment
// wiring: every registry surface is boundary-wrapped at the mount layer.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SURFACES } from '../surfaces.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const shellSrc = readFileSync(join(SRC, 'poe-financial-mvp-v28.jsx'), 'utf8');
const registrySrc = readFileSync(join(SRC, 'surfaces.js'), 'utf8');

// Pure checker: the render-switch token each surface's mount requires.
// Whitespace-tolerant, quote-agnostic — mirrors surface-audit-core's posture.
export function mountToken(s) {
  if (s.nav === 'top') return new RegExp(`view\\s*===\\s*['"\`]${s.view}['"\`]`);
  if (s.nav === 'church') return new RegExp(`churchView\\s*===\\s*['"\`]${s.sub}['"\`]`);
  return new RegExp(`booksView\\s*===\\s*['"\`]${s.sub}['"\`]`);
}
export function findUnmounted(surfaces, src) {
  return (surfaces || []).filter((s) => !mountToken(s).test(src)).map((s) => s.id);
}

describe('every registered surface has a render branch in the live shell', () => {
  it('top-level, church subs, AND books subs — zero dead ends', () => {
    const unmounted = findUnmounted(SURFACES, shellSrc);
    expect(unmounted, `registered but unreachable in the shell: ${unmounted.join(', ')}`).toEqual([]);
  });
  it('the checker CATCHES an unmounted surface (proven-to-catch)', () => {
    const fake = [{ id: 'ghost', nav: 'top', view: 'definitely-not-a-view' }];
    expect(findUnmounted(fake, shellSrc)).toEqual(['ghost']);
    const fakeSub = [{ id: 'ghost-sub', nav: 'church', sub: 'no-such-sub' }];
    expect(findUnmounted(fakeSub, shellSrc)).toEqual(['ghost-sub']);
  });
  it('covers the whole registry (nothing skipped: every entry asserted)', () => {
    // The audit CLI skips nav!=='top' (documented limitation). Here NOTHING is
    // skipped — if a new nav kind appears, mountToken's books fallback would
    // silently mis-assert it, so pin the known kinds explicitly.
    for (const s of SURFACES) expect(['top', 'church', 'books']).toContain(s.nav);
    expect(SURFACES.length).toBeGreaterThan(30);
  });
});

describe('per-surface crash containment is wired at the mount layer (DR-0090)', () => {
  it('the registry wraps every lazy surface in the boundary', () => {
    expect(registrySrc).toContain("import { withSurfaceBoundary } from './lib/surface-boundary.jsx'");
    expect(registrySrc).toContain('withSurfaceBoundary(lazy(s.load), s.label)');
  });
  it('the global error capture is installed at boot', () => {
    const mainSrc = readFileSync(join(SRC, 'main.jsx'), 'utf8');
    expect(mainSrc).toContain('installGlobalErrorCapture(window)');
  });
  it('both existing boundaries record to the journal (the failure stays visible)', () => {
    for (const f of ['components/ErrorBoundary.jsx', 'components/SectionBoundary.jsx']) {
      expect(readFileSync(join(SRC, f), 'utf8'), `${f} lost its journal wiring`).toContain('recordError(');
    }
  });
});
