// =============================================================================
// /link?c=CODE — the address the television's QR code points at (DR-0658)
// =============================================================================
// device-link.js qrTarget() prints `${origin}/link?c=ABCD-EFGH`: short enough
// to type off a TV screen by hand. The app itself lives under /poetech-app/
// (_redirects), so this route hands the phone to the app's own lean approval
// boot, `?link=CODE`, with the code already normalized (dashes, spaces, case
// and lookalike letters folded). Done in a Function rather than _redirects so
// the query survives exactly and a mistyped code is repaired before the app
// ever sees it. No secret passes through here: the user_code is a lookup
// handle and nothing more.
import { normalizeUserCode } from '../src/lib/device-link.js';

export function linkDestination(requestUrl) {
  const u = new URL(requestUrl);
  const code = normalizeUserCode(u.searchParams.get('c') || u.searchParams.get('code') || '');
  return `${u.origin}/poetech-app/?link=${encodeURIComponent(code || '1')}`;
}

export async function onRequest(context) {
  return new Response(null, {
    status: 302,
    headers: { location: linkDestination(context.request.url), 'cache-control': 'no-store' },
  });
}
