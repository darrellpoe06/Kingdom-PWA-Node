// =============================================================================
// ShareButton — one tap, into whatever they already use
// =============================================================================
// Darrell 2026-08-10: "can we just share right from the lessons? not have to
// copy a link... users can but not necessary... share and it will open whatever
// they usually do."
//
// This is the other half of DR-0290. The link became a real door — anyone can
// open it with no account — but handing someone that door still cost four steps
// on a phone: copy, leave the app, find the thread, paste. Most people abandon
// somewhere in the middle, so the best content on the platform never travelled.
//
// The device already knows how this person shares. `navigator.share` opens the
// same sheet every other app uses, with their own threads at the top. Where
// there is no sheet, the link goes to the clipboard instead and the button SAYS
// so — it never claims a share that did not happen (DR-0076).
//
// The one bug this component exists to not have: a cancelled share sheet throws
// AbortError, and treating that as a failure flashes an error at someone who
// simply changed their mind. `shareLink` reports 'dismissed' for that, and this
// returns quietly to idle.
import React, { useEffect, useRef, useState } from 'react';
import { shareLink } from '../lib/lesson-links.js';

export default function ShareButton({
  payload,
  label = 'Share',
  title = null,
  className = '',
  onShared = null,
}) {
  const [state, setState] = useState('idle'); // idle | shared | copied | failed
  const timerRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const run = async () => {
    const value = typeof payload === 'function' ? payload() : payload;
    const result = await shareLink(value);
    // A person who backed out of the sheet gets nothing flashed at them.
    if (result === 'dismissed') { setState('idle'); return; }
    setState(result);
    if (result !== 'failed' && onShared) {
      try { onShared(value, result); } catch (_) { /* a listener never breaks the share */ }
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState('idle'), 1600);
  };

  const base = 'text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
  const tone = state === 'shared' || state === 'copied'
    ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white'
    : state === 'failed'
      ? 'border-[#7A1F1F] text-[#7A1F1F]'
      : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white';

  const face = state === 'shared' ? 'Shared ✓'
    : state === 'copied' ? 'Link copied ✓'
      : state === 'failed' ? 'Press and hold to select'
        : label;

  const spoken = state === 'shared' ? 'Handed to your share sheet'
    : state === 'copied' ? 'This device has no share sheet, so the link was copied instead'
      : state === 'failed' ? 'This device would not let the app share or copy — press and hold the link to select it instead'
        : '';

  return (
    <>
      <button type="button" onClick={run} title={title || label} className={`${base} ${tone} ${className}`}>
        {face}
      </button>
      <span className="sr-only" role="status" aria-live="polite">{spoken}</span>
    </>
  );
}
