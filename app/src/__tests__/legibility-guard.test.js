// @vitest-environment node
//
// Perpetual per-PAGE legibility gate (DR-0076 + ITIL CSI). The 2026-06-25
// incident: the Chef's Corner recipe surface shipped DARK-ON-DARK — text drawn
// with `style={{ color: INK }}` (INK = '#1A1815'), an inline color that bypasses
// the [data-theme] remap, so in midnight the dark ink sat on a dark card at
// ~1.04:1 and vanished. The pooled contrast-guard never saw it (it matched only
// LITERAL inline hexes, ran strictly on a 2-file allowlist, scanned components
// non-recursively, and could not attribute a failure to a page). This guard
// closes those holes and runs INSIDE the required `app — lint + vitest` check so
// a NEW dark-on-dark page cannot merge. Logic: scripts/legibility-guard.mjs.
import { describe, it, expect } from 'vitest';
import {
  relLum, expandHex, darkThemes, parseColorConsts, resolveColors,
  scanInlineColors, scanTokenCoverageForFile,
  scanLegibility, buildHealth, loadBaseline, listPages,
} from '../../../scripts/legibility-guard.mjs';
import committedHealth from '../lib/legibility-health.json';

const MIDNIGHT = [{ theme: 'midnight/card', surface: '#141414' }, { theme: 'midnight/base', surface: '#000000' }];

describe('legibility-guard — hex + theme primitives', () => {
  it('expands 3-digit hex and computes luminance (white bright, black dark)', () => {
    expect(expandHex('#fff')).toBe('#ffffff');
    expect(relLum('#fff')).toBeCloseTo(1, 5);
    expect(relLum('#000000')).toBeCloseTo(0, 5);
  });

  it('derives the dark themes from the parsed palette (midnight is dark; light themes are not)', () => {
    const themes = { white: { baseBg: '#F2F2F7' }, slate: { baseBg: '#F1F3F8' }, midnight: { baseBg: '#000000' } };
    expect(darkThemes(themes)).toEqual(['midnight']);
  });
});

describe('legibility-guard — inline color constant resolution', () => {
  it('parses single AND double-quoted hex consts (3 or 6 digit), stored expanded', () => {
    const c = parseColorConsts(`const INK = '#1A1815'; const W = "#fff"; let A = '#B85838';`);
    expect(c).toEqual({ INK: '#1A1815', W: '#ffffff', A: '#B85838' });
  });

  it('resolves a literal, a const, and both arms of a ternary; returns [] for dynamic', () => {
    const c = { INK: '#1A1815', PAPER: '#ffffff' };
    expect(resolveColors("'#1A1815'", c)).toEqual(['#1A1815']);
    expect(resolveColors('INK', c)).toEqual(['#1A1815']);
    expect(resolveColors('on ? INK : PAPER', c)).toEqual(['#1A1815', '#ffffff']);
    expect(resolveColors('row.color', c)).toEqual([]);
  });
});

// The crux: prove the guard CATCHES the exact ChefCorner mechanism, and does NOT
// false-positive on the readable cases that look superficially similar.
describe('legibility-guard — CATCHES the dark-on-dark recipe bug (anti-theater)', () => {
  it('CATCHES inline dark text from a CONST ref (the literal ChefCorner bug)', () => {
    const src = `const INK = '#1A1815';\nfunction R(){ return <h3 style={{ color: INK }}>{recipe.title}</h3>; }`;
    const { violations } = scanInlineColors(src, MIDNIGHT);
    expect(violations.length).toBe(1);
    expect(violations[0].kind).toBe('inline-dark-text');
    expect(violations[0].detail).toBe('#1a1815');
    expect(violations[0].ratio).toBeLessThan(4.5);
  });

  it('CATCHES an inline dark text LITERAL too', () => {
    expect(scanInlineColors(`<p style={{ color: '#5A5751' }}>x</p>`, MIDNIGHT).violations.length).toBe(1);
  });

  it('does NOT flag readable inline LIGHT text (light-on-dark is fine)', () => {
    expect(scanInlineColors(`<p style={{ color: '#FAF8F4' }}>x</p>`, MIDNIGHT).violations.length).toBe(0);
  });

  it('does NOT flag dark text on an inline LIGHT background (dark-on-light stays readable)', () => {
    // ChefCorner's chip/button case: `backgroundColor: CREAM, color: MUTE`. Both
    // un-themeable, so it is readable in EVERY theme — not a violation.
    const src = `const CREAM='#FAF8F4'; const MUTE='#5A5751'; <span style={{ backgroundColor: CREAM, color: MUTE }}>x</span>`;
    expect(scanInlineColors(src, MIDNIGHT).violations.length).toBe(0);
    expect(scanInlineColors(`<span style={{ backgroundColor: '#fff', color: '#1A1815' }}>x</span>`, MIDNIGHT).violations.length).toBe(0);
  });

  it('does NOT hard-fail a dynamic (data-driven) inline color — tracked as a warning instead', () => {
    const r = scanInlineColors(`<span style={{ color: row.statusColor }}>x</span>`, MIDNIGHT);
    expect(r.violations.length).toBe(0);
    expect(r.warns.some((w) => w.kind === 'inline-dynamic-text-color')).toBe(true);
  });
});

