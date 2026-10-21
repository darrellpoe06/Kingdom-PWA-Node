// @vitest-environment node
// =============================================================================
// The waiting queue has a witness (DR-1186)
// =============================================================================
// Darrell's hourly in-app lesson intake routine starts by dispatching
// `inbox-lessons-waiting.yml` and reading its result. From a cloud session that
// result was effectively unreadable: the only road to it was the Actions run
// listing, which returns every run's full commit body — one such call cost
// thousands of tokens and answered nothing. So two firings of a standing lane
// passed on 2026-10-21 with nobody able to say whether a teaching was waiting,
// and "I could not read it" is not the same answer as "nothing was waiting".
//
// Six witnesses in this repository already solve exactly this, the same way —
// site health (#1693), node availability (#1696), the public shelf (#2126), the
// reader's level (#1687), the loops (#2329), the fleet census (#2325). This is
// the seventh, and these cases pin the two properties that make it worth
// having:
//
//   1. IT APPENDS ON EVERY RUN, pass or fail, so silence on the log means the
//      witness did not run rather than that nothing is waiting (DR-0125).
//   2. AN UNREADABLE QUEUE IS RECORDED AS UNKNOWN, NEVER AS ZERO (DR-0076 §8).
//      A lane whose database cannot be read must not look like a lane with an
//      empty queue — that is the failure that would hide a waiting teaching.
//
// And the rule the workflow already carried, which this must not break: NEVER A
// BODY. A lesson holds a person's words and this log is visible to the repo.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Read as SOURCE, which is this repository's way with a workflow (every other
// workflow test here does the same) and needs no YAML parser in app/'s deps.
// The steps are split on their own `- name:` lines at the steps' indent, so a
// claim about one step cannot be satisfied by text in another -- the exact hole
// a lazy regex left in DR-1175's gate.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SRC = readFileSync(join(ROOT, '.github/workflows/inbox-lessons-waiting.yml'), 'utf8');

const STEP_BLOCKS = (() => {
  const lines = SRC.split('\n');
  const starts = [];
  lines.forEach((l, i) => { if (/^ {6}- (name|uses):/.test(l)) starts.push(i); });
  return starts.map((i, k) => lines.slice(i, k + 1 < starts.length ? starts[k + 1] : lines.length).join('\n'));
})();
const stepBlock = (re) => {
  const hit = STEP_BLOCKS.filter((b) => re.test(b.split('\n')[0]));
  if (hit.length !== 1) throw new Error(`expected exactly one step matching ${re}, found ${hit.length}`);
  return hit[0];
};
const LOG = stepBlock(/Record the run/);
const READ = stepBlock(/List the waiting lesson rows/);
const PERMS = (SRC.match(/^permissions:\n(?:[ ]{2}.*\n)+/m) || [''])[0];

describe('the workflow still is what it was', () => {
  it('is dispatch-only — this adds no timer and spawns no compute', () => {
    expect(SRC).toMatch(/^on:\n {2}workflow_dispatch: \{\}\n/m);
    expect(SRC).not.toMatch(/^\s+schedule:/m);
    const mins = Number((SRC.match(/timeout-minutes:\s*(\d+)/) || [])[1]);
    expect(mins).toBeLessThanOrEqual(5);
    expect(SRC).toMatch(/^concurrency:\n {2}group: inbox-lessons-waiting$/m);
  });

  it('reads the database and writes nothing to it', () => {
    expect(PERMS).toMatch(/^ {2}contents: read$/m);
    expect(SRC).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  });

  it('may write an issue now, and only an issue', () => {
    expect(PERMS).toMatch(/^ {2}issues: write/m);
    expect(PERMS).toMatch(/^ {2}pull-requests: read$/m);
  });
});

describe('it appends on every run, so silence means the witness did not run', () => {
  it('the log step runs even when the read failed', () => {
    expect(LOG, 'the run-log step exists').toBeTruthy();
    expect(LOG).toMatch(/^\s+if: always\(\)$/m);
  });

  it('comes AFTER the read, so it has something to record', () => {
    expect(SRC.indexOf(LOG.split('\n')[0])).toBeGreaterThan(SRC.indexOf(READ.split('\n')[0]));
  });

  it('appends to ONE rolling issue, found by its own title, and opens it once', () => {
    expect(LOG).toMatch(/gh issue list .*--search "in:title lesson-intake: the waiting queue, run log"/);
    expect(LOG).toMatch(/gh issue comment/);
    expect(LOG).toMatch(/gh issue create/);
    // --state all, so a closed log is reused rather than a second one opened.
    expect(LOG).toMatch(/--state all/);
  });

  it('a failure to write the log does not swallow the measurement', () => {
    // The step summary still carries it, and the step says so instead of
    // failing silently.
    expect(LOG).toMatch(/could not append to the run log/);
    expect(LOG).toMatch(/step summary only/);
  });
});

describe('an unreadable queue is UNKNOWN, never zero', () => {
  it('the read step reports ok or failed, and a failed read still fails the run', () => {
    expect(READ).toMatch(/^\s+id: waiting$/m);
    expect(READ).toMatch(/echo "read=failed" >> "\$GITHUB_OUTPUT"/);
    expect(READ).toMatch(/echo "count=unknown" >> "\$GITHUB_OUTPUT"/);
    expect(READ).toMatch(/echo "read=ok" >> "\$GITHUB_OUTPUT"/);
    // It still exits 1 on a failed read: recording the outcome does not excuse it.
    expect(READ).toMatch(/could not read the live database[\s\S]*?exit 1/);
  });

  it('a failed read is written down as NOT an empty queue, in words', () => {
    expect(READ).toMatch(/Waiting lesson rows: UNKNOWN/);
    expect(READ).toMatch(/not an empty queue -- it is an unread one/i);
    expect(LOG).toMatch(/NOT an empty queue; it is an unread one/);
  });

  it('and so is a read that never reported at all', () => {
    // The job dying before the read is its own answer, and it is also not zero.
    expect(LOG).toMatch(/the read step did not report/);
    expect(LOG).toMatch(/Not an empty queue/);
  });

  it('PROVEN TO CATCH: the three outcomes are distinct branches, not one default', () => {
    const cases = [...LOG.matchAll(/^\s*(ok|failed|\*)\)\s/gm)].map((m) => m[1]);
    expect(cases).toEqual(['ok', 'failed', '*']);
  });
});

describe('never a body', () => {
  it('the rows are listed by their declared columns, and the body only by LENGTH', () => {
    const sql = readFileSync(join(ROOT, 'scripts/lesson-inbox-waiting.sql'), 'utf8');
    expect(sql).toMatch(/length\(coalesce\(body,''\)\)/);
    expect(sql).not.toMatch(/SELECT[^;]*\bbody\b(?!\s*,''\))[^;]*FROM/i);
    // The log step passes the query's output through and adds no column.
    expect(LOG).toMatch(/never a body/);
    expect(LOG).toMatch(/waiting-rows\.txt/);
  });

  it('the log step reads the rows ONLY from the file the query wrote', () => {
    expect(READ).toMatch(/> "\$RUNNER_TEMP\/waiting-rows\.txt"/);
    const reads = [...LOG.matchAll(/\$RUNNER_TEMP\/([a-z-]+\.(?:txt|md))/g)].map((m) => m[1]);
    expect(new Set(reads)).toEqual(new Set(['waiting-rows.txt', 'intake-line.md', 'intake-body.md']));
  });
});
