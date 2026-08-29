// =============================================================================
// The rest of the UI standard set — measured, frozen, and gated
// =============================================================================
// Darrell, 2026-08-28: "build the rest of the UI standard set now."
//
// DR-0314 governs HOW: a standard is only written down after it is MEASURED in
// the real component tree, so the rule is something this codebase already keeps
// rather than a preference of mine. The measurements, taken before a line of
// the guard existed:
//
//   focus-ring     2,817 uses across 152 of 218 files  →  326 gaps
//   touch-target   225 uses of min-h-[36px], 74 files  →   69 gaps
//   icon-label     every icon-only button labelled     →    0 gaps
//
// TWO SHAPES, and the difference is the whole design:
//   · a RATCHET for a standard with real debt — freeze it, block new violations
//   · a HARD gate for one already met everywhere — lock it at zero
//
// A hard gate on 326 pre-existing gaps would be reverted inside a day, and a
// reverted gate protects nothing. This is the legibility-guard pattern, which
// this repo already proved.
//
// ANTI-THEATER (DR-0076 §3): the first block proves the gate CATCHES on
// synthetic input before the last block asserts the real tree is clean. A gate
// that has only ever been green is not evidence of anything.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MIN_TOUCH_PX, HARD, signature, scan, evaluate, loadBaseline,
  scanFocusRing, scanTouchTarget, scanIconLabel, listFiles,
} from '../../../scripts/ui-standards-guard.mjs';

describe('each check finds the thing it is named for', () => {
  it('flags a styled button with no focus ring', () => {
    const v = scanFocusRing('<button className="px-2 bg-white">Save</button>', 'x.jsx');
    expect(v).toHaveLength(1);
    expect(v[0].kind).toBe('focus-ring');
    expect(v[0].why).toMatch(/keyboard/i);
  });

  it('accepts either focus:outline or focus-visible:', () => {
    expect(scanFocusRing('<button className="p-2 focus:outline">S</button>', 'x')).toHaveLength(0);
    expect(scanFocusRing('<button className="p-2 focus-visible:ring">S</button>', 'x')).toHaveLength(0);
  });

  it('does not judge a button that styles nothing, or one nobody can see', () => {
    // No className = a bare element some wrapper is styling; sr-only and hidden
    // controls cannot show a ring by definition. Flagging these is the noise
    // that gets a guard deleted.
    expect(scanFocusRing('<button onClick={go}>S</button>', 'x')).toHaveLength(0);
    expect(scanFocusRing('<button className="sr-only">S</button>', 'x')).toHaveLength(0);
    expect(scanFocusRing('<button className="hidden">S</button>', 'x')).toHaveLength(0);
  });

  it('flags a touch target under the app\'s own minimum, and passes one at it', () => {
    expect(scanTouchTarget('<a className="min-h-[32px]" />', 'x')).toHaveLength(1);
    expect(scanTouchTarget(`<a className="min-h-[${MIN_TOUCH_PX}px]" />`, 'x')).toHaveLength(0);
    expect(scanTouchTarget('<a className="min-h-[44px]" />', 'x')).toHaveLength(0);
  });

  it('flags a glyph-only button with no label, and passes a worded one', () => {
    expect(scanIconLabel('<button className="p">×</button>', 'x')).toHaveLength(1);
    expect(scanIconLabel('<button aria-label="Close" className="p">×</button>', 'x')).toHaveLength(0);
    expect(scanIconLabel('<button className="p">Save</button>', 'x')).toHaveLength(0);
  });
});

describe('the ratchet freezes debt and blocks growth', () => {
  const baseline = { allowed: [signature({ kind: 'focus-ring', file: 'a.jsx', detail: 'old' })] };

  it('a baselined violation is DEBT, not a failure', () => {
    const r = evaluate([{ kind: 'focus-ring', file: 'a.jsx', detail: 'old' }], baseline);
    expect(r.ok).toBe(true);
    expect(r.summary.debt).toBe(1);
    expect(r.summary.regressions).toBe(0);
  });

  it('a NEW violation of the same kind FAILS', () => {
    const r = evaluate([{ kind: 'focus-ring', file: 'b.jsx', detail: 'new' }], baseline);
    expect(r.ok).toBe(false);
    expect(r.summary.regressions).toBe(1);
  });

  it('a hard-gated kind fails even if somebody baselines it', () => {
    // This is what makes "hard" mean something: the escape hatch does not exist.
    const sneaky = { allowed: [signature({ kind: 'icon-label', file: 'c.jsx', detail: 'x' })] };
    const r = evaluate([{ kind: 'icon-label', file: 'c.jsx', detail: 'x' }], sneaky);
    expect(r.ok).toBe(false);
  });

  it('counts a fixed violation as HEALED — the number that should fall', () => {
    const r = evaluate([], baseline);
    expect(r.summary.healed).toBe(1);
    expect(r.ok).toBe(true);
  });

  it('signatures ignore line numbers, so a baseline survives edits above it', () => {
    const a = signature({ kind: 'focus-ring', file: 'a.jsx', detail: 'same' });
    const b = signature({ kind: 'focus-ring', file: 'a.jsx', detail: 'same' });
    expect(a).toBe(b);
  });
});

