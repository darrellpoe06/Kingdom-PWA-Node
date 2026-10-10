// =============================================================================
// CameraAccess — a door's cameras are asked for, and given to whoever the
// family chooses (DR-0904, migration 0266)
// =============================================================================
// Darrell, 2026-10-10: "I want the camera to be there for users needing to
// login and request for certain ones... like the porch... we can just give new
// tenants and 1099 workers.. and Airbnb guests... whoever we want to... make
// sense?!!!!!"
//
// CameraAccessDesk is the family's: which cameras a door offers, the asks
// waiting, give access to anyone (a person with no account gets a LINK to
// text), and who holds access now, each with Take back. Every grant is minted
// on the NAS (DR-0778) — a per-person token for those cameras, for those days
// — and its row in door_camera_access keeps who, what, until when and who
// decided, on the clock.
//
// AskForCameras is everyone else's on the door: the tenant, the household, a
// 1099 worker sent there. They see the NAMES the family offers, ask for the
// ones they need with a reason, and the moment the family grants it the live
// cameras open right here.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { createGrant, revokeGrant, saveGrantToken, grantLink } from '../../lib/cameras.js';
import { smsHref } from '../../lib/dispatch.js';
import { boundedRead } from '../../lib/bounded-read.js';
import {
  loadCameraMenu, saveCameraMenu, loadCameraAccess, askForCameras, decideCameraAccess, giveCameraAccess,
} from './cloud.js';
import {
  GIVE_ROLES, ACCESS_DAYS, expiresOn, accessBook, accessLine, myLiveGrant, accessText,
} from './door-cameras.js';

const serif = { fontFamily: '"Fraunces", serif' };
const btn = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40';
const field = 'text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]';
const READ_MS = 8000;

const Head = ({ children }) => <h4 className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold text-[#2F5D50] mt-4 mb-1">{children}</h4>;

function DaysPick({ value, onChange, label = 'For how long' }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} className={`${field} text-xs`} style={serif}>
      {ACCESS_DAYS.map((d) => <option key={d.days} value={d.days}>{d.label}</option>)}
    </select>
  );
}

