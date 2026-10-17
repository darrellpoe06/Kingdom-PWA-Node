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

// The header's own button shape, copied from the row this sits in so it reads
// as one row rather than a guest. Sizes in rem at the 16px baseline, so the
// text-size control scales them (consistency-guard: no fixed px).
const BTN = 'text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap inline-flex items-center gap-1 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

/**
 * Pure. Which door this header is handing out.
 *
 * Exported for the tests, and separate from the rendering on purpose: the ONE
 * thing that could go quietly wrong here is the header offering the PoeTech
 * join link while the person is plainly standing in the church — a code that
 * installs the wrong app is worse than no code.
 */
export function doorFor(church) {
  return church
    ? {
      url: SHARE_DOOR_URL,
      shown: 'poetech.us/lovecorner',
      title: 'The Love Corner app',
      blurb: 'Point a phone camera at this code to install our church app — services, live worship, sermons, giving, and prayer, all in one place. Project it, print it for the bulletin, or just show your phone.',
      ariaLabel: 'QR code to install The Love Corner church app',
      label: 'Share our app',
    }
    : {
      url: null,          // AppShareQR falls back to the platform join URL
      shown: null,
      title: 'Share the app',
      blurb: 'Have someone point their phone camera at this code. It opens the install page for their exact device — no long address to type.',
      ariaLabel: 'QR code to install the PoeTech app',
      label: 'Share app',
    };
}

export default function AppDoorControls({ church = false }) {
  const [open, setOpen] = useState(false);
  const door = doorFor(church);

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
        <AppShareQR
          url={door.url}
          shown={door.shown}
          title={door.title}
          blurb={door.blurb}
          ariaLabel={door.ariaLabel}
        />
        {/* The same sentence ChurchHome's card carries, because it is the same
            promise: showing a code is not an act of granting. */}
        <p className="text-[0.6875rem] text-[#5A5751] mt-2 italic">
          Showing this code doesn’t grant access — it only shares the way in. Granting,
          adjusting, or revoking access stays a deliberate steward action.
        </p>
      </Modal>
    </>
  );
}
