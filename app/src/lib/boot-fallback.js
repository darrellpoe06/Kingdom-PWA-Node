// =============================================================================
// boot-fallback — the front door NEVER shows a blank white page, and it heals
// ITSELF before it ever asks the family for a tap
// =============================================================================
// Root-caused 2026-07-04: poetech.us/?view=tvtime rendered pure white. Cause: the
// main app is a dynamic import in main.jsx (`import('./poe-financial-mvp-v28.jsx')`)
// with NO .catch. On a skewed/partial deploy (the Vercel rate-limit left a shell
// whose chunk hashes the CDN no longer serves), that import rejects; the chunk-heal
// reloads once, but if it GIVES UP (loop guard) React never mounts — so there is no
// ErrorBoundary and no UI at all. A new signer-up tapping the link sees nothing and
// leaves. First impression is everything (EXCELLENCE-STANDARD).
//
// SELF-HEALING LADDER (added 2026-07-10, DR-0137 — Darrell: "The church app should
// never go down"). The screen this module used to show FIRST ("Almost there — one
// more tap") still put a tap on the family during a deploy window (DR-0128 saw the
// same class). A machine can run both recoveries itself, so now it does:
//   attempt 1 — plain reload (pulls the current shell; fixes ordinary skew)
//   attempt 2 — clear caches + unregister the SW, then reload (fixes a stale SW
//               re-serving the broken shell)
//   attempt 3 — the manual retry screen (the server is genuinely broken; reloading
//               harder would only spin the device — three-brakes posture)
// Attempts are stamped in sessionStorage (survives the reload, per-tab) with a time
// window, mirroring lib/chunk-reload-heal.js. If sessionStorage is unavailable
// (private mode can throw), we CANNOT count attempts — so we go straight to the
// manual screen rather than risk an unbounded reload loop.
//
// Everything renders in PLAIN DOM (no React, no lazy chunks, inline styles) so it
// works even when the bundle/CSS chunk is the thing that failed. Pure builders +
// injectable side-effects (now/reload/clear/win/delay) so a node test locks the
// ladder without a browser.

// sessionStorage key holding JSON { ts, stage } of the last auto-heal attempt.
export const BOOT_HEAL_KEY = 'poetech:boot-heal';
// A failure within this window after an attempt escalates to the next rung; an
// older stamp reads as a NEW incident and the ladder starts over at reload.
export const BOOT_HEAL_WINDOW_MS = 90000;

function safeSession(win) {
  try {
    return win && win.sessionStorage && typeof win.sessionStorage.getItem === 'function'
      ? win.sessionStorage
      : null;
  } catch (_) {
    return null; // private mode can throw on access
  }
}

/**
 * Decide the next rung of the self-heal ladder: 'reload' → 'clear' → 'manual'.
 * Pure + null-safe; stamps the attempt it returns (except 'manual', which is
 * terminal within the window). No sessionStorage → 'manual' (can't count = don't loop).
 * @param {object} win window-like ({ sessionStorage })
 * @param {number} now current time in ms (injected for tests)
 */
export function decideBootHeal(win, now) {
  const ss = safeSession(win);
  if (!ss) return 'manual';
  let rec = null;
  try { rec = JSON.parse(ss.getItem(BOOT_HEAL_KEY) || 'null'); } catch (_) { /* ignore */ }
  const recent = !!rec && Number.isFinite(rec.ts) && now - rec.ts >= 0 && now - rec.ts < BOOT_HEAL_WINDOW_MS;
  const prev = recent ? rec.stage : null;
  const next = prev == null ? 'reload' : (prev === 'reload' ? 'clear' : 'manual');
  if (next !== 'manual') {
    try { ss.setItem(BOOT_HEAL_KEY, JSON.stringify({ ts: now, stage: next })); } catch (_) { /* ignore */ }
  }
  return next;
}

// The quiet auto-heal screen: no buttons, no ask — just says it's refreshing.
export function bootHealingHtml() {
  return [
    '<div role="status" aria-live="polite" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;',
    'font-family:Georgia,\'Times New Roman\',serif;background:#FAF8F4;color:#1A1815;text-align:center;">',
    '<div style="max-width:26rem;">',
    '<div style="font-size:0.625rem;letter-spacing:0.25em;text-transform:uppercase;color:#B85838;font-weight:600;margin-bottom:0.75rem;">PoeTech</div>',
    '<h1 style="font-size:1.25rem;margin:0 0 0.5rem;font-weight:600;">Getting the latest version&hellip;</h1>',
    '<p style="font-size:0.9375rem;line-height:1.5;color:#5A5751;margin:0;">',
    'A new version just went out. Refreshing automatically &mdash; no tap needed.</p>',
    '</div></div>',
  ].join('');
}

