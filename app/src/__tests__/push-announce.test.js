// @vitest-environment jsdom
// =============================================================================
// push-announce — the two calls that make a phone buzz, and what they refuse
// =============================================================================
// Three properties here protect a person rather than a program, and each is
// asserted hard:
//
//   1. A LIVE ANNOUNCEMENT ALWAYS CARRIES `isLive: true`, an explicit
//      declaration. The app's schedule-window `liveStatus()` never knows
//      whether a stream actually started, and you cannot un-buzz a phone. Only
//      a real declaration may reach the sender.
//   2. A MESSAGE PUSH NEVER CARRIES THE MESSAGE. DMs are end-to-end encrypted
//      and a lock screen is public.
//   3. NEITHER CALL EVER THROWS. Both are courtesies on top of an action that
//      already succeeded — the service is live and the message is delivered
//      whether or not the push lands. A failure here must not become a failure
//      of the thing the person actually did.
import { describe, it, expect, vi } from 'vitest';
import { announceLive, notifyNewMessage, PUSH_SEND_URL, LANDING } from '../lib/push-announce.js';

const supabaseWith = (token = 'jwt-abc') => ({
  auth: { getSession: async () => ({ data: token ? { session: { access_token: token } } : {} }) },
});

function fakeFetch(reply = { status: 200, json: { ok: true, succeeded: 3, failed: 0 } }) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (reply === 'throw') throw new Error('network down');
    return {
      status: reply.status,
      ok: reply.status >= 200 && reply.status < 300,
      json: async () => {
        if (reply.json === 'not-json') throw new Error('not json');
        return reply.json;
      },
    };
  };
  impl.calls = calls;
  return impl;
}

const liveArgs = {
  instanceId: 'inst-1', churchId: 'colg', churchName: 'The Love Corner',
  serviceLabel: 'Sunday Worship', videoId: 'vid1', at: '2026-09-06T16:00:00Z',
};

describe('announceLive — a declaration, never a guess', () => {
  it('posts to the same-origin sender with the caller’s JWT', async () => {
    const f = fakeFetch();
    await announceLive({ ...liveArgs, supabase: supabaseWith(), fetchImpl: f });
    expect(f.calls[0].url).toBe(PUSH_SEND_URL);
    expect(f.calls[0].init.method).toBe('POST');
    expect(f.calls[0].init.headers.Authorization).toBe('Bearer jwt-abc');
  });

  it('ALWAYS sends isLive:true — the sender refuses the announcement without it', async () => {
    const f = fakeFetch();
    await announceLive({ ...liveArgs, supabase: supabaseWith(), fetchImpl: f });
    expect(f.calls[0].body.isLive).toBe(true);
    expect(f.calls[0].body.topic).toBe('live');
  });

  it('carries plain words and a same-origin landing path', async () => {
    const f = fakeFetch();
    await announceLive({ ...liveArgs, supabase: supabaseWith(), fetchImpl: f });
    expect(f.calls[0].body.title).toBe('The Love Corner is live');
    expect(f.calls[0].body.body).toBe('Sunday Worship has started.');
    expect(f.calls[0].body.url).toBe(LANDING.live);
    expect(f.calls[0].body.url.startsWith('/')).toBe(true);
  });

  it('carries a deterministic dedupe key so a double tap cannot buzz twice', async () => {
    const a = fakeFetch();
    const b = fakeFetch();
    await announceLive({ ...liveArgs, at: '2026-09-06T16:00:04Z', supabase: supabaseWith(), fetchImpl: a });
    await announceLive({ ...liveArgs, at: '2026-09-06T16:00:41Z', supabase: supabaseWith(), fetchImpl: b });
    expect(a.calls[0].body.dedupeKey).toBe(b.calls[0].body.dedupeKey);
  });

  it('returns the sender’s measured counts, not a bare success', async () => {
    const r = await announceLive({
      ...liveArgs, supabase: supabaseWith(),
      fetchImpl: fakeFetch({ status: 200, json: { ok: true, succeeded: 12, failed: 1, attempted: 13 } }),
    });
    expect(r).toMatchObject({ ok: true, succeeded: 12, failed: 1 });
  });

  it('reports a dedupe as SUCCESS — an already-sent announcement is not an error', async () => {
    const r = await announceLive({
      ...liveArgs, supabase: supabaseWith(),
      fetchImpl: fakeFetch({ status: 200, json: { ok: true, deduped: true, sent: 0 } }),
    });
    expect(r.ok).toBe(true);
    expect(r.deduped).toBe(true);
  });

  it('distinguishes NOT-CONFIGURED from a failure', async () => {
    // "nobody set up VAPID" and "it broke" are different facts; conflating them
    // is what kept the original gap invisible.
    const r = await announceLive({
      ...liveArgs, supabase: supabaseWith(),
      fetchImpl: fakeFetch({ status: 503, json: { error: 'not-configured', missing: 'vapid' } }),
    });
    expect(r).toMatchObject({ ok: false, reason: 'not-configured', detail: 'vapid' });
  });

  it('reports a roster refusal distinctly', async () => {
    const r = await announceLive({
      ...liveArgs, supabase: supabaseWith(),
      fetchImpl: fakeFetch({ status: 403, json: { error: 'forbidden' } }),
    });
    expect(r.reason).toBe('forbidden');
  });

  it('NEVER THROWS when the network is gone', async () => {
    const r = await announceLive({ ...liveArgs, supabase: supabaseWith(), fetchImpl: fakeFetch('throw') });
    expect(r).toMatchObject({ ok: false, reason: 'unreachable' });
  });

  it('survives a non-JSON reply from a proxy', async () => {
    const r = await announceLive({
      ...liveArgs, supabase: supabaseWith(),
      fetchImpl: fakeFetch({ status: 200, json: 'not-json' }),
    });
    expect(r.ok).toBe(true);
  });

  it('refuses without a session, and posts NOTHING', async () => {
    const f = fakeFetch();
    const r = await announceLive({ ...liveArgs, supabase: supabaseWith(null), fetchImpl: f });
    expect(r).toEqual({ ok: false, reason: 'signed-out' });
    expect(f.calls).toHaveLength(0);
  });

  it('refuses without a church, and posts NOTHING', async () => {
    const f = fakeFetch();
    const r = await announceLive({ instanceId: 'i', supabase: supabaseWith(), fetchImpl: f });
    expect(r.reason).toBe('missing-church');
    expect(f.calls).toHaveLength(0);
  });
});

