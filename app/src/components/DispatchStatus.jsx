// =============================================================================
// DispatchStatus.jsx -- live readout PWA surface ("/dispatch-status")
// =============================================================================
// TIER 3 of the continuous-feedback-reel design: an always-on visibility page
// Darrell can open on his phone WITHOUT interacting with the orchestrator, to
// see what is happening across the PoeTech system. This is the fallback for the
// Anthropic Claude mobile app Dispatch tab.
//
// Two live sections, both polling every 10 seconds through the same-origin
// "/n8n" Vercel rewrite (per project_n8n_same_origin_rewrite -- never the
// absolute Tailscale Funnel URL, which throttles cross-origin):
//   A. Workflow Reel    GET /n8n/webhook/dispatch-status?section=reel
//   B. Code Task Snapshot GET /n8n/webhook/dispatch-status?section=tasks
// plus an ntfy "poetech-reel" subscription block (URL + scannable QR) at the top.
//
// SECURITY -- hostname gate (mirrors isPublicHost from commit 3a8ca16):
// on any PUBLIC host (poetech.us, *.vercel.app, anything not localhost /
// Tailscale-internal / RFC1918 LAN) this surface renders ONLY a placeholder.
// The real readout renders solely on family-internal hosts. Fail closed: any
// uncertainty about the host is treated as public.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { N8N_BASE } from '../lib/n8n-base.js';

// --- Hostname gate ----------------------------------------------------------
// Returns true on any PUBLIC host. Default is SAFE (treat unknown as public).
function isPublicHost() {
  try {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (host.startsWith('100.')) return false; // Tailscale CGNAT (100.64.0.0/10)
    if (host.endsWith('.ts.net')) return false; // Tailscale magic DNS
    if (host.endsWith('.local')) return false; // mDNS LAN
    if (/^192\.168\./.test(host)) return false; // RFC1918 LAN
    if (/^10\./.test(host)) return false; // RFC1918 LAN
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false; // RFC1918 LAN
    return true; // poetech.us, *.vercel.app, anything else = PUBLIC
  } catch (e) {
    return true; // Fail closed.
  }
}

// --- ntfy subscription -------------------------------------------------------
// The self-hosted ntfy server reachable from the phone. The Tailscale host is
// the family-internal entry point; adjust NTFY_SERVER once a dedicated ntfy
// funnel/subdomain is confirmed. The ntfy:// deep link opens the ntfy app and
// pre-fills the subscription in one tap.
const NTFY_SERVER = 'poetech.tail5a2f35.ts.net';
const NTFY_TOPIC = 'poetech-reel';
const NTFY_HTTPS_URL = `https://${NTFY_SERVER}/${NTFY_TOPIC}`;
const NTFY_DEEPLINK = `ntfy://${NTFY_SERVER}/${NTFY_TOPIC}`;

// qrcode-generator (no build dep; loaded from CDN on demand).
const QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';

// --- styling tokens (match the main app dark theme) -------------------------
const SERIF = { fontFamily: '"Fraunces", serif' };
const POLL_MS = 10000;
const TASKS_STALE_MS = 90000; // orchestrator considered offline past this age

// Color-code reel entries by event type / level. Tolerant of several field
// spellings since the orchestrator authors the reel format downstream.
const EVENT_COLORS = {
  error:   { bar: '#DC2626', chip: '#DC2626' },
  fail:    { bar: '#DC2626', chip: '#DC2626' },
  warn:    { bar: '#D97706', chip: '#D97706' },
  warning: { bar: '#D97706', chip: '#D97706' },
  alert:   { bar: '#D97706', chip: '#D97706' },
  ship:    { bar: '#16A34A', chip: '#16A34A' },
  success: { bar: '#16A34A', chip: '#16A34A' },
  done:    { bar: '#16A34A', chip: '#16A34A' },
  ok:      { bar: '#16A34A', chip: '#16A34A' },
  info:    { bar: '#2563EB', chip: '#2563EB' },
  build:   { bar: '#7C3AED', chip: '#7C3AED' },
  feedback:{ bar: '#0891B2', chip: '#0891B2' },
};
const DEFAULT_COLOR = { bar: '#6B7280', chip: '#6B7280' };

// Per-workflow badge tints so wf27 / wf31 / wf12 read at a glance.
const WF_COLORS = {
  wf04: '#0891B2', wf05: '#0891B2', wf08: '#0891B2',
  wf12: '#2563EB', wf13: '#2563EB', wf18: '#7C3AED',
  wf27: '#16A34A', wf30: '#16A34A', wf31: '#16A34A', wf32: '#16A34A',
  wf36: '#D97706',
};

function pick(obj, keys, fallback) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return fallback;
}

function eventColor(type) {
  const t = String(type || '').toLowerCase();
  return EVENT_COLORS[t] || DEFAULT_COLOR;
}

