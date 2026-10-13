// =============================================================================
// Every agent_inbox row carries the build that wrote it (DR-0697, P69)
// =============================================================================
// 2026-09-30: dictation duplicates kept arriving after the DR-0685 fix shipped
// (the L201 row, 13:00 UTC). The likely cause, a phone still on the old cached
// app, could not be checked, because no row said which build wrote it. The
// app already applies a new service worker by itself (sw-update.js wireUpdates:
// auto skip-wait, checks on focus, visibility and an interval), so the gap was
// the evidence, not the update. PROVEN-TO-CATCH: drop withBuildTag from the
// insert and the second test fails.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';

const sent = [];
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
    from: () => ({
      insert: (row) => { sent.push(row); return { select: () => ({ single: async () => ({ data: { id: 'r1' }, error: null }) }) }; },
    }),
  },
}));
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: async () => 'i1' }));

const { relayThought, withBuildTag } = await import('../lib/agent-inbox-sync.js');

describe('the build stamp', () => {
  it('adds exactly one build tag and keeps every tag it was given, in order', () => {
    expect(withBuildTag(['lesson', 'voice'], 'abc1234')).toEqual(['lesson', 'voice', 'build:abc1234']);
    expect(withBuildTag(['lesson', 'build:old'], 'abc1234')).toEqual(['lesson', 'build:abc1234']);
    expect(withBuildTag(undefined, 'abc1234')).toEqual(['build:abc1234']);
  });

  it('the row that reaches the database carries it', async () => {
    const r = await relayThought({ body: 'a lesson', tags: ['lesson'] });
    expect(r.ok).toBe(true);
    const row = sent.at(-1);
    expect(row.tags[0]).toBe('lesson');
    expect(row.tags.some((t) => /^build:\S+$/.test(t))).toBe(true);
  });
});
