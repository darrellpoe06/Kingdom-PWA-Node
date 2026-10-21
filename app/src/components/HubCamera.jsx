// =============================================================================
// HubCamera — the Life Hub's live camera, or a painted home that says what it is (DR-1184)
// =============================================================================
// Darrell, 2026-10-21, circling the empty space beside the Life Hub's title:
// "I would to have a live stream of the camera chosen by the user as a
// livestream... right where the white box is... With a connect a camera feed or
// even a ability to see smaller ones and click on one to stay there
// consistently... it should be a picture of their home or a home and the text
// explains the function of the space." And: "Advertising the app... family
// operating system shows privileges other's potential users would like to be
// able to use..." and "this would be great to have as another big picture
// location for advertising that surveillance is also available."
//
// THE REALITY TRACE (DR-0061):
//  - REAL DATA. The credential is cameraCredential({bridge: bridgeToken()}),
//    the family key or a grant on this device. listUrl() with it answers the
//    cameras that credential opens, and only those (the NAS is the wall). The
//    live picture is TileLive, the Cameras tab's own tile, so this is one road
//    and one player, not a second copy. The small frames are snapUrl() with the
//    same key. The kept choice is lib/hub-camera.js on this device.
//  - THE SURFACE. LifeHub.jsx's header, the Big Picture tab's home (DR-1046),
//    in the empty space Darrell circled.
//  - THE ASSUMPTION, STATED. Unlike the Poe Properties door (DR-1176), which
//    keeps its photograph and plays the porch only on a press, the Hub plays
//    the chosen camera on its own: only a device holding a camera key ever sees
//    it, and Darrell asked for it live. It plays the camera's SD twin when the
//    NAS keeps one, the small frames are still pictures refreshed once a
//    minute (never more live views: the NAS allows three of one camera), and
//    leaving the Hub unmounts TileLive, whose cleanup gives the stream back
//    (camera-video.js, DR-1097 nineteenth read).
//  - A DEVICE WITH NO KEY is never shown a camera. It sees a painted home (the
//    house keeps no stock photography, HomeHero.jsx) and the words for the
//    space: the promoting half, in the Family Operating Systems voice.
import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { cameraCredential, listUrl, snapUrl, parseCameraList, authHeaders, fetchWithTimeout, FETCH_TIMEOUT_MS, FRAME_TIMEOUT_MS } from '../lib/cameras.js';
import { bridgeToken } from '../lib/nas-photos.js';
import {
  loadHubCamera, saveHubCamera, pickHubCamera, hubThumbs, hubCameraState,
  loadHubCameraHidden, saveHubCameraHidden,
  HUB_CAMERA_WORDS, HUB_THUMB_REFRESH_MS, HUB_THUMB_WIDTH,
} from '../lib/hub-camera.js';

// The Cameras tab's module is large and the Hub is the home screen: its player
// is fetched only when there is a camera to play.
const TileLive = lazy(() => import('./Cameras.jsx').then((m) => ({ default: m.TileLive })));

const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const SERIF = { fontFamily: '"Fraunces", serif' };

/** A home at dusk with a camera on its eave: the picture for a device with no camera. */
function PaintedHome() {
  return (
    <svg aria-hidden="true" className="absolute inset-0 w-full h-full" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="poe-hub-home-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D7B36A" />
          <stop offset="0.45" stopColor="#B9834A" />
          <stop offset="1" stopColor="#3B4A42" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="180" fill="url(#poe-hub-home-sky)" />
      <path d="M0 150 L70 118 L140 140 L220 112 L320 136 L320 180 L0 180Z" fill="#2E4A3E" />
      <rect x="112" y="92" width="96" height="62" fill="#1F3A2E" />
      <path d="M100 96 L160 52 L220 96Z" fill="#16291F" />
      <rect x="150" y="118" width="20" height="36" fill="#0F1C16" />
      <rect x="124" y="106" width="16" height="14" fill="#F0D58A" />
      <rect x="180" y="106" width="16" height="14" fill="#F0D58A" />
      <rect x="204" y="88" width="12" height="7" rx="2" fill="#2B2F2D" />
      <circle cx="207" cy="91.5" r="1.8" fill="#F0D58A" />
      <path d="M0 168 L320 162 L320 180 L0 180Z" fill="#16291F" />
    </svg>
  );
}

