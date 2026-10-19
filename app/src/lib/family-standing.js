// =============================================================================
// family-standing — who you are in a space is your ROLE, not your email address
// =============================================================================
// Darrell, 2026-10-19, looking at his son's row in Access & Usage: "Why is my
// son a child and not others... Fix it... he gets access... we want them to
// learn by doing or helping and or witnessing our businesses."
//
// THE DEFECT THIS CLOSES, measured before it was written. The client decides
// who you are from ONE binary: `isFamilyEmail`, a hardcoded email allowlist in
// the shell (poe-financial-mvp-v28.jsx). That single flag is read as THREE
// different things at eleven call sites — family membership, Governor
// authority (`isGov` / `isGovernor`, eighteen of those), and family financial
// visibility. The shell reads no database role anywhere; `user_role_in_instance`
// is never called from it.
//
// So on 2026-08-23 migration 0144 moved Darrell Jr to the 'child' role and
// raised the RLS wall — correctly — but `darrellpoejr@gmail.com` stayed on the
// allowlist. The result is the worst of both: the CLIENT hands a minor the
// Governor surfaces, and the DATABASE denies every row behind them. He is
// simultaneously over-trusted by the app and locked out by the data.
//
// THE RULE THIS MODULE HOLDS: an email can make you a MEMBER. Only a ROLE can
// make you a GOVERNOR. Authority is read from instance_members, never from a
// list of addresses, and no allowlist entry can confer it.
//
// WHAT IT IS FOR, in the Governor's own words: learning by doing, helping and
// witnessing. Those are three different standings and the model names them —
// `witness` reads a space, `helper` reads and writes it, `governor` also
// governs it. A son can witness the household books and help in the business
// on the same sign-in, because instance_members is PER SPACE and so is this.
//
// SAFE BY CONSTRUCTION — THE OWNER IS NEVER LOCKED OUT. A role read is a
// network call and can fail. When the role is unknown, standing falls back to
// exactly today's allowlist behavior, so a failed read changes nothing rather
// than demoting the person reading it. The role only ever makes the answer
// MORE true, never less available (DR-0107: a down door is the worst outcome).
//
// PURE: no React, no Supabase, no clock. Every rule unit-tested (DR-0076).
// =============================================================================

// The standings, least to most. `none` is not a member of the space at all.
export const STANDING = Object.freeze({
  NONE: 'none',
  WITNESS: 'witness',    // sees the space; writes nothing
  HELPER: 'helper',      // sees and does the work of the space
  GOVERNOR: 'governor',  // the space's own authority
});

export const STANDING_ORDER = Object.freeze([
  STANDING.NONE, STANDING.WITNESS, STANDING.HELPER, STANDING.GOVERNOR,
]);

// The database roles, mapped to what a person may actually do with them. These
// mirror the RLS that is the real wall — they do not invent permission:
//   owner/admin            govern (0111/0144 set_member_role guards)
//   member/specialist      read + write the space's records
//   successor              reads the books, cannot write (0082)
//   child                  walled out of books entirely (0082, 0202, 0203)
//   viewer                 read-only by the 0125 deny-overlay
//   assistant              office workspace only; never the money (0202/0203)
const ROLE_STANDING = Object.freeze({
  owner: STANDING.GOVERNOR,
  admin: STANDING.GOVERNOR,
  member: STANDING.HELPER,
  specialist: STANDING.HELPER,
  successor: STANDING.WITNESS,
  viewer: STANDING.WITNESS,
  assistant: STANDING.WITNESS,
  child: STANDING.WITNESS,
});

// Roles the database walls out of the financial tables no matter what the
// client believes. Kept as a named set so the surface can say WHY a space
// shows no money rather than rendering an empty table (DR-0076 surface-truth).
const NO_BOOKS_ROLES = Object.freeze(['child', 'assistant']);

export const roleStanding = (role) => ROLE_STANDING[String(role || '').toLowerCase()] || STANDING.NONE;
export const isGovernorRole = (role) => roleStanding(role) === STANDING.GOVERNOR;
export const readsBooks = (role) => {
  const r = String(role || '').toLowerCase();
  return !!ROLE_STANDING[r] && !NO_BOOKS_ROLES.includes(r);
};
export const writesRecords = (role) => {
  const s = roleStanding(role);
  return s === STANDING.HELPER || s === STANDING.GOVERNOR;
};

