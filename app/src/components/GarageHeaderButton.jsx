// =============================================================================
// GarageHeaderButton — the Wyze garage door in the header, without Cameras
// =============================================================================
// Darrell 2026-10-21: "Garage door openers are supposed to be on the main page
// in the header of the app so we users who connect our Garage doors can use it
// for opening the garage without needing to open the cameras tab."
//
// The door the Cameras tab moves (GarageButton, DR-0777) is pressed from here
// through the same NAS action, with the same family key or door grant. It is a
// HOLD here, as the header opener is (OpenerButton): the header is where a
// thumb lands while driving, and a brush must never move a door. Nothing is
// drawn for a device that holds no camera key, or whose access has no doors.
// Which doors exist is kept on the device (lib/garage-header.js) so the header
// does not ask Wyze on every page.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import { holdProgress, holdComplete, HOLD_MS } from '../lib/openers.js';
import { cameraCredential, fetchDevices, garagesFor, runDeviceAction, ACTION_REARM_MS } from '../lib/cameras.js';
import { bridgeToken } from '../lib/nas-photos.js';
import { loadGarages, saveGarages, garagesStale, keepAfterRead } from '../lib/garage-header.js';
import { noteUse } from '../lib/usage-events.js';

const PICK_KEY = 'poetech.garages.pick.v1';

export default function GarageHeaderButton({ token: given = undefined, fetchImpl = undefined, storage = null }) {
  const token = given !== undefined ? given : cameraCredential({ bridge: bridgeToken() }).token;
  const [garages, setGarages] = useState(() => loadGarages(storage).garages);
  const [pick, setPick] = useState(() => { try { return (storage || localStorage).getItem(PICK_KEY) || ''; } catch { return ''; } });
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [rest, setRest] = useState(false);
  const [said, setSaid] = useState('');
  const timer = useRef(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; if (timer.current) clearInterval(timer.current); }; }, []);

  // Ask the NAS only when the kept answer is stale (lib/garage-header.js).
  useEffect(() => {
    if (!token) return undefined;
    const { at } = loadGarages(storage);
    if (!garagesStale(at)) return undefined;
    let live = true;
    fetchDevices(token, fetchImpl || globalThis.fetch).then((r) => {
      if (!live) return;
      const keep = keepAfterRead(r);
      if (keep === 'replace') setGarages(saveGarages(garagesFor(r.devices, []), Date.now(), storage));
      else if (keep === 'clear') setGarages(saveGarages([], Date.now(), storage));
    });
    return () => { live = false; };
  }, [token, fetchImpl, storage]);

  const door = garages.find((g) => g.mac === pick) || garages[0] || null;

  const send = useCallback(async () => {
    if (!door || busy || rest) return;
    setBusy(true);
    setSaid('Telling the door…');
    noteUse('garage.header.press');
    const r = await runDeviceAction(door.mac, 'garage', token, fetchImpl || globalThis.fetch);
    if (!alive.current) return;
    setBusy(false);
    setSaid(r.message);
    if (r.kind === 'ok' || r.kind === 'too-soon') {
      setRest(true);
      setTimeout(() => { if (alive.current) setRest(false); }, ACTION_REARM_MS);
    }
  }, [door, busy, rest, token, fetchImpl]);

  const cancelHold = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setProgress(0);
  }, []);
  const beginHold = useCallback(() => {
    if (!door || busy || rest) return;
    const at = Date.now();
    setSaid('');
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress(holdProgress({ startedAt: at }));
      if (holdComplete({ startedAt: at })) {
        clearInterval(timer.current); timer.current = null;
        setProgress(0);
        send();
      }
    }, 40);
  }, [door, busy, rest, send]);

  // NOTHING IS PAINTED without a key and a door.
  if (!token || !door) return null;

  return (
    <div data-testid="garage-header" className="ts-chrome-region shrink-0 self-stretch flex items-center border-l border-[#E8E4DC]">
      <button
        type="button"
        data-testid="garage-header-press"
        data-mac={door.mac}
        data-hold={progress ? progress.toFixed(2) : '0'}
        aria-label={`Hold to open or close the garage door on ${door.nickname}`}
        title={`Hold to move the garage door (${Math.round(HOLD_MS / 100) / 10}s)`}
        disabled={busy || rest}
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginHold(); } }}
        onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cancelHold(); } }}
        className="relative min-h-[44px] min-w-[44px] px-3 flex items-center gap-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#E8E4DC] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 whitespace-nowrap"
      >
        <span aria-hidden="true" data-testid="garage-header-fill" className="absolute inset-y-0 left-0 bg-[#E8E4DC] pointer-events-none" style={{ width: `${Math.round(progress * 100)}%` }} />
        <span className="relative flex items-center gap-1.5">
          <UiIcon name="home" />
          {busy ? 'Telling' : rest ? 'Sent' : garages.length > 1 ? door.nickname : 'Garage'}
        </span>
      </button>
      {garages.length > 1 ? (
        <select
          data-testid="garage-header-pick"
          aria-label="Which garage door the button moves"
          value={door.mac}
          onChange={(e) => { setPick(e.target.value); try { (storage || localStorage).setItem(PICK_KEY, e.target.value); } catch { /* per device */ } setSaid(''); }}
          className="min-h-[44px] bg-transparent border-l border-[#E8E4DC] px-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {garages.map((g) => <option key={g.mac} value={g.mac}>{g.nickname}</option>)}
        </select>
      ) : null}
      <span data-testid="garage-header-said" role="status" aria-live="polite" className="sr-only">{said}</span>
    </div>
  );
}
