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
import { provisionBridgeToken } from '../lib/bridge-provision.js';
import { supabase } from '../lib/supabase.js';
import { QRCodeSVG } from 'qrcode.react';
import { confirmThen } from '../lib/confirm-action.js';
import { setReadTarget, clearReadTarget, requestRead } from '../lib/read-target.js';
import { enterFullScreen, exitFullScreen, leavesFullScreen } from '../lib/reader-controller.js';
import {
  SNAPSHOT_INTERVAL_MS, FETCH_TIMEOUT_MS, LIVE_FIRST_FRAME_TIMEOUT_MS,
  healthUrl, listUrl, ticketUrl, snapUrl, liveUrl,
  parseCameraList, groupByKind, KINDS, classifyServiceState,
  formatAge, formatBytes, fetchWithTimeout, authHeaders, setupCommands,
  WYZE_FIELDS, setupWyze, WYZE_API_KEY_HELP_URL, WYZE_API_KEY_STEPS,
  serviceCodeState, restartService, loadWyzeDraft, saveWyzeDraft, clearWyzeDraft,
  SNAP_CONCURRENCY, LIVE_RECONNECT_MAX, LIVE_RECONNECT_DELAY_MS, runLimited, skipFailedFrame,
  classifySnapError, fetchWhy,
  loadViews, saveViews, activeView, addToView, removeFromView, moveInView, setViewLayout, renameView, addView, deleteView, viewCols, viewGridClass, indexAtPoint, VIEW_LAYOUTS,
  fitGrid, clampScale, setViewScale, VIEW_SCALE_STEP, VIEW_SCALE_MIN, VIEW_SCALE_MAX, toggleFocus, focusIn, shownCount,
  CLIP_SIZE_TIERS, fetchClipSizes, waitForClipSize, clipDownloadName, clipTierLine, fetchStreamHealth, STREAM_HEALTH_POLL_MS, liveStreamId, streamHealthLine, dropLines,
  tendLiveVideo, LIVE_TEND_MS, FREEZE_SECONDS,
  RETENTION_CHOICES, CLIP_TICKET_TTL, fetchRecording, saveRecording, fetchClips, recClipUrl, clipParts, groupClipsByDay, diskForecast,
  loadLiveTiles, saveLiveTiles, liveTileBudget, liveTrafficLine,
  fetchDevices, runDeviceAction, setupWyzeAgain, wyzeKept, garagesFor, ACTION_REARM_MS,
  cameraCredential, saveGrantToken, fetchGrants, createGrant, revokeGrant, grantLine, grantState, grantLink, GRANT_DAYS_CHOICES,
  startPairing, pollPairing, approvePairing, pairLink, readPairParam, stripPairParam, normalizePairCode, PAIR_TIMING,
  LIVE_ROADS, roadLabel, loadLiveRoad, saveLiveRoad, loadRoadStats, recordRoadResult, chooseLiveRoad, roadLine,
} from '../lib/cameras.js';

// THE STEPS CAN BE HEARD (2026-10-07; Darrell: "possible tutorial... Ari
// explains"). The Wyze sign-in registers its steps as this screen's reading,
// so the floating reader (and the Hear the steps button) reads them aloud,
// highlighted in place, for anyone who would rather listen than read.
const WYZE_READ_OWNER = 'cameras-wyze-setup';
export const CAMS_TAB_KEY = 'poetech.cameras.tab.v1';
const CAMS_TABS = Object.freeze([['live', 'Live'], ['recordings', 'Recordings'], ['access', 'Who can see'], ['setup', 'Setup']]);
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
// THE DOOR, WITHOUT THE VIDEO (DR-0777; Darrell 2026-10-07: "I want a button
// for garage that is independent of the video streaming being available").
// One tap, one POST to the NAS, one cloud action to the camera's device record
// (the Wyze app's own garage_door_trigger). No ticket, no stream, no frame is
// in the path; the button works when the tile is blank. It rests
// ACTION_REARM_MS after a tap, matching the NAS's own refusal window, so a
// door is never told twice; the answer is said under the button.
export function GarageButton({ device, token, compact = false }) {
  const [busy, setBusy] = useState(false);
  const [rest, setRest] = useState(false);
  const [result, setResult] = useState(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const tap = async () => {
    if (busy || rest) return;
    setBusy(true); setResult(null);
    const r = await runDeviceAction(device.mac, 'garage', token);
    if (!alive.current) return;
    setBusy(false); setResult(r);
    if (r.kind === 'ok' || r.kind === 'too-soon') {
      setRest(true);
      setTimeout(() => { if (alive.current) setRest(false); }, ACTION_REARM_MS);
    }
  };
  const tone = result ? (result.kind === 'ok' ? 'text-[#2F6B3A]' : 'text-[#B85838]') : 'text-[#5A5751]';
  return (
    <div className={compact ? 'inline-flex flex-col items-start' : 'flex flex-col items-start gap-1'} data-testid={`garage-${device.mac}`}>
      <button type="button" onClick={tap} disabled={busy || rest} aria-busy={busy}
        className={`${compact ? btnGhost : btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`}
        aria-label={`Open or close the garage door on ${device.nickname}`} data-testid={`garage-button-${device.mac}`}>
        {busy ? 'Telling the door...' : rest ? 'Sent' : compact ? 'Garage' : `Garage · ${device.nickname}`}
      </button>
      {result ? <span className={`text-[0.625rem] ${tone}`} role="status" aria-live="polite" data-testid={`garage-result-${device.mac}`}>{result.message}</span>
        : !compact ? <span className="text-[0.625rem] text-[#5A5751]">{device.online ? 'One tap moves the door, with or without the picture.' : 'Wyze reports this camera offline; the door may not answer.'}</span> : null}
    </div>
  );
}

// The doors strip: every camera with a garage controller, found through
// Wyze's cloud (GET /devices), whether or not its stream shows a picture.
function Doors({ garages, devicesState, token }) {
  if (!devicesState) return null;
  if (devicesState.kind === 'ok' && garages.length === 0) return null;
  if (['no-credentials', 'old-service', 'unauthorized', 'no-actions'].includes(devicesState.kind)) return null;
  return (
    <section className="mb-4" data-testid="doors">
      <div className={labelCls}>Doors · {garages.length}</div>
      {devicesState.kind === 'ok' ? (
        <div className="flex flex-wrap gap-4 mt-2">
          {garages.map((g) => <GarageButton key={g.mac} device={g} token={token} />)}
        </div>
      ) : <p className="text-xs text-[#B85838] mt-1" data-testid="doors-note">{devicesState.message}</p>}
    </section>
  );
}

// NOBODY TYPES THE SIGN-IN TWICE (Darrell 2026-10-07: "I better not need to
// resign in!"). When the restreamer is empty but the NAS kept the sign-in,
// one press re-adds every camera the account lists; the NAS also does this
// by itself within its self-heal cycle.
function AddAgain({ token, onAdded }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const go = async () => {
    if (busy) return;
    setBusy(true); setResult(null);
    const r = await setupWyzeAgain(token);
    setBusy(false); setResult(r);
    if (r.kind === 'ok' && onAdded) onAdded(r);
  };
  return (
    <div className="mt-3 border border-[#5A6E3D] bg-[#5A6E3D]/5 p-3" data-testid="wyze-add-again">
      <div className={labelCls}>Your Wyze sign-in is kept on the NAS</div>
      <p className="text-xs text-[#1A1815] mt-1">Nothing to type. The restreamer came back with no cameras; the NAS re-adds them from the sign-in it kept (and does so itself within ten minutes).</p>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <button type="button" className={`${btnDark}`} onClick={go} disabled={busy} aria-busy={busy} data-testid="wyze-add-again-button">{busy ? 'Adding your cameras again…' : 'Add my cameras again'}</button>
        {busy ? <span className="text-xs text-[#5A5751]">Up to a minute: Wyze lists the account, the NAS registers each camera.</span> : null}
      </div>
      {result ? <div className={`text-sm mt-2 ${result.kind === 'ok' ? 'text-[#2F6B3A]' : 'text-[#B85838]'}`} role="status" aria-live="polite" data-testid="wyze-add-again-result">{result.message}</div> : null}
    </div>
  );
}

// WHO CAN SEE THE CAMERAS (DR-0778; Darrell 2026-10-07: "My wife and family
// should also have access to my cameras... unless I say no... One time setup
// for owners and they can give access to who they want.... inside or out";
// "we never give a password just access and no access whenever the owner
// wants to"). The owner's device makes a per-person grant on the NAS and gets
// a LINK, shown once: opening it on a phone gives that device access, nothing
// typed, no password ever handed over. Every grant is listed here with when
// it was last used; Take back ends it on its next request.
function AccessPanel({ token, cameras, onCode }) {
  const [grants, setGrants] = useState(null);
  const [codeIn, setCodeIn] = useState('');
  const [linkPath, setLinkPath] = useState(undefined);
  const [name, setName] = useState('');
  const [all, setAll] = useState(true);
  const [picked, setPicked] = useState([]);
  const [days, setDays] = useState(0);
  const [doors, setDoors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState(null);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const load = useCallback(async () => {
    const r = await fetchGrants(token);
    setGrants(r.ok ? r.grants : []);
    if (r.linkPath) setLinkPath(r.linkPath);
    if (!r.ok) setNote(r.message);
  }, [token]);
  useEffect(() => { load(); }, [load]);
  const make = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMade(null); setNote(''); setCopied(false);
    const r = await createGrant({ name: name.trim(), cameras: all ? '*' : picked, days, actions: doors }, token);
    setBusy(false);
    if (r.ok) { setMade(r); setName(''); setPicked([]); setAll(true); setDoors(false); load(); } else setNote(r.message);
  };
  const takeBack = async (g) => {
    const r = await revokeGrant(g.id, token);
    setNote(r.message);
    load();
  };
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  const link = made ? grantLink(made.token, origin, linkPath || made.linkPath) : '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setCopied(false); }
  };
  const live = (grants || []).filter((g) => grantState(g) === 'live');
  const past = (grants || []).filter((g) => grantState(g) !== 'live');
  return (
    <section className={card} data-testid="access-panel">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className={labelCls}>Who can see the cameras · {grants == null ? '…' : `${live.length} with access`}</div>
        <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setOpen((v) => !v)} data-testid="access-give-toggle">{open ? 'Hide' : 'Give someone access'}</button>
      </div>
      <p className="text-xs text-[#5A5751] mt-1">Your family and anyone you choose, inside the house or out. You hand them a link, never a password; you take it back here whenever you want, and their link stops that moment.</p>
      <form className="mt-2 flex items-end gap-2 flex-wrap" onSubmit={(e) => { e.preventDefault(); const c = normalizePairCode(codeIn); if (c && onCode) onCode(c); else setNote('A code is six letters or numbers, as the screen shows it.'); }} data-testid="pair-code-form">
        <label className="block">
          <span className={labelCls}>A screen shows a code? Type it</span>
          <input className={`${inputCls} uppercase tracking-widest w-40`} value={codeIn} onChange={(e) => setCodeIn(e.target.value)} maxLength={8} placeholder="ABC234" aria-label="The six-letter code a screen shows" data-testid="pair-code-input" />
        </label>
        <button type="submit" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} data-testid="pair-code-go">Let it in</button>
      </form>
      {open ? (
        <form onSubmit={make} className="mt-3 border-t border-[#E8E4DC] pt-3 grid gap-2" data-testid="access-form" aria-busy={busy}>
          <label className="block">
            <span className={labelCls}>Whose access is this</span>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Christina" required aria-label="Whose access is this" data-testid="grant-name" disabled={busy} />
          </label>
          <div>
            <span className={labelCls}>Which cameras</span>
            <div className="flex items-center gap-3 flex-wrap mt-1 text-sm">
              <label className="inline-flex items-center gap-1"><input type="radio" name="grant-cams" checked={all} onChange={() => setAll(true)} disabled={busy} /> every camera</label>
              <label className="inline-flex items-center gap-1"><input type="radio" name="grant-cams" checked={!all} onChange={() => setAll(false)} disabled={busy} /> only these</label>
            </div>
            {!all ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-sm" data-testid="grant-pick">
                {cameras.map((c) => (
                  <label key={c.id} className="inline-flex items-center gap-1 min-h-[36px]">
                    <input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} disabled={busy} /> {c.name}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <label className="block">
            <span className={labelCls}>How long</span>
            <select className={inputCls} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="How long" data-testid="grant-days" disabled={busy}>
              {GRANT_DAYS_CHOICES.map((d) => <option key={d} value={d}>{d === 0 ? 'Until I take it back' : d === 1 ? 'One day' : d === 365 ? 'One year' : `${d} days`}</option>)}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm min-h-[36px]"><input type="checkbox" checked={doors} onChange={(e) => setDoors(e.target.checked)} disabled={busy} data-testid="grant-doors" /> The doors too (they can open the garage)</label>
          <div className="flex items-center gap-3 flex-wrap">
            <button type="submit" className={`${btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={busy || (!all && picked.length === 0)} data-testid="grant-make">{busy ? 'Making the link…' : 'Make the link'}</button>
          </div>
        </form>
      ) : null}
      {made ? (
        <div className="mt-3 border border-[#5A6E3D] bg-[#5A6E3D]/5 p-3" role="status" aria-live="polite" data-testid="grant-made">
          <div className="text-sm text-[#2F6B3A]">{made.message}</div>
          <code className="block text-[0.6875rem] break-all mt-1 text-[#1A1815]" data-testid="grant-link">{link}</code>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={copy} data-testid="grant-copy">{copied ? 'Copied' : 'Copy the link'}</button>
            <span className="text-xs text-[#5A5751]">Text it or hand the phone over; opening it gives that device access. It is shown this once.</span>
          </div>
        </div>
      ) : null}
      {note ? <p className="text-xs mt-2 text-[#B85838]" role="status" data-testid="access-note">{note}</p> : null}
      {grants && grants.length ? (
        <ul className="mt-3 divide-y divide-[#E8E4DC]" data-testid="grant-list">
          {[...live, ...past].map((g) => (
            <li key={g.id} className="py-2 flex items-center justify-between gap-2 flex-wrap" data-testid={`grant-row-${g.id}`}>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#1A1815] truncate">{g.name}</div>
                <div className="text-[0.625rem] text-[#5A5751]">{grantLine(g)}</div>
              </div>
              {grantState(g) === 'live' ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => takeBack(g)} aria-label={`Take back ${g.name}'s access`} data-testid={`grant-revoke-${g.id}`}>Take back</button> : null}
            </li>
          ))}
        </ul>
      ) : grants ? <p className="text-xs text-[#5A5751] mt-3">Nobody but the family yet.</p> : null}
    </section>
  );
}