/**
 * A person's standing in ONE space.
 *
 * @param allowlisted  what `isFamilyEmail(email)` says today — membership only.
 * @param role         the instance_members role, or null/'' when not yet read.
 *
 * Returns { standing, isMember, isGovernor, canWrite, canSeeBooks, source,
 *           roleKnown }. `source` says which input decided it, so a surface can
 * tell the reader "by your role" instead of implying an address granted it.
 */
export function standingInSpace({ allowlisted = false, role = null } = {}) {
  const known = !!String(role || '').trim();

  // The role is the truth when we have it.
  if (known) {
    const standing = roleStanding(role);
    return {
      standing,
      isMember: standing !== STANDING.NONE,
      isGovernor: standing === STANDING.GOVERNOR,
      canWrite: writesRecords(role),
      canSeeBooks: readsBooks(role),
      source: 'role',
      roleKnown: true,
    };
  }

  // No role yet (not read, or the read failed). Fall back to exactly today's
  // behavior so nothing a person can do right now is taken away by a network
  // hiccup. This is deliberately the ONLY path that can call someone a
  // governor without a role, and it exists so the owner is never locked out.
  return {
    standing: allowlisted ? STANDING.GOVERNOR : STANDING.NONE,
    isMember: !!allowlisted,
    isGovernor: !!allowlisted,
    canWrite: !!allowlisted,
    canSeeBooks: !!allowlisted,
    source: allowlisted ? 'allowlist-fallback' : 'none',
    roleKnown: false,
  };
}

/**
 * THE SHELL'S ONE AUTHORITY LINE. Every Governor affordance in
 * poe-financial-mvp-v28.jsx reads this and nothing else, so the nav, the Admin
 * console, the governance station, the Relationships capability panel and the
 * Projects controls cannot disagree about who governs.
 *
 * It composes the three things the shell already knows:
 *   signedIn      there is a session (an anonymous visitor governs nothing)
 *   reviewerMode  the Governor is previewing the app as a visitor (DR-0104), so
 *                 BOTH the address and the role are dropped — otherwise his own
 *                 membership row would re-promote him inside his own preview
 *   allowlisted   what isFamilyEmail says: MEMBERSHIP, never authority (DR-1106)
 *   role          the database role from my_default_instance_role (0130), which
 *                 serves every role and not only admins — that is what lets a
 *                 son read his own standing instead of falling back to the list
 *
 * Why it lives here and not in the shell: the shell is frozen (monolith-budget)
 * and, more to the point, this is the rule — it belongs beside the model it
 * composes, where a reader looking for "who governs?" will actually find it.
 */
export function governsHere({ signedIn = false, reviewerMode = false, allowlisted = false, role = null } = {}) {
  if (!signedIn || reviewerMode) return false;
  return standingInSpace({ allowlisted, role }).isGovernor;
}

/**
 * The same question across every space a person belongs to, which is how a
 * family actually works: witness at home, helper in the business.
 *
 * @param memberships [{ instanceId, name, role }]
 * Returns { spaces: [{...standing}], governs: [ids], helps: [ids],
 *           witnesses: [ids], anyGovernor }.
 */
export function standingAcrossSpaces(memberships = [], { allowlisted = false } = {}) {
  const spaces = (memberships || [])
    .filter((m) => m && m.instanceId)
    .map((m) => ({
      instanceId: m.instanceId,
      name: m.name || '',
      role: m.role || null,
      ...standingInSpace({ allowlisted, role: m.role }),
    }));
  const idsAt = (s) => spaces.filter((x) => x.standing === s).map((x) => x.instanceId);
  return {
    spaces,
    governs: idsAt(STANDING.GOVERNOR),
    helps: idsAt(STANDING.HELPER),
    witnesses: idsAt(STANDING.WITNESS),
    anyGovernor: spaces.some((x) => x.isGovernor),
  };
}

/**
 * One plain sentence for the reader, in the Governor's own frame — learning by
 * witnessing, helping, governing. Never "access denied"; it says what the
 * person DOES hold and, when the books are walled, why.
 */
export function standingSentence(view, spaceName = 'this space') {
  if (!view || !view.isMember) return `You are not in ${spaceName} yet.`;
  if (view.isGovernor) return `You govern ${spaceName}.`;
  if (view.standing === STANDING.HELPER) {
    return view.canSeeBooks
      ? `You help in ${spaceName} — you can see the work and do it.`
      : `You help in ${spaceName} — you can do the work; the books stay with the stewards.`;
  }
  return view.canSeeBooks
    ? `You are witnessing ${spaceName} — you can see how it runs; changes stay with the stewards.`
    : `You are witnessing ${spaceName} — you can see the work; the money stays with the stewards.`;
}
