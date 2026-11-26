// DR-1676: Darrell 2026-11-26, "We want to understand users all of them!!! Fix feedback!!! Use another
// channel if needed". A note the feedback table cannot take (signed out, or refused by the membership
// rule) goes through the door channel (door_feedback_submit, anon-callable), and the board shows it.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const calls = [];
const state = { session: null, insertError: null };
vi.mock('../lib/supabase.js', () => {
  const chain = () => {
    const c = {
      select: () => c,
      eq: () => c,
      neq: () => c,
      order: () => c,
      limit: async () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: { id: 'inst-1' }, error: null }),
      insert: async (row) => (calls.push({ insert: row }), { error: state.insertError }),
    };
    return c;
  };
  const sb = {
    auth: { getSession: async () => ({ data: { session: state.session } }) },
    rpc: async (name, args) => (calls.push({ rpc: name, args }), { data: name === 'join_default_instance' ? 'inst-1' : 'note-1', error: null }),
    from: () => chain(),
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    }),
    removeChannel: () => {},
  };
  return { default: sb, supabase: sb };
});
vi.mock('../lib/synology-chat.js', () => ({ postToChat: () => {}, formatFeedbackMessage: () => '' }));

import { uploadFeedback, doorRowToShape } from '../lib/feedback-sync.js';

beforeEach(() => {
  calls.length = 0;
  state.session = null;
  state.insertError = null;
  window.history.replaceState(null, '', '/lovecorner/app/?view=church&sub=learn');
});

describe('every voice reaches the office', () => {
  it('a signed-out visitor on the church door: the note is filed through the door channel to the church', async () => {
    const r = await uploadFeedback({ text: 'The lesson would not open', area: 'learn' }, { activeTab: 'learn' });
    expect(r).toEqual({ uploaded: true, via: 'door' });
    const rpc = calls.find((c) => c.rpc === 'door_feedback_submit');
    expect(rpc.args.p_door_slug).toBe('lovecorner');
    expect(rpc.args.p_instance_slug).toBe('colg');
    expect(rpc.args.p_payload.body).toMatch(/\[learn\].*The lesson would not open/);
  });

  it('a signed-in member whose note the table refuses: the note still arrives, through the door channel', async () => {
    state.session = { user: { id: 'u-1' } };
    state.insertError = { message: 'new row violates row-level security policy', code: '42501' };
    const r = await uploadFeedback({ text: 'Please add more on marriage' }, { activeTab: 'learn' });
    expect(calls.some((c) => c.insert)).toBe(true);
    expect(r.via).toBe('door');
    expect(calls.filter((c) => c.rpc === 'door_feedback_submit').length).toBe(1);
  });

  it("a door note shows on the board in the board's own shape, marked as the door channel", () => {
    const item = doorRowToShape({
      id: 'n1',
      body: 'Hello',
      door_slug: 'lovecorner',
      area: 'other',
      status: 'new',
      created_at: '2026-11-26T13:00:00Z',
      submitted_by: null,
    });
    expect(item).toMatchObject({
      id: 'n1',
      text: 'Hello',
      currentView: 'door:lovecorner/other',
      triageStatus: 'new',
      source: 'door',
      displayName: 'A visitor (door channel)',
    });
  });
});
