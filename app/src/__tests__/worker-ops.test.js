// Proven-to-catch tests for the 1099 worker-manager helpers (worker-ops.js).
// Each asserts a behavior that, if regressed, would silently mislead the
// manager view: a resolved order still showing as open, a legacy dispatch row
// dropped, a voice entry losing its real timestamp/author, or a record
// fabricated from an empty form.
import { describe, it, expect } from 'vitest';
import {
  WORKER_VOICE_AREA,
  workerOpenIncidents,
  buildFollowUpMessage,
  buildWorkerVoiceRecord,
  isWorkerVoice,
  voiceEntries,
} from '../lib/worker-ops.js';

const asg = (contractorId, extra = {}) => ({
  id: `asg-${contractorId}-${Math.random().toString(36).slice(2, 6)}`,
  contractorId,
  name: 'Worker',
  status: 'assigned',
  dispatchedAt: '2026-07-01T10:00:00Z',
  ...extra,
});

describe('workerOpenIncidents — assignment matching', () => {
  it('returns [] for empty inputs', () => {
    expect(workerOpenIncidents('k1', [])).toEqual([]);
    expect(workerOpenIncidents('k1')).toEqual([]);
    expect(workerOpenIncidents('', [{ id: 'in1', dispatch: { assignments: [asg('k1')] } }])).toEqual([]);
  });

  it('finds open incidents assigned to the contractor and skips other workers', () => {
    const incidents = [
      { id: 'in1', status: 'open', dispatch: { assignments: [asg('k1'), asg('k2')] } },
      { id: 'in2', status: 'open', dispatch: { assignments: [asg('k2')] } },
      { id: 'in3', status: 'open' }, // no dispatch at all
    ];
    const hits = workerOpenIncidents('k1', incidents);
    expect(hits).toHaveLength(1);
    expect(hits[0].incident.id).toBe('in1');
    expect(hits[0].assignment.contractorId).toBe('k1');
  });

  it('excludes resolved incidents', () => {
    const incidents = [
      { id: 'in1', status: 'resolved', dispatch: { assignments: [asg('k1')] } },
      { id: 'in2', status: 'open', dispatch: { assignments: [asg('k1')] } },
    ];
    expect(workerOpenIncidents('k1', incidents).map(h => h.incident.id)).toEqual(['in2']);
  });

  it('reads the legacy single-worker dispatch shape', () => {
    const incidents = [
      { id: 'in1', status: 'open', dispatch: { contractorId: 'k1', contractorName: 'Isaiah Ramos' } },
    ];
    const hits = workerOpenIncidents('k1', incidents);
    expect(hits).toHaveLength(1);
    expect(hits[0].assignment.name).toBe('Isaiah Ramos');
  });

  it('keeps the per-worker slice: a done assignment on a still-open order surfaces as done', () => {
    const incidents = [
      { id: 'in1', status: 'open', dispatch: { assignments: [asg('k1', { status: 'done', doneAt: '2026-07-02T09:00:00Z' })] } },
    ];
    const hits = workerOpenIncidents('k1', incidents);
    expect(hits[0].assignment.status).toBe('done');
  });

  it('does not match a nameless-id assignment to any roster row', () => {
    const incidents = [{ id: 'in1', status: 'open', dispatch: { assignments: [asg('', { name: 'Cash guy' })] } }];
    expect(workerOpenIncidents('k1', incidents)).toEqual([]);
  });
});

describe('buildFollowUpMessage — answerable from the phone', () => {
  it('carries the job, due date, and the ask', () => {
    const msg = buildFollowUpMessage({ description: 'Furnace blowing cold air', dueDate: '2026-07-08' });
    expect(msg).toContain('Furnace blowing cold air');
    expect(msg).toContain('Due: 2026-07-08');
    expect(msg).toContain('Any update?');
  });

  it('omits the due line when there is no due date', () => {
    expect(buildFollowUpMessage({ description: 'Paint unit B' })).not.toContain('Due:');
  });
});

describe('buildWorkerVoiceRecord — shape and refusal to fabricate', () => {
  const contractor = { id: 'k1', name: 'Isaiah Ramos', role: 'plumber' };

  it('builds a rail-ready record tagged worker-ops', () => {
    const r = buildWorkerVoiceRecord({
      contractor,
      said: 'The shutoff valves at Cedar are all corroded',
      incident: { id: 'in1', description: 'Cedar Ln leak' },
      at: '2026-07-05T14:00:00Z',
    });
    expect(r.area).toBe(WORKER_VOICE_AREA);
    expect(r.currentView).toBe(WORKER_VOICE_AREA);
    expect(r.text).toContain('Isaiah Ramos (plumber)');
    expect(r.text).toContain('The shutoff valves at Cedar are all corroded');
    expect(r.text).toContain('re: Cedar Ln leak');
    expect(r.contractorId).toBe('k1');
    expect(r.incidentId).toBe('in1');
    expect(r.createdAt).toBe('2026-07-05T14:00:00Z');
    expect(r.id).toMatch(/^wv-/);
  });

  it('returns null when nothing was said or no worker is named', () => {
    expect(buildWorkerVoiceRecord({ contractor, said: '   ' })).toBeNull();
    expect(buildWorkerVoiceRecord({ contractor: { id: 'k1', name: '' }, said: 'words' })).toBeNull();
    expect(buildWorkerVoiceRecord({})).toBeNull();
  });

  it('stands alone without an incident link', () => {
    const r = buildWorkerVoiceRecord({ contractor, said: 'Schedule works better on Tuesdays' });
    expect(r.text).not.toContain('re:');
    expect(r.incidentId).toBe('');
  });
});

describe('isWorkerVoice / voiceEntries — the display list', () => {
  it('recognizes both the local (area) and remote (currentView) shapes', () => {
    expect(isWorkerVoice({ area: 'worker-ops' })).toBe(true);
    expect(isWorkerVoice({ currentView: 'worker-ops' })).toBe(true);
    expect(isWorkerVoice({ currentView: 'books-1099' })).toBe(false);
    expect(isWorkerVoice(null)).toBe(false);
  });

  it('filters to worker voice, sorts newest first by real timestamp, dedupes by id', () => {
    const items = [
      { id: 'a', area: 'worker-ops', text: 'older', createdAt: '2026-07-01T10:00:00Z' },
      { id: 'b', currentView: 'worker-ops', text: 'newer', submittedAt: '2026-07-04T10:00:00Z', remote: true },
      { id: 'a', area: 'worker-ops', text: 'older', createdAt: '2026-07-01T10:00:00Z' }, // duplicate id
      { id: 'c', currentView: 'overview', text: 'not worker voice', submittedAt: '2026-07-05T10:00:00Z' },
    ];
    const out = voiceEntries(items);
    expect(out.map(e => e.id)).toEqual(['b', 'a']);
  });

  it('is empty-input honest', () => {
    expect(voiceEntries([])).toEqual([]);
    expect(voiceEntries()).toEqual([]);
  });
});