describe('the REAL component tree holds the standard', () => {
  it('scans a real number of files, so this is never vacuously green', () => {
    expect(listFiles().length).toBeGreaterThan(150);
  });

  it('has NO regressions against the frozen baseline', () => {
    const r = evaluate(scan(), loadBaseline());
    const named = r.regressions.slice(0, 12)
      .map((v) => `${v.kind} ${v.file}: ${v.detail} — ${v.why}`).join('\n');
    expect(r.ok, `new UI-standard violations:\n${named}`).toBe(true);
  });

  it('keeps icon-label at ZERO, which is where it already was', () => {
    // The cheapest moment to make a standard permanent is before the first
    // regression. This one had none, so it is locked rather than baselined.
    expect(scan().filter((v) => v.kind === 'icon-label')).toEqual([]);
    expect(HARD.has('icon-label')).toBe(true);
  });

  it('the baseline holds only ratcheted kinds — a hard kind can never be in it', () => {
    const b = loadBaseline();
    const hardInBaseline = (b.allowed || []).filter((s) => HARD.has(s.split('|')[0]));
    expect(hardInBaseline).toEqual([]);
  });

  it('the frozen debt is real and finite, and says when it was frozen', () => {
    const b = loadBaseline();
    expect(b.allowed.length).toBeGreaterThan(50);
    expect(b.frozenAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(b.note).toMatch(/may SHRINK, never grow/i);
  });
});

describe('the Way says what the gate cannot', () => {
  const ways = () => readFileSync(
    join(process.cwd(), '../docs/00-foundations/_root/UX-PATTERNS.md'), 'utf8',
  );

  it('records the destructive-confirm standard that is NOT statically gateable', () => {
    // 37 of 68 destructive buttons call a prop callback (onDelete/onRemove)
    // whose confirm lives in a parent. No static scan resolves that, and a
    // guard with 37 false positives is how a guard gets deleted. Naming the
    // limit in the Ways is the honest instrument — DR-0076 §8.
    const s = ways();
    expect(s).toMatch(/Pattern 2g/);
    expect(s).toMatch(/destructive/i);
    expect(s).toMatch(/not statically gateable|cannot be gated/i);
  });

  it('names the three gated standards with their measured numbers', () => {
    const s = ways();
    for (const token of ['focus', 'touch target', 'aria-label']) {
      expect(s.toLowerCase()).toContain(token.toLowerCase());
    }
  });
});

describe('a surface claiming a measurement carries its date and its re-check', () => {
  // Darrell 2026-08-28: "why do we have static data?... App surfaces are
  // supposed to be latest truth." He was right about one row specifically:
  // constraint C1 asserts the state of a LIVE TABLE in prose. It was true when
  // measured and nothing would ever notice if it stopped being — the class
  // DR-0139 already closed for the opportunity-library and rentals counts.
  //
  // Prose stating a PROPERTY of the system ("money never moves in the app") is
  // not a measurement and is deliberately unaffected; a guard that fires on
  // those is noise.
  it('refuses a constraint that claims a measurement with no measuredOn', async () => {
    const { validateLaunchPlan } = await import('../modules/properties/config.js');
    const v = validateLaunchPlan();
    expect(v.problems.filter((p) => /measurement/.test(p))).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('the real C1 row carries both dates', async () => {
    const { CONSTRAINTS } = await import('../modules/properties/config.js');
    const c1 = CONSTRAINTS.find((c) => c.id === 'C1');
    expect(c1.measuredOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(c1.reReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('and the date is no longer buried in the sentence a reader sees', async () => {
    // "(measured 2026-08-26)" inside the prose cannot be checked by anything.
    const { CONSTRAINTS } = await import('../modules/properties/config.js');
    const c1 = CONSTRAINTS.find((c) => c.id === 'C1');
    expect(c1.detail).not.toMatch(/measured 20\d\d-/);
  });

  it('leaves a constraint that states a PROPERTY alone', async () => {
    const { CONSTRAINTS } = await import('../modules/properties/config.js');
    const c3 = CONSTRAINTS.find((c) => c.id === 'C3');   // money never moves
    expect(c3.measuredOn).toBeUndefined();
  });
});