describe('notifyNewMessage — names the sender, never the message', () => {
  const args = { instanceId: 'inst-1', recipientUserId: 'u2', messageId: 'msg-7', senderName: 'Eldress Redding' };

  it('PRIVACY: the payload contains the sender’s name and no message text', async () => {
    const f = fakeFetch();
    await notifyNewMessage({ ...args, supabase: supabaseWith(), fetchImpl: f });
    const body = f.calls[0].body;
    expect(body.title).toBe('Eldress Redding sent you a message');
    expect(body.body).toBe('Open the app to read it.');
    // Nothing in the whole payload may carry message content.
    expect(JSON.stringify(body)).not.toMatch(/secret|plaintext|ciphertext/i);
  });

  it('targets ONLY the recipient — never the congregation', async () => {
    const f = fakeFetch();
    await notifyNewMessage({ ...args, supabase: supabaseWith(), fetchImpl: f });
    expect(f.calls[0].body.userIds).toEqual(['u2']);
    expect(f.calls[0].body.topic).toBe('message');
  });

  it('keys the dedupe on the message id, so a retry cannot buzz twice', async () => {
    const f = fakeFetch();
    await notifyNewMessage({ ...args, supabase: supabaseWith(), fetchImpl: f });
    expect(f.calls[0].body.messageId).toBe('msg-7');
  });

  it('lands on the messages screen', async () => {
    const f = fakeFetch();
    await notifyNewMessage({ ...args, supabase: supabaseWith(), fetchImpl: f });
    expect(f.calls[0].body.url).toBe(LANDING.message);
  });

  it('NEVER THROWS on any failure path', async () => {
    for (const reply of ['throw', { status: 500, json: { error: 'boom' } }, { status: 503, json: {} }]) {
      const r = await notifyNewMessage({ ...args, supabase: supabaseWith(), fetchImpl: fakeFetch(reply) });
      expect(r.ok).toBe(false);
    }
  });

  it('refuses an incomplete target, and posts NOTHING', async () => {
    const f = fakeFetch();
    expect((await notifyNewMessage({ ...args, messageId: '', supabase: supabaseWith(), fetchImpl: f })).reason).toBe('missing-target');
    expect((await notifyNewMessage({ ...args, recipientUserId: '', supabase: supabaseWith(), fetchImpl: f })).reason).toBe('missing-target');
    expect(f.calls).toHaveLength(0);
  });
});

describe('a sent message survives a broken notifier (the fire-and-forget contract)', () => {
  it('sendDirectMessage still reports sent:true when the push fails', async () => {
    // The property that matters most: a push failure must never turn a
    // delivered message into a failed one.
    vi.resetModules();
    const inserted = { id: 'msg-42' };
    vi.doMock('../lib/supabase.js', () => ({
      default: {
        auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) },
        from: () => ({
          insert: () => ({ select: () => ({ maybeSingle: async () => ({ data: inserted, error: null }) }) }),
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        }),
      },
      supabase: { auth: { getSession: async () => ({ data: {} }) } },
    }));
    vi.doMock('../lib/church-instance.js', () => ({ churchInstanceId: async () => 'inst-1' }));
    vi.doMock('../lib/dm-encryption.js', () => ({
      sharedKeyWith: async () => null, encryptDmBody: async () => null, decryptDmBody: async () => null,
    }));
    const boom = vi.fn(async () => { throw new Error('notifier exploded'); });
    vi.doMock('../lib/push-announce.js', () => ({ notifyNewMessage: boom }));

    const { sendDirectMessage } = await import('../lib/direct-messages-sync.js');
    const out = await sendDirectMessage('u2', 'a real message', 'Me', 'inst-1');

    expect(out, 'a throwing notifier must not break the send').toMatchObject({ sent: true });
    await new Promise((r) => { setTimeout(r, 0); });
    expect(boom, 'the notifier is still attempted').toHaveBeenCalled();
    vi.doUnmock('../lib/supabase.js');
    vi.doUnmock('../lib/push-announce.js');
    vi.resetModules();
  });
});
