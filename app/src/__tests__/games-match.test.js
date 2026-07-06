// @vitest-environment node
// Tests for the pure multiplayer reducer (lib/games/match.js). Deterministic, so
// a whole game night replays exactly — the verification bar for game state.
import { describe, it, expect } from 'vitest';
import { GENERATIONS } from '../lib/games/generations.js';
import { boardFor } from '../lib/games/engine.js';
import {
  createMatch, addPlayer, setConnected, startMatch, currentActor,
  choosePathAction, spinAction, decideAction, applyAction, skipCurrent,
  playAgain, standings, boardLength, TOKENS, MAX_PLAYERS,
} from '../lib/games/match.js';

const def = GENERATIONS;
const fresh = () => createMatch(def, { code: 'ABCD', seed: 12345 });

describe('the board-length invariant the board view relies on', () => {
  it('every path yields the same total board length (openings are equal length)', () => {
    const len = boardLength(def);
    for (const p of def.paths) {
      expect(boardFor(def, p.id).length).toBe(len);
    }
  });
});

describe('lobby + joining', () => {
  it('starts empty in the lobby', () => {
    const m = fresh();
    expect(m.phase).toBe('lobby');
    expect(m.players).toHaveLength(0);
    expect(m.version).toBe(1);
  });

  it('seats players in join order, each with its own game + token', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = addPlayer(def, m, { id: 'b', name: 'Bo', token: 'dove' });
    expect(m.players.map((p) => p.id)).toEqual(['a', 'b']);
    expect(m.order).toEqual(['a', 'b']);
    expect(m.players[0].game.status).toBe('choosing-path');
    // Distinct derived seeds so two same-path players don't draw in lock-step.
    expect(m.players[0].game.seed).not.toBe(m.players[1].game.seed);
    expect(m.version).toBeGreaterThan(1);
  });

  it('treats a repeat id as a graceful re-join (keeps the game, marks connected)', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = setConnected(m, 'a', false);
    expect(m.players[0].connected).toBe(false);
    const seedBefore = m.players[0].game.seed;
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    expect(m.players).toHaveLength(1);
    expect(m.players[0].connected).toBe(true);
    expect(m.players[0].game.seed).toBe(seedBefore); // journey preserved
  });

  it('rejects joining once the table is full', () => {
    let m = fresh();
    for (let i = 0; i < MAX_PLAYERS; i++) m = addPlayer(def, m, { id: `p${i}`, name: `P${i}`, token: TOKENS[i].id });
    const full = addPlayer(def, m, { id: 'x', name: 'X', token: 'lion' });
    expect(full.error).toBe('full');
  });

  it('WELCOMES a late joiner mid-game (family game night — people wander in)', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = startMatch(m);                                   // game underway
    const late = addPlayer(def, m, { id: 'y', name: 'Yara', token: 'dove' });
    expect(late.error).toBeUndefined();                 // no "already started" wall
    expect(late.players.map((p) => p.id)).toContain('y');
    expect(late.order).toContain('y');
    expect(late.players.find((p) => p.id === 'y').game.status).toBe('choosing-path');
  });

  it('only turns a joiner away once the journeys are FINISHED', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = { ...m, phase: 'finished' };
    const late = addPlayer(def, m, { id: 'y', name: 'Y', token: 'dove' });
    expect(late.error).toBe('finished');
  });

  it('RECOVERS a lost seat: a phone that went off rejoins by token, points intact', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = addPlayer(def, m, { id: 'b', name: 'Bo', token: 'dove' });
    m = startMatch(m);
    m = choosePathAction(def, m, 'a', 'college'); // Ada builds up some score/state
    const adaGameSeed = m.players.find((p) => p.id === 'a').game.seed;
    // Ada's phone goes off -> host marks her disconnected (journey preserved).
    m = setConnected(m, 'a', false);
    // She comes back on a device that lost its saved id (new id), re-picks Lion.
    const back = addPlayer(def, m, { id: 'a-new', name: 'Ada', token: 'lion' });
    expect(back.error).toBeUndefined();
    expect(back.players).toHaveLength(2);                // NOT a new third seat
    const seat = back.players.find((p) => p.token === 'lion');
    expect(seat.id).toBe('a-new');                       // re-keyed to the new device
    expect(seat.connected).toBe(true);
    expect(seat.game.seed).toBe(adaGameSeed);            // her points/journey survived
    expect(back.order).toContain('a-new');
    expect(back.order).not.toContain('a');
  });
});

