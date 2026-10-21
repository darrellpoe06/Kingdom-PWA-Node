// =============================================================================
// TlcDoorDock — the TLC app's bottom bar on a phone (DR-1171)
// =============================================================================
// The reference carries its navigation at the thumb: five items along the
// bottom, the active one in the brand green. On the TLC door the same section
// strip that drives the desktop (SectionTabs, a real tablist) is hidden below
// `sm`, and this bar drives the SAME active id, so a tap here and a tap there
// are one switch. Four sections ride the bar; everything else (the rest of the
// sections, Share · QR, Book) sits behind More, which opens a sheet above the
// bar. House literals only, so the TLC theme paints it white with a forest
// active state and Midnight paints it dark. Pure: the door passes the items.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import { usePhoneWidth } from '../lib/chrome-dock.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function TlcDoorDock({ items = [], activeId = null, onSelect = () => {}, more = [] }) {
  const [open, setOpen] = useState(false);
  // THE FLOATERS STAND ABOVE THE BAR. The read-aloud control and the text-size
  // hatch sit at `bottom: calc(16px + var(--chrome-dock-h))` (index.css), the
  // variable the family app's bar publishes. This bar publishes the same one
  // while it is on screen (phone widths), so nothing covers the More button —
  // the first live screenshot had both floaters sitting on it.
  const ref = useRef(null);
  const phone = usePhoneWidth();
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const doc = document.documentElement;
    const el = ref.current;
    const publish = () => { doc.style.setProperty('--chrome-dock-h', phone && el ? `${Math.round(el.getBoundingClientRect().height)}px` : '0px'); };
    publish();
    let ro = null;
    try { if (phone && el && typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(publish); ro.observe(el); } } catch { /* no observer */ }
    return () => { if (ro) ro.disconnect(); doc.style.setProperty('--chrome-dock-h', '0px'); };
  }, [phone]);
  // While the More sheet is open the bar rises above the floaters (the
  // read-aloud control and the text-size hatch sit at z-80), so no row of
  // the sheet is ever under a button; closed, it sits back under them.
  const bar = items.slice(0, 4);
  const rest = [...items.slice(4), ...more];
  const pick = (id) => { setOpen(false); onSelect(id); };
  return (
    <nav ref={ref} aria-label="TLC app" className={`sm:hidden fixed inset-x-0 bottom-0 ${open ? 'z-[85]' : 'z-40'} rounded-none bg-white border-t border-[#E8E4DC] print:hidden`} data-testid="tlc-dock" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {open && rest.length > 0 && (
        <div className="absolute inset-x-3 bottom-full mb-2 rounded-2xl bg-white border border-[#E8E4DC] p-2 space-y-0.5" role="menu" aria-label="More">
          {/* The reference's account list: an icon in its well, the label,
              a chevron — one row per thing the bar did not have room for. */}
          {rest.map((r) => {
            const row = `w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm text-left hover:bg-[#E8E4DC] ${FOCUS}`;
            const body = (
              <>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E8E4DC] text-[#1A1815] shrink-0" aria-hidden="true"><UiIcon name={r.icon || 'sparkle'} /></span>
                <span className="min-w-0 flex-1">{r.label}</span>
                <span aria-hidden="true" className="text-[#5A5751]">›</span>
              </>
            );
            return r.href
              ? <a key={r.id} href={r.href} target="_blank" rel="noopener noreferrer" role="menuitem" className={`${row} text-[#1A1815]`} onClick={() => setOpen(false)}>{body}</a>
              : <button key={r.id} type="button" role="menuitem" onClick={() => (r.onSelect ? (setOpen(false), r.onSelect()) : pick(r.id))} aria-current={r.id === activeId ? 'page' : undefined} className={`${row} ${r.id === activeId ? 'text-[#B85838] font-semibold' : 'text-[#1A1815]'}`}>{body}</button>;
          })}
        </div>
      )}
      {/* As many columns as there are items: three sections and More fill
          the bar edge to edge, never a blank fifth slot. */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${bar.length + 1}, minmax(0, 1fr))` }} data-testid="tlc-dock-row">
        {bar.map((it) => {
          const on = it.id === activeId && !open;
          return (
            <button key={it.id} type="button" onClick={() => pick(it.id)} aria-current={on ? 'page' : undefined} data-testid={`tlc-dock-${it.id}`} className={`flex flex-col items-center justify-center gap-0.5 min-h-[3.5rem] py-1.5 ${on ? 'text-[#B85838]' : 'text-[#5A5751]'} ${FOCUS}`}>
              <span aria-hidden="true" className={`inline-flex items-center justify-center w-8 h-6 rounded-full ${on ? 'bg-[#E8E4DC]' : ''}`}><UiIcon name={it.icon || 'sparkle'} /></span>
              <span className="text-[0.625rem] leading-none">{it.dockLabel || it.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" data-testid="tlc-dock-more" className={`flex flex-col items-center justify-center gap-0.5 min-h-[3.5rem] py-1.5 ${open ? 'text-[#B85838]' : 'text-[#5A5751]'} ${FOCUS}`}>
          <span aria-hidden="true" className={`inline-flex items-center justify-center w-8 h-6 rounded-full ${open ? 'bg-[#E8E4DC]' : ''}`}><UiIcon name="sliders" /></span>
          <span className="text-[0.625rem] leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
