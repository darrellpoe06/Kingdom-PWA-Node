// =============================================================================
// NetworkStatus — small floating status pill (bottom-left, above Feedback)
// =============================================================================
// Surfaces, at a glance, whether the device is reaching:
//   1. the device's network (online / offline, WiFi vs cellular vs other)
//   2. the public internet  (probe Cloudflare's tiny trace endpoint)
//   3. the NAS              (probe Synology Chat bot URL via no-cors POST)
//
// The dots show:
//   green  = ok (last probe succeeded)
//   yellow = checking / unknown
//   red    = failed
//   gray   = not configured
//
// Tap the pill to expand a panel with last-success timestamps + connection
// details. Designed for Darrell's vacation travel scenario — when Synology
// Chat says "no network connection," he can tell at a glance whether his
// phone is offline, his cellular link is fine but the NAS is unreachable,
// or the NAS is reachable but Chat itself is the problem.
//
// Probes run every 30s while the tab is visible, paused while hidden, and
// fire once immediately on online/offline events.
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';

const COLOR = {
  ok: '#16A34A',          // green
  failed: '#DC2626',      // red
  pending: '#D97706',     // amber/yellow
  notConfigured: '#6B7280', // gray
};

function dotColor(state) {
  if (state === 'ok') return COLOR.ok;
  if (state === 'failed') return COLOR.failed;
  if (state === 'not-configured') return COLOR.notConfigured;
  return COLOR.pending;
}

function formatRelative(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const ms = Date.now() - then;
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

// Detect basic network info from the browser. The Network Information API
// is non-standard but widely supported on Chrome / Edge / Android browsers,
// which is where Darrell + family will actually use this. Safari returns
// undefined — we fall back to navigator.onLine only.
function readNetwork() {
  const online = typeof navigator !== 'undefined' && navigator.onLine !== false;
  const conn = (typeof navigator !== 'undefined' && (navigator.connection || navigator.mozConnection || navigator.webkitConnection)) || null;
  return {
    online,
    effectiveType: conn?.effectiveType || null, // '4g' | '3g' | '2g' | 'slow-2g'
    type: conn?.type || null,                   // 'wifi' | 'cellular' | 'ethernet' | 'wimax' | 'bluetooth' | 'none' | 'unknown' | 'other'
    downlink: conn?.downlink || null,           // approx Mbps
    rtt: conn?.rtt || null,                     // approx ms
    saveData: conn?.saveData || false,
  };
}

// Pretty-label the connection type for the UI. Falls back gracefully on
// browsers that don't expose connection.type (Safari, older Firefox).
function connectionLabel(net) {
  if (!net.online) return 'Offline';
  if (net.type === 'wifi') return 'WiFi';
  if (net.type === 'cellular') return `Cellular${net.effectiveType ? ' · ' + net.effectiveType.toUpperCase() : ''}`;
  if (net.type === 'ethernet') return 'Ethernet';
  if (net.effectiveType) return net.effectiveType.toUpperCase();
  return 'Online';
}

// One probe round. Runs the three probes in parallel and resolves the
// per-probe state. Each probe has its own AbortController so a slow probe
// doesn't hold the others up. Returns { internet, nas, lastProbe } plus
// per-probe lastOk timestamps.
async function runProbes(currentLastOk) {
  const PROBE_TIMEOUT_MS = 5000;
  const next = { ...currentLastOk };

  const withTimeout = async (fn) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    try {
      return await fn(ctrl.signal);
    } finally {
      clearTimeout(t);
    }
  };

  // Probe 1: public internet via Cloudflare trace (tiny ~200 bytes, CORS-friendly).
  let internet = 'failed';
  try {
    const r = await withTimeout((signal) =>
      fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'cors', cache: 'no-store', signal })
    );
    if (r && r.ok) {
      internet = 'ok';
      next.internet = new Date().toISOString();
    }
  } catch (_) { /* keep 'failed' */ }

  // Probe 2: NAS reachability via Synology Chat bot URL (no-cors POST).
  // Using no-cors means we can't read the response, but if fetch doesn't
  // throw the underlying network reached the server. We send a tiny payload
  // that posts a probe message — that's intentional churn we accept for
  // the strongest possible signal. If you want quieter, swap URL_PROBE
  // for a GET on DSM's index page.
  let nas = 'failed';
  const botUrl = import.meta.env?.VITE_SYNOLOGY_CHAT_BOT_URL;
  if (!botUrl) {
    nas = 'not-configured';
  } else {
    // Health-check endpoint: GET the DSM homepage at the same host (no-cors).
    // We extract the origin from the bot URL so this auto-adjusts if the
    // host ever changes. DSM responds 200 fast, with no side effects.
    let probeUrl;
    try {
      const u = new URL(botUrl);
      probeUrl = u.origin + '/';
    } catch (_) {
      probeUrl = botUrl;
    }
    try {
      await withTimeout((signal) =>
        fetch(probeUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal })
      );
      nas = 'ok';
      next.nas = new Date().toISOString();
    } catch (_) { /* keep 'failed' */ }
  }

  return { internet, nas, lastOk: next };
}