// THE SCREEN'S SIDE (DR-0778; Darrell, from the Firestick: "use a qrcode to
// type into the Firestick"). A device with no key asks the NAS for a code,
// shows it as a QR and as six letters, and polls until the owner's phone lets
// it in; then it stores the grant and the cameras open. Nothing typed here.
export function PairScreen({ onPaired }) {
  const [pair, setPair] = useState(null);
  const [note, setNote] = useState('');
  const [left, setLeft] = useState(0);
  const alive = useRef(true);
  const begin = useCallback(async () => {
    setNote('');
    const r = await startPairing();
    if (!alive.current) return;
    if (r.ok) { setPair(r); setLeft(r.expiresIn); } else { setPair(null); setNote(r.message); if (r.retry) setTimeout(() => { if (alive.current) begin(); }, PAIR_TIMING.pollMs); }
  }, []);
  useEffect(() => { alive.current = true; begin(); return () => { alive.current = false; }; }, [begin]);
  useEffect(() => {
    if (!pair) return undefined;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      const r = await pollPairing(pair.code, pair.watch);
      if (stop) return;
      if (r.status === 'approved') { saveGrantToken(r.token); if (onPaired) onPaired(r.token); return; }
      if (r.status === 'expired') { setPair(null); setNote('That code ran out. Here is a fresh one.'); begin(); return; }
      setLeft((n) => Math.max(0, n - PAIR_TIMING.pollMs / 1000));
      setTimeout(tick, PAIR_TIMING.pollMs);
    };
    const t = setTimeout(tick, PAIR_TIMING.pollMs);
    return () => { stop = true; clearTimeout(t); };
  }, [pair, begin, onPaired]);
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  const link = pair ? pairLink(pair.code, origin, pair.linkPath) : '';
  return (
    <div className="mt-3 border-t border-[#E8E4DC] pt-3" data-testid="pair-screen">
      <div className={labelCls}>Let this screen in from your phone</div>
      <p className="text-xs text-[#5A5751] mt-1 mb-2">Nothing to type here. Scan the code with your phone, or open Cameras on your phone and enter the six letters under Who can see the cameras. The owner approves it there, and this screen opens on its own.</p>
      {pair ? (
        <div className="flex items-center gap-5 flex-wrap">
          <div className="bg-white p-2 inline-block" aria-hidden="true"><QRCodeSVG value={link} size={168} /></div>
          <div>
            <div className="text-4xl font-semibold tracking-[0.3em] text-[#1A1815]" data-testid="pair-code" aria-label={`Pairing code ${pair.code.split('').join(' ')}`}>{pair.code}</div>
            <div className="text-xs text-[#5A5751] mt-1">Waiting for the owner's phone · code good for about {Math.ceil(left / 60)} min</div>
            <code className="block text-[0.625rem] break-all mt-1 text-[#5A5751]">{link}</code>
          </div>
        </div>
      ) : <p className="text-xs text-[#5A5751]" data-testid="pair-note">{note || 'Asking the NAS for a code...'}</p>}
      {pair && note ? <p className="text-xs text-[#B85838] mt-1" data-testid="pair-note">{note}</p> : null}
    </div>
  );
}

// THE PHONE'S SIDE: the owner read a code off a screen (by QR or by eye) and
// lets it in as a grant it can take back later like any other.
export function ApprovePairing({ code, token, onDone, cameras }) {
  const [name, setName] = useState('TV');
  const [doors, setDoors] = useState(false);
  const [all, setAll] = useState(true);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const go = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setResult(null);
    const r = await approvePairing(code, { name: name.trim() || 'TV', cameras: all ? '*' : picked, days: 0, actions: doors }, token);
    setBusy(false); setResult(r);
    if (r.ok && onDone) onDone(r);
  };
  return (
    <form onSubmit={go} className="mb-4 border border-[#B85838] bg-[#B85838]/5 p-3 grid gap-2" data-testid="approve-pairing" aria-busy={busy}>
      <div className={labelCls}>A screen is asking to see the cameras · code {code}</div>
      <p className="text-xs text-[#5A5751]">Let it in and it gets its own access, listed under Who can see the cameras, where you can take it back any time.</p>
      <label className="block">
        <span className={labelCls}>What to call it</span>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-label="What to call this screen" data-testid="approve-name" disabled={busy} />
      </label>
      <div className="flex items-center gap-3 flex-wrap text-sm">
        <label className="inline-flex items-center gap-1"><input type="radio" name="approve-cams" checked={all} onChange={() => setAll(true)} disabled={busy} /> every camera</label>
        <label className="inline-flex items-center gap-1"><input type="radio" name="approve-cams" checked={!all} onChange={() => setAll(false)} disabled={busy} /> only these</label>
      </div>
      {!all ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
          {(cameras || []).map((c) => (
            <label key={c.id} className="inline-flex items-center gap-1 min-h-[36px]"><input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} disabled={busy} /> {c.name}</label>
          ))}
        </div>
      ) : null}
      <label className="inline-flex items-center gap-2 text-sm min-h-[36px]"><input type="checkbox" checked={doors} onChange={(e) => setDoors(e.target.checked)} disabled={busy} data-testid="approve-doors" /> The doors too</label>
      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" className={`${btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={busy || (!all && picked.length === 0)} data-testid="approve-go">{busy ? 'Letting it in…' : 'Let this screen in'}</button>
        {result ? <span className={`text-sm ${result.ok ? 'text-[#2F6B3A]' : 'text-[#B85838]'}`} role="status" aria-live="polite" data-testid="approve-result">{result.message}</span> : null}
      </div>
    </form>
  );
}

// What a grant holder's device sees at the top: whose access, how long, the doors.
function AccessChip({ access, onLeave }) {
  if (!access) return null;
  const until = access.expires ? `until ${new Date(access.expires * 1000).toLocaleDateString()}` : 'until the owner takes it back';
  return (
    <div className="mb-3 flex items-center gap-3 flex-wrap text-[0.6875rem]" data-testid="access-chip">
      <span className={chip.ok}>Access given to {access.name} · {until}{access.actions ? ' · doors too' : ''}</span>
      <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={onLeave} data-testid="access-leave">Remove this access from this device</button>
    </div>
  );
}

