// =============================================================================
// boot-fallback — the front door NEVER shows a blank white page
// =============================================================================
// Root-caused 2026-07-04: poetech.us/?view=tvtime rendered pure white. Cause: the
// main app is a dynamic import in main.jsx (`import('./poe-financial-mvp-v28.jsx')`)
// with NO .catch. On a skewed/partial deploy (the Vercel rate-limit left a shell
// whose chunk hashes the CDN no longer serves), that import rejects; the chunk-heal
// reloads once, but if it GIVES UP (loop guard) React never mounts — so there is no
// ErrorBoundary and no UI at all. A new signer-up tapping the link sees nothing and
// leaves. First impression is everything (EXCELLENCE-STANDARD).
//
// This renders a friendly retry screen instead — in PLAIN DOM (no React, no lazy
// chunks, inline styles) so it works even when the bundle/CSS chunk is the thing
// that failed. "Reload" pulls the current shell; "Clear cache & reload" unregisters
// the service worker + drops the caches (the real cure when a stale SW keeps
// re-serving the broken shell), then reloads clean.
//
// Pure HTML builder is exported for a node test; the wiring is null-safe.

export function bootFallbackHtml() {
  // Inline styles only — a failed CSS chunk must not blank this too.
  return [
    '<div role="alert" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;',
    'font-family:Georgia,\'Times New Roman\',serif;background:#FAF8F4;color:#1A1815;text-align:center;">',
    '<div style="max-width:26rem;">',
    '<div style="font-size:0.625rem;letter-spacing:0.25em;text-transform:uppercase;color:#B85838;font-weight:600;margin-bottom:0.75rem;">PoeTech</div>',
    '<h1 style="font-size:1.25rem;margin:0 0 0.5rem;font-weight:600;">Almost there — one more tap</h1>',
    '<p style="font-size:0.9375rem;line-height:1.5;color:#5A5751;margin:0 0 1.25rem;">',
    'A new version just went out and your device is still holding the old one. Reload to pick it up.</p>',
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

// Render the fallback into the root element and wire its buttons. Null-safe; the
// reload/clear side-effects are injectable for tests. Returns true when shown.
export function showBootFallback(rootEl, opts = {}) {
  const el = rootEl || (typeof document !== 'undefined' ? document.getElementById('root') : null);
  if (!el) return false;
  const reload = opts.reload || (() => { try { if (typeof location !== 'undefined') location.reload(); } catch (_) { /* ignore */ } });
  const clear = opts.clear || (() => clearAppCaches());
  try { el.innerHTML = bootFallbackHtml(); } catch (_) { return false; }
  try {
    const r = el.querySelector && el.querySelector('[data-boot-reload]');
    const c = el.querySelector && el.querySelector('[data-boot-clear]');
    if (r && r.addEventListener) r.addEventListener('click', () => reload());
    if (c && c.addEventListener) c.addEventListener('click', () => { Promise.resolve(clear()).then(reload).catch(reload); });
  } catch (_) { /* the screen still shows even if wiring a button failed */ }
  return true;
}
