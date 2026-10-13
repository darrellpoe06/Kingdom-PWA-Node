// follow-along-sync — proven-to-catch tests for the congregation follow-along link.
// The pure helpers (code/channel/link/reducer) are asserted directly; the publish ->
// receive wiring is tested through an in-memory fake channel BUS that routes broadcasts
// between same-named channels exactly like Supabase Realtime (self:false honored), so
// the presenter->follower path and the late-joiner `hello` replay are really exercised,
// not mocked away.
import { describe, it, expect } from 'vitest';
import {
  FOLLOW_ALONG_ENABLED, makeFollowCode, normalizeFollowCode, followChannelName, followLink,
  FOLLOW_INIT, applyFollowEvent, createFollowBroadcaster, subscribeFollow,
} from '../lib/follow-along-sync.js';

// --- an in-memory Supabase-Realtime-shaped fake ------------------------------
function makeFakeClient() {
  const bus = new Map(); // channelName -> Set<fakeChannel>
  function channel(name, cfg = {}) {
    const self = !!(cfg.config && cfg.config.broadcast && cfg.config.broadcast.self);
    const handlers = []; // { event, cb }
    const ch = {
      name,
      on(type, filter, cb) { handlers.push({ event: filter.event, cb }); return ch; },
      subscribe(cb) {
        if (!bus.has(name)) bus.set(name, new Set());
        bus.get(name).add(ch);
        if (cb) cb('SUBSCRIBED');
        return ch;
      },
      send(msg) {
        const peers = bus.get(name) || new Set();
        for (const peer of peers) {
          if (peer === ch && !self) continue; // self:false -> don't loop back
          peer._deliver(msg.event, { payload: msg.payload });
        }
        return Promise.resolve('ok');
      },
      _deliver(event, arg) { handlers.filter((h) => h.event === event).forEach((h) => h.cb(arg)); },
    };
    return ch;
  }
  function removeChannel(ch) { const s = bus.get(ch.name); if (s) s.delete(ch); }
  return { channel, removeChannel };
}

describe('follow-along pure helpers', () => {
  it('is gated by a single flag', () => {
    expect(typeof FOLLOW_ALONG_ENABLED).toBe('boolean');
  });
  it('makeFollowCode is the right length and uses no ambiguous chars', () => {
    let seed = 0.01;
    const rng = () => { seed = (seed + 0.137) % 1; return seed; };
    const code = makeFollowCode(5, rng);
    expect(code).toHaveLength(5);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/); // no I/O/0/1/L
  });
  it('normalizeFollowCode uppercases, strips junk, caps length', () => {
    expect(normalizeFollowCode(' ab-3 x!')).toBe('AB3X');
    expect(normalizeFollowCode('abcdefghij')).toHaveLength(8);
    expect(normalizeFollowCode(null)).toBe('');
  });
  it('followChannelName is null for empty and prefixed for a real code', () => {
    expect(followChannelName('')).toBeNull();
    expect(followChannelName('a b')).toBe('poe-follow-AB');
  });
  it('followLink builds a ?follow= link (origin overridable) and null on empty', () => {
    expect(followLink('ab3', 'https://poetech.us/app')).toBe('https://poetech.us/app?follow=AB3');
    expect(followLink('')).toBeNull();
  });
});

describe('applyFollowEvent — the follower state machine', () => {
  it('goes connecting -> live(slide), hold clears the slide, end -> ended', () => {
    let s = FOLLOW_INIT;
    expect(s).toEqual({ status: 'connecting', slide: null });
    s = applyFollowEvent(s, { type: 'status', status: 'live' });
    expect(s.status).toBe('live');
    s = applyFollowEvent(s, { type: 'slide', slide: { title: 'A' } });
    expect(s).toEqual({ status: 'live', slide: { title: 'A' } });
    s = applyFollowEvent(s, { type: 'hold' });
    expect(s).toEqual({ status: 'live', slide: null });
    s = applyFollowEvent(s, { type: 'end' });
    expect(s).toEqual({ status: 'ended', slide: null });
    // unknown event is a no-op
    expect(applyFollowEvent(s, { type: 'nope' })).toEqual(s);
  });
});

describe('publish -> receive over the (fake) realtime bus', () => {
  it('a follower receives the slide the presenter publishes, and a hold', () => {
    const client = makeFakeClient();
    const got = [];
    const holds = [];
    subscribeFollow('LOVE1', { onSlide: (s) => got.push(s), onHold: () => holds.push(1) }, { client });
    const b = createFollowBroadcaster('LOVE1', { client });
    b.publish({ title: 'The big idea', points: ['a', 'b'] });
    expect(got).toEqual([{ title: 'The big idea', points: ['a', 'b'] }]);
    b.hold();
    expect(holds).toHaveLength(1);
  });

  it('a LATE joiner catches up: on subscribe its hello makes the presenter re-send the current slide', () => {
    const client = makeFakeClient();
    const b = createFollowBroadcaster('LOVE2', { client });
    b.publish({ title: 'Already on slide 3' }); // presenter advanced BEFORE anyone joined
    const got = [];
    // now a congregant joins -> the SUBSCRIBED hello should trigger a re-send
    subscribeFollow('LOVE2', { onSlide: (s) => got.push(s) }, { client });
    expect(got).toEqual([{ title: 'Already on slide 3' }]);
  });

  it('end() tells followers the session ended; unsubscribe stops delivery', () => {
    const client = makeFakeClient();
    const events = [];
    const unsub = subscribeFollow('LOVE3', {
      onSlide: () => events.push('slide'), onEnd: () => events.push('end'),
    }, { client });
    const b = createFollowBroadcaster('LOVE3', { client });
    b.publish({ title: 'x' });
    b.end();
    expect(events).toEqual(['slide', 'end']);
    unsub();
    b.publish({ title: 'after unsub' }); // no longer delivered
    expect(events).toEqual(['slide', 'end']);
  });

  it('never throws when the client is broken (fail-soft)', () => {
    const broken = { channel() { throw new Error('no realtime'); }, removeChannel() {} };
    expect(() => {
      const b = createFollowBroadcaster('X', { client: broken });
      b.publish({ title: 'y' });
      b.close();
      const unsub = subscribeFollow('X', { onSlide: () => {} }, { client: broken });
      unsub();
    }).not.toThrow();
  });
});
