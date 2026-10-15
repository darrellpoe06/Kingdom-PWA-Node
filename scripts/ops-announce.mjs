#!/usr/bin/env node
// =============================================================================
// ops-announce — A DEAD BELL SAYS SO, BECAUSE curl -sS EXITS 0 ON A 404
// =============================================================================
// 2026-10-11, with the 404 captured verbatim in a live run.
//
// WHAT WAS MEASURED, not recalled. site-health run 38141832465, 13:06:25Z, its
// own last line:
//
//   {"code":404,"message":"The requested webhook \"POST ops-announce\" is not
//    registered.","hint":"The workflow must be active for a production URL to
//    run successfully..."}
//
// So the family's phone alarm has been dark. That much was already suspected.
// THE PART THAT WAS WRONG IS THE DETECTOR, and it is worse than silence:
//
//   curl -sS -X POST "$RELAY/webhook/ops-announce" ... \
//     || echo "::warning::announce relay unreachable"
//
// `curl -sS` WITHOUT `-f` EXITS 0 ON AN HTTP 404. A 404 is a perfectly
// successful HTTP transaction as far as curl is concerned, so the `||` branch
// cannot fire on one — it only catches a connection failure. The consequence
// is not a missing warning; it is that **an unregistered, renamed, revoked or
// 500-ing webhook is indistinguishable from a bell that rang.** The fail-soft
// was written to degrade gracefully and instead degraded invisibly, which is
// the class DR-0076 §3 calls theater: a check that cannot fail is not a check.
//
// It mattered today. The deploy was red for two hours this morning with no
// bell, and nobody knew the bell itself was the thing that was broken.
//
// WHY A NODE SCRIPT AND NOT A BETTER curl LINE. `curl -f` alone would fix the
// exit code and still leave the two call sites each deciding what to do, in
// duplicated shell, with no test. The decision — "did the bell ring, and if
// not, is this a dead bell or a quiet one?" — is pure, so it lives in
// `classifyBellResponse` and is unit-tested against the real 404 body above.
// The shell around it only performs the request. Same split as
// push-stranding-guard.mjs.
//
// UNKNOWN IS NOT RUNG (DR-0076 §8). Anything that is not a 2xx is reported as
// a bell that did NOT ring. There is no benefit-of-the-doubt branch.
//
// THE TOKEN IS NEVER PRINTED. It is read from the environment, sent in a
// header, and never echoed — not in a reason string, not in a debug line.
import { pathToFileURL } from 'node:url';

// CUT OVER TO THE SOVEREIGN BELL 2026-10-15 (DR-1043). This was
// `/webhook/ops-announce` -- the Funnel's n8n root -- which answered 404
// "webhook not registered" for five weeks while every alarm it carried
// reached nobody. The n8n-is-gone HELD entry for this file named its own
// release condition: "Held until a sovereign bell replaces it end to end."
// That bell is poetech-announce.service, proven `active` on the box by
// nas-health run 38726513614, and the `/announce` row in
// infra/nas-transport/RECORDED-STATE.md is its road.
//
// Tailscale strips the mount point and the server matches its path by SUFFIX,
// so this full spelling arrives as `/ops-announce` and is matched either way.
export const RELAY_URL = 'https://poetech.tail5a2f35.ts.net/announce/ops-announce';

/**
 * Did the bell ring? Pure — no network, no env, no clock.
 *
 * @param {object} r
 * @param {?number} r.code  the HTTP status, or 0/null when nothing answered.
 * @param {string} [r.body] the response body, used only to sharpen the reason.
 * @param {?string} [r.transportError] a real connection failure, if any.
 * @returns {{rang: boolean, dead: boolean, reason: string}}
 *   `rang` — the relay accepted it. `dead` — the relay is reachable but the
 *   bell is broken in a way a human must fix (so it belongs on the ledger).
 */
