// =============================================================================
// sanitize-input — shared input hardening for the PUBLIC, anonymous forms
// =============================================================================
// The conference registration (?register=1) and the app-interest ("get the app")
// forms are OPEN and ANONYMOUS — anyone on the internet may submit. That makes
// them the #1 attack surface ahead of the July conference (500+ community). This
// module is the ONE place the field caps + cleaning rules live, so both forms
// (and any future public form) harden identically.
//
// WHAT THIS DEFENDS (and what it deliberately does NOT claim to):
//   - XSS: the REAL render-time defense is React, which escapes every interpolated
//     value by default (no dangerouslySetInnerHTML anywhere — audited). This module
//     adds DEFENSE-IN-DEPTH at the DATA layer: it strips HTML tag structure and
//     control/invisible/bidi characters so a stored value carries no live markup
//     even if some future surface renders it less carefully (or it is exported to a
//     spreadsheet / chat / email that does NOT escape). It is belt-and-suspenders,
//     not the primary control.
//   - Payload-bloat DoS: every field is hard-capped in length. NOTE: client cleaning
//     is UX + hygiene only — a determined attacker bypasses the form and POSTs
//     straight to PostgREST with the bundled anon key. The ENFORCEABLE server-side
//     cap is the matching CHECK constraint in migration 0033 (DR-0076: the gate that
//     actually fails the write, not the claim that the client trimmed it).
//   - Log / CSV / spoofing injection: control chars, zero-width and bidi-override
//     characters (which can hide or reverse text) are removed.
//
// PURE + dependency-free (sovereign — no DOMPurify needed since there is no rich
// text / no raw HTML render path). Locked by sanitize-input.test.js, including
// proven-to-catch cases (DR-0060): the cleaner is shown to actually neutralize each
// hostile shape, so a green test means something.
// =============================================================================

// Per-field length caps (characters). These MIRROR the CHECK constraints in
// infra/supabase/migrations-auto/0033-public-form-input-hardening.sql. If you change
// a cap here, change it there too (public-form-caps-guard.test.js proves they agree).
export const FIELD_CAPS = {
  name: 120,
  email: 254,            // RFC 5321 maximum address length
  phone: 40,
  dietary: 500,
  days: 200,
  conferenceName: 200,
  source: 60,
  issue: 2000,           // app-interest free-text (multiline)
  platform: 20,
  userAgent: 1000,
  referrer: 1000,
  signedInEmail: 254,
};

// Characters that are never legitimate in these fields and are removed. Built from
// explicit code-point escapes (never literal control bytes, which corrupt in transit
// and break source tooling):
//   - C0 controls 0x00-0x1F EXCEPT tab(09)/newline(0A)/carriage-return(0D), and
//     DEL 0x7F, and C1 controls 0x80-0x9F. (tab/nl/cr are handled by the whitespace
//     normalization below, per single- vs multi-line.)
//   - Zero-width + BOM: 200B 200C 200D FEFF (used to smuggle / obfuscate text).
//   - Bidi overrides: 202A-202E, 2066-2069 (Trojan-Source style text reversal).
const CONTROL_AND_INVISIBLE = new RegExp(
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F' +
  '\\u200B-\\u200D\\uFEFF' +
  '\\u202A-\\u202E\\u2066-\\u2069]',
  'g',
);

// HTML tag structure (an opening/closing tag with a letter tag-name) and HTML
// comments. A lone "<" or ">" (e.g. "weighs < 200 lbs", "a -> b") is preserved so
// legitimate input is never mangled — only actual tags like <script>, <img onerror>
// are stripped. React would escape these anyway; this keeps the STORED value inert
// for any non-escaping consumer too.
const HTML_TAG = /<\/?[a-zA-Z][^>]*>/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

/**
 * Strip control, invisible, and bidi-override characters.
 * @param {string} s
 * @returns {string}
 */
