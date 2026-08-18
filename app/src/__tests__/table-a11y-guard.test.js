// @vitest-environment node
//
// table-a11y-guard — PROVEN-TO-CATCH tests (DR-0076 §3)
//
// Darrell 2026-08-14: "are our data tables... html data tables? or python
// etc... so screenreader works well?"
//
// Measured before the fix: 131 <th> across 16 files, only 18 carrying `scope`.
// A blind steward tabbing the Debts table heard "4,812" with no way to know
// whether that was the balance, the payoff or the minimum — data present and
// unusable, which is worse than absent because it invites a confident wrong
// decision. All 131 now carry scope, and this gate holds it there.
//
// Captions are TRACKED DEBT, not a blocker, and deliberately so: a caption must
// NAME the table for the person who cannot see it, and deriving one from the
// header row yields "Table of Account, Entity, Rate" — passes a linter, helps
// nobody. re-review 2026-09-15.
import { describe, it, expect } from 'vitest';
import {
  scanSourceForTableA11y, scanAppTables, listScannedFiles, EXCLUSIONS,
} from '../../../scripts/table-a11y-guard.mjs';

describe('proven-to-catch — the gate flags a bare <th>, never a scoped one', () => {
  it('FLAGS a <th> with no scope', () => {
    const r = scanSourceForTableA11y('<table><thead><tr><th>Balance</th></tr></thead></table>');
    expect(r.violations.map((v) => v.kind)).toContain('th-without-scope');
  });

  it('PASSES a <th scope="col">', () => {
    const r = scanSourceForTableA11y('<table><caption>Debts</caption><thead><tr><th scope="col">Balance</th></tr></thead></table>');
    expect(r.violations).toEqual([]);
  });

  it('accepts scope="row" too — which one is right is the author\'s call', () => {
    const r = scanSourceForTableA11y('<table><caption>X</caption><tr><th scope="row">Jan</th></tr></table>');
    expect(r.violations).toEqual([]);
  });

  it('counts every <th> in a realistic single-line header row', () => {
    const row = '<table><thead><tr>'
      + '<th scope="col" className="p-3">Account</th>'
      + '<th scope="col" className="p-3">Rate</th>'
      + '<th className="p-3">Balance</th>'
      + '</tr></thead></table>';
    const r = scanSourceForTableA11y(row);
    expect(r.ths).toBe(3);
    expect(r.scoped).toBe(2);
    expect(r.violations.filter((v) => v.kind === 'th-without-scope').length).toBe(1);
  });
});

describe('it must not cry wolf — a noisy gate gets disabled and protects nothing', () => {
  it('ignores a file with no table at all', () => {
    const r = scanSourceForTableA11y('const x = 1; // <th> in a comment');
    expect(r.tables).toBe(0);
    expect(r.violations).toEqual([]);
  });

  it('ignores <th> inside comments', () => {
    const r = scanSourceForTableA11y('<table><caption>c</caption></table>\n// <th>not real</th>\n/* <th>nor this</th> */');
    expect(r.ths).toBe(0);
  });

  it('never throws on junk input', () => {
    for (const bad of [undefined, null, '', 42, {}]) {
      expect(() => scanSourceForTableA11y(bad)).not.toThrow();
    }
  });

  it('says nothing about <td>, which needs no scope', () => {
    const r = scanSourceForTableA11y('<table><caption>c</caption><tr><td>value</td></tr></table>');
    expect(r.violations).toEqual([]);
  });
});

describe('captions are tracked debt, reported but not blocking (DR-0075)', () => {
  it('reports an uncaptioned table as debt, NOT as a violation', () => {
    const r = scanSourceForTableA11y('<table><thead><tr><th scope="col">A</th></tr></thead></table>');
    expect(r.violations).toEqual([]);
    expect(r.debt.map((d) => d.kind)).toContain('table-without-caption');
  });

  it('a captioned table carries no debt', () => {
    const r = scanSourceForTableA11y('<table><caption>Debts by account</caption><tr><th scope="col">A</th></tr></table>');
    expect(r.debt).toEqual([]);
  });
});

describe('the real app holds the line', () => {
  it('actually scans the app, not vacuously nothing', () => {
    expect(listScannedFiles().length).toBeGreaterThan(150);
  });

  it('EVERY <th> in the live tree carries scope', () => {
    const { violations, totals } = scanAppTables();
    const msg = violations.slice(0, 12).map((v) => `${v.file}:${v.line}`).join('; ');
    expect(totals.ths).toBeGreaterThan(100);
    expect(violations, msg).toEqual([]);
    expect(totals.scoped).toBe(totals.ths);
  });

  it('every exclusion carries a written reason (no silent carve-outs)', () => {
    const { badExclusions } = scanAppTables();
    expect(badExclusions).toEqual([]);
    for (const reason of Object.values(EXCLUSIONS)) {
      expect(typeof reason).toBe('string');
      expect(reason.trim().length).toBeGreaterThanOrEqual(10);
    }
  });
});