/** The family's desk for one door. `cameras` is the NAS list; `token` the family key. */
export function CameraAccessDesk({ instanceId, rentalId, doorName = 'this door', cameras = [], token }) {
  const [menu, setMenu] = useState(null);
  const [offer, setOffer] = useState([]);
  const [rows, setRows] = useState([]);
  const [daysFor, setDaysFor] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [give, setGive] = useState({ name: '', role: 'guest', phone: '', cams: [], days: 3 });
  const [made, setMade] = useState(null);

  const reload = useCallback(async () => {
    const [m, a] = await Promise.all([
      boundedRead(loadCameraMenu(rentalId), READ_MS, { ok: false }),
      boundedRead(loadCameraAccess(rentalId), READ_MS, { ok: false }),
    ]);
    if (m.ok) { setMenu(m.menu); setOffer(m.menu.map((x) => x.camera_id)); } else setMenu([]);
    setRows(a.ok ? a.rows : []);
  }, [rentalId]);
  useEffect(() => { reload(); }, [reload]);

  const nameOf = (id) => (cameras.find((c) => c.id === id) || {}).name || id;
  const book = accessBook(rows);

  const saveMenu = async () => {
    setBusy(true);
    const r = await saveCameraMenu({ instanceId, rentalId, cameras: offer.map((id) => ({ id, name: nameOf(id) })) });
    setBusy(false);
    setMsg(r.ok ? `Saved: people on ${doorName} can ask for ${offer.length} camera${offer.length === 1 ? '' : 's'}.` : `Not saved: ${r.reason}.`);
    reload();
  };

  const mint = async (name, cams, days) => {
    const g = await createGrant({ name, cameras: cams, days, actions: false }, token);
    if (!g || !g.ok || !g.token) return { ok: false, reason: (g && (g.error || g.reason || g.message)) || 'the NAS did not mint a grant' };
    return { ok: true, token: g.token, id: g.id || String(g.token).split('.')[1] };
  };

  const grant = async (r) => {
    const days = daysFor[r.id] ?? 30;
    setBusy(true); setMsg(`Minting ${r.person_label}'s access on the NAS…`);
    const g = await mint(`${r.person_label} · ${doorName}`, r.cameras, days);
    if (!g.ok) { setBusy(false); setMsg(`Not given: ${g.reason}.`); return; }
    const w = await decideCameraAccess(r.id, { status: 'granted', grant_token: g.token, grant_id: g.id, days, expires_on: expiresOn(days) });
    setBusy(false);
    if (!w.ok) { await revokeGrant(g.id, token); setMsg(`Not given: ${w.reason}. The grant was taken back on the NAS.`); return; }
    setMsg(`Given: ${r.person_label} sees it in the app now.`);
    reload();
  };

  const decline = async (r) => {
    setBusy(true);
    const w = await decideCameraAccess(r.id, { status: 'declined' });
    setBusy(false);
    setMsg(w.ok ? `Declined ${r.person_label}'s ask.` : `Not declined: ${w.reason}.`);
    reload();
  };

  const takeBack = async (r) => {
    setBusy(true); setMsg(`Taking ${r.person_label}'s access back…`);
    if (r.grant_id) await revokeGrant(r.grant_id, token);
    const w = await decideCameraAccess(r.id, { status: 'revoked' });
    setBusy(false);
    setMsg(w.ok ? `Taken back: ${r.person_label} no longer sees any camera at ${doorName}.` : `Taken back on the NAS, but the record did not change: ${w.reason}.`);
    reload();
  };

  const giveNow = async () => {
    const name = give.name.trim();
    if (!name || give.cams.length === 0) { setMsg('Name who it is for and tick at least one camera.'); return; }
    setBusy(true); setMsg(`Minting access for ${name} on the NAS…`);
    const g = await mint(`${name} · ${doorName}`, give.cams, give.days);
    if (!g.ok) { setBusy(false); setMsg(`Not given: ${g.reason}.`); return; }
    const w = await giveCameraAccess({
      instance_id: instanceId, rental_id: rentalId, person_role: give.role, person_label: name,
      cameras: give.cams, camera_names: give.cams.map(nameOf), grant_token: g.token, grant_id: g.id,
      days: give.days, expires_on: expiresOn(give.days),
    });
    setBusy(false);
    if (!w.ok) { await revokeGrant(g.id, token); setMsg(`Not given: ${w.reason}. The grant was taken back on the NAS.`); return; }
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const link = grantLink(g.token, origin);
    const text = accessText({ name, door: doorName, cameras: give.cams.map(nameOf), link, days: give.days });
    setMade({ name, link, text, sms: smsHref(give.phone, text) });
    setMsg('');
    setGive({ name: '', role: 'guest', phone: '', cams: [], days: 3 });
    reload();
  };

  const tick = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div data-testid="camera-access-desk">
      <Head>Cameras people can ask for at {doorName}</Head>
      <p className="text-xs text-[#5A5751]" style={serif}>Anyone signed into this door (a tenant, their household, a 1099 worker sent here) sees these names and can ask. They see nothing until you give it.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1" data-testid="camera-menu-pick">
        {cameras.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm" style={serif}>
            <input type="checkbox" checked={offer.includes(c.id)} onChange={() => setOffer((o) => tick(o, c.id))} aria-label={`Offer ${c.name || c.id}`} />
            <span>{c.name || c.id}</span>
          </label>
        ))}
      </div>
      <button type="button" onClick={saveMenu} disabled={busy || menu === null} className={`${btn} mt-2 bg-white border-[#2F5D50] text-[#2F5D50]`} data-testid="camera-menu-save">Save what can be asked for</button>

      <Head>Asks waiting ({book.asks.length})</Head>
      {book.asks.length === 0 ? <p className="text-xs text-[#5A5751]" style={serif}>Nobody is waiting.</p> : book.asks.map((r) => (
        <div key={r.id} className="border-b border-[#F0EDE6] py-2" data-testid="camera-ask">
          <p className="text-sm text-[#1A1815]" style={serif}>{accessLine(r)}</p>
          <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">asked {new Date(r.created_at).toLocaleString()}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <DaysPick value={daysFor[r.id] ?? 30} onChange={(d) => setDaysFor((m) => ({ ...m, [r.id]: d }))} label={`How long for ${r.person_label}`} />
            <button type="button" onClick={() => grant(r)} disabled={busy} className={`${btn} bg-[#2F5D50] text-white border-[#2F5D50]`}>Give it</button>
            <button type="button" onClick={() => decline(r)} disabled={busy} className={`${btn} bg-white text-[#1A1815] border-[#E8E4DC]`}>Decline</button>
          </div>
        </div>
      ))}

      <Head>Give access to anyone</Head>
      <p className="text-xs text-[#5A5751]" style={serif}>A short-stay guest, a new tenant, a worker without the app: they get a link to text. No account, no password; it ends on the day you choose, or when you take it back.</p>
      <div className="flex flex-wrap items-end gap-2 mt-1">
        <label className="text-xs text-[#5A5751]">Who
          <input value={give.name} onChange={(e) => setGive((g) => ({ ...g, name: e.target.value }))} maxLength={120} aria-label="Who it is for" className={`${field} block`} style={serif} />
        </label>
        <label className="text-xs text-[#5A5751]">As
          <select value={give.role} onChange={(e) => setGive((g) => ({ ...g, role: e.target.value }))} aria-label="As what" className={`${field} block text-xs`} style={serif}>
            {GIVE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-[#5A5751]">Their cell (to text it)
          <input value={give.phone} onChange={(e) => setGive((g) => ({ ...g, phone: e.target.value }))} inputMode="tel" aria-label="Their cell" className={`${field} block w-36`} style={serif} />
        </label>
        <label className="text-xs text-[#5A5751]">For
          <span className="block"><DaysPick value={give.days} onChange={(d) => setGive((g) => ({ ...g, days: d }))} label="For how long to give" /></span>
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1" data-testid="camera-give-pick">
        {cameras.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm" style={serif}>
            <input type="checkbox" checked={give.cams.includes(c.id)} onChange={() => setGive((g) => ({ ...g, cams: tick(g.cams, c.id) }))} aria-label={`Give ${c.name || c.id}`} />
            <span>{c.name || c.id}</span>
          </label>
        ))}
      </div>
      <button type="button" onClick={giveNow} disabled={busy} className={`${btn} mt-2 bg-[#2F5D50] text-white border-[#2F5D50]`} data-testid="camera-give">Give access</button>
      {made && (
        <div className="mt-2 border-l-2 border-[#2F5D50] pl-2" data-testid="camera-given-link">
          <p className="text-xs text-[#1A1815]" style={serif}>{made.name}&rsquo;s link (shown once; it opens only those cameras):</p>
          <p className="text-xs break-all text-[#1A1815]" style={serif}>{made.link}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {made.sms && <a href={made.sms} className={`${btn} inline-block bg-[#2F5D50] text-white border-[#2F5D50]`}>Text it</a>}
            <button type="button" onClick={() => { try { navigator.clipboard.writeText(made.text); setMsg('Copied.'); } catch { setMsg('Copy it from above.'); } }} className={`${btn} bg-white text-[#1A1815] border-[#E8E4DC]`}>Copy the message</button>
          </div>
        </div>
      )}

      <Head>Who holds access now ({book.holding.length})</Head>
      {book.holding.length === 0 ? <p className="text-xs text-[#5A5751]" style={serif}>Nobody holds access to these cameras through this door.</p> : book.holding.map((r) => (
        <div key={r.id} className="border-b border-[#F0EDE6] py-2 flex flex-wrap items-center justify-between gap-2" data-testid="camera-holder">
          <span className="text-sm text-[#1A1815]" style={serif}>{accessLine(r)}</span>
          <button type="button" onClick={() => takeBack(r)} disabled={busy} className={`${btn} bg-white border-[#B85838] text-[#B85838]`}>Take back</button>
        </div>
      ))}
      {book.past.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-[#5A5751] cursor-pointer">Earlier ({book.past.length})</summary>
          {book.past.map((r) => <p key={r.id} className="text-xs text-[#5A5751] py-1" style={serif}>{accessLine(r)}{r.decided_at ? ` · ${new Date(r.decided_at).toLocaleString()}` : ''}</p>)}
        </details>
      )}
      {msg && <p className="text-xs mt-2 text-[#2F5D50]" role="status" data-testid="camera-access-msg">{msg}</p>}
    </div>
  );
}

