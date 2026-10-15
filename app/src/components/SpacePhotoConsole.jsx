// =============================================================================
// SpacePhotoConsole — the Church Spaces picture console (DR-1059)
// =============================================================================
// Darrell, 2026-10-15: "the images need to be able to be like Poe Properties
// Apps pictures console... We need a better flow... pictures can be deleted
// easily not doing what we expected."
//
// It lives in its own file, not inside ChurchObservation, for the reason
// PropertyPhotoActions gives for the same split: every branch stays reachable
// in a test, and the arithmetic has no React in it (lib/space-photos.js).
//
// WHAT CHANGED, and why each piece:
//
//   A thumbnail OPENS. Before, tapping a picture did nothing at all; the only
//   thing a thumbnail carried was a 16px "×" that deleted it. So the one
//   gesture a person naturally makes on a photo did nothing, and the gesture
//   next to it was destructive. Now the tap opens the picture large, and every
//   action lives in that open view where there is room to read it.
//
//   REMOVAL IS A TWO-STEP, INLINE. The old delete called window.confirm, which
//   this repo already knows is unreliable in the installed standalone app —
//   no-prompt-guard exists because window.prompt() silently no-ops there and a
//   button Darrell pushed "did nothing". A suppressed confirm returns falsy and
//   the handler just returns: a delete that neither deletes nor says why. The
//   two-step needs no browser dialog, cannot be suppressed, and cannot fire
//   from one stray tap.
//
//   THERE IS A COVER, AND AN ORDER. Poe Properties lets the landlord order a
//   door's pictures (0161); the church's spaces had no ordering at all, so the
//   tile's cover was whichever file was picked first and could never change.
import React, { useState } from 'react';
import Modal from './Modal.jsx';
import {
  photosOf, positionOf, removeConfirmText,
} from '../lib/space-photos.js';

const serif = { fontFamily: '"Fraunces", serif' };
const ACT = 'text-[0.625rem] uppercase tracking-wider px-2 py-1.5 min-h-[36px] border border-[#E8E4DC] text-[#1A1815] hover:border-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]';
const WARN = 'text-[0.625rem] uppercase tracking-wider px-2 py-1.5 min-h-[36px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function SpacePhotoConsole({ space, onSetCover, onMove, onRemovePhoto }) {
  const photos = photosOf(space);
  const [openId, setOpenId] = useState(null);
  const [confirming, setConfirming] = useState(false);

  if (!photos.length) return null;

  const open = photos.find((p) => p.id === openId) || null;
  const at = open ? positionOf(space, open.id) : null;
  const close = () => { setOpenId(null); setConfirming(false); };

  const removeNow = () => {
    const id = open.id;
    // Step after the last picture goes: there is nothing left to look at.
    const nextCount = photos.length - 1;
    onRemovePhoto(space.id, id);
    setConfirming(false);
    setOpenId(nextCount ? (photos.find((p) => p.id !== id) || {}).id || null : null);
  };

  return (
    <>
      <div className="flex gap-1 p-2 overflow-x-auto bg-white border-b border-[#E8E4DC]" data-testid="space-photo-strip">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => { setOpenId(p.id); setConfirming(false); }}
            aria-label={`Open photo ${i + 1} of ${photos.length} of ${space.name}${i === 0 ? ' (the cover)' : ''}`}
            className="relative shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            <img src={p.src} alt="" className="w-12 h-12 object-cover border border-[#E8E4DC]" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-[#1A1815]/80 text-white text-[0.5rem] uppercase tracking-wider text-center">Cover</span>
            )}
          </button>
        ))}
      </div>

      <Modal open={!!open} onClose={close} label={open ? `${space.name} — photo ${at ? at.position : ''}` : ''} closeLabel="Done">
        {open && (
          <div className="space-y-2">
            <img src={open.src} alt={`${space.name} — photo ${at ? at.position : ''}`} className="w-full object-contain bg-[#1A1815]" />
            <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>
              {at ? `Photo ${at.position} of ${at.total}${at.isCover ? ' · this is the cover' : ''}` : ''}
              {open.at ? ` · added ${String(open.at).slice(0, 10)}` : ''}
            </p>

            {!confirming ? (
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={ACT} disabled={!at || at.isCover}
                  onClick={() => onSetCover(space.id, open.id)}>
                  {at && at.isCover ? 'Is the cover' : 'Make this the cover'}
                </button>
                {/* Disabled at the ends rather than wrapping around — a picture
                    that jumps from last to first on one tap is a surprise. */}
                <button type="button" className={ACT} disabled={!at || at.index === 0}
                  onClick={() => onMove(space.id, open.id, 'forward')} aria-label="Move this photo one place earlier">
                  ← Earlier
                </button>
                <button type="button" className={ACT} disabled={!at || at.position === at.total}
                  onClick={() => onMove(space.id, open.id, 'back')} aria-label="Move this photo one place later">
                  Later →
                </button>
                <button type="button" className={`${WARN} ml-auto`} onClick={() => setConfirming(true)}>
                  Remove
                </button>
              </div>
            ) : (
              <div className="border border-[#B85838] p-2 space-y-2" role="alert">
                <p className="text-xs text-[#1A1815]" style={serif}>{removeConfirmText(space, open.id)}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className={WARN} onClick={removeNow}>Remove for good</button>
                  <button type="button" className={ACT} onClick={() => setConfirming(false)}>Keep it</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
