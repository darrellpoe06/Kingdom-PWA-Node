// =============================================================================
// tlc-error — a TLC seam's failure, said in words (DR-0342 sweep, 2026-09-10)
// =============================================================================
// Darrell's screen, 2026-09-10 04:45 UTC: the Roster area printed a whole
// Cloudflare 502 page as its message. Every TLC seam now answers through the
// one humanizer (lib/server-error-text.js): an HTML body is never shown, its
// <title> is the one fact kept, and the sentence names what did not happen.
import { humanizeServerError } from './server-error-text.js';

export function tlcError(err, did = 'Nothing was changed') {
  return humanizeServerError(err, { did, server: 'the office server' });
}