function LiveVideo({ cam, token, liveMax, onClose, compact = false, bare = false, testId = 'live-view', now, onPick = null, picked = false, sd = false, released = false }) {
  // A click (or Enter / Space from a remote) on the picture hands the tile to
  // the view, which makes it the largest or puts it back (DR-0796).
  const pickProps = onPick ? {
    role: 'button', tabIndex: 0, 'aria-pressed': picked,
    title: picked ? 'Click to put this camera back where it was' : 'Click to make this camera the largest',
    onClick: () => onPick(),
    onKeyDown: (e) => { if (e && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(); } },
  } : {};
  const [st, setSt] = useState({ mode: '', src: '', startedAt: Date.now(), firstFrameMs: null, stalls: 0, ended: false, error: '', opening: true, reconnects: 0, exhausted: false });
  const [road, setRoadRaw] = useState(() => loadLiveRoad());
  const setRoad = (r) => { saveLiveRoad(r); setRoadRaw(r); };
  const timers = useRef({ first: null, reopen: null, video: null });
  const alive = useRef(true);
  const lastFailed = useRef('');

  // THE STREAM THIS DEVICE OPENS (DR-0798): the camera's own, or its H.264
  // twin when the camera sends only H.265 and this <video> cannot decode it.
  // ...and the SD twin for a tile in a grid (DR-0799): the camera's own
  // substream, so a Firestick carries several cameras at once.
  const streamId = liveStreamId(cam, typeof document !== 'undefined' ? (t) => { try { return document.createElement('video').canPlayType(t); } catch { return ''; } } : null, { sd });
  const open = useCallback(async (reconnects) => {
    clearTimeout(timers.current.first);
    setSt((p) => ({ ...p, opening: true, ended: false, error: '', src: '', firstFrameMs: null, startedAt: Date.now(), reconnects, exhausted: false }));
    try {
      const r = await fetchWithTimeout(ticketUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: streamId }) }, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(r.status === 401 ? 'the family key was refused' : r.status === 503 ? 'the NAS has all its live slots in use' : `ticket HTTP ${r.status}`);
      const { ticket } = await r.json();
      if (!alive.current) return;
      const probe = typeof document !== 'undefined' ? document.createElement('video') : null;
      const canPlay = probe && typeof probe.canPlayType === 'function' ? (t) => probe.canPlayType(t) : null;
      const mode = chooseLiveRoad({ pref: road, stats: loadRoadStats(), canPlayType: canPlay, avoid: lastFailed.current });
      lastFailed.current = '';
      const startedAt = Date.now();
      setSt((p) => ({ ...p, mode, src: liveUrl(streamId, mode, ticket), startedAt, firstFrameMs: null, stalls: 0, ended: false, error: '', opening: false }));
      timers.current.first = setTimeout(() => {
        setSt((p) => (p.firstFrameMs == null && !p.ended && p.src)
          ? { ...p, error: `No picture after ${Math.round(LIVE_FIRST_FRAME_TIMEOUT_MS / 1000)} s. The camera may be asleep or unreachable from the NAS; press Why? on its tile.` }
          : p);
      }, LIVE_FIRST_FRAME_TIMEOUT_MS);
    } catch (e) {
      if (!alive.current) return;
      setSt((p) => ({ ...p, opening: false, error: String((e && e.message) || e) }));
    }
  }, [streamId, token, road]);

  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    // RELEASED (DR-0799): a tile hidden behind the one made largest gives its
    // stream back -- a Firestick cannot decode six HD streams for pictures
    // nobody sees -- and opens again, on the SD or HD road the layout asks
    // for, the moment it is shown.
    if (released) {
      clearTimeout(t.first); clearTimeout(t.reopen);
      const v = t.video;
      if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch { /* fine */ } }
      setSt((p) => ({ ...p, src: '', opening: false, ended: false, error: '', reconnecting: false }));
      return () => { alive.current = false; };
    }
    open(0);
    return () => {
      alive.current = false;
      clearTimeout(t.first); clearTimeout(t.reopen);
      const v = t.video;
      if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch { /* fine */ } }
    };
  }, [open, released]);

  // The stream ended or broke without the viewer closing it: come back. The
  // road's record is written (DR-0782) and, under Auto, a road that failed to
  // open is swapped for the other on the way back.
  const endedOnItsOwn = useCallback((reason) => {
    setSt((p) => {
      if (p.ended) return p;
      const opened = p.firstFrameMs != null;
      recordRoadResult(p.mode, { ok: opened, firstFrameMs: p.firstFrameMs, stalls: p.stalls });
      if (!opened) lastFailed.current = p.mode;
      const n = p.reconnects;
      if (n < LIVE_RECONNECT_MAX) {
        clearTimeout(timers.current.reopen);
        timers.current.reopen = setTimeout(() => { if (alive.current) open(n + 1); }, LIVE_RECONNECT_DELAY_MS);
        return { ...p, ended: true, error: reason, reconnecting: true };
      }
      return { ...p, ended: true, error: reason, exhausted: true, reconnecting: false };
    });
  }, [open]);

  // THE TILE IS TENDED (DR-0799): every LIVE_TEND_MS the element is asked
  // whether its picture still moves and how far it trails the live edge. A
  // freeze reconnects; a lag is run down or jumped (lib tendLiveVideo).
  const tendMemo = useRef(null);
  useEffect(() => {
    if (!st.src || st.ended || released) return undefined;
    tendMemo.current = null;
    const id = setInterval(() => {
      const v = timers.current.video;
      if (!v || !alive.current) return;
      const r = tendLiveVideo(v, tendMemo.current, { mode: st.mode });
      tendMemo.current = r.memo;
      if (r.frozen) {
        tendMemo.current = null;
        setSt((p) => ({ ...p, stalls: (p.stalls || 0) + 1 }));
        endedOnItsOwn(`the picture froze for ${FREEZE_SECONDS} s`);
      }
    }, LIVE_TEND_MS);
    return () => clearInterval(id);
  }, [st.src, st.ended, st.mode, released, endedOnItsOwn]);

  const onLoadedData = () => setSt((p) => {
    if (p.firstFrameMs != null) return p;
    const ms = Date.now() - p.startedAt;
    recordRoadResult(p.mode, { ok: true, firstFrameMs: ms, stalls: 0 }); // the road opened: that is the record Auto reads next time
    return { ...p, firstFrameMs: ms, error: '' };
  });
  const onWaiting = () => setSt((p) => ({ ...p, stalls: (p.stalls || 0) + 1 }));
  const onEnded = () => endedOnItsOwn(liveMax > 0 && (Date.now() - st.startedAt) >= (liveMax - 2) * 1000 ? `the NAS clock ended it at ${liveMax} s` : 'the stream ended on its own');
  const onError = () => endedOnItsOwn(st.firstFrameMs == null ? 'the browser could not open this stream' : 'the stream broke');

  const elapsed = Math.max(0, Math.round(((now || Date.now()) - st.startedAt) / 1000));
  const status = released ? 'Paused while another camera is the largest.'
    : st.opening ? 'Asking the NAS for a playback ticket...'
    : st.exhausted ? `Stopped after ${LIVE_RECONNECT_MAX} reconnects: ${st.error}. Press Resume to try again.`
    : st.ended ? `Reconnecting (${st.error})...`
    : st.error || 'No stream.';
  // BARE (DR-0788): the picture and the camera's name, nothing else — the
  // shape a tile takes inside the full-size window.
  if (bare) {
    return (
      <div className={`relative bg-black w-full h-full overflow-hidden ${onPick ? 'cursor-pointer focus:outline focus:outline-2 focus:outline-[#B85838]' : ''}`} data-testid={testId} data-picked={picked ? 'true' : undefined} {...pickProps}>
        {st.src && !st.ended ? (
          <video ref={(el) => { timers.current.video = el; }} key={st.src} src={st.src} autoPlay muted playsInline className="w-full h-full object-contain"
            onLoadedData={onLoadedData} onWaiting={onWaiting} onEnded={onEnded} onError={onError} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xs p-4 text-center" data-testid={`${testId}-status`}>{status}</div>
        )}
        <div className="absolute left-1 right-8 top-1 w-fit px-1.5 py-0.5 bg-black/60 text-white text-[0.6875rem] truncate">{cam.name}{st.reconnects > 0 ? ` · reconnected ${st.reconnects}×` : ''}</div>
        {st.exhausted ? <button type="button" className={`absolute right-1 bottom-1 ${btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={(e) => { e.stopPropagation(); open(0); }}>Resume</button> : null}
      </div>
    );
  }
  return (
    <div className={`${compact ? '' : 'col-span-full '}bg-white border border-[#1A1815] ${compact ? 'p-2' : 'p-3 sm:p-4'}`} data-testid={testId}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          {!compact ? <div className={labelCls}>Live</div> : null}
          <div className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-[#1A1815] truncate`}>{cam.name}</div>
        </div>
        <div className="flex items-center gap-2">
          {!compact ? (
            <label className="inline-flex items-center gap-1 text-[0.625rem] text-[#5A5751]">
              <span>Road</span>
              <select className="border border-[#B8B4AC] bg-white text-[#1A1815] text-[0.6875rem] px-1 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={road} onChange={(e) => setRoad(e.target.value)} aria-label="Which live road this device uses" data-testid={`${testId}-road`}>
                {LIVE_ROADS.map((r) => <option key={r} value={r}>{roadLabel(r)}</option>)}
              </select>
            </label>
          ) : null}
          {st.mode && !compact ? <span className={chip.muted} title={roadLine(loadRoadStats(), st.mode)} data-testid={`${testId}-mode`}>{road === 'auto' ? `Auto chose ${roadLabel(st.mode)}` : `${roadLabel(st.mode)} · pinned`}</span> : null}
          <button type="button" onClick={onClose} className={`${compact ? btnGhost : btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`}>{compact ? 'Remove' : 'Close'}</button>
        </div>
      </div>
      <div className={`mt-2 bg-black aspect-video w-full flex items-center justify-center ${onPick ? 'cursor-pointer focus:outline focus:outline-2 focus:outline-[#B85838]' : ''}`} data-testid={`${testId}-picture`} data-picked={picked ? 'true' : undefined} {...pickProps}>
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
      {!compact ? <div className="mt-1 text-[0.625rem] text-[#5A5751]" data-testid={`${testId}-roads`}>{roadLine(loadRoadStats(), 'mp4')} · {roadLine(loadRoadStats(), 'hls')} · frames every 5 s always work</div> : null}
    </div>
  );
}

// THE FULL-SIZE WINDOW (DR-0788). The active view's cameras fill the whole
// screen in the grid that gives each 16:9 tile the most area (lib fitGrid),
// at the size the viewer sets: 100% is the fit, smaller leaves a margin for a
// TV that cuts its edges; the size is kept with the view. Real full screen is
// asked of the browser where it allows it; Back, Esc or Close leaves. The
// in-page grid is not rendered while the window is open, so each camera
// holds one live slot, not two.
const WINDOW_BAR_PX = 56;
const WINDOW_GAP_PX = 6;
function ViewWindow({ view, cams, token, liveMax, now, onClose, onScale }) {
  // The one camera made largest by a click; '' when none (DR-0796).
  const [focusedRaw, setFocused] = useState('');
  const focused = focusIn(cams, focusedRaw);
  const [size, setSize] = useState(() => ({ w: typeof window !== 'undefined' ? window.innerWidth : 0, h: typeof window !== 'undefined' ? window.innerHeight : 0 }));
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const scale = clampScale(view.scale);
  useEffect(() => {
    const d = typeof document !== 'undefined' ? document : null;
    enterFullScreen(d);
    const onKey = (e) => {
      if (!e) return;
      if (leavesFullScreen(e.key)) { e.preventDefault(); onClose(); }
      else if (e.key === '+' || e.key === '=') onScale(scale + VIEW_SCALE_STEP);
      else if (e.key === '-' || e.key === '_') onScale(scale - VIEW_SCALE_STEP);
    };
    // The browser's own exit (Back on a remote) is honoured as ours.
    const onChange = () => { if (d && !d.fullscreenElement && !d.webkitFullscreenElement) onClose(); };
    if (d) { d.addEventListener('keydown', onKey); d.addEventListener('fullscreenchange', onChange); d.addEventListener('webkitfullscreenchange', onChange); }
    return () => {
      if (d) { d.removeEventListener('keydown', onKey); d.removeEventListener('fullscreenchange', onChange); d.removeEventListener('webkitfullscreenchange', onChange); }
      exitFullScreen(d);
    };
  }, [onClose, onScale, scale]);
  const fit = fitGrid({ count: shownCount(cams, focused), width: Math.max(0, size.w - 2 * WINDOW_GAP_PX), height: Math.max(0, size.h - WINDOW_BAR_PX - 2 * WINDOW_GAP_PX), gap: WINDOW_GAP_PX });
  const tileW = Math.floor(fit.tileW * scale);
  const tileH = Math.floor(fit.tileH * scale);
  const pct = Math.round(scale * 100);
  const bar = 'px-3 min-h-[40px] text-[0.6875rem] uppercase tracking-wider border border-white/40 text-white hover:bg-white hover:text-black disabled:opacity-40';
  const ring = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
  return (
    <div className="fixed inset-0 z-[90] bg-black text-white flex flex-col" data-testid="view-window" data-cols={fit.cols} data-scale={pct} data-focused={focused || undefined} role="dialog" aria-label={`${view.name} — full-size window`}>
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${fit.cols}, ${tileW}px)`, gridAutoRows: `${tileH}px`, gap: `${WINDOW_GAP_PX}px` }} data-testid="view-window-grid">
          {cams.map((cam) => (
            // A tile that is not the focused one stays MOUNTED and hidden and
            // gives its stream back (DR-0799); the second click re-opens it in place.
            <div key={cam.id} style={{ width: tileW, height: tileH }} className={focused && focused !== cam.id ? 'hidden' : ''} data-window-cam={cam.id} data-focused={focused === cam.id ? 'true' : undefined}>
              <LiveVideo cam={cam} token={token} liveMax={liveMax} bare testId={`window-${cam.id}`} now={now} onPick={() => setFocused((f) => toggleFocus(f, cam.id))} picked={focused === cam.id}
                sd={shownCount(cams, focused) > 1} released={!!focused && focused !== cam.id} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 py-2 flex-wrap" style={{ minHeight: WINDOW_BAR_PX }} data-testid="view-window-bar">
        <button type="button" className={`${bar} ${ring} focus:outline focus:outline-2`} onClick={() => onScale(scale - VIEW_SCALE_STEP)} disabled={scale <= VIEW_SCALE_MIN} aria-label="Smaller — leave more room at the edges" data-testid="view-window-smaller">− Smaller</button>
        <span className="text-[0.6875rem] tabular-nums" aria-live="polite" data-testid="view-window-size">{focused ? `${(cams.find((c) => c.id === focused) || {}).name || focused} · largest · click it again to put it back` : `${cams.length} camera${cams.length === 1 ? '' : 's'} · ${fit.cols} across · ${pct}%`}</span>
        <button type="button" className={`${bar} ${ring} focus:outline focus:outline-2`} onClick={() => onScale(scale + VIEW_SCALE_STEP)} disabled={scale >= VIEW_SCALE_MAX} aria-label="Bigger — fill more of the screen" data-testid="view-window-bigger">+ Bigger</button>
        {scale !== 1 ? <button type="button" className={`${bar} ${ring} focus:outline focus:outline-2`} onClick={() => onScale(1)} data-testid="view-window-fit">Fit</button> : null}
        <button type="button" className={`${bar} ${ring} focus:outline focus:outline-2`} onClick={onClose} aria-label="Close the window (Back or Esc also does)" data-testid="view-window-close">Close</button>
      </div>
    </div>
  );
}

// A TILE THAT IS LIVE (DR-0776). The same reconnecting player as LiveVideo,
// stripped to the picture: no header, no Close. When it has given up (the
// camera never answered through all its reconnects) it tells the tab, which
// drops the tile back to the snapshot road so the reason shows and recovery
// is noticed on the next sweep.
function TileLive({ cam, token, liveMax, now, onFailed, sd = false }) {
  const [st, setSt] = useState({ src: '', startedAt: Date.now(), firstFrameMs: null, ended: false, reconnects: 0, exhausted: false, error: '', mode: '' });
  const timers = useRef({ first: null, reopen: null, video: null });
  const alive = useRef(true);
  const streamId = liveStreamId(cam, typeof document !== 'undefined' ? (t) => { try { return document.createElement('video').canPlayType(t); } catch { return ''; } } : null, { sd });
  const open = useCallback(async (reconnects) => {
    clearTimeout(timers.current.first);
    setSt((p) => ({ ...p, ended: false, src: '', firstFrameMs: null, startedAt: Date.now(), reconnects, exhausted: false, error: '' }));
    try {
      const r = await fetchWithTimeout(ticketUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: streamId }) }, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(r.status === 503 ? 'the NAS has all its live slots in use' : `ticket HTTP ${r.status}`);
      const { ticket } = await r.json();
      if (!alive.current) return;
      const probe = typeof document !== 'undefined' ? document.createElement('video') : null;
      const mode = chooseLiveRoad({ pref: loadLiveRoad(), stats: loadRoadStats(), canPlayType: probe && typeof probe.canPlayType === 'function' ? (t) => probe.canPlayType(t) : null });
      setSt((p) => ({ ...p, src: liveUrl(streamId, mode, ticket), mode, startedAt: Date.now() }));
      timers.current.first = setTimeout(() => {
        setSt((p) => (p.firstFrameMs == null && !p.ended && p.src) ? { ...p, error: 'no picture' } : p);
      }, LIVE_FIRST_FRAME_TIMEOUT_MS);
    } catch (e) {
      if (!alive.current) return;
      setSt((p) => ({ ...p, error: String((e && e.message) || e) }));
    }
  }, [streamId, token]);
  useEffect(() => {
    alive.current = true;
    open(0);
    const t = timers.current;
    return () => { alive.current = false; clearTimeout(t.first); clearTimeout(t.reopen); const v = t.video; if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch { /* fine */ } } };
  }, [open]);
  const endedOnItsOwn = useCallback((reason) => {
    setSt((p) => {
      if (p.ended) return p;
      if (p.reconnects < LIVE_RECONNECT_MAX) {
        clearTimeout(timers.current.reopen);
        timers.current.reopen = setTimeout(() => { if (alive.current) open(p.reconnects + 1); }, LIVE_RECONNECT_DELAY_MS);
        return { ...p, ended: true, error: reason };
      }
      if (onFailed) setTimeout(() => onFailed(`live view gave up: ${reason}`), 0);
      return { ...p, ended: true, error: reason, exhausted: true };
    });
  }, [open, onFailed]);
  // Tended like every live tile (DR-0799): a frozen picture reconnects, a lag is run down.
  const tendMemo = useRef(null);
  useEffect(() => {
    if (!st.src || st.ended) return undefined;
    tendMemo.current = null;
    const id = setInterval(() => {
      const v = timers.current.video;
      if (!v || !alive.current) return;
      const r = tendLiveVideo(v, tendMemo.current, { mode: st.mode });
      tendMemo.current = r.memo;
      if (r.frozen) { tendMemo.current = null; endedOnItsOwn(`the picture froze for ${FREEZE_SECONDS} s`); }
    }, LIVE_TEND_MS);
    return () => clearInterval(id);
  }, [st.src, st.ended, st.mode, endedOnItsOwn]);
  const elapsed = Math.max(0, Math.round(((now || Date.now()) - st.startedAt) / 1000));
  return (
    <div className="aspect-video bg-black relative" data-testid={`tile-live-${cam.id}`}>
      {st.src && !st.ended ? (
        <video ref={(el) => { timers.current.video = el; }} key={st.src} src={st.src} autoPlay muted playsInline className="w-full h-full object-cover"
          onLoadedData={() => setSt((p) => (p.firstFrameMs == null ? { ...p, firstFrameMs: Date.now() - p.startedAt, error: '' } : p))}
          onEnded={() => endedOnItsOwn(liveMax > 0 && elapsed >= liveMax - 2 ? 'the NAS clock' : 'stream ended')}
          onError={() => endedOnItsOwn(st.firstFrameMs == null ? 'could not open' : 'stream broke')} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/80 text-xs p-3 text-center">{st.exhausted ? `Gave up: ${st.error}` : st.ended ? 'Reconnecting...' : st.error || 'Opening live...'}</div>
      )}
      {st.firstFrameMs == null && st.src && !st.ended && !st.error ? <div className="absolute bottom-1 left-1 text-[0.5625rem] text-white/70">waiting for the first picture</div> : null}
      {st.reconnects > 0 ? <div className="absolute top-1 right-1 text-[0.5625rem] text-white/80 bg-black/50 px-1">reconnected {st.reconnects}×</div> : null}
    </div>
  );
}

// WHY IS THIS TILE BLANK? (DR-0774). The NAS's /why answer, in plain words,
// with go2rtc's own lines underneath for anyone who wants the raw truth.
function WhyPanel({ cam, token, onHide, health = null }) {
  const [r, setR] = useState(null);
  const drops = health ? dropLines(health.events, cam.id) : [];
  const hl = health && health.cameras ? health.cameras[cam.id] : null;
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
      {hl ? (
        <div className="mt-1 text-[#5A5751]" data-testid={`why-health-${cam.id}`}>
          <span className="font-semibold text-[#1A1815]">The last hour:</span> {streamHealthLine(hl) || 'nobody watched this camera, so nothing was measured'}
          {hl.hevc_only ? <div className="mt-0.5">{hl.twin ? 'This camera sends only H.265; the NAS keeps an H.264 twin for devices that cannot decode it.' : 'This camera sends only H.265; the NAS will add an H.264 twin at its next sample.'}</div> : null}
          {drops.length ? <ul className="mt-0.5 list-disc pl-4">{drops.map((l) => <li key={l}>{l}</li>)}</ul> : null}
        </div>
      ) : null}
      <button type="button" className={`${btnGhost} mt-1 focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={onHide}>Hide</button>
    </div>
  );
}

// RECORDED LOOPS (DR-0775; Darrell: "Recorded loops for however long I want
// backed up to the nas?"). The owner switches Record on per camera and picks
// how long to keep; one disk budget rules them all. Everything here is read
// from the recorder's own status file on the NAS: clips, bytes, oldest and
// newest, disk free, and a rate MEASURED from real clips, never a nominal
// bitrate. Clips play through the same ticketed road as live video.
// THE RECORDER'S STATE, LIFTED (DR-0783; Darrell: "Record should be with the
// camera you want to do that with"). One read of /recording serves the tiles
// (each camera's Record and keep sit on its own tile) and the panel below
// (the budget, the disk line, the clips). Nothing here is painted: every
// value is the recorder's own file.
// THE STREAM HEALTH LOG, READ WHILE THE TAB IS OPEN (DR-0798). One read every
// STREAM_HEALTH_POLL_MS serves every tile's line and the Why? panel's drops.
function useStreamHealth(token, enabled) {
  const [health, setHealth] = useState(null);
  const reload = useCallback(async () => {
    if (!token || !enabled) return;
    const r = await fetchStreamHealth(token);
    setHealth(r);
  }, [token, enabled]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    if (!enabled) return undefined;
    const t = setInterval(reload, STREAM_HEALTH_POLL_MS);
    return () => clearInterval(t);
  }, [reload, enabled]);
  return health && health.ok ? health : null;
}

function useRecording(token) {
  const [rec, setRec] = useState(null);          // fetchRecording result
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [budget, setBudget] = useState('');
  const reload = useCallback(async () => {
    if (!token) return;
    const r = await fetchRecording(token);
    setRec(r);
    if (r.ok) setBudget(String(r.config.disk_budget_gb));
  }, [token]);
  useEffect(() => { reload(); }, [reload]);
  // The status file is refreshed by the recorder every loop; re-read it while the tab is open.
  useEffect(() => { const t = setInterval(reload, 30000); return () => clearInterval(t); }, [reload]);
  const cfg = rec && rec.ok ? rec.config : null;
  const status = rec && rec.ok ? rec.recStatus : null;
  const save = async (next) => {
    if (saving) return;
    setSaving(true); setNote('');
    const r = await saveRecording(next, token);
    setSaving(false);
    if (r.ok) { setNote('Saved. The recorder on the NAS follows within ten seconds.'); setRec((p) => (p && p.ok ? { ...p, config: r.config } : p)); }
    else setNote(r.message);
  };
  const toggle = (cam) => {
    if (!cfg) return;
    const cur = cfg.cameras[cam.id] || { enabled: false, retention_days: 14 };
    save({ ...cfg, cameras: { ...cfg.cameras, [cam.id]: { ...cur, enabled: !cur.enabled } } });
  };
  const setRetention = (cam, days) => {
    if (!cfg) return;
    const cur = cfg.cameras[cam.id] || { enabled: false, retention_days: 14 };
    save({ ...cfg, cameras: { ...cfg.cameras, [cam.id]: { ...cur, retention_days: Number(days) } } });
  };
  const saveBudget = () => {
    if (!cfg) return;
    const n = Number(budget);
    if (!Number.isFinite(n) || n < 5) { setNote('The budget is in GB, 5 or more.'); return; }
    save({ ...cfg, disk_budget_gb: n });
  };
  const camState = (id) => ({ cfg: cfg ? (cfg.cameras[id] || { enabled: false, retention_days: 14 }) : null, status: status && status.cameras ? status.cameras[id] : null });
  return { rec, cfg, status, saving, note, setNote, budget, setBudget, reload, toggle, setRetention, saveBudget, camState };
}

// RECORD ON THE TILE (DR-0783): the switch, the keep, the state, beside the
// camera it belongs to. The panel below keeps the budget and the clips.
function TileRecord({ cam, r, onClips }) {
  const { cfg: c, status: st } = r.camState(cam.id);
  if (!c) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap" data-testid={`tile-record-${cam.id}`}>
      <button type="button" className={`${c.enabled ? 'text-[0.625rem] uppercase tracking-wider font-semibold min-h-[36px] px-2 bg-[#B85838] text-white' : btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => r.toggle(cam)} disabled={r.saving} aria-pressed={c.enabled} aria-label={`${c.enabled ? 'Stop recording' : 'Record'} ${cam.name}`} data-testid={`record-${cam.id}`}>{c.enabled ? '● Recording' : 'Record'}</button>
      {c.enabled ? (
        <select className="border border-[#B8B4AC] bg-white text-[#1A1815] text-[0.6875rem] px-1 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={c.retention_days} onChange={(e) => r.setRetention(cam, e.target.value)} disabled={r.saving} aria-label={`How long to keep ${cam.name}`} data-testid={`keep-${cam.id}`}>
          {RETENTION_CHOICES.map((d) => <option key={d} value={d}>{d === 1 ? 'keep 1 day' : d >= 365 ? 'keep 1 year' : `keep ${d} days`}</option>)}
        </select>
      ) : null}
      {st && st.clips ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => onClips(cam.id)} aria-label={`Show clips of ${cam.name}`}>{st.clips} clip{st.clips === 1 ? '' : 's'}</button> : null}
      {st && c.enabled && !st.recording ? <span className="text-[0.625rem] text-[#B85838]">not recording yet</span> : null}
    </div>
  );
}

function RecordingPanel({ token, cameras, r, pick, setPick }) {
  const { rec, cfg, status, saving, note, setNote, budget, setBudget, reload, saveBudget } = r;
  const [clips, setClips] = useState({ loading: false, days: [] });
  const [playing, setPlaying] = useState(null);  // {cam, name, src}
  const forecast = diskForecast(status);
  // A tile's Clips button sets `pick`; the list is read whenever it changes.
  useEffect(() => {
    let on = true;
    setPlaying(null);
    if (!pick) { setClips({ loading: false, days: [] }); return undefined; }
    setClips({ loading: true, days: [] });
    fetchClips(pick, token).then((res) => { if (on) setClips({ loading: false, days: groupClipsByDay(res.clips), ok: res.ok }); });
    return () => { on = false; };
  }, [pick, token]);
  const openClips = (id) => setPick(id);
  // DOWNLOAD BY SIZE (DR-0797): the menu opens on a clip, shows every tier with
  // its size (measured when made, estimated before), and the chosen one is
  // fetched from the NAS -- made first when it has to be -- then saved.
  const [menu, setMenu] = useState(null);     // { name, ticket, sizes } for the clip whose Download menu is open
  const [making, setMaking] = useState(null); // { name, size, state, position } while the NAS makes a tier
  const openMenu = async (id, name) => {
    if (menu && menu.name === name) { setMenu(null); return; }
    try {
      const r = await fetchWithTimeout(ticketUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: id, ttl: CLIP_TICKET_TTL }) }, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(`ticket HTTP ${r.status}`);
      const { ticket } = await r.json();
      setMenu({ name, ticket, sizes: null });
      const sizes = await fetchClipSizes(id, name, ticket);
      setMenu((m) => (m && m.name === name ? { ...m, sizes: sizes.ok ? sizes : null } : m));
    } catch (e) {
      setNote(`Could not read the clip's sizes: ${String((e && e.message) || e)}`);
    }
  };
  const download = async (id, name, size, retry = false) => {
    if (!menu || menu.name !== name) return;
    setNote('');
    setMaking({ name, size, state: size === 'original' ? 'ready' : 'asking', position: 0 });
    const r = await waitForClipSize(id, name, menu.ticket, size, { retry, onProgress: (p) => setMaking((m) => (m && m.name === name ? { ...m, ...p } : m)) });
    setMaking(null);
    if (!r.ok) { setNote(r.message); if (r.failed) setMenu((m) => (m ? { ...m, failed: size } : m)); return; }
    try {
      const a = document.createElement('a');
      a.href = r.url; a.download = clipDownloadName(id, name, size); a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    } catch { /* a device without a download road still has the URL in the menu */ }
    setNote(`Saving ${clipDownloadName(id, name, size)} to this device.`);
    const sizes = await fetchClipSizes(id, name, menu.ticket);
    setMenu((m) => (m && m.name === name ? { ...m, sizes: sizes.ok ? sizes : m.sizes, failed: '' } : m));
  };
  const play = async (id, name) => {
    try {
      const r = await fetchWithTimeout(ticketUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: id, ttl: CLIP_TICKET_TTL }) }, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(`ticket HTTP ${r.status}`);
      const { ticket } = await r.json();
      setPlaying({ cam: id, name, src: recClipUrl(id, name, ticket) });
    } catch (e) {
      setNote(`Could not open the clip: ${String((e && e.message) || e)}`);
    }
  };

  const camsWithClips = status ? Object.entries(status.cameras || {}).filter(([, v]) => v && v.clips > 0).map(([k]) => k) : [];
  return (
    <div className={card} data-testid="recording-panel">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className={labelCls}>Recorded loops on the NAS</div>
          <div className="text-sm text-[#1A1815] mt-1">Switch Record on for a camera and choose how long to keep it. One disk budget rules them all: the oldest clip goes first when it is reached.</div>
        </div>
        <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={reload}>Refresh</button>
      </div>
      {!rec ? <div className="text-xs text-[#5A5751] mt-2">Reading the recorder...</div> : null}
      {rec && !rec.ok ? <div className="text-sm text-[#B85838] mt-2" role="status">{rec.message}</div> : null}
      {cfg ? (
        <>
          <div className="mt-3 text-xs text-[#1A1815]" data-testid="recording-disk">
            {status ? (
              <>
                <div>{forecast ? forecast.line : ''}</div>
                <div className="text-[#5A5751] mt-0.5">On disk: {formatBytes(status.total_bytes || 0)} of a {Math.round(cfg.disk_budget_gb)} GB budget{Number.isFinite(Number(status.disk_free_bytes)) ? ` · ${formatBytes(status.disk_free_bytes)} free on the volume` : ''}{status.at ? ` · recorder reported ${formatAge(Math.max(0, Date.now() - status.at * 1000))}` : ''}</div>
                {status.config_error ? <div className="text-[#B85838] mt-0.5">{status.config_error}</div> : null}
              </>
            ) : <div className="text-[#5A5751]">The recorder has not reported yet (it starts with the next NAS sync; nothing records until a camera is switched on).</div>}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
            <label className="flex items-center gap-1">
              <span className={labelCls}>Disk budget (GB)</span>
              <input className={`${inputCls} w-24 min-h-[36px] py-1`} type="number" min="5" step="1" value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Disk budget in GB" />
            </label>
            <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={saveBudget} disabled={saving}>Save budget</button>
            {note ? <span className={`${/Saved/.test(note) ? 'text-[#2F6B3A]' : 'text-[#B85838]'}`} role="status" aria-live="polite" data-testid="recording-note">{note}</span> : null}
          </div>
          <p className="text-[0.625rem] text-[#5A5751] mt-3">Record and keep sit on each camera&apos;s tile. Listed here: the cameras switched on or holding clips.</p>
          <ul className="mt-1 divide-y divide-[#E8E4DC]" data-testid="recording-cameras">
            {cameras.filter((cam) => (cfg.cameras[cam.id] && cfg.cameras[cam.id].enabled) || (status && status.cameras && status.cameras[cam.id] && status.cameras[cam.id].clips > 0)).map((cam) => {
              const c = cfg.cameras[cam.id] || { enabled: false, retention_days: 14 };
              const st = status && status.cameras ? status.cameras[cam.id] : null;
              return (
                <li key={cam.id} className="py-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1A1815] truncate">{cam.name}</div>
                    <div className="text-[0.625rem] text-[#5A5751]">
                      {st && st.clips ? <>{st.clips} clip{st.clips === 1 ? '' : 's'} · {formatBytes(st.bytes)}{st.oldest ? ` · since ${new Date(st.oldest * 1000).toLocaleDateString()}` : ''}</> : 'no clips yet'}
                      {st && c.enabled ? (st.recording ? <span className="text-[#2F6B3A]"> · recording now</span> : <span className="text-[#B85838]"> · switched on, not recording yet{st.last_exit != null ? ` (ffmpeg left with ${st.last_exit}, ${st.restarts} restart${st.restarts === 1 ? '' : 's'})` : ''}</span>) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.enabled ? (
                      <label className="text-[0.625rem] text-[#5A5751] flex items-center gap-1">keep
                        <select className={`${inputCls} min-h-[36px] py-1 w-auto`} value={c.retention_days} onChange={(e) => r.setRetention(cam, e.target.value)} disabled={saving} aria-label={`How long to keep ${cam.name}`}>
                          {RETENTION_CHOICES.map((d) => <option key={d} value={d}>{d === 1 ? '1 day' : d >= 365 ? '1 year' : `${d} days`}</option>)}
                        </select>
                      </label>
                    ) : null}
                    <button type="button" className={`${c.enabled ? btnDark : btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => r.toggle(cam)} disabled={saving} aria-pressed={c.enabled} aria-label={`${c.enabled ? 'Stop recording' : 'Record'} ${cam.name}`}>{c.enabled ? 'Recording' : 'Record'}</button>
                    {st && st.clips ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => openClips(pick === cam.id ? '' : cam.id)} aria-label={`Show clips of ${cam.name}`}>{pick === cam.id ? 'Hide clips' : 'Clips'}</button> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {pick ? (
            <div className="mt-3 border-t border-[#E8E4DC] pt-3" data-testid="clips">
              <div className={labelCls}>Clips · {cameras.find((c) => c.id === pick)?.name || pick}</div>
              {clips.loading ? <div className="text-xs text-[#5A5751] mt-1">Reading the clips...</div> : null}
              {!clips.loading && clips.ok === false ? <div className="text-xs text-[#B85838] mt-1">The clip list did not come back.</div> : null}
              {!clips.loading && clips.ok !== false && !clips.days.length ? <div className="text-xs text-[#5A5751] mt-1">No clips on disk for this camera.</div> : null}
              {playing ? (
                <div className="mt-2 bg-black aspect-video w-full" data-testid="clip-player">
                  <video key={playing.src} src={playing.src} controls autoPlay playsInline className="w-full h-full" />
                </div>
              ) : null}
              {clips.days.map((d) => (
                <details key={d.day} className="mt-2" open={d === clips.days[0]}>
                  <summary className="text-sm text-[#1A1815] cursor-pointer">{d.day} · {d.clips.length} clip{d.clips.length === 1 ? '' : 's'} · {formatBytes(d.bytes)}</summary>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {d.clips.map((c) => (
                      <span key={c.name} className="inline-flex items-stretch">
                        <button type="button" className={`${chipCls} ${playing && playing.name === c.name ? 'border-[#B85838] text-[#B85838]' : 'border-[#B8B4AC] text-[#1A1815]'} min-h-[36px] px-2 focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => play(pick, c.name)} aria-label={`Play the clip from ${clipParts(c.name).time}`}>{clipParts(c.name).time} · {formatBytes(c.bytes)}</button>
                        <button type="button" className={`${chipCls} border-l-0 ${menu && menu.name === c.name ? 'border-[#B85838] text-[#B85838]' : 'border-[#B8B4AC] text-[#5A5751]'} min-h-[36px] px-2 focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => openMenu(pick, c.name)} aria-label={`Download the clip from ${clipParts(c.name).time} at a size you choose`} aria-expanded={!!(menu && menu.name === c.name)} data-testid={`clip-download-${c.name}`}>↓</button>
                      </span>
                    ))}
                  </div>
                  {menu && d.clips.some((c) => c.name === menu.name) ? (
                    <div className="mt-2 border border-[#E8E4DC] p-2 text-xs text-[#1A1815]" data-testid="clip-download-menu">
                      <div className={labelCls}>Download {clipParts(menu.name).time} · {menu.sizes && menu.sizes.seconds ? `${Math.round(menu.sizes.seconds / 60)} min` : ''}</div>
                      <p className="text-[0.625rem] text-[#5A5751] mt-1">Record keeps clips on the NAS only; a download brings one to this device. Each size is the best picture that fits it; nothing is upscaled. A size not made yet is made on the NAS first (about a minute per ten).</p>
                      {!menu.sizes ? <div className="text-[#5A5751] mt-1">Reading the sizes...</div> : null}
                      <ul className="mt-1 divide-y divide-[#E8E4DC]">
                        {CLIP_SIZE_TIERS.map((tier) => {
                          const row = tier.key === 'original' ? null : (menu.sizes && menu.sizes.tiers ? menu.sizes.tiers[tier.key] : null);
                          const busy = making && making.name === menu.name;
                          const mine = busy && making.size === tier.key;
                          const failed = (row && row.state === 'failed') || menu.failed === tier.key;
                          return (
                            <li key={tier.key} className="flex items-center justify-between gap-2 py-1">
                              <span className="min-w-0 truncate" data-testid={`clip-tier-${tier.key}`}>{clipTierLine(tier, menu.sizes)}{mine ? ` · ${making.state === 'queued' ? `in line (${making.position})` : making.state === 'making' ? 'being made on the NAS...' : 'asking the NAS...'}` : ''}</span>
                              <button type="button" className={`${btnGhost} shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={!!busy} onClick={() => download(pick, menu.name, tier.key, failed)} aria-label={`Download ${tier.label}`} data-testid={`clip-get-${tier.key}`}>{failed ? 'Try again' : mine ? 'Working...' : 'Download'}</button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </details>
              ))}
            </div>
          ) : null}
          {camsWithClips.length && !pick ? <div className="text-[0.625rem] text-[#5A5751] mt-2">Press Clips on a camera to play what it kept.</div> : null}
        </>
      ) : null}
    </div>
  );
}

