// =============================================================================
// HomeAccounts — "Your home servers: your logins, ready" (Big Picture, DR-1121)
// =============================================================================
// Darrell 2026-10-19: "Your do everything so users can just use them... End to
// end workflows". A signed-in family member sees, for each home server, whether
// it is live (its own /health, verbatim), their own login made for them by the
// NAS, the first password once (Copy, then "I have it" clears it), the server
// to point the app at, and where to get the app. Nothing to set up on the
// server side ever shows here, because there is nothing to set up.
//
// Reality-trace: the rows are home_accounts (0303), written by the NAS loop
// after the account exists on the server; RLS lets a person read only their
// own. Fail-quiet like every NAS surface: no session, or no family key on this
// device and no rows → render nothing. Rows missing while the key is here →
// "being made on the NAS", which is the true state for up to one cycle.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { HOME_SERVICES, homeServersHealth, fetchHomeAccounts, markSeen, accountFor, KEY_HEADER } from '../lib/home-accounts.js';
import { bridgeToken, hasBridgeToken } from '../lib/nas-photos.js';
import { provisionBridgeToken } from '../lib/bridge-provision.js';
import { supabase } from '../lib/supabase.js';

const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const btnCls = 'min-h-[36px] px-3 text-[0.6875rem] uppercase tracking-wider border border-[#1A1815] bg-white text-[#1A1815] disabled:text-[#5A5751] disabled:border-[#C9C2B6] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#1A1815]';

function statusText(h) {
  if (!h || h.state === 'checking') return 'Checking…';
  if (h.state === 'live') return `Live on the NAS${h.version ? ` · v${h.version}` : ''}${h.note ? ` · ${h.note}` : ''}`;
  return `Not ready: ${h.reason}`;
}

export default function HomeAccounts({ client = supabase, fetchImpl, clipboard = (typeof navigator !== 'undefined' ? navigator.clipboard : null) }) {
  const [signedIn, setSignedIn] = useState(null);
  const [rows, setRows] = useState([]);
  const [health, setHealth] = useState({});
  const [said, setSaid] = useState({});

  useEffect(() => {
    let live = true;
    (async () => {
      let session;
      try { session = (await client?.auth?.getSession?.())?.data?.session || null; } catch { session = null; }
      if (!live) return;
      setSignedIn(!!session);
      if (!session) return;
      provisionBridgeToken(client);
      const [r, h] = await Promise.all([fetchHomeAccounts(client), homeServersHealth(fetchImpl ? { fetchImpl } : undefined)]);
      if (!live) return;
      setRows(r);
      setHealth(h);
    })();
    return () => { live = false; };
  }, [client, fetchImpl]);

  if (!signedIn) return null;
  if (!rows.length && !hasBridgeToken()) return null;

  async function copy(service, what, value) {
    if (!value || !clipboard || typeof clipboard.writeText !== 'function') { setSaid((s) => ({ ...s, [service]: 'The browser would not copy it; type it from the screen.' })); return; }
    try { await clipboard.writeText(value); setSaid((s) => ({ ...s, [service]: `${what} copied.` })); }
    catch { setSaid((s) => ({ ...s, [service]: 'The browser would not copy it; type it from the screen.' })); }
  }

  async function haveIt(service) {
    const ok = await markSeen(client, service);
    if (ok) setRows((rs) => rs.map((r) => (r.service === service ? { ...r, initial_password: null, seen_at: new Date().toISOString() } : r)));
    setSaid((s) => ({ ...s, [service]: ok ? 'Noted. The first password is no longer shown anywhere.' : 'Could not note it right now; the password stays shown.' }));
  }

  return (
    <section className="mt-6 border border-[#1A1815] p-4" aria-labelledby="home-accounts-title">
      <h3 id="home-accounts-title" className="text-base text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Your home servers: your logins, ready</h3>
      <p className="mt-1 text-[0.75rem] text-[#5A5751]">The house makes your account on each server by itself. Install the app, sign in with the login shown, and change the first password when it asks.</p>
      <ul className="mt-3 space-y-3">
        {HOME_SERVICES.map((svc) => {
          const row = accountFor(rows, svc.id);
          const h = health[svc.id];
          return (
            <li key={svc.id} className="border border-[#E8E4DC] p-3" aria-label={`${svc.name} (${svc.app})`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-sm text-[#1A1815]">{svc.name} <span className="text-[#5A5751]">· {svc.app}</span></div>
                <span role="status" className="text-[0.6875rem] text-[#5A5751]">{statusText(h)}</span>
              </div>
              <p className="mt-1 text-[0.75rem] text-[#5A5751]">{svc.what}.</p>
              {!row && <p className="mt-2 text-[0.75rem] text-[#1A1815]">Your login is being made on the NAS; it appears here within a cycle (about 15 minutes) of the server coming up.</p>}
              {row && (
                <div className="mt-2 grid gap-1 text-[0.75rem] text-[#1A1815]">
                  <div><span className={labelCls}>Login</span> <code>{row.login}</code></div>
                  <div><span className={labelCls}>Server</span> <code className="break-all">{row.server_url}</code> <button type="button" className={`${btnCls} ml-1`} onClick={() => copy(svc.id, 'Server', row.server_url)}>Copy</button></div>
                  {row.header_name && (
                    <div><span className={labelCls}>Header</span> <code>{row.header_name}</code> = the family key <button type="button" className={`${btnCls} ml-1`} disabled={!hasBridgeToken()} onClick={() => copy(svc.id, 'Family key', bridgeToken())}>Copy the family key</button></div>
                  )}
                  {row.initial_password ? (
                    <div><span className={labelCls}>First password</span> <code>{row.initial_password}</code> <button type="button" className={`${btnCls} ml-1`} onClick={() => copy(svc.id, 'Password', row.initial_password)}>Copy</button> <button type="button" className={`${btnCls} ml-1`} onClick={() => haveIt(svc.id)}>I have it</button></div>
                  ) : (
                    <div className="text-[#5A5751]">First password: {row.seen_at ? 'noted, no longer shown.' : 'the account already existed; your own password stands.'}</div>
                  )}
                  <div className="text-[#5A5751]">{svc.howToReach}{' '}<a className="underline text-[#1A1815]" href={svc.getApp} target="_blank" rel="noopener noreferrer">Get the {svc.app} app</a></div>
                </div>
              )}
              {said[svc.id] && <p role="status" className="mt-1 text-[0.6875rem] text-[#5A5751]">{said[svc.id]}</p>}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[0.6875rem] text-[#5A5751]">Photos use the header <code>{KEY_HEADER}</code>; Video and Audio need no header and live on the house network and Tailscale only.</p>
    </section>
  );
}
