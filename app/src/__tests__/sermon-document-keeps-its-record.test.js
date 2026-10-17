// @vitest-environment node
// =============================================================================
// A sermon's document keeps its own record across saves (DR-1086)
// =============================================================================
// Every save of a sermon used to delete and re-insert its document row, so
// editing only the title reset when the document was filed and by whom, and an
// emailed document's source became 'manual'. Proven-to-catch: the unchanged
// case must touch nothing; a changed or cleared document still moves.
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({ rows: [], calls: [] }));

vi.mock('../lib/supabase.js', () => {
  const table = () => {
    const q = { _op: 'select', _filter: null };
    const run = () => {
      db.calls.push(q._op);
      if (q._op === 'select') return Promise.resolve({ data: db.rows.filter((r) => r.sermon_id === q._filter), error: null });
      if (q._op === 'delete') { db.rows = db.rows.filter((r) => r.sermon_id !== q._filter); return Promise.resolve({ error: null }); }
      return Promise.resolve({ error: null });
    };
    Object.assign(q, {
      select: () => q,
      delete: () => { q._op = 'delete'; return q; },
      insert: (row) => { db.calls.push('insert'); db.rows.push({ ...row, created_at: 'NEW' }); return Promise.resolve({ error: null }); },
      eq: (_c, v) => { q._filter = v; return q._op === 'delete' ? run() : q; },
      limit: () => run(),
    });
    return q;
  };
  const client = { from: table, auth: { getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'a@b.c' } } } }) } };
  return { default: client, supabase: client };
});
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: async () => 'church-1', churchInstanceResolve: async () => ({}) }));

const { saveSermonDocument } = await import('../lib/choir-sync.js');

beforeEach(() => {
  db.calls = [];
  db.rows = [{ id: 'd1', sermon_id: 's1', document_url: 'inst/msg/sermon.docx', document_source: 'email', created_at: '2026-06-01T10:00:00Z' }];
});

describe('saving a sermon leaves an unchanged document alone', () => {
  it('the same document: nothing deleted, nothing inserted, the original record kept', async () => {
    expect(await saveSermonDocument('s1', 'inst/msg/sermon.docx')).toEqual({ saved: true, unchanged: true });
    expect(db.calls).not.toContain('delete');
    expect(db.calls).not.toContain('insert');
    expect(db.rows[0]).toMatchObject({ document_source: 'email', created_at: '2026-06-01T10:00:00Z' });
  });
  it('a different document replaces it', async () => {
    expect(await saveSermonDocument('s1', 'https://docs.example/new')).toEqual({ saved: true });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({ document_url: 'https://docs.example/new', created_at: 'NEW' });
  });
  it('a cleared field removes it', async () => {
    expect(await saveSermonDocument('s1', '')).toEqual({ saved: true, cleared: true });
    expect(db.rows).toHaveLength(0);
  });
});