export function classifyBellResponse({ code, body = '', transportError = null } = {}) {
  const n = Number(code) || 0;
  const text = String(body || '').slice(0, 300);

  if (transportError) {
    return {
      rang: false,
      dead: true,
      reason: `the announce relay could not be reached (${String(transportError).split('\n')[0]}).`,
    };
  }
  if (n >= 200 && n < 300) {
    return { rang: true, dead: false, reason: `the announce relay accepted the push (HTTP ${n}).` };
  }
  if (n === 404) {
    // The measured case. n8n answers 404 with this exact shape when the
    // workflow holding the webhook is not ACTIVE, which is a toggle on the
    // NAS and cannot be fixed from a runner — so it has to be said out loud.
    const unregistered = /not registered/i.test(text);
    return {
      rang: false,
      dead: true,
      // The n8n branch is kept because its body shape is exact and the history
      // is real; it only fires on n8n's own words. After the DR-1043 cut-over
      // the OTHER branch is the one that will fire, so it now names the cause
      // it will actually have: the Funnel mount. A 404 on the sovereign road
      // means tailscale is serving nothing at /announce, which is precisely
      // the built-correct-never-connected class that cost /nas-photos seven
      // weeks, /taxes seven weeks and /scribe eighteen days — so it says the
      // one command that fixes it instead of shrugging at the path.
      reason: unregistered
        ? 'THE PHONE ALARM IS NOT REGISTERED — the relay answered HTTP 404 "webhook not registered", which means the n8n workflow holding POST ops-announce is not ACTIVE on the NAS. Every alarm raised while this is true is recorded here and reaches nobody.'
        : 'THE BELL HAS NO ROAD — the relay answered HTTP 404, so nothing is mounted at /announce on the Funnel. The service may be running on 127.0.0.1:8796 and still be unreachable. infra/nas-announce/install.sh mounts it on every services-sync cycle; if this persists, the mount is failing and the fix is: sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --set-path /announce http://127.0.0.1:8796',
    };
  }
  if (n === 401 || n === 403) {
    return {
      rang: false,
      dead: true,
      reason: `the announce relay refused the token (HTTP ${n}) — the bearer is wrong, expired or revoked.`,
    };
  }
  if (n >= 500) {
    return { rang: false, dead: true, reason: `the announce relay failed (HTTP ${n}).` };
  }
  if (n === 0) {
    return { rang: false, dead: true, reason: 'the announce relay gave no answer at all.' };
  }
  return { rang: false, dead: true, reason: `the announce relay answered HTTP ${n}, which is not an acceptance.` };
}

/** One line for a ledger comment. Pure. */
export function ledgerLine(result, runUrl = '') {
  if (!result || result.rang) return '';
  return `⚠️ **The phone alarm did not ring.** ${result.reason}${runUrl ? ` (detected by ${runUrl})` : ''}`;
}

export async function ring({ title, message, url = '', priority = '5', token, relay = RELAY_URL, timeoutMs = 15_000, fetchImpl = fetch } = {}) {
  if (!token) return { rang: false, dead: false, reason: 'no announce bearer is configured, so no bell was attempted.' };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(relay, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title, message, url, priority: String(priority) }),
      signal: ctl.signal,
    });
    let body = '';
    try { body = await res.text(); } catch { /* the code is enough */ }
    return classifyBellResponse({ code: res.status, body });
  } catch (err) {
    return classifyBellResponse({ transportError: (err && err.message) || 'fetch failed' });
  } finally {
    clearTimeout(t);
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const arg = (name) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : '';
  };
  const result = await ring({
    title: arg('title') || 'PoeTech',
    message: arg('message') || '',
    url: arg('url'),
    priority: arg('priority') || '5',
    token: process.env.N8N_BEARER || '',
    // `--relay=` exists so the EXIT CODES can be proven against a local
    // server, which is the whole reason the callers can branch on them. The
    // workflows never pass it and it defaults to the real relay. Without it
    // the exit-3 path — the one both workflows key their ledger write on —
    // would ship having never once run (P44: a green check that never ran is
    // not a check).
    relay: arg('relay') || RELAY_URL,
  });
  console.log(`ops-announce: ${result.reason}`);
  if (!result.rang && result.dead) {
    // The ledger line goes to stdout on its own line so a workflow can read it
    // with a single `tail -1` and put it where humans actually look.
    console.log(`LEDGER_LINE=${ledgerLine(result, process.env.RUN_URL || '')}`);
    process.exit(3); // 3 = reached, but the bell is broken (distinct from 1)
  }
  if (!result.rang) process.exit(0); // nothing configured: not a failure of this run
}
