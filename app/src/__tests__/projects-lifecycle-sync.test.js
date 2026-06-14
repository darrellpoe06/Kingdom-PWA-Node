// Regression test for A1 (rigorous-review 2026-06-13, HIGH dead end): projects
// push to the cloud, but the device-local rich fields (lifecycle trail,
// conversation log, contractor ids) were never mapped through sync, so every
// realtime refetch replaced the local project with a cloud copy that lacked
// them — stripping the lifecycle across devices. mergeRemoteProjects keeps the
// local rich field whenever the cloud row doesn't carry it yet, while letting
// the cloud win for the synced columns. Pairs with RELEASE-LANE.md.
import { describe, it, expect } from 'vitest';
import { mergeRemoteProjects } from '../lib/projects-sync.js';

const richLifecycle = {
  phase: 'in-progress',
  openedAt: '2026-06-01T00:00:00.000Z',
  log: [
    { at: '2026-06-01T00:00:00.000Z', fromPhase: null, toPhase: 'planning', by: 'user', note: 'created' },
    { at: '2026-06-05T00:00:00.000Z', fromPhase: 'planning', toPhase: 'in-progress', by: 'user', note: '' },
  ],
};

describe('mergeRemoteProjects (A1)', () => {
  it('preserves the local lifecycle when the cloud row has none (the strip bug)', () => {
    const local = [{ id: 'pr-1', title: 'Roof', status: 'in-progress', lifecycle: richLifecycle, contractorIds: ['c-1'], conversationLog: [{ id: 'cv-1' }] }];
    const incoming = [{ id: 'pr-1', title: 'Roof (renamed)', status: 'in-progress', lifecycle: undefined, contractorIds: undefined, conversationLog: undefined, remoteUuid: 'uuid-1' }];
    const out = mergeRemoteProjects(local, incoming);
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('Roof (renamed)'); // cloud wins for synced columns
    expect(out[0].lifecycle).toEqual(richLifecycle); // local rich field preserved
    expect(out[0].contractorIds).toEqual(['c-1']);
    expect(out[0].conversationLog).toEqual([{ id: 'cv-1' }]);
    expect(out[0].remoteUuid).toBe('uuid-1'); // cloud identity carried through
  });

  it('treats an EMPTY cloud lifecycle log as missing and keeps the richer local one', () => {
    const local = [{ id: 'pr-1', lifecycle: richLifecycle }];
    const incoming = [{ id: 'pr-1', lifecycle: { phase: 'planning', log: [] } }];
    const out = mergeRemoteProjects(local, incoming);
    expect(out[0].lifecycle).toEqual(richLifecycle);
  });

  it('lets a NON-empty cloud lifecycle win (a real edit from another device)', () => {
    const cloudLifecycle = { phase: 'done', log: [{ at: 't', toPhase: 'done', by: 'user' }] };
    const local = [{ id: 'pr-1', lifecycle: richLifecycle }];
    const incoming = [{ id: 'pr-1', lifecycle: cloudLifecycle }];
    const out = mergeRemoteProjects(local, incoming);
    expect(out[0].lifecycle).toEqual(cloudLifecycle);
  });

  it('keeps a never-uploaded local-only project (non-UUID id, absent from cloud)', () => {
    const local = [{ id: 'pr-local-only', title: 'Draft', lifecycle: richLifecycle }];
    const incoming = [{ id: 'pr-1', title: 'Synced' }];
    const out = mergeRemoteProjects(local, incoming);
    const ids = out.map((p) => p.id).sort();
    expect(ids).toEqual(['pr-1', 'pr-local-only']);
    expect(out.find((p) => p.id === 'pr-local-only').lifecycle).toEqual(richLifecycle);
  });

  it('drops a cloud project that has no local match without inventing rich fields', () => {
    const out = mergeRemoteProjects([], [{ id: 'pr-9', title: 'Remote', lifecycle: undefined }]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('pr-9');
    expect(out[0].lifecycle).toBeUndefined();
  });

  it('is safe on null/empty inputs', () => {
    expect(mergeRemoteProjects(null, null)).toEqual([]);
    expect(mergeRemoteProjects(undefined, [])).toEqual([]);
  });
});
