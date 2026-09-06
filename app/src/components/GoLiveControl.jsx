// =============================================================================
// GoLiveControl — the church says it is live, and every opted-in phone hears
// =============================================================================
// Darrell, 2026-09-06: "fix that so users are prompted the sermon is live."
//
// THIS IS THE ONLY THING IN THE APP ALLOWED TO ANNOUNCE A SERVICE, and that is
// the whole design. `church-live.js` computes a `live` flag from a hardcoded
// weekly schedule window and says so in its own header: it cannot truthfully
// detect live state, and painting a LIVE badge would be a fabricated state.
// A badge that is merely wrong is a small thing. The same guess pushed into a
// congregation's pockets — "the service has started" on a Sunday the stream
// never started — is a much larger one, and it is unrecoverable: you cannot
// un-buzz a phone. So the announcement is DECLARED by a person who knows,
// never inferred from a clock.
//
// The declaration writes `church_live_state` with the caller's OWN JWT, and
// that table's RLS restricts writes to the church roster (migration 0171). So
// the roster check is the database's, not a second copy in front-end code that
// could drift from it. A person not on the roster gets a refusal from the same
// policy every other church surface obeys.
//
// UX-PATTERNS: focus ring (2g.1), the 36px house floor (2g.2), words not a
// glyph (2g.3), and a busy control that says what it is doing (2f.3). The
// destructive-ish act here is the ANNOUNCE, so it states plainly who it will
// reach before it is pressed rather than after (2g.4's spirit).
import React, { useState } from 'react';
import { announceLive } from '../lib/push-announce.js';
import UiIcon from './UiIcon.jsx';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

export const GO_LIVE_REFUSAL = {
  'signed-out': 'Sign in first — the announcement is sent as you.',
  forbidden: 'Only someone on this church’s roster can announce a service.',
  'not-configured': 'Notifications are not set up for this site yet, so nothing was sent.',
  unreachable: 'Could not reach the notifier. The live state may not have been recorded — try again.',
  'missing-church': 'No church is selected, so there is nothing to announce.',
  'no-fetch': 'This browser cannot send the announcement.',
};

export default function GoLiveControl({
  instanceId,
  churchId,
  churchName,
  serviceLabel,
  videoId,
  announce = announceLive,
  onResult,
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const go = async () => {
    setBusy(true);
    setNote('');
    try {
      const r = await announce({ instanceId, churchId, churchName, serviceLabel, videoId });
      if (r && r.ok) {
        // Report the MEASURED outcome, not "sent". The sender counts devices,
        // and "we told 0 phones" is a materially different fact from "we told
        // 40" — an operator who is not told the difference will believe the
        // announcement worked when nobody was subscribed.
        if (r.deduped) setNote('Already announced — nobody was notified twice.');
        else if (typeof r.succeeded === 'number') {
          setNote(r.succeeded === 0
            ? 'Live state recorded. No devices are signed up for alerts yet, so no phones were notified.'
            : `Live state recorded. Notified ${r.succeeded} device${r.succeeded === 1 ? '' : 's'}${r.failed ? `, ${r.failed} could not be reached` : ''}.`);
        } else setNote('Live state recorded.');
      } else {
        setNote(GO_LIVE_REFUSAL[r && r.reason] || 'That did not work. Try again in a moment.');
      }
      if (onResult) onResult(r);
    } catch {
      setNote('That did not work. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  // Nothing to announce without a church — render nothing rather than a button
  // that cannot work.
  if (!instanceId || !churchId) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={go}
        className={`${BTN} w-full border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-60`}
      >
        <UiIcon name="alert" /> {busy ? 'Announcing…' : 'We are live — tell the congregation'}
      </button>
      <p className="text-xs text-[#5A5751]">
        Sends one notification to every person who asked to be told when a service starts. Announcing twice for the same service does not notify anyone twice.
      </p>
      {note && <p className="text-xs text-[#5A5751]" role="status">{note}</p>}
    </div>
  );
}
