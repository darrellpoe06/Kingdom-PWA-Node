// =============================================================================
// DoorCameras — the landlord shares a door's cameras; the household watches
// =============================================================================
// DR-0841. The landlord's tab reads the NAS's camera list with the family key
// this device holds, suggests the cameras whose names carry the door's
// address, mints a grant named for the door and writes it onto the tenancy
// row. The household's tab reads that row: with a grant it opens the same
// Cameras surface the family uses, on that grant alone; without one it says
// so. Nothing here is painted: the list is the NAS's, the grant is minted
// there, the row is the database's.
import React, { useEffect, useState } from 'react';
import { fetchWithTimeout, authHeaders, listUrl, parseCameraList, createGrant, revokeGrant, saveGrantToken, grantLink, FETCH_TIMEOUT_MS } from '../../lib/cameras.js';
import { bridgeToken } from '../../lib/nas-photos.js';
import { doorGrantName, suggestDoorCameras, grantNote, grantIdOf, doorCameraState, whoSeesDoorCameras } from './door-cameras.js';
import { CameraAccessDesk, AskForCameras } from './CameraAccess.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const btn = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40';

// `place` is the property in hand when the unit has no tenancy row yet. A
// vacant unit still has a porch, and its camera still needs sharing the day a
// tenant or a 1099 worker arrives — hiding the whole control behind a tenancy
// is the DR-0870 root cause, met here for the fifth time. The door record is
// created by the caller's ensureDoor() when the grant is actually made.
export function DoorCamerasTab({ door, place = null, people = [], onChange, rentalId = null, instanceId = null }) {
  const token = bridgeToken();
  // The door in hand: its tenancy record, or the unit itself when it has none.
  // The list used to be read only with a tenancy record, so an empty unit's
  // tab said "the NAS did not answer (no-door)" and showed no camera at all,
  // while the NAS was answering with every camera (Darrell, 2026-10-10:
  // "Cameras tab shows no Cameras!!!!!!").
  const target = door || place;
  const viewers = whoSeesDoorCameras({ door, people });
  const [list, setList] = useState({ status: 'loading', cameras: [] });
  const [picked, setPicked] = useState([]);
  const [days, setDays] = useState(365);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const shared = doorCameraState(door);

  useEffect(() => {
    let alive = true;
    if (!target) { setList({ status: 'no-door', cameras: [] }); return undefined; }
    if (!token) { setList({ status: 'no-key', cameras: [] }); return undefined; }
    (async () => {
      try {
        const r = await fetchWithTimeout(listUrl(), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS);
        let body = null; try { body = await r.json(); } catch { body = null; }
        if (!alive) return;
        const cams = r.status === 200 ? parseCameraList(body) : [];
        setList({ status: r.status === 200 ? 'ready' : `http-${r.status}`, cameras: cams });
        setPicked(suggestDoorCameras(cams, target));
      } catch { if (alive) setList({ status: 'unreachable', cameras: [] }); }
    })();
    return () => { alive = false; };
  }, [token, target]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const share = async () => {
    if (!target || picked.length === 0) return;
    setBusy(true); setMsg('Minting the grant on the NAS…');
    const r = await createGrant({ name: doorGrantName(target), cameras: picked, days, actions: false }, token);
    if (!r || !r.ok || !r.token) { setBusy(false); setMsg(`Not shared: ${(r && (r.error || r.reason)) || 'the NAS did not mint a grant'}.`); return; }
    const note = grantNote(list.cameras, picked, { days });
    const w = await onChange({ token: r.token, note });
    setBusy(false);
    setMsg(w && w.ok === false ? `The grant was minted but the door could not keep it: ${w.reason}.` : `Shared with this door: ${note}.`);
  };
  const takeBack = async () => {
    setBusy(true); setMsg('Taking it back…');
    const id = grantIdOf(shared.token);
    if (id) await revokeGrant(id, token);
    const w = await onChange({ token: null, note: null });
    setBusy(false);
    setMsg(w && w.ok === false ? `Not taken back from the door: ${w.reason}.` : 'Taken back: the door no longer opens any camera.');
  };

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="door-cameras-landlord">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">Cameras this door&rsquo;s household may watch</h3>
      {shared.state === 'shared' ? (
        <p className="text-xs mt-1 text-[#1A1815]" style={serif} data-testid="door-cameras-shared">Shared now: {shared.note || 'a grant with no note'}.
          <button type="button" onClick={takeBack} disabled={busy} className={`${btn} ml-2 bg-white border-[#B85838] text-[#B85838]`} data-testid="door-cameras-take-back">Take back</button>
        </p>
      ) : <p className="text-xs mt-1 text-[#5A5751]" style={serif}>Nothing shared with this door yet.</p>}
      {target && (
        <div className="mt-2 border-l-2 border-[#2F5D50] pl-2" data-testid="door-cameras-who">
          <p className="text-xs text-[#1A1815]" style={serif}><strong>Who will see them:</strong> the tenant and their household when they sign into this door. A 1099 worker, a guest and an applicant never do.</p>
          {viewers.length === 0 ? (
            <p className="text-xs text-[#5A5751]" style={serif} data-testid="door-cameras-nobody">Nobody signs into this door yet, so nobody would see them. Invite the tenant or a household member in People first.</p>
          ) : (
            <ul className="text-xs text-[#1A1815] mt-0.5" style={serif}>
              {viewers.map((v) => (
                <li key={`${v.name}-${v.role}`} data-testid="door-cameras-viewer">{v.name} · {v.role} · {v.joined ? 'signed in' : 'has not signed in yet'}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!door && !place ? (
        <p className="text-xs mt-2 text-[#5A5751]" style={serif}>Pick a door above; the cameras are shared per door, never to the whole portfolio.</p>
      ) : !token ? (
        <p className="text-xs mt-2 text-[#5A5751]" style={serif}>This device holds no family camera key, so it cannot mint a grant. Open Cameras in PoeTech once on a family device, then come back here.</p>
      ) : list.status === 'loading' ? (
        <p className="text-xs mt-2 text-[#5A5751]" style={serif}>Reading the camera list from the NAS…</p>
      ) : list.status !== 'ready' ? (
        <p className="text-xs mt-2 text-[#B85838]" style={serif}>The NAS did not answer the camera list ({list.status}); nothing can be shared until it does.</p>
      ) : list.cameras.length === 0 ? (
        <p className="text-xs mt-2 text-[#B85838]" style={serif} data-testid="door-cameras-none">The NAS answered and lists no cameras. Add them in PoeTech &rarr; Cameras, then come back here.</p>
      ) : (
        <>
          <p className="text-xs mt-2 text-[#5A5751]" style={serif} data-testid="door-cameras-count">{list.cameras.length} camera{list.cameras.length === 1 ? '' : 's'} on the NAS; {picked.length} ticked for this door.</p>
          <p className="text-xs mt-1 text-[#5A5751]" style={serif}>Tick the cameras at this door (the ones carrying its address are ticked already), say for how long, and share. The household sees only these, through the same road the family uses; the family key never leaves this device.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2" data-testid="door-cameras-pick">
            {list.cameras.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm" style={serif}>
                <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} aria-label={`Share ${c.name || c.id}`} />
                <span>{c.name || c.id}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="For how long" className="text-xs border border-[#E8E4DC] px-2 py-1 bg-white" style={serif}>
              <option value={0}>Until taken back</option>
              <option value={30}>30 days</option>
              <option value={365}>A year</option>
            </select>
            <button type="button" onClick={share} disabled={busy || picked.length === 0} className={`${btn} bg-[#2F5D50] text-white border-[#2F5D50]`} data-testid="door-cameras-share">
              {busy ? 'Working…' : `Share ${picked.length} with this door`}
            </button>
          </div>
        </>
      )}
      {msg ? <p className="text-xs mt-2 text-[#2F5D50]" style={serif} role="status" data-testid="door-cameras-msg">{msg}</p> : null}
      {/* Asked for and given, per person (DR-0938): tenants, workers, guests. */}
      {token && list.status === 'ready' && list.cameras.length > 0 && rentalId && instanceId && (
        <CameraAccessDesk instanceId={instanceId} rentalId={rentalId} doorName={doorGrantName(target)} cameras={list.cameras} token={token} />
      )}
    </section>
  );
}

export function TenantCamerasTab({ door, renderCameras = null, rentalId = null, instanceId = null, me = null, myName = '' }) {
  const shared = doorCameraState(door);
  useEffect(() => { if (shared.state === 'shared') saveGrantToken(shared.token); }, [shared.state, shared.token]);
  // Ask for the cameras the family offers on this door (DR-0938); anyone on
  // the door can, whether or not the household grant below exists.
  const ask = rentalId && instanceId
    ? <AskForCameras instanceId={instanceId} rentalId={rentalId} me={me} myName={myName} renderCameras={renderCameras} />
    : null;
  if (shared.state !== 'shared') {
    return (
      <>
      <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="door-cameras-tenant">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">Cameras</h3>
        <p className="text-xs mt-1 text-[#5A5751]" style={serif}>Your landlord has not shared any camera with this door yet. When they do, the porch, the hallway or the lot shows here, live.</p>
      </section>
      {ask}
      </>
    );
  }
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  return (
    <>
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="door-cameras-tenant">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">Cameras at this door</h3>
      <p className="text-xs mt-1 text-[#5A5751]" style={serif} data-testid="door-cameras-tenant-note">Shared with this door: {shared.note || 'the cameras your landlord chose'}.</p>
      {renderCameras ? <div className="mt-2" data-testid="door-cameras-surface">{renderCameras(shared.token)}</div> : (
        <a href={grantLink(shared.token, origin)} className={`${btn} inline-block mt-2 bg-[#2F5D50] text-white border-[#2F5D50]`} data-testid="door-cameras-open">Open the cameras</a>
      )}
    </section>
    {ask}
    </>
  );
}
