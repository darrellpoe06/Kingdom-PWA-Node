// =============================================================================
// SectionTabs — the "sliding tabs" feel, INSIDE a tab (no more long scroll)
// =============================================================================
// Darrell, 2026-07-04: "let's use the sliding tabs for all tabs instead of a long
// scroll on any tab, I love how it flows and you feel like you can get where you
// want." The top nav already slides (the header tab strip); this brings that same
// motion DOWN into a single tab's body — a long vertical surface becomes a row of
// swipeable section tabs with one section shown at a time, so you jump straight to
// the part you want instead of scrolling past everything else.
//
// Built on the SAME primitive the top nav uses — <TabScroll> (components/shared.jsx)
// — so the strip scrolls/swipes identically (native touch momentum, thin scrollbar
// only when it overflows) and the active underline matches (rust border-b-2). No new
// scroll behavior invented; the guarded, proven one is reused. Icons are <UiIcon>
// (bundled SVG, never emoji); every size is rem so the large-print control scales it.
//
// A11y: a real WAI-ARIA tablist — role tablist/tab/tabpanel, aria-selected,
// aria-controls, roving tabindex, and Arrow/Home/End keyboard navigation (an
// improvement over the top nav, which has none). Only the active panel is mounted,
// so a heavy section (a fetch, a chart) does its work only when you open it.
//
// Reusable by design: pass a `sections` array of { id, label, icon?, render }. The
// Admin report is the first surface to adopt it; other long tabs follow the same call.
//
// THE THIRD ROW (Darrell 2026-07-05: "we need a 3rd row of sliding tabs if that
// tab scrolls really long — users will never read down that low; we want fully
// viable systems that seem intuitive"). When a SECOND-row section's panel is still
// a multi-screen scroll, nest another SectionTabs inside it with variant="sub".
// The sub variant renders as a compact chip row (active = ink pill) instead of a
// third identical underline strip, so the eye reads the hierarchy: nav slides,
// section slides, sub-section slides — and no panel is ever a long read-down.
// Same TabScroll primitive, same tablist a11y, same lazy panel mount.
// =============================================================================
import React, { useState, useRef, useCallback } from 'react';
import UiIcon from './UiIcon.jsx';
import { TabScroll } from './shared.jsx';

export default function SectionTabs({
  sections = [],
  ariaLabel = 'Sections',
  defaultId = null,
  idBase = 'sect',
  variant = 'section', // 'section' (2nd row, underline) | 'sub' (3rd row, chips)
}) {
  const valid = sections.filter(Boolean);
  const [active, setActive] = useState(() => {
    if (defaultId && valid.some((s) => s.id === defaultId)) return defaultId;
    return valid.length ? valid[0].id : null;
  });
  const btnRefs = useRef({});

  // Arrow / Home / End move focus AND selection along the strip (roving tabindex).
  const onKeyDown = useCallback((e) => {
    if (!valid.length) return;
    const idx = valid.findIndex((s) => s.id === active);
    if (idx < 0) return;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = valid[(idx + 1) % valid.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = valid[(idx - 1 + valid.length) % valid.length];
    else if (e.key === 'Home') next = valid[0];
    else if (e.key === 'End') next = valid[valid.length - 1];
    if (next) {
      e.preventDefault();
      setActive(next.id);
      const el = btnRefs.current[next.id];
      if (el && el.focus) el.focus();
    }
  }, [active, valid]);

  if (!valid.length) return null;
  const current = valid.find((s) => s.id === active) || valid[0];
  const sub = variant === 'sub';

  return (
    <div className={sub ? 'space-y-3' : 'space-y-4'}>
      <TabScroll label={ariaLabel} rowClassName={sub ? 'items-center gap-1.5 py-0.5' : 'items-stretch'} className={sub ? '' : 'border-b border-[#E8E4DC]'}>
        {valid.map((s) => {
          const on = s.id === current.id;
          // Sub (3rd-row) tabs are chips — active fills with ink — so a nested
          // strip never reads as a duplicate of the underline row above it.
          const cls = sub
            ? `px-2.5 py-1.5 whitespace-nowrap text-[0.6875rem] uppercase tracking-wider border transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] inline-flex items-center gap-1.5 ${on ? 'bg-[#1A1815] border-[#1A1815] text-white font-medium' : 'bg-transparent border-[#C9BFA8] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815]'}`
            : `px-2.5 sm:px-3 py-2.5 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] inline-flex items-center gap-1.5 ${on ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`;
          return (
            <button
              key={s.id}
              type="button"
              ref={(el) => { btnRefs.current[s.id] = el; }}
              role="tab"
              id={`${idBase}-tab-${s.id}`}
              aria-selected={on}
              aria-controls={`${idBase}-panel-${s.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(s.id)}
              onKeyDown={onKeyDown}
              className={cls}
            >
              {s.icon ? <UiIcon name={s.icon} /> : null}
              {s.label}
            </button>
          );
        })}
      </TabScroll>
      <div
        role="tabpanel"
        id={`${idBase}-panel-${current.id}`}
        aria-labelledby={`${idBase}-tab-${current.id}`}
        tabIndex={0}
        className="focus:outline-none"
      >
        {current.render()}
      </div>
    </div>
  );
}