/** The small frames, asked with the device's own key, once a minute while the page is visible. */
function useThumbFrames(cameras, token, fetchImpl) {
  const [frames, setFrames] = useState({});
  const ref = useRef({});
  const key = cameras.map((c) => c.id).join(',');
  useEffect(() => {
    if (!token || !key) return undefined;
    const ids = key.split(',');
    const f = fetchImpl || globalThis.fetch;
    let stop = false;
    let timer = null;
    const one = async (id) => {
      try {
        const r = await fetchWithTimeout(snapUrl(id, { w: HUB_THUMB_WIDTH }), { headers: authHeaders(token) }, FRAME_TIMEOUT_MS, f);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const blob = await r.blob();
        if (stop) return;
        const url = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : '';
        const prev = ref.current[id];
        if (prev && prev.url) { try { URL.revokeObjectURL(prev.url); } catch { /* gone */ } }
        ref.current = { ...ref.current, [id]: { url, error: '' } };
      } catch (e) {
        ref.current = { ...ref.current, [id]: { ...(ref.current[id] || {}), error: String((e && e.message) || e) } };
      }
      if (!stop) setFrames(ref.current);
    };
    const sweep = async () => {
      if (stop) return;
      if (typeof document === 'undefined' || document.visibilityState !== 'hidden') {
        for (const id of ids) { if (!stop) await one(id); }
      }
      if (!stop) timer = setTimeout(sweep, HUB_THUMB_REFRESH_MS);
    };
    sweep();
    return () => {
      stop = true;
      clearTimeout(timer);
      for (const v of Object.values(ref.current)) { if (v && v.url) { try { URL.revokeObjectURL(v.url); } catch { /* gone */ } } }
      ref.current = {};
    };
  }, [key, token, fetchImpl]);
  return frames;
}

