import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CONCERN_STATUS, CONCERN_STATUS_ORDER, statusMeta,
  daysLate, orderConcerns,
  feedbackToConcernCards, composeConcerns, SEED_CONCERNS,
} from '../lib/concerns.js';
import { concernToRow, concernFromRow, mergeRemoteConcerns, CONCERN_COLUMN_OF } from '../lib/concerns-sync.js';

afterEach(() => { vi.useRealTimers(); });

describe('CONCERN_STATUS', () => {
  it('covers exactly open / in-progress / done with themeable classes (no raw-only color)', () => {
    expect(CONCERN_STATUS_ORDER).toEqual(['open', 'in-progress', 'done']);
    for (const k of CONCERN_STATUS_ORDER) {
      const s = CONCERN_STATUS[k];
      expect(s.text).toMatch(/^text-\[#/);
      expect(s.bg).toMatch(/^bg-\[#/);
      expect(s.border).toMatch(/^border-\[#/);
    }
  });
  it('statusMeta falls back to open for an unknown status', () => {
    expect(statusMeta('bogus')).toBe(CONCERN_STATUS.open);
  });
});

describe('SEED_CONCERNS — honest, real, dated', () => {
  it('every seed has a concern, a known status, and a stable seed- id', () => {
    expect(SEED_CONCERNS.length).toBeGreaterThanOrEqual(13);
    for (const c of SEED_CONCERNS) {
      expect(c.id.startsWith('seed-')).toBe(true);
      expect(c.concern.length).toBeGreaterThan(0);
      expect(CONCERN_STATUS_ORDER).toContain(c.status);
    }
  });
  it('marks the confirmed-done items done and the open ones open (status told honestly)', () => {
    const byId = Object.fromEntries(SEED_CONCERNS.map((c) => [c.id, c]));
    expect(byId['seed-wf18-import-down'].status).toBe('done');
    // seed-pwa-reload-update was 'done' (2026-06-10) but real 2026-06-14/15
    // reports show the Update-now prompt still doesn't clear — reopened to
    // 'in-progress' (Verification Doctrine: "done" must be evidence-backed).
    expect(byId['seed-pwa-reload-update'].status).toBe('in-progress');
    expect(byId['seed-darkmode-contrast'].status).toBe('done');
    expect(byId['seed-cloud-nas-split'].status).toBe('open');
    expect(byId['seed-vercel-cap'].status).toBe('open');
    expect(byId['seed-review-sequences'].status).toBe('open');
    expect(byId['seed-feedback-auto-eval'].targetDate).toBe('2026-07-01');
  });
  it('carries the 2026-06-23 feedback-derived concerns, each honestly anchored', () => {
    const fb = SEED_CONCERNS.filter((c) => c.id.startsWith('seed-fb-'));
    expect(fb.length).toBe(20);
    for (const c of fb) {
      // de-identified: no raw email leaked into the shipped bundle
      expect(c.concern).not.toMatch(/@/);
      // every concern is anchored by a real date or an honest whenNote
      expect(Boolean(c.targetDate) || Boolean(c.whenNote)).toBe(true);
      expect(c.area && c.area.length).toBeGreaterThan(0);
    }
  });
});

describe('daysLate — the board flags its own slips', () => {
  it('counts days past a real target for an unresolved concern', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T00:00:00Z'));
    expect(daysLate({ status: 'open', targetDate: '2026-06-10' })).toBe(10);
  });
  it('is 0 for done concerns, future targets, and prose-only conditions', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T00:00:00Z'));
    expect(daysLate({ status: 'done', targetDate: '2026-06-10' })).toBe(0);
    expect(daysLate({ status: 'open', targetDate: '2026-07-01' })).toBe(0);
    expect(daysLate({ status: 'open', whenNote: 'after review' })).toBe(0);
  });
});

describe('orderConcerns', () => {
  it('asc: nearest target first, undated sinks to the bottom in stable order', () => {
    const list = [
      { id: 'a', targetDate: '2026-07-10' },
      { id: 'b', whenNote: 'someday' },
      { id: 'c', targetDate: '2026-06-20' },
    ];
    expect(orderConcerns(list, 'asc').map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });
  it('desc: most-recent target first (for done)', () => {
    const list = [
      { id: 'a', targetDate: '2026-06-10' },
      { id: 'b', targetDate: '2026-06-17' },
    ];
    expect(orderConcerns(list, 'desc').map((c) => c.id)).toEqual(['b', 'a']);
  });
  it('honors a hand-set sortRank ahead of dates', () => {
    const list = [
      { id: 'a', targetDate: '2026-06-10', sortRank: 2 },
      { id: 'b', targetDate: '2026-07-01', sortRank: 0 },
    ];
    expect(orderConcerns(list).map((c) => c.id)).toEqual(['b', 'a']);
  });
});

describe('feedbackToConcernCards — read-through auto feed', () => {
  it('maps a feedback row to an open, read-only concern card with its thumbnail', () => {
    const cards = feedbackToConcernCards([
      { id: 'fb1', text: 'the import is stuck', currentView: 'books', screenshot: 'data:image/jpeg;base64,xxx', displayName: 'Christina', deviceLabel: 'iOS', submittedAt: '2026-06-18T10:00:00Z' },
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: 'fb-fb1', concern: 'the import is stuck', status: 'open',
      source: 'feedback', readOnly: true, area: 'books',
      thumbnail: 'data:image/jpeg;base64,xxx', author: 'Christina',
    });
  });
  it('treats a resolved-triage feedback row as done', () => {
    const [card] = feedbackToConcernCards([{ id: 'x', feedback_text: 'fixed thing', triageStatus: 'resolved' }]);
    expect(card.status).toBe('done');
  });
  it('drops empty/garbage feedback rows', () => {
    expect(feedbackToConcernCards([{ id: 'e' }, null, { id: 'k', text: '' }])).toEqual([]);
  });
});

describe('composeConcerns — three inputs merged, DB supersedes same-id seed', () => {
  it('appends seeds + feedback and lets a DB row override a same-id seed', () => {
    const dbConcerns = [{ id: 'seed-vercel-cap', concern: 'overridden', status: 'done', source: 'manual' }];
    const out = composeConcerns({ dbConcerns, feedback: [{ id: 'f', text: 'a note' }] });
    const vercel = out.filter((c) => c.id === 'seed-vercel-cap');
    expect(vercel).toHaveLength(1);            // de-duped — DB wins, seed hidden
    expect(vercel[0].concern).toBe('overridden');
    expect(out.some((c) => c.id === 'fb-f')).toBe(true);          // feedback present
    expect(out.some((c) => c.id === 'seed-wf18-import-down')).toBe(true); // seeds present
  });
});

describe('concerns-sync round-trip', () => {
  it('toRow maps local → DB columns; blank target becomes NULL', () => {
    const row = concernToRow(
      { id: 'cn-1', concern: 'C', solution: 'S', targetDate: '', whenNote: 'soon', status: 'in-progress', area: 'Finance', source: 'manual' },
      { tenantId: 't1', userId: 'u1' },
    );
    expect(row).toMatchObject({ instance_id: 't1', created_by: 'u1', slug: 'cn-1', concern: 'C', solution: 'S', target_date: null, when_note: 'soon', status: 'in-progress', area: 'Finance' });
  });
  it('fromRow maps DB → local shape and keeps the remote uuid', () => {
    const local = concernFromRow({ id: 'uuid-9', slug: 'cn-1', instance_id: 't1', concern: 'C', target_date: '2026-07-01', status: 'open' });
    expect(local).toMatchObject({ id: 'cn-1', remoteUuid: 'uuid-9', concern: 'C', targetDate: '2026-07-01', status: 'open' });
  });
  it('CONCERN_COLUMN_OF maps the editable fields and never instance_id/created_by', () => {
    expect(CONCERN_COLUMN_OF.status).toBe('status');
    expect(CONCERN_COLUMN_OF.targetDate).toBe('target_date');
    expect(CONCERN_COLUMN_OF.instance_id).toBeUndefined();
    expect(CONCERN_COLUMN_OF.created_by).toBeUndefined();
  });
  it('mergeRemoteConcerns keeps a never-uploaded local-only row through a refetch', () => {
    const local = [{ id: 'cn-local' }];                     // non-uuid id → never uploaded
    const incoming = [{ id: '11111111-2222-3333-4444-555555555555' }];
    const merged = mergeRemoteConcerns(local, incoming);
    expect(merged.some((c) => c.id === 'cn-local')).toBe(true);
    expect(merged.some((c) => c.id === incoming[0].id)).toBe(true);
  });
});
