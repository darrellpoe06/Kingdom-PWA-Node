// =============================================================================
// access-gate — "no profile, no access" (Darrell 2026-06-16)
// =============================================================================
// The simple-login gate, as a PURE predicate so the security property is
// directly testable (DR-0076 proven-to-catch): on the PUBLIC host, a visitor
// with no signed-in session must create a profile before they can reach the app
// — never the app, never sample/demo data. The private host (the family's own
// NAS / LAN / Tailscale devices) is the trusted environment and is unchanged.
//
// Returns one of:
//   'loading' — public host, initial auth check still in flight (render nothing
//               so we never flash the create-profile form at a signed-in user)
//   'gate'    — public host, auth checked, NO session → show PasswordAuth
//   'app'     — signed in, OR a private/trusted host → render the app
// =============================================================================
export function accessState({ isPublicHostVal, authChecked, authSession }) {
  if (!isPublicHostVal) return 'app';      // private/trusted host (NAS/LAN/Tailscale/dev)
  if (!authChecked) return 'loading';      // wait for the first auth check
  return authSession ? 'app' : 'gate';     // signed in → app; signed out → create a profile
}
