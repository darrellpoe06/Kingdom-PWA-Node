// =============================================================================
// Cameras — the family's cameras, inside the app (DR-0756)
// =============================================================================
// Darrell 2026-10-06: "I want to be able to see my wyze cam feeds inside my
// PoeTech App... and any system I own..." FAMILY-ONLY (surfaces.js: requires
// 'family', hidden otherwise — the home is the family's business).
//
// Reality-trace, out loud (CLAUDE.md, P15/P16):
//   REAL DATA  go2rtc's live stream list on the NAS, read through the same-
//              origin /cams road (cams_forwarder.py). No table, no seed, no
//              hand-typed registry: a camera is here because the restreamer
//              has it. Per-frame freshness, fetch time and bytes are MEASURED
//              in this browser; time-to-first-frame of a live view is measured
//              by the <video> element's own events.
//   END-TO-END the family bridge bearer every family device already provisions
//              (lib/bridge-provision.js) unlocks /list; media URLs carry a
//              90 s one-camera ticket the forwarder mints.
//   THE SCREEN snapshots by default (a few KB each, every 5 s, only while the
//              tab is visible); a tap opens full motion IN PLACE, under the
//              tapped tile (UX-PATTERNS 2e — the content comes to the finger,
//              the screen never flies); the NAS ends a live view at its
//              ceiling and this screen says so and offers to resume.
//   PREMISES   stated in lib/cameras.js: MP4 does not play on Safari/iOS, HLS
//              does — the device's own <video> is asked, never a UA sniff.
//
// Every state is derived: no key on this device / key refused / road dark /
// restreamer up but empty (then the two paste-ready setup steps live right
// here) / cameras. A surface never goes blank (P15, DR-0381): each state says
// what it sees, what is missing, and the way to fix it. Nothing green is
// painted. Progressive disclosure (UX-PATTERNS 3): the grid is the essential
// view; "how each system is added" is on expand.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { bridgeToken } from '../lib/nas-photos.js';
import {
  SNAPSHOT_INTERVAL_MS, FETCH_TIMEOUT_MS, LIVE_FIRST_FRAME_TIMEOUT_MS,
  healthUrl, listUrl, ticketUrl, snapUrl, liveUrl, pickLiveMode,
  parseCameraList, groupByKind, KINDS, classifyServiceState,
  formatAge, formatBytes, fetchWithTimeout, authHeaders, setupCommands,
  WYZE_FIELDS, setupWyze,
} from '../lib/cameras.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnGhost = 'text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[36px] px-2 focus:outline focus:outline-2 focus:outline-[#B85838]';
const chipCls = 'inline-block text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border';
const chip = {
  ok: `${chipCls} border-[#5A6E3D] text-[#5A6E3D] bg-[#5A6E3D]/5`,
  wait: `${chipCls} border-[#8A6E1F] text-[#8A6E1F] bg-[#8A6E1F]/5`,
  blocked: `${chipCls} border-[#B85838] text-[#B85838] bg-[#B85838]/5`,
  muted: `${chipCls} border-[#B8B4AC] text-[#5A5751] bg-white`,
};

const inputCls = 'w-full border border-[#1A1815] bg-white text-[#1A1815] px-3 py-2 text-sm min-h-[40px] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';

// WYZE SIGN-IN, ONCE, HERE (2026-10-07; Darrell: "Is that the easiest way to
// build it so I don't have to do much work for it to work right away?"). The
// four values are typed once and handed over the locked road to go2rtc's own
// sign-in on the NAS, which keeps the account and registers every camera it
// lists. The browser keeps nothing: the fields are cleared the moment the NAS
// answers. The result names each camera and says plainly which units the
// restreamer cannot stream yet (non-DTLS firmware), never a guess.
function WyzeSetup({ token, onAdded }) {
  const [fields, setFields] = useState({ email: '', password: '', api_id: '', api_key: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    const r = await setupWyze(fields, token);
    setBusy(false);
    setResult(r);
    if (r.kind === 'ok') {
      setFields({ email: '', password: '', api_id: '', api_key: '' });
      if (onAdded) onAdded(r);
    }
  };
  const tone = result ? (result.kind === 'ok' ? 'text-[#2F6B3A]' : 'text-[#8A2E1F]') : '';
  return (
    <form onSubmit={submit} data-testid="wyze-setup" className="mt-3 border-t border-[#E8E4DC] pt-3" aria-busy={busy}>
      <div className={labelCls}>Sign in to Wyze once, here</div>
      <p className="text-xs text-[#5A5751] mt-1 mb-2">
        Get an API ID and API Key from the Wyze developer portal (Wyze account, API Key). The NAS signs in with them, keeps them, and lists your cameras. Nothing is kept in this browser.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {WYZE_FIELDS.map((d) => (
          <label key={d.key} className="block">
            <span className={labelCls}>{d.label}</span>
            <input
              className={inputCls}
              type={d.type}
              name={d.key}
              autoComplete={d.autoComplete}
              value={fields[d.key]}
              onChange={(e) => setFields((f) => ({ ...f, [d.key]: e.target.value }))}
              disabled={busy}
              aria-label={d.label}
              required
            />
            <span className="block text-[0.625rem] text-[#5A5751] mt-0.5">{d.hint}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <button type="submit" className={`${btnDark}`} disabled={busy}>{busy ? 'Signing in to Wyze and listing cameras…' : 'Sign in and add my cameras'}</button>
        {busy ? <span className="text-xs text-[#5A5751]">This can take up to a minute: Wyze lists the account, the NAS registers each camera.</span> : null}
      </div>
      {result ? (
        <div className={`text-sm mt-3 ${tone}`} role="status" aria-live="polite" data-testid="wyze-setup-result">
          <div>{result.message}</div>
          {Array.isArray(result.cameras) && result.cameras.length ? (
            <ul className="mt-1 text-xs text-[#1A1815] list-disc pl-5">
              {result.cameras.map((c) => (
                <li key={c.id}>{c.name}{c.model ? ` · ${c.model}` : ''}{c.existing ? ' · already here' : c.registered ? ' · added' : ' · the restreamer refused it'}{c.dtls === false ? ' · not yet streamable (needs DTLS firmware)' : ''}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function CopyBlock({ title, text, note }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard needs a gesture / https; the text is selectable */ }
  };
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-[#1A1815]">{title}</div>
        <button type="button" onClick={copy} className={`${btnGhost}`}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="mt-1 whitespace-pre-wrap break-all text-[0.6875rem] leading-snug bg-[#FAF8F4] border border-[#E8E4DC] p-2 font-mono select-all">{text}</pre>
      {note ? <div className="mt-1 text-[0.6875rem] text-[#5A5751]">{note}</div> : null}
    </div>
  );
}

function KindsHelp() {
  return (
    <div className="mt-2 text-xs text-[#1A1815]">
      <p className="text-[#5A5751] mb-2">The restreamer on the NAS speaks each system&apos;s own protocol. A new system is one line in its config (<code>/volume1/docker/go2rtc/go2rtc.yaml</code>, under <code>streams:</code>), or a sign-in in its WebUI; it shows up here on the next refresh.</p>
      <ul className="space-y-1">
        {KINDS.filter((k) => k.how).map((k) => (
          <li key={k.id}><span className="font-semibold">{k.label}</span> — <span className="font-mono text-[0.6875rem] break-all">{k.how}</span></li>
        ))}
      </ul>
    </div>
  );
}

export default function Cameras() {
  const token = bridgeToken();
  const [health, setHealth] = useState(null);       // forwarder /health JSON (+status), or {status, error}
  const [list, setList] = useState({ status: 0, cameras: [], at: 0, networkError: false, loaded: false });
  const [frames, setFrames] = useState({});          // id -> {url, at, ms, bytes, error}
  const [live, setLive] = useState(null);            // {id, name, mode, src, startedAt, firstFrameMs, stalls, ended, error, opening}
  const [showAdd, setShowAdd] = useState(false);
  const [showShell, setShowShell] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const framesRef = useRef({});
  const videoRef = useRef(null);
  const liveFirstFrameTimer = useRef(null);

  // Clock for the "N s ago" lines (one per second, UI only).
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // --- health + list ----------------------------------------------------------
  const load = useCallback(async () => {
    try {
      const r = await fetchWithTimeout(healthUrl(), {}, FETCH_TIMEOUT_MS);
      let body = null;
      try { body = await r.json(); } catch { body = null; }
      setHealth({ ...(body && typeof body === 'object' ? body : {}), status: r.status });
    } catch (e) {
      setHealth({ status: 0, ok: false, error: String((e && e.message) || e) });
    }
    if (!token) { setList({ status: 0, cameras: [], at: Date.now(), networkError: false, loaded: true }); return; }
    try {
      const r = await fetchWithTimeout(listUrl(), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS);
      let body = null;
      try { body = await r.json(); } catch { body = null; }
      setList({ status: r.status, cameras: r.status === 200 ? parseCameraList(body) : [], at: Date.now(), networkError: false, loaded: true });
    } catch {
      setList({ status: 0, cameras: [], at: Date.now(), networkError: true, loaded: true });
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const state = !list.loaded ? 'loading' : classifyServiceState({
    tokenPresent: !!token,
    status: list.status,
    count: list.cameras.length,
    networkError: list.networkError,
  });

  // --- snapshot sweep: sequential, visible-only, timed, cancellable ----------
  const liveOpenId = live && !live.ended ? live.id : '';
  useEffect(() => {
    if (state !== 'ready' || typeof document === 'undefined') return undefined;
    let stop = false;
    let timer = null;
    const sweep = async () => {
      if (stop) return;
      if (document.visibilityState === 'visible') {
        for (const cam of list.cameras) {
          if (stop) return;
          if (cam.id === liveOpenId) continue; // the live view IS the frame
          const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          try {
            const r = await fetchWithTimeout(snapUrl(cam.id), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const prev = framesRef.current[cam.id];
            if (prev && prev.url) { try { URL.revokeObjectURL(prev.url); } catch { /* gone */ } }
            const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            framesRef.current = { ...framesRef.current, [cam.id]: { url, at: Date.now(), ms: Math.round(t1 - t0), bytes: blob.size, error: '' } };
          } catch (e) {
            const prev = framesRef.current[cam.id] || {};
            framesRef.current = { ...framesRef.current, [cam.id]: { ...prev, error: String((e && e.message) || e), errorAt: Date.now() } };
          }
          if (!stop) setFrames(framesRef.current);
        }
      }
      if (!stop) timer = setTimeout(sweep, SNAPSHOT_INTERVAL_MS);
    };
    sweep();
    const onVis = () => { if (document.visibilityState === 'visible' && !stop) { clearTimeout(timer); sweep(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop = true; clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [state, list.cameras, token, liveOpenId]);

  // Revoke every object URL on unmount.
  useEffect(() => () => {
    for (const f of Object.values(framesRef.current)) { if (f && f.url) { try { URL.revokeObjectURL(f.url); } catch { /* gone */ } } }
  }, []);

  // --- live view --------------------------------------------------------------
  const openLive = useCallback(async (cam) => {
    clearTimeout(liveFirstFrameTimer.current);
    setLive({ id: cam.id, name: cam.name, mode: '', src: '', startedAt: Date.now(), firstFrameMs: null, stalls: 0, ended: false, error: '', opening: true });
    try {
      const r = await fetchWithTimeout(ticketUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: cam.id }) }, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(r.status === 401 ? 'the family key was refused' : `ticket HTTP ${r.status}`);
      const { ticket } = await r.json();
      const probe = typeof document !== 'undefined' ? document.createElement('video') : null;
      const mode = pickLiveMode(probe && typeof probe.canPlayType === 'function' ? (t) => probe.canPlayType(t) : null);
      const startedAt = Date.now();
      setLive({ id: cam.id, name: cam.name, mode, src: liveUrl(cam.id, mode, ticket), startedAt, firstFrameMs: null, stalls: 0, ended: false, error: '', opening: false });
      liveFirstFrameTimer.current = setTimeout(() => {
        setLive((l) => (l && l.id === cam.id && l.firstFrameMs == null && !l.ended)
          ? { ...l, error: `No picture after ${Math.round(LIVE_FIRST_FRAME_TIMEOUT_MS / 1000)} s. The camera may be asleep or unreachable from the NAS; the frame line below says when it last answered.` }
          : l);
      }, LIVE_FIRST_FRAME_TIMEOUT_MS);
    } catch (e) {
      setLive((l) => l ? { ...l, opening: false, error: String((e && e.message) || e) } : l);
    }
  }, [token]);

  const closeLive = useCallback(() => {
    clearTimeout(liveFirstFrameTimer.current);
    const v = videoRef.current;
    if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch { /* fine */ } }
    setLive(null);
  }, []);

  useEffect(() => () => clearTimeout(liveFirstFrameTimer.current), []);

  const liveMax = health && Number.isFinite(Number(health.live_max_seconds)) ? Number(health.live_max_seconds) : 300;
  const onLoadedData = () => setLive((l) => (l && l.firstFrameMs == null) ? { ...l, firstFrameMs: Date.now() - l.startedAt, error: '' } : l);
  const onWaiting = () => setLive((l) => l ? { ...l, stalls: (l.stalls || 0) + 1 } : l);
  const onEnded = () => setLive((l) => l ? { ...l, ended: true } : l);
  const onError = () => setLive((l) => l ? { ...l, error: l.firstFrameMs == null ? 'The browser could not open this stream.' : 'The stream stopped.', ended: true } : l);

  // --- render ---------------------------------------------------------------
  const setup = setupCommands();
  const roadUp = !!(health && health.status === 200);
  const groups = groupByKind(list.cameras);

  const roadChip = health == null ? <span className={chip.muted}>checking the road</span>
    : roadUp ? <span className={chip.ok}>NAS restreamer up{health.go2rtc ? ` · go2rtc ${health.go2rtc}` : ''}{Number.isFinite(Number(health.streams)) ? ` · ${health.streams} stream${Number(health.streams) === 1 ? '' : 's'}` : ''}</span>
    : <span className={chip.blocked}>{health.status === 502 ? 'restreamer dark' : health.status ? `road HTTP ${health.status}` : 'road unreachable'}</span>;

  // The live view, rendered IN PLACE under the tapped tile (a full-width grid
  // row), never in a panel the eye must travel to (UX-PATTERNS 2e).
  const liveRow = live ? (
    <div className="col-span-full bg-white border border-[#1A1815] p-3 sm:p-4" data-testid="live-view">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className={labelCls}>Live</div>
          <div className="text-base font-semibold text-[#1A1815]">{live.name}</div>
        </div>
        <div className="flex items-center gap-2">
          {live.mode ? <span className={chip.muted}>{live.mode === 'hls' ? 'HLS · this device plays it natively' : 'MP4 · this device plays it natively'}</span> : null}
          <button type="button" onClick={closeLive} className={`${btnDark}`}>Close</button>
        </div>
      </div>
      <div className="mt-2 bg-black aspect-video w-full flex items-center justify-center">
        {live.src && !live.ended ? (
          <video
            ref={videoRef}
            key={live.src}
            src={live.src}
            autoPlay
            muted
            playsInline
            controls
            className="w-full h-full"
            onLoadedData={onLoadedData}
            onWaiting={onWaiting}
            onEnded={onEnded}
            onError={onError}
          />
        ) : (
          <div className="text-white text-xs p-4 text-center">
            {live.opening ? 'Asking the NAS for a playback ticket...'
              : live.ended ? `Live view ended after ${Math.round((Date.now() - live.startedAt) / 1000)} s (the NAS stops each live view at ${liveMax} s to protect the home link).`
              : live.error || 'No stream.'}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap text-[0.6875rem] text-[#5A5751]">
        <div>
          {live.firstFrameMs != null ? <span className={chip.ok}>first picture in {(live.firstFrameMs / 1000).toFixed(1)} s</span>
            : live.error ? <span className={chip.blocked}>{live.error}</span>
            : live.src ? <span className={chip.wait}>waiting for the first picture</span> : null}
          {live.stalls > 0 ? <span className={`${chip.wait} ml-1`}>{live.stalls} stall{live.stalls === 1 ? '' : 's'}</span> : null}
          {live.firstFrameMs != null && !live.ended ? <span className="ml-2">on for {Math.max(0, Math.round((now - live.startedAt) / 1000))} s of {liveMax}</span> : null}
        </div>
        {live.ended ? <button type="button" className={`${btnDark}`} onClick={() => openLive({ id: live.id, name: live.name })}>Resume</button> : null}
      </div>
    </div>
  ) : null;

  return (
    <div>
      <SectionTitle eyebrow="Your cameras, from your own server · snapshots every 5 s while this tab is open · tap one for full motion">Cameras</SectionTitle>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 text-[0.6875rem] text-[#5A5751]">
        <div>{roadChip}</div>
        <div className="flex items-center gap-2">
          {list.at ? <span>list read {formatAge(Math.max(0, now - list.at))}</span> : null}
          <button type="button" onClick={load} className={`${btnGhost}`}>Refresh</button>
        </div>
      </div>

      {state === 'loading' && (
        <div className={card}><div className={labelCls}>Reading the camera road...</div></div>
      )}

      {state === 'no-token' && (
        <div className={card}>
          <div className={labelCls}>This device has no family key yet</div>
          <p className="text-sm mt-1">
            Cameras are the family&apos;s. A signed-in family device provisions the key itself (DR-0613); open the app signed in as family and this unlocks.
            Nothing from the cameras is sent to this device until then.
          </p>
          {health && !roadUp ? <p className="text-xs text-[#B85838] mt-2">Separately: the camera road is not answering right now ({health.status || 'no response'}).</p> : null}
        </div>
      )}

      {state === 'unauthorized' && (
        <div className={card}>
          <div className={labelCls}>The family key on this device was refused</div>
          <p className="text-sm mt-1">The NAS said no to this device&apos;s key (HTTP {list.status}). It was rotated or this copy is stale; sign out and in as family to provision the current one.</p>
        </div>
      )}

      {state === 'unreachable' && (
        <div className={card}>
          <div className={labelCls}>The camera road is not answering</div>
          <p className="text-sm mt-1">
            {list.networkError ? 'This device could not reach poetech.us/cams at all.' : `The road answered HTTP ${list.status}.`}
            {' '}The NAS may be off, the restreamer may not have started yet, or the Funnel mount is missing. The installer runs every services-sync cycle (15 min) and mounts /cams only when both pieces answer.
          </p>
          <p className="text-xs text-[#5A5751] mt-2">Verify on the NAS: <code>curl -s http://127.0.0.1:8773/health</code> and <code>journalctl -u poetech-cams -n 50</code>.</p>
        </div>
      )}

      {state === 'error' && (
        <div className={card}>
          <div className={labelCls}>Unexpected answer</div>
          <p className="text-sm mt-1">The camera road answered HTTP {list.status}. Nothing is shown rather than something guessed.</p>
        </div>
      )}

      {state === 'empty' && (
        <div className={card}>
          <div className={labelCls}>The restreamer is up and has no cameras yet</div>
          <p className="text-sm mt-1">
            Everything self-deployed. Wyze cameras need the one thing the repo never holds: your Wyze sign-in. Type it once below and the NAS does the rest.
          </p>
          <WyzeSetup token={token} onAdded={() => { load(); }} />
          <button type="button" className={`${btnGhost} mt-3`} onClick={() => setShowShell((v) => !v)}>{showShell ? 'Hide' : 'Prefer a terminal?'} the two PowerShell steps</button>
          {showShell ? (<><CopyBlock {...setup.place} /><CopyBlock {...setup.tunnel} /></>) : null}
          <p className="text-xs text-[#5A5751] mt-3">
            Honest limits: only Wyze units on DTLS firmware stream this way; Gwell models (Cam OG, Pan v4, Floodlight Pro) are not yet supported by the restreamer. Any other system you own is one line in its config.
          </p>
          <button type="button" className={`${btnGhost} mt-2`} onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Hide' : 'Show'} how each kind of system is added</button>
          {showAdd && <KindsHelp />}
        </div>
      )}

      {state === 'ready' && (
        <>
          {groups.map((g) => (
            <section key={g.kind} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className={labelCls}>{g.label} · {g.cameras.length}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.cameras.map((cam) => {
                  const f = frames[cam.id];
                  const fresh = f && f.url;
                  const isLive = live && live.id === cam.id;
                  return (
                    <React.Fragment key={cam.id}>
                      <div className={`bg-white border ${isLive ? 'border-[#B85838]' : 'border-[#1A1815]'}`}>
                        <button type="button" onClick={() => (isLive ? closeLive() : openLive(cam))} className="block w-full text-left min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label={isLive ? `Close live view of ${cam.name}` : `Open live view of ${cam.name}`}>
                          <div className="aspect-video bg-[#1A1815] flex items-center justify-center overflow-hidden">
                            {fresh ? <img src={f.url} alt={`${cam.name}, latest frame`} className="w-full h-full object-cover" />
                              : <span className="text-white/80 text-xs p-3 text-center">{f && f.error ? 'No frame yet from this camera' : 'Fetching the first frame...'}</span>}
                          </div>
                        </button>
                        <div className="p-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#1A1815] truncate">{cam.name}</div>
                            <div className="text-[0.625rem] text-[#5A5751]">
                              {fresh ? <>frame {formatAge(Math.max(0, now - f.at))} · {f.ms} ms · {formatBytes(f.bytes)}</> : <>&nbsp;</>}
                              {f && f.error ? <span className="text-[#B85838]"> · last try failed: {f.error}</span> : null}
                            </div>
                          </div>
                          <button type="button" onClick={() => (isLive ? closeLive() : openLive(cam))} className={`${btnGhost}`}>{isLive ? 'Close' : 'Live'}</button>
                        </div>
                      </div>
                      {isLive ? liveRow : null}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          ))}

          <div className={card}>
            <button type="button" className={`${btnGhost}`} onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Hide' : 'Add a system you own'}</button>
            {showAdd && <KindsHelp />}
          </div>
        </>
      )}
    </div>
  );
}
