// =============================================================================
// games/match.js — a pure, deterministic MULTIPLAYER reducer over the engine
// =============================================================================
// The single-player spine (./engine.js) runs ONE journey: (def, state) -> state.
// A "match" is a Jackbox-style SHARED-SCREEN session: several players each walk
// their OWN journey on the SAME board, taking turns, while a big screen (a TV or
// the church LED wall) shows every piece, every score and whose turn it is, and
// phones are the controllers.
//
// This file is the AUTHORITY. The board (host) holds exactly one match object and
// is the single writer; phones send action REQUESTS and the host applies them
// here, then re-broadcasts the new snapshot (see ./realtime-room.js). That is how
// there is never a split brain: the rules live in ONE pure place and only the
// host runs them. The transport is dumb; this is where correctness lives.
//
// PURITY (same contract as engine.js, Verification Doctrine / DR-0076): every
// function is (def, match, ...) -> new match. No React, no Date.now(), no
// Math.random() — all randomness flows through the engine's seeded LCG, derived
// per player from the match's host seed, so an entire game night is reproducible
// and the vitest suite can assert exact outcomes. Identifiers, names and the
// wall-clock are passed IN by the caller (the transport), never minted here.
//
// Because every path's opening is the same length (4 spaces) + the shared trunk,
// a player's board INDEX is directly comparable across players — the board view
// can render one track and place each piece at its index. That invariant is
// asserted by the test suite so a future content edit can't silently break it.
// =============================================================================

import {
  createGame,
  choosePath as engineChoosePath,
  takeTurn as engineTakeTurn,
  resolveChoice as engineResolveChoice,
  boardFor,
  computeTotals,
} from './engine.js';

export const MAX_PLAYERS = 8;        // a TV table; readable across a room
export const MIN_PLAYERS = 1;        // a parent + child can play solo-on-the-TV

// The eight tokens a player can claim — a name + a light, high-contrast color
// that reads from across a room, plus the dark `ink` foreground that sits on it
// (every token color is a light pastel, so dark ink is the readable text on it —
// ~12:1, well past WCAG AA). The board/controller read `token.ink` so the dark
// text color travels WITH its light background, never stranded on a dark surface.
// Order is stable so the picker and the board agree.
const INK_ON_TOKEN = '#12100E';
export const TOKENS = [
  { id: 'lion',    label: 'Lion',    color: '#f4b740', ink: INK_ON_TOKEN }, // amber
  { id: 'dove',    label: 'Dove',    color: '#67e8f9', ink: INK_ON_TOKEN }, // cyan
  { id: 'olive',   label: 'Olive',   color: '#86efac', ink: INK_ON_TOKEN }, // green
  { id: 'flame',   label: 'Flame',   color: '#fb923c', ink: INK_ON_TOKEN }, // orange
  { id: 'crown',   label: 'Crown',   color: '#c4b5fd', ink: INK_ON_TOKEN }, // violet
  { id: 'rose',    label: 'Rose',    color: '#fda4af', ink: INK_ON_TOKEN }, // rose
  { id: 'river',   label: 'River',   color: '#7dd3fc', ink: INK_ON_TOKEN }, // sky
  { id: 'wheat',   label: 'Wheat',   color: '#fde68a', ink: INK_ON_TOKEN }, // wheat
];

export function getToken(id) {
  return TOKENS.find((t) => t.id === id) || null;
}

// ---- seed derivation --------------------------------------------------------
// Each player needs their OWN deterministic seed so two players who pick the same
// path don't draw the same cards in lock-step. Derive it from the match's host
// seed and the player's join order via the engine's LCG constants — pure, stable,
// and collision-spread. (Mirrors the engine's Numerical-Recipes LCG step.)
function deriveSeed(hostSeed, joinSeq) {
  let s = (hostSeed >>> 0) ^ (((joinSeq + 1) * 0x9e3779b1) >>> 0);
  s = (Math.imul(1664525, s >>> 0) + 1013904223) >>> 0;
  return s >>> 0;
}

