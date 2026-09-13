// =============================================================================
// use-board-tasks — a failed write is never silent (DR-0076)
// =============================================================================
// table-sync returns an honest result for every write, including a deleteRow
// that DETECTS an RLS-blocked 0-row delete rather than reporting false success.
// This store used to discard all of it: patch/delete errors went to console.warn
// and every consumer rendered success unconditionally. These pin the outcomes
// reaching consumers, and the restore that stops a refused delete from showing
// as a deletion.
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sync = {
  upload: vi.fn(async () => ({ uploaded: true, remoteId: 'uuid-1' })),
  updateRow: vi.fn(async () => ({ updated: true })),
  deleteRow: vi.fn(async () => ({ deleted: true, affected: 1 })),
  subscribe: vi.fn(),
};

vi.mock('../lib/board-tasks-sync.js', () => ({
  boardTasksSync: sync,
  mergeRemoteBoardTasks: (cur) => cur,
}));

const { ensureTask, patchTask, removeTask, lastWriteState } = await import('../lib/use-board-tasks.js');

const item = (over = {}) => ({
  slug: 'airbnb-ready:d1:kitchen:0', boardSlug: 'airbnb-ready:d1', boardTitle: 'Door',
  title: 'Refrigerator', status: 'not-started', group: 'Kitchen', notes: null, links: {}, ...over,
});

beforeEach(() => {
  localStorage.clear();
  sync.upload.mockClear(); sync.updateRow.mockClear(); sync.deleteRow.mockClear();
  sync.upload.mockResolvedValue({ uploaded: true, remoteId: 'uuid-1' });
  sync.deleteRow.mockResolvedValue({ deleted: true, affected: 1 });
});

describe('a write that lands', () => {
  it('reports ok', async () => {
    await ensureTask(item({ slug: 'ok-1' }));
    expect(lastWriteState()).toMatchObject({ ok: true, reason: null });
  });
});

describe('a write that does not land', () => {
  it('reports signed-out rather than success', async () => {
    sync.upload.mockResolvedValue({ skipped: 'signed-out' });
    await ensureTask(item({ slug: 'out-1' }));
    expect(lastWriteState()).toMatchObject({ ok: false, reason: 'signed-out' });
  });

  it('reports an insert error rather than success', async () => {
    sync.upload.mockResolvedValue({ skipped: 'insert-error', error: new Error('rls') });
    await ensureTask(item({ slug: 'err-1' }));
    expect(lastWriteState()).toMatchObject({ ok: false, reason: 'failed' });
  });

  it('reports a missing instance', async () => {
    sync.upload.mockResolvedValue({ skipped: 'no-tenant' });
    await ensureTask(item({ slug: 'nt-1' }));
    expect(lastWriteState()).toMatchObject({ ok: false, reason: 'no-tenant' });
  });
});

describe('a delete the database refuses', () => {
  // 0059's DELETE policy is owner/admin — a 'member' cannot delete. The delete
  // returns no error and removes NOTHING. PROVEN-TO-CATCH: drop the restore in
  // removeTask and the row stays gone locally, which is the resurrect-on-next-
  // merge bug this guards.
  it('puts the row back and says it was blocked', async () => {
    const row = item({ slug: 'del-1' });
    await ensureTask(row);
    sync.deleteRow.mockResolvedValue({ skipped: 'no-op', affected: 0 });
    await removeTask({ ...row, remoteUuid: 'uuid-1' });
    expect(lastWriteState()).toMatchObject({ ok: false, reason: 'blocked' });
    const saved = JSON.parse(localStorage.getItem('poetech-board-tasks-v1') || '[]');
    expect(saved.some((t) => t.slug === 'del-1')).toBe(true);
  });

  it('removes it for good when the database really deleted it', async () => {
    const row = item({ slug: 'del-2' });
    await ensureTask(row);
    sync.deleteRow.mockResolvedValue({ deleted: true, affected: 1 });
    await removeTask({ ...row, remoteUuid: 'uuid-1' });
    expect(lastWriteState()).toMatchObject({ ok: true });
    const saved = JSON.parse(localStorage.getItem('poetech-board-tasks-v1') || '[]');
    expect(saved.some((t) => t.slug === 'del-2')).toBe(false);
  });
});

describe('a patch that fails', () => {
  it('reports it instead of swallowing it', async () => {
    const row = item({ slug: 'p-1' });
    await ensureTask(row);
    sync.updateRow.mockResolvedValue({ skipped: 'update-error', error: new Error('nope') });
    patchTask({ ...row, remoteUuid: 'uuid-1' }, { status: 'done' });
    await new Promise((r) => setTimeout(r, 0));
    expect(lastWriteState()).toMatchObject({ ok: false, reason: 'failed' });
  });
});
