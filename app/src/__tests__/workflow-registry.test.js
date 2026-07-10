// =============================================================================
// workflow-registry — Ari's derived workflow expertise (DR-0158)
// =============================================================================
// Locks: (1) the build-time extractor finds the REAL stored exports and pairs
// the ops-announce README why; (2) the bench readout names undocumented
// workflows as gaps instead of hiding or inventing them (NO-STATIC-DATA);
// (3) the why line never fabricates — a missing why says so in words.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { workflowExpertise, workflowWhyLine } from '../lib/workflow-registry.js';

const repo = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));

describe('workflowExpertise (pure)', () => {
  const rows = [
    { file: 'wf-a.json', dir: 'infra/n8n', name: 'A', active: true, webhooks: ['a-hook'], nodes: 3, why: 'Pushes incidents to the family.' },
    { file: 'wf-b.json', dir: 'infra/n8n', name: 'B', active: false, webhooks: [], nodes: 2, why: '' },
    { file: 'wf-c.json', dir: 'docs/00-foundations/n8n-workflows', name: 'C', active: false, webhooks: [], nodes: 5, why: '   ' },
  ];

  it('measures totals from the rows — nothing hand-typed', () => {
    const e = workflowExpertise(rows);
    expect(e.total).toBe(3);
    expect(e.active).toBe(1);
    expect(e.withWebhooks).toBe(1);
    expect(e.documented).toBe(1);
  });

  it('names every undocumented workflow as a gap (whitespace why is NOT documented)', () => {
    const e = workflowExpertise(rows);
    expect(e.gaps.map((g) => g.file)).toEqual(['wf-b.json', 'wf-c.json']);
  });

  it('handles junk input without lying', () => {
    expect(workflowExpertise(null).total).toBe(0);
    expect(workflowExpertise([{}, null, { file: '' }]).total).toBe(0);
  });
});

describe('workflowWhyLine — never fabricates', () => {
  it('speaks the recorded why verbatim', () => {
    expect(workflowWhyLine({ why: 'Real reason.' })).toBe('Real reason.');
  });
  it('a missing why is an honest, named gap — not a blank, not an invented description', () => {
    const line = workflowWhyLine({ why: '' });
    expect(line).toMatch(/not yet recorded/i);
    expect(line).toMatch(/DR-0158/);
  });
});

describe('the real stored exports feed the registry (build-side contract)', () => {
  it('both workflow dirs exist and hold exports', () => {
    const a = readdirSync(repo('docs/00-foundations/n8n-workflows')).filter((f) => f.endsWith('.json'));
    const b = readdirSync(repo('infra/n8n')).filter((f) => f.endsWith('.json'));
    expect(a.length).toBeGreaterThan(30);
    expect(b.length).toBeGreaterThan(5);
  });

  it('the ops-announce export pairs with its README so its why derives (the pairing rule)', () => {
    const wf = JSON.parse(readFileSync(repo('infra/n8n/wf-ops-announce.json'), 'utf8'));
    expect(wf.name).toMatch(/Ops announce/);
    const readme = readFileSync(repo('infra/n8n/README-ops-announce.md'), 'utf8');
    const para = readme.split(/\n\s*\n/).map((p) => p.replace(/^#.*$/m, '').replace(/\s+/g, ' ').trim()).find((p) => p.length > 40);
    expect(para).toBeTruthy();
    expect(para).toMatch(/ntfy|incident/i);
  });

  it('webhook doors extract from the real export shape', () => {
    const wf = JSON.parse(readFileSync(repo('infra/n8n/wf-ops-announce.json'), 'utf8'));
    const hooks = wf.nodes.filter((n) => n.type.endsWith('.webhook') && n.parameters?.path).map((n) => n.parameters.path);
    expect(hooks).toEqual(['ops-announce']);
  });
});
