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

// The host-trust predicate feeding isPublicHostVal above (extracted from the
// frozen shell, DR-0078 ratchet). Public (poetech.us / *.vercel.app / unknown)
// = true; the family's own NAS / LAN / Tailscale / dev hosts = false. Fails
// CLOSED (public) on any error.
export function isPublicHost() {
  try {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (host.startsWith('100.')) return false; // Tailscale CGNAT (100.64.0.0/10)
    if (host.endsWith('.ts.net')) return false; // Tailscale magic DNS
    if (host.endsWith('.local')) return false; // mDNS LAN
    if (/^192\.168\./.test(host)) return false; // RFC1918 LAN
    if (/^10\./.test(host)) return false; // RFC1918 LAN
    return true; // poetech.us, *.vercel.app, anything else = PUBLIC
  } catch (e) {
    return true; // Fail closed.
  }
}
