// =============================================================================
// ArrivalsBell — the number in the header, and the list behind it (DR-0728)
// =============================================================================
// Darrell 2026-10-01: "Why don't the PoeTech App have those types of
// notifications and the number of them if I haven't checked them yet?" The
// launcher badge is the on-the-icon half; this is the in-the-app half, in the
// header cluster beside Help, styled like the other header controls. It shows
// the same combined number the icon shows (lib/arrivals-watch.js publishes
// both from one count) and, tapped, lists every arrival newest first; each row
// opens the screen it lives on, in the door the person is already in.
//
// It marks nothing seen. Opening the screen does (lib/arrivals.js
// markArrivalsSeen), so glancing at the list never silences what it lists.
// Self-contained (its own event listener, its own Modal) so the frozen shell
// mounts it with one line.
import React, { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import UiIcon from './UiIcon.jsx';
import { ARRIVALS_EVENT, arrivalLanding } from '../lib/arrivals.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

const BTN = 'inline-flex items-center gap-1 min-h-[36px] px-2 border border-[#1A1815] text-[#1A1815] '
  + 'text-[0.625rem] uppercase tracking-wider font-semibold whitespace-nowrap hover:bg-[#1A1815] hover:text-white '
  + 'focus:outline focus:outline-2 focus:outline-[#B85838]';

export const KIND_WORDS = Object.freeze({
  message: 'Message',
  'lesson-ready': 'Lesson',
  'lesson-review': 'Lesson',
  'lesson-published': 'Lesson',
  'review-queue': 'To review',
  feedback: 'Feedback',
});

/** The bell's accessible name says the number and what the tap does. */
export function bellLabel(count) {
  const n = Number(count) || 0;
  if (n === 0) return 'Arrivals: nothing new. Open the list';
  return `${n} new arrival${n === 1 ? '' : 's'}. Open the list`;
}

function when(at) {
  const t = Date.parse(at || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export default function ArrivalsBell({ win = typeof window !== 'undefined' ? window : undefined }) {
  const [snap, setSnap] = useState(() => (win && win.__ptArrivals) || { count: 0, items: [], all: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!win || typeof win.addEventListener !== 'function') return undefined;
    const onArrivals = (e) => { if (e && e.detail) setSnap(e.detail); };
    win.addEventListener(ARRIVALS_EVENT, onArrivals);
    return () => win.removeEventListener(ARRIVALS_EVENT, onArrivals);
  }, [win]);

  const count = Number(snap.count) || 0;
  const items = Array.isArray(snap.items) ? snap.items : [];

  const openItem = (item) => {
    setOpen(false);
    if (!win) return;
    if (item.kind === 'feedback') {
      // Replies live in the Feedback sheet the footer button opens; press it.
      try { win.document.querySelector('[aria-label="Open feedback"]')?.click(); } catch { /* no button on this face */ }
      return;
    }
    const url = arrivalLanding({ pathname: win.location?.pathname, search: win.location?.search, item });
    if (!url) return;
    try { win.location.assign(url); } catch { win.location.href = url; }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={bellLabel(count)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Arrivals"
        data-testid="arrivals-bell"
        className={BTN}
      >
        <UiIcon name="bell" className="text-base" />
        {count > 0 && (
          <span data-testid="arrivals-count" className="min-w-[1.25rem] text-center rounded-full bg-[#B85838] text-white px-1 leading-5" style={MONO}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} label="Arrivals">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1 pr-8">Arrivals</div>
        <h2 className="text-xl text-[#1A1815] leading-tight pr-6" style={{ ...SERIF, fontWeight: 600 }} data-testid="arrivals-heading">
          {count === 0 ? 'Nothing new' : `${count} new`}
        </h2>
        <p className="text-xs text-[#5A5751] mt-1" style={SERIF}>
          Everything that came in that you have not looked at yet, newest first. Opening a screen counts as looking.
        </p>
        {items.length === 0 && (
          <p className="text-sm text-[#1A1815] mt-3" style={SERIF} data-testid="arrivals-empty">You are caught up.</p>
        )}
        <ul className="mt-3 space-y-2" data-testid="arrivals-list">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => openItem(it)}
                data-testid="arrivals-row"
                data-kind={it.kind}
                className="w-full text-left p-2.5 border border-[#E8E4DC] hover:border-[#B85838] hover:bg-[#FAF8F4] min-h-[44px] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                <span className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={MONO}>
                  {KIND_WORDS[it.kind] || 'New'}{it.at ? ` · ${when(it.at)}` : ''}
                </span>
                <span className="block text-sm font-semibold text-[#1A1815]" style={SERIF}>{it.title}</span>
                {it.detail && <span className="block text-xs text-[#5A5751] mt-0.5" style={SERIF}>{it.detail}</span>}
                <span className="block text-[0.625rem] uppercase tracking-wider text-[#B85838] mt-1">
                  {it.kind === 'feedback' ? 'Open Feedback' : 'Open'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
