// @vitest-environment node
// =============================================================================
// legal household sync — the two explicit calls behind 0299 (DR-1077)
// =============================================================================
// The walls live in Postgres (0299 smoke, rls-isolation leg legal-household).
// This pins what the client must do with what the wall returns:
//   • a shared row arrives marked fromHousehold, named for its sharer, and
//     carries an id that can never collide with the reader's own slugs;
//   • a backend without 0299 reads as 'not-available', never as an error the
//     person has to act on, and never as a fake empty success;
//   • a document that never synced cannot be shared, and nothing is sent;
//   • a share that matched no row (not the filer) is refused in words.
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sb = vi.hoisted(() => ({ rpc: null, update: null, sent: [] }));

vi.mock('../lib/supabase.js', () => {
  const client = {
    rpc: (...args) => sb.rpc(...args),
    from: () => ({
      update: (patch) => {
        sb.sent.push(patch);
        const chain = { eq: () => chain, select: () => chain, maybeSingle: () => sb.update(patch) };
        return chain;
      },
    }),
    auth: { getSession: async () => ({ data: { session: null } }) },
    storage: { from: () => ({}) },
  };
  return { default: client, supabase: client };
});
vi.mock('../lib/table-sync.js', () => ({
  createTableSync: (cfg) => cfg,
  unionPreservingLocal: (a) => a,
}));

import {
  fetchHouseholdLegalDocuments, householdRowToDocument, legalDocumentsSync, setLegalDocumentShared,
} from '../lib/legal-documents-sync.js';

const row = {
  id: '5f0c1e9e-0000-4000-a000-000000000001', instance_id: 'i', created_by: 'c', shared_by: 'Christina',
  slug: 'ld-abc', category: 'business', doc_type: 'Reinstatement filing', label: 'Filed', date_of: '2026-10-20',
  privileged: true, where_filed: 'agent portal', note: null, file_name: null, file_size: null, storage_path: null,
  created_at: '2026-10-20T00:00:00Z', updated_at: null,
};

beforeEach(() => { sb.sent = []; });

describe('reading what the household shared', () => {
  it('marks every row as theirs, names the sharer, and never reuses the filer’s slug as the id', () => {
    const d = householdRowToDocument(row);
    expect(d.fromHousehold).toBe(true);
    expect(d.sharedBy).toBe('Christina');
    expect(d.id).not.toBe(row.slug);
    expect(d.id).toBe(`ld-household-${row.id}`);
    expect(householdRowToDocument({ ...row, shared_by: '' }).sharedBy).toBe('A member of your household');
  });

  it('returns the mapped rows', async () => {
    sb.rpc = async (name) => { expect(name).toBe('household_shared_legal_documents'); return { data: [row], error: null }; };
    const res = await fetchHouseholdLegalDocuments();
    expect(res.ok).toBe(true);
    expect(res.items.map((i) => i.label)).toEqual(['Filed']);
  });

  it('a backend without 0299 reads as not-available, not as an empty success', async () => {
    sb.rpc = async () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.household_shared_legal_documents' } });
    const res = await fetchHouseholdLegalDocuments();
    expect(res).toMatchObject({ ok: false, reason: 'not-available' });
  });

  it('a thrown network failure is caught and said', async () => {
    sb.rpc = async () => { throw new Error('offline'); };
    expect(await fetchHouseholdLegalDocuments()).toMatchObject({ ok: false, reason: 'network-error', message: 'offline' });
  });
});

describe('sharing one document', () => {
  it('REFUSES a document that never synced, and sends nothing', async () => {
    const res = await setLegalDocumentShared(null, true);
    expect(res).toMatchObject({ ok: false, reason: 'not-synced' });
    expect(sb.sent).toHaveLength(0);
  });

  it('sends exactly the one flag, and reports what the database kept', async () => {
    sb.update = async () => ({ data: { id: 'r', shared_with_household: true }, error: null });
    const res = await setLegalDocumentShared('r', true);
    expect(sb.sent).toEqual([{ shared_with_household: true }]);
    expect(res).toEqual({ ok: true, shared: true });
  });

  it('a row RLS did not return (not the filer) is refused in words', async () => {
    sb.update = async () => ({ data: null, error: null });
    expect(await setLegalDocumentShared('r', true)).toMatchObject({ ok: false, reason: 'not-found' });
  });

  it('the device sync never writes the flag, so sharing cannot happen by accident', () => {
    const out = legalDocumentsSync.toRow({ id: 'x', category: 'business', label: 'L', privileged: true, sharedWithHousehold: true }, { tenantId: 't', userId: 'u' });
    expect(out).not.toHaveProperty('shared_with_household');
    expect(legalDocumentsSync.fromRow({ ...row, shared_with_household: true }).sharedWithHousehold).toBe(true);
  });
});
