// =============================================================================
// games/registry.js — the catalog of "our games"
// =============================================================================
// One place the Games hub reads to know which games exist. Adding a second game
// (a new content module that the shared engine in ./engine.js can run) is a
// one-line entry here — the surface, the engine, the persistence and the tests
// are all already general. This is the "modular so it scales" seam.
import { GENERATIONS } from './generations.js';
import { THE_WAY_UP } from './the-way-up.js';

// Each entry is a full GameDefinition (see engine.js) plus light catalog
// metadata the hub uses for the picker. `status` lets a game ship as a labeled
// preview before it is fully built out.
export const GAMES = [
  { ...GENERATIONS, status: 'live' },
  // The Way Up (2026-07-06) — the biblical promotion algorithm: wilderness ->
  // resist the enemy -> Yahweh raises the meek -> soul prospers -> the table set
  // before your enemies (Psalm 23:5; Psalm 110:1). Ships as a labeled preview
  // for Darrell + Bishop's doctrinal review (GOVERNANCE-EXECUTION-ADVISORY).
  { ...THE_WAY_UP, status: 'preview' },
];

export function listGames() {
  return GAMES;
}

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}
