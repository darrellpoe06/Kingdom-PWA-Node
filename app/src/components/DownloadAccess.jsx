// =============================================================================
// DownloadAccess — the paid door on every lesson download (DR-1652)
// =============================================================================
// Darrell 2026-11-24: "Don't allow any lesson to be downloaded... we will now
// be charging a fee or if they have a subscription they can."
//
// One provider at the top of Learn decides, once, whether this person may take
// lessons away (lib/lesson-download-access.js): PoeTech+ or higher, or the
// one-time Download Pass. Every download door (a lesson, a course, every
// lesson, Copy lesson, the curriculum export) reads the same answer, so no
// door can disagree with another. Reading and ▶ Play are never behind it.
//
// FAIL CLOSED. With no provider above it, a door reads 'unknown' and stays
// shut; it never opens by default. It is never blank either: every state says
// what it sees and the way through (P15 / DR-0381), opened in place at the
// door that was pressed (UX-PATTERNS principle 6, inline, no jumping).
// =============================================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { PLUS_LABEL, startPlusCheckout, sayCheckoutError } from '../lib/poetech-plus.js';
import DownloadNeedsAccount from './DownloadNeedsAccount.jsx';
import {
  ACCESS,
  downloadAccess,
  tierAllowsDownloads,
  readDownloadPass,
  readDownloadOffers,
  startDownloadPassCheckout,
  sayPassError,
} from '../lib/lesson-download-access.js';

export const DOWNLOAD_IS_PAID = 'Downloading a lesson is part of PoeTech+, or a one-time Download Pass. Reading and ▶ Play stay free for everyone.';
export const DOWNLOAD_CHECK_FAILED = 'Your plan could not be checked just now, so downloads stay shut. Reading and ▶ Play stay free for everyone.';

const Ctx = createContext({ access: ACCESS.UNKNOWN, recheck: () => {}, client: null, fetchImpl: undefined });

/**
 * signedIn / userTier come from the shell. `forceAccess` pins the answer
 * (tests, previews); `client` / `fetchImpl` are injectable.
 */
