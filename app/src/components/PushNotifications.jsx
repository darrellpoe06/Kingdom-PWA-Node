// =============================================================================
// PushNotifications — the control that turns a phone on, and always back off
// =============================================================================
// Darrell, 2026-09-06: "fix that so users are prompted the sermon is live...
// and also to notifications from users who text us."
//
// The surface for DR-0334. The plumbing (subscribe, encrypt, send) was built
// and tested first; this is the part a person actually touches.
//
// UX-PATTERNS conformance (read before designing, per CLAUDE.md):
//   • 2g.1 — every styled button carries `focus:outline`.
//   • 2g.2 — `min-h-[36px]`, the enforced house floor (1.5x the WCAG 2.2 AA
//     24px legal minimum).
//   • 2g.3 — no glyph-only button; every control carries words.
//   • 2f.3 — a disabled control says what it is waiting for: the button states
//     "Turning on…" / "Turning off…" while busy rather than greying in silence.
//
// FOUR RULES THIS COMPONENT KEEPS, each one a way this class of control usually
// goes wrong:
//
//   1. IT RENDERS LIVE STATE, NOT A SAVED PREFERENCE. `pushStatus()` asks the
//      browser whether a subscription genuinely exists right now. A toggle that
//      reads a stored "notifications: on" flag will cheerfully say ON after the
//      browser rotated or dropped the subscription — telling someone they are
//      covered when they are not is worse than telling them nothing
//      (Reality-Trace P15).
//   2. IT NEVER PROMPTS ON ITS OWN. `Notification.requestPermission()` fires
//      only from the button press. A prompt on page load is how an origin gets
//      permanently DENIED, after which nothing we ship can reach that person.
//   3. A DENIED BROWSER GETS THE TRUTH, NOT A DEAD BUTTON. Once denied, the
//      browser will not re-ask, so we say so and point at the only thing that
//      works — the site settings — rather than offering a button that silently
//      does nothing.
//   4. WHEN PUSH IS NOT CONFIGURED, IT RENDERS NOTHING. Absent VAPID keys the
//      honest state is "this is not set up here", and a button that cannot
//      possibly work is a lie in the shape of a control.
import React, { useCallback, useEffect, useState } from 'react';
import { supabase as defaultSupabase } from '../lib/supabase.js';
import { getInstanceId } from '../lib/table-sync.js';
import {
  enablePush, disablePush, pushStatus, PUSH_TOPICS,
} from '../lib/push-subscribe.js';
import UiIcon from './UiIcon.jsx';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

/** Why a refusal happened, in words a person can act on. */
export const REFUSAL_TEXT = {
  denied: 'Your browser is blocking notifications for this site. Turn them back on in your browser’s site settings — we cannot ask again from here.',
  dismissed: 'No problem. You can turn this on any time.',
  unsupported: 'This browser cannot show notifications.',
  'no-service-worker': 'The app is still starting up. Try again in a moment.',
  'not-signed-in': 'Sign in first, so we know which device is yours.',
  'subscribe-failed': 'Your browser could not reach its notification service. Try again in a moment.',
  'save-failed': 'We could not save this device. Try again in a moment.',
};

export default function PushNotifications({
  topic = 'message',
  prompt,
  supabase = defaultSupabase,
  registration = typeof window !== 'undefined' ? window.__pwaReg : null,
  vapidPublicKey = typeof import.meta !== 'undefined' ? (import.meta.env || {}).VITE_VAPID_PUBLIC_KEY : '',
  resolveInstanceId = getInstanceId,
  win = typeof window !== 'undefined' ? window : undefined,
  onChange,
}) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  // A browser subscription can exist while the SERVER has never heard of it —
  // `subscribe()` succeeded and the save then failed. The browser is therefore
  // "subscribed" and the person will still NOT be notified, because no row
  // exists for the sender to reach. Rendering ON there would be the exact lie
  // this component exists to avoid, so a failed save suppresses the ON state
  // and keeps offering the retry until a save actually lands.
  const [unsaved, setUnsaved] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(await pushStatus({ registration, win }));
  }, [registration, win]);

  useEffect(() => { refresh(); }, [refresh]);

  // The service worker tells the page when the browser rotated the
  // subscription, so the control stops claiming ON after it silently lapsed.
  useEffect(() => {
    const sw = win && win.navigator ? win.navigator.serviceWorker : null;
    if (!sw || typeof sw.addEventListener !== 'function') return undefined;
    const onMessage = (e) => {
      if (e && e.data && e.data.type === 'PUSH_SUBSCRIPTION_CHANGED') refresh();
    };
    sw.addEventListener('message', onMessage);
    return () => sw.removeEventListener('message', onMessage);
  }, [win, refresh]);

  const turnOn = async () => {
    setBusy(true);
    setNote('');
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data && data.user ? data.user.id : null;
      const instanceId = userId ? await resolveInstanceId() : null;
      const out = await enablePush({
        registration, supabase, vapidPublicKey, instanceId, userId,
        topics: PUSH_TOPICS.includes(topic) ? [topic] : PUSH_TOPICS, win,
      });
      if (!out.ok) setNote(REFUSAL_TEXT[out.reason] || 'That did not work. Try again in a moment.');
      setUnsaved(!out.ok && out.reason === 'save-failed');
      await refresh();
      if (onChange) onChange(out);
    } catch {
      setNote('That did not work. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    setNote('');
    try {
      const out = await disablePush({ registration, supabase });
      // push-subscribe tears down the browser subscription even when the row
      // delete fails, so this reports honestly rather than pretending the stop
      // did not happen.
      setUnsaved(false);
      if (out.rowDeleted === false && out.error) {
        setNote('Notifications are off on this device. We could not reach the server to forget it, so it may take one more try to clear.');
      }
      await refresh();
      if (onChange) onChange(out);
    } finally {
      setBusy(false);
    }
  };

  // Not configured, unsupported, or not yet resolved: render nothing rather
  // than a control that cannot work.
  if (!vapidPublicKey) return null;
  if (!status || !status.supported) return null;

  if (status.permission === 'denied') {
    return (
      <p className="text-xs text-[#5A5751]" role="status">
        <UiIcon name="alert" /> {REFUSAL_TEXT.denied}
      </p>
    );
  }

  const label = prompt || (topic === 'live'
    ? 'Tell me when a service goes live'
    : 'Tell me when someone messages me');

  // The browser's subscription is only meaningful if the server also has it.
  const on = status.subscribed && !unsaved;

  return (
    <div className="space-y-1">
      {on ? (
        <button
          type="button"
          disabled={busy}
          onClick={turnOff}
          className={`${BTN} w-full border border-[#C9BFA8] text-[#1A1815] hover:border-[#1A1815] disabled:opacity-60`}
        >
          <UiIcon name="alert" /> {busy ? 'Turning off…' : 'Notifications on — turn off'}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={turnOn}
          className={`${BTN} w-full border border-dashed border-[#C9BFA8] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] disabled:opacity-60`}
        >
          <UiIcon name="alert" /> {busy ? 'Turning on…' : label}
        </button>
      )}
      {note && <p className="text-xs text-[#5A5751]" role="status">{note}</p>}
    </div>
  );
}
