// =============================================================================
// SideNav — the Heritage redesign's sidebar, at laptop width (DR-1046 Phase 2)
// =============================================================================
// Christina 2026-10-15, with the reference image: "On desktop, use a
// sophisticated sidebar navigation similar to the attached reference." The
// sidebar draws the SAME list the phone's tab strip draws (lib/nav-items.jsx):
// every top-level section a reader is allowed, grouped for the eye, every one
// of them visible — nothing is behind a click that was not before (#381, the
// cluster nav that hid tabs, was reverted for exactly that). It renders only
// from the `lg` breakpoint (1024px), where the shell has room beside the page;
// below that the tab strip in TopNavRow is still the nav, unchanged.
//
// COLORS ARE CLASSES, NEVER INLINE: forest for the rail, ivory for the
// selected item, gold for the tagline and group eyebrows, each a literal
// token with a midnight twin in lib/theme-css.js, so contrast-guard and the
// legibility guard police this file like any other (DR-0713 / DR-0873).
// The rail is CHROME: .ts-chrome-region caps it at every text size
// (DR-0438), and the words inside it are rem so they stay in the cap.
//
// A rail with nothing to list renders nothing: the only time navItems() is
// empty is a door that filtered every section away, and that door draws its
// own one-tab brand row (TopNavRow, DR-0640), so no screen is left blank.
import React from 'react';
import UiIcon from '../UiIcon.jsx';
import { DmUnreadBadge } from '../shared.jsx';
import { navGroups, NAV_ICONS, NAV_WORDS } from '../../lib/nav-items.jsx';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#C9A227]';

export default function SideNav({
  items = [], view = 'overview', setView, brandName = 'PoeTech', brandTagline = '', onSettings = null, settingsOpen = false,
}) {
  const groups = navGroups(items);
  if (!groups.length) return null;
  return (
    <aside
      data-testid="side-nav"
      aria-label="Sections"
      className="side-nav ts-chrome-region hidden lg:flex lg:flex-col shrink-0 w-[14.5rem] sticky self-start overflow-y-auto bg-[#1F3A2E] text-[#F6F1E7] print:hidden"
      style={{ top: 'var(--lwb-h, 0px)', maxHeight: 'calc(100dvh - var(--lwb-h, 0px))' }}
      data-read-skip
    >
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <span aria-hidden="true" className="w-9 h-9 rounded-lg bg-[#F6F1E7] text-[#1F3A2E] border-2 border-[#C9A227] grid place-items-center font-semibold text-xl" style={{ fontFamily: '"Fraunces", serif' }}>P</span>
        <span className="min-w-0 leading-tight">
          <span data-testid="side-nav-brand" className="block font-semibold tracking-[0.12em] uppercase text-[0.9375rem] text-[#F6F1E7] break-words" style={{ fontFamily: '"Fraunces", serif' }}>{brandName}</span>
          {brandTagline && <span data-testid="side-nav-tagline" className="block text-[0.5rem] uppercase tracking-[0.22em] text-[#C9A227] font-semibold break-words">{brandTagline}</span>}
        </span>
      </div>
      <nav aria-label="Main" className="px-2 pb-2 flex flex-col gap-0.5">
        {groups.map((g) => (
          <React.Fragment key={g.key}>
            {g.label && <div className="px-3 pt-3 pb-1 text-[0.5625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">{g.label}</div>}
            {g.items.map(([id, label]) => {
              const active = view === id;
              const words = NAV_WORDS[id];
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={`side-nav-${id}`}
                  onClick={() => setView && setView(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-[36px] w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left text-[0.8125rem] transition-colors ${FOCUS} ${active ? 'bg-[#F6F1E7] text-[#1F3A2E] font-semibold' : 'text-[#F6F1E7] hover:bg-[#2B2F2D]'}`}
                >
                  <span aria-hidden="true" className="text-[1rem] leading-none shrink-0"><UiIcon name={NAV_ICONS[id] || 'folder'} /></span>
                  <span className="min-w-0 flex-1 truncate">{words || label}</span>
                  {id === 'messages' && <DmUnreadBadge />}
                  {active && <span aria-hidden="true" className="w-2 h-2 rounded-full border-2 border-[#C9A227] shrink-0" />}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>
      {onSettings && (
        <div className="mt-auto px-2 py-3 border-t border-[#2B2F2D]">
          {/* The comfort controls (text size A..A44, voice, colors, account,
              Install, Help) stay where every door and the DR-0827 tests keep
              them: the header hideaway. This is the way to them from the rail,
              and it says what it does: open when the header is shown, else the
              three words of what is inside. */}
          <button
            type="button"
            data-testid="side-nav-settings"
            onClick={onSettings}
            aria-expanded={settingsOpen}
            className={`min-h-[36px] w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left text-[0.8125rem] text-[#F6F1E7] hover:bg-[#2B2F2D] ${FOCUS}`}
          >
            <span aria-hidden="true" className="text-[1rem] leading-none shrink-0"><UiIcon name="sliders" /></span>
            <span className="min-w-0 flex-1 truncate">Settings</span>
            <span className="text-[0.5625rem] uppercase tracking-[0.1em] text-[#C9A227]">{settingsOpen ? 'open' : 'text · voice · colors'}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
