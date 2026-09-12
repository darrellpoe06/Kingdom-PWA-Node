// =============================================================================
// surface-access — which tabs a person sees, and what a locked one says
// =============================================================================
// Darrell 2026-09-11:
//   "Also staff should be the only ones on certain tabs anyway.... views for
//    different users... not showing tabs unless they are staff or it's black
//    with instructions for access..."
//
// That sentence names TWO different behaviours, and which one a surface gets is
// a real decision per surface — so it is DECLARED in the registry rather than
// decided by whoever writes the render line:
//
//   whenDenied: 'hide'  the tab is not in the nav at all. For surfaces whose
//                       very EXISTENCE is not a member's business — the
//                       Observation board, the Governor's own tools.
//   whenDenied: 'lock'  the tab IS there, dark, and says what it is, who holds
//                       it, and how to ask. For surfaces a member could
//                       legitimately want and legitimately ask for — Devices,
//                       the Infra Plan, the Video Wall, Harvest, Projects.
//
// WHY A LOCKED TILE IS BETTER THAN A HIDDEN ONE, where it is safe: a hidden tab
// teaches nothing. A person who should have access cannot tell the difference
// between "not for me" and "broken", and never learns there was a door. The
// locked tile is the app being honest about its own shape.
//
// ── THIS IS THE SCREEN. THE DATABASE IS THE WALL. ───────────────────────────
// Nothing in this file protects a single row. RLS does that, on instance_id and
// on role, and it holds whether or not this file exists (DR-0060). What this
// does is stop the app from PAINTING a surface a person cannot use — an empty
// table where a wall already said no. If these two ever disagree, the database
// is right and this file is a bug.
//
// Pure: no React, no network, no clock.
// =============================================================================

/**
 * Every requirement a surface may declare. Each maps onto a predicate the shell
 * ALREADY computes — nothing here invents a new notion of who somebody is.
 *
 *   ask         who a denied person actually asks. A real person or desk, not
 *               "your administrator".
 *   plain       what the requirement means, in a sentence a member reads.
 */
export const REQUIREMENTS = Object.freeze({
  anyone: {
    id: 'anyone',
    plain: 'Open to anyone, signed in or not.',
    ask: '',
    holds: () => true,
  },
  'signed-in': {
    id: 'signed-in',
    plain: 'You need to be signed in.',
    ask: 'Nobody — sign in and it opens.',
    holds: (v) => !!v.signedIn,
  },
  'church-member': {
    id: 'church-member',
    plain: 'For people who belong to this church.',
    ask: 'the church office',
    holds: (v) => !!v.signedIn && (!!v.instanceRole || !!v.isChurchStaff),
  },
  'church-staff': {
    id: 'church-staff',
    plain: 'For church staff.',
    // BG is Bishop Gwin (bg@thechurchofthelivinggod.com) — already the whole
    // church-staff allowlist in the shell, and the person Darrell named as the
    // gate for access requests.
    ask: 'the church office, or Bishop Gwin',
    // TWO WAYS IN, and the second one is the point of 0211. The email allowlist
    // is the original and stays; `see:church-staff` is a capability GRANTED by
    // the office, in the app, to a named person, with a row to show for it — so
    // approving a request opens something instead of only marking it approved.
    holds: (v) => !!v.isChurchStaff || (v.capabilities || []).includes('see:church-staff'),
    // The one key a request for any of these tabs asks for.
    grantedBy: 'see:church-staff',
  },
  'instance-owner-admin': {
    id: 'instance-owner-admin',
    plain: 'For whoever owns or administers this space.',
    ask: 'whoever owns this space',
    holds: (v) => ['owner', 'admin'].includes(String(v.instanceRole || '')),
  },
  family: {
    id: 'family',
    plain: 'For the family.',
    ask: 'Darrell',
    holds: (v) => !!v.isFamilyMember,
  },
  'study-circle': {
    id: 'study-circle',
    plain: 'For the Study circle.',
    ask: 'Darrell',
    holds: (v) => !!v.isStudyCircle,
  },
});

export const REQUIREMENT_IDS = Object.freeze(Object.keys(REQUIREMENTS));

/** What a surface with no declared requirement means: open. Stated, not implied. */
export const DEFAULT_REQUIREMENT = 'anyone';

/** What a denied surface does when nothing says otherwise. */
export const DEFAULT_WHEN_DENIED = 'lock';

/**
 * REVIEWER MODE IS NOT A KEY. Reviewer mode (DR-0104) exists to see the live
 * build as a user meets it, so it must never quietly hand over a staff surface.
 * The shell already zeroes the persona predicates for it; this asserts the same
 * thing here so the two cannot drift.
 */
