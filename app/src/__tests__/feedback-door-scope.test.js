// @vitest-environment jsdom
// =============================================================================
// Feedback is filed to the door it was given in (DR-0444)
// =============================================================================
// Darrell, 2026-09-16, right after the message-notification fix: "Feedback
// should work the same way..."
//
// It did not. uploadFeedback() stamped every row with what
// `join_default_instance()` returns -- 'poe-family' -- so a member who tapped
// FEEDBACK inside the Love Corner app filed it into the FAMILY space, and the
// door it came from was recorded nowhere. Same defect as a church message
// notified into the family door: the record lost which house it belonged to.
//
// PROVEN-TO-CATCH: the first case below fails if the door resolution is
// removed from uploadFeedback, and the third fails if the RLS-as-membership
// property is replaced with a guess.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const CHURCH_ID = 'inst-colg';
const FAMILY_ID = 'inst-poe-family';

const inserted = [];
const selects = [];

function fakeSupabase({ instanceRow = { id: CHURCH_ID } } = {}) {
  return {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'me', email: 'ann@example.com' } } } }) },
    rpc: async (fn) => (fn === 'join_default_instance' ? { data: FAMILY_ID, error: null } : { data: null, error: null }),
    from: (table) => {
      if (table === 'instances') {
        return {
          select: () => ({
            eq: (col, val) => {
              selects.push({ table, col, val });
              // An RLS-refused read is not an error -- it is NO ROW. That is
              // the membership check, and it must read as "not my door".
              return { maybeSingle: async () => ({ data: instanceRow, error: null }) };
            },
          }),
        };
      }
      return { insert: async (row) => { inserted.push(row); return { error: null }; } };
    },
  };
}

let supa = fakeSupabase();
vi.mock('../lib/supabase.js', () => ({
  get default() { return supa; },
  get supabase() { return supa; },
  onAuthChange: () => () => {},
}));
vi.mock('../lib/synology-chat.js', () => ({ postToChat: async () => ({ ok: true }), formatFeedbackMessage: () => 'x' }));

const { uploadFeedback, doorInstanceId } = await import('../lib/feedback-sync.js');

function standIn(path) {
  window.history.replaceState({}, '', path);
}

beforeEach(() => {
  inserted.length = 0;
  selects.length = 0;
  supa = fakeSupabase();
});

describe('feedback belongs to the space it was given in', () => {
  it('files feedback given in the Love Corner door to the CHURCH space', async () => {
    standIn('/lovecorner/app/?view=church');
    const r = await uploadFeedback({ text: 'the month stepper shows nothing' }, {});
    expect(r.skipped, `upload was skipped: ${r.skipped}`).toBeUndefined();
    expect(inserted).toHaveLength(1);
    expect(inserted[0].instance_id).toBe(CHURCH_ID);
  });

  it('files feedback given in the family door to the default space, as before', async () => {
    standIn('/poetech-app/?tab=messages');
    await uploadFeedback({ text: 'big picture looks good' }, {});
    expect(inserted[0].instance_id).toBe(FAMILY_ID);
    // And it does not even ask about an instance it has no door for.
    expect(selects).toEqual([]);
  });

  it('falls back to the default space when RLS says this is not your door', async () => {
    // A non-member's read comes back with no row -- RLS is the membership
    // check, so a person cannot file into a door they do not belong to.
    supa = fakeSupabase({ instanceRow: null });
    standIn('/lovecorner/app/');
    await uploadFeedback({ text: 'from a visitor' }, {});
    expect(inserted[0].instance_id).toBe(FAMILY_ID);
  });

  it('resolves the door by its own slug, never by a guessed id', async () => {
    standIn('/lovecorner/app/');
    expect(await doorInstanceId(supa, { pathname: '/lovecorner/app/', search: '' })).toBe(CHURCH_ID);
    expect(selects).toEqual([{ table: 'instances', col: 'slug', val: 'colg' }]);
  });

  it('honors the legacy door param too (a printed QR)', async () => {
    expect(await doorInstanceId(supa, { pathname: '/', search: '?lovecorner=1' })).toBe(CHURCH_ID);
  });

  it('never throws, whatever the read does', async () => {
    const angry = { from: () => { throw new Error('offline'); } };
    await expect(doorInstanceId(angry, { pathname: '/lovecorner/app/', search: '' })).resolves.toBe(null);
  });
});
