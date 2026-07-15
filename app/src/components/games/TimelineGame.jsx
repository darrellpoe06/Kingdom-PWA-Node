// =============================================================================
// TimelineGame — "Yahweh's Story, in order" (a game of timelines)
// =============================================================================
// Darrell 2026-07-15: "even a game of timelines with Yahweh from before and
// during time to end of time highlighting where we are on the timeline in
// context of the Word." A gentle ordering game: put the epochs of the one story
// in order, before time -> during -> end. It reads the SAME verified spine the
// timeline surface and the master lesson read (lib/biblical-timeline.js, DR-0079)
// -- so the "correct order" is the real order, and the YOU ARE HERE marker is the
// real Church-Age epoch. Deterministic (no Math.random -- repo rule): the choices
// are shown in a stable non-chronological scramble (alphabetical by era), and the
// player rebuilds the true order. Private, device-only, nothing sent.
// =============================================================================
import React, { useState } from 'react';
import { listEpochs } from '../../lib/biblical-timeline.js';

const PHASE_LABEL = { before: 'Before time', during: 'During time', end: 'End of time' };

export default function TimelineGame({ onExit }) {
  const epochs = listEpochs(); // true order (before -> end)
  const order = epochs.map((e) => e.id);
  const byId = Object.fromEntries(epochs.map((e) => [e.id, e]));

  const [placed, setPlaced] = useState([]); // ids the player has correctly placed
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState(null); // { id, ok } for the last pick

  const nextCorrect = order[placed.length];
  const done = placed.length === order.length;

  // Remaining choices, shown in a STABLE scramble (alphabetical by era) so the
  // player must supply the chronology -- deterministic, no randomness.
  const remaining = epochs
    .filter((e) => !placed.includes(e.id))
    .slice()
    .sort((a, b) => a.era.localeCompare(b.era));

  function pick(id) {
    if (id === nextCorrect) {
      setPlaced((p) => [...p, id]);
      setFlash({ id, ok: true });
    } else {
      setMisses((m) => m + 1);
      setFlash({ id, ok: false });
    }
  }

  function reset() {
    setPlaced([]); setMisses(0); setFlash(null);
  }

  const firstTry = order.length - misses; // a soft score; misses never below-zero the win

  return (
    <div className="max-w-2xl mx-auto px-1">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">A game of timelines</p>
          <h2 className="text-2xl font-bold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Yahweh’s Story, in order</h2>
        </div>
        {onExit && (
          <button type="button" onClick={onExit} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
            Exit
          </button>
        )}
      </div>

      <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Put the story in order — from before time, through the biblical record, to the end of time.
        Tap the era you think comes <strong>next</strong>. The Word sets the true order.
      </p>

      {/* The order built so far */}
      <ol className="mt-4 space-y-1.5">
        {placed.map((id, i) => {
          const e = byId[id];
          const here = e.youAreHere === true;
          return (
            <li key={id} className={`border p-2.5 flex items-baseline justify-between gap-2 ${here ? 'border-2 border-[#B85838] bg-[#B85838]/[0.05]' : 'border-[#E8E4DC] bg-white'}`}>
              <span className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[#5A5751] text-[0.6875rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{i + 1}. </span>
                {e.era}
              </span>
              {here && <span className="text-[0.5625rem] uppercase tracking-widest bg-[#B85838] text-white px-2 py-0.5 font-semibold">You are here</span>}
            </li>
          );
        })}
      </ol>

      {!done ? (
        <div className="mt-4">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-2">
            Which comes next?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {remaining.map((e) => {
              const wasWrong = flash && !flash.ok && flash.id === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => pick(e.id)}
                  className={`text-left border p-2.5 text-sm text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838] ${wasWrong ? 'border-[#B85838] bg-[#B85838]/[0.08]' : 'border-[#E8E4DC] bg-white hover:border-[#1A1815]'}`}
                  style={{ fontFamily: '"Fraunces", serif' }}
                >
                  <span className="block">{e.era}</span>
                  <span className="block text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">{PHASE_LABEL[e.phase]}</span>
                </button>
              );
            })}
          </div>
          {flash && !flash.ok && (
            <p className="text-xs text-[#B85838] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Not yet — that one comes later. Look for the earliest era still remaining.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 border border-[#5A6E3D] bg-[#5A6E3D]/[0.06] p-3">
          <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>The whole story, in order.</strong> From before time, He purposed it in love; He walked with us,
            we broke it, He pursued and restored it — and we live now in the age of the Spirit and the ingathering
            (that is where we are), until He makes it complete. {firstTry} of {order.length} placed on the first try
            {misses > 0 ? ` · ${misses} retr${misses === 1 ? 'y' : 'ies'}` : ' · flawless'}.
          </p>
          <button type="button" onClick={reset} className="mt-3 text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