function viewerOf(raw = {}) {
  const reviewer = raw.reviewerMode === true;
  return {
    signedIn: !!raw.signedIn,
    isFamilyMember: !reviewer && !!raw.isFamilyMember,
    isChurchStaff: !reviewer && !!raw.isChurchStaff,
    isStudyCircle: !reviewer && !!raw.isStudyCircle,
    instanceRole: reviewer ? '' : String(raw.instanceRole || ''),
    // Reviewer mode drops granted capabilities too. A reviewer is meant to see
    // the build as a user meets it, and a reviewer carrying somebody's grant
    // would be reviewing the wrong app.
    capabilities: reviewer ? [] : (Array.isArray(raw.capabilities) ? raw.capabilities : []),
    reviewerMode: reviewer,
  };
}

/**
 * May this person open this surface, should the tab be listed, and if it is
 * listed-but-shut, what does it say?
 *
 * @param {object} surface a SURFACES entry ({ id, label, requires, whenDenied })
 * @param {object} rawViewer { signedIn, isFamilyMember, isChurchStaff,
 *                             isStudyCircle, instanceRole, reviewerMode }
 * @returns {{ allowed, listed, locked, requirement, plain, ask, why }}
 */
export function surfaceAccess(surface = {}, rawViewer = {}) {
  const viewer = viewerOf(rawViewer);
  const id = String(surface.requires || DEFAULT_REQUIREMENT);
  const req = REQUIREMENTS[id] || REQUIREMENTS[DEFAULT_REQUIREMENT];
  const allowed = req.holds(viewer);
  const mode = surface.whenDenied === 'hide' ? 'hide' : DEFAULT_WHEN_DENIED;

  if (allowed) {
    return { allowed: true, listed: true, locked: false, requirement: req.id, plain: req.plain, ask: req.ask, grantedBy: req.grantedBy || '', why: '' };
  }
  return {
    allowed: false,
    listed: mode === 'lock',
    locked: mode === 'lock',
    requirement: req.id,
    plain: req.plain,
    ask: req.ask,
    // The capability an approval would actually write. Empty means there is no
    // key for this one and asking would be theatre — the tile says so instead.
    grantedBy: req.grantedBy || '',
    why: viewer.signedIn
      ? `${surface.label || 'This'} is ${req.plain.replace(/^For /, 'for ').replace(/\.$/, '')}.`
      : 'Sign in first — this app cannot tell who you are yet.',
  };
}

/** The surfaces of one nav group this person should actually see listed. */
export function listedSurfaces(surfaces = [], nav = '', viewer = {}) {
  return (Array.isArray(surfaces) ? surfaces : [])
    .filter((s) => s && (!nav || s.nav === nav))
    .filter((s) => surfaceAccess(s, viewer).listed);
}

/** The listed-but-shut ones, each with what it says. */
export function lockedSurfaces(surfaces = [], nav = '', viewer = {}) {
  return (Array.isArray(surfaces) ? surfaces : [])
    .filter((s) => s && (!nav || s.nav === nav))
    .map((s) => ({ surface: s, access: surfaceAccess(s, viewer) }))
    .filter((x) => x.access.locked);
}

/** Is this tab id shut for this person? The one call a render line needs. */
export function isLocked(surfaces = [], id = '', viewer = {}) {
  const s = (Array.isArray(surfaces) ? surfaces : []).find((x) => x && x.id === id);
  if (!s) return false;
  return surfaceAccess(s, viewer).locked;
}

/**
 * The request chain, and what it does NOT cover.
 *
 * It IS built now (0211): a person asks from the tile, the ask lands in the
 * office queue, and an approval GRANTS through 0126's guarded door rather than
 * only marking a row. What it does not cover is a surface with no key —
 * `grantedBy` empty means nothing an office could write would open it, and the
 * tile says so rather than drawing a button that files into nowhere (DR-0329).
 */
export const ACCESS_REQUEST_IS_NOT_BUILT = Object.freeze({
  built: true,
  today: 'Ask from the tile and it reaches the church office. Approving it grants the key on the spot — nobody has to remember a second step.',
  noKey: 'There is no key for this one. Asking here would file into nowhere, so the app does not offer it — speak to the person named above.',
});

/** Can a request for this surface actually be granted by somebody? */
export function canBeRequested(surface = {}, viewer = {}) {
  const a = surfaceAccess(surface, viewer);
  return a.locked && !!a.grantedBy && !!viewer.signedIn;
}
