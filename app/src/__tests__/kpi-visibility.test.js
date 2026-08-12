// @vitest-environment node
// =============================================================================
// The KPI reports are findable — on a PHONE, which is where they were not
// =============================================================================
// Darrell 2026-08-11: "make KPI's more visible for Users... Christina is having
// a hard time locating it... among other spaces... getting aclimated."
//
// Measured cause, from the source rather than a guess: the report NAMES were
// rendered at 0.5625rem (9px) inside `hidden sm:inline`, so at a phone width
// they were not in the document at all. The whole KPI section collapsed to one
// faint 11px strip reading "KPI's · Standard reports … 6 reports ▸". Nothing
// was broken; the names simply were not on screen, and a person cannot look for
// a thing whose name they cannot see.
//
// These pin the fix at the source, because the failure was a CSS breakpoint —
// a jsdom render at one width would happily pass while a phone still showed
// nothing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const src = () => readFileSync(join(ROOT, 'app/src/components/Imported.jsx'), 'utf8');

describe('the KPI report names survive a narrow screen', () => {
  it('PROVEN-TO-CATCH: no CLASSNAME anywhere hides text below the sm breakpoint', () => {
    // Asserted on real markup, not prose: the fix's own comment names the old
    // `hidden sm:inline` to explain it, and an earlier version of this test
    // matched that sentence and failed against correct code. Match className
    // attributes only.
    const classNames = [...src().matchAll(/className="([^"]*)"/g)].map((m) => m[1]);
    const hidden = classNames.filter((c) => /\bhidden\s+sm:inline\b/.test(c));
    expect(hidden, `these classNames still hide content on a phone: ${hidden.join(' | ')}`).toEqual([]);
  });

  it('every report renders its own always-visible chip, outside the collapse', () => {
    const kpi = src();
    const row = kpi.slice(kpi.indexOf('Open a KPI report'), kpi.indexOf('{stdReportsOpen && ('));
    expect(row).toMatch(/ranked\.map/);          // one chip per report
    expect(row).toMatch(/pickStdReport\(r\.id\)/); // and it opens that report
  });

  it('the chips are real tap targets, not 9px text', () => {
    const kpi = src();
    const row = kpi.slice(kpi.indexOf('Open a KPI report'), kpi.indexOf('{stdReportsOpen && ('));
    expect(row).toMatch(/min-h-\[36px\]/);
    expect(row).not.toMatch(/text-\[0\.5625rem\]/);
  });

  it('the section header is legible and its tap target is thumb-sized', () => {
    const kpi = src();
    const header = kpi.slice(kpi.indexOf('onClick={openReports}'), kpi.indexOf('Open a KPI report'));
    expect(header).toMatch(/min-h-\[48px\]/);
    expect(header).toMatch(/text-\[0\.8125rem\]/);
  });
});
