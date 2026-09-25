// =============================================================================
// device-link — sign in to the TV from the phone already in your hand
// =============================================================================
// Darrell 2026-09-20: "I don't want to have to be fighting with the Fire Stick
// to then try to log in... I'd rather just be able to use a QR code to access
// the login quicker and faster."
//
// Typing an email and a password with a D-pad is miserable, and a Google OAuth
// popup on a TV browser is worse — it wants an account chooser, a password
// manager and often a second factor, none of which a remote is built for. So
// the television never authenticates anybody. It asks for permission, and the
// phone grants it. This is the device authorization grant (RFC 8628) in the
// shape this app already has parts for: Google popup sign-in and Royalty Link
// one-time codes both live on the phone side already.
//
//   TV   -> creates a link, shows a short CODE and a QR of /link?c=CODE
//   PHONE-> opens it, signs in as normal, approves
//   TV   -> polls with its own secret, receives a one-time token, becomes signed in
//
// TWO SECRETS, AND THE DIFFERENCE IS THE WHOLE SECURITY MODEL.
//
//   user_code   SHOWN on the television. Short, human-readable, and therefore
//               low entropy. It is a LOOKUP HANDLE, never an authority: it can
//               only ever address a pending request, and approving one needs a
//               signed-in human on the phone. Anyone reading the screen learns
//               nothing they could use elsewhere.
//   device_code NEVER shown. High-entropy, generated on the TV, held only by
//               the TV, and the sole thing that can collect the session. A
//               shoulder-surfer with a camera cannot obtain it, because it is
//               never rendered, printed or transmitted to the phone.
//
// That split is what stops the obvious attack: someone photographs the code on
// a screen in a church foyer and races to claim the session. They cannot —
// claiming requires the secret the TV kept.
//
// Everything here is pure. The table and the privileged endpoint are named in
// the migration beside this file; the invariants that keep the flow safe are
// decided here, where they can be tested exhaustively.
import { isTvUserAgent, isTvDocument } from './tv-device.js';

// No 0/O, 1/I/L, 2/Z, 5/S, 8/B. A code is read off a television across a room
// and typed on a phone; a character pair that looks alike at that distance is a
// support call, and worse, a person retyping until something works.
export const CODE_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';
export const USER_CODE_LEN = 8;
export const DEVICE_CODE_BYTES = 32;

/** Default life of a link. Long enough to walk to the sofa, short enough that an abandoned code on a screen stops mattering. */
export const LINK_TTL_MS = 10 * 60 * 1000;
/** How often the television asks. Gentle: a TV that polls hard is a TV that gets rate-limited. */
export const POLL_INTERVAL_MS = 3000;

