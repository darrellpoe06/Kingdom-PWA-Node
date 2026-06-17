import { describe, it, expect } from 'vitest';
import {
  validateDiscussion,
  normalizeProjectSlugs,
  discussionsForProject,
  visibleDiscussions,
  sortDiscussions,
  discussionCounts,
  DISCUSSION_KIND_KEYS,
} from '../lib/discussions.js';
import { discussionToRow, discussionFromRow, mergeRemoteDiscussions } from '../lib/discussions-sync.js';

describe('validateDiscussion', () => {
  it('requires a title and a known kind', () => {
    expect(validateDiscussion({ title: '', kind: 'directive' })).toContain('A title is required.');
    expect(validateDiscussion({ title: 'x', kind: 'bogus' }).some((m) => m.includes('Pick a kind'))).toBe(true);
  });
  it('passes a well-formed record', () => {
    expect(validateDiscussion({ title: 'Set Q3 priorities', kind: 'directive', projectSlugs: ['pr-1'] })).toEqual([]);
  });
  it('rejects a non-array project link', () => {
    expect(validateDiscussion({ title: 'x', kind: 'decision', projectSlugs: 'pr-1' }).some((m) => m.includes('list'))).toBe(true);
  });
});

describe('normalizeProjectSlugs', () => {
  it('de-dupes, trims, and drops empties', () => {
    expect(normalizeProjectSlugs([' pr-1 ', 'pr-1', '', 'pr-2', null])).toEqual(['pr-1', 'pr-2']);
  });
  it('is safe on non-arrays', () => {
    expect(normalizeProjectSlugs(undefined)).toEqual([]);
  });
});

describe('discussionsForProject', () => {
  const data = [
    { id: 'dc-1', projectSlugs: ['pr-1'], createdAt: '2026-06-01' },
    { id: 'dc-2', projectSlugs: ['pr-2'], createdAt: '2026-06-02' },
    { id: 'dc-3', projectSlugs: ['pr-1', 'pr-2'], createdAt: '2026-06-03' },
  ];
  it('returns only linked discussions, newest-first', () => {
    const out = discussionsForProject(data, 'pr-1');
    expect(out.map((d) => d.id)).toEqual(['dc-3', 'dc-1']);
  });
  it('is empty for an unlinked project', () => {
    expect(discussionsForProject(data, 'pr-99')).toEqual([]);
  });
});

describe('visibleDiscussions (NO-LEAK, proven-to-catch)', () => {
  const data = [
    { id: 'dc-shared', visibility: 'shared', createdBy: 'userA' },
    { id: 'dc-privA', visibility: 'private', createdBy: 'userA' },
    { id: 'dc-privB', visibility: 'private', createdBy: 'userB' },
  ];
  it('hides another user\'s PRIVATE record (the leak this gate prevents)', () => {
    const seenByB = visibleDiscussions(data, 'userB', false).map((d) => d.id);
    expect(seenByB).toContain('dc-shared');
    expect(seenByB).toContain('dc-privB');
    expect(seenByB).not.toContain('dc-privA'); // userA's private must NOT leak to userB
  });
  it('shows the author their own private record', () => {
    expect(visibleDiscussions(data, 'userA', false).map((d) => d.id)).toContain('dc-privA');
  });
  it('lets an owner/governor see every private record (to govern)', () => {
    expect(visibleDiscussions(data, 'userC', true).map((d) => d.id))
      .toEqual(['dc-shared', 'dc-privA', 'dc-privB']);
  });
  it('does not leak private records to a signed-out viewer', () => {
    const out = visibleDiscussions(data, null, false).map((d) => d.id);
    expect(out).toEqual(['dc-shared']);
  });
});

describe('sortDiscussions + discussionCounts', () => {
  it('sorts newest-first deterministically', () => {
    const out = sortDiscussions([
      { id: 'a', createdAt: '2026-01-01' },
      { id: 'b', createdAt: '2026-03-01' },
      { id: 'c', createdAt: '2026-02-01' },
    ]);
    expect(out.map((d) => d.id)).toEqual(['b', 'c', 'a']);
  });
  it('counts total, open, and per-kind', () => {
    const c = discussionCounts([
      { kind: 'directive', status: 'open' },
      { kind: 'decision', status: 'resolved' },
      { kind: 'handoff', status: 'open' },
    ]);
    expect(c.total).toBe(3);
    expect(c.open).toBe(2);
    expect(c.byKind.directive).toBe(1);
    expect(c.byKind.handoff).toBe(1);
    expect(Object.keys(c.byKind).sort()).toEqual([...DISCUSSION_KIND_KEYS].sort());
  });
});

describe('discussionsSync round-trip', () => {
  it('maps local -> row with instance + creator', () => {
    const row = discussionToRow(
      { id: 'dc-1', kind: 'handoff', title: 'Feed lane', projectSlugs: ['pr-1'], visibility: 'private', meta: { lane: 'x' } },
      { tenantId: 'inst-1', userId: 'user-1' }
    );
    expect(row).toEqual(expect.objectContaining({
      instance_id: 'inst-1', created_by: 'user-1', slug: 'dc-1',
      kind: 'handoff', title: 'Feed lane', project_slugs: ['pr-1'],
      visibility: 'private', meta: { lane: 'x' },
    }));
  });
  it('maps row -> local, preserving remoteUuid + jsonb fields', () => {
    const local = discussionFromRow({
      id: 'uuid-1', slug: 'dc-1', instance_id: 'inst-1', created_by: 'user-1',
      kind: 'decision', title: 'Chose Cloudflare', body: 'why', project_slugs: ['pr-2'],
      visibility: 'shared', status: 'open', links: { dr_ref: 'DR-0001' }, meta: {},
      created_at: '2026-06-01', updated_at: null,
    });
    expect(local).toEqual(expect.objectContaining({
      id: 'dc-1', remoteUuid: 'uuid-1', kind: 'decision', projectSlugs: ['pr-2'],
      links: { dr_ref: 'DR-0001' }, createdBy: 'user-1',
    }));
  });
  it('mergeRemoteDiscussions keeps a never-uploaded local-only record', () => {
    const local = [{ id: 'dc-local-only', title: 'offline note' }];
    const remote = [{ id: '11111111-1111-1111-1111-111111111111', title: 'synced' }];
    const merged = mergeRemoteDiscussions(local, remote);
    expect(merged.map((d) => d.id)).toContain('dc-local-only');
    expect(merged.map((d) => d.id)).toContain('11111111-1111-1111-1111-111111111111');
  });
});
