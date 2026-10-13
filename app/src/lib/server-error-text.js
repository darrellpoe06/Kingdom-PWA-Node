// =============================================================================
// server-error-text — a server's failure, said in words a person can read
// =============================================================================
// Darrell's phone, 2026-09-09 11:07 PM (build 3D2417D): My profile's status
// line filled with "<!DOCTYPE html> <!--[if lt IE 7]> ... <title>Origin DNS
// error |" — Cloudflare's 1016 page, the answer a Pages Function's fetch gets
// when the Funnel hostname does not resolve, streamed through the /sb proxy
// into supabase-js, whose error.message is the raw body, and printed as-is.
//
// Two rules, both pure:
//   1. A raw HTML body is NEVER shown. Its <title> is the one honest fact in
//      it (the class of failure); the rest is markup for a browser, not words
//      for a person.
//   2. The sentence names what did NOT happen. "Nothing was saved" matters
//      more than the error's name — the person's next move is to try again,
//      not to read a stack.
// The transport fix that stops the HTML at the door lives in
// functions/_lib/funnel-proxy.js; this is the belt under it, for every other
// path a raw body could still take.
const HTML_RE = /^\s*(<!doctype|<html|<head|<body)/i;

/** True when a message is a server's HTML page rather than words. */
export function looksLikeHtml(message) {
  return HTML_RE.test(String(message || ''));
}

/** The <title> of an HTML page, trimmed, without any trailing " | site" suffix. */
export function htmlTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(html || ''));
  if (!m) return '';
  // Cloudflare titles read "Origin DNS error | poetech.us" or "poetech.us |
  // 502: Bad gateway": the host is not the fact, the other side is.
  const parts = m[1].replace(/\s+/g, ' ').split('|').map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return '';
  const host = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
  return (host.test(parts[0]) && parts.length > 1 ? parts.slice(1).join(' | ') : parts[0]).slice(0, 80);
}

/**
 * The words to show for a failed server call.
 * @param {string|Error|{message?:string}} err  what the seam returned
 * @param {object} [o]
 * @param {string} [o.did]  what did not happen, e.g. "Nothing was saved" (default)
 * @param {string} [o.server]  the server as the reader knows it (default "the church server";
 *   the TLC seams say "the office server", DR-0347 sweep)
 */
export function humanizeServerError(err, { did = 'Nothing was saved', server = 'the church server' } = {}) {
  const raw = typeof err === 'string' ? err : (err && err.message) || '';
  if (!raw.trim()) return `${did} — the server did not answer. Try again in a moment.`;
  if (looksLikeHtml(raw)) {
    const title = htmlTitle(raw);
    return `${did} — ${server} could not be reached${title ? ` (${title})` : ''}. Try again in a moment.`;
  }
  // A real message from the database or the seam: keep it, capped, one line.
  return `${did} — ${raw.replace(/\s+/g, ' ').trim().slice(0, 200)}`;
}
