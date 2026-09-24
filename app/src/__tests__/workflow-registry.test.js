// =============================================================================
// workflow-registry — retired with n8n (DR-0617)
// =============================================================================
// Locks the honest retired state: the registry is empty ON PURPOSE, the
// surface has words to say so, and the build no longer reads (or defines) the
// n8n export directories. (Which n8n files may remain is n8n-is-gone.test.js.)
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { storedWorkflowRegistry, WORKFLOW_REGISTRY_RETIRED } from '../lib/workflow-registry.js';

const repo = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));

describe('workflow registry — n8n retired (DR-0617)', () => {
  it('is empty on purpose', () => {
    expect(storedWorkflowRegistry()).toEqual([]);
  });

  it('carries a plain statement for every surface that used to render it', () => {
    expect(WORKFLOW_REGISTRY_RETIRED.decision).toBe('DR-0617');
    expect(WORKFLOW_REGISTRY_RETIRED.title).toMatch(/n8n workflows are retired/);
    expect(WORKFLOW_REGISTRY_RETIRED.note).toMatch(/HELD only until/);
    expect(WORKFLOW_REGISTRY_RETIRED.note).toMatch(/infra\/nas-loops/);
  });

  it('the build no longer reads or injects the n8n exports', () => {
    const vite = readFileSync(repo('app/vite.config.js'), 'utf8');
    expect(vite).not.toMatch(/n8n-workflows\/|infra\/n8n\//);
    expect(vite).not.toMatch(/__WORKFLOW_(REGISTRY|STATS)__:/);
  });
});
