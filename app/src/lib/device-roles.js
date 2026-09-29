// =============================================================================
// device-roles — each device its job, and the app knows which device it is on
// =============================================================================
// Darrell 2026-09-29: "Laptop for creating... we need to be able to use the
// devices appropriately" (DR-0678).
//
// He records lessons on his phone, reads and listens on the Firestick, and the
// laptop is where a lesson is written, compared across the writers that drafted
// it, merged and published. The roles are DATA (infra/device-availability/
// device-roles.json, pointed to by pipeline-nodes.json); this module is the pure
// part that turns what the browser MEASURES into a device class, and a class
// into an order.
//
// HOW THE CLASS IS DECIDED — measured first, the user agent only for the TV:
//
//   tv      the ONE TV test the app already has (device-link isTvClass, which
//           reads lib/tv-device's AFT… Fire TV list, Silk without touch, or a
//           large screen with no touch and no fine pointer). A Fire TV draws at
//           960x540, so width alone can never find it (DR-0657).
//   laptop  a wide viewport (>= 1024 CSS px) AND a fine pointer (a mouse or a
//           trackpad) — both measured by the browser, never guessed from the
//           user agent. A touchscreen Windows laptop still has its trackpad.
//   phone   narrower than 600px, or a coarse-only pointer on a short side under
//           500px (a phone held sideways is still a phone).
//   tablet  everything between: a folded-open phone, a tablet.
//
// THE NEVER-BLOCKED RULE. A class decides what comes FIRST and how it is laid
// out. It never removes, hides or locks anything: `orderPanels` returns EVERY
// panel for EVERY class, and nothing in the surface registry reads the class.
// A wrong guess therefore costs a scroll, never a door. Role gates (Governor,
// family) are a separate thing and stay exactly where they were.
//
// PURE (no React, no DOM beyond the explicit *FromWindow readers, which never
// throw) so the tests can prove the derivations.
// =============================================================================
import ROLES from '../../../infra/device-availability/device-roles.json';
import { isTvClass } from './device-link.js';
import { isTvDocument } from './tv-device.js';

export { ROLES };

/** The classes a browser can be. NAS and towers are infrastructure, not clients. */
export const CLIENT_CLASSES = Object.freeze(['phone', 'tablet', 'laptop', 'tv']);
/** The panels of the Create station, in no particular order. */
export const PANEL_KEYS = Object.freeze(Object.keys(ROLES.panels || {}));

export const LAPTOP_MIN_WIDTH = 1024;
export const PHONE_MAX_WIDTH = 600;
export const PHONE_MAX_SHORT_SIDE = 500;

/**
 * Derive the device class from measured signals.
 *   width, height     : CSS px of the viewport
 *   anyFinePointer    : matchMedia('(any-pointer: fine)') — a mouse or trackpad;
 *                       null when the browser cannot say
 *   maxTouchPoints    : navigator.maxTouchPoints
 *   userAgent         : used ONLY to recognise a TV (the existing TV list)
 *   tvDocument        : the document is already marked data-device="tv"
 */
export function deviceClassOf({
  width = 0, height = 0, anyFinePointer = null, maxTouchPoints = 0, userAgent = '', tvDocument = false,
} = {}) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  // anyFinePointer is true, false, or null (the browser could not say). Unknown
  // is neither: it never makes a TV (device-link's own default) and never makes
  // a laptop. Each test below asks only the question it can answer.
  if (tvDocument || isTvClass({ userAgent, maxTouchPoints, width: w, anyFinePointer: anyFinePointer !== false })) return 'tv';
  if (w >= LAPTOP_MIN_WIDTH && anyFinePointer === true) return 'laptop';
  if (w > 0 && w < PHONE_MAX_WIDTH) return 'phone';
  const shortSide = h > 0 ? Math.min(w, h) : w;
  if (anyFinePointer === false && shortSide > 0 && shortSide < PHONE_MAX_SHORT_SIDE) return 'phone';
  // Nothing measured at all (SSR, a test without a window): the smallest and
  // most common screen, so nothing is laid out wider than it can hold.
  if (w <= 0) return 'phone';
  return 'tablet';
}

/** Read the live browser into deviceClassOf's shape. Never throws. */
export function deviceClassFromWindow(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    if (!w) return 'phone';
    const nav = w.navigator || {};
    // Unknown stays unknown (null): a browser that cannot answer the media
    // query is neither promoted to the laptop layout nor mistaken for a TV.
    let anyFinePointer = null;
    try {
      if (typeof w.matchMedia === 'function') anyFinePointer = !!w.matchMedia('(any-pointer: fine)').matches;
    } catch { /* keep unknown */ }
    return deviceClassOf({
      width: w.innerWidth,
      height: w.innerHeight,
      anyFinePointer,
      maxTouchPoints: nav.maxTouchPoints,
      userAgent: nav.userAgent,
      tvDocument: isTvDocument(w.document),
    });
  } catch {
    return 'phone';
  }
}

/** The role record for a class (falls back to phone, the safest layout). */
export function roleFor(cls) {
  const c = ROLES.classes || {};
  return c[cls] || c.phone;
}

/**
 * The station's panels in the order this class wants them. EVERY panel is
 * returned, every time: the role's `first` list leads, and anything it does not
 * name follows in the registry's own order. A class can never drop a panel.
 */
export function orderPanels(cls, panels = PANEL_KEYS, roles = ROLES) {
  const all = Array.isArray(panels) ? panels.filter((p) => typeof p === 'string') : [];
  const role = (roles && roles.classes && roles.classes[cls]) || (roles && roles.classes && roles.classes.phone) || {};
  const first = Array.isArray(role.first) ? role.first : [];
  const out = [];
  for (const p of first) if (all.includes(p) && !out.includes(p)) out.push(p);
  for (const p of all) if (!out.includes(p)) out.push(p);
  return out;
}