/** Everyone else on the door: ask for the cameras offered; watch once given. */
export function AskForCameras({ instanceId, rentalId, me = null, myName = '', renderCameras = null }) {
  const [menu, setMenu] = useState(null);
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState([]);
  const [reason, setReason] = useState('');
  const [name, setName] = useState(myName || '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [m, a] = await Promise.all([
      boundedRead(loadCameraMenu(rentalId), READ_MS, { ok: false }),
      boundedRead(loadCameraAccess(rentalId), READ_MS, { ok: false }),
    ]);
    setMenu(m.ok ? m.menu : []);
    setRows(a.ok ? a.rows : []);
  }, [rentalId]);
  useEffect(() => { reload(); }, [reload]);

  const live = myLiveGrant(rows, me);
  const liveToken = live ? live.grant_token : '';
  useEffect(() => { if (liveToken) saveGrantToken(liveToken); }, [liveToken]);
  const open = rows.find((r) => r.person_user_id === me && r.status === 'requested');

  const ask = async () => {
    if (picked.length === 0) { setMsg('Tick the cameras you need.'); return; }
    setBusy(true);
    const r = await askForCameras({ instanceId, rentalId, cameras: picked, reason, label: name });
    setBusy(false);
    setMsg(r.ok ? 'Asked. You will see the cameras here as soon as it is given.' : r.reason === 'already-asked' ? 'You already have an ask waiting on this door.' : `Not sent: ${r.reason}.`);
    if (r.ok) { setPicked([]); setReason(''); }
    reload();
  };

  if (!rentalId) return null;
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="ask-for-cameras">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">Ask for a camera here</h3>
      {live && (
        <div className="mt-1" data-testid="ask-for-cameras-live">
          <p className="text-xs text-[#1A1815]" style={serif}>Given to you: {(live.camera_names || live.cameras || []).join(', ')}{live.expires_on ? ` until ${live.expires_on}` : ', until taken back'}.</p>
          {renderCameras ? <div className="mt-2">{renderCameras(live.grant_token)}</div> : null}
        </div>
      )}
      {menu === null ? <p className="text-xs mt-1 text-[#5A5751]" style={serif}>Reading what this door offers…</p>
        : menu.length === 0 ? (
          <p className="text-xs mt-1 text-[#5A5751]" style={serif} data-testid="ask-for-cameras-none">The owner has not offered any camera at this door yet.</p>
        ) : open ? (
          <p className="text-xs mt-1 text-[#1A1815]" style={serif} data-testid="ask-for-cameras-waiting">Waiting on the owner: {accessLine(open)}.</p>
        ) : (
          <>
            <p className="text-xs mt-1 text-[#5A5751]" style={serif}>Tick what you need and say why. The owner decides and for how long.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
              {menu.map((c) => (
                <label key={c.camera_id} className="flex items-center gap-2 text-sm" style={serif}>
                  <input type="checkbox" checked={picked.includes(c.camera_id)} onChange={() => setPicked((p) => (p.includes(c.camera_id) ? p.filter((x) => x !== c.camera_id) : [...p, c.camera_id]))} aria-label={`Ask for ${c.camera_name}`} />
                  <span>{c.camera_name}</span>
                </label>
              ))}
            </div>
            <label className="block text-xs text-[#5A5751] mt-2">Your name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} aria-label="Your name" className={`${field} block w-full`} style={serif} />
            </label>
            <label className="block text-xs text-[#5A5751] mt-1">Why (optional)
              <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} aria-label="Why you need it" className={`${field} block w-full`} style={serif} />
            </label>
            <button type="button" onClick={ask} disabled={busy} className={`${btn} mt-2 bg-[#2F5D50] text-white border-[#2F5D50]`} data-testid="ask-for-cameras-send">Ask</button>
          </>
        )}
      {rows.filter((r) => r.person_user_id === me && ['declined', 'revoked'].includes(r.status)).slice(0, 3).map((r) => (
        <p key={r.id} className="text-xs text-[#5A5751] mt-1" style={serif}>{accessLine(r)}.</p>
      ))}
      {msg && <p className="text-xs mt-2 text-[#2F5D50]" role="status" data-testid="ask-for-cameras-msg">{msg}</p>}
      <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={serif}>Tenants, household members and 1099 workers on this door can ask here.</p>
    </section>
  );
}