describe('legibility-guard — class-token coverage per page (both directions)', () => {
  it('CATCHES a dark text-[#hex] class a dark theme does not remap (dark-on-dark)', () => {
    const remaps = [{ theme: 'midnight', remap: { bg: {}, text: {} }, card: '#141414' }];
    const v = scanTokenCoverageForFile(`<div className="text-[#7A1F1F]">x</div>`, remaps);
    expect(v.some((x) => x.kind === 'token-dark-on-dark' && x.detail === 'text-#7a1f1f')).toBe(true);
  });

  it('CATCHES a near-white bg-[#hex] class with no dark remap (light-on-light)', () => {
    const remaps = [{ theme: 'midnight', remap: { bg: {}, text: {} }, card: '#141414' }];
    const v = scanTokenCoverageForFile(`<div className="bg-[#F2F4EC]">x</div>`, remaps);
    expect(v.some((x) => x.kind === 'token-light-on-light' && x.detail === 'bg-#f2f4ec')).toBe(true);
  });

  it('PASSES once both are remapped (text bright, bg dark)', () => {
    const remaps = [{ theme: 'midnight', remap: { bg: { '#f2f4ec': '#16211A' }, text: { '#7a1f1f': '#FCA5A5' } }, card: '#141414' }];
    expect(scanTokenCoverageForFile(`<div className="bg-[#F2F4EC] text-[#7A1F1F]">x</div>`, remaps)).toEqual([]);
  });
});

// RECURSION: the connectors/ subdir was invisible to the old non-recursive scan.
describe('legibility-guard — recursive page discovery', () => {
  it('includes nested component subdirectories (e.g. components/connectors/*)', () => {
    const ids = listPages().map((p) => p.replace(/.*app[\\/]src[\\/]/, '').replace(/\\/g, '/'));
    expect(ids.some((p) => p.includes('connectors/'))).toBe(true);
    expect(ids).toContain('poe-financial-mvp-v28.jsx');
  });
});

// The merge gate: the LIVE tree must carry ZERO regressions vs the frozen
// baseline. New dark-on-dark text on any page (or a brand-new failing page) adds
// a signature the baseline lacks -> this fails -> auto-merge-on-green blocks it.
describe('legibility-guard — live tree has no NEW legibility regressions (the gate)', () => {
  it('every live dark-on-dark violation is accounted for in the baseline', () => {
    const scan = scanLegibility();
    const msg = scan.regressions
      .map((v) => `${v.page}:${v.line} [${v.theme}] ${v.kind} ${v.detail}${v.ratio ? ` ${v.ratio}:1` : ''}`)
      .join('\n');
    expect(scan.regressions, `NEW legibility regression(s) — fix or re-baseline:\n${msg}`).toEqual([]);
  });

  it('is not vacuous: it scanned the real surfaces and the baseline carries the known debt', () => {
    const scan = scanLegibility();
    expect(scan.summary.pages).toBeGreaterThan(50);
    expect(scan.darkThemes).toContain('midnight');
    const baseline = loadBaseline();
    // The recipe surface IS the known debt the gate tracks (the reported bug).
    expect(baseline.pages['components/ChefCorner.jsx'].length).toBeGreaterThan(0);
  });

  it('PROVES the gate would catch a regression: injecting a new dark inline color makes the live set dirty', () => {
    // Re-scan with an EMPTY baseline -> every current debt becomes a regression,
    // which must be non-empty (otherwise the gate is vacuously green and useless).
    const wouldFail = scanLegibility({ version: 1, pages: {} });
    expect(wouldFail.regressions.length).toBeGreaterThan(0);
  });
});

// The QCHP health artifact must be the SAME truth as the gate — never a stale
// painted number (DR-0076). If a page's color usage changes, regen with
// `node scripts/legibility-guard.mjs --health` and commit.
describe('legibility-guard — committed QCHP health is byte-in-sync with a fresh scan', () => {
  it('app/src/lib/legibility-health.json equals buildHealth(scanLegibility())', () => {
    const fresh = buildHealth(scanLegibility());
    expect(committedHealth).toEqual(fresh);
  });

  it('the health summary is internally consistent (passing + debt + regression = total)', () => {
    const s = committedHealth.summary;
    expect(s.passing + s.trackedDebtPages + s.regressionPages).toBe(s.pages);
  });
});
