// On-demand Leaflet loader.
//
// Leaflet powers ONE surface — the Rentals property map. It used to load
// render-blocking from unpkg in <head> on EVERY cold load (a third-party DNS +
// TCP + TLS handshake plus a blocking external stylesheet, paid by users who
// never open Rentals — including the congregation on the lean conference pages).
// This loads it lazily instead: the CSS + JS are injected only when the map
// surface actually mounts, then `window.L` becomes available exactly as before,
// so the existing `window.L` null-guards keep working unchanged.
//
// Idempotent: concurrent or repeat callers share one in-flight load and resolve
// to the same `window.L`.

const LEAFLET_VERSION = '1.9.4';
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

let loadPromise = null;

export function loadLeaflet() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  if (window.L) return Promise.resolve(window.L);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Stylesheet — no longer render-blocking; requested only now, on map mount.
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_URL;
      link.crossOrigin = '';
      link.setAttribute('data-leaflet', '');
      document.head.appendChild(link);
    }

    // Script — resolve when the global `L` is ready. Reuse an in-flight tag if a
    // prior call already started one.
    const existing = document.querySelector('script[data-leaflet]');
    if (existing) {
      if (window.L) { resolve(window.L); return; }
      existing.addEventListener('load', () => resolve(window.L || null));
      existing.addEventListener('error', () => { loadPromise = null; reject(new Error('Leaflet failed to load')); });
      return;
    }

    const script = document.createElement('script');
    script.src = JS_URL;
    script.crossOrigin = '';
    script.async = true;
    script.setAttribute('data-leaflet', '');
    script.onload = () => resolve(window.L || null);
    script.onerror = () => { loadPromise = null; reject(new Error('Leaflet failed to load')); };
    document.head.appendChild(script);
  });

  return loadPromise;
}
