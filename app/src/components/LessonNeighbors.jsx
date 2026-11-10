// =============================================================================
// LessonNeighbors — Previous, All, Next at the END of an open lesson (DR-1383)
// =============================================================================
// Darrell, 2026-11-10, with a screenshot of the bottom of an open lesson:
// "When reading a lesson users don't have a next lesson tab or previous... we
// need that... the reader does it automatically... however when not using it...
// I can't pick next lesson when I want to continue... fix it...", then "We
// don't like dead-ends", then "Make sure we don't need 3 moves to get to all
// lessons... or the next one... one tap and you're where you want to be".
//
// The sticky bar at the top already had two arrows, but on a phone they carry
// no words and the bar slides away while reading (DR-0749), so a reader who
// finished by hand met Share / Copy / Download / Present / Done and no way on.
// This row sits after the lesson. All lessons is always one of its doors, so
// it is never a dead end; Previous and Next name where they go (the number and
// the title) and are there whenever that neighbor exists. The caller lands the
// reader at the TOP of where each door goes.
//
// STACKED, NOT SIDE BY SIDE (DR-1385). Darrell's Big Print screenshot of L7,
// 2026-11-10: three doors in a row left each one a third of a phone, so a title
// at A+++ broke out of its box ("borrowing", "sweareth", "changeth") and the All
// door was a tall empty column. Each door is now the full width, Next first,
// then Previous, then All lessons as a short bar, and a long word wraps inside.
// =============================================================================
import React from 'react';

const SERIF = { fontFamily: '"Fraunces", serif' };
const DOOR = 'w-full px-3 py-2 min-h-[48px] border-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const QUIET = 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white';
const LOUD = 'border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f]';

function Door({ testid, label, title, onClick, align = 'start', loud = false }) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className={`${DOOR} ${loud ? LOUD : QUIET} ${align === 'end' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
    >
      <span className="ts-chrome-region block text-[0.625rem] uppercase tracking-wider font-semibold">{label}</span>
      {title && (
        <span className="block text-sm mt-0.5 [overflow-wrap:anywhere]" data-testid={`${testid}-title`} style={SERIF}>
          {title}
        </span>
      )}
    </button>
  );
}

/**
 * prev / next: { id, label, title } or null. onGo(id) opens that lesson at its
 * top; onAll() returns to the top of every lesson. unit is the course's noun.
 */
export default function LessonNeighbors({ prev, next, onGo, onAll, unit = 'lesson' }) {
  if (!onGo || !onAll) return null;
  return (
    <nav aria-label={`Previous and next ${unit}`} data-testid="lesson-neighbors" className="mt-4 pt-3 border-t border-[#E8E4DC] flex flex-col gap-2">
      {next && <Door testid="lesson-neighbor-next" loud label={`Next ${unit} · ${next.label} →`} title={next.title} onClick={() => onGo(next.id)} />}
      {prev && <Door testid="lesson-neighbor-prev" label={`← Previous ${unit} · ${prev.label}`} title={prev.title} onClick={() => onGo(prev.id)} />}
      <Door testid="lesson-neighbor-all" align="center" label={`↑ All ${unit}s`} onClick={onAll} loud={!next} />
    </nav>
  );
}
