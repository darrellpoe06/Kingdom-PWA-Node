// =============================================================================
// AppAlerts — the app-wide alert layer: an arrival you can see, an offer you
// can find
// =============================================================================
// Darrell, 2026-09-17: "Why doesn't it show notifications on the apps?" ...
// "Christina text me and I didn't realize it was a new one" ... "I was even
// inside the Love Corner App... I believe it should be able to give a better
// response."
//
// The measured cause is written up in lib/notify-readiness.js — in short:
// `push_subscriptions` and `push_sends` are BOTH empty, and have always been,
// because the only control in the app that can subscribe a device renders
// part-way down the Messages tab. This layer is the door that was missing, and
// it carries the in-app signal the OS doorbell deliberately declines to give.
//
// WHY A SEPARATE REACT ROOT AND NOT A PIECE OF THE SHELL. Two reasons, both
// structural rather than stylistic:
//   1. `poe-financial-mvp-v28.jsx` is frozen by scripts/monolith-budget-guard
//      at 5355 lines — new capability ships as a module, not inline.
//   2. This layer must be alive in EVERY face of the app on this origin
//      (PoeTech and The Love Corner both boot main.jsx) and it must not wait
//      on the lazily-imported monolith, because the whole point is to be
//      noticed the moment something arrives.
// THE WIDTH CAP SITS ON THE FIXED ELEMENT ITSELF, matching UpdatePrompt and
// InstallPrompt in PwaPrompts.jsx. Not a style preference: consistency-guard
// counts a `max-w-` as per-surface layout drift (DR-0246), and its exemption is
// per class span and requires `fixed` in that same span — a banner must carry a
// cap (edge-to-edge on a 27" monitor is the defect), and this is where the gate
// can tell an overlay from a tab wrapper.
//
// It reads nothing from the app's closure: auth comes from supabase, the
// unread count from the DM_UNREAD_EVENT the app-wide watcher already raises,
// and push readiness from the browser's own live state.
//
// THREE THINGS IT WILL NOT DO, each one a way this class of surface goes wrong:
//   • It never prompts for permission on its own. The OFFER is words and a
//     button; `Notification.requestPermission()` fires only from the press,
//     inside the existing <PushNotifications> control. A prompt on load is how
//     an origin gets permanently denied, after which nothing we ship can reach
//     that person again.
//   • It never offers what cannot work. Unsupported, unconfigured and blocked
//     each get silence here (and the truth on the Notifications screen the
//     person went looking for) rather than a button that does nothing.
//   • It never announces a message you just read. The signal is on GROWTH
//     only, which is `inAppSignal`'s whole job.
import React, { useCallback, useEffect, useState } from 'react';
import { onAuthChange } from '../lib/supabase.js';
import { pushStatus } from '../lib/push-subscribe.js';
import { useVapidPublicKey } from '../lib/push-key.js';
import { messageLandingHere } from '../lib/app-doors.js';
import {
  DM_UNREAD_EVENT, readinessFrom, shouldOfferNotifications, inAppSignal, arrivalText,
} from '../lib/notify-readiness.js';
import PushNotifications from './PushNotifications.jsx';

/** How long the arrival pill stays before it steps out of the way. Long enough
 *  to be read and tapped on a phone; short enough that it never becomes
 *  furniture the eye stops seeing. */
export const ARRIVAL_VISIBLE_MS = 9000;

export const SNOOZE_KEY = 'poetech:notify-offer-dismissed';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

function readSnooze(win) {
  try { return win.localStorage.getItem(SNOOZE_KEY); } catch { return null; }
}
function writeSnooze(win, value) {
  try { win.localStorage.setItem(SNOOZE_KEY, value); } catch { /* a storage-blocked browser still gets the offer next time */ }
}