export default function HubCamera({ setView = null, credential = null, fetchImpl = null, storage = null }) {
  const cred = credential || cameraCredential({ bridge: bridgeToken() });
  const [list, setList] = useState({ status: cred.token ? 'loading' : 'no-credential', cameras: [] });
  const [chosenId, setChosenId] = useState(() => loadHubCamera(storage));
  // CLOSED ON THIS DEVICE (DR-1191; Darrell 2026-10-21: "I need to be able to
  // close the cameras on the front page"). Closed is remembered per device,
  // the way back stays where the cameras were (never a dead end), and the
  // chosen camera is kept for when they are shown again.
  const [hidden, setHidden] = useState(() => loadHubCameraHidden(storage));
  const [now, setNow] = useState(() => Date.now());

  // WHICH CAMERAS THIS DEVICE'S CREDENTIAL OPENS, asked once with its own key.
  useEffect(() => {
    if (!cred.token) { setList({ status: 'no-credential', cameras: [] }); return undefined; }
    let on = true;
    const f = fetchImpl || globalThis.fetch;
    (async () => {
      try {
        const r = await fetchWithTimeout(listUrl(), { headers: authHeaders(cred.token) }, FETCH_TIMEOUT_MS, f);
        let body = null; try { body = await r.json(); } catch { body = null; }
        if (!on) return;
        // An unknown answer is not "no cameras" (DR-0076).
        setList(r.status === 200 ? { status: 'ready', cameras: parseCameraList(body) } : { status: `http-${r.status}`, cameras: [] });
      } catch { if (on) setList({ status: 'unreachable', cameras: [] }); }
    })();
    return () => { on = false; };
  }, [cred.token, fetchImpl]);

  const state = hubCameraState({ token: cred.token, status: list.status, cameras: list.cameras });
  const chosen = state === 'live' ? pickHubCamera(list.cameras, chosenId) : null;
  // EVERY other camera, small (DR-1191: "also choose any camera"), not the
  // first four: the grid wraps, and the picker beneath names them all.
  const thumbs = useMemo(() => (state === 'live' && !hidden ? hubThumbs(list.cameras, chosen, list.cameras.length) : []), [state, hidden, list.cameras, chosen]);
  const frames = useThumbFrames(thumbs, cred.token, fetchImpl);

  // TileLive's reconnect countdown reads a clock; it ticks only while a camera plays.
  useEffect(() => {
    if (state !== 'live' || hidden) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state, hidden]);

  const choose = (cam) => { saveHubCamera(cam.id, storage); setChosenId(cam.id); };
  const setClosed = (v) => { saveHubCameraHidden(v, storage); setHidden(v); };
  const openCameras = setView ? () => setView('cameras') : null;
  const W = HUB_CAMERA_WORDS;

  if (state === 'advert') {
    return (
      <section data-testid="hub-camera" data-state="advert" aria-label={W.title} className="relative overflow-hidden rounded-2xl bg-[#1F3A2E] text-[#F6F1E7] min-h-[10rem]">
        <PaintedHome />
        <div className="relative p-4 flex flex-col justify-end min-h-[10rem] bg-gradient-to-t from-[#16291F] via-[#16291F]/70 to-transparent">
          <div className="text-base font-semibold" style={SERIF}>{W.title}</div>
          <p data-testid="hub-camera-advert" className="text-xs leading-snug mt-1">{W.advert}</p>
          <p className="text-[0.6875rem] leading-snug mt-1 opacity-90">{W.advertMore}</p>
        </div>
      </section>
    );
  }

  if (hidden) {
    return (
      <section data-testid="hub-camera" data-state="hidden" aria-label={W.title} className="rounded-2xl bg-[#1F3A2E] text-[#F6F1E7] p-2 flex items-center justify-between gap-2 flex-wrap">
        <p data-testid="hub-camera-hidden" className="text-xs leading-snug px-1">{W.hidden}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => setClosed(false)} data-testid="hub-camera-show" className={`min-h-[36px] px-2 text-[0.625rem] uppercase tracking-wider border border-[#F6F1E7]/50 rounded-full ${FOCUS_RING}`}>
            {W.show}
          </button>
          {openCameras ? (
            <button type="button" onClick={openCameras} data-testid="hub-camera-open" className={`min-h-[36px] px-2 text-[0.625rem] uppercase tracking-wider border border-[#F6F1E7]/50 rounded-full ${FOCUS_RING}`}>
              Cameras
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section data-testid="hub-camera" data-state={state} aria-label={W.title} className="rounded-2xl bg-[#1F3A2E] text-[#F6F1E7] p-2 space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-sm font-semibold truncate" style={SERIF}>{chosen ? chosen.name : W.title}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {openCameras ? (
            <button type="button" onClick={openCameras} data-testid="hub-camera-open" className={`min-h-[36px] px-2 text-[0.625rem] uppercase tracking-wider border border-[#F6F1E7]/50 rounded-full ${FOCUS_RING}`}>
              Cameras
            </button>
          ) : null}
          <button type="button" onClick={() => setClosed(true)} data-testid="hub-camera-hide" aria-label={W.hide} title={W.hide} className={`min-h-[36px] min-w-[36px] px-2 text-sm leading-none border border-[#F6F1E7]/50 rounded-full ${FOCUS_RING}`}>
            ×
          </button>
        </div>
      </div>
      {state === 'live' && chosen ? (
        <div className="rounded-xl overflow-hidden" data-testid="hub-camera-live" data-camera={chosen.id}>
          <Suspense fallback={<div className="aspect-video bg-black grid place-items-center text-xs text-white/80">Opening live…</div>}>
            <TileLive key={chosen.id} cam={chosen} token={cred.token} liveMax={0} now={now} sd={chosen.sd === true} />
          </Suspense>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl aspect-video">
          <PaintedHome />
          <p data-testid="hub-camera-says" className="absolute inset-x-0 bottom-0 p-3 text-xs leading-snug bg-[#16291F]/85">
            {state === 'reading' ? W.reading : state === 'connect' ? W.connect : W.noAnswer}
          </p>
        </div>
      )}
      {thumbs.length ? (
        <div>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Your other cameras">
            {thumbs.map((c) => {
              const fr = frames[c.id] || {};
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => choose(c)}
                  data-testid={`hub-camera-thumb-${c.id}`}
                  aria-label={`Keep ${c.name} here`}
                  title={c.name}
                  className={`relative aspect-video rounded-md overflow-hidden bg-black ${FOCUS_RING}`}
                >
                  {fr.url ? <img src={fr.url} alt="" className="w-full h-full object-cover" /> : null}
                  <span className="absolute inset-x-0 bottom-0 px-1 text-[0.5625rem] leading-tight truncate bg-black/60 text-white">{c.name}</span>
                </button>
              );
            })}
          </div>
          <p className="px-1 mt-1 text-[0.625rem] opacity-90">{W.choose}</p>
        </div>
      ) : null}
      {state === 'live' && list.cameras.length > 1 ? (
        <label className="block px-1 text-[0.625rem] uppercase tracking-wider opacity-90">
          <span className="sr-only">{W.chooseAny}</span>
          <select
            data-testid="hub-camera-pick"
            aria-label={W.chooseAny}
            value={chosen ? chosen.id : ''}
            onChange={(e) => { const cam = list.cameras.find((c) => c.id === e.target.value); if (cam) choose(cam); }}
            className={`w-full min-h-[36px] px-2 py-1 rounded-md bg-[#16291F] text-[#F6F1E7] border border-[#F6F1E7]/40 text-xs normal-case tracking-normal ${FOCUS_RING}`}
          >
            {list.cameras.filter((c) => c && c.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      ) : null}
    </section>
  );
}
