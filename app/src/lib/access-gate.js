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

// ---------------------------------------------------------------------------
// THE PUBLIC CHURCH ROUTE — a shared lesson link must open for a stranger
// ---------------------------------------------------------------------------
// Darrell 2026-08-10, opening a shared lesson link on the live site: "why would
// anyone need to login to see the lessons?" And: "This should be an advantage
// for PoeTech App... easy for promotion to potential students users and
// businesses."
//
// He was right, and the app already SAID so: the shell's own comment beside the
// gate reads "The Love Corner church door is a PUBLIC community: signed-out
// visitors SEE the church (no private family/financial data lives here)." But
// the only thing that opened that door was `isChurchDoorContext()`, which
// requires either the `?lovecorner=1` door param or an INSTALLED (standalone)
// PWA. So the church was public exactly for people who had already installed
// the app — and every shared link, opened in an ordinary browser tab, hit the
// create-a-profile wall. A link you cannot hand to someone who does not have
// the app yet is not a link; it is an invitation to a locked door, and it is
// the single cheapest promotion the platform has.
//
// This predicate is the fix, kept SEPARATE from isChurchDoorContext on purpose:
// that one decides which BRAND the door wears and which chrome hides; this one
// decides only whether a signed-out visitor may pass. Church surfaces that hold
// staff or member data self-gate downstream (harvest, devices, infrastructure,
// the observation board, rosters) and are unaffected — they check the signed-in
// account, not the front door.
//
// Pure and injectable so the security property stays directly testable.
// ---------------------------------------------------------------------------
export function isPublicChurchRoute(search = (typeof window !== 'undefined' && window.location ? window.location.search : '')) {
  try {
    const sp = new URLSearchParams(search || '');
    if (sp.get('lovecorner') === '1') return true;   // the church's own door
    const view = (sp.get('view') || '').toLowerCase().trim();
    if (view === 'church') return true;              // any church surface, any browser
    // The pre-history-nav church deep-links (?view=learn etc.) resolve to the
    // church tab in parseNav, so they open publicly too — an old bookmark or a
    // link someone already shared must not start demanding a login.
    return ['learn', 'engagement', 'choir', 'pulpit', 'events'].includes(view);
  } catch (e) {
    return false; // malformed query -> the normal gate, never an accidental opening
  }
}

/**
 * WHOSE APP AM I IN — the brand follows the DOOR, not the tab.
 *
 * Darrell 2026-08-10: "whenever I'm in learn... from PoeTech App... I end up in
 * the Love Corner App... still an issue." DR-0174 made the header wear the
 * church on ANY `?view=church`, which is right for someone who came through the
 * church door and wrong for a steward inside PoeTech who simply opened the
 * Church tab — tapping a TAB must never feel like leaving for another app.
 *
 *   • launched through the church door (installed Love Corner app,
 *     ?lovecorner=1) → wears the church everywhere (DR-0174, unchanged);
 *   • a signed-out visitor on a public church link (a shared lesson)
 *                    → wears the church, because that is what they came for;
 *   • inside the PoeTech app → PoeTech, on every tab including Church.
 */
export function wearsChurchBrand({ churchDoorOnly = false, signedIn = false, route = false } = {}) {
  return !!churchDoorOnly || (!signedIn && !!route);
}

/**
 * Is this person here BECAUSE they followed a church link — right now?
 *
 * Darrell 2026-08-10, on the deployed build: "the link triggers for me to
 * login... I'm already logged in... why ask... also... the link is supposed to
 * be easy and a lesson."
 *
 * DR-0290 opened the gate but suppressed the two full-screen modals — the
 * scenario picker and "Who's using this device?" — using `publicVisitor`, which
 * is `!authSession && churchBrandRoute`. That made being SIGNED IN switch the
 * modals back on: a member with a session but no chosen profile on that device
 * tapped a lesson link and met the profile wall, which reads as a login prompt
 * and is one in every way that matters to the person holding the phone.
 *
 * The session was never the right question. What matters is the DOOR: someone
 * who followed a lesson link came for the lesson, so they get the lesson.
 *
 * `view` scopes it to the present moment rather than the whole visit — arriving
 * by a church link and later opening a private tab restores the profile choice,
 * because that choice genuinely governs whose private data is on screen.
 */
export function isChurchLinkVisit({ route = false, view = '' } = {}) {
  return !!route && view === 'church';
}
