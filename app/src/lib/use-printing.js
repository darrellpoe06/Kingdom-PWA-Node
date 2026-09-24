// =============================================================================
// usePrinting — true only while the page is being printed (DR-0637)
// =============================================================================
// Measured 2026-09-24 in Chromium at 390x844: the Learn tab kept a print-only
// copy of the WHOLE curriculum in the page at all times — 9,919 elements,
// `hidden print:block`, never seen on a screen — so a lesson that needed ~400
// elements to show carried 10,405. This hook lets a print-only block mount at
// the moment of printing and leave afterwards.
//
// `beforeprint` fires before the browser lays out the printed pages, whether
// the print came from our own Print button (window.print) or from the
// browser's menu or share sheet; flushSync makes React commit the block in
// that same moment, so the paper is never printed from an empty page. The
// `print` media query's change event covers browsers that do not fire
// beforeprint. Where neither exists, nothing mounts early and nothing breaks.
// =============================================================================
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export function usePrinting() {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const on = () => { try { flushSync(() => setPrinting(true)); } catch (_) { setPrinting(true); } };
    const off = () => setPrinting(false);
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    let mq = null;
    const onChange = (e) => (e && e.matches ? on() : off());
    try {
      mq = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;
      if (mq && typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    } catch (_) { mq = null; }
    return () => {
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
      try { if (mq && typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange); } catch (_) { /* ignore */ }
    };
  }, []);
  return printing;
}