/** Which device class a pipeline node's `role` belongs to, or null (unconfirmed). */
export function classOfNodeRole(nodeRole, roles = ROLES) {
  const classes = (roles && roles.classes) || {};
  for (const [cls, r] of Object.entries(classes)) {
    if (Array.isArray(r.node_roles) && r.node_roles.includes(nodeRole)) return cls;
  }
  return null;
}

// Keys a role record may carry. Anything that could gate ("blocked", "hidden",
// "requires", "deny") is refused by the validator: roles order, they never lock.
const ROLE_KEYS = new Set(['label', 'kind', 'jobs', 'why', 'first', 'surfaces', 'node_roles']);

/**
 * Validate a roles document against the app's real views and the station's
 * panels. Returns a list of plain-language errors ([] = sound). Used by the
 * test on the real file and on deliberately broken copies (proven-to-catch).
 */
export function validateRoles(doc, { views = [], panels = null } = {}) {
  const errs = [];
  const classes = doc && doc.classes;
  if (!classes || typeof classes !== 'object') return ['no classes'];
  const panelKeys = panels || Object.keys((doc && doc.panels) || {});
  for (const need of [...CLIENT_CLASSES, 'nas', 'tower']) {
    if (!classes[need]) errs.push(`class "${need}" has no role`);
  }
  for (const [cls, r] of Object.entries(classes)) {
    for (const k of Object.keys(r || {})) if (!ROLE_KEYS.has(k)) errs.push(`${cls}: "${k}" is not a role field (roles order what comes first; they never block)`);
    if (!r || typeof r.why !== 'string' || r.why.trim().length < 20) errs.push(`${cls}: says no real why`);
    if (!Array.isArray(r.jobs) || !r.jobs.length) errs.push(`${cls}: names no jobs`);
    if (!Array.isArray(r.surfaces) || !r.surfaces.length) errs.push(`${cls}: names no surfaces it is best for`);
    for (const s of r.surfaces || []) {
      if (!s || !views.includes(s.view)) errs.push(`${cls}: surface view "${s && s.view}" is not a real app view`);
      if (!s || typeof s.why !== 'string' || !s.why.trim()) errs.push(`${cls}: surface "${s && s.view}" has no why`);
    }
    if (r.kind === 'app-client') {
      const first = Array.isArray(r.first) ? r.first : [];
      for (const p of first) if (!panelKeys.includes(p)) errs.push(`${cls}: first names "${p}", which is not a station panel`);
      for (const p of panelKeys) if (!first.includes(p)) errs.push(`${cls}: first leaves out "${p}" (every panel is ordered for every device)`);
    } else if (r.kind === 'infrastructure') {
      if (!Array.isArray(r.node_roles) || !r.node_roles.length) errs.push(`${cls}: infrastructure with no node_roles`);
    } else {
      errs.push(`${cls}: kind must be app-client or infrastructure`);
    }
  }
  return errs;
}

/** The job line a person reads: "Laptop or desktop: create, edit, compare…". */
export function roleLine(cls) {
  const r = roleFor(cls);
  return `${r.label}: ${(r.jobs || []).join(', ')}`;
}

// ── keyboard shortcuts (the laptop's) ──────────────────────────────────────
// Alt+1..9 jumps to the Nth panel in the current order; Alt+0 returns to the
// top. Alt keeps every plain key free for typing a lesson, and it is offered on
// every class (a Bluetooth keyboard on a tablet works too); only the laptop
// SHOWS the legend, because that is where a keyboard is certain.
export function shortcutTarget(e, order) {
  if (!e || !e.altKey || e.ctrlKey || e.metaKey) return null;
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(String(e.code || '')) || /^([0-9])$/.exec(String(e.key || ''));
  if (!m) return null;
  const n = Number(m[1]);
  if (n === 0) return 'top';
  const list = Array.isArray(order) ? order : [];
  return list[n - 1] || null;
}

// ── handoff ────────────────────────────────────────────────────────────────
/**
 * A link that opens the Create station on another device at one panel. The
 * work itself needs no transfer: the laptop signed in as the same person reads
 * the same rows (RLS), so the link carries only WHERE to open, never who.
 */
export function handoffUrl({ origin = '', base = '', panel = 'your-lessons' } = {}) {
  const p = PANEL_KEYS.includes(panel) ? panel : 'your-lessons';
  const root = `${String(origin || '').replace(/\/+$/, '')}${String(base || '').replace(/\/+$/, '')}`;
  return `${root}/?view=create&panel=${encodeURIComponent(p)}`;
}

/** The panel a ?panel= link asks for, or '' when absent or not a panel. */
export function panelFromSearch(search) {
  try {
    const v = new URLSearchParams(String(search || '')).get('panel') || '';
    return PANEL_KEYS.includes(v) ? v : '';
  } catch { return ''; }
}

/** Where a handoff from this class is best sent. */
export function handoffTarget(cls) {
  if (cls === 'laptop') return 'phone';
  return 'laptop';
}

/**
 * Mark the document with its class (`<html data-device-class="laptop">`) so
 * CSS and the layout probe read the same answer the station does. Returns the
 * class. Never throws.
 */
export function markDeviceClass(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    if (!w || !w.document || !w.document.documentElement) return 'phone';
    const cls = deviceClassFromWindow(w);
    w.document.documentElement.setAttribute('data-device-class', cls);
    return cls;
  } catch { return 'phone'; }
}