function wfBadgeColor(wf) {
  const w = String(wf || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return WF_COLORS[w] || '#5A5751';
}

// Relative timestamp ("12s ago", "4m ago", "2h ago"). Falls back to the raw
// value when it is not a parseable date.
function relTime(value) {
  if (!value) return '';
  let ms;
  if (typeof value === 'number') ms = value < 1e12 ? value * 1000 : value;
  else ms = Date.parse(value);
  if (!ms || Number.isNaN(ms)) return String(value);
  const diff = Date.now() - ms;
  if (diff < 0) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function nowLabel() {
  try { return new Date().toLocaleTimeString(); } catch (e) { return ''; }
}

// =============================================================================
// QR block
// =============================================================================
function NtfyBlock() {
  const qrRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    function draw() {
      try {
        if (cancelled || !qrRef.current || typeof window.qrcode !== 'function') return;
        const qr = window.qrcode(0, 'M');
        qr.addData(NTFY_DEEPLINK);
        qr.make();
        qrRef.current.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2 });
        const svg = qrRef.current.querySelector('svg');
        if (svg) { svg.style.width = '160px'; svg.style.height = '160px'; svg.style.background = '#FAF8F4'; }
      } catch (e) { /* QR is best-effort; the text link below always works */ }
    }
    if (typeof window.qrcode === 'function') {
      draw();
    } else {
      let s = document.querySelector(`script[data-qrlib="1"]`);
      if (!s) {
        s = document.createElement('script');
        s.src = QR_CDN;
        s.async = true;
        s.setAttribute('data-qrlib', '1');
        document.head.appendChild(s);
      }
      s.addEventListener('load', draw);
    }
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="border border-[#3A352E] bg-[#211E1A] rounded-md p-4 mb-5">
      <h2 className="text-sm uppercase tracking-wider text-[#C9C3B8] mb-3" style={SERIF}>
        Subscribe to the reel on your phone
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div ref={qrRef} className="shrink-0 rounded bg-[#FAF8F4] p-2" aria-label="ntfy subscription QR code" />
        <div className="text-xs text-[#C9C3B8] leading-relaxed">
          <p className="mb-2">
            Scan with the <span className="text-[#FAF8F4] font-semibold">ntfy</span> app to subscribe in one tap,
            then every reel event pushes to your phone.
          </p>
          <p className="mb-1">
            <span className="text-[#8A857C]">Topic:</span>{' '}
            <span className="text-[#FAF8F4] font-mono">{NTFY_TOPIC}</span>
          </p>
          <p className="mb-1 break-all">
            <span className="text-[#8A857C]">Deep link:</span>{' '}
            <a href={NTFY_DEEPLINK} className="text-[#E0A86B] underline font-mono">{NTFY_DEEPLINK}</a>
          </p>
          <p className="break-all">
            <span className="text-[#8A857C]">Web:</span>{' '}
            <a href={NTFY_HTTPS_URL} target="_blank" rel="noreferrer" className="text-[#E0A86B] underline font-mono">{NTFY_HTTPS_URL}</a>
          </p>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Reel
// =============================================================================
function ReelEntry({ entry }) {
  const [open, setOpen] = useState(false);
  const ts = pick(entry, ['ts', 'at', 'time', 'timestamp', 'when'], '');
  const wf = pick(entry, ['wf', 'workflow', 'source', 'origin'], '');
  const type = pick(entry, ['type', 'event', 'level', 'kind'], '');
  const summary = pick(entry, ['summary', 'msg', 'message', 'text', 'detail', 'title'], '(no summary)');
  const color = eventColor(type);

  return (
    <li
      className="border-l-2 pl-3 py-2 cursor-pointer hover:bg-[#26221D]"
      style={{ borderColor: color.bar }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-[#8A857C] font-mono shrink-0 w-16">{relTime(ts)}</span>
        {wf ? (
          <span
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded text-white font-semibold shrink-0"
            style={{ background: wfBadgeColor(wf) }}
          >{String(wf)}</span>
        ) : null}
        {type ? (
          <span
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold shrink-0"
            style={{ color: color.chip, border: `1px solid ${color.chip}` }}
          >{String(type)}</span>
        ) : null}
        <span className="text-xs text-[#FAF8F4] flex-1 min-w-0 truncate">{String(summary)}</span>
        <span className="text-[10px] text-[#8A857C] shrink-0">{open ? 'hide' : 'json'}</span>
      </div>
      {open ? (
        <pre className="mt-2 text-[10px] text-[#C9C3B8] bg-[#1A1815] border border-[#3A352E] rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(entry, null, 2)}
        </pre>
      ) : null}
    </li>
  );
}

function ReelSection() {
  const [entries, setEntries] = useState([]);
  const [err, setErr] = useState(null);
  const [lastRefresh, setLastRefresh] = useState('');
  const listRef = useRef(null);
  const countRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${N8N_BASE}/webhook/dispatch-status?section=reel`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.entries) ? data.entries : []);
      // Auto-scroll to top only when new entries arrived.
      if (arr.length > countRef.current && listRef.current) {
        try { listRef.current.scrollTop = 0; } catch (e) { /* noop */ }
      }
      countRef.current = arr.length;
      setEntries(arr);
      setErr(null);
      setLastRefresh(nowLabel());
    } catch (e) {
      setErr(String(e.message || e));
      setLastRefresh(nowLabel());
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <section className="border border-[#3A352E] bg-[#211E1A] rounded-md p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-[#C9C3B8]" style={SERIF}>Workflow reel</h2>
        <span className="text-[10px] text-[#8A857C]">
          {err ? `error - retrying - ${lastRefresh}` : `refreshed ${lastRefresh}`}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-[#8A857C] py-6 text-center">
          {err ? 'Reel endpoint unreachable. Retrying every 10s.' : 'No reel events yet. Waiting for the first workflow to fire.'}
        </p>
      ) : (
        <ul ref={listRef} className="space-y-0.5 max-h-[55vh] overflow-y-auto">
          {entries.map((e, i) => <ReelEntry key={pick(e, ['id', 'ts', 'at'], i)} entry={e} />)}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Code Task Snapshot
// =============================================================================
function TasksSection() {
  const [snapshotAt, setSnapshotAt] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [lastRefresh, setLastRefresh] = useState('');
  const [reachable, setReachable] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${N8N_BASE}/webhook/dispatch-status?section=tasks`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSnapshotAt(pick(data, ['snapshot_at', 'snapshotAt', 'at'], null));
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      setReachable(true);
      setLastRefresh(nowLabel());
    } catch (e) {
      setReachable(false);
      setLastRefresh(nowLabel());
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Orchestrator offline = no snapshot, unreachable endpoint, or stale snapshot.
  const snapMs = snapshotAt ? Date.parse(snapshotAt) : NaN;
  const stale = !snapshotAt || Number.isNaN(snapMs) || (Date.now() - snapMs) > TASKS_STALE_MS;
  const offline = !reachable || stale;

  return (
    <section
      className="border border-[#3A352E] bg-[#211E1A] rounded-md p-4 mb-5 transition-opacity"
      style={{ opacity: offline ? 0.55 : 1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-[#C9C3B8]" style={SERIF}>Code task snapshot</h2>
        <span className="text-[10px] text-[#8A857C]">
          {offline ? `Orchestrator offline - last refreshed at ${lastRefresh}` : `snapshot ${relTime(snapshotAt)} - refreshed ${lastRefresh}`}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-[#8A857C] py-6 text-center">
          {offline ? 'No live snapshot. The orchestrator session is not currently reporting.' : 'No running Code Tasks right now.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t, i) => {
            const title = pick(t, ['title', 'name', 'subject'], '(untitled task)');
            const turns = pick(t, ['turns', 'turn_count', 'turnCount'], null);
            const activity = pick(t, ['latest', 'activity', 'last_activity', 'note'], '');
            const lastSeen = pick(t, ['last_seen', 'lastSeen', 'seen_at', 'at'], null);
            return (
              <li key={pick(t, ['id', 'title'], i)} className="border border-[#3A352E] rounded bg-[#1A1815] p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm text-[#FAF8F4] font-medium" style={SERIF}>{String(title)}</span>
                  {turns !== null ? (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#3A352E] text-[#C9C3B8] shrink-0">
                      {String(turns)} turns
                    </span>
                  ) : null}
                </div>
                {activity ? <p className="text-xs text-[#C9C3B8] mt-1 truncate">{String(activity)}</p> : null}
                {lastSeen ? <p className="text-[10px] text-[#8A857C] mt-1">last seen {relTime(lastSeen)}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Root
// =============================================================================
export default function DispatchStatus() {
  const isPublic = useMemo(() => isPublicHost(), []);

  if (isPublic) {
    return (
      <div className="min-h-screen bg-[#1A1815] text-[#FAF8F4] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl mb-3" style={SERIF}>Dispatch status</h1>
          <p className="text-sm text-[#C9C3B8] leading-relaxed">
            This surface is family-private. Access via your Tailscale URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1815] text-[#FAF8F4]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="mb-5">
          <h1 className="text-2xl" style={SERIF}>PoeTech dispatch status</h1>
          <p className="text-xs text-[#8A857C] mt-1">
            Live readout - reel + Code Tasks refresh every 10s. Open and watch; no interaction needed.
          </p>
        </header>
        <NtfyBlock />
        <ReelSection />
        <TasksSection />
        <footer className="text-[10px] text-[#8A857C] text-center pt-2 pb-8">
          Family-internal surface - hostname gated. Served only on Tailscale / LAN hosts.
        </footer>
      </div>
    </div>
  );
}
