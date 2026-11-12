// =============================================================================
// PoeTechPlusButton — get PoeTech+, or manage it once it is yours (DR-1432)
// =============================================================================
// Three honest states, decided by the server and the person's own row:
//   - they hold PoeTech+ (or higher): "PoeTech+ is yours" + Manage (Stripe's
//     portal: card, receipts, cancel);
//   - it is open for sale (GET /api/checkout says so): "Get PoeTech+";
//   - otherwise: one plain line that checkout opens soon and nothing is
//     closed meanwhile (ACCESS_ENFORCEMENT is off until a real purchase is
//     proven end to end, DR-1428).
// It never claims a lock and never charges by itself: the click sends the
// person to Stripe's own page.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { tierMeets } from '../lib/tiers.js';
import { PLUS_TIER, PLUS_LABEL, checkoutOpen, readMemberTier, startPlusCheckout, openPlusPortal, sayCheckoutError } from '../lib/poetech-plus.js';

export default function PoeTechPlusButton({ client = supabase, fetchImpl }) {
  const [open, setOpen] = useState(null);
  const [token, setToken] = useState('');
  const [paid, setPaid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    checkoutOpen({ fetchImpl }).then((v) => alive && setOpen(v));
    Promise.resolve(client && client.auth ? client.auth.getSession() : { data: null })
      .then(({ data }) => {
        const t = (data && data.session && data.session.access_token) || '';
        if (!alive) return;
        setToken(t);
        if (t) readMemberTier(client).then((r) => alive && setPaid(r.ok ? r.tier : null));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [client, fetchImpl]);

  const go = async (fn) => {
    setBusy(true);
    setNote('');
    const loc = typeof window !== 'undefined' ? window.location : {};
    const r = await fn({ token, pathname: loc.pathname, search: loc.search, fetchImpl });
    if (r.url) {
      try {
        window.location.assign(r.url);
      } catch {
        /* the note below still tells the truth */
      }
      return;
    }
    setBusy(false);
    setNote(sayCheckoutError(r.error));
  };

  const btn =
    'inline-block mt-2 px-3 py-1.5 text-[0.6875rem] uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60';

  if (paid && tierMeets(paid, PLUS_TIER)) {
    return (
      <div data-testid="poetech-plus" data-state="member">
        <p className="text-xs text-[#1A1815] mt-2">PoeTech+ is yours. Thank you.</p>
        <button type="button" disabled={busy} onClick={() => go(openPlusPortal)} className={`${btn} border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4]`}>
          Manage or cancel
        </button>
        {note && <p className="text-xs text-[#5A5751] mt-1" role="status">{note}</p>}
      </div>
    );
  }
  if (open) {
    return (
      <div data-testid="poetech-plus" data-state="open">
        <button type="button" disabled={busy} onClick={() => go(startPlusCheckout)} className={`${btn} bg-[#1A1815] text-white border-[#1A1815] hover:bg-[#B85838]`}>
          {busy ? 'Opening checkout…' : `Get ${PLUS_LABEL}`}
        </button>
        <p className="text-[0.6875rem] text-[#5A5751] mt-1">Paid securely through Stripe. Cancel any time from here.</p>
        {note && <p className="text-xs text-[#5A5751] mt-1" role="status">{note}</p>}
      </div>
    );
  }
  if (open === false) {
    return (
      <p data-testid="poetech-plus" data-state="not-open" className="text-[0.6875rem] text-[#5A5751] mt-2">
        PoeTech+ checkout opens soon. Every lesson stays open meanwhile.
      </p>
    );
  }
  return null;
}
