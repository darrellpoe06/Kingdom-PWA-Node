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
  requestLessonCopy,
  readDownloadsOpen,
  setDownloadsOpen,
} from '../lib/lesson-download-access.js';

export const DOWNLOAD_IS_PAID = 'Downloading a lesson is part of PoeTech+, or a one-time Download Pass. Reading and ▶ Play stay free for everyone.';
export const DOWNLOADS_CLOSED = 'Downloads are closed right now. Reading and ▶ Play stay free for everyone. You can ask the administration for a copy.';
export const DOWNLOAD_CHECK_FAILED = 'Your plan could not be checked just now, so downloads stay shut. Reading and ▶ Play stay free for everyone.';

const Ctx = createContext({ access: ACCESS.UNKNOWN, recheck: () => {}, client: null, fetchImpl: undefined });

/**
 * signedIn / userTier come from the shell. `forceAccess` pins the answer
 * (tests, previews); `client` / `fetchImpl` are injectable.
 */
export function DownloadAccessProvider({
  signedIn = false,
  userTier = 'foundation',
  forceAccess = null,
  open: openProp,
  client = supabase,
  fetchImpl,
  children,
}) {
  const [read, setRead] = useState(null);
  const [nonce, setNonce] = useState(0);
  // DR-1656: the switch is read from the database unless a caller (a test)
  // states it. Until the database answers true, downloads are closed.
  const [switchRead, setSwitchRead] = useState(null);
  const [switchNonce, setSwitchNonce] = useState(0);
  const live = openProp === undefined;
  useEffect(() => {
    if (!live) return undefined;
    let alive = true;
    Promise.resolve(readDownloadsOpen(client)).then((r) => {
      if (alive) setSwitchRead(r);
    });
    return () => {
      alive = false;
    };
  }, [live, client, switchNonce]);
  const open = live ? !!(switchRead && switchRead.ok && switchRead.open === true) : openProp;
  const closed = open !== true;
  const needRead = !forceAccess && !closed && signedIn && !tierAllowsDownloads(userTier);

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
  const recheckSwitch = useCallback(() => setSwitchNonce((n) => n + 1), []);
  const access = forceAccess || downloadAccess({ signedIn, userTier, read, open });
  const switchState = live ? (switchRead ? (switchRead.ok ? (switchRead.open ? 'open' : 'closed') : 'unknown') : 'checking') : open ? 'open' : 'closed';
  const value = useMemo(
    () => ({ access, recheck, client, fetchImpl, switchState, recheckSwitch }),
    [access, recheck, client, fetchImpl, switchState, recheckSwitch]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Wrap a surface (Learn) so every download door inside reads one answer. */
export function withDownloadAccess(Component) {
  function WithDownloadAccess(props) {
    return (
      <DownloadAccessProvider signedIn={props.signedIn !== false} userTier={props.userTier || 'foundation'} open={props.downloadsOpen}>
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
/**
 * Downloads switched off (DR-1655): no one takes a lesson away; the door says
 * so and offers to ask the administration for a copy, on the feedback pipe.
 */
export function DownloadsClosed({ label = 'Download', compact = false, request = requestLessonCopy }) {
  const [open, setOpen] = useState(!compact);
  const [state, setState] = useState('idle'); // idle | sending | sent | sign-in | failed
  const ask = async () => {
    setState('sending');
    const where = typeof window !== 'undefined' && window.location ? window.location.href : '';
    const r = await request({ what: label === 'Download' ? 'this lesson' : `${label.toLowerCase()} (this lesson)`, where });
    setState(r && r.ok ? 'sent' : (r && r.why) || 'failed');
  };
  const say = {
    sent: 'Your request was sent to the administration.',
    'sign-in': 'Sign in to ask the administration for a copy.',
    failed: 'The request did not send. Try again in a moment.',
  }[state];
  return (
    <span className={compact ? 'inline-block' : 'block'}>
      {compact && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={DOWNLOADS_CLOSED}
          data-testid="downloads-closed"
          className={`${BTN} border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`}
        >
          {label}: closed
        </button>
      )}
      {open && (
        <span data-testid="downloads-closed-panel" className="block mt-2 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <span className="block text-[0.75rem] text-[#1A1815]" style={SERIF}>
            {DOWNLOADS_CLOSED}
          </span>
          <span className="flex flex-wrap gap-2 mt-2 items-center">
            <button
              type="button"
              disabled={state === 'sending' || state === 'sent'}
              data-testid="request-copy"
              onClick={ask}
              className={`${BTN} bg-[#1A1815] text-white border-[#1A1815] hover:bg-[#B85838]`}
            >
              {state === 'sending' ? 'Sending…' : state === 'sent' ? 'Request sent' : 'Ask the administration for a copy'}
            </button>
            {say && (
              <span role="status" className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>
                {say}
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
}

export function DownloadNeedsPurchase({ label = 'Download', compact = false }) {
  const { access, recheck, client, fetchImpl } = useDownloadAccess();
  if (access === ACCESS.CLOSED) return <DownloadsClosed label={label} compact={compact} />;
  return <DownloadNeedsPurchaseOpen label={label} compact={compact} access={access} recheck={recheck} client={client} fetchImpl={fetchImpl} />;
}

function DownloadNeedsPurchaseOpen({ label, compact, access, recheck, client, fetchImpl }) {
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
  if (access === ACCESS.CLOSED) return <DownloadsClosed compact={compact} label={label} />;
  if (access === ACCESS.SIGN_IN) return <DownloadNeedsAccount compact={compact} label={label} />;
  if (access !== ACCESS.ALLOWED) return <DownloadNeedsPurchase compact={compact} label={label} />;
  return <>{children}</>;
}

/**
 * THE DOWNLOADS SWITCH, in the app (DR-1656). Shown to the Governor only; the
 * database refuses anyone else (set_downloads_open, 0344). It says where the
 * switch stands as the database answered, and never claims a flip that did
 * not land.
 */
export function DownloadsSwitch({ flip = setDownloadsOpen }) {
  const { client, switchState, recheckSwitch } = useDownloadAccess();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const isOpen = switchState === 'open';
  const go = async () => {
    setBusy(true);
    setNote('');
    const r = await flip(client, !isOpen);
    setBusy(false);
    if (r && r.ok) {
      setNote(r.open ? 'Downloads are open. PoeTech+ and Download Pass holders can download.' : 'Downloads are closed for everyone.');
    } else {
      setNote(r && r.why === 'not-governor' ? 'Only the Governor can change this.' : 'The switch did not answer, so nothing changed. Try again in a moment.');
    }
    recheckSwitch();
  };
  const where = { open: 'Open', closed: 'Closed', checking: 'Checking…', unknown: 'Could not be read (treated as closed)' }[switchState] || 'Closed';
  return (
    <span data-testid="downloads-switch" className="block border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-3">
      <span className="block text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Downloads switch · Governor only</span>
      <span className="block text-[0.8125rem] text-[#1A1815] mt-1" style={SERIF}>
        Downloads are <strong data-testid="downloads-switch-state">{where}</strong>. When closed, no one can download, copy or export a lesson, at any tier;
        they can ask the administration for a copy.
      </span>
      <span className="flex flex-wrap gap-2 mt-2 items-center">
        <button
          type="button"
          disabled={busy || switchState === 'checking'}
          onClick={go}
          data-testid="downloads-switch-flip"
          className={`${BTN} bg-[#1A1815] text-white border-[#1A1815] hover:bg-[#B85838]`}
        >
          {busy ? 'Saving…' : isOpen ? 'Close downloads' : 'Open downloads'}
        </button>
        {note && (
          <span role="status" className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>
            {note}
          </span>
        )}
      </span>
    </span>
  );
}
