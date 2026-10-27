// =============================================================================
// CamerasTile — the Cameras option on the front page (DR-1237)
// =============================================================================
// Darrell, 2026-10-27: "shouldn't we see the camera option on the front page
// inside the PoeTech App?" One tile, the first thing after the welcome on both
// homes (the Life Hub and the Current View), for the family and for a device
// holding a camera grant — canSeeCameras, the same predicate the nav entry and
// the shell's render gate ask (lib/surface-access.js). It opens view
// 'cameras'. The line under it is read from the camera road (lib/cameras-tile.js),
// never painted. A viewer the predicate refuses gets no tile and no DOM.
// =============================================================================
import React, { useEffect, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import { canSeeCameras } from '../lib/surface-access.js';
import { cameraCredential } from '../lib/cameras.js';
import { bridgeToken } from '../lib/nas-photos.js';
import { readCameraTile, cameraTileLine, CAMERAS_TILE, CAMERAS_TILE_REFRESH_MS } from '../lib/cameras-tile.js';

const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function CamerasTile({ viewer = null, setView = null, credential = null, fetchImpl = null }) {
  const allowed = canSeeCameras(viewer || {});
  const cred = credential || cameraCredential({ bridge: bridgeToken() });
  const [read, setRead] = useState({ state: 'reading', count: 0 });

  useEffect(() => {
    if (!allowed) return undefined;
    let on = true;
    const f = fetchImpl || globalThis.fetch;
    const go = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const r = await readCameraTile({ token: cred.token, fetchImpl: f });
      if (on) setRead(r);
    };
    go();
    const t = setInterval(go, CAMERAS_TILE_REFRESH_MS);
    return () => { on = false; clearInterval(t); };
  }, [allowed, cred.token, fetchImpl]);

  if (!allowed) return null;
  const line = cameraTileLine(read);
  return (
    <button
      type="button"
      onClick={() => { if (setView) setView(CAMERAS_TILE.view); }}
      data-testid="cameras-tile"
      data-state={read.state}
      aria-label={`${CAMERAS_TILE.label} · ${line}`}
      className={`w-full text-left rounded-2xl bg-[#1F3A2E] text-white px-3 py-2.5 min-h-[44px] flex items-center gap-3 shadow-sm hover:opacity-95 ${FOCUS_RING}`}
    >
      <span aria-hidden="true" className="text-[1.25rem] leading-none shrink-0"><UiIcon name="eye" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight" style={{ fontFamily: '"Fraunces", serif' }}>{CAMERAS_TILE.label}</span>
        <span className="block text-[0.6875rem] leading-snug opacity-90 truncate" data-testid="cameras-tile-line">{line}</span>
      </span>
      <span aria-hidden="true" className="text-[0.625rem] uppercase tracking-wider opacity-80 shrink-0">Open</span>
    </button>
  );
}
