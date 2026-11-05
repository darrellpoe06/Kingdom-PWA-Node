// A status read is filtered at the source, or it is a hundred times its size.
// =============================================================================
// DR-1350. scripts/gh-read.mjs exists because a read that loses its server-side
// filter STILL WORKS -- it just costs 74x to 229x more, measured. That is a
// safeguard that fails open, so the property has to be pinned rather than
// trusted to whoever edits the file next.
//
// Deliberately offline. Every case reads the module's own exported data; none
// calls gh, none touches the network. A test that needed a live token would be
// skipped in CI, which is the same as not existing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { READS, argvFor, isFilteredAtSource, REPO } from '../../../scripts/gh-read.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, '..', '..', '..', 'scripts', 'gh-read.mjs');

describe('every read carries its filter', () => {
  it('names at least the three reads an agent needs to drive a PR', () => {
    expect(Object.keys(READS).sort()).toEqual(['checks', 'runs', 'steps']);
  });

  for (const [kind, read] of Object.entries(READS)) {
    it(`${kind} declares a jq program`, () => {
      expect(typeof read.jq, `${kind} has no jq program, so its whole payload would be paid for`).toBe('string');
      expect(read.jq.length).toBeGreaterThan(10);
    });

    it(`${kind} builds an argv that passes the filter to gh`, () => {
      const argv = argvFor(kind, kind === 'checks' ? 'deadbeef' : kind === 'runs' ? 'ci.yml' : '123');
      expect(argv[0]).toBe('api');
      expect(isFilteredAtSource(argv), `${kind} would filter after the fact, which is where the cost already landed`).toBe(true);
      expect(argv[argv.indexOf('--jq') + 1]).toBe(read.jq);
    });

    it(`${kind} refuses to run with nothing to read`, () => {
      expect(() => argvFor(kind)).toThrow(/needs/);
      expect(() => argvFor(kind, '')).toThrow(/needs/);
    });
  }

  it('refuses a read it does not know, and says what it has', () => {
    expect(() => argvFor('everything', 'x')).toThrow(/unknown read "everything"/);
    expect(() => argvFor('everything', 'x')).toThrow(/checks, runs, steps/);
  });
});

describe('proven to catch', () => {
  // The defect this guards against is a filter being dropped. Simulate it the
  // way it would really happen -- someone "simplifies" the argv builder -- and
  // require the check to fail.
  it('an argv with the filter stripped is NOT read as filtered', () => {
    const bent = argvFor('checks', 'deadbeef').filter((a) => a !== '--jq' && a !== READS.checks.jq);
    expect(bent).not.toContain('--jq');
    expect(isFilteredAtSource(bent), 'a stripped argv must not read as filtered, or this file proves nothing').toBe(false);
  });

  it('--template and -q also count, because both filter on the far side of the wire', () => {
    expect(isFilteredAtSource(['api', 'x', '--template', '{{.name}}'])).toBe(true);
    expect(isFilteredAtSource(['api', 'x', '-q', '.name'])).toBe(true);
    expect(isFilteredAtSource(['api', 'x'])).toBe(false);
  });
});

describe('the read stays a read', () => {
  it('no write verb reaches gh from this module', () => {
    const src = readFileSync(SOURCE, 'utf8');
    // Only the comment header may discuss other routes; the code must not.
    const code = src.replace(/^\/\/.*$/gm, '');
    for (const verb of ['--method POST', '--method PUT', '--method PATCH', '--method DELETE', '-X POST', '-X DELETE']) {
      expect(code, `gh-read.mjs must not carry ${verb}; it is a read`).not.toContain(verb);
    }
  });

  it('every path is scoped to this repository', () => {
    expect(REPO).toBe('darrellpoe06/Kingdom-PWA-Node');
    expect(READS.checks.path('abc')).toContain(`repos/${REPO}/`);
    expect(READS.runs.path('ci.yml')).toContain(`repos/${REPO}/`);
    expect(READS.steps.path('1')).toContain(`repos/${REPO}/`);
  });
});

describe('the measurement that justifies the file is written down', () => {
  // DR-0076 section 4: a quantitative claim comes from a measurement on the
  // real artifact. These numbers were measured against PR #2559's head and the
  // record cites them; if someone edits the header and drops them, the reason
  // the file exists goes with them.
  it('the header states both measured ratios and the commit they came from', () => {
    const src = readFileSync(SOURCE, 'utf8');
    expect(src).toContain('101,747 B raw');
    expect(src).toContain('1,368 B');
    expect(src).toContain('55,701 B raw');
    expect(src).toContain('243 B');
    expect(src).toContain('87d6b6fd9');
  });

  it('the header records that a guard was measured and rejected, not forgotten', () => {
    const src = readFileSync(SOURCE, 'utf8');
    expect(src).toContain('37 already filter at the source');
  });
});
