// =============================================================================
// development-team — the team a ground-up build needs, and who is still missing
// =============================================================================
// Darrell, 2026-10-21, with a photograph of a slide titled "Your Team" and a
// link (https://youtu.be/6GVmsB3PLmY):
//
//   "Research and add features and functionality for users to formulation of
//    their teams... make sense? Inside the Poe Properties Apps for building
//    from nothing... make sense?"
//
// WHAT WAS ALREADY HERE, measured before a line of this. Poe Properties knows
// two kinds of people and neither is this one:
//   · `people.js` — the invites on a DOOR: tenant, household, worker, manager.
//     Everyone it knows is attached to a unit that already exists.
//   · `dispatch-roster.js` — the workers a maintenance REQUEST can be sent to.
//     Everyone it knows is fixing something already built.
// Nothing in the module knows a surveyor, an architect or a lender, because
// nothing in it has ever been about building from nothing.
//
// -----------------------------------------------------------------------------
// WHERE THIS LIST COMES FROM, AND WHAT IS HIS SOURCE'S AND WHAT IS MINE
// -----------------------------------------------------------------------------
// The sixteen roles, their order, their wording, the three "(commercial)" marks
// and the note on Property Manager are READ FROM HIS SLIDE, verbatim. That is
// the spec and it is not paraphrased.
//
// The slide also sets nine of the sixteen in BOLD. That emphasis is the
// source's; what it MEANS is not stated anywhere on the slide, so it is carried
// as data (`emphasis`) and never as a claim. A surface may say "the slide
// emphasises these nine" — which is true — and must not say "these nine are
// required", which the slide does not say.
//
// The ORDER is likewise the slide's, and reading a sequence into it is MY
// inference, marked as such on `SEQUENCE_READING`: survey and soil before a
// design, a design before a price, a price before a lender. It is a plausible
// reading of a numbered list for ground-up work and it is NOT the slide's
// assertion. The video's own words are being fetched on our own road
// (source-transcript.yml, dispatched 2026-10-21 for the link he sent) and will
// either confirm it or correct it; until then the app shows his order and does
// not present my reading as his.

/**
 * YOUR TEAM, from the slide. `n` is its number on the slide, `role` its wording,
 * `emphasis` whether the slide set it bold, `commercial` whether the slide
 * marked it "(commercial)", and `note` any words the slide added to it.
 */
export const DEV_TEAM_ROLES = Object.freeze([
  Object.freeze({ n: 1, role: 'Surveyor', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 2, role: 'Soil Engineer', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 3, role: 'Attorney / Title Company', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 4, role: 'Securities Attorney', emphasis: 'plain', commercial: false, note: '' }),
  Object.freeze({ n: 5, role: 'Architect', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 6, role: 'Zoning Consultant / Land Use Attorney', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 7, role: 'GC', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 8, role: 'Insurance Agent / Broker', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 9, role: 'Civil Engineer', emphasis: 'plain', commercial: true, note: '' }),
  Object.freeze({ n: 10, role: 'MEP Engineer', emphasis: 'plain', commercial: true, note: '' }),
  Object.freeze({ n: 11, role: 'Structural Engineer', emphasis: 'plain', commercial: true, note: '' }),
  Object.freeze({ n: 12, role: 'Interior Designer', emphasis: 'plain', commercial: false, note: '' }),
  Object.freeze({ n: 13, role: 'Suppliers / Subs', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 14, role: 'Lenders', emphasis: 'bold', commercial: false, note: '' }),
  Object.freeze({ n: 15, role: 'Bookkeeper', emphasis: 'plain', commercial: false, note: '' }),
  // The one role the slide says something extra about, kept in its own words.
  Object.freeze({ n: 16, role: 'Property Manager', emphasis: 'plain', commercial: false, note: 'should be a part of the dev process' }),
]);

/**
 * MY reading of the numbering, carried separately from his list so the two are
 * never confused. A surface that shows this says whose reading it is.
 */
export const SEQUENCE_READING = Object.freeze({
  whose: 'read from the numbering by PoeTech, not stated on the slide',
  words: 'Survey and soil before a design; a design before a price; a price before a lender. The slide numbers them, and for ground-up work that order is how the costs become knowable.',
});

/** A stable key for a role, for storing who fills it. */
export function roleKey(role) {
  return String(role || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * The roles a build of this kind calls for. The three the slide marks
 * "(commercial)" are left out of a residential build, because the slide itself
 * says they are commercial — that is its own word and not an inference.
 * Everything else is offered on every build.
 */
export function rolesFor({ commercial = true } = {}) {
  return DEV_TEAM_ROLES.filter((r) => (commercial ? true : !r.commercial));
}

/**
 * WHO YOU HAVE AND WHO YOU STILL NEED. `filled` maps a role key to whoever
 * fills it ({name, phone, email, note} or just a name). A role with nobody is a
 * GAP and is named; a role filled is carried with its person.
 *
 * Nothing is invented: a build with an empty record reads as sixteen gaps, which
 * is the true answer for someone starting from nothing, and is the whole point.
 */
export function teamState({ commercial = true, filled = {} } = {}) {
  const roles = rolesFor({ commercial });
  const have = [];
  const need = [];
  for (const r of roles) {
    const who = filled[roleKey(r.role)];
    const named = who && (typeof who === 'string' ? who.trim() : String(who.name || '').trim());
    if (named) have.push({ ...r, who: typeof who === 'string' ? { name: who.trim() } : who });
    else need.push(r);
  }
  return {
    roles,
    have,
    need,
    total: roles.length,
    // The slide's own emphasis, counted — never called "required".
    emphasised: roles.filter((r) => r.emphasis === 'bold').length,
    emphasisedNeeded: need.filter((r) => r.emphasis === 'bold').length,
  };
}

/**
 * The next role to go and find, by the slide's own numbering — the lowest
 * number nobody fills. Null when the team is whole, which is a real answer and
 * not a blank.
 */
export function nextToFind(state) {
  const need = (state && state.need) || [];
  if (!need.length) return null;
  return need.reduce((lowest, r) => (r.n < lowest.n ? r : lowest), need[0]);
}

/**
 * What the team panel SAYS, in plain words, measured from the state rather than
 * painted. A build with nobody on it says so; a whole team says so; and the
 * count in between is the count, never a percentage of a thing nobody set.
 */
export function teamWords(state) {
  const s = state || {};
  const total = Number(s.total) || 0;
  const haveN = (s.have || []).length;
  if (!total) return 'No roles for this kind of build yet.';
  if (haveN === 0) return `Nobody on the team yet — ${total} roles to fill. Start from the top: the slide numbers them, and the first is the one to find first.`;
  if (haveN === total) return `All ${total} roles filled. Keep the bookkeeper and the property manager in the process, not at the end of it.`;
  const next = nextToFind(s);
  return `${haveN} of ${total} filled · ${total - haveN} to go${next ? ` · next by the numbering: ${next.role}` : ''}.`;
}