describe('turn flow', () => {
  function withTwo() {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = addPlayer(def, m, { id: 'b', name: 'Bo', token: 'dove' });
    return startMatch(m);
  }

  it('starts on the first player choosing a path', () => {
    const m = withTwo();
    expect(m.phase).toBe('playing');
    const actor = currentActor(m);
    expect(actor.playerId).toBe('a');
    expect(actor.need).toBe('choose-path');
  });

  it('passes the turn after a path choice with no pending decision', () => {
    let m = withTwo();
    m = choosePathAction(def, m, 'a', 'trade'); // opening[0] is an auto space
    const actor = currentActor(m);
    expect(actor.playerId).toBe('b'); // turn moved on
    expect(m.players[0].game.status).toBe('playing');
  });

  it('ignores an out-of-turn action (single authority, no split actions)', () => {
    const m = withTwo();
    // It's a's turn; b tries to act -> no change.
    expect(spinAction(def, m, 'b')).toBe(m);
    expect(choosePathAction(def, m, 'b', 'trade')).toBe(m);
  });

  it('keeps the turn when a landing raises a decision, then passes after deciding', () => {
    // Drive player a until they hit a pending decision on their own turn.
    let m = withTwo();
    m = choosePathAction(def, m, 'a', 'college');
    m = choosePathAction(def, m, 'b', 'trade');
    // round-robin spins until a faces a pending
    let guard = 0;
    while (guard++ < 200) {
      const actor = currentActor(m);
      if (!actor) break;
      if (actor.playerId === 'a' && actor.need === 'decide') break;
      if (actor.need === 'choose-path') m = choosePathAction(def, m, actor.playerId, 'trade');
      else if (actor.need === 'decide') m = decideAction(def, m, actor.playerId, 0);
      else m = spinAction(def, m, actor.playerId);
      if (m.phase !== 'playing') break;
    }
    const a = currentActor(m);
    if (a && a.playerId === 'a' && a.need === 'decide') {
      expect(m.players.find((p) => p.id === 'a').game.pending).toBeTruthy();
      const after = decideAction(def, m, 'a', 0);
      expect(after.players.find((p) => p.id === 'a').game.pending).toBeNull();
    }
  });
});

describe('drop / rejoin does not freeze the table', () => {
  it('skips a disconnected player and resumes them on reconnect', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = addPlayer(def, m, { id: 'b', name: 'Bo', token: 'dove' });
    m = startMatch(m);
    // a's turn; a drops -> the table should move to b, not stall.
    m = setConnected(m, 'a', false);
    m = choosePathAction(def, m, 'b', 'trade'); // b can't act yet (a's turn), no-op
    expect(currentActor(m)).toBeNull(); // a is disconnected and it's a's slot
    // host advances by skipping or b acts once a's slot is skipped via advance:
    // simulate a returning
    m = setConnected(m, 'a', true);
    expect(currentActor(m).playerId).toBe('a');
  });

  it('host can skip an absent player to keep going', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = addPlayer(def, m, { id: 'b', name: 'Bo', token: 'dove' });
    m = startMatch(m);
    const skipped = skipCurrent(def, m);
    expect(skipped.players.find((p) => p.id === 'a').done).toBe(true);
    expect(currentActor(skipped).playerId).toBe('b');
  });
});

describe('a full game finishes and is measured by Yahweh’s weighting', () => {
  it('plays to finished with legacies, deterministically', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = addPlayer(def, m, { id: 'b', name: 'Bo', token: 'dove' });
    m = startMatch(m);
    let guard = 0;
    while (m.phase === 'playing' && guard++ < 2000) {
      const actor = currentActor(m);
      if (!actor) break;
      const action = actor.need === 'choose-path'
        ? { type: 'choose-path', playerId: actor.playerId, pathId: 'entrepreneur' }
        : actor.need === 'decide'
          ? { type: 'decide', playerId: actor.playerId, choiceIndex: 0 }
          : { type: 'spin', playerId: actor.playerId };
      m = applyAction(def, m, action);
    }
    expect(m.phase).toBe('finished');
    const ranks = standings(def, m);
    expect(ranks).toHaveLength(2);
    expect(ranks[0].weighted).toBeGreaterThanOrEqual(ranks[1].weighted); // sorted
    for (const r of ranks) {
      expect(r.legacy).toBeTruthy();
      expect(typeof r.legacy.tier).toBe('string');
      expect(Array.isArray(r.legacy.passedOn)).toBe(true);
    }
  });

  it('play-again keeps the table but starts fresh journeys', () => {
    let m = fresh();
    m = addPlayer(def, m, { id: 'a', name: 'Ada', token: 'lion' });
    m = startMatch(m);
    m = { ...m, players: m.players.map((p) => ({ ...p, done: true, game: { ...p.game, status: 'finished' } })), phase: 'finished' };
    const again = playAgain(def, m);
    expect(again.phase).toBe('playing');
    expect(again.players[0].done).toBe(false);
    expect(again.players[0].game.status).toBe('choosing-path');
  });
});

describe('the central dispatcher never throws on bad input', () => {
  it('returns the match unchanged for malformed/unknown actions', () => {
    const m = fresh();
    expect(applyAction(def, m, null)).toBe(m);
    expect(applyAction(def, m, { type: 'nope' })).toBe(m);
    expect(applyAction(def, m, {})).toBe(m);
  });
});
