// The live feed itself needs the NAS, but its PARSING is pure and verified here
// so the consumer's data handling never ships untested (DR-0061 / P16).
import { describe, it, expect } from 'vitest';
import { normalizeWorkflowStatus } from '../components/WorkflowStatus.jsx';

describe('normalizeWorkflowStatus', () => {
  it('returns ok:false for a not-configured feed', () => {
    const n = normalizeWorkflowStatus({ ok: false, error: 'n8n API key not configured' });
    expect(n.ok).toBe(false);
    expect(n.error).toMatch(/api key/i);
    expect(n.workflows).toEqual([]);
  });

  it('returns ok:false (not a throw) for null / garbage', () => {
    expect(normalizeWorkflowStatus(null).ok).toBe(false);
    expect(normalizeWorkflowStatus('nope').ok).toBe(false);
  });

  it('normalizes a real feed and derives active count when absent', () => {
    const n = normalizeWorkflowStatus({
      ok: true,
      total: 3,
      workflows: [
        { name: 'wf30', active: true, last_run: '2026-06-13T10:00:00Z', last_status: 'SUCCESS' },
        { name: 'wf21', active: false, last_status: 'error' },
        { name: 'wf-x', active: true },
      ],
    });
    expect(n.ok).toBe(true);
    expect(n.total).toBe(3);
    expect(n.active).toBe(2); // derived from the two active:true entries
    expect(n.workflows[0].lastStatus).toBe('success'); // lowercased
    expect(n.workflows[2].lastStatus).toBe('never-run'); // default
    expect(n.workflows[1].lastRun).toBe(null);
  });

  it('honors an explicit active/recent_errors count from the feed', () => {
    const n = normalizeWorkflowStatus({ ok: true, total: 46, active: 1, recent_errors: 2, workflows: [] });
    expect(n.active).toBe(1);
    expect(n.recentErrors).toBe(2);
  });
});