// ---- lifecycle --------------------------------------------------------------
// A fresh match, open in the LOBBY for players to join by QR. `code` is the short
// join code shown on screen; `seed` makes the whole session reproducible; `now`
// is a caller-supplied timestamp (ms) for ordering — never minted here.
export function createMatch(def, { code, seed = 1, maxPlayers = MAX_PLAYERS, now = 0 } = {}) {
  return {
    matchId: `m_${code}`,
    gameId: def.id,
    code: String(code),
    phase: 'lobby',                  // 'lobby' -> 'playing' -> 'finished'
    hostSeed: seed >>> 0,
    maxPlayers: Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, maxPlayers)),
    players: [],                     // see addPlayer for shape
    order: [],                       // playerId[] in turn order (join order)
    turnIndex: 0,                    // index into `order` of whose turn it is
    round: 0,                        // completed full rotations (for the board)
    version: 1,                      // monotonic; bumps on every applied action
    createdAt: now,
    log: [],                         // match-level events (joins, turns passing)
  };
}

function findPlayer(match, playerId) {
  return match.players.find((p) => p.id === playerId) || null;
}

// Add (or re-attach) a player. In the lobby this seats a new player; if a player
// with the same id already exists it is a RE-JOIN (a dropped phone coming back) —
// we keep their game and just mark them connected and refresh name/token. This is
// the graceful drop/rejoin path: identity is the id the phone persists locally.
export function addPlayer(def, match, { id, name, token, now = 0 }) {
  const existing = findPlayer(match, id);
  if (existing) {
    return touch({
      ...match,
      players: match.players.map((p) =>
        p.id === id
          ? { ...p, connected: true, name: name || p.name, token: token || p.token }
          : p,
      ),
      log: [...match.log, { type: 'rejoin', playerId: id, at: now }],
    });
  }
  if (match.phase !== 'lobby') {
    return { ...match, error: 'in-progress' };       // late joiners can't seat mid-game
  }
  if (match.players.length >= match.maxPlayers) {
    return { ...match, error: 'full' };
  }
  const joinSeq = match.players.length;
  const player = {
    id,
    name: (name || `Player ${joinSeq + 1}`).slice(0, 24),
    token: token || TOKENS[joinSeq % TOKENS.length].id,
    connected: true,
    done: false,
    joinSeq,
    game: createGame(def, { seed: deriveSeed(match.hostSeed, joinSeq) }),
  };
  return touch({
    ...match,
    players: [...match.players, player],
    order: [...match.order, id],
    log: [...match.log, { type: 'join', playerId: id, name: player.name, at: now }],
  });
}

// Presence: a phone connected or dropped. Never removes the player (their journey
// is preserved); the turn engine simply skips a disconnected player so one dropped
// phone can't freeze the table, and they resume getting turns when they return.
export function setConnected(match, playerId, connected) {
  if (!findPlayer(match, playerId)) return match;
  return touch({
    ...match,
    players: match.players.map((p) =>
      p.id === playerId ? { ...p, connected: !!connected } : p,
    ),
  });
}

// Host starts the game from the lobby. Needs at least one seated player.
export function startMatch(match) {
  if (match.phase !== 'lobby') return match;
  if (match.players.length < MIN_PLAYERS) return { ...match, error: 'no-players' };
  const firstEligible = nextEligibleFrom(match, 0, /*inclusive*/ true);
  return touch({
    ...match,
    phase: 'playing',
    turnIndex: firstEligible == null ? 0 : firstEligible,
    round: 1,
    log: [...match.log, { type: 'start', players: match.players.length }],
  });
}

