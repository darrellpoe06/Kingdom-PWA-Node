// =============================================================================
// AppDoorControls — the two app-door controls, together, in the header (DR-1056)
// =============================================================================
// Darrell, 2026-10-15, with a screenshot of the Love Corner app's QR card on an
// admin tab: **"This needs to be in the header...not just there... make sense?"**
//
// IT DOES, AND THE TRACE SAYS WHY IT IS NOT A DUPLICATE. There are TWO different
// doors, and only one of them was in the header:
//
//   InstallAppButton   "get the app onto THIS phone." In the header on every
//                      tab since 2026-07-10 — and it HIDES ITSELF ONCE THE APP
//                      IS INSTALLED, which is correct for what it does.
//   AppShareQR         "hand the way in to SOMEONE ELSE." A QR code and a copy
//                      link, living on ChurchHome, AccessUsageMetrics,
//                      AppInterestAdmin, PropertiesDoor and TlcPublicDoor —
//                      five surfaces, none of them the header.
//
// So the one header affordance for "the app" DISAPPEARS for exactly the people
// who hand it out. A steward standing in front of the congregation has the app
// installed, which means they have no button at all, and the code they want to
// show is several taps deep on an admin tab. That is the friction he met.
//
// EACH APP SHARES ITSELF (DR-1112). Darrell, 2026-10-19, with a screenshot of
// the PoeTech app's header handing out the Love Corner's code: "These need to
// share their respective apps... make sense?!!!!" The flag the shell passed was
// `churchBrand || view === 'church'`, so the PoeTech app's Church TAB turned its
// header into the church's door. A door is a page-load property, not a tab you
// are on (app-doors.js currentDoor, DR-0290), so the header now asks which app
// THIS page booted as, and shares that one: PoeTech, The Love Corner, Moore
// Divahs, TLC Therapy Solutions or Poe Properties. `church` is now only the
// page wearing the church brand (the public church route, or the church-only
// door), which is the Love Corner by definition. The church's own code still
// lives on ChurchHome's card, where a steward shows it from inside the church.
//
// THE SHARE CARD IS NOT COPIED HERE. This opens the SAME AppShareQR component
// the five surfaces already use — a second QR card with its own copy would be
// the second-vocabulary failure that goes stale the first time the door URL
// changes. On a church surface it is handed SHARE_DOOR_URL and the church's own
// words, so the header's code and ChurchHome's code are the same code.
//
// WHY THE TWO ARE ONE COMPONENT. The shell (poe-financial-mvp-v28.jsx) is
// FROZEN at its line budget and may only shrink (monolith-budget-guard). These
// are siblings — one gets you in, one lets you bring someone — so grouping them
// behind the single line the shell already spent on InstallAppButton is both
// the honest shape and the one that does not grow the monolith.
import React, { useState } from 'react';
import InstallAppButton from './InstallAppButton.jsx';
import Modal from './Modal.jsx';
import UiIcon from './UiIcon.jsx';
import AppShareQR from './AppShareQR.jsx';
import { SHARE_DOOR_URL } from '../lib/church-own-door.js';
import { TLC_SHARE_URL } from '../lib/tlc-door.js';
import { MOORE_SHARE_URL, MOORE_SHARE_URL_DISPLAY } from '../lib/moore-door.js';
import { PROPERTIES_SHARE_URL } from '../modules/properties/config.js';
import { currentDoor } from '../lib/app-doors.js';

// The header's own button shape, copied from the row this sits in so it reads
// as one row rather than a guest. Sizes in rem at the 16px baseline, so the
// text-size control scales them (consistency-guard: no fixed px).
const BTN = 'text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap inline-flex items-center gap-1 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

// Every door's share card, in the words each door's own surface already uses
// (ChurchHome, TlcPublicDoor, PropertiesDoor, MooreDivahs), so the header and
// the door never describe the same app two ways. Keys are app-doors.js DOORS.
const SHARES = {
  poetech: {
    url: null,          // AppShareQR falls back to the platform join URL
    shown: null,
    title: 'The PoeTech app',
    blurb: 'Have someone point their phone camera at this code. It opens the install page for their exact device — no long address to type.',
    ariaLabel: 'QR code to install the PoeTech app',
  },
  lovecorner: {
    url: SHARE_DOOR_URL,
    shown: 'poetech.us/lovecorner',
    title: 'The Love Corner app',
    blurb: 'Point a phone camera at this code to install our church app — services, live worship, sermons, giving, and prayer, all in one place. Project it, print it for the bulletin, or just show your phone.',
    ariaLabel: 'QR code to install The Love Corner church app',
  },
  tlc: {
    url: TLC_SHARE_URL,
    shown: 'poetech.us/tlc',
    title: 'TLC Therapy Solutions app',
    blurb: 'Point a phone camera at this code (or share your screen) to open the TLC Therapy Solutions app — no long address to type.',
    ariaLabel: 'QR code to open the TLC Therapy Solutions app',
  },
  moore: {
    url: MOORE_SHARE_URL,
    shown: MOORE_SHARE_URL_DISPLAY,
    title: 'The Moore Divahs app',
    blurb: 'Point a phone camera at this code to open the Moore Divahs app — custom clothing, scrub caps, custom shoes, sewing classes.',
    ariaLabel: 'QR code to open the Moore Divahs app',
  },
  properties: {
    url: PROPERTIES_SHARE_URL,
    shown: 'poetech.us/properties/app',
    title: 'The Poe Properties app',
    blurb: 'Point a phone camera at this code (or share your screen) to open the Poe Properties app — no long address to type.',
    ariaLabel: 'QR code to open the Poe Properties app',
  },
};

/**
 * Pure. Which app this header hands out, by the door's key.
 *
 * Exported for the tests, and separate from the rendering on purpose: the ONE
 * thing that could go quietly wrong here is a header offering ANOTHER app's
 * code — a code that installs the wrong app is worse than no code. An unknown
 * key is PoeTech's own door, never another app's.
 */
export function doorFor(key) {
  const share = SHARES[key] || SHARES.poetech;
  return { key: SHARES[key] ? key : 'poetech', label: 'Share our app', ...share };
}

/** Pure. The door key for this page: the church brand, else where it booted. */
export function doorKeyFor({ church = false, pathname = '', search = '' } = {}) {
  if (church) return 'lovecorner';
  return currentDoor(pathname, search).key;
}

export default function AppDoorControls({ church = false }) {
  const [open, setOpen] = useState(false);
  const loc = typeof window !== 'undefined' ? window.location : { pathname: '', search: '' };
  const door = doorFor(doorKeyFor({ church, pathname: loc.pathname, search: loc.search }));

  return (
    <>
      <InstallAppButton />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={BTN}
        title={`${door.label} — show a QR code or copy the link`}
        aria-label={`${door.label}: show a QR code or copy the link`}
      >
        <UiIcon name="link" className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{door.label}</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        label={door.title}
        closeLabel="Close"
      >
        {/* AppShareQR already carries the promise that showing a code is not
            an act of granting; a second copy here printed it twice (DR-1112). */}
        <AppShareQR
          url={door.url}
          shown={door.shown}
          title={door.title}
          blurb={door.blurb}
          ariaLabel={door.ariaLabel}
        />
      </Modal>
    </>
  );
}
