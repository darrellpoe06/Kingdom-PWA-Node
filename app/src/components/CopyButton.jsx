// =============================================================================
// CopyButton — one copy affordance for the whole app
// =============================================================================
// Darrell 2026-08-10: "copy paste options for each section... etc."
//
// Copy-to-clipboard existed in six places already (BibleReader, ClientGrowth,
// AdvocacyCases, TlcTeamAccess, OfficeAssistant, the Learn curriculum export),
// each with its own inline try/catch and its own copied-flag timer, and each
// silently doing NOTHING on a device with no clipboard API — the user taps, sees
// no change, and concludes the app is broken. This is the one shared control:
// it reports success, and it reports FAILURE honestly with what to do instead
// (DR-0076 — a surface never claims what it did not do).
//
// Deliberately plain: a button, a live-region status, a 1.6s reset. It carries
// no styling opinion beyond a sane default so each surface can dress it.
import React, { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/lesson-links.js';

export default function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied ✓',
  title = null,
  className = '',
  onCopied = null,
}) {
  const [state, setState] = useState('idle'); // 'idle' | 'copied' | 'failed'
  const timerRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const run = async () => {
    const value = typeof text === 'function' ? text() : text;
    const ok = await copyText(value);
    setState(ok ? 'copied' : 'failed');
    if (ok && onCopied) { try { onCopied(value); } catch (_) { /* a listener never breaks the copy */ } }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState('idle'), 1600);
  };

  const base = 'text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
  const tone = state === 'copied'
    ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white'
    : state === 'failed'
      ? 'border-[#7A1F1F] text-[#7A1F1F]'
      : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]';

  return (
    <>
      <button type="button" onClick={run} title={title || label} className={`${base} ${tone} ${className}`}>
        {state === 'copied' ? copiedLabel : state === 'failed' ? 'Press and hold to select' : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'copied' ? 'Copied to the clipboard' : state === 'failed' ? 'This device would not let the app copy — press and hold the text to select it instead' : ''}
      </span>
    </>
  );
}