// ---- turn engine ------------------------------------------------------------
// Who acts now, and what the controller must show. Pure, derived — the UI reads
// this instead of re-deriving turn logic. Returns null when no one can act
// (lobby, finished, or every remaining player is disconnected — "waiting").
export function currentActor(match) {
  if (match.phase !== 'playing') return null;
  const id = match.order[match.turnIndex];
  const p = findPlayer(match, id);
  if (!p || p.done || !p.connected) return null;
  const g = p.game;
  let need;
  if (g.pending) need = 'decide';
  else if (g.status === 'choosing-path') need = 'choose-path';
  else if (g.status === 'finished') need = 'done';
  else need = 'spin';
  return { playerId: id, player: p, need, pending: g.pending || null };
}

// Index of the next player (after `from`) eligible to act (connected, not done).
// `inclusive` lets startMatch consider `from` itself. Returns null if none.
function nextEligibleFrom(match, from, inclusive = false) {
  const n = match.order.length;
  if (n === 0) return null;
  for (let step = inclusive ? 0 : 1; step <= n; step++) {
    const idx = (from + step) % n;
    const p = findPlayer(match, match.order[idx]);
    if (p && !p.done && p.connected) return idx;
    if (inclusive && step === 0) continue;
  }
  return null;
}

// Advance to the next eligible player. If everyone is done -> finished. If players
// remain but all are disconnected -> stay put ("waiting" — the actor is null and
// the board shows a reconnect prompt); the game resumes when one returns.
function advanceTurn(match) {
  const allDone = match.players.length > 0 && match.players.every((p) => p.done);
  if (allDone) {
    return { ...match, phase: 'finished', log: [...match.log, { type: 'finish-all' }] };
  }
  const next = nextEligibleFrom(match, match.turnIndex, false);
  if (next == null) {
    return match; // waiting for a disconnected player to return; turn stays put
  }
  const wrapped = next <= match.turnIndex;
  return {
    ...match,
    turnIndex: next,
    round: wrapped ? match.round + 1 : match.round,
  };
}

// After an action mutates the acting player's engine state, this settles the
// match: mark them done if their journey finished, then either keep the turn (a
// decision is still pending) or pass to the next player.
function settleAfterMove(def, match, playerId, newGame) {
  const finishedNow = newGame.status === 'finished';
  const players = match.players.map((p) =>
    p.id === playerId ? { ...p, game: newGame, done: finishedNow || p.done } : p,
  );
  const mid = { ...match, players };
  // A pending decision keeps the turn with the same player (they must decide).
  if (newGame.pending) return mid;
  return advanceTurn(mid);
}

// Guard: only the player whose turn it is may move. Returns the acting player or
// an { error } sentinel the dispatcher passes straight back. This single gate is
// what stops a phone from acting out of turn (no split actions).
function actingPlayer(match, playerId) {
  if (match.phase !== 'playing') return { error: 'not-playing' };
  const actor = currentActor(match);
  if (!actor) return { error: 'no-actor' };
  if (actor.playerId !== playerId) return { error: 'not-your-turn' };
  return { player: actor.player };
}

// Player picks their starting road (their first turn). Engine settles the opening
// square; if that square needs a decision the turn stays, else it passes.
export function choosePathAction(def, match, playerId, pathId) {
  const a = actingPlayer(match, playerId);
  if (a.error) return match;
  if (a.player.game.status !== 'choosing-path') return match;
  const newGame = engineChoosePath(def, a.player.game, pathId);
  if (newGame === a.player.game) return match; // invalid path id — no-op
  return touch(settleAfterMove(def, match, playerId, newGame));
}

// Player spins the wheel and advances along the board.
export function spinAction(def, match, playerId) {
  const a = actingPlayer(match, playerId);
  if (a.error) return match;
  const g = a.player.game;
  if (g.status !== 'playing' || g.pending) return match;
  const newGame = engineTakeTurn(def, g);
  return touch(settleAfterMove(def, match, playerId, newGame));
}

