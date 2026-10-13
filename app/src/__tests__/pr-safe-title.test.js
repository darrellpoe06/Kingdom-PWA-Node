// pr-safe-title — proven-to-catch (DR-0076 Section 3): the auto-open-pr title
// helper must keep a PR title within GitHub's 256-CHARACTER cap, or `gh pr
// create` hard-fails and the branch is left with no PR (the 2026-07-30
// incident, REV-0217). Runs the real shell script and asserts the boundary.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '../../..', 'scripts/pr-safe-title.sh');
const run = (subject) => execFileSync('bash', [SCRIPT, subject], { encoding: 'utf8' });
// Character count (GitHub counts characters, not bytes) — spread handles
// surrogate pairs; [...s].length is the code-point count.
const chars = (s) => [...s].length;

describe('pr-safe-title — PR title stays within GitHub 256-char cap', () => {
  it('leaves a short subject unchanged', () => {
    expect(run('A normal short subject')).toBe('A normal short subject');
  });

  it('leaves a subject exactly at the 256-char edge unchanged', () => {
    const edge = 'e'.repeat(256);
    expect(run(edge)).toBe(edge);
  });

  it('TRUNCATES a 1400-char subject to <= 256 characters', () => {
    const out = run('x'.repeat(1400));
    expect(chars(out)).toBeLessThanOrEqual(256);
    expect(out.endsWith('...')).toBe(true);
  });

  it('TRUNCATES a multibyte (em-dash) subject to <= 256 characters — the real incident shape', () => {
    const out = run('Discharge the item — with an em-dash — '.repeat(12));
    expect(chars(out)).toBeLessThanOrEqual(256);
  });

  it('the exact-length incident subject would have been bounded', () => {
    // A subject in the shape that failed gh pr create on 2026-07-30.
    const subject = 'Discharge REV-0216 0082/0100 live-smoke carried item: '.repeat(10);
    expect(chars(subject)).toBeGreaterThan(256); // precondition: this WAS too long
    expect(chars(run(subject))).toBeLessThanOrEqual(256);
  });
});