export default function NetworkStatus() {
  const [net, setNet] = useState(() => readNetwork());
  const [probes, setProbes] = useState({ internet: 'pending', nas: 'pending' });
  const [lastOk, setLastOk] = useState({ internet: null, nas: null });
  const [lastProbe, setLastProbe] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const tickRef = useRef(null);
  const cancelledRef = useRef(false);

  // Refresh device-network info on online/offline + connection-change events.
  useEffect(() => {
    const update = () => setNet(readNetwork());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const conn = navigator.connection;
    if (conn && conn.addEventListener) {
      conn.addEventListener('change', update);
    }
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', update);
      }
    };
  }, []);

  // Active probes — run on mount, on online events, and every 30s while
  // the document is visible. Paused while hidden (saves cellular data).
  useEffect(() => {
    cancelledRef.current = false;

    const tick = async () => {
      if (cancelledRef.current) return;
      // Don't burn cellular probing public internet if we're plainly offline.
      if (!navigator.onLine) {
        setProbes({ internet: 'failed', nas: 'failed' });
        setLastProbe(new Date().toISOString());
        return;
      }
      const { internet, nas, lastOk: nextLastOk } = await runProbes(lastOk);
      if (cancelledRef.current) return;
      setProbes({ internet, nas });
      setLastOk(nextLastOk);
      setLastProbe(new Date().toISOString());
    };

    tick();

    const schedule = () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') tick();
      }, 30_000);
    };
    schedule();

    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    const onOnline = () => tick();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);

    return () => {
      cancelledRef.current = true;
      if (tickRef.current) clearInterval(tickRef.current);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
    };
    // We intentionally don't depend on lastOk — runProbes reads it via the
    // current closure and we update it through setLastOk inside tick().
    // Re-running this effect on every probe would create a feedback loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deviceState = net.online ? 'ok' : 'failed';
  const connLabel = connectionLabel(net);
  // Recede when healthy (DR-0075): all-green collapses to ONE quiet dot so the
  // status stops competing with content and stops stacking a loud 3-dot pill
  // above the Feedback button. It SHOUTS (full 3-dot + label) the instant any
  // check is pending/failed — the diagnostic value (Darrell's travel "no
  // network" scenario) is exactly when it goes loud. Tap opens the detail panel
  // in either state. NAS not-configured counts as healthy (nothing to reach).
  const healthy = deviceState === 'ok' && probes.internet === 'ok'
    && (probes.nas === 'ok' || probes.nas === 'not-configured');

  // Compact pill: one dot when healthy; 3 dots + connection label when not.
  return (
    <div
      className="fixed bottom-20 left-4 z-30 print:hidden"
      role="status"
      aria-label="Network status"
    >
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 px-3 py-2 bg-white/95 dark:bg-[#1A1815]/95 border border-[#1A1815]/20 shadow-md backdrop-blur-sm hover:shadow-lg focus:outline focus:outline-2 focus:outline-[#B85838] min-h-[40px]"
        style={{ borderRadius: '999px' }}
        title="Network status — tap for details"
        aria-expanded={expanded}
      >
        {healthy ? (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: dotColor('ok') }}
            aria-label="All connections healthy — tap for detail"
          />
        ) : (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor(deviceState) }} aria-label={`device ${deviceState}`} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor(probes.internet) }} aria-label={`internet ${probes.internet}`} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor(probes.nas) }} aria-label={`nas ${probes.nas}`} />
            </span>
            {/* Color must mirror the pill background, which is OS-color-scheme driven
                (bg-white/95 dark:bg-[#1A1815]/95) and theme-INDEPENDENT — the data-theme
                remap doesn't touch these variant classes. So the label color tracks the
                same dark: signal, not the theme. text-black (not text-[#1A1815]) is used
                for the light pill because the midnight remap lightens text-[#1A1815] to
                #E5E5E5, which would fail on a white pill (midnight theme + light OS). */}
            <span className="text-[10px] uppercase tracking-wider text-black dark:text-[#FAF8F4] font-semibold hidden sm:inline">
              {connLabel}
            </span>
          </>
        )}
      </button>

      {expanded && (
        <div
          className="absolute bottom-12 right-0 w-72 bg-white dark:bg-[#1A1815] text-[#1A1815] dark:text-[#FAF8F4] border border-[#1A1815]/20 shadow-xl p-3 text-xs"
          style={{ borderRadius: '12px' }}
          role="dialog"
          aria-label="Network status detail"
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-2 font-semibold">
            Connection Health
          </div>

          <Row label="Device" state={deviceState} detail={connLabel} />
          <Row
            label="Internet"
            state={probes.internet}
            detail={lastOk.internet ? `last ok ${formatRelative(lastOk.internet)}` : 'no successful probe yet'}
          />
          <Row
            label="NAS"
            state={probes.nas}
            detail={lastOk.nas ? `last ok ${formatRelative(lastOk.nas)}` : 'no successful probe yet'}
          />

          {(net.downlink || net.rtt) && (
            <div className="mt-3 pt-2 border-t border-[#E8E4DC] text-[10px] text-[#5A5751]">
              {net.downlink ? `${net.downlink} Mbps` : ''}{net.downlink && net.rtt ? ' · ' : ''}{net.rtt ? `${net.rtt} ms RTT` : ''}{net.saveData ? ' · Data Saver on' : ''}
            </div>
          )}

          <div className="mt-2 text-[10px] text-[#5A5751]">
            Last check {formatRelative(lastProbe)}
          </div>

          <div className="mt-3 pt-2 border-t border-[#E8E4DC] text-[10px] text-[#5A5751] leading-relaxed">
            Three checks: your device's connection, the public internet, and the family NAS. A red dot tells you where to look.
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, state, detail }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: dotColor(state) }} />
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-[10px] text-[#5A5751]">{detail}</span>
    </div>
  );
}
