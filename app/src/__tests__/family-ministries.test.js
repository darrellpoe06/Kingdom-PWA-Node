// =============================================================================
// family-ministries — the one-source business facts, and the duplication guard
// =============================================================================
// DR-0139/REV-0031 static-data findings: "7-clinician team" / "11 rentals" /
// the 77th Assembly identity were hand-typed in multiple components and could
// drift independently. The facts now live ONCE in lib/family-ministries.js.
// The guard below is the class-kill (DR-0076 proven-to-catch): re-typing one
// of these facts as a literal in any component goes red here, pointing the
// author at the module instead.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  FAMILY_MINISTRIES, tlcClinicianLine, tlcInsurersLine, poePropertiesLine,
} from '../lib/family-ministries.js';

const componentsDir = join(dirname(fileURLToPath(import.meta.url)), '../components/');

describe('the facts registry', () => {
  it('holds the family-declared facts with provenance and a re-verify date', () => {
    for (const key of ['tlc', 'poeProperties', 'colg', 'assembly']) {
      const f = FAMILY_MINISTRIES[key];
      expect(f, key).toBeTruthy();
      expect(f.source, `${key}.source`).toMatch(/family-declared/);
      expect(f.reVerify, `${key}.reVerify`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(FAMILY_MINISTRIES.tlc.clinicians).toBeGreaterThan(0);
    expect(FAMILY_MINISTRIES.poeProperties.rentals).toBeGreaterThan(0);
  });

  it('composes the shared lines from the one source', () => {
    expect(tlcClinicianLine()).toBe(`${FAMILY_MINISTRIES.tlc.clinicians}-clinician team`);
    expect(tlcInsurersLine()).toContain('BCBS');
    expect(poePropertiesLine()).toContain(String(FAMILY_MINISTRIES.poeProperties.rentals));
  });
});

describe('duplication guard — these facts appear in components ONLY via the module', () => {
  // The exact literal shapes that were found duplicated (case-insensitive).
  // A component needing one of these facts imports family-ministries.js.
  const FORBIDDEN = [
    /\b\d+-clinician\b/i,
    /\b\d+ clinicians\b/i,
    /\b\d+ rental homes\b/i,
    /\b\d+ rentals\b/i,
    /77th National Assembly/,
  ];

  it('no component file re-types a fact the module owns', () => {
    const offenders = [];
    for (const f of readdirSync(componentsDir)) {
      if (!/\.(jsx?|tsx?)$/.test(f)) continue;
      const src = readFileSync(componentsDir + f, 'utf8');
      for (const re of FORBIDDEN) {
        if (re.test(src)) offenders.push(`${f}: ${re}`);
      }
    }
    expect(offenders, `hand-typed business facts found (use lib/family-ministries.js):\n${offenders.join('\n')}`).toEqual([]);
  });

  it('proven-to-catch: the guard flags a literal the way the incident looked', () => {
    expect(FORBIDDEN.some((re) => re.test("detail: 'Online & in-person · 7-clinician team'"))).toBe(true);
    expect(FORBIDDEN.some((re) => re.test('11 rental homes · Faith-led'))).toBe(true);
  });
});
