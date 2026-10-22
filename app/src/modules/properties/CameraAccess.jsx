// =============================================================================
// CameraAccess — a door's cameras are asked for, and given to whoever the
// family chooses (DR-0938, migration 0266)
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
import { createGrant, revokeGrant, saveGrantToken, grantLink, badCameraIds } from '../../lib/cameras.js';
import { smsHref } from '../../lib/dispatch.js';
import { boundedRead } from '../../lib/bounded-read.js';
import {
  loadCameraMenu, saveCameraMenu, loadCameraAccess, askForCameras, decideCameraAccess, giveCameraAccess,
} from './cloud.js';
import {
  GIVE_ROLES, ACCESS_DAYS, expiresOn, accessBook, accessLine, myLiveGrant, accessText, menuReach, cameraReach,
  roleWord, giveRoleOf, signedInOnDoor, heldBy,
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
export function CameraAccessDesk({ instanceId, rentalId, doorName = 'this door', cameras = [], token, people = [] }) {
  const [menu, setMenu] = useState(null);
  const [offer, setOffer] = useState([]);
  const [rows, setRows] = useState([]);
  const [daysFor, setDaysFor] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [give, setGive] = useState({ name: '', role: 'guest', phone: '', cams: [], days: 3, userId: null });
  const [made, setMade] = useState(null);
  // The refusal or result of Give access, said BESIDE the button (DR-1210):
  // "Name who it is for" used to land at the foot of the desk, under the whole
  // holders list, so a press with Who empty looked like a press that did nothing.
  const [giveMsg, setGiveMsg] = useState('');

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
  // Who on this door has an account, so a gift lands in THEIR app (DR-1210).
  const onDoor = signedInOnDoor(people);
  // What the person being given to already holds here: a new gift replaces it.
  const prior = heldBy(rows, { userId: give.userId, name: give.name });
  const priorCams = [...new Set(prior.flatMap((r) => r.cameras || []))];
  const priorKey = prior.map((r) => r.id).join(',');
  // Their current cameras are ticked for them the moment they are named, so
  // giving MORE is ticking more; unticking one gives them less.
  useEffect(() => {
    if (!priorKey) return;
    setGive((g) => ({ ...g, cams: [...new Set([...g.cams, ...priorCams])] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorKey]);
  const pickPerson = (userId) => {
    const p = onDoor.find((x) => x.userId === userId);
    setGiveMsg('');
    if (!p) { setGive((g) => ({ ...g, userId: null })); return; }
    setGive((g) => ({ ...g, userId: p.userId, name: p.name, role: giveRoleOf(p.roleLabel), phone: (p.contact && p.contact.phone) || g.phone }));
  };
  const roleChoices = GIVE_ROLES.some((r) => r.id === give.role) ? GIVE_ROLES : [...GIVE_ROLES, { id: give.role, label: roleWord(give.role) }];

  const saveMenu = async () => {
    setBusy(true);
    const r = await saveCameraMenu({ instanceId, rentalId, cameras: offer.map((id) => ({ id, name: nameOf(id) })) });
    setBusy(false);
    setMsg(r.ok ? `Saved: people on ${doorName} can ask for ${offer.length} camera${offer.length === 1 ? '' : 's'}.` : `Not saved: ${r.reason}.`);
    reload();
  };

  const mint = async (name, cams, days) => {
    // A REFUSAL NAMES ITS CAUSE (DR-1198, DR-0076 §8). Darrell, 2026-10-21,
    // giving a 1099 worker more cameras than the short stays: "it would not
    // work." The NAS refuses a whole list for one id outside its grammar and
    // the app said "pick at least one camera" — which he had. Now the ids it
    // would refuse are named here before anything is sent, and the NAS's own
    // error code travels with every other refusal.
    const bad = badCameraIds(cams);
    if (bad.length) return { ok: false, reason: `the NAS would refuse ${bad.length === 1 ? 'this camera id' : 'these camera ids'}: ${bad.join(', ')} (letters, digits, dots, dashes and underscores only)` };
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
    if (!w.ok) { await revokeGrant(g.id, token); setMsg(`Not given: the record was not written (${w.reason}${w.error ? ` — ${w.error}` : ''}). The grant was taken back on the NAS.`); return; }
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
    if (!name && give.cams.length === 0) { setGiveMsg('Not given: pick who it is for (or type their name) and tick at least one camera.'); return; }
    if (!name) { setGiveMsg(`Not given: pick who it is for${onDoor.length ? ' from the people signed into this door' : ''}, or type their name.`); return; }
    if (give.cams.length === 0) { setGiveMsg(`Not given: tick at least one camera for ${name}.`); return; }
    const replacing = heldBy(rows, { userId: give.userId, name });
    setBusy(true); setGiveMsg(`Minting access for ${name} on the NAS…`);
    const g = await mint(`${name} · ${doorName}`, give.cams, give.days);
    if (!g.ok) { setBusy(false); setGiveMsg(`Not given: ${g.reason}.`); return; }
    const w = await giveCameraAccess({
      instance_id: instanceId, rental_id: rentalId, person_role: give.role, person_label: name,
      // THE ACCOUNT, WHEN THEY HAVE ONE (DR-1210). Without it 0266's read
      // policy never hands the row to their session and their Cameras tab
      // stays empty; the gift could only travel as a link.
      ...(give.userId ? { person_user_id: give.userId } : {}),
      cameras: give.cams, camera_names: give.cams.map(nameOf), grant_token: g.token, grant_id: g.id,
      days: give.days, expires_on: expiresOn(give.days),
    });
    if (!w.ok) { await revokeGrant(g.id, token); setBusy(false); setGiveMsg(`Not given: the record was not written (${w.reason}${w.error ? ` — ${w.error}` : ''}). The grant was taken back on the NAS.`); return; }
    // GIVING AGAIN REPLACES (DR-1210): the new grant carries every camera
    // ticked, their earlier ones included, so the earlier grant is taken back
    // on the NAS and on the ledger. One person, one grant, the newest.
    let left = 0;
    for (const r of replacing) {
      if (r.grant_id) await revokeGrant(r.grant_id, token);
      const d = await decideCameraAccess(r.id, { status: 'revoked' });
      if (!d.ok) left += 1;
    }
    setBusy(false);
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const link = grantLink(g.token, origin);
    const text = accessText({ name, door: doorName, cameras: give.cams.map(nameOf), link, days: give.days });
    setMade({ name, link, text, sms: smsHref(give.phone, text) });
    const n = give.cams.length;
    const where = give.userId
      ? `${name} sees ${n === 1 ? 'it' : `all ${n}`} on the Cameras tab of their Poe Properties app now, signed in, no PoeTech app needed; the link below also works on any phone.`
      : `${name} has no account on this door, so the link below is how it reaches them.`;
    const replaced = replacing.length ? ` This REPLACES the access they held before (${replacing.length === 1 ? 'one grant' : `${replacing.length} grants`}, taken back${left ? `; ${left} could not be marked taken back on the record` : ''}).` : '';
    setGiveMsg(`Given: ${n} camera${n === 1 ? '' : 's'} to ${name}. ${where}${replaced}`);
    setGive({ name: '', role: 'guest', phone: '', cams: [], days: 3, userId: null });
    reload();
  };

  const tick = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div data-testid="camera-access-desk">
      {/* A MENU IS NOT ACCESS, AND IT SAYS SO (DR-1179). Darrell ticked this
          list for Apt 2 "including short stays" and asked whether it worked. It
          did what it does — which is publish a list of what may be REQUESTED —
          and the old line both buried that and got the audience wrong: it named
          "a 1099 worker sent here" as someone who sees these names. (DR-1210
          corrected the correction: WORKER_TABS does carry a Cameras tab and
          0266 lets a signed-in worker read the menu. Only a short-stay guest
          never sees it.) Both are also reached by Give access to anyone,
          below, a signed-in worker in his own app. */}
      <Head>Cameras people can ask for at {doorName}</Head>
      <p className="text-xs text-[#B85838] font-semibold" style={serif} data-testid="camera-menu-not-access">{menuReach({ saved: (menu || []).length }).words}</p>
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
      <p className="text-xs text-[#5A5751]" style={serif}>Someone signed into this door, a 1099 worker on it among them: pick them and the cameras show on the Cameras tab of their Poe Properties app. A short-stay guest, a new tenant, a worker without an account: type their name and they get a link to text. No password either way; it ends on the day you choose, or when you take it back. Give as many cameras as you like; giving again to the same person replaces what they held.</p>
      <p className="text-xs text-[#1A1815]" style={serif} data-testid="camera-give-reach">{cameraReach(give.role).words}</p>
      {onDoor.length > 0 && (
        <label className="block text-xs text-[#5A5751] mt-1">Someone signed into this door (it shows in their app)
          <select value={give.userId || ''} onChange={(e) => pickPerson(e.target.value)} aria-label="Someone signed into this door" className={`${field} block text-xs`} style={serif} data-testid="camera-give-person">
            <option value="">Nobody picked: type a name below for a link</option>
            {onDoor.map((p) => <option key={p.userId} value={p.userId}>{p.name} · {p.roleName}</option>)}
          </select>
        </label>
      )}
      <div className="flex flex-wrap items-end gap-2 mt-1">
        <label className="text-xs text-[#5A5751]">Who
          <input value={give.name} onChange={(e) => { const v = e.target.value; setGiveMsg(''); setGive((g) => ({ ...g, name: v, userId: null })); }} maxLength={120} aria-label="Who it is for" className={`${field} block`} style={serif} />
        </label>
        <label className="text-xs text-[#5A5751]">As
          <select value={give.role} onChange={(e) => setGive((g) => ({ ...g, role: e.target.value }))} aria-label="As what" className={`${field} block text-xs`} style={serif}>
            {roleChoices.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
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
      {prior.length > 0 && (
        <p className="text-xs mt-1 text-[#1A1815]" style={serif} data-testid="camera-give-replaces">{give.name.trim() || 'They'} already hold{give.name.trim() ? 's' : ''} {priorCams.length} camera{priorCams.length === 1 ? '' : 's'} here: {priorCams.map(nameOf).join(', ')}. Giving again REPLACES that grant with exactly the cameras ticked below; theirs are ticked already, so tick more to give more.</p>
      )}
      <button type="button" onClick={giveNow} disabled={busy} className={`${btn} mt-2 bg-[#2F5D50] text-white border-[#2F5D50]`} data-testid="camera-give">Give access</button>
      {giveMsg && <p className="text-xs mt-1 text-[#2F5D50] font-semibold" role="status" data-testid="camera-give-msg" style={serif}>{giveMsg}</p>}
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
          <span className="text-sm text-[#1A1815]" style={serif}>{accessLine(r)}<span className="text-[#5A5751]"> · {r.person_user_id ? 'in their Poe Properties app' : 'by link'}</span></span>
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
          {/* No camera surface handed in (the PoeTech shell passes none): the
              grant still opens, by its own link, never a dead end (DR-1210). */}
          {renderCameras ? <div className="mt-2" data-testid="ask-for-cameras-surface">{renderCameras(live.grant_token)}</div> : (
            <a href={grantLink(live.grant_token, typeof window !== 'undefined' && window.location ? window.location.origin : '')} className={`${btn} inline-block mt-2 bg-[#2F5D50] text-white border-[#2F5D50]`} data-testid="ask-for-cameras-open">Open my cameras</a>
          )}
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
