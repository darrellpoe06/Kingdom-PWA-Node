// =============================================================================
// workflow-register (DR-1342, DR-1330 D13): the facts are read from the YAML,
// a stale copy differs, the YAML total only goes down, and the live register
// agrees with the files on disk today.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { factsOf, build, judgeBudget, OUT, BUDGET } from '../../../scripts/workflow-register.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LIVE = JSON.parse(readFileSync(join(ROOT, OUT), 'utf8'));

describe('workflow-register: the reader', () => {
  it('reads name, purpose, triggers, crons, brakes, calls and lines', () => {
    const y = `# nearby-witness — look an address up\n# more\nname: Nearby witness\non:\n  workflow_dispatch:\n    inputs:\n      x:\n        default: 1\n  schedule:\n    - cron: '23 */6 * * *'  # six-hourly\npermissions:\n  contents: read\nconcurrency:\n  group: g\njobs:\n  a:\n    uses: ./.github/workflows/_browser-probe.yml\n    with:\n      timeout-minutes: 15\n`;
    const f = factsOf('x.yml', y);
    expect(f.name).toBe('Nearby witness');
    expect(f.purpose).toMatch(/^nearby-witness/);
    expect(f.triggers).toEqual(['workflow_dispatch', 'schedule']);
    expect(f.crons).toEqual(['23 */6 * * *']);
    expect(f.brakes).toEqual({ concurrency: true, timeout: true, permissions: true });
    expect(f.calls).toEqual(['_browser-probe.yml']);
    expect(f.lines).toBe(y.split('\n').length);
  });
  it('reads an inline trigger list and a bare trigger, and sees missing brakes', () => {
    expect(factsOf('a.yml', 'on: [push, pull_request]\njobs: {}\n').triggers).toEqual(['push', 'pull_request']);
    const f = factsOf('b.yml', 'name: b\non: workflow_dispatch\njobs:\n  j:\n    runs-on: ubuntu-latest\n');
    expect(f.triggers).toEqual(['workflow_dispatch']);
    expect(f.brakes).toEqual({ concurrency: false, timeout: false, permissions: false });
  });
  it('counts the shapes that matter: dispatch-only, scheduled, reusable, callers, and missing brakes', () => {
    const r = build({
      'a.yml': 'name: a\non:\n  workflow_dispatch: {}\nconcurrency:\n  group: a\npermissions:\n  contents: read\njobs:\n  j:\n    timeout-minutes: 5\n',
      'b.yml': 'name: b\non:\n  schedule:\n    - cron: "0 * * * *"\njobs:\n  j:\n    uses: ./.github/workflows/_h.yml\n',
      '_h.yml': 'name: h\non:\n  workflow_call: {}\npermissions:\n  contents: read\njobs:\n  j:\n    timeout-minutes: 5\n',
    });
    expect(r.counts).toMatchObject({
      workflows: 3,
      dispatchOnly: 1,
      scheduled: 1,
      reusable: 1,
      callers: 1,
      withoutConcurrency: 1,
      withoutTimeout: 0,
      withoutPermissions: 1,
    });
  });
  it('fails a YAML total over its ceiling and passes one under', () => {
    expect(judgeBudget(101, { totalLines: 100 })[0]).toMatch(/over the ceiling of 100/);
    expect(judgeBudget(100, { totalLines: 100 })).toEqual([]);
  });
});

describe('workflow-register: the live file', () => {
  it('equals what the YAML on disk builds today, and a stale copy differs', () => {
    const dir = join(ROOT, '.github/workflows');
    const files = Object.fromEntries(
      readdirSync(dir)
        .filter((f) => /\.ya?ml$/.test(f))
        .sort()
        .map((f) => [f, readFileSync(join(dir, f), 'utf8')])
    );
    const fresh = build(files);
    expect(fresh.workflows).toEqual(LIVE.workflows);
    expect(fresh.counts).toEqual(LIVE.counts);
    const stale = JSON.parse(JSON.stringify(LIVE));
    stale.workflows[0].lines += 1;
    expect(stale.workflows).not.toEqual(fresh.workflows);
  });
  it('holds the YAML total at or under the ceiling', () => {
    const budget = JSON.parse(readFileSync(join(ROOT, BUDGET), 'utf8'));
    expect(judgeBudget(LIVE.counts.totalLines, budget)).toEqual([]);
    expect(LIVE.counts.callers).toBeGreaterThanOrEqual(2);
  });
});