// Player resolves the crossroads / card decision in front of them.
export function decideAction(def, match, playerId, choiceIndex) {
  const a = actingPlayer(match, playerId);
  if (a.error) return match;
  const g = a.player.game;
  if (!g.pending) return match;
  const newGame = engineResolveChoice(def, g, choiceIndex);
  return touch(settleAfterMove(def, match, playerId, newGame));
}

// Host-only: skip the current player (e.g. a phone that dropped and won't return).
// Marks them done so the table is never frozen by one absent player.
export function skipCurrent(def, match) {
  if (match.phase !== 'playing') return match;
  const id = match.order[match.turnIndex];
  const p = findPlayer(match, id);
  if (!p) return match;
  const players = match.players.map((x) => (x.id === id ? { ...x, done: true } : x));
  return touch(advanceTurn({ ...match, players, log: [...match.log, { type: 'skip', playerId: id }] }));
}

// Host-only: play again with the same table (same players, fresh journeys, a new
// derived seed so it isn't a replay). Returns to the lobby's opposite — straight
// into a new game keeping everyone seated.
export function playAgain(def, match, { seed } = {}) {
  const nextSeed = (typeof seed === 'number' ? seed : match.hostSeed + match.version) >>> 0;
  const players = match.players.map((p, i) => ({
    ...p,
    done: false,
    game: createGame(def, { seed: deriveSeed(nextSeed, i) }),
  }));
  return touch({
    ...match,
    hostSeed: nextSeed,
    phase: 'playing',
    players,
    turnIndex: nextEligibleFrom({ ...match, players }, 0, true) ?? 0,
    round: 1,
    log: [...match.log, { type: 'play-again' }],
  });
}

// ---- central dispatcher -----------------------------------------------------
// The host feeds EVERY incoming action through this one door, so validation and
// versioning live in exactly one place. Unknown/illegal actions return the match
// unchanged (no throw — a malformed phone message must never crash the table).
export function applyAction(def, match, action) {
  if (!action || typeof action !== 'object') return match;
  switch (action.type) {
    case 'join':        return addPlayer(def, match, action);
    case 'connect':     return setConnected(match, action.playerId, true);
    case 'disconnect':  return setConnected(match, action.playerId, false);
    case 'start':       return startMatch(match);
    case 'choose-path': return choosePathAction(def, match, action.playerId, action.pathId);
    case 'spin':        return spinAction(def, match, action.playerId);
    case 'decide':      return decideAction(def, match, action.playerId, action.choiceIndex);
    case 'skip':        return skipCurrent(def, match);
    case 'play-again':  return playAgain(def, match, action);
    default:            return match;
  }
}

// Bump the monotonic version on every applied change. Snapshot consumers (phones)
// keep the HIGHEST version they've seen and ignore anything older, so an out-of-
// order or duplicated broadcast can never roll the board backwards.
function touch(match) {
  if (match.error) return match; // surfaced rejections don't bump the version
  return { ...match, version: (match.version || 0) + 1 };
}

// ---- derived views (read-only helpers the UI leans on) ----------------------
// Standings: every player ranked by the engine's weighted, Kingdom-tilted total
// (faith/family/souls over provision). Used for the live board scoreboard and the
// finish screen — same measure single-player uses, so the lens is consistent.
export function standings(def, match) {
  return match.players
    .map((p) => {
      const totals = computeTotals(def, p.game);
      return {
        id: p.id,
        name: p.name,
        token: p.token,
        connected: p.connected,
        done: p.done,
        position: p.game.position,
        status: p.game.status,
        scores: p.game.scores,
        weighted: totals.weighted,
        legacy: p.game.legacy || null,
      };
    })
    .sort((a, b) => b.weighted - a.weighted);
}

// The shared board length (constant across paths — the invariant the board view
// relies on to place pieces at comparable indices). Pass any path id; opening
// length is identical, so any path yields the same total.
export function boardLength(def) {
  const anyPath = def.paths[0]?.id;
  return boardFor(def, anyPath).length;
}
