// =============================================================================
// screen-capture — let the app take the picture, and always take the FACTS
// =============================================================================
// Darrell 2026-09-12: "we need a button that takes the screenshot for them
// and or allows them to get the tool to capture a section they choose..."
//
// THE PREMISE THAT DOES NOT HOLD, stated up front so nobody builds on it: a web
// page cannot screenshot itself. There is no such API.
//   * getDisplayMedia() is desktop-only — unsupported on Android Chrome and iOS
//     Safari, which is what the congregation uses. Dead on arrival here.
//   * A canvas library (html2canvas and friends) is a heavy dependency that
//     RE-RENDERS the DOM rather than capturing pixels, so it quietly disagrees
//     with what the person actually saw.
// What IS native is SVG <foreignObject> painted into a canvas: no dependency,
// real app chrome and text — and it CANNOT paint a cross-origin image without
// tainting the canvas, which throws on export.
//
// So this module does two things, and is honest about which is which:
//   1. captureRegion() — a real picture of a chosen area, when the browser
//      allows it, and a plain refusal when it does not.
//   2. captureContext() — the diagnostic facts, which never fail: route, tab,
//      viewport, app version, the last error. For all eight reports filed on
//      2026-09-11 these would have told us more than the photographs did.
//
// A capture that half-works and says nothing is worse than no button, so every
// path here returns a reason.
//
// Pure: no React, no network. The DOM is passed in so this is testable.
// =============================================================================

/** Why a capture could not happen, in words a person can read. */
export const CAPTURE_REFUSALS = Object.freeze({
  unsupported: 'This phone cannot let the app take its own picture. Use your phone’s screenshot, then attach it — everything else in this report still sends.',
  tainted: 'The area you picked contains an image the app is not allowed to copy. Pick an area without it, or use your phone’s screenshot.',
  empty: 'Nothing was selected. Drag a box around the part that is wrong.',
  failed: 'The picture could not be made. Your words and the details below still send.',
});

/**
 * Is a self-capture even possible here? Answered from real capabilities, never
 * from a user-agent string (which lies, and which we do not store anyway).
 */
export function captureSupported(win = (typeof window !== 'undefined' ? window : null)) {
  if (!win || !win.document) return false;
  if (typeof win.SVGElement === 'undefined') return false;
  const c = win.document.createElement('canvas');
  return typeof c.getContext === 'function' && !!c.getContext('2d');
}

/** A selection is only a selection if it has real area. */
export function normalizeRegion(a = {}, b = {}) {
  const x = Math.min(a.x ?? 0, b.x ?? 0);
  const y = Math.min(a.y ?? 0, b.y ?? 0);
  const w = Math.abs((b.x ?? 0) - (a.x ?? 0));
  const h = Math.abs((b.y ?? 0) - (a.y ?? 0));
  return { x, y, width: w, height: h, usable: w >= 24 && h >= 24 };
}

/**
 * THE FACTS. This never throws and never returns nothing — it is the half of
 * the feature that always works, and on a phone it is usually the half that
 * actually identifies the bug.
 */
export function captureContext({ win = (typeof window !== 'undefined' ? window : null), tab = '', appVersion = '', lastError = '', now = null } = {}) {
  const d = now instanceof Date ? now : new Date();
  const loc = win?.location || {};
  const scr = win?.screen || {};
  return {
    at: d.toISOString(),
    tab: String(tab || ''),
    route: `${loc.pathname || ''}${loc.hash || ''}`,
    viewport: win ? `${win.innerWidth || 0}×${win.innerHeight || 0}` : '',
    screen: (scr.width && scr.height) ? `${scr.width}×${scr.height}` : '',
    pixelRatio: win?.devicePixelRatio || 1,
    appVersion: String(appVersion || ''),
    online: win?.navigator ? win.navigator.onLine !== false : true,
    standalone: !!(win?.matchMedia && win.matchMedia('(display-mode: standalone)').matches),
    lastError: String(lastError || '').slice(0, 300),
  };
}

/** One line a human can read at the bottom of a report. */
export function contextLine(ctx = {}) {
  const bits = [
    ctx.tab && `tab ${ctx.tab}`,
    ctx.route && `at ${ctx.route}`,
    ctx.viewport && `screen ${ctx.viewport}`,
    ctx.appVersion && `app ${ctx.appVersion}`,
    ctx.standalone ? 'installed app' : 'in the browser',
    ctx.online === false && 'OFFLINE at the time',
    ctx.lastError && `last error: ${ctx.lastError}`,
  ].filter(Boolean);
  return bits.join(' · ');
}

/**
 * Paint a chosen region of the live page into a PNG data URL.
 * Resolves { ok:false, reason } rather than throwing — a refusal is an answer.
 */
export async function captureRegion(region, {
  win = (typeof window !== 'undefined' ? window : null),
  root = null,
} = {}) {
  if (!captureSupported(win)) return { ok: false, reason: 'unsupported', message: CAPTURE_REFUSALS.unsupported };
  if (!region || !region.usable) return { ok: false, reason: 'empty', message: CAPTURE_REFUSALS.empty };
  const doc = win.document;
  const node = root || doc.body;
  try {
    const clone = node.cloneNode(true);
    // The overlay itself must never appear in the picture of the problem.
    clone.querySelectorAll?.('[data-capture-chrome="true"]').forEach((n) => n.remove());
    const ratio = Math.min(win.devicePixelRatio || 1, 2);
    const w = Math.round(region.width);
    const h = Math.round(region.height);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`
      + `<foreignObject width="100%" height="100%">`
      + `<div xmlns="http://www.w3.org/1999/xhtml" style="transform:translate(${-Math.round(region.x)}px,${-Math.round(region.y)}px)">`
      + clone.outerHTML
      + `</div></foreignObject></svg>`;
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const img = new win.Image();
    const drawn = await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    if (!drawn) return { ok: false, reason: 'failed', message: CAPTURE_REFUSALS.failed };
    const canvas = doc.createElement('canvas');
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.drawImage(img, 0, 0);
    // toDataURL THROWS on a tainted canvas — a cross-origin image inside the
    // chosen area. That is the documented limit, caught and named.
    const dataUrl = canvas.toDataURL('image/png');
    return { ok: true, dataUrl, width: w, height: h };
  } catch (e) {
    const tainted = /tainted|insecure|SecurityError/i.test(e?.name || e?.message || '');
    const reason = tainted ? 'tainted' : 'failed';
    return { ok: false, reason, message: CAPTURE_REFUSALS[reason] };
  }
}
