// =============================================================================
// follow-along-sync — the congregation follows the LIVE slide on their OWN devices
// =============================================================================
// Darrell 2026-07-19, from the Love Corner staging: "his cellphone or laptop or
// tablet is using PoeTech and we all can follow him or her." The two-screen present
// mode (Presenter -> AudienceWindow) syncs over a same-BROWSER BroadcastChannel — it
// cannot reach a phone in a pew. This module adds the missing multi-device link: the
// presenter broadcasts the current audience slide over a Supabase Realtime channel,
// and every congregant who opens the follow view (a short code / ?follow=CODE link)
// renders that same clean slide live, on their own device.
//
// WHY BROADCAST, NOT A TABLE (design): the live slide is EPHEMERAL presentation
// state, not data to persist — so this rides Supabase Realtime *broadcast* (no DB
// table, no migration, no RLS surface). The only content that crosses the wire is the
// already-public teaching slide the room can see on the wall; no PII, no writes, no
// money. Late joiners catch up via a `hello` handshake: on join a follower pings, and
// the presenter re-sends the current slide (mirrors the AudienceWindow {type:'ready'}
// handshake). Fail-soft throughout — any client error degrades to "waiting for the
// presenter," never a throw into the render (mirrors tv-time-sync.js).
//
// THE GATE (COLG-facing surface): a single flag mounts the "Go live" control + the
// follow view. Ephemeral + no-persistence keeps this out of the data-isolation risk
// class, but the flag stays as the kill-switch (three-brakes spirit / RELEASE-TIERS).
//
// PURE helpers (code shape, channel name, share link, the follower state reducer) are
// node-tested; the I/O takes an injectable `client` so the publish/subscribe wiring is
// tested against a fake channel, not the network.
//
// NO TOP-LEVEL supabase import (on purpose): the Presenter imports this module, and
// the Presenter is in turn imported by node-environment tests (via ChurchLearn) that
// must never pull the browser supabase client (it touches window.localStorage). So the
// real client is LAZY-loaded only on the browser I/O path; an injected client (tests)
// wires up synchronously and never triggers the import.
// =============================================================================

// Single kill-switch. true = the presenter's "Go live for the congregation" toggle
// and the ?follow=CODE view both mount.
export const FOLLOW_ALONG_ENABLED = true;

// The broadcast event name carried on the channel (one channel per session code).
const EVENT = 'poe-follow';
const HELLO = 'poe-follow-hello';

// --- Pure -------------------------------------------------------------------

// A short, human-shareable session code (no ambiguous chars) — the presenter shows
// it; a congregant types it or opens the ?follow= link. rng injectable for tests.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/O/0/1/L
export function makeFollowCode(len = 5, rng = Math.random) {
  let out = '';
  for (let i = 0; i < len; i += 1) out += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  return out;
}

// Normalize whatever a person typed/pasted into the canonical code (upper, A-Z0-9).
export function normalizeFollowCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

// The Realtime channel name for a session code (null for an empty/invalid code, so
// callers never open a garbage channel).
export function followChannelName(code) {
  const c = normalizeFollowCode(code);
  return c ? `poe-follow-${c}` : null;
}

// The shareable follow link for a code. `origin` overridable for tests / SSR.
export function followLink(code, origin) {
  const c = normalizeFollowCode(code);
  if (!c) return null;
  const base = origin
    || (typeof window !== 'undefined' && window.location
      ? `${window.location.origin}${window.location.pathname}`
      : '');
  return `${base}?follow=${c}`;
}

// The follower state machine, as a pure reducer (proven-to-catch tested). A follower
// is `connecting` until subscribed, `live` once a slide (or a hold) arrives, and
// `ended` when the presenter stops — never renders stale content past an end.
export const FOLLOW_INIT = Object.freeze({ status: 'connecting', slide: null });
export function applyFollowEvent(state = FOLLOW_INIT, event = {}) {
  switch (event && event.type) {
    case 'status': return { ...state, status: event.status || state.status };
    case 'slide': return { status: 'live', slide: event.slide || null };
    case 'hold': return { status: 'live', slide: null };
    case 'end': return { status: 'ended', slide: null };
    default: return state;
  }
}

// --- I/O: fail-soft, client injectable (mirrors tv-time-sync) ---------------

// Wire a channel from whatever client is available. An injected client (tests) runs
// this synchronously; the app has no client, so it lazy-loads the real one and wires
// up a tick later — never touching supabase at module-eval time.
function withClient(opts, wire) {
  if (opts && opts.client) { wire(opts.client); return; }
  import('./supabase.js').then((m) => { if (m && m.supabase) wire(m.supabase); }).catch(() => { /* offline / no realtime */ });
}

// PRESENTER side: open the session channel and push the current slide to followers.
// Returns a controller; every method is a no-op-safe wrapper (never throws). Slides
// published before the (lazy) client is ready are buffered in `last` and flushed on
// wire-up — the same buffer that catches late joiners up on their `hello`.
export function createFollowBroadcaster(code, opts = {}) {
  const name = followChannelName(code);
  let channel = null;
  let client = null;
  let last = null; // the current slide, re-sent to late joiners on their `hello`
  function send(kind, slide) {
    if (!channel) return false;
    try { channel.send({ type: 'broadcast', event: EVENT, payload: { kind, slide: slide || null } }); return true; } catch { return false; }
  }
  if (name) {
    withClient(opts, (c) => {
      try {
        client = c;
        channel = c.channel(name, { config: { broadcast: { self: false } } });
        // a joining follower pings HELLO -> resend the current slide so it catches up.
        channel.on('broadcast', { event: HELLO }, () => { if (last) send('slide', last); });
        channel.subscribe();
        if (last) send('slide', last); // flush a slide published before the client was ready
      } catch { channel = null; }
    });
  }
  return {
    code: normalizeFollowCode(code),
    channelName: name,
    publish(slide) { last = slide || null; return send('slide', last); },
    hold() { last = null; return send('hold', null); },
    end() { send('end', null); },
    close() { try { if (channel && client) client.removeChannel(channel); } catch { /* already closed */ } channel = null; },
  };
}

// FOLLOWER side: subscribe by code and receive live slides. handlers:
//   { onSlide(slide), onHold(), onEnd(), onStatus(status) }. Returns unsubscribe().
export function subscribeFollow(code, handlers = {}, opts = {}) {
  const name = followChannelName(code);
  let channel = null;
  let client = null;
  let cancelled = false;
  if (name) {
    withClient(opts, (c) => {
      if (cancelled) return;
      try {
        client = c;
        channel = c.channel(name, { config: { broadcast: { self: false } } });
        channel.on('broadcast', { event: EVENT }, (msg) => {
          if (cancelled) return;
          const p = (msg && msg.payload) || {};
          if (p.kind === 'slide') handlers.onSlide && handlers.onSlide(p.slide || null);
          else if (p.kind === 'hold') handlers.onHold && handlers.onHold();
          else if (p.kind === 'end') handlers.onEnd && handlers.onEnd();
        });
        channel.subscribe((status) => {
          if (cancelled) return;
          handlers.onStatus && handlers.onStatus(status);
          // On join, ping HELLO so the presenter re-sends the current slide.
          if (status === 'SUBSCRIBED') { try { channel.send({ type: 'broadcast', event: HELLO, payload: {} }); } catch { /* non-fatal */ } }
        });
      } catch { channel = null; }
    });
  }
  return function unsubscribe() {
    cancelled = true;
    try { if (channel && client) client.removeChannel(channel); } catch { /* already closed */ }
    channel = null;
  };
}