export function DownloadAccessProvider({ signedIn = false, userTier = 'foundation', forceAccess = null, client = supabase, fetchImpl, children }) {
  const [read, setRead] = useState(null);
  const [nonce, setNonce] = useState(0);
  const needRead = !forceAccess && signedIn && !tierAllowsDownloads(userTier);

  useEffect(() => {
    if (!needRead) return undefined;
    let alive = true;
    setRead(null);
    Promise.resolve(readDownloadPass(client))
      .then((r) => {
        if (alive) setRead(r);
      })
      .catch(() => {
        if (alive) setRead({ ok: false, productIds: [] });
      });
    return () => {
      alive = false;
    };
  }, [needRead, client, nonce]);

  const recheck = useCallback(() => setNonce((n) => n + 1), []);
  const access = forceAccess || downloadAccess({ signedIn, userTier, read });
  const value = useMemo(() => ({ access, recheck, client, fetchImpl }), [access, recheck, client, fetchImpl]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Wrap a surface (Learn) so every download door inside reads one answer. */
export function withDownloadAccess(Component) {
  function WithDownloadAccess(props) {
    return (
      <DownloadAccessProvider signedIn={props.signedIn !== false} userTier={props.userTier || 'foundation'}>
        <Component {...props} />
      </DownloadAccessProvider>
    );
  }
  WithDownloadAccess.displayName = `withDownloadAccess(${Component.displayName || Component.name || 'Component'})`;
  return WithDownloadAccess;
}

export function useDownloadAccess() {
  return useContext(Ctx);
}

const BTN =
  'text-[0.625rem] uppercase tracking-wider px-2.5 py-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] disabled:opacity-60';
const SERIF = { fontFamily: '"Fraunces", serif' };

/** Where a download would be, for a signed-in reader without PoeTech+ or the pass. */
export function DownloadNeedsPurchase({ label = 'Download', compact = false }) {
  const { access, recheck, client, fetchImpl } = useDownloadAccess();
  const [open, setOpen] = useState(!compact);
  const [offers, setOffers] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || offers) return undefined;
    let alive = true;
    readDownloadOffers({ fetchImpl }).then((o) => {
      if (alive) setOffers(o);
    });
    return () => {
      alive = false;
    };
  }, [open, offers, fetchImpl]);

  const go = async (start, say) => {
    setBusy(true);
    setNote('');
    let token;
    try {
      const { data } = client && client.auth ? await client.auth.getSession() : { data: null };
      token = (data && data.session && data.session.access_token) || '';
    } catch {
      token = '';
    }
    const loc = typeof window !== 'undefined' ? window.location : {};
    const r = await start({ token, pathname: loc.pathname, search: loc.search, fetchImpl });
    if (r.url) {
      try {
        window.location.assign(r.url);
      } catch {
        /* the note below still tells the truth */
      }
      return;
    }
    setBusy(false);
    setNote(say(r.error));
  };

  if (access === ACCESS.CHECKING) {
    return (
      <span data-testid="download-access-checking" role="status" className="inline-block text-[0.6875rem] text-[#5A5751] py-2" style={SERIF}>
        {label}: checking your plan…
      </span>
    );
  }

  const unknown = access === ACCESS.UNKNOWN;
  const toggle = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      title={unknown ? DOWNLOAD_CHECK_FAILED : DOWNLOAD_IS_PAID}
      data-testid="download-needs-purchase"
      className={`${BTN} border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`}
    >
      {label}: {unknown ? 'check your plan' : 'PoeTech+ or pass'}
    </button>
  );
  return (
    <span className={compact ? 'inline-block' : 'block'}>
      {compact && toggle}
      {open && (
        <span data-testid="download-purchase-panel" className="block mt-2 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <span className="block text-[0.75rem] text-[#1A1815]" style={SERIF}>
            {unknown ? DOWNLOAD_CHECK_FAILED : DOWNLOAD_IS_PAID}
          </span>
          <span className="flex flex-wrap gap-2 mt-2">
            {offers && offers.plus && (
              <button
                type="button"
                disabled={busy}
                data-testid="download-get-plus"
                onClick={() => go(startPlusCheckout, sayCheckoutError)}
                className={`${BTN} bg-[#1A1815] text-white border-[#1A1815] hover:bg-[#B85838]`}
              >
                {busy ? 'Opening checkout…' : `Get ${PLUS_LABEL}`}
              </button>
            )}
            {offers && offers.pass && (
              <button
                type="button"
                disabled={busy}
                data-testid="download-buy-pass"
                onClick={() => go(startDownloadPassCheckout, sayPassError)}
                className={`${BTN} border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`}
              >
                Buy the Download Pass
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              data-testid="download-recheck"
              onClick={recheck}
              className={`${BTN} border-[#5A5751] text-[#5A5751] hover:bg-[#5A5751] hover:text-white`}
            >
              {unknown ? 'Check again' : 'I already paid: check again'}
            </button>
          </span>
          {offers && !offers.plus && !offers.pass && (
            <span data-testid="download-checkout-not-open" className="block text-[0.6875rem] text-[#5A5751] mt-2" style={SERIF}>
              Checkout opens soon. Nothing is charged until it does.
            </span>
          )}
          {offers && (offers.plus || offers.pass) && (
            <span className="block text-[0.6875rem] text-[#5A5751] mt-2" style={SERIF}>
              Paid securely through Stripe&apos;s own page.
            </span>
          )}
          {note && (
            <span role="status" className="block text-[0.6875rem] text-[#5A5751] mt-2">
              {note}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * The one gate every download door uses: signed out -> the account prompt;
 * not entitled -> the purchase prompt; entitled -> the door itself.
 */
export function DownloadGate({ label = 'Download', compact = false, children }) {
  const { access } = useDownloadAccess();
  if (access === ACCESS.SIGN_IN) return <DownloadNeedsAccount compact={compact} label={label} />;
  if (access !== ACCESS.ALLOWED) return <DownloadNeedsPurchase compact={compact} label={label} />;
  return <>{children}</>;
}
