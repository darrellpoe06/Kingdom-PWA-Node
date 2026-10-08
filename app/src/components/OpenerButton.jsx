// =============================================================================
// OpenerButton — the garage door (and any other opener) in the header row
// =============================================================================
// Darrell 2026-10-08: "Let's add the garage door opener and any system opener
// to the header in PoeTech App... so if your listening to you lesson as you
// drive when you get home the garage door opener button is there for easy
// access... make sense?"
//
// It lives in the header because that is where his thumb already is when a
// lesson is playing in the car. Everything that decides whether a press is
// allowed, how long the hold is, and how an answer is read lives in
// lib/openers.js, so it is measured rather than clicked (DR-0076).
//
// THREE THINGS THIS COMPONENT REFUSES TO DO:
//   * render for a device nobody registered (no row -> no button, DR-0061);
//   * open on a tap (it is a HOLD; letting go early sends nothing);
//   * say a door opened when nothing confirmed it (an unanswered press reads
//     "did not answer", and tells him to look before he drives away).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import {
  openersFrom, openerToOffer, saveLastOpener, loadLastOpener,
  holdProgress, holdComplete, pressAllowed, pressBody, readPressResult,
  describeOpener, HOLD_MS, PRESS_PATH,
} from '../lib/openers.js';
import { noteUse } from '../lib/usage-events.js';

export default function OpenerButton({ rows = null, fetchImpl = null }) {
  const openers = openersFrom(rows);
  const [chosen, setChosen] = useState(() => loadLastOpener());
  const offer = openerToOffer(openers, chosen);

  const [progress, setProgress] = useState(0);
  const [sentAt, setSentAt] = useState(0);
  const [lastPressAt, setLastPressAt] = useState(0);
  const [said, setSaid] = useState('');
  const timer = useRef(null);

  const clearTimer = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  useEffect(() => clearTimer, []);

  const send = useCallback(async (opener) => {
    const gate = pressAllowed({
      opener,
      lastPressAt,
      inFlight: !!sentAt,
      online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    });
    if (!gate.ok) { setSaid(gate.why); return; }
    const at = Date.now();
    setSentAt(at);
    setLastPressAt(at);
    setSaid('Pressing…');
    noteUse('opener.press');
    try {
      const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
      if (!f) { setSaid(readPressResult(null).text); return; }
      const r = await f(PRESS_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(pressBody(opener)),
      });
      let payload = null;
      try { payload = await r.json(); } catch { payload = null; }
      setSaid(readPressResult(r && r.ok ? payload : null).text);
    } catch {
      setSaid(readPressResult(null).text);
    } finally {
      setSentAt(0);
    }
  }, [fetchImpl, lastPressAt, sentAt]);

  const cancelHold = useCallback(() => {
    clearTimer();
    setProgress(0);
  }, []);

  const beginHold = useCallback(() => {
    if (!offer) return;
    const at = Date.now();
    setProgress(0);
    setSaid('');
    clearTimer();
    timer.current = setInterval(() => {
      const p = holdProgress({ startedAt: at });
      setProgress(p);
      if (holdComplete({ startedAt: at })) {
        clearTimer();
        setProgress(0);
        send(offer);
      }
    }, 40);
  }, [offer, send]);

  // NOTHING IS PAINTED. No registered opener, no button at all.
  if (!offer) return null;

  const busy = !!sentAt;
  const label = describeOpener(offer);

  return (
    <div
      data-testid="opener-control"
      className="ts-chrome-region shrink-0 self-stretch flex items-center border-l border-[#E8E4DC]"
    >
      <button
        type="button"
        data-testid="opener-press"
        data-opener={offer.id}
        data-hold={progress ? progress.toFixed(2) : '0'}
        aria-label={`Hold to press ${offer.name}. ${label}.`}
        title={`Hold to press ${offer.name} (${Math.round(HOLD_MS / 100) / 10}s)`}
        disabled={busy}
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginHold(); } }}
        onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cancelHold(); } }}
        className="relative min-h-[44px] min-w-[44px] px-3 flex items-center gap-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#E8E4DC] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 whitespace-nowrap"
      >
        {/* The hold, filling. Letting go before it is full sends nothing. */}
        <span
          aria-hidden="true"
          data-testid="opener-hold-fill"
          className="absolute inset-y-0 left-0 bg-[#E8E4DC] pointer-events-none"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
        <span className="relative flex items-center gap-1.5">
          <UiIcon name="home" />
          {busy ? 'Pressing' : offer.name}
        </span>
      </button>
      {/* ANY SYSTEM OPENER (Darrell 2026-10-08: "the garage door opener and any
          system opener"). With one opener there is nothing to choose and no
          picker is drawn; with more, this names them and remembers the pick on
          this device so the next drive home starts on the right one. */}
      {openers.length > 1 ? (
        <select
          data-testid="opener-pick"
          aria-label="Which opener the button presses"
          value={offer.id}
          onChange={(e) => { setChosen(e.target.value); saveLastOpener(e.target.value); setSaid(''); }}
          className="min-h-[44px] bg-transparent border-l border-[#E8E4DC] px-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {openers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      ) : null}
      {/* What actually happened, in words, for a driver who cannot read a colour. */}
      <span data-testid="opener-said" role="status" aria-live="polite" className="sr-only">{said}</span>
    </div>
  );
}