const randomBytes = (n, crypto) => {
  const c = crypto || (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
  if (!c || typeof c.getRandomValues !== 'function') {
    // NEVER silently fall back to Math.random for a credential. A weak
    // device_code is the one failure that turns this whole flow into a
    // guessable session handover.
    throw new Error('device-link: no secure randomness available');
  }
  return c.getRandomValues(new Uint8Array(n));
};

/** The short code a person reads off the screen. */
export function newUserCode(crypto) {
  const bytes = randomBytes(USER_CODE_LEN, crypto);
  let out = '';
  for (let i = 0; i < USER_CODE_LEN; i += 1) {
    // Rejection-free modulo is fine here: the alphabet's length is small
    // relative to 256 and the residual bias is far below what matters for a
    // code that also expires in ten minutes and is rate-limited.
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Grouped for reading aloud and for typing: ABCD-EFGH. */
export function formatUserCode(code) {
  const c = String(code || '');
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

/**
 * What the person typed -> what we stored. Dashes and spaces go, case is
 * folded, and the lookalikes the alphabet excludes are mapped to what the
 * reader almost certainly meant. Without this a correct reading of the screen
 * still fails, which reads to the user as "the code does not work".
 */
// EVERY TARGET MUST BE A CHARACTER WE CAN ACTUALLY SHOW. The first version of
// this mapped S->5 and B->8, and neither 5 nor 8 is in the alphabet — so those
// entries were dead weight that read as handled while silently dropping the
// character. A map whose targets are unreachable is worse than no map: it
// looks like care. S and B are simply absent now, because a reader can never
// have seen a 5 or an 8 on the screen to mistype in the first place. The
// invariant is gated, so this cannot rot back.
export const LOOKALIKE = Object.freeze({ O: 'Q', '0': 'Q', I: 'J', L: 'J', '1': 'J', Z: '3', '2': '3' });
export function normalizeUserCode(input) {
  const raw = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let out = '';
  for (const ch of raw) {
    if (CODE_ALPHABET.includes(ch)) { out += ch; continue; }
    const mapped = LOOKALIKE[ch];
    // An unmappable character is DROPPED, never guessed at. Inventing a
    // character would silently address someone else's pending link.
    if (mapped && CODE_ALPHABET.includes(mapped)) out += mapped;
  }
  return out.slice(0, USER_CODE_LEN);
}

/** The secret the television keeps and never shows. */
export function newDeviceCode(crypto) {
  const bytes = randomBytes(DEVICE_CODE_BYTES, crypto);
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** Where the QR points. The phone opens this and does the signing in. */
export function qrTarget(origin, userCode) {
  const base = String(origin || '').replace(/\/+$/, '');
  return `${base}/link?c=${encodeURIComponent(formatUserCode(userCode))}`;
}

export const STATE = Object.freeze({
  PENDING: 'pending', APPROVED: 'approved', DENIED: 'denied',
  EXPIRED: 'expired', CONSUMED: 'consumed', UNKNOWN: 'unknown',
});

/**
 * The single place a row's meaning is decided, so no caller can disagree with
 * another about whether a link is still good.
 *
 * ORDER MATTERS AND IS DELIBERATE. Consumed is checked before approved, and
 * expiry before both: a row that has already handed over a session must never
 * read as approved again, and an approval that arrives after the deadline is
 * not an approval. Getting this order wrong is how a one-time code becomes a
 * reusable one.
 */
export function linkState(row, now = Date.now()) {
  if (!row || typeof row !== 'object') return STATE.UNKNOWN;
  if (row.consumed_at) return STATE.CONSUMED;
  const exp = row.expires_at ? Date.parse(row.expires_at) : NaN;
  if (Number.isFinite(exp) && now >= exp) return STATE.EXPIRED;
  if (row.denied_at) return STATE.DENIED;
  if (row.approved_at && row.user_id) return STATE.APPROVED;
  return STATE.PENDING;
}

/** Can this link still be approved by a person on their phone? */
export function isApprovable(row, now = Date.now()) {
  return linkState(row, now) === STATE.PENDING;
}

/** Should the television keep asking? */
export function shouldKeepPolling(state) {
  return state === STATE.PENDING;
}

/** A human sentence for each state — the TV is read from a sofa, not debugged. */
export function stateMessage(state) {
  switch (state) {
    case STATE.PENDING: return 'Waiting for you to approve this on your phone…';
    case STATE.APPROVED: return 'Approved — signing you in…';
    case STATE.DENIED: return 'That request was turned down. Start again when you are ready.';
    case STATE.EXPIRED: return 'This code has expired. Press the button for a fresh one.';
    case STATE.CONSUMED: return 'This code has already been used. Press the button for a fresh one.';
    default: return 'Something is not right with this code. Press the button for a fresh one.';
  }
}

// =============================================================================
// Wiring (2026-09-25, DR-0658). Darrell on the Fire TV, 02:30 UTC: "Hard to
// sign in on a Firestick... what happened to the qr code ways?" Everything
// above was written on 2026-09-20 and nothing in the app called it. What
// follows is the rest of the flow, still pure where it can be.
// =============================================================================

/** The only shape a device_code may have: 32 bytes as lowercase hex. */
export const DEVICE_CODE_RE = /^[0-9a-f]{64}$/;
/** A stored user_code: exactly eight characters of the alphabet. */
export const USER_CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${USER_CODE_LEN}}$`);

export function isDeviceCode(s) { return DEVICE_CODE_RE.test(String(s || '')); }
export function isUserCode(s) { return USER_CODE_RE.test(String(s || '')); }

/**
 * SHA-256 of the device_code, hex. The TV sends this hash to start and poll;
 * the privileged endpoint recomputes it from the raw code when the TV claims.
 * So a leaked database row (which holds only the hash) cannot claim anything:
 * the endpoint wants the preimage. The same function runs on the TV and in the
 * Pages Function, so the two can never disagree about what was stored.
 */
export async function hashDeviceCode(deviceCode, crypto) {
  const c = crypto || (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
  if (!c || !c.subtle || typeof c.subtle.digest !== 'function') {
    throw new Error('device-link: no SubtleCrypto available');
  }
  const bytes = new TextEncoder().encode(String(deviceCode));
  const digest = new Uint8Array(await c.subtle.digest('SHA-256', bytes));
  let s = '';
  for (const b of digest) s += b.toString(16).padStart(2, '0');
  return s;
}

/**
 * Is this a television? This decides only which sign-in door is shown FIRST;
 * every door stays available on every device, so a wrong guess costs one press.
 *
 *   - the user agent names a TV (lib/tv-device.js, the ONE list the app uses
 *     for this: its AFT… Fire TV model check, DR-0657 Firestick sweep), or
 *   - Silk with no touch points (a Fire TV, not a Fire tablet, which runs
 *     Silk too but has a touchscreen), or
 *   - a large screen with no touch and no fine pointer (a TV browser that
 *     hides its name: nothing to tap, nothing to click, only a remote).
 */
export function isTvClass({ userAgent = '', maxTouchPoints = 0, width = 0, anyFinePointer = true } = {}) {
  const ua = String(userAgent || '');
  if (isTvUserAgent(ua)) return true;
  const touch = Number(maxTouchPoints) > 0;
  if (/\bSilk\b/i.test(ua) && !touch) return true;
  if (!touch && !anyFinePointer && Number(width) >= 900) return true;
  return false;
}

/** Read the browser into isTvClass's shape. Never throws. */
export function tvClassFromWindow(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    if (!w) return false;
    if (isTvDocument(w.document)) return true;
    const nav = w.navigator || {};
    // Unknown is NOT "no pointer": a browser that cannot answer the media
    // query keeps the default, so only a real "no fine pointer" counts.
    let anyFinePointer = true;
    try {
      if (typeof w.matchMedia === 'function') anyFinePointer = !!w.matchMedia('(any-pointer: fine)').matches;
    } catch { /* keep default */ }
    return isTvClass({
      userAgent: nav.userAgent,
      maxTouchPoints: nav.maxTouchPoints,
      width: w.innerWidth,
      anyFinePointer,
    });
  } catch {
    return false;
  }
}

/**
 * What the phone is shown so a person can tell their own living room from a
 * stranger's request. Displayed only, never trusted.
 */
export function deviceLabel(userAgent) {
  const ua = String(userAgent || '');
  if (/\bAFT[A-Z0-9]{1,8}\b/.test(ua) || (/\bSilk\b/i.test(ua) && !/\bKF[A-Z]{2,}\b/.test(ua))) return 'Fire TV';
  if (/Android TV|GoogleTV|Google TV|\bCrKey\b/i.test(ua)) return 'Android TV';
  if (/\bTizen\b|SMART-TV|SmartTV/i.test(ua)) return 'Samsung TV';
  if (/Web0S|webOS/i.test(ua)) return 'LG TV';
  if (/\bRoku\b/i.test(ua)) return 'Roku';
  if (/iPad|Android/i.test(ua)) return 'a tablet';
  if (/Macintosh|Windows|X11|CrOS/i.test(ua)) return 'a computer';
  return 'a screen';
}

/** "just now", "2 minutes ago", for the approval card. */
export function askedAgo(createdAt, now = Date.now()) {
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return '';
  const mins = Math.floor(Math.max(0, now - t) / 60000);
  if (mins < 1) return 'just now';
  return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
}

/** The redirect-fallback stash: Google's full-page redirect drops ?link=. */
export const LINK_STASH_KEY = 'pt-device-link';
export function stashLinkCode(storage, code, now = Date.now()) {
  try { if (storage && isUserCode(code)) storage.setItem(LINK_STASH_KEY, JSON.stringify({ code, at: now })); } catch { /* storage blocked */ }
}
export function readLinkStash(storage, now = Date.now()) {
  try {
    const raw = storage && storage.getItem(LINK_STASH_KEY);
    if (!raw) return '';
    const { code, at } = JSON.parse(raw);
    // A stash older than a link's whole life can only point at a dead code.
    if (!isUserCode(code) || !(now - at < LINK_TTL_MS)) { storage.removeItem(LINK_STASH_KEY); return ''; }
    return code;
  } catch { return ''; }
}
export function clearLinkStash(storage) {
  try { if (storage) storage.removeItem(LINK_STASH_KEY); } catch { /* storage blocked */ }
}