export function stripControlChars(s) {
  return String(s ?? '').replace(CONTROL_AND_INVISIBLE, '');
}

/**
 * Strip HTML tag structure + comments (defense-in-depth; React escaping is the
 * primary render defense). Preserves lone < / > so legitimate text survives.
 * Runs repeatedly so nested / overlapping tags ("<<script>>") fully collapse.
 * @param {string} s
 * @returns {string}
 */
export function stripHtml(s) {
  let out = String(s ?? '').replace(HTML_COMMENT, '');
  let prev;
  do {
    prev = out;
    out = out.replace(HTML_TAG, '');
  } while (out !== prev);
  return out;
}

/**
 * Clean a single user field: strip HTML tags + control/invisible chars, normalize
 * whitespace, trim, and hard-cap length. Returns a clean string ('' if empty/nullish).
 *
 * @param {*} v                         raw value (coerced to string)
 * @param {number} max                  max length (chars) — defaults to a safe 500
 * @param {{multiline?: boolean}} opts  multiline keeps newlines (for textareas)
 * @returns {string}
 */
export function cleanField(v, max = 500, { multiline = false } = {}) {
  let s = stripControlChars(v);
  s = stripHtml(s);
  if (multiline) {
    // Normalize newlines, collapse runs of spaces/tabs within a line, and cap
    // consecutive blank lines so a "flood the textarea" payload can't balloon.
    s = s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    s = s.split('\n').map((line) => line.trim()).join('\n').trim();
  } else {
    s = s.replace(/\s+/g, ' ').trim();
  }
  // Only truncate when a FINITE positive cap is given. Passing Infinity (as
  // fieldsOverCap does) measures the true length without truncating.
  if (Number.isFinite(max) && max > 0 && s.length > max) s = s.slice(0, max);
  return s;
}

// -----------------------------------------------------------------------------
// Invisible anti-bot rule (NO CAPTCHA — Darrell's constraint: protections must be
// invisible + frictionless for non-technical / elderly congregants). Two signals,
// both invisible to a human:
//   - honeypot: an off-screen field a human never sees but a dumb bot fills.
//   - timing: a submit faster than a human could possibly read + type is scripted.
// A determined attacker bypasses both (they don't run our JS) — that is what the
// server-side DB caps + RLS are for; this just stops the cheap, high-volume floods
// without putting a single hurdle in front of a real person. Tuned LOW so it never
// catches a fast church leader registering a second guest.
// -----------------------------------------------------------------------------
export const MIN_FILL_MS = 1200;

/**
 * Should this submission be silently swallowed (treated as a fake success so a bot
 * gets no signal to tune against)?
 * @param {{honeypot?: string, elapsedMs?: number, minFillMs?: number}} sig
 * @returns {boolean}
 */
export function looksLikeBot({ honeypot = '', elapsedMs = Infinity, minFillMs = MIN_FILL_MS } = {}) {
  if (honeypot) return true;                 // hidden field filled -> bot
  if (elapsedMs < minFillMs) return true;    // submitted impossibly fast -> bot
  return false;
}

/**
 * Given a map of {field: rawValue} and a map of {field: cap}, return the list of
 * fields whose cleaned value EXCEEDS its cap (so the form can show a friendly
 * "please shorten" error BEFORE truncating). Empty list = all within caps.
 *
 * @param {Object} values
 * @param {Object} caps                 subset of FIELD_CAPS keyed by the same field names
 * @param {{multiline?: string[]}} opts field names to treat as multiline
 * @returns {string[]}
 */
export function fieldsOverCap(values = {}, caps = {}, { multiline = [] } = {}) {
  const over = [];
  for (const [field, cap] of Object.entries(caps)) {
    const raw = values[field];
    if (raw == null || raw === '') continue;
    const cleaned = cleanField(raw, Infinity, { multiline: multiline.includes(field) });
    if (cleaned.length > cap) over.push(field);
  }
  return over;
}
