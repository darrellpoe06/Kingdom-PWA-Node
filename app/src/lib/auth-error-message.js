// =============================================================================
// auth-error-message — the app speaks in its own voice when sign-in fails
// =============================================================================
// Found in the DR-0303 review, dimension 3 (SURFACE-SAYS-TRUTH).
//
// During the 2026-08-14 lockout, six sign-in paths printed the backend's raw
// `error.message` straight onto the screen. What Christina, Shay and Chandra
// were shown, verbatim, when they tried to get back into their own apps:
//
//   "Service for this project is restricted due to the following violations:
//    exceed_egress_quota. The project owner must upgrade their plan or remove
//    spend caps to restore service."
//
// Three things wrong with that, in the order they matter:
//
//   1. It is not actionable by the person reading it. A church member cannot
//      upgrade a plan. The sentence invites them to try — or to conclude they
//      did something wrong — when the honest answer is "this is on us."
//   2. It exposes internal billing state to anyone who opens the app.
//   3. It is not the app's voice. COMMUNITY-FIRST names elderly tech-novice
//      members as the people this is built for; a raw vendor string fails them
//      first and hardest.
//
// This does NOT swallow errors, and it must never soften a real one into
// something vague. Sign-in failures a person CAN act on — a wrong PIN, an
// unconfirmed email, a bad address — keep their specific wording, because
// vagueness there is its own failure (ANXIETY-CLARITY: every surface answers
// what / when / why / how). Only the classes the reader cannot act on are
// translated, and they are translated into the TRUTH: the app cannot reach its
// service, it is not their fault, and nothing they typed was wrong.
//
// The raw text is still available to whoever can act on it — it is logged to
// the console and returned as `detail`, so a steward reading a screenshot or a
// console still gets the vendor string.

/** Backend states the person reading cannot possibly act on. */
const NOT_YOUR_FAULT = [
  // Billing / quota restriction — the 2026-08-14 lockout.
  /exceed_[a-z_]+/i,
  /restricted due to the following violations/i,
  /upgrade (?:their|your) plan/i,
  /spend cap/i,
  /payment required/i,
  // Reachability / capacity.
  /service unavailable/i,
  /bad gateway/i,
  /gateway time-?out/i,
  /failed to fetch/i,
  /network ?error/i,
  /load failed/i,
  /upstream connect/i,
  /database is not available/i,
];

/**
 * True when the failure is the backend's, not the person's.
 * Exported so a caller can decide whether to offer "try again" at all.
 */
export function isServiceFailure(error) {
  if (!error) return false;
  const status = Number(error.status || error.statusCode || 0);
  // 402/502/503/504 are service-side regardless of wording. 500 is included:
  // there is nothing a reader can do about it either.
  if ([402, 500, 502, 503, 504].includes(status)) return true;
  return NOT_YOUR_FAULT.some((re) => re.test(rawText(error)));
}

/**
 * The backend's own words, or '' when it gave none.
 *
 * Never `String(error)` on a bare object — that yields the literal
 * "[object Object]", which this module would then have rendered to the reader
 * as if it were an explanation. Caught by this module's own test.
 */
function rawText(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  const m = error.message || error.error_description || error.msg;
  if (typeof m === 'string') return m;
  return error instanceof Error ? String(error) : '';
}

/**
 * The sentence to SHOW a person when sign-in fails.
 *
 * @param error     the backend error (Supabase/GoTrue shape, or an Error)
 * @param fallback  what to say when the message is the person's to act on and
 *                  the backend gave us nothing usable
 * @returns { text, detail, serviceFailure }
 *          text            — what to render
 *          detail          — the raw backend string, for logs/stewards
 *          serviceFailure  — true when retrying with different input won't help
 */
export function authErrorMessage(error, fallback = 'That didn’t work — please try again.') {
  const detail = rawText(error);
  if (!error) return { text: fallback, detail: '', serviceFailure: false };

  if (isServiceFailure(error)) {
    // Say the true thing, and say whose problem it is. No blame on the reader,
    // no instruction they cannot follow, no invented recovery time — we do not
    // know when it will be back, so we do not promise one (DR-0076).
    return {
      text: 'We can’t reach our service right now, so signing in isn’t working. '
        + 'This is on our end — nothing you typed was wrong, and your account is fine. '
        + 'Please try again in a little while.',
      detail,
      serviceFailure: true,
    };
  }

  // The person CAN act on this one. Keep the backend's own wording, because
  // "wrong password" and "email not confirmed" are exactly what they need to
  // hear, and blurring them is its own kind of unhelpful.
  return { text: detail || fallback, detail, serviceFailure: false };
}
