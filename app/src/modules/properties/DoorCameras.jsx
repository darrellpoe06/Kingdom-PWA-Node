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
import React, { useEffect, useRef, useState } from 'react';
import { fetchWithTimeout, authHeaders, listUrl, parseCameraList, createGrant, revokeGrant, saveGrantToken, grantLink, FETCH_TIMEOUT_MS,
  fetchGrants, grantState, grantLine, snapUrl, runLimited, SNAP_CONCURRENCY, FRAME_TIMEOUT_MS } from '../../lib/cameras.js';
import { bridgeToken } from '../../lib/nas-photos.js';
import { doorGrantName, suggestDoorCameras, grantNote, grantIdOf, doorCameraState, whoSeesDoorCameras,
  doorCameraView, grantCameraIds, tenantFrameLine, splitCamerasByDoor, offeredCameras } from './door-cameras.js';
import { CameraAccessDesk, AskForCameras } from './CameraAccess.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const btn = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40';

// WHAT THE TENANT SEES (Darrell, 2026-10-21): each camera the door's grant
// opens is asked for a frame WITH THAT GRANT, the way the tenant's phone asks,
// so the owner sees the tenant's own answer: the picture, or the refusal and
// why. Nothing is assumed from the ticks or the note.
export function TenantEye({ cameras = [], grantToken = '', fetchImpl = globalThis.fetch }) {
  const [frames, setFrames] = useState({});
  const [round, setRound] = useState(0);
  const urls = useRef([]);
  const key = cameras.map((c) => c.id).join(',');
  useEffect(() => {
    let alive = true;
    if (!grantToken || !key) return undefined;
    setFrames({});
    runLimited(key.split(','), SNAP_CONCURRENCY, async (id) => {
      let out;
      try {
        const r = await fetchWithTimeout(snapUrl(id, { w: 320 }), { headers: authHeaders(grantToken) }, FRAME_TIMEOUT_MS, fetchImpl);
        if (r.status === 200) {
          const blob = await r.blob();
          const src = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : '';
          if (src) urls.current.push(src);
          out = { ...tenantFrameLine({ status: 200 }), src };
        } else {
          let body = null; try { body = await r.json(); } catch { body = null; }
          out = tenantFrameLine({ status: r.status, body });
        }
      } catch { out = tenantFrameLine({ status: 0 }); }
      if (alive) setFrames((f) => ({ ...f, [id]: out }));
    });
    return () => { alive = false; };
  }, [grantToken, key, round, fetchImpl]);
  useEffect(() => () => { for (const u of urls.current) { try { URL.revokeObjectURL(u); } catch { /* gone */ } } }, []);
  const okN = cameras.filter((c) => frames[c.id] && frames[c.id].ok).length;
  const done = cameras.filter((c) => frames[c.id]).length;
  return (
    <div className="mt-2" data-testid="door-cameras-tenant-eye">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-[#1A1815]" style={serif}><strong>What the tenant sees:</strong> {done < cameras.length ? `asking the NAS with the door's own grant (${done} of ${cameras.length})…` : `${okN} of ${cameras.length} answer the door's grant with a picture.`}</p>
        <button type="button" onClick={() => setRound((n) => n + 1)} className={`${btn} bg-white border-[#2F5D50] text-[#2F5D50]`} data-testid="door-cameras-look-again">Look again</button>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {cameras.map((c) => {
          const f = frames[c.id];
          return (
            <li key={c.id} className="border border-[#E8E4DC]" data-testid={`tenant-eye-${c.id}`} data-ok={f ? String(!!f.ok) : undefined}>
              <div className="aspect-video bg-black flex items-center justify-center">
                {f && f.src ? <img src={f.src} alt={`${c.name || c.id}, as the tenant sees it`} className="w-full h-full object-cover" />
                  : <span className="text-[0.625rem] text-white/80 p-2 text-center">{f ? 'no picture' : 'asking…'}</span>}
              </div>
              <div className="p-1.5">
                <div className="text-xs font-semibold text-[#1A1815] truncate" style={serif}>{c.name || c.id}</div>
                <div className={`text-[0.625rem] ${f && f.ok ? 'text-[#2F6B3A]' : 'text-[#B85838]'}`} data-testid={`tenant-eye-line-${c.id}`}>{f ? f.text : 'asking the NAS…'}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// `place` is the property in hand when the unit has no tenancy row yet. A
// vacant unit still has a porch, and its camera still needs sharing the day a
// tenant or a 1099 worker arrives — hiding the whole control behind a tenancy
// is the DR-0870 root cause, met here for the fifth time. The door record is
// created by the caller's ensureDoor() when the grant is actually made.
// `role` is the face in hand: 'owner' or 'manager' (DR-1164). A manager is
// offered the cameras at the door's address and no others.
export function DoorCamerasTab({ door, place = null, people = [], onChange, rentalId = null, instanceId = null, role = 'owner' }) {
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
  // The door's grant as the NAS holds it: {status: 'none'|'loading'|'ready'|'missing'|'unknown', grant, why}.
  const [grantRead, setGrantRead] = useState({ status: 'loading', grant: null, why: '' });
  const [grantTick, setGrantTick] = useState(0);
  const seeded = useRef(false);
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
      } catch { if (alive) setList({ status: 'unreachable', cameras: [] }); }
    })();
    return () => { alive = false; };
  }, [token, target]);

  // The grant the door carries, read back from the NAS (its cameras, its expiry,
  // whether it was taken back). The note on the row is only words.
  const grantId = grantIdOf(shared.token);
  useEffect(() => {
    let alive = true;
    if (!grantId) { setGrantRead({ status: 'none', grant: null, why: '' }); return undefined; }
    if (!token) { setGrantRead({ status: 'unknown', grant: null, why: 'this device holds no family camera key' }); return undefined; }
    setGrantRead((g) => ({ ...g, status: 'loading' }));
    fetchGrants(token).then((r) => {
      if (!alive) return;
      if (!r.ok) { setGrantRead({ status: 'unknown', grant: null, why: r.message }); return; }
      const g = r.grants.find((x) => x.id === grantId) || null;
      setGrantRead(g ? { status: 'ready', grant: g, why: '' } : { status: 'missing', grant: null, why: '' });
    });
    return () => { alive = false; };
  }, [grantId, token, grantTick]);

  // The first ticks are what the door really shares; the address suggestions
  // only when nothing is shared yet (the picker used to start from the
  // suggestions even on a shared door, so it read "16 ticked" beside "10
  // shared", 2026-10-21 screenshot).
  useEffect(() => {
    if (seeded.current || list.status !== 'ready' || grantRead.status === 'loading') return;
    seeded.current = true;
    const ids = grantRead.status === 'ready' ? grantCameraIds(grantRead.grant, list.cameras) : null;
    setPicked(ids || suggestDoorCameras(list.cameras, target));
  }, [list, grantRead, target]);
  const liveGrant = grantRead.status === 'ready' && grantState(grantRead.grant) === 'live' ? grantRead.grant : null;
  // WHOSE CAMERAS THIS FACE IS OFFERED (DR-1164): a manager, the door's own
  // only; the owner, everything, the door's own first. Every list below (the
  // picker, what the tenant sees, what is not shared, what can be asked for)
  // reads `offered`, so a camera at another address or the family's home is
  // never named on a manager's screen, not even as "not shared".
  const split = splitCamerasByDoor(list.cameras, target);
  const offered = offeredCameras(role, split);
  const offeredIds = new Set(offered.map((c) => c.id));
  const apart = [...split.elsewhere, ...split.unplaced];
  // Cameras the door's grant opens beyond what this face is offered: set by
  // the owner, kept through a manager's Share, counted for them, never named.
  const beyond = liveGrant ? (grantCameraIds(liveGrant, list.cameras) || []).filter((id) => !offeredIds.has(id)).length : 0;
  const view = doorCameraView({ cameras: offered, grant: liveGrant, picked });

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const share = async () => {
    if (!target || picked.length === 0) return;
    setBusy(true); setMsg('Minting the grant on the NAS…');
    const r = await createGrant({ name: doorGrantName(target), cameras: picked, days, actions: false }, token);
    if (!r || !r.ok || !r.token) { setBusy(false); setMsg(`Not shared: ${(r && (r.error || r.reason)) || 'the NAS did not mint a grant'}.`); return; }
    const note = role === 'manager'
      ? grantNote(offered, picked.filter((id) => offeredIds.has(id)), { days }) + (beyond ? `, and ${beyond} beyond this address set by the owner` : '')
      : grantNote(list.cameras, picked, { days });
    const w = await onChange({ token: r.token, note });
    if (w && w.ok === false) {
      await revokeGrant(grantIdOf(r.token), token);
      setBusy(false);
      setMsg(`Not shared: the door could not keep the new grant (${w.reason}); the old one stands.`);
      return;
    }
    // The old grant is taken back once the new one is on the door, so a camera
    // unticked here really stops opening (the old grant used to stay live).
    if (grantId && grantId !== grantIdOf(r.token)) await revokeGrant(grantId, token);
    seeded.current = true;
    setGrantTick((n) => n + 1);
    setBusy(false);
    setMsg(`Shared with this door: ${note}.`);
  };
  const takeBack = async () => {
    setBusy(true); setMsg('Taking it back…');
    const id = grantIdOf(shared.token);
    if (id) await revokeGrant(id, token);
    const w = await onChange({ token: null, note: null });
    setGrantTick((n) => n + 1);
    setBusy(false);
    setMsg(w && w.ok === false ? `Not taken back from the door: ${w.reason}.` : 'Taken back: the door no longer opens any camera.');
  };
  const grantWords = grantRead.status === 'ready' ? grantLine(grantRead.grant)
    : grantRead.status === 'missing' ? 'the NAS no longer holds this grant, so the tenant sees no camera'
    : grantRead.status === 'unknown' ? `the NAS did not say (${grantRead.why})`
    : grantRead.status === 'loading' ? 'reading it from the NAS…' : '';


  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="door-cameras-landlord">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">Cameras this door&rsquo;s household may watch</h3>
      {/* One page, no new tabs (Darrell, 2026-10-21: "start with the cameras"):
          the cameras and what the tenant sees first, who has access under them. */}
      {(() => { const access = (
        <div className="mt-3 border-t border-[#E8E4DC] pt-2" data-testid="door-cameras-access">
          <h4 className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold text-[#2F5D50]">Who has access</h4>
          {shared.state === 'shared'
            ? <p className="text-xs mt-2 text-[#1A1815]" style={serif} data-testid="door-cameras-grant-line"><strong>The door&rsquo;s grant:</strong> {grantWords}.</p>
            : <p className="text-xs mt-2 text-[#5A5751]" style={serif}>Nothing is shared with this door, so nobody on it sees a camera.</p>}
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
          {/* Asked for and given, per person (DR-0938): tenants, workers, guests. */}
          {token && list.status === 'ready' && list.cameras.length > 0 && rentalId && instanceId && (
            <CameraAccessDesk instanceId={instanceId} rentalId={rentalId} doorName={doorGrantName(target)} cameras={offered} token={token} />
          )}
          <p className="text-[0.625rem] mt-2 text-[#5A5751]" style={serif}>Every grant on every camera, with who last used it, is in PoeTech &rarr; Cameras &rarr; Who can see.</p>
        </div>
      ); return (<>
      {shared.state === 'shared' ? (
        <p className="text-xs mt-1 text-[#1A1815]" style={serif} data-testid="door-cameras-shared">Shared now: {role === 'manager'
          ? (liveGrant ? `${view.seen.length} camera${view.seen.length === 1 ? '' : 's'} at this door’s address${beyond ? `, and ${beyond} beyond it set by the owner` : ''}` : 'a grant this door carries')
          : (shared.note || 'a grant with no note')}.
          <button type="button" onClick={takeBack} disabled={busy} className={`${btn} ml-2 bg-white border-[#B85838] text-[#B85838]`} data-testid="door-cameras-take-back">Take back</button>
        </p>
      ) : <p className="text-xs mt-1 text-[#5A5751]" style={serif}>Nothing shared with this door yet.</p>}
      {shared.state === 'shared' && grantRead.status !== 'ready' && grantWords ? (
        <p className="text-xs mt-1 text-[#B85838]" style={serif} data-testid="door-cameras-grant-state">The door&rsquo;s grant: {grantWords}.</p>
      ) : null}
      {shared.state === 'shared' && grantRead.status === 'ready' && grantState(grantRead.grant) !== 'live' ? (
        <p className="text-xs mt-1 text-[#B85838]" style={serif} data-testid="door-cameras-grant-state">The door&rsquo;s grant is {grantState(grantRead.grant)}: the tenant sees no camera until you share again.</p>
      ) : null}
      {target && viewers.length === 0 ? (
        <p className="text-xs mt-1 text-[#5A5751]" style={serif} data-testid="door-cameras-nobody-yet">Nobody signs into this door yet; what is shared shows the day they do (Who has access, below).</p>
      ) : null}
      {liveGrant && view.seen.length > 0 ? <TenantEye cameras={view.seen} grantToken={shared.token} /> : null}
      {liveGrant && beyond > 0 && role === 'manager' ? (
        <p className="text-xs mt-1 text-[#5A5751]" style={serif} data-testid="door-cameras-beyond">{beyond} more camera{beyond === 1 ? '' : 's'} beyond this address {beyond === 1 ? 'is' : 'are'} shared with this door by the owner; not shown here.</p>
      ) : null}
      {liveGrant && list.status === 'ready' && view.notSeen.length > 0 ? (
        <details className="mt-2" data-testid="door-cameras-not-seen">
          <summary className="text-xs text-[#1A1815] cursor-pointer" style={serif}><strong>Not shared, so the tenant does not see these ({view.notSeen.length})</strong>{role !== 'manager' ? ' at this address; the rest are in the fold below' : ''}</summary>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>{view.notSeen.map((c) => c.name || c.id).join(', ')}</p>
        </details>
      ) : null}
      {list.status === 'ready' && (view.toAdd.length > 0 || (liveGrant && view.toRemove.length > 0)) ? (
        <div className="mt-2 border-l-2 border-[#B85838] pl-2" data-testid="door-cameras-pending">
          {view.toAdd.length > 0 ? <p className="text-xs text-[#1A1815]" style={serif}><strong>Ticked, not shared yet ({view.toAdd.length}):</strong> {view.toAdd.map((c) => c.name || c.id).join(', ')}. The tenant does not see these until you press Share.</p> : null}
          {liveGrant && view.toRemove.length > 0 ? <p className="text-xs text-[#1A1815]" style={serif}><strong>Shared, unticked here ({view.toRemove.length}):</strong> {view.toRemove.map((c) => c.name || c.id).join(', ')}. The tenant still sees these until you press Share.</p> : null}
        </div>
      ) : null}
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
          {role === 'manager' ? (
            <>
              <p className="text-xs mt-2 text-[#5A5751]" style={serif} data-testid="door-cameras-count">{split.here.length} camera{split.here.length === 1 ? '' : 's'} at this door&rsquo;s address; {picked.filter((id) => offeredIds.has(id)).length} ticked for this door.</p>
              <p className="text-xs mt-1 text-[#5A5751]" style={serif} data-testid="door-cameras-manager-scope">Only the cameras at this address are offered here. A camera at another address, or the family&rsquo;s own, is the owner&rsquo;s to give.</p>
            </>
          ) : (
            <>
              <p className="text-xs mt-2 text-[#5A5751]" style={serif} data-testid="door-cameras-count">{list.cameras.length} camera{list.cameras.length === 1 ? '' : 's'} on the NAS; {split.here.length} at this door&rsquo;s address; {picked.length} ticked for this door.</p>
              <p className="text-xs mt-1 text-[#5A5751]" style={serif}>Tick the cameras at this door (the ones carrying its address are ticked already), say for how long, and share. The household sees only these, through the same road the family uses; the family key never leaves this device.</p>
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2" data-testid="door-cameras-pick">
            {split.here.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm" style={serif}>
                <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} aria-label={`Share ${c.name || c.id}`} />
                <span>{c.name || c.id}</span>
              </label>
            ))}
          </div>
          {role !== 'manager' && apart.length > 0 ? (
            /* THE REST, SET APART (DR-1164). The owner alone sees and may tick
               these. The warning is the point: a camera here is at another
               address or in the family's own home, and sharing it to this door
               hands that place to this household. A camera with no address in
               its name is also a finding: nobody can place it from the list. */
            <details className="mt-2 border-l-2 border-[#B85838] pl-2" data-testid="door-cameras-apart">
              <summary className="text-xs text-[#1A1815] cursor-pointer" style={serif}><strong>Not at this address ({apart.length})</strong>: {split.elsewhere.length} at another address, {split.unplaced.length} with no address in the name (the family&rsquo;s own, or not yet named). Yours alone to give.</summary>
              <p className="text-xs text-[#B85838] mt-1" style={serif}>Ticking one of these shares a camera at another address, or your home, with this door&rsquo;s household. A manager is never offered them.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1" data-testid="door-cameras-pick-apart">
                {apart.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm" style={serif}>
                    <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} aria-label={`Share ${c.name || c.id} (not at this address)`} />
                    <span>{c.name || c.id}</span>
                  </label>
                ))}
              </div>
            </details>
          ) : null}
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
      {access}
      </>); })()}
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