export default function Cameras() {
  // The owner's device holds the family bearer; a device the owner handed a
  // link to holds a grant (DR-0778). Either opens the road; only the owner's
  // changes the NAS (setup, restart, recording, who has access).
  // THE KEY PROVISIONS ITSELF HERE TOO (2026-10-07; the Firestick on the wall
  // read "no family key yet" while signed in: DR-0613's RPC was called only by
  // the Photos, Taxes and Gallery screens, so a device that opened Cameras
  // first never asked). A signed-in family device asks the moment it lands.
  const [credTick, setCredTick] = useState(0);
  const cred = cameraCredential({ bridge: bridgeToken() });
  const token = cred.token;
  const isOwner = cred.kind === 'owner';
  useEffect(() => {
    if (token) return undefined;
    let live = true;
    provisionBridgeToken(supabase).then((r) => { if (live && r === 'provisioned') setCredTick((n) => n + 1); });
    return () => { live = false; };
  }, [token, credTick]);
  const [access, setAccess] = useState(null);      // the grant's own description, from /list
  const [pairCode, setPairCode] = useState(() => (typeof window !== 'undefined' ? readPairParam(window.location) : '')); // a screen's code to approve (DR-0778)
  const [health, setHealth] = useState(null);       // forwarder /health JSON (+status), or {status, error}
  const [list, setList] = useState({ status: 0, cameras: [], at: 0, networkError: false, loaded: false });
  const [frames, setFrames] = useState({});          // id -> {url, at, ms, bytes, error, errorAt}
  const [liveId, setLiveId] = useState('');          // the one in-place live view (tap a tile)
  const [views, setViewsRaw] = useState(() => loadViews()); // DR-0783: named, ordered, laid-out views; the old wall is the first
  const setViews = (fn) => setViewsRaw((st) => { const next = typeof fn === 'function' ? fn(st) : fn; saveViews(next); return next; });
  const view = activeView(views);
  const wall = useMemo(() => (view ? view.cameras : []), [view]); // the active view's cameras (the tiles read this)
  const [renaming, setRenaming] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const closeWindow = useCallback(() => setWindowOpen(false), []);
  const scaleWindow = useCallback((sc) => { if (view) setViews((st) => setViewScale(st, view.id, sc)); }, [view]);
  const [newName, setNewName] = useState('');
  const [drag, setDrag] = useState('');             // the camera being dragged in the view
  const [focusedTileRaw, setFocusedTile] = useState(''); // the camera a click made largest in the view (DR-0796)
  const viewGridRef = useRef(null);
  const [pick, setPick] = useState('');             // camera whose clips are listed (set from a tile)
  const recordingRef = useRef(null);
  // TABS INSIDE THE TAB (DR-0783; Darrell: "the recordings should be on the
  // recordings tab... scrolling down to see something that could be in the
  // next tab is a real issue"). Live is the default; the rest are one tap.
  const [tab, setTabRaw] = useState(() => { try { return localStorage.getItem(CAMS_TAB_KEY) || 'live'; } catch { return 'live'; } });
  const setTab = (t) => { try { localStorage.setItem(CAMS_TAB_KEY, t); } catch { /* fine */ } setTabRaw(t); };
  const [liveTiles, setLiveTilesRaw] = useState(() => loadLiveTiles()); // DR-0776: every tile a live player
  const setLiveTiles = (on) => { saveLiveTiles(on); setLiveTilesRaw(on); };
  const [why, setWhy] = useState('');                // tile whose Why? panel is open
  const streamHealth = useStreamHealth(token, !!token); // the NAS's stream health log (DR-0798), every 15 s
  const [devicesState, setDevicesState] = useState(null); // DR-0777: the Wyze account's devices (the doors), independent of video
  const [showAdd, setShowAdd] = useState(false);
  const [showShell, setShowShell] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const framesRef = useRef({});
  const recording = useRecording(isOwner ? token : '');

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
    // The doors ride their own road (Wyze's cloud through the NAS): asked for
    // beside the list, never after it, so a dark restreamer leaves them standing.
    fetchDevices(token).then((d) => setDevicesState(d));
    try {
      const r = await fetchWithTimeout(listUrl(), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS);
      let body = null;
      try { body = await r.json(); } catch { body = null; }
      setList({ status: r.status, cameras: r.status === 200 ? parseCameraList(body) : [], at: Date.now(), networkError: false, loaded: true });
      setAccess(r.status === 200 && body && body.access && typeof body.access === 'object' ? body.access : null);
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
  // DR-0776: with live tiles on, every camera that has not failed is a live
  // player, up to the NAS's cap minus the wall; failed ones keep the snapshot
  // road (so the reason shows and recovery is noticed), as do any past the cap.
  // Keyed by a string so the Set's identity only changes when its CONTENTS do:
  // a Set rebuilt on every frame update would restart the sweep effect on
  // every frame (a loop the first draft of this fell into).
  const failedKey = useMemo(() => Object.entries(frames).filter(([, f]) => f && f.error).map(([id]) => id).sort().join(','), [frames]);
  const maxLive = health && Number.isFinite(Number(health.max_live)) ? Number(health.max_live) : 0;
  const liveTileKey = useMemo(() => {
    if (!liveTiles || state !== 'ready') return '';
    const failed = new Set(failedKey ? failedKey.split(',') : []);
    const budget = liveTileBudget({ max_live: maxLive }, wall.length);
    const out = [];
    for (const cam of list.cameras) {
      if (out.length >= budget) break;
      if (wall.includes(cam.id) || cam.id === liveId || failed.has(cam.id)) continue;
      out.push(cam.id);
    }
    return out.join(',');
  }, [liveTiles, state, maxLive, wall, liveId, list.cameras, failedKey]);
  const liveTileIds = useMemo(() => new Set(liveTileKey ? liveTileKey.split(',') : []), [liveTileKey]);
  const liveKey = useMemo(() => [liveId, ...wall, ...(liveTileKey ? liveTileKey.split(',') : [])].filter(Boolean).sort().join(','), [liveId, wall, liveTileKey]);
  const liveIds = useMemo(() => new Set(liveKey ? liveKey.split(',') : []), [liveKey]);
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
  const byId = useMemo(() => Object.fromEntries(list.cameras.map((c) => [c.id, c])), [list.cameras]);
  const wallCams = wall.map((id) => byId[id]).filter(Boolean);
  const garages = useMemo(() => garagesFor(devicesState && devicesState.devices, list.cameras), [devicesState, list.cameras]);
  const garageByCamera = useMemo(() => Object.fromEntries(garages.filter((g) => g.cameraId).map((g) => [g.cameraId, g])), [garages]);

  const roadChip = health == null ? <span className={chip.muted}>checking the road</span>
    : roadUp ? <span className={chip.ok}>NAS restreamer up{health.go2rtc ? ` · go2rtc ${health.go2rtc}` : ''}{Number.isFinite(Number(health.streams)) ? ` · ${health.streams} stream${Number(health.streams) === 1 ? '' : 's'}` : ''}{health.forwarder ? ` · forwarder ${health.forwarder}` : ''}</span>
    : <span className={chip.blocked}>{health.status === 502 ? 'restreamer dark' : health.status ? `road HTTP ${health.status}` : 'road unreachable'}</span>;

  return (
    <div>
      <SectionTitle eyebrow="Your cameras, from your own server · live in every tile · every control on its camera · your views, in your order, as many as you want">Cameras</SectionTitle>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 text-[0.6875rem] text-[#5A5751]">
        <div>{roadChip}</div>
        <div className="flex items-center gap-2">
          {list.at ? <span>list read {formatAge(Math.max(0, now - list.at))}</span> : null}
          <button type="button" onClick={load} className={`${btnGhost}`}>Refresh</button>
        </div>
      </div>
      {!isOwner && token ? <AccessChip access={access} onLeave={() => { saveGrantToken(''); try { window.location.reload(); } catch { /* fine */ } }} /> : null}
      {isOwner && pairCode ? <ApprovePairing code={pairCode} token={token} cameras={list.cameras} onDone={() => { try { stripPairParam(window.location, window.history); } catch { /* fine */ } setTimeout(() => setPairCode(''), 4000); }} /> : null}
      {token && state === 'ready' ? (
        <div className="mb-3 flex items-center gap-1 flex-wrap" role="tablist" aria-label="Cameras sections" data-testid="cams-tabs">
          {CAMS_TABS.filter(([k]) => isOwner || k === 'live').map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${tab === k ? 'bg-[#B85838] text-white' : 'bg-white text-[#1A1815] border border-[#B8B4AC]'} text-[0.625rem] uppercase tracking-wider px-3 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setTab(k)} data-testid={`cams-tab-${k}`}>{label}</button>
          ))}
          {liveTrafficLine(health) ? <span className={`${chip.muted} ml-auto`} data-testid="live-traffic">{liveTrafficLine(health)}</span> : null}
        </div>
      ) : null}
      {token && health && health.status && (state !== 'ready' || tab === 'setup') ? (
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          {isOwner ? <ServiceRestart token={token} health={health} onDone={load} /> : null}
          <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setLiveTiles(!liveTiles)} aria-pressed={liveTiles} data-testid="live-tiles-toggle">{liveTiles ? 'Live in every tile · on' : 'Live in every tile · off (frames every 5 s)'}</button>
        </div>
      ) : null}

      {token && (state !== 'ready' || tab === 'live') ? <Doors garages={garages} devicesState={devicesState} token={token} /> : null}

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
          {roadUp ? <PairScreen onPaired={() => setCredTick((n) => n + 1)} /> : null}
        </div>
      )}

      {state === 'unauthorized' && isOwner && (
        <div className={card}>
          <div className={labelCls}>The family key on this device was refused</div>
          <p className="text-sm mt-1">The NAS said no to this device&apos;s key (HTTP {list.status}). It was rotated or this copy is stale; sign out and in as family to provision the current one.</p>
        </div>
      )}
      {state === 'unauthorized' && !isOwner && (
        <div className={card} data-testid="grant-ended">
          <div className={labelCls}>This access has ended</div>
          <p className="text-sm mt-1">The owner took it back, or its time ran out (HTTP {list.status}). Ask the owner for a new link if you still need it.</p>
          <button type="button" className={`${btnGhost} mt-2 focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => { saveGrantToken(''); try { window.location.reload(); } catch { /* fine */ } }}>Remove it from this device</button>
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

      {state === 'empty' && !isOwner && (
        <div className={card}>
          <div className={labelCls}>No cameras for this access right now</div>
          <p className="text-sm mt-1">The owner&apos;s camera service lists nothing this access may see. Nothing to do here; it fills in when the owner&apos;s cameras are back.</p>
        </div>
      )}
      {state === 'empty' && isOwner && (
        <div className={card}>
          <div className={labelCls}>The restreamer is up and has no cameras yet</div>
          <p className="text-sm mt-1">
            {wyzeKept(health)
              ? 'Everything self-deployed, and your Wyze sign-in is already here. Nothing to type.'
              : 'Everything self-deployed. Wyze cameras need the one thing the repo never holds: your Wyze sign-in. Type it once below and the NAS keeps it; you never type it again.'}
          </p>
          {wyzeKept(health) ? <AddAgain token={token} onAdded={() => { load(); }} /> : null}
          {wyzeKept(health) ? <p className="text-xs text-[#5A5751] mt-3">A different Wyze account? Sign in below and it replaces the kept one.</p> : null}
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

      {state === 'ready' && tab === 'live' && (
        <>
          {/* VIEWS (DR-0783; Darrell: "My views should be able to have and reorder the view live while it is still actively streaming... see 4 with each other or 6"). */}
          <section className="mb-4" data-testid="camera-views">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap" role="tablist" aria-label="Your views">
                {views.views.map((v) => (
                  <button key={v.id} type="button" role="tab" aria-selected={v.id === views.active} className={`${v.id === views.active ? 'bg-[#1A1815] text-white' : 'bg-white text-[#1A1815] border border-[#B8B4AC]'} text-[0.625rem] uppercase tracking-wider px-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => { setRenaming(false); setViews((st) => ({ ...st, active: v.id })); }} data-testid={`view-tab-${v.id}`}>{v.name} · {v.cameras.length}</button>
                ))}
                <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setViews((st) => addView(st))} data-testid="view-new">+ New view</button>
              </div>
              {view ? (
                <div className="flex items-center gap-2 text-[0.6875rem] text-[#5A5751] flex-wrap">
                  <label className="inline-flex items-center gap-1">
                    <span>Across</span>
                    <select className="border border-[#B8B4AC] bg-white text-[#1A1815] text-[0.6875rem] px-1 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={String(view.layout)} onChange={(e) => setViews((st) => setViewLayout(st, view.id, e.target.value === 'auto' ? 'auto' : Number(e.target.value)))} aria-label="How many cameras across" data-testid="view-layout">
                      {VIEW_LAYOUTS.map((l) => <option key={String(l)} value={String(l)}>{l === 'auto' ? 'Auto' : `${l} across`}</option>)}
                    </select>
                  </label>
                  {view.cameras.length ? <button type="button" className={`${btnDark} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setWindowOpen(true)} aria-label="Open this view as one full-size window" data-testid="view-window-open">⤢ Window</button> : null}
                  {renaming ? (
                    <form className="inline-flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); setViews((st) => renameView(st, view.id, newName)); setRenaming(false); }}>
                      <input className={`${inputCls} w-40 min-h-[36px] py-1`} value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="Name this view" data-testid="view-name" />
                      <button type="submit" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`}>Save</button>
                    </form>
                  ) : <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => { setNewName(view.name); setRenaming(true); }} data-testid="view-rename">Rename</button>}
                  {view.cameras.length ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={confirmThen(`Clear every camera from the view ${view.name}? The cameras themselves are untouched.`, () => setViews((st) => ({ ...st, views: st.views.map((v) => (v.id === view.id ? { ...v, cameras: [] } : v)) })))}>Clear</button> : null}
                  {views.views.length > 1 ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={confirmThen(`Delete the view ${view.name}? The cameras themselves are untouched.`, () => setViews((st) => deleteView(st, view.id)))} aria-label={`Delete the view ${view.name}`} data-testid="view-delete">Delete view</button> : null}
                </div>
              ) : null}
            </div>
            {view && wallCams.length && windowOpen ? (
              <>
                <p className="text-[0.6875rem] text-[#5A5751]" data-testid="view-window-note">{view.name} is open as one full-size window.</p>
                <ViewWindow view={view} cams={wallCams} token={token} liveMax={liveMax} now={now} onClose={closeWindow} onScale={scaleWindow} />
              </>
            ) : view && wallCams.length ? (
              <div ref={viewGridRef} className={`grid ${focusIn(wallCams, focusedTileRaw) ? 'grid-cols-1' : viewGridClass(viewCols(view.layout, wallCams.length))} gap-3`} data-testid={`view-${view.id}`} data-cols={focusIn(wallCams, focusedTileRaw) ? 1 : viewCols(view.layout, wallCams.length)} data-focused={focusIn(wallCams, focusedTileRaw) || undefined}>
                {wallCams.map((cam, i) => (
                  <div key={cam.id} data-view-cam={cam.id} data-focused={focusIn(wallCams, focusedTileRaw) === cam.id ? 'true' : undefined} className={`${drag === cam.id ? 'opacity-70 ring-2 ring-[#B85838]' : ''} ${focusIn(wallCams, focusedTileRaw) && focusIn(wallCams, focusedTileRaw) !== cam.id ? 'hidden' : ''}`}>
                    <div className="flex items-center justify-between gap-1 mb-1 text-[0.625rem] text-[#5A5751]">
                      <button type="button" className="cursor-grab touch-none min-h-[36px] px-2 text-base leading-none focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label={`Drag ${cam.name} to another place in the view`} title="Drag to reorder"
                        onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ } setDrag(cam.id); }}
                        onPointerMove={(e) => {
                          if (drag !== cam.id || !viewGridRef.current) return;
                          const boxes = [...viewGridRef.current.querySelectorAll('[data-view-cam]')].map((el) => { const b = el.getBoundingClientRect(); return { id: el.getAttribute('data-view-cam'), left: b.left, top: b.top, right: b.right, bottom: b.bottom }; });
                          const idx = indexAtPoint(boxes, e.clientX, e.clientY);
                          if (idx >= 0 && boxes[idx].id !== cam.id) setViews((st) => moveInView(st, view.id, cam.id, idx));
                        }}
                        onPointerUp={() => setDrag('')} onPointerCancel={() => setDrag('')}>⠿</button>
                      <span className="flex items-center gap-1">
                        <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={i === 0} onClick={() => setViews((st) => moveInView(st, view.id, cam.id, i - 1))} aria-label={`Move ${cam.name} earlier`} data-testid={`view-left-${cam.id}`}>◀</button>
                        <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={i === wallCams.length - 1} onClick={() => setViews((st) => moveInView(st, view.id, cam.id, i + 1))} aria-label={`Move ${cam.name} later`} data-testid={`view-right-${cam.id}`}>▶</button>
                      </span>
                    </div>
                    <LiveVideo cam={cam} token={token} liveMax={liveMax} compact testId={`wall-${cam.id}`} now={now} onClose={() => setViews((st) => removeFromView(st, view.id, cam.id))}
                      onPick={() => setFocusedTile((f) => toggleFocus(f, cam.id))} picked={focusIn(wallCams, focusedTileRaw) === cam.id}
                      sd={!focusIn(wallCams, focusedTileRaw) && wallCams.length > 1} released={!!focusIn(wallCams, focusedTileRaw) && focusIn(wallCams, focusedTileRaw) !== cam.id} />
                  </div>
                ))}
              </div>
            ) : <p className="text-[0.6875rem] text-[#5A5751]">Press + View on any camera to add it here. Drag the handle, or use the arrows, to put them in your order while they stream; pick how many across. Click a picture to make it the largest; click it again to put it back.</p>}
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
                  const tileLive = liveTileIds.has(cam.id);
                  return (
                    <React.Fragment key={cam.id}>
                      <div className={`bg-white border ${isLive ? 'border-[#B85838]' : 'border-[#1A1815]'}`}>
                        {tileLive ? (
                          <TileLive cam={cam} token={token} liveMax={liveMax} now={now} sd={g.cameras.length > 1} onFailed={(reason) => { framesRef.current = { ...framesRef.current, [cam.id]: { ...(framesRef.current[cam.id] || {}), error: reason, errorAt: Date.now() } }; setFrames(framesRef.current); }} />
                        ) : (
                        <button type="button" onClick={() => setLiveId(isLive ? '' : cam.id)} className="block w-full text-left min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label={isLive ? `Close live view of ${cam.name}` : `Open live view of ${cam.name}`}>
                          <div className="aspect-video bg-[#1A1815] flex items-center justify-center overflow-hidden">
                            {fresh ? <img src={f.url} alt={`${cam.name}, latest frame`} className="w-full h-full object-cover" />
                              : <span className="text-white/80 text-xs p-3 text-center">{f && f.error ? 'No frame yet from this camera' : 'Fetching the first frame...'}</span>}
                          </div>
                        </button>
                        )}
                        <div className="p-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#1A1815] truncate">{cam.name}</div>
                            <div className="text-[0.625rem] text-[#5A5751]">
                              {tileLive ? <span className="text-[#2F6B3A]">live</span> : fresh ? <>frame {formatAge(Math.max(0, now - f.at))} · {f.ms} ms · {formatBytes(f.bytes)}</> : <>&nbsp;</>}
                              {f && f.error && !tileLive ? <span className="text-[#B85838]" data-testid={`reason-${cam.id}`}> · {f.error}</span> : null}
                            </div>
                            {streamHealth && streamHealth.cameras && streamHealth.cameras[cam.id] && streamHealthLine(streamHealth.cameras[cam.id]) ? (
                              <div className={`text-[0.625rem] ${streamHealth.cameras[cam.id].drops_1h > 0 ? 'text-[#B85838]' : 'text-[#5A5751]'}`} data-testid={`stream-health-${cam.id}`}>{streamHealthLine(streamHealth.cameras[cam.id])}</div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            {garageByCamera[cam.id] ? <GarageButton device={garageByCamera[cam.id]} token={token} compact /> : null}
                            {isOwner ? <TileRecord cam={cam} r={recording} onClips={(id) => { setPick(id); setTab('recordings'); }} /> : null}
                            {(f && f.error) || (streamHealth && streamHealth.cameras && streamHealth.cameras[cam.id] && streamHealth.cameras[cam.id].drops_1h > 0) ? <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setWhy(why === cam.id ? '' : cam.id)} aria-label={`Why does ${cam.name} ${f && f.error ? 'show no frame' : 'drop'}?`}>Why?</button> : null}
                            <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setViews((st) => (onWall ? removeFromView(st, st.active, cam.id) : addToView(st, st.active, cam.id)))} aria-label={onWall ? `Remove ${cam.name} from the view` : `Add ${cam.name} to the view`}>{onWall ? '− View' : '+ View'}</button>
                            <button type="button" onClick={() => setLiveId(isLive ? '' : cam.id)} className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`}>{isLive ? 'Close' : 'Big'}</button>
                          </div>
                        </div>
                        {why === cam.id ? <WhyPanel cam={cam} token={token} onHide={() => setWhy('')} health={streamHealth} /> : null}
                      </div>
                      {isLive ? <LiveVideo key={`live-${cam.id}`} cam={cam} token={token} liveMax={liveMax} now={now} onClose={() => setLiveId('')} /> : null}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          ))}

        </>
      )}
      {state === 'ready' && isOwner && tab === 'recordings' ? (
        <div className="mb-4" ref={recordingRef}><RecordingPanel token={token} cameras={list.cameras} r={recording} pick={pick} setPick={setPick} /></div>
      ) : null}
      {state === 'ready' && isOwner && tab === 'access' ? (
        <div className="mb-4"><AccessPanel token={token} cameras={list.cameras} onCode={(c) => { setPairCode(c); setTab('live'); }} /></div>
      ) : null}
      {state === 'ready' && isOwner && tab === 'setup' ? (
        <div className={card}>
          <div className={labelCls}>Setup</div>
          <p className="text-xs text-[#5A5751] mt-1">The service, the live-tile switch, another camera system, or a different Wyze account. Nothing here is needed day to day.</p>
          <button type="button" className={`${btnGhost} mt-2 focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Hide' : 'Add a system you own'}</button>
          {showAdd && <KindsHelp />}
          <details className="mt-3">
            <summary className="text-xs text-[#B85838] cursor-pointer min-h-[36px] inline-flex items-center">Sign in to a different Wyze account</summary>
            <WyzeSetup token={token} onAdded={() => { load(); }} />
          </details>
        </div>
      ) : null}
    </div>
  );
}
