// =============================================================================
// games/GameRoom.jsx — the standalone "Game Night" boot (board OR phone)
// =============================================================================
// Booted from main.jsx on ?room=CODE (see the entry's standalone branches). It is
// deliberately LIGHTWEIGHT — a TV browser and a phone load this, not the full PWA
// shell or its auth/monolith chunks. One URL serves both roles so the QR on the
// board and the link a phone opens never diverge:
//   • ?room=CODE&board=1  -> the big screen (host + board)        -> GameBoardScreen
//   • ?room=CODE          -> a player's controller (the phone)    -> GamePlayerController
//
// The shared journey content is the live "Generations: Walking in the Way" game
// from the registry; multiplayer is a MODULE wrapped around the same pure engine,
// so nothing is added to the frozen monolith.
// =============================================================================
import React from 'react';
import { parseRoomParams, codeFromSeed } from '../../lib/games/room-code.js';
import { getGame } from '../../lib/games/registry.js';
import GameBoardScreen from './GameBoardScreen.jsx';
import GamePlayerController from './GamePlayerController.jsx';

// Default to the one live game; ?game=ID could pick another later.
function gameFor(search) {
  const id = new URLSearchParams(search || '').get('game') || 'generations';
  return getGame(id) || getGame('generations');
}

export default function GameRoom() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  let { code, isBoard } = parseRoomParams(search);
  const def = gameFor(search);

  // A board opened with no code mints one (clock-salted) and pins it to the URL,
  // so a reload lands back in the same room and the link is shareable.
  if (isBoard && !code) {
    const seed = (Date.now() ^ (Date.now() << 7)) >>> 0;
    code = codeFromSeed(seed);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const u = new URL(window.location.href);
      u.searchParams.set('room', code);
      u.searchParams.set('board', '1');
      window.history.replaceState(null, '', u.toString());
    }
  }

  if (!def) {
    return <CenteredNote>That game could not be found.</CenteredNote>;
  }
  if (!code) {
    return <CenteredNote>This join link is missing its room code. Scan the QR on the screen again.</CenteredNote>;
  }
  return isBoard
    ? <GameBoardScreen def={def} code={code} />
    : <GamePlayerController def={def} code={code} />;
}

function CenteredNote({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#12100E]">
      <p className="text-[#FAF8F4] text-lg max-w-md" style={{ fontFamily: 'Fraunces, serif' }}>{children}</p>
    </div>
  );
}
