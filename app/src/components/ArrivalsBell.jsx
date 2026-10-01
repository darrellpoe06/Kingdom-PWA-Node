// =============================================================================
// ArrivalsBell — the number in the header, in the bottom bar, and the list
// behind it (DR-0728, DR-0741)
// =============================================================================
// Darrell 2026-10-01: "Why don't the PoeTech App have those types of
// notifications and the number of them if I haven't checked them yet?" The
// launcher badge is the on-the-icon half; this is the in-the-app half. It shows
// the same combined number the icon shows (lib/arrivals-watch.js publishes
// both from one count) and, tapped, lists every arrival newest first; each row
// opens the screen it lives on, in the door the person is already in.
//
// TWO PLACES, ONE LIST (DR-0741). Darrell 2026-10-01, his icon reading 3 and
// the app open on Messages: "Notifications 3... don't see anything... also
// didn't open to wherever they are... why?" and "I like the indicators
// though... just want them to be clear and show what's what". The header
// instance (variant "header") lives in the header cluster beside Help, and
// the header block is NOT rendered while the header is collapsed, which is
// how a phone usually sits. So the bottom bar (components/ChromeDock.jsx)
// mounts a second instance (variant "dock") that shows "N new" and what the
// N is made of ("2 messages · 1 lesson"), and is there whatever the header
// is doing. On a fresh launch with something new, the dock instance opens the
// list once by itself, so the app lands where the arrivals are.
//
// It marks nothing seen. Opening the screen does (lib/arrivals.js
// markArrivalsSeen), so glancing at the list never silences what it lists.
// Self-contained (its own event listener, its own Modal) so the frozen shell
// mounts it with one line.
import React, { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import UiIcon from './UiIcon.jsx';
import { ARRIVALS_EVENT, arrivalLanding } from '../lib/arrivals.js';
import { DOCK_BTN, DOCK_ICON, DOCK_LABEL } from '../lib/chrome-dock.js';

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

/** The plural of each kind's word, for the breakdown. */
const KIND_PLURAL = Object.freeze({
  Message: 'messages',
  Lesson: 'lessons',
  'To review': 'to review',
  Feedback: 'feedback',
});

/** Once per app launch the dock instance opens the list on its own (DR-0741). */
export const LAUNCH_OPENED_KEY = 'poetech:arrivals-opened-on-launch';

/** The bell's accessible name says the number and what the tap does. */
export function bellLabel(count) {
  const n = Number(count) || 0;
  if (n === 0) return 'Arrivals: nothing new. Open the list';
  return `${n} new arrival${n === 1 ? '' : 's'}. Open the list`;
}

/**
 * What the number is made of, counted from the list itself and said in the
 * list's own words, most first: "2 messages · 1 lesson". A message row may
 * carry a count of unread messages in its thread; that count is what the
 * icon counts, so it is what this says. '' when nothing is new.
 */
export function breakdownText(items) {
  const per = new Map();
  for (const it of Array.isArray(items) ? items : []) {
    if (!it) continue;
    const word = KIND_WORDS[it.kind] || 'New';
    const n = it.kind === 'message' ? Math.max(1, Number(it.count) || 1) : 1;
    per.set(word, (per.get(word) || 0) + n);
  }
  return [...per.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word, n]) => `${n} ${n === 1 ? word.toLowerCase() : (KIND_PLURAL[word] || `${word.toLowerCase()}s`)}`)
    .join(' · ');
}

/** The dock button's accessible name: the number and what it is made of. */
export function dockLabel(count, items) {
  const n = Number(count) || 0;
  const made = breakdownText(items);
  return `${n} new${made ? `: ${made}` : ''}. Open the list`;
}

function when(at) {
  const t = Date.parse(at || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

function launchOpened(win) {
  try { return win.sessionStorage.getItem(LAUNCH_OPENED_KEY) === '1'; } catch { return true; }
}
function rememberLaunchOpened(win) {
  try { win.sessionStorage.setItem(LAUNCH_OPENED_KEY, '1'); } catch { /* without storage the list simply does not open itself */ }
}

export default function ArrivalsBell({ win = typeof window !== 'undefined' ? window : undefined, variant = 'header' }) {
  const [snap, setSnap] = useState(() => (win && win.__ptArrivals) || { count: 0, items: [], all: [] });
  const [open, setOpen] = useState(false);
  const dock = variant === 'dock';

  useEffect(() => {
    if (!win || typeof win.addEventListener !== 'function') return undefined;
    const onArrivals = (e) => { if (e && e.detail) setSnap(e.detail); };
    win.addEventListener(ARRIVALS_EVENT, onArrivals);
    return () => win.removeEventListener(ARRIVALS_EVENT, onArrivals);
  }, [win]);

  const count = Number(snap.count) || 0;
  const items = Array.isArray(snap.items) ? snap.items : [];

  // LANDS WHERE THEY ARE (DR-0741): the first time this launch learns that
  // something is new, the dock instance opens the list, once. The header
  // instance never does, so two instances never open two lists.
  useEffect(() => {
    if (!dock || !win || count === 0 || launchOpened(win)) return;
    rememberLaunchOpened(win);
    setOpen(true);
  }, [dock, win, count]);

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

  const made = breakdownText(items);
  const list = (
    <Modal open={open} onClose={() => setOpen(false)} label="Arrivals">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1 pr-8">Arrivals</div>
      <h2 className="text-xl text-[#1A1815] leading-tight pr-6" style={{ ...SERIF, fontWeight: 600 }} data-testid="arrivals-heading">
        {count === 0 ? 'Nothing new' : `${count} new`}
      </h2>
      {made && <p className="text-sm text-[#1A1815] mt-0.5" style={SERIF} data-testid="arrivals-breakdown">{made}</p>}
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
  );

  if (dock) {
    // In the bar only while something is new: a square button like its
    // neighbours, the number in its ring, "new" under it, and what the number
    // is made of in its name. Nothing is drawn at zero, so the bar keeps its
    // room for the reader.
    if (count === 0) return list;
    const shown = count > 99 ? '99+' : String(count);
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={dockLabel(count, items)}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={made ? `${count} new: ${made}` : `${count} new`}
          data-testid="dock-arrivals"
          data-count={count}
          className={`${DOCK_BTN} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`}
        >
          <span aria-hidden="true" className={`relative ${DOCK_ICON}`}>
            <UiIcon name="bell" />
            <span data-testid="dock-arrivals-count" className="absolute -top-1.5 -right-2.5 min-w-[1.125rem] text-center rounded-full bg-[#B85838] text-white px-1 text-[0.625rem] leading-[1.125rem] font-semibold" style={MONO}>
              {shown}
            </span>
          </span>
          <span className={DOCK_LABEL}>{shown} new</span>
        </button>
        {list}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={bellLabel(count)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={made ? `Arrivals: ${made}` : 'Arrivals'}
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
      {list}
    </>
  );
}
