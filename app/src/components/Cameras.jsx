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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { bridgeToken } from '../lib/nas-photos.js';
import { setReadTarget, clearReadTarget, requestRead } from '../lib/read-target.js';
import {
  SNAPSHOT_INTERVAL_MS, FETCH_TIMEOUT_MS, LIVE_FIRST_FRAME_TIMEOUT_MS,
  healthUrl, listUrl, ticketUrl, snapUrl, liveUrl, pickLiveMode,
  parseCameraList, groupByKind, KINDS, classifyServiceState,
  formatAge, formatBytes, fetchWithTimeout, authHeaders, setupCommands,
  WYZE_FIELDS, setupWyze, WYZE_API_KEY_HELP_URL, WYZE_API_KEY_STEPS,
  serviceCodeState, restartService, loadWyzeDraft, saveWyzeDraft, clearWyzeDraft,
  SNAP_CONCURRENCY, LIVE_RECONNECT_MAX, LIVE_RECONNECT_DELAY_MS, runLimited, skipFailedFrame,
  classifySnapError, fetchWhy, loadWall, saveWall, wallLimit,
} from '../lib/cameras.js';

// THE STEPS CAN BE HEARD (2026-10-07; Darrell: "possible tutorial... Ari
// explains"). The Wyze sign-in registers its steps as this screen's reading,
// so the floating reader (and the Hear the steps button) reads them aloud,
// highlighted in place, for anyone who would rather listen than read.
const WYZE_READ_OWNER = 'cameras-wyze-setup';
export function wyzeSetupReading() {
  return [
    'Sign in to Wyze once, here. This is a one-time step for the person who owns the Wyze account. Everyone else in the family only opens this tab.',
    ...WYZE_API_KEY_STEPS.map((step, i) => `Step ${i + 1}. ${step}`),
    'The API key is not in the Wyze app and not on my dot wyze dot com. It is made once on the Wyze Developer API Console, which the link opens.',
  ].join(' ');
}

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
  const [fields, setFieldsRaw] = useState(() => loadWyzeDraft());
  const setFields = (fn) => setFieldsRaw((f) => { const next = typeof fn === 'function' ? fn(f) : fn; saveWyzeDraft(next); return next; });
  const restored = useRef(Object.values(loadWyzeDraft()).some(Boolean)).current;
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
      clearWyzeDraft();
      setFieldsRaw({ email: '', password: '', api_id: '', api_key: '' });
      if (onAdded) onAdded(r);
    }
  };
  const tone = result ? (result.kind === 'ok' ? 'text-[#2F6B3A]' : 'text-[#B85838]') : '';
  useEffect(() => {
    setReadTarget(WYZE_READ_OWNER, { label: 'the Wyze sign-in steps', title: 'Sign in to Wyze once', text: wyzeSetupReading(), elementId: 'wyze-setup' });
    return () => clearReadTarget(WYZE_READ_OWNER);
  }, []);
  return (
    <form id="wyze-setup" onSubmit={submit} data-testid="wyze-setup" className="mt-3 border-t border-[#E8E4DC] pt-3" aria-busy={busy}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className={labelCls}>Sign in to Wyze once, here</div>
        <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => requestRead(WYZE_READ_OWNER, { startSentence: 0 })} data-testid="wyze-hear-steps" aria-label="Hear the steps read aloud">Hear the steps</button>
      </div>
      <p className="text-xs text-[#5A5751] mt-1 mb-2">
        One-time step for the person who owns the Wyze account. Everyone else in the family only opens this tab. The NAS signs in with these four values, keeps them, and lists your cameras. What you type stays on this device until the NAS accepts it, so a reload never makes you type it again; then it is erased here.
      </p>
      {restored ? <p className="text-xs text-[#2F6B3A] mb-2" data-testid="wyze-draft-restored">Your earlier entries are still here. Press Sign in and add my cameras when the camera service is ready.</p> : null}
      <ol className="text-xs text-[#1A1815] list-decimal pl-5 mb-2 space-y-0.5" data-testid="wyze-key-steps">
        {WYZE_API_KEY_STEPS.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <p className="text-xs mb-3">
        <a href={WYZE_API_KEY_HELP_URL} target="_blank" rel="noopener noreferrer" className="text-[#B85838] underline font-semibold min-h-[36px] inline-flex items-center focus:outline focus:outline-2 focus:outline-[#B85838]" data-testid="wyze-key-link">Open the Wyze API key page</a>
        <span className="text-[#5A5751]"> (not in the Wyze app, not on my.wyze.com)</span>
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
        <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={busy} onClick={() => { clearWyzeDraft(); setFieldsRaw({ email: '', password: '', api_id: '', api_key: '' }); }} data-testid="wyze-clear">Clear these from this device</button>
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

// THE SERVICE, RESTARTED FROM HERE (DR-0772; Darrell: "We also want all
// functions to be able to work inside the PoeTech App", "You do it!!!!!!!").
// /health says what code is running and what is on disk; when they differ
// the notice says so and the one button restarts the service on the newer
// code. No PowerShell, no ConnectBot. The road re-checks itself after.
function ServiceRestart({ token, health, onDone }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const code = serviceCodeState(health);
  const go = async () => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    const r = await restartService(token);
    setBusy(false);
    setResult(r);
    if (r.kind === 'ok' && onDone) setTimeout(onDone, 10000);
  };
  const tone = result ? (result.kind === 'ok' ? 'text-[#2F6B3A]' : 'text-[#B85838]') : '';
  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="service-restart">
      {code === 'behind' ? (
        <span className={chip.wait} data-testid="service-behind">camera service behind its code · running {health.forwarder} · on disk {health.on_disk}</span>
      ) : null}
      <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={go} disabled={busy} data-testid="service-restart-button">{busy ? 'Restarting…' : code === 'behind' ? 'Update the camera service now' : 'Restart the camera service'}</button>
      {result ? <span className={`text-[0.6875rem] ${tone}`} role="status" aria-live="polite" data-testid="service-restart-result">{result.message}</span> : null}
    </div>
  );
}

