// syncIdentityKey — the STABLE identity a cross-device sync effect should key on.
//
// A3 (rigorous-review 2026-06-13): Supabase emits a TOKEN_REFRESHED event about
// hourly with a BRAND-NEW session object that carries the SAME user. An effect
// whose dependency is the session OBJECT therefore re-runs every hour per
// device — a full initialSync + re-subscribe storm — even though nothing the
// sync cares about changed. Keying on the user id collapses that to: re-run
// only on a real sign-in, sign-out, or account switch.
export function syncIdentityKey(authSession) {
  return authSession?.user?.id || null;
}
