// @vitest-environment node
// discovery review lane — the factory's human gate, pinned (DR-0114/0117):
// faithful row round-trips, review only by a steward's action, and import
// REFUSING anything unreviewed. The source_quote is never altered by review.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase.js', () => ({ default: {}, supabase: {} }));
const uploadCalls = [];
vi.mock('../lib/discovery-sync.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    discoverySync: {
      upload: vi.fn(async (item) => { uploadCalls.push(item); return { uploaded: true, remoteId: `uuid-${item.id}` }; }),
      updateRow: vi.fn(async () => ({})),
      subscribe: vi.fn(() => () => {}),
    },
  };
});
const addTaskCalls = [];
vi.mock('../lib/use-board-tasks.js', () => ({
  addTask: vi.fn(async (t) => { addTaskCalls.push(t); }),
}));

import { toDiscoveryRow, fromDiscoveryRow } from '../lib/discovery-sync.js';
import { saveExtraction, reviewItem, importToBoard } from '../lib/use-discovery.js';
import { parseDiscoveryJson } from '../lib/client-engagements.js';

const SAMPLE = JSON.stringify({
  client: { name: 'Jo', business: 'QC Cakes' },
  requirements: [{ area: 'orders', requirement: 'Track custom cake orders', confidence: 'high', source_quote: 'I lose track of my cake orders' }],
  pricing: [{ item: 'Base cake', amount_text: '$40', source_quote: 'cakes start at forty' }],
  policies: [], channels: ['facebook'], pain_points: [], unclear: [],
});

beforeEach(() => { uploadCalls.length = 0; addTaskCalls.length = 0; });

describe('row round-trip is faithful', () => {
  it('local → row → local preserves the quote, status, and provenance', () => {
    const item = {
      id: 'di-1', kind: 'requirement', area: 'orders', text: 'Track orders',
      amountText: null, confidence: 'high', sourceQuote: 'I lose track',
      clientName: 'Jo', businessName: 'QC Cakes', sourceRecording: null,
      sourceRun: null, extractedAt: '2026-07-07T00:00:00.000Z',
      status: 'extracted', reviewedBy: null, reviewedAt: null, importedTaskSlug: null,
    };
    const row = toDiscoveryRow(item, { tenantId: 't-1', userId: 'u-1' });
    expect(row.slug).toBe('di-1');
    expect(row.source_quote).toBe('I lose track');
    expect(row.status).toBe('extracted');
    const back = fromDiscoveryRow({ ...row, id: 'uuid-9', created_at: 'now' });
    expect(back.id).toBe('di-1');
    expect(back.sourceQuote).toBe('I lose track');
    expect(back.businessName).toBe('QC Cakes');
    expect(back.remoteUuid).toBe('uuid-9');
  });
});

describe('the review gate', () => {
  it('saveExtraction lands every parsed item as extracted and uploads each', async () => {
    const parsed = parseDiscoveryJson(SAMPLE);
    const n = await saveExtraction(parsed);
    expect(n).toBe(2);
    expect(uploadCalls.length).toBe(2);
    expect(uploadCalls.every((i) => i.status === 'extracted')).toBe(true);
    expect(uploadCalls[0].sourceQuote).toBe('I lose track of my cake orders');
  });

  it('import REFUSES an unreviewed item — nothing unreviewed is built', async () => {
    const extracted = { id: 'di-x', kind: 'requirement', text: 'Do a thing', status: 'extracted' };
    const r = await importToBoard(extracted, { boardSlug: 'board-qc-cakes', boardTitle: 'QC Cakes' });
    expect(r.ok).toBe(false);
    expect(addTaskCalls.length).toBe(0);
  });

  it('a reviewed requirement imports as a REAL board task with its area as group', async () => {
    const parsed = parseDiscoveryJson(SAMPLE);
    await saveExtraction(parsed);
    const item = uploadCalls.find((i) => i.kind === 'requirement');
    reviewItem(item, { status: 'reviewed' });
    const r = await importToBoard({ ...item, status: 'reviewed' }, { boardSlug: 'board-qc-cakes', boardTitle: 'QC Cakes' });
    expect(r.ok).toBe(true);
    expect(addTaskCalls[0].boardSlug).toBe('board-qc-cakes');
    expect(addTaskCalls[0].group).toBe('orders');
    expect(addTaskCalls[0].title).toBe('Track custom cake orders');
  });

  it('review can edit the buildable text but a double-import is refused', async () => {
    const item = { id: 'di-y', kind: 'requirement', text: 'Old text', status: 'extracted' };
    reviewItem(item, { status: 'reviewed', text: 'Sharper text' });
    const imported = { ...item, status: 'reviewed', importedTaskSlug: 'board-x:already' };
    const r = await importToBoard(imported, { boardSlug: 'board-x', boardTitle: 'X' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('Already on the board.');
  });
});
