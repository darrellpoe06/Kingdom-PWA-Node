// =============================================================================
// openers — the garage door, and any other opener, reachable from the header
// =============================================================================
// Darrell 2026-10-08: "Let's add the garage door opener and any system opener
// to the header in PoeTech App... so if your listening to you lesson as you
// drive when you get home the garage door opener button is there for easy
// access... make sense?"
//
// REALITY-TRACE FIRST (DR-0061), because this surface presses a physical
// actuator on his house and a painted button here would be worse than none.
//
//   1. REAL DATA. The openers a household owns are rows in `household_openers`
//      (migration 0254), and every press is a row in `opener_presses`. There
//      is no hardcoded list and no demo opener. Before this file existed the
//      repo had NO opener integration at all: a search for garage / myq /
//      homekit / home-assistant across app/, infra/ and scripts/ returned only
//      lesson prose and the properties room list. So the device layer is new,
//      and this module is honest about not knowing the hardware yet.
//   2. END TO END. The press leaves the browser on the same-origin sovereign
//      route /openers/press (app/functions/openers/[[path]].js over the one
//      funnel-proxy factory) and lands on the NAS, which owns the only code
//      that touches a relay. The cloud never talks to the device.
//   3. THE SURFACE HE USES. The header row, beside the chevron
//      (components/TopNavRow.jsx), because he asked for it where his thumb
//      already is when a lesson is playing in the car.
//   4. STATED ASSUMPTION, so a wrong one is cheap. Which opener hardware the
//      house actually has is a value only Darrell holds. So the device layer
//      is an ADAPTER named by the row's `kind`, the NAS service ships
//      DISABLED, and the header control does not render at all until a real
//      row exists. Nothing is drawn for a device nobody registered.
//
// WHY HOLD-TO-OPEN AND NOT A TAP. A one-tap garage button living in a global
// header, on a phone in a pocket, will open his house by accident. That is not
// a hypothetical; it is what a header button is for. So a press is a HOLD
// (HOLD_MS), the control shows the hold filling, and letting go early cancels
// with nothing sent. A single-flight COOLDOWN_MS then refuses a second press
// while the first is still in the air, because a door that gets two presses
// stops halfway.
//
// Pure: no DOM, no fetch, no React. Everything here is a function of its
// arguments and a clock, so the component can be measured rather than clicked.

/** How long the button must be held before anything is sent, in ms. */
export const HOLD_MS = 800;

/** Single-flight: a second press inside this window is refused, not queued. */
export const COOLDOWN_MS = 8000;

/** A press that never came back is reported as unknown after this, not as sent. */
export const PRESS_TIMEOUT_MS = 12000;

/** Which opener the header offers first, remembered per device. */
export const LAST_OPENER_KEY = 'poetech.openers.last.v1';

/** The kinds of device the NAS adapter knows how to drive. */
export const OPENER_KINDS = [
  { kind: 'relay-http', label: 'HTTP relay (Shelly, Tasmota, ESPHome)', needs: 'the relay’s address on the house network' },
  { kind: 'relay-gpio', label: 'A relay wired to the NAS or a Pi', needs: 'the GPIO pin the relay sits on' },
  { kind: 'mqtt', label: 'An MQTT device (a hub already on the network)', needs: 'the broker address and the topic' },
  { kind: 'webhook', label: 'A vendor webhook the house already has', needs: 'the URL to call, kept on the NAS' },
];

/** True when `kind` is one the adapter can actually drive. */
export function knownKind(kind) {
  return OPENER_KINDS.some((k) => k.kind === String(kind || ''));
}

/**
 * Normalize the rows the database returned into what the header needs.
 * A row missing a name, a kind the adapter does not know, or marked disabled
 * is dropped rather than drawn, because a button for a device we cannot drive
 * is the painted-number failure this module exists to avoid.
 */
export function openersFrom(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && r.id && typeof r.name === 'string' && r.name.trim() && r.enabled !== false && knownKind(r.kind))
    .map((r) => ({
      id: String(r.id),
      name: r.name.trim(),
      kind: String(r.kind),
      place: typeof r.place === 'string' ? r.place.trim() : '',
      // A door that reports its own position gets a state line; one that
      // cannot is NEVER shown as closed just because nothing said otherwise.
      reports: r.reports === true,
    }));
}

/** The opener the header should offer: the remembered one if it still exists. */
export function openerToOffer(openers, savedId) {
  const list = Array.isArray(openers) ? openers : [];
  if (!list.length) return null;
  const saved = list.find((o) => o.id === String(savedId || ''));
  return saved || list[0];
}

