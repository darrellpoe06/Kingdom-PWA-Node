// =============================================================================
// lesson-builder-health.yml -- the outcome is read by the RUNNER (DR-1232)
// =============================================================================
// DR-1219 added the outcome judgement (waiting | oldest hours | shipped in a
// day) to the lesson-builder witness, and read it INSIDE the ssh session on
// the NAS: `cd $REPO && bash scripts/live-sql.sh < scripts/lesson-loop-outcome.sql`.
// live-sql.sh is the runner's road -- tailnet -> ssh -> psql -- and needs
// NAS_SSH_KEY, which the NAS does not hold for itself. So from the day it
// landed every run read UNKNOWN and failed on its own method (main runs
// 40423587612, 40425627048, 40431353829 on 2026-10-27), and the witness that
// was built so silence stops reading as health went dark by a different
// silence. The read now also happens on the runner, which has the key and
// has joined the tailnet; this pins that shape, and fails on the old one.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const WORKFLOW = join(REPO, '.github', 'workflows', 'lesson-builder-health.yml');

/**
 * Where the outcome SQL is run from, per occurrence: "runner" when the line
 * sits outside every quoted ssh heredoc (<<'EOS' ... EOS), "nas" when inside.
 */
export function outcomeReads(src) {
  const reads = [];
  let inHeredoc = false;
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (!inHeredoc && /<<'EOS'/.test(line)) inHeredoc = true;
    else if (inHeredoc && t === 'EOS') { inHeredoc = false; continue; }
    if (line.includes('lesson-loop-outcome.sql') && !t.startsWith('#')) reads.push(inHeredoc ? 'nas' : 'runner');
  }
  return reads;
}

/** The step that holds the runner-side read, as its own text. */
function runnerStep(src) {
  const steps = src.split(/\n(?= {6}- name: )/);
  return steps.find((s) => outcomeReads(s).includes('runner')) || '';
}

/** The old shape: the runner-side step cut out, everything else as shipped. */
function oldShape(src) {
  const step = runnerStep(src);
  expect(step, 'the runner-side step must exist to be cut out').not.toBe('');
  return src.replace(`\n${step}`, '');
}

describe('lesson-builder-health reads the outcome from the runner (DR-1232)', () => {
  const src = readFileSync(WORKFLOW, 'utf8');

  it('the outcome SQL is run on the runner, outside every ssh heredoc', () => {
    expect(outcomeReads(src)).toContain('runner');
  });

  it('that step carries the key the road needs and feeds the witness the judge reads', () => {
    const step = runnerStep(src);
    expect(step).toMatch(/NAS_SSH_KEY: \$\{\{ secrets\.NAS_SSH_KEY \}\}/);
    expect(step).toMatch(/bash scripts\/live-sql\.sh '\|' < scripts\/lesson-loop-outcome\.sql/);
    expect(step).toContain('/tmp/witness.json');
    // it runs BEFORE the judge, or the judge never sees the numbers
    expect(src.indexOf(step)).toBeLessThan(src.indexOf('      - name: Judge and report'));
  });

  it('an unreadable outcome is still never a 0 (DR-1186): only three integers are written', () => {
    const step = runnerStep(src);
    expect(step).toMatch(/if len\(fields\) == 3:/);
    expect(step).not.toMatch(/waiting"\] = 0/);
  });

  it('PROVEN-TO-CATCH: the shape DR-1219 shipped reads the outcome only on the NAS', () => {
    const old = oldShape(src);
    expect(outcomeReads(old)).toEqual(['nas']);
    expect(outcomeReads(old)).not.toContain('runner');
  });
});
