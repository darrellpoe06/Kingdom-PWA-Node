// =============================================================================
// DoorMapButton — the menu button for a door that is not the PoeTech shell
// =============================================================================
// DR-1627. Poe Properties, Moore Divahs and TLC each keep their own tab list
// in their own component, and none of them loads the PoeTech shell. This is
// the one button all three mount: it opens AppMapSheet with the tabs that door
// already shows this reader, so the map can never list a place the door itself
// would not offer. "This app" holds Back to top and the build.
//
// The theme is read when the sheet opens, from the saved choice every door
// shares (lib/theme-css.js), because the sheet is drawn outside the door's own
// themed wrapper and would otherwise open in cream on a dark door.
// =============================================================================
import React, { useState } from 'react';
import AppMapSheet from './AppMapSheet.jsx';
import { scrollPageToTop } from '../../lib/chrome-dock.js';
import { readThemePref } from '../../lib/theme-css.js';

export { doorMapGroup } from '../../lib/app-map.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function DoorMapButton({ groups = [], onGo, appName = 'this app', theme = null, themeFallback = 'cream', className = '', children = null }) {
  const [open, setOpen] = useState(false);
  const [shownTheme, setShownTheme] = useState(null);
  if (!groups.length) return null;
  const build = typeof __BUILD_SHA__ !== 'undefined' ? String(__BUILD_SHA__).slice(0, 7) : '';
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setShownTheme(theme || readThemePref(themeFallback));
          setOpen(true);
        }}
        aria-label={`Menu: everywhere you can go in ${appName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Menu: everywhere you can go"
        className={`ts-chrome-region shrink-0 inline-flex items-center justify-center min-h-[2.25rem] min-w-[2.25rem] rounded border border-[#1A1815] bg-transparent text-[#1A1815] hover:border-[#B85838] hover:text-[#B85838] ${FOCUS} ${className}`}
        data-testid="app-map-button"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span className="sr-only">Menu</span>
      </button>
      <AppMapSheet
        open={open}
        onClose={() => setOpen(false)}
        groups={groups}
        onGo={(it) => {
          if (onGo) onGo(it);
          scrollPageToTop();
        }}
        label={`Everywhere you can go in ${appName}`}
        placeholder={`Search ${appName}`}
        theme={shownTheme === 'cream' ? null : shownTheme}
        build={build}
        thisApp={
          <>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                scrollPageToTop();
              }}
              className={`lch-pill ${FOCUS}`}
              data-testid="app-map-top"
            >
              Back to top
            </button>
            {children}
          </>
        }
      />
    </>
  );
}
