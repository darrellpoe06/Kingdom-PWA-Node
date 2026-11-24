// =============================================================================
// AppMapButton — the PoeTech door's menu button and its map (DR-1627)
// =============================================================================
// The Love Corner has a menu button at its header's top left that opens every
// place in the app as grouped tiles. This is the same button on the PoeTech
// door, sitting at the start of the tab row beside Back and Forward. It opens
// AppMapSheet with the reader's own gated tabs (lib/app-map.js), and under
// them the same "This app" row: Personalize, Back to top, Install and Share.
//
// Self-contained (its own open state, sheet and Personalize sheet) so the
// frozen shell mounts it by handing TopNavRow one prop on an existing line.
// =============================================================================
import React, { useMemo, useState } from 'react';
import AppMapSheet from './AppMapSheet.jsx';
import PersonalizeSheet from './PersonalizeSheet.jsx';
import AppDoorControls from '../AppDoorControls.jsx';
import { poetechMapGroups } from '../../lib/app-map.js';
import { scrollPageToTop } from '../../lib/chrome-dock.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function AppMapButton({ map }) {
  const [open, setOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const navGroupsIn = map ? map.groups : null;
  const view = map ? map.view : null;
  const churchView = map ? map.churchView : null;
  const groups = useMemo(() => poetechMapGroups(navGroupsIn, { view, churchView }), [navGroupsIn, view, churchView]);
  if (!map || !groups.length) return null;
  const build = typeof __BUILD_SHA__ !== 'undefined' ? String(__BUILD_SHA__).slice(0, 7) : '';
  const go = (it) => {
    if (map.onNavigate) map.onNavigate(it.view, null, it.churchView || null);
    scrollPageToTop();
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menu: everywhere you can go in this app"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Menu: everywhere you can go"
        className={`ts-chrome-region shrink-0 self-stretch px-2.5 sm:px-3 flex items-center justify-center border-r border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:bg-[#E8E4DC] ${FOCUS}`}
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
        onGo={go}
        label="Everywhere you can go"
        placeholder="Search this app"
        theme={map.theme || null}
        build={build}
        thisApp={
          <>
            {map.setTheme && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPersonalizeOpen(true);
                }}
                className={`lch-pill ${FOCUS}`}
                data-testid="app-map-personalize"
              >
                Personalize My App
              </button>
            )}
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
            <AppDoorControls />
          </>
        }
      />
      {map.setTheme && (
        <PersonalizeSheet
          open={personalizeOpen}
          onClose={() => setPersonalizeOpen(false)}
          theme={map.theme}
          setTheme={map.setTheme}
          isOwner={!!map.isOwner}
          door="poetech"
        />
      )}
    </>
  );
}
