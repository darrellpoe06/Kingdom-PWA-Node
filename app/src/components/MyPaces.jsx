// =============================================================================
// MyPaces — the learner's own reading and listening paces, and pace vs understanding (DR-1386)
// =============================================================================
// Darrell, 2026-11-10: "Give the reader their reader vs reading paces... if
// they are measuring accurately... and users want that" and "Can we see if we
// improve or reduce our comprehension based on the speed of the data being
// consumed?" Off until the learner turns it on; every number is measured on
// this device (lib/pace-understanding.js), and a pace not yet measured says so.
// =============================================================================
import React, { useState } from 'react';
import { eyesPace, earsPace, pacedAttempts, paceVsUnderstanding, paceFindingLine, getShowPaces, setShowPaces, MIN_WORDS } from '../lib/pace-understanding.js';
import { GRACE_WPM } from '../lib/test-integrity.js';

const MONO = { fontFamily: '"JetBrains Mono", monospace' };

function eyesLine(e) {
  if (e.beyondGrace) return `Your reading: faster than ${GRACE_WPM} words a minute in places, beyond what the measure can see.`;
  if (!e.accurate) return `Your reading: measuring (${e.words} of ${MIN_WORDS} words and half a minute needed).`;
  return `Your reading: ${e.wpm} words a minute (measured on ${e.words} words).`;
}

function earsLine(a) {
  if (!a) return 'The reader: not measured on this lesson yet (it measures once it has spoken a while).';
  return `The reader: ${a.wpm} words a minute at ${a.rate.toFixed(1)}×.`;
}

export default function MyPaces({ lessonId, tick = 0 }) {
  const [on, setOn] = useState(() => getShowPaces());
  const flip = () => {
    setShowPaces(!on);
    setOn(!on);
  };
  const view = on && lessonId ? { eyes: eyesPace(lessonId), ears: earsPace(lessonId), fit: paceVsUnderstanding(pacedAttempts()) } : null;
  return (
    <div data-testid="my-paces" data-tick={tick} className="mt-1">
      <button
        type="button"
        onClick={flip}
        aria-pressed={on}
        data-testid="my-paces-toggle"
        className="text-[0.6875rem] uppercase tracking-wider text-[#1A1815] underline underline-offset-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        style={MONO}
      >
        {on ? 'Hide my paces' : 'Show my paces'}
      </button>
      {view && (
        <div className="text-[0.6875rem] text-[#5A5751] space-y-0.5" style={MONO}>
          <div data-testid="my-paces-eyes" data-accurate={view.eyes.accurate ? 'true' : 'false'}>
            {eyesLine(view.eyes)}
          </div>
          <div data-testid="my-paces-ears">{earsLine(view.ears)}</div>
          <div data-testid="my-paces-fit" data-finding={view.fit.finding ? 'true' : 'false'}>
            Pace and understanding: {paceFindingLine(view.fit)}
          </div>
        </div>
      )}
    </div>
  );
}