/** Remember which opener was last used, on this device only. Never throws. */
export function saveLastOpener(id, storage = null) {
  try {
    const s = storage || (typeof localStorage === 'undefined' ? null : localStorage);
    if (!s) return false;
    if (!id) { s.removeItem(LAST_OPENER_KEY); return true; }
    s.setItem(LAST_OPENER_KEY, String(id));
    return true;
  } catch { return false; }
}

/** Read the remembered opener. Returns '' when there is none or storage refuses. */
export function loadLastOpener(storage = null) {
  try {
    const s = storage || (typeof localStorage === 'undefined' ? null : localStorage);
    if (!s) return '';
    return s.getItem(LAST_OPENER_KEY) || '';
  } catch { return ''; }
}

/**
 * How far through the hold we are, 0..1. The component paints this, and a test
 * can assert it without touching a pointer event.
 */
export function holdProgress({ startedAt = 0, now = Date.now(), hold = HOLD_MS } = {}) {
  if (!startedAt) return 0;
  const span = Number(hold) > 0 ? Number(hold) : HOLD_MS;
  const gone = Number(now) - Number(startedAt);
  if (!Number.isFinite(gone) || gone <= 0) return 0;
  return Math.min(1, gone / span);
}

/** True once the hold has been held long enough to send. */
export function holdComplete(args) {
  return holdProgress(args) >= 1;
}

/**
 * May we send a press right now? Single-flight by the clock, so a double tap
 * or a second person in the car cannot stack two presses on one door.
 * Returns { ok } or { ok: false, why } with a sentence a person can read.
 */
export function pressAllowed({ opener = null, lastPressAt = 0, inFlight = false, online = true, now = Date.now(), cooldown = COOLDOWN_MS } = {}) {
  if (!opener || !opener.id) return { ok: false, why: 'No opener is registered for this house yet.' };
  if (!online) return { ok: false, why: 'This device is offline, so the press cannot reach the house.' };
  if (inFlight) return { ok: false, why: 'A press is already on its way. Waiting for the house to answer.' };
  const since = Number(now) - (Number(lastPressAt) || 0);
  if (Number(lastPressAt) && Number.isFinite(since) && since < cooldown) {
    const left = Math.ceil((cooldown - since) / 1000);
    return { ok: false, why: `Just pressed. Waiting ${left} more second${left === 1 ? '' : 's'} so the door is not stopped halfway.` };
  }
  return { ok: true };
}

/** The same-origin path a press goes to. Never the Funnel URL (DR-0083). */
export const PRESS_PATH = '/openers/press';

/** The body of a press. The cloud forwards it; only the NAS knows the device. */
export function pressBody(opener) {
  if (!opener || !opener.id) return null;
  return { opener: opener.id, kind: opener.kind, at: new Date().toISOString() };
}

/**
 * Read the NAS's answer honestly. THE IMPORTANT CASE: a press we sent and got
 * no clear answer to is 'unknown', never 'opened'. A header that claims a door
 * opened when nobody checked is the exact lie DR-0076 exists to stop.
 */
export function readPressResult(res) {
  if (!res || typeof res !== 'object') return { state: 'unknown', text: 'The house did not answer. Check the door yourself before you drive away.' };
  if (res.ok === true && res.pressed === true) {
    return res.confirmed === true
      ? { state: 'confirmed', text: 'Pressed, and the door reported that it moved.' }
      : { state: 'sent', text: 'Pressed. This opener does not report its position, so look before you drive away.' };
  }
  if (res.ok === false && typeof res.reason === 'string' && res.reason.trim()) {
    return { state: 'failed', text: res.reason.trim() };
  }
  return { state: 'unknown', text: 'The house did not answer. Check the door yourself before you drive away.' };
}

/**
 * What the control says about an opener before anybody presses it. A door that
 * cannot report its position says so rather than implying it is closed.
 */
export function describeOpener(opener) {
  if (!opener || !opener.id) return 'No opener registered';
  const where = opener.place ? `${opener.name} — ${opener.place}` : opener.name;
  return opener.reports ? where : `${where} (does not report its position)`;
}

/** A press older than the timeout is no longer in flight; it is unknown. */
export function stillInFlight({ sentAt = 0, now = Date.now(), timeout = PRESS_TIMEOUT_MS } = {}) {
  if (!sentAt) return false;
  const since = Number(now) - Number(sentAt);
  return Number.isFinite(since) && since >= 0 && since < timeout;
}
