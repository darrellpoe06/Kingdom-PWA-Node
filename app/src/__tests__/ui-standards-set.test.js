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
  scanDestructiveConfirm, REVERSIBLE_BY_DESIGN,
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

  it('sees a focus ring carried by a file constant — 93 baseline entries were never owed', () => {
    // DR-0315: <button className={`p ${FOCUS}`}> where FOCUS holds the outline
    // classes. The literal tag shows no ring; the constant does. Flagging these
    // put 93 already-compliant buttons into the first frozen baseline.
    const src = "const FOCUS = 'focus:outline focus:outline-2';\n"
      + '<button className={`px-2 ${FOCUS}`}>Save</button>';
    expect(scanFocusRing(src, 'x.jsx')).toHaveLength(0);
    // A constant with NO focus classes still fails — resolution, not amnesty.
    const bare = "const STYLE = 'px-2 border';\n"
      + '<button className={`p ${STYLE}`}>Save</button>';
    expect(scanFocusRing(bare, 'x.jsx')).toHaveLength(1);
  });

  it('flags a destroying button in a file with no confirm anywhere', () => {
    const v = scanDestructiveConfirm('<button onClick={() => deleteThing(id)}>Delete</button>', 'x.jsx');
    expect(v).toHaveLength(1);
    expect(v[0].kind).toBe('destructive-confirm');
    expect(v[0].why).toMatch(/confirmThen/);
  });

  it('catches the onDelete prop shape — the one that destroyed a recipe silently', () => {
    expect(scanDestructiveConfirm('<button onClick={onDelete}>Delete recipe</button>', 'x.jsx'))
      .toHaveLength(1);
  });

  it('passes a file that confirms, by either door', () => {
    expect(scanDestructiveConfirm(
      'const go = () => { if (!window.confirm("?")) return; };\n<button onClick={() => deleteThing()}>D</button>', 'x.jsx',
    )).toHaveLength(0);
    expect(scanDestructiveConfirm(
      "import { confirmThen } from '../lib/confirm-action.js';\n<button onClick={confirmThen('?', () => deleteThing())}>D</button>", 'x.jsx',
    )).toHaveLength(0);
  });

  it('leaves remove-verb handlers alone — draft-row removal is editing, not destruction', () => {
    expect(scanDestructiveConfirm('<button onClick={() => removeLine(i)}>×</button>', 'x.jsx'))
      .toHaveLength(0);
  });

  it('honors the named reversible exemption, in its file only', () => {
    const tag = '<button type="button" onClick={eraseSpan}>Clear</button>';
    expect(REVERSIBLE_BY_DESIGN['components/BibleReader.jsx::eraseSpan']).toMatch(/re-highlighting/);
    expect(scanDestructiveConfirm(tag, 'components/BibleReader.jsx')).toHaveLength(0);
    expect(scanDestructiveConfirm(tag, 'components/Other.jsx')).toHaveLength(1);
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

  it('keeps destructive-confirm at ZERO — six real gaps were fixed the day it was measured', () => {
    // DR-0315: recipe, song idea, budget goal, calendar event/recurring/
    // incident — all destroyed records (cloud rows included) with no question
    // asked, all found by this scan's first run, all now through confirmThen.
    expect(scan().filter((v) => v.kind === 'destructive-confirm')).toEqual([]);
    expect(HARD.has('destructive-confirm')).toBe(true);
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

  it('records that destructive-confirm GRADUATED from Way to gate via the primitive', () => {
    // The 2026-08-28 record said "not statically gateable" and promised
    // graduation if an instrument appeared. DR-0315 built the instrument
    // (confirmThen — one door for destruction), so the Way must now say BOTH:
    // the old limit for parent-confirmed code, and the graduation.
    const s = ways();
    expect(s).toMatch(/Pattern 2g/);
    expect(s).toMatch(/GRADUATED/);
    expect(s).toMatch(/confirmThen/);
    expect(s).toMatch(/not statically\s+gateable/i); // the history stays told
  });

  it('states the touch-target lineage the law research settled — 24 legal, 36 house, 44 aim', () => {
    // DR-0315: WCAG 2.2 SC 2.5.8 (Level AA, the tier laws bind to) is 24×24;
    // 44×44 is SC 2.5.5 (AAA) + platform guidance. The Ways must carry the
    // tiers so the next reader does not re-fight the settled conflict.
    const s = ways();
    expect(s).toMatch(/2\.5\.8/);
    expect(s).toMatch(/2\.5\.5/);
    expect(s).toMatch(/24/);
    expect(s).toMatch(/WCAG 2\.2 AA/);
  });

  it('names the four gated standards with their measured numbers', () => {
    const s = ways();
    for (const token of ['focus', 'touch target', 'aria-label', 'confirmThen']) {
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
