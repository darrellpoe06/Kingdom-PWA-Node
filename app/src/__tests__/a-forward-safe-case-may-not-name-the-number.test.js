// @vitest-environment node
// =============================================================================
// A forward-safety case may not NAME the number it is simulating (DR-1363)
// =============================================================================
// DR-1316 said a lesson gate may not claim to be the last lesson, and the
// repair pattern that followed is a "forward-safe" case: append the next
// lesson's number to the course's own list and assert contiguity still holds.
//
// MEASURED THREE TIMES, the last two inside fixes for the first:
//   1. pm13's case appended the LITERAL 14.
//   2. pm14 repaired THAT one with the derived form and then hardcoded 15 in
//      its own case.
//   3. pm15 landed 2026-11-06 and #2567 went red on that literal: the list
//      became [1..15, 15], contiguity failed, and a lesson was blocked by the
//      gate of the lesson before it.
//
// A literal is true the day it is written and false on exactly the day the
// case exists to cover, so it becomes a machine check rather than something
// the next session is trusted to remember (DR-0076 sec. 2).
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { codeOnly, literalNextNumbers, scan, TESTS } from '../../../scripts/forward-safe-gate-guard.mjs';

describe('what the guard reads', () => {
  it('finds the real historical defect, written exactly as it was written', () => {
    // THE LINE THAT BLOCKED #2567, verbatim.
    const bad = '    const nums = [...PROJECT_MANAGEMENT_MODULES.map((m) => Number(/^pm(\\d+)-/.exec(m.id)[1])), 15];';
    const [hit] = literalNextNumbers(bad);
    expect(hit, 'the defect this guard exists for').toBeTruthy();
    expect(hit.number).toBe(15);
    expect(hit.line).toBe(1);
  });

  it('and pm13s, which is the same defect one lesson earlier', () => {
    const bad = 'const nums = [...PROJECT_MANAGEMENT_MODULES.map((m) => Number(/^pm(\\d+)-/.exec(m.id)[1])), 14];';
    expect(literalNextNumbers(bad)).toHaveLength(1);
  });

  it('passes every derived form, because none of them names a number', () => {
    const ok = [
      'const nums = [...PROJECT_MANAGEMENT_MODULES.map((m) => n(m)), PROJECT_MANAGEMENT_MODULES.length + 1];',
      'const nums = [...SOVEREIGN_AI_MODULES.map((m) => n(m)), next];',
      'const nums = [...COURSE_MODULES.map((m) => n(m)), nums.length + 1];',
      'const nums = [...COURSE_MODULES.map((m) => n(m)), Math.max(...xs) + 1];',
    ];
    for (const line of ok) expect(literalNextNumbers(line), line).toEqual([]);
  });

  it('does not fire on an ordinary array that happens to end in a number', () => {
    // The list must be the course's OWN, spread and mapped. A width list, a
    // fixture, a set of shard counts — none of those are this defect.
    const innocent = [
      'expect(widths).toEqual([390, 768, 1024]);',
      'const weeks = [1, 2, 3];',
      'const xs = [...other.map((m) => m.id), 7];',
      'const n = [...MODULES, 4];',
    ];
    for (const line of innocent) expect(literalNextNumbers(line), line).toEqual([]);
  });
});

describe('it reads code, not prose', () => {
  it('ignores a whole-line comment that quotes the defect it forbids', () => {
    // THIS CASE IS PAID FOR. Twice in one session a scanner of mine matched a
    // forbidden token inside a comment promising not to do the thing — once on
    // the word "trash" in a workflow's own comment saying it never trashes
    // anything. A scanner that reads prose as code will always find what the
    // prose promises not to do, and this guard's own header quotes the bad line.
    const src = [
      '// WRONG, and the reason this guard exists:',
      '//   const nums = [...PROJECT_MANAGEMENT_MODULES.map((m) => n(m)), 15];',
      'const nums = [...PROJECT_MANAGEMENT_MODULES.map((m) => n(m)), next];',
    ].join('\n');
    expect(literalNextNumbers(src)).toEqual([]);
  });

  it('blanks comments without losing the line count, so a report points at the real line', () => {
    const src = '// a\n// b\nconst x = 1;';
    expect(codeOnly(src).split('\n')).toHaveLength(3);
    expect(codeOnly(src).split('\n')[2]).toBe('const x = 1;');
  });

  it('still catches the defect when it sits below a comment block', () => {
    const src = ['// a forward-safety case', '/* and a block */', ' * continuation', 'const nums = [...SOVEREIGN_AI_MODULES.map((m) => n(m)), 71];'].join('\n');
    const [hit] = literalNextNumbers(src);
    expect(hit.number).toBe(71);
    expect(hit.line, 'the line number must survive the blanking').toBe(4);
  });

  // KNOWN LIMIT, stated rather than papered over (DR-0076 sec. 8): only
  // WHOLE-line comments are blanked. A trailing `// ... , 15];` on a line of
  // real code would be read as code. It has never happened in this repository
  // — measured below — and stripping trailing comments needs a string-aware
  // parse, since this suite is full of regexes containing `//`.
  // `re-review: 2026-12-06`.
  it('the known limit is measured, not assumed: no test file has a trailing comment of this shape', () => {
    let offenders = 0;
    for (const name of readdirSync(TESTS)) {
      if (!name.endsWith('.test.js')) continue;
      // Through codeOnly, so a quoted fixture does not count as a comment.
      for (const line of codeOnly(readFileSync(join(TESTS, name), 'utf8')).split('\n')) {
        if (/\/\/.*\.\.\.\s*\w*MODULES\b.*,\s*\d+\s*\]/.test(line)) offenders += 1;
      }
    }
    expect(offenders, 'if this ever fires, the limit above has stopped being theoretical').toBe(0);
  });
});

describe('PROVEN ON THE LIVE SUITE — a fixture cannot show this', () => {
  it('scans the real test directory and finds nothing, which is the shippable state', () => {
    const { files, findings } = scan();
    expect(files, 'the whole suite, not a sample').toBeGreaterThan(400);
    expect(findings, `offenders: ${findings.map((f) => `${f.file}:${f.line}`).join(', ')}`).toEqual([]);
  });

  it("pm14's own gate carries the derived form now, and pm15's does too once it lands", () => {
    // pm15 is in flight on #2567 while this lands, so its gate may not be on
    // the tree. Required where present, never required to BE present: a case
    // that depends on another branch having merged is the environment
    // dependency I had already written once today and had to correct.
    const names = ['project-management-pm13-verses.test.js', 'project-management-pm14-verses.test.js', 'project-management-pm15-verses.test.js'];
    let checked = 0;
    for (const name of names) {
      const path = join(TESTS, name);
      if (!existsSync(path)) continue;
      const src = readFileSync(path, 'utf8');
      expect(src, `${name} must derive the next number`).toMatch(/PROJECT_MANAGEMENT_MODULES\.length \+ 1/);
      expect(literalNextNumbers(src), `${name} must name no number`).toEqual([]);
      checked += 1;
    }
    expect(checked, 'pm13 and pm14 are both on main; at least those two must be read').toBeGreaterThanOrEqual(2);
  });
});
