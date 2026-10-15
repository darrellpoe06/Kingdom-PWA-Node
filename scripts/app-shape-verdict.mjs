#!/usr/bin/env node
// =============================================================================
// app-shape-verdict — did the APP's shape work, not just a probe's (DR-1054)
// =============================================================================
// site-health's backend step has always been a GET, from a datacenter, with NO
// Origin header. The app is a browser on a phone making CROSS-ORIGIN POSTs, and
// since 2026-10-09 it talks to the absolute Tailscale Funnel origin rather than
// same-origin poetech.us/sb, because every Pages Function is dark (#2057). The
// repoint's own comment records the hazard it accepted:
//
//   "The throttle is not firing right now. It may begin firing under real
//    family load -- that is the risk being accepted, knowingly, against a
//    family that is locked out of its own app."
//
// A GET with no Origin cannot exercise that. So `backend auth: HTTP 200`,
// printed on all 39 of #2057's comments, has only ever meant THE ROAD ANSWERS A
// PROBE -- never THE APP CAN USE THE ROAD. On 2026-10-15 Darrell met the
// difference three times in one hour (Choir, My Record, the harvest ledger)
// while that step read 200 on his exact build.
//
// WHY THE VERDICT LIVES HERE AND NOT IN THE SHELL. The bell made this mistake
// first: `curl -sS ... || echo "::warning::"` could never fire on a 404,
// because curl without -f exits 0, and the decision was invisible inside a
// 36,000-character step nobody could test. The cure there was
// scripts/ops-announce.mjs, unit-tested against the exact 404 body. Same cure
// here: the workflow measures, this decides, and a vitest feeds it each real
// failure shape and REQUIRES the finding (DR-0076 §3).
//
// THE THREE SHAPES, each one a thing that actually happened:
//   1. NO ANSWER      -- the POST did not complete. The 15-second timeouts on
//                        every church surface, 2026-10-15.
//   2. EMPTY BODY     -- an ordinary HTTP code with zero bytes. The browser
//                        calls .json() and dies with "Unexpected end of JSON
//                        input", so nobody can sign in. THIS IS WHAT #2057
//                        OPENED ON, and a probe reading only the code is blind
//                        to it.
//   3. NO CORS        -- the preflight carries no allow-origin for the app's
//                        own origin, so the browser refuses the request before
//                        it leaves the phone and the server never hears it.
//
// ORDER MATTERS: no-answer outranks empty-body outranks no-CORS, because a road
// that did not answer tells you nothing about its CORS headers, and reporting
// the shallower fault would send someone to fix the wrong thing.
// =============================================================================

/** Marks for a measurement that did not happen. Unknown is never up (DR-0076). */
export const NOT_MEASURED = 'not-measured';

/**
 * Pure. Given what the probe measured, say whether the APP's shape works.
 *
 * @param {object} m
 * @param {string} m.pre     preflight HTTP code, '000' for no answer
 * @param {string} m.allow   access-control-allow-origin header value, '' if absent
 * @param {string} m.post    POST HTTP code, '000' for no answer
 * @param {number|string} m.bytes  bytes in the POST's body
 * @param {string} m.origin  the app's own origin
 * @param {string} m.url     the road that was asked
 * @returns {{ok: boolean, kind: string, reason: string}}
 */
export function appShapeVerdict({ pre, allow, post, bytes, origin = 'https://poetech.us', url = 'the sign-in road' } = {}) {
  const p = String(post ?? NOT_MEASURED);
  const n = Number.parseInt(String(bytes ?? '0'), 10);
  const size = Number.isFinite(n) ? n : 0;

  if (p === NOT_MEASURED) {
    return { ok: false, kind: 'not-measured', reason: `THE APP'S SHAPE WAS NOT MEASURED against ${url} — no backend URL or anon key reached this run, so nothing here says the app works. Unknown is never up` };
  }
  if (p === '000' || p === '') {
    return { ok: false, kind: 'no-answer', reason: `THE APP'S OWN SHAPE GOT NO ANSWER — a cross-origin POST to ${url}, the browser's real sign-in road, did not complete. A keyless GET to /auth/v1/health can answer 200 while this is true; a GET is not a sign-in, and this is the shape every church surface uses` };
  }
  if (size === 0) {
    // NAME THE ROAD. The test required this and it was missing: a reason with
    // no road sends the next reader to the wrong host, and #2057 already
    // carries 39 comments that all look alike.
    return { ok: false, kind: 'empty-body', reason: `THE SIGN-IN ROAD RETURNED AN EMPTY BODY — ${url} answered HTTP ${p} with 0 bytes. The browser calls .json() on that and fails with "Unexpected end of JSON input", so nobody can sign in. This is the exact failure #2057 opened on, and it arrives with an ordinary HTTP code, so a probe reading only the code cannot see it` };
  }
  if (!String(allow ?? '').trim()) {
    return { ok: false, kind: 'no-cors', reason: `NO CORS FOR THE APP'S OWN ORIGIN — the preflight to ${url} answered ${pre} with no access-control-allow-origin for ${origin}, so a browser refuses every request before it leaves the phone and the app sees a failure the server never heard about` };
  }
  return { ok: true, kind: 'answered', reason: '' };
}

if (process.argv[1] && process.argv[1].endsWith('app-shape-verdict.mjs')) {
  const arg = (name, dflt = '') => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit === undefined ? dflt : hit.slice(name.length + 3);
  };
  const v = appShapeVerdict({
    pre: arg('pre', NOT_MEASURED),
    allow: arg('allow', ''),
    post: arg('post', NOT_MEASURED),
    bytes: arg('bytes', '0'),
    origin: arg('origin', 'https://poetech.us'),
    url: arg('url', 'the sign-in road'),
  });
  console.log(`APP_SHAPE_KIND=${v.kind}`);
  if (!v.ok) {
    console.log(`APP_SHAPE_REASON=${v.reason}`);
    process.exit(3);          // 3 = the app's shape does not work (the bell's convention)
  }
  console.log('APP_SHAPE_REASON=');
}