export default function AppAlerts({
  win = typeof window !== 'undefined' ? window : undefined,
  registration = typeof window !== 'undefined' ? window.__pwaReg : null,
  vapidPublicKey,
  now = () => Date.now(),
}) {
  const resolvedKey = useVapidPublicKey({ skip: vapidPublicKey !== undefined });
  const vapidKey = vapidPublicKey === undefined ? resolvedKey : vapidPublicKey;
  const [signedIn, setSignedIn] = useState(false);
  const [status, setStatus] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [dismissedAt, setDismissedAt] = useState(() => (win ? readSnooze(win) : null));

  // Live browser state, never a saved preference (PushNotifications rule 1).
  const refresh = useCallback(async () => {
    if (!win) return;
    setStatus(await pushStatus({ registration, win }));
  }, [registration, win]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => onAuthChange((session) => setSignedIn(!!session)), []);

  // The arrival signal. One listener on the event the app-wide watcher raises,
  // so there is exactly one DM subscription in the page.
  useEffect(() => {
    if (!win || typeof win.addEventListener !== 'function') return undefined;
    const onUnread = (e) => {
      const d = (e && e.detail) || {};
      const sig = inAppSignal(d.prev, d.next, { visible: d.visible });
      if (!sig.show) return;
      setArrival({
        count: sig.count,
        peerUserId: (d.newest && d.newest.peerUserId) || null,
        senderName: (d.newest && d.newest.senderName) || '',
      });
    };
    win.addEventListener(DM_UNREAD_EVENT, onUnread);
    return () => win.removeEventListener(DM_UNREAD_EVENT, onUnread);
  }, [win]);

  // Step out of the way on its own. A pill that must be dismissed by hand
  // becomes something to resent.
  useEffect(() => {
    if (!arrival) return undefined;
    const t = setTimeout(() => setArrival(null), ARRIVAL_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [arrival]);

  const readiness = readinessFrom({
    supported: status ? status.supported : true,
    // `undefined` means the key has not resolved yet — treat it as configured
    // so the offer is not decided on a fact we do not have. '' is the server's
    // real answer that this deployment has no key.
    configured: vapidKey === undefined ? true : !!vapidKey,
    permission: status ? status.permission : 'default',
    subscribed: status ? status.subscribed : false,
  });

  // Only once the browser state has actually been read: rendering an offer
  // from the defaults above would flash it at someone who already has
  // notifications on.
  const offer = !!status && vapidKey !== undefined
    && shouldOfferNotifications(readiness, { signedIn, dismissedAt, now: now() });

  const openThread = () => {
    if (!win || !win.location) return;
    const url = messageLandingHere({
      pathname: win.location.pathname,
      search: win.location.search,
      peerUserId: arrival && arrival.peerUserId,
    });
    setArrival(null);
    try { win.location.assign(url); } catch { win.location.href = url; }
  };

  const dismissOffer = () => {
    const stamp = new Date(now()).toISOString();
    writeSnooze(win, stamp);
    setDismissedAt(stamp);
  };

  if (!arrival && !offer) return null;

  return (
    <>
      {arrival && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md print:hidden"
          data-testid="dm-arrival-layer"
        >
          <div
            className="flex items-center gap-2 border border-[#C9BFA8] bg-[#FAF8F4] px-3 py-2 shadow-lg"
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              onClick={openThread}
              data-testid="dm-arrival-open"
              className="flex-1 text-left text-sm text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              <span className="font-medium">{arrivalText(arrival)}</span>
              <span className="ml-2 text-xs uppercase tracking-wider text-[#B85838]">Open</span>
            </button>
            <button
              type="button"
              onClick={() => setArrival(null)}
              data-testid="dm-arrival-dismiss"
              className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {offer && (
        <div
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[55] w-[calc(100%-1.5rem)] max-w-md print:hidden"
          data-testid="notify-offer-layer"
        >
          <div className="space-y-2 border border-[#C9BFA8] bg-[#FAF8F4] p-3 shadow-lg">
            <p className="text-sm text-[#1A1815]" data-testid="notify-offer-headline">{readiness.headline}</p>
            <p className="text-xs text-[#5A5751]">{readiness.detail}</p>
            <PushNotifications
              topic="message"
              registration={registration}
              vapidPublicKey={vapidKey}
              win={win}
              onChange={() => refresh()}
            />
            <button
              type="button"
              onClick={dismissOffer}
              data-testid="notify-offer-dismiss"
              className={`${BTN} w-full text-[#5A5751] hover:text-[#1A1815]`}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