export function bootFallbackHtml() {
  // Inline styles only — a failed CSS chunk must not blank this too.
  return [
    '<div role="alert" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;',
    'font-family:Georgia,\'Times New Roman\',serif;background:#FAF8F4;color:#1A1815;text-align:center;">',
    '<div style="max-width:26rem;">',
    '<div style="font-size:0.625rem;letter-spacing:0.25em;text-transform:uppercase;color:#B85838;font-weight:600;margin-bottom:0.75rem;">PoeTech</div>',
    '<h1 style="font-size:1.25rem;margin:0 0 0.5rem;font-weight:600;">Almost there — one more tap</h1>',
    '<p style="font-size:0.9375rem;line-height:1.5;color:#5A5751;margin:0 0 1.25rem;">',
    'We refreshed automatically and your device is still holding the old version. One tap finishes it.</p>',
    '<button data-boot-reload type="button" style="display:block;width:100%;padding:0.75rem 1rem;margin:0 0 0.625rem;',
    'background:#1A1815;color:#fff;border:none;font:inherit;font-weight:600;font-size:0.875rem;cursor:pointer;">Reload</button>',
    '<button data-boot-clear type="button" style="display:block;width:100%;padding:0.625rem 1rem;',
    'background:transparent;color:#B85838;border:1px solid #C9BFA8;font:inherit;font-size:0.8125rem;cursor:pointer;">Still stuck? Clear cache &amp; reload</button>',
    '</div></div>',
  ].join('');
}

// The nuclear cache-bust: drop the service worker + all caches so the next load
// cannot re-serve the stale shell. Fail-soft; always resolves.
export async function clearAppCaches(nav, cachesApi) {
  const navigator_ = nav || (typeof navigator !== 'undefined' ? navigator : null);
  const caches_ = cachesApi || (typeof caches !== 'undefined' ? caches : null);
  try {
    if (navigator_ && navigator_.serviceWorker && navigator_.serviceWorker.getRegistrations) {
      const regs = await navigator_.serviceWorker.getRegistrations();
      await Promise.all((regs || []).map((r) => { try { return r.unregister(); } catch (_) { return null; } }));
    }
  } catch (_) { /* ignore */ }
  try {
    if (caches_ && caches_.keys) {
      const keys = await caches_.keys();
      await Promise.all((keys || []).map((k) => { try { return caches_.delete(k); } catch (_) { return null; } }));
    }
  } catch (_) { /* ignore */ }
}

// On a boot failure: run the self-heal ladder. Rungs 1–2 render the quiet
// "refreshing automatically" screen and recover WITHOUT a tap (reload, then
// clear+reload); rung 3 renders the manual retry screen. Null-safe; every
// side-effect (now/reload/clear/win/delayMs) is injectable for tests. Returns
// true when a screen was shown (auto or manual).
export function showBootFallback(rootEl, opts = {}) {
  const el = rootEl || (typeof document !== 'undefined' ? document.getElementById('root') : null);
  if (!el) return false;
  const reload = opts.reload || (() => { try { if (typeof location !== 'undefined') location.reload(); } catch (_) { /* ignore */ } });
  const clear = opts.clear || (() => clearAppCaches());
  const win = opts.win !== undefined ? opts.win : (typeof window !== 'undefined' ? window : null);
  const now = typeof opts.now === 'function' ? opts.now() : Date.now();
  const stage = decideBootHeal(win, now);

  if (stage === 'reload' || stage === 'clear') {
    try { el.innerHTML = bootHealingHtml(); } catch (_) { return false; }
    // A short beat so the screen paints (and a rapid-fire deploy settles) before
    // the recovery runs; injectable so tests run at 0ms.
    const delayMs = Number.isFinite(opts.delayMs) ? opts.delayMs : 800;
    const go = () => {
      if (stage === 'clear') Promise.resolve(clear()).then(reload).catch(reload);
      else reload();
    };
    try { setTimeout(go, delayMs); } catch (_) { go(); }
    return true;
  }

  try { el.innerHTML = bootFallbackHtml(); } catch (_) { return false; }
  try {
    const r = el.querySelector && el.querySelector('[data-boot-reload]');
    const c = el.querySelector && el.querySelector('[data-boot-clear]');
    if (r && r.addEventListener) r.addEventListener('click', () => reload());
    if (c && c.addEventListener) c.addEventListener('click', () => { Promise.resolve(clear()).then(reload).catch(reload); });
  } catch (_) { /* the screen still shows even if wiring a button failed */ }
  return true;
}