function KindsHelp() {
  return (
    <div className="mt-2 text-xs text-[#1A1815]">
      <p className="text-[#5A5751] mb-2">The restreamer on the NAS speaks each system&apos;s own protocol, the same way tinyCam Pro does: sign in once, then pull video straight from each camera. Wyze is the sign-in above; any other system is one line in its config (<code>/volume1/docker/go2rtc/go2rtc.yaml</code>, under <code>streams:</code>); it shows up here on the next refresh.</p>
      <ul className="space-y-1">
        {KINDS.filter((k) => k.how).map((k) => (
          <li key={k.id}><span className="font-semibold">{k.label}</span> — <span className="font-mono text-[0.6875rem] break-all">{k.how}</span></li>
        ))}
      </ul>
    </div>
  );
}

// ONE LIVE VIEW THAT KEEPS ITSELF ALIVE (DR-0774). Darrell's live view went
// black at 28 s with "the NAS stops each live view at 300 s", which was not
// true: the stream ended on its own (a dropped segment, a camera hiccup) and
// the app simply gave up. tinyCam reconnects; so does this. A view that ends
// before the viewer closed it is re-opened after a short pause, up to
// LIVE_RECONNECT_MAX times, with the count shown; only then does it offer
// Resume. The optional NAS clock (liveMax > 0) is treated the same way.
function LiveVideo({ cam, token, liveMax, onClose, compact = false, testId = 'live-view', now }) {
  const [st, setSt] = useState({ mode: '', src: '', startedAt: Date.now(), firstFrameMs: null, stalls: 0, ended: false, error: '', opening: true, reconnects: 0, exhausted: false });
  const timers = useRef({ first: null, reopen: null, video: null });
  const alive = useRef(true);

  const open = useCallback(async (reconnects) => {
    clearTimeout(timers.current.first);
    setSt((p) => ({ ...p, opening: true, ended: false, error: '', src: '', firstFrameMs: null, startedAt: Date.now(), reconnects, exhausted: false }));
    try {
      const r = await fetchWithTimeout(ticketUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: cam.id }) }, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(r.status === 401 ? 'the family key was refused' : r.status === 503 ? 'the NAS has all its live slots in use' : `ticket HTTP ${r.status}`);
      const { ticket } = await r.json();
      if (!alive.current) return;
      const probe = typeof document !== 'undefined' ? document.createElement('video') : null;
      const mode = pickLiveMode(probe && typeof probe.canPlayType === 'function' ? (t) => probe.canPlayType(t) : null);
      const startedAt = Date.now();
      setSt((p) => ({ ...p, mode, src: liveUrl(cam.id, mode, ticket), startedAt, firstFrameMs: null, stalls: 0, ended: false, error: '', opening: false }));
      timers.current.first = setTimeout(() => {
        setSt((p) => (p.firstFrameMs == null && !p.ended && p.src)
          ? { ...p, error: `No picture after ${Math.round(LIVE_FIRST_FRAME_TIMEOUT_MS / 1000)} s. The camera may be asleep or unreachable from the NAS; press Why? on its tile.` }
          : p);
      }, LIVE_FIRST_FRAME_TIMEOUT_MS);
    } catch (e) {
      if (!alive.current) return;
      setSt((p) => ({ ...p, opening: false, error: String((e && e.message) || e) }));
    }
  }, [cam.id, token]);

  useEffect(() => {
    alive.current = true;
    open(0);
    const t = timers.current;
    return () => {
      alive.current = false;
      clearTimeout(t.first); clearTimeout(t.reopen);
      const v = t.video;
      if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch { /* fine */ } }
    };
  }, [open]);

  // The stream ended or broke without the viewer closing it: come back.
  const endedOnItsOwn = useCallback((reason) => {
    setSt((p) => {
      if (p.ended) return p;
      const n = p.reconnects;
      if (n < LIVE_RECONNECT_MAX) {
        clearTimeout(timers.current.reopen);
        timers.current.reopen = setTimeout(() => { if (alive.current) open(n + 1); }, LIVE_RECONNECT_DELAY_MS);
        return { ...p, ended: true, error: reason, reconnecting: true };
      }
      return { ...p, ended: true, error: reason, exhausted: true, reconnecting: false };
    });
  }, [open]);

  const onLoadedData = () => setSt((p) => (p.firstFrameMs == null ? { ...p, firstFrameMs: Date.now() - p.startedAt, error: '' } : p));
  const onWaiting = () => setSt((p) => ({ ...p, stalls: (p.stalls || 0) + 1 }));
  const onEnded = () => endedOnItsOwn(liveMax > 0 && (Date.now() - st.startedAt) >= (liveMax - 2) * 1000 ? `the NAS clock ended it at ${liveMax} s` : 'the stream ended on its own');
  const onError = () => endedOnItsOwn(st.firstFrameMs == null ? 'the browser could not open this stream' : 'the stream broke');

  const elapsed = Math.max(0, Math.round(((now || Date.now()) - st.startedAt) / 1000));
  const status = st.opening ? 'Asking the NAS for a playback ticket...'
    : st.exhausted ? `Stopped after ${LIVE_RECONNECT_MAX} reconnects: ${st.error}. Press Resume to try again.`
    : st.ended ? `Reconnecting (${st.error})...`
    : st.error || 'No stream.';
  return (
    <div className={`${compact ? '' : 'col-span-full '}bg-white border border-[#1A1815] ${compact ? 'p-2' : 'p-3 sm:p-4'}`} data-testid={testId}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          {!compact ? <div className={labelCls}>Live</div> : null}
          <div className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-[#1A1815] truncate`}>{cam.name}</div>
        </div>
        <div className="flex items-center gap-2">
          {st.mode && !compact ? <span className={chip.muted}>{st.mode === 'hls' ? 'HLS · this device plays it natively' : 'MP4 · this device plays it natively'}</span> : null}
          <button type="button" onClick={onClose} className={`${compact ? btnGhost : btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`}>{compact ? 'Remove' : 'Close'}</button>
        </div>
      </div>
      <div className="mt-2 bg-black aspect-video w-full flex items-center justify-center">
        {st.src && !st.ended ? (
          <video ref={(el) => { timers.current.video = el; }} key={st.src} src={st.src} autoPlay muted playsInline controls={!compact} className="w-full h-full"
            onLoadedData={onLoadedData} onWaiting={onWaiting} onEnded={onEnded} onError={onError} />
        ) : (
          <div className="text-white text-xs p-4 text-center" data-testid={`${testId}-status`}>{status}</div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap text-[0.6875rem] text-[#5A5751]">
        <div className="flex items-center gap-1 flex-wrap">
          {st.firstFrameMs != null ? <span className={chip.ok}>first picture in {(st.firstFrameMs / 1000).toFixed(1)} s</span>
            : st.error && !st.ended ? <span className={chip.blocked}>{st.error}</span>
            : st.src ? <span className={chip.wait}>waiting for the first picture</span> : null}
          {st.stalls > 0 ? <span className={chip.wait}>{st.stalls} stall{st.stalls === 1 ? '' : 's'}</span> : null}
          {st.reconnects > 0 ? <span className={chip.wait} data-testid={`${testId}-reconnects`}>reconnected {st.reconnects}×</span> : null}
          {st.firstFrameMs != null && !st.ended ? <span>on for {elapsed} s{liveMax > 0 ? ` of ${liveMax}` : ''}</span> : null}
        </div>
        {st.exhausted ? <button type="button" className={`${btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => open(0)}>Resume</button> : null}
      </div>
    </div>
  );
}

// WHY IS THIS TILE BLANK? (DR-0774). The NAS's /why answer, in plain words,
// with go2rtc's own lines underneath for anyone who wants the raw truth.
function WhyPanel({ cam, token, onHide }) {
  const [r, setR] = useState(null);
  useEffect(() => { let on = true; fetchWhy(cam.id, token).then((x) => { if (on) setR(x); }); return () => { on = false; }; }, [cam.id, token]);
  const ex = r && r.explanation;
  return (
    <div className="border-t border-[#E8E4DC] p-2 text-xs text-[#1A1815]" data-testid="why-panel">
      {!r ? <div className="text-[#5A5751]">Asking the NAS why...</div> : (
        <>
          <div className={`font-semibold ${ex.kind === 'ok' ? 'text-[#2F6B3A]' : 'text-[#B85838]'}`}>{ex.headline}</div>
          {ex.lines.map((l) => <div key={l} className="text-[#5A5751] mt-0.5">{l}</div>)}
          {ex.log && ex.log.length ? (
            <details className="mt-1"><summary className="text-[#5A5751] cursor-pointer">What the restreamer logged</summary>
              <pre className="text-[0.625rem] whitespace-pre-wrap break-all mt-1">{ex.log.slice(-6).join('\n')}</pre>
            </details>
          ) : null}
        </>
      )}
      <button type="button" className={`${btnGhost} mt-1 focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={onHide}>Hide</button>
    </div>
  );
}

export default function Cameras() {
  const token = bridgeToken();
  const [health, setHealth] = useState(null);       // forwarder /health JSON (+status), or {status, error}
  const [list, setList] = useState({ status: 0, cameras: [], at: 0, networkError: false, loaded: false });
  const [frames, setFrames] = useState({});          // id -> {url, at, ms, bytes, error, errorAt}
  const [liveId, setLiveId] = useState('');          // the one in-place live view (tap a tile)
  const [wall, setWallRaw] = useState(() => loadWall()); // ids watched together
  const [why, setWhy] = useState('');                // tile whose Why? panel is open
  const [showAdd, setShowAdd] = useState(false);
  const [showShell, setShowShell] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const framesRef = useRef({});
  const setWall = (fn) => setWallRaw((w) => { const next = typeof fn === 'function' ? fn(w) : fn; saveWall(next); return next; });

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

  // --- snapshot sweep: several at once, visible-only, failing cameras rested --
  // One camera at a time with a 12 s timeout each meant 31 cameras refreshed
  // every two minutes, not every five seconds (measured 2026-10-07: "frame 2 m
  // ago" on every tile). Now SNAP_CONCURRENCY frames are in flight at once
  // and a camera that just failed is left alone for SNAP_RETRY_FAILED_MS, so
  // the cameras that answer keep their five-second cadence.
  const liveIds = useMemo(() => new Set([liveId, ...wall].filter(Boolean)), [liveId, wall]);
  useEffect(() => {
    if (state !== 'ready' || typeof document === 'undefined') return undefined;
    let stop = false;
    let timer = null;
    const one = async (cam) => {
      if (stop) return;
      const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      try {
        const r = await fetchWithTimeout(snapUrl(cam.id), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS);
        if (!r.ok) {
          let body = null;
          try { body = await r.json(); } catch { body = null; }
          throw new Error(classifySnapError({ status: r.status, body }));
        }
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
    };
    const sweep = async () => {
      if (stop) return;
      if (document.visibilityState === 'visible') {
        const due = list.cameras.filter((cam) => !liveIds.has(cam.id) && !skipFailedFrame(framesRef.current[cam.id]));
        await runLimited(due, SNAP_CONCURRENCY, one);
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
  }, [state, list.cameras, token, liveIds]);

  // Revoke every object URL on unmount.
  useEffect(() => () => {
    for (const f of Object.values(framesRef.current)) { if (f && f.url) { try { URL.revokeObjectURL(f.url); } catch { /* gone */ } } }
  }, []);

  // --- render ---------------------------------------------------------------
  const setup = setupCommands();
  const roadUp = !!(health && health.status === 200);
  const groups = groupByKind(list.cameras);
  const liveMax = health && Number.isFinite(Number(health.live_max_seconds)) ? Number(health.live_max_seconds) : 0;
  const wallMax = wallLimit(health);
  const byId = useMemo(() => Object.fromEntries(list.cameras.map((c) => [c.id, c])), [list.cameras]);
  const wallCams = wall.map((id) => byId[id]).filter(Boolean);

  const roadChip = health == null ? <span className={chip.muted}>checking the road</span>
    : roadUp ? <span className={chip.ok}>NAS restreamer up{health.go2rtc ? ` · go2rtc ${health.go2rtc}` : ''}{Number.isFinite(Number(health.streams)) ? ` · ${health.streams} stream${Number(health.streams) === 1 ? '' : 's'}` : ''}{health.forwarder ? ` · forwarder ${health.forwarder}` : ''}</span>
    : <span className={chip.blocked}>{health.status === 502 ? 'restreamer dark' : health.status ? `road HTTP ${health.status}` : 'road unreachable'}</span>;

  return (
    <div>
      <SectionTitle eyebrow="Your cameras, from your own server · snapshots every 5 s while this tab is open · tap one for full motion · add several to the wall to watch them together">Cameras</SectionTitle>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 text-[0.6875rem] text-[#5A5751]">
        <div>{roadChip}</div>
        <div className="flex items-center gap-2">
          {list.at ? <span>list read {formatAge(Math.max(0, now - list.at))}</span> : null}
          <button type="button" onClick={load} className={`${btnGhost}`}>Refresh</button>
        </div>
      </div>
      {token && health && health.status ? (
        <div className="mb-3"><ServiceRestart token={token} health={health} onDone={load} /></div>
      ) : null}

      {state === 'loading' && (
        <div className={card}><p className="text-sm text-[#5A5751]">Reading the camera road...</p></div>
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
          {/* THE WALL (DR-0774; Darrell: "I need multiple views... different cameras together"). */}
          <section className="mb-4" data-testid="camera-wall">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div className={labelCls}>Watch together · {wallCams.length} of {wallMax}</div>
              <div className="flex items-center gap-2 text-[0.6875rem] text-[#5A5751]">
                {wallCams.length ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setWall([])}>Clear the wall</button> : <span>Press Wall + on any camera to watch several live at once.</span>}
              </div>
            </div>
            {wallCams.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {wallCams.map((cam) => (
                  <LiveVideo key={cam.id} cam={cam} token={token} liveMax={liveMax} compact testId={`wall-${cam.id}`} now={now} onClose={() => setWall((w) => w.filter((x) => x !== cam.id))} />
                ))}
              </div>
            ) : null}
          </section>

          {groups.map((g) => (
            <section key={g.kind} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className={labelCls}>{g.label} · {g.cameras.length}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.cameras.map((cam) => {
                  const f = frames[cam.id];
                  const fresh = f && f.url;
                  const isLive = liveId === cam.id;
                  const onWall = wall.includes(cam.id);
                  const wallFull = !onWall && wall.length >= wallMax;
                  return (
                    <React.Fragment key={cam.id}>
                      <div className={`bg-white border ${isLive ? 'border-[#B85838]' : 'border-[#1A1815]'}`}>
                        <button type="button" onClick={() => setLiveId(isLive ? '' : cam.id)} className="block w-full text-left min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label={isLive ? `Close live view of ${cam.name}` : `Open live view of ${cam.name}`}>
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
                              {f && f.error ? <span className="text-[#B85838]" data-testid={`reason-${cam.id}`}> · {f.error}</span> : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {f && f.error ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setWhy(why === cam.id ? '' : cam.id)} aria-label={`Why does ${cam.name} show no frame?`}>Why?</button> : null}
                            <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={wallFull} onClick={() => setWall((w) => (onWall ? w.filter((x) => x !== cam.id) : [...w, cam.id]))} aria-label={onWall ? `Remove ${cam.name} from the wall` : `Add ${cam.name} to the wall`} title={wallFull ? `The wall holds ${wallMax} at once` : ''}>{onWall ? 'Wall −' : 'Wall +'}</button>
                            <button type="button" onClick={() => setLiveId(isLive ? '' : cam.id)} className={`${btnGhost}`}>{isLive ? 'Close' : 'Live'}</button>
                          </div>
                        </div>
                        {why === cam.id ? <WhyPanel cam={cam} token={token} onHide={() => setWhy('')} /> : null}
                      </div>
                      {isLive ? <LiveVideo key={`live-${cam.id}`} cam={cam} token={token} liveMax={liveMax} now={now} onClose={() => setLiveId('')} /> : null}
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
