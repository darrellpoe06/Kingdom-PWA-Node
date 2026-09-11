// =============================================================================
// idle-lock — lock the app after idle, and NEVER interrupt someone who is
// watching a sermon or reading a lesson.
// =============================================================================
// Declared by Darrell 2026-09-11:
//
//   "add a timer so it logs the person out after so long of not doing work
//    inside the app however on media tabs and modules make sure they are able
//    to watch sermons and read lessons without the app doing anything... also
//    maybe just lock it so they have to log in after 5 minutes or so and never
//    when on media tabs and others that don't matter."
//
// Two requirements, and the SECOND one is the hard one. A plain idle timer is
// trivial; a plain idle timer is also what throws a sign-in box over the middle
// of a sermon, because a person watching a 40-minute message touches nothing for
// 40 minutes. Reading and watching ARE using the app. The timer must know that.
//
// FOUR RULES, in order:
//
//   0. IT ONLY APPLIES TO STAFF. Darrell, asked whether this should cover
//      everyone or staff only: "staff only". A congregant is NEVER locked —
//      not on a lesson, not on the bus schedule, not anywhere. The lock exists
//      because a staff member's screen carries other people's information (the
//      member roll, giving records, a packet of someone's answers) and gets left
//      on a desk in a church office. A member's own screen carries their own
//      life, and putting a PIN box in front of a grandmother reading Scripture
//      buys nothing and costs the whole app.
//
//   1. ON A RESTFUL SURFACE THE CLOCK DOES NOT RUN AT ALL. Not paused-and-
//      resumed — reset. Someone who reads Scripture for an hour and then opens
//      the Bus schedule gets a full, fresh window, because they were never idle.
//   2. UNSAVED WORK IS NEVER THROWN AWAY. A half-typed ride request, a giving
//      record mid-entry, an unsent feedback note — the lock DEFERS while input
//      is pending. Locking someone out of their own half-finished sentence is a
//      worse outcome than the risk the lock exists to reduce.
//   3. OTHERWISE, lock after the window. LOCK, not sign out — the person
//      re-enters their PIN and lands exactly where they were. Signing people out
//      is what produced the lockout incident this app already has a whole
//      recovery path for (lib/pin-reset-intent.js); we are not repeating it.
//
// NO-LOCKOUT, inherited from private-lock.js: this is a privacy convenience over
// a session, never the security boundary — RLS is. If the lock cannot be
// satisfied (no PIN set, PIN backend unreachable), the gate opens rather than
// stranding an authenticated member outside their own church's app.
//
// Pure + deterministic (no timers, no React, no clock of its own — `now` is
// passed in) so every rule above is unit-tested (DR-0076).
// =============================================================================

// Five minutes, as declared. Exported so a surface or an instance can widen it;
// nothing in here reads a clock, so a caller decides the cadence.
export const DEFAULT_IDLE_MS = 5 * 60 * 1000;

// RESTFUL SURFACES — where the app does nothing to you.
//
// The test is NOT "is this page unimportant" but "is sitting still here the
// normal way to use it". Watching, reading, listening and being taught all look
// exactly like idleness to a timer, and all four are the church's actual work.
// Every id below is a real surface id from surfaces.js — pinned by a test, so a
// renamed tab cannot silently start locking people mid-sermon.
export const RESTFUL_TOP_VIEWS = [
  'library',   // books + the in-app reader
  'voice',     // listen to anything
  'games',     // the family games hub
  'tvtime',    // the show tracker, watched together
  'about',     // read-only
];
export const RESTFUL_CHURCH_SUBS = [
  'home',                // the church door — carries the live worship player
  'pulpit',              // The Word — Migdal: sermons, watched end to end
  'scripture',           // the Scripture library
  'learn',               // the lessons
  'eternal-algorithms',  // the studies
  'program',             // the order of service, followed along
  'videowall',           // the wall
];

// isRestfulSurface — is the person READING or WATCHING right now?
// `presenting` covers the big full-screen reader (<Presenter>): wherever it was
// opened from, it is a person being read to, and it outranks everything else.
export function isRestfulSurface({ view, churchView, presenting } = {}) {
  if (presenting) return true;
  if (view === 'church') return RESTFUL_CHURCH_SUBS.includes(churchView);
  return RESTFUL_TOP_VIEWS.includes(view);
}

// idleDecision — should the app lock right now, and why.
// Returns { lock, reason, msRemaining } — `reason` is for the surface to SAY
// what happened, never a silent lock.
export function idleDecision({
  now,
  lastActivityAt,
  view,
  churchView,
  presenting = false,
  hasUnsavedInput = false,
  signedIn = true,
  canLock = true,
  isStaff = false,
  idleMs = DEFAULT_IDLE_MS,
} = {}) {
  const never = (reason) => ({ lock: false, reason, msRemaining: idleMs });

  // Nothing to lock, or no way to unlock it again.
  if (!signedIn) return never('signed-out');
  // Rule 0 — STAFF ONLY (Darrell 2026-09-11: "staff only..."). Default false, so
  // a caller that forgets to say who this is locks NOBODY. The failure direction
  // matters: a missed lock is a risk, a wrongly-locked congregant is a person
  // shut out of their own church's app.
  if (!isStaff) return never('not-staff');
  if (!canLock) return never('no-lock-available'); // no PIN / backend down — no-lockout

  // Rule 1 — reading and watching are USING the app.
  if (isRestfulSurface({ view, churchView, presenting })) return never('restful-surface');

  // Rule 2 — never take away what someone is in the middle of typing.
  if (hasUnsavedInput) return never('unsaved-input');

  const idleFor = Number(now) - Number(lastActivityAt);
  if (!Number.isFinite(idleFor)) return never('unknown-activity');
  const msRemaining = Math.max(0, idleMs - idleFor);
  if (idleFor < idleMs) return { lock: false, reason: 'active', msRemaining };
  return { lock: true, reason: 'idle', msRemaining: 0 };
}

// The sentence the person reads when it happens. Named here so it says the same
// thing everywhere, and so it is plainly a LOCK and not a sign-out.
export const IDLE_LOCK_NOTICE =
  'Locked after a few quiet minutes, because this screen carries other people\u2019s information. Enter your PIN to pick up exactly where you were — you have not been signed out, and nothing was lost.';
