// =============================================================================
// games/engine.js — a generic, pure, deterministic turn-based board-game engine
// =============================================================================
// This is the SHARED SPINE for "our games" (the games hub scales to more than
// one game). It knows nothing about any specific game's content: a game is a
// data DEFINITION (paths, board spaces, decks, scoring categories, a legacy
// reducer) that this engine consumes. Keeping the rules here and the content in
// per-game modules (e.g. lib/games/generations.js) is what lets a second and
// third game ride the same tested machinery.
//
// EVERYTHING here is a pure function: (def, state, ...) -> new state. No React,
// no Date.now(), no Math.random() reaching outside — randomness is a seeded LCG
// carried IN the state, so a play-through is fully reproducible and the vitest
// suite can assert exact outcomes (Verification Doctrine, DR-0076: deterministic,
// machine-checkable, no hand-waving).
//
// The game's SHAPE (a `GameDefinition`):
//   {
//     id, title, subtitle,
//     categories: [{ key, label, blurb, weight }],   // the scoring axes
//     paths: [{ id, label, blurb, scripture, opening: [Space,...] }],
//     trunk: [Space, ...],                            // shared life journey
//     decks: { [deckId]: [Card, ...] },
//     legacy(def, state) -> { score, tier, headline, verse, summary, passedOn },
//     startingScores?: { [categoryKey]: number },
//   }
// A `Space` (a board square):
//   { id, type, title, body, stage?, scripture?, effects?, choices?, deck? }
// A `Card` (drawn from a deck) has the same effects/choices/scripture shape.
// An `effects` object maps category keys to integer deltas, e.g. { faith: 2 }.
// A `choice` is { label, body?, scripture?, effects, redemption? }.
// =============================================================================

// ---- seeded RNG (LCG, numeric state carried in the game state) --------------
// Numerical Recipes LCG constants. Returns [value01, nextSeed]; deterministic.
export function nextRandom(seed) {
  const next = (Math.imul(1664525, seed >>> 0) + 1013904223) >>> 0;
  return [next / 0x100000000, next];
}

// A spin of the wheel: an integer in [min, max] (default 1..6), plus the new seed.
export function spinWheel(seed, min = 1, max = 6) {
  const [r, nextSeed] = nextRandom(seed);
  const span = max - min + 1;
  return [min + Math.floor(r * span), nextSeed];
}

// Deterministically pick an index in [0, length) from a seed.
function pickIndex(seed, length) {
  const [r, nextSeed] = nextRandom(seed);
  return [Math.min(length - 1, Math.floor(r * length)), nextSeed];
}

// ---- scoring ----------------------------------------------------------------
export function emptyScores(def) {
  const s = {};
  for (const c of def.categories) s[c.key] = 0;
  return s;
}

// Apply an effects delta map onto a scores object (pure). Unknown keys ignored.
// Scores never fall below 0 — a life is never "in the negative" before Yahweh;
// a hard season lowers a category toward 0, it does not invert it.
export function applyEffects(def, scores, effects) {
  if (!effects) return scores;
  const out = { ...scores };
  for (const c of def.categories) {
    if (typeof effects[c.key] === 'number') {
      out[c.key] = Math.max(0, (out[c.key] || 0) + effects[c.key]);
    }
  }
  return out;
}

// The full ordered board for a chosen path = that path's opening + shared trunk.
export function boardFor(def, pathId) {
  const path = def.paths.find((p) => p.id === pathId);
  if (!path) return [...def.trunk];
  return [...path.opening, ...def.trunk];
}

// Per-category totals + a single weighted legacy-leaning total. The weighted
// total is what the game leans on at the finish: Kingdom axes (faith, family,
// service, souls) carry more weight than provision — the deliberate inversion of
// a worldly score (Matthew 6:33; the whole point of the game).
export function computeTotals(def, state) {
  const byCategory = {};
  let weighted = 0;
  let weightSum = 0;
  for (const c of def.categories) {
    const v = state.scores[c.key] || 0;
    byCategory[c.key] = v;
    const w = typeof c.weight === 'number' ? c.weight : 1;
    weighted += v * w;
    weightSum += w;
  }
  return { byCategory, weighted, weightSum, avg: weightSum ? weighted / weightSum : 0 };
}

// ---- lifecycle --------------------------------------------------------------
// A fresh game, paused at the opening crossroads where the player picks a path.
export function createGame(def, { seed = 1, level = 'child' } = {}) {
  return {
    gameId: def.id,
    status: 'choosing-path',  // -> 'playing' -> 'finished'
    pathId: null,
    position: -1,             // not on the board until a path is chosen
    turn: 0,
    seed: seed >>> 0,
    // Age/difficulty level (young -> old). Pure carry — it never touches scoring;
    // the UI reads it via lib/games/difficulty.js to decide how much to reveal.
    level,
    scores: { ...emptyScores(def), ...(def.startingScores || {}) },
    pending: null,            // a choice/card awaiting the player's decision
    log: [],
    legacy: null,
  };
}

function logEntry(space, extra) {
  return {
    spaceId: space.id,
    type: space.type,
    title: space.title,
    body: space.body || '',
    stage: space.stage || null,
    scripture: space.scripture || null,
    ...extra,
  };
}

