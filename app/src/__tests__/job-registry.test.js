// @vitest-environment node
// =============================================================================
// The job registry is derived from .github/workflows, never typed (DR-1189)
// =============================================================================
// app/src/lib/job-registry.json carries every workflow with a LIVE schedule,
// its name and its crons, derived by scripts/derive-job-registry.mjs. This
// gate fails when the committed file drifts from the workflows on disk (the
// same discipline as lesson-dates.json), and is PROVEN TO CATCH on a fixture:
// a commented-out cron is not a schedule, a renamed workflow changes the file.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deriveJobRegistry, registryText, workflowCrons, workflowName, REGISTRY_PATH, WORKFLOWS_DIR } from '../../../scripts/derive-job-registry.mjs';

describe('the committed registry matches the workflows on disk', () => {
  it('is byte-for-byte what the derive script writes today', () => {
    const next = registryText(deriveJobRegistry(WORKFLOWS_DIR));
    const current = readFileSync(REGISTRY_PATH, 'utf8');
    expect(current, 'run `npm run jobs:registry` and commit app/src/lib/job-registry.json').toBe(next);
  });
  it('names every scheduled workflow by its actual name, with at least one cron each', () => {
    const reg = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
    expect(reg.derivedFrom).toBe('.github/workflows');
    expect(reg.jobs.length).toBe(reg.scheduled);
    for (const j of reg.jobs) {
      expect(j.file).toMatch(/\.ya?ml$/);
      expect(j.name.length).toBeGreaterThan(0);
      expect(j.crons.length).toBeGreaterThan(0);
    }
    expect(reg.jobs.map((j) => j.file)).toContain('site-health.yml');
  });
});

describe('the reader, proven to catch', () => {
  it('a commented-out cron is not a schedule; a live one is; the name is the declared name', () => {
    expect(workflowCrons("name: x\non:\n  schedule:\n    # - cron: '0 1 * * *'\n  workflow_dispatch:\n")).toEqual([]);
    expect(workflowCrons("name: 'Site health'\non:\n  schedule:\n    - cron: '7,37 * * * *'\n    - cron: '0 3 * * 1'\n  workflow_dispatch:\n")).toEqual(['7,37 * * * *', '0 3 * * 1']);
    expect(workflowName("name: 'Site health'\non: push\n", 'f.yml')).toBe('Site health');
    expect(workflowName("on: push\n", 'f.yml')).toBe('f.yml');
  });
  it('a renamed workflow or a changed cron changes the derived file, so drift cannot pass', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jobs-'));
    writeFileSync(join(dir, 'a.yml'), "name: alpha\non:\n  schedule:\n    - cron: '13 14 * * *'\n");
    writeFileSync(join(dir, 'b.yml'), "name: beta\non: push\n");
    const one = registryText(deriveJobRegistry(dir));
    expect(JSON.parse(one).jobs).toEqual([{ file: 'a.yml', name: 'alpha', crons: ['13 14 * * *'] }]);
    writeFileSync(join(dir, 'a.yml'), "name: alpha renamed\non:\n  schedule:\n    - cron: '13 14 * * *'\n");
    expect(registryText(deriveJobRegistry(dir))).not.toBe(one);
    writeFileSync(join(dir, 'a.yml'), "name: alpha\non:\n  schedule:\n    - cron: '14 14 * * *'\n");
    expect(registryText(deriveJobRegistry(dir))).not.toBe(one);
  });
});
