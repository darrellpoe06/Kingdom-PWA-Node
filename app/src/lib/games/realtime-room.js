// =============================================================================
// games/realtime-room.js — the live wire between the big screen and the phones
// =============================================================================
// Jackbox-style sync with ONE authority and no split brain:
//
//   • The BIG SCREEN (board) is the HOST. It holds the one authoritative match
//     object (the pure reducer in ./match.js runs ONLY here) and BROADCASTS the
//     full snapshot after every change.
//   • Each PHONE is a GUEST. It never runs the rules; it renders the latest
//     snapshot it has seen and sends ACTION REQUESTS ("I spun", "I chose road 2").
//
// Transport is Supabase Realtime — BROADCAST for messages + PRESENCE for who is
// connected. Deliberately NO database table and NO migration: a game-night room
// is ephemeral, so the live channel IS the store. (Durability across a board
// refresh is intentionally out of MVP scope; the board re-derives a room from its
// own ?room=CODE URL, and phones re-request a snapshot on (re)connect.)
//
// Reconnect/drop safety (feedback-unbreakable-by-any-human-hardening):
//   • A phone that (re)joins fires a presence join -> the host re-broadcasts the
//     current snapshot, so a late or returning player is caught up immediately.
//   • Guests also actively request a snapshot on subscribe and on any gap.
//   • Presence leave/join drives connected flags so one dropped phone never
//     freezes the table (the reducer skips disconnected players' turns).
//   • Snapshots carry a monotonic `version`; guests ignore anything older, so a
//     duplicated or out-of-order broadcast can't roll the board backwards.
// =============================================================================

import { supabase } from '../supabase.js';

const channelName = (code) => `gameroom-${String(code).toUpperCase()}`;

const EV_STATE = 'state';            // host -> guests: a full match snapshot
const EV_ACTION = 'action';          // guest -> host: an action request
const EV_SNAPSHOT_REQ = 'snapshot?'; // guest -> host: please re-send the snapshot

// ---- HOST (the big screen) --------------------------------------------------
// onAction(action)        — an action request arrived from a phone
// onPresence(idsPresent)  — the set of player ids currently connected (string[])
// Returns a handle the board view drives.
export function hostRoom(code, { onAction, onPresence } = {}) {
  let closed = false;
  const channel = supabase.channel(channelName(code), {
    config: { broadcast: { self: false }, presence: { key: 'board' } },
  });

  const presentPlayerIds = () => {
    const state = channel.presenceState();
    const ids = new Set();
    for (const key of Object.keys(state)) {
      for (const meta of state[key]) {
        if (meta && meta.role === 'player' && meta.playerId) ids.add(meta.playerId);
      }
    }
    return [...ids];
  };

  channel
    .on('broadcast', { event: EV_ACTION }, ({ payload }) => {
      if (!closed && onAction) onAction(payload);
    })
    .on('broadcast', { event: EV_SNAPSHOT_REQ }, () => {
      if (!closed) handle.onSnapshotRequested();
    })
    .on('presence', { event: 'sync' }, () => {
      if (!closed && onPresence) onPresence(presentPlayerIds());
    })
    .on('presence', { event: 'join' }, () => {
      // A phone (re)joined — push the latest snapshot so it catches up at once,
      // and refresh the connected set.
      if (closed) return;
      handle.onSnapshotRequested();
      if (onPresence) onPresence(presentPlayerIds());
    })
    .on('presence', { event: 'leave' }, () => {
      if (!closed && onPresence) onPresence(presentPlayerIds());
    });

  const handle = {
    channel,
    // Overwritten by the board view so a snapshot request can re-broadcast the
    // CURRENT match (the host owns the state, not the transport).
    onSnapshotRequested: () => {},
    broadcastState(match) {
      if (closed) return;
      channel.send({ type: 'broadcast', event: EV_STATE, payload: match });
    },
    presentPlayerIds,
    close() {
      closed = true;
      supabase.removeChannel(channel);
    },
  };

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') channel.track({ role: 'board' });
  });

  return handle;
}

// ---- GUEST (a phone) --------------------------------------------------------
// onState(match)   — a fresh authoritative snapshot to render
// onStatus(status) — channel status changes ('SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT')
// Returns a handle the controller drives.
export function joinRoom(code, { playerId, name, onState, onStatus } = {}) {
  let closed = false;
  let lastVersion = -1;
  const channel = supabase.channel(channelName(code), {
    config: { broadcast: { self: false }, presence: { key: playerId } },
  });

  channel
    .on('broadcast', { event: EV_STATE }, ({ payload }) => {
      if (closed || !payload) return;
      const v = payload.version || 0;
      if (v < lastVersion) return;      // ignore stale/out-of-order snapshots
      lastVersion = v;
      if (onState) onState(payload);
    });

  const requestSnapshot = () => {
    if (!closed) channel.send({ type: 'broadcast', event: EV_SNAPSHOT_REQ, payload: { playerId } });
  };

  const handle = {
    channel,
    sendAction(action) {
      if (closed) return;
      channel.send({ type: 'broadcast', event: EV_ACTION, payload: action });
    },
    requestSnapshot,
    close() {
      closed = true;
      supabase.removeChannel(channel);
    },
  };

  channel.subscribe((status) => {
    if (onStatus) onStatus(status);
    if (status === 'SUBSCRIBED') {
      // Announce presence (so the host marks us connected and re-broadcasts) and
      // pull the current snapshot in case we joined mid-game.
      channel.track({ role: 'player', playerId, name: name || null });
      requestSnapshot();
    }
  });

  return handle;
}
