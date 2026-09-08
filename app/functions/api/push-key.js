// =============================================================================
// /api/push-key — the VAPID public key, served from the ONE place it lives
// =============================================================================
// This endpoint exists to kill a silent-failure class that the original wiring
// left wide open.
//
// The VAPID key pair has two halves that MUST match:
//   • the browser subscribes with the PUBLIC half, and the push service binds
//     that subscription to it permanently;
//   • the sender signs every request with the PRIVATE half.
// If the two halves are not from the same pair, the push service answers 403
// on every send. The subscription looks healthy, the control says ON, the
// sender reports "sent", and NO PHONE EVER BUZZES. Nothing in the app can tell
// you why, because from the app's side everything succeeded.
//
// The original design made that drift EASY: the public half was a build-time
// var (`VITE_VAPID_PUBLIC_KEY`, inlined into the bundle by CI) and the private
// half a Pages runtime var (`VAPID_PRIVATE_KEY`). Two copies, two places, two
// different moments, and no check that they came from the same pair. Rotate one
// and forget the other and the whole feature dies quietly.
//
// So the public key is served AT RUNTIME from the same environment that holds
// the private key. One source (DR-0121). Drift is no longer possible: the key
// the browser subscribes with is read out of the same env the signature is made
// from. The build-time var survives only as a fallback for when this endpoint
// cannot be reached.
//
// PUBLISHING THIS IS CORRECT, NOT A LEAK. The VAPID public key is public by
// design — it is handed to the push service on every subscription and to every
// browser that subscribes. It identifies the sender; it authorizes nothing. The
// private half is never read here.
const json = (body, status = 200, cache = 'no-store') => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
});

const asStr = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * A VAPID public key is an uncompressed P-256 point: 65 raw bytes starting
 * 0x04, base64url — 87 characters. Serving a malformed key would push the
 * failure into `subscribe()` inside somebody's browser, where the only symptom
 * is a control that will not turn on. Checking the shape here means a
 * mis-pasted key is reported as NOT CONFIGURED rather than as a broken button.
 */
export function looksLikeVapidPublicKey(key) {
  const s = asStr(key);
  if (!/^[A-Za-z0-9_-]{86,88}$/.test(s)) return false;
  // 0x04 as the first byte encodes to 'B' followed by a nibble in [C..P].
  return s.charAt(0) === 'B';
}

export async function onRequestGet(context) {
  const env = (context && context.env) || {};
  const publicKey = asStr(env.VAPID_PUBLIC_KEY);

  // "Nobody has set this up yet" and "it broke" are different facts, and
  // conflating them is exactly what kept the original gap invisible. A client
  // that gets `configured:false` renders nothing; it does not show an error.
  if (!publicKey) return json({ configured: false, reason: 'unset' }, 200);
  if (!looksLikeVapidPublicKey(publicKey)) {
    return json({ configured: false, reason: 'malformed' }, 200);
  }

  // Five minutes. The key is stable for the life of the pair, and a rotation
  // already invalidates every existing subscription (every device must
  // re-subscribe regardless), so a short window of staleness costs nothing that
  // the rotation did not already cost.
  return json({ configured: true, publicKey }, 200, 'public, max-age=300');
}