// Resolve what LANDING on a board index means, given the current seed: either an
// interaction the player must decide (returns { pending }) or an auto event that
// applies immediately (returns { scores, log }). Cards are drawn here so the draw
// is part of the deterministic seed chain.
function resolveLanding(def, state, board, idx) {
  const space = board[idx];

  // A card space draws from its deck; the drawn card supplies the effects/choices.
  if (space.type === 'card' && space.deck && def.decks[space.deck]?.length) {
    const deck = def.decks[space.deck];
    const [cardIdx, seedAfterDraw] = pickIndex(state.seed, deck.length);
    const card = deck[cardIdx];
    if (Array.isArray(card.choices) && card.choices.length) {
      return {
        seed: seedAfterDraw,
        pending: { kind: 'card', spaceId: space.id, title: card.title, body: card.body || '', scripture: card.scripture || null, choices: card.choices },
      };
    }
    return {
      seed: seedAfterDraw,
      apply: { effects: card.effects, log: logEntry(space, { drewCard: card.title, body: card.body || space.body || '', scripture: card.scripture || space.scripture || null, effects: card.effects || null }) },
    };
  }

  // A space that itself offers a decision (crossroads / invest / obstacle).
  if (Array.isArray(space.choices) && space.choices.length) {
    return {
      seed: state.seed,
      pending: { kind: 'space', spaceId: space.id, title: space.title, body: space.body || '', scripture: space.scripture || null, choices: space.choices },
    };
  }

  // An auto space (word / provision / family / finish): apply its effects now.
  return {
    seed: state.seed,
    apply: { effects: space.effects, log: logEntry(space, { effects: space.effects || null }) },
  };
}

// The player picks a starting path; the game moves onto the board's first space
// and resolves it (so the very first square is live, like Game of Life's start).
export function choosePath(def, state, pathId) {
  if (state.status !== 'choosing-path') return state;
  const path = def.paths.find((p) => p.id === pathId);
  if (!path) return state;
  const board = [...path.opening, ...def.trunk];
  const base = {
    ...state,
    status: 'playing',
    pathId,
    position: 0,
    turn: 1,
    log: [{ spaceId: '__path__', type: 'path', title: `Path chosen: ${path.label}`, body: path.blurb || '', scripture: path.scripture || null }],
  };
  return settleLanding(def, base, board, 0);
}

// Shared "apply the landing or pause for a decision" tail used by choosePath and
// takeTurn. Mutates nothing; returns a new state.
function settleLanding(def, state, board, idx) {
  const landing = resolveLanding(def, state, board, idx);
  const atEnd = idx >= board.length - 1;

  if (landing.pending) {
    return { ...state, seed: landing.seed, position: idx, pending: landing.pending };
  }
  // auto-apply
  const scores = applyEffects(def, state.scores, landing.apply.effects);
  const next = {
    ...state,
    seed: landing.seed,
    position: idx,
    scores,
    pending: null,
    log: [...state.log, landing.apply.log],
  };
  return atEnd ? finishGame(def, next) : next;
}

// Take a turn: spin, advance up to the finish, resolve the landing square. A
// no-op while a decision is pending (the player must decide first) or once the
// game is finished.
export function takeTurn(def, state) {
  if (state.status !== 'playing' || state.pending) return state;
  const board = boardFor(def, state.pathId);
  const [spin, seedAfterSpin] = spinWheel(state.seed);
  const nextPos = Math.min(state.position + spin, board.length - 1);
  const moved = {
    ...state,
    seed: seedAfterSpin,
    turn: state.turn + 1,
    log: [...state.log, { spaceId: '__spin__', type: 'spin', title: `Spin: ${spin}`, body: '' }],
  };
  return settleLanding(def, moved, board, nextPos);
}

// Resolve a pending decision (a crossroads/invest/obstacle space, or a drawn
// card) by the chosen option index. Applies that option's effects, then — if the
// player was sitting on the final square — finishes the game.
export function resolveChoice(def, state, choiceIndex) {
  if (!state.pending) return state;
  const choice = state.pending.choices[choiceIndex];
  if (!choice) return state;
  const board = boardFor(def, state.pathId);
  const scores = applyEffects(def, state.scores, choice.effects);
  const next = {
    ...state,
    scores,
    pending: null,
    log: [...state.log, {
      spaceId: state.pending.spaceId,
      type: state.pending.kind === 'card' ? 'card-choice' : 'choice',
      title: state.pending.title,
      chose: choice.label,
      body: choice.body || '',
      scripture: choice.scripture || state.pending.scripture || null,
      redemption: !!choice.redemption,
      effects: choice.effects || null,
    }],
  };
  return state.position >= board.length - 1 ? finishGame(def, next) : next;
}

// End the journey: hand the final scores to the game's own legacy reducer (the
// finish is measured by faithfulness + what is passed on, not net worth) and
// freeze the result on the state.
export function finishGame(def, state) {
  const legacy = def.legacy ? def.legacy(def, state) : null;
  return { ...state, status: 'finished', pending: null, legacy };
}

// Convenience: where are we on the board (for UI progress)?
export function progress(def, state) {
  if (state.status === 'choosing-path') return { index: 0, total: 1, pct: 0 };
  const board = boardFor(def, state.pathId);
  const total = board.length;
  const index = Math.min(state.position + 1, total);
  return { index, total, pct: total ? Math.round((index / total) * 100) : 0, space: board[state.position] || null };
}
